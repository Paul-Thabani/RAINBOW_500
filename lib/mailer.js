import { Resend } from "resend";
import { buyerReceipt, conflictAlert } from "./emails";

// Transactional email. The bodies live in lib/emails.js; this file is only the
// transport and the configuration guard.
//
// Requires RESEND_API_KEY and RESEND_FROM in .env.local. RESEND_FROM must be an
// address on a domain verified in the Resend dashboard. hbufc.co.za sits at
// DMARC p=reject, so until those records are live an unauthenticated send is
// refused outright rather than landing in spam.
//
// There is deliberately no fallback to Resend's shared onboarding@resend.dev
// address. It works, which is exactly the problem: a missing RESEND_FROM in
// production would quietly start mailing buyers from a resend.dev address
// instead of from the club, and nothing would look broken. Misconfiguration
// should be loud and should send nothing.
//
// Never import this from a Client Component.

let resend;

function getClient() {
  if (resend) return resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resend = new Resend(apiKey);
  return resend;
}

// MAIL_REPLY_TO and ADMIN_ALERT_EMAIL both take a comma-separated list, so the
// club can add people without a code change. A single address is just a list of
// one. Resend accepts string or string[] for both `to` and `replyTo`.
//
// Blank entries and stray whitespace are dropped rather than passed on, since
// "sam@hbufc.co.za, " is what a list looks like halfway through being edited
// and an empty recipient makes Resend reject the whole message.
function addressList(value) {
  return String(value || "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

// Buyer addresses are PII. The admin dashboard shows them to a logged-in
// operator, but pm2 logs are a different audience, so anything that reaches a
// log line goes through here first.
function maskAddress(address) {
  if (Array.isArray(address)) {
    return address.length ? address.map(maskAddress).join(", ") : "(no recipient)";
  }
  const value = String(address || "");
  const at = value.indexOf("@");
  if (at < 1) return "(invalid address)";
  return `${value[0]}***${value.slice(at)}`;
}

// Nothing exported from this module throws.
//
// Its only caller is the Netcash notify route, where an exception would turn a
// settled payment into a 500 and invite a retry of an order that is already
// paid and confirmed. A send that fails is a loud log line and nothing more.
async function send({ to, subject, html, text, replyTo }) {
  const client = getClient();
  const from = process.env.RESEND_FROM;

  if (!client) {
    console.warn("mailer: RESEND_API_KEY unset, not sending", JSON.stringify(subject), "to", maskAddress(to));
    return { sent: false, reason: "no-api-key" };
  }
  if (!from) {
    console.error(
      "mailer: RESEND_API_KEY is set but RESEND_FROM is not, refusing to send",
      JSON.stringify(subject),
      "- set RESEND_FROM to a verified address on hbufc.co.za"
    );
    return { sent: false, reason: "no-from-address" };
  }
  const recipients = addressList(Array.isArray(to) ? to.join(",") : to);
  if (!recipients.length) {
    console.error("mailer: no recipient for", JSON.stringify(subject));
    return { sent: false, reason: "no-recipient" };
  }

  try {
    const payload = { from, to: recipients, subject, html, text };
    if (replyTo?.length) payload.replyTo = replyTo;
    const { data, error } = await client.emails.send(payload);
    if (error) {
      console.error(
        "mailer: Resend rejected",
        JSON.stringify(subject),
        "to",
        maskAddress(recipients),
        "-",
        error.message || JSON.stringify(error)
      );
      return { sent: false, reason: "rejected" };
    }
    console.log("mailer: sent", JSON.stringify(subject), "to", maskAddress(recipients), "id", data?.id || "?");
    return { sent: true, id: data?.id };
  } catch (e) {
    console.error("mailer: couldn't send", JSON.stringify(subject), "to", maskAddress(recipients), "-", e.message);
    return { sent: false, reason: "exception" };
  }
}

export async function sendPaymentConfirmation({ to, reference, amount, squares }) {
  // RESEND_FROM is a no-reply address, so the receipt only invites a reply when
  // MAIL_REPLY_TO gives that reply somewhere real to land. An address equal to
  // the From address is not somewhere real: it would send a buyer's question
  // about a payment straight back into the no-reply mailbox.
  const from = (process.env.RESEND_FROM || "").trim().toLowerCase();
  const replyTo = addressList(process.env.MAIL_REPLY_TO).filter(
    (address) => address.toLowerCase() !== from
  );
  return send({
    to,
    replyTo,
    ...buyerReceipt({ squares, amount, reference, canReply: replyTo.length > 0 }),
  });
}

export async function sendConflictAlert({ reference, amount, buyerEmail, squares, cause }) {
  const to = addressList(process.env.ADMIN_ALERT_EMAIL);
  if (!to.length) {
    console.warn("mailer: ADMIN_ALERT_EMAIL unset, no one is being told about conflict", reference);
    return { sent: false, reason: "no-admin-address" };
  }
  return send({ to, ...conflictAlert({ reference, amount, buyerEmail, squares, cause }) });
}

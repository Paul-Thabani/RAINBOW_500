// Server-only. Transactional email through Resend's HTTP API.
//
// HTTP rather than SMTP on purpose. Resend's REST endpoint needs no client
// library, so the dependency list stays at next/pg/react/react-dom and Node
// 22's global fetch is the entire transport. Going through Google Workspace's
// relay instead would have meant pulling in nodemailer.
//
// Never import this from a Client Component.

const ENDPOINT = "https://api.resend.com/emails";

// The notify route does not await sends (see the comment there), so this
// timeout only stops a hung request from holding a socket open forever. Resend
// normally answers in a few hundred milliseconds.
const TIMEOUT_MS = 8000;

// Buyer addresses are PII. The admin dashboard shows them to a logged-in
// operator, but pm2 logs are a different audience and get read over shoulders,
// so anything that reaches a log line goes through here first.
function maskAddress(address) {
  const at = String(address || "").indexOf("@");
  if (at < 1) return "(invalid address)";
  return `${String(address)[0]}***${String(address).slice(at)}`;
}

// Nothing in this module throws. Its only caller is the Netcash notify route,
// where an exception would turn a settled payment into a 500 and invite a
// retry of an order that has already been paid and confirmed. A receipt that
// fails to send is worth a loud log line and nothing more.
export async function sendMail({ to, subject, html, text, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const fromName = process.env.MAIL_FROM_NAME || "Hout Bay United FC";

  if (!apiKey || !from) {
    // Not an error. It is how the app behaves before the Resend key is issued,
    // and how a developer's local copy behaves permanently.
    console.warn(
      "mailer: RESEND_API_KEY or MAIL_FROM is unset, not sending",
      JSON.stringify(subject),
      "to",
      maskAddress(to)
    );
    return { sent: false, reason: "not-configured" };
  }

  const payload = {
    from: `${fromName} <${from}>`,
    to: [to],
    subject,
    html,
    text,
  };
  if (replyTo) payload.reply_to = replyTo;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      // Resend returns a JSON body describing the failure. Read it as text so a
      // non-JSON error page (a gateway 502, say) is still logged usefully.
      const detail = await res.text().catch(() => "");
      console.error(
        "mailer: Resend rejected",
        JSON.stringify(subject),
        "to",
        maskAddress(to),
        "-",
        res.status,
        detail.slice(0, 400)
      );
      return { sent: false, reason: `http-${res.status}` };
    }

    const body = await res.json().catch(() => ({}));
    console.log("mailer: sent", JSON.stringify(subject), "to", maskAddress(to), "id", body.id || "?");
    return { sent: true, id: body.id };
  } catch (e) {
    // AbortError from the timeout, DNS failure, TLS failure, anything.
    console.error(
      "mailer: couldn't send",
      JSON.stringify(subject),
      "to",
      maskAddress(to),
      "-",
      e.name === "TimeoutError" ? `timed out after ${TIMEOUT_MS}ms` : e.message
    );
    return { sent: false, reason: "exception" };
  }
}

// The email bodies, kept apart from lib/mailer.js so the transport and the copy
// can change independently, and so these stay pure functions that can be
// rendered and eyeballed without sending anything.
//
// Both templates ship an HTML and a plain-text part. The text part is not
// decoration: a message with no text alternative is a small but real negative
// signal to spam filters, and hbufc.co.za sits at DMARC p=reject, where there
// is no margin to give away.

import { RAINBOW_STOPS } from "./brand";

function rands(amount) {
  const n = Number(amount) || 0;
  const [whole, frac] = n.toFixed(2).split(".");
  return `R${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plural(n, one, many) {
  return n === 1 ? one : many;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://shirt.hbufc.co.za";
}

// The crest rainbow as a table row rather than a CSS gradient, because Outlook
// renders neither linear-gradient nor background-clip.
const rainbowBar = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
      <tr>${RAINBOW_STOPS.map(
        (c) => `<td height="6" bgcolor="${c}" style="height:6px;line-height:6px;font-size:0">&nbsp;</td>`
      ).join("")}</tr>
    </table>`;

function shell({ preheader, body }) {
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5f7;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Helvetica,Arial,sans-serif">
      <tr><td>${rainbowBar}</td></tr>
      <tr><td style="padding:32px 32px 36px;color:#15161a;font-size:15px;line-height:1.6">
        ${body}
      </td></tr>
      <tr><td style="padding:0 32px 28px;color:#8b8b93;font-size:12px;line-height:1.5;font-family:Helvetica,Arial,sans-serif">
        Hout Bay United FC. The Goal is Love.
      </td></tr>
    </table>
  </td></tr>
</table>`;
}

function detailRows(pairs) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;border-collapse:collapse;width:100%">
    ${pairs
      .map(
        ([label, value]) => `<tr>
      <td style="padding:7px 0;color:#8b8b93;font-size:13px;width:150px">${escapeHtml(label)}</td>
      <td style="padding:7px 0;color:#15161a;font-size:14px;font-weight:700">${escapeHtml(value)}</td>
    </tr>`
      )
      .join("")}
  </table>`;
}

// Sent once, when a Netcash notify confirms payment and the settle actually
// changed rows. See the notify route for why that is the right hook.
// `canReply` is true only when MAIL_REPLY_TO is configured. RESEND_FROM is a
// no-reply address, so inviting a reply without somewhere for it to land would
// send buyers' questions about a R2,000 payment straight into a black hole.
export function buyerReceipt({ squares, amount, reference, canReply }) {
  const url = siteUrl();
  const noun = plural(squares, "square", "squares");
  const verb = plural(squares, "is", "are");
  const collectUrl = `${url}/collect?ref=${encodeURIComponent(reference)}`;

  // What a supporter would actually send a friend, pre-filled. WhatsApp because
  // this is a Cape Town community club and that is where its people are.
  const shareText = `I've just claimed my ${noun} on the Hout Bay United Legacy 500 shirt. 500 squares, R2,000 each, and the whole R1,000,000 goes into helping the club every year. Claim yours: ${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const subject = `Your ${squares} ${noun} on the shirt ${verb} confirmed`;

  const html = shell({
    preheader: `Payment confirmed. Your ${noun} ${verb} now part of the Legacy 500 kit.`,
    body: `
        <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;font-weight:800;color:#15161a">You are on the shirt.</h1>
        <p style="margin:0 0 4px">Your payment has gone through, and your ${escapeHtml(noun)} ${escapeHtml(
          verb
        )} now a permanent part of the Legacy 500 kit.</p>
        ${detailRows([
          [plural(squares, "Square", "Squares"), String(squares)],
          ["Amount paid", rands(amount)],
          ["Reference", reference],
        ])}
        <p style="margin:0 0 22px">Your artwork is live on the shirt right now. Go and find it.</p>
        <p style="margin:0 0 26px">
          <a href="${escapeHtml(url)}" style="display:inline-block;background:#15161a;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:700;font-size:15px">See it on the shirt</a>
        </p>

        <h2 style="margin:0 0 8px;font-size:17px;font-weight:800;color:#15161a">One quick thing</h2>
        <p style="margin:0 0 14px;color:#4a4b55">We have your name and shirt size already. We just need to know where you are, so we can get your shirt to you.</p>
        <p style="margin:0 0 22px">
          <a href="${escapeHtml(collectUrl)}" style="display:inline-block;background:#ffffff;color:#15161a;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;font-size:15px;border:2px solid #15161a">Add your details</a>
        </p>
        <p style="margin:0 0 26px;color:#4a4b55">Shirts are collected rather than posted. Once all 500 squares are sold we will print the kit and be in touch to arrange collection. If you are outside South Africa, say so on that page and we will post yours instead.</p>

        <h2 style="margin:0 0 8px;font-size:17px;font-weight:800;color:#15161a">Get your friends on it</h2>
        <p style="margin:0 0 14px;color:#4a4b55">Show them the square you made. Every one that sells takes the club closer to a million rand, and there are only 500 of them.</p>
        <p style="margin:0 0 26px">
          <a href="${escapeHtml(whatsappUrl)}" style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:700;font-size:15px">Share on WhatsApp</a>
        </p>
        <p style="margin:0${
          canReply ? " 0 14px" : ""
        };color:#4a4b55">Or send them this link: <a href="${escapeHtml(url)}" style="color:#15161a">${escapeHtml(url)}</a></p>${
          canReply
            ? `\n        <p style="margin:0;color:#4a4b55">Any questions, just reply to this email.</p>`
            : ""
        }`,
  });

  const text = `You are on the shirt.

Your payment has gone through, and your ${noun} ${verb} now a permanent part of the Legacy 500 kit.

${plural(squares, "Square", "Squares")}: ${squares}
Amount paid: ${rands(amount)}
Reference: ${reference}

Your artwork is live on the shirt right now. Go and find it:
${url}

ONE QUICK THING
We have your name and shirt size already. We just need to know where you are,
so we can get your shirt to you:
${collectUrl}

Shirts are collected rather than posted. Once all 500 squares are sold we will
print the kit and be in touch to arrange collection. If you are outside South
Africa, say so on that page and we will post yours instead.

GET YOUR FRIENDS ON IT
Show them the square you made. Every one that sells takes the club closer to a
million rand, and there are only 500 of them.

Share on WhatsApp:
${whatsappUrl}

Or send them this link:
${url}
${canReply ? "\nAny questions, just reply to this email.\n" : ""}
Hout Bay United FC. The Goal is Love.`;

  return { subject, html, text };
}

// Sent to the club, not the buyer. A conflict means Netcash took the money and
// the cells had already gone, so someone is owed a refund. Until now the only
// trace was a console.error that nobody was watching.
export function conflictAlert({ reference, amount, buyerEmail, squares, cause }) {
  const subject = `Action needed: paid order with no squares left (${reference})`;

  const detail = [
    ["Reference", reference],
    ["Amount taken", amount == null ? "unknown" : rands(amount)],
    ["Squares", squares == null ? "unknown" : String(squares)],
    ["Buyer", buyerEmail || "unknown"],
    ["Detected by", cause],
  ];

  const html = shell({
    preheader: `A buyer paid ${reference} but the squares were already gone. They need a refund.`,
    body: `
        <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;font-weight:800;color:#15161a">A paid order needs a refund</h1>
        <p style="margin:0 0 4px">Netcash accepted this payment, but by the time the callback ran the squares had already been claimed by someone else. The order is marked <strong>conflict</strong> and no artwork went onto the shirt.</p>
        ${detailRows(detail)}
        <p style="margin:0;color:#4a4b55">Refund the buyer through Netcash, then reply to them so they know what happened. Nothing in the app does this automatically.</p>`,
  });

  const text = `A paid order needs a refund.

Netcash accepted this payment, but by the time the callback ran the squares had already been claimed by someone else. The order is marked "conflict" and no artwork went onto the shirt.

${detail.map(([k, v]) => `${k}: ${v}`).join("\n")}

Refund the buyer through Netcash, then reply to them so they know what happened. Nothing in the app does this automatically.`;

  return { subject, html, text };
}

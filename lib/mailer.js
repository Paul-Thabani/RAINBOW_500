import { Resend } from "resend";

// Requires RESEND_API_KEY in .env.local (see .env.local.example). RESEND_FROM
// must be an address on a domain verified in the Resend dashboard - until
// that's done, Resend only accepts sending from onboarding@resend.dev.
let resend;

function getClient() {
  if (resend) return resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Resend isn't configured - set RESEND_API_KEY in .env.local");
  }
  resend = new Resend(apiKey);
  return resend;
}

export async function sendPaymentConfirmation({ to, reference, amount }) {
  const from = process.env.RESEND_FROM || "HBUFC Legacy 500 <onboarding@resend.dev>";
  const { error } = await getClient().emails.send({
    from,
    to,
    subject: "Payment received, thank you for supporting Legacy 500",
    text:
      `Your payment of R${amount} has been received.\n\n` +
      `Your square is confirmed and your design is now live on the shirt.\n\n` +
      `Reference: ${reference}\n\n` +
      `Thank you for supporting Hout Bay United FC.`,
    html:
      `<p>Your payment of <strong>R${amount}</strong> has been received.</p>` +
      `<p>Your square is confirmed and your design is now live on the shirt.</p>` +
      `<p style="color:#6b7280;font-size:13px">Reference: ${reference}</p>` +
      `<p>Thank you for supporting Hout Bay United FC.</p>`,
  });
  if (error) throw new Error(error.message || "Resend rejected the email");
}

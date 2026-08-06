import crypto from "crypto";

export const NETCASH_PROCESS_URL = "https://paynow.netcash.co.za/site/paynow.aspx";

// Netcash's m11 wants exactly 10 numeric characters in local SA form
// ("0812345678"), so whatever the buyer typed has to be reshaped into that or not
// sent at all.
//
// Omitting beats guessing here. A malformed optional field risks Netcash
// rejecting the whole transaction, and the only thing lost by omitting is that
// the buyer retypes their number on the payment page, which is exactly the
// situation before this existed. So anything that cannot be resolved to ten
// digits starting with a zero returns "" and the field is left off.
export function toNetcashMobile(raw) {
  let d = String(raw || "").replace(/[^0-9]/g, "");
  if (d.startsWith("00")) d = d.slice(2);        // 0027...
  if (d.length === 11 && d.startsWith("27")) d = "0" + d.slice(2);   // 27 81 234 5678
  if (d.length === 9 && !d.startsWith("0")) d = "0" + d;             // 81 234 5678
  return d.length === 10 && d.startsWith("0") ? d : "";
}

// m9 is capped at 100 characters. A truncated address is not a lesser version of
// an address, it is a wrong one that would bounce, so an over-long address is
// dropped rather than cut.
export function toNetcashEmail(raw) {
  const e = String(raw || "").trim();
  if (e.length > 100) return "";
  return /^\S+@\S+\.\S+$/.test(e) ? e : "";
}

// Netcash's Pay Now eCommerce form fields (per api.netcash.co.za docs).
// Unlike Payfast, Netcash documents no request signature - authentication is
// via the Service Key (m1) itself, which Netcash validates server-side.
export function buildPaymentFields({ reference, amount, description, extra1, email, mobile }) {
  const serviceKey = process.env.NETCASH_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("NETCASH_SERVICE_KEY isn't set - add it to .env.local (see .env.local.example)");
  }
  const vendorKey = process.env.NETCASH_VENDOR_KEY || "24ade73c-98cf-47b3-99be-cc7b867b3080";
  return {
    m1: serviceKey,
    m2: vendorKey,
    p2: reference, // <= 25 chars, unique per transaction
    p3: description, // <= 50 chars
    p4: amount, // "0.00" format, ZAR
    Budget: "Y",
    m4: extra1 || "",
    // Netcash appends m10 to the Accept and Decline URLs as their query string,
    // and only to those two. Both now point at the pay.hbufc.co.za relay, which
    // fronts a Pay Now service shared with Sonar, so this tag is how the relay
    // knows to send our buyer back here rather than to Sonar. Without it they
    // land on the wrong site after paying.
    //
    // It also gives /checkout-success the reference it has always read but never
    // received, so that page can finally identify the order.
    m10: `app=r5&ref=${reference}`,
    // The buyer has already given us both of these, so making them type them
    // again on the payment page is pure friction. Netcash prefills its form from
    // m9 and m11.
    //
    // Two things worth knowing. First, per the Pay Now docs m9 is "card holders
    // email address should you want an email sent to the cardholder", so passing
    // it means Netcash emails them as well as our own receipt; that is controlled
    // by "Notify my customers" in the Netcash account, not from here. Second,
    // Pay Now has no cardholder-name field at all, so the name cannot be
    // prefilled and the gateway will still ask for the name on the card.
    //
    // Both are only added when they survive normalisation, because an empty
    // optional field is safer than a malformed one.
    ...(toNetcashEmail(email) ? { m9: toNetcashEmail(email) } : {}),
    ...(toNetcashMobile(mobile) ? { m11: toNetcashMobile(mobile) } : {}),
  };
}

// Netcash Pay Now references (p2) are capped at 25 chars, so we can't use a
// full UUID for it - a random 20-char hex string is still unguessable
// (80 bits of randomness) and short enough.
export function generateReference() {
  return crypto.randomBytes(10).toString("hex");
}

// Whether a reference on an inbound callback is one we could have minted.
//
// The Netcash Pay Now service key is shared with the Sonar app, and
// pay.hbufc.co.za broadcasts every notify to both of them, because m10 only
// tags the Accept and Decline URLs and never the server-to-server callback. So
// this app is *expected* to be handed Sonar's references and has to shrug them
// off. That is working as designed, not a fault.
//
// Lives here rather than in the route so the shape cannot drift away from
// generateReference above: 10 random bytes as hex is exactly 20 lowercase hex
// characters. Sonar's are UUIDs, so nothing of theirs can pass this.
//
// It only ever chooses a log level. Both answers still acknowledge the
// callback, so a wrong guess here can never lose a payment.
export function isOurReference(reference) {
  return /^[0-9a-f]{20}$/.test(String(reference || ""));
}

// There is no documented signature/hash field or IP allowlist for Netcash's
// Notify callback, and no documented single-transaction "verify" API (unlike
// Payfast's /eng/query/validate). The practical mitigation, given that gap:
// the Reference is an unguessable random value known only to us and Netcash
// for this specific transaction, and we only ever accept the *first* notify
// that resolves a given (still-pending) reference, cross-checked against the
// amount we recorded when creating it. This is weaker than a signed
// callback - confirm with Netcash support whether an IP allowlist or signed
// callback actually exists before relying on this for real transactions.
export function parseNotifyFields(formData) {
  return {
    accepted: String(formData.get("TransactionAccepted") || "").toLowerCase() === "true",
    reason: formData.get("Reason") || "",
    reference: formData.get("Reference") || "",
    amount: Number(formData.get("Amount") || 0),
    extra1: formData.get("Extra1") || "",
    requestTrace: formData.get("RequestTrace") || "",
    method: formData.get("Method") || "",
    cardHolderIp: formData.get("CardHolderIpAddr") || "",
  };
}

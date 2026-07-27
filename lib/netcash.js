import crypto from "crypto";

export const NETCASH_PROCESS_URL = "https://paynow.netcash.co.za/site/paynow.aspx";

// Netcash's Pay Now eCommerce form fields (per api.netcash.co.za docs).
// Unlike Payfast, Netcash documents no request signature - authentication is
// via the Service Key (m1) itself, which Netcash validates server-side.
export function buildPaymentFields({ reference, amount, description, extra1 }) {
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
  };
}

// Netcash Pay Now references (p2) are capped at 25 chars, so we can't use a
// full UUID for it - a random 20-char hex string is still unguessable
// (80 bits of randomness) and short enough.
export function generateReference() {
  return crypto.randomBytes(10).toString("hex");
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

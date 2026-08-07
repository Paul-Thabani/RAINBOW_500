import crypto from "crypto";

// The token an admin hands over after placing a square by hand.
//
// Kept free of "use client" and of any React import, same rule as lib/zones.js,
// because the API routes and the admin form both need the formatting.

// No 0/O, no 1/I/L, no U (so nothing lands on an unfortunate word by accident).
// This gets read aloud down a phone line and copied off a scrap of paper, so the
// alphabet matters more than the length: a token nobody can dictate is a token
// that generates a support conversation.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const GROUPS = 3;
const GROUP_LEN = 4;

// 12 characters from a 30 character alphabet is about 59 bits. The thing it
// protects is the artwork on one already-paid square, and the damage a guess
// could do is putting the wrong picture on it, which a human sees on the board
// and can undo. That is a very different exposure from a payment reference, so
// this is sized to be dictatable rather than to resist an offline attack.
export function generateClaimToken() {
  const bytes = crypto.randomBytes(GROUPS * GROUP_LEN);
  let out = "";
  for (let i = 0; i < GROUPS * GROUP_LEN; i++) {
    if (i > 0 && i % GROUP_LEN === 0) out += "-";
    // Modulo bias over 256 % 30 is negligible at this size and this threat
    // model, and rejection sampling here would buy nothing worth the code.
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

// Accept what a human actually types: lower case, missing dashes, a pasted
// token with spaces around it. Refusing "abcd efgh jkmn" when we know exactly
// what it means is a self-inflicted support call.
export function normaliseClaimToken(raw) {
  const cleaned = String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== GROUPS * GROUP_LEN) return null;
  if ([...cleaned].some((c) => !ALPHABET.includes(c))) return null;
  return cleaned.match(new RegExp(`.{1,${GROUP_LEN}}`, "g")).join("-");
}

// Built from the configured site URL, never from the incoming request's origin.
//
// This app sits behind an Apache reverse proxy, so a request handler can see the
// internal origin rather than the public one, and a claim link pointing at
// 127.0.0.1:8273 would be pasted into WhatsApp and simply not work for anybody.
// Same convention as lib/emails.js and app/sitemap.js.
export function claimUrl(token) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://shirt.hbufc.co.za";
  return `${site.replace(/\/+$/, "")}/claim?t=${encodeURIComponent(token)}`;
}

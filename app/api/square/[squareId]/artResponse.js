import crypto from "crypto";

// Shared plumbing for the two per-square artwork endpoints. Not a route: only
// route.js is special inside app/, so an ordinary module can sit beside them.
//
// The whole point of these endpoints is that they are cacheable, which the
// polled /api/squares can never be. A square's artwork is written once at
// checkout and never updated, so the bytes behind a given id are immutable for
// the life of the campaign and can be cached as such. `immutable` is what stops
// the browser revalidating at all; the ETag is the fallback for anything that
// ignores it, and for the day someone reduces max-age.
const IMMUTABLE_YEAR = "public, max-age=31536000, immutable";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

export function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}

// These bytes came from the public internet, so they are served as inert as the
// headers allow: an explicit content type that was sniffed from the bytes
// rather than taken from the buyer's `data:` prefix, nosniff so the browser
// does not second-guess it, and a CSP that denies everything in case one is
// ever opened as a top level document.
export function artResponse(request, buffer, mime) {
  const etag = '"' + crypto.createHash("sha1").update(buffer).digest("base64url") + '"';
  const headers = {
    "Content-Type": mime,
    "Cache-Control": IMMUTABLE_YEAR,
    ETag: etag,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  };

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(buffer, {
    headers: { ...headers, "Content-Length": String(buffer.length) },
  });
}

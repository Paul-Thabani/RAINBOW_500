// Artwork helpers shared by the checkout route, the per-square art endpoints
// and scripts/backfill-thumbnails.mjs.
//
// Server only. This imports sharp, so never import it from a Client Component.
//
// Deliberately .mjs and not .js. package.json has no "type": "module", so plain
// node reads a .js file in this repo as CommonJS, and the backfill script has
// to import exactly the code the app uses rather than a second copy that can
// drift from it. Spell the extension out at every import site and both node and
// Next resolve the same file.
import sharp from "sharp";

// What the board actually needs. A claimed square renders at roughly 16 x 9 CSS
// pixels on a phone and 21 x 12 on desktop, so even a 2x2 block on a 3x screen
// tops out near 96 device pixels. The full-resolution original is left alone in
// `content`, because that is the file that gets printed on the shirt.
export const THUMB_PX = 96;
export const THUMB_MIME = "image/webp";

// Only these come back out of the per-square art endpoint. The type is decided
// by sniffing the bytes, never by the `data:` prefix the browser sent, because
// that prefix is attacker-controlled: a checkout POST could claim `text/html`
// and turn a public artwork URL into stored XSS on our own origin. SVG is left
// off the list for the same reason, since an SVG can carry script.
const SIGNATURES = [
  { mime: "image/png", test: (b) => b.length > 8 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a },
  { mime: "image/jpeg", test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/gif", test: (b) => b.length > 6 && b.toString("latin1", 0, 6).match(/^GIF8[79]a$/) !== null },
  {
    mime: "image/webp",
    test: (b) => b.length > 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP",
  },
];

export function sniffImageMime(buf) {
  if (!buf || !buf.length) return null;
  const hit = SIGNATURES.find((s) => s.test(buf));
  return hit ? hit.mime : null;
}

// Uploads only ever arrive as base64 data URLs (canvas.toDataURL, or the
// FileReader fallback in lib/useRainbow500.js), so anything else is treated as
// no artwork rather than guessed at.
export function decodeDataUrl(src) {
  if (typeof src !== "string") return null;
  const marker = ";base64,";
  if (!src.startsWith("data:")) return null;
  const at = src.indexOf(marker);
  if (at === -1) return null;
  const buf = Buffer.from(src.slice(at + marker.length), "base64");
  return buf.length ? buf : null;
}

// The parts of a content slot that are safe and cheap to put in the polled
// payload: everything except the base64 image itself. A text slot survives
// whole, which is what keeps messages rendering straight off the poll.
export function artMeta(content) {
  if (!content || typeof content !== "object") return null;
  const { src, ...rest } = content;
  return rest;
}

// Returns the board thumbnail as a Buffer, or null when there is no image to
// shrink. Never throws: a thumbnail that cannot be built must not take a real
// R2,000 checkout down with it. The square then renders as a plain claimed
// block and the original is still served from the art endpoint.
export async function makeThumb(content) {
  if (!content || content.type !== "image") return null;
  const buf = decodeDataUrl(content.src);
  if (!buf) return null;
  try {
    return await sharp(buf, { failOn: "none" })
      .resize(THUMB_PX, THUMB_PX, { fit: "inside", withoutEnlargement: true })
      // Alpha is not a detail here, it is the picture: ShirtPanel paints the
      // square by using this image as a CSS mask, so the transparent parts of
      // a logo are what shape it.
      .webp({ quality: 80, alphaQuality: 100, effort: 5 })
      .toBuffer();
  } catch (e) {
    console.error("makeThumb:", e.message);
    return null;
  }
}

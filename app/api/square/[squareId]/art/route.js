import { query } from "../../../../../lib/db";
import { decodeDataUrl, sniffImageMime } from "../../../../../lib/artwork.mjs";
import { artResponse, isUuid, notFound } from "../artResponse";

// One paid square's artwork at full resolution: the actual file that gets
// printed on the shirt, decoded out of the base64 in `content`.
//
// Nothing on the board uses this. The board renders from ../thumb, which is
// three orders of magnitude smaller. This is here so the full-resolution
// original is still reachable one square at a time, cacheably, now that it no
// longer rides along in every poll, and so print fulfilment has a URL per
// square rather than a database query.
//
// No privacy is given up by it. The old /api/squares handed the identical bytes
// to every visitor every 25 seconds; the only change is that you now have to
// ask for one square, and only a paid one answers.
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { squareId } = await params;
  if (!isUuid(squareId)) return notFound();

  try {
    // Same rule as the thumbnail endpoint, enforced here rather than borrowed:
    // artwork from a checkout nobody paid for is never served.
    const { rows } = await query(
      `select content->>'src' as src
         from squares
        where id = $1 and status = 'paid' and content->>'type' = 'image'`,
      [squareId]
    );
    const buffer = rows[0] ? decodeDataUrl(rows[0].src) : null;
    if (!buffer) return notFound();

    // The content type comes from the bytes, never from the `data:` prefix the
    // browser sent, because that prefix is buyer-controlled: a hand-rolled
    // checkout POST could claim text/html and turn this URL into stored XSS on
    // our own origin. Anything that is not a recognised raster image is simply
    // not served, which also keeps SVG (and the script it can carry) out.
    const mime = sniffImageMime(buffer);
    if (!mime) return notFound();

    return artResponse(request, buffer, mime);
  } catch (e) {
    console.error("GET /api/square/[squareId]/art:", e.message);
    return new Response("Couldn't load that artwork", { status: 500 });
  }
}

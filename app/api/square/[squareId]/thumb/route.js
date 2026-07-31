import { query } from "../../../../../lib/db";
import { THUMB_MIME } from "../../../../../lib/artwork.mjs";
import { artResponse, isUuid, notFound } from "../artResponse";

// The board's copy of one square's artwork: a ~96px WebP built at checkout by
// lib/artwork.mjs, single-digit KB, addressed by the square's row id.
//
// This is the endpoint that took the artwork out of the 25 second poll. It is
// immutable, because a square's content is written once at checkout and never
// updated, so a browser fetches a given square's thumbnail exactly once and
// then answers itself out of cache for the rest of the campaign.
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { squareId } = await params;
  // Checked before it reaches Postgres so a junk URL is a plain 404 rather than
  // an invalid-uuid error in the log.
  if (!isUuid(squareId)) return notFound();

  try {
    // The paid check is repeated here rather than leaned on from the
    // claimed_squares view. This endpoint is public and addressable directly,
    // so it enforces its own rule: artwork from a checkout nobody paid for is
    // never served.
    const { rows } = await query(
      `select content_thumb from squares where id = $1 and status = 'paid'`,
      [squareId]
    );
    const thumb = rows[0] && rows[0].content_thumb;
    // No row, no artwork, or a row that predates the backfill. The board draws
    // a plain claimed block in all three cases, so a 404 is the honest answer.
    if (!thumb || !thumb.length) return notFound();

    return artResponse(request, thumb, THUMB_MIME);
  } catch (e) {
    console.error("GET /api/square/[squareId]/thumb:", e.message);
    return new Response("Couldn't load that artwork", { status: 500 });
  }
}

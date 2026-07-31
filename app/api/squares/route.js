import { query } from "../../../lib/db";

// The shirt's read endpoint, polled by lib/useReservations.
//
// This exists because the browser cannot reach the database: Postgres listens
// on localhost only. Under the earlier Supabase setup the client queried a
// public view directly with an anon key, which is what made row level security
// necessary. Now the only way in is through here.
//
// It reads `claimed_squares`, which is deliberately narrow: no buyer email or
// phone, and no artwork at all until a row is paid, so artwork from a checkout
// nobody ever paid for is never published.
//
// This response carries no images. It used to inline every paid square's
// artwork as a base64 data URL, which is fine for one square and ruinous at
// scale: measured at 694,543 bytes for four squares, with a single artwork
// accounting for 669,994 of them. Nothing compresses it on the way out and
// there is no ETag, and the client re-polls every 25 seconds and on every
// window focus, so a full board of 500 squares would have been roughly 110MB
// per poll, per open tab.
//
// What goes out now is geometry plus `art`, which is the artwork's type, text
// and colour with the bytes taken out. Where `has_art` is true the board loads
// that square's thumbnail from /api/square/{id}/thumb, a URL the browser caches
// for a year, so an artwork crosses the wire once per visitor rather than every
// 25 seconds for as long as the tab is open.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await query(
      `select id, zone_id, col, "row", span, big, content_meta, has_art,
              fill, block_id, order_amount, status
         from claimed_squares`
    );
    // Renamed on the way out rather than in the view, because `content` is
    // still the right name in the database for the file that gets printed.
    // Out here it would be a lie: this is the artwork minus the artwork.
    return Response.json(
      {
        squares: rows.map((r) => ({
          id: r.id,
          zone_id: r.zone_id,
          col: r.col,
          row: r.row,
          span: r.span,
          big: r.big,
          art: r.content_meta,
          has_art: r.has_art,
          fill: r.fill,
          block_id: r.block_id,
          order_amount: r.order_amount,
          status: r.status,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    // Don't hand the database's error text to the browser.
    console.error("GET /api/squares:", e.message);
    return Response.json({ error: "Couldn't load the shirt" }, { status: 500 });
  }
}

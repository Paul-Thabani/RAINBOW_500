import { query } from "../../../lib/db";

// The shirt's read endpoint, polled by lib/useReservations.
//
// This exists because the browser cannot reach the database: Postgres listens
// on localhost only. Under the earlier Supabase setup the client queried a
// public view directly with an anon key, which is what made row level security
// necessary. Now the only way in is through here.
//
// It reads `claimed_squares`, which is deliberately narrow: no buyer email or
// phone, and `content` only once a row is paid, so artwork from a checkout
// nobody ever paid for is never published.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await query(
      `select zone_id, col, "row", span, big, content, fill, block_id, order_amount, status
         from claimed_squares`
    );
    return Response.json(
      { squares: rows },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    // Don't hand the database's error text to the browser.
    console.error("GET /api/squares:", e.message);
    return Response.json({ error: "Couldn't load the shirt" }, { status: 500 });
  }
}

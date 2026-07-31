"use server";

import { revalidatePath } from "next/cache";
import { query } from "../../lib/db";

// Cancelling an order from /admin.
//
// This is a Server Action rather than an API route on purpose. middleware.js
// matches "/admin/:path*" and nothing else, so a route under /api/admin would
// be reachable by anyone. A Server Action posts back to /admin, which the
// existing Basic Auth already covers, and Next's own Origin check on actions
// adds CSRF protection on top.
//
// What it does NOT do is move money. Netcash is the only thing that can refund
// a buyer, so a cancel here only ever changes what this app believes.

// Everything except an order that is already cancelled. Re-running the update
// on one of those would change nothing and only muddy the log.
const CANCELLABLE = ["pending", "expired", "failed", "conflict", "paid"];

export async function cancelOrder(prevState, formData) {
  const blockId = String(formData.get("blockId") || "").trim();
  if (!blockId) return { ok: false, message: "No order given" };

  try {
    // The status guard lives in the WHERE clause, not in JS, for the same
    // reason the notify route's settle() does: it makes the update atomic
    // against a Netcash callback landing on this order at the same moment.
    // Whichever statement runs second sees the other's result and declines,
    // so the two can never both win.
    const { rows } = await query(
      `update squares
          set status = 'cancelled'
        where block_id = $1
          and status = any($2::text[])
        returning m_payment_id, status`,
      [blockId, CANCELLABLE]
    );

    if (rows.length === 0) {
      // Either the id is wrong or it was already cancelled. Say which, because
      // "nothing happened" is the least useful thing a button can report.
      const { rows: existing } = await query(
        `select distinct status from squares where block_id = $1`,
        [blockId]
      );
      if (existing.length === 0) return { ok: false, message: "That order no longer exists" };
      return { ok: false, message: `Already ${existing.map((r) => r.status).join("/")}` };
    }

    console.log(
      `/admin: cancelled ${rows.length} cell(s) for order ${rows[0].m_payment_id}`
    );

    // The table is a Server Component read, so it needs telling. The public
    // shirt does not: lib/useReservations polls /api/squares every 25 seconds
    // and picks the released cells up on its own.
    revalidatePath("/admin");
    return { ok: true, message: `Cancelled, ${rows.length} cell(s) released` };
  } catch (e) {
    console.error("/admin cancelOrder:", e.message);
    return { ok: false, message: "Couldn't cancel, see the server log" };
  }
}

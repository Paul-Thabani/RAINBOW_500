import { redirect } from "next/navigation";
import { query } from "../../lib/db";

// Decline URL configured in the Netcash dashboard, reached via the
// pay.hbufc.co.za relay - see app/checkout-success/page.js for why this hop
// exists. The relay appends ?ref=<reference>, taken from the m10 field.
//
// Releasing the square here matters: without it a declined payment left its
// cells locked for the full 20 minute checkout window, so a buyer whose card
// was refused could not immediately try again on the same square, and nobody
// else could take it either.
//
// It sets `expired`, NOT `cancelled`, and that distinction is deliberate. This
// runs off a browser redirect, which anyone holding the reference could trigger,
// so it must not be able to terminalise an order. `expired` releases the cells
// while leaving the order resolvable, so if Netcash later reports that the
// payment actually succeeded, the notify handler can still confirm it. Netcash
// remains the only authority on whether money moved.
//
// The genuinely terminal path for a refused payment is the notify callback,
// which sets `failed` after cross-checking the amount.
export default async function CheckoutCancelled({ searchParams }) {
  const sp = await searchParams;
  const ref = typeof sp?.ref === "string" ? sp.ref.trim() : "";

  if (ref) {
    try {
      const { rowCount } = await query(
        `update squares
            set status = 'expired'
          where m_payment_id = $1
            and status = 'pending'`,
        [ref]
      );
      if (rowCount > 0) {
        console.log(`checkout cancelled: released ${rowCount} cell(s) for ${ref}`);
      }
    } catch (e) {
      // Never block the buyer's return on a database problem. The 20 minute
      // sweep will release the cells anyway; this only makes it immediate.
      console.error("checkout-cancelled:", e.message);
    }
  }

  redirect("/?checkout=cancelled");
}

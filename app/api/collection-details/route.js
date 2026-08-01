import { query } from "../../../lib/db";

// Saves the address a buyer gives on /collect, after they have already paid.
//
// Deliberately separate from checkout. Nothing here is needed to take the
// money, so asking for it before the card would be one more field between a
// willing buyer and a payment. A buyer who never comes back still owns their
// square; the club just has one less way to reach them at handover.
//
// The reference is the only credential, same as everywhere else in this
// integration: 20 hex characters generated server-side and known to the buyer,
// Netcash and us. The blast radius if one leaked is writing an address onto
// somebody's order, not reading anything out, so this endpoint never returns
// buyer details, only whether the write landed.

const MAX_ADDRESS = 600;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ref = typeof body?.ref === "string" ? body.ref.trim() : "";
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  const shipOverseas = body?.shipOverseas === true;

  if (!/^[a-f0-9]{20}$/i.test(ref)) {
    return Response.json({ error: "That order reference isn't valid" }, { status: 400 });
  }
  if (address.length < 8) {
    return Response.json({ error: "Please enter your address" }, { status: 400 });
  }
  if (address.length > MAX_ADDRESS) {
    return Response.json({ error: "That address is too long" }, { status: 400 });
  }

  try {
    // Scoped to paid orders. An address on an unpaid or cancelled order would
    // be misleading in the fulfilment list, and it stops the endpoint being
    // used to scribble on rows that no longer represent a sale.
    const { rowCount } = await query(
      `update squares
          set buyer_address = $2, ship_overseas = $3, details_completed_at = now()
        where m_payment_id = $1
          and status = 'paid'`,
      [ref, address, shipOverseas]
    );

    if (rowCount === 0) {
      // Either the reference is unknown, or the payment has not been confirmed
      // yet. The buyer cannot tell the difference and does not need to: both
      // mean try again shortly.
      return Response.json(
        { error: "We can't find a confirmed payment for that order yet. If you've just paid, give it a moment and try again." },
        { status: 404 }
      );
    }

    console.log(`collection details saved for ${ref} (${rowCount} cell(s))`);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/collection-details:", e.message);
    return Response.json({ error: "Couldn't save that, please try again" }, { status: 500 });
  }
}

import { query } from "../../../lib/db";
import { sendPaymentConfirmation } from "../../../lib/mailer";

// Send a paid order's receipt again.
//
//   curl -u user:pass -X POST https://shirt.hbufc.co.za/admin/resend-receipt \
//        -H 'Content-Type: application/json' -d '{"reference":"..."}'
//
// Written because the receipt copy changed after orders had already gone out:
// the old one promised to email buyers a size form and to post them a shirt,
// and neither is true any more. Useful any time a receipt needs to go again.
//
// Under /admin, so middleware's Basic Auth covers it. It has to be: this sends
// real email to a real buyer on request.
export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
  if (!/^[a-f0-9]{20}$/i.test(reference)) {
    return Response.json({ error: "Not a valid order reference" }, { status: 400 });
  }

  try {
    const { rows } = await query(
      `select m_payment_id, buyer_name, buyer_email, status,
              count(*)::int as squares, max(order_amount) as amount
         from squares
        where m_payment_id = $1
        group by m_payment_id, buyer_name, buyer_email, status`,
      [reference]
    );
    const o = rows[0];
    if (!o) return Response.json({ error: "No order with that reference" }, { status: 404 });

    // A receipt says a payment went through. Sending one for an order that did
    // not would be worse than sending nothing.
    if (o.status !== "paid") {
      return Response.json(
        { error: `That order is ${o.status}, not paid. Refusing to send a payment receipt.` },
        { status: 409 }
      );
    }
    if (!o.buyer_email) {
      return Response.json({ error: "That order has no email address" }, { status: 409 });
    }

    await sendPaymentConfirmation({
      to: o.buyer_email,
      reference: o.m_payment_id,
      amount: Number(o.amount) || 0,
      squares: o.squares,
    });

    console.log(`/admin/resend-receipt: re-sent ${reference} to ${o.buyer_email}`);
    return Response.json({ ok: true, sentTo: o.buyer_email, squares: o.squares });
  } catch (e) {
    console.error("/admin/resend-receipt:", e.message);
    return Response.json({ error: "Couldn't send it: " + e.message }, { status: 500 });
  }
}

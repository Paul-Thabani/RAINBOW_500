import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { parseNotifyFields } from "../../../../lib/netcash";
import { cellKey } from "../../../../lib/zones";

// Netcash calls this server-to-server once a Pay Now transaction resolves
// (this URL is configured in the Netcash dashboard: Account Profile ->
// NetConnector -> Pay Now -> Notify URL - it is NOT sent per-request).
//
// Netcash documents no request signature and no IP allowlist for this
// callback (unlike Payfast). The mitigation here: `reference` is an
// unguessable random value we generated, we only ever act on the *first*
// notify that resolves it, and we cross-check the amount matches what we
// recorded when creating the order.

// The statuses a notify is still allowed to resolve.
//
// `expired` is what the checkout route's lazy sweep sets on a pending row
// that outlived the checkout window. It has to stay resolvable: the buyer can
// pay after the sweep has already run, and refusing that notify would take
// their money without ever confirming their square. Everything else
// (paid/failed/cancelled/conflict) is terminal, so a duplicate or replayed
// notify can never flip a settled order.
const RESOLVABLE = ["pending", "expired"];

// Every physical cell a row covers. A "block of 4" bought as one big square
// is a single row with span 2 covering four cells, so spans have to be
// expanded before any occupancy comparison.
function cellsOf(row) {
  const span = row.span || 1;
  const out = [];
  for (let i = 0; i < span; i++) {
    for (let j = 0; j < span; j++) out.push(cellKey(row.zone_id, row.col + i, row.row + j));
  }
  return out;
}

export async function POST(request) {
  const formData = await request.formData();
  const fields = parseNotifyFields(formData);

  if (!fields.reference) return new Response("missing reference", { status: 400 });

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    console.error("Netcash notify:", e.message);
    return new Response("server not configured", { status: 500 });
  }

  const { data: rows, error: fetchErr } = await supabase
    .from("squares")
    .select("id,zone_id,col,row,span,order_amount,status")
    .eq("m_payment_id", fields.reference);
  if (fetchErr) return new Response(fetchErr.message, { status: 500 });
  if (!rows || rows.length === 0) {
    console.warn("Netcash notify: no squares found for reference", fields.reference);
    return new Response("OK", { status: 200 }); // acknowledge - nothing to do
  }

  if (!RESOLVABLE.includes(rows[0].status)) {
    return new Response("OK", { status: 200 });
  }

  const wasExpired = rows[0].status === "expired";

  const expected = Number(rows[0].order_amount);
  const amountOk = Math.abs(fields.amount - expected) < 0.01;

  if (!fields.accepted || !amountOk) {
    if (!amountOk) console.error("Netcash notify: amount mismatch for", fields.reference, fields.amount, "vs", expected);
    await supabase
      .from("squares")
      .update({ status: "failed" })
      .eq("m_payment_id", fields.reference)
      .in("status", RESOLVABLE);
    return new Response("OK", { status: 200 });
  }

  // Defensive check: make sure nothing else has taken these cells while this
  // order was in flight - flag for manual review instead of overwriting. This
  // matters more for a revived `expired` order, whose cells were free for
  // anyone else to claim in the meantime.
  const zoneIds = [...new Set(rows.map((r) => r.zone_id))];
  const { data: liveRows, error: liveErr } = await supabase
    .from("squares")
    .select("zone_id,col,row,span")
    .in("zone_id", zoneIds)
    .in("status", ["paid", "pending"])
    .neq("m_payment_id", fields.reference);
  if (liveErr) return new Response(liveErr.message, { status: 500 });

  const taken = new Set((liveRows || []).flatMap(cellsOf));
  const hasConflict = rows.flatMap(cellsOf).some((c) => taken.has(c));

  if (hasConflict) {
    console.error(
      "Netcash notify: cell conflict for",
      fields.reference,
      "- payment was accepted but the cells are taken, needs a manual refund"
    );
    await supabase
      .from("squares")
      .update({ status: "conflict" })
      .eq("m_payment_id", fields.reference)
      .in("status", RESOLVABLE);
    return new Response("OK", { status: 200 });
  }

  const { error: payErr } = await supabase
    .from("squares")
    .update({ status: "paid", paid_at: new Date().toISOString(), pf_payment_id: fields.requestTrace })
    .eq("m_payment_id", fields.reference)
    .in("status", RESOLVABLE);

  if (payErr) {
    // 23505 = the partial unique index refused the write, so another live
    // order holds one of these cells after all and the check above lost a
    // race. The money has been taken, so this needs a human and a refund.
    if (payErr.code === "23505") {
      console.error(
        "Netcash notify: unique index refused",
        fields.reference,
        "- payment was accepted but the cells are taken, needs a manual refund"
      );
      await supabase
        .from("squares")
        .update({ status: "conflict" })
        .eq("m_payment_id", fields.reference)
        .in("status", RESOLVABLE);
      return new Response("OK", { status: 200 });
    }
    // Anything else is transient as far as we know. Don't acknowledge: the
    // order stays resolvable, so a Netcash retry or a manual replay can
    // still confirm it rather than the payment being silently lost.
    console.error("Netcash notify: couldn't mark", fields.reference, "paid:", payErr.message);
    return new Response(payErr.message, { status: 500 });
  }

  if (wasExpired) {
    console.warn(
      "Netcash notify: revived expired order",
      fields.reference,
      "- buyer paid after the checkout window had passed, square confirmed"
    );
  }

  return new Response("OK", { status: 200 });
}

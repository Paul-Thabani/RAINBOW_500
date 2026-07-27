import { getSupabaseAdmin } from "../../../../lib/supabaseAdmin";
import { parseNotifyFields } from "../../../../lib/netcash";

// Netcash calls this server-to-server once a Pay Now transaction resolves
// (this URL is configured in the Netcash dashboard: Account Profile ->
// NetConnector -> Pay Now -> Notify URL - it is NOT sent per-request).
//
// Netcash documents no request signature and no IP allowlist for this
// callback (unlike Payfast). The mitigation here: `reference` is an
// unguessable random value we generated and stored as `pending`, we only
// ever act on the *first* notify that resolves a still-pending reference,
// and we cross-check the amount matches what we recorded when creating it.
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
    .select("id,zone_id,col,row,order_amount,status")
    .eq("m_payment_id", fields.reference);
  if (fetchErr) return new Response(fetchErr.message, { status: 500 });
  if (!rows || rows.length === 0) {
    console.warn("Netcash notify: no squares found for reference", fields.reference);
    return new Response("OK", { status: 200 }); // acknowledge - nothing to do
  }

  if (rows[0].status !== "pending") {
    // Already resolved (paid/failed/conflict) - only ever act on a notify
    // once, so a duplicate/replayed notify can't flip a settled order.
    return new Response("OK", { status: 200 });
  }

  const expected = Number(rows[0].order_amount);
  const amountOk = Math.abs(fields.amount - expected) < 0.01;

  if (!fields.accepted || !amountOk) {
    if (!amountOk) console.error("Netcash notify: amount mismatch for", fields.reference, fields.amount, "vs", expected);
    await supabase.from("squares").update({ status: "failed" }).eq("m_payment_id", fields.reference);
    return new Response("OK", { status: 200 });
  }

  // Defensive check: make sure none of these cells got paid by a different
  // order in the meantime - flag for manual review instead of overwriting.
  const conflictChecks = await Promise.all(
    rows.map((r) =>
      supabase
        .from("squares")
        .select("id")
        .eq("zone_id", r.zone_id)
        .eq("col", r.col)
        .eq("row", r.row)
        .eq("status", "paid")
        .neq("m_payment_id", fields.reference)
    )
  );
  const hasConflict = conflictChecks.some((c) => (c.data || []).length > 0);

  if (hasConflict) {
    console.error("Netcash notify: cell conflict for", fields.reference, "- needs manual review");
    await supabase.from("squares").update({ status: "conflict" }).eq("m_payment_id", fields.reference);
    return new Response("OK", { status: 200 });
  }

  await supabase
    .from("squares")
    .update({ status: "paid", paid_at: new Date().toISOString(), pf_payment_id: fields.requestTrace })
    .eq("m_payment_id", fields.reference);

  return new Response("OK", { status: 200 });
}

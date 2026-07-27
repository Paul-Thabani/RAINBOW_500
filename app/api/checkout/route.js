import crypto from "crypto";
import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";
import { buildPaymentFields, generateReference, NETCASH_PROCESS_URL } from "../../../lib/netcash";
import {
  getZone,
  validFoot,
  cellKey,
  pendingEntries,
  PRICE_PER_SPOT,
  BLOCK_PRICE,
} from "../../../lib/zones";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { zoneId, col, row, size, big, slots, email, phone } = body || {};
  const zone = getZone(zoneId);
  if (!zone || typeof col !== "number" || typeof row !== "number" || (size !== 1 && size !== 4)) {
    return Response.json({ error: "Invalid square selection" }, { status: 400 });
  }
  if (!Array.isArray(slots) || !slots.some(Boolean)) {
    return Response.json({ error: "Add a logo, message or doodle first" }, { status: 400 });
  }
  const buyerEmail = typeof email === "string" ? email.trim() : "";
  const buyerPhone = typeof phone === "string" ? phone.trim() : "";
  if (!/^\S+@\S+\.\S+$/.test(buyerEmail)) {
    return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (buyerPhone.replace(/[^0-9]/g, "").length < 7) {
    return Response.json({ error: "Enter a valid phone number" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  // Re-check availability server-side against confirmed (paid) squares only
  // - the client's view of "reserved" can be stale.
  const { data: paidRows, error: fetchErr } = await supabase
    .from("squares")
    .select("col,row,span")
    .eq("zone_id", zoneId)
    .eq("status", "paid");
  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 });

  const occ = new Set();
  (paidRows || []).forEach((r) => {
    const sp = r.span || 1;
    for (let i = 0; i < sp; i++)
      for (let j = 0; j < sp; j++) occ.add(cellKey(zoneId, r.col + i, r.row + j));
  });

  if (!validFoot(occ, zone, col, row, size)) {
    return Response.json({ error: "That spot's just been taken, try another" }, { status: 409 });
  }

  const blockId = crypto.randomUUID();
  const reference = generateReference(); // <= 25 chars, what Netcash calls back with
  // Logo/doodle images are stored as base64 data URLs directly in the row's
  // `content` column (they're small - a few hundred KB at most) rather than
  // a separate object-storage bucket, since Supabase's Postgres is already
  // the single source of truth here.
  const entries = pendingEntries({ zoneId, col, row, size, big, slots });

  const amount = size === 4 ? BLOCK_PRICE : PRICE_PER_SPOT;
  const rows = entries.map((e) => ({
    block_id: blockId,
    m_payment_id: reference,
    zone_id: zoneId,
    col: e.col,
    row: e.row,
    span: e.span,
    big: !!big,
    content: e.content,
    fill: e.fill,
    order_amount: amount,
    buyer_email: buyerEmail,
    buyer_phone: buyerPhone,
    status: "pending",
  }));

  const { error: insertErr } = await supabase.from("squares").insert(rows);
  if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 });

  let fields;
  try {
    fields = buildPaymentFields({
      reference,
      amount: amount.toFixed(2),
      description: `HBUFC Rainbow 500 - ${zoneId} ${size === 4 ? "block of 4" : "square"}`.slice(0, 50),
      extra1: blockId,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }

  return Response.json({ url: NETCASH_PROCESS_URL, fields });
}

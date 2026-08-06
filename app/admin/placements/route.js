import crypto from "crypto";
import { query } from "../../../lib/db";
import { artMeta, makeThumb } from "../../../lib/artwork.mjs";
import { generateReference } from "../../../lib/netcash";
import {
  getZone,
  validFoot,
  cellKey,
  countedZones,
  availableSpots,
  occSetFrom,
  SHIRT_SIZES,
  PRICE_PER_SPOT,
} from "../../../lib/zones";

// Place a square from /admin, for somebody who paid cash or is being given one.
//
// Goes straight to `paid`, because the money has already changed hands (or was
// never going to). There is no Netcash round trip to wait for, so there is no
// pending state to be in.
//
// It writes through the same table, the same unique index and the same
// availability check as a real checkout, so a placement cannot double-sell a
// square that somebody has already bought or is mid-checkout on. That is the
// whole reason this is a route rather than a hand-written SQL insert: the
// protections live in the code path, not in the schema alone.
//
// Under /admin, so middleware's Basic Auth covers it.
export const dynamic = "force-dynamic";

const MAX_CONTENT_LENGTH = 2_000_000;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const method = body?.method === "complimentary" ? "complimentary" : "cash";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const size = typeof body?.shirtSize === "string" ? body.shirtSize.trim().toUpperCase() : "";
  const placedBy = typeof body?.placedBy === "string" ? body.placedBy.trim().slice(0, 80) : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const image = typeof body?.image === "string" ? body.image : "";

  if (name.length < 2) return Response.json({ error: "Enter the buyer's name" }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (phone.replace(/[^0-9]/g, "").length < 7) {
    return Response.json({ error: "Enter a valid phone number" }, { status: 400 });
  }
  if (!SHIRT_SIZES.includes(size)) {
    return Response.json({ error: "Choose a shirt size" }, { status: 400 });
  }
  if (!message && !image) {
    return Response.json({ error: "Add a message or upload a logo for the square" }, { status: 400 });
  }
  if (image && image.length > MAX_CONTENT_LENGTH) {
    return Response.json({ error: "That image is too large" }, { status: 400 });
  }

  // Cash means the money arrived, so it belongs in the raised total at the real
  // price. Complimentary was given, so it must not inflate it.
  const amount = method === "cash" ? PRICE_PER_SPOT : 0;

  try {
    // Same sweep the checkout route runs, so a placement is not blocked by a
    // dead hold from twenty minutes ago.
    await query(
      `update squares set status = 'expired'
        where status = 'pending' and created_at < now() - interval '20 minutes'`
    );

    const { rows: live } = await query(
      `select zone_id, col, "row", span from squares where status in ('paid','pending')`
    );
    const reserved = {};
    live.forEach((r, i) => {
      reserved[`k${i}`] = { zoneId: r.zone_id, col: r.col, row: r.row, span: r.span };
    });
    const occ = occSetFrom(reserved);

    // Either the cell they asked for, or the next free one. "Anywhere" is the
    // common case at a match: somebody hands over cash and does not care which
    // square, and hunting for a free cell in a list of 500 is not a thing to do
    // on a phone at a touchline.
    let zoneId = typeof body?.zoneId === "string" ? body.zoneId : "";
    let col = Number.isInteger(body?.col) ? body.col : null;
    let row = Number.isInteger(body?.row) ? body.row : null;

    if (!zoneId || col === null || row === null) {
      const free = availableSpots(occ, 1);
      if (!free.length) {
        return Response.json({ error: "Every square is taken" }, { status: 409 });
      }
      ({ zoneId, col, row } = free[0]);
    }

    const zone = getZone(zoneId);
    if (!zone || !countedZones().some((z) => z.id === zoneId)) {
      return Response.json({ error: "That is not a claimable panel" }, { status: 400 });
    }
    if (!validFoot(occ, zone, col, row, 1)) {
      return Response.json({ error: "That square is already taken, try another" }, { status: 409 });
    }

    const content = image
      ? { type: "image", src: image, logo: true }
      : { type: "text", text: message };

    const reference = generateReference();
    const blockId = crypto.randomUUID();
    const thumb = await makeThumb(content);
    const meta = artMeta(content);

    await query(
      `insert into squares
         (block_id, m_payment_id, zone_id, col, "row", span, big,
          content, content_thumb, content_meta, fill, order_amount,
          buyer_name, buyer_email, buyer_phone, shirt_size,
          status, payment_method, placed_by, paid_at)
       values ($1,$2,$3,$4,$5,1,false,$6,$7,$8,$9,$10,$11,$12,$13,$14,'paid',$15,$16,now())`,
      [
        blockId,
        reference,
        zoneId,
        col,
        row,
        content,
        thumb,
        meta,
        "hsl(200 72% 50%)",
        amount,
        name,
        email,
        phone,
        size,
        method,
        placedBy || null,
      ]
    );

    console.log(
      `/admin/placements: ${method} square for ${name} at ${zoneId} (${col},${row}), ref ${reference}, R${amount}`
    );
    return Response.json({ ok: true, reference, zoneId, col, row, amount, method });
  } catch (e) {
    // 23505 means the unique index refused it: somebody claimed that exact cell
    // between the check and the insert.
    if (e.code === "23505") {
      return Response.json({ error: "That square was taken a moment ago, try again" }, { status: 409 });
    }
    console.error("/admin/placements:", e.message);
    return Response.json({ error: "Couldn't place that: " + e.message }, { status: 500 });
  }
}

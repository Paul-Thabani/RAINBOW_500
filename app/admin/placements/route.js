import crypto from "crypto";
import { query } from "../../../lib/db";
import { generateReference } from "../../../lib/netcash";
import { generateClaimToken, claimUrl } from "../../../lib/claimToken";
import {
  getZone,
  validFoot,
  cellKey,
  countedZones,
  availableSpots,
  occSetFrom,
  spotColor,
  PRICE_PER_SPOT,
  BLOCK_PRICE,
} from "../../../lib/zones";

// Place a square, or a block of four, from /admin.
//
// For the sales that do not go through the public checkout: cash taken at a
// match, a card payment made somewhere this app did not see, or a square given
// away. The money is already settled by the time anyone opens this form, so the
// squares go straight to `paid`. There is no Netcash round trip to wait for and
// therefore no pending state to be in.
//
// It records a name and nothing else about the person. Everything a checkout
// collects (email, phone, shirt size, artwork) is arranged in conversation for
// these, and typing a placeholder into four fields to satisfy a validator would
// store four lies. What it hands back instead is a claim token: the artwork
// arrives later, through /claim, whenever the person has decided what they want.
//
// It writes through the same table, the same unique index and the same
// availability check as a real checkout, so a placement cannot double-sell a
// square that somebody has already bought or is mid-checkout on. That is the
// whole reason this is a route rather than a hand-written SQL insert: the
// protections live in the code path, not in the schema alone.
//
// Under /admin, so middleware's Basic Auth covers it.
export const dynamic = "force-dynamic";

const METHODS = ["cash", "complimentary", "netcash"];

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const method = METHODS.includes(body?.method) ? body.method : null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const placedBy = typeof body?.placedBy === "string" ? body.placedBy.trim().slice(0, 80) : "";
  const receipt = typeof body?.netcashReceipt === "string" ? body.netcashReceipt.trim().slice(0, 120) : "";
  const size = body?.size === 4 ? 4 : 1;

  if (!method) {
    return Response.json({ error: "Choose how this was paid for" }, { status: 400 });
  }
  if (name.length < 2) {
    return Response.json({ error: "Enter the name this square belongs to" }, { status: 400 });
  }
  // The whole point of the netcash option is that it ties back to a statement
  // line. Without the receipt it is indistinguishable from cash, and recording
  // it as a card payment we cannot find would be worse than recording nothing.
  if (method === "netcash" && !receipt) {
    return Response.json(
      { error: "Enter the Netcash Pay Now receipt or reference for this payment" },
      { status: 400 }
    );
  }

  // Cash and netcash both mean the money arrived, so both belong in the raised
  // total at the real price. Complimentary was given, so it must not inflate it.
  const amount = method === "complimentary" ? 0 : size === 4 ? BLOCK_PRICE : PRICE_PER_SPOT;

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

    // Either the cell they asked for, or the next free one that fits. "Anywhere"
    // is the common case: somebody hands over cash and does not care which
    // square, and hunting through 500 cells on a phone at a touchline is not a
    // thing to ask of a volunteer.
    let zoneId = typeof body?.zoneId === "string" ? body.zoneId : "";
    let col = Number.isInteger(body?.col) ? body.col : null;
    let row = Number.isInteger(body?.row) ? body.row : null;

    if (!zoneId || col === null || row === null) {
      const free = availableSpots(occ, size);
      if (!free.length) {
        return Response.json(
          { error: size === 4 ? "No free block of four left" : "Every square is taken" },
          { status: 409 }
        );
      }
      ({ zoneId, col, row } = free[0]);
    }

    const zone = getZone(zoneId);
    if (!zone || !countedZones().some((z) => z.id === zoneId)) {
      return Response.json({ error: "That is not a claimable panel" }, { status: 400 });
    }
    // validFoot already understands the 2x2 footprint, so this covers a block
    // partially overlapping something sold.
    if (!validFoot(occ, zone, col, row, size)) {
      return Response.json(
        {
          error:
            size === 4
              ? "That block overlaps a square that is already taken, try another"
              : "That square is already taken, try another",
        },
        { status: 409 }
      );
    }

    const reference = generateReference();
    const blockId = crypto.randomUUID();
    const claimToken = generateClaimToken();

    // A block of four is four rows at span 1, one per cell, exactly as the
    // public checkout stores it. Not one row at span 2: that is the `big`
    // product, it carries a single artwork across the whole 2x2, and it is the
    // shape with the known atomicity gap. Four rows also means four independent
    // artworks, which is what somebody buying four squares expects.
    const offsets = size === 4 ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
    const cells = offsets.map(([dc, dr]) => ({
      col: col + dc,
      row: row + dr,
      fill: spotColor(zone, col + dc, row + dr),
    }));

    // span, big, status and paid_at are the same literal for every row, so they
    // are written into the SQL rather than bound four times over.
    const values = [];
    const tuples = cells.map((c) => {
      const [b, ref, z, cc, rr, fill, amt, nm, mth, by, rcpt, tok] = [
        blockId,
        reference,
        zoneId,
        c.col,
        c.row,
        c.fill,
        amount,
        name,
        method,
        placedBy || null,
        receipt || null,
        claimToken,
      ].map((v) => {
        values.push(v);
        return `$${values.length}`;
      });
      return `(${b}, ${ref}, ${z}, ${cc}, ${rr}, 1, false, ${fill}, ${amt}, ${nm}, 'paid', ${mth}, ${by}, ${rcpt}, ${tok}, now())`;
    });

    // One statement, so a block of four is all-or-nothing: if any cell is taken
    // the whole placement fails rather than leaving a half-claimed block.
    //
    // No content, content_thumb or content_meta. The square is paid for and
    // holds its cell, and it renders as a plain claimed block until the artwork
    // comes in through /claim. `claimed_squares` already gates artwork on
    // content_thumb being present, so nothing downstream needs to change.
    await query(
      `insert into squares
         (block_id, m_payment_id, zone_id, col, "row", span, big,
          fill, order_amount, buyer_name, status, payment_method, placed_by,
          netcash_receipt, claim_token, paid_at)
       values ${tuples.join(", ")}`,
      values
    );

    console.log(
      `/admin/placements: ${method} ${size === 4 ? "block of 4" : "square"} for ${name} at ` +
        `${zoneId} (${col},${row}), ref ${reference}, token ${claimToken}, R${amount}` +
        (receipt ? `, netcash receipt ${receipt}` : "")
    );

    return Response.json({
      ok: true,
      reference,
      claimToken,
      claimUrl: claimUrl(claimToken),
      zoneId,
      col,
      row,
      size,
      cells: cells.map((c) => ({ col: c.col, row: c.row })),
      amount,
      method,
    });
  } catch (e) {
    // 23505 means the unique index refused it: somebody claimed one of these
    // exact cells between the check and the insert.
    if (e.code === "23505") {
      return Response.json({ error: "That was taken a moment ago, try again" }, { status: 409 });
    }
    console.error("/admin/placements:", e.message);
    return Response.json({ error: "Couldn't place that: " + e.message }, { status: 500 });
  }
}

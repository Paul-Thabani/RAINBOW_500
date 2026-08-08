import { getPool, query } from "../../../lib/db";
import {
  getZone,
  validFoot,
  cellKey,
  countedZones,
  availableSpots,
  spotColor,
  zoneLabel,
} from "../../../lib/zones";

// Move a paid order to a different square, including from one panel to the other.
//
// People change their minds, usually after seeing the shirt: somebody buys on the
// back and wants the front, or wants to sit next to a friend. Until now that was a
// hand-written UPDATE, which is exactly the kind of thing that eventually puts a
// square somewhere unsellable or on top of somebody else.
//
// This runs the same validFoot the public checkout runs, against occupancy that
// excludes the order being moved, so a move can only ever land somewhere a buyer
// could have bought in the first place, and the order is allowed to stay where it
// already is.
//
// Under /admin, so middleware's Basic Auth covers it.
export const dynamic = "force-dynamic";

// The three shapes an order can have, and the footprint each needs. `size` is the
// same 1-or-4 that validFoot and availableSpots take.
function footprintOf(rows) {
  if (rows.length === 1 && rows[0].span === 1) return { size: 1, big: false };
  // A big 2x2 is one row spanning four cells, not four rows.
  if (rows.length === 1 && rows[0].span === 2) return { size: 4, big: true };
  if (rows.length === 4 && rows.every((r) => r.span === 1)) return { size: 4, big: false };
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
  if (!/^[a-f0-9]{20}$/i.test(reference)) {
    return Response.json({ error: "That is not a valid order reference" }, { status: 400 });
  }

  const wantZone = typeof body?.zoneId === "string" ? body.zoneId : "";
  const auto = body?.auto === true;
  let col = Number.isInteger(body?.col) ? body.col : null;
  let row = Number.isInteger(body?.row) ? body.row : null;

  try {
    const { rows } = await query(
      `select id, zone_id, col, "row", span, big, status, buyer_name, content_meta
         from squares
        where m_payment_id = $1
        order by "row", col`,
      [reference]
    );
    if (!rows.length) {
      return Response.json({ error: "No order with that reference" }, { status: 404 });
    }
    // Paid only. A pending row is somebody mid-checkout whose cells are about to be
    // decided by Netcash, and moving it underneath them would be the wrong kind of
    // surprise. Expired and failed rows hold nothing, so there is nothing to move.
    if (rows.some((r) => r.status !== "paid")) {
      return Response.json(
        { error: `That order is ${rows[0].status}, and only a paid order can be moved` },
        { status: 409 }
      );
    }

    const foot = footprintOf(rows);
    if (!foot) {
      return Response.json(
        { error: `That order has an unexpected shape (${rows.length} rows), so it will not be moved automatically` },
        { status: 409 }
      );
    }

    // Occupancy excluding this order, which is what lets a move be a no-op or a
    // nudge by one cell rather than colliding with itself.
    const { rows: live } = await query(
      `select zone_id, col, "row", span from squares
        where status in ('paid','pending') and m_payment_id <> $1`,
      [reference]
    );
    const occ = new Set();
    live.forEach((r) => {
      const sp = r.span || 1;
      for (let i = 0; i < sp; i++)
        for (let j = 0; j < sp; j++) occ.add(cellKey(r.zone_id, r.col + i, r.row + j));
    });

    let zoneId = wantZone || rows[0].zone_id;
    if (!countedZones().some((z) => z.id === zoneId)) {
      return Response.json({ error: "That is not a claimable panel" }, { status: 400 });
    }

    // "Put it on the front, anywhere" is the common request, and hunting for a free
    // cell in a list of 500 is not a thing to do on a phone.
    if (auto || col === null || row === null) {
      const free = availableSpots(occ, foot.size).filter((s) => s.zoneId === zoneId);
      if (!free.length) {
        return Response.json(
          { error: `No free ${foot.size === 4 ? "block of four" : "square"} left on the ${zoneLabel(zoneId)}` },
          { status: 409 }
        );
      }
      ({ col, row } = free[0]);
    }

    const zone = getZone(zoneId);
    if (!validFoot(occ, zone, col, row, foot.size)) {
      return Response.json(
        { error: "That spot is taken or not part of the shirt, try another" },
        { status: 409 }
      );
    }

    const from = { zoneId: rows[0].zone_id, col: rows[0].col, row: rows[0].row };

    // Top left, top right, bottom left, bottom right, in that order, so a block of
    // four keeps its arrangement and each artwork stays in the corner it was put in.
    const offsets = foot.size === 4 && !foot.big ? [[0, 0], [1, 0], [0, 1], [1, 1]] : [[0, 0]];
    const ordered = [...rows].sort((a, b) => a.row - b.row || a.col - b.col);

    const pairs = ordered.map((r, i) => {
      const c = col + offsets[i][0];
      const rr = row + offsets[i][1];
      return {
        id: r.id,
        fromKey: cellKey(r.zone_id, r.col, r.row),
        toKey: cellKey(zoneId, c, rr),
        col: c,
        row: rr,
        // A square's colour is derived from where it sits, never chosen by the
        // buyer, so it has to be recomputed or the square keeps the hue of its old
        // position. content_meta.color is written too, purely so the stored artwork
        // and the rendered square do not disagree; only `fill` actually paints.
        fill: spotColor(zone, c, rr),
        meta: r.content_meta,
      };
    });

    // Order the writes so no row is ever written onto a cell one of its own
    // siblings has not vacated yet.
    //
    // squares_no_double_claim is a plain unique index, so it is enforced per row
    // and cannot be deferred. Nudging a block of four one cell sideways therefore
    // fails halfway through unless the vacating row is written first. Picking, each
    // time, a row whose destination is not still held by an unmoved sibling is a
    // topological sort of that dependency, and for a rigid block being translated
    // there is always such an order.
    const queue = [...pairs];
    const plan = [];
    while (queue.length) {
      const i = queue.findIndex((p) => !queue.some((q) => q !== p && q.fromKey === p.toKey));
      if (i === -1) {
        return Response.json(
          { error: "Could not find a safe order to move those cells in, nothing was changed" },
          { status: 409 }
        );
      }
      plan.push(queue.splice(i, 1)[0]);
    }

    // All of it or none of it. A move that half-applied would leave a block of four
    // split across two places on the shirt.
    const client = await getPool().connect();
    try {
      await client.query("begin");
      for (const p of plan) {
        await client.query(
          `update squares
              set zone_id = $1, col = $2, "row" = $3, fill = $4, content_meta = $5
            where id = $6`,
          [zoneId, p.col, p.row, p.fill, p.meta ? { ...p.meta, color: p.fill } : null, p.id]
        );
      }
      await client.query("commit");
    } catch (e) {
      await client.query("rollback").catch(() => {});
      throw e;
    } finally {
      client.release();
    }

    const moved = pairs.map((p) => ({ col: p.col, row: p.row }));

    console.log(
      `/admin/move: ${reference} (${rows[0].buyer_name || "no name"}) ` +
        `${from.zoneId} (${from.col},${from.row}) -> ${zoneId} (${col},${row})`
    );

    return Response.json({
      ok: true,
      reference,
      from,
      to: { zoneId, col, row, panel: zoneLabel(zoneId) },
      cells: moved,
    });
  } catch (e) {
    // 23505 means the unique index refused it: somebody claimed one of those cells
    // between the check and the write.
    if (e.code === "23505") {
      return Response.json({ error: "That spot was taken a moment ago, try another" }, { status: 409 });
    }
    console.error("/admin/move:", e.message);
    return Response.json({ error: "Couldn't move that: " + e.message }, { status: 500 });
  }
}

import { query } from "../../../lib/db";
import { artMeta, makeThumb } from "../../../lib/artwork.mjs";
import { normaliseClaimToken } from "../../../lib/claimToken";
import { zoneLabel } from "../../../lib/zones";

// Where the artwork for a hand-placed square arrives.
//
// A placement made from /admin is paid for and holds its cell before anyone has
// decided what goes on it, so it sits on the board as a plain claimed block. The
// token the admin handed over opens /claim, and this is what that page reads and
// writes.
//
// GET  ?t=<token>   what this token owns, and whatever is already on it
// POST { token, slots }  set the artwork, one entry per square
//
// Not under /admin, so this has no Basic Auth in front of it and the token is
// the only credential. Everything here is therefore scoped by claim_token in the
// WHERE clause, never by anything the caller can name directly, and the response
// carries no email, phone or address: possession of a token proves someone was
// handed a square, not that they are entitled to the buyer's contact details.
export const dynamic = "force-dynamic";

const MAX_CONTENT_LENGTH = 2_000_000; // data URL length, ~2MB, same as checkout

async function loadOrder(token) {
  const { rows } = await query(
    `select id, zone_id, col, "row", span, buyer_name, order_amount,
            m_payment_id, claim_completed_at,
            content_meta, (content_thumb is not null) as has_art
       from squares
      where claim_token = $1 and status = 'paid'
      order by "row", col`,
    [token]
  );
  return rows;
}

function publicShape(rows) {
  return {
    name: rows[0].buyer_name,
    reference: rows[0].m_payment_id,
    panel: zoneLabel(rows[0].zone_id),
    completedAt: rows[0].claim_completed_at,
    squares: rows.map((r) => ({
      id: r.id,
      col: r.col,
      row: r.row,
      art: r.content_meta,
      hasArt: r.has_art,
    })),
  };
}

export async function GET(request) {
  const token = normaliseClaimToken(new URL(request.url).searchParams.get("t"));
  if (!token) {
    return Response.json({ error: "That does not look like a valid code" }, { status: 400 });
  }
  try {
    const rows = await loadOrder(token);
    if (!rows.length) {
      // Deliberately the same message whether the token never existed or its
      // squares are gone. There is nothing to gain from telling an unknown
      // caller which of the two it is.
      return Response.json({ error: "We could not find that code" }, { status: 404 });
    }
    return Response.json(publicShape(rows));
  } catch (e) {
    console.error("GET /api/claim:", e.message);
    return Response.json({ error: "Couldn't load that code" }, { status: 500 });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = normaliseClaimToken(body?.token);
  if (!token) {
    return Response.json({ error: "That does not look like a valid code" }, { status: 400 });
  }
  if (!Array.isArray(body?.slots) || !body.slots.some(Boolean)) {
    return Response.json({ error: "Add a logo or a message first" }, { status: 400 });
  }

  const oversize = body.slots.some(
    (s) => s && s.type === "image" && typeof s.src === "string" && s.src.length > MAX_CONTENT_LENGTH
  );
  if (oversize) {
    return Response.json(
      { error: "That image is too large, please use a smaller file" },
      { status: 400 }
    );
  }

  try {
    const rows = await loadOrder(token);
    if (!rows.length) {
      return Response.json({ error: "We could not find that code" }, { status: 404 });
    }

    // Slots line up with the squares in the order the GET returned them, which
    // is the order the page renders. A slot left empty leaves that square as it
    // was, so somebody can do one of their four now and come back for the rest.
    const updates = [];
    rows.forEach((r, i) => {
      const slot = body.slots[i];
      if (!slot) return;
      // `color` is carried through so a claimed square's content_meta has the
      // same shape as a bought one's: artMeta passes the whole slot minus the
      // bytes, and the checkout path includes colour in it.
      const color = typeof slot.color === "string" ? slot.color : null;
      const content =
        slot.type === "image" && typeof slot.src === "string"
          ? { type: "image", src: slot.src, logo: true, ...(color ? { color } : {}) }
          : typeof slot.text === "string" && slot.text.trim()
            ? { type: "text", text: slot.text.trim().slice(0, 120), ...(color ? { color } : {}) }
            : null;
      if (content) updates.push({ id: r.id, content, color });
    });

    if (!updates.length) {
      return Response.json({ error: "Add a logo or a message first" }, { status: 400 });
    }

    for (const u of updates) {
      // makeThumb never throws: a square whose artwork sharp cannot read still
      // keeps its place and simply draws as a plain claimed block, which is a
      // far better outcome than refusing artwork for a square already paid for.
      const thumb = await makeThumb(u.content);
      const meta = artMeta(u.content);
      // Scoped by claim_token as well as id, so a token can only ever write to
      // its own squares even if an id were guessed.
      await query(
        `update squares
            set content = $1, content_thumb = $2, content_meta = $3,
                fill = coalesce($4, fill), claim_completed_at = now()
          where id = $5 and claim_token = $6 and status = 'paid'`,
        [u.content, thumb, meta, u.color || null, u.id, token]
      );
    }

    console.log(
      `/api/claim: ${updates.length} square(s) claimed on token ${token}, ref ${rows[0].m_payment_id}`
    );

    const after = await loadOrder(token);
    return Response.json({ ok: true, updated: updates.length, ...publicShape(after) });
  } catch (e) {
    console.error("POST /api/claim:", e.message);
    return Response.json({ error: "Couldn't save that, please try again" }, { status: 500 });
  }
}

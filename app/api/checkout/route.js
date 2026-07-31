import crypto from "crypto";
import { query } from "../../../lib/db";
import { artMeta, makeThumb } from "../../../lib/artwork.mjs";
import { buildPaymentFields, generateReference, NETCASH_PROCESS_URL } from "../../../lib/netcash";
import {
  getZone,
  validFoot,
  cellKey,
  pendingEntries,
  zoneLabel,
  PRICE_PER_SPOT,
  BLOCK_PRICE,
} from "../../../lib/zones";

// How long a started checkout holds its cells before the sweep below releases
// them. Kept in step with the same interval in the claimed_squares view.
const CHECKOUT_WINDOW = "20 minutes";

const INSERT_COLUMNS = [
  "block_id",
  "m_payment_id",
  "zone_id",
  "col",
  '"row"',
  "span",
  "big",
  "content",
  "content_thumb",
  "content_meta",
  "fill",
  "order_amount",
  "buyer_email",
  "buyer_phone",
  "status",
];

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
    return Response.json({ error: "Add a logo, message, doodle or autograph first" }, { status: 400 });
  }
  // The browser resizes/re-encodes logos before upload, so this should never
  // trip in normal use - it's a backstop against a client that skips that
  // step. `content` is stored as-is in Postgres because it is the file that
  // gets printed on the shirt, so it is deliberately still allowed to be big;
  // what it no longer does is ride along in every poll of GET /api/squares.
  const MAX_CONTENT_LENGTH = 2_000_000; // data URL length, ~2MB
  if (slots.some((s) => s && s.type === "image" && typeof s.src === "string" && s.src.length > MAX_CONTENT_LENGTH)) {
    return Response.json({ error: "That image is too large, please use a smaller file" }, { status: 400 });
  }
  const buyerEmail = typeof email === "string" ? email.trim() : "";
  const buyerPhone = typeof phone === "string" ? phone.trim() : "";
  if (!/^\S+@\S+\.\S+$/.test(buyerEmail)) {
    return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  if (buyerPhone.replace(/[^0-9]/g, "").length < 7) {
    return Response.json({ error: "Enter a valid phone number" }, { status: 400 });
  }

  const blockId = crypto.randomUUID();
  const reference = generateReference(); // <= 25 chars, what Netcash calls back with
  const amount = size === 4 ? BLOCK_PRICE : PRICE_PER_SPOT;

  // Build the Netcash fields before writing anything. If the service key is
  // missing this fails, and doing it first means we don't leave a pending row
  // behind for a checkout that could never have reached Netcash.
  let fields;
  try {
    fields = buildPaymentFields({
      reference,
      amount: amount.toFixed(2),
      // This string is what Netcash shows the buyer on the payment page, so it
      // gets the human zone name, not the internal id. Pay Now caps it at 50.
      description: `Legacy 500 - ${size === 4 ? "block of 4" : "1 square"}, ${zoneLabel(zoneId)}`.slice(0, 50),
      extra1: blockId,
        // Already collected and validated above, so Netcash can prefill its form
        // rather than asking for them a second time.
        email: buyerEmail,
        mobile: buyerPhone,
    });
  } catch (e) {
    console.error("POST /api/checkout:", e.message);
    return Response.json({ error: "Payments aren't configured yet" }, { status: 500 });
  }

  try {
    // Lazy cleanup (no cron needed): a pending row nobody ever paid for
    // shouldn't lock its cell forever, so expire anything past the checkout
    // window before checking availability.
    //
    // This sets `expired`, NOT `cancelled`, and the difference matters: the
    // buyer may still be sitting on Netcash's payment page and pay after this
    // sweep has run. Netcash, not this sweep, is the authority on whether
    // money actually moved, so `expired` is a status the notify callback is
    // still allowed to resolve into `paid` (see app/api/netcash/notify).
    // `cancelled` stays reserved for genuinely terminal orders.
    await query(
      `update squares
          set status = 'expired'
        where status = 'pending'
          and created_at < now() - interval '${CHECKOUT_WINDOW}'`
    );

    // Re-check availability server-side against paid AND still-pending squares.
    // The client's view of "reserved" can be stale, and checking pending too
    // closes the window where two people could both pass this check for the
    // same cell before either finished paying. The unique index is the real,
    // atomic guarantee; this is just a friendlier first check that produces a
    // decent error message instead of a constraint violation.
    const { rows: liveRows } = await query(
      `select col, "row", span
         from squares
        where zone_id = $1
          and status in ('paid', 'pending')`,
      [zoneId]
    );

    const occ = new Set();
    liveRows.forEach((r) => {
      const sp = r.span || 1;
      for (let i = 0; i < sp; i++)
        for (let j = 0; j < sp; j++) occ.add(cellKey(zoneId, r.col + i, r.row + j));
    });

    if (!validFoot(occ, zone, col, row, size)) {
      return Response.json({ error: "That spot's just been taken, try another" }, { status: 409 });
    }

    // Logo/doodle images are stored as base64 data URLs directly in the row's
    // `content` column rather than in object storage, since Postgres is
    // already the single source of truth here.
    const entries = pendingEntries({ zoneId, col, row, size, big, slots });

    // The board's copy is made here, once, instead of the print-resolution file
    // going out on all 144 polls an open tab makes an hour. `content` keeps the original
    // exactly as uploaded; content_thumb is the ~96px WebP the shirt renders
    // and content_meta is everything about the slot except the bytes.
    //
    // makeThumb never throws. A square whose artwork sharp cannot read still
    // sells, it just draws as a plain claimed block until someone looks at it,
    // which is a far better outcome than failing a R2,000 payment over a
    // thumbnail. At most four small images per order, so the added latency sits
    // well inside the time it takes to hand off to Netcash.
    const prepared = await Promise.all(
      entries.map(async (e) => ({
        ...e,
        contentThumb: await makeThumb(e.content),
        contentMeta: artMeta(e.content),
      }))
    );

    const values = [];
    const tuples = prepared.map((e) => {
      const placeholders = [
        blockId,
        reference,
        zoneId,
        e.col,
        e.row,
        e.span,
        !!big,
        e.content ?? null,
        e.contentThumb,
        e.contentMeta,
        e.fill,
        amount,
        buyerEmail,
        buyerPhone,
        "pending",
      ].map((v) => {
        values.push(v);
        return `$${values.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    // One statement, so a block of 4 is all-or-nothing: if any cell is taken
    // the whole order fails rather than leaving a half-claimed block.
    await query(
      `insert into squares (${INSERT_COLUMNS.join(", ")}) values ${tuples.join(", ")}`,
      values
    );
  } catch (e) {
    // 23505 = unique-index violation, so someone else's checkout claimed this
    // exact cell in the split second between the check above and the insert.
    if (e.code === "23505") {
      return Response.json({ error: "That spot's just been taken, try another" }, { status: 409 });
    }
    console.error("POST /api/checkout:", e.message);
    return Response.json({ error: "Couldn't reserve that square, please try again" }, { status: 500 });
  }

  return Response.json({ url: NETCASH_PROCESS_URL, fields });
}

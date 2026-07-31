import { query } from "../../../../lib/db";
import { parseNotifyFields } from "../../../../lib/netcash";
import { sendPaymentConfirmation, sendConflictAlert } from "../../../../lib/mailer";
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

// Every cell an order covers, so the receipt can say "4 squares" whether that
// was four rows of span 1 or one big row of span 2.
function squareCount(rows) {
  return rows.reduce((n, r) => n + (r.span || 1) ** 2, 0);
}

// Deliberately not awaited.
//
// Tying a send to the response would lose receipts rather than protect them. If
// the send were awaited and it ran slow, Netcash would time out and retry, the
// retry would find the order already settled, take the `updated === 0` early
// return, and never send anything at all. Detached, the first attempt runs to
// completion after the callback has been acknowledged. That holds because this
// is a long-lived process under pm2, not a serverless function that freezes on
// response.
//
// The mailer never throws, but the call sits in a catch anyway so a future
// change there can't surface as an unhandled rejection in a payment callback.
function detach(promiseFn) {
  Promise.resolve()
    .then(promiseFn)
    .catch((e) => console.error("Netcash notify: mail failed -", e.message));
}

// Settle every row of this order, but only if it is still resolvable. Doing the
// status guard in the WHERE clause rather than in JS is what makes
// first-notify-wins hold: two concurrent notifies cannot both match.
async function settle(reference, status, requestTrace) {
  const sql =
    status === "paid"
      ? `update squares
            set status = 'paid', paid_at = now(), pf_payment_id = $3
          where m_payment_id = $1
            and status = any($2::text[])`
      : `update squares
            set status = $3
          where m_payment_id = $1
            and status = any($2::text[])`;
  const params = status === "paid" ? [reference, RESOLVABLE, requestTrace] : [reference, RESOLVABLE, status];
  const { rowCount } = await query(sql, params);
  return rowCount;
}

export async function POST(request) {
  const formData = await request.formData();
  const fields = parseNotifyFields(formData);

  if (!fields.reference) return new Response("missing reference", { status: 400 });

  try {
    const { rows } = await query(
      `select id, zone_id, col, "row", span, order_amount, status, buyer_email
         from squares
        where m_payment_id = $1`,
      [fields.reference]
    );

    if (rows.length === 0) {
      console.warn("Netcash notify: no squares found for reference", fields.reference);
      return new Response("OK", { status: 200 }); // acknowledge - nothing to do
    }

    if (!RESOLVABLE.includes(rows[0].status)) {
      return new Response("OK", { status: 200 });
    }

    const wasExpired = rows[0].status === "expired";

    // `numeric` arrives from pg as a string, so coerce before comparing.
    const expected = Number(rows[0].order_amount);
    const amountOk = Math.abs(fields.amount - expected) < 0.01;

    if (!fields.accepted || !amountOk) {
      if (!amountOk) {
        console.error(
          "Netcash notify: amount mismatch for",
          fields.reference,
          fields.amount,
          "vs",
          expected
        );
      }
      await settle(fields.reference, "failed");
      return new Response("OK", { status: 200 });
    }

    // Defensive check: make sure nothing else has taken these cells while this
    // order was in flight - flag for manual review instead of overwriting. This
    // matters more for a revived `expired` order, whose cells were free for
    // anyone else to claim in the meantime.
    const zoneIds = [...new Set(rows.map((r) => r.zone_id))];
    const { rows: liveRows } = await query(
      `select zone_id, col, "row", span
         from squares
        where zone_id = any($1::text[])
          and status in ('paid', 'pending')
          and m_payment_id <> $2`,
      [zoneIds, fields.reference]
    );

    const taken = new Set(liveRows.flatMap(cellsOf));
    const hasConflict = rows.flatMap(cellsOf).some((c) => taken.has(c));

    if (hasConflict) {
      console.error(
        "Netcash notify: cell conflict for",
        fields.reference,
        "- payment was accepted but the cells are taken, needs a manual refund"
      );
      await settle(fields.reference, "conflict");
      detach(() =>
        sendConflictAlert({
          reference: fields.reference,
          amount: expected,
          buyerEmail: rows[0].buyer_email,
          squares: squareCount(rows),
          cause: "cell conflict found before settling",
        })
      );
      return new Response("OK", { status: 200 });
    }

    const updated = await settle(fields.reference, "paid", fields.requestTrace);

    if (updated === 0) {
      // Another notify for this same reference resolved it between our read and
      // our write. It won, and it applied the same guards, so there is nothing
      // to do and nothing wrong.
      console.warn("Netcash notify:", fields.reference, "was already settled concurrently");
      return new Response("OK", { status: 200 });
    }

    if (wasExpired) {
      console.warn(
        "Netcash notify: revived expired order",
        fields.reference,
        "- buyer paid after the checkout window had passed, square confirmed"
      );
    }

    // Exactly one receipt per order. `updated` is only non-zero for the notify
    // that actually flipped the rows to paid, so a duplicate or replayed
    // callback returns above and never reaches this.
    if (rows[0].buyer_email) {
      detach(() =>
        sendPaymentConfirmation({
          to: rows[0].buyer_email,
          reference: fields.reference,
          amount: expected,
          squares: squareCount(rows),
        })
      );
    } else {
      console.warn("Netcash notify: no buyer_email on", fields.reference, "- no receipt sent");
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    // 23505 = the partial unique index refused the write, so another live
    // order holds one of these cells after all and the conflict check lost a
    // race. The money has been taken, so this needs a human and a refund.
    if (e.code === "23505") {
      console.error(
        "Netcash notify: unique index refused",
        fields.reference,
        "- payment was accepted but the cells are taken, needs a manual refund"
      );
      try {
        await settle(fields.reference, "conflict");
      } catch (inner) {
        console.error("Netcash notify: couldn't even mark it conflict:", inner.message);
      }
      // `rows` never made it into scope on this path, so the alert carries only
      // what the callback itself told us. The reference is enough to find the
      // order in /admin.
      detach(() =>
        sendConflictAlert({
          reference: fields.reference,
          amount: fields.amount,
          buyerEmail: null,
          squares: null,
          cause: "unique index refused the write",
        })
      );
      return new Response("OK", { status: 200 });
    }
    // Anything else is transient as far as we know. Don't acknowledge: the
    // order stays resolvable, so a Netcash retry or a manual replay can still
    // confirm it rather than the payment being silently lost.
    console.error("Netcash notify: couldn't settle", fields.reference, "-", e.message);
    return new Response("internal error", { status: 500 });
  }
}

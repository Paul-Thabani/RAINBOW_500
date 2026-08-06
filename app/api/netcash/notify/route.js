import { query } from "../../../../lib/db";
import { isOurReference, parseNotifyFields } from "../../../../lib/netcash";
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
//
// `cancelled` is the one an admin sets by hand from /admin. It stays out of
// this list, because reviving an order a human deliberately cancelled would
// undo their decision and the squares may already have been resold. It is
// still handled rather than ignored: see the cancelled-then-paid branch below,
// which routes it to `conflict` and alerts, so the money is never silently
// swallowed.
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
// `from` is the set of statuses this transition is allowed to move out of. It
// defaults to RESOLVABLE, which is every ordinary case. The cancelled-then-paid
// path passes its own, because `cancelled` must stay out of RESOLVABLE while
// still being transitionable to conflict.
async function settle(reference, status, requestTrace, from = RESOLVABLE) {
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
  const params = status === "paid" ? [reference, from, requestTrace] : [reference, from, status];
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
      // Two very different situations, and they were being logged as one.
      //
      // The relay broadcasts every notify to this app and to Sonar, so a
      // callback for one of Sonar's references arrives here on every single one
      // of their card payments. That is routine, and it was going to stderr,
      // which is where pm2 sends the error log. The result was that the first
      // place anyone looks during an incident filled up with the healthy
      // operation of another app.
      //
      // A reference shaped like one of ours with no rows behind it is the
      // opposite: we minted it, so the rows should exist. That deserves stderr.
      if (isOurReference(fields.reference)) {
        console.warn(
          "Netcash notify: reference",
          fields.reference,
          "looks like ours but has no squares - it may have been deleted"
        );
      } else {
        console.log(
          "Netcash notify: ignoring",
          fields.reference,
          "- not one of ours, another app on the shared relay"
        );
      }
      return new Response("OK", { status: 200 }); // acknowledge either way, nothing to do
    }

    // An admin cancelled this order from /admin and the buyer paid anyway,
    // most likely because they were already on the Netcash payment page when
    // the cancel landed.
    //
    // `cancelled` is deliberately NOT in RESOLVABLE. Reviving it would undo a
    // decision a human made on purpose, and the squares may well have been
    // resold in the meantime. But the money has moved, and Netcash is the
    // authority on that, so this cannot be a silent 200 either: that is the
    // exact shape of the bug the schema comments warn about for `expired`.
    // Mark it conflict, which already means "paid, no squares, needs a human",
    // and tell someone.
    if (rows[0].status === "cancelled" && fields.accepted) {
      console.error(
        "Netcash notify: payment accepted for cancelled order",
        fields.reference,
        "- buyer paid after an admin cancelled it, needs a manual refund"
      );
      await settle(fields.reference, "conflict", null, ["cancelled"]);
      detach(() =>
        sendConflictAlert({
          reference: fields.reference,
          amount: fields.amount,
          buyerEmail: rows[0].buyer_email,
          squares: squareCount(rows),
          cause: "buyer paid after an admin cancelled the order",
        })
      );
      return new Response("OK", { status: 200 });
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
      // Something changed this order between our read and our write. Usually
      // that is another notify for the same reference, which applied the same
      // guards and won, so there is nothing to do and nothing wrong.
      //
      // But an admin cancelling from /admin lands in exactly the same place,
      // and that case is not benign: the money moved and we have recorded no
      // square for it. Read the status back rather than assuming which one it
      // was.
      const { rows: now } = await query(
        `select distinct status from squares where m_payment_id = $1`,
        [fields.reference]
      );
      const settledPaid = now.length === 1 && now[0].status === "paid";

      if (settledPaid) {
        console.warn("Netcash notify:", fields.reference, "was already settled concurrently");
        return new Response("OK", { status: 200 });
      }

      console.error(
        "Netcash notify: lost the race on",
        fields.reference,
        "- payment was accepted but the order is now",
        now.map((r) => r.status).join("/") || "gone",
        "- needs a manual refund or a manual confirm"
      );
      await settle(fields.reference, "conflict", null, ["cancelled", "expired", "pending"]);
      detach(() =>
        sendConflictAlert({
          reference: fields.reference,
          amount: expected,
          buyerEmail: rows[0].buyer_email,
          squares: squareCount(rows),
          cause: `order changed to ${now.map((r) => r.status).join("/") || "gone"} while the payment was settling`,
        })
      );
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

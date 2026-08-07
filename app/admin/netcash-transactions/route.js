import { query } from "../../../lib/db";
import { isOurReference } from "../../../lib/netcash";

// Recent Netcash payments, for tying one to a square placed by hand.
//
// Netcash's own statement API exists (RequestMerchantStatement, then
// RetrieveMerchantStatement) but it is asynchronous, needs the account service
// key rather than the Pay Now one, and a full daily statement only appears the
// day after the business day. The relay at pay.hbufc.co.za already has every
// notify Netcash sent, in real time, so that is the source. Reach for the
// statement API only for a payment that never touched the relay.
//
// This route exists rather than the browser calling the relay directly because
// the relay's read token must stay server-side. Under /admin, so middleware's
// Basic Auth covers it.
export const dynamic = "force-dynamic";

const RELAY_BASE = process.env.RELAY_BASE_URL || "http://127.0.0.1:8274";
const RELAY_TOKEN = process.env.RELAY_READ_TOKEN || "";
const TIMEOUT_MS = 8000;

export async function GET(request) {
  if (!RELAY_TOKEN) {
    return Response.json(
      { error: "RELAY_READ_TOKEN is not set, so recent payments cannot be listed" },
      { status: 503 }
    );
  }

  const days = new URL(request.url).searchParams.get("days") || "60";

  let transactions;
  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(`${RELAY_BASE}/transactions?days=${encodeURIComponent(days)}&limit=200`, {
      headers: { Authorization: `Bearer ${RELAY_TOKEN}` },
      cache: "no-store",
      signal: ac.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error("/admin/netcash-transactions: relay returned", res.status);
      return Response.json(
        { error: `The payment relay answered ${res.status}` },
        { status: 502 }
      );
    }
    ({ transactions } = await res.json());
  } catch (e) {
    console.error("/admin/netcash-transactions:", e.message);
    return Response.json({ error: "Couldn't reach the payment relay" }, { status: 502 });
  }

  // What this app has already accounted for. Two separate things:
  //
  //   m_payment_id     a reference this app generated, so the payment came
  //                    through our own checkout and settled itself
  //   netcash_receipt  a reference an operator has already tied to a hand
  //                    placement, which must not be tied a second time
  //
  // Both are "taken". Offering either would let the same money be counted twice.
  const { rows: known } = await query(
    `select m_payment_id, netcash_receipt, buyer_name, status
       from squares
      where m_payment_id is not null or netcash_receipt is not null`
  );
  const settled = new Map();
  const tied = new Map();
  known.forEach((r) => {
    if (r.m_payment_id) settled.set(r.m_payment_id, r);
    if (r.netcash_receipt) tied.set(r.netcash_receipt, r);
  });

  const out = (transactions || []).map((t) => {
    const ref = t.reference || "";
    const mine = isOurReference(ref);
    const already = settled.get(ref) || tied.get(ref) || null;
    return {
      ...t,
      // Whether the reference looks like one this app minted. It is the only
      // signal available, because the notify carries no app tag.
      shape: mine ? "shirt" : "foreign",
      // Set when this payment is already on a square here, with whose.
      takenBy: already ? { name: already.buyer_name, status: already.status } : null,
      // Only an untaken, accepted payment is worth offering.
      selectable: !already && t.accepted,
    };
  });

  console.log(
    `/admin/netcash-transactions: ${out.length} from the relay, ` +
      `${out.filter((t) => t.selectable).length} unaccounted for`
  );
  return Response.json({ transactions: out }, { headers: { "Cache-Control": "no-store" } });
}

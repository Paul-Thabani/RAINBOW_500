import Link from "next/link";
import { query } from "../../lib/db";
import { RAINBOW_GRADIENT } from "../../lib/brand";
import CollectForm from "./CollectForm";

// Where a buyer lands after paying, via the relay's accept redirect.
//
// Two jobs: confirm the payment, and collect the address. The address is asked
// for here rather than at checkout because it is not needed to take the money,
// and every extra field before a card costs conversions.
//
// Must never be cached: it shows one specific buyer's order status.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your square is confirmed · Hout Bay United FC",
};

const wrap = { maxWidth: 620, margin: "0 auto", padding: "48px 22px 72px" };

export default async function CollectPage({ searchParams }) {
  const sp = await searchParams;
  const ref = typeof sp?.ref === "string" ? sp.ref.trim() : "";

  let order = null;
  let lookupFailed = false;

  if (/^[a-f0-9]{20}$/i.test(ref)) {
    try {
      const { rows } = await query(
        `select m_payment_id, buyer_name, shirt_size, status,
                count(*)::int as cells, max(order_amount) as amount,
                bool_or(buyer_address is not null) as has_address
           from squares
          where m_payment_id = $1
          group by m_payment_id, buyer_name, shirt_size, status`,
        [ref]
      );
      order = rows[0] || null;
    } catch (e) {
      console.error("/collect:", e.message);
      lookupFailed = true;
    }
  }

  const paid = order?.status === "paid";

  // Assembled here rather than inline in the JSX. Interpolating these pieces
  // between tags puts a newline either side of each expression, and JSX turns
  // those into spaces, so it rendered as "confirmed , and ... shirt ." with
  // gaps before the punctuation. Same trap that once produced "free shirt.Once".
  const confirmedLine = paid
    ? [
        order.buyer_name ? `${order.buyer_name.split(" ")[0]}, your` : "Your",
        order.cells > 1 ? `${order.cells} squares are confirmed` : "square is confirmed",
        order.shirt_size ? `, and we have you down for a size ${order.shirt_size} shirt.` : ".",
      ]
        .join(" ")
        .replace(" ,", ",") + " One last thing and you are done."
    : "";

  return (
    <div style={wrap}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "#8b8b93",
          marginBottom: 18,
        }}
      >
        <span style={{ width: 26, height: 3, borderRadius: 2, background: RAINBOW_GRADIENT }} />
        {paid ? "Payment confirmed" : "Your order"}
      </div>

      <h1 style={{ fontSize: "clamp(30px,5vw,46px)", fontWeight: 900, margin: "0 0 14px", letterSpacing: "-.02em", lineHeight: 1.05 }}>
        {paid ? "You're on the shirt." : "Thanks for your order."}
      </h1>

      {paid ? (
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "#4b5563", margin: "0 0 26px" }}>
          {confirmedLine}
        </p>
      ) : lookupFailed ? (
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "#4b5563", margin: "0 0 26px" }}>
          We could not load your order just now. Your payment is safe, and nothing
          is lost. Please try this link again shortly.
        </p>
      ) : (
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "#4b5563", margin: "0 0 26px" }}>
          We are still confirming your payment with Netcash. This usually takes a
          few seconds. Refresh this page in a moment and your square will be
          confirmed here.
        </p>
      )}

      {/* Said plainly and before the form, because someone typing an address
          reasonably assumes a parcel is coming. It is not. */}
      <div
        style={{
          background: "#f4f6f8",
          border: "1.5px solid #dfe3e8",
          borderRadius: 16,
          padding: "18px 20px",
          marginBottom: 26,
          lineHeight: 1.55,
          color: "#374151",
          fontSize: 14.5,
        }}
      >
        <strong style={{ color: "#12151c" }}>Shirts are collected, not posted.</strong>{" "}
        We will let you know once all 500 squares have sold and the shirts have
        been printed, and arrange a time and place for you to collect yours. Your
        address is for our records and to help us identify you at handover.
      </div>

      {paid && order.has_address ? (
        <div
          role="status"
          style={{
            background: "#eefaf1",
            border: "1.5px solid #9fe3b8",
            borderRadius: 14,
            padding: "18px 20px",
            color: "#14532d",
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          We already have your details. Nothing more to do.
          <div style={{ fontWeight: 500, marginTop: 6, color: "#166534" }}>
            We will be in touch once all 500 squares are sold.
          </div>
        </div>
      ) : paid ? (
        <CollectForm reference={order.m_payment_id} name={order.buyer_name} />
      ) : null}

      <div style={{ marginTop: 34, fontSize: 14 }}>
        <Link href="/" style={{ color: "#4b5563", fontWeight: 700 }}>
          Back to the shirt
        </Link>
      </div>
    </div>
  );
}

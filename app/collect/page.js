import Link from "next/link";
import { query } from "../../lib/db";
import { fmt } from "../../lib/zones";
import { RAINBOW_GRADIENT } from "../../lib/brand";
import CollectForm from "./CollectForm";

// Where a buyer lands after paying, via the relay's accept redirect.
//
// Two jobs: confirm the payment, and find out how the shirt reaches them. The
// address is asked for here rather than at checkout because it is not needed to
// take the money, and every extra field before a card costs conversions.
//
// Built dark, like the rest of the site. It was light originally, which made
// the one page a buyer sees straight after paying look like it belonged to a
// different website.
//
// Must never be cached: it shows one specific buyer's order status.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your square is confirmed · Hout Bay United FC",
};

const card = {
  background: "#10203a",
  border: "1px solid #24405f",
  borderRadius: 20,
  padding: 26,
};

const statLabel = {
  fontSize: 11,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#8b8b93",
  fontWeight: 800,
  marginBottom: 5,
};

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
                bool_or(buyer_address is not null) as has_address,
                bool_or(ship_overseas) as overseas
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
  const firstName = order?.buyer_name ? order.buyer_name.split(" ")[0] : "";

  // Built here, not inline in the JSX, because interpolating between tags puts
  // a newline either side of each expression and JSX turns those into spaces.
  const confirmedLine = paid
    ? [
        firstName ? `${firstName}, your` : "Your",
        order.cells > 1 ? `${order.cells} squares are` : "square is",
        "confirmed and live on the kit",
        order.shirt_size ? `, and we have you down for a size ${order.shirt_size} shirt.` : ".",
      ]
        .join(" ")
        .replace(" ,", ",")
    : "";

  return (
    <div style={{ minHeight: "100vh", padding: "52px 22px 80px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
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
          {paid ? "Payment confirmed" : "Thanks for your order"}
        </div>

        <h1
          style={{
            fontSize: "clamp(32px,6vw,54px)",
            fontWeight: 900,
            margin: "0 0 16px",
            letterSpacing: "-.02em",
            lineHeight: 1.02,
            textTransform: "uppercase",
          }}
        >
          {paid ? "You're on the shirt." : firstName ? `Thank you, ${firstName}.` : "Thank you."}
        </h1>

        {paid ? (
          <>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: "#b9bac2", margin: "0 0 26px" }}>
              {confirmedLine}
            </p>

            <div
              style={{
                ...card,
                marginBottom: 22,
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
              }}
            >
              <div>
                <div style={statLabel}>{order.cells > 1 ? "Squares" : "Square"}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#eef1f6" }}>{order.cells}</div>
              </div>
              <div>
                <div style={statLabel}>Paid</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#8bf0b0" }}>
                  R{fmt(Number(order.amount) || 0)}
                </div>
              </div>
              <div>
                <div style={statLabel}>Reference</div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "#cfd0d6",
                    fontFamily: "ui-monospace,monospace",
                    overflowWrap: "break-word",
                  }}
                >
                  {order.m_payment_id}
                </div>
              </div>
            </div>

            {order.has_address ? (
              <div style={{ ...card, borderColor: "#2f6b46" }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: "#8bf0b0", marginBottom: 8 }}>
                  That&apos;s everything.
                </div>
                <div style={{ color: "#b9bac2", fontSize: 15.5, lineHeight: 1.55 }}>
                  {order.overseas
                    ? "We have your address and we know you're overseas. Once all 500 squares are sold and the shirts are printed, we'll be in touch about posting yours."
                    : "We have your details. Once all 500 squares are sold and the shirts are printed, we'll be in touch to arrange collection."}
                </div>
              </div>
            ) : (
              <div style={card}>
                <CollectForm reference={order.m_payment_id} name={order.buyer_name} />
              </div>
            )}
          </>
        ) : lookupFailed ? (
          <div style={card}>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "#b9bac2", margin: 0 }}>
              We couldn&apos;t load your order just now. Your payment is safe and
              nothing is lost. Please open this link again shortly.
            </p>
          </div>
        ) : (
          <div style={card}>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "#b9bac2", margin: "0 0 14px" }}>
              We&apos;re confirming your payment with Netcash now. This usually
              takes a few seconds.
            </p>
            <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "#b9bac2", margin: 0 }}>
              Refresh this page in a moment and your square will be confirmed
              here. You&apos;ll get an email either way, so nothing depends on
              you keeping this page open.
            </p>
          </div>
        )}

        <div style={{ marginTop: 36, fontSize: 14 }}>
          <Link href="/" style={{ color: "#8b8b93", fontWeight: 700 }}>
            &larr; Back to the shirt
          </Link>
        </div>
      </div>
    </div>
  );
}

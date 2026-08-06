import { query } from "../../lib/db";
import { fmt, zoneLabel } from "../../lib/zones";
import { RAINBOW_GRADIENT } from "../../lib/brand";
import CancelOrderButton from "./CancelOrderButton";
import AddPlacement from "./AddPlacement";

// Most recent orders to render. Abandoned checkouts accumulate a row each, so
// this will eventually bite; the page says so explicitly rather than quietly
// showing a subset.
const ORDER_LIMIT = 1000;

// Always hits the database fresh - this page shows live order/payment
// status, so it must never be statically cached.
export const dynamic = "force-dynamic";

const STATUS_STYLE = {
  paid: { color: "#8bf0b0", bg: "rgba(139,240,176,.12)" },
  pending: { color: "#ffd27a", bg: "rgba(255,210,122,.12)" },
  failed: { color: "#fca5a5", bg: "rgba(252,165,165,.12)" },
  cancelled: { color: "#9aa1ac", bg: "rgba(154,161,172,.12)" },
  expired: { color: "#c4b5fd", bg: "rgba(196,181,253,.12)" },
  conflict: { color: "#fdba74", bg: "rgba(253,186,116,.12)" },
};

// One row per claimed cell in the database, but a "block of 4" purchase is
// one order to a human - group back up by block_id for display.
function groupByBlock(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!map.has(r.block_id)) {
      map.set(r.block_id, {
        blockId: r.block_id,
        reference: r.m_payment_id,
        buyerName: r.buyer_name,
        buyerEmail: r.buyer_email,
        buyerPhone: r.buyer_phone,
        shirtSize: r.shirt_size,
        buyerAddress: r.buyer_address,
        shipOverseas: r.ship_overseas,
        paymentMethod: r.payment_method,
        placedBy: r.placed_by,
        amount: Number(r.order_amount) || 0,
        status: r.status,
        createdAt: r.created_at,
        paidAt: r.paid_at,
        zoneId: r.zone_id,
        cells: [],
      });
    }
    // span matters for the cancel confirmation: a big 2x2 is a single row
    // covering four cells, so counting rows would under-report what is about
    // to be released.
    map.get(r.block_id).cells.push({ col: r.col, row: r.row, span: r.span, content: r.content });
  });
  return [...map.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function Stat({ label, value, color, accent }) {
  return (
    <div
      style={{
        position: "relative",
        background: "#10203a",
        border: "1px solid #24405f",
        borderRadius: 14,
        padding: "16px 20px",
        minWidth: 130,
        flex: "1 1 130px",
        overflow: "hidden",
      }}
    >
      <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent || color || "#24405f" }} />
      <div style={{ fontSize: 26, fontWeight: 900, color: color || "#fff", letterSpacing: "-.01em" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#8b8b93", textTransform: "uppercase", letterSpacing: ".1em", marginTop: 4, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

function ContentPreview({ content }) {
  if (!content) return <span style={{ color: "#4b5563" }}>-</span>;
  if (content.type === "image") {
    return (
      <img
        src={content.src}
        alt="Logo"
        title="Logo"
        style={{ width: 32, height: 32, objectFit: "contain", background: "#fff", borderRadius: 6, border: "1px solid #24405f" }}
      />
    );
  }
  if (content.type === "text") {
    return (
      <span
        style={{
          display: "inline-block",
          maxWidth: 220,
          // Wrap the whole message rather than cutting it off with an
          // ellipsis. This is the thing the buyer paid to put on the shirt, so
          // whoever is fulfilling the order has to be able to read all of it.
          // break-word only splits a word that cannot fit on its own line, so
          // ordinary messages still break at spaces.
          overflowWrap: "break-word",
          fontSize: 12,
          fontStyle: "italic",
          lineHeight: 1.35,
          color: "#cfd0d6",
        }}
      >
        &quot;{content.text}&quot;
      </span>
    );
  }
  return <span style={{ color: "#4b5563" }}>-</span>;
}

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || { color: "#9aa1ac", bg: "rgba(154,161,172,.12)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        fontWeight: 800,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: ".04em",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {status}
    </span>
  );
}

const th = {
  padding: "12px 16px",
  fontWeight: 800,
  fontSize: 11,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "#8b8b93",
  borderBottom: "1px solid #24405f",
  whiteSpace: "nowrap",
  textAlign: "left",
};
const td = { padding: "13px 16px", verticalAlign: "top" };

export default async function AdminPage() {
  let orders = [];
  let totalOrders = 0;
  let loadError = "";

  try {
    // Limit by order, not by row: a block of 4 is four rows, so a plain row
    // limit would cut a block in half and show a partial order.
    const [{ rows: orderRows }, { rows: countRows }] = await Promise.all([
      query(
        `with recent as (
           select block_id, max(created_at) as ordered_at
             from squares
            group by block_id
            order by max(created_at) desc
            limit $1
         )
         select s.*
           from squares s
           join recent r on r.block_id = s.block_id
          order by r.ordered_at desc`,
        [ORDER_LIMIT]
      ),
      query(`select count(distinct block_id)::int as total from squares`),
    ]);
    orders = groupByBlock(orderRows);
    totalOrders = countRows[0]?.total ?? orders.length;
  } catch (e) {
    // This page is behind Basic Auth, so the real error is more use here than
    // a generic one.
    console.error("/admin:", e.message);
    loadError = e.message;
  }

  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalRaised = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const conflictCount = orders.filter((o) => o.status === "conflict").length;

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px 60px" }}>
      <style>{`
        .rb-admin-row:nth-child(even) { background: rgba(255,255,255,.015); }
        .rb-admin-row:hover { background: rgba(165,200,255,.05); }
        .rb-admin-scroll::-webkit-scrollbar { height: 8px; }
        .rb-admin-scroll::-webkit-scrollbar-thumb { background: #24405f; border-radius: 8px; }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
          <div>
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
                marginBottom: 14,
              }}
            >
              <span style={{ width: 26, height: 3, borderRadius: 2, background: RAINBOW_GRADIENT }} />
              Admin · live orders
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: "-.02em" }}>Legacy 500 Orders</h1>
            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <a href="/admin/export" style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0c", background: "#a5c8ff", borderRadius: 999, padding: "9px 16px" }}>
                Export orders (CSV)
              </a>
              <a href="/admin/export?format=tar" style={{ fontSize: 13, fontWeight: 700, color: "#cfd0d6", border: "1.5px solid #24405f", borderRadius: 999, padding: "9px 16px" }}>
                Export artwork (.tar)
              </a>
            </div>
            <div style={{ marginTop: 12 }}>
              <AddPlacement />
            </div>
            <p style={{ color: "#8b8b93", margin: "6px 0 0", fontSize: 15 }}>
              Every checkout attempt, confirmed or not - newest first.
            </p>
          </div>
          <a
            href="/"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#cfd0d6",
              border: "1.5px solid #24405f",
              borderRadius: 999,
              padding: "9px 16px",
            }}
          >
            ← Back to site
          </a>
        </div>

        {loadError && (
          <div style={{ background: "#3a1010", border: "1px solid #7f1d1d", borderRadius: 12, padding: 16, marginBottom: 20, color: "#fecaca" }}>
            Couldn&apos;t load orders: {loadError}
          </div>
        )}

        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <Stat label="Orders" value={orders.length} accent="#5f4ea1" />
          <Stat label="Paid" value={paidOrders.length} color="#8bf0b0" accent="#2cae4a" />
          <Stat label="Pending" value={pendingCount} color="#ffd27a" accent="#f6ea0c" />
          {conflictCount > 0 && <Stat label="Conflicts" value={conflictCount} color="#fdba74" accent="#f37e21" />}
          <Stat label="Raised" value={"R" + fmt(totalRaised)} color="#a5c8ff" accent="#117ec2" />
        </div>

        {totalOrders > orders.length && (
          <div
            style={{
              background: "rgba(255,210,122,.08)",
              border: "1px solid #6b5320",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 20,
              color: "#ffd27a",
              fontSize: 13.5,
            }}
          >
            Showing the {orders.length} most recent of {totalOrders} orders. The
            stats above count only what is shown.
          </div>
        )}

        <div className="rb-admin-scroll" style={{ overflowX: "auto", border: "1px solid #24405f", borderRadius: 16, background: "#0d1a30" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 1160 }}>
            <thead>
              <tr style={{ background: "#10203a" }}>
                <th style={th}>Name</th>
                <th style={th}>Size</th>
                <th style={th}>Email</th>
                <th style={th}>Phone</th>
                <th style={th}>Zone</th>
                <th style={th}>Cells</th>
                <th style={th}>Logo / message</th>
                <th style={th}>Amount</th>
                <th style={th}>Status</th>
                <th style={th}>Created</th>
                <th style={th}>Paid at</th>
                <th style={th}>Reference</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.blockId} className="rb-admin-row" style={{ borderBottom: "1px solid #1a3050" }}>
                  <td style={{ ...td, fontWeight: 700, color: "#eef1f6" }}>
                    <a href={`/admin/order/${o.reference}`} style={{ color: "#eef1f6", textDecoration: "underline", textDecorationColor: "#24405f" }}>
                      {o.buyerName || "(open)"}
                    </a>
                    {/* Shown under the name because fulfilment reads down the
                        list looking for who has not sent an address yet. */}
                    {o.status === "paid" && (
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 3, color: !o.buyerAddress ? "#fdba74" : o.shipOverseas ? "#a5c8ff" : "#8bf0b0" }}>
                        {o.buyerAddress ? (o.shipOverseas ? "POST overseas" : "address on file") : "no address yet"}
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, fontWeight: 800, color: "#a5c8ff", whiteSpace: "nowrap" }}>{o.shirtSize || "-"}</td>
                  <td style={{ ...td, color: "#cfd0d6" }}>{o.buyerEmail || "-"}</td>
                  <td style={{ ...td, color: "#cfd0d6", fontVariantNumeric: "tabular-nums" }}>{o.buyerPhone || "-"}</td>
                  <td style={{ ...td, color: "#cfd0d6" }}>{zoneLabel(o.zoneId)}</td>
                  <td style={{ ...td, fontFamily: "ui-monospace,monospace", fontSize: 12.5, color: "#cfd0d6" }}>
                    {o.cells.map((c) => `(${c.col},${c.row})`).join(", ")}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 220 }}>
                      {o.cells.map((c, i) => (
                        <ContentPreview key={i} content={c.content} />
                      ))}
                    </div>
                  </td>
                  <td style={{ ...td, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>R{fmt(o.amount)}</td>
                  <td style={td}>
                    <StatusPill status={o.status} />
                    {o.paymentMethod && o.paymentMethod !== "netcash" && (
                      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 5, color: o.paymentMethod === "cash" ? "#ffd27a" : "#c4b5fd" }}>
                        {o.paymentMethod}{o.placedBy ? ` · ${o.placedBy}` : ""}
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, color: "#8b8b93", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  <td style={{ ...td, color: "#8b8b93", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                    {o.paidAt ? new Date(o.paidAt).toLocaleString() : "-"}
                  </td>
                  <td style={{ ...td, color: "#6b7280", fontFamily: "ui-monospace,monospace", fontSize: 12 }}>
                    {o.reference}
                  </td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <CancelOrderButton
                      blockId={o.blockId}
                      status={o.status}
                      cellCount={o.cells.reduce((n, c) => n + (c.span || 1) ** 2, 0)}
                    />
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loadError && (
                <tr>
                  <td colSpan={11} style={{ padding: "48px 16px", textAlign: "center", color: "#8b8b93" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No orders yet</div>
                    <div style={{ fontSize: 13 }}>Checkouts will show up here the moment someone starts one.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

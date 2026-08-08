import { query } from "../../lib/db";
import { fmt, zoneLabel } from "../../lib/zones";
import { RAINBOW_GRADIENT } from "../../lib/brand";
import CancelOrderButton from "./CancelOrderButton";
import AddPlacement from "./AddPlacement";

// Orders per page. Abandoned checkouts accumulate an order each, so this list
// grows faster than sales do and cannot show everything.
const PAGE_SIZE = 50;

// One definition, used by both the page query and the count, because two copies
// of a search rule drift and then the pager disagrees with the table.
//
// $1 is the search text. Empty matches everything.
//
// The phone clause is the awkward one. Buyers type their number every way there
// is, and the same person is stored as "0723646172" one day and "+27723646172"
// the next, so a plain ilike finds nothing when somebody searches the form they
// know. Comparing the last nine digits of each, with the punctuation stripped,
// makes 0723646172, +27 72 364 6172 and 3646172 all find the same person.
const SEARCH_WHERE = `
  $1 = ''
  or buyer_name   ilike '%' || $1 || '%'
  or buyer_email  ilike '%' || $1 || '%'
  or m_payment_id ilike '%' || $1 || '%'
  or claim_token  ilike '%' || $1 || '%'
  or (
    length(regexp_replace($1, '[^0-9]', '', 'g')) >= 6
    and right(regexp_replace(buyer_phone, '[^0-9]', '', 'g'), 9)
        like '%' || right(regexp_replace($1, '[^0-9]', '', 'g'), 9) || '%'
  )`;

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
    // `content_meta` rather than `content`: the artwork's type and message text
    // without the bytes, plus the id the preview fetches the thumbnail with.
    map.get(r.block_id).cells.push({
      id: r.id,
      col: r.col,
      row: r.row,
      span: r.span,
      content: r.content_meta,
      hasArt: r.has_art,
    });
  });
  // Already ordered by the query, which is the only thing that knows the paging
  // order. Re-sorting here would fight it.
  return [...map.values()];
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

// `content` is the artwork minus the bytes (content_meta), plus the square's id
// so the picture can be fetched rather than inlined.
//
// This used to render <img src={content.src}> straight from the database, which
// meant every print-resolution base64 data URL on the page to draw a 32px box:
// 6.66 MB of HTML for 37 squares, and it scaled with sales. The thumbnail
// endpoint serves a ~96px WebP the browser caches for a year, so the same
// preview now costs a few hundred bytes once.
function ContentPreview({ content, squareId, hasArt }) {
  if (!content) return <span style={{ color: "#4b5563" }}>-</span>;
  if (content.type === "image") {
    return hasArt ? (
      <img
        src={`/api/square/${squareId}/thumb`}
        alt="Logo"
        title="Logo"
        loading="lazy"
        style={{ width: 32, height: 32, objectFit: "contain", background: "#fff", borderRadius: 6, border: "1px solid #24405f" }}
      />
    ) : (
      <span style={{ color: "#4b5563" }} title="Artwork present but no thumbnail">image</span>
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

export default async function AdminPage({ searchParams }) {
  const sp = await searchParams;
  const q = typeof sp?.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const page = Math.max(1, Number.parseInt(sp?.page, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let orders = [];
  let matchingOrders = 0;
  let stats = { orders: 0, paid: 0, pending: 0, conflict: 0, raised: 0 };
  let loadError = "";

  try {
    // Three queries rather than one, because they answer three different
    // questions and only the middle one is affected by the search box.
    //
    // The stats are deliberately computed in SQL over every row, not summed from
    // the page. They used to be derived from whatever had been loaded, which was
    // honest only while the page held every order, and would quietly start
    // reporting the current page's total the moment this was paginated.
    const [{ rows: statRows }, { rows: pageRows }, { rows: countRows }] = await Promise.all([
      query(
        `select
           (select count(distinct block_id) from squares)::int as orders,
           (select count(distinct block_id) from squares where status='paid')::int as paid,
           (select count(distinct block_id) from squares where status='pending')::int as pending,
           (select count(distinct block_id) from squares where status='conflict')::int as conflict,
           coalesce((select sum(amt) from
             (select distinct block_id, order_amount as amt from squares where status='paid') t
           ), 0) as raised`
      ),
      query(
        `with matched as (
           select block_id, max(created_at) as ordered_at
             from squares
            where ${SEARCH_WHERE}
            group by block_id
            order by max(created_at) desc
            limit $2 offset $3
         )
         -- Every column the list renders, and none of the ones it does not.
         -- The content column is deliberately absent: it holds the print
         -- resolution artwork as a base64 data URL, and selecting it put 6.66 MB
         -- on the wire to draw 32px previews. content_meta is the same thing
         -- with the bytes taken out, and the preview loads the cached thumbnail.
         select s.id, s.block_id, s.m_payment_id, s.buyer_name, s.buyer_email,
                s.buyer_phone, s.shirt_size, s.buyer_address, s.ship_overseas,
                s.payment_method, s.placed_by, s.order_amount, s.status,
                s.created_at, s.paid_at, s.zone_id, s.col, s."row", s.span,
                s.content_meta, (s.content_thumb is not null) as has_art,
                m.ordered_at
           from squares s
           join matched m on m.block_id = s.block_id
          order by m.ordered_at desc, s."row", s.col`,
        [q, PAGE_SIZE, offset]
      ),
      query(
        `select count(*)::int as total from (
           select block_id from squares
            where ${SEARCH_WHERE}
            group by block_id
         ) t`,
        [q]
      ),
    ]);
    orders = groupByBlock(pageRows);
    matchingOrders = countRows[0]?.total ?? orders.length;
    const s = statRows[0] || {};
    stats = {
      orders: s.orders ?? 0,
      paid: s.paid ?? 0,
      pending: s.pending ?? 0,
      conflict: s.conflict ?? 0,
      raised: Number(s.raised) || 0,
    };
  } catch (e) {
    // This page is behind Basic Auth, so the real error is more use here than
    // a generic one.
    console.error("/admin:", e.message);
    loadError = e.message;
  }

  const totalPages = Math.max(1, Math.ceil(matchingOrders / PAGE_SIZE));

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

        {/* These count every order in the database, not the page, so they stay
            true whatever is being searched for or paged through. */}
        <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
          <Stat label="Orders" value={stats.orders} accent="#5f4ea1" />
          <Stat label="Paid" value={stats.paid} color="#8bf0b0" accent="#2cae4a" />
          <Stat label="Pending" value={stats.pending} color="#ffd27a" accent="#f6ea0c" />
          {stats.conflict > 0 && <Stat label="Conflicts" value={stats.conflict} color="#fdba74" accent="#f37e21" />}
          <Stat label="Raised" value={"R" + fmt(stats.raised)} color="#a5c8ff" accent="#117ec2" />
        </div>

        {/* A plain GET form, so a search is a URL that can be bookmarked, shared
            with whoever is chasing that buyer, and reloaded without re-typing. */}
        <form
          method="GET"
          style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}
        >
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, email, phone, reference or claim code"
            aria-label="Search orders"
            style={{
              flex: "1 1 320px",
              fontFamily: "inherit",
              fontSize: 14,
              padding: "11px 14px",
              borderRadius: 10,
              border: "1.5px solid #24405f",
              background: "#081120",
              color: "#eef1f6",
            }}
          />
          <button
            type="submit"
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 14,
              color: "#0a0a0c",
              background: "#a5c8ff",
              padding: "11px 20px",
              borderRadius: 999,
              border: "none",
            }}
          >
            Search
          </button>
          {q && (
            <a
              href="/admin"
              style={{ fontSize: 13.5, fontWeight: 700, color: "#8b8b93", textDecoration: "none" }}
            >
              Clear
            </a>
          )}
        </form>

        <div style={{ fontSize: 13, color: "#8b8b93", marginBottom: 14, fontWeight: 600 }}>
          {matchingOrders === 0
            ? q
              ? `Nothing matches "${q}".`
              : "No orders yet."
            : `${q ? `${matchingOrders} matching ` : `${matchingOrders} `}order${matchingOrders === 1 ? "" : "s"}, showing ${orders.length} on page ${page} of ${totalPages}.`}
        </div>

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
                        <ContentPreview key={i} content={c.content} squareId={c.id} hasArt={c.hasArt} />
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
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                      {q ? "Nothing matches that search" : "No orders yet"}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      {q
                        ? "Try part of a name, an email, a phone number or a reference."
                        : "Checkouts will show up here the moment someone starts one."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Plain links, so paging works with the keyboard, opens in a new tab and
            survives a reload, which a button posting state would not. */}
        {/* Also shown when the page number is past the end, which only happens if
            somebody edits the URL, so there is always a way back rather than an
            empty table and no navigation. */}
        {(totalPages > 1 || page > 1) && (
          <nav
            aria-label="Order pages"
            style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", marginTop: 20 }}
          >
            <PageLink q={q} page={page - 1} disabled={page <= 1}>
              &larr; Newer
            </PageLink>
            <span style={{ fontSize: 13.5, color: "#8b8b93", fontWeight: 700 }}>
              Page {page} of {totalPages}
            </span>
            <PageLink q={q} page={page + 1} disabled={page >= totalPages}>
              Older &rarr;
            </PageLink>
          </nav>
        )}
      </div>
    </div>
  );
}

function PageLink({ q, page, disabled, children }) {
  const style = {
    fontSize: 13.5,
    fontWeight: 800,
    padding: "9px 16px",
    borderRadius: 999,
    border: "1.5px solid #24405f",
    textDecoration: "none",
    color: disabled ? "#3d4756" : "#cfd0d6",
    pointerEvents: disabled ? "none" : "auto",
  };
  if (disabled) {
    return (
      <span aria-disabled="true" style={style}>
        {children}
      </span>
    );
  }
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return (
    <a href={`/admin${qs ? `?${qs}` : ""}`} style={style}>
      {children}
    </a>
  );
}

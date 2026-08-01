import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "../../../../lib/db";
import { fmt, zoneLabel } from "../../../../lib/zones";
import { RAINBOW_GRADIENT } from "../../../../lib/brand";

// Everything about one order on one page.
//
// The list view is built for scanning 500 rows, so it necessarily truncates.
// This is what you open when you are actually fulfilling: the full artwork at
// print resolution, every cell, the buyer's details, and the payment trail.
//
// Covered by the same Basic Auth as /admin, since middleware matches /admin/:path*.
export const dynamic = "force-dynamic";

const label = { fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#8b8b93", fontWeight: 800, marginBottom: 4 };
const value = { fontSize: 15, color: "#eef1f6", fontWeight: 600, lineHeight: 1.45 };
const card = { background: "#10203a", border: "1px solid #24405f", borderRadius: 16, padding: "18px 20px" };

function Field({ k, v, mono }) {
  return (
    <div>
      <div style={label}>{k}</div>
      <div style={{ ...value, ...(mono ? { fontFamily: "ui-monospace,monospace", fontSize: 13 } : {}) }}>
        {v || <span style={{ color: "#4b5563" }}>-</span>}
      </div>
    </div>
  );
}

export default async function OrderDetail({ params }) {
  const { reference } = await params;
  if (!/^[a-f0-9]{20}$/i.test(reference)) notFound();

  const { rows } = await query(
    `select * from squares where m_payment_id = $1 order by "row", col`,
    [reference]
  );
  if (rows.length === 0) notFound();

  const o = rows[0];
  const amount = Number(o.order_amount) || 0;
  const when = (d) => (d ? new Date(d).toLocaleString("en-GB") : null);

  return (
    <div style={{ minHeight: "100vh", padding: "40px 24px 60px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Link href="/admin" style={{ fontSize: 13, fontWeight: 700, color: "#8b8b93" }}>
          &larr; All orders
        </Link>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 800, letterSpacing: ".18em", textTransform: "uppercase", color: "#8b8b93", margin: "18px 0 12px" }}>
          <span style={{ width: 26, height: 3, borderRadius: 2, background: RAINBOW_GRADIENT }} />
          Order · {o.status}
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-.02em" }}>
          {o.buyer_name || "Unnamed buyer"}
        </h1>
        <p style={{ color: "#8b8b93", margin: "0 0 26px", fontSize: 15 }}>
          {rows.length} {rows.length === 1 ? "square" : "squares"} on the{" "}
          {zoneLabel(o.zone_id)}, R{fmt(amount)}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginBottom: 18 }}>
          <div style={card}>
            <div style={{ display: "grid", gap: 14 }}>
              <Field k="Email" v={o.buyer_email} />
              <Field k="Phone" v={o.buyer_phone} />
              <Field k="Shirt size" v={o.shirt_size} />
            </div>
          </div>
          <div style={card}>
            <div style={{ display: "grid", gap: 14 }}>
              {/* The whole point of the fulfilment view: collection or postage,
                  answered before you read the address. */}
              <Field
                k="Handover"
                v={
                  o.ship_overseas
                    ? "POST OVERSEAS"
                    : o.buyer_address
                    ? "Collection in person"
                    : "No address given yet"
                }
              />
              <Field k="Address" v={o.buyer_address} />
              <Field k="Details given" v={when(o.details_completed_at)} />
            </div>
          </div>
          <div style={card}>
            <div style={{ display: "grid", gap: 14 }}>
              <Field k="Reference" v={o.m_payment_id} mono />
              <Field k="Netcash trace" v={o.pf_payment_id} mono />
              <Field k="Started" v={when(o.created_at)} />
              <Field k="Paid" v={when(o.paid_at)} />
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "26px 0 12px" }}>
          Artwork ({rows.length})
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
          {rows.map((r) => (
            <div key={r.id} style={card}>
              <div style={{ ...label, marginBottom: 8 }}>
                {zoneLabel(r.zone_id)} · ({r.col},{r.row}){r.span > 1 ? ` · ${r.span}x${r.span}` : ""}
              </div>
              {/* Print resolution, straight from `content`, not the board's
                  thumbnail. This is the file that goes to the printer. */}
              {r.content?.type === "image" ? (
                <>
                  <img
                    src={r.content.src}
                    alt="Artwork"
                    style={{ display: "block", width: "100%", background: "#fff", borderRadius: 10, border: "1px solid #24405f" }}
                  />
                  <a
                    href={`/api/square/${r.id}/art`}
                    download
                    style={{ display: "inline-block", marginTop: 10, fontSize: 12.5, fontWeight: 700, color: "#a5c8ff" }}
                  >
                    Download full size
                  </a>
                </>
              ) : r.content?.type === "text" ? (
                <div style={{ fontSize: 15, fontStyle: "italic", color: "#cfd0d6", lineHeight: 1.4, overflowWrap: "break-word" }}>
                  &quot;{r.content.text}&quot;
                </div>
              ) : (
                <div style={{ color: "#4b5563", fontSize: 13 }}>No artwork on this cell</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

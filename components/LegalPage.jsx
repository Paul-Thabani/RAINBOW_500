import Link from "next/link";
import Crest from "./Crest";
import { RAINBOW_GRADIENT, RAINBOW_STOPS } from "../lib/brand";

// Shared shell for /terms and /privacy. Deliberately plain: these pages exist
// to be read and to be found, not to sell anything, so they get the brand's
// colours and none of its animation.
//
// The entity details in the footer are the ECTA s43 disclosure. They belong on
// every legal page rather than only on one, because either page may be the one
// a supporter lands on from a search result.
export const ENTITY = {
  supplier: "HBUFC Trading (Pty) Ltd",
  reg: "2021/484119/07",
  trust: "Hout Bay United Football Community (HBUFC) Trust",
  npo: "165 406",
  address: "The Dream Factory, 6 Riverside Terrace, Hout Bay, Cape Town, 7806, South Africa",
  email: "info@hbufc.co.za",
  phone: "+27 71 144 8778",
};

const link = { color: "#a5c8ff", textDecoration: "underline", textUnderlineOffset: 3 };

export function P({ children }) {
  return <p style={{ margin: "0 0 16px", fontSize: 16, lineHeight: 1.65, color: "#c9cbd4" }}>{children}</p>;
}

export function H({ children, id }) {
  return (
    <h2
      id={id}
      style={{
        margin: "38px 0 14px",
        fontSize: 20,
        fontWeight: 900,
        letterSpacing: "-.01em",
        color: "#eef1f6",
        scrollMarginTop: 24,
      }}
    >
      {children}
    </h2>
  );
}

export function UL({ children }) {
  return (
    <ul style={{ margin: "0 0 16px", paddingLeft: 22, fontSize: 16, lineHeight: 1.65, color: "#c9cbd4" }}>
      {children}
    </ul>
  );
}

export function A({ href, children }) {
  return (
    <a href={href} style={link}>
      {children}
    </a>
  );
}

export function Rows({ pairs }) {
  return (
    <div
      style={{
        border: "1px solid #24405f",
        borderRadius: 14,
        background: "#10203a",
        padding: "6px 18px",
        margin: "0 0 20px",
      }}
    >
      {pairs.map(([k, v], i) => (
        <div
          key={k}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            padding: "12px 0",
            borderTop: i === 0 ? "none" : "1px solid #1a3050",
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          <div style={{ minWidth: 170, color: "#8b8b93", fontWeight: 700 }}>{k}</div>
          <div style={{ flex: "1 1 240px", color: "#eef1f6" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

export default function LegalPage({ title, updated, intro, children }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "34px 22px 70px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 30 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flex: "none" }}>
          <Crest size={34} />
        </div>
        <Link href="/" style={{ fontWeight: 900, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", color: "#eef1f6" }}>
          Hout Bay United FC
        </Link>
      </div>

      <span style={{ display: "block", width: 54, height: 4, borderRadius: 2, background: RAINBOW_GRADIENT, marginBottom: 20 }} />
      <h1 style={{ fontSize: "clamp(30px,5vw,44px)", fontWeight: 900, margin: "0 0 8px", letterSpacing: "-.02em" }}>{title}</h1>
      <div style={{ color: "#8b8b93", fontSize: 13.5, fontWeight: 700, marginBottom: 26 }}>Last updated {updated}</div>

      {intro}
      {children}

      <H id="who-we-are">Who you are dealing with</H>
      <P>
        This is the information a supplier must give you under section 43 of the Electronic
        Communications and Transactions Act.
      </P>
      <Rows
        pairs={[
          ["Supplier", `${ENTITY.supplier} (registration ${ENTITY.reg})`],
          ["Owned by", `${ENTITY.trust}, NPO ${ENTITY.npo}`],
          ["Address", ENTITY.address],
          ["Email", <A href={`mailto:${ENTITY.email}`}>{ENTITY.email}</A>],
          ["Phone", <A href={`tel:${ENTITY.phone.replace(/\s/g, "")}`}>{ENTITY.phone}</A>],
          ["Website", <A href="https://hbufc.co.za">hbufc.co.za</A>],
          ["Payments processed by", "Netcash (Pay Now)"],
        ]}
      />
      <P>
        The Legacy 500 is sold by {ENTITY.supplier}, the trading company owned by{" "}
        {ENTITY.trust}. Your contract is with the trading company, because that is who receives
        your payment. The proceeds fund the club.
      </P>

      <div style={{ display: "flex", marginTop: 44, borderRadius: 2, overflow: "hidden" }}>
        {RAINBOW_STOPS.map((c) => (
          <span key={c} style={{ flex: 1, height: 4, background: c }} />
        ))}
      </div>
      <div style={{ marginTop: 20, display: "flex", gap: 18, flexWrap: "wrap", fontSize: 14, fontWeight: 700 }}>
        <Link href="/" style={link}>
          Back to the Legacy 500
        </Link>
        <Link href="/terms" style={link}>
          Terms
        </Link>
        <Link href="/privacy" style={link}>
          Privacy
        </Link>
      </div>
    </div>
  );
}

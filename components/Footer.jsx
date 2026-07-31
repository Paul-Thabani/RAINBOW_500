import Link from "next/link";
import Crest from "./Crest";
import { ENTITY } from "./LegalPage";

const linkStyle = { color: "#cfd0d6", textDecoration: "underline", textUnderlineOffset: 3 };

// Only accounts confirmed to exist. The club's own site links two that do not:
// an Instagram handle that returns "Profile isn't available" and a second
// Facebook URL that resolves to a bare "Facebook" page rather than the club's.
// Both were checked by loading them in a real browser, because Facebook and
// Instagram answer 200 to a plain fetch whether the profile exists or not.
const SOCIAL = [
  ["Instagram", "https://www.instagram.com/houtbayunitedfc"],
  ["Facebook", "https://www.facebook.com/HoutbayUnitedFC"],
  ["X", "https://x.com/HoutBayUnitedfc"],
  ["YouTube", "https://www.youtube.com/@houtbayunitedfc"],
  ["LinkedIn", "https://www.linkedin.com/company/hout-bay-united-football-community/"],
];

// The page used to contain three links and all three were in-page anchors, so a
// supporter about to spend R2,000 could not click through to the club, could not
// find terms, and could not find anybody to email. A site that takes money and
// links nowhere is the pattern people have been taught to distrust, and it was
// the single biggest reason this page read as untrustworthy.
//
// The entity line is here rather than only on the legal pages because most people
// will never open those, and "who is actually taking my money" is a fair question
// to be able to answer from the page you are paying on.
export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #1a3050", padding: "34px 0 54px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 22,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flex: "none" }}>
            <Crest size={34} />
          </div>
          <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase" }}>
            Hout Bay United FC
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: 13.5, fontWeight: 700 }}>
          <a href="https://hbufc.co.za" style={linkStyle}>
            hbufc.co.za
          </a>
          <a href={`mailto:${ENTITY.email}`} style={linkStyle}>
            {ENTITY.email}
          </a>
          <a href={`tel:${ENTITY.phone.replace(/\s/g, "")}`} style={linkStyle}>
            {ENTITY.phone}
          </a>
          <Link href="/terms" style={linkStyle}>
            Terms
          </Link>
          <Link href="/privacy" style={linkStyle}>
            Privacy
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13, fontWeight: 700 }}>
        {SOCIAL.map(([name, href]) => (
          <a key={name} href={href} rel="me noopener" style={{ ...linkStyle, color: "#8b8b93" }}>
            {name}
          </a>
        ))}
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 12.5,
          lineHeight: 1.6,
          color: "#6b7280",
          maxWidth: 720,
        }}
      >
        The Legacy 500 is sold by {ENTITY.supplier}, registration {ENTITY.reg}, the trading company
        owned by {ENTITY.trust}, NPO {ENTITY.npo}. {ENTITY.address}. Payments are processed securely
        by Netcash. Proceeds fund the club.
      </div>
    </footer>
  );
}

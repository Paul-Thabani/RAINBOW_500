import { RAINBOW_GRADIENT } from "../lib/brand";

const DIGITAL = [
  { big: "468,228", small: "Search impressions" },
  { big: "34,952", small: "Search clicks" },
  { big: "10,852", small: "Website visitors" },
  { big: "~27,000", small: "Page views" },
];

const AUDIENCE = [
  { big: "97%", small: "South African", color: "#2cae4a" },
  { big: "82%", small: "Mobile users", color: "#117ec2" },
  { big: "7.5%", small: "Search CTR · 3× industry avg", color: "#e41f91" },
];

const SOCIAL = [
  { big: "34M+", small: "Total views" },
  { big: "899K", small: "Total likes" },
  { big: "24,000+", small: "New followers" },
  { big: "12.9M", small: "Peak month · Apr '26", color: "#f59e0b" },
];

export default function ReachStats() {
  return (
    <section id="reach" style={{ padding: "64px 0 8px" }}>
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
        The reach
      </div>
      <h2
        style={{
          fontSize: "clamp(28px,4vw,50px)",
          fontWeight: 900,
          letterSpacing: "-.02em",
          lineHeight: 1.02,
          margin: "0 0 12px",
          textTransform: "uppercase",
        }}
      >
        Your square reaches further than you think.
      </h2>
      <p style={{ fontSize: 16, color: "#8b8b93", maxWidth: 640, margin: "0 0 34px", lineHeight: 1.55 }}>
        We&apos;re not on TV, but we&apos;ve built one of the most cost-effective community sports
        audiences in the Western Cape.
      </p>

      <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "#6d6d76", fontWeight: 800, marginBottom: 14 }}>
        Digital reach · Jan-Jun 2026
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 16 }}>
        {DIGITAL.map((d) => (
          <div key={d.small} style={{ background: "#10203a", border: "1px solid #24405f", borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-.02em", color: "#f59e0b" }}>{d.big}</div>
            <div style={{ fontSize: 12, color: "#8b8b93", fontWeight: 700, marginTop: 4 }}>{d.small}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 40 }}>
        {AUDIENCE.map((d) => (
          <div key={d.small} style={{ background: "#10203a", border: "1px solid #24405f", borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: d.color }}>{d.big}</div>
            <div style={{ fontSize: 12, color: "#8b8b93", fontWeight: 700, marginTop: 4 }}>{d.small}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "#6d6d76", fontWeight: 800, marginBottom: 14 }}>
        Social reach · seven months
      </div>
      <div
        style={{
          background: "linear-gradient(120deg,rgba(235,43,41,.12),rgba(17,126,194,.1),rgba(228,31,145,.14))",
          border: "1px solid #24405f",
          borderRadius: 20,
          padding: 32,
        }}
      >
        <h3 style={{ fontSize: "clamp(24px,3.4vw,38px)", fontWeight: 900, letterSpacing: "-.02em", margin: "0 0 24px", textTransform: "uppercase" }}>
          34M+ views in seven months.
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
          {SOCIAL.map((d) => (
            <div key={d.small}>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-.02em", color: d.color }}>{d.big}</div>
              <div style={{ fontSize: 12, color: "#b9bac2", fontWeight: 700, marginTop: 4 }}>{d.small}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

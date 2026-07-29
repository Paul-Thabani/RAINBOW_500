import { RAINBOW_GRADIENT } from "../lib/brand";

const IMPACT = [
  { t: "Nutrition", color: "#eb2b29", d: "Fuelling young athletes to compete at the highest level." },
  { t: "Education", color: "#f6ea0c", d: "Opportunity on and off the field, for life after the game." },
  { t: "Safe Housing", color: "#117ec2", d: "Stability for the players who carry our community's hopes." },
  { t: "Local Manufacture", color: "#e41f91", d: "A local manufacturer making our shirt: money that stays home." },
];

export default function Impact() {
  return (
    <section id="impact" style={{ padding: "64px 0 8px" }}>
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
        Where every rand goes
      </div>
      <h2
        style={{
          fontSize: "clamp(28px,4vw,50px)",
          fontWeight: 900,
          letterSpacing: "-.02em",
          lineHeight: 1.02,
          margin: "0 0 34px",
          textTransform: "uppercase",
        }}
      >
        Straight back into the team.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {IMPACT.map((f) => (
          <div
            key={f.t}
            style={{ background: "#10203a", border: "1px solid #24405f", borderRadius: 18, padding: 24 }}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: f.color, marginBottom: 18 }} />
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-.01em", textTransform: "uppercase", marginBottom: 8 }}>
              {f.t}
            </div>
            <div style={{ color: "#8b8b93", fontSize: 14, lineHeight: 1.55 }}>{f.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

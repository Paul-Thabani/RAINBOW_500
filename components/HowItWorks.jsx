import { fmt } from "../lib/useRainbow500";

const RAINBOW_GRADIENT =
  "linear-gradient(90deg,#e11d48,#f97316,#eab308,#16a34a,#0ea5e9,#6366f1,#a855f7)";

export default function HowItWorks({ price, blockPrice }) {
  const steps = [
    { n: "1", color: "#e11d48", t: "Open the shirt", d: "Scroll to the shirt and find an open square or block." },
    { n: "2", color: "#16a34a", t: "Pick a square or block", d: `One square is R${fmt(price)}, a block of four is R${fmt(blockPrice)}.` },
    { n: "3", color: "#0ea5e9", t: "Add your collateral", d: "Logo, message or doodle, or one big piece across the block." },
    { n: "4", color: "#a855f7", t: "Secure & renew", d: "Light up the live tracker: your square is yours for life." },
  ];

  return (
    <section id="how" style={{ padding: "64px 0 8px" }}>
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
        How it works
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
        Four steps to get on the shirt.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {steps.map((s) => (
          <div key={s.n} style={{ background: "#10203a", border: "1px solid #24405f", borderRadius: 18, padding: 22 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "#0a0a0c",
                background: s.color,
                marginBottom: 16,
              }}
            >
              {s.n}
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{s.t}</div>
            <div style={{ color: "#8b8b93", fontSize: 14, lineHeight: 1.5 }}>{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

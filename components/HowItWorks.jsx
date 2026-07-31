import { fmt } from "../lib/useRainbow500";
import { RAINBOW_GRADIENT } from "../lib/brand";

export default function HowItWorks({ price, blockPrice }) {
  const steps = [
    { n: "1", color: "#eb2b29", t: "Open the shirt", d: "Scroll to the shirt and find an open square or block." },
    { n: "2", color: "#2cae4a", t: "Pick a square or block", d: `One square is R${fmt(price)}, a block of four is R${fmt(blockPrice)}.` },
    { n: "3", color: "#117ec2", t: "Add your artwork", d: "A logo, a message, a doodle or an autograph, or one big piece across the block." },
    { n: "4", color: "#e41f91", t: "Secure and renew", d: "Light up the live tracker. The square stays yours for as long as you renew it." },
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
      <div className="rb-grid-4" style={{ gap: 16 }}>
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

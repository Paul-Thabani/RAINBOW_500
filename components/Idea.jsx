import { fmt } from "../lib/useRainbow500";
import { RAINBOW_GRADIENT, RAINBOW_INK_GRADIENT } from "../lib/brand";

export default function Idea({ price, total }) {
  return (
    <section id="idea" style={{ padding: "64px 0 8px" }}>
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
        02 · The idea
      </div>
      <h2
        style={{
          fontSize: "clamp(28px,4vw,50px)",
          fontWeight: 900,
          letterSpacing: "-.02em",
          lineHeight: 1.02,
          margin: "0 0 36px",
          textTransform: "uppercase",
        }}
      >
        One shirt. Ten times the impact.
      </h2>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 28 }}>
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#8b8b93",
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            Normally raises
          </div>
          <div
            style={{
              fontSize: "clamp(34px,5vw,58px)",
              fontWeight: 900,
              letterSpacing: "-.02em",
              color: "#4a4a52",
              textDecoration: "line-through",
            }}
          >
            R100,000
          </div>
        </div>
        <div style={{ fontSize: 34, color: "#5a5a63", fontWeight: 900 }}>→</div>
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: ".16em",
              textTransform: "uppercase",
              color: "#8b8b93",
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            The Legacy 500 raises
          </div>
          <div
            style={{
              fontSize: "clamp(44px,7vw,84px)",
              fontWeight: 900,
              letterSpacing: "-.03em",
              lineHeight: 1,
              background: RAINBOW_INK_GRADIENT,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            R1,000,000
          </div>
        </div>
      </div>
      <p style={{ fontSize: 16, color: "#8b8b93", margin: "26px 0 0", fontWeight: 600 }}>
        Real money from real people, going straight to the players.
      </p>
      <p style={{ fontSize: 14, color: "#6d6d76", margin: "10px 0 0", maxWidth: 560, lineHeight: 1.55 }}>
        The maths is simple: {fmt(total)} squares on one shirt, R{fmt(price)} each, no sponsor required.
      </p>
    </section>
  );
}

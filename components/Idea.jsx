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
              // 2.08:1 before, the worst contrast on the page. The strikethrough is
                // what says "this is the lesser number", so this does not also need
                // to be near-invisible to make the point, and the two figures side
                // by side are the clearest thing on the page for somebody who does
                // not read much English. Still plainly subordinate: smaller than
                // the R1,000,000, struck through, and dimmer than its 4.54:1
                // rainbow.
                color: "#6c6c73",
              textDecoration: "line-through",
            }}
          >
            R100,000
          </div>
        </div>
        {/* 2.68:1 before. The arrow carries the comparison, so it should be
            readable even though it is not the point of the section. */}
        <div style={{ fontSize: 34, color: "#6c6c74", fontWeight: 900 }}>→</div>
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
      <p style={{ fontSize: 14, color: "#818188", margin: "10px 0 0", maxWidth: 560, lineHeight: 1.55 }}>
        The maths is simple: {fmt(total)} squares on one shirt, R{fmt(price)} each, no sponsor required.
      </p>
    </section>
  );
}

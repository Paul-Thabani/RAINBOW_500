import { fmt, zonesFor } from "../lib/useRainbow500";
import ShirtPanel from "./ShirtPanel";
import DesignNote from "./DesignNote";
import { RAINBOW_GRADIENT, BUTTON_SURFACE, BUTTON_INK } from "../lib/brand";

const FRONT_ZONES = zonesFor("front");
const BACK_ZONES = zonesFor("back");

function segStyle(active) {
  return {
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: 13,
    border: "none",
    padding: "8px 14px",
    borderRadius: 999,
    background: active ? "#12151c" : "transparent",
    color: active ? "#fff" : "#6b7280",
  };
}

export default function KitSection({
  spotSize,
  setSize1,
  setSize4,
  price,
  blockPrice,
  reserved,
  hover,
  onHover,
  onLeave,
  onPick,
  pickForMe,
}) {
  return (
    <section id="kit" style={{ padding: "64px 0 8px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
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
              marginBottom: 16,
            }}
          >
            <span style={{ width: 26, height: 3, borderRadius: 2, background: RAINBOW_GRADIENT }} />
            Join the Legacy 500
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,50px)", fontWeight: 900, margin: 0, letterSpacing: "-.02em", textTransform: "uppercase", lineHeight: 1.02 }}>
            Claim your square.
          </h2>
          <p style={{ margin: "10px 0 0", color: "#8b8b93", fontSize: 16, maxWidth: 560, lineHeight: 1.55 }}>
            First choose one square or a block of four. Then either tap an empty square on the shirt,
            or press <strong style={{ color: "#cfd0d6" }}>Pick one for me</strong> and we choose a free
            one for you. Empty squares have a dotted outline.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          background: "#10203a",
          border: "1px solid #24405f",
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <span style={{ fontWeight: 800, color: "#e7e7ea", fontSize: 15 }}>Choose:</span>
        <div style={{ display: "inline-flex", background: "#081120", border: "1px solid #24405f", borderRadius: 999, padding: 4 }}>
          <button type="button" onClick={setSize1} style={segStyle(spotSize === 1)}>
            1 square · R{fmt(price)}
          </button>
          <button type="button" onClick={setSize4} style={segStyle(spotSize === 4)}>
            Block of 4 · R{fmt(blockPrice)}
          </button>
        </div>

        {/* The other way in. Hunting for a specific 16.5 x 9.5 px square is a
            poor primary path on a phone, and most buyers do not mind which
            square they get. This picks a free one at random and opens the
            editor on it, so the tiny target stops being the only route. */}
        <button
          type="button"
          onClick={pickForMe}
          className="rb-pick-btn"
          style={{
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: 13.5,
            letterSpacing: ".01em",
            color: BUTTON_INK,
            background: BUTTON_SURFACE,
            padding: "10px 16px",
            borderRadius: 999,
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          Pick one for me
          <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1, opacity: 0.85 }}>
            &rarr;
          </span>
        </button>
      </div>

      {/* Only rendered on a device with no hover, so it never shows on desktop.
          Touch users get no hover highlight at all, which left the grid with no
          affordance saying it could be tapped. See .rb-touch-hint. */}
      <p
        className="rb-touch-hint"
        style={{ margin: "0 0 14px", color: "#8b8b93", fontSize: 14, lineHeight: 1.5, textAlign: "center" }}
      >
        Pinch to zoom in on the shirt, then tap the square you want.
      </p>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Stacks below 900px, see .rb-kit-panels. Inline styles cannot hold a
            media query, so this one has to be a class. */}
        <div className="rb-kit-panels">
          <ShirtPanel
            zones={FRONT_ZONES}
            src="/assets/kit-customise.png"
            label="Front"
            reserved={reserved}
            interactive
            hover={hover}
            onHover={onHover}
            onLeave={onLeave}
            onPick={onPick}
          />
          <ShirtPanel
            zones={BACK_ZONES}
            src="/assets/kit-back.png"
            label="Back"
            reserved={reserved}
            interactive
            hover={hover}
            onHover={onHover}
            onLeave={onLeave}
            onPick={onPick}
          />
        </div>
      </div>

      <DesignNote />
    </section>
  );
}

import { fmt, zonesFor } from "../lib/useRainbow500";
import ShirtPanel from "./ShirtPanel";
import DesignNote from "./DesignNote";

const FRONT_ZONES = zonesFor("front");
const BACK_ZONES = zonesFor("back");

const RAINBOW_GRADIENT =
  "linear-gradient(90deg,#e11d48,#f97316,#eab308,#16a34a,#0ea5e9,#6366f1,#a855f7)";

function tabStyle(active) {
  return {
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: 14,
    border: "none",
    padding: "9px 18px",
    borderRadius: 999,
    background: active ? "#12151c" : "transparent",
    color: active ? "#fff" : "#6b7280",
    transition: "all .15s ease",
  };
}

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
  mode,
  setPreview,
  setCustomise,
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
}) {
  const isCustomise = mode === "customise";

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
            03 · Join the Rainbow 500
          </div>
          <h2 style={{ fontSize: "clamp(28px,4vw,50px)", fontWeight: 900, margin: 0, letterSpacing: "-.02em", textTransform: "uppercase", lineHeight: 1.02 }}>
            Claim your square.
          </h2>
          <p style={{ margin: "10px 0 0", color: "#8b8b93", fontSize: 16, maxWidth: 560, lineHeight: 1.55 }}>
            Switch to <strong style={{ color: "#fff" }}>Customise</strong>, choose a single square or a
            block of four, then click an open place on the shirt to make it yours, for life.
          </p>
        </div>
        <div style={{ display: "inline-flex", background: "#12233f", border: "1px solid #24405f", borderRadius: 999, padding: 4 }}>
          <button type="button" onClick={setPreview} style={tabStyle(!isCustomise)}>
            Finished vision
          </button>
          <button type="button" onClick={setCustomise} style={tabStyle(isCustomise)}>
            Customise
          </button>
        </div>
      </div>

      {isCustomise && (
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
          <span style={{ fontWeight: 800, color: "#e7e7ea", fontSize: 15 }}>Reserve:</span>
          <div style={{ display: "inline-flex", background: "#081120", border: "1px solid #24405f", borderRadius: 999, padding: 4 }}>
            <button type="button" onClick={setSize1} style={segStyle(spotSize === 1)}>
              1 square · R{fmt(price)}
            </button>
            <button type="button" onClick={setSize4} style={segStyle(spotSize === 4)}>
              Block of 4 · R{fmt(blockPrice)}
            </button>
          </div>
          <span style={{ fontSize: 13, color: "#8b8b93", fontWeight: 600, flex: 1, minWidth: 220 }}>
            A block is 2×2 adjacent squares. Add four pieces, or one piece 4× the size. Click an open
            place on the shirt.
          </span>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {isCustomise ? (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
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
        ) : (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ position: "relative", width: "100%", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                <img
                  src="/assets/kit-finished-front-boxed.png?v=1"
                  alt="Front"
                  draggable={false}
                  style={{ display: "block", width: "100%", height: "auto", userSelect: "none", pointerEvents: "none" }}
                />
              </div>
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8b93", fontWeight: 800 }}>
                Front
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ position: "relative", width: "100%", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
                <img
                  src="/assets/kit-finished-back-boxed.png?v=1"
                  alt="Back"
                  draggable={false}
                  style={{ display: "block", width: "100%", height: "auto", userSelect: "none", pointerEvents: "none" }}
                />
              </div>
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8b93", fontWeight: 800 }}>
                Back
              </div>
            </div>
          </div>
        )}
      </div>

      <DesignNote />
    </section>
  );
}

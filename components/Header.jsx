import Crest from "./Crest";

const RAINBOW_GRADIENT =
  "linear-gradient(90deg,#e11d48,#f97316,#eab308,#16a34a,#0ea5e9,#6366f1,#a855f7)";

export default function Header({ onJoin }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "22px 0",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", flex: "none" }}>
          <Crest size={42} />
        </div>
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontWeight: 900, letterSpacing: ".08em", fontSize: 15, textTransform: "uppercase" }}>
            Hout Bay United FC
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#8b8b93",
              letterSpacing: ".2em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            The Next Chapter · 2026/27
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
        <a href="#idea" style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".04em", color: "#cfd0d6" }}>
          The idea
        </a>
        <a href="#impact" style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".04em", color: "#cfd0d6" }}>
          Where it goes
        </a>
        <a href="#reach" style={{ fontWeight: 700, fontSize: 13, letterSpacing: ".04em", color: "#cfd0d6" }}>
          The reach
        </a>
        <button
          type="button"
          onClick={onJoin}
          style={{
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: ".04em",
            color: "#0a0a0c",
            background: RAINBOW_GRADIENT,
            padding: "11px 18px",
            borderRadius: 999,
            border: "none",
          }}
        >
          Join the Rainbow 500
        </button>
      </div>
    </header>
  );
}

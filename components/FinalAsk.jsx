import { fmt } from "../lib/useRainbow500";

export default function FinalAsk({ onJoin, price }) {
  return (
    <section
      style={{
        margin: "64px 0 60px",
        background: "#10203a",
        border: "1px solid #24405f",
        borderRadius: 24,
        position: "relative",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.4fr)",
      }}
    >
      <div style={{ position: "relative", minHeight: 420 }}>
        <img
          src="/assets/deck-player.jpg"
          alt="HBUFC coach with the club corner flag, crest and rainbow ring visible"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "58% 42%" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(16,32,58,0) 55%, rgba(16,32,58,.95))",
          }}
        />
      </div>
      <div style={{ position: "relative", padding: "56px 48px", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg,rgba(235,43,41,.14),rgba(243,126,33,.12),rgba(246,234,12,.1),rgba(44,174,74,.12),rgba(17,126,194,.14),rgba(95,78,161,.16),rgba(228,31,145,.2))",
            opacity: 0.7,
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#c7c8d0", marginBottom: 16 }}>
            The ask
          </div>
          <h2
            style={{
              fontSize: "clamp(30px,4.4vw,58px)",
              fontWeight: 900,
              letterSpacing: "-.02em",
              lineHeight: 1,
              margin: "0 0 16px",
              textTransform: "uppercase",
              maxWidth: 520,
            }}
          >
            The goal really is love.
          </h2>
          <p style={{ color: "#c7ccd4", fontSize: 17, maxWidth: 480, margin: "0 0 28px", lineHeight: 1.55 }}>
            We&apos;re not asking you to buy a shirt. We&apos;re asking you to help build something that
            gives back, and prove a community club can win the right way.
          </p>
          <button
            type="button"
            onClick={onJoin}
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 17,
              color: "#0a0a0c",
              background: "#fff",
              border: "none",
              padding: "16px 32px",
              borderRadius: 999,
            }}
          >
            Join the Legacy 500 · R{fmt(price)}
          </button>
        </div>
      </div>
    </section>
  );
}

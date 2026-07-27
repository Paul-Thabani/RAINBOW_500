const RAINBOW_GRADIENT =
  "linear-gradient(90deg,#e11d48,#f97316,#eab308,#16a34a,#0ea5e9,#6366f1,#a855f7)";

export default function Hero({ onJoin, onGoTracker, goalLabel, claimed }) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "1.05fr .95fr",
        gap: 48,
        alignItems: "center",
        padding: "44px 0 56px",
      }}
    >
      <div style={{ animation: "floatIn .5s ease both" }}>
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
            marginBottom: 22,
          }}
        >
          <span style={{ width: 26, height: 3, borderRadius: 2, background: RAINBOW_GRADIENT }} />
          A community club, flipping the script
        </div>
        <h1
          style={{
            fontSize: "clamp(54px,8vw,104px)",
            lineHeight: 0.9,
            margin: "0 0 20px",
            letterSpacing: "-.02em",
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          The Goal
          <br />
          Is Love
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: "#b9bac2", maxWidth: 500, margin: "0 0 30px" }}>
          A community club chasing professional football with a brilliant young local team. This season,
          we&apos;re flipping the script: one shirt, split into <strong style={{ color: "#fff" }}>500 squares</strong>,
          to raise <strong style={{ color: "#fff" }}>R1,000,000  </strong>  for the players who carry our community&apos;s
          hopes.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 34 }}>
          <button
            type="button"
            onClick={onJoin}
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 16,
              color: "#0a0a0c",
              background: RAINBOW_GRADIENT,
              padding: "15px 26px",
              borderRadius: 999,
              border: "none",
            }}
          >
            Join the Rainbow 500
          </button>
          <button
            type="button"
            onClick={onGoTracker}
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 16,
              color: "#fff",
              background: "transparent",
              border: "1.5px solid #35353d",
              padding: "15px 26px",
              borderRadius: 999,
            }}
          >
            See the fill tracker
          </button>
        </div>
        <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-.01em" }}>500</div>
            <div style={{ fontSize: 11, color: "#8b8b93", letterSpacing: ".14em", textTransform: "uppercase", marginTop: 2 }}>
              Squares
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                letterSpacing: "-.01em",
                background: RAINBOW_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {goalLabel}
            </div>
            <div style={{ fontSize: 11, color: "#8b8b93", letterSpacing: ".14em", textTransform: "uppercase", marginTop: 2 }}>
              The goal
            </div>
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-.01em", color: "#f59e0b" }}>{claimed}</div>
            <div style={{ fontSize: 11, color: "#8b8b93", letterSpacing: ".14em", textTransform: "uppercase", marginTop: 2 }}>
              Claimed so far
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: "-12% -8%",
            background:
              "radial-gradient(circle at 50% 40%, rgba(168,85,247,.22), rgba(14,165,233,.14) 45%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
        <div
          style={{
            position: "relative",
            background: "#10203a",
            borderRadius: 22,
            padding: 18,
            border: "1px solid #24405f",
          }}
        >
          <img
            src="/assets/kit-finished-front.png?v=10"
            alt="HBUFC The Goal is Love kit, front (the finished vision)"
            style={{ display: "block", width: "94%", height: "auto", margin: "0 auto" }}
          />
          <div
            style={{
              textAlign: "center",
              marginTop: 12,
              fontSize: 11,
              color: "#8b8b93",
              letterSpacing: ".14em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            The 2026/27 shirt · the finished vision
          </div>
        </div>
      </div>
    </section>
  );
}

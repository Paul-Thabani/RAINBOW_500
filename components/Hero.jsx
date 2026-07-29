import { fmt } from "../lib/useRainbow500";
import { RAINBOW_GRADIENT, RAINBOW_SURFACE, RAINBOW_SURFACE_INK } from "../lib/brand";

export default function Hero({ onJoin, goalLabel, claimed, total, price }) {
  const left = total - claimed;

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
          Rainbow
          <br />
          500
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: "#b9bac2", maxWidth: 500, margin: "0 0 30px" }}>
          One shirt, split into <strong style={{ color: "#fff" }}>{total} squares</strong>. Claim a square
          from <strong style={{ color: "#fff" }}>R{fmt(price)}</strong>, put your name, logo or doodle on the
          kit - and get the shirt free.
        </p>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 22 }}>
          <button
            type="button"
            onClick={onJoin}
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 16,
              color: RAINBOW_SURFACE_INK,
              background: RAINBOW_SURFACE,
              padding: "15px 26px",
              borderRadius: 999,
              border: "none",
            }}
          >
            Claim your square - R{fmt(price)}
          </button>
          <span style={{ color: "#8b8b93", fontWeight: 700, fontSize: 15 }}>{left} squares left</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 34 }}>
          <div
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: 10,
              background: RAINBOW_SURFACE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              color: RAINBOW_SURFACE_INK,
            }}
          >
            ★
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.5, color: "#b9bac2", maxWidth: 460 }}>
            {/* Explicit {" "} because JSX trims whitespace at the start of a
                line, so the space after </strong> was being swallowed and it
                rendered as "free shirt.Once your purchase". Same reason
                Belief.jsx and FabricCTA.jsx use this pattern. */}
            <strong style={{ color: "#fff" }}>Every square includes a free shirt.</strong>{" "}
            Once your purchase is confirmed we&apos;ll email you a short form to capture your size.
          </div>
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
              "radial-gradient(circle at 50% 40%, rgba(228,31,145,.22), rgba(17,126,194,.14) 45%, transparent 70%)",
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
            src="/assets/top-shirt.png?v=3"
            alt="The HBUFC The Goal is Love kit, front, showing how the shirt could look once every square is claimed"
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
            The 2026/27 shirt
          </div>
          {/* This is the mockup of the filled shirt, so the caption belongs
              here rather than over the interactive board. It replaces "the
              finished vision", which said the same thing less clearly. */}
          <div
            style={{
              textAlign: "center",
              marginTop: 7,
              fontSize: 12.5,
              lineHeight: 1.45,
              color: "#8b8b93",
              fontWeight: 600,
            }}
          >
            A preview of how the shirt could look once all {total} spots are claimed.
          </div>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import { fmt } from "../lib/useRainbow500";
import { RAINBOW_GRADIENT, RAINBOW_SURFACE, RAINBOW_SURFACE_INK } from "../lib/brand";
import kitHero from "../public/assets/kit-hero-boxed.jpg";

export default function Hero({ onJoin, goalLabel, claimed, total, price }) {
  const left = total - claimed;

  // Grid and padding live in .rb-hero because they change at 900px, and an
  // inline style cannot hold a media query.
  return (
    <section className="rb-hero">
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
          Legacy
          <br />
          500
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: "#b9bac2", maxWidth: 500, margin: "0 0 30px" }}>
          One shirt, split into <strong style={{ color: "#fff" }}>{total} squares</strong>. Claim a square
          from <strong style={{ color: "#fff" }}>R{fmt(price)}</strong>, put your name, logo, doodle or
          autograph on the kit, and receive a shirt as a thank-you once all {total} spaces have been taken.
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
            Once all {total}{" "}spaces are taken we&apos;ll produce the kit and email you a short form
            to capture your size, then send yours as a thank-you.
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
            padding: 9,
            border: "1px solid #24405f",
          }}
        >
          {/* Three widths, because the hero now stacks at 900px (.rb-hero).
              Above 1224px the container is capped and the right column is a
              fixed 497px. Between 901 and 1223 it is still two columns, so 47.5%
              of the content box, where 92px is the 44px container padding plus
              the 48px grid gap. At 900 and below it is stacked and the shirt
              takes the full content width.

              This hint has to track the breakpoint: get it wrong and the phone
              pulls a file sized for a column that no longer exists. It costs
              bytes rather than breaking layout, but the whole point of the
              image work was the bytes.

              The ?v=2 cache-buster is gone because the static import is
              content-hashed, so the URL changes whenever the file does. */}
          <Image
            src={kitHero}
            alt="The HBUFC The Goal is Love kit, showing how the shirt could look once every square is claimed"
            sizes="(min-width: 1224px) 497px, (min-width: 901px) calc((100vw - 92px) * 0.475), calc(100vw - 44px)"
            priority
            style={{ display: "block", width: "100%", height: "auto", margin: "0 auto", borderRadius: 16 }}
          />
          <div
            style={{
              textAlign: "center",
              marginTop: 14,
              fontSize: 16,
              color: "#e7e7ea",
              fontWeight: 800,
              letterSpacing: "-.01em",
            }}
          >
            This is a legacy shirt.
          </div>
          {/* The legacy narrative lives with the shirt mockup: your square is a
              permanent place on the kit, so the promise belongs next to it. */}
          <div
            style={{
              textAlign: "center",
              fontSize: 13.5,
              lineHeight: 1.5,
              color: "#8b8b93",
              fontWeight: 600,
              maxWidth: 440,
              margin: "7px auto 0",
            }}
          >
            Renew your spot season after season and keep your place on the shirt forever, claiming a
            permanent part of the fabric of our community.
          </div>
        </div>
      </div>
    </section>
  );
}

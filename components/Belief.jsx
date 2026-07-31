import Image from "next/image";
import { RAINBOW_GRADIENT } from "../lib/brand";
import supporters from "../public/assets/supporters.jpg";

export default function Belief() {
  return (
    <section
      style={{
        borderTop: "1px solid #1a3050",
        borderBottom: "1px solid #1a3050",
        padding: "52px 0",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr .9fr",
          gap: 40,
          alignItems: "center",
        }}
      >
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
              marginBottom: 20,
            }}
          >
            <span style={{ width: 26, height: 3, borderRadius: 2, background: RAINBOW_GRADIENT }} />
            Why we&apos;re doing this
          </div>
          <h2
            style={{
              fontSize: "clamp(30px,4.6vw,56px)",
              fontWeight: 900,
              letterSpacing: "-.02em",
              lineHeight: 1.02,
              margin: 0,
              textTransform: "uppercase",
              maxWidth: 900,
            }}
          >
            Football is the{" "}
            <span
              style={{
                background: RAINBOW_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              people&apos;s game.
            </span>
          </h2>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: "#8b8b93", maxWidth: 560, margin: "18px 0 0" }}>
            Not a product, and not a billboard. Big clubs sell the front of
            their shirt to a corporate sponsor for millions, but our games aren&apos;t on TV, so no sponsor sees
            value in ours. As a community club, that door is closed to us. So we&apos;re doing it a different
            way.
          </p>
        </div>
        <div
          style={{
            position: "relative",
            background: "#10203a",
            border: "1px solid #24405f",
            borderRadius: 18,
            padding: "36px 32px",
            overflow: "hidden",
          }}
        >
          <span style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 5, background: RAINBOW_GRADIENT }} />
          <div
            style={{
              fontSize: 60,
              lineHeight: 1,
              fontWeight: 900,
              fontFamily: "Georgia, serif",
              color: "#24405f",
              marginBottom: 4,
            }}
          >
            &ldquo;
          </div>
          <p
            style={{
              fontSize: 20,
              lineHeight: 1.55,
              color: "#e7e7ea",
              fontWeight: 600,
              margin: 0,
              letterSpacing: "-.005em",
            }}
          >
            When the shirt reaches our fans, it&apos;ll be priced for the people who&apos;ve earned it: week
            after week, rain or shine.
          </p>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: "#8b8b93",
              fontWeight: 500,
              margin: "18px 0 0",
            }}
          >
            Football shirts are incredibly expensive. We&apos;re committed to keeping this one affordable,
            from as little as R50, so anyone can wear it, while supporters who have the means are welcome to
            pay more.
          </p>
        </div>
      </div>
      {/* Spans the full content box, which caps at 1136px (1180 container less
          44px of padding). Below the fold, so it keeps next/image's default
          lazy loading rather than competing with the hero for bandwidth. */}
      <Image
        src={supporters}
        alt="Hout Bay United supporters cheering from the stands, one leading chants with a megaphone"
        sizes="(min-width: 1224px) 1136px, calc(100vw - 44px)"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          aspectRatio: "16 / 7",
          objectFit: "cover",
          objectPosition: "center 38%",
          borderRadius: 18,
          marginTop: 44,
        }}
      />
    </section>
  );
}

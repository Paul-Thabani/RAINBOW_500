import { RAINBOW_GRADIENT, RAINBOW_INK_GRADIENT } from "../lib/brand";

export default function FabricCTA() {
  return (
    <section style={{ padding: "70px 0", textAlign: "center" }}>
      <h2
        style={{
          fontSize: "clamp(30px,5vw,62px)",
          fontWeight: 900,
          letterSpacing: "-.02em",
          lineHeight: 1,
          margin: "0 auto",
          textTransform: "uppercase",
          maxWidth: 820,
        }}
      >
        You become the{" "}
        <span
          style={{
            background: RAINBOW_INK_GRADIENT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          fabric
        </span>{" "}
        of our shirt.
      </h2>
      <p style={{ fontSize: "clamp(20px,2.6vw,28px)", color: "#b9bac2", fontWeight: 600, lineHeight: 1.4, margin: "22px auto 0", maxWidth: 620 }}>
        Part of the community, and woven into our legacy forever.
      </p>
    </section>
  );
}

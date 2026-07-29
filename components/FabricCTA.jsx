import { RAINBOW_GRADIENT } from "../lib/brand";

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
            background: RAINBOW_GRADIENT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          fabric
        </span>{" "}
        of our shirt.
      </h2>
      <p style={{ fontSize: 17, color: "#8b8b93", margin: "20px auto 0", maxWidth: 460 }}>
        Part of the community, and woven into the shirt we play in.
      </p>
    </section>
  );
}

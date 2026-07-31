import { fmt } from "../lib/useRainbow500";
import { RAINBOW_GRADIENT, BUTTON_SURFACE, BUTTON_INK } from "../lib/brand";

export default function Pricing({ price, blockPrice }) {
  return (
    <section style={{ padding: "64px 0 8px" }}>
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
          marginBottom: 18,
        }}
      >
        <span style={{ width: 26, height: 3, borderRadius: 2, background: RAINBOW_GRADIENT }} />
        What you get
      </div>
      <h2
        style={{
          fontSize: "clamp(28px,4vw,50px)",
          fontWeight: 900,
          letterSpacing: "-.02em",
          lineHeight: 1.02,
          margin: "0 0 34px",
          textTransform: "uppercase",
        }}
      >
        Claim your patch of the shirt.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#10203a", border: "1px solid #24405f", borderRadius: 20, padding: 30 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-.01em", textTransform: "uppercase" }}>
              One square
            </div>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg,#117ec2,#e41f91)" }} />
          </div>
          <div style={{ fontSize: 12, color: "#8b8b93", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>
            1 × 1 · your patch of the shirt
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-.02em", marginBottom: 4 }}>R{fmt(price)}</div>
          <div style={{ fontSize: 13, color: "#8b8b93", fontWeight: 600, marginBottom: 20 }}>
            Renew each season to keep the same square
          </div>
          <div style={{ color: "#b9bac2", fontSize: 14, lineHeight: 1.55 }}>
            Put your logo, a message, a doodle or an autograph in your square. It&apos;s yours to renew, season after
            season.
          </div>
        </div>
        <div
          style={{
            background: "linear-gradient(180deg,#16121c,#10203a)",
            border: "1px solid #3a2b46",
            borderRadius: 20,
            padding: 30,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-.01em", textTransform: "uppercase" }}>
              One block
            </div>
            <div
              style={{
                flex: "none",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: BUTTON_INK,
                background: BUTTON_SURFACE,
                padding: "6px 11px",
                borderRadius: 999,
              }}
            >
              Most impact
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#8b8b93", letterSpacing: ".06em", textTransform: "uppercase", fontWeight: 700, marginBottom: 20 }}>
            2 × 2 · four squares, one story
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: "-.02em", marginBottom: 4 }}>R{fmt(blockPrice)}</div>
          <div style={{ fontSize: 13, color: "#8b8b93", fontWeight: 600, marginBottom: 20 }}>
            Renew each season to keep the same block
          </div>
          <div style={{ color: "#b9bac2", fontSize: 14, lineHeight: 1.55 }}>
            Same deal, bigger space. Plus we spotlight your business across our social channels all
            season: tagging, collaborating, sharing your story alongside ours.
          </div>
        </div>
      </div>
    </section>
  );
}

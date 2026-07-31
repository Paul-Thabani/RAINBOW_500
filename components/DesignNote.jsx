import { RAINBOW_GRADIENT } from "../lib/brand";

export default function DesignNote() {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "26px 0 0" }}>
      <div
        style={{
          position: "relative",
          transform: "rotate(-2deg)",
          background: "#10203a",
          borderRadius: 10,
          padding: "14px 20px 14px 34px",
          maxWidth: 460,
          boxShadow: "0 14px 30px rgba(0,0,0,.35)",
          border: "1.5px dashed #35507a",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#0a1526",
            boxShadow: "0 0 0 1.5px #35507a",
          }}
        />
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            marginBottom: 6,
            background: RAINBOW_GRADIENT,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          A note from the printer
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 600, color: "#b9bac2" }}>
          The position of your logo, message, doodle or autograph may shift slightly once printed. Everything
          else is exactly as shown.
        </div>
      </div>
    </div>
  );
}

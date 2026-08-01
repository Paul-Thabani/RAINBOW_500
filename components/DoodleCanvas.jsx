export default function DoodleCanvas({ attachCanvas, clearDoodle }) {
  return (
    <div>
      {/* Square, not full-width by a fixed 180px.
          The backing store is 900x900 because the printed area is square, and
          pointer coordinates are mapped per-axis, so a non-square CSS box over a
          square canvas would turn every circle somebody drew into an ellipse. It
          also just tells the truth: this is the shape you are drawing into. */}
      <div
        style={{
          border: "1.5px solid #e6e8ec",
          borderRadius: 14,
          overflow: "hidden",
          background: "#fff",
          aspectRatio: "1 / 1",
          maxWidth: 360,
          margin: "0 auto",
        }}
      >
        <canvas
          ref={attachCanvas}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            touchAction: "none",
            cursor: "crosshair",
          }}
        />
      </div>
      {/* Says what the auto-fill does, because it is not obvious that a small mark
          will come out big. The reason to draw large is now sharpness rather than
          size, so that is what the line asks for. */}
      <div style={{ fontSize: 12.5, color: "#6b7280", fontWeight: 600, lineHeight: 1.45, marginTop: 10 }}>
        Whatever you draw is scaled up to fill your whole square, so it is never
        printed small. Big, bold strokes come out sharpest.
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 10 }}>
        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", border: "1px solid #d4d7dd", flex: "none" }} />
          Printed in white on the kit.
        </div>
        <button
          type="button"
          onClick={clearDoodle}
          style={{
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 700,
            fontSize: 13,
            color: "#374151",
            background: "#f0f1f4",
            border: "none",
            padding: "9px 14px",
            borderRadius: 999,
            minHeight: 44,
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

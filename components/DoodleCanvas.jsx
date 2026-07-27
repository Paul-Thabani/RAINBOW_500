export default function DoodleCanvas({ attachCanvas, clearDoodle }) {
  return (
    <div>
      <div style={{ border: "1.5px solid #e6e8ec", borderRadius: 14, overflow: "hidden", background: "#fff" }}>
        <canvas
          ref={attachCanvas}
          style={{ width: "100%", height: 180, display: "block", touchAction: "none", cursor: "crosshair" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
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
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

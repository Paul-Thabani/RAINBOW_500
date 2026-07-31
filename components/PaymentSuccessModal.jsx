import { RAINBOW_GRADIENT } from "../lib/brand";

export default function PaymentSuccessModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,12,18,.55)",
        backdropFilter: "blur(3px)",
        zIndex: 80,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          borderRadius: 22,
          boxShadow: "0 30px 80px rgba(0,0,0,.4)",
          animation: "floatIn .25s ease both",
          color: "#12151c",
          padding: "32px 28px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: RAINBOW_GRADIENT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            color: "#fff",
            fontSize: 26,
            fontWeight: 900,
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Payment successful!</div>
        <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 600, lineHeight: 1.5, marginBottom: 24 }}>
          Thank you for supporting Rainbow 500. Your square is being confirmed now, we&apos;ll email your receipt shortly.
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: 15,
            color: "#fff",
            border: "none",
            padding: "12px 28px",
            borderRadius: 999,
            background: RAINBOW_GRADIENT,
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

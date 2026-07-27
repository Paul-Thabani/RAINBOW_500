export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 28,
        transform: "translateX(-50%)",
        zIndex: 70,
        background: "#12151c",
        color: "#fff",
        fontWeight: 800,
        fontSize: 15,
        padding: "14px 22px",
        borderRadius: 999,
        boxShadow: "0 16px 40px rgba(0,0,0,.35)",
        animation: "toastIn .3s ease both",
      }}
    >
      {message}
    </div>
  );
}

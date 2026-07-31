// The toast is the only feedback for "that spot's taken" and for a checkout
// that failed, so it has to reach a screen reader as well as an eye.
//
// The live region is always in the DOM and only its text changes. A region
// that appears with its message already inside it is unreliable: the assistive
// tech has to have been watching the node before the text lands. The visible
// pill is aria-hidden so the same words are not read twice.
const LIVE_REGION = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};

export default function Toast({ message }) {
  return (
    <>
      <div role="status" aria-live="polite" style={LIVE_REGION}>
        {message || ""}
      </div>
      {message ? (
        <div
          aria-hidden="true"
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
      ) : null}
    </>
  );
}

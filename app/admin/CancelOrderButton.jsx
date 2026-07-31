"use client";

import { useActionState } from "react";
import { cancelOrder } from "./actions";

// A paid order is the dangerous one: cancelling it pulls the artwork off the
// public shirt and frees the square for resale, while the buyer's money stays
// exactly where it is. Nothing in this app can refund anyone.
function confirmText(status, cellCount) {
  const cells = `${cellCount} ${cellCount === 1 ? "square" : "squares"}`;
  if (status === "paid") {
    return `This order is PAID.\n\nCancelling releases ${cells} back onto the board and removes the artwork from the shirt.\n\nIt does NOT refund the buyer. Refund them in Netcash first, or they have paid for nothing.\n\nContinue?`;
  }
  if (status === "conflict") {
    return `Mark this conflict as handled?\n\nThe buyer paid and their squares had already gone, so they are owed a refund. Only cancel once you have actually refunded them in Netcash.\n\nContinue?`;
  }
  return `Cancel this order and release ${cells} back onto the board?`;
}

export default function CancelOrderButton({ blockId, status, cellCount }) {
  const [state, action, pending] = useActionState(cancelOrder, null);

  if (status === "cancelled") {
    return <span style={{ color: "#4b5563", fontSize: 12 }}>-</span>;
  }

  return (
    <form action={action} style={{ margin: 0 }}>
      <input type="hidden" name="blockId" value={blockId} />
      <button
        type="submit"
        disabled={pending}
        // The confirm sits on the button's click rather than the form's submit
        // so that preventDefault stops the submission through plain DOM
        // behaviour, without depending on how React sequences form actions.
        onClick={(e) => {
          if (!window.confirm(confirmText(status, cellCount))) e.preventDefault();
        }}
        style={{
          cursor: pending ? "wait" : "pointer",
          fontFamily: "inherit",
          fontWeight: 700,
          fontSize: 12,
          whiteSpace: "nowrap",
          color: status === "paid" ? "#fca5a5" : "#cfd0d6",
          background: "transparent",
          border: `1.5px solid ${status === "paid" ? "#7f1d1d" : "#24405f"}`,
          borderRadius: 999,
          padding: "6px 13px",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? "Cancelling..." : "Cancel"}
      </button>
      {state && !state.ok && (
        <div style={{ color: "#fca5a5", fontSize: 11, marginTop: 5, maxWidth: 140 }}>{state.message}</div>
      )}
    </form>
  );
}

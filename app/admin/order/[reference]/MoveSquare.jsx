"use client";

import { useState } from "react";

// Moving a paid order to a different square, from the order it belongs to.
//
// Lives on the order page rather than the dashboard because you decide to move a
// square while looking at whose it is, and because the reference is already here
// and does not have to be typed.
//
// Collapsed by default: this rewrites where somebody's square sits on a shirt
// that is being printed, so it should take a deliberate press to open.
const PANELS = [
  { id: "front-body", label: "Front" },
  { id: "back-body", label: "Back" },
];

const input = {
  fontFamily: "inherit",
  fontSize: 14,
  padding: "9px 11px",
  borderRadius: 9,
  border: "1.5px solid #24405f",
  background: "#081120",
  color: "#eef1f6",
  width: "100%",
  boxSizing: "border-box",
};

const label = {
  display: "block",
  fontSize: 11,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "#8b8b93",
  fontWeight: 800,
  marginBottom: 5,
};

export default function MoveSquare({ reference, currentPanel, currentCol, currentRow, status }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState(currentPanel);
  const [mode, setMode] = useState("auto"); // auto | exact
  const [col, setCol] = useState("");
  const [row, setRow] = useState("");
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  // Only a paid order holds a cell, so only a paid order has anything to move.
  if (status !== "paid") return null;

  async function submit(e) {
    e.preventDefault();
    if (state === "saving") return;
    setState("saving");
    setError("");
    setDone(null);
    const payload = { reference, zoneId: panel };
    if (mode === "exact") {
      payload.col = Number(col);
      payload.row = Number(row);
      if (!Number.isInteger(payload.col) || !Number.isInteger(payload.row)) {
        setError("Enter a whole number for both column and row");
        setState("idle");
        return;
      }
    } else {
      payload.auto = true;
    }
    try {
      const res = await fetch("/admin/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't move that");
        setState("idle");
        return;
      }
      setDone(data);
      setState("idle");
    } catch {
      setError("Couldn't reach the server");
      setState("idle");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 700,
          color: "#cfd0d6",
          background: "transparent",
          border: "1.5px solid #24405f",
          borderRadius: 999,
          padding: "9px 16px",
        }}
      >
        Move this square
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: "#10203a",
        border: "1px solid #24405f",
        borderRadius: 16,
        padding: 20,
        maxWidth: 560,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <strong style={{ fontSize: 15, color: "#eef1f6" }}>Move this square</strong>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ cursor: "pointer", background: "transparent", border: "none", color: "#8b8b93", fontSize: 13, fontWeight: 700 }}
        >
          Close
        </button>
      </div>

      <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 16, lineHeight: 1.45 }}>
        Currently on the {currentPanel === "back-body" ? "back" : "front"} at ({currentCol},{currentRow}).
        The artwork moves with it, and the square is checked against the same rule a
        buyer's own choice goes through, so it cannot land on somebody else or off
        the shirt.
      </div>

      <div style={{ marginBottom: 14 }}>
        <span style={label}>Panel</span>
        <div style={{ display: "flex", gap: 8 }}>
          {PANELS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPanel(p.id)}
              aria-pressed={panel === p.id}
              style={{
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 800,
                padding: "9px 18px",
                borderRadius: 10,
                border: panel === p.id ? "1.5px solid #a5c8ff" : "1.5px solid #24405f",
                background: panel === p.id ? "rgba(165,200,255,.12)" : "#081120",
                color: panel === p.id ? "#a5c8ff" : "#cfd0d6",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <span style={label}>Where</span>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[
            { v: "auto", t: "First free spot" },
            { v: "exact", t: "Exact cell" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setMode(o.v)}
              aria-pressed={mode === o.v}
              style={{
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 800,
                padding: "9px 16px",
                borderRadius: 10,
                border: mode === o.v ? "1.5px solid #a5c8ff" : "1.5px solid #24405f",
                background: mode === o.v ? "rgba(165,200,255,.12)" : "#081120",
                color: mode === o.v ? "#a5c8ff" : "#cfd0d6",
              }}
            >
              {o.t}
            </button>
          ))}
        </div>
        {mode === "exact" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={label} htmlFor="mv-col">Column</label>
              <input id="mv-col" inputMode="numeric" value={col} onChange={(e) => setCol(e.target.value)} style={input} placeholder="0 to 20" />
            </div>
            <div>
              <label style={label} htmlFor="mv-row">Row</label>
              <input id="mv-row" inputMode="numeric" value={row} onChange={(e) => setRow(e.target.value)} style={input} placeholder="0 to 22" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" style={{ marginBottom: 12, color: "#fca5a5", fontSize: 13.5, fontWeight: 700 }}>
          {error}
        </div>
      )}
      {done && (
        <div role="status" style={{ marginBottom: 12, color: "#8bf0b0", fontSize: 13.5, fontWeight: 700, lineHeight: 1.5 }}>
          Moved to the {done.to.panel} at {done.cells.map((c) => `(${c.col},${c.row})`).join(" ")}. Refresh to see it.
        </div>
      )}

      <button
        type="submit"
        style={{
          cursor: state === "saving" ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          fontWeight: 800,
          fontSize: 14,
          color: "#0a0a0c",
          background: "#a5c8ff",
          padding: "11px 20px",
          borderRadius: 999,
          border: "none",
        }}
      >
        {state === "saving" ? "Moving..." : "Move it"}
      </button>
    </form>
  );
}

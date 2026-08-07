"use client";

import { useState } from "react";

// Placing a square by hand: cash taken at a match, a card payment made somewhere
// this app did not see, or a square being given.
//
// Collapsed by default. This is the one control on the dashboard that creates a
// paid square out of nothing, so it should take a deliberate press to open
// rather than sit open next to the order list waiting to be half-filled.
//
// It asks for a name and nothing else about the person. Everything a checkout
// collects is arranged in conversation for these, so what this hands back is a
// claim link: the artwork arrives later, through /claim, whenever they have
// decided what they want. That also means there is one artwork path on the site
// rather than two, and if the admin already has the logo in hand they can just
// open the claim link themselves.
const input = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  fontSize: 14,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1.5px solid #24405f",
  background: "#081120",
  color: "#eef1f6",
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

const METHODS = [
  { value: "cash", label: "Cash taken", note: "counts toward the total" },
  { value: "netcash", label: "Netcash Pay Now", note: "card paid elsewhere, needs the receipt" },
  { value: "complimentary", label: "Complimentary", note: "R0, does not count" },
];

export default function AddPlacement() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ method: "cash", name: "", netcashReceipt: "", placedBy: "" });
  const [size, setSize] = useState(1);
  const [state, setState] = useState("idle");
  const [placed, setPlaced] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const needsReceipt = f.method === "netcash";
  const valid = f.name.trim().length >= 2 && (!needsReceipt || f.netcashReceipt.trim() !== "");

  async function submit(e) {
    e.preventDefault();
    if (!valid || state === "saving") return;
    setState("saving");
    setError("");
    setPlaced(null);
    setCopied(false);
    try {
      const res = await fetch("/admin/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, size }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't place that");
        setState("idle");
        return;
      }
      setPlaced(data);
      setF({ method: f.method, name: "", netcashReceipt: "", placedBy: f.placedBy });
      setState("idle");
    } catch {
      setError("Couldn't reach the server");
      setState("idle");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(placed.claimUrl);
      setCopied(true);
    } catch {
      // Clipboard is blocked outside a secure context and on some in-app
      // browsers. The link is on screen and selectable either way, so this is
      // a convenience failing, not the feature failing.
      setCopied(false);
      setError("Couldn't copy automatically, select the link and copy it by hand");
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
        Place a square by hand
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
        marginTop: 14,
        maxWidth: 720,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <strong style={{ fontSize: 15, color: "#eef1f6" }}>Place a square by hand</strong>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{ cursor: "pointer", background: "transparent", border: "none", color: "#8b8b93", fontSize: 13, fontWeight: 700 }}
        >
          Close
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={label}>How many</span>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { v: 1, t: "One square", p: "R2,000" },
            { v: 4, t: "Block of 4", p: "R7,000" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setSize(o.v)}
              aria-pressed={size === o.v}
              style={{
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 800,
                padding: "10px 16px",
                borderRadius: 10,
                border: size === o.v ? "1.5px solid #a5c8ff" : "1.5px solid #24405f",
                background: size === o.v ? "rgba(165,200,255,.12)" : "#081120",
                color: size === o.v ? "#a5c8ff" : "#cfd0d6",
              }}
            >
              {o.t}
              <span style={{ fontWeight: 600, opacity: 0.75 }}>
                {" "}
                {f.method === "complimentary" ? "R0" : o.p}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={label}>How it was paid</span>
        <div style={{ display: "grid", gap: 8 }}>
          {METHODS.map((m) => (
            <label
              key={m.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                padding: "10px 12px",
                borderRadius: 10,
                border: f.method === m.value ? "1.5px solid #a5c8ff" : "1.5px solid #24405f",
                background: f.method === m.value ? "rgba(165,200,255,.10)" : "#081120",
              }}
            >
              <input
                type="radio"
                name="pl-method"
                value={m.value}
                checked={f.method === m.value}
                onChange={set("method")}
                style={{ accentColor: "#a5c8ff", width: 17, height: 17, flex: "0 0 auto" }}
              />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#eef1f6" }}>{m.label}</span>
              <span style={{ fontSize: 12.5, color: "#8b8b93", fontWeight: 600 }}>{m.note}</span>
            </label>
          ))}
        </div>
      </div>

      {needsReceipt && (
        <div style={{ marginBottom: 14 }}>
          <label style={label} htmlFor="pl-receipt">
            Netcash receipt or reference
          </label>
          <input
            id="pl-receipt"
            value={f.netcashReceipt}
            onChange={set("netcashReceipt")}
            style={{ ...input, fontFamily: "ui-monospace,monospace" }}
            placeholder="what the Netcash statement calls it"
          />
          <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 6, lineHeight: 1.45 }}>
            Required, because this is the only thing tying the square to a line on
            the statement. It goes into the export next to the amount.
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <div>
          <label style={label} htmlFor="pl-name">
            Name it belongs to
          </label>
          <input id="pl-name" value={f.name} onChange={set("name")} style={input} placeholder="e.g. Thandi Mokoena" />
        </div>
        <div>
          <label style={label} htmlFor="pl-by">
            Taken by (optional)
          </label>
          <input id="pl-by" value={f.placedBy} onChange={set("placedBy")} style={input} placeholder="who took the money" />
        </div>
      </div>

      {/* No cell picker, and no artwork upload. Whoever is doing this is usually
          standing at a match with someone's cash in hand: the next free square
          is fine, and the artwork comes later through the claim link. */}
      <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 14, lineHeight: 1.45 }}>
        The next free {size === 4 ? "block of four" : "square"} is used
        automatically. It goes straight to paid and cannot take anything somebody
        has already bought or is mid-checkout on. You get a code to pass on, and
        they add their own artwork with it.
      </div>

      {error && (
        <div role="alert" style={{ marginTop: 12, color: "#fca5a5", fontSize: 13.5, fontWeight: 700 }}>
          {error}
        </div>
      )}

      {placed && (
        <div
          role="status"
          style={{
            marginTop: 14,
            padding: 16,
            borderRadius: 12,
            border: "1px solid #2f6b46",
            background: "rgba(139,240,176,.06)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, color: "#8bf0b0", marginBottom: 10 }}>
            Placed at {placed.zoneId} {placed.cells.map((c) => `(${c.col},${c.row})`).join(" ")} for R
            {placed.amount}
          </div>
          <div style={label}>Code to give them</div>
          <div
            style={{
              fontFamily: "ui-monospace,monospace",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: ".06em",
              color: "#eef1f6",
              marginBottom: 12,
            }}
          >
            {placed.claimToken}
          </div>
          <div style={label}>Or send this link</div>
          <div
            style={{
              fontFamily: "ui-monospace,monospace",
              fontSize: 12.5,
              color: "#a5c8ff",
              wordBreak: "break-all",
              marginBottom: 12,
            }}
          >
            {placed.claimUrl}
          </div>
          <button
            type="button"
            onClick={copyLink}
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 800,
              color: "#0a0a0c",
              background: "#8bf0b0",
              border: "none",
              borderRadius: 999,
              padding: "9px 18px",
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 12, lineHeight: 1.45 }}>
            Reference {placed.reference}. Write the code down before you close
            this: it is shown here and in the order, and nothing is emailed.
          </div>
        </div>
      )}

      <button
        type="submit"
        aria-disabled={!valid || state === "saving"}
        onClick={(e) => {
          if (valid) return;
          e.preventDefault();
          setError(
            needsReceipt && f.netcashReceipt.trim() === ""
              ? "Enter the Netcash receipt for this payment."
              : "Enter the name this square belongs to."
          );
        }}
        style={{
          marginTop: 16,
          cursor: valid && state !== "saving" ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          fontWeight: 800,
          fontSize: 14,
          color: "#0a0a0c",
          background: "#a5c8ff",
          padding: "12px 22px",
          borderRadius: 999,
          border: "none",
          opacity: valid || state === "saving" ? 1 : 0.5,
        }}
      >
        {state === "saving"
          ? "Placing..."
          : f.method === "complimentary"
            ? `Place ${size === 4 ? "four" : "it"}, free`
            : `Place ${size === 4 ? "four" : "it"}, money received`}
      </button>
    </form>
  );
}

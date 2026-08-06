"use client";

import { useState } from "react";
import { SHIRT_SIZES } from "../../lib/zones";

// Placing a square by hand, for cash taken at a match or a square being given.
//
// Collapsed by default. This is the one control on the dashboard that creates a
// paid square out of nothing, so it should take a deliberate press to open
// rather than sit open next to the order list waiting to be half-filled.
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

export default function AddPlacement() {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    method: "cash",
    name: "",
    email: "",
    phone: "",
    shirtSize: "",
    message: "",
    placedBy: "",
  });
  const [image, setImage] = useState("");
  const [imageName, setImageName] = useState("");
  const [state, setState] = useState("idle");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const valid =
    f.name.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(f.email.trim()) &&
    f.phone.replace(/[^0-9]/g, "").length >= 7 &&
    SHIRT_SIZES.includes(f.shirtSize) &&
    (f.message.trim() !== "" || image !== "");

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      setImage(String(rd.result || ""));
      setImageName(file.name);
    };
    rd.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    if (!valid || state === "saving") return;
    setState("saving");
    setError("");
    setNote("");
    try {
      const res = await fetch("/admin/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, image }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't place that");
        setState("idle");
        return;
      }
      setNote(
        `Placed at ${data.zoneId} (${data.col},${data.row}) for R${data.amount}. Reference ${data.reference}.`
      );
      setF({ method: f.method, name: "", email: "", phone: "", shirtSize: "", message: "", placedBy: f.placedBy });
      setImage("");
      setImageName("");
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
        Add a cash or free placement
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

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        <div>
          <label style={label} htmlFor="pl-method">Payment</label>
          <select id="pl-method" value={f.method} onChange={set("method")} style={{ ...input, appearance: "auto" }}>
            <option value="cash">Cash taken (R2,000 counts toward the total)</option>
            <option value="complimentary">Complimentary (R0, does not count)</option>
          </select>
        </div>
        <div>
          <label style={label} htmlFor="pl-name">Buyer name</label>
          <input id="pl-name" value={f.name} onChange={set("name")} style={input} placeholder="e.g. Thandi Mokoena" />
        </div>
        <div>
          <label style={label} htmlFor="pl-email">Email</label>
          <input id="pl-email" type="email" value={f.email} onChange={set("email")} style={input} placeholder="them@example.com" />
        </div>
        <div>
          <label style={label} htmlFor="pl-phone">Phone</label>
          <input id="pl-phone" type="tel" value={f.phone} onChange={set("phone")} style={input} placeholder="082 123 4567" />
        </div>
        <div>
          <label style={label} htmlFor="pl-size">Shirt size</label>
          <select id="pl-size" value={f.shirtSize} onChange={set("shirtSize")} style={{ ...input, appearance: "auto" }}>
            <option value="">Choose a size</option>
            {SHIRT_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={label} htmlFor="pl-by">Taken by (optional)</label>
          <input id="pl-by" value={f.placedBy} onChange={set("placedBy")} style={input} placeholder="who took the cash" />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={label} htmlFor="pl-msg">Message on the square</label>
        <input id="pl-msg" value={f.message} onChange={set("message")} style={input} placeholder="short text, or upload a logo instead" />
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={label} htmlFor="pl-img">Or a logo</label>
        <input id="pl-img" type="file" accept="image/*" onChange={onFile} style={{ ...input, padding: 8 }} />
        {imageName && (
          <div style={{ fontSize: 12, color: "#8bf0b0", marginTop: 6 }}>
            {imageName} attached, and it will be used instead of the message
          </div>
        )}
      </div>

      {/* No cell picker. Whoever is doing this is usually standing at a match
          with someone's cash in hand, and the next free square is fine. */}
      <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 14, lineHeight: 1.45 }}>
        The next free square is used automatically. It goes straight to paid, and
        it cannot take a square somebody has already bought or is mid-checkout on.
      </div>

      {error && (
        <div role="alert" style={{ marginTop: 12, color: "#fca5a5", fontSize: 13.5, fontWeight: 700 }}>
          {error}
        </div>
      )}
      {note && (
        <div role="status" style={{ marginTop: 12, color: "#8bf0b0", fontSize: 13.5, fontWeight: 700 }}>
          {note} Refresh to see it in the list.
        </div>
      )}

      <button
        type="submit"
        aria-disabled={!valid || state === "saving"}
        onClick={(e) => {
          if (valid) return;
          e.preventDefault();
          setError("Fill in name, email, phone, size, and either a message or a logo.");
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
        {state === "saving" ? "Placing..." : f.method === "cash" ? "Place it, cash taken" : "Place it, free"}
      </button>
    </form>
  );
}

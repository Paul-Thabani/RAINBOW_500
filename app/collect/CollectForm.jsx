"use client";

import { useState } from "react";
import { BUTTON_SURFACE, BUTTON_INK, RAINBOW_GRADIENT } from "../../lib/brand";

// How the shirt reaches its buyer. Two ways, presented as two choices.
//
// This started as a checkbox under the address, which made "I am not in South
// Africa" an afterthought on a form that had already assumed you were. It is
// not an afterthought: it is the difference between turning up to a handover
// and waiting for a parcel, and it changes what the club has to do. So the
// buyer picks one before typing anything, and neither is preselected.
const OPTIONS = [
  {
    id: "collect",
    title: "I'll collect it",
    blurb: "In or near Hout Bay. We'll arrange a time and place once the shirts are printed.",
  },
  {
    id: "post",
    title: "I'm outside South Africa",
    blurb: "Post it to me instead, and we'll be in touch about the postage.",
  },
];

const field = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  fontSize: 15,
  padding: "13px 15px",
  borderRadius: 12,
  border: "1.5px solid #24405f",
  background: "#081120",
  color: "#eef1f6",
  lineHeight: 1.5,
};

export default function CollectForm({ reference, name }) {
  const [address, setAddress] = useState("");
  const [handover, setHandover] = useState("");
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  const overseas = handover === "post";
  const valid = handover !== "" && address.trim().length >= 8;

  async function submit(e) {
    e.preventDefault();
    if (!valid || state === "saving") return;
    setState("saving");
    setError("");
    try {
      const res = await fetch("/api/collection-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: reference, address, shipOverseas: overseas }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't save that, please try again");
        setState("idle");
        return;
      }
      setState("saved");
    } catch {
      setError("Couldn't reach the server, please try again");
      setState("idle");
    }
  }

  if (state === "saved") {
    return (
      <div
        role="status"
        style={{
          background: "#10203a",
          border: "1px solid #2f6b46",
          borderRadius: 18,
          padding: 24,
          lineHeight: 1.55,
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 900, color: "#8bf0b0", marginBottom: 8 }}>
          That&apos;s everything{name ? `, ${name.split(" ")[0]}` : ""}.
        </div>
        <div style={{ color: "#b9bac2", fontSize: 15.5 }}>
          {overseas
            ? "We have your address and we know you're overseas. Once all 500 squares are sold and the shirts are printed, we'll be in touch about posting yours."
            : "We have your details. Once all 500 squares are sold and the shirts are printed, we'll be in touch to arrange collection."}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#8b8b93", marginBottom: 10 }}>
        How should we get your shirt to you?
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
        {OPTIONS.map((o) => {
          const on = handover === o.id;
          return (
            <label
              key={o.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "16px 18px",
                borderRadius: 14,
                cursor: "pointer",
                border: "1.5px solid",
                borderColor: on ? "#2cae4a" : "#24405f",
                background: on ? "#10203a" : "transparent",
              }}
            >
              <input
                type="radio"
                name="handover"
                value={o.id}
                checked={on}
                onChange={() => setHandover(o.id)}
                style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0, accentColor: "#2cae4a" }}
              />
              <span>
                <span style={{ display: "block", fontWeight: 800, fontSize: 15.5, color: "#eef1f6" }}>{o.title}</span>
                <span style={{ display: "block", fontSize: 13.5, color: "#8b8b93", marginTop: 3, lineHeight: 1.45 }}>
                  {o.blurb}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <label
        htmlFor="collect-address"
        style={{ display: "block", fontSize: 12, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "#8b8b93", marginBottom: 8 }}
      >
        {overseas ? "Where should we post it?" : "Your address"}
      </label>
      <textarea
        id="collect-address"
        name="address"
        rows={4}
        autoComplete="street-address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={overseas ? "Street\nCity\nPostal code\nCountry" : "Street\nSuburb\nCity\nPostal code"}
        style={{ ...field, resize: "vertical" }}
      />
      <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 7, lineHeight: 1.45 }}>
        {overseas
          ? "So we can work out the postage and get it to the right place."
          : "For our records, and to help us identify you at handover."}
      </div>

      {error && (
        <div role="alert" style={{ marginTop: 12, color: "#fca5a5", fontSize: 13.5, fontWeight: 700 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        // aria-disabled rather than disabled so it stays keyboard reachable and
        // can be pressed early. A blocked press says what is missing instead of
        // doing nothing, the same as the checkout form.
        aria-disabled={!valid || state === "saving"}
        onClick={(e) => {
          if (valid) return;
          e.preventDefault();
          if (!handover) {
            setError("Please choose how you'd like to get your shirt");
            document.querySelector('input[name="handover"]')?.focus();
          } else {
            setError("Please enter your address");
            document.getElementById("collect-address")?.focus();
          }
        }}
        style={{
          marginTop: 20,
          width: "100%",
          cursor: valid && state !== "saving" ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          fontWeight: 800,
          fontSize: 15.5,
          color: BUTTON_INK,
          background: BUTTON_SURFACE,
          padding: "15px 22px",
          borderRadius: 999,
          border: "none",
          opacity: valid || state === "saving" ? 1 : 0.5,
        }}
      >
        {state === "saving" ? "Saving..." : "Save my details"}
      </button>

      <div style={{ height: 3, borderRadius: 2, background: RAINBOW_GRADIENT, marginTop: 22, opacity: 0.5 }} />
    </form>
  );
}

"use client";

import { useState } from "react";
import { BUTTON_SURFACE_ON_LIGHT, BUTTON_INK } from "../../lib/brand";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  fontSize: 15,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1.5px solid #d7dbe0",
  background: "#fff",
  color: "#12151c",
};

export default function CollectForm({ reference, name }) {
  const [address, setAddress] = useState("");
  const [overseas, setOverseas] = useState(false);
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");

  const valid = address.trim().length >= 8;

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
          background: "#eefaf1",
          border: "1.5px solid #9fe3b8",
          borderRadius: 14,
          padding: "18px 20px",
          color: "#14532d",
          fontWeight: 700,
          lineHeight: 1.5,
        }}
      >
        Thank you{name ? `, ${name.split(" ")[0]}` : ""}. We have your details.
        <div style={{ fontWeight: 500, marginTop: 6, color: "#166534" }}>
          {overseas
            ? "We will be in touch once all 500 squares are sold and the shirts have been printed, and we will arrange postage to you."
            : "We will be in touch once all 500 squares are sold and the shirts have been printed."}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <label
        htmlFor="collect-address"
        style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#12151c", marginBottom: 6 }}
      >
        Your address
      </label>
      <textarea
        id="collect-address"
        name="address"
        rows={4}
        autoComplete="street-address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder={"Street address\nSuburb\nCity\nPostal code"}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }}
      />

      {/* Asked outright rather than hoping it turns up in the address free text,
          so fulfilment can filter on it instead of reading all 500. */}
      <label
        htmlFor="collect-overseas"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginTop: 14,
          padding: "12px 14px",
          border: "1.5px solid #d7dbe0",
          borderRadius: 12,
          cursor: "pointer",
          lineHeight: 1.45,
          fontSize: 14,
          color: "#374151",
        }}
      >
        <input
          id="collect-overseas"
          name="shipOverseas"
          type="checkbox"
          checked={overseas}
          onChange={(e) => setOverseas(e.target.checked)}
          style={{ marginTop: 2, width: 18, height: 18, flexShrink: 0 }}
        />
        <span>
          <strong style={{ color: "#12151c" }}>I am outside South Africa.</strong>{" "}
          Please post my shirt to me instead, and get in touch about the postage.
        </span>
      </label>

      {error && (
        <div role="alert" style={{ marginTop: 10, color: "#b91c1c", fontSize: 13.5, fontWeight: 700 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        // aria-disabled rather than disabled so it stays reachable by keyboard
        // and can be pressed early, matching the checkout form. Pressing it
        // before the field is filled says why instead of doing nothing.
        aria-disabled={!valid || state === "saving"}
        onClick={(e) => {
          if (!valid) {
            e.preventDefault();
            setError("Please enter your address first");
            document.getElementById("collect-address")?.focus();
          }
        }}
        style={{
          marginTop: 16,
          cursor: valid && state !== "saving" ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          fontWeight: 800,
          fontSize: 15,
          color: BUTTON_INK,
          background: BUTTON_SURFACE_ON_LIGHT,
          padding: "13px 22px",
          borderRadius: 999,
          border: "none",
          opacity: valid || state === "saving" ? 1 : 0.55,
        }}
      >
        {state === "saving" ? "Saving..." : "Save my details"}
      </button>
    </form>
  );
}

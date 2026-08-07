"use client";

import { useCallback, useEffect, useState } from "react";
import { fitArtworkToSquare, SOLID_WARN } from "../../lib/artfit";

// The artwork step for a square somebody was handed rather than bought.
//
// Uses the same fitArtworkToSquare as the public editor, deliberately. It crops
// to the artwork and centres it on a 900px square, so a claimed square prints
// identically to a bought one instead of arriving at the printer as a small
// picture in the middle of a big empty square.

const card = {
  background: "#10203a",
  border: "1px solid #24405f",
  borderRadius: 20,
  padding: 26,
};

const input = {
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  fontSize: 15,
  padding: "12px 14px",
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
  marginBottom: 6,
};

const button = {
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 800,
  fontSize: 15,
  color: "#0a0a0c",
  background: "#a5c8ff",
  padding: "13px 24px",
  borderRadius: 999,
  border: "none",
};

export default function ClaimForm({ initialToken }) {
  const [token, setToken] = useState(initialToken || "");
  const [order, setOrder] = useState(null);
  const [slots, setSlots] = useState([]);
  const [state, setState] = useState("idle"); // idle | loading | saving | done
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async (t) => {
    if (!t.trim()) return;
    setState("loading");
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/claim?t=${encodeURIComponent(t.trim())}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "We could not find that code");
        setOrder(null);
        setState("idle");
        return;
      }
      setOrder(data);
      setSlots(data.squares.map(() => null));
      setState("idle");
    } catch {
      setError("Couldn't reach the server, please try again");
      setState("idle");
    }
  }, []);

  // Auto-load when the token arrived in the link, which is the normal case.
  useEffect(() => {
    if (initialToken) load(initialToken);
  }, [initialToken, load]);

  async function onFile(i, file) {
    if (!file) return;
    setError("");
    setNotice("");
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("could not read that file"));
        reader.readAsDataURL(file);
      });
      const fitted = await fitArtworkToSquare(dataUrl);
      if (!fitted) {
        setError("There was nothing visible in that image, please try another one");
        return;
      }
      if (fitted.coverage >= SOLID_WARN) {
        // Worth saying out loud rather than letting them find out at the print
        // stage: a photo has no transparency, so it prints as a solid block.
        setNotice(
          "That image covers nearly the whole square, so it will print as a solid block. A logo with a transparent background works best."
        );
      }
      setSlots((prev) => {
        const next = [...prev];
        next[i] = { type: "image", src: fitted.src, name: file.name };
        return next;
      });
    } catch {
      setError("We couldn't read that image, please try another one");
    }
  }

  function onText(i, text) {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = text.trim() ? { type: "text", text } : null;
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();
    if (state === "saving") return;
    if (!slots.some(Boolean)) {
      setError("Add a logo or a message first");
      return;
    }
    setState("saving");
    setError("");
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), slots }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't save that, please try again");
        setState("idle");
        return;
      }
      setOrder(data);
      setSlots(data.squares.map(() => null));
      setState("done");
    } catch {
      setError("Couldn't reach the server, please try again");
      setState("idle");
    }
  }

  if (!order) {
    return (
      <div style={card}>
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "#b9bac2", margin: "0 0 20px" }}>
          Enter the code you were given and we&apos;ll bring up your square.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(token);
          }}
        >
          <label style={label} htmlFor="claim-token">
            Your code
          </label>
          <input
            id="claim-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ABCD-EFGH-JKMN"
            autoComplete="off"
            autoCapitalize="characters"
            style={{ ...input, fontFamily: "ui-monospace,monospace", letterSpacing: ".08em" }}
          />
          {error && (
            <div role="alert" style={{ marginTop: 14, color: "#fca5a5", fontSize: 14, fontWeight: 700 }}>
              {error}
            </div>
          )}
          <button type="submit" style={{ ...button, marginTop: 20 }}>
            {state === "loading" ? "Looking..." : "Find my square"}
          </button>
        </form>
      </div>
    );
  }

  const many = order.squares.length > 1;
  const outstanding = order.squares.filter((s) => !s.hasArt).length;

  return (
    <>
      <p style={{ fontSize: 17, lineHeight: 1.6, color: "#b9bac2", margin: "0 0 22px" }}>
        {order.name ? `${order.name.split(" ")[0]}, ` : ""}
        {many ? `you have ${order.squares.length} squares` : "you have a square"} on the{" "}
        {order.panel}. {outstanding === 0
          ? "Everything is on the shirt. You can change any of it below."
          : many
            ? `${outstanding} of them still need artwork.`
            : "It just needs your artwork."}
      </p>

      {state === "done" && (
        <div
          role="status"
          style={{ ...card, borderColor: "#2f6b46", marginBottom: 22 }}
        >
          <div style={{ fontSize: 19, fontWeight: 900, color: "#8bf0b0", marginBottom: 8 }}>
            Saved, and it&apos;s on the shirt.
          </div>
          <div style={{ color: "#b9bac2", fontSize: 15.5, lineHeight: 1.55 }}>
            Have a look at the board and you&apos;ll see it. You can come back to
            this link and change it any time before the kit goes to print.
          </div>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "grid", gap: 18 }}>
        {order.squares.map((sq, i) => (
          <div key={sq.id} style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 16,
                gap: 12,
              }}
            >
              <strong style={{ fontSize: 15, color: "#eef1f6" }}>
                {many ? `Square ${i + 1}` : "Your square"}
              </strong>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: sq.hasArt ? "#8bf0b0" : "#ffd27a" }}>
                {sq.hasArt ? "has artwork" : "empty"}
              </span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={label} htmlFor={`claim-img-${i}`}>
                Upload a logo
              </label>
              <input
                id={`claim-img-${i}`}
                type="file"
                accept="image/*"
                onChange={(e) => onFile(i, e.target.files?.[0])}
                style={{ ...input, padding: 9 }}
              />
              {slots[i]?.type === "image" && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                  <img
                    src={slots[i].src}
                    alt=""
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 8,
                      background: "#081120",
                      border: "1px solid #24405f",
                      objectFit: "contain",
                    }}
                  />
                  <span style={{ fontSize: 12.5, color: "#8bf0b0", fontWeight: 700 }}>
                    {slots[i].name} ready
                  </span>
                </div>
              )}
            </div>

            <div>
              <label style={label} htmlFor={`claim-txt-${i}`}>
                Or a short message instead
              </label>
              <input
                id={`claim-txt-${i}`}
                maxLength={120}
                value={slots[i]?.type === "text" ? slots[i].text : ""}
                onChange={(e) => onText(i, e.target.value)}
                placeholder="e.g. The Mokoena family"
                disabled={slots[i]?.type === "image"}
                style={{
                  ...input,
                  opacity: slots[i]?.type === "image" ? 0.45 : 1,
                }}
              />
            </div>
          </div>
        ))}

        {notice && (
          <div role="status" style={{ color: "#ffd27a", fontSize: 14, fontWeight: 700, lineHeight: 1.5 }}>
            {notice}
          </div>
        )}
        {error && (
          <div role="alert" style={{ color: "#fca5a5", fontSize: 14, fontWeight: 700 }}>
            {error}
          </div>
        )}

        <div>
          <button type="submit" style={button}>
            {state === "saving" ? "Saving..." : many ? "Put these on the shirt" : "Put it on the shirt"}
          </button>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 12, lineHeight: 1.5 }}>
            Reference {order.reference}. Leave a square blank to come back to it later.
          </div>
        </div>
      </form>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import ShirtPanel from "./ShirtPanel";
import { zonesFor } from "../lib/useRainbow500";
import { BUTTON_SURFACE_ON_LIGHT, BUTTON_INK } from "../lib/brand";

const FRONT_ZONES = zonesFor("front");
const BACK_ZONES = zonesFor("back");

// A close look at what people have actually put on the shirt.
//
// The board on the page is the buying surface: squares there are around 100 x 60
// pixels, which is enough to pick one and nowhere near enough to read somebody's
// message or recognise their logo. This is the looking surface.
//
// Deliberately not the hover lens the editor's review step uses. That magnifier
// follows a cursor, and 82% of this audience is on a phone where there is no
// cursor to follow. This scales the panel up and lets the browser's own
// scrolling and pinch-zoom do the work, which is the interaction people already
// know and which needs no code to be accessible.
const LEVELS = [2, 3, 4];

export default function ShirtZoom({ reserved, onClose }) {
  const [panel, setPanel] = useState("front");
  const [zoom, setZoom] = useState(2);
  const scrollRef = useRef(null);
  const closeRef = useRef(null);

  // Escape closes, and focus starts on the close button so a keyboard user is
  // not dropped into a long scrollable region with no obvious way out.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Keep the middle of the shirt in view when the scale changes, rather than
  // snapping back to the top-left corner every time.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [zoom, panel]);

  const zones = panel === "front" ? FRONT_ZONES : BACK_ZONES;
  const src = panel === "front" ? "/assets/kit-customise.png" : "/assets/kit-back.png";

  const tab = (active) => ({
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
    fontSize: 14,
    padding: "9px 18px",
    borderRadius: 999,
    border: "none",
    background: active ? "#fff" : "transparent",
    color: active ? "#12151c" : "#9aa1ac",
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="A closer look at the shirt"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(8,10,16,.82)",
        backdropFilter: "blur(3px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,.12)",
        }}
      >
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,.08)", borderRadius: 999, padding: 4 }}>
          <button type="button" onClick={() => setPanel("front")} style={tab(panel === "front")}>
            Front
          </button>
          <button type="button" onClick={() => setPanel("back")} style={tab(panel === "back")}>
            Back
          </button>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#9aa1ac", fontWeight: 700 }}>Zoom</span>
          <div style={{ display: "inline-flex", background: "rgba(255,255,255,.08)", borderRadius: 999, padding: 4 }}>
            {LEVELS.map((z) => (
              <button key={z} type="button" onClick={() => setZoom(z)} style={tab(zoom === z)}>
                {z}x
              </button>
            ))}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 14,
              color: BUTTON_INK,
              background: BUTTON_SURFACE_ON_LIGHT,
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
            }}
          >
            Close
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          overflow: "auto",
          WebkitOverflowScrolling: "touch",
          padding: 16,
        }}
      >
        {/* interactive={false} on purpose: this is for looking, not buying, so
            there is no click-to-pick overlay and no open-square markers to
            clutter the view of what people have made. */}
        <div style={{ width: `${zoom * 100}%`, maxWidth: "none", margin: "0 auto" }}>
          <ShirtPanel zones={zones} src={src} reserved={reserved} interactive={false} />
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: "10px 16px 14px",
          textAlign: "center",
          fontSize: 12.5,
          color: "#9aa1ac",
          fontWeight: 600,
          borderTop: "1px solid rgba(255,255,255,.12)",
        }}
      >
        Scroll or pinch to move around. Only squares that have been paid for show their artwork.
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { fmt, zonesFor } from "../lib/useRainbow500";

const RAINBOW_GRADIENT =
  "linear-gradient(90deg,#e11d48,#f97316,#eab308,#16a34a,#0ea5e9,#6366f1,#a855f7)";

const CANVAS_W = 180;
const CANVAS_H = 225;

function TrackerCanvas({ label, panel, reserved }) {
  const ref = useRef(null);
  const zones = zonesFor(panel);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const W = (cv.width = CANVAS_W);
    const H = (cv.height = CANVAS_H);
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    zones.forEach((zone) => {
      const zx = (zone.box.x / 100) * W;
      const zy = (zone.box.y / 100) * H;
      const zw = (zone.box.w / 100) * W;
      const zh = (zone.box.h / 100) * H;
      const cw = zw / zone.cols;
      const ch = zh / zone.rows;
      const excluded = (c, r) =>
        zone.exclude.some((z) => c >= z.c0 && c <= z.c1 && r >= z.r0 && r <= z.r1);
      for (let c = 0; c < zone.cols; c++) {
        for (let r = 0; r < zone.rows; r++) {
          if (excluded(c, r)) continue;
          ctx.fillStyle = "#24405f";
          ctx.fillRect(zx + c * cw + 0.5, zy + r * ch + 0.5, Math.max(1, cw - 1), Math.max(1, ch - 1));
        }
      }
      Object.values(reserved)
        .filter((e) => e.zoneId === zone.id)
        .forEach((e) => {
          const sp = e.span || 1;
          ctx.fillStyle = e.fill || "#12151c";
          ctx.fillRect(zx + e.col * cw + 0.5, zy + e.row * ch + 0.5, Math.max(1, cw * sp - 1), Math.max(1, ch * sp - 1));
        });
    });
  }, [reserved, zones]);

  return (
    <div style={{ background: "#10203a", border: "1px solid #24405f", borderRadius: 16, padding: 16 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "#8b8b93",
          fontWeight: 800,
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <canvas
        ref={ref}
        style={{
          width: "100%",
          maxWidth: 150,
          height: "auto",
          imageRendering: "pixelated",
          display: "block",
          margin: "0 auto",
          borderRadius: 6,
        }}
      />
    </div>
  );
}

function Stat({ big, small, color }) {
  return (
    <div>
      <div style={{ fontSize: 30, fontWeight: 900, color: color || "#12151c" }}>{big}</div>
      <div style={{ fontSize: 12, color: "#8b8b93", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase" }}>
        {small}
      </div>
    </div>
  );
}

export default function Tracker({ claimed, total, raised, price, reserved }) {
  const pct = Math.round((claimed / total) * 100);
  const remaining = total - claimed;
  const pctLabel = Math.min(100, (claimed / total) * 100).toFixed(1) + "%";

  return (
    <section id="tracker" style={{ padding: "64px 0 8px" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: "#8b8b93",
          marginBottom: 18,
        }}
      >
        <span style={{ width: 26, height: 3, borderRadius: 2, background: RAINBOW_GRADIENT }} />
        The fill tracker
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: "clamp(26px,3.4vw,40px)", fontWeight: 900, margin: 0, letterSpacing: "-.02em", textTransform: "uppercase" }}>
          <span style={{ color: "#f59e0b" }}>{claimed}</span> of {total} squares claimed
        </h2>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.01em" }}>R{fmt(raised)}</div>
          <div style={{ fontSize: 12, color: "#8b8b93", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
            raised of R{fmt(price * total)}
          </div>
        </div>
      </div>
      <div style={{ height: 12, borderRadius: 999, background: "#1a3050", overflow: "hidden", marginBottom: 26 }}>
        <div
          style={{
            height: "100%",
            width: pctLabel,
            borderRadius: 999,
            background: RAINBOW_GRADIENT,
            transition: "width .5s ease",
          }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: 16, alignItems: "stretch" }}>
        <TrackerCanvas label="Front" panel="front" reserved={reserved} />
        <TrackerCanvas label="Back" panel="back" reserved={reserved} />
        <div
          style={{
            background: "#10203a",
            borderRadius: 16,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(120deg,rgba(225,29,72,.16),rgba(14,165,233,.16),rgba(168,85,247,.18))",
              opacity: 0.55,
            }}
          />
          <div style={{ position: "relative", display: "flex", gap: 28, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 40, fontWeight: 900 }}>{pct}%</div>
              <div style={{ fontSize: 12, color: "#c7ccd4", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase" }}>
                of the shirt filled
              </div>
            </div>
            <Stat big={fmt(claimed)} small="squares secured" color="#8bf0b0" />
            <Stat big={fmt(remaining)} small="squares left" color="#ffd27a" />
            <Stat big={"R" + fmt(raised)} small="raised" color="#a5c8ff" />
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: pct + "%", borderRadius: 999, background: RAINBOW_GRADIENT }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

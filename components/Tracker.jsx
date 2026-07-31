"use client";

import { fmt } from "../lib/useRainbow500";
import { RAINBOW_GRADIENT, RAINBOW_STOPS } from "../lib/brand";

const RING_SIZE = 200;
const RING_STROKE = 16;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

function ProgressRing({ pct, claimed, total }) {
  const offset = RING_C * (1 - Math.min(100, pct) / 100);

  return (
    <div
      style={{
        background: "#10203a",
        border: "1px solid #24405f",
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            {/* Driven from the shared stops rather than hand-listed, so the ring
                can never drift away from the crest the way it had. */}
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {RAINBOW_STOPS.map((c, i) => (
                <stop key={c} offset={`${(i / (RAINBOW_STOPS.length - 1)) * 100}%`} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke="#1a3050" strokeWidth={RING_STROKE} fill="none" />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_R}
            stroke="url(#ringGradient)"
            strokeWidth={RING_STROKE}
            fill="none"
            strokeDasharray={RING_C}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset .5s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 12, color: "#8b8b93", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 6 }}>
            of the shirt filled
          </div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#8b8b93", fontWeight: 700, marginTop: 8 }}>
        <span style={{ color: "#fff" }}>{claimed}</span> of {total} squares claimed
      </div>
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

export default function Tracker({ claimed, total, raised, price }) {
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

      <div className="rb-two-col" style={{ "--rb-cols": "1fr 1.3fr", gap: 16, alignItems: "stretch" }}>
        <ProgressRing pct={pct} claimed={claimed} total={total} />
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
              background: "linear-gradient(120deg,rgba(235,43,41,.16),rgba(17,126,194,.16),rgba(228,31,145,.18))",
              opacity: 0.55,
            }}
          />
          <div style={{ position: "relative", display: "flex", gap: 28, flexWrap: "wrap" }}>
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

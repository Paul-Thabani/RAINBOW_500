import { inExclude } from "../lib/useRainbow500";

function occupiedSet(entries) {
  const occ = new Set();
  entries.forEach((e) => {
    const sp = e.span || 1;
    for (let i = 0; i < sp; i++) for (let j = 0; j < sp; j++) occ.add(e.col + i + ":" + (e.row + j));
  });
  return occ;
}

function OpenCellMarkers({ zone, entries }) {
  const occ = occupiedSet(entries);
  const cw = 100 / zone.cols;
  const ch = 100 / zone.rows;
  const markers = [];
  for (let c = 0; c < zone.cols; c++) {
    for (let r = 0; r < zone.rows; r++) {
      if (inExclude(zone, c, r, 1) || occ.has(c + ":" + r)) continue;
      markers.push(
        <div
          key={c + ":" + r}
          style={{
            position: "absolute",
            left: c * cw + "%",
            top: r * ch + "%",
            width: cw + "%",
            height: ch + "%",
            padding: 1,
            boxSizing: "border-box",
            zIndex: 0,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 2,
              border: "1px dashed rgba(0,0,0,.6)",
              background: "rgba(0,0,0,.08)",
            }}
          />
        </div>
      );
    }
  }
  return markers;
}

function CellInner({ entry }) {
  const c = entry.content;
  const shadow = "drop-shadow(0 1px 1.5px rgba(0,0,0,.5))";
  // Two sources, one renderer. A square the visitor is still editing carries
  // its image inline as `content.src`, because it only exists in this browser.
  // A square already on the board carries `artUrl` instead, a per-square
  // thumbnail the browser fetches once and caches for a year, which is what
  // keeps the 25 second poll free of artwork.
  //
  // A paid image square with neither is one whose thumbnail has not been
  // generated yet. It falls through to the plain claimed block below rather
  // than rendering as a broken image.
  const src = (c && c.src) || entry.artUrl;
  if (c && c.type === "image" && src) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            // 100%, not 94%: the wrapper's 1px padding is already the gap
            // between neighbouring squares, so the extra inset was just making
            // every logo smaller than it needed to be.
            width: "100%",
            height: "100%",
            background: "#fff",
            filter: shadow,
            WebkitMaskImage: `url("${src}")`,
            maskImage: `url("${src}")`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      </div>
    );
  }
  if (c && c.type === "text") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: 1,
          containerType: "inline-size",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontFamily: "'Permanent Marker',cursive",
            color: "#fff",
            textShadow: "0 1px 2px rgba(0,0,0,.55)",
            fontSize: (entry.span || 1) === 2 ? "18cqw" : "30cqw",
            lineHeight: 1.05,
          }}
        >
          {c.text}
        </div>
      </div>
    );
  }
  // No ring here: the wrapper in RegionOverlay frames every claimed square,
  // including this one, so drawing a second would double the line.
  return <div style={{ width: "100%", height: "100%", borderRadius: 2 }} />;
}

export function RegionOverlay({ zone, reserved, extra, hi, interactive, hover, onHover, onLeave, onPick }) {
  const R = zone.box;
  const cw = 100 / zone.cols;
  const ch = 100 / zone.rows;
  const entries = Object.values(reserved)
    .filter((e) => e.zoneId === zone.id)
    .concat((extra || []).filter((e) => e.zoneId === zone.id));

  return (
    <div style={{ position: "absolute", left: R.x + "%", top: R.y + "%", width: R.w + "%", height: R.h + "%", zIndex: 2 }}>
      {/* Markers only for the zones that make up the headline 500, so the board
          a visitor sees contains exactly 500 boxes. The bonus sleeve and crest
          squares stay claimable, they just aren't drawn as open boxes, which is
          also what keeps every drawn box the same size: the bonus zones use much
          coarser grids than the torso, so their cells rendered noticeably
          larger. */}
      {interactive && zone.counted && <OpenCellMarkers zone={zone} entries={entries} />}

      {entries.map((e) => {
        const sp = e.span || 1;
        return (
          <div
            key={e.blockId + ":" + e.col + ":" + e.row}
            style={{
              position: "absolute",
              left: e.col * cw + "%",
              top: e.row * ch + "%",
              width: cw * sp + "%",
              height: ch * sp + "%",
              padding: 1,
              boxSizing: "border-box",
              zIndex: 1,
              // Every claimed square is framed, not just the ones with no
              // artwork. Without this a sold square with a logo on it was the
              // artwork floating on bare fabric, so a filling shirt read as
              // scattered dots rather than a mosaic closing up.
              borderRadius: 3,
              boxShadow: "inset 0 0 0 1.25px rgba(255,255,255,.85)",
            }}
          >
            <CellInner entry={e} />
          </div>
        );
      })}

      {hi && hi.zoneId === zone.id && (
        <div
          style={{
            position: "absolute",
            left: hi.col * cw + "%",
            top: hi.row * ch + "%",
            width: cw * hi.span + "%",
            height: ch * hi.span + "%",
            boxSizing: "border-box",
            border: "2.5px solid #12151c",
            borderRadius: 4,
            boxShadow: "0 0 0 3px rgba(255,255,255,.9), 0 0 0 6px rgba(18,21,28,.25)",
            zIndex: 4,
            pointerEvents: "none",
          }}
        />
      )}

      {interactive && hover && hover.zoneId === zone.id && (
        <div
          style={{
            position: "absolute",
            left: hover.col * cw + "%",
            top: hover.row * ch + "%",
            width: cw * hover.span + "%",
            height: ch * hover.span + "%",
            boxSizing: "border-box",
            border: "2px solid " + (hover.valid ? "#2cae4a" : "#eb2b29"),
            background: hover.valid ? "rgba(44,174,74,.18)" : "rgba(235,43,41,.16)",
            borderRadius: 3,
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      )}

      {interactive && (
        <div
          onMouseMove={(e) => onHover(zone.id, e)}
          onMouseLeave={onLeave}
          onClick={(e) => onPick(zone.id, e)}
          // pointer, not crosshair. A crosshair reads as a drawing tool, and
          // this is "choose one of these".
          style={{ position: "absolute", inset: 0, zIndex: 5, cursor: "pointer" }}
        />
      )}
    </div>
  );
}

export default function ShirtPanel({
  src,
  label,
  zones,
  reserved,
  extra,
  hi,
  interactive,
  hover,
  onHover,
  onLeave,
  onPick,
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ position: "relative", width: "100%", borderRadius: 14, overflow: "hidden", background: "#10203a", border: "1px solid #24405f" }}>
        <img
          src={src}
          alt={label}
          draggable={false}
          style={{ display: "block", width: "100%", height: "auto", userSelect: "none", pointerEvents: "none" }}
        />
        {zones.map((zone) => (
          <RegionOverlay
            key={zone.id}
            zone={zone}
            reserved={reserved}
            extra={extra}
            hi={hi}
            interactive={interactive}
            hover={hover}
            onHover={onHover}
            onLeave={onLeave}
            onPick={onPick}
          />
        ))}
      </div>
      {label && (
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#8b8b93", fontWeight: 800 }}>
          {label}
        </div>
      )}
    </div>
  );
}

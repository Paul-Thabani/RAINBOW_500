// Pure grid/zone logic - deliberately has NO "use client" directive and no
// React import, so it's safe to import from server code (API routes) as
// well as client components. (lib/useRainbow500.js re-exports everything
// here for existing component imports, but API routes should import
// directly from this file - importing a plain function from a "use client"
// module throws at runtime when called outside the React tree.)

// Every clickable area of the shirt is a "zone": a named box (in % of the
// shirt image) subdivided into its own cols x rows grid, with its own
// no-place exclusions. The torso ("body") zones use a fine 10x25 grid; the
// sleeves are much smaller physical areas so they get their own small grids.
// All box/exclude numbers below were measured directly against the real
// kit-customise.png / kit-back.png artwork (see the "arms" fix), not
// guessed, so squares never render over the crest, wordmark, or the sleeve
// tag logos, and never spill outside the printed fabric.
export const ZONES = [
  // Box stretches from just below the shoulder seam (y=22%, as high as the
  // fixed x26-74% width stays safely inside the fabric silhouette) down to
  // just above the hem (y=85%) - reclaiming the dead space that used to sit
  // above and below the old, shorter box. Rows 2-11 are excluded as a single
  // clean rectangle covering the heart, crest and wordmark (measured bboxes:
  // heart at cols 1-2/rows 3-5, crest at cols 6-8/rows 2-5) with margin to
  // spare, rather than one cutout per element - that per-element approach
  // left an isolated single-column sliver and a small floating block between
  // the heart and crest, which read as a jagged staircase. This unified
  // rectangle excludes exactly 100 cells, the same as before, so usable
  // count stays at exactly 150 - the campaign is "Legacy 500" (150 front +
  // 350 back = 500 squares at R2,000 = R1,000,000), so this total must not
  // drift even when the exclusion shape changes.
  {
    id: "front-body",
    panel: "front",
    // `counted: true` marks a zone as part of the headline 500. TOTAL_SQUARES
    // sums exactly these zones, and the preview only draws open-square markers
    // for them, so the board a visitor sees always contains 500 boxes and never
    // the bonus sleeve stock.
    counted: true,
    cols: 10,
    rows: 28,
    box: { x: 26, y: 22, w: 48, h: 61.6 },
    // Measured off a labelled grid rendered over kit-customise.png, not
    // estimated: each rectangle is the smallest grid-aligned box that fully
    // covers its artwork, so squares stack right up against the heart, crest
    // and wordmark without ever printing over them.
    exclude: [
      { c0: 1, c1: 2, r0: 3, r1: 6 }, // heart outline
      { c0: 7, c1: 8, r0: 2, r1: 6 }, // HBUFC crest
      { c0: 1, c1: 8, r0: 7, r1: 13 }, // "the goal is love" wordmark
      // The crew neck dips lowest at the centre front, so the two middle cells
      // of the top row sit under the collar and cannot be printed. Those two
      // squares move to the sleeves instead (see front-sleeveL / front-sleeveR).
      { c0: 4, c1: 5, r0: 0, r1: 0 },
      // Artwork plus collar is 76 cells. The front has to yield 198 so that the
      // two sleeve squares bring the campaign to 500, which means 82 excluded,
      // so 6 cells directly under the wordmark are held back. Plain fabric,
      // sacrificed to the arithmetic.
      { c0: 0, c1: 5, r0: 14, r1: 14 },
    ],
  },
  {
    id: "front-sleeveL",
    panel: "front",
    // One of the two squares displaced from under the collar. Counted, so it is
    // part of the 500, and sized 4.8 x 2.2 like every torso square rather than
    // filling the sleeve, so it does not read as a different size.
    counted: true,
    cols: 1,
    rows: 1,
    box: { x: 18.1, y: 34.9, w: 4.8, h: 2.2 },
    exclude: [],
  },
  {
    id: "front-sleeveR",
    panel: "front",
    // The other displaced collar square.
    counted: true,
    cols: 1,
    rows: 1,
    box: { x: 77.1, y: 34.4, w: 4.8, h: 2.2 },
    exclude: [],
  },
  // Small bonus strip of plain fabric between the HBUFC crest and the
  // shoulder seam - like the sleeve zones, these 3 squares are extra and
  // not counted in the "500 squares" headline total (see TOTAL_SQUARES).
  {
    id: "front-crestR",
    panel: "front",
    cols: 1,
    rows: 3,
    box: { x: 71.76, y: 25.93, w: 3.94, h: 11.85 },
    exclude: [],
  },
  // No exclusions on the back torso (blank artwork). Box extended the same
  // way as the front: from just below the shoulder seam (y=18%) down to
  // just above the hem (y=84%), reclaiming the same dead margins. Row count
  // (35) is unchanged, so it's still exactly 350 usable squares.
  {
    id: "back-body",
    panel: "back",
    counted: true,
    cols: 10,
    rows: 30,
    // 30 rows into 66% gives 2.2% per row, matching the front's 28 rows into
    // 61.6%, so a square is the same size on both panels. The back used to run
    // 35 rows into 66%, making its squares 34% shorter than the front's, which
    // was plainly visible with the two side by side.
    box: { x: 26, y: 18, w: 48, h: 66 },
    exclude: [],
  },
  // The real back artwork (unlike the earlier placeholder) has a cuff tag on
  // each sleeve (an "HB" tag + a striped ribbon on the left, a tan tag +
  // ribbon on the right) starting around y=35%, so each sleeve's clickable
  // area is shrunk to the clear band above them.
  {
    id: "back-sleeveL",
    panel: "back",
    cols: 3,
    rows: 1,
    box: { x: 15, y: 30, w: 9, h: 3 },
    exclude: [],
  },
  {
    id: "back-sleeveR",
    panel: "back",
    cols: 3,
    rows: 1,
    box: { x: 76, y: 30, w: 9, h: 3 },
    exclude: [],
  },
];

export function zonesFor(panel) {
  return ZONES.filter((z) => z.panel === panel);
}

export function getZone(zoneId) {
  return ZONES.find((z) => z.id === zoneId) || null;
}

export const PRICE_PER_SPOT = 2000;
export const BLOCK_PRICE = 7000;

// Thousands separator is a comma (UK style), not the space South African
// convention prefers. The space is a real space, so "R1 000 000" could break
// across lines mid-figure, which looked broken in the hero and the tracker.
// A comma keeps the number as one unbreakable run.
//
// Display only. Amounts sent to Netcash use toFixed(2) in lib/netcash.js, and
// nothing here is ever parsed back or written to the database.
export function fmt(n) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function cellKey(zoneId, col, row) {
  return zoneId + ":" + col + ":" + row;
}

export function inExclude(zone, col, row, span) {
  const sp = span || 1;
  return zone.exclude.some(
    (z) => col <= z.c1 && col + sp - 1 >= z.c0 && row <= z.r1 && row + sp - 1 >= z.r0
  );
}

export function usableCount(zone) {
  let n = 0;
  for (let c = 0; c < zone.cols; c++)
    for (let r = 0; r < zone.rows; r++) if (!inExclude(zone, c, r, 1)) n++;
  return n;
}

// The zones that make up the headline 500. Everything else (sleeves, the crest
// strip) is bonus stock deliberately outside that number.
export function countedZones() {
  return ZONES.filter((z) => z.counted);
}

// The campaign's headline "500 squares" is the sum of the two torso zones
// only (sleeve squares are a bonus on top, not counted toward this number):
// front-body is 10x25 minus the 100-cell wordmark/crest exclusion = 150,
// back-body is 10x35 with no exclusions = 350.
export const TOTAL_SQUARES = countedZones().reduce((sum, z) => sum + usableCount(z), 0);

export function posHue(zone, c, r) {
  const p = (c / Math.max(1, zone.cols - 1) + r / Math.max(1, zone.rows - 1)) / 2;
  return Math.round(p * 285);
}

export function spotColor(zone, col, row) {
  return "hsl(" + posHue(zone, col, row) + " 72% 50%)";
}

export function occSetFrom(reserved) {
  const occ = new Set();
  Object.values(reserved).forEach((e) => {
    const sp = e.span || 1;
    for (let i = 0; i < sp; i++)
      for (let j = 0; j < sp; j++) occ.add(cellKey(e.zoneId, e.col + i, e.row + j));
  });
  return occ;
}

export function validFoot(occ, zone, col, row, size) {
  const sp = size === 4 ? 2 : 1;
  if (col < 0 || row < 0 || col + sp > zone.cols || row + sp > zone.rows) return false;
  if (inExclude(zone, col, row, sp)) return false;
  for (let i = 0; i < sp; i++)
    for (let j = 0; j < sp; j++) if (occ.has(cellKey(zone.id, col + i, row + j))) return false;
  return true;
}

export function activeCell(ed) {
  if (!ed) return { col: 0, row: 0 };
  if (ed.size === 4 && !ed.big) {
    const o = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ][ed.active] || [0, 0];
    return { col: ed.col + o[0], row: ed.row + o[1] };
  }
  return { col: ed.col, row: ed.row };
}

export function activeColor(ed) {
  if (!ed) return spotColor(ZONES[0], 0, 0);
  const zone = getZone(ed.zoneId);
  const { col, row } = activeCell(ed);
  return spotColor(zone, col, row);
}

export function pendingEntries(ed) {
  if (!ed) return [];
  const zone = getZone(ed.zoneId);
  const out = [];
  if (ed.size === 1) {
    out.push({
      zoneId: ed.zoneId,
      col: ed.col,
      row: ed.row,
      span: 1,
      content: ed.slots[0],
      fill: (ed.slots[0] && ed.slots[0].color) || spotColor(zone, ed.col, ed.row),
      blockId: "pend",
    });
  } else if (ed.big) {
    out.push({
      zoneId: ed.zoneId,
      col: ed.col,
      row: ed.row,
      span: 2,
      big: true,
      content: ed.slots[0],
      fill: (ed.slots[0] && ed.slots[0].color) || spotColor(zone, ed.col, ed.row),
      blockId: "pend",
    });
  } else {
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ].forEach((o, i) => {
      const cc = ed.col + o[0];
      const rr = ed.row + o[1];
      out.push({
        zoneId: ed.zoneId,
        col: cc,
        row: rr,
        span: 1,
        content: ed.slots[i] || null,
        fill: (ed.slots[i] && ed.slots[i].color) || spotColor(zone, cc, rr),
        blockId: "pend",
      });
    });
  }
  return out;
}

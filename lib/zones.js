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
// The kit renders were re-canvassed from 1080x1350 to 943x1046 so the shirt
// fills the frame instead of floating in white, which makes it render about 15%
// larger at the same panel width. Every box in this file is a percentage of the
// image, so all of them had to be transformed: the garment pixels are unchanged,
// their offset inside the canvas is not.
export const ZONES = [
  // SQUARE "1:2", "9:2", "10:2", "11:2", "1:3", "2:3", "9:3", "10:3", "11:3", "1:4", "9:4", "10:4", "8:5", "9:5", "2:6", "3:6", "4:6", "5:6", "6:6", "7:6", "8:6", "9:6", "10:6", "1:7", "2:7", "3:7", "4:7", "5:7", "6:7", "7:7", "8:7", "9:7", "10:7", "2:8", "3:8", "4:8", "5:8", "6:8", "7:8", "8:8", "9:8", "10:8", "4:9", "5:9", "6:9", "7:9", "8:9", "9:9", "4:10", "5:10". Every "square" used to be a 51.8 x 29.7px rectangle, a 1.75:1
  // ratio, roughly 3.0 x 2.2cm on a medium shirt. A campaign called "500
  // squares" was selling rectangles, so the grid was re-cut.
  //
  // 12 columns across a 40%-wide box gives a cell of exactly 36.00px on the
  // 1080px artwork, and the box heights below are the ones that make the row
  // count land on a whole number at that cell size. Both torso zones use the
  // same 36.00px cell, so a square is the same size front and back: about
  // 2.1 x 2.1cm on a medium.
  //
  // The box is narrower than the old 48% and centred on the torso at 49.8%,
  // which keeps it clear of the render's shaded edges and of the point where the
  // front hem narrows to 67.7%. Those were previously inside the box.
  //
  // 214 front + 276 back + 10 sleeves = 500. Verified by TOTAL_SQUARES, which
  // is computed, not written down. Changing any box, column count or exclusion
  // moves that number.
  {
    id: "front-body",
    panel: "front",
    // `counted: true` marks a zone as part of the headline 500. TOTAL_SQUARES
    // sums exactly these zones, and the preview only draws open-square markers
    // for them, so the board a visitor sees always contains 500 boxes and never
    // the bonus sleeve stock.
    counted: true,
    cols: 21,
    rows: 23,
    // The box is deliberately generous: it covers almost the whole render and the
    // mask below carves the real shape out of it, rather than a rectangle being
    // stamped on the shirt and the corners argued about afterwards.
    box: { x: 6, y: 6, w: 88, h: 86.89 },
    exclude: [],
    mask: [
      "111111111111111111111",
      "111110111111111011111",
      "111100000000000001111",
      "111001110000011100111",
      "110001111000111100011",
      "110001111000111100011",
      "111001111101111100111",
      "111100111111111001111",
      "111101111111111101111",
      "111101111111111101111",
      "111110111111111011111",
      "111110011111110011111",
      "111110000000000011111",
      "111110000000000011111",
      "111110000000000011111",
      "111110000000000011111",
      "111110000000000011111",
      "111110000000000011111",
      "111110000000000011111",
      "111110000000000011111",
      "111110000000000011111",
      "111110000000000011111",
      "111110000000000011111",
    ],
  },
{
    id: "front-sleeveL",
    panel: "front",
    // Two stacked squares on the left sleeve: the lower one is the square
    // displaced from under the collar, the upper one is a second sleeve box.
    // Both counted, and each sized 4.8 x 2.2 like every torso square (box is
    // rows*2.2 tall) so they never read as a different size. The two extra
    // sleeve cells here and on the right are offset by two more held-back body
    // cells (see front-body) so the campaign total stays exactly 500.
    counted: true,
    cols: 1,
    rows: 2,
    box: { x: 12.14, y: 25.09, w: 5.5, h: 5.68 },
    exclude: [],
  },
  {
    id: "front-sleeveR",
    panel: "front",
    // The right sleeve's two stacked squares (lower = displaced collar square).
    counted: true,
    cols: 1,
    rows: 2,
    box: { x: 79.71, y: 24.45, w: 5.5, h: 5.68 },
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
    box: { x: 73.6, y: 16.35, w: 4.51, h: 15.29 },
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
    cols: 21,
    rows: 23,
    // Identical grid to the front, so a square is the same size on both panels
    // and the two shapes are cut by the same rule.
    box: { x: 6, y: 6, w: 88, h: 86.89 },
    exclude: [],
    mask: [
      "111111111111111111111",
      "111110000000000011111",
      "111000000000000000111",
      "111000000000000000111",
      "110000000000000000011",
      "110000000000000000011",
      "100000000000000000001",
      "110000000000000000011",
      "110000000000000000011",
      "111000000000000000111",
      "111100000000000001111",
      "111100000000000001111",
      "111100000000000001111",
      "111100000000000001111",
      "111100000000000001111",
      "111100000000000001111",
      "111100000000000001111",
      "111100000000000001111",
      "111100000000000001111",
      "111100000000000001111",
      "111100000000000001111",
      "111110000000000011111",
      "111110000000000011111",
    ],
  },
  // The real back artwork (unlike the earlier placeholder) has a cuff tag on
  // each sleeve (an "HB" tag + a striped ribbon on the left, a tan tag +
  // ribbon on the right) starting around y=35%, so each sleeve's clickable
  // area is shrunk to the clear band above them.
  // The three cells that used to sit on each shoulder now live here, on the
  // clear band of each back sleeve above the cuff tag. Counted, so they draw
  // as real boxes and keep the back at 350 (back-body 294 + 3 + 3).
  {
    id: "back-sleeveL",
    panel: "back",
    counted: true,
    cols: 3,
    rows: 1,
    box: { x: 9.65, y: 26.48, w: 10.31, h: 3.87 },
    exclude: [],
  },
  {
    id: "back-sleeveR",
    panel: "back",
    counted: true,
    cols: 3,
    rows: 1,
    box: { x: 79.51, y: 26.48, w: 10.31, h: 3.87 },
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
  if (
    zone.exclude.some(
      (z) => col <= z.c1 && col + sp - 1 >= z.c0 && row <= z.r1 && row + sp - 1 >= z.r0
    )
  ) {
    return true;
  }
  // `mask` is the measured shape of the claimable area, one string per row,
  // "0" claimable and "1" not. Stored as a bitmap rather than as rectangles or a
  // coordinate list because the shape is not rectangular and you can read it in
  // the source: the back widens through the chest and tapers at both ends, the
  // front flows around the heart, crest and wordmark.
  //
  // Anything outside the mask counts as excluded, so a block of four straddling
  // the edge is refused rather than silently allowed.
  const mask = zone.mask;
  if (mask) {
    for (let j = 0; j < sp; j++) {
      const line = mask[row + j];
      if (!line) return true;
      for (let i = 0; i < sp; i++) {
        if (line[col + i] !== "0") return true;
      }
    }
  }
  return false;
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

// Every cell in the counted zones where a square of `size` could still go.
//
// This is what the "pick one for me" button uses. On a phone a single square is
// about 16.5 x 9.5 CSS px against roughly 44px for a finger, so hunting for a
// specific one is a poor primary path for the four visitors in five who are on
// mobile, and most buyers do not mind which square they get.
//
// Lives here rather than in the hook so it stays free of React and can be
// reasoned about on its own. validFoot already handles the 2x2 footprint,
// exclusions and occupancy, so this only has to enumerate.
export function availableSpots(occ, size) {
  const out = [];
  for (const zone of countedZones()) {
    // A zone smaller than 2x2 can only ever hold a single square, which is the
    // same rule onPick applies to the sleeve grids. Asked for a block, skip it.
    if (size === 4 && (zone.cols < 2 || zone.rows < 2)) continue;
    for (let c = 0; c < zone.cols; c++) {
      for (let r = 0; r < zone.rows; r++) {
        if (validFoot(occ, zone, c, r, size)) out.push({ zoneId: zone.id, col: c, row: r });
      }
    }
  }
  return out;
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

// Human-readable zone names, for anything a buyer actually reads.
//
// The Netcash payment description used to be built from the raw zone id, so at
// the exact moment someone handed over R2,000 the page said "HBUFC Legacy 500 -
// front-body square". An internal identifier showing up on a payment screen is
// the single most scam-looking thing in the journey, and it costs one map to
// fix. Also useful in /admin, where "front-body" means nothing to a volunteer.
const ZONE_LABELS = {
  "front-body": "front of the shirt",
  "front-sleeveL": "left sleeve, front",
  "front-sleeveR": "right sleeve, front",
  "front-crestR": "front crest strip",
  "back-body": "back of the shirt",
  "back-sleeveL": "left sleeve, back",
  "back-sleeveR": "right sleeve, back",
};

export function zoneLabel(zoneId) {
  return ZONE_LABELS[zoneId] || zoneId;
}

// Turning whatever a buyer uploads or draws into something the kit can actually
// print, and into something that fills the square they paid for.
//
// Two problems this solves, both found by measuring the live page.
//
// 1. The square renders artwork as a CSS mask, and mask-mode defaults to
//    match-source, which for a raster image means the ALPHA channel. A JPEG has no
//    alpha, so it masked in as a completely solid white square: the logo was gone
//    entirely. The upload input accepts image/jpeg, and a PNG exported with a white
//    background rather than transparency behaves the same way. So "any image
//    without real transparency" was broken, not just JPEGs.
//
// 2. The whole bitmap was fitted into the square with mask-size: contain, so any
//    blank margin inside the image became blank margin on the shirt. A logo file
//    with 25% padding printed at about half the area of the square, and the buyer
//    had no way to tell from the upload control.
//
// The fix for both is to reduce the image to a stencil and then crop the stencil to
// its own bounding box. Sublimation on this kit prints white only, with no white
// ink: the white is un-dyed fabric showing through and the colour is printed around
// it. So a one-bit stencil is not a lossy approximation of the artwork, it is
// literally what gets printed.

// A square is about 3.8cm across on a medium (39.52px of the render's 545px torso,
// against a 52cm flat chest), so 300 DPI needs about 445px. 900 leaves room to crop a
// small drawing back up and still be well past the print requirement.
export const OUTPUT_PX = 900;

// Left as a named constant because it is the number most likely to change once the
// manufacturer confirms their spec. It keeps two neighbouring squares' artwork from
// touching if the print shifts, which the design note already warns can happen.
export const SAFE_MARGIN = 0.04;

// Below this, a stencil is almost certainly a photo or a solid block rather than a
// logo, and it would print as a near-solid white square. Used to warn, not to block.
export const SOLID_WARN = 0.82;

// An image is treated as alpha-bearing if enough of it is actually transparent.
// A stray anti-aliased edge pixel is not transparency.
const ALPHA_MIN_FRACTION = 0.02;
const ALPHA_CUTOFF = 250;

// How far a pixel must sit from the detected background before it counts as ink.
// Deliberately generous: a light grey logo on white should still register.
const INK_DISTANCE = 46;

function readPixels(bitmap) {
  const c = document.createElement("canvas");
  c.width = bitmap.width;
  c.height = bitmap.height;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  return { ctx, data: ctx.getImageData(0, 0, c.width, c.height), w: c.width, h: c.height };
}

// The background is sampled from the border rather than assumed to be white,
// because plenty of logos arrive on a black or brand-coloured plate.
function borderColour(data, w, h) {
  const px = data.data;
  let r = 0, g = 0, b = 0, n = 0;
  const step = Math.max(1, Math.round(Math.min(w, h) / 64));
  const take = (x, y) => { const i = (y * w + x) * 4; r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; };
  for (let x = 0; x < w; x += step) { take(x, 0); take(x, h - 1); }
  for (let y = 0; y < h; y += step) { take(0, y); take(w - 1, y); }
  return n ? [r / n, g / n, b / n] : [255, 255, 255];
}

// Produces an RGBA bitmap whose alpha IS the stencil: opaque where the kit should
// print, transparent where the fabric shows through.
function buildStencil(bitmap) {
  const { data, w, h } = readPixels(bitmap);
  const px = data.data;
  const total = w * h;

  let transparent = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] < ALPHA_CUTOFF) transparent++;
  const hasAlpha = transparent / total >= ALPHA_MIN_FRACTION;

  const out = new Uint8ClampedArray(px.length);
  let ink = 0;
  if (hasAlpha) {
    // Already a stencil. Keep the shape, discard the colour, since only the shape
    // is printed.
    for (let p = 0, i = 0; p < total; p++, i += 4) {
      const a = px[i + 3];
      if (a >= 128) { out[i] = out[i + 1] = out[i + 2] = 255; out[i + 3] = 255; ink++; }
    }
  } else {
    const [br, bg, bb] = borderColour(data, w, h);
    for (let p = 0, i = 0; p < total; p++, i += 4) {
      const d = Math.hypot(px[i] - br, px[i + 1] - bg, px[i + 2] - bb);
      if (d > INK_DISTANCE) { out[i] = out[i + 1] = out[i + 2] = 255; out[i + 3] = 255; ink++; }
    }
  }
  return { pixels: out, w, h, coverage: ink / total, derivedFromColour: !hasAlpha };
}

function boundingBox(pixels, w, h) {
  let top = h, bottom = -1, left = w, right = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (pixels[row + x * 4 + 3] < 128) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (bottom < 0) return null;
  return { left, top, w: right - left + 1, h: bottom - top + 1 };
}

// The whole point: crop to the artwork, then centre it on a square canvas so it
// fills the square the buyer paid for instead of sitting in the middle of it.
export async function fitArtworkToSquare(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  const st = buildStencil(bitmap);
  bitmap.close?.();

  const box = boundingBox(st.pixels, st.w, st.h);
  if (!box) return null; // nothing to print

  const src = document.createElement("canvas");
  src.width = st.w;
  src.height = st.h;
  src.getContext("2d").putImageData(new ImageData(st.pixels, st.w, st.h), 0, 0);

  const out = document.createElement("canvas");
  out.width = OUTPUT_PX;
  out.height = OUTPUT_PX;
  const ctx = out.getContext("2d");
  const usable = OUTPUT_PX * (1 - SAFE_MARGIN * 2);
  const scale = Math.min(usable / box.w, usable / box.h);
  const dw = box.w * scale;
  const dh = box.h * scale;
  // Nearest-neighbour would alias a cropped-up drawing badly; smoothing keeps the
  // edge clean, and the mask threshold tidies the half-transparent fringe.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, box.left, box.top, box.w, box.h,
    (OUTPUT_PX - dw) / 2, (OUTPUT_PX - dh) / 2, dw, dh);

  return {
    src: out.toDataURL("image/png"),
    // Reported so the UI can tell somebody their artwork will print as a near-solid
    // block, which is what a photo does here.
    coverage: st.coverage,
    derivedFromColour: st.derivedFromColour,
    filled: (dw * dh) / (OUTPUT_PX * OUTPUT_PX),
    croppedFrom: { w: st.w, h: st.h },
    box,
  };
}

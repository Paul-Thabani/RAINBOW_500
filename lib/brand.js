// The club's rainbow, sampled from the real crest in public/assets/hbufc-logo.png
// rather than approximated from a generic palette.
//
// The crest draws seven concentric rings of near-identical thickness (12 to 14px
// in a 1500px logo), so the stops below are evenly weighted to match. Reading
// outward from the football, the rings run magenta, purple, blue, green, yellow,
// orange, red; listed here in the conventional red-to-magenta direction.
//
// Two things the previous hand-picked palette got wrong: it ended on a purple
// (#a855f7) where the crest's innermost ring is a vivid magenta, and it carried
// both an indigo and a purple, which read as an extra colour the crest does not
// have.
export const RAINBOW_STOPS = [
  "#eb2b29", // red
  "#f37e21", // orange
  "#f6ea0c", // yellow
  "#2cae4a", // green
  "#117ec2", // blue
  "#5f4ea1", // purple
  "#e41f91", // magenta
];

// For accents: rules and bars. For text, use RAINBOW_INK_GRADIENT below.
export const RAINBOW_GRADIENT = `linear-gradient(90deg,${RAINBOW_STOPS.join(",")})`;

// The same rainbow used AS text, on the dark page.
//
// RAINBOW_SURFACE below solves dark text sitting ON the gradient. Text filled
// WITH the gradient is the opposite problem and was never handled: the stops
// themselves have to be light enough to read against the page. Measured against
// #0a1628, the purple came out at 2.67:1 and every one of the five gradient
// headlines failed WCAG AA on it, worst case a 10px label at 2.40:1.
//
// Washing toward white is the obvious fix and the wrong one here, for the reason
// recorded below: it is what made the button read as pastel and childlike. So each
// stop keeps its hue, has its saturation floored at 62% so it stays vivid, and
// only its lightness is raised, by the smallest step that clears 4.5:1.
//
// Five of the seven barely move and orange and yellow do not move at all, so this
// still reads as the crest. The purple is the only real change, 47% to 65%
// lightness, which is exactly the stop that was failing. Worst stop now 4.50:1.
export const RAINBOW_INK_STOPS = [
  "#ec3937", // red      4.24 -> 4.50
  "#f37e21", // orange   6.75, unchanged
  "#f6ea0c", // yellow  14.41, unchanged
  "#29b149", // green     6.27 -> 6.43
  "#1286ce", // blue      4.13 -> 4.58
  "#856edd", // purple    2.67 -> 4.54
  "#e62f99", // magenta   4.23 -> 4.51
];

// Use this for text filled with the rainbow. RAINBOW_GRADIENT stays as it is for
// rules, bars and other decoration, which carries no contrast requirement and is
// better for being fully saturated.
export const RAINBOW_INK_GRADIENT = `linear-gradient(90deg,${RAINBOW_INK_STOPS.join(",")})`;

// For surfaces that carry dark text, such as the hero's primary button.
//
// Dark text on the raw gradient is unreadable over the purple: #0a0a0c against
// #5f4ea1 is 2.91:1, well under the 4.5:1 WCAG AA needs, and red, blue and
// magenta only scrape past it. Flipping to white text is worse, failing on
// orange, yellow and green.
//
// Washing the gradient with 25% white lifts every stop enough for dark text to
// pass, worst case purple at 5.19:1, while still reading unmistakably as the
// club rainbow. Measured, not guessed; see the commit for the full table.
export const RAINBOW_SURFACE =
  `linear-gradient(rgba(255,255,255,.25),rgba(255,255,255,.25)),${RAINBOW_GRADIENT}`;

// Ink for anything sitting on RAINBOW_SURFACE.
export const RAINBOW_SURFACE_INK = "#0a0a0c";

// Primary button surface.
//
// The full spectrum behind a label was the wrong shape for a button. Keeping
// text legible across seven saturated stops forced the gradient to be washed
// with 25% white, which is exactly what made it read as pastel and childlike,
// and dark ink on a busy multicolour field is noisy however carefully it is
// tuned. The contrast table above is the evidence: every option was a
// compromise.
//
// Moving the spectrum to a 4px rule along the base fixes both at once. The
// crest is still all seven colours, in the role it already plays everywhere
// else on this page (the thin rainbow rule above every section heading), and
// the label now sits on a single solid colour. White on #122844 measures
// 14.9:1, against the 5.19:1 worst case the washed gradient allowed.
export const BUTTON_SURFACE = `${RAINBOW_GRADIENT} bottom / 100% 4px no-repeat, #122844`;
export const BUTTON_INK = "#ffffff";

// The same treatment for buttons on the white editor modal rather than the dark
// page. Deeper fill so it still reads as the primary action against white.
export const BUTTON_SURFACE_ON_LIGHT = `${RAINBOW_GRADIENT} bottom / 100% 4px no-repeat, #12151c`;

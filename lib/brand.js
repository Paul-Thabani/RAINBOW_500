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

// For accents: rules, bars, and text via background-clip.
export const RAINBOW_GRADIENT = `linear-gradient(90deg,${RAINBOW_STOPS.join(",")})`;

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

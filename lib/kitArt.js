// The two shirt photographs, imported rather than referenced by path.
//
// A static import gives next/image the intrinsic width and height at build
// time, which is what lets it emit width/height on the <img> (no layout shift)
// and serve a content-hashed WebP instead of the original PNG. Passing the
// string "/assets/kit-customise.png" instead would send the raw 542 KB PNG.
//
// They live here rather than being imported in each component because three
// separate places pick between the same front/back pair, and they must all
// resolve to the same two modules for the build to dedupe them.
import kitFront from "../public/assets/kit-customise.png";
import kitBack from "../public/assets/kit-back.png";

// `panel` is the same "front" | "back" string the zone data already uses, so
// call sites keep reading the way they did with the ternary on a path.
export function kitArtFor(panel) {
  return panel === "back" ? kitBack : kitFront;
}

export { kitFront, kitBack };

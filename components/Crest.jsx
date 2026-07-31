import Image from "next/image";
import crest from "../public/assets/hbufc-logo.png";

// The crest source used to be a 1500x1500 PNG (923 KB) rendered at 34-42 CSS
// px, so a phone downloaded roughly 900 KB to draw a thumbnail. The file is now
// 132x132, which still covers the largest slot at 3x device pixel ratio, and
// next/image serves a right-sized WebP on top of that.
export default function Crest({ size = 44 }) {
  return (
    <Image
      src={crest}
      alt="Hout Bay United FC crest"
      width={size}
      height={size}
      // Eager, not lazy: this sits in the header above the fold and is a couple
      // of KB, so there is nothing worth deferring. The footer crest is the
      // same URL, so it costs no extra request.
      loading="eager"
      style={{ display: "block", width: size, height: size, objectFit: "contain" }}
    />
  );
}

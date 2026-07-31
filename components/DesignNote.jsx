
export default function DesignNote() {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "26px 0 0" }}>
      <div
        style={{
          position: "relative",
          transform: "rotate(-2deg)",
          background: "#10203a",
          borderRadius: 10,
          padding: "14px 20px 14px 34px",
          maxWidth: 460,
          boxShadow: "0 14px 30px rgba(0,0,0,.35)",
          border: "1.5px dashed #35507a",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#0a1526",
            boxShadow: "0 0 0 1.5px #35507a",
          }}
        />
        <div
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            marginBottom: 6,
            // Solid, not the rainbow. At 10px with .16em tracking a gradient gives
            // every letter a different colour, which measured 2.40:1 on its worst
            // stop and is the least legible line on the page. This card carries the
            // information a buyer most needs to get right (white only, 3cm, bold
            // shapes), so it is the wrong place to spend legibility on decoration.
            // #e7e7ea is already this card's emphasis colour, so no new colour is
            // introduced, and it measures 13.19:1 on the card's #10203a. The house
            // pattern for section labels is a solid colour anyway; this one was the
            // outlier.
            color: "#e7e7ea",
          }}
        >
          A note from the manufacturer
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 600, color: "#b9bac2" }}>
          One square is roughly <strong style={{ color: "#e7e7ea" }}>3 cm across</strong> on a medium shirt,
          about the size of a postage stamp. The kit is dye sublimated, which means your artwork is printed
          as <strong style={{ color: "#e7e7ea" }}>white only</strong>: there is no white ink, so the white
          is the fabric itself showing through and the colour is printed around it. Bold, simple shapes
          come out best. Very thin lines and small lettering close up at this size, and colour, shading
          and gradients cannot be reproduced. The position may shift slightly once printed. Everything
          else is exactly as shown.
        </div>
      </div>
    </div>
  );
}

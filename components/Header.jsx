import Crest from "./Crest";
import { RAINBOW_GRADIENT, BUTTON_SURFACE, BUTTON_INK } from "../lib/brand";

// These were 15px tall, set purely by the line height of 13px text. WCAG 2.5.8
// asks for 24x24 and a fingertip wants 44, and a nav link you have to aim at is a
// bad first impression on an audience that is 82% mobile. The row's height was
// already 37px because of the button beside them, so giving them a real target
// costs 7px of header and nothing else.
const navLink = {
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: ".04em",
  color: "#cfd0d6",
  display: "inline-flex",
  alignItems: "center",
  minHeight: 44,
};

export default function Header({ onJoin }) {
  return (
    <header className="rb-header" style={{ padding: "22px 0", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", flex: "none" }}>
          <Crest size={42} />
        </div>
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontWeight: 900, letterSpacing: ".08em", fontSize: 15, textTransform: "uppercase" }}>
            Hout Bay United FC
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#8b8b93",
              letterSpacing: ".2em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            The Next Chapter · 2026/27
          </div>
        </div>
      </div>
      <div
        className="rb-header-nav"
        // columnGap rather than gap: `gap` sets both axes, and once the links
        // became 44px tall targets the 26px row gap sat on top of that height and
        // made the stacked header loose. The box height separates the rows.
        style={{ display: "flex", alignItems: "center", columnGap: 26, rowGap: 0 }}
      >
        <a href="#idea" style={navLink}>
          The idea
        </a>
        <a href="#impact" style={navLink}>
          Where it goes
        </a>
        <a href="#reach" style={navLink}>
          The reach
        </a>
        <button
          type="button"
          onClick={onJoin}
          style={{
            cursor: "pointer",
            fontFamily: "inherit",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: ".04em",
            color: BUTTON_INK,
            background: BUTTON_SURFACE,
            padding: "11px 18px",
            borderRadius: 999,
            border: "none",
          }}
        >
          Join the Legacy 500
        </button>
      </div>
    </header>
  );
}

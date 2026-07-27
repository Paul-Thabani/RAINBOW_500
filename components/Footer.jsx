import Crest from "./Crest";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #1a3050",
        padding: "30px 0 50px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", flex: "none" }}>
          <Crest size={34} />
        </div>
        <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase" }}>
          Hout Bay United FC
        </div>
      </div>
      <div style={{ fontSize: 13, color: "#8b8b93", fontWeight: 700, letterSpacing: ".06em" }}>
        hbufc.co.za · @hbufc · Hout Bay, Cape Town
      </div>
    </footer>
  );
}

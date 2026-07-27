export default function Crest({ size = 44 }) {
  return (
    <img
      src="/assets/hbufc-logo.png"
      alt="Hout Bay United FC crest"
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size, objectFit: "contain" }}
    />
  );
}

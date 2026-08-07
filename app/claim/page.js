import Link from "next/link";
import { RAINBOW_GRADIENT } from "../../lib/brand";
import ClaimForm from "./ClaimForm";

// Where somebody who was handed a square puts their artwork on it.
//
// A placement made from /admin is paid for and holds its cell before anyone has
// decided what goes on it, because the money often arrives first: cash at a
// match, a card payment taken elsewhere, or a square given away. The admin hands
// over a claim token, and this is the page that token opens.
//
// The token comes in on the query string so a link can be pasted straight into
// WhatsApp, but the page also takes it typed in, because tokens get read down a
// phone or copied off a scrap of paper. Everything is loaded client-side through
// /api/claim rather than rendered here from the database, so a wrong token is a
// message on this page instead of a 404 shell.
export const metadata = {
  title: "Add your artwork · The Legacy 500",
  description:
    "Enter the code you were given to put your logo or message on your square of the Hout Bay United Legacy 500 kit.",
  // A claim link is a private thing handed to one person. Nothing about it
  // belongs in a search index.
  robots: { index: false, follow: false },
};

export default async function ClaimPage({ searchParams }) {
  const sp = await searchParams;
  const token = typeof sp?.t === "string" ? sp.t : "";

  return (
    <div style={{ minHeight: "100vh", padding: "52px 22px 80px" }}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "#8b8b93",
            marginBottom: 18,
          }}
        >
          <span style={{ width: 26, height: 3, borderRadius: 2, background: RAINBOW_GRADIENT }} />
          Your square is paid for
        </div>

        <h1
          style={{
            fontSize: "clamp(32px,6vw,54px)",
            fontWeight: 900,
            margin: "0 0 16px",
            letterSpacing: "-.02em",
            lineHeight: 1.02,
            textTransform: "uppercase",
          }}
        >
          Put your mark on it.
        </h1>

        <ClaimForm initialToken={token} />

        <div style={{ marginTop: 36, fontSize: 14 }}>
          <Link href="/" style={{ color: "#8b8b93", fontWeight: 700 }}>
            &larr; Back to the shirt
          </Link>
        </div>
      </div>
    </div>
  );
}

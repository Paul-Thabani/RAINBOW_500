import "./globals.css";

const TITLE = "The Legacy 500 · Hout Bay United FC";
const DESCRIPTION =
  "A community club chasing professional football. This season, we're splitting one shirt into 500 squares to raise R1,000,000 that goes into helping the club every year.";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://shirt.hbufc.co.za";

// This campaign runs on sharing, so a link pasted into WhatsApp rendering as a
// bare URL with no image was costing more than most on-page changes could win
// back. None of this alters a single pixel of the page itself.
export const metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Hout Bay United FC",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_ZA",
    images: [
      {
        url: "/assets/share-card.jpg",
        width: 1200,
        height: 630,
        alt: "The Legacy 500: one Hout Bay United shirt split into 500 squares",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/assets/share-card.jpg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

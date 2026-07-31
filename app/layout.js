import "./globals.css";

export const metadata = {
  title: "The Legacy 500 · Hout Bay United FC",
  description:
    "A community club chasing professional football. This season, we're splitting one shirt into 500 squares to raise R1,000,000 for the players who carry Hout Bay's hopes.",
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

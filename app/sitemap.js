// The campaign page plus the two legal pages. Exists because /sitemap.xml was
// a 404 and robots.txt now points at it.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://shirt.hbufc.co.za";

export default function sitemap() {
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}

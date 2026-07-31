// One page, so this is a one-entry sitemap. It exists because /sitemap.xml was
// a 404 and robots.txt now points at it.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://shirt.hbufc.co.za";

export default function sitemap() {
  return [
    {
      url: SITE,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}

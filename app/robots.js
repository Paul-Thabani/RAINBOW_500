// /robots.txt and /sitemap.xml were both 404. Not a ranking exercise: a
// campaign that runs on shared links wants to be indexable, and /admin holds
// every buyer's email and phone behind nothing but Basic Auth, so it should
// never be crawled even though it cannot be read.
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://shirt.hbufc.co.za";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout-success", "/checkout-cancelled"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}

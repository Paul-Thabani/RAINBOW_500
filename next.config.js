/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["steersman-elaborate-populace.ngrok-free.dev"],

  // next/image needs no special setup to work here. The optimiser is an ordinary
  // route on the Next server (/_next/image), and the vhost already forwards
  // everything except /.well-known with "ProxyPass / http://127.0.0.1:8273/",
  // so it is proxied like any other path. The %2F in the optimiser's url query
  // parameter is in the query string, not the path, so AllowEncodedSlashes is
  // not involved either. sharp is installed, which is what Next uses to encode.
  images: {
    // Optimised variants are addressed by a content hash, so a stale cache can
    // never serve the wrong bytes. The 4 hour default just means repeat
    // visitors re-fetch images they already have. 30 days suits a campaign page
    // whose art changes rarely, and most of the audience is on mobile data.
    minimumCacheTTL: 2592000,
  },

  async headers() {
    return [
      {
        // Files under /public are served by Next with "public, max-age=0", so
        // every view re-downloaded them. The two the kit customiser uses are
        // about 540 KB each and were 18.4 MB of real visitor traffic in a
        // single day, the largest slice of it.
        //
        // 30 days, matching the minimumCacheTTL above and for the same reason:
        // the art on a campaign page changes rarely and most of the audience is
        // on mobile data.
        //
        // Deliberately NOT immutable, unlike the per-square art in
        // app/api/square/[squareId]/artResponse.js. A square's content is
        // written once at checkout and genuinely can never change, so immutable
        // is honest there. These filenames are fixed and a deploy can replace
        // the bytes behind them, so the browser needs to be able to revalidate.
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

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
};

module.exports = nextConfig;

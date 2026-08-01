// Asserts that every asset the served HTML references actually resolves.
//
// Written because live served a page whose stylesheet 500'd for about twenty minutes
// and nothing noticed. The page itself returned 200, the API returned 200, and every
// check being run at the time passed, because they all checked the HTML and the API and
// never the assets the HTML asked for. The result was an entirely unstyled site.
//
// The cause is this project's shared .next: building a branch in the deploy directory
// replaces the static assets under the running server, so the HTML it serves references
// hashes that no longer exist. Run this after any deploy.
//
//   node scripts/verify-deploy.mjs https://shirt.hbufc.co.za/
const base = process.argv[2] || "https://shirt.hbufc.co.za/";
const origin = new URL(base).origin;

const res = await fetch(base);
const html = await res.text();
console.log(`  ${base} -> ${res.status}`);
if (!res.ok) process.exit(1);

// Entities have to be decoded first. Requesting a URL with a literal &amp; in it makes
// Next reject it as malformed, which reads as a broken asset when the asset is fine.
const decode = (u) => u.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&quot;/g, '"');
const refs = [...new Set([...html.matchAll(/(?:href|src)="(\/_next\/[^"]+)"/g)].map((m) => decode(m[1])))];
console.log(`  assets referenced by the HTML: ${refs.length}`);

let bad = 0;
for (const ref of refs) {
  const r = await fetch(origin + ref);
  if (!r.ok) {
    bad++;
    console.log(`    ${r.status}  ${ref}`);
    continue;
  }
  // A 200 that is not actually the asset is still a failure. A stylesheet that comes
  // back as an error page has the wrong type and is suspiciously small.
  if (ref.endsWith(".css")) {
    const body = await r.text();
    if (body.length < 200) { bad++; console.log(`    200 but only ${body.length} bytes  ${ref}`); }
  }
}
if (bad) {
  console.log(`\n  ${bad} asset(s) the page needs do not resolve. The site is broken even though / returns 200.`);
  process.exit(1);
}
console.log("  all assets resolve");

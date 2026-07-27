# The Rainbow 500 · Hout Bay United FC

Next.js version of the "Rainbow 500" kit fundraiser landing page: hero and
stats sections, a canvas-based fill tracker, and a full customize-a-square
flow (pick a square or 2x2 block on the shirt, front/back and both sleeves,
add a logo/message/doodle, review with a hover-zoom lens, then pay for it via
Netcash Pay Now). A square only shows as claimed once its payment is
confirmed - that state lives in Supabase, shared by every visitor, not just
the browser that picked it.

## Setup

1. Install Node.js 20+ if you haven't already (via [nodejs.org](https://nodejs.org)
   or `brew install node`).
2. Create a free project at [supabase.com](https://supabase.com), then in its
   SQL editor run `supabase/schema.sql` from this repo. (Logos/doodles are
   stored directly in that table as base64 - no separate Storage bucket
   needed.)
3. Copy `.env.local.example` to `.env.local` and fill in your Supabase
   Project URL, anon key, and service_role key (Settings → API in the
   Supabase dashboard).
4. Set up Netcash (see below), then put your Pay Now Service Key into
   `NETCASH_SERVICE_KEY` in `.env.local`.
5. From this folder:
   ```
   npm install
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000).

## Netcash setup

Unlike Payfast, Netcash has **no public shared sandbox** - you need a real
Netcash account before you can test anything:

1. Sign up for a Netcash account and enable the **Pay Now** service.
2. In Account Profile → **NetConnector** → **Pay Now**, tick **"Make test
   mode active"** while developing (untick before going live), and set:
   - **Accept URL**: `https://<your-site>/checkout-success`
   - **Decline URL**: `https://<your-site>/checkout-cancelled`
   - **Notify URL**: `https://<your-site>/api/netcash/notify`

   These three are configured once here, in the dashboard - they are **not**
   sent per-transaction like Payfast's return/cancel/notify URLs, and
   Netcash's docs say these URLs must not already contain a `?query string`.
   That's why `/checkout-success` and `/checkout-cancelled` exist as their
   own tiny pages: they just immediately redirect to `/?checkout=success` /
   `/?checkout=cancelled` (preserving the `ref` Netcash appends), which is
   what the main page actually listens for.
3. Copy the Pay Now **Service Key** (a GUID) into `NETCASH_SERVICE_KEY` in
   `.env.local`.
4. Test card numbers (only work while test mode is active): Visa
   `4000000000000002` (success) / `4000000000000036` (decline), any future
   expiry, CVC `123`.

**Local testing limitation**: Netcash's Notify URL is a server-to-server
callback - it can never reach `http://localhost:3000`. Clicking "Proceed to
payment" will still take you all the way to Netcash's checkout and back
locally, but the automatic "reserved after payment" confirmation needs
either `ngrok http 3000` (put that HTTPS URL in the dashboard's Notify URL
and in `NEXT_PUBLIC_SITE_URL` while testing) or a real deployment.

**Security note**: Netcash's public docs don't describe a request signature
or an IP allowlist for the Notify callback (Payfast has both). The checkout
flow mitigates this by using an unguessable random reference per order and
only ever accepting the first notify that resolves a still-pending
reference, cross-checked against the amount recorded when it was created -
but this is weaker than a signed callback. Worth confirming with Netcash
support whether an (undocumented) IP allowlist or signature option exists
before relying on this for real transactions.

## Project structure

- `app/`: Next.js App Router shell (layout, global styles, the single page).
- `app/checkout-success/`, `app/checkout-cancelled/`: the Netcash
  Accept/Decline redirect targets (see "Netcash setup" above).
- `app/api/checkout/route.js`: validates a square is still free, records a
  `pending` order (logo/doodle images included as base64), and returns the
  fields to redirect the browser to Netcash.
- `app/api/netcash/notify/route.js`: Netcash's Notify webhook - matches the
  reference to a pending order, cross-checks the amount, and only then marks
  it (and its squares) `paid`.
- `components/Campaign.jsx`: top-level client component; wires
  `useRainbow500` (editor/UI state) and `useReservations` (the
  Supabase-backed claimed-squares data + checkout) together.
- `lib/zones.js`: pure grid/zone definitions and placement math - no "use
  client" directive, so it's safe to import from both the UI hook and the
  server-side API routes.
- `lib/useRainbow500.js`: the editor/UI state hook (which square is open,
  the doodle canvas, tabs, etc); re-exports everything from `lib/zones.js`.
- `lib/useReservations.js`: fetches/polls confirmed-paid squares from
  Supabase and exposes `checkout()`.
- `lib/netcash.js`: Netcash Pay Now field building and Notify parsing.
- `lib/supabaseClient.js` / `lib/supabaseAdmin.js`: browser (anon key) and
  server-only (service-role key) Supabase clients.
- `supabase/schema.sql`: the `squares` table + `paid_squares` public view -
  run once in the Supabase SQL editor.
- `components/ShirtPanel.jsx`: the interactive/reviewable shirt grid overlay,
  shared by the kit section and the editor's review step.
- `components/EditorModal.jsx`: the "make it yours" modal (block mode,
  logo/message/doodle tabs, review-with-zoom step, checkout).

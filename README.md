# The Rainbow 500 · Hout Bay United FC

Next.js version of the "Rainbow 500" kit fundraiser landing page: hero and
stats sections, a canvas-based fill tracker, and a full customize-a-square
flow (pick a square or 2x2 block on the shirt, front/back and both sleeves,
add a logo/message/doodle, review with a hover-zoom lens, then pay for it via
Netcash Pay Now). A square is taken off the board as soon as someone starts
checking out for it, and only renders their artwork once the payment is
confirmed - that state lives in PostgreSQL, shared by every visitor, not just
the browser that picked it.

## Setup

1. Install Node.js 20+ if you haven't already (via [nodejs.org](https://nodejs.org)
   or `brew install node`).
2. Install PostgreSQL 14+ and create the role and database:
   ```
   sudo -u postgres psql
   create role rainbow500 with login password 'something-long-and-random';
   create database rainbow500 owner rainbow500;
   ```
3. Copy `.env.local.example` to `.env.local`, put that connection string in
   `DATABASE_URL`, then apply the schema:
   ```
   psql "$DATABASE_URL" -f db/schema.sql
   ```
   Logos and doodles are stored directly in the table as base64, so there is no
   object storage to configure.
4. Set up Netcash (see below), then put your Pay Now Service Key into
   `NETCASH_SERVICE_KEY` in `.env.local`.
5. Set `ADMIN_USER` and `ADMIN_PASSWORD` in `.env.local`. These guard `/admin`
   (see "Orders dashboard" below) with HTTP Basic Auth, and they are the only
   thing standing between the public internet and every buyer's contact
   details, so use a long random password.
6. From this folder:
   ```
   npm install
   npm run dev
   ```
7. Open [http://localhost:3000](http://localhost:3000).

`db/schema.sql` is idempotent, so re-running it against an existing database is
safe. There is no migration tool: schema changes are applied by hand.

## Security model

The database listens on localhost and nothing outside the machine can reach it.
That is the whole boundary, which is why there are no table policies to get
right:

- The browser never talks to the database. The shirt reads through
  `GET /api/squares`, which selects from the `claimed_squares` view.
- That view is deliberately narrow. It has no `buyer_email` and no
  `buyer_phone`, so the public read endpoint cannot leak contact details even
  if someone later changes it to select everything.
- The view also withholds `content` until a row is `paid`, so artwork from a
  checkout nobody ever paid for is never published. In-progress squares render
  as a plain taken block.
- Every write goes through an API route. Nothing accepts a client-supplied
  status, amount or reference.

## Orders dashboard

`/admin` lists every checkout attempt, confirmed or not, newest first, grouped
so a block of 4 reads as one order. It renders server-side, straight from the
database, so nothing about it is reachable from the browser.

It is gated by `middleware.js` using HTTP Basic Auth against `ADMIN_USER` and
`ADMIN_PASSWORD`. If either is unset the route returns 500 rather than opening
up. Statuses you will see:

- `pending` - checkout started, no payment confirmed yet.
- `paid` - Netcash confirmed the payment. Only these render on the shirt.
- `expired` - checkout abandoned past the 20 minute window and the cell was
  released. A late payment can still move this to `paid`.
- `failed` - Netcash declined, or the amount did not match what we recorded.
- `cancelled` - terminal, not resolvable by a later notify.
- `conflict` - payment accepted but the cells had already gone to someone
  else. Needs a manual refund. Nothing sends an alert, so watch this column.

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
  reference to a pending or expired order, cross-checks the amount, checks
  nothing else has taken the cells, and only then marks it (and its squares)
  `paid`.
- `app/admin/page.js` + `middleware.js`: the orders dashboard and the Basic
  Auth gate in front of it (see "Orders dashboard" above).
- `app/api/squares/route.js`: the shirt's read endpoint. The browser polls this
  because it cannot reach the database directly.
- `components/Campaign.jsx`: top-level client component; wires
  `useRainbow500` (editor/UI state) and `useReservations` (the
  server-backed claimed-squares data + checkout) together.
- `lib/zones.js`: pure grid/zone definitions and placement math - no "use
  client" directive, so it's safe to import from both the UI hook and the
  server-side API routes.
- `lib/useRainbow500.js`: the editor/UI state hook (which square is open,
  the doodle canvas, tabs, etc); re-exports everything from `lib/zones.js`.
- `lib/useReservations.js`: polls `/api/squares` for claimed squares (paid, plus
  still-fresh in-progress checkouts) and exposes `checkout()`.
- `lib/netcash.js`: Netcash Pay Now field building and Notify parsing.
- `lib/db.js`: the pooled Postgres client. Server-only, never import it from a
  Client Component.
- `db/schema.sql`: the `squares` table, the `claimed_squares` view, and the
  unique index that stops two buyers claiming one cell.
- `components/ShirtPanel.jsx`: the interactive/reviewable shirt grid overlay,
  shared by the kit section and the editor's review step.
- `components/EditorModal.jsx`: the "make it yours" modal (block mode,
  logo/message/doodle tabs, review-with-zoom step, checkout).

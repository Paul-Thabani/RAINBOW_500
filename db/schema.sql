-- Rainbow 500 schema, local PostgreSQL.
--
-- Apply with:
--   psql "$DATABASE_URL" -f db/schema.sql
--
-- One row per claimed shirt cell. A "block of 4" purchase inserts 4 rows
-- sharing the same block_id, unless it was bought as a single big 2x2, which
-- is one row with span = 2. m_payment_id holds Netcash's Reference (p2) and
-- pf_payment_id holds Netcash's RequestTrace; both names are holdovers from an
-- earlier Payfast integration.
--
-- This replaces the earlier Supabase schema. Two things went away with it:
-- row level security, and the grant of the public view to an `anon` role.
-- Neither is needed now, because nothing outside this box can reach the
-- database at all. The site reads through GET /api/squares and everything else
-- goes through the API routes, so the network is the boundary rather than a
-- set of table policies.

create table if not exists squares (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null,
  m_payment_id text not null,
  zone_id text not null,
  col int not null,
  row int not null,
  span int not null default 1,
  big boolean not null default false,
  content jsonb, -- includes any uploaded logo/doodle as a base64 data URL
  fill text not null,
  order_amount numeric not null,
  buyer_email text not null,
  buyer_phone text not null,
  -- Status meanings, and which of them a Netcash notify may still resolve:
  --   pending   checkout started, payment not confirmed. Resolvable.
  --   expired   checkout outlived the window and the cell was released back.
  --             Still resolvable, because the buyer can pay after the sweep
  --             has run and Netcash is the authority on whether money moved.
  --   paid      confirmed. The only status that renders artwork on the shirt.
  --   failed    declined, or the amount did not match what we recorded.
  --   cancelled an admin cancelled it from /admin, releasing the cells. Not
  --             resolvable back to paid: reviving an order a human cancelled
  --             on purpose would undo their decision, and the cells may have
  --             been resold since. A payment landing afterwards is still not
  --             ignored, it becomes `conflict` and alerts. See the notify route.
  --   conflict  payment accepted but there are no cells to give for it, either
  --             because they had already gone or because the order was
  --             cancelled first. Needs a manual refund. This one now emails
  --             ADMIN_ALERT_EMAIL rather than only appearing in the log.
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'expired', 'conflict')),
  pf_payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- Board rendering data, split out from `content` so the shirt's poll never has
-- to carry a print-resolution image.
--
-- `content` holds the file the buyer paid to have printed and is left exactly
-- as it was: full resolution, up to about 900KB of base64. It used to be sent
-- to every visitor every 25 seconds by GET /api/squares, which at 500 sold
-- squares is roughly 110MB per poll per open tab.
--
--   content_thumb  a ~96px WebP of the same artwork, built once at checkout by
--                  lib/artwork.mjs. Single-digit KB, and the only version the
--                  board ever loads. Null for a text-only square, and null if
--                  sharp could not read the upload, in which case the square
--                  falls back to a plain claimed block.
--   content_meta   `content` with the base64 `src` removed, so the type, the
--                  message text and the colour can travel in the poll while the
--                  bytes do not.
--
-- Both are populated for pending rows too, but the claimed_squares view below
-- still withholds them until the row is paid.
--
-- Existing rows predate these columns: run scripts/backfill-thumbnails.mjs once
-- after applying this file, or already-sold squares render as blank blocks.
-- Buyer details.
--
-- Name and shirt size are collected at checkout alongside email and phone,
-- because a square comes with a shirt and a size guessed later is a shirt
-- printed wrong.
--
-- The address is collected AFTER payment, on /collect, for two reasons: it is
-- one more field between a willing buyer and a card, and it is not needed to
-- take the money. Shirts are collected in person rather than posted, so the
-- address is for the club's records and for identifying the buyer at handover,
-- not for delivery.
--
-- All nullable: rows created before these columns existed are still valid, and
-- a buyer who never returns to /collect still has a paid square.
alter table squares add column if not exists buyer_name text;
alter table squares add column if not exists shirt_size text;
alter table squares add column if not exists buyer_address text;
alter table squares add column if not exists details_completed_at timestamptz;

-- Shirts are collected in person, which does not work for a supporter abroad.
-- Rather than hoping they mention it in the address free text, /collect asks
-- outright, so fulfilment can filter on it instead of reading every address.
alter table squares add column if not exists ship_overseas boolean not null default false;

alter table squares add column if not exists content_thumb bytea;
alter table squares add column if not exists content_meta jsonb;

create index if not exists squares_zone_cell_idx on squares (zone_id, col, "row");
create index if not exists squares_block_idx on squares (block_id);
create index if not exists squares_status_idx on squares (status);
create index if not exists squares_payment_ref_idx on squares (m_payment_id);

-- At most one live (pending or paid) row per physical cell, ever. The database
-- itself refuses a second checkout for a cell someone is already mid-checkout
-- or paid for, closing the race where two buyers could both pass the checkout
-- route's availability check before either finished paying.
--
-- Known gap: a big 2x2 is stored as one row with span = 2, so only its anchor
-- cell gets an index entry and the other three cells it covers are protected
-- only by the route's non-atomic pre-check. Fixing that properly means either
-- storing four rows for big blocks, or an exclusion constraint over the span
-- box, roughly:
--   create extension if not exists btree_gist;
--   alter table squares add constraint squares_no_overlap
--     exclude using gist (
--       zone_id with =,
--       box(point(col, row), point(col + span - 1, row + span - 1)) with &&
--     ) where (status in ('pending', 'paid'));
create unique index if not exists squares_no_double_claim on squares
  (zone_id, col, "row") where status in ('pending', 'paid');

-- What the shirt renders from, read via GET /api/squares.
--
-- Deliberately narrow: no buyer_email, no buyer_phone. Keeping those out of the
-- view means the read endpoint cannot leak contact details even if someone
-- later changes it to select everything.
--
-- A square leaves the board as soon as checkout starts, not once payment
-- confirms, which is what stops two people buying the same one. A pending row
-- older than 20 minutes is treated as abandoned and drops back out; see the
-- checkout route's lazy sweep, which needs no cron.
--
-- Artwork is exposed only once paid, exactly as before. An in-progress square
-- renders as a neutral block, so artwork from a checkout that is never paid for
-- is never published. The paid gate now covers content_meta and has_art, which
-- are the only two artwork columns that leave this view at all.
--
-- The full `content` is deliberately absent. It is not merely dropped by the
-- route: it never crosses this view, so the polled response cannot regrow a
-- print-resolution payload by accident. Full artwork for a paid square is
-- served one square at a time, cacheably, by
-- GET /api/square/[squareId]/art, which re-checks `paid` itself.
--
-- `id` is exposed because it is how the board addresses a square's thumbnail.
-- It is a random uuid over already-public artwork, same as block_id.
--
-- Recreated rather than replaced: `create or replace view` cannot change a
-- view's column list, and this one gained id and has_art and lost content.
-- Wrapped in a transaction so the live site never sees the view missing.
begin;

drop view if exists claimed_squares;

create view claimed_squares as
  select
    id,
    zone_id,
    col,
    "row",
    span,
    big,
    case when status = 'paid' then content_meta else null end as content_meta,
    (status = 'paid' and content_thumb is not null) as has_art,
    fill,
    block_id,
    order_amount,
    status
  from squares
  where status = 'paid'
     or (status = 'pending' and created_at > now() - interval '20 minutes');

commit;

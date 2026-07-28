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
  --   cancelled terminal. Not resolvable by a later notify.
  --   conflict  payment accepted but the cells had already gone. Needs a
  --             manual refund, and nothing alerts anyone, so watch for it.
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'expired', 'conflict')),
  pf_payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

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
-- `content` is exposed only once paid. An in-progress square renders as a
-- neutral block, so artwork from a checkout that is never paid for is never
-- published.
create or replace view claimed_squares as
  select
    zone_id,
    col,
    "row",
    span,
    big,
    case when status = 'paid' then content else null end as content,
    fill,
    block_id,
    order_amount,
    status
  from squares
  where status = 'paid'
     or (status = 'pending' and created_at > now() - interval '20 minutes');

-- Run this once in the Supabase project's SQL editor.
-- One row per claimed shirt cell. A "block of 4" purchase inserts 4 rows
-- sharing the same block_id. m_payment_id holds the payment gateway's own
-- transaction reference (currently Netcash's Reference/p2 field).
--
-- If `public.squares` already exists (buyer_email/buyer_phone added after
-- initial setup), run this migration instead of the create table below:
--   alter table public.squares add column buyer_email text not null default '';
--   alter table public.squares add column buyer_phone text not null default '';
--   alter table public.squares alter column buyer_email drop default;
--   alter table public.squares alter column buyer_phone drop default;

create table public.squares (
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
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'conflict')),
  pf_payment_id text, -- the gateway's own transaction/trace id (e.g. Netcash's RequestTrace)
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index squares_zone_cell_idx on public.squares (zone_id, col, "row");
create index squares_block_idx on public.squares (block_id);
create index squares_status_idx on public.squares (status);
create index squares_payment_ref_idx on public.squares (m_payment_id);

alter table public.squares enable row level security;
-- Deliberately no policies on the base table: anon/authenticated get zero
-- direct access. Only the service-role key (used server-side in the API
-- routes) can read or write it.

-- Public, read-only view of confirmed squares only - this is what the site
-- reads to render the shirt for every visitor.
create view public.paid_squares as
  select zone_id, col, "row", span, big, content, fill, block_id, order_amount
  from public.squares
  where status = 'paid';

grant select on public.paid_squares to anon, authenticated;

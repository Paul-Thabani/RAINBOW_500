#!/usr/bin/env bash
#
# Release squares held by checkouts nobody ever paid for.
#
# The checkout route already does this, but lazily: it sweeps before checking
# availability, so a dead order is only cleared when the next person tries to
# buy. On a quiet day that means a square sits held for hours, and /admin shows
# a pending order that is actually dead. One sat for 6.5 hours on the first day
# of live selling.
#
# The window must match CHECKOUT_WINDOW in app/api/checkout/route.js and the
# interval in the claimed_squares view. All three are 20 minutes. Changing one
# without the others makes the board and the database disagree.
#
# `expired`, not `cancelled`, for the same reason the app uses it: the buyer may
# still be on Netcash's page and pay after this runs, and notify is allowed to
# resolve `expired` into `paid`. Netcash is the authority on whether money moved,
# not this timer.

set -euo pipefail

APP_DIR=/var/www/shirt.hbufc.co.za
LOG=/var/log/rainbow500-sweep.log

log() { printf '%s  %s\n' "$(date -Is)" "$1" >> "$LOG"; }

DATABASE_URL=$(grep -E '^DATABASE_URL=' "$APP_DIR/.env.local" | head -1 | cut -d= -f2-)
if [[ -z "${DATABASE_URL:-}" ]]; then
  log "FAILED: DATABASE_URL not readable"
  exit 1
fi

# Counted in SQL rather than by piping RETURNING through wc -l, which counted a
# trailing newline and reported one more row than it had touched.
n=$(psql "$DATABASE_URL" -tAc "
  with released as (
    update squares
       set status = 'expired'
     where status = 'pending'
       and created_at < now() - interval '20 minutes'
    returning 1
  )
  select count(*) from released" | tr -d '[:space:]')

# Only log when it did something, so the file stays readable rather than
# filling with 288 'nothing to do' lines a day.
if [[ "$n" -gt 0 ]]; then
  log "released $n stale checkout row(s)"
fi

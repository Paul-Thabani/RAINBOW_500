# If someone starts abusing the squares

Not implemented. This is the plan for the day it is needed, written while nothing
is wrong so the decision is not made in a panic.

## What the abuse actually is

Anyone can POST to `/api/checkout` with any name, email and phone and hold a
square. Nothing verifies a human, and nothing verifies the email. A script could
hold squares in a loop and make the board look sold out while raising nothing.

We saw one instance of somebody using Harrison's real name, email and phone from
a Brazilian IP on 1 August 2026. Sixteen requests, an ordinary browsing pattern,
one checkout, no payment. Almost certainly not malicious, but it is the shape the
abuse would take.

## Why not to act yet

The damage is already capped, and the cap is short:

- A hold lasts **20 minutes**, then `scripts/expire-stale-checkouts.sh` releases
  it on a five minute cron.
- `content` is capped at 2MB, and the browser resizes before upload, so there is
  no cheap way to fill the disk.
- Nothing is charged and nothing is published: artwork stays hidden until `paid`.

So the worst a determined nuisance achieves is a board that looks busier than it
is, self-healing within 25 minutes. Building defences before that happens costs
real conversions on a fundraiser whose whole job is to make buying easy.

**Do not implement any of this speculatively.**

## The triggers

Act when one of these is true, not before.

| Signal | Threshold | Query |
| --- | --- | --- |
| Holds never paid for | more than 20 `expired` for every `paid`, over a day | see below |
| Rapid holds from one source | more than 5 checkouts in 10 minutes, same IP | Apache log |
| Board looks full, money does not follow | `expired + pending` over 50 while `paid` is flat | see below |

```sql
-- run against the shirt database
select status, count(*), min(created_at), max(created_at)
  from squares group by status order by status;
```

```bash
# checkouts per IP today, excluding this box
sudo grep "POST /api/checkout" /var/log/apache2/shirt-hbufc-access.log \
  | grep -v '^102.130.124.15' | awk '{print $1}' | sort | uniq -c | sort -rn
```

## The response, cheapest first

### 1. Cloudflare Turnstile, invisible, on the hold

The right first move, and the one Harrison called: it tests whether the visitor
behaves like a browser rather than punishing them for where they are.

- The domain is already on Cloudflare, so there is nothing new to buy or host.
- Use the **invisible or managed** widget, not a puzzle. Most people see nothing.
- Gate the **checkout POST**, which is the thing that holds a square. Not page
  load: the board must stay readable to anyone, including a crawler.
- Verify server-side in `/api/checkout` before the insert. A client-side token
  alone proves nothing.

**Fail open, not closed.** This is the part that matters for a fundraiser. If
Cloudflare is unreachable or the token is missing, log it and let the sale
through. A verification outage must never be able to stop the club taking money.
Add an `ABUSE_ENFORCE` env flag so it can be flipped to fail closed for the hours
an actual attack is running, then flipped back.

Roll it out in two stages:

1. **Monitor.** Verify, log the outcome, allow everything. Gives a baseline of
   how many real buyers would have been caught by a false positive. If that
   number is not near zero, do not proceed to stage 2.
2. **Enforce.** Reject only on a definite failure, never on a missing token.

Rough effort: half a day including the monitor period, most of it waiting.

### 2. Require the email to be reachable, only if Turnstile is not enough

A hold could require a one-time code sent to the email before it is confirmed.
This kills scripted abuse dead, because it needs a real inbox.

It also adds a step in the middle of a payment, which is exactly where people
give up. **Do not do this unless stage 1 has failed**, and if it happens, put the
code step *after* payment rather than before.

### 3. Shorten the window under attack

`CHECKOUT_WINDOW` is 20 minutes in three places that must agree: the checkout
route, the `claimed_squares` view, and the sweep script. Under active abuse,
dropping all three to 5 minutes reduces how much of the board can be held at
once. It also means a slow buyer on a bad connection loses their square, so this
is a lever for an incident, not a permanent setting.

## What not to do

**IP rate limiting or hard per-IP caps.** South African mobile networks put large
numbers of real people behind the same handful of addresses, and this audience is
82% mobile. A cap low enough to matter would block genuine buyers on Vodacom, and
we would never hear from the ones it blocked. This is the reason Turnstile is the
answer instead.

**Blocking countries or requiring a South African number.** The campaign now
posts shirts overseas. Geography is a customer, not a signal.

**A visible puzzle CAPTCHA.** On a phone, before a R2,000 payment, that is a
measurable loss for a threat that currently does not exist.

## If it is happening right now

1. Confirm it: run both queries above. Distinguish a scripted flood from a busy
   day, which looks similar in the `pending` count and completely different in
   the timing.
2. Buy time: run the sweep by hand,
   `./scripts/expire-stale-checkouts.sh`, and drop the window to 5 minutes in the
   three places listed above.
3. Only then implement stage 1, with Cloudflare's dashboard set to challenge the
   offending traffic in the meantime, which needs no deploy at all.
4. Log it in `FAULTS.md` with the measurement, per this project's convention.

## Notes for whoever implements it

- Cloudflare has a documented setup path for Turnstile, including creating the
  widget and wiring canonical server-side `siteverify`. Use it rather than
  hand-rolling the verification call.
- The secret belongs in `.env.local` alongside the Netcash key, and the sitekey
  is public by design.
- Whatever is added, it must not touch the notify callback. Netcash cannot solve
  a CAPTCHA, and blocking that path would lose confirmed payments, which is a far
  worse failure than a held square.

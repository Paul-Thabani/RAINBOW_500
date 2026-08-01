# Fault log

Every fault found in this project, what caused it, the evidence, and what fixed it.
Newest first. The point is that a fault is never "probably fine now": it has a
measurement before and a measurement after.

Rules for this file, also stated in CLAUDE.md:

- A fault goes in here when it is **found**, not when it is fixed, so nothing is
  quietly dropped.
- Record the measurement, not the impression. "The square was 6.16px" is a fault.
  "The preview looked small" is a feeling.
- Keep the ones that are still open in **Open** at the bottom, and move them up when
  they are fixed.
- If a fix was verified against a stubbed or synthetic version of something, say so.
  The Netcash payment page in particular has never been exercised with real money.

---

## Fixed

### Two forward buttons refused in total silence (#48)

Hit testing proves a press lands. It cannot prove anything happens, so a control with a
missing or broken handler passes every check before this one. Pressing all 25 controls
for real and comparing a page fingerprint before and after found six with no change:
four correct (pressing an already-selected tab) and two faults.

`See how it looks` was styled identically to `Cancel`, white outline with `cursor:
pointer` and no `aria-disabled`, while `goReview` silently refused when the square had
nothing on it. `Continue` did grey out but was equally silent, because its guard lived in
the modal as `if (canProceed) goDetails()`, so a blocked press never reached the hook and
could never explain itself.

- before: See how it looks looks enabled, nothing happens, nothing said. Continue greys
  out, nothing happens, nothing said.
- after: both greyed and `aria-disabled`, both still keyboard reachable and pressable,
  and both say "Add a logo, a message or a drawing first."

One guard now, in `goReview` and `goDetails`, that both refuses and explains.

The same audit found the size selector said which half was chosen with colour and
nothing else. It is the control that picks what you are buying, so it now carries
`aria-pressed`.

### The hero glow ate the bottom of every header control (#46)

Found by building the audit that #44 showed was missing: not whether a control looks
right, but whether a real press at its own coordinates lands on it.

`.rb-hero-glow` is a decorative blurred gradient with `inset: -12% -8%`, so it
deliberately overhangs its parent, and at 1440px that overhang reaches into the header.
It had `pointer-events: auto`.

- glow `rect[722,49,599,858]`, `inset -82.98px -41.34px`, overlaps the header
- all three nav links and the primary "Join the Legacy 500" button: **3 of 5** probe
  points land, the lower two hit the glow
- after `pointer-events: none`: 5 of 5, and 0 partly-covered controls out of 106 probed

Half-working is worse than broken, because nobody can tell what they did wrong.

### I took the stylesheet down on live for about twenty minutes (mine, not the code's)

Building a branch in the deploy directory replaces the static assets under the running
pm2 process, so the HTML it serves references asset hashes that no longer exist. The
page kept returning 200. The API kept returning 200. The stylesheet returned **500**,
21 bytes of "Internal Server Error", so the entire site was unstyled.

Every check being run at the time passed, because they all checked the HTML and the API
and never the assets the HTML asked for.

It also corrupted the investigation in progress. With the CSS gone, `.rb-hero-glow`
computed as `position: static` with zero height, so the fault above looked like it did
not reproduce, and I briefly concluded it was a false positive. It was real; I had
broken the page I was measuring.

`scripts/verify-deploy.mjs` now asserts every asset the served HTML references actually
resolves, including that a stylesheet is not a 200-with-an-error-page. Run it after any
deploy. There is a memory about this trap already and it did not stop me, so the check
is in the repo rather than in my head.

### Pressing the back of the shirt did nothing (#44)

Reported from the live site. Reproduced at 390px and 1440px.

`.rb-shirt-switch` is `position: absolute` with no `z-index`, so it resolved to 0,
and `ShirtPanel` puts a full-panel click catcher at `z-index: 5` in the same stacking
context. The hit test at the button's centre returned that overlay, not the button.

Nothing about the button looked wrong: right size, not disabled, `pointer-events:
auto`. Only a hit test found it.

- before: element at button centre is outside the button, panel unchanged
- after: `z-index: 6`, element at centre is inside the button, panel switches to
  `kit-back.png`

### A declined payment threw away everything the buyer had done (#43)

Netcash is a full top-level navigation away and back, and nothing survived it. The
square, the artwork, the message, the email and the phone were all lost, so retrying
after a declined card meant rebuilding the upload from scratch.

Editor state is now written to `sessionStorage` immediately before `form.submit()` and
restored when Netcash returns the buyer through the decline URL.

- verified in two halves, since a test cannot visit the real Netcash page: 292 bytes
  written before the navigation, and the editor reopening at "Your details" with both
  fields restored after `/checkout-cancelled?ref=...`

A bug in the first version of that fix: testing availability with `validFoot` alone
reports occupied when the cell is held by the buyer's **own** pending row, which told
the person paying that somebody else had taken their square. A `pending` holder is now
treated as theirs; only `paid` means somebody else got it.

### Any image without transparency printed as a solid white square (#42)

The square renders artwork as a CSS mask, and `mask-mode` defaults to `match-source`,
which for a raster image means the alpha channel. A JPEG has no alpha, so the whole
square masked in solid and the logo was gone. `accept` invited `image/jpeg`
explicitly, and a PNG exported on a white background behaved the same way.

Also, the whole bitmap was fitted with `mask-size: contain`, so blank margin inside
the image became blank margin on the shirt, and the drawing canvas was 1.94:1 against
a 1:1 printed area so a drawing could never fill more than about 51% of the square's
height.

Both fixed by reducing the image to a stencil and cropping that stencil to its own
bounding box, which is what white-only sublimation prints anyway.

| upload | before | after |
|---|---|---|
| PNG, transparent, 25% padding | ~56% of the square | 85% |
| PNG, white background | solid white block | 85% |
| JPEG, white background | solid white block | 85% |
| JPEG photo | solid white block | 62%, warns |
| drawing, small and off-centre | a few percent | 68% |

### 13 of 20 tap targets were below the WCAG minimum (#41)

Measured at 390px. All were height-limited at 15 or 16px by the line height of their
own text: the three nav links, five footer contact and legal links, five social links.
The X link was **10x15px**.

All now 44x44 minimum. Collapsing a redundant row gap paid for almost all the extra
height, so the header grew 3px (180 to 183) for 2.9x the target area.

### Every rainbow gradient headline failed WCAG AA, plus six more colours (#39)

All five gradient-filled headlines failed on the same stop, `#5f4ea1`, the crest
purple. It measures 6.83:1 on white so it is fine everywhere else, and only fails when
the gradient fills text on the dark page. Worst was a 10px label at **2.40:1**.

Auditing every text node then found six more, worst `R100,000` at **2.08:1**.

`RAINBOW_INK_STOPS` keeps every hue and raises only lightness, so orange and yellow do
not move at all and only the purple genuinely changes. Washing toward white was
rejected because `brand.js` already records that it reads as pastel and childlike.

- after: 0 text elements below WCAG AA at 390px and 1440px

### The same physical spot could be sold twice (#38)

Five hand-placed bonus zones (two sleeves per panel plus a strip beside the crest)
were positioned when the body box was a narrow torso rectangle. When #36 widened the
body box to cover the whole render, every one of them started overlapping **claimable**
body cells, up to 90% of the same area. Two buyers could each have paid R2,000 for the
same place on the shirt.

The same zones were also never re-cut to square: front sleeve cells were **1.75:1**,
the exact distortion that had just been removed from the body grid.

Fixed by having one grid per panel and nothing else, so two claimable cells cannot
occupy the same spot by construction. 188 front + 312 back = 500, every cell 39.52px
square, verified on the rendered page as one distinct size with a ratio range of 1 to 1.

No paid squares existed in any zone, so nothing was orphaned.

### The review step rendered both shirts side by side (#37)

The step whose entire job is confirming artwork placement before paying spent half its
width on the shirt the buyer's square is not on.

- 390px: buyer's own square **6.16 x 6.16 px**, after 12.73
- 1440px: 9.72, after 19.86

### Documentation had drifted from the build (this file's commit)

Not a runtime fault, but it makes every future change riskier, and it is the reason
this log exists.

- `CLAUDE.md` "The 500 invariant" still described a 10x25 front grid, a 150 + 350
  split, and 17 squares of sleeve and crest-strip bonus stock. All three were removed
  in #38.
- `CLAUDE.md` "Outstanding" listed three things that already exist: the buyer receipt
  email (`sendPaymentConfirmation` / `buyerReceipt`), conflict alerting
  (`sendConflictAlert`), and `m10` never being sent (`netcash.js` sends it).
- `README.md` advertised claimable squares on "both sleeves". Removed in #38.
- `DesignNote.jsx` told buyers a square is "roughly 3 cm across". Measured against the
  render's torso width it is about **3.8 cm**. The earlier figure came from scaling by
  the garment's full sleeve-to-sleeve width (890px) instead of the torso (545px), which
  understates a square by a third. The sleeves add 63% to the torso width, so which
  width you scale by matters more than it looks.

---

## Open

- **No real payment has ever completed.** Everything above the Netcash boundary is
  measured; nothing below it is. This is the last launch blocker and it cannot be
  closed from code.
- **The Netcash merchant name reads "Hout Bay United Football Community Trust - Xero"**
  while the money goes to HBUFC Trading. A buyer sees a name that does not match
  anything on the page.
- **VAT is unanswered.** The R1,000,000 target sits exactly on the compulsory
  registration threshold.
- **The manufacturer's artwork spec is unconfirmed.** Built to 300 DPI with a 4% safe
  margin. `SAFE_MARGIN` in `lib/artfit.js` is the one constant to change.
- **Browser Back from Netcash does not resume.** Only the decline URL carries
  `?checkout=cancelled`. Auto-resuming on a plain page load was rejected because the
  notify callback is async, so a paid order can still look pending.
- **The Netcash service key is shared with the live Sonar app.** Test mode is per
  profile, so enabling it here would put Sonar's live card payments in test mode. Needs
  a second Pay Now service.
- **Netcash notify has no signature or IP allowlist.** Compensating controls are the
  unguessable reference, first-notify-wins in the WHERE clause, and the amount
  cross-check. Weaker than a signed callback.
- **Big 2x2 blocks are not atomically protected** at the database level. See CLAUDE.md.
- **The shirt grid is not keyboard reachable.** Cells are divs under a click-catching
  overlay. "Pick one for me" is a working keyboard path to a square, so this is not a
  total block, but it is not equivalent.
- **`middleware.js` is deprecated** in Next 16 in favour of `proxy`. Still works.

---

## Things that keep causing faults

Recorded because each of these produced a fault that looked fine on inspection.

1. **An inline style beats a stylesheet rule.** These components are inline-style-only,
   so a responsive rule in `globals.css` silently loses to an inline `gap` or `z-index`
   on the same element. A `row-gap: 0` media query I wrote was a complete no-op, found
   only by reading back the computed value. Always verify with `getComputedStyle`, not
   by reading the CSS.
2. **`el.click()` bypasses hit testing.** The back-of-shirt button was fully broken and
   `el.click()` would have passed. Drive real clicks through
   `Input.dispatchMouseEvent`, and check `document.elementFromPoint` is inside the
   element you think you are pressing.
3. **`mask-image` uses alpha, not luminance.** Anything opaque masks in as a solid
   block. This is what made JPEG uploads print blank.
4. **Scale physical sizes by the torso, not the whole render.** The sleeves add 63% to
   the width, so the wrong denominator understates a square by a third. This one has
   now been got wrong twice.
5. **A press landing is not a press working.** Hit testing proves the click reaches the
   element. Only pressing the control and observing that something changed proves a
   handler exists and runs. And a control that refuses must say why: silence is the worst
   outcome for somebody who is not confident or does not read much English, because there
   is nothing to work out what went wrong from.
6. **A 200 on `/` does not mean the site works.** The page and the API can both be
   healthy while the stylesheet 500s and the whole site renders unstyled. Check the
   assets the HTML actually asks for: `node scripts/verify-deploy.mjs <url>`.
7. **Never leave `.next` on a branch build.** It is shared with the running server, so
   building a branch here breaks live until main is rebuilt. If a measurement suddenly
   stops reproducing, check this before believing it.
8. **`TOTAL_SQUARES` is computed.** Any change to a box, column count, clearance or
   mask moves the campaign's headline number. It is a check, not a claim, so read it
   after touching the grid.

# Changelog

## 2026-07-29 — in-app reader, and a schema-migration fix

**Fixed: every page 500'd.** The dev server caches the SQLite handle on `globalThis`, so
`init()` short-circuited and the migration adding `track`, `graded_correct`, `overridden`
and `gb_progress` never ran against the live database — the code then queried columns the
open connection didn't have. A schema change delivered by hot reload shouldn't need you to
know to restart, so the migration is now stamped with a `SCHEMA_VERSION` on the cached
handle and re-runs on mismatch. Every statement in it was already idempotent. No data was
touched; all 103 attempts intact.

**Read step.** The section flow gained a first step that shows the book's own pages,
extracted from your PDF, one page at a time or the whole section. Running heads and page
footers are stripped; the body is passed through as-is, since layout carries meaning in a
technical book. Book problems in the Practice step link straight to their page.

The text is read **at runtime** from the gitignored `local/green-book/` and is never
imported into `src/`, bundled, or committed — a test walks the source tree to assert no
source file contains it. The repo therefore stays shareable while your copy of the book
stays on your machine. Equations don't survive OCR, and the reader says so rather than
pretending otherwise.

## 2026-07-29 — the Green Book track

A second programme alongside mental math: a Khan-Academy-style companion to the Green
Book, worked section by section.

**Extraction.** The PDF is a pure scan — 213 full-page images, zero embedded fonts, no
text layer. `scripts/ocr/` renders each page and runs it through the macOS Vision
recogniser (the engine behind Live Text, which is why the file looks selectable in a
viewer), writing searchable text to a gitignored `local/green-book/`. Prose comes out
clean; formulas garble, since Vision recognises text and not mathematics. This is a
reading aid for a book you own, and the source of the section index — the app never
serves it.

**Structure.** The book's own shape: 7 chapters, 30 sections, ~200 named problems, all
with page numbers, confirmed against section headings in the body (printed page = PDF
page − 16).

**The four-step flow** per section: *Learn* (an explanation written for this app, key
ideas, and a My-notes box for your own summary) → *Ask* (self-check questions) → *Worked
example* (revealed a step at a time, so you can stop and finish it) → *Practice*
(original problems with a three-level hint ladder, plus the book's own problems listed by
name and page to work in your copy and tick off). No clock on this track: these are
reasoning problems, so hints used matters more than seconds.

**Chapter 4 fully authored** — 6 sections, ~30 concept paragraphs, 30 key ideas, 7 worked
examples, 39 original practice problems, 117 hints. All 49 numeric answers verified
against independent computation. The other 24 sections are indexed and trackable.

**What's in it.** Section and problem names plus page numbers index your own copy. Every
explanation, example, hint and problem is written for this app; standard results are in
our own words with our own numbers. None of the book's text is reproduced or stored.
`/reference-materials/` and `/local/` are now gitignored — the PDF would previously have
been committed.

**Two tracks, two scores.** `attempts` gained `track` (defaulting to `'mental-math'`, so
all 103 existing answers keep counting exactly as before) and `section_slug`, plus a new
`gb_progress` table. Every mental-math statistic now reads through
`attemptsByTrack('mental-math')`, so Green Book work cannot move your readiness score —
verified: 7 Green Book answers left it at 250. Green Book has its own coverage number
(half sections finished, half problems solved) shown beside it on the dashboard. Nav is
grouped by programme.

Also fixed: the new `track` index was in `CREATE_SQL`, which runs before the migration
that adds the column — fine on a fresh database, an error on an existing one. Indexes on
migrated columns now run after the `ALTER TABLE`s.

## 2026-07-29 — manual overrides, on any answer, past or present

The auto-grader compares numbers. It can't tell `0.75` typed for an answer of `75` from a
genuine miss, and it has no view on whether a Fermi decomposition was sound. So you can now
overrule it.

**Where.** *"I was actually correct"* in the feedback panel right after answering, and
**Progress → Answer history** for anything already recorded — paged through your whole
history, filtered to misses by default. Self-graded estimates get an
*"Override — my decomposition was sound"* button when they fall outside the factor-of-2 bar
(still blocked on a blank answer, which is the abuse the bar exists for).

**Nothing is deleted.** `is_correct` becomes the *effective* verdict; the auto-grade is kept
in a new `graded_correct` column, with `overridden` (1 / −1 / 0) and `overridden_at` beside
it. The attempt itself — prompt, your answer, the time you took — is never rewritten. Every
override is reversible with *Undo*, which restores the original grade exactly. Existing rows
get `graded_correct` seeded from their recorded verdict, so undo works on your whole
back-catalogue, not just new answers.

**It flows everywhere immediately** — accuracy, session points, proficiency, the level
evidence gates, error-type tallies and the review queue all read the effective verdict. What
it *can't* do is buy its way past the clock: marking a late answer correct still scores zero
and still leaves it in the review queue, because `resolved` requires right **and** on time.
Overriding a review re-attempt keeps its parent miss in step, in both directions.

Both directions are supported (force correct, force wrong, revert), CSV and JSON export carry
the new fields, and restoring an older backup seeds them so overrides survive a round-trip.

## 2026-07-28 — the cut-off stops the scoring, not the practice

The cut-off was ending the question and revealing the answer mid-thought, which destroys the
rep — you still need to work the problem to the end to get anything out of it.

Passing `timeoutSeconds` now locks the question to **zero credit** but leaves it open: the
input stays live, the timer keeps running, and a banner says it's expired. **The answer is
never revealed until you submit one or click "I'm stuck — show the answer."** That button is
always available, and using it counts as a miss.

A correct answer past the cut-off is now recorded as **correct**, with `timed_out` carrying
the penalty. It earns zero credit, breaks the clean-solve streak, and can never satisfy an
advancement gate (the median-time requirement blocks it) — but it no longer gets filed as a
knowledge gap. It's tagged `speed` and lands in the review queue as *solved, but too slowly*.

The review queue and spaced review now cover everything **unfinished** — wrong answers *and*
late-but-correct ones. A question clears only by being answered correctly and inside the
cut-off, so `resolved` is the single source of truth for both.

## 2026-07-27 — difficulty recalibration

Triggered by a recorded diagnostic that scored **735/1000 "Interview-Ready"** off a
single session containing a 181-second answer to a 12-second question, five verbatim
repeated prompts, `Convert 1/2 to a decimal` served at difficulty 4, and three blank
self-graded answers submitted in 4–6 seconds and marked correct. The same history now
scores **250 "Building"**. Full evidence and sources in
[docs/reference-calibration-summary.md](docs/reference-calibration-summary.md).

### Two modes

Questions now carry a `mode`. **Rapid arithmetic screening** runs on a screening clock
(L1 3–6s → L4 9–16s) and penalises wrong answers. **Interview numeracy** embeds the
arithmetic in a decision and gets thinking time (simple EV 15–30s, break-even 20–45s,
estimation 30–90s, fair value + a quote 45–120s).

### Five levels that actually differ

Levels change the *structure*, not the operand size: term count and carries for addition,
partial products for multiplication (1d×2d → 3d×1d → 2d×2d → 3d×2d → 3d×3d near a base),
exact vs. non-exact division, whether a percentage has a shortcut, how many outcomes an EV
has. Generators now reject instances easier than their level claims — fraction pools are
pre-reduced (so `6/12` can never collapse to `1/2`), memorised percentages are banned above
L2, trivial divisors above L2, one-die probability above L2.

### New archetypes

*Rapid*: decimal operations, missing operands, sequential arithmetic, approximation
("take out the big part"), representation comparison. *Interview*: break-even probability,
odds ↔ implied probability, percentage chains, Bayes (now its own gated archetype),
conditional update after a fill (adverse selection), fair value + a two-sided market quote,
order-of-magnitude sanity checks.

### One credit ladder, and a hard cut-off

100% inside target, 85% to 1.25×, 65% to 1.5×, 35% to 2×, 10% beyond, 0 on timeout,
−25% for a wrong answer in rapid mode. Questions now have a `timeoutSeconds` (2.5× target
rapid, 3× interview); the runner ends the question there, and the server refuses to store a
timed-out attempt as correct. The old formula paid up to 1.5× for rushing and floored slow
answers at 0.4×, which is how a 15×-over-target answer still scored.

### Proficiency: caps and evidence

35% difficulty-adjusted accuracy, 30% speed, 20% highest passed level, 10% consistency,
5% trend, times a staleness multiplier (replacing the old flat +10 for practising today).
A level counts as passed only with ≥20 questions across ≥2 sessions at ≥85% accuracy with a
median time at or under target; until then proficiency is capped (none → 25, L1 → 40,
L2 → 60, L3 → 75, L4 → 90, >90 needs L5). Difficulty is held or reduced on accuracy < 70%,
timeout rate > 15%, median time > 1.5× target, or a dominant repeated error type.

### No repeats, and mixed formats

Every session builds through a `QuestionSampler` that never serves the same prompt twice —
the diagnostic's 98 questions and each day's 20 are all unique. Both now include a
mixed-format block where the archetype and the level change every question, with no two
consecutive questions sharing a shape.

### Self-graded questions stop being free

Estimation and oral answers can't be marked correct if they're blank or answered faster
than 8 seconds, and a numeric estimate outside a factor of 2 of the reference is refused.
The parser reads quantities out of prose (`about 8 million`, `8.4M`, `3 × 10^9`).

### Schema

`attempts` gained `mode`, `timed_out`, `timeout_seconds`, applied automatically on first
run with `mode` backfilled from the question shape. CSV export and JSON restore carry them.

## 2026-07-21 — quant-pace recalibration + scoring system

### Target times recalibrated (regrades history)

Old targets were homework pace (17s for a 2-digit addition). New targets are
per **question type × difficulty**, calibrated to quant-interview screens
(~6s/question on trading arithmetic tests): addition/subtraction d1 = 4s,
fraction conversions = 4-10s, EV and probability get thinking time but not
leisure. Proficiency speed scores and question points are always computed
against the *current* table (not the stored target), so history is
automatically regraded whenever calibration changes. Review re-asks are also
timed to today's target.

### Difficulty reweighted

Daily-plan difficulty bands push harder earlier (<30→1, <50→2, <68→3, <85→4,
else 5) and the diagnostic now ramps 1→4 inside each section to probe range.

### Scoring system (new)

- **Quant Readiness Score** 0-1000: mean of all eight topic proficiencies × 10
  (untested topics count as zero — coverage matters). Dashboard shows it big,
  with a 7-day delta and level: Foundations / Building / Consistent / Sharp /
  Interview-Ready / Desk-Ready.
- **Points**: 10 × difficulty per correct answer, ×0.4-1.5 by speed vs target.
  Shown per session and per day.
- **Weekly goals** (rolling 7 days): 100 questions, 80%+ accuracy, beat the
  clock on 60% of correct answers, lift the two weakest topics.
- **Milestones**: streak (3/7/14/30 days), volume (100/250/500/1000 questions),
  readiness thresholds (250-850).

### Trouble-spot analytics (new, Progress page)

- Most-missed question types (wrong rate, min 3 attempts)
- Slowest question types (avg time ÷ current target)
- Slowest individual solves vs target

## 2026-07-21 — automatic backups + diagnostic resume

### Automatic backups (new)

Added after an incident where verification testing reset the live database and
lost an in-progress diagnostic. The app now protects itself:

- **Snapshot on completion**: every finished diagnostic section, practice
  session, and review session writes a full JSON snapshot to `./data/backups/`
  (same format as a manual export; newest 40 kept, older pruned).
- **Snapshot before destruction**: import, restore, and reset each save a
  `pre-import` / `pre-restore` / `pre-reset` snapshot *before* wiping anything,
  so every destructive action is undoable.
- **Restore UI**: the Backup page lists snapshots (what triggered them, when,
  size) with one-click restore.
- **`QUANT_PREP_DATA_DIR`**: env var to point the app at a separate data
  directory, so tests and experiments never touch real history.

### Diagnostic resume

Leaving the diagnostic mid-way no longer restarts it. `GET /api/diagnostic`
detects the open session, reconstructs completed sections from saved answers,
discards a half-finished section's answers, and the page offers
"Resume section N" / "Start over".

## 2026-07-21 — button semantics fix + design-system pass

### Accessibility / button semantics

Fixed the six Base UI console errors ("A component that acts as a button expected
a native `<button>` because the `nativeButton` prop is true…"). The cause: `<Button
render={<Link>}>` / `render={<a>}` rendered anchors while Base UI's button behavior
assumed a native `<button>`, losing button semantics for forms and assistive tech.

- `Button` (src/components/ui/button.tsx) is now a plain native `<button>`
  (no Base UI primitive), defaulting to `type="button"` so it can't accidentally
  submit forms. All cva variants and sizes are unchanged.
- New `LinkButton` renders a Next.js `<Link>` styled with the same `buttonVariants`.
  Every navigation CTA (dashboard, practice, review, diagnostic, progress) now uses
  it — links are real links (right-click/cmd-click work), buttons are real buttons.
- The two Backup download actions are real `<a download>` anchors wearing
  `buttonVariants()` styling.
- No nested interactive elements remain (`<a><button>` / `<button><a>`).

### Design system (see DESIGN.md)

- Defined palette (indigo primary + amber `--highlight` accent, neutral zinc base),
  spacing tokens, and a five-step type scale; implemented as CSS variables in
  `globals.css` for light and dark.
- Loading skeletons replace bare "Loading…" text on all data-driven pages.
- Empty states (inline-SVG glyph + explanation + next action) for the review queue,
  resource log, recent attempts, and progress queue.
- Explicit hover/focus/active states on nav links, native selects, and checkboxes;
  the current nav item is highlighted via `aria-current="page"`.
- Micro-animations: proficiency bars ease in (500ms), the answer-feedback panel
  fades/slides in (150ms), the timer pulses when over target — all guarded with
  `motion-reduce`.
- Page headers added to every page for consistent hierarchy.

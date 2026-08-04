# Quant Prep

A local-first, single-user web app for adaptive quant-interview preparation.
Everything runs on your machine; all progress is stored in a local SQLite file.
No accounts, no cloud, no paid APIs.

## Two tracks

**Mental math** — procedurally generated drills under a clock, scored on speed and
accuracy. **Green Book** — a Khan-Academy-style companion to *A Practical Guide To
Quantitative Finance Interviews*, worked section by section and scored on ground covered.

They are deliberately scored on different scales and kept in separate columns, so
answering a Green Book problem never moves your mental-math readiness score and vice
versa. The dashboard shows both, so you can see which one is actually improving.

## What it does

- **Two modes, two clocks.** *Rapid arithmetic screening* models a timed online screen:
  reading is on the clock, targets are single-digit seconds, and a wrong answer costs you.
  *Interview numeracy* models a conversation: arithmetic embedded in a decision, tens of
  seconds to minutes, no penalty for a wrong answer beyond the missing credit.
- **Five real difficulty levels** — Foundation, Basic screening, Competitive screening,
  Advanced screening, Interview integration. They differ *structurally*, not just in operand
  size: number of steps, number of partial products, whether the numbers have a shortcut,
  whether division comes out exact. Generators reject instances that are easier than their
  level claims, so a "difficulty 4" question is never secretly `1/2`.
- **Day 1 diagnostic** — ~98 questions ramping to level 5 in every section, including a
  mixed-format block where the shape and the level change every question. No prompt repeats
  anywhere in a run. Ends with a per-topic score, your top 3 weaknesses, and a recommended
  starting point.
- **Adaptive daily practice** — each day's ~20 questions: 40% weakest topics, 20% the current
  week of the 12-week plan, 15% spaced review of recent misses, 10% challenge one level up,
  15% mixed-format. Seeded by the date, so it's stable all day, and de-duplicated so nothing
  repeats within the set.
- **Question archetypes** — *rapid*: addition, subtraction, multiplication, division (exact
  and non-exact), decimal operations, missing operands, sequential arithmetic, approximation
  ("take out the big part"), fraction↔decimal/percent, representation comparison, percent-of,
  reverse percentage, sequential percentage changes. *Interview*: discrete and recursive EV,
  break-even probability, percentage chains, odds ↔ implied probability, dice/coin/card
  probability, conditional probability, Bayes, conditional update after a fill (adverse
  selection), fair value, fair value + a two-sided market quote, Fermi estimation, and
  order-of-magnitude sanity checks.
- **Practice mode** — one question at a time with a timer and a cut-off (2.5× target in rapid
  mode, 3× in interview mode). **The cut-off stops the scoring, not the practice**: past it
  the question locks to zero credit, but it stays open and the input stays live so you can
  work the problem through to the end. The answer is never shown until you submit one or
  click *I'm stuck — show the answer*. Grading accepts `0.75`, `3/4`, `75%`, `$40`, `1 1/2`,
  and `A`/`B` for comparisons, with the explanation and an error-type tag after each answer.
- **Late but right still reads as right.** A correct answer past the cut-off is recorded as
  correct — it earns zero credit and can never buy a level, but it isn't filed as a knowledge
  gap either. It goes into the review queue tagged as a *speed* problem, so you re-drill it
  for pace rather than for concept.
- **Manual overrides — "I was actually correct."** The grader only compares numbers: it can't
  tell a formatting mismatch from a real miss, and it has no opinion about whether your Fermi
  decomposition was sound. Override it right after answering, or on any past answer from
  **Progress → Answer history** (filter to misses, page back through everything).
  An override moves the *effective* verdict and keeps the original auto-grade beside it, so
  **nothing is ever deleted** and every correction is reversible with *Undo*. It flows through
  accuracy, points, proficiency, level gates and the review queue immediately — but it can't
  buy its way past the clock: a late answer marked correct still scores zero and still stays
  in the queue.
- **One time-credit ladder**, used by points, proficiency, and the calibration report:
  100% inside target, 85% to 1.25×, 65% to 1.5×, 35% to 2×, 10% beyond, 0 on a timeout, and
  **−25% for a wrong answer in rapid mode** (screens are scored net of errors).
- **Proficiency model** — per topic, 0-100: 35% difficulty-adjusted accuracy, 30% speed on the
  ladder above, 20% highest reliably passed level, 10% consistency (right *and* on time),
  5% recent trend, times a staleness multiplier. Speed is always regraded against the
  *current* target table, so tightening the standard re-scores your history too.
- **Proficiency caps.** A level counts as passed only with ≥20 questions across ≥2 sessions at
  ≥85% accuracy with a median time at or under target. Until then your score is capped:
  nothing passed → 25, L1 → 40, L2 → 60, L3 → 75, L4 → 90; above 90 needs level-5 work.
  Difficulty is held or reduced when accuracy drops below 70%, timeouts exceed 15%, median
  time exceeds 1.5× target, or one error type dominates your recent misses.
- **Scoring & goals** — a Quant Readiness Score (0-1000 = mean topic proficiency × 10) with
  levels (Foundations → Building → Consistent → Sharp → Interview-Ready → Desk-Ready), a
  7-day delta, per-session points (10 × difficulty × credit — no bonus for rushing), rolling
  weekly goals (volume, 85% accuracy, clean-solve rate, weak-topic lifts), and milestones.
- **Progress page** — how every attempt landed against the clock (on time / slightly slow /
  very slow / timed out / wrong), proficiency by topic with the level you've passed, the cap
  it imposes, and exactly what's still blocking the next level; trouble spots, slowest
  question types vs. target, slowest individual solves, milestones, mistake frequency by
  error type, weekly trend, and the review queue.
- **Review queue** — everything unfinished: questions you got wrong, *and* questions you
  solved past the cut-off. A question clears only when you answer it correctly **and** inside
  the cut-off.
## The Green Book track

Navigate to **Green Book → Sections**. The app mirrors the book's own structure — 7
chapters, 30 sections, and the ~200 named problems, with page numbers — so you always
know where you are in your copy.

Each authored section runs a five-step flow:

1. **Read** — the book's own pages for this section, extracted from your PDF, one page
   at a time or the whole section at once. Book problems link straight to their page.
2. **Learn** — an independent restatement of the idea written for this app, a "what to
   hold on to" list, and a **My notes** box for your own summary.
3. **Ask** — the questions you should be able to answer out loud before moving on.
4. **Worked example** — one problem done in full, revealed **a step at a time** so you
   can stop and finish it yourself, ending with the transferable takeaway.
5. **Practice** — original problems with a **three-level hint ladder** (a nudge, then a
   bigger hint, then the full method). Hints used are recorded, so solving something
   cold and solving it after three hints don't look the same. Below them, the book's own
   problems are listed by name and page for you to work and tick off.

There is no clock on this track — these are reasoning problems, so hints used matters
more than seconds. Answers still go through the same grading and can be overridden with
**I was actually correct**.

**Chapter 4 (Probability Theory) is fully authored**: 6 sections, ~30 concept paragraphs,
30 key ideas, 7 worked examples and 39 original practice problems with 117 hints. Every
numeric answer is verified against an independent computation in the test suite. The
other 24 sections are indexed — navigable and trackable, with content to be added.

### Reading your own copy in the app

The **Read** step needs a local extraction of your PDF. The file is a pure scan with no
text layer, so this runs the macOS Vision recogniser — the same engine behind Live Text,
which is why the PDF looks selectable in a viewer. Needs `swiftc` (Xcode command line
tools) and PyMuPDF:

```bash
python3 scripts/ocr/ocr_green_book.py          # all 213 pages, about a minute
python3 scripts/ocr/ocr_green_book.py --pages 88-101   # or a range
```

Output goes to `local/green-book/` and the app reads it from there at runtime. Prose comes
out faithfully; **equations and symbols do not survive OCR**, so the reader says as much
and the PDF stays authoritative for anything symbolic. Without the extraction the Read
step just tells you to run the script — nothing else is affected.

### How the book and the app are kept separate

This is a personal, local-only reader for a book you own — a format shift, not a
republication. The architecture enforces that rather than relying on intent:

- Book text is **read at runtime** from `local/green-book/`, which is gitignored. It is
  never imported into `src/`, never bundled, and never committed. A test walks the whole
  source tree to assert no source file contains the book's text.
- `/reference-materials/` (the PDF) is gitignored too.
- So the repo is shareable and carries nothing of the book; your copy stays on your machine.

Everything the app *itself* contains is original: chapter, section and problem **names and
page numbers** form an index (the information a citation carries), and every explanation,
worked example, hint and practice problem is written for this app, with standard results in
our own words and our own numbers.

- **Resource log** — track Green Book, QuantGuide, Jane Street Probability & Markets,
  Stat 110, MIT 18.05, and Street-Fighting Mathematics sessions (section, score, minutes,
  error types, notes). The app references these resources in the study plan but never
  reproduces or generates their problems.

## Setup

Requires Node.js 20+ (developed on Node 26).

```bash
npm install
npm run dev
```

Open http://localhost:3000. Start with the **Diagnostic**, then use **Practice** daily.

## Where your data lives

Everything is stored in a single SQLite file:

```
./data/quant-prep.sqlite
```

The file (and the `data/` directory) is created automatically on first run.
WAL mode is enabled, so you may also see `quant-prep.sqlite-wal` / `-shm` beside it —
they're part of the database.

Tables: `attempts` (every graded question, on either track), `sessions`
(diagnostic/practice runs), `resource_logs` (external study sessions), `app_state`
(plan start date, etc.), `gb_progress` (per-section Green Book state: status, your
notes, book-problem ticks, hints used).

The `attempts` table gained `mode`, `timed_out` and `timeout_seconds` in the difficulty
recalibration, then `graded_correct`, `overridden` and `overridden_at` for manual overrides.
They're added automatically on first run — existing rows keep their history, `mode` is
backfilled from the question shape, and `graded_correct` is seeded from the recorded verdict
so *Undo* works across your whole back-catalogue.

Then `track` and `section_slug` for the Green Book. `track` defaults to `'mental-math'`,
so every answer recorded before the Green Book existed keeps counting exactly as it did.

`is_correct` is the **effective** verdict that everything scores from; `graded_correct` is
what the auto-grader said. An override only ever moves the first one.

## Backing up

### Automatic backups

The app snapshots itself to `./data/backups/` (portable JSON, same format as a
manual export) at these moments:

- after **every completed diagnostic section**
- after **every completed practice session** and **review session**
- when the **diagnostic finishes**
- **before anything destructive**: import, restore, or reset

The newest 40 snapshots are kept; older ones are pruned automatically. The
**Backup** page lists them with a one-click **Restore** (which itself saves a
pre-restore snapshot first, so restoring is always undoable).

### Manual options

1. **Export everything (JSON)** — full portable snapshot (`/api/backup/export`).
2. **Export attempts (CSV)** — spreadsheet-friendly attempt history (`/api/backup/csv`).
3. **Copy the SQLite file** — with the dev server stopped, copy `./data/quant-prep.sqlite`
   anywhere you like.

To restore, use **Import** on the Backup page with a JSON export.
**Import replaces all current data** (after saving a pre-import snapshot).

### Using a separate database (testing, experiments)

Set `QUANT_PREP_DATA_DIR` to point the app at a different data directory —
useful for trying things without touching your real history:

```bash
QUANT_PREP_DATA_DIR=/tmp/qp-scratch npm run dev
```

## Resetting

- From the UI: Backup → **Delete all data** (double-confirmed).
- From the shell (dev server stopped):

```bash
rm -f data/quant-prep.sqlite data/quant-prep.sqlite-wal data/quant-prep.sqlite-shm
```

The schema is recreated automatically the next time the app starts.

## Running tests

```bash
npm test
```

Unit tests cover every question generator (well-formedness, self-consistency of answers,
determinism per seed, prompt variety), the grading functions, the proficiency formula,
daily-plan allocation, the 12-week plan clock, streaks, and the diagnostic recommendation
logic. The calibration guarantees are tested too, so they can't silently regress:

- each arithmetic archetype gets measurably heavier at every level (a workload proxy over
  digits, operation count, and partial products must strictly increase L1 → L5);
- no degenerate-easy instances — `1/2` never appears above level 1, memorised percentages
  (10/20/25/50/100%) never above level 2, no divisor that's a multiple of 5 or 10 above
  level 2, no one-die probability questions above level 2;
- the credit ladder steps exactly as specified, timeouts score zero, and wrong answers go
  negative in rapid mode;
- a flawless level-1 run caps at 40, and going above 90 requires level-5 evidence;
- advancement needs all four gates, and each hold/reduce rule fires with a reason;
- a manual override moves accuracy, points and proficiency, is always reversible, preserves
  the original auto-grade (including on rows written before overrides existed), keeps a review
  re-attempt's parent in step, and cannot clear a question that was answered past its cut-off;
- a whole day's set and a whole diagnostic contain no repeated prompt, and mixed-format
  sets never place the same archetype twice in a row.

## Calibration docs

- [docs/reference-calibration-summary.md](docs/reference-calibration-summary.md) — what was
  read from `reference-materials/`, what each source contributed, and the calibration plan.
- [docs/question-calibration-report.md](docs/question-calibration-report.md) — 30+ generated
  samples per difficulty level with archetype, timing, and the justification for the level.
  It is produced by running the live generators, not written by hand.

## Migrating to Firebase or Supabase later

The app is deliberately layered so persistence is swappable:

- All SQL lives behind [src/lib/db/](src/lib/db/) (Drizzle ORM + better-sqlite3) and the
  query helpers in [src/lib/server/queries.ts](src/lib/server/queries.ts). Pages never
  touch the database directly — they call the API routes under `src/app/api/`.
- **Supabase (easiest path):** Drizzle supports Postgres. Swap
  `drizzle-orm/better-sqlite3` for `drizzle-orm/postgres-js`, port the table definitions
  in [src/lib/db/schema.ts](src/lib/db/schema.ts) from `sqlite-core` to `pg-core`
  (types map almost 1:1: `integer` timestamps → `timestamp`, `integer` booleans →
  `boolean`), point it at your Supabase connection string, and the Drizzle query API
  stays identical across drivers.
- **Firebase:** replace the helpers in `src/lib/server/queries.ts` and the route handlers'
  Drizzle calls with Firestore reads/writes. The JSON export gives you a clean seed file:
  each top-level array (`attempts`, `sessions`, `resourceLogs`, `appState`) maps naturally
  to a collection.
- Either way, the JSON export/import format is the migration bridge: export locally,
  transform, bulk-insert in the cloud.

## Copyright note

All questions in this app are procedurally generated from generic templates
(mental math, probability, EV, market-making, estimation). The app intentionally does
not reproduce, scrape, or generate problems from the Green Book, QuantGuide, or any
other copyrighted resource — those appear only as study-plan references and in your
own progress logs.

## Tech

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · SQLite via better-sqlite3 ·
Drizzle ORM · Vitest

# Reference calibration summary

What was inspected in `./reference-materials`, what each file contributed, and the
calibration plan derived from it. Written **before** any generator changes.

> **Copyright note.** No problem from any of these sources is reproduced or
> paraphrased in the app. They were read for *style, structure, difficulty
> gradient, timing expectation, and topic coverage* only. Every question the app
> asks is procedurally generated from original templates.

---

## 1. Files inspected

Extraction method: `pymupdf` (`fitz`) text extraction, since `pdftotext` is not
installed on this machine. Output written to a scratch directory, not to the repo.

| File | Pages | Extracted | Identified as |
|---|---|---|---|
| `jane-street-proability-and-markets.pdf` | 13 | ✅ 29,176 chars | Jane Street, *Probability & Markets* |
| `green-book.pdf` | 213 | ❌ **0 chars of text** | *A Practical Guide to Quantitative Finance Interviews* (Zhou) — scanned images, no text layer |
| `eec2d3694177e6a5e5c9081ba75713f1_pset01.pdf` | 2 | ✅ 4,195 chars | MIT 18.098/6.099 *Street-Fighting Mathematics*, Problem set 1 |
| `b16749626b99d2523483cfa4040b1351_soln01.pdf` | 7 | ✅ 13,963 chars | …Solution set 1 |
| `66ec5f1074c07743807cfc23546e5761_pset02.pdf` | 1 | ✅ 2,213 chars | …Problem set 2 |
| `13cda967bd72612fb6c902f3747188ee_soln02.pdf` | 3 | ✅ 6,825 chars | …Solution set 2 |
| `2d2f457105c656c5812ceabd7f23094d_pset03.pdf` | 1 | ✅ 1,671 chars | …Problem set 3 |
| `40d0f5ec319c67b42f27a7786bdfdcf1_soln03.pdf` | 4 | ✅ 5,700 chars | …Solution set 3 |

**Not present in the folder** (referenced in the brief but absent, so not used):
QuantGuide benchmark CSV/notes, a mental-math calibration spec, Harvard Stat 110
materials. Nothing in this document claims support from those.

### Files that could not be read

`green-book.pdf` is a **scanned document with no embedded text layer** — every one
of its 213 pages returns zero characters, and each page contains exactly one
full-page image. No OCR engine (`tesseract`) is installed, so no text could be
recovered. **The Green Book contributed nothing to this calibration.** Any
Green-Book-shaped judgement below comes from the Jane Street document or from the
app's own attempt history, never from that PDF. The 12-week study plan continues to
reference the Green Book as external reading, which is unaffected.

---

## 2. What each file contributed

### Jane Street — *Probability & Markets* (primary source)

The only reference here that is actually about quant interviews. Contributed:

- **Topic spine and its ordering.** Randomness → Counting → Probabilities →
  Independence → Random Variables → Expected Value → Confidence Intervals →
  Conditional Probability → **Making Markets** → **Adverse Selection** → Problem
  Solving Tools. The app's topic list already matches this; the ordering justifies
  treating market-making and adverse selection as the *top* of the ladder rather
  than as peers of dice probability.
- **Market-making vocabulary and mechanics** — bid/offer, "I'm 2 at 4, 10 up",
  hit/lift, fill, partial fill, widening on variance. This is the concrete content
  that the app's `fair-value` archetype was missing: it asked only for EV and never
  for a *quote*. New `market-quote` archetype comes straight from this section.
- **Adverse selection as a conditional-probability exercise**: *"Conditional on my
  order being filled, what do I think the expected value of the security is?"* This
  is a specific, gradeable question shape — the new `conditional-update` archetype.
  It is the highest-value archetype in the whole document and had no representation
  in the app at all.
- **Payoff algebra**: `payout = y·1_{not A} + x·1_A`, so `E[payout] = y + (x−y)·P[A]`.
  Solving that for `E = 0` is exactly the **break-even probability** archetype
  (also absent from the app).
- **Recursion / memorylessness** as the standard tool for repeated-play games
  (`E = 1 + (1−p)E`), and the explicit "first success takes `1/p` trials". Confirms
  the existing `recursive-ev` archetype is the right shape.
- **Calibration and confidence intervals**, with the explicit warning that people
  are systematically overconfident. Supports keeping estimation self-graded but
  tightening the bar.
- **A crucial timing caveat.** From "Interview Thoughts":
  *"we're not going to judge you harshly for not being able to mentally multiply
  double-digit numbers in 5 seconds"* and *"we'd much rather that you take your time
  and get to a better answer."*
  This is a real constraint on this recalibration and it is respected: the strict
  seconds-level clock applies to **Rapid Arithmetic Screening** (which models
  timed online screens, where the clock genuinely is that tight), while
  **Interview Numeracy** gets tens of seconds to minutes. Speed is scored, but it
  is 30% of proficiency, not a gate on correctness.

### MIT 18.098 / 6.099 — *Street-Fighting Mathematics* (psets 1–3 + solutions)

Not quant-interview material — it is a dimensional-analysis and approximation
course. Contributed exactly two things, both real:

- **"Taking out the big part"** (pset 3 / soln 3): `√26 = √25·(1 + 1/25)^{1/2} ≈
  5·(1 + 1/50) = 5.1`; `∛9 = 2·∛(1+1/8) ≈ 2 + 1/12`. This is the mental-math
  technique behind the new `approximation` archetype: anchor on a nearby exact
  value, then apply a first-order correction. The same move underlies `(1+x)^n ≈
  1 + nx` for percentage chains, which is why the app now teaches small-percentage
  chains as "add the percents, then correct by the cross term".
- **Market-sizing / Fermi decomposition** (pset 2 problem 3, "estimate the size in
  dollars/year of the US diaper market", explicitly flagged as an interview
  question). Confirms the estimation archetype should be a *decomposition with a
  stated chain*, and that a dollar-denominated market-sizing variant belongs
  alongside the physical-quantity variants the app already had.
- Also the **FWHM rectangle heuristic** and the pictorial sum estimate — both
  genuinely useful, both too calculus-flavoured for a mental-math app. Noted and
  deliberately not used.

Everything else in these psets (Navier–Stokes viscosity, Kepler's third law,
Reynolds number, pendulum period corrections, Riemann zeta) is out of scope.

### The app's own attempt history (`data/quant-prep.sqlite`, 82 attempts)

Read-only. This is the strongest evidence in the whole exercise, because it is a
measurement of the current calibration rather than an opinion about it.

Reproduced score: **QRS 735 / 1000 → "Interview-Ready"**, from a session with:

| Symptom | Evidence |
|---|---|
| Correct-but-very-slow scored as a win | `After increasing by 5%, a quantity is 483` — target 12s, **took 181s (15.1×)**, counted correct, full accuracy credit |
| …and it was not isolated | **26 of 82 answers (32%) ran over 1.5× target**; 18 of those were correct and took full accuracy credit. 8 answers ran over 4× target |
| Difficulty labels detached from actual difficulty | `Convert 1/2 to a decimal` served at **difficulty 4**; `Express 1/2 as a percentage` at difficulty 3; `1420 ÷ 20` at difficulty 3; `6170 ÷ 10` at difficulty 2 |
| Repeats inside one session | 5 prompts repeated verbatim, e.g. `Convert 7/25 to a decimal` (d1 and d2), `P(roll ≥ 3)` (d1 and d3), `P(both are aces)` (d3 and d4), the heartbeats Fermi twice |
| Self-graded questions were free points | Three attempts submitted **blank in 4–6 seconds** and marked correct (two oral, one Fermi) |
| Tiny samples produced high proficiency | `conditional-probability` = **90 proficiency from 3 questions** |
| Free points for showing up | 10% of proficiency was a recency term worth a flat +10 for practising today |

Root cause in the formula: proficiency was `50% accuracy + 25% speed +
15% streak + 10% recency`, with **no difficulty weighting anywhere**. A perfect run
of difficulty-1 questions scored identically to a perfect run of difficulty-5 ones,
and a 15×-over-target correct answer lost only a fraction of the 25% speed term.

---

## 3. Question archetypes extracted

### Mode 1 — Rapid Arithmetic Screening (`rapid`)

Timed-screen arithmetic. Reading time is part of the clock.

| Archetype | Shape | Source of the shape |
|---|---|---|
| `addition` / `subtraction` | multi-digit, carry/borrow density scales with level | screen convention |
| `multiplication` | 3d×1d → 2d×2d → 3d×2d → near-base tricks | Jane Street numeracy remark |
| `division` | exact, then **non-exact with a decimal/remainder answer** | screen convention |
| `decimal-ops` | ×/÷ by 0.4, 0.25, 1.5, 0.05 — place-value discipline | screen convention |
| `missing-operand` | `? × 14 = 322`, `84 ÷ ? = 3.5` — inverse thinking | screen convention |
| `sequential-arithmetic` | 3–4 chained operations, no intermediate written down | screen convention |
| `approximation` | nearest integer / order of magnitude / `√`, `∛` by big-part | **Street-Fighting Math, "taking out the big part"** |
| `fraction-to-decimal`, `fraction-to-percent` | conversions, denominators get less friendly by level | screen convention |
| `representation-compare` | *which is larger:* `7/16` or `0.44`? `3/8` or `37%`? | screen convention |
| `percent-of` | 10%/1% building blocks → awkward percents | screen convention |
| `reverse-percent` | "after −18% it is 246, what was it" — divide, never subtract | screen convention |
| `sequential-percent` | 2–4 compounding moves, net change | screen convention |

### Mode 2 — Interview Numeracy (`interview`)

Arithmetic embedded in a decision.

| Archetype | Shape | Source of the shape |
|---|---|---|
| `discrete-ev` | probability-weighted payoff over a common denominator | Jane Street, *Expected Value* |
| `recursive-ev` | `E = 1 + (1−p)E`, memoryless waiting times, coupon collector | Jane Street, *Problem Solving Tools / Recursion* |
| `break-even-prob` | solve `y + (x−y)p = 0` for `p`; "how often must this win" | Jane Street, indicator-function payoff algebra |
| `odds-implied-prob` | 7:2 against ↔ implied %; overround across two quotes | markets vocabulary |
| `percentage-chain` | multi-step % moves on a stated price, back to a level | Jane Street + screen convention |
| `dice` / `coins` / `cards` | counting equally-likely outcomes, complements | Jane Street, *Counting* |
| `conditional` | shrink the sample space; without-replacement recounting | Jane Street, *Conditional Probability* |
| `bayes` | natural-frequency table, low base rate dominates | Jane Street, *Conditional Probability* |
| `conditional-update` | **"conditional on being filled, what is it now worth?"** | Jane Street, *Adverse Selection* |
| `fair-value` | EV of a contract, including optional-reroll / max-of-n | Jane Street, *Making Markets* |
| `market-quote` | fair value **+ a two-sided quote + your edge**, widen on variance | Jane Street, *Making Markets* |
| `fermi` | decomposition into a stated chain, incl. dollar market sizing | **Street-Fighting Math pset 2 Q3** |
| `estimation-sanity` | order-of-magnitude check: is this plausible, yes/no | Street-Fighting Math + Jane Street calibration |

---

## 4. Timing assumptions

Two clocks, because the two modes model two different situations.

**Rapid Arithmetic Screening** — models a timed online screen where reading is on
the clock. Targets sit inside the bands below; the exact value per archetype varies
with intrinsic cost (2-digit addition is cheaper than 2d×2d multiplication).

| Level | Target band |
|---|---|
| 1 | 3–6 s |
| 2 | 5–9 s |
| 3 | 7–12 s |
| 4 | 9–16 s |
| 5 | 12–20 s (rapid archetypes rarely reach L5) |

**Interview Numeracy** — models a conversation. Time to think, but not homework pace.

| Archetype class | Target band |
|---|---|
| Simple EV (2 outcomes) | 15–30 s |
| Multi-outcome EV (3–5) | 25–45 s |
| Percentage chains | 15–30 s |
| Break-even probability | 20–45 s |
| Odds / implied probability | 12–30 s |
| Conditional / Bayes | 20–65 s |
| Estimation | 30–90 s |
| Fair value **+ market quote** | 45–120 s |

**Cut-off** (new — there was none). Rapid: `2.5 ×` target. Interview: `3 ×` target.
Past it the attempt scores **0** and is marked timed-out; the timeout *rate* then feeds
the hold-difficulty rule.

The cut-off is a **scoring** boundary, not a grading one. The question stays open past it
and the answer is never revealed until you submit one or explicitly ask — working a problem
through to the end is the point of the rep, and being handed the answer mid-thought wastes
it. A correct answer past the cut-off is recorded as correct (it is not a knowledge gap),
earns nothing, and cannot satisfy an advancement gate because the median-time requirement
blocks it.

Justification for the strictness, given Jane Street's "not in 5 seconds" caveat:
the tight clock applies only to Rapid mode, which is explicitly modelling a
screening test rather than an interview, and even there speed is 30% of the score
rather than a pass/fail gate.

---

## 5. Difficulty ladder

Five levels that differ **structurally**, not just numerically. The old generators
mostly changed operand magnitude; the new ones change the *number of steps* and the
*friendliness of the numbers*.

| Level | Name | Rapid Arithmetic | Interview Numeracy |
|---|---|---|---|
| **1** | Foundation | single-step, round/friendly operands, no carrying pressure. `3/10 → %`, `20% of 170` | 2-outcome EV over halves; die/coin fair value |
| **2** | Basic screening | two-step arithmetic; common percentages; **reverse percentages**; less-common fractions (`/8`, `/16`, `/20`) | 2–3-outcome EV; simple break-even; single conditional step |
| **3** | Competitive screening | mixed fractions/decimals/percentages; three-step chains; **non-exact division**; representation switching; percentage chains | 3-outcome EV; percentage chain on a price; odds↔probability; two-step conditional |
| **4** | Advanced screening | rapid mixed formats; awkward-but-tractable percentages (`37%`, `62%`); **missing operands with decimals**; multi-operation; strict clock | 4-outcome EV with awkward weights; break-even with asymmetric payoffs; Bayes from natural frequencies |
| **5** | Interview integration | (rarely used — rapid tops out at 4) | **fair value + two-sided quote + edge**; conditional update after a fill (adverse selection); estimation with an explicit sanity check; multi-stage EV |

Two structural rules that fix the observed bugs:

1. **No degenerate instances.** Every generator now rejects and regenerates any
   instance whose *actual* difficulty falls below its level — this is what produced
   `Convert 1/2 to a decimal` at difficulty 4 (the fraction was reduced by `gcd`
   after the denominator was chosen, collapsing `6/12` to `1/2`). Fractions are now
   chosen post-reduction, division by 10/20/100 is banned above level 2, and so on.
2. **No repeats inside a session.** Generation is wrapped in a de-duplicating
   sampler keyed on the rendered prompt, with a bounded retry budget.

---

## 6. Scoring changes recommended

### 6.1 Time-credit ladder (new; the single biggest change)

One ladder, used everywhere — credit, session points, and the speed component of
proficiency:

| Time vs target | Credit |
|---|---|
| ≤ 1.00× | 100% |
| 1.00–1.25× | 85% |
| 1.25–1.50× | 65% |
| 1.50–2.00× | 35% |
| > 2.00× | 10% |
| past the cut-off (right or wrong) | 0% |
| wrong answer, `rapid` mode | **−25%** (negative) |
| wrong answer, `interview` mode | 0% |

Against the recorded history this is decisive: the 181-second reverse-percentage
answer goes from *full accuracy credit* to **10%**.

### 6.2 Proficiency (replaces `50/25/15/10`)

| Weight | Component |
|---|---|
| 35% | difficulty-adjusted accuracy |
| 30% | speed relative to target (the ladder above) |
| 20% | highest **reliably passed** difficulty |
| 10% | consistency (streak of correct *and* on-time) |
| 5% | recent trend (last third vs. earlier) |

Plus a documented **staleness multiplier** (1.00 within 3 idle days → 0.75 at 30+),
replacing the old flat +10 "practised today" bonus.

### 6.3 Proficiency caps by highest level passed

| Highest level passed | Cap |
|---|---|
| none | 25 |
| 1 | 40 |
| 2 | 60 |
| 3 | 75 |
| 4 | 90 |
| 5 | 100 |

### 6.4 Advancement evidence (all four required, per topic per level)

- ≥ 20 recent questions at that level
- across ≥ 2 separate sessions
- ≥ 85% accuracy
- median time ≤ target

### 6.5 Hold or reduce difficulty when any of

- accuracy < 70%
- timeout rate > 15%
- median time > 1.5× target
- one error type is ≥ 40% of recent misses (and ≥ 3 of them)

### 6.6 Self-graded questions stop being free

Estimation and oral answers submitted blank, or submitted faster than a floor time,
cannot be self-marked correct. Fermi keeps the within-a-factor-of-2 bar, now stated
in the prompt and enforced when a numeric estimate is entered.

### 6.7 Readiness score

Unchanged in form (mean topic proficiency × 10) — the inputs are what was broken,
not the aggregation. Level thresholds are unchanged, so the same 1000-point scale
stays comparable; the same history now scores far lower because the components are
honest.

---

## 7. Calibration plan (execution order)

1. `types.ts` — add `mode`, `timeoutSeconds`; replace the target-time table.
2. `scoring.ts` — time-credit ladder, wrong/timeout penalties, difficulty-aware points.
3. `proficiency.ts` — new weights, level caps, advancement gates, hold/reduce rules.
4. Generators — five real tiers, degenerate-instance rejection, new archetypes.
5. `dedupe` sampler + mixed-format sessions + timeout enforcement in the runner.
6. `docs/question-calibration-report.md` — 30+ generated samples per level.
7. Tests: structural-hardness monotonicity, cap enforcement, slow-credit decay,
   advancement gating, session-level archetype diversity and uniqueness.

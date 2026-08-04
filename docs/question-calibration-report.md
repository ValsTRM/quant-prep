# Question calibration report

Generated samples straight out of the live generators — this file is produced by running them, not written by hand. It is the evidence that each level is structurally harder than the one below it.

Every question here is procedurally generated from original templates. Nothing is reproduced from the Green Book, QuantGuide, or any other copyrighted source.

## The ladder

| Level | Name | What changes | Proficiency cap |
|---|---|---|---|
| 1 | Foundation | Single-step, friendly operands. Warm-up only. | 40 |
| 2 | Basic screening | Two-step arithmetic, common percentages, reverse percentages. | 60 |
| 3 | Competitive screening | Mixed representations, three-step chains, non-exact division. | 75 |
| 4 | Advanced screening | Awkward percentages, missing operands with decimals, strict clock. | 90 |
| 5 | Interview integration | Market quotes, break-evens, conditional updates, estimation. | 100 |

Clearing only level N caps proficiency at the value in the last column, no matter how fast or how accurate you are. Above 90 requires level-5 evidence.

## Time-credit ladder

| Time vs target | Credit |
|---|---|
| ≤ 1.00× | 100% |
| 1.00–1.25× | 85% |
| 1.25–1.50× | 65% |
| 1.50–2.00× | 35% |
| > 2.00× | 10% |
| past the cut-off (right or wrong) | 0 |
| wrong answer (rapid mode) | −25% |
| wrong answer (interview mode) | 0 |

The cut-off column below is a **scoring** boundary, not a grading one: past it the question stays open so you can finish working it, and the answer is only ever shown once you submit one or explicitly ask for it.

## Level 1 — Foundation

Single-step, friendly operands. Warm-up only. Proficiency cap **40**. 30 samples below: 20 rapid arithmetic, 10 interview numeracy, covering 23 archetypes.

| # | Prompt | Answer | Archetype | Mode | Target | Cut-off | Why this level |
|---|---|---|---|---|---|---|---|
| 1 | 62 + 23 = ? | 85 | Addition | Rapid arithmetic | 3s | 10s | 2 terms of up to 2 digits; needs 0 carries; target 3s, cut-off 10s |
| 2 | 66 − 19 = ? | 47 | Subtraction | Rapid arithmetic | 3s | 10s | 2-digit minuend; no borrows; target 3s, cut-off 10s |
| 3 | 6 × 21 = ? | 126 | Multiplication | Rapid arithmetic | 5s | 13s | 1-digit × 2-digit = 2 partial products; target 5s, cut-off 13s |
| 4 | 378 ÷ 9 = ? | 42 | Division | Rapid arithmetic | 5s | 13s | exact, divisor 9 (not a multiple of 5 or 10 above L2); target 5s, cut-off 13s |
| 5 | 96 × 0.5 = ? | 48 | Decimal operations | Rapid arithmetic | 4s | 10s | decimal multiplier 0.5; place value must be tracked; target 4s, cut-off 10s |
| 6 | ? + 78 = 138 | 60 | Missing operand | Rapid arithmetic | 5s | 13s | one operation to invert; target 5s, cut-off 13s |
| 7 | 53 + 42 − 31 = ? | 64 | Sequential arithmetic | Rapid arithmetic | 5s | 13s | 2 chained operations held in working memory; target 5s, cut-off 13s |
| 8 | Estimate 26 × 38 to within 5%. | 988 | Approximation | Rapid arithmetic | 5s | 13s | round-and-adjust; tolerance is wide; target 5s, cut-off 13s |
| 9 | Convert 1/5 to a decimal. | 0.2 | Fraction → decimal | Rapid arithmetic | 3s | 10s | denominator 5 terminates — recall, not computation; target 3s, cut-off 10s |
| 10 | Express 9/10 as a percentage. Answer with the number only. | 90 | Fraction → percent | Rapid arithmetic | 3s | 10s | denominator 10 terminates — recall, not computation; target 3s, cut-off 10s |
| 11 | Which is larger?  A) 3/10   B) 35.4%   (answer A or B) | B | Representation comparison | Rapid arithmetic | 4s | 10s | gap between the two forms is ~18%, so eyeballing fails; target 4s, cut-off 10s |
| 12 | What is 50% of 110? | 55 | Percent of a number | Rapid arithmetic | 4s | 10s | memorised percentage (50%); target 4s, cut-off 10s |
| 13 | A price moves down 10%, then down 25%. What is the net percentage change? (Signed number, e.g. -2.5) | -32.5 | Sequential % changes | Rapid arithmetic | 6s | 15s | 2 compounding moves; target 6s, cut-off 15s |
| 14 | A game pays: 1/4 chance of winning $8, 3/4 chance of losing $5. What is the expected value in dollars? (Negative if you expect to lose.) | -1.75 | Discrete EV | Interview numeracy | 15s | 45s | 2 outcomes over a common denominator; target 15s, cut-off 45s |
| 15 | A bet pays +$10 if it works and −$10 if it doesn't. What win probability makes it break even? (Percent, 1 dp.) | 50 | Break-even probability | Interview numeracy | 20s | 60s | solve EV = 0 for p; target 20s, cut-off 60s |
| 16 | You roll one fair die. What is P(roll = 1)? (Answer as a fraction like 5/36 or a decimal.) | 0.1667 | Dice probability | Interview numeracy | 12s | 36s | one-object sample space; target 12s, cut-off 36s |
| 17 | You flip 3 fair coins. What is P(exactly 3 heads)? (Answer as a fraction like 5/36 or a decimal.) | 0.125 | Coin probability | Interview numeracy | 12s | 36s | 3-object sample space; target 12s, cut-off 36s |
| 18 | You draw one card from a standard 52-card deck. What is P(it is a seven)? (Answer as a fraction like 5/36 or a decimal.) | 0.0769 | Card probability | Interview numeracy | 12s | 36s | one-object sample space; target 12s, cut-off 36s |
| 19 | A bookmaker quotes 7-to-1 on an event. What is the implied probability? (Percent, 1 dp.) | 87.5 | Odds & implied probability | Interview numeracy | 12s | 36s | single odds↔probability conversion; target 12s, cut-off 36s |
| 20 | An urn holds 7 red and 4 blue balls. You draw two without replacement. Given the first is red, what is P(the second is also red)? (Answer as a fraction like 5/36 or a decimal.) | 0.6 | Conditional probability | Interview numeracy | 20s | 60s | sample space shrinks under the condition; target 20s, cut-off 60s |
| 21 | A fair six-sided die is rolled once and you're paid the face value in dollars. What is the fair value of this contract? (2 dp.) | 3.5 | Fair value | Interview numeracy | 20s | 60s | price the contract's EV; target 20s, cut-off 60s |
| 22 | Estimate the number of seconds in 8 hours, then sanity-check the order of magnitude. Write down your estimate and the chain you used — a bare number does not count. | 28,800 | Fermi estimation | Interview numeracy | 30s | 90s | multi-factor decomposition, self-graded within a factor of 2; target 30s, cut-off 90s |
| 23 | A shop sells 8 units a day at $4 each. Someone claims annual revenue is about $117k. What is the correct figure, in thousands of dollars? (1 dp.) | 11.68 | Estimation sanity check | Interview numeracy | 25s | 75s | order-of-magnitude plausibility check on a stated claim; target 25s, cut-off 75s |
| 24 | 35 + 82 = ? | 117 | Addition | Rapid arithmetic | 3s | 10s | 2 terms of up to 2 digits; carry-free; target 3s, cut-off 10s |
| 25 | 58 − 19 = ? | 39 | Subtraction | Rapid arithmetic | 3s | 10s | 2-digit minuend; no borrows; target 3s, cut-off 10s |
| 26 | 7 × 36 = ? | 252 | Multiplication | Rapid arithmetic | 5s | 13s | 1-digit × 2-digit = 2 partial products; target 5s, cut-off 13s |
| 27 | 204 ÷ 6 = ? | 34 | Division | Rapid arithmetic | 5s | 13s | exact, divisor 6 (not a multiple of 5 or 10 above L2); target 5s, cut-off 13s |
| 28 | 74 × 0.5 = ? | 37 | Decimal operations | Rapid arithmetic | 4s | 10s | decimal multiplier 0.5; place value must be tracked; target 4s, cut-off 10s |
| 29 | ? + 79 = 154 | 75 | Missing operand | Rapid arithmetic | 5s | 13s | one operation to invert; target 5s, cut-off 13s |
| 30 | 70 + 31 − 22 = ? | 79 | Sequential arithmetic | Rapid arithmetic | 5s | 13s | 2 chained operations held in working memory; target 5s, cut-off 13s |

## Level 2 — Basic screening

Two-step arithmetic, common percentages, reverse percentages. Proficiency cap **60**. 30 samples below: 17 rapid arithmetic, 13 interview numeracy, covering 27 archetypes.

| # | Prompt | Answer | Archetype | Mode | Target | Cut-off | Why this level |
|---|---|---|---|---|---|---|---|
| 1 | 889 + 781 = ? | 1670 | Addition | Rapid arithmetic | 5s | 13s | 2 terms of up to 3 digits; needs 3 carries; target 5s, cut-off 13s |
| 2 | 651 − 91 = ? | 560 | Subtraction | Rapid arithmetic | 5s | 13s | 3-digit minuend; no borrows; target 5s, cut-off 13s |
| 3 | 828 × 8 = ? | 6624 | Multiplication | Rapid arithmetic | 8s | 20s | 3-digit × 1-digit = 3 partial products; target 8s, cut-off 20s |
| 4 | 1944 ÷ 6 = ? | 324 | Division | Rapid arithmetic | 8s | 20s | exact, divisor 6 (not a multiple of 5 or 10 above L2); target 8s, cut-off 20s |
| 5 | 240 × 0.25 = ? | 60 | Decimal operations | Rapid arithmetic | 6s | 15s | decimal multiplier 0.25; place value must be tracked; target 6s, cut-off 15s |
| 6 | ? × 4 = 260 | 65 | Missing operand | Rapid arithmetic | 8s | 20s | one operation to invert; target 8s, cut-off 20s |
| 7 | 343 + 46 − 76 + 16 = ? | 329 | Sequential arithmetic | Rapid arithmetic | 8s | 20s | 3 chained operations held in working memory; target 8s, cut-off 20s |
| 8 | Estimate 2,500,000 ÷ 25 to within 10%. | 100000 | Approximation | Rapid arithmetic | 7s | 18s | round-and-adjust; tolerance is wide; target 7s, cut-off 18s |
| 9 | Convert 17/20 to a decimal. | 0.85 | Fraction → decimal | Rapid arithmetic | 5s | 13s | denominator 20 terminates — recall, not computation; target 5s, cut-off 13s |
| 10 | Express 7/8 as a percentage. Answer with the number only. | 87.5 | Fraction → percent | Rapid arithmetic | 5s | 13s | denominator 8 terminates — recall, not computation; target 5s, cut-off 13s |
| 11 | Which is larger?  A) 3/8   B) 41.6%   (answer A or B) | B | Representation comparison | Rapid arithmetic | 6s | 15s | gap between the two forms is ~11%, so eyeballing fails; target 6s, cut-off 15s |
| 12 | What is 80% of 105? | 84 | Percent of a number | Rapid arithmetic | 6s | 15s | 80% has no shortcut — build it from 10% and 1% blocks; target 6s, cut-off 15s |
| 13 | After decreasing by 30%, a quantity is 301. What was it originally? | 430 | Reverse percentage | Rapid arithmetic | 8s | 20s | 30% has no shortcut — build it from 10% and 1% blocks; must divide by the factor, not subtract from the result; target 8s, cut-off 20s |
| 14 | A price moves up 10%, then down 15%. What is the net percentage change? (Signed number, e.g. -2.5) | -6.5 | Sequential % changes | Rapid arithmetic | 9s | 23s | 2 compounding moves; target 9s, cut-off 23s |
| 15 | A game pays: 3/5 chance of winning $2, 1/5 chance of winning $2, 1/5 chance of losing $5. What is the expected value in dollars? (Negative if you expect to lose.) | 0.6 | Discrete EV | Interview numeracy | 20s | 60s | 3 outcomes over a common denominator; target 20s, cut-off 60s |
| 16 | You roll a fair 4-sided die repeatedly. What is the expected number of rolls until you first see a specific face? | 4 | Recursive EV | Interview numeracy | 28s | 84s | geometric waiting time, E = 1/p; target 28s, cut-off 84s |
| 17 | A bet pays +$90 if it works and −$30 if it doesn't. What win probability makes it break even? (Percent, 1 dp.) | 25 | Break-even probability | Interview numeracy | 26s | 78s | solve EV = 0 for p; target 26s, cut-off 78s |
| 18 | A stock starts at $90. It falls 50%, then falls 20%. What is the final price? (2 dp) | 36 | Percentage chain | Interview numeracy | 18s | 54s | 2 compounding moves; target 18s, cut-off 54s |
| 19 | You roll two fair dice. What is P(both show the same face)? (Answer as a fraction like 5/36 or a decimal.) | 0.1667 | Dice probability | Interview numeracy | 18s | 54s | two-object sample space; target 18s, cut-off 54s |
| 20 | You flip 4 fair coins. What is P(exactly 3 heads)? (Answer as a fraction like 5/36 or a decimal.) | 0.25 | Coin probability | Interview numeracy | 18s | 54s | 4-object sample space; target 18s, cut-off 54s |
| 21 | You draw one card from a standard deck. What is P(it is a jack or a heart)? (Answer as a fraction like 5/36 or a decimal.) | 0.3077 | Card probability | Interview numeracy | 18s | 54s | one-object sample space; target 18s, cut-off 54s |
| 22 | Odds are quoted as 11-to-6 against. What is the implied probability? (Percent, 1 dp.) | 35.29 | Odds & implied probability | Interview numeracy | 16s | 48s | single odds↔probability conversion; target 16s, cut-off 48s |
| 23 | You roll two fair dice one at a time. The first shows 4. What is P(the total is at least 9)? (Answer as a fraction like 5/36 or a decimal.) | 0.3333 | Conditional probability | Interview numeracy | 28s | 84s | sample space shrinks under the condition; target 28s, cut-off 84s |
| 24 | 25% of a population has a condition. A test detects it 90% of the time but also flags 10% of healthy people. Given a positive test, what is P(the person has the condition)? (Decimal, 2+ places.) | 0.75 | Bayes | Interview numeracy | 38s | 114s | base rate 25% — low prevalence dominates test accuracy; target 38s, cut-off 114s |
| 25 | A fair coin pays $14 on heads and $7 on tails. What is the fair value of this contract? (2 dp.) | 10.5 | Fair value | Interview numeracy | 28s | 84s | price the contract's EV; target 28s, cut-off 84s |
| 26 | Estimate the number of walking steps in a marathon (26 miles). Write down your estimate and the chain you used — a bare number does not count. | 54,900 | Fermi estimation | Interview numeracy | 45s | 135s | multi-factor decomposition, self-graded within a factor of 2; target 45s, cut-off 135s |
| 27 | A shop sells 3 units a day at $5 each. Someone claims annual revenue is about $55k. What is the correct figure, in thousands of dollars? (1 dp.) | 5.47 | Estimation sanity check | Interview numeracy | 35s | 105s | order-of-magnitude plausibility check on a stated claim; target 35s, cut-off 105s |
| 28 | 325 + 375 = ? | 700 | Addition | Rapid arithmetic | 5s | 13s | 2 terms of up to 3 digits; needs 2 carries; target 5s, cut-off 13s |
| 29 | 309 − 23 = ? | 286 | Subtraction | Rapid arithmetic | 5s | 13s | 3-digit minuend; no borrows; target 5s, cut-off 13s |
| 30 | 138 × 8 = ? | 1104 | Multiplication | Rapid arithmetic | 8s | 20s | 3-digit × 1-digit = 3 partial products; target 8s, cut-off 20s |

## Level 3 — Competitive screening

Mixed representations, three-step chains, non-exact division. Proficiency cap **75**. 30 samples below: 15 rapid arithmetic, 15 interview numeracy, covering 29 archetypes.

| # | Prompt | Answer | Archetype | Mode | Target | Cut-off | Why this level |
|---|---|---|---|---|---|---|---|
| 1 | 172 + 127 + 155 = ? | 454 | Addition | Rapid arithmetic | 7s | 18s | 3 terms of up to 3 digits; needs 2 carries; target 7s, cut-off 18s |
| 2 | 433 − 367 = ? | 66 | Subtraction | Rapid arithmetic | 8s | 20s | 3-digit minuend; needs 2 borrows; target 8s, cut-off 20s |
| 3 | 22 × 46 = ? | 1012 | Multiplication | Rapid arithmetic | 12s | 30s | 2-digit × 2-digit = 4 partial products; target 12s, cut-off 30s |
| 4 | 333 ÷ 22 = ? (2 decimal places) | 15.14 | Division | Rapid arithmetic | 12s | 30s | non-exact, 3-digit dividend, answer carried to 2 dp; target 12s, cut-off 30s |
| 5 | 272 × 0.75 = ? | 204 | Decimal operations | Rapid arithmetic | 9s | 23s | decimal multiplier 0.75; place value must be tracked; target 9s, cut-off 23s |
| 6 | 792 ÷ ? = 33 | 24 | Missing operand | Rapid arithmetic | 11s | 28s | one operation to invert; target 11s, cut-off 28s |
| 7 | (30 + 20) × 4 = ? | 200 | Sequential arithmetic | Rapid arithmetic | 12s | 30s | 2 chained operations held in working memory; target 12s, cut-off 30s |
| 8 | Estimate √32 to 2 decimal places. | 5.66 | Approximation | Rapid arithmetic | 10s | 25s | requires a first-order correction to a nearby exact anchor; target 10s, cut-off 25s |
| 9 | Convert 1/6 to a decimal (3 decimal places). | 0.167 | Fraction → decimal | Rapid arithmetic | 8s | 20s | denominator 6 does not terminate — must be computed; target 8s, cut-off 20s |
| 10 | Express 1/3 as a percentage (1 decimal place). Answer with the number only. | 33.3 | Fraction → percent | Rapid arithmetic | 8s | 20s | denominator 3 does not terminate — must be computed; target 8s, cut-off 20s |
| 11 | Which is larger?  A) 3/40   B) 0.08   (answer A or B) | B | Representation comparison | Rapid arithmetic | 9s | 23s | gap between the two forms is ~6%, so eyeballing fails; target 9s, cut-off 23s |
| 12 | What is 65% of 764? | 496.6 | Percent of a number | Rapid arithmetic | 9s | 23s | 65% has no shortcut — build it from 10% and 1% blocks; target 9s, cut-off 23s |
| 13 | After increasing by 80%, a quantity is 190.8. What was it originally? | 106 | Reverse percentage | Rapid arithmetic | 11s | 28s | 80% has no shortcut — build it from 10% and 1% blocks; must divide by the factor, not subtract from the result; target 11s, cut-off 28s |
| 14 | A price moves down 10%, then up 5%, then up 15%. What is the net percentage change? (Signed number, e.g. -2.5) | 8.67 | Sequential % changes | Rapid arithmetic | 12s | 30s | 3 compounding moves; target 12s, cut-off 30s |
| 15 | A game pays: 3/6 chance of winning $57, 2/6 chance of losing $40, 1/6 chance of winning $45. What is the expected value in dollars? (Negative if you expect to lose.) | 22.67 | Discrete EV | Interview numeracy | 27s | 81s | 3 outcomes over a common denominator; target 27s, cut-off 81s |
| 16 | You roll a fair 8-sided die repeatedly. What is the expected number of rolls until you see a 7 or higher? (2 decimal places.) | 4 | Recursive EV | Interview numeracy | 38s | 114s | geometric waiting time, E = 1/p; target 38s, cut-off 114s |
| 17 | A trade makes $56 when it works and loses $51 when it doesn't. What is the break-even win probability? (Percent, 1 dp.) | 47.66 | Break-even probability | Interview numeracy | 32s | 96s | solve EV = 0 for p; target 32s, cut-off 96s |
| 18 | A stock starts at $68. It falls 30%, then falls 10%, then rises 20%. What is the final price? (2 dp) | 51.41 | Percentage chain | Interview numeracy | 22s | 66s | 3 compounding moves; target 22s, cut-off 66s |
| 19 | You roll 4 fair dice. What is P(at least one six)? (Answer as a fraction like 5/36 or a decimal.) | 0.5177 | Dice probability | Interview numeracy | 25s | 75s | 4-object sample space; complement or inclusion–exclusion needed; target 25s, cut-off 75s |
| 20 | You flip a fair coin until it lands heads. What is P(the first heads is on flip 5)? (Answer as a fraction like 5/36 or a decimal.) | 0.0313 | Coin probability | Interview numeracy | 25s | 75s | 5-object sample space; target 25s, cut-off 75s |
| 21 | You draw two cards without replacement (A = 1, J = 11, Q = 12, K = 13). What is P(both rank above 11)? (Answer as a fraction like 5/36 or a decimal.) | 0.0211 | Card probability | Interview numeracy | 25s | 75s | two-object sample space; target 25s, cut-off 75s |
| 22 | An event has probability 78%. Express the odds against it as a single number x, meaning x-to-1. (2 dp.) | 0.28 | Odds & implied probability | Interview numeracy | 20s | 60s | single odds↔probability conversion; target 20s, cut-off 60s |
| 23 | You roll two fair dice one at a time. The first shows 4. What is P(the total is at least 9)? (Answer as a fraction like 5/36 or a decimal.) | 0.3333 | Conditional probability | Interview numeracy | 36s | 108s | sample space shrinks under the condition; target 36s, cut-off 108s |
| 24 | 2% of a population has a condition. A test detects it 90% of the time but also flags 5% of healthy people. Given a positive test, what is P(the person has the condition)? (Decimal, 2+ places.) | 0.2687 | Bayes | Interview numeracy | 45s | 135s | base rate 2% — low prevalence dominates test accuracy; target 45s, cut-off 135s |
| 25 | A contract is worth $35 or $29, equally likely. You offer at $33. Your counterparty knows the true value and only trades when it is profitable for them. Given your offer was lifted, what is the expected value of the contract? (2 dp.) | 35 | Conditional update (adverse selection) | Interview numeracy | 42s | 126s | adverse selection: the fill itself is evidence; fully informed counterparty; target 42s, cut-off 126s |
| 26 | Two fair dice are rolled and you're paid the sum in dollars. What is the fair value of this contract? (2 dp.) | 7 | Fair value | Interview numeracy | 36s | 108s | price the contract's EV; target 36s, cut-off 108s |
| 27 | A fair die is rolled; the contract pays 5 × (face value) + $3 in dollars. You quote it $1 wide around fair value and get lifted on 34 contracts. Ignoring adverse selection, what is your expected profit in dollars? (2 dp.) | 17 | Fair value + market quote | Interview numeracy | 72s | 216s | fair value, then an actual quote; edge × size; target 72s, cut-off 216s |
| 28 | Estimate the number of heartbeats in a year. Write down your estimate and the chain you used — a bare number does not count. | 36,800,000 | Fermi estimation | Interview numeracy | 60s | 180s | multi-factor decomposition, self-graded within a factor of 2; target 60s, cut-off 180s |
| 29 | A strategy makes $1.5 per trade on 400 trades a day, 250 days a year. What is the annual P&L, in millions of dollars? (2 dp.) | 0.15 | Estimation sanity check | Interview numeracy | 45s | 135s | order-of-magnitude plausibility check on a stated claim; target 45s, cut-off 135s |
| 30 | 311 + 749 + 306 = ? | 1366 | Addition | Rapid arithmetic | 7s | 18s | 3 terms of up to 3 digits; needs 2 carries; target 7s, cut-off 18s |

## Level 4 — Advanced screening

Awkward percentages, missing operands with decimals, strict clock. Proficiency cap **90**. 30 samples below: 15 rapid arithmetic, 15 interview numeracy, covering 29 archetypes.

| # | Prompt | Answer | Archetype | Mode | Target | Cut-off | Why this level |
|---|---|---|---|---|---|---|---|
| 1 | 6351 + 7103 + 6584 = ? | 20038 | Addition | Rapid arithmetic | 10s | 25s | 3 terms of up to 4 digits; needs 3 carries; target 10s, cut-off 25s |
| 2 | 3313 − 365 = ? | 2948 | Subtraction | Rapid arithmetic | 11s | 28s | 4-digit minuend; needs 3 borrows; target 11s, cut-off 28s |
| 3 | 536 × 76 = ? | 40736 | Multiplication | Rapid arithmetic | 16s | 40s | 3-digit × 2-digit = 6 partial products; target 16s, cut-off 40s |
| 4 | 5658 ÷ 23 = ? | 246 | Division | Rapid arithmetic | 16s | 40s | exact, divisor 23 (not a multiple of 5 or 10 above L2); target 16s, cut-off 40s |
| 5 | 2350 ÷ 0.08 = ? | 29375 | Decimal operations | Rapid arithmetic | 13s | 33s | decimal multiplier 0.08; place value must be tracked; target 13s, cut-off 33s |
| 6 | ? × 2.5 = 840 | 336 | Missing operand | Rapid arithmetic | 15s | 38s | one operation to invert; decimal multiplier, so the direction of the inverse is not obvious; target 15s, cut-off 38s |
| 7 | 145 ÷ 5 + 46 × 2 − 76 = ? | 45 | Sequential arithmetic | Rapid arithmetic | 16s | 40s | 4 chained operations held in working memory; mixed precedence — division and multiplication before the additions; target 16s, cut-off 40s |
| 8 | Estimate the cube root of 30 to 2 decimal places. | 3.107 | Approximation | Rapid arithmetic | 14s | 35s | requires a first-order correction to a nearby exact anchor; target 14s, cut-off 35s |
| 9 | Convert 1/9 to a decimal (3 decimal places). | 0.111 | Fraction → decimal | Rapid arithmetic | 11s | 28s | denominator 9 does not terminate — must be computed; target 11s, cut-off 28s |
| 10 | Express 2/7 as a percentage (1 decimal place). Answer with the number only. | 28.6 | Fraction → percent | Rapid arithmetic | 11s | 28s | denominator 7 does not terminate — must be computed; target 11s, cut-off 28s |
| 11 | Which is larger?  A) 7/12   B) 56.58%   (answer A or B) | A | Representation comparison | Rapid arithmetic | 12s | 30s | gap between the two forms is ~3%, so eyeballing fails; target 12s, cut-off 30s |
| 12 | What is 37% of 345? | 127.65 | Percent of a number | Rapid arithmetic | 12s | 30s | 37% has no shortcut — build it from 10% and 1% blocks; target 12s, cut-off 30s |
| 13 | After increasing by 44%, a quantity is 95.04. What was it originally? | 66 | Reverse percentage | Rapid arithmetic | 15s | 38s | 44% has no shortcut — build it from 10% and 1% blocks; must divide by the factor, not subtract from the result; target 15s, cut-off 38s |
| 14 | A price moves up 35%, then down 22%, then up 60%. What is the net percentage change? (Signed number, e.g. -2.5) | 68.48 | Sequential % changes | Rapid arithmetic | 16s | 40s | 3 compounding moves; target 16s, cut-off 40s |
| 15 | A game pays: 2/10 chance of winning $59, 3/10 chance of winning $36, 1/10 chance of winning $56, 4/10 chance of winning $25. What is the expected value in dollars? (Negative if you expect to lose.) | 38.2 | Discrete EV | Interview numeracy | 35s | 105s | 4 outcomes over a common denominator; target 35s, cut-off 105s |
| 16 | You flip a fair coin repeatedly. What is the expected number of flips to get two heads in a row? | 6 | Recursive EV | Interview numeracy | 50s | 150s | run-based recursion, not a single geometric wait; target 50s, cut-off 150s |
| 17 | A trade makes $33 when it works and loses $27 when it doesn't, and costs $3 in fees either way. What win probability breaks even? (Percent, 1 dp.) | 50 | Break-even probability | Interview numeracy | 39s | 117s | solve EV = 0 for p; a fee shifts both legs; target 39s, cut-off 117s |
| 18 | A stock starts at $225. It falls 12%, then falls 18%, then rises 45%. What single percentage move would take it back to $225? (Signed number, 2 dp) | -4.43 | Percentage chain | Interview numeracy | 26s | 78s | 3 compounding moves; asks for the inverse move, not the forward one; target 26s, cut-off 78s |
| 19 | You roll two fair dice. What is P(sum ≥ 10)? (Answer as a fraction like 5/36 or a decimal.) | 0.1667 | Dice probability | Interview numeracy | 32s | 96s | two-object sample space; target 32s, cut-off 96s |
| 20 | You flip 6 fair coins. What is P(exactly 4 heads)? (Answer as a fraction like 5/36 or a decimal.) | 0.2344 | Coin probability | Interview numeracy | 32s | 96s | 6-object sample space; target 32s, cut-off 96s |
| 21 | You draw two cards without replacement. What is P(one is red and one is black)? (Answer as a fraction like 5/36 or a decimal.) | 0.5098 | Card probability | Interview numeracy | 32s | 96s | two-object sample space; target 32s, cut-off 96s |
| 22 | A two-way market is quoted at decimal odds 3.2 and 1.34. What is the overround (total implied probability minus 100%)? (Percentage points, 1 dp.) | 5.88 | Odds & implied probability | Interview numeracy | 25s | 75s | two quotes must be normalised against each other; target 25s, cut-off 75s |
| 23 | You draw three cards without replacement. Given the first two are diamonds, what is P(the third is also a diamond)? (Answer as a fraction like 5/36 or a decimal.) | 0.22 | Conditional probability | Interview numeracy | 45s | 135s | sample space shrinks under the condition; target 45s, cut-off 135s |
| 24 | Urn A holds 7 red and 1 blue balls; urn B holds 1 red and 6 blue. You pick an urn at random and draw one ball; it is red. What is P(you picked urn A)? (Decimal, 2+ places.) | 0.8596 | Bayes | Interview numeracy | 55s | 165s | two hypotheses with equal priors; target 55s, cut-off 165s |
| 25 | A contract is worth $62 or $52, equally likely. You offer at $58. 50% of counterparties know the true value and only trade when it is profitable for them; the other 50% trade at random, lifting your offer half the time regardless. Given your offer was lifted, what is the expected value of the contract? (2 dp.) | 59.5 | Conditional update (adverse selection) | Interview numeracy | 52s | 156s | adverse selection: the fill itself is evidence; mixed informed/uninformed flow; target 52s, cut-off 156s |
| 26 | Two fair dice are rolled and you're paid the larger of the two faces in dollars. What is the fair value of this contract? (2 dp.) | 4.47 | Fair value | Interview numeracy | 45s | 135s | price the contract's EV; non-linear payoff — linearity alone won't do it; target 45s, cut-off 135s |
| 27 | A fair die is rolled; you're paid $20 if it shows 4 or more, and nothing otherwise. You quote it $1 wide around fair value and get lifted on 12 contracts. Ignoring adverse selection, what is your expected profit in dollars? (2 dp.) | 6 | Fair value + market quote | Interview numeracy | 95s | 285s | fair value, then an actual quote; edge × size; target 95s, cut-off 285s |
| 28 | Estimate 43³ without computing it exactly. Write down your estimate and the chain you used — a bare number does not count. | 79,500 | Fermi estimation | Interview numeracy | 75s | 225s | multi-factor decomposition, self-graded within a factor of 2; target 75s, cut-off 225s |
| 29 | A desk trades $150M notional per day and captures 1 basis point. What is the annual revenue in dollars, assuming 250 trading days? (Within 5%.) | 3750000 | Estimation sanity check | Interview numeracy | 60s | 180s | order-of-magnitude plausibility check on a stated claim; target 60s, cut-off 180s |
| 30 | 4365 + 4638 + 5007 = ? | 14010 | Addition | Rapid arithmetic | 10s | 25s | 3 terms of up to 4 digits; needs 4 carries; target 10s, cut-off 25s |

## Level 5 — Interview integration

Market quotes, break-evens, conditional updates, estimation. Proficiency cap **100**. 30 samples below: 15 rapid arithmetic, 15 interview numeracy, covering 29 archetypes.

| # | Prompt | Answer | Archetype | Mode | Target | Cut-off | Why this level |
|---|---|---|---|---|---|---|---|
| 1 | 6094 + 6338 + 6416 + 7134 = ? | 25982 | Addition | Rapid arithmetic | 13s | 33s | 4 terms of up to 4 digits; needs 3 carries; target 13s, cut-off 33s |
| 2 | 56033 − 7999 = ? | 48034 | Subtraction | Rapid arithmetic | 14s | 35s | 5-digit minuend; needs 4 borrows; target 14s, cut-off 35s |
| 3 | 206 × 197 = ? | 40582 | Multiplication | Rapid arithmetic | 20s | 50s | 3-digit × 3-digit = 9 partial products; both near a round base, so the (base±x)(base±y) identity is the tractable route; target 20s, cut-off 50s |
| 4 | 32504 ÷ 68 = ? | 478 | Division | Rapid arithmetic | 20s | 50s | exact, divisor 68 (not a multiple of 5 or 10 above L2); target 20s, cut-off 50s |
| 5 | 380 × 0.6 × 0.25 = ? | 57 | Decimal operations | Rapid arithmetic | 16s | 40s | decimal multiplier 0.6; place value must be tracked; target 16s, cut-off 40s |
| 6 | (? + 26) × 8 = 688 | 60 | Missing operand | Rapid arithmetic | 19s | 48s | two operations to undo, in reverse order; target 19s, cut-off 48s |
| 7 | 148 ÷ 4 + 165 × 1.5 − 33 = ? | 251.5 | Sequential arithmetic | Rapid arithmetic | 20s | 50s | 4 chained operations held in working memory; mixed precedence — division and multiplication before the additions; target 20s, cut-off 50s |
| 8 | A quantity grows 3% per year for 10 years. Estimate the total percentage growth, to within 5%. | 34.4 | Approximation | Rapid arithmetic | 18s | 45s | requires a first-order correction to a nearby exact anchor; target 18s, cut-off 45s |
| 9 | Convert 17/23 to a decimal (3 decimal places). | 0.739 | Fraction → decimal | Rapid arithmetic | 14s | 35s | denominator 23 does not terminate — must be computed; target 14s, cut-off 35s |
| 10 | Express 3/19 as a percentage (1 decimal place). Answer with the number only. | 15.8 | Fraction → percent | Rapid arithmetic | 14s | 35s | denominator 19 does not terminate — must be computed; target 14s, cut-off 35s |
| 11 | Which is larger?  A) 4/23   B) 16.99%   (answer A or B) | A | Representation comparison | Rapid arithmetic | 16s | 40s | gap between the two forms is ~1.5%, so eyeballing fails; target 16s, cut-off 40s |
| 12 | What is 12.4% of 439? | 54.44 | Percent of a number | Rapid arithmetic | 16s | 40s | 12.4% has no shortcut — build it from 10% and 1% blocks; target 16s, cut-off 40s |
| 13 | After decreasing by 43.3%, a quantity is 402. What was it originally? | 709 | Reverse percentage | Rapid arithmetic | 19s | 48s | 43.3% has no shortcut — build it from 10% and 1% blocks; must divide by the factor, not subtract from the result; target 19s, cut-off 48s |
| 14 | A price moves up 22%, then down 22%, then down 35%, then down 8%. What is the net percentage change? (Signed number, e.g. -2.5) | -43.09 | Sequential % changes | Rapid arithmetic | 20s | 50s | 4 compounding moves; target 20s, cut-off 50s |
| 15 | A game pays: 4/15 chance of losing $13.1, 3/15 chance of losing $21.2, 2/15 chance of losing $13.6, 1/15 chance of winning $49.2, 5/15 chance of losing $45.9. What is the expected value in dollars? (Negative if you expect to lose.) | -21.57 | Discrete EV | Interview numeracy | 45s | 135s | 5 outcomes over a common denominator; payoffs carry cents; target 45s, cut-off 135s |
| 16 | You flip a fair coin repeatedly. What is the expected number of flips to get two heads in a row? | 6 | Recursive EV | Interview numeracy | 65s | 195s | run-based recursion, not a single geometric wait; target 65s, cut-off 195s |
| 17 | A trade makes $57 when it works and loses $77 when it fails. 20% of the time it is scratched for $0. What win probability (as a share of all trades) breaks even? (Percent, 1 dp.) | 45.97 | Break-even probability | Interview numeracy | 45s | 135s | solve EV = 0 for p; a third, zero-payoff outcome changes the denominator; target 45s, cut-off 135s |
| 18 | A stock starts at $95. It falls 18%, then rises 24%, then falls 18%, then falls 8%. What is the final price? (2 dp) | 72.87 | Percentage chain | Interview numeracy | 30s | 90s | 4 compounding moves; target 30s, cut-off 90s |
| 19 | You roll three fair dice. What is P(the maximum equals 3)? (Answer as a fraction like 5/36 or a decimal.) | 0.088 | Dice probability | Interview numeracy | 40s | 120s | three-object sample space; target 40s, cut-off 120s |
| 20 | You flip 5 fair coins. What is P(no two heads land next to each other)? (Answer as a fraction like 5/36 or a decimal.) | 0.4063 | Coin probability | Interview numeracy | 40s | 120s | 5-object sample space; complement or inclusion–exclusion needed; target 40s, cut-off 120s |
| 21 | You draw three cards without replacement. What is P(none of them is a face card)? (Answer as a fraction like 5/36 or a decimal.) | 0.4471 | Card probability | Interview numeracy | 40s | 120s | three-object sample space; complement or inclusion–exclusion needed; target 40s, cut-off 120s |
| 22 | A two-way market is quoted at decimal odds 1.57 and 3.16. Removing the overround proportionally, what is the fair probability of the first outcome? (Percent, 1 dp.) | 66.81 | Odds & implied probability | Interview numeracy | 30s | 90s | two quotes must be normalised against each other; target 30s, cut-off 90s |
| 23 | A family has two children. Given that at least one is a girl, what is P(both are girls)? (Answer as a fraction like 5/36 or a decimal.) | 0.3333 | Conditional probability | Interview numeracy | 55s | 165s | sample space shrinks under the condition; target 55s, cut-off 165s |
| 24 | 2% of a population has a condition. A test detects it 99% of the time but also flags 3% of healthy people. Given a positive test, what is P(the person has the condition)? (Decimal, 2+ places.) | 0.4024 | Bayes | Interview numeracy | 65s | 195s | base rate 2% — low prevalence dominates test accuracy; target 65s, cut-off 195s |
| 25 | A contract is worth $67 or $59, with probability 60% of being the $67 case. You offer at $64.8. 30% of counterparties know the true value and only trade when it is profitable for them; the other 70% trade at random, lifting your offer half the time regardless. Given your offer was lifted, what is the expected value of the contract? (2 dp.) | 64.89 | Conditional update (adverse selection) | Interview numeracy | 65s | 195s | adverse selection: the fill itself is evidence; mixed informed/uninformed flow; target 65s, cut-off 195s |
| 26 | A fair die is rolled and you're paid $(face − 2) in dollars, but never less than $0. What is the fair value of this contract? (2 dp.) | 1.67 | Fair value | Interview numeracy | 55s | 165s | price the contract's EV; target 55s, cut-off 165s |
| 27 | You roll a fair die and may reroll up to twice, taking whatever face you stop on. You quote it $0.8 wide around fair value and get lifted on 10 contracts. Ignoring adverse selection, what is your expected profit in dollars? (2 dp.) | 4 | Fair value + market quote | Interview numeracy | 120s | 360s | fair value, then an actual quote; edge × size; target 120s, cut-off 360s |
| 28 | Estimate the annual US market for toothbrushes, in dollars. Write down your estimate and the chain you used — a bare number does not count. | 3,560,000,000 | Fermi estimation | Interview numeracy | 90s | 270s | multi-factor decomposition, self-graded within a factor of 2; target 90s, cut-off 270s |
| 29 | A company reports $900M of annual revenue from 2 million users. What is the implied revenue per user per month, in dollars? (2 dp.) | 37.5 | Estimation sanity check | Interview numeracy | 75s | 225s | order-of-magnitude plausibility check on a stated claim; target 75s, cut-off 225s |
| 30 | 3863 + 4913 + 5414 + 2976 = ? | 17166 | Addition | Rapid arithmetic | 13s | 33s | 4 terms of up to 4 digits; needs 4 carries; target 13s, cut-off 33s |

## The same archetype across all five levels

Side by side, so the ladder is visible rather than asserted.

### Addition (Rapid arithmetic)

| Level | Prompt | Answer | Target |
|---|---|---|---|
| 1 | 57 + 68 = ? | 125 | 3s |
| 2 | 353 + 584 = ? | 937 | 5s |
| 3 | 161 + 366 + 646 = ? | 1173 | 7s |
| 4 | 3663 + 2655 + 4758 = ? | 11076 | 10s |
| 5 | 8339 + 2692 + 8144 + 2355 = ? | 21530 | 13s |

### Multiplication (Rapid arithmetic)

| Level | Prompt | Answer | Target |
|---|---|---|---|
| 1 | 7 × 39 = ? | 273 | 5s |
| 2 | 381 × 7 = ? | 2667 | 8s |
| 3 | 24 × 51 = ? | 1224 | 12s |
| 4 | 517 × 58 = ? | 29986 | 16s |
| 5 | 493 × 497 = ? | 245021 | 20s |

### Division (Rapid arithmetic)

| Level | Prompt | Answer | Target |
|---|---|---|---|
| 1 | 273 ÷ 7 = ? | 39 | 5s |
| 2 | 1710 ÷ 5 = ? | 342 | 8s |
| 3 | 1729 ÷ 19 = ? | 91 | 12s |
| 4 | 3057 ÷ 48 = ? (2 decimal places) | 63.69 | 16s |
| 5 | 2868 ÷ 69 = ? (2 decimal places) | 41.57 | 20s |

### Fraction → percent (Rapid arithmetic)

| Level | Prompt | Answer | Target |
|---|---|---|---|
| 1 | Express 4/5 as a percentage. Answer with the number only. | 80 | 3s |
| 2 | Express 3/20 as a percentage. Answer with the number only. | 15 | 5s |
| 3 | Express 1/6 as a percentage (1 decimal place). Answer with the number only. | 16.7 | 8s |
| 4 | Express 2/9 as a percentage (1 decimal place). Answer with the number only. | 22.2 | 11s |
| 5 | Express 13/8 as a percentage. Answer with the number only. | 162.5 | 14s |

### Percent of a number (Rapid arithmetic)

| Level | Prompt | Answer | Target |
|---|---|---|---|
| 1 | What is 25% of 150? | 37.5 | 4s |
| 2 | What is 15% of 190? | 28.5 | 6s |
| 3 | What is 60% of 768? | 460.8 | 9s |
| 4 | What is 37% of 135? | 49.95 | 12s |
| 5 | What is 87.3% of 637? | 556.1 | 16s |

### Discrete EV (Interview numeracy)

| Level | Prompt | Answer | Target |
|---|---|---|---|
| 1 | A game pays: 1/4 chance of losing $7, 3/4 chance of winning $10. What is the expected value in dollars? (Negative if you expect to lose.) | 5.75 | 15s |
| 2 | A game pays: 1/4 chance of winning $3, 2/4 chance of winning $19, 1/4 chance of winning $23. What is the expected value in dollars? (Negative if you expect to lose.) | 16 | 20s |
| 3 | A game pays: 1/6 chance of losing $12, 3/6 chance of winning $21, 2/6 chance of winning $65. What is the expected value in dollars? (Negative if you expect to lose.) | 30.17 | 27s |
| 4 | A game pays: 5/10 chance of winning $84, 2/10 chance of losing $55, 2/10 chance of losing $37, 1/10 chance of winning $76. What is the expected value in dollars? (Negative if you expect to lose.) | 31.2 | 35s |
| 5 | A game pays: 7/20 chance of winning $31, 6/20 chance of losing $27.4, 3/20 chance of winning $66.9, 2/20 chance of winning $80.9, 2/20 chance of losing $39.7. What is the expected value in dollars? (Negative if you expect to lose.) | 16.79 | 45s |

### Break-even probability (Interview numeracy)

| Level | Prompt | Answer | Target |
|---|---|---|---|
| 1 | A bet pays +$60 if it works and −$20 if it doesn't. What win probability makes it break even? (Percent, 1 dp.) | 25 | 20s |
| 2 | A bet pays +$45 if it works and −$15 if it doesn't. What win probability makes it break even? (Percent, 1 dp.) | 25 | 26s |
| 3 | A trade makes $31 when it works and loses $33 when it doesn't. What is the break-even win probability? (Percent, 1 dp.) | 51.56 | 32s |
| 4 | A trade makes $51 when it works and loses $25 when it doesn't, and costs $3 in fees either way. What win probability breaks even? (Percent, 1 dp.) | 36.84 | 39s |
| 5 | A trade makes $112 when it works and loses $26 when it fails. 20% of the time it is scratched for $0. What win probability (as a share of all trades) breaks even? (Percent, 1 dp.) | 15.07 | 45s |

### Fair value (Interview numeracy)

| Level | Prompt | Answer | Target |
|---|---|---|---|
| 1 | A fair coin pays $32 on heads and $0 on tails. What is the fair value of this contract? (2 dp.) | 16 | 20s |
| 2 | A fair coin pays $17 on heads and $8 on tails. What is the fair value of this contract? (2 dp.) | 12.5 | 28s |
| 3 | A fair die is rolled; the contract pays 4 × (face value) + $9 in dollars. What is the fair value of this contract? (2 dp.) | 23 | 36s |
| 4 | You roll a fair die and may either keep the face value in dollars or reroll once and take the new face. What is the fair value of this contract? (2 dp.) | 4.25 | 45s |
| 5 | Two fair dice are rolled; you're paid $2 per pip on the higher die, minus $2 per pip on the lower. What is the fair value of this contract? (2 dp.) | 3.89 | 55s |

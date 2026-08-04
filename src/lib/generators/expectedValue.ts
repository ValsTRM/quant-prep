import { type Rng, randInt, choice, shuffle } from "../rng";
import type { GeneratedQuestion } from "../types";
import { formatAnswer } from "../grading";
import { clampDifficulty, makeQuestion, round2 } from "./base";

/* -------------------------------- discrete EV ------------------------------- */

/**
 * Outcome count and denominator friendliness both scale with level:
 * L1 two outcomes over halves/quarters · L2 three over /4 or /5 ·
 * L3 three over /6 or /10 with wider payoffs · L4 four over /10 or /12 ·
 * L5 five over /12 or /20 with dollars-and-cents payoffs.
 */
const SPLITS: Record<number, number[][]> = {
  1: [
    [1, 1],
    [1, 3],
    [3, 1],
  ],
  2: [
    [1, 1, 2],
    [1, 2, 2],
    [1, 1, 3],
  ],
  3: [
    [1, 2, 3],
    [2, 3, 5],
    [1, 3, 6],
    [3, 3, 4],
  ],
  4: [
    [1, 2, 3, 4],
    [1, 2, 2, 5],
    [2, 3, 3, 4],
    [1, 1, 4, 6],
  ],
  5: [
    [1, 2, 3, 4, 5],
    [2, 3, 4, 5, 6],
    [1, 3, 4, 5, 7],
    [2, 2, 3, 6, 7],
  ],
};

export function genDiscreteEV(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const parts = shuffle(rng, choice(rng, SPLITS[d]));
  const den = parts.reduce((a, b) => a + b, 0);

  // Payoffs widen with level; L5 uses dollars and cents.
  const payoffs = parts.map(() => {
    if (d === 1) return randInt(rng, -8, 16);
    if (d === 2) return randInt(rng, -15, 25);
    if (d === 3) return randInt(rng, -45, 70);
    if (d === 4) return randInt(rng, -60, 90);
    return round2(randInt(rng, -750, 950) / 10);
  });

  const evNumerator = parts.reduce((acc, p, i) => acc + p * payoffs[i], 0);
  const ev = round2(evNumerator / den);
  const lines = parts
    .map(
      (p, i) =>
        `${p}/${den} chance of ${payoffs[i] >= 0 ? "winning" : "losing"} $${formatAnswer(Math.abs(payoffs[i]))}`
    )
    .join(", ");

  return makeQuestion({
    topic: "expected-value",
    subtopic: "discrete-ev",
    difficulty: d,
    prompt: `A game pays: ${lines}. What is the expected value in dollars? (Negative if you expect to lose.)`,
    answer: formatAnswer(ev),
    answerValue: ev,
    gradingType: "numeric_tolerance",
    tolerance: 0.005,
    explanation: `EV = ${parts.map((p, i) => `(${p}/${den})(${formatAnswer(payoffs[i])})`).join(" + ")} = ${formatAnswer(round2(evNumerator))}/${den} = ${formatAnswer(ev)}. Work over the common denominator ${den} and divide once at the end.`,
  });
}

/* --------------------------- break-even probability ------------------------- */

/**
 * From the indicator-function payoff identity: a bet paying `win` on success and
 * `-loss` on failure has E = -loss + (win + loss)·p, so break-even is
 * p* = loss / (win + loss). "How often does this have to work?" is the question
 * behind every quoted price, and the app had no archetype for it.
 */
export function genBreakEvenProb(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);

  if (d <= 2) {
    // Numbers chosen so p* lands on a clean fraction.
    const loss = d === 1 ? choice(rng, [10, 20, 25]) : choice(rng, [12, 15, 30, 40]);
    const multiple = d === 1 ? choice(rng, [1, 3]) : choice(rng, [2, 3, 4]);
    const win = loss * multiple;
    const p = round2((loss / (win + loss)) * 100);
    return makeQuestion({
      topic: "expected-value",
      subtopic: "break-even-prob",
      difficulty: d,
      prompt: `A bet pays +$${win} if it works and −$${loss} if it doesn't. What win probability makes it break even? (Percent, 1 dp.)`,
      answer: formatAnswer(p),
      answerValue: p,
      gradingType: "numeric_tolerance",
      tolerance: 0.01,
      explanation: `Set EV to zero: p·${win} − (1−p)·${loss} = 0 ⇒ p = ${loss}/(${win} + ${loss}) = ${loss}/${win + loss} = ${formatAnswer(p)}%. The break-even probability is always loss ÷ (win + loss) — the payoff ratio, not the payoff size.`,
    });
  }

  if (d === 3) {
    const win = randInt(rng, 23, 89);
    const loss = randInt(rng, 13, 59);
    const p = round2((loss / (win + loss)) * 100);
    return makeQuestion({
      topic: "expected-value",
      subtopic: "break-even-prob",
      difficulty: d,
      prompt: `A trade makes $${win} when it works and loses $${loss} when it doesn't. What is the break-even win probability? (Percent, 1 dp.)`,
      answer: formatAnswer(p),
      answerValue: p,
      gradingType: "numeric_tolerance",
      tolerance: 0.01,
      explanation: `p* = loss/(win + loss) = ${loss}/${win + loss} = ${formatAnswer(p)}%. Anything above that is a positive-EV trade.`,
    });
  }

  if (d === 4) {
    // Same shape, plus a per-trade cost that shifts both legs.
    const win = randInt(rng, 30, 95);
    const loss = randInt(rng, 15, 65);
    const fee = choice(rng, [2, 3, 5]);
    const p = round2(((loss + fee) / (win + loss)) * 100);
    return makeQuestion({
      topic: "expected-value",
      subtopic: "break-even-prob",
      difficulty: d,
      prompt: `A trade makes $${win} when it works and loses $${loss} when it doesn't, and costs $${fee} in fees either way. What win probability breaks even? (Percent, 1 dp.)`,
      answer: formatAnswer(p),
      answerValue: p,
      gradingType: "numeric_tolerance",
      tolerance: 0.01,
      explanation: `The fee shifts both legs down: p(${win} − ${fee}) − (1−p)(${loss} + ${fee}) = 0 ⇒ p = ${loss + fee}/${win + loss} = ${formatAnswer(p)}%. The fee raises the bar by ${formatAnswer(round2(p - (loss / (win + loss)) * 100))} points versus the no-fee case.`,
    });
  }

  // L5 — three outcomes: a known middle case pins down the required win rate.
  const win = randInt(rng, 40, 120);
  const loss = randInt(rng, 20, 80);
  const pushPct = choice(rng, [10, 20, 25]);
  const push = pushPct / 100;
  // p·win = (1 − push − p)·loss  ⇒  p = (1 − push)·loss / (win + loss)
  const pPct = round2((((1 - push) * loss) / (win + loss)) * 100);
  return makeQuestion({
    topic: "expected-value",
    subtopic: "break-even-prob",
    difficulty: d,
    prompt: `A trade makes $${win} when it works and loses $${loss} when it fails. ${pushPct}% of the time it is scratched for $0. What win probability (as a share of all trades) breaks even? (Percent, 1 dp.)`,
    answer: formatAnswer(pPct),
    answerValue: pPct,
    gradingType: "numeric_tolerance",
    tolerance: 0.015,
    explanation: `Scratches contribute nothing, so the live share is ${formatAnswer(round2((1 - push) * 100))}%. Set p·${win} = (${formatAnswer(round2(1 - push))} − p)·${loss} ⇒ p = ${formatAnswer(round2(1 - push))}×${loss}/${win + loss} = ${formatAnswer(pPct)}% of all trades — i.e. ${formatAnswer(round2((pPct / ((1 - push) * 100)) * 100))}% of the ones that actually resolve.`,
  });
}

/* ------------------------------- recursive EV ------------------------------- */

interface RecursiveVariant {
  /** Levels this variant is allowed to appear at — no leaking down or up. */
  levels: number[];
  build(rng: Rng): { prompt: string; value: number; explanation: string };
}

const RECURSIVE_VARIANTS: RecursiveVariant[] = [
  {
    levels: [1, 2],
    build(rng) {
      const faces = choice(rng, [3, 4, 6, 8]);
      return {
        prompt: `You roll a fair ${faces}-sided die repeatedly. What is the expected number of rolls until you first see a specific face?`,
        value: faces,
        explanation: `E = 1 + (${faces - 1}/${faces})E, since with probability ${faces - 1}/${faces} you're exactly where you started. Solving gives E = ${faces}. First-success waiting time is always 1/p.`,
      };
    },
  },
  {
    levels: [2, 3],
    build(rng) {
      const denom = choice(rng, [3, 5, 6, 10]);
      return {
        prompt: `A biased coin lands heads with probability 1/${denom}. What is the expected number of flips to see the first heads?`,
        value: denom,
        explanation: `E = 1 + ((${denom - 1})/${denom})E ⇒ E/${denom} = 1 ⇒ E = ${denom}. Memorylessness is what lets you write the same E on both sides.`,
      };
    },
  },
  {
    levels: [3, 4],
    build(rng) {
      const n = choice(rng, [2, 3, 4, 5]);
      return {
        prompt: `You flip a fair coin repeatedly. What is the expected number of flips to accumulate ${n} heads in total (not necessarily consecutive)?`,
        value: 2 * n,
        explanation: `Each heads takes 1/p = 2 flips in expectation, and expectations add regardless of dependence: E = ${n} × 2 = ${2 * n}.`,
      };
    },
  },
  {
    // A bare 1/p wait — belongs with the other single-step waiting times, not
    // at the level where run-based recursion lives.
    levels: [2, 3],
    build(rng) {
      const faces = choice(rng, [6, 8, 10, 12]);
      const k = randInt(rng, 3, faces - 1);
      const ways = faces - k + 1;
      const value = parseFloat((faces / ways).toFixed(4));
      return {
        prompt: `You roll a fair ${faces}-sided die repeatedly. What is the expected number of rolls until you see a ${k} or higher? (2 decimal places.)`,
        value,
        explanation: `${ways} of the ${faces} faces succeed, so p = ${ways}/${faces} and the wait is 1/p = ${faces}/${ways} = ${value}.`,
      };
    },
  },
  {
    levels: [4, 5],
    build() {
      return {
        prompt: `You flip a fair coin repeatedly. What is the expected number of flips to get two heads in a row?`,
        value: 6,
        explanation: `Condition on how the run breaks: E = (1/2)(1 + E) + (1/4)(2 + E) + (1/4)(2) ⇒ E = 6. In general for HH with P(H) = p, E = (1 + p)/p².`,
      };
    },
  },
  {
    levels: [4, 5],
    build(rng) {
      const faces = choice(rng, [4, 6, 8]);
      return {
        prompt: `You roll a fair ${faces}-sided die repeatedly and stop when you roll the same face twice in a row. What is the expected number of rolls? (2 decimal places.)`,
        value: parseFloat((1 + faces).toFixed(2)),
        explanation: `After the first roll, each subsequent roll matches with probability 1/${faces}, so you wait ${faces} more rolls in expectation: E = 1 + ${faces} = ${1 + faces}.`,
      };
    },
  },
  {
    levels: [5],
    build() {
      return {
        prompt: `You flip a fair coin repeatedly. What is the expected number of flips to get three heads in a row?`,
        value: 14,
        explanation: `Build up: E₁ = 2, E₂ = 2E₁ + 2 = 6, E₃ = 2E₂ + 2 = 14. Each extra head in the run roughly doubles the wait and adds 2.`,
      };
    },
  },
  {
    levels: [5],
    build() {
      const value = round2(6 * (1 + 1 / 2 + 1 / 3 + 1 / 4 + 1 / 5 + 1 / 6));
      return {
        prompt: `You roll a fair six-sided die repeatedly. What is the expected number of rolls until you have seen every face at least once? (2 decimal places.)`,
        value,
        explanation: `Coupon collector: E = 6(1/6 + 1/5 + 1/4 + 1/3 + 1/2 + 1) = 6·H₆ = ${value}. Each new face is a geometric wait with a shrinking success probability.`,
      };
    },
  },
];

export function genRecursiveEV(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const eligible = RECURSIVE_VARIANTS.filter((v) => v.levels.includes(d));
  const variant = choice(rng, eligible.length ? eligible : RECURSIVE_VARIANTS);
  const { prompt, value, explanation } = variant.build(rng);
  return makeQuestion({
    topic: "expected-value",
    subtopic: "recursive-ev",
    difficulty: d,
    prompt,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: "numeric_tolerance",
    tolerance: 0.005,
    explanation,
  });
}

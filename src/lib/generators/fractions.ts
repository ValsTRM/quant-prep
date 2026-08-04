import { type Rng, choice } from "../rng";
import type { GeneratedQuestion } from "../types";
import { formatAnswer } from "../grading";
import { clampDifficulty, makeQuestion } from "./base";

export interface Fraction {
  num: number;
  den: number;
}

const f = (num: number, den: number): Fraction => ({ num, den });

/**
 * Fractions are drawn from explicit **already-reduced** pools, one per level.
 *
 * The old generator picked a denominator, then a numerator, then divided by the
 * gcd — so at "difficulty 4" it could pick 6/12 and hand you 1/2. That is exactly
 * what happened in the recorded diagnostic. Nothing here can reduce, because
 * nothing here is reducible.
 */
const FRACTION_POOLS: Record<number, Fraction[]> = {
  // Halves, quarters, fifths, tenths — the ones you should simply know.
  1: [
    f(1, 2),
    f(1, 4),
    f(3, 4),
    f(1, 5),
    f(2, 5),
    f(3, 5),
    f(4, 5),
    f(1, 10),
    f(3, 10),
    f(7, 10),
    f(9, 10),
  ],
  // Eighths, twentieths, twenty-fifths — one memorised step away.
  2: [
    f(1, 8),
    f(3, 8),
    f(5, 8),
    f(7, 8),
    f(1, 20),
    f(3, 20),
    f(7, 20),
    f(9, 20),
    f(11, 20),
    f(13, 20),
    f(17, 20),
    f(2, 25),
    f(4, 25),
    f(6, 25),
    f(9, 25),
    f(12, 25),
    f(21, 25),
  ],
  // Thirds, sixths, sixteenths, fortieths — repeating decimals start appearing.
  3: [
    f(1, 3),
    f(2, 3),
    f(1, 6),
    f(5, 6),
    f(1, 16),
    f(3, 16),
    f(5, 16),
    f(7, 16),
    f(9, 16),
    f(11, 16),
    f(13, 16),
    f(15, 16),
    f(3, 40),
    f(7, 40),
    f(9, 40),
    f(11, 40),
    f(13, 40),
    f(17, 40),
    f(21, 40),
    f(27, 40),
  ],
  // Sevenths, ninths, elevenths, twelfths — nothing clean, must be computed.
  4: [
    f(1, 7),
    f(2, 7),
    f(3, 7),
    f(4, 7),
    f(5, 7),
    f(6, 7),
    f(1, 9),
    f(2, 9),
    f(4, 9),
    f(5, 9),
    f(7, 9),
    f(8, 9),
    f(1, 11),
    f(3, 11),
    f(4, 11),
    f(6, 11),
    f(7, 11),
    f(9, 11),
    f(1, 12),
    f(5, 12),
    f(7, 12),
    f(11, 12),
  ],
  // Awkward primes, plus improper fractions.
  5: [
    f(1, 13),
    f(3, 13),
    f(5, 13),
    f(8, 13),
    f(2, 17),
    f(5, 17),
    f(7, 17),
    f(11, 17),
    f(3, 19),
    f(8, 19),
    f(13, 19),
    f(4, 23),
    f(9, 23),
    f(17, 23),
    f(7, 6),
    f(9, 7),
    f(13, 8),
    f(17, 12),
  ],
};

/** Denominators whose reciprocals terminate in decimal. */
const TERMINATING = new Set([2, 4, 5, 8, 10, 16, 20, 25, 32, 40, 50, 64, 125]);

export function pickFraction(difficulty: number, rng: Rng): Fraction {
  return choice(rng, FRACTION_POOLS[clampDifficulty(difficulty)]);
}

export function genFractionToDecimal(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const { num, den } = pickFraction(d, rng);
  const value = num / den;
  const terminating = TERMINATING.has(den);
  const rounded = parseFloat(value.toFixed(3));

  return makeQuestion({
    topic: "fractions",
    subtopic: "fraction-to-decimal",
    difficulty: d,
    prompt: `Convert ${num}/${den} to a decimal${terminating ? "" : " (3 decimal places)"}.`,
    answer: formatAnswer(terminating ? value : rounded),
    answerValue: terminating ? value : rounded,
    gradingType: terminating ? "exact" : "numeric_tolerance",
    tolerance: 0.002,
    explanation: terminating
      ? `${num}/${den} = ${formatAnswer(value)}. Know the anchors cold: 1/8 = 0.125, 1/16 = 0.0625, 1/20 = 0.05, 1/25 = 0.04, 1/40 = 0.025.`
      : `Anchor on 1/${den} ≈ ${parseFloat((1 / den).toFixed(4))} and scale by ${num}: ${num}/${den} ≈ ${rounded}.`,
  });
}

export function genFractionToPercent(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const { num, den } = pickFraction(d, rng);
  const value = (num / den) * 100;
  const terminating = TERMINATING.has(den);
  const rounded = parseFloat(value.toFixed(1));

  return makeQuestion({
    topic: "fractions",
    subtopic: "fraction-to-percent",
    difficulty: d,
    prompt: `Express ${num}/${den} as a percentage${terminating ? "" : " (1 decimal place)"}. Answer with the number only.`,
    answer: formatAnswer(terminating ? value : rounded),
    answerValue: terminating ? value : rounded,
    gradingType: terminating ? "exact" : "numeric_tolerance",
    tolerance: 0.005,
    explanation: terminating
      ? `${num}/${den} = ${formatAnswer(num / den)} = ${formatAnswer(value)}%.`
      : `1/${den} ≈ ${parseFloat(((1 / den) * 100).toFixed(2))}%, so ${num}/${den} ≈ ${rounded}%.`,
  });
}

/* -------------------------- representation compare -------------------------- */

/**
 * Two quantities in different notations; say which is bigger. The skill is
 * converting to a common form fast enough that the comparison is trivial. The
 * gap between them narrows with level, so guessing by eye stops working.
 */
export function genRepresentationCompare(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const { num, den } = pickFraction(d, rng);
  const exact = num / den;

  const gapPct = [0.18, 0.11, 0.06, 0.03, 0.015][d - 1];
  const gap = Math.max(0.004, exact * gapPct);
  const rivalRaw = exact + (rng() < 0.5 ? gap : -gap);

  // Present the rival as a decimal or a percentage, alternating format.
  const asPercent = rng() < 0.5;
  const places = d >= 4 ? 3 : 2;
  const rivalNumeric = asPercent
    ? parseFloat((rivalRaw * 100).toFixed(places - 1)) / 100
    : parseFloat(rivalRaw.toFixed(places + 1));
  const rivalText = asPercent
    ? `${formatAnswer(parseFloat((rivalNumeric * 100).toFixed(places - 1)))}%`
    : formatAnswer(rivalNumeric);

  const answer = exact > rivalNumeric ? "A" : "B";

  return makeQuestion({
    topic: "fractions",
    subtopic: "representation-compare",
    difficulty: d,
    prompt: `Which is larger?  A) ${num}/${den}   B) ${rivalText}   (answer A or B)`,
    answer,
    gradingType: "choice",
    choices: [`${num}/${den}`, rivalText],
    explanation: `${num}/${den} = ${parseFloat(exact.toFixed(5))} and ${rivalText} = ${parseFloat(rivalNumeric.toFixed(5))}, so ${answer === "A" ? `${num}/${den}` : rivalText} is larger. Convert the fraction once, then compare — don't try to eyeball two notations against each other.`,
  });
}

/** Exposed for tests: no pool entry may be reducible. */
export { FRACTION_POOLS };

import { type Rng, randInt, choice } from "../rng";
import type { GeneratedQuestion } from "../types";
import { formatAnswer } from "../grading";
import { clampDifficulty, makeQuestion, round2, sampleUntil } from "./base";

/** Percentages that are effectively memorised, banned above level 2. */
const FREEBIE_PERCENTS = [10, 20, 25, 50, 100];

/* -------------------------------- percent of -------------------------------- */

/**
 * L1 memorised percents of a round number · L2 the next tier (5/15/30/40/60/80) ·
 * L3 any multiple of 5 that isn't a freebie, of a 3-digit number ·
 * L4 awkward integers (37%, 62%) · L5 fractional percents of a 4-digit number.
 */
export function genPercentOf(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);

  const [pct, n] = sampleUntil(
    (): [number, number] => {
      if (d === 1) return [choice(rng, [10, 20, 25, 50, 75]), randInt(rng, 3, 20) * 10];
      if (d === 2) return [choice(rng, [5, 15, 30, 40, 60, 80]), randInt(rng, 4, 60) * 5];
      if (d === 3) return [randInt(rng, 3, 19) * 5, randInt(rng, 26, 199) * 4];
      if (d === 4) return [randInt(rng, 11, 89), randInt(rng, 47, 480)];
      return [round2(randInt(rng, 25, 975) / 10), randInt(rng, 130, 4800)];
    },
    ([p, x]) => {
      if (d <= 2) return true;
      if (FREEBIE_PERCENTS.includes(p)) return false;
      if (d >= 4 && p % 5 === 0) return false; // no round percents at L4/L5
      return x % 100 !== 0;
    }
  );

  const value = round2((pct / 100) * n);
  return makeQuestion({
    topic: "percentages",
    subtopic: "percent-of",
    difficulty: d,
    prompt: `What is ${formatAnswer(pct)}% of ${n}?`,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: d <= 2 ? "exact" : "numeric_tolerance",
    tolerance: 0.003,
    explanation: `10% of ${n} is ${formatAnswer(n / 10)} and 1% is ${formatAnswer(n / 100)}. Build ${formatAnswer(pct)}% from those blocks: ${formatAnswer(value)}.`,
  });
}

/* ----------------------------- reverse percent ------------------------------ */

/**
 * "After a −18% move it's 246 — what was it?" The trap is subtracting 18% of the
 * *new* number instead of dividing by 0.82, so the percentages get less round as
 * the level rises and the shortcut stops being available.
 */
export function genReversePercent(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const up = rng() < 0.5;

  const pct = sampleUntil(
    () => {
      if (d === 1) return choice(rng, [10, 20, 25, 50]);
      if (d === 2) return choice(rng, [5, 15, 20, 30, 40]);
      if (d === 3) return randInt(rng, 3, 19) * 5;
      if (d === 4) return randInt(rng, 6, 68);
      return round2(randInt(rng, 35, 725) / 10);
    },
    (p) => (d <= 2 ? true : !FREEBIE_PERCENTS.includes(p) && (d < 4 || p % 5 !== 0))
  );

  const original =
    d === 1
      ? randInt(rng, 4, 40) * 10
      : d === 2
        ? randInt(rng, 12, 90) * 5
        : d === 3
          ? randInt(rng, 15, 250) * 2
          : randInt(rng, 47, 999);

  const factor = up ? 1 + pct / 100 : 1 - pct / 100;
  const shown = round2(original * factor);

  return makeQuestion({
    topic: "percentages",
    subtopic: "reverse-percent",
    difficulty: d,
    prompt: `After ${up ? "increasing" : "decreasing"} by ${formatAnswer(pct)}%, a quantity is ${formatAnswer(shown)}. What was it originally?`,
    answer: String(original),
    answerValue: original,
    gradingType: "numeric_tolerance",
    tolerance: 0.004,
    explanation: `${up ? "Increasing" : "Decreasing"} by ${formatAnswer(pct)}% multiplies by ${formatAnswer(factor)}, so reverse it by dividing: ${formatAnswer(shown)} ÷ ${formatAnswer(factor)} = ${original}. ${up ? "Subtracting" : "Adding"} ${formatAnswer(pct)}% of the new value is the classic wrong answer — it gives ${formatAnswer(round2(up ? shown * (1 - pct / 100) : shown * (1 + pct / 100)))}.`,
  });
}

/* ---------------------------- sequential percent ---------------------------- */

/** L1–L2 two moves · L3–L4 three · L5 four, with awkward magnitudes from L4. */
export function genSequentialPercent(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const steps = d <= 2 ? 2 : d <= 4 ? 3 : 4;
  const pool =
    d === 1
      ? [10, 20, 25, 50]
      : d === 2
        ? [10, 15, 20, 25, 30]
        : d === 3
          ? [5, 10, 15, 20, 25, 30, 40]
          : [8, 12, 18, 22, 35, 45, 60];

  const changes = Array.from({ length: steps }, () => {
    const magnitude = choice(rng, pool);
    return rng() < 0.5 ? magnitude : -magnitude;
  });

  const factor = changes.reduce((acc, c) => acc * (1 + c / 100), 1);
  const net = round2((factor - 1) * 100);
  const desc = changes.map((c) => `${c > 0 ? "up" : "down"} ${Math.abs(c)}%`).join(", then ");

  return makeQuestion({
    topic: "percentages",
    subtopic: "sequential-percent",
    difficulty: d,
    prompt: `A price moves ${desc}. What is the net percentage change? (Signed number, e.g. -2.5)`,
    answer: formatAnswer(net),
    answerValue: net,
    gradingType: "numeric_tolerance",
    tolerance: 0.01,
    explanation: `Multiply the factors: ${changes.map((c) => formatAnswer(1 + c / 100)).join(" × ")} = ${formatAnswer(round2(factor))}, i.e. ${net > 0 ? "+" : ""}${formatAnswer(net)}%. Percentage changes compound; adding them gives ${changes.reduce((s, c) => s + c, 0)}%, which is wrong by ${formatAnswer(round2(Math.abs(net - changes.reduce((s, c) => s + c, 0))))} points.`,
  });
}

/* ----------------------------- percentage chain ----------------------------- */

/**
 * Interview-mode version of the same skill: the moves land on a stated price and
 * you have to carry the dollars, or say what move undoes the chain.
 */
export function genPercentageChain(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const steps = d <= 2 ? 2 : d === 3 ? 3 : d === 4 ? 3 : 4;
  const pool =
    d <= 2 ? [10, 20, 25, 50] : d === 3 ? [10, 15, 20, 25, 30] : [8, 12, 18, 24, 35, 45];

  const start = d <= 2 ? randInt(rng, 4, 40) * 5 : randInt(rng, 24, 400);
  const changes = Array.from({ length: steps }, () => {
    const magnitude = choice(rng, pool);
    return rng() < 0.5 ? magnitude : -magnitude;
  });
  const factor = changes.reduce((acc, c) => acc * (1 + c / 100), 1);
  const desc = changes.map((c) => `${c > 0 ? "rises" : "falls"} ${Math.abs(c)}%`).join(", then ");

  // Above L3, half the time ask for the move that undoes the chain instead.
  const askRoundTrip = d >= 3 && rng() < 0.5;
  if (askRoundTrip) {
    const needed = round2((1 / factor - 1) * 100);
    return makeQuestion({
      topic: "percentages",
      subtopic: "percentage-chain",
      difficulty: d,
      prompt: `A stock starts at $${start}. It ${desc}. What single percentage move would take it back to $${start}? (Signed number, 2 dp)`,
      answer: formatAnswer(needed),
      answerValue: needed,
      gradingType: "numeric_tolerance",
      tolerance: 0.01,
      explanation: `The chain multiplies by ${formatAnswer(round2(factor))}, landing at $${formatAnswer(round2(start * factor))}. To undo it you need a factor of 1 ÷ ${formatAnswer(round2(factor))} = ${formatAnswer(round2(1 / factor))}, i.e. ${needed > 0 ? "+" : ""}${formatAnswer(needed)}%. A −x% move always needs more than +x% to recover.`,
    });
  }

  const end = round2(start * factor);
  return makeQuestion({
    topic: "percentages",
    subtopic: "percentage-chain",
    difficulty: d,
    prompt: `A stock starts at $${start}. It ${desc}. What is the final price? (2 dp)`,
    answer: formatAnswer(end),
    answerValue: end,
    gradingType: "numeric_tolerance",
    tolerance: 0.005,
    explanation: `Carry the price through each factor: ${changes
      .map((c) => formatAnswer(1 + c / 100))
      .join(" × ")} = ${formatAnswer(round2(factor))}, so $${start} → $${formatAnswer(end)}. Net move is ${formatAnswer(round2((factor - 1) * 100))}%.`,
  });
}

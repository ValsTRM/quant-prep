import { type Rng, choice } from "../rng";
import type { GeneratedQuestion } from "../types";
import { formatAnswer } from "../grading";
import { clampDifficulty, makeQuestion, round2 } from "./base";

interface FermiTemplate {
  /** Levels this prompt may appear at — the old generator ignored difficulty. */
  levels: number[];
  build(rng: Rng): { prompt: string; reference: number; reasoning: string };
}

const sig3 = (x: number) => parseFloat(x.toPrecision(3));

/**
 * Fermi prompts with a computable reference built from stated assumptions.
 * Self-graded within a factor of 2 — but the decomposition has to be written
 * down, and blank answers can no longer be marked correct.
 */
const FERMI_TEMPLATES: FermiTemplate[] = [
  {
    levels: [1],
    build(rng) {
      const hours = choice(rng, [1, 8, 24]);
      return {
        prompt: `Estimate the number of seconds in ${hours} hour${hours > 1 ? "s" : ""}, then sanity-check the order of magnitude.`,
        reference: sig3(hours * 3600),
        reasoning: `3600 s/hour × ${hours} = ${(hours * 3600).toLocaleString()}. Anchor: a day is 86,400 s ≈ 10⁵.`,
      };
    },
  },
  {
    levels: [1, 2],
    build(rng) {
      const miles = choice(rng, [1, 5, 26]);
      const ref = sig3((miles * 5280) / 2.5);
      return {
        prompt: `Estimate the number of walking steps in ${miles === 26 ? "a marathon (26 miles)" : `${miles} mile${miles > 1 ? "s" : ""}`}.`,
        reference: ref,
        reasoning: `A stride is ~2.5 ft; ${miles} mi × 5280 ft ÷ 2.5 ft ≈ ${ref.toLocaleString()}.`,
      };
    },
  },
  {
    levels: [1, 2],
    build(rng) {
      const liters = choice(rng, [2, 2.5]);
      const ref = sig3(liters * 365);
      return {
        prompt: `Estimate how many litres of water a person drinks in a year.`,
        reference: ref,
        reasoning: `~${liters} L/day × 365 ≈ ${ref.toLocaleString()} L.`,
      };
    },
  },
  {
    levels: [2, 3],
    build(rng) {
      const years = choice(rng, [1, 5, 10]);
      const ref = sig3(16 * 60 * 24 * 365 * years);
      return {
        prompt: `Estimate the number of breaths a person takes in ${years === 1 ? "a year" : `${years} years`}.`,
        reference: ref,
        reasoning: `~16 breaths/min × 60 × 24 ≈ 23,000/day; × 365 ≈ 8.4M/year${years > 1 ? `; × ${years} ≈ ${ref.toExponential(1)}` : ""}.`,
      };
    },
  },
  {
    levels: [2, 3],
    build(rng) {
      const years = choice(rng, [1, 80]);
      const ref = sig3(70 * 60 * 24 * 365 * years);
      return {
        prompt:
          years === 1
            ? `Estimate the number of heartbeats in a year.`
            : `Estimate the number of heartbeats in an 80-year lifetime.`,
        reference: ref,
        reasoning: `~70 beats/min × 60 × 24 × 365 ≈ 37M/year${years > 1 ? `; × 80 ≈ 3×10⁹` : ""}.`,
      };
    },
  },
  {
    levels: [3, 4],
    build(rng) {
      const floors = choice(rng, [10, 50, 100]);
      const ref = sig3((floors * 12 * 12) / 0.004 / 500);
      return {
        prompt: `Estimate how many reams of paper (500 sheets each) you'd need to stack to the height of a ${floors}-story building.`,
        reference: ref,
        reasoning: `A floor is ~12 ft = 144 in; a sheet ~0.004 in, so a ream is ~2 in. ${floors} floors ≈ ${floors * 144} in ÷ 2 ≈ ${ref.toLocaleString()} reams.`,
      };
    },
  },
  {
    levels: [3, 4],
    build(rng) {
      const people = choice(rng, [100_000, 1_000_000, 8_000_000]);
      const ref = sig3((people * 0.3) / 7);
      return {
        prompt: `Estimate how many pizzas are eaten per day in a city of ${people.toLocaleString()} people.`,
        reference: ref,
        reasoning: `Assume ~0.3 pizzas per person per week: ${people.toLocaleString()} × 0.3 ÷ 7 ≈ ${ref.toLocaleString()}/day.`,
      };
    },
  },
  {
    levels: [4, 5],
    build(rng) {
      // Market sizing — the shape flagged as an interview question in the
      // Street-Fighting Mathematics problem sets. Original quantity, original numbers.
      const item = choice(rng, [
        { name: "disposable razor blades", perPersonYear: 20, price: 2, share: 0.5 },
        { name: "toothbrushes", perPersonYear: 3, price: 4, share: 0.9 },
        { name: "car tyres", perPersonYear: 0.7, price: 120, share: 0.75 },
      ]);
      const pop = 330_000_000;
      const ref = sig3(pop * item.share * item.perPersonYear * item.price);
      return {
        prompt: `Estimate the annual US market for ${item.name}, in dollars.`,
        reference: ref,
        reasoning: `~330M people × ${item.share} who use them × ${item.perPersonYear}/year × $${item.price} ≈ $${ref.toExponential(1)}. State each factor before multiplying — that's what's being graded.`,
      };
    },
  },
  {
    levels: [3, 4],
    build(rng) {
      const n = choice(rng, [17, 19, 23, 31, 43]);
      const ref = sig3(n ** 3);
      const base = Math.round(n / 10) * 10;
      return {
        prompt: `Estimate ${n}³ without computing it exactly.`,
        reference: ref,
        reasoning: `${base}³ = ${(base ** 3).toLocaleString()}; scale by (${n}/${base})³ ≈ ${round2((n / base) ** 3)}. Exact: ${(n ** 3).toLocaleString()}.`,
      };
    },
  },
  {
    levels: [5],
    build(rng) {
      const notional = choice(rng, [50, 200, 500]);
      const ref = sig3(notional * 1_000_000 * 0.0002 * 250);
      return {
        prompt: `A desk trades $${notional}M of notional per day and captures roughly 2 basis points of edge. Estimate its annual revenue in dollars.`,
        reference: ref,
        reasoning: `2 bp = 0.0002. $${notional}M × 0.0002 = $${(notional * 1_000_000 * 0.0002).toLocaleString()}/day × ~250 trading days ≈ $${ref.toExponential(1)}.`,
      };
    },
  },
];

export function genFermiEstimation(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const eligible = FERMI_TEMPLATES.filter((t) => t.levels.includes(d));
  const template = choice(rng, eligible.length ? eligible : FERMI_TEMPLATES);
  const { prompt, reference, reasoning } = template.build(rng);
  return makeQuestion({
    topic: "estimation",
    subtopic: "fermi",
    difficulty: d,
    prompt: `${prompt} Write down your estimate and the chain you used — a bare number does not count.`,
    answer: reference.toLocaleString(),
    answerValue: reference,
    gradingType: "self_grade",
    explanation: `${reasoning} Mark yourself correct only if you were within a factor of 2 AND wrote the decomposition down.`,
  });
}

/* ---------------------------- estimation sanity ----------------------------- */

/**
 * Order-of-magnitude checking, graded numerically. The Jane Street notes make
 * the point that numeracy matters as much for *deciding if an answer is
 * reasonable* as for producing it; this archetype only tests that.
 */
export function genEstimationSanity(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);

  if (d <= 2) {
    const perDay = choice(rng, [3, 5, 8]);
    const price = choice(rng, [2, 4, 5]);
    const value = round2((perDay * price * 365) / 1000);
    return makeQuestion({
      topic: "estimation",
      subtopic: "estimation-sanity",
      difficulty: d,
      prompt: `A shop sells ${perDay} units a day at $${price} each. Someone claims annual revenue is about $${(value * 10).toFixed(0)}k. What is the correct figure, in thousands of dollars? (1 dp.)`,
      answer: formatAnswer(value),
      answerValue: value,
      gradingType: "numeric_tolerance",
      tolerance: 0.05,
      explanation: `${perDay} × $${price} = $${perDay * price}/day × 365 ≈ $${(perDay * price * 365).toLocaleString()} = ${formatAnswer(value)}k. The claim is off by a factor of 10 — an order-of-magnitude slip, the most common kind.`,
    });
  }

  if (d === 3) {
    const trades = choice(rng, [200, 400, 800]);
    const perTrade = choice(rng, [1.5, 2, 3]);
    const days = 250;
    const value = round2((trades * perTrade * days) / 1_000_000);
    return makeQuestion({
      topic: "estimation",
      subtopic: "estimation-sanity",
      difficulty: d,
      prompt: `A strategy makes $${perTrade} per trade on ${trades} trades a day, ${days} days a year. What is the annual P&L, in millions of dollars? (2 dp.)`,
      answer: formatAnswer(value),
      answerValue: value,
      gradingType: "numeric_tolerance",
      tolerance: 0.03,
      explanation: `${trades} × $${perTrade} = $${trades * perTrade}/day; × ${days} = $${(trades * perTrade * days).toLocaleString()} ≈ $${formatAnswer(value)}M. Get the daily number first, then scale — going straight to the annual figure is where the zeros get lost.`,
    });
  }

  if (d === 4) {
    const notional = choice(rng, [20, 75, 150]);
    const bps = choice(rng, [1, 2.5, 4]);
    const value = round2(notional * 1_000_000 * (bps / 10_000) * 250);
    return makeQuestion({
      topic: "estimation",
      subtopic: "estimation-sanity",
      difficulty: d,
      prompt: `A desk trades $${notional}M notional per day and captures ${formatAnswer(bps)} basis ${bps === 1 ? "point" : "points"}. What is the annual revenue in dollars, assuming 250 trading days? (Within 5%.)`,
      answer: formatAnswer(value),
      answerValue: value,
      gradingType: "numeric_tolerance",
      tolerance: 0.05,
      explanation: `${formatAnswer(bps)} bp = ${formatAnswer(bps / 10_000)}. $${notional}M × that = $${(notional * 1_000_000 * (bps / 10_000)).toLocaleString()}/day; × 250 ≈ $${value.toLocaleString()}. A basis point is 1/100 of 1% — get that wrong and you're out by 100×.`,
    });
  }

  // L5 — decompose a claim and find the implied per-unit figure.
  const users = choice(rng, [2, 5, 20]);
  const revenue = choice(rng, [400, 900, 1500]);
  const perUserMonth = round2((revenue * 1_000_000) / (users * 1_000_000) / 12);
  return makeQuestion({
    topic: "estimation",
    subtopic: "estimation-sanity",
    difficulty: d,
    prompt: `A company reports $${revenue}M of annual revenue from ${users} million users. What is the implied revenue per user per month, in dollars? (2 dp.)`,
    answer: formatAnswer(perUserMonth),
    answerValue: perUserMonth,
    gradingType: "numeric_tolerance",
    tolerance: 0.03,
    explanation: `$${revenue}M ÷ ${users}M users = $${formatAnswer(round2(revenue / users))} per user per year, ÷ 12 ≈ $${formatAnswer(perUserMonth)}/month. Reducing a headline number to a per-unit figure is the fastest plausibility test there is.`,
  });
}

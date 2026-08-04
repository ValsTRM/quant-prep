import { type Rng, randInt, choice } from "../rng";
import type { GeneratedQuestion } from "../types";
import { formatAnswer } from "../grading";
import { clampDifficulty, makeQuestion, round2 } from "./base";

interface Contract {
  description: string;
  fair: number;
  working: string;
}

/* ------------------------------ fair-value pool ----------------------------- */

/** E[max of n fair dice] = Σ k·((k/6)^n − ((k−1)/6)^n). */
function expectedMaxOfDice(n: number): number {
  let ev = 0;
  for (let k = 1; k <= 6; k++) ev += k * (k ** n - (k - 1) ** n);
  return ev / 6 ** n;
}

/** E[min of n fair dice] = Σ k·(((7−k)/6)^n − ((6−k)/6)^n). */
function expectedMinOfDice(n: number): number {
  let ev = 0;
  for (let k = 1; k <= 6; k++) ev += k * ((7 - k) ** n - (6 - k) ** n);
  return ev / 6 ** n;
}

type ContractBuilder = (rng: Rng) => Contract;

const CONTRACTS: Record<number, ContractBuilder[]> = {
  1: [
    () => ({
      description: `A fair six-sided die is rolled once and you're paid the face value in dollars.`,
      fair: 3.5,
      working: `EV = (1 + 2 + … + 6)/6 = 21/6 = 3.5, or just the midpoint of a symmetric distribution.`,
    }),
    (rng) => {
      const heads = randInt(rng, 4, 20) * 2;
      return {
        description: `A fair coin pays $${heads} on heads and $0 on tails.`,
        fair: heads / 2,
        working: `EV = ½ × ${heads} = ${formatAnswer(heads / 2)}.`,
      };
    },
  ],
  2: [
    (rng) => {
      const h = randInt(rng, 5, 25);
      const t = randInt(rng, 1, 9);
      return {
        description: `A fair coin pays $${h} on heads and $${t} on tails.`,
        fair: round2((h + t) / 2),
        working: `EV = (${h} + ${t})/2 = ${formatAnswer(round2((h + t) / 2))}.`,
      };
    },
    () => ({
      description: `A card is drawn from a standard deck; you're paid its rank in dollars (A = 1, J = 11, Q = 12, K = 13).`,
      fair: 7,
      working: `Ranks 1..13 are equally likely: EV = (1 + 13)/2 = 7.`,
    }),
  ],
  3: [
    (rng) => {
      const a = randInt(rng, 2, 6);
      const b = randInt(rng, -5, 10);
      return {
        description: `A fair die is rolled; the contract pays ${a} × (face value)${b === 0 ? "" : b > 0 ? ` + $${b}` : ` − $${-b}`} in dollars.`,
        fair: round2(a * 3.5 + b),
        working: `EV is linear: ${a} × 3.5${b === 0 ? "" : b > 0 ? ` + ${b}` : ` − ${-b}`} = ${formatAnswer(round2(a * 3.5 + b))}. No independence needed.`,
      };
    },
    () => ({
      description: `Two fair dice are rolled and you're paid the sum in dollars.`,
      fair: 7,
      working: `Linearity again: EV(sum) = 3.5 + 3.5 = 7.`,
    }),
  ],
  4: [
    () => ({
      description: `Two fair dice are rolled and you're paid the larger of the two faces in dollars.`,
      fair: round2(expectedMaxOfDice(2)),
      working: `P(max = k) = (2k − 1)/36, so EV = Σ k(2k − 1)/36 = 161/36 ≈ ${formatAnswer(round2(expectedMaxOfDice(2)))}.`,
    }),
    () => ({
      description: `You roll a fair die and may either keep the face value in dollars or reroll once and take the new face.`,
      fair: 4.25,
      working: `A reroll is worth 3.5, so keep 4, 5 or 6 and reroll 1, 2, 3. EV = ½ × 3.5 + (4 + 5 + 6)/6 = 1.75 + 2.5 = 4.25.`,
    }),
    (rng) => {
      const n = choice(rng, [2, 3, 4]);
      const payoff = randInt(rng, 2, 12) * 5;
      return {
        description: `${n} fair dice are rolled and you're paid $${payoff} if any six appears, $0 otherwise.`,
        fair: round2(payoff * (1 - (5 / 6) ** n)),
        working: `P(at least one six) = 1 − (5/6)^${n} = ${formatAnswer(round2(1 - (5 / 6) ** n))}, so EV = ${payoff} × that = ${formatAnswer(round2(payoff * (1 - (5 / 6) ** n)))}.`,
      };
    },
    (rng) => {
      const n = choice(rng, [2, 3]);
      return {
        description: `${n} fair dice are rolled and you're paid the smaller of the faces in dollars.`,
        fair: round2(expectedMinOfDice(n)),
        working: `By symmetry, E[min of ${n}] = 7 − E[max of ${n}] = 7 − ${formatAnswer(round2(expectedMaxOfDice(n)))} = ${formatAnswer(round2(expectedMinOfDice(n)))}.`,
      };
    },
    (rng) => {
      const threshold = randInt(rng, 3, 5);
      const payoff = randInt(rng, 3, 15) * 2;
      const p = (7 - threshold) / 6;
      return {
        description: `A fair die is rolled; you're paid $${payoff} if it shows ${threshold} or more, and nothing otherwise.`,
        fair: round2(payoff * p),
        working: `P(roll ≥ ${threshold}) = ${7 - threshold}/6 = ${formatAnswer(round2(p))}, so EV = ${payoff} × ${formatAnswer(round2(p))} = ${formatAnswer(round2(payoff * p))}.`,
      };
    },
  ],
  5: [
    () => ({
      description: `Three fair dice are rolled and you're paid the largest face in dollars.`,
      fair: round2(expectedMaxOfDice(3)),
      working: `P(max ≤ k) = (k/6)³, so EV = Σ k[(k/6)³ − ((k−1)/6)³] = ${formatAnswer(round2(expectedMaxOfDice(3)))}. The max drifts toward 6 fast.`,
    }),
    () => ({
      description: `You roll a fair die and may reroll up to twice, taking whatever face you stop on.`,
      fair: round2(14 / 3),
      working: `With one reroll left the game is worth 4.25, so on the first roll keep 5 or 6 and reroll otherwise: EV = (2/3)(4.25) + (5 + 6)/6 = ${formatAnswer(round2(14 / 3))}.`,
    }),
    (rng) => {
      const cap = choice(rng, [2, 3, 4, 5]);
      let ev = 0;
      for (let k = 1; k <= 6; k++) ev += Math.min(k, cap) / 6;
      return {
        description: `A fair die is rolled and you're paid the face value in dollars, capped at $${cap}.`,
        fair: round2(ev),
        working: `Payoffs are ${[1, 2, 3, 4, 5, 6].map((k) => Math.min(k, cap)).join(", ")}, so EV = ${formatAnswer(round2(ev))}. Caps pull the mean below 3.5.`,
      };
    },
    (rng) => {
      const strike = randInt(rng, 2, 5);
      let ev = 0;
      for (let k = 1; k <= 6; k++) ev += Math.max(0, k - strike) / 6;
      return {
        description: `A fair die is rolled and you're paid $(face − ${strike}) in dollars, but never less than $0.`,
        fair: round2(ev),
        working: `Only faces above ${strike} pay: ${[1, 2, 3, 4, 5, 6]
          .filter((k) => k > strike)
          .map((k) => k - strike)
          .join(" + ")} over 6 = ${formatAnswer(round2(ev))}. This is a call option on a die.`,
      };
    },
    (rng) => {
      const n = choice(rng, [2, 3]);
      const payoff = randInt(rng, 4, 20) * 5;
      const p = 1 - (5 / 6) ** n - n * (1 / 6) * (5 / 6) ** (n - 1);
      return {
        description: `${n} fair dice are rolled; you're paid $${payoff} only if two or more sixes appear.`,
        fair: round2(payoff * p),
        working: `P(≥2 sixes with ${n} dice) = 1 − P(0) − P(1) = ${formatAnswer(round2(p))}, so EV = ${payoff} × ${formatAnswer(round2(p))} = ${formatAnswer(round2(payoff * p))}.`,
      };
    },
    (rng) => {
      const a = randInt(rng, 2, 5);
      return {
        description: `Two fair dice are rolled; you're paid $${a} per pip on the higher die, minus $${a} per pip on the lower.`,
        fair: round2(a * (expectedMaxOfDice(2) - expectedMinOfDice(2))),
        working: `E[max] = ${formatAnswer(round2(expectedMaxOfDice(2)))}, E[min] = ${formatAnswer(round2(expectedMinOfDice(2)))}, so the spread is ${formatAnswer(round2(expectedMaxOfDice(2) - expectedMinOfDice(2)))} and EV = ${a} × that = ${formatAnswer(round2(a * (expectedMaxOfDice(2) - expectedMinOfDice(2))))}.`,
      };
    },
  ],
};

function pickContract(difficulty: number, rng: Rng): Contract {
  const d = clampDifficulty(difficulty);
  return choice(rng, CONTRACTS[d])(rng);
}

/* -------------------------------- fair value -------------------------------- */

export function genMarketMakingFairValue(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const { description, fair, working } = pickContract(d, rng);
  const width = d <= 2 ? 1 : 0.5;

  return makeQuestion({
    topic: "market-making",
    subtopic: "fair-value",
    difficulty: d,
    prompt: `${description} What is the fair value of this contract? (2 dp.)`,
    answer: formatAnswer(fair),
    answerValue: fair,
    gradingType: "numeric_tolerance",
    tolerance: 0.005,
    explanation: `${working} As a market maker you'd quote around it — say ${formatAnswer(round2(fair - width / 2))} bid at ${formatAnswer(round2(fair + width / 2))} — buying below fair, selling above, and widening when variance or adverse selection is higher.`,
  });
}

/* ------------------------------- market quote ------------------------------- */

/**
 * Fair value plus an actual quote: the thing the Jane Street notes ask for and
 * the app never did. You price the contract, then answer for one side of a
 * two-sided market, or for the edge a fill would earn you.
 */
export function genMarketQuote(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const { description, fair, working } = pickContract(Math.max(3, d), rng);
  const width = choice(rng, d >= 5 ? [0.5, 0.8, 1.2] : [0.5, 1, 2]);
  const variant = d >= 5 ? choice(rng, ["side", "edge", "skew"]) : choice(rng, ["side", "edge"]);

  if (variant === "side") {
    const wantBid = rng() < 0.5;
    const value = round2(fair + (wantBid ? -width / 2 : width / 2));
    return makeQuestion({
      topic: "market-making",
      subtopic: "market-quote",
      difficulty: d,
      prompt: `${description} You must quote a two-sided market $${formatAnswer(width)} wide, centred on fair value. What is your ${wantBid ? "bid" : "offer"}? (2 dp.)`,
      answer: formatAnswer(value),
      answerValue: value,
      gradingType: "numeric_tolerance",
      tolerance: 0.005,
      explanation: `${working} Fair value is ${formatAnswer(fair)}; a ${formatAnswer(width)}-wide market centred there is ${formatAnswer(round2(fair - width / 2))} bid at ${formatAnswer(round2(fair + width / 2))}, so your ${wantBid ? "bid" : "offer"} is ${formatAnswer(value)}.`,
    });
  }

  if (variant === "edge") {
    const size = randInt(rng, 5, 50);
    const edge = round2((width / 2) * size);
    return makeQuestion({
      topic: "market-making",
      subtopic: "market-quote",
      difficulty: d,
      prompt: `${description} You quote it $${formatAnswer(width)} wide around fair value and get lifted on ${size} contracts. Ignoring adverse selection, what is your expected profit in dollars? (2 dp.)`,
      answer: formatAnswer(edge),
      answerValue: edge,
      gradingType: "numeric_tolerance",
      tolerance: 0.005,
      explanation: `${working} Fair value is ${formatAnswer(fair)}, so your offer sits ${formatAnswer(width / 2)} above it. Selling ${size} at ${formatAnswer(round2(fair + width / 2))} earns ${formatAnswer(width / 2)} × ${size} = $${formatAnswer(edge)} of theoretical edge. Whether you keep it depends on who lifted you.`,
    });
  }

  // skew — shade the market when you're already positioned
  const skew = round2(width / 4);
  const value = round2(fair - width / 2 - skew);
  const size = randInt(rng, 10, 40);
  return makeQuestion({
    topic: "market-making",
    subtopic: "market-quote",
    difficulty: d,
    prompt: `${description} You are already long ${size} of these and want to discourage buying more, so you shift a $${formatAnswer(width)}-wide market down by $${formatAnswer(skew)}. What is your new bid? (2 dp.)`,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: "numeric_tolerance",
    tolerance: 0.005,
    explanation: `${working} Fair value ${formatAnswer(fair)} → centred market ${formatAnswer(round2(fair - width / 2))} / ${formatAnswer(round2(fair + width / 2))}. Skewing down $${formatAnswer(skew)} puts the bid at ${formatAnswer(value)}: you still show a market, but you're paying less to add to a position you already have.`,
  });
}

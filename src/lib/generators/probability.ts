import { type Rng, randInt, choice } from "../rng";
import type { GeneratedQuestion, Topic } from "../types";
import { formatAnswer } from "../grading";
import { clampDifficulty, makeQuestion, round2 } from "./base";

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function probQuestion(
  topic: Topic,
  subtopic: string,
  difficulty: number,
  prompt: string,
  num: number,
  den: number,
  how: string
): GeneratedQuestion {
  const g = gcd(num, den) || 1;
  const value = parseFloat((num / den).toFixed(4));
  return makeQuestion({
    topic,
    subtopic,
    difficulty,
    prompt: `${prompt} (Answer as a fraction like 5/36 or a decimal.)`,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: "numeric_tolerance",
    tolerance: 0.01,
    explanation: `${how} Probability = ${num / g}/${den / g} ≈ ${formatAnswer(value)}.`,
  });
}

/** Ways two fair dice sum to s. */
function waysToSum(s: number): number {
  return s < 2 || s > 12 ? 0 : 6 - Math.abs(s - 7);
}

/* ----------------------------------- dice ----------------------------------- */

/**
 * Variant pools are **disjoint by level**. The old pools overlapped, so a
 * one-die "P(roll ≥ 3)" could be served at difficulty 3 — it appeared twice in
 * the recorded diagnostic, once at level 1 and once at level 3.
 */
const DICE_VARIANTS: Record<number, string[]> = {
  1: ["single-exact", "single-at-least"],
  2: ["same-face", "sum-two"],
  3: ["sum-two", "at-least-one-six", "sum-range"],
  4: ["max-of-two", "at-least-one-six", "sum-range"],
  5: ["max-of-three", "sum-three", "conditional-sum"],
};

export function genDiceProbability(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const variant = choice(rng, DICE_VARIANTS[d]);
  const q = (prompt: string, num: number, den: number, how: string) =>
    probQuestion("probability", "dice", d, prompt, num, den, how);

  switch (variant) {
    case "single-exact": {
      const k = randInt(rng, 1, 6);
      return q(`You roll one fair die. What is P(roll = ${k})?`, 1, 6, `One face out of six.`);
    }
    case "single-at-least": {
      const k = randInt(rng, 2, 5);
      return q(
        `You roll one fair die. What is P(roll ≥ ${k})?`,
        7 - k,
        6,
        `Faces ${k} through 6 count: ${7 - k} of 6 equally likely faces.`
      );
    }
    case "same-face":
      return q(
        `You roll two fair dice. What is P(both show the same face)?`,
        6,
        36,
        `Whatever the first shows, the second matches with probability 1/6.`
      );
    case "sum-two": {
      const s = randInt(rng, 4, 11);
      return q(
        `You roll two fair dice. What is P(sum = ${s})?`,
        waysToSum(s),
        36,
        `Count ordered pairs summing to ${s}: ${waysToSum(s)} of the 36 equally likely outcomes.`
      );
    }
    case "sum-range": {
      const s = randInt(rng, 8, 11);
      let ways = 0;
      for (let k = s; k <= 12; k++) ways += waysToSum(k);
      return q(
        `You roll two fair dice. What is P(sum ≥ ${s})?`,
        ways,
        36,
        `Add the counts for sums ${s}..12: ${ways} of 36. Working from the short tail is fewer terms than the complement here.`
      );
    }
    case "at-least-one-six": {
      const n = randInt(rng, 2, 4);
      return q(
        `You roll ${n} fair dice. What is P(at least one six)?`,
        6 ** n - 5 ** n,
        6 ** n,
        `Complement: P(no six) = (5/6)^${n} = ${5 ** n}/${6 ** n}, so P(at least one) = 1 − that.`
      );
    }
    case "max-of-two": {
      const k = randInt(rng, 3, 6);
      return q(
        `You roll two fair dice. What is P(the maximum of the two equals ${k})?`,
        2 * k - 1,
        36,
        `P(max ≤ ${k}) − P(max ≤ ${k - 1}) = (${k}/6)² − (${k - 1}/6)² = ${2 * k - 1}/36.`
      );
    }
    case "max-of-three": {
      const k = randInt(rng, 3, 6);
      return q(
        `You roll three fair dice. What is P(the maximum equals ${k})?`,
        k ** 3 - (k - 1) ** 3,
        216,
        `P(max ≤ ${k}) − P(max ≤ ${k - 1}) = (${k}/6)³ − (${k - 1}/6)³ = ${k ** 3 - (k - 1) ** 3}/216.`
      );
    }
    case "sum-three": {
      const s = randInt(rng, 8, 13);
      let ways = 0;
      for (let a = 1; a <= 6; a++)
        for (let b = 1; b <= 6; b++)
          for (let c = 1; c <= 6; c++) if (a + b + c === s) ways++;
      return q(
        `You roll three fair dice. What is P(sum = ${s})?`,
        ways,
        216,
        `Count ordered triples summing to ${s}: ${ways} of 216. The distribution peaks at 10 and 11.`
      );
    }
    default: {
      // conditional-sum: first die known, ask about the total
      const a = randInt(rng, 1, 4);
      const s = randInt(rng, a + 3, Math.min(a + 6, 10));
      const need = s - a;
      const num = Math.max(0, 6 - need + 1);
      return q(
        `You roll two fair dice one at a time; the first shows ${a}. What is P(the total is at least ${s})?`,
        num,
        6,
        `Given the first is ${a}, the second must be ≥ ${need}: ${num} of its 6 faces. Conditioning collapses this to a one-die question.`
      );
    }
  }
}

/* ----------------------------------- coins ---------------------------------- */

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i;
  return Math.round(r);
}

const COIN_VARIANTS: Record<number, string[]> = {
  1: ["at-least-one-small", "exact-small"],
  2: ["at-least-one", "exact-mid"],
  3: ["exact-k", "first-head"],
  4: ["at-least-k", "exact-k"],
  5: ["at-least-k-large", "runs", "biased-exact"],
};

export function genCoinProbability(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const variant = choice(rng, COIN_VARIANTS[d]);
  const q = (prompt: string, num: number, den: number, how: string) =>
    probQuestion("probability", "coins", d, prompt, num, den, how);

  switch (variant) {
    case "at-least-one-small": {
      const n = randInt(rng, 2, 3);
      return q(
        `You flip ${n} fair coins. What is P(at least one heads)?`,
        2 ** n - 1,
        2 ** n,
        `Complement: P(no heads) = 1/${2 ** n}.`
      );
    }
    case "exact-small": {
      const n = randInt(rng, 2, 3);
      const k = randInt(rng, 1, n);
      return q(
        `You flip ${n} fair coins. What is P(exactly ${k} heads)?`,
        binomial(n, k),
        2 ** n,
        `C(${n},${k}) = ${binomial(n, k)} of the ${2 ** n} equally likely sequences.`
      );
    }
    case "at-least-one": {
      const n = randInt(rng, 4, 6);
      return q(
        `You flip ${n} fair coins. What is P(at least one heads)?`,
        2 ** n - 1,
        2 ** n,
        `Complement: P(no heads) = (1/2)^${n} = 1/${2 ** n}.`
      );
    }
    case "exact-mid": {
      const n = 4;
      const k = randInt(rng, 1, 3);
      return q(
        `You flip ${n} fair coins. What is P(exactly ${k} heads)?`,
        binomial(n, k),
        16,
        `C(4,${k}) = ${binomial(n, k)} of 16 sequences.`
      );
    }
    case "exact-k": {
      const n = randInt(rng, 5, 7);
      const k = randInt(rng, 2, n - 2);
      return q(
        `You flip ${n} fair coins. What is P(exactly ${k} heads)?`,
        binomial(n, k),
        2 ** n,
        `C(${n},${k}) = ${binomial(n, k)} favourable sequences out of 2^${n} = ${2 ** n}.`
      );
    }
    case "first-head": {
      const k = randInt(rng, 3, 6);
      return q(
        `You flip a fair coin until it lands heads. What is P(the first heads is on flip ${k})?`,
        1,
        2 ** k,
        `You need ${k - 1} tails then a heads: (1/2)^${k} = 1/${2 ** k}.`
      );
    }
    case "at-least-k": {
      const n = randInt(rng, 5, 6);
      const k = randInt(rng, 3, n - 1);
      let num = 0;
      for (let i = k; i <= n; i++) num += binomial(n, i);
      return q(
        `You flip ${n} fair coins. What is P(at least ${k} heads)?`,
        num,
        2 ** n,
        `Sum C(${n},i) for i = ${k}..${n}: ${num} of ${2 ** n}.`
      );
    }
    case "at-least-k-large": {
      const n = randInt(rng, 7, 8);
      const k = randInt(rng, 5, n - 1);
      let num = 0;
      for (let i = k; i <= n; i++) num += binomial(n, i);
      return q(
        `You flip ${n} fair coins. What is P(at least ${k} heads)?`,
        num,
        2 ** n,
        `Sum C(${n},i) for i = ${k}..${n}: ${num} of ${2 ** n}. Symmetry halves the work — the tails-side sum is identical.`
      );
    }
    case "runs": {
      const n = choice(rng, [4, 5]);
      // P(no two consecutive heads in n flips) = Fib(n+2)/2^n
      const fib = [1, 1];
      for (let i = 2; i <= n + 2; i++) fib[i] = fib[i - 1] + fib[i - 2];
      return q(
        `You flip ${n} fair coins. What is P(no two heads land next to each other)?`,
        fib[n + 1],
        2 ** n,
        `Sequences with no adjacent heads are counted by Fibonacci: ${fib[n + 1]} of ${2 ** n}.`
      );
    }
    default: {
      // biased-exact
      const den = choice(rng, [3, 4, 5]);
      const n = 3;
      const k = randInt(rng, 1, 2);
      const num = binomial(n, k) * 1 ** k * (den - 1) ** (n - k);
      return q(
        `A coin lands heads with probability 1/${den}. In ${n} flips, what is P(exactly ${k} heads)?`,
        num,
        den ** n,
        `C(${n},${k})·(1/${den})^${k}·(${den - 1}/${den})^${n - k} = ${binomial(n, k)}·${(den - 1) ** (n - k)}/${den ** n}.`
      );
    }
  }
}

/* ----------------------------------- cards ---------------------------------- */

const CARD_VARIANTS: Record<number, string[]> = {
  1: ["rank", "suit"],
  2: ["face", "rank-or-suit", "above-rank", "colour-and-rank"],
  3: ["two-suited", "pair", "two-above"],
  4: ["two-specific", "no-pair-three", "two-colours"],
  5: ["three-suited", "at-least-one-ace", "three-no-face"],
};

export function genCardProbability(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const variant = choice(rng, CARD_VARIANTS[d]);
  const q = (prompt: string, num: number, den: number, how: string) =>
    probQuestion("probability", "cards", d, prompt, num, den, how);

  switch (variant) {
    case "rank": {
      const rank = choice(rng, ["ace", "king", "seven"]);
      return q(
        `You draw one card from a standard 52-card deck. What is P(it is ${rank === "ace" ? "an ace" : `a ${rank}`})?`,
        4,
        52,
        `There are 4 ${rank}s among 52 cards.`
      );
    }
    case "suit": {
      const suit = choice(rng, ["hearts", "spades", "diamonds", "clubs"]);
      return q(
        `You draw one card from a standard deck. What is P(it is ${suit})?`,
        13,
        52,
        `13 of the 52 cards are ${suit}.`
      );
    }
    case "face":
      return q(
        `You draw one card from a standard deck. What is P(it is a face card — J, Q, or K)?`,
        12,
        52,
        `3 face ranks × 4 suits = 12 of 52.`
      );
    case "rank-or-suit": {
      const suit = choice(rng, ["hearts", "spades", "diamonds", "clubs"]);
      const rankName = choice(rng, ["king", "queen", "jack", "ten"]);
      return q(
        `You draw one card from a standard deck. What is P(it is a ${rankName} or a ${suit.slice(0, -1)})?`,
        4 + 13 - 1,
        52,
        `Inclusion–exclusion: 4 ${rankName}s + 13 ${suit} − 1 card that is both = 16 of 52.`
      );
    }
    case "above-rank": {
      const k = randInt(rng, 6, 11);
      return q(
        `You draw one card from a standard deck (A = 1, J = 11, Q = 12, K = 13). What is P(its rank is above ${k})?`,
        (13 - k) * 4,
        52,
        `Ranks ${k + 1}..13 are ${13 - k} ranks × 4 suits = ${(13 - k) * 4} of 52.`
      );
    }
    case "colour-and-rank": {
      const colour = choice(rng, ["red", "black"]);
      const rankName = choice(rng, ["ace", "king", "seven", "four"]);
      return q(
        `You draw one card from a standard deck. What is P(it is a ${colour} ${rankName})?`,
        2,
        52,
        `Each rank has 2 ${colour} cards out of 52.`
      );
    }
    case "two-suited": {
      const suit = choice(rng, ["hearts", "spades", "diamonds", "clubs"]);
      return q(
        `You draw two cards without replacement. What is P(both are ${suit})?`,
        13 * 12,
        52 * 51,
        `(13/52) × (12/51): the second draw sees 12 ${suit} among 51 cards.`
      );
    }
    case "two-above": {
      const k = randInt(rng, 8, 11);
      const n = (13 - k) * 4;
      return q(
        `You draw two cards without replacement (A = 1, J = 11, Q = 12, K = 13). What is P(both rank above ${k})?`,
        n * (n - 1),
        52 * 51,
        `${n} cards rank above ${k}: (${n}/52) × (${n - 1}/51).`
      );
    }
    case "pair":
      return q(
        `You draw two cards without replacement. What is P(they form a pair — same rank)?`,
        3,
        51,
        `Whatever the first card is, 3 of the remaining 51 match its rank.`
      );
    case "two-specific": {
      const rank = choice(rng, ["aces", "kings", "queens", "jacks"]);
      return q(
        `You draw two cards without replacement. What is P(both are ${rank})?`,
        4 * 3,
        52 * 51,
        `(4/52) × (3/51) = 12/2652 = 1/221.`
      );
    }
    case "two-colours":
      return q(
        `You draw two cards without replacement. What is P(one is red and one is black)?`,
        26 * 26 * 2,
        52 * 51,
        `Either order: 2 × (26/52) × (26/51) = ${26 * 26 * 2}/${52 * 51}. Slightly better than even.`
      );
    case "no-pair-three":
      return q(
        `You draw three cards without replacement. What is P(no two of them share a rank)?`,
        48 * 44,
        51 * 50,
        `Card 2 must miss card 1's rank (48/51); card 3 must miss both (44/50).`
      );
    case "three-suited": {
      const suit = choice(rng, ["hearts", "clubs", "spades", "diamonds"]);
      return q(
        `You draw three cards without replacement. What is P(all three are ${suit})?`,
        13 * 12 * 11,
        52 * 51 * 50,
        `(13/52)(12/51)(11/50) = ${13 * 12 * 11}/${52 * 51 * 50} ≈ 1.29%.`
      );
    }
    case "three-no-face":
      return q(
        `You draw three cards without replacement. What is P(none of them is a face card)?`,
        40 * 39 * 38,
        52 * 51 * 50,
        `40 non-face cards: (40/52)(39/51)(38/50) ≈ 0.447.`
      );
    default: {
      const n = randInt(rng, 4, 6);
      let num = 1;
      let den = 1;
      for (let i = 0; i < n; i++) {
        num *= 48 - i;
        den *= 52 - i;
      }
      return q(
        `You draw ${n} cards without replacement. What is P(at least one ace)?`,
        den - num,
        den,
        `Complement: P(no ace) = ${num}/${den} ≈ ${(num / den).toFixed(3)}, so P(at least one) ≈ ${(1 - num / den).toFixed(3)}.`
      );
    }
  }
}

/* --------------------------- odds & implied probability --------------------- */

/**
 * Odds are how prices are quoted; probabilities are how they're reasoned about.
 * Converting between them under time pressure is its own skill.
 */
export function genOddsImplied(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);

  if (d === 1) {
    const b = randInt(rng, 1, 9);
    const against = rng() < 0.5;
    const p = round2((against ? 1 / (1 + b) : b / (1 + b)) * 100);
    return makeQuestion({
      topic: "probability",
      subtopic: "odds-implied",
      difficulty: d,
      prompt: `A bookmaker quotes ${b}-to-1 ${against ? "against" : "on"} an event. What is the implied probability? (Percent, 1 dp.)`,
      answer: formatAnswer(p),
      answerValue: p,
      gradingType: "numeric_tolerance",
      tolerance: 0.01,
      explanation: `${b}-to-1 ${against ? "against" : "on"} means ${against ? `${b} losing outcomes to 1 winning one` : `${b} winning outcomes to 1 losing one`}: P = ${against ? 1 : b}/(${b} + 1) = ${formatAnswer(p)}%.`,
    });
  }

  if (d === 2) {
    const a = choice(rng, [3, 5, 7, 9, 11, 13]);
    const b = choice(rng, [2, 4, 6]);
    const p = round2((b / (a + b)) * 100);
    return makeQuestion({
      topic: "probability",
      subtopic: "odds-implied",
      difficulty: d,
      prompt: `Odds are quoted as ${a}-to-${b} against. What is the implied probability? (Percent, 1 dp.)`,
      answer: formatAnswer(p),
      answerValue: p,
      gradingType: "numeric_tolerance",
      tolerance: 0.01,
      explanation: `${a}-to-${b} against ⇒ P = ${b}/(${a} + ${b}) = ${b}/${a + b} = ${formatAnswer(p)}%.`,
    });
  }

  if (d === 3) {
    const pct = choice(rng, [12, 18, 35, 44, 62, 78]);
    const odds = round2((100 - pct) / pct);
    return makeQuestion({
      topic: "probability",
      subtopic: "odds-implied",
      difficulty: d,
      prompt: `An event has probability ${pct}%. Express the odds against it as a single number x, meaning x-to-1. (2 dp.)`,
      answer: formatAnswer(odds),
      answerValue: odds,
      gradingType: "numeric_tolerance",
      tolerance: 0.01,
      explanation: `Odds against = (1 − p)/p = ${100 - pct}/${pct} = ${formatAnswer(odds)}, i.e. ${formatAnswer(odds)}-to-1 against.`,
    });
  }

  if (d === 4) {
    // A real book always prices to more than 100%. Pick the first leg, then
    // derive the second from a target overround so the answer is positive.
    const dec1 = round2(randInt(rng, 150, 320) / 100);
    const targetOverround = randInt(rng, 3, 12) / 100;
    const dec2 = round2(1 / (1 + targetOverround - 1 / dec1));
    const overround = round2((1 / dec1 + 1 / dec2 - 1) * 100);
    return makeQuestion({
      topic: "probability",
      subtopic: "odds-implied",
      difficulty: d,
      prompt: `A two-way market is quoted at decimal odds ${formatAnswer(dec1)} and ${formatAnswer(dec2)}. What is the overround (total implied probability minus 100%)? (Percentage points, 1 dp.)`,
      answer: formatAnswer(overround),
      answerValue: overround,
      gradingType: "numeric_tolerance",
      tolerance: 0.02,
      explanation: `Implied probabilities are 1/${formatAnswer(dec1)} = ${formatAnswer(round2((1 / dec1) * 100))}% and 1/${formatAnswer(dec2)} = ${formatAnswer(round2((1 / dec2) * 100))}%. They total ${formatAnswer(round2((1 / dec1 + 1 / dec2) * 100))}%, so the overround is ${formatAnswer(overround)} points — that gap is the book's edge.`,
    });
  }

  // L5 — strip the overround out proportionally to get a fair probability.
  const dec1 = round2(randInt(rng, 140, 260) / 100);
  const dec2 = round2(randInt(rng, 160, 320) / 100);
  const raw1 = 1 / dec1;
  const raw2 = 1 / dec2;
  const fair = round2((raw1 / (raw1 + raw2)) * 100);
  return makeQuestion({
    topic: "probability",
    subtopic: "odds-implied",
    difficulty: d,
    prompt: `A two-way market is quoted at decimal odds ${formatAnswer(dec1)} and ${formatAnswer(dec2)}. Removing the overround proportionally, what is the fair probability of the first outcome? (Percent, 1 dp.)`,
    answer: formatAnswer(fair),
    answerValue: fair,
    gradingType: "numeric_tolerance",
    tolerance: 0.02,
    explanation: `Raw implied: ${formatAnswer(round2(raw1 * 100))}% and ${formatAnswer(round2(raw2 * 100))}%, totalling ${formatAnswer(round2((raw1 + raw2) * 100))}%. Normalise: ${formatAnswer(round2(raw1 * 100))} ÷ ${formatAnswer(round2((raw1 + raw2) * 100))} = ${formatAnswer(fair)}%.`,
  });
}

/* --------------------------- conditional probability ------------------------ */

const CONDITIONAL_VARIANTS: Record<number, string[]> = {
  1: ["die-given-parity", "urn"],
  2: ["urn", "die-given-first"],
  3: ["cards-given", "die-given-first", "urn-two"],
  4: ["urn-two", "cards-given-two", "die-given-first"],
  5: ["two-child", "urn-two", "cards-given-two"],
};

export function genConditionalProbability(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const variant = choice(rng, CONDITIONAL_VARIANTS[d]);
  const q = (prompt: string, num: number, den: number, how: string) =>
    probQuestion("conditional-probability", "conditional", d, prompt, num, den, how);

  switch (variant) {
    case "die-given-parity": {
      const even = rng() < 0.5;
      const k = even ? choice(rng, [2, 4, 6]) : choice(rng, [1, 3, 5]);
      return q(
        `You roll a fair die and are told the result is ${even ? "even" : "odd"}. What is P(it is ${k})?`,
        1,
        3,
        `The condition restricts you to 3 equally likely faces; ${k} is one of them.`
      );
    }
    case "urn": {
      const red = randInt(rng, 3, 8);
      const blue = randInt(rng, 3, 8);
      return q(
        `An urn holds ${red} red and ${blue} blue balls. You draw two without replacement. Given the first is red, what is P(the second is also red)?`,
        red - 1,
        red + blue - 1,
        `After removing one red, ${red - 1} reds remain among ${red + blue - 1} balls.`
      );
    }
    case "die-given-first": {
      const a = randInt(rng, 2, 5);
      const s = randInt(rng, a + 2, Math.min(a + 6, 11));
      const need = s - a;
      const num = Math.max(0, 6 - need + 1);
      return q(
        `You roll two fair dice one at a time. The first shows ${a}. What is P(the total is at least ${s})?`,
        num,
        6,
        `Given the first die is ${a}, you need the second ≥ ${need}: ${num} of its 6 faces.`
      );
    }
    case "cards-given": {
      const suit = choice(rng, ["heart", "spade", "diamond", "club"]);
      return q(
        `You draw two cards without replacement. Given the first is a ${suit}, what is P(the second is also a ${suit})?`,
        12,
        51,
        `12 ${suit}s remain among 51 cards — without-replacement conditioning is just recounting.`
      );
    }
    case "cards-given-two": {
      const suit = choice(rng, ["heart", "spade", "diamond", "club"]);
      return q(
        `You draw three cards without replacement. Given the first two are ${suit}s, what is P(the third is also a ${suit})?`,
        11,
        50,
        `Two ${suit}s gone: 11 remain among 50 cards.`
      );
    }
    case "urn-two": {
      const red = randInt(rng, 4, 9);
      const blue = randInt(rng, 3, 9);
      return q(
        `An urn holds ${red} red and ${blue} blue balls. You draw three without replacement. Given the first two are red, what is P(the third is red)?`,
        red - 2,
        red + blue - 2,
        `Two reds gone: ${red - 2} reds among ${red + blue - 2} remaining.`
      );
    }
    case "two-child":
      return q(
        `A family has two children. Given that at least one is a girl, what is P(both are girls)?`,
        1,
        3,
        `The four equally likely orderings are BB, BG, GB, GG. The condition kills BB, leaving 3, of which 1 is GG. Conditioning on "at least one" is not the same as conditioning on a named child.`
      );
    default: {
      const a = randInt(rng, 2, 5);
      const s = randInt(rng, a + 2, Math.min(a + 6, 11));
      const need = s - a;
      return q(
        `You roll two fair dice one at a time. The first shows ${a}. What is P(the total is at least ${s})?`,
        Math.max(0, 6 - need + 1),
        6,
        `Given the first die is ${a}, you need the second ≥ ${need}.`
      );
    }
  }
}

/* ----------------------------------- Bayes ---------------------------------- */

/**
 * Its own archetype rather than a variant hidden inside `conditional` — it was
 * emitting a subtopic the registry didn't know about, so it had no difficulty
 * gating of its own.
 */
export function genBayes(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);

  // Two urns: which one did the red ball come from?
  if (d >= 4 && rng() < 0.5) {
    const r1 = randInt(rng, 4, 9);
    const b1 = randInt(rng, 1, 5);
    const r2 = randInt(rng, 1, 5);
    const b2 = randInt(rng, 4, 9);
    const p1 = r1 / (r1 + b1);
    const p2 = r2 / (r2 + b2);
    const value = parseFloat((p1 / (p1 + p2)).toFixed(4));
    return makeQuestion({
      topic: "conditional-probability",
      subtopic: "bayes",
      difficulty: d,
      prompt: `Urn A holds ${r1} red and ${b1} blue balls; urn B holds ${r2} red and ${b2} blue. You pick an urn at random and draw one ball; it is red. What is P(you picked urn A)? (Decimal, 2+ places.)`,
      answer: formatAnswer(value),
      answerValue: value,
      gradingType: "numeric_tolerance",
      tolerance: 0.02,
      explanation: `P(red | A) = ${r1}/${r1 + b1} = ${formatAnswer(round2(p1))}, P(red | B) = ${r2}/${r2 + b2} = ${formatAnswer(round2(p2))}. The priors are equal so they cancel: P(A | red) = ${formatAnswer(round2(p1))}/(${formatAnswer(round2(p1))} + ${formatAnswer(round2(p2))}) ≈ ${formatAnswer(value)}.`,
    });
  }

  // Screening test, worked as natural frequencies. Base rates get lower and
  // false-positive rates get finer as the level rises.
  const prevalencePct =
    d <= 2 ? choice(rng, [10, 20, 25]) : d === 3 ? choice(rng, [2, 5, 8]) : choice(rng, [0.5, 1, 2]);
  const sensPct = d <= 2 ? choice(rng, [80, 90]) : choice(rng, [85, 90, 95, 99]);
  const fprPct = d <= 2 ? choice(rng, [10, 20]) : d === 3 ? choice(rng, [5, 10]) : choice(rng, [2, 3, 5]);
  const pop = 10_000;
  const sick = (prevalencePct / 100) * pop;
  const healthy = pop - sick;
  const truePos = (sensPct / 100) * sick;
  const falsePos = (fprPct / 100) * healthy;
  const value = parseFloat((truePos / (truePos + falsePos)).toFixed(4));

  return makeQuestion({
    topic: "conditional-probability",
    subtopic: "bayes",
    difficulty: d,
    prompt: `${formatAnswer(prevalencePct)}% of a population has a condition. A test detects it ${sensPct}% of the time but also flags ${fprPct}% of healthy people. Given a positive test, what is P(the person has the condition)? (Decimal, 2+ places.)`,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: "numeric_tolerance",
    tolerance: 0.03,
    explanation: `Take ${pop.toLocaleString()} people: ${formatAnswer(sick)} sick → ${formatAnswer(round2(truePos))} true positives; ${formatAnswer(healthy)} healthy → ${formatAnswer(round2(falsePos))} false positives. P = ${formatAnswer(round2(truePos))}/(${formatAnswer(round2(truePos))} + ${formatAnswer(round2(falsePos))}) ≈ ${formatAnswer(value)}. At low prevalence the base rate dominates the test's accuracy.`,
  });
}

/* ------------------------- conditional update / fills ----------------------- */

/**
 * Adverse selection, stated as a conditional-probability question: *given that
 * your order was filled*, what is the thing now worth? With an informed fraction
 * q and uninformed traders lifting at random, P(high | lifted) = (1 + q)/2 when
 * the prior is even — clean enough to do in your head, and the whole point of
 * the "would you still be happy to have done that trade?" habit.
 */
export function genConditionalUpdate(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const low = randInt(rng, 20, 60);
  const spread = choice(rng, [4, 6, 8, 10]);
  const high = low + spread;

  const informedPct = d <= 3 ? 100 : d === 4 ? choice(rng, [50, 60]) : choice(rng, [30, 40, 70]);
  const q = informedPct / 100;
  const priorHigh = d >= 5 ? choice(rng, [0.4, 0.6]) : 0.5;

  // Informed lifts iff value is high; uninformed lifts with probability 1/2.
  const pLiftGivenHigh = q + (1 - q) * 0.5;
  const pLiftGivenLow = (1 - q) * 0.5;
  const pHighGivenLift =
    (priorHigh * pLiftGivenHigh) / (priorHigh * pLiftGivenHigh + (1 - priorHigh) * pLiftGivenLow);
  const value = round2(pHighGivenLift * high + (1 - pHighGivenLift) * low);
  const mid = round2(priorHigh * high + (1 - priorHigh) * low);
  const offer = round2(mid + 1);

  const counterparty =
    informedPct === 100
      ? `Your counterparty knows the true value and only trades when it is profitable for them.`
      : `${informedPct}% of counterparties know the true value and only trade when it is profitable for them; the other ${100 - informedPct}% trade at random, lifting your offer half the time regardless.`;

  return makeQuestion({
    topic: "conditional-probability",
    subtopic: "conditional-update",
    difficulty: d,
    prompt: `A contract is worth $${high} or $${low}${priorHigh === 0.5 ? ", equally likely" : `, with probability ${formatAnswer(round2(priorHigh * 100))}% of being the $${high} case`}. You offer at $${formatAnswer(offer)}. ${counterparty} Given your offer was lifted, what is the expected value of the contract? (2 dp.)`,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: "numeric_tolerance",
    tolerance: 0.01,
    explanation: `Unconditionally the contract is worth $${formatAnswer(mid)}. But P(lift | high) = ${formatAnswer(round2(pLiftGivenHigh))} and P(lift | low) = ${formatAnswer(round2(pLiftGivenLow))}, so P(high | lifted) = ${formatAnswer(round2(pHighGivenLift))} and E[value | lifted] = $${formatAnswer(value)}. You sold at $${formatAnswer(offer)} something now worth $${formatAnswer(value)} — ${value > offer ? `a loss of $${formatAnswer(round2(value - offer))}` : `still a gain of $${formatAnswer(round2(offer - value))}`}. Always ask what a fill tells you before you ask what the thing is worth.`,
  });
}

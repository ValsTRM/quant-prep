import { type Rng, randInt, choice } from "../rng";
import type { GeneratedQuestion } from "../types";
import { formatAnswer } from "../grading";
import {
  borrowCount,
  carryCount,
  clampDifficulty,
  isTrivialOperand,
  makeQuestion,
  round2,
  sampleUntil,
} from "./base";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/* --------------------------------- addition -------------------------------- */

/**
 * Both dimensions climb together — digits *and* term count, so no level is
 * lighter than the one below it:
 * L1 two 2-digit · L2 two 3-digit · L3 three 3-digit · L4 three 4-digit ·
 * L5 four 4-digit.
 * From L2 the instance is rejected unless it actually forces carries — the
 * difficulty of mental addition is carrying, not digit count.
 */
export function genAddition(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const minCarries = [0, 1, 2, 3, 3][d - 1];

  const terms = sampleUntil(
    () => {
      if (d === 1) return [randInt(rng, 13, 89), randInt(rng, 13, 89)];
      if (d === 2) return [randInt(rng, 104, 899), randInt(rng, 104, 899)];
      if (d === 3)
        return [randInt(rng, 104, 899), randInt(rng, 104, 899), randInt(rng, 104, 899)];
      if (d === 4)
        return [
          randInt(rng, 1040, 8999),
          randInt(rng, 1040, 8999),
          randInt(rng, 1040, 8999),
        ];
      return [
        randInt(rng, 1040, 8999),
        randInt(rng, 1040, 8999),
        randInt(rng, 1040, 8999),
        randInt(rng, 1040, 8999),
      ];
    },
    (t) => carryCount(t) >= minCarries && t.every((x) => x % 10 !== 0)
  );

  const sum = terms.reduce((a, b) => a + b, 0);
  return makeQuestion({
    topic: "arithmetic",
    subtopic: "addition",
    difficulty: d,
    prompt: `${terms.join(" + ")} = ?`,
    answerValue: sum,
    gradingType: "exact",
    explanation: `Add left to right, completing to round numbers as you go: ${terms.join(" + ")} = ${sum}. This one needs ${plural(carryCount(terms), "carry", "carries")} — track them before you commit to a digit.`,
  });
}

/* -------------------------------- subtraction ------------------------------- */

/** L1 2d−2d · L2 3d−2d · L3 3d−3d · L4 4d−3d · L5 5d−4d, all forcing borrows. */
export function genSubtraction(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const minBorrows = [1, 1, 2, 2, 3][d - 1];

  const [a, b] = sampleUntil(
    (): [number, number] => {
      if (d === 1) return [randInt(rng, 31, 98), randInt(rng, 13, 29)];
      if (d === 2) return [randInt(rng, 203, 989), randInt(rng, 13, 98)];
      if (d === 3) return [randInt(rng, 403, 989), randInt(rng, 104, 389)];
      if (d === 4) return [randInt(rng, 2003, 9899), randInt(rng, 104, 989)];
      return [randInt(rng, 10_003, 98_999), randInt(rng, 1004, 9899)];
    },
    ([x, y]) => borrowCount(x, y) >= minBorrows && y % 10 !== 0 && x % 10 !== 0
  );

  const diff = a - b;
  return makeQuestion({
    topic: "arithmetic",
    subtopic: "subtraction",
    difficulty: d,
    prompt: `${a} − ${b} = ?`,
    answerValue: diff,
    gradingType: "exact",
    explanation: `Round ${b} up to the next ten, subtract, then add the difference back: ${a} − ${b} = ${diff}. It needs ${plural(borrowCount(a, b), "borrow", "borrows")}.`,
  });
}

/* ------------------------------ multiplication ------------------------------ */

/**
 * The screening ladder, measured in partial products: L1 1d×2d (2) ·
 * L2 3d×1d (3) · L3 **2d×2d** (4, the core screening shape) · L4 3d×2d (6) ·
 * L5 3d×3d near a round base, where (base±x)(base±y) is the only tractable route.
 * Operands ending in 0, and 10/11/100, are rejected from L2 up — those made the
 * old generator's "difficulty 4" questions easier than its difficulty 1 ones.
 */
export function genMultiplication(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);

  const [a, b] = sampleUntil(
    (): [number, number] => {
      if (d === 1) return [randInt(rng, 3, 9), randInt(rng, 12, 49)];
      if (d === 2) return [randInt(rng, 103, 989), randInt(rng, 3, 9)];
      if (d === 3) return [randInt(rng, 13, 99), randInt(rng, 13, 99)];
      if (d === 4) return [randInt(rng, 103, 989), randInt(rng, 13, 99)];
      const base = choice(rng, [100, 200, 500]);
      return [base + randInt(rng, -9, 9), base + randInt(rng, -9, 9)];
    },
    ([x, y]) => {
      if (d === 1) return y % 10 !== 0 && y !== 11;
      if (d === 5) return x !== y && x % 10 !== 0 && y % 10 !== 0;
      return !isTrivialOperand(x) && !isTrivialOperand(y) && x % 10 !== 0 && y % 10 !== 0;
    }
  );

  const prod = a * b;
  const tens = Math.floor(b / 10) * 10;
  const ones = b - tens;
  const hint =
    d === 5
      ? `Both sit near a round base — use (base + x)(base + y) = base² + base(x + y) + xy`
      : `Split the smaller factor: ${a} × ${b} = ${a} × ${tens} + ${a} × ${ones} = ${a * tens} + ${a * ones}`;

  return makeQuestion({
    topic: "arithmetic",
    subtopic: "multiplication",
    difficulty: d,
    prompt: `${a} × ${b} = ?`,
    answerValue: prod,
    gradingType: "exact",
    explanation: `${hint} = ${prod}.`,
  });
}

/* --------------------------------- division -------------------------------- */

/**
 * L1–L2 exact division. L3 up mixes in **non-exact** division answered to a
 * decimal — the old generator only ever produced integer quotients and allowed
 * divisors of 10 and 20, which is how "1420 ÷ 20" ended up labelled difficulty 3.
 */
export function genDivision(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const exact = d <= 2 ? true : d === 3 ? rng() < 0.5 : rng() < 0.3;

  if (exact) {
    const [divisor, quotient] = sampleUntil(
      (): [number, number] => {
        if (d === 1) return [randInt(rng, 3, 9), randInt(rng, 12, 49)];
        if (d === 2) return [randInt(rng, 3, 9), randInt(rng, 103, 499)];
        if (d === 3) return [randInt(rng, 12, 29), randInt(rng, 23, 99)];
        if (d === 4) return [randInt(rng, 13, 49), randInt(rng, 103, 499)];
        return [randInt(rng, 53, 97), randInt(rng, 103, 899)];
      },
      ([dv, q]) =>
        !isTrivialOperand(dv) && dv % 10 !== 0 && (d <= 2 || dv % 5 !== 0) && q % 10 !== 0
    );
    const dividend = divisor * quotient;
    const lead = Math.floor(quotient / 10) * 10 || quotient;
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "division",
      difficulty: d,
      prompt: `${dividend} ÷ ${divisor} = ?`,
      answerValue: quotient,
      gradingType: "exact",
      explanation: `Estimate the leading digit first: ${divisor} × ${lead} = ${divisor * lead}, then refine. ${dividend} ÷ ${divisor} = ${quotient}.`,
    });
  }

  // Non-exact: answer to 2 decimal places.
  const [dividend, divisor] = sampleUntil(
    (): [number, number] => {
      if (d === 3) return [randInt(rng, 120, 899), randInt(rng, 12, 29)];
      if (d === 4) return [randInt(rng, 900, 4999), randInt(rng, 13, 49)];
      return [randInt(rng, 2000, 9999), randInt(rng, 53, 97)];
    },
    ([n, dv]) => n % dv !== 0 && !isTrivialOperand(dv) && dv % 10 !== 0 && dv % 5 !== 0
  );
  const value = round2(dividend / divisor);
  const whole = Math.floor(dividend / divisor);
  return makeQuestion({
    topic: "arithmetic",
    subtopic: "division",
    difficulty: d,
    prompt: `${dividend} ÷ ${divisor} = ? (2 decimal places)`,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: "numeric_tolerance",
    tolerance: 0.005,
    explanation: `${divisor} × ${whole} = ${divisor * whole}, leaving ${dividend - divisor * whole}. So ${dividend} ÷ ${divisor} = ${whole} + ${dividend - divisor * whole}/${divisor} ≈ ${formatAnswer(value)}.`,
  });
}

/* ------------------------------- decimal ops -------------------------------- */

interface DecimalVariant {
  levels: number[];
  build(rng: Rng): { prompt: string; value: number; how: string };
}

/**
 * Decimal multipliers you have to recognise as fractions: ×0.25 is ÷4, ÷0.05 is
 * ×20. Place-value discipline, not long multiplication.
 */
const DECIMAL_VARIANTS: DecimalVariant[] = [
  {
    levels: [1, 2],
    build(rng) {
      const f = choice(rng, [0.5, 1.5, 0.1]);
      const n = randInt(rng, 12, 98) * 2;
      const as = f === 0.5 ? "1/2" : f === 1.5 ? "3/2" : "1/10";
      const via = f === 0.5 ? `${n} ÷ 2` : f === 1.5 ? `${n} + ${n / 2}` : `${n} ÷ 10`;
      return {
        prompt: `${n} × ${f} = ?`,
        value: round2(n * f),
        how: `${f} = ${as}, so this is ${via} = ${round2(n * f)}.`,
      };
    },
  },
  {
    levels: [2, 3],
    build(rng) {
      const f = choice(rng, [0.25, 0.75, 2.5]);
      const n = randInt(rng, 13, 99) * 4;
      const as = f === 0.25 ? "1/4" : f === 0.75 ? "3/4" : "5/2";
      return {
        prompt: `${n} × ${f} = ?`,
        value: round2(n * f),
        how: `${f} = ${as}: ${f === 2.5 ? `${n} × 5 ÷ 2` : `${n} ÷ 4${f === 0.75 ? " × 3" : ""}`} = ${round2(n * f)}.`,
      };
    },
  },
  {
    levels: [2, 3, 4],
    build(rng) {
      const f = choice(rng, [0.5, 0.25, 0.2]);
      const n = randInt(rng, 13, 97) * 5;
      return {
        prompt: `${n} ÷ ${f} = ?`,
        value: round2(n / f),
        how: `Dividing by ${f} is multiplying by ${round2(1 / f)}: ${n} × ${round2(1 / f)} = ${round2(n / f)}. Dividing by something below 1 makes it bigger — check that before you answer.`,
      };
    },
  },
  {
    levels: [3, 4],
    build(rng) {
      const f = choice(rng, [0.4, 0.6, 1.25, 0.125]);
      const n = randInt(rng, 11, 79) * 8;
      const as = f === 0.4 ? "2/5" : f === 0.6 ? "3/5" : f === 1.25 ? "5/4" : "1/8";
      return {
        prompt: `${n} × ${f} = ?`,
        value: round2(n * f),
        how: `${f} = ${as}, so ${n} × ${f} = ${round2(n * f)}.`,
      };
    },
  },
  {
    levels: [4, 5],
    build(rng) {
      const f = choice(rng, [0.05, 0.025, 0.08]);
      const n = randInt(rng, 12, 96) * 25;
      return {
        prompt: `${n} ÷ ${f} = ?`,
        value: round2(n / f),
        how: `1 ÷ ${f} = ${round2(1 / f)}, so ${n} ÷ ${f} = ${n} × ${round2(1 / f)} = ${round2(n / f)}. Count the decimal places before you commit.`,
      };
    },
  },
  {
    levels: [4, 5],
    build(rng) {
      const a = round2(randInt(rng, 12, 89) / 10);
      const b = choice(rng, [0.6, 1.4, 2.5, 0.35]);
      return {
        prompt: `${a} × ${b} = ?`,
        value: round2(a * b),
        how: `Multiply as whole numbers (${Math.round(a * 10)} × ${Math.round(b * 100)} = ${Math.round(a * 10) * Math.round(b * 100)}), then place the decimal: 1 + 2 places → ${round2(a * b)}.`,
      };
    },
  },
  {
    levels: [5],
    build(rng) {
      const n = randInt(rng, 11, 49) * 20;
      const a = choice(rng, [0.6, 1.5, 2.5]);
      const b = choice(rng, [0.25, 0.4, 1.2]);
      return {
        prompt: `${n} × ${a} × ${b} = ?`,
        value: round2(n * a * b),
        how: `Combine the multipliers first: ${a} × ${b} = ${round2(a * b)}, then ${n} × ${round2(a * b)} = ${round2(n * a * b)}.`,
      };
    },
  },
];

export function genDecimalOps(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);
  const eligible = DECIMAL_VARIANTS.filter((v) => v.levels.includes(d));
  const variant = choice(rng, eligible.length ? eligible : DECIMAL_VARIANTS);
  const { prompt, value, how } = variant.build(rng);
  return makeQuestion({
    topic: "arithmetic",
    subtopic: "decimal-ops",
    difficulty: d,
    prompt,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: "numeric_tolerance",
    tolerance: 0.001,
    explanation: how,
  });
}

/* ------------------------------ missing operand ----------------------------- */

/** Inverse thinking: you're given the result and one input. */
export function genMissingOperand(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);

  if (d === 1) {
    const x = randInt(rng, 17, 89);
    const b = randInt(rng, 18, 79);
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "missing-operand",
      difficulty: d,
      prompt: `? + ${b} = ${x + b}`,
      answerValue: x,
      gradingType: "exact",
      explanation: `Undo the addition: ${x + b} − ${b} = ${x}.`,
    });
  }

  if (d === 2) {
    const [x, b] = sampleUntil(
      (): [number, number] => [randInt(rng, 13, 79), randInt(rng, 4, 9)],
      ([, dv]) => !isTrivialOperand(dv)
    );
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "missing-operand",
      difficulty: d,
      prompt: `? × ${b} = ${x * b}`,
      answerValue: x,
      gradingType: "exact",
      explanation: `Divide back: ${x * b} ÷ ${b} = ${x}.`,
    });
  }

  if (d === 3) {
    const flip = rng() < 0.5;
    const [x, b] = sampleUntil(
      (): [number, number] => [randInt(rng, 13, 49), randInt(rng, 12, 29)],
      ([q, dv]) => !isTrivialOperand(dv) && dv % 10 !== 0 && q % 10 !== 0
    );
    return flip
      ? makeQuestion({
          topic: "arithmetic",
          subtopic: "missing-operand",
          difficulty: d,
          prompt: `? × ${b} = ${x * b}`,
          answerValue: x,
          gradingType: "exact",
          explanation: `${x * b} ÷ ${b} = ${x}. Estimate first: ${b} × 10 = ${b * 10}, so the answer is in the ${x < 20 ? "teens–twenties" : "twenties–forties"}.`,
        })
      : makeQuestion({
          topic: "arithmetic",
          subtopic: "missing-operand",
          difficulty: d,
          prompt: `${x * b} ÷ ? = ${x}`,
          answerValue: b,
          gradingType: "exact",
          explanation: `The unknown divisor is ${x * b} ÷ ${x} = ${b}.`,
        });
  }

  if (d === 4) {
    const f = choice(rng, [0.4, 2.5, 1.25, 0.75]);
    const x = randInt(rng, 12, 88) * 4;
    const result = round2(x * f);
    return rng() < 0.5
      ? makeQuestion({
          topic: "arithmetic",
          subtopic: "missing-operand",
          difficulty: d,
          prompt: `? × ${f} = ${formatAnswer(result)}`,
          answer: formatAnswer(x),
          answerValue: x,
          gradingType: "numeric_tolerance",
          tolerance: 0.002,
          explanation: `Divide by ${f}, i.e. multiply by ${round2(1 / f)}: ${formatAnswer(result)} × ${round2(1 / f)} = ${x}.`,
        })
      : makeQuestion({
          topic: "arithmetic",
          subtopic: "missing-operand",
          difficulty: d,
          prompt: `${x} × ? = ${formatAnswer(result)}`,
          answer: formatAnswer(f),
          answerValue: f,
          gradingType: "numeric_tolerance",
          tolerance: 0.01,
          explanation: `${formatAnswer(result)} ÷ ${x} = ${f}. Sanity-check the direction: the result is ${result > x ? "larger" : "smaller"}, so the multiplier is ${result > x ? "above" : "below"} 1.`,
        });
  }

  // L5 — two-step inverse.
  const inner = randInt(rng, 13, 89);
  const add = randInt(rng, 12, 49);
  const mult = randInt(rng, 3, 9);
  const result = (inner + add) * mult;
  return makeQuestion({
    topic: "arithmetic",
    subtopic: "missing-operand",
    difficulty: d,
    prompt: `(? + ${add}) × ${mult} = ${result}`,
    answerValue: inner,
    gradingType: "exact",
    explanation: `Peel the operations off in reverse: ${result} ÷ ${mult} = ${inner + add}, then − ${add} = ${inner}.`,
  });
}

/* --------------------------- sequential arithmetic -------------------------- */

/** Chained operations held in your head — no writing intermediate results down. */
export function genSequentialArithmetic(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);

  if (d === 1) {
    const [a, b, c] = [randInt(rng, 23, 79), randInt(rng, 13, 49), randInt(rng, 13, 39)];
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "sequential-arithmetic",
      difficulty: d,
      prompt: `${a} + ${b} − ${c} = ?`,
      answerValue: a + b - c,
      gradingType: "exact",
      explanation: `Left to right: ${a} + ${b} = ${a + b}, then − ${c} = ${a + b - c}.`,
    });
  }

  if (d === 2) {
    const [a, b, c, e] = [
      randInt(rng, 103, 389),
      randInt(rng, 23, 89),
      randInt(rng, 23, 79),
      randInt(rng, 13, 59),
    ];
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "sequential-arithmetic",
      difficulty: d,
      prompt: `${a} + ${b} − ${c} + ${e} = ?`,
      answerValue: a + b - c + e,
      gradingType: "exact",
      explanation: `Group the signs: (${a} + ${b} + ${e}) − ${c} = ${a + b + e} − ${c} = ${a + b - c + e}.`,
    });
  }

  if (d === 3) {
    const [a, b, c] = [randInt(rng, 13, 39), randInt(rng, 13, 39), randInt(rng, 3, 9)];
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "sequential-arithmetic",
      difficulty: d,
      prompt: `(${a} + ${b}) × ${c} = ?`,
      answerValue: (a + b) * c,
      gradingType: "exact",
      explanation: `${a} + ${b} = ${a + b}, then × ${c} = ${(a + b) * c}. Doing the bracket first beats distributing here.`,
    });
  }

  if (d === 4) {
    const q = randInt(rng, 12, 39);
    const div = randInt(rng, 3, 9);
    const a = q * div;
    const b = randInt(rng, 13, 49);
    const c = randInt(rng, 13, 79);
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "sequential-arithmetic",
      difficulty: d,
      prompt: `${a} ÷ ${div} + ${b} × 2 − ${c} = ?`,
      answerValue: q + b * 2 - c,
      gradingType: "exact",
      explanation: `Order of operations before anything else: ${a} ÷ ${div} = ${q}, ${b} × 2 = ${b * 2}. Then ${q} + ${b * 2} − ${c} = ${q + b * 2 - c}.`,
    });
  }

  // L5 — mixed formats inside one chain.
  const q = randInt(rng, 12, 39);
  const div = randInt(rng, 4, 9);
  const a = q * div;
  const b = randInt(rng, 12, 48) * 5;
  const f = choice(rng, [0.4, 1.5, 0.25]);
  const c = randInt(rng, 13, 59);
  const value = round2(a / div + b * f - c);
  return makeQuestion({
    topic: "arithmetic",
    subtopic: "sequential-arithmetic",
    difficulty: d,
    prompt: `${a} ÷ ${div} + ${b} × ${f} − ${c} = ?`,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: "numeric_tolerance",
    tolerance: 0.002,
    explanation: `${a} ÷ ${div} = ${q}; ${b} × ${f} = ${round2(b * f)}. Then ${q} + ${round2(b * f)} − ${c} = ${formatAnswer(value)}.`,
  });
}

/* ------------------------------- approximation ------------------------------ */

/**
 * "Taking out the big part" — anchor on a nearby exact value, then apply a
 * first-order correction. Graded on tolerance, because the estimate is the
 * skill, not the exact digits.
 */
export function genApproximation(difficulty: number, rng: Rng): GeneratedQuestion {
  const d = clampDifficulty(difficulty);

  if (d === 1) {
    const a = randInt(rng, 18, 49);
    const b = randInt(rng, 18, 49);
    const exact = a * b;
    const ra = Math.round(a / 10) * 10;
    const rb = Math.round(b / 10) * 10;
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "approximation",
      difficulty: d,
      prompt: `Estimate ${a} × ${b} to within 5%.`,
      answerValue: exact,
      gradingType: "numeric_tolerance",
      tolerance: 0.05,
      explanation: `Round to ${ra} × ${rb} = ${ra * rb}, then nudge toward the true ${exact}.`,
    });
  }

  if (d === 2) {
    const n = choice(rng, [3, 7, 12, 45, 250]) * 10 ** randInt(rng, 3, 6);
    const per = choice(rng, [12, 25, 40]);
    const exact = Math.round(n / per);
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "approximation",
      difficulty: d,
      prompt: `Estimate ${n.toLocaleString()} ÷ ${per} to within 10%.`,
      answerValue: exact,
      gradingType: "numeric_tolerance",
      tolerance: 0.1,
      explanation: `Work in powers of ten: ${n.toLocaleString()} ÷ ${per} ≈ ${exact.toLocaleString()}. Fix the order of magnitude before the digits.`,
    });
  }

  if (d === 3) {
    const n = sampleUntil(
      () => randInt(rng, 20, 99),
      (x) => !Number.isInteger(Math.sqrt(x))
    );
    const value = parseFloat(Math.sqrt(n).toFixed(2));
    const base = Math.floor(Math.sqrt(n));
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "approximation",
      difficulty: d,
      prompt: `Estimate √${n} to 2 decimal places.`,
      answer: formatAnswer(value),
      answerValue: value,
      gradingType: "numeric_tolerance",
      tolerance: 0.01,
      explanation: `Take out the big part: √${n} = ${base}·√(1 + ${n - base * base}/${base * base}) ≈ ${base}(1 + ${n - base * base}/${2 * base * base}) ≈ ${formatAnswer(value)}, using √(1+x) ≈ 1 + x/2.`,
    });
  }

  if (d === 4) {
    const base = choice(rng, [2, 3, 4, 5]);
    const n = base ** 3 + randInt(rng, 1, base * 2);
    const value = parseFloat(Math.cbrt(n).toFixed(3));
    return makeQuestion({
      topic: "arithmetic",
      subtopic: "approximation",
      difficulty: d,
      prompt: `Estimate the cube root of ${n} to 2 decimal places.`,
      answer: formatAnswer(value),
      answerValue: value,
      gradingType: "numeric_tolerance",
      tolerance: 0.01,
      explanation: `${base}³ = ${base ** 3}, so ∛${n} = ${base}·∛(1 + ${n - base ** 3}/${base ** 3}) ≈ ${base}(1 + ${n - base ** 3}/${3 * base ** 3}) ≈ ${formatAnswer(value)}, using ∛(1+x) ≈ 1 + x/3.`,
    });
  }

  // L5 — compounding, where the first-order answer is visibly wrong.
  const rate = choice(rng, [3, 4, 6, 8]);
  const years = choice(rng, [5, 7, 10]);
  const value = parseFloat((((1 + rate / 100) ** years - 1) * 100).toFixed(1));
  return makeQuestion({
    topic: "arithmetic",
    subtopic: "approximation",
    difficulty: d,
    prompt: `A quantity grows ${rate}% per year for ${years} years. Estimate the total percentage growth, to within 5%.`,
    answer: formatAnswer(value),
    answerValue: value,
    gradingType: "numeric_tolerance",
    tolerance: 0.05,
    explanation: `First order gives ${rate} × ${years} = ${rate * years}%, but compounding adds more: (1 + ${rate / 100})^${years} = ${((1 + rate / 100) ** years).toFixed(3)}, i.e. ${formatAnswer(value)}%. Rule of 72 says it doubles in ~${Math.round(72 / rate)} years — use that as the sanity check.`,
  });
}

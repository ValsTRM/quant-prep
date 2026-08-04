import { makeId, type Rng } from "../rng";
import {
  type GeneratedQuestion,
  type GradingType,
  type Topic,
  modeFor,
  targetSecondsFor,
  timeoutSecondsFor,
} from "../types";

export interface QuestionSpec {
  topic: Topic;
  subtopic: string;
  difficulty: number;
  prompt: string;
  /** Canonical answer string. Defaults to the formatted `answerValue`. */
  answer?: string;
  answerValue?: number;
  explanation: string;
  gradingType?: GradingType;
  tolerance?: number;
  /** Labelled options for `choice` questions. */
  choices?: string[];
}

export function clampDifficulty(d: number): number {
  return Math.min(5, Math.max(1, Math.round(d || 1)));
}

/** Build a question, filling in mode, target time and timeout from the tables. */
export function makeQuestion(spec: QuestionSpec): GeneratedQuestion {
  const d = clampDifficulty(spec.difficulty);
  return {
    id: makeId(),
    topic: spec.topic,
    subtopic: spec.subtopic,
    difficulty: d,
    mode: modeFor(spec.subtopic),
    prompt: spec.prompt,
    answer: spec.answer ?? String(spec.answerValue ?? ""),
    answerValue: spec.answerValue,
    explanation: spec.explanation,
    gradingType: spec.gradingType ?? "numeric_tolerance",
    tolerance: spec.tolerance,
    targetSeconds: targetSecondsFor(spec.subtopic, d, spec.topic),
    timeoutSeconds: timeoutSecondsFor(spec.subtopic, d, spec.topic),
    ...(spec.choices ? { choices: spec.choices } : {}),
  };
}

/**
 * Rejection sampling. Generators use this to throw away instances that happen
 * to be far easier than their level claims — the bug that put "Convert 1/2 to a
 * decimal" on a difficulty-4 question. `build` is retried until `accept` passes;
 * after `tries` attempts the last candidate is returned so generation always
 * terminates.
 */
export function sampleUntil<T>(
  build: () => T,
  accept: (candidate: T) => boolean,
  tries = 40
): T {
  let last = build();
  for (let i = 0; i < tries; i++) {
    if (accept(last)) return last;
    last = build();
  }
  return last;
}

/** Pick from `items`, excluding anything in `banned`. Falls back to the full list. */
export function pickExcluding<T>(rng: Rng, items: readonly T[], banned: readonly T[]): T {
  const pool = items.filter((x) => !banned.includes(x));
  const from = pool.length > 0 ? pool : items;
  return from[Math.floor(rng() * from.length)];
}

/** Digits of `n`, for structural difficulty checks. */
export function digitCount(n: number): number {
  return String(Math.abs(Math.trunc(n))).length;
}

/** How many column carries an addition needs — a proxy for real difficulty. */
export function carryCount(terms: number[]): number {
  let carries = 0;
  let carry = 0;
  const maxDigits = Math.max(...terms.map(digitCount));
  for (let place = 0; place < maxDigits; place++) {
    const p = 10 ** place;
    const columnSum =
      terms.reduce((s, t) => s + (Math.floor(Math.abs(t) / p) % 10), 0) + carry;
    carry = Math.floor(columnSum / 10);
    if (carry > 0) carries++;
  }
  return carries;
}

/** How many column borrows `a - b` needs. */
export function borrowCount(a: number, b: number): number {
  let borrows = 0;
  let borrow = 0;
  const digits = digitCount(a);
  for (let place = 0; place < digits; place++) {
    const p = 10 ** place;
    const top = (Math.floor(a / p) % 10) - borrow;
    const bottom = Math.floor(b / p) % 10;
    if (top < bottom) {
      borrows++;
      borrow = 1;
    } else {
      borrow = 0;
    }
  }
  return borrows;
}

/** True for operands that make a question trivial regardless of magnitude. */
export function isTrivialOperand(n: number): boolean {
  const a = Math.abs(n);
  return a <= 2 || a === 10 || a === 11 || a === 100 || a === 1000 || a % 100 === 0;
}

export function round2(x: number): number {
  return parseFloat(x.toFixed(2));
}

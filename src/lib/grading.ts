import type { GeneratedQuestion } from "./types";

/**
 * Parse a user-entered numeric answer. Accepts:
 *   "12", "-3.5", "1,234", "$40", "75%", "3/4", "1 1/2"
 * Returns null if it can't be interpreted as a number.
 */
export function parseNumericAnswer(raw: string): number | null {
  if (raw == null) return null;
  let s = raw.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/[$,\s]/g, (m) => (m === " " ? " " : ""));
  s = s.replace(/%$/, "");
  s = s.trim();

  // Mixed number: "1 1/2"
  const mixed = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    const whole = parseInt(mixed[1], 10);
    const num = parseInt(mixed[2], 10);
    const den = parseInt(mixed[3], 10);
    if (den === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    return whole + sign * (num / den);
  }

  // Simple fraction: "3/4"
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const den = parseFloat(frac[2]);
    if (den === 0) return null;
    return parseFloat(frac[1]) / den;
  }

  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export interface GradeResult {
  correct: boolean;
  /** What the user's input parsed to, when numeric. */
  parsedValue: number | null;
}

const EXACT_EPSILON = 1e-6;
const DEFAULT_REL_TOLERANCE = 0.02;
const ABS_TOLERANCE_FLOOR = 0.01;

/**
 * Grade a submitted answer. `self_grade` questions cannot be auto-graded and
 * always return correct: false here — callers should use the user's own verdict.
 */
export function gradeAnswer(
  question: Pick<GeneratedQuestion, "gradingType" | "answer" | "answerValue" | "tolerance">,
  userInput: string
): GradeResult {
  if (question.gradingType === "self_grade") {
    return { correct: false, parsedValue: parseNumericAnswer(userInput) };
  }

  // Choice questions ("A" or "B") — accept the letter in any case, with or
  // without punctuation.
  if (question.gradingType === "choice") {
    const normalise = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    return {
      correct: normalise(userInput) === normalise(question.answer),
      parsedValue: null,
    };
  }

  const expected =
    question.answerValue !== undefined
      ? question.answerValue
      : parseNumericAnswer(question.answer);

  const parsed = parseNumericAnswer(userInput);

  // Non-numeric expected answer: fall back to case-insensitive string match.
  if (expected === null || expected === undefined) {
    const correct =
      userInput.trim().toLowerCase() === question.answer.trim().toLowerCase();
    return { correct, parsedValue: parsed };
  }

  if (parsed === null) return { correct: false, parsedValue: null };

  if (question.gradingType === "exact") {
    return { correct: Math.abs(parsed - expected) < EXACT_EPSILON, parsedValue: parsed };
  }

  const rel = question.tolerance ?? DEFAULT_REL_TOLERANCE;
  const allowed = Math.max(ABS_TOLERANCE_FLOOR, rel * Math.abs(expected));
  return { correct: Math.abs(parsed - expected) <= allowed, parsedValue: parsed };
}

/** Format a numeric answer for display (trim floating point noise). */
export function formatAnswer(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(parseFloat(value.toFixed(4)));
}

/* ------------------------------ self-grading ------------------------------- */

/**
 * Self-graded questions used to be free points: the recorded diagnostic has
 * three answers submitted **blank in 4-6 seconds** and marked correct. Claiming
 * credit now requires having actually written something, and having spent a
 * plausible amount of time on it.
 */
export const SELF_GRADE_MIN_SECONDS = 8;
export const SELF_GRADE_MIN_CHARS = 3;
/** Fermi answers are correct within this factor of the reference. */
export const FERMI_FACTOR = 2;

export interface SelfGradeCheck {
  /** May the user mark this correct at all? */
  allowed: boolean;
  /** Why not, when they can't. */
  reason: string | null;
  /**
   * When a numeric estimate was entered and a reference exists, whether it is
   * inside the factor-of-2 band. `null` when there is nothing to check.
   */
  withinFactor: boolean | null;
}

export function checkSelfGrade(
  question: Pick<GeneratedQuestion, "answerValue" | "subtopic">,
  userInput: string,
  timeSeconds: number
): SelfGradeCheck {
  const text = (userInput ?? "").trim();
  if (text.length < SELF_GRADE_MIN_CHARS) {
    return {
      allowed: false,
      reason: "Write your estimate and how you decomposed it before scoring yourself.",
      withinFactor: null,
    };
  }
  if (timeSeconds < SELF_GRADE_MIN_SECONDS) {
    return {
      allowed: false,
      reason: `Answered in ${Math.round(timeSeconds)}s — too fast to have worked it through. This one counts as a miss.`,
      withinFactor: null,
    };
  }

  const reference = question.answerValue;
  if (!reference || reference <= 0) return { allowed: true, reason: null, withinFactor: null };

  // Estimation answers are prose plus a number ("about 8 million, from 16/min ×
  // 60 × 24 × 365"). Reading only the first token would score that as "8", so
  // every number in the text is considered and the closest one is graded.
  const candidates = extractQuantities(text);
  if (candidates.length === 0) return { allowed: true, reason: null, withinFactor: null };

  const best = Math.min(
    ...candidates.map((v) => (v > reference ? v / reference : reference / v))
  );
  return { allowed: true, reason: null, withinFactor: best <= FERMI_FACTOR };
}

/**
 * Anchored at both ends on purpose: a prefix match would read "breaths" as
 * "billion" and "min" as "million", inflating an answer by nine orders of
 * magnitude.
 */
const MAGNITUDES: [RegExp, number][] = [
  [/^(k|thousand)s?$/i, 1e3],
  [/^(m|mm|million)s?$/i, 1e6],
  [/^(b|bn|billion)s?$/i, 1e9],
  [/^(t|tn|trillion)s?$/i, 1e12],
];

/**
 * Every positive quantity mentioned in a free-text answer, with `k`/`million`/
 * `bn` style suffixes and `10^9` / `1e9` / `3x10^9` forms applied.
 */
export function extractQuantities(text: string): number[] {
  const out: number[] = [];

  // Scientific-ish forms first: 3e9, 3 x 10^9, 10^9.
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:[x×*]\s*)?10\s*[\^]\s*(-?\d+)/gi)) {
    out.push(parseFloat(m[1]) * 10 ** parseInt(m[2], 10));
  }
  for (const m of text.matchAll(/(?<![\d.])10\s*[\^]\s*(-?\d+)/g)) {
    out.push(10 ** parseInt(m[1], 10));
  }
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)e(-?\d+)/gi)) {
    out.push(parseFloat(m[1]) * 10 ** parseInt(m[2], 10));
  }

  // Plain numbers, with an optional magnitude word or letter after them.
  for (const m of text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*([a-zA-Z]*)/g)) {
    const base = parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(base) || base <= 0) continue;
    const suffix = m[2] ?? "";
    const mag = MAGNITUDES.find(([re]) => re.test(suffix));
    out.push(mag ? base * mag[1] : base);
  }

  return out.filter((v) => Number.isFinite(v) && v > 0);
}

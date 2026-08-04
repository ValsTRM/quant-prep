import {
  type QuestionMode,
  type Topic,
  TOPIC_TARGET_SECONDS,
  modeFor,
  targetSecondsFor,
  timeoutSecondsFor,
} from "./types";

/**
 * The minimum shape of a graded attempt that everything downstream scores from.
 * `subtopic` + `difficulty` let speed be regraded against the CURRENT target
 * table, so tightening the standard re-scores history too.
 */
export interface AttemptLike {
  topic: string;
  isCorrect: boolean;
  timeSeconds: number;
  targetSeconds: number;
  createdAt: number; // ms epoch
  subtopic?: string;
  difficulty?: number;
  mode?: string;
  timedOut?: boolean;
  sessionId?: string | null;
  errorType?: string | null;
}

/** The standard an attempt is held to today. */
export function currentTargetFor(a: AttemptLike, topic?: Topic): number {
  const t = (topic ?? (a.topic as Topic)) as Topic;
  if (a.subtopic && a.difficulty) {
    return targetSecondsFor(a.subtopic, a.difficulty, t);
  }
  return a.targetSeconds || TOPIC_TARGET_SECONDS[t] || 30;
}

export function currentTimeoutFor(a: AttemptLike, topic?: Topic): number {
  const t = (topic ?? (a.topic as Topic)) as Topic;
  if (a.subtopic && a.difficulty) {
    return timeoutSecondsFor(a.subtopic, a.difficulty, t);
  }
  return Math.round(currentTargetFor(a, t) * 3);
}

export function attemptMode(a: AttemptLike): QuestionMode {
  if (a.mode === "rapid" || a.mode === "interview") return a.mode;
  return a.subtopic ? modeFor(a.subtopic) : "interview";
}

/**
 * Credit ladder for a correct answer, by how far over target it ran.
 * This one table drives session points, the speed term in proficiency, and the
 * calibration report — there is deliberately only one clock standard in the app.
 */
export const TIME_CREDIT_TIERS: { maxRatio: number; credit: number; label: string }[] = [
  { maxRatio: 1.0, credit: 1.0, label: "within target" },
  { maxRatio: 1.25, credit: 0.85, label: "1.00–1.25× target" },
  { maxRatio: 1.5, credit: 0.65, label: "1.25–1.50× target" },
  { maxRatio: 2.0, credit: 0.35, label: "1.50–2.00× target" },
  { maxRatio: Infinity, credit: 0.1, label: "over 2× target" },
];

/**
 * A wrong answer in a timed screen costs you — real screens are scored net of
 * errors, so guessing to beat the clock has to be a losing strategy. In
 * interview mode a wrong answer simply earns nothing.
 */
export const WRONG_ANSWER_CREDIT: Record<QuestionMode, number> = {
  rapid: -0.25,
  interview: 0,
};

/** Credit multiplier for a correct answer that took `ratio` × its target time. */
export function timeCredit(ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  for (const tier of TIME_CREDIT_TIERS) {
    if (ratio <= tier.maxRatio) return tier.credit;
  }
  return TIME_CREDIT_TIERS[TIME_CREDIT_TIERS.length - 1].credit;
}

/** Did this attempt blow through the hard cut-off? */
export function isTimeout(a: AttemptLike): boolean {
  if (a.timedOut) return true;
  return a.timeSeconds >= currentTimeoutFor(a);
}

/**
 * Credit for one attempt, in [-0.25, 1]:
 *   timeout           →  0
 *   wrong (rapid)     → -0.25
 *   wrong (interview) →  0
 *   correct           → the time ladder above
 */
export function attemptCredit(a: AttemptLike): number {
  if (isTimeout(a)) return 0;
  if (!a.isCorrect) return WRONG_ANSWER_CREDIT[attemptMode(a)];
  const target = currentTargetFor(a);
  return timeCredit(Math.max(a.timeSeconds, 0.5) / Math.max(target, 1));
}

/** Speed credit alone (ignores correctness) — the 30% proficiency component. */
export function speedCredit(a: AttemptLike): number {
  if (isTimeout(a)) return 0;
  const target = currentTargetFor(a);
  return timeCredit(Math.max(a.timeSeconds, 0.5) / Math.max(target, 1));
}

/** True when the answer was both right and inside the target time. */
export function isCleanSolve(a: AttemptLike): boolean {
  return a.isCorrect && !isTimeout(a) && a.timeSeconds <= currentTargetFor(a);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

import {
  TOPICS,
  type Topic,
  type TopicProficiency,
  capForPassedLevel,
} from "./types";
import {
  type AttemptLike,
  attemptCredit,
  currentTargetFor,
  isCleanSolve,
  isTimeout,
  median,
  speedCredit,
} from "./credit";

export type { AttemptLike } from "./credit";
export { currentTargetFor } from "./credit";

/** How many recent attempts per topic the score is computed over. */
const RECENT_WINDOW = 30;
/** How far back evidence for "passed this level" may be drawn from. */
const EVIDENCE_WINDOW = 120;
const MS_PER_DAY = 86_400_000;

/* --------------------------- advancement evidence -------------------------- */

/** All four are required, per topic, before a level counts as passed. */
export const ADVANCEMENT = {
  minQuestions: 20,
  minSessions: 2,
  minAccuracy: 0.85,
  /** Median of (time ÷ target) must be at or below this. */
  maxMedianTimeRatio: 1.0,
} as const;

/** Any one of these holds or reduces the difficulty you're served. */
export const HOLD_RULES = {
  minAccuracy: 0.7,
  maxTimeoutRate: 0.15,
  maxMedianTimeRatio: 1.5,
  /** A single error type dominating recent misses means drill, not advance. */
  repeatedErrorShare: 0.4,
  repeatedErrorMin: 3,
  /** Don't judge on noise. */
  minSample: 8,
} as const;

/**
 * Difficulty weights for the accuracy component. A perfect run of Foundation
 * questions is worth 0.45, not 1.0 — this is what stops warm-ups from reading as
 * mastery, independently of the hard cap.
 */
export const DIFFICULTY_WEIGHT: Record<number, number> = {
  1: 0.45,
  2: 0.62,
  3: 0.78,
  4: 0.92,
  5: 1.0,
};

export function difficultyWeight(d: number): number {
  return DIFFICULTY_WEIGHT[Math.min(5, Math.max(1, Math.round(d || 1)))];
}

export interface LevelEvidence {
  level: number;
  questions: number;
  sessions: number;
  accuracy: number;
  medianTimeRatio: number;
  passed: boolean;
  /** Which requirements are not yet met. */
  missing: string[];
}

function timeRatio(a: AttemptLike): number {
  return Math.max(a.timeSeconds, 0.5) / Math.max(currentTargetFor(a), 1);
}

/**
 * Evidence that a topic has been passed at `level`. Attempts at any difficulty
 * at or above `level` count — crushing level 4 is also evidence for level 3.
 */
export function levelEvidence(attempts: AttemptLike[], level: number): LevelEvidence {
  const at = attempts.filter((a) => (a.difficulty ?? 1) >= level);
  const questions = at.length;
  const sessions = new Set(at.map((a) => a.sessionId ?? "—")).size;
  const accuracy = questions > 0 ? at.filter((a) => a.isCorrect).length / questions : 0;
  const medianTimeRatio = questions > 0 ? median(at.map(timeRatio)) : Infinity;

  const missing: string[] = [];
  if (questions < ADVANCEMENT.minQuestions)
    missing.push(`${questions}/${ADVANCEMENT.minQuestions} questions`);
  if (sessions < ADVANCEMENT.minSessions)
    missing.push(`${sessions}/${ADVANCEMENT.minSessions} sessions`);
  if (accuracy < ADVANCEMENT.minAccuracy)
    missing.push(`${Math.round(accuracy * 100)}% accuracy (need 85%)`);
  if (medianTimeRatio > ADVANCEMENT.maxMedianTimeRatio)
    missing.push(
      `median ${medianTimeRatio === Infinity ? "—" : medianTimeRatio.toFixed(2)}× target (need ≤ 1.00×)`
    );

  return {
    level,
    questions,
    sessions,
    accuracy,
    medianTimeRatio,
    passed: missing.length === 0,
    missing,
  };
}

/** Highest difficulty with enough evidence behind it. 0 means none. */
export function highestPassedLevel(attempts: AttemptLike[]): number {
  for (let level = 5; level >= 1; level--) {
    if (levelEvidence(attempts, level).passed) return level;
  }
  return 0;
}

export interface HoldAssessment {
  hold: boolean;
  reason: string | null;
}

/** Should difficulty be held back or reduced? */
export function holdAssessment(attempts: AttemptLike[]): HoldAssessment {
  if (attempts.length < HOLD_RULES.minSample) return { hold: false, reason: null };

  const accuracy = attempts.filter((a) => a.isCorrect).length / attempts.length;
  if (accuracy < HOLD_RULES.minAccuracy) {
    return { hold: true, reason: `accuracy ${Math.round(accuracy * 100)}% is under 70%` };
  }

  const timeoutRate = attempts.filter(isTimeout).length / attempts.length;
  if (timeoutRate > HOLD_RULES.maxTimeoutRate) {
    return { hold: true, reason: `${Math.round(timeoutRate * 100)}% of answers time out` };
  }

  const medianRatio = median(attempts.map(timeRatio));
  if (medianRatio > HOLD_RULES.maxMedianTimeRatio) {
    return { hold: true, reason: `median time is ${medianRatio.toFixed(2)}× target` };
  }

  const misses = attempts.filter((a) => !a.isCorrect && a.errorType);
  if (misses.length > 0) {
    const counts = new Map<string, number>();
    for (const m of misses) counts.set(m.errorType!, (counts.get(m.errorType!) ?? 0) + 1);
    for (const [type, n] of counts) {
      if (n >= HOLD_RULES.repeatedErrorMin && n / misses.length >= HOLD_RULES.repeatedErrorShare) {
        return { hold: true, reason: `"${type}" errors keep repeating (${n} of ${misses.length} misses)` };
      }
    }
  }

  return { hold: false, reason: null };
}

/* ------------------------------- proficiency ------------------------------- */

/** Component breakdown, exposed so the UI can explain a score. */
export interface ProficiencyBreakdown {
  difficultyAdjustedAccuracy: number; // 0-1
  speed: number; // 0-1
  level: number; // 0-1
  consistency: number; // 0-1
  trend: number; // 0-1
  staleness: number; // multiplier, 0.75-1
  rawScore: number; // 0-100 before the cap
}

export const PROFICIENCY_WEIGHTS = {
  difficultyAdjustedAccuracy: 0.35,
  speed: 0.3,
  level: 0.2,
  consistency: 0.1,
  trend: 0.05,
} as const;

/**
 * Idle decay. Replaces the old flat "+10 for practising today" bonus, which paid
 * out for showing up rather than for knowing anything.
 */
function stalenessMultiplier(daysIdle: number): number {
  if (daysIdle <= 3) return 1;
  if (daysIdle >= 30) return 0.75;
  return 1 - (0.25 * (daysIdle - 3)) / 27;
}

/**
 * Topic proficiency, 0-100:
 *   35% difficulty-adjusted accuracy
 *   30% speed vs target (the shared time-credit ladder)
 *   20% highest reliably passed difficulty
 *   10% consistency (streak of correct AND on-time)
 *    5% recent trend
 * then a staleness multiplier, then a hard cap set by the highest level passed.
 */
export function computeTopicProficiency(
  topic: Topic,
  attempts: AttemptLike[], // newest first, already filtered to this topic
  now: number
): TopicProficiency {
  if (attempts.length === 0) {
    return {
      topic,
      proficiency: 0,
      accuracy: 0,
      avgTimeSeconds: 0,
      attemptCount: 0,
      lastPracticedAt: null,
      untested: true,
      passedLevel: 0,
      cap: capForPassedLevel(0),
      cappedBy: false,
      recommendedDifficulty: 2,
      holdReason: null,
    };
  }

  const recent = attempts.slice(0, RECENT_WINDOW);
  const evidence = attempts.slice(0, EVIDENCE_WINDOW);
  const accuracy = recent.filter((a) => a.isCorrect).length / recent.length;

  // 35% — difficulty-adjusted accuracy. Being right on a Foundation question is
  // worth 0.45 of being right on an Interview-integration one.
  const difficultyAdjustedAccuracy =
    recent.reduce((s, a) => s + (a.isCorrect ? difficultyWeight(a.difficulty ?? 1) : 0), 0) /
    recent.length;

  // 30% — speed, on the same ladder that scores points.
  const speed = recent.reduce((s, a) => s + speedCredit(a), 0) / recent.length;

  // 20% — highest level with real evidence behind it.
  const passedLevel = highestPassedLevel(evidence);
  const levelComponent = passedLevel / 5;

  // 10% — consecutive clean solves (right AND inside target), counting back.
  let streak = 0;
  for (const a of recent) {
    if (isCleanSolve(a)) streak++;
    else break;
  }
  const consistency = Math.min(streak, 8) / 8;

  // 5% — is credit improving? Most recent third against the rest.
  let trend = 0.5;
  if (recent.length >= 9) {
    const cut = Math.floor(recent.length / 3);
    const newer = recent.slice(0, cut);
    const older = recent.slice(cut);
    const mean = (xs: AttemptLike[]) => xs.reduce((s, a) => s + attemptCredit(a), 0) / xs.length;
    const delta = mean(newer) - mean(older);
    trend = Math.min(1, Math.max(0, 0.5 + delta / 0.6));
  }

  const rawScore =
    100 *
    (PROFICIENCY_WEIGHTS.difficultyAdjustedAccuracy * difficultyAdjustedAccuracy +
      PROFICIENCY_WEIGHTS.speed * speed +
      PROFICIENCY_WEIGHTS.level * levelComponent +
      PROFICIENCY_WEIGHTS.consistency * consistency +
      PROFICIENCY_WEIGHTS.trend * trend);

  const daysIdle = (now - recent[0].createdAt) / MS_PER_DAY;
  const staleness = stalenessMultiplier(daysIdle);
  const cap = capForPassedLevel(passedLevel);
  const decayed = rawScore * staleness;
  const proficiency = Math.max(0, Math.min(cap, Math.round(decayed)));

  // Work one level above what's actually been proven. With nothing proven yet,
  // probe at 2 rather than farming Foundation reps. A firing hold rule drops
  // you back a level until the underlying problem clears.
  const hold = holdAssessment(recent);
  const base = passedLevel > 0 ? passedLevel + 1 : 2;
  const recommendedDifficulty = Math.min(5, Math.max(1, hold.hold ? base - 1 : base));

  const avgTimeSeconds = recent.reduce((s, a) => s + a.timeSeconds, 0) / recent.length;

  return {
    topic,
    proficiency,
    accuracy,
    avgTimeSeconds: parseFloat(avgTimeSeconds.toFixed(1)),
    attemptCount: attempts.length,
    lastPracticedAt: recent[0].createdAt,
    untested: false,
    passedLevel,
    cap,
    cappedBy: Math.round(decayed) > cap,
    recommendedDifficulty,
    holdReason: hold.reason,
  };
}

/** The component breakdown behind a topic's score, for the progress page. */
export function proficiencyBreakdown(
  attempts: AttemptLike[],
  now: number
): ProficiencyBreakdown {
  const recent = attempts.slice(0, RECENT_WINDOW);
  if (recent.length === 0) {
    return {
      difficultyAdjustedAccuracy: 0,
      speed: 0,
      level: 0,
      consistency: 0,
      trend: 0.5,
      staleness: 1,
      rawScore: 0,
    };
  }
  const difficultyAdjustedAccuracy =
    recent.reduce((s, a) => s + (a.isCorrect ? difficultyWeight(a.difficulty ?? 1) : 0), 0) /
    recent.length;
  const speed = recent.reduce((s, a) => s + speedCredit(a), 0) / recent.length;
  const level = highestPassedLevel(attempts.slice(0, EVIDENCE_WINDOW)) / 5;
  let streak = 0;
  for (const a of recent) {
    if (isCleanSolve(a)) streak++;
    else break;
  }
  const consistency = Math.min(streak, 8) / 8;
  let trend = 0.5;
  if (recent.length >= 9) {
    const cut = Math.floor(recent.length / 3);
    const mean = (xs: AttemptLike[]) => xs.reduce((s, a) => s + attemptCredit(a), 0) / xs.length;
    trend = Math.min(1, Math.max(0, 0.5 + (mean(recent.slice(0, cut)) - mean(recent.slice(cut))) / 0.6));
  }
  const staleness = stalenessMultiplier((now - recent[0].createdAt) / MS_PER_DAY);
  const rawScore =
    100 *
    (PROFICIENCY_WEIGHTS.difficultyAdjustedAccuracy * difficultyAdjustedAccuracy +
      PROFICIENCY_WEIGHTS.speed * speed +
      PROFICIENCY_WEIGHTS.level * level +
      PROFICIENCY_WEIGHTS.consistency * consistency +
      PROFICIENCY_WEIGHTS.trend * trend);
  return { difficultyAdjustedAccuracy, speed, level, consistency, trend, staleness, rawScore };
}

/** Proficiency for every topic. `attempts` is all attempts, newest first. */
export function computeAllProficiencies(
  attempts: AttemptLike[],
  now: number
): TopicProficiency[] {
  return TOPICS.map((topic) =>
    computeTopicProficiency(
      topic,
      attempts.filter((a) => a.topic === topic),
      now
    )
  );
}

/** Weakest topics first: untested counts as weakest. */
export function weakestTopics(proficiencies: TopicProficiency[], n: number): TopicProficiency[] {
  return [...proficiencies].sort((a, b) => a.proficiency - b.proficiency).slice(0, n);
}

/**
 * The difficulty to serve next for a topic. Work one level above what you have
 * actually proven; hold at the proven level while a hold rule is firing.
 */
export function difficultyForTopic(p: TopicProficiency | undefined): number {
  if (!p || p.untested) return 2;
  return p.recommendedDifficulty;
}

/**
 * Legacy shape: suggested difficulty from a bare proficiency number. Kept for
 * callers that only have the score. Bands mirror the level caps, so a topic
 * sitting at its cap is served the next level up.
 */
export function difficultyFor(proficiency: number, untested: boolean): number {
  if (untested) return 2;
  if (proficiency <= 40) return 2; // nothing proven, or Foundation only
  if (proficiency <= 60) return 3; // Basic screening passed
  if (proficiency <= 75) return 4; // Competitive screening passed
  return 5; // Advanced screening passed
}

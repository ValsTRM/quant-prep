import {
  TOPIC_LABELS,
  type Topic,
  type TopicProficiency,
  targetSecondsFor,
} from "./types";
import {
  type AttemptLike,
  attemptCredit,
  attemptMode,
  currentTargetFor,
  isCleanSolve,
  isTimeout,
  median,
} from "./credit";

/* ---------------------------------- points --------------------------------- */

export interface ScorableAttempt extends AttemptLike {
  subtopic?: string;
  difficulty?: number;
}

/**
 * Points for one answered question: 10 × difficulty × credit, where credit is
 * the shared time ladder (full inside target, decaying to 10% past 2× target,
 * zero on a timeout, negative for a wrong answer in a timed screen).
 *
 * There is no speed bonus above 1.0 — beating the clock earns full credit, and
 * that is the reward. The old formula paid up to 1.5× for rushing and floored
 * slow answers at 0.4×, which is why a 15×-over-target answer still scored.
 */
export function questionPoints(a: ScorableAttempt): number {
  return Math.round(10 * (a.difficulty || 1) * attemptCredit(a));
}

/** Maximum points a question could have earned (for "234 / 310 pts" displays). */
export function questionMaxPoints(difficulty: number): number {
  return 10 * (difficulty || 1);
}

export function sessionScore(attempts: ScorableAttempt[]): { earned: number; possible: number } {
  return {
    earned: attempts.reduce((s, a) => s + questionPoints(a), 0),
    possible: attempts.reduce((s, a) => s + questionMaxPoints(a.difficulty || 1), 0),
  };
}

/** How a session's questions landed against the clock — for the summary card. */
export interface PaceBreakdown {
  onTime: number;
  slightlySlow: number; // 1.00–1.50× target
  verySlow: number; // 1.50×+ target
  timedOut: number;
  wrong: number;
  medianTimeRatio: number;
}

export function paceBreakdown(attempts: ScorableAttempt[]): PaceBreakdown {
  const out: PaceBreakdown = {
    onTime: 0,
    slightlySlow: 0,
    verySlow: 0,
    timedOut: 0,
    wrong: 0,
    medianTimeRatio: 0,
  };
  const ratios: number[] = [];
  for (const a of attempts) {
    ratios.push(Math.max(a.timeSeconds, 0.5) / Math.max(currentTargetFor(a), 1));
    if (isTimeout(a)) out.timedOut++;
    else if (!a.isCorrect) out.wrong++;
    else if (isCleanSolve(a)) out.onTime++;
    else if (a.timeSeconds <= currentTargetFor(a) * 1.5) out.slightlySlow++;
    else out.verySlow++;
  }
  out.medianTimeRatio = parseFloat(median(ratios).toFixed(2));
  return out;
}

export { attemptCredit, attemptMode, isTimeout };

/* ----------------------------- readiness score ----------------------------- */

/**
 * Quant Readiness Score, 0-1000: the mean of all eight topic proficiencies
 * × 10. Untested topics count as zero, so coverage matters as much as depth.
 */
export function readinessScore(proficiencies: TopicProficiency[]): number {
  if (proficiencies.length === 0) return 0;
  const avg = proficiencies.reduce((s, p) => s + p.proficiency, 0) / proficiencies.length;
  return Math.round(avg * 10);
}

export interface Level {
  name: string;
  floor: number;
}

export const LEVELS: Level[] = [
  { name: "Foundations", floor: 0 },
  { name: "Building", floor: 200 },
  { name: "Consistent", floor: 350 },
  { name: "Sharp", floor: 500 },
  { name: "Interview-Ready", floor: 650 },
  { name: "Desk-Ready", floor: 800 },
];

export interface LevelStatus {
  name: string;
  floor: number;
  next: Level | null;
  /** 0-1 progress from this level's floor to the next level's floor. */
  progressToNext: number;
}

export function levelFor(qrs: number): LevelStatus {
  let current = LEVELS[0];
  for (const l of LEVELS) if (qrs >= l.floor) current = l;
  const idx = LEVELS.indexOf(current);
  const next = idx + 1 < LEVELS.length ? LEVELS[idx + 1] : null;
  const progressToNext = next
    ? Math.min(1, Math.max(0, (qrs - current.floor) / (next.floor - current.floor)))
    : 1;
  return { name: current.name, floor: current.floor, next, progressToNext };
}

/* -------------------------------- weekly goals ----------------------------- */

export interface Goal {
  key: string;
  label: string;
  detail: string;
  /** Current value and target, in the goal's own unit. */
  current: number;
  target: number;
  /** 0-1 for progress bars. */
  progress: number;
  unit: "questions" | "percent" | "proficiency";
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Rolling-week goals: volume, accuracy, beating the clock, and lifting the
 * two weakest topics. Recomputed live, so progress moves as you practice.
 */
export function weeklyGoals(
  attemptsThisWeek: ScorableAttempt[],
  proficiencies: TopicProficiency[]
): Goal[] {
  const goals: Goal[] = [];

  const volumeTarget = 100;
  goals.push({
    key: "volume",
    label: `Answer ${volumeTarget} questions`,
    detail: "rolling 7 days — volume builds speed",
    current: attemptsThisWeek.length,
    target: volumeTarget,
    progress: clamp01(attemptsThisWeek.length / volumeTarget),
    unit: "questions",
  });

  const correct = attemptsThisWeek.filter((a) => a.isCorrect);
  const accuracy = attemptsThisWeek.length > 0 ? correct.length / attemptsThisWeek.length : 0;
  goals.push({
    key: "accuracy",
    label: "Hold 85%+ accuracy",
    detail: `currently ${Math.round(accuracy * 100)}% over ${attemptsThisWeek.length} questions — 85% is the bar for advancing a level`,
    current: Math.round(accuracy * 100),
    target: 85,
    progress: clamp01(accuracy / 0.85),
    unit: "percent",
  });

  // Clean solves: right AND inside target. Measured over every attempt, not just
  // the correct ones — otherwise slow-and-wrong answers vanish from the denominator.
  const clean = attemptsThisWeek.filter(isCleanSolve).length;
  const cleanRate = attemptsThisWeek.length > 0 ? clean / attemptsThisWeek.length : 0;
  goals.push({
    key: "speed",
    label: "Clean-solve 60% of questions",
    detail: `currently ${Math.round(cleanRate * 100)}% answered correctly and inside target time`,
    current: Math.round(cleanRate * 100),
    target: 60,
    progress: clamp01(cleanRate / 0.6),
    unit: "percent",
  });

  const weakest = [...proficiencies].sort((a, b) => a.proficiency - b.proficiency).slice(0, 2);
  for (const p of weakest) {
    const target = Math.min(100, (Math.floor(p.proficiency / 5) + 2) * 5);
    goals.push({
      key: `lift-${p.topic}`,
      label: `Lift ${TOPIC_LABELS[p.topic]} to ${target}`,
      detail: p.untested ? "untested — any practice counts" : `proficiency now ${p.proficiency}`,
      current: p.proficiency,
      target,
      progress: clamp01(p.proficiency / target),
      unit: "proficiency",
    });
  }

  return goals;
}

/* --------------------------------- milestones ------------------------------ */

export interface Milestone {
  key: string;
  label: string;
  achieved: boolean;
  progress: number; // 0-1
}

export function computeMilestones(
  streak: number,
  totalAttempts: number,
  qrs: number
): Milestone[] {
  const out: Milestone[] = [];
  for (const days of [3, 7, 14, 30]) {
    out.push({
      key: `streak-${days}`,
      label: `${days}-day streak`,
      achieved: streak >= days,
      progress: clamp01(streak / days),
    });
  }
  for (const n of [100, 250, 500, 1000]) {
    out.push({
      key: `questions-${n}`,
      label: `${n} questions answered`,
      achieved: totalAttempts >= n,
      progress: clamp01(totalAttempts / n),
    });
  }
  for (const s of [250, 400, 550, 700, 850]) {
    out.push({
      key: `qrs-${s}`,
      label: `Readiness ${s}`,
      achieved: qrs >= s,
      progress: clamp01(qrs / s),
    });
  }
  return out;
}

/* ------------------------- per-question-type breakdown --------------------- */

export interface SubtopicStat {
  subtopic: string;
  topic: string;
  attempts: number;
  wrong: number;
  wrongRate: number; // 0-1
  timedOut: number;
  timeoutRate: number; // 0-1
  avgTimeSeconds: number;
  /** Mean of current targets for the shapes actually attempted. */
  avgTargetSeconds: number;
  /** median time ÷ target — >1 means slower than the standard. */
  timeRatio: number;
  /** Mean credit earned, on the shared ladder. Negative is possible in rapid mode. */
  avgCredit: number;
}

/** Aggregate attempts by question shape (subtopic) against current targets. */
export function subtopicBreakdown(attempts: ScorableAttempt[]): SubtopicStat[] {
  const groups = new Map<string, ScorableAttempt[]>();
  for (const a of attempts) {
    if (!a.subtopic) continue;
    const g = groups.get(a.subtopic) ?? [];
    g.push(a);
    groups.set(a.subtopic, g);
  }
  return [...groups.entries()].map(([subtopic, list]) => {
    const wrong = list.filter((a) => !a.isCorrect).length;
    const timedOut = list.filter(isTimeout).length;
    const avgTime = list.reduce((s, a) => s + a.timeSeconds, 0) / list.length;
    const avgTarget =
      list.reduce((s, a) => s + currentTargetFor(a, a.topic as Topic), 0) / list.length;
    const ratios = list.map(
      (a) => Math.max(a.timeSeconds, 0.5) / Math.max(1, currentTargetFor(a, a.topic as Topic))
    );
    return {
      subtopic,
      topic: list[0].topic,
      attempts: list.length,
      wrong,
      wrongRate: wrong / list.length,
      timedOut,
      timeoutRate: timedOut / list.length,
      avgTimeSeconds: parseFloat(avgTime.toFixed(1)),
      avgTargetSeconds: parseFloat(avgTarget.toFixed(1)),
      timeRatio: parseFloat(median(ratios).toFixed(2)),
      avgCredit: parseFloat(
        (list.reduce((s, a) => s + attemptCredit(a), 0) / list.length).toFixed(2)
      ),
    };
  });
}

export { targetSecondsFor };

export type Topic =
  | "arithmetic"
  | "fractions"
  | "percentages"
  | "expected-value"
  | "probability"
  | "conditional-probability"
  | "market-making"
  | "estimation";

export const TOPICS: Topic[] = [
  "arithmetic",
  "fractions",
  "percentages",
  "expected-value",
  "probability",
  "conditional-probability",
  "market-making",
  "estimation",
];

export const TOPIC_LABELS: Record<Topic, string> = {
  arithmetic: "Raw arithmetic",
  fractions: "Fractions & decimals",
  percentages: "Percentages",
  "expected-value": "Expected value",
  probability: "Probability",
  "conditional-probability": "Conditional probability",
  "market-making": "Market making",
  estimation: "Estimation & calibration",
};

/**
 * Two question modes with two different clocks.
 *
 * `rapid` models a timed arithmetic screen: reading time is on the clock, targets
 * are single-digit seconds, and a wrong answer costs you (screens are scored net).
 * `interview` models a conversation: arithmetic embedded in a decision, tens of
 * seconds to minutes, and a wrong answer costs nothing beyond the missing credit.
 */
/**
 * The two programmes. They are scored differently on purpose: mental math is
 * measured on speed and accuracy against a clock, the Green Book on ground
 * covered and problems solved. Rolling them into one number would hide which of
 * the two is actually moving.
 */
export type TrackId = "mental-math" | "green-book";

export const TRACKS: TrackId[] = ["mental-math", "green-book"];

export const TRACK_LABELS: Record<TrackId, string> = {
  "mental-math": "Mental math",
  "green-book": "Green Book",
};

export type QuestionMode = "rapid" | "interview";

export const MODE_LABELS: Record<QuestionMode, string> = {
  rapid: "Rapid arithmetic",
  interview: "Interview numeracy",
};

export type GradingType = "exact" | "numeric_tolerance" | "self_grade" | "choice";

/**
 * Manual correction state for a graded attempt.
 *   `0` — the auto-grade stands
 *   `1` — forced correct (the grader was wrong, or the input was just formatted
 *         in a way it didn't accept)
 *  `-1` — forced wrong (undoing a self-score you don't stand behind)
 *
 * An override edits the *effective* verdict only. The original auto-grade is kept
 * alongside it, so nothing is ever lost and the change can always be reverted.
 * It does not touch the clock: an answer past the cut-off still scores zero.
 */
export type OverrideState = 0 | 1 | -1;

export function isOverrideState(x: unknown): x is OverrideState {
  return x === 0 || x === 1 || x === -1;
}

export type ErrorType =
  | "arithmetic"
  | "setup"
  | "counting"
  | "conditioning"
  | "expected value"
  | "careless"
  | "speed"
  | "concept"
  | "explanation";

export const ERROR_TYPES: ErrorType[] = [
  "arithmetic",
  "setup",
  "counting",
  "conditioning",
  "expected value",
  "careless",
  "speed",
  "concept",
  "explanation",
];

export interface GeneratedQuestion {
  id: string;
  topic: Topic;
  subtopic: string;
  difficulty: number; // 1-5
  /** Which clock and which penalty regime this question is scored under. */
  mode: QuestionMode;
  prompt: string;
  /** Canonical answer as a string (numeric answers use plain decimal form). */
  answer: string;
  /** Numeric value of the answer when applicable. */
  answerValue?: number;
  explanation: string;
  gradingType: GradingType;
  /** Relative tolerance for numeric_tolerance grading (fraction, e.g. 0.02). */
  tolerance?: number;
  /** Labelled options for `choice` questions; `answer` is the letter, e.g. "B". */
  choices?: string[];
  /** Target solve time in seconds, used for speed scoring. */
  targetSeconds: number;
  /** Hard cut-off. Answering past this scores zero and is recorded as a timeout. */
  timeoutSeconds: number;
}

export type PlanBucket = "weak" | "plan" | "review" | "challenge";

export interface PlanItem {
  bucket: PlanBucket;
  question: GeneratedQuestion;
  /** When this item reviews a previously missed attempt, its id. */
  reviewOfAttemptId?: string;
}

export interface AttemptRecord {
  id: string;
  sessionId: string | null;
  source: string; // 'diagnostic' | 'daily' | 'review' | 'greenbook'
  bucket: string | null;
  /** Which programme this answer belongs to. */
  track: TrackId;
  /** Green Book section slug, when track is 'green-book'. */
  sectionSlug: string | null;
  topic: string;
  subtopic: string;
  difficulty: number;
  mode: string;
  prompt: string;
  correctAnswer: string;
  explanation: string;
  userAnswer: string;
  /** Effective verdict — what every score is computed from. */
  isCorrect: boolean;
  /** What the auto-grader decided. Preserved when an override changes the verdict. */
  gradedCorrect: boolean | null;
  /** 0 = auto-graded · 1 = forced correct by hand · -1 = forced wrong by hand. */
  overridden: OverrideState;
  overriddenAt: number | null;
  timedOut: boolean;
  timeSeconds: number;
  targetSeconds: number;
  gradingType: string;
  errorType: string | null;
  resolved: boolean;
  reviewOfAttemptId: string | null;
  createdAt: number;
}

export interface TopicProficiency {
  topic: Topic;
  proficiency: number; // 0-100
  accuracy: number; // 0-1 over recent window
  avgTimeSeconds: number;
  attemptCount: number;
  lastPracticedAt: number | null;
  untested: boolean;
  /** Highest difficulty with enough evidence to count as passed (0 = none). */
  passedLevel: number;
  /** The cap `passedLevel` imposes — proficiency can never exceed it. */
  cap: number;
  /** True when proficiency is being held down by the cap rather than by scores. */
  cappedBy: boolean;
  /** Recommended next difficulty, after the hold/reduce rules. */
  recommendedDifficulty: number;
  /** Why difficulty is being held or reduced, if it is. */
  holdReason: string | null;
}

/* ------------------------------- difficulty -------------------------------- */

export interface DifficultyLevel {
  level: number;
  name: string;
  blurb: string;
  /** Proficiency ceiling when this is the highest level you have passed. */
  cap: number;
}

/**
 * Five levels that differ structurally, not just numerically. The cap is the
 * point of the ladder: clearing only warm-ups cannot produce a high score no
 * matter how fast or how accurate you are.
 */
export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    level: 1,
    name: "Foundation",
    blurb: "Single-step, friendly operands. Warm-up only.",
    cap: 40,
  },
  {
    level: 2,
    name: "Basic screening",
    blurb: "Two-step arithmetic, common percentages, reverse percentages.",
    cap: 60,
  },
  {
    level: 3,
    name: "Competitive screening",
    blurb: "Mixed representations, three-step chains, non-exact division.",
    cap: 75,
  },
  {
    level: 4,
    name: "Advanced screening",
    blurb: "Awkward percentages, missing operands with decimals, strict clock.",
    cap: 90,
  },
  {
    level: 5,
    name: "Interview integration",
    blurb: "Market quotes, break-evens, conditional updates, estimation.",
    cap: 100,
  },
];

/** Proficiency ceiling for a given highest-passed level (0 = nothing passed). */
export const NO_LEVEL_CAP = 25;

export function capForPassedLevel(passedLevel: number): number {
  if (passedLevel <= 0) return NO_LEVEL_CAP;
  const l = DIFFICULTY_LEVELS[Math.min(5, passedLevel) - 1];
  return l ? l.cap : NO_LEVEL_CAP;
}

/* ------------------------------ target times ------------------------------- */

/** Which clock each question shape runs on. */
export const SUBTOPIC_MODE: Record<string, QuestionMode> = {
  // Rapid arithmetic screening
  addition: "rapid",
  subtraction: "rapid",
  multiplication: "rapid",
  division: "rapid",
  "decimal-ops": "rapid",
  "missing-operand": "rapid",
  "sequential-arithmetic": "rapid",
  approximation: "rapid",
  "fraction-to-decimal": "rapid",
  "fraction-to-percent": "rapid",
  "representation-compare": "rapid",
  "percent-of": "rapid",
  "reverse-percent": "rapid",
  "sequential-percent": "rapid",
  // Interview numeracy
  "discrete-ev": "interview",
  "recursive-ev": "interview",
  "break-even-prob": "interview",
  "percentage-chain": "interview",
  dice: "interview",
  coins: "interview",
  cards: "interview",
  "odds-implied": "interview",
  conditional: "interview",
  bayes: "interview",
  "conditional-update": "interview",
  "fair-value": "interview",
  "market-quote": "interview",
  fermi: "interview",
  "estimation-sanity": "interview",
  oral: "interview",
};

export function modeFor(subtopic: string): QuestionMode {
  return SUBTOPIC_MODE[subtopic] ?? "interview";
}

/**
 * Target solve times in seconds per subtopic, indexed by difficulty 1-5.
 *
 * Rapid-mode rows sit inside the screening bands (L1 3-6s, L2 5-9s, L3 7-12s,
 * L4 9-16s, L5 12-20s), positioned within each band by the archetype's intrinsic
 * cost — 2-digit addition is cheaper than 2d x 2d multiplication at the same level.
 *
 * Interview-mode rows follow the per-archetype bands: simple EV 15-30s,
 * multi-outcome EV 25-45s, percentage chains 15-30s, break-even 20-45s,
 * estimation 30-90s, fair value plus a two-sided quote 45-120s.
 */
export const SUBTOPIC_TARGET_SECONDS: Record<
  string,
  [number, number, number, number, number]
> = {
  // ---- rapid arithmetic screening ----
  addition: [3, 5, 7, 10, 13],
  subtraction: [3, 5, 8, 11, 14],
  multiplication: [5, 8, 12, 16, 20],
  division: [5, 8, 12, 16, 20],
  "decimal-ops": [4, 6, 9, 13, 16],
  "missing-operand": [5, 8, 11, 15, 19],
  "sequential-arithmetic": [5, 8, 12, 16, 20],
  approximation: [5, 7, 10, 14, 18],
  "fraction-to-decimal": [3, 5, 8, 11, 14],
  "fraction-to-percent": [3, 5, 8, 11, 14],
  "representation-compare": [4, 6, 9, 12, 16],
  "percent-of": [4, 6, 9, 12, 16],
  "reverse-percent": [5, 8, 11, 15, 19],
  "sequential-percent": [6, 9, 12, 16, 20],
  // ---- interview numeracy ----
  "discrete-ev": [15, 20, 27, 35, 45],
  "recursive-ev": [20, 28, 38, 50, 65],
  "break-even-prob": [20, 26, 32, 39, 45],
  "percentage-chain": [15, 18, 22, 26, 30],
  "odds-implied": [12, 16, 20, 25, 30],
  dice: [12, 18, 25, 32, 40],
  coins: [12, 18, 25, 32, 40],
  cards: [12, 18, 25, 32, 40],
  conditional: [20, 28, 36, 45, 55],
  bayes: [30, 38, 45, 55, 65],
  "conditional-update": [25, 33, 42, 52, 65],
  "fair-value": [20, 28, 36, 45, 55],
  "market-quote": [45, 58, 72, 95, 120],
  fermi: [30, 45, 60, 75, 90],
  "estimation-sanity": [25, 35, 45, 60, 75],
  oral: [60, 60, 75, 90, 90],
};

export const SUBTOPIC_LABELS: Record<string, string> = {
  addition: "Addition",
  subtraction: "Subtraction",
  multiplication: "Multiplication",
  division: "Division",
  "decimal-ops": "Decimal operations",
  "missing-operand": "Missing operand",
  "sequential-arithmetic": "Sequential arithmetic",
  approximation: "Approximation",
  "fraction-to-decimal": "Fraction → decimal",
  "fraction-to-percent": "Fraction → percent",
  "representation-compare": "Representation comparison",
  "percent-of": "Percent of a number",
  "reverse-percent": "Reverse percentage",
  "sequential-percent": "Sequential % changes",
  "discrete-ev": "Discrete EV",
  "recursive-ev": "Recursive EV",
  "break-even-prob": "Break-even probability",
  "percentage-chain": "Percentage chain",
  "odds-implied": "Odds & implied probability",
  dice: "Dice probability",
  coins: "Coin probability",
  cards: "Card probability",
  conditional: "Conditional probability",
  bayes: "Bayes",
  "conditional-update": "Conditional update (adverse selection)",
  "fair-value": "Fair value",
  "market-quote": "Fair value + market quote",
  fermi: "Fermi estimation",
  "estimation-sanity": "Estimation sanity check",
  oral: "Oral explanation",
};

/** Per-topic fallback (used when a subtopic isn't in the table). */
export const TOPIC_TARGET_SECONDS: Record<Topic, number> = {
  arithmetic: 5,
  fractions: 4,
  percentages: 6,
  "expected-value": 20,
  probability: 15,
  "conditional-probability": 25,
  "market-making": 30,
  estimation: 40,
};

/**
 * The current target time for a question shape. Subtopic table first, then a
 * topic-scaled fallback. Callers that recompute this against history are
 * "regrading" old attempts to today's standard.
 */
export function targetSecondsFor(
  subtopic: string,
  difficulty: number,
  topic?: Topic
): number {
  const d = Math.min(5, Math.max(1, Math.round(difficulty || 1)));
  const row = SUBTOPIC_TARGET_SECONDS[subtopic];
  if (row) return row[d - 1];
  if (topic && TOPIC_TARGET_SECONDS[topic]) {
    return Math.round(TOPIC_TARGET_SECONDS[topic] * (1 + 0.3 * (d - 1)));
  }
  return 30;
}

/**
 * Hard cut-off. Rapid screening dies at 2.5x target — past that you would have
 * skipped and moved on. Interview questions get 3x, since thinking out loud is
 * the point. Answering after this scores zero and counts toward the timeout rate.
 */
export function timeoutSecondsFor(
  subtopic: string,
  difficulty: number,
  topic?: Topic
): number {
  const target = targetSecondsFor(subtopic, difficulty, topic);
  const multiplier = modeFor(subtopic) === "rapid" ? 2.5 : 3;
  return Math.max(10, Math.round(target * multiplier));
}

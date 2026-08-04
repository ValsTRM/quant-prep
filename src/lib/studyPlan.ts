import type { Topic } from "./types";

export interface StudyWeek {
  week: number;
  phase: string;
  title: string;
  topics: Topic[];
  resources: string[];
}

/**
 * 12-week chronological plan. External resources appear as references only —
 * the app never reproduces their problems.
 */
export const STUDY_PLAN: StudyWeek[] = [
  ...[1, 2].map((week) => ({
    week,
    phase: "Weeks 1-2",
    title: "Arithmetic, fractions, counting, basic expected value",
    topics: ["arithmetic", "fractions", "percentages", "expected-value"] as Topic[],
    resources: [
      "Jane Street Probability & Markets guide — arithmetic & EV basics",
      "MIT Street-Fighting Mathematics — estimation & dimensional tricks",
    ],
  })),
  ...[3, 4].map((week) => ({
    week,
    phase: "Weeks 3-4",
    title: "Conditional probability, Bayes, Green Book easy probability",
    topics: ["conditional-probability", "probability"] as Topic[],
    resources: [
      "Green Book — easy probability chapters (log sessions on /resources)",
      "Stat 110 — lectures 1-6 (conditioning, Bayes)",
    ],
  })),
  ...[5, 6].map((week) => ({
    week,
    phase: "Weeks 5-6",
    title: "Random variables, variance, confidence intervals, calibration",
    topics: ["probability", "expected-value", "estimation"] as Topic[],
    resources: [
      "Stat 110 — random variables & expectation lectures",
      "MIT 18.05 — variance, confidence intervals",
    ],
  })),
  ...[7, 8].map((week) => ({
    week,
    phase: "Weeks 7-8",
    title: "Recursion, stopping, repeated games",
    topics: ["expected-value", "conditional-probability"] as Topic[],
    resources: [
      "Green Book — expected value & stopping problems (reference only)",
      "Jane Street Probability & Markets — games & sequential decisions",
    ],
  })),
  ...[9, 10].map((week) => ({
    week,
    phase: "Weeks 9-10",
    title: "Market making, adverse selection, risk",
    topics: ["market-making", "expected-value"] as Topic[],
    resources: [
      "Jane Street Probability & Markets — market making chapters",
      "QuantGuide — timed market-making sets (log sessions on /resources)",
    ],
  })),
  ...[11, 12].map((week) => ({
    week,
    phase: "Weeks 11-12",
    title: "Mixed mocks, oral explanation, project documentation",
    topics: [
      "arithmetic",
      "percentages",
      "probability",
      "conditional-probability",
      "expected-value",
      "market-making",
    ] as Topic[],
    resources: [
      "QuantGuide — timed mixed mocks (log sessions on /resources)",
      "Record yourself explaining solutions aloud; log self-scores",
    ],
  })),
];

const MS_PER_DAY = 86_400_000;

/** Current week (1-12) given the plan start date (ms epoch). Clamped to 12. */
export function currentWeekNumber(planStartedAt: number, now: number): number {
  const days = Math.max(0, Math.floor((now - planStartedAt) / MS_PER_DAY));
  return Math.min(12, Math.floor(days / 7) + 1);
}

export function weekInfo(week: number): StudyWeek {
  return STUDY_PLAN[Math.min(12, Math.max(1, week)) - 1];
}

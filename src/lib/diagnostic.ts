import { type Rng, makeId } from "./rng";
import {
  type GeneratedQuestion,
  type Topic,
  TOPIC_LABELS,
  modeFor,
  targetSecondsFor,
  timeoutSecondsFor,
} from "./types";
import { QuestionSampler, generateMixedSet } from "./generators";

export interface DiagnosticSection {
  key: string;
  title: string;
  description: string;
  questions: GeneratedQuestion[];
  /** Sections answered by self-scoring rather than typed answers. */
  selfGraded: boolean;
}

function selfPrompt(
  topic: Topic,
  subtopic: string,
  prompt: string,
  guidance: string
): GeneratedQuestion {
  return {
    id: makeId(),
    topic,
    subtopic,
    difficulty: 3,
    mode: modeFor(subtopic),
    prompt,
    answer: "self-scored",
    explanation: guidance,
    gradingType: "self_grade",
    targetSeconds: targetSecondsFor(subtopic, 3, topic),
    timeoutSeconds: timeoutSecondsFor(subtopic, 3, topic),
  };
}

/**
 * Day-1 diagnostic. Each section ramps to level 5 so the ceiling is actually
 * probed — the old ramp stopped at 4 and every section restarted at 1, so a
 * third of the run was warm-ups. One `QuestionSampler` spans every section, so
 * nothing repeats anywhere in the diagnostic.
 */
export function buildDiagnostic(rng: Rng): DiagnosticSection[] {
  const sampler = new QuestionSampler(rng);

  /** Level for question i of n, ramping `from` → `to` inclusive. */
  const ramp = (i: number, n: number, from: number, to: number) =>
    Math.min(to, from + Math.floor((i / n) * (to - from + 1)));

  const run = (
    subtopics: string[],
    count: number,
    from: number,
    to: number
  ): GeneratedQuestion[] =>
    Array.from({ length: count }, (_, i) =>
      sampler.fromSubtopics([subtopics[i % subtopics.length]], ramp(i, count, from, to))
    );

  return [
    {
      key: "rapid-arithmetic",
      title: "Rapid arithmetic screening",
      description:
        "18 questions — +, −, ×, ÷ (exact and non-exact), decimals, missing operands, chained operations. Seconds each, not minutes.",
      questions: run(
        [
          "addition",
          "subtraction",
          "multiplication",
          "division",
          "decimal-ops",
          "missing-operand",
          "sequential-arithmetic",
        ],
        18,
        1,
        5
      ),
      selfGraded: false,
    },
    {
      key: "representations",
      title: "Fractions, decimals, percentages",
      description:
        "16 questions — conversions, percent-of, and which-is-larger comparisons across notations.",
      questions: run(
        ["fraction-to-decimal", "fraction-to-percent", "percent-of", "representation-compare"],
        16,
        1,
        5
      ),
      selfGraded: false,
    },
    {
      key: "percentage-changes",
      title: "Percentage changes",
      description: "10 questions — reverse percentages, compounding moves, and chains on a price.",
      questions: run(["reverse-percent", "sequential-percent", "percentage-chain"], 10, 2, 5),
      selfGraded: false,
    },
    {
      key: "approximation",
      title: "Approximation",
      description: "6 questions — take out the big part, then correct. Order of magnitude first.",
      questions: run(["approximation"], 6, 1, 5),
      selfGraded: false,
    },
    {
      key: "ev-arithmetic",
      title: "Expected value & break-evens",
      description:
        "12 questions — probability-weighted payoffs, waiting times, and the win rate a bet needs.",
      questions: run(["discrete-ev", "break-even-prob", "recursive-ev"], 12, 1, 5),
      selfGraded: false,
    },
    {
      key: "probability-fundamentals",
      title: "Probability fundamentals",
      description: "12 questions — dice, coins, cards, odds, and conditioning.",
      questions: run(["dice", "coins", "cards", "odds-implied", "conditional"], 12, 1, 5),
      selfGraded: false,
    },
    {
      key: "market-making",
      title: "Market making",
      description:
        "6 questions — fair value, a two-sided quote, and what a fill tells you about the value.",
      questions: [
        ...run(["fair-value"], 2, 2, 3),
        ...run(["market-quote"], 2, 3, 5),
        ...run(["conditional-update"], 2, 3, 5),
      ],
      selfGraded: false,
    },
    {
      key: "mixed-format",
      title: "Mixed format",
      description:
        "10 questions where the shape and the level change every time. No two consecutive questions share an archetype.",
      questions: generateMixedSet(sampler, rng, 10, [2, 3, 4]),
      selfGraded: false,
    },
    {
      key: "estimation",
      title: "Estimation & calibration",
      description:
        "5 prompts. Self-graded: within a factor of 2 counts, and only if you wrote the decomposition down.",
      questions: run(["fermi", "estimation-sanity"], 5, 2, 5),
      selfGraded: true,
    },
    {
      key: "oral-explanation",
      title: "Oral explanation",
      description: "Explain aloud, then self-score. Clarity beats speed.",
      questions: [
        selfPrompt(
          "expected-value",
          "oral",
          "Explain aloud, as if to an interviewer: why is the expected value of one fair die roll 3.5, and why does linearity let you price the sum of two dice instantly?",
          "A clean answer names the uniform average (1+…+6)/6, then invokes linearity of expectation — no independence needed. Score yourself on structure: claim, reason, example."
        ),
        selfPrompt(
          "probability",
          "oral",
          "Explain aloud: the difference between independent events and mutually exclusive events, with one concrete example of each.",
          "Independent: P(A∩B) = P(A)P(B) — knowing one tells you nothing. Mutually exclusive: they can't co-occur, so they're maximally dependent. Score yourself on whether your example makes the distinction obvious."
        ),
        selfPrompt(
          "market-making",
          "oral",
          "Explain aloud: you quote a two-sided market and are lifted immediately. What should that change about your view of the contract, and what do you do next?",
          "A good answer treats the fill as evidence: conditional on being lifted, the value is probably above your offer. Next steps are widening, skewing, or re-marking — not repeating the same quote. Score yourself on whether you actually conditioned on the fill."
        ),
      ],
      selfGraded: true,
    },
    {
      key: "coding-simulation",
      title: "Coding simulation (manual entry)",
      description:
        "Outside the app, write a quick Monte Carlo simulation: estimate P(sum of two dice ≥ 9), compare with the exact 10/36 ≈ 0.278. Enter a self-score below.",
      questions: [],
      selfGraded: true,
    },
  ];
}

export interface SectionStats {
  key: string;
  title: string;
  answered: number;
  correct: number;
  accuracy: number; // 0-1
  avgTimeSeconds: number;
  errorTypes: Record<string, number>;
  notes: string;
  /** Manual score for sections without in-app questions (e.g. coding). */
  manualScore?: string;
}

export interface DiagnosticReport {
  completedAt: number;
  sections: SectionStats[];
  topicScores: { topic: Topic; label: string; accuracy: number; answered: number }[];
  weaknesses: { topic: Topic; label: string; accuracy: number }[];
  recommendation: string;
  nextDay: string[];
}

export interface DiagnosticAttemptLike {
  topic: string;
  isCorrect: boolean;
}

/** Build the end-of-diagnostic report from per-topic results. */
export function summarizeDiagnostic(
  attempts: DiagnosticAttemptLike[],
  sections: SectionStats[],
  now: number
): DiagnosticReport {
  const byTopic = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const t = byTopic.get(a.topic) ?? { correct: 0, total: 0 };
    t.total++;
    if (a.isCorrect) t.correct++;
    byTopic.set(a.topic, t);
  }

  const topicScores = [...byTopic.entries()]
    .map(([topic, { correct, total }]) => ({
      topic: topic as Topic,
      label: TOPIC_LABELS[topic as Topic] ?? topic,
      accuracy: total > 0 ? correct / total : 0,
      answered: total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weaknesses = topicScores.slice(0, 3).map(({ topic, label, accuracy }) => ({
    topic,
    label,
    accuracy,
  }));

  const overall =
    attempts.length > 0 ? attempts.filter((a) => a.isCorrect).length / attempts.length : 0;
  const probTopics = topicScores.filter(
    (t) => t.topic === "probability" || t.topic === "conditional-probability"
  );
  const probAccuracy =
    probTopics.length > 0
      ? probTopics.reduce((s, t) => s + t.accuracy * t.answered, 0) /
        probTopics.reduce((s, t) => s + t.answered, 0)
      : 0;

  let recommendation: string;
  if (overall < 0.5 || probAccuracy < 0.5) {
    recommendation =
      "Start with Jane Street Probability & Markets basics — build probability foundations before timed work.";
  } else if (probAccuracy < 0.75) {
    recommendation =
      "Start with Green Book easy probability chapters — fundamentals are there, now deepen problem patterns.";
  } else {
    recommendation =
      "Start with timed QuantGuide-style practice — fundamentals are solid, so push speed under the clock.";
  }

  const nextDay = [
    `8 questions on your weakest topics: ${weaknesses.map((w) => w.label).join(", ")}`,
    "4 questions from Week 1 of the study plan",
    "3 spaced-review questions on anything you missed today",
    "2 challenge questions one level above your comfort",
    "3 mixed-format questions where the shape changes every time",
  ];

  return { completedAt: now, sections, topicScores, weaknesses, recommendation, nextDay };
}

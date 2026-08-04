import type { Rng } from "../rng";
import { choice, shuffle } from "../rng";
import type { GeneratedQuestion, QuestionMode, Topic } from "../types";
import { modeFor } from "../types";
import {
  genAddition,
  genApproximation,
  genDecimalOps,
  genDivision,
  genMissingOperand,
  genMultiplication,
  genSequentialArithmetic,
  genSubtraction,
} from "./arithmetic";
import {
  genFractionToDecimal,
  genFractionToPercent,
  genRepresentationCompare,
} from "./fractions";
import {
  genPercentOf,
  genPercentageChain,
  genReversePercent,
  genSequentialPercent,
} from "./percentages";
import { genBreakEvenProb, genDiscreteEV, genRecursiveEV } from "./expectedValue";
import {
  genBayes,
  genCardProbability,
  genCoinProbability,
  genConditionalProbability,
  genConditionalUpdate,
  genDiceProbability,
  genOddsImplied,
} from "./probability";
import { genMarketMakingFairValue, genMarketQuote } from "./marketMaking";
import { genEstimationSanity, genFermiEstimation } from "./estimation";

export type Generator = (difficulty: number, rng: Rng) => GeneratedQuestion;

export interface GeneratorEntry {
  topic: Topic;
  mode: QuestionMode;
  gen: Generator;
  /** Levels this archetype is meaningful at. Level 5 rapid work is rare. */
  levels: number[];
}

const ALL = [1, 2, 3, 4, 5];

/** Every procedural generator, keyed by subtopic. */
export const GENERATORS: Record<string, GeneratorEntry> = {
  // ---------------- Rapid arithmetic screening ----------------
  addition: { topic: "arithmetic", mode: "rapid", gen: genAddition, levels: ALL },
  subtraction: { topic: "arithmetic", mode: "rapid", gen: genSubtraction, levels: ALL },
  multiplication: { topic: "arithmetic", mode: "rapid", gen: genMultiplication, levels: ALL },
  division: { topic: "arithmetic", mode: "rapid", gen: genDivision, levels: ALL },
  "decimal-ops": { topic: "arithmetic", mode: "rapid", gen: genDecimalOps, levels: ALL },
  "missing-operand": { topic: "arithmetic", mode: "rapid", gen: genMissingOperand, levels: ALL },
  "sequential-arithmetic": {
    topic: "arithmetic",
    mode: "rapid",
    gen: genSequentialArithmetic,
    levels: ALL,
  },
  approximation: { topic: "arithmetic", mode: "rapid", gen: genApproximation, levels: ALL },
  "fraction-to-decimal": {
    topic: "fractions",
    mode: "rapid",
    gen: genFractionToDecimal,
    levels: ALL,
  },
  "fraction-to-percent": {
    topic: "fractions",
    mode: "rapid",
    gen: genFractionToPercent,
    levels: ALL,
  },
  "representation-compare": {
    topic: "fractions",
    mode: "rapid",
    gen: genRepresentationCompare,
    levels: ALL,
  },
  "percent-of": { topic: "percentages", mode: "rapid", gen: genPercentOf, levels: ALL },
  "reverse-percent": {
    topic: "percentages",
    mode: "rapid",
    gen: genReversePercent,
    levels: [2, 3, 4, 5],
  },
  "sequential-percent": {
    topic: "percentages",
    mode: "rapid",
    gen: genSequentialPercent,
    levels: ALL,
  },

  // ---------------- Interview numeracy ----------------
  "discrete-ev": { topic: "expected-value", mode: "interview", gen: genDiscreteEV, levels: ALL },
  "recursive-ev": {
    topic: "expected-value",
    mode: "interview",
    gen: genRecursiveEV,
    levels: [2, 3, 4, 5],
  },
  "break-even-prob": {
    topic: "expected-value",
    mode: "interview",
    gen: genBreakEvenProb,
    levels: ALL,
  },
  "percentage-chain": {
    topic: "percentages",
    mode: "interview",
    gen: genPercentageChain,
    levels: [2, 3, 4, 5],
  },
  dice: { topic: "probability", mode: "interview", gen: genDiceProbability, levels: ALL },
  coins: { topic: "probability", mode: "interview", gen: genCoinProbability, levels: ALL },
  cards: { topic: "probability", mode: "interview", gen: genCardProbability, levels: ALL },
  "odds-implied": { topic: "probability", mode: "interview", gen: genOddsImplied, levels: ALL },
  conditional: {
    topic: "conditional-probability",
    mode: "interview",
    gen: genConditionalProbability,
    levels: ALL,
  },
  bayes: {
    topic: "conditional-probability",
    mode: "interview",
    gen: genBayes,
    levels: [2, 3, 4, 5],
  },
  "conditional-update": {
    topic: "conditional-probability",
    mode: "interview",
    gen: genConditionalUpdate,
    levels: [3, 4, 5],
  },
  "fair-value": {
    topic: "market-making",
    mode: "interview",
    gen: genMarketMakingFairValue,
    levels: ALL,
  },
  "market-quote": {
    topic: "market-making",
    mode: "interview",
    gen: genMarketQuote,
    levels: [3, 4, 5],
  },
  fermi: { topic: "estimation", mode: "interview", gen: genFermiEstimation, levels: ALL },
  "estimation-sanity": {
    topic: "estimation",
    mode: "interview",
    gen: genEstimationSanity,
    levels: ALL,
  },
};

export const TOPIC_SUBTOPICS: Record<Topic, string[]> = Object.entries(GENERATORS).reduce(
  (acc, [key, { topic }]) => {
    (acc[topic] ||= []).push(key);
    return acc;
  },
  {} as Record<Topic, string[]>
);

export const MODE_SUBTOPICS: Record<QuestionMode, string[]> = Object.entries(GENERATORS).reduce(
  (acc, [key, { mode }]) => {
    (acc[mode] ||= []).push(key);
    return acc;
  },
  {} as Record<QuestionMode, string[]>
);

/** Subtopics in `topic` that are meaningful at `difficulty`. */
export function subtopicsFor(topic: Topic, difficulty: number, mode?: QuestionMode): string[] {
  const all = TOPIC_SUBTOPICS[topic] ?? [];
  const usable = all.filter(
    (s) => GENERATORS[s].levels.includes(difficulty) && (!mode || GENERATORS[s].mode === mode)
  );
  if (usable.length > 0) return usable;
  const anyLevel = all.filter((s) => !mode || GENERATORS[s].mode === mode);
  return anyLevel.length > 0 ? anyLevel : all;
}

export function generateBySubtopic(
  subtopic: string,
  difficulty: number,
  rng: Rng
): GeneratedQuestion {
  const entry = GENERATORS[subtopic];
  if (!entry) throw new Error(`Unknown generator subtopic: ${subtopic}`);
  return entry.gen(difficulty, rng);
}

/** Generate a question for a topic, picking a level-appropriate subtopic. */
export function generateByTopic(
  topic: Topic,
  difficulty: number,
  rng: Rng,
  mode?: QuestionMode
): GeneratedQuestion {
  return generateBySubtopic(choice(rng, subtopicsFor(topic, difficulty, mode)), difficulty, rng);
}

/* --------------------------- session de-duplication -------------------------- */

/**
 * A session-scoped sampler that never serves the same prompt twice.
 *
 * The recorded diagnostic repeated five prompts verbatim, twice at *different*
 * difficulties ("P(roll ≥ 3)" as both a level-1 and a level-3 question). Every
 * question in a session now goes through here: it retries the generator, then
 * falls back to a sibling archetype, before giving up and allowing a repeat.
 */
export class QuestionSampler {
  private seen = new Set<string>();
  private lastSubtopic: string | null = null;

  constructor(private rng: Rng) {}

  /** Normalised prompt key — whitespace and case shouldn't defeat the check. */
  private static key(q: GeneratedQuestion): string {
    return q.prompt.replace(/\s+/g, " ").trim().toLowerCase();
  }

  has(q: GeneratedQuestion): boolean {
    return this.seen.has(QuestionSampler.key(q));
  }

  /** Mark a question as served (e.g. one built outside the sampler). */
  remember(q: GeneratedQuestion): GeneratedQuestion {
    this.seen.add(QuestionSampler.key(q));
    this.lastSubtopic = q.subtopic;
    return q;
  }

  /** A unique question from one archetype, retrying the generator. */
  fromSubtopic(subtopic: string, difficulty: number, tries = 12): GeneratedQuestion {
    let q = generateBySubtopic(subtopic, difficulty, this.rng);
    for (let i = 0; i < tries && this.has(q); i++) {
      q = generateBySubtopic(subtopic, difficulty, this.rng);
    }
    return this.remember(q);
  }

  /**
   * A unique question from a topic. Prefers an archetype other than the one just
   * served, so consecutive questions don't cluster into a single shape.
   */
  fromTopic(
    topic: Topic,
    difficulty: number,
    mode?: QuestionMode,
    tries = 6
  ): GeneratedQuestion {
    const pool = subtopicsFor(topic, difficulty, mode);
    const varied = pool.length > 1 ? pool.filter((s) => s !== this.lastSubtopic) : pool;
    for (const subtopic of shuffle(this.rng, varied)) {
      for (let i = 0; i < tries; i++) {
        const q = generateBySubtopic(subtopic, difficulty, this.rng);
        if (!this.has(q)) return this.remember(q);
      }
    }
    return this.remember(generateBySubtopic(choice(this.rng, pool), difficulty, this.rng));
  }

  /** A unique question from an explicit archetype list. */
  fromSubtopics(subtopics: string[], difficulty: number, tries = 6): GeneratedQuestion {
    const varied =
      subtopics.length > 1 ? subtopics.filter((s) => s !== this.lastSubtopic) : subtopics;
    for (const subtopic of shuffle(this.rng, varied.length ? varied : subtopics)) {
      if (!GENERATORS[subtopic]) continue;
      for (let i = 0; i < tries; i++) {
        const q = generateBySubtopic(subtopic, difficulty, this.rng);
        if (!this.has(q)) return this.remember(q);
      }
    }
    return this.remember(generateBySubtopic(choice(this.rng, subtopics), difficulty, this.rng));
  }

  get count(): number {
    return this.seen.size;
  }
}

/**
 * A mixed-format run: `count` questions whose archetype changes unpredictably,
 * with no two consecutive questions sharing a shape. Difficulty is drawn from
 * `levels`, so a mixed set also switches gear on you.
 */
export function generateMixedSet(
  sampler: QuestionSampler,
  rng: Rng,
  count: number,
  levels: number[],
  mode?: QuestionMode
): GeneratedQuestion[] {
  const pool = (mode ? MODE_SUBTOPICS[mode] : Object.keys(GENERATORS)) ?? [];
  const out: GeneratedQuestion[] = [];
  let previous: string | null = null;

  for (let i = 0; i < count; i++) {
    const difficulty = levels[Math.floor(rng() * levels.length)];
    const eligible = pool.filter(
      (s) => GENERATORS[s].levels.includes(difficulty) && s !== previous
    );
    const candidates = eligible.length > 0 ? eligible : pool;
    const q = sampler.fromSubtopics([choice(rng, candidates)], difficulty);
    previous = q.subtopic;
    out.push(q);
  }
  return out;
}

/** How many distinct archetypes a set covers — used by the diversity tests. */
export function archetypeDiversity(questions: GeneratedQuestion[]): number {
  return new Set(questions.map((q) => q.subtopic)).size;
}

export { modeFor };

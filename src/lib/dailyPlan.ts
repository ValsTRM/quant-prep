import { type Rng, choice } from "./rng";
import { type PlanItem, type Topic, type TopicProficiency, TOPICS } from "./types";
import { GENERATORS, QuestionSampler, generateMixedSet } from "./generators";
import { difficultyForTopic, weakestTopics } from "./proficiency";

export interface RecentMiss {
  attemptId: string;
  topic: string;
  subtopic: string;
  difficulty: number;
}

export interface DailyPlanInput {
  proficiencies: TopicProficiency[];
  currentWeekTopics: Topic[];
  /** Unresolved incorrect attempts from the recent past (newest first). */
  recentMisses: RecentMiss[];
  totalQuestions?: number;
  rng: Rng;
}

export interface DailyPlan {
  items: PlanItem[];
  summary: {
    total: number;
    buckets: { weak: number; plan: number; review: number; challenge: number };
    weakTopics: Topic[];
    planTopics: Topic[];
    /** Distinct archetypes in the set. */
    archetypes: number;
    /** Difficulty levels present, low to high. */
    levels: number[];
  };
}

/**
 * Daily practice allocation:
 *   40% weakest topics · 20% current study-plan week · 15% spaced review of
 *   recent misses · 10% challenge (one level up) · 15% mixed-format, where the
 *   archetype and the level both change unpredictably question to question.
 *
 * Every item comes from one `QuestionSampler`, so no prompt repeats in a session.
 */
export function generateDailyPlan(input: DailyPlanInput): DailyPlan {
  const { proficiencies, currentWeekTopics, recentMisses, rng } = input;
  const total = input.totalQuestions ?? 20;

  const nWeak = Math.round(total * 0.4);
  const nPlan = Math.round(total * 0.2);
  const nReview = Math.round(total * 0.15);
  const nChallenge = Math.round(total * 0.1);
  const nMixed = Math.max(0, total - nWeak - nPlan - nReview - nChallenge);

  const profByTopic = new Map(proficiencies.map((p) => [p.topic, p]));
  const diffFor = (topic: Topic): number => difficultyForTopic(profByTopic.get(topic));

  const sampler = new QuestionSampler(rng);
  const items: PlanItem[] = [];

  // Weakest topics, round-robin over the bottom three.
  const weak = weakestTopics(proficiencies, 3).map((p) => p.topic);
  for (let i = 0; i < nWeak; i++) {
    const topic = weak[i % weak.length];
    items.push({ bucket: "weak", question: sampler.fromTopic(topic, diffFor(topic)) });
  }

  // The current chronological plan week's topics.
  const planTopics = currentWeekTopics.length > 0 ? currentWeekTopics : weak;
  for (let i = 0; i < nPlan; i++) {
    const topic = planTopics[i % planTopics.length];
    items.push({ bucket: "plan", question: sampler.fromTopic(topic, diffFor(topic)) });
  }

  // Spaced review: the shape you missed, at the level you missed it.
  for (let i = 0; i < nReview; i++) {
    if (recentMisses.length > 0) {
      const miss = recentMisses[i % recentMisses.length];
      const question = GENERATORS[miss.subtopic]
        ? sampler.fromSubtopic(miss.subtopic, miss.difficulty)
        : sampler.fromTopic(miss.topic as Topic, miss.difficulty);
      items.push({ bucket: "review", question, reviewOfAttemptId: miss.attemptId });
    } else {
      const topic = weak[i % weak.length];
      items.push({ bucket: "review", question: sampler.fromTopic(topic, diffFor(topic)) });
    }
  }

  // Challenge: strongest topics, one level above where they're being served.
  const strong = [...proficiencies]
    .filter((p) => !p.untested)
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, 3)
    .map((p) => p.topic);
  const challengePool: Topic[] = strong.length > 0 ? strong : [...TOPICS];
  for (let i = 0; i < nChallenge; i++) {
    const topic = choice(rng, challengePool);
    items.push({
      bucket: "challenge",
      question: sampler.fromTopic(topic, Math.min(5, diffFor(topic) + 1)),
    });
  }

  // Mixed format: archetype and level both switch without warning, spanning the
  // working level and one either side.
  const workingLevel = Math.round(
    proficiencies.reduce((s, p) => s + difficultyForTopic(p), 0) / Math.max(1, proficiencies.length)
  );
  const mixedLevels = [
    Math.max(1, workingLevel - 1),
    workingLevel,
    Math.min(5, workingLevel + 1),
  ];
  for (const question of generateMixedSet(sampler, rng, nMixed, mixedLevels)) {
    items.push({ bucket: "challenge", question });
  }

  return {
    items,
    summary: {
      total: items.length,
      buckets: { weak: nWeak, plan: nPlan, review: nReview, challenge: nChallenge + nMixed },
      weakTopics: weak,
      planTopics,
      archetypes: new Set(items.map((i) => i.question.subtopic)).size,
      levels: [...new Set(items.map((i) => i.question.difficulty))].sort((a, b) => a - b),
    },
  };
}

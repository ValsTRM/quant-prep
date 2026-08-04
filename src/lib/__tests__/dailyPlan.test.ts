import { describe, expect, it } from "vitest";
import { generateDailyPlan, type RecentMiss } from "../dailyPlan";
import { mulberry32 } from "../rng";
import { capForPassedLevel, TOPICS, type Topic, type TopicProficiency } from "../types";

const NOW = 1_750_000_000_000;

function prof(
  topic: Topic,
  proficiency: number,
  untested = false,
  passedLevel = 2
): TopicProficiency {
  return {
    topic,
    proficiency,
    accuracy: proficiency / 100,
    avgTimeSeconds: 20,
    attemptCount: untested ? 0 : 25,
    lastPracticedAt: untested ? null : NOW,
    untested,
    passedLevel: untested ? 0 : passedLevel,
    cap: capForPassedLevel(untested ? 0 : passedLevel),
    cappedBy: false,
    recommendedDifficulty: untested ? 2 : Math.min(5, passedLevel + 1),
    holdReason: null,
  };
}

// arithmetic strong, market-making/estimation/conditional weak
const PROFS: TopicProficiency[] = [
  prof("arithmetic", 88, false, 4),
  prof("fractions", 74, false, 3),
  prof("percentages", 58, false, 2),
  prof("expected-value", 55, false, 2),
  prof("probability", 45, false, 2),
  prof("conditional-probability", 30, false, 1),
  prof("market-making", 10, false, 1),
  prof("estimation", 20, false, 1),
];

const WEEK_TOPICS: Topic[] = ["conditional-probability", "probability"];

const MISSES: RecentMiss[] = [
  { attemptId: "m1", topic: "percentages", subtopic: "reverse-percent", difficulty: 2 },
  { attemptId: "m2", topic: "probability", subtopic: "dice", difficulty: 3 },
];

const plan = (overrides: Partial<Parameters<typeof generateDailyPlan>[0]> = {}) =>
  generateDailyPlan({
    proficiencies: PROFS,
    currentWeekTopics: WEEK_TOPICS,
    recentMisses: MISSES,
    rng: mulberry32(1),
    ...overrides,
  });

describe("generateDailyPlan", () => {
  it("allocates 40/20/15/10 plus a mixed-format block for a 20-question set", () => {
    const p = plan();
    expect(p.items).toHaveLength(20);
    const count = (b: string) => p.items.filter((i) => i.bucket === b).length;
    expect(count("weak")).toBe(8);
    expect(count("plan")).toBe(4);
    expect(count("review")).toBe(3);
    expect(count("challenge")).toBe(5); // 2 challenge + 3 mixed
  });

  it("never repeats a prompt inside one day's set", () => {
    for (const seed of [1, 2, 3, 17, 99]) {
      const p = plan({ rng: mulberry32(seed) });
      const prompts = p.items.map((i) => i.question.prompt);
      expect(new Set(prompts).size, `seed ${seed} repeated a prompt`).toBe(prompts.length);
    }
  });

  it("mixes at least half a dozen archetypes into a day", () => {
    expect(plan().summary.archetypes).toBeGreaterThanOrEqual(6);
  });

  it("spans more than one difficulty level", () => {
    expect(plan().summary.levels.length).toBeGreaterThan(1);
  });

  it("draws weak-bucket questions from the three weakest topics", () => {
    const p = plan({ recentMisses: [], rng: mulberry32(2) });
    const weakest = ["market-making", "estimation", "conditional-probability"];
    for (const item of p.items.filter((i) => i.bucket === "weak")) {
      expect(weakest).toContain(item.question.topic);
    }
    expect(p.summary.weakTopics.sort()).toEqual(weakest.sort());
  });

  it("draws plan-bucket questions from the current week's topics", () => {
    for (const item of plan({ rng: mulberry32(3) }).items.filter((i) => i.bucket === "plan")) {
      expect(WEEK_TOPICS).toContain(item.question.topic);
    }
  });

  it("links review items to the missed attempts they respace", () => {
    const review = plan({ rng: mulberry32(4) }).items.filter((i) => i.bucket === "review");
    expect(review).toHaveLength(3);
    for (const item of review) {
      expect(["m1", "m2"]).toContain(item.reviewOfAttemptId);
      const miss = MISSES.find((m) => m.attemptId === item.reviewOfAttemptId)!;
      expect(item.question.subtopic).toBe(miss.subtopic);
      expect(item.question.difficulty).toBe(miss.difficulty);
    }
  });

  it("falls back to weak topics when nothing was missed recently", () => {
    const review = plan({ recentMisses: [], rng: mulberry32(5) }).items.filter(
      (i) => i.bucket === "review"
    );
    expect(review).toHaveLength(3);
    for (const item of review) expect(item.reviewOfAttemptId).toBeUndefined();
  });

  it("serves each topic one level above what it has actually passed", () => {
    const p = plan({ recentMisses: [], rng: mulberry32(6) });
    const byTopic = new Map(PROFS.map((x) => [x.topic, x]));
    for (const item of p.items.filter((i) => i.bucket === "weak" || i.bucket === "plan")) {
      const expected = byTopic.get(item.question.topic)!.recommendedDifficulty;
      expect(item.question.difficulty, `${item.question.topic}`).toBe(expected);
    }
  });

  it("is deterministic for the same seed (stable daily assignment)", () => {
    const a = plan({ rng: mulberry32(99) });
    const b = plan({ rng: mulberry32(99) });
    expect(a.items.map((i) => i.question.prompt)).toEqual(b.items.map((i) => i.question.prompt));
  });

  it("handles the all-untested cold start without repeats", () => {
    const cold = TOPICS.map((t) => prof(t, 0, true));
    const p = plan({ proficiencies: cold, recentMisses: [], rng: mulberry32(7) });
    expect(p.items).toHaveLength(20);
    expect(new Set(p.items.map((i) => i.question.prompt)).size).toBe(20);
  });

  it("respects a custom total", () => {
    const p = plan({ totalQuestions: 10, rng: mulberry32(8) });
    expect(p.items).toHaveLength(10);
  });
});

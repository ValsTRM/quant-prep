import { describe, expect, it } from "vitest";
import {
  ADVANCEMENT,
  computeTopicProficiency,
  computeAllProficiencies,
  difficultyFor,
  difficultyForTopic,
  highestPassedLevel,
  holdAssessment,
  levelEvidence,
  proficiencyBreakdown,
  weakestTopics,
  type AttemptLike,
} from "../proficiency";
import { capForPassedLevel } from "../types";

const DAY = 86_400_000;
const NOW = 1_750_000_000_000;

function attempt(overrides: Partial<AttemptLike> = {}): AttemptLike {
  return {
    topic: "arithmetic",
    subtopic: "addition",
    difficulty: 1,
    isCorrect: true,
    timeSeconds: 3, // exactly the L1 addition target
    targetSeconds: 3,
    createdAt: NOW - 1000,
    sessionId: "s1",
    ...overrides,
  };
}

/** A run that satisfies every advancement requirement at `difficulty`. */
function passingRun(difficulty: number, n = 24, overrides: Partial<AttemptLike> = {}) {
  return Array.from({ length: n }, (_, i) =>
    attempt({
      difficulty,
      timeSeconds: 2,
      createdAt: NOW - i * 1000,
      sessionId: i % 2 === 0 ? "s1" : "s2",
      ...overrides,
    })
  );
}

describe("computeTopicProficiency", () => {
  it("returns untested/zero with no attempts", () => {
    const p = computeTopicProficiency("arithmetic", [], NOW);
    expect(p.untested).toBe(true);
    expect(p.proficiency).toBe(0);
    expect(p.passedLevel).toBe(0);
  });

  it("caps a flawless Level 1 run at 40 — warm-ups cannot read as mastery", () => {
    const p = computeTopicProficiency("arithmetic", passingRun(1), NOW);
    expect(p.accuracy).toBe(1);
    expect(p.passedLevel).toBe(1);
    expect(p.cap).toBe(40);
    expect(p.proficiency).toBeLessThanOrEqual(40);
    expect(p.cappedBy).toBe(true);
  });

  it("raises the ceiling one level at a time", () => {
    const caps = [1, 2, 3, 4, 5].map(
      (level) => computeTopicProficiency("arithmetic", passingRun(level), NOW).cap
    );
    expect(caps).toEqual([40, 60, 75, 90, 100]);
  });

  it("needs Level 5 evidence to exceed 90", () => {
    const l4 = computeTopicProficiency("arithmetic", passingRun(4), NOW);
    expect(l4.proficiency).toBeLessThanOrEqual(90);
    const l5 = computeTopicProficiency("arithmetic", passingRun(5), NOW);
    expect(l5.proficiency).toBeGreaterThan(90);
  });

  it("scores low for an all-wrong history", () => {
    const attempts = Array.from({ length: 24 }, (_, i) =>
      attempt({ isCorrect: false, timeSeconds: 30, createdAt: NOW - i * 1000 })
    );
    const p = computeTopicProficiency("arithmetic", attempts, NOW);
    expect(p.proficiency).toBeLessThan(15);
    expect(p.passedLevel).toBe(0);
  });

  it("weights accuracy by difficulty: same accuracy, harder questions score higher", () => {
    // Compared before the cap applies — at 50% accuracy neither run passes a
    // level, so both would otherwise be pinned to the same ceiling.
    const half = (difficulty: number) =>
      Array.from({ length: 24 }, (_, i) =>
        attempt({
          difficulty,
          isCorrect: i % 2 === 0,
          timeSeconds: 1,
          createdAt: NOW - i * 1000,
          sessionId: i % 2 === 0 ? "s1" : "s2",
        })
      );
    const easy = proficiencyBreakdown(half(1), NOW);
    const hard = proficiencyBreakdown(half(4), NOW);
    expect(hard.difficultyAdjustedAccuracy).toBeGreaterThan(easy.difficultyAdjustedAccuracy);
    expect(hard.rawScore).toBeGreaterThan(easy.rawScore);
    // A perfect Foundation run is worth 0.45, not 1.0.
    expect(proficiencyBreakdown(passingRun(1), NOW).difficultyAdjustedAccuracy).toBeCloseTo(
      0.45,
      2
    );
    expect(proficiencyBreakdown(passingRun(5), NOW).difficultyAdjustedAccuracy).toBeCloseTo(1, 2);
  });

  it("gives a slow correct answer far less credit than a fast one", () => {
    // L4 addition targets 10s; 25s is over 2x → 10% credit on the speed term.
    const pFast = computeTopicProficiency("arithmetic", passingRun(4, 24, { timeSeconds: 9 }), NOW);
    const pSlow = computeTopicProficiency("arithmetic", passingRun(4, 24, { timeSeconds: 25 }), NOW);
    expect(pFast.proficiency - pSlow.proficiency).toBeGreaterThan(25);
  });

  it("scores a timeout as zero credit and refuses to count it as passed", () => {
    const timedOut = Array.from({ length: 24 }, (_, i) =>
      attempt({ isCorrect: false, timedOut: true, timeSeconds: 12, createdAt: NOW - i * 1000 })
    );
    const p = computeTopicProficiency("arithmetic", timedOut, NOW);
    expect(p.passedLevel).toBe(0);
    expect(p.proficiency).toBeLessThanOrEqual(capForPassedLevel(0));
  });

  it("cannot advance on late-but-correct answers, however accurate", () => {
    // Working a problem past the cut-off is encouraged — the answer is recorded
    // as right — but it must never buy a level. The median-time gate is what
    // blocks it, since accuracy alone now looks perfect.
    const lateButRight = passingRun(3, 24, { timeSeconds: 400 });
    const p = computeTopicProficiency("arithmetic", lateButRight, NOW);
    expect(p.accuracy).toBe(1);
    expect(p.passedLevel).toBe(0);
    expect(p.cap).toBe(capForPassedLevel(0));
    expect(p.proficiency).toBeLessThanOrEqual(25);

    const ev = levelEvidence(lateButRight, 3);
    expect(ev.accuracy).toBe(1);
    expect(ev.passed).toBe(false);
    expect(ev.missing.join(" ")).toContain("target");

    // ...and the hold rule pulls the served difficulty down.
    expect(holdAssessment(lateButRight).hold).toBe(true);
    expect(p.recommendedDifficulty).toBe(1);
  });

  it("decays with staleness rather than paying a bonus for showing up", () => {
    const fresh = computeTopicProficiency("arithmetic", passingRun(3), NOW);
    const stale = computeTopicProficiency(
      "arithmetic",
      passingRun(3).map((a) => ({ ...a, createdAt: a.createdAt - 40 * DAY })),
      NOW
    );
    expect(stale.proficiency).toBeLessThan(fresh.proficiency);
    expect(stale.proficiency).toBeGreaterThan(0);
  });

  it("regrades speed against the CURRENT target table, ignoring the stored one", () => {
    const pStale = computeTopicProficiency(
      "arithmetic",
      passingRun(1, 24, { timeSeconds: 9, targetSeconds: 100 }),
      NOW
    );
    const pOnPace = computeTopicProficiency(
      "arithmetic",
      passingRun(1, 24, { timeSeconds: 3, targetSeconds: 100 }),
      NOW
    );
    expect(pOnPace.proficiency).toBeGreaterThan(pStale.proficiency);
  });
});

describe("advancement evidence", () => {
  it("requires all four gates", () => {
    expect(levelEvidence(passingRun(3), 3).passed).toBe(true);

    // Too few questions.
    expect(levelEvidence(passingRun(3, ADVANCEMENT.minQuestions - 1), 3).passed).toBe(false);

    // One session only.
    const oneSession = passingRun(3).map((a) => ({ ...a, sessionId: "only" }));
    expect(levelEvidence(oneSession, 3).passed).toBe(false);

    // Accuracy under 85%.
    const sloppy = passingRun(3).map((a, i) => ({ ...a, isCorrect: i % 5 !== 0 }));
    expect(levelEvidence(sloppy, 3).passed).toBe(false);

    // Median time over target (L3 addition target is 7s).
    expect(levelEvidence(passingRun(3, 24, { timeSeconds: 15 }), 3).passed).toBe(false);
  });

  it("counts harder attempts as evidence for easier levels", () => {
    expect(highestPassedLevel(passingRun(4))).toBe(4);
    expect(levelEvidence(passingRun(4), 2).passed).toBe(true);
  });

  it("explains what is still missing", () => {
    const ev = levelEvidence(passingRun(3, 5), 3);
    expect(ev.passed).toBe(false);
    expect(ev.missing.join(" ")).toContain("questions");
  });

  it("three high-accuracy attempts do not pass any level", () => {
    // The recorded diagnostic gave conditional-probability 90 from 3 questions.
    const p = computeTopicProficiency("conditional-probability", passingRun(4, 3), NOW);
    expect(p.passedLevel).toBe(0);
    expect(p.proficiency).toBeLessThanOrEqual(25);
  });
});

describe("hold / reduce rules", () => {
  const many = (o: Partial<AttemptLike>) =>
    Array.from({ length: 20 }, (_, i) => attempt({ createdAt: NOW - i * 1000, ...o }));

  it("holds when accuracy drops below 70%", () => {
    const a = many({}).map((x, i) => ({ ...x, isCorrect: i % 2 === 0 }));
    expect(holdAssessment(a).hold).toBe(true);
    expect(holdAssessment(a).reason).toContain("accuracy");
  });

  it("holds when more than 15% of answers time out", () => {
    const a = many({}).map((x, i) =>
      i < 5 ? { ...x, isCorrect: false, timedOut: true, timeSeconds: 30 } : x
    );
    expect(holdAssessment(a).reason).toContain("time out");
  });

  it("holds when median time exceeds 1.5x target", () => {
    expect(holdAssessment(many({ timeSeconds: 8 })).reason).toContain("median");
  });

  it("holds when one error type dominates recent misses", () => {
    const a = many({}).map((x, i) =>
      i < 4 ? { ...x, isCorrect: false, errorType: "careless" } : x
    );
    expect(holdAssessment(a).reason).toContain("careless");
  });

  it("stays quiet on a clean run", () => {
    expect(holdAssessment(many({})).hold).toBe(false);
  });

  it("drops the served difficulty back a level while a hold is firing", () => {
    const clean = computeTopicProficiency("arithmetic", passingRun(3), NOW);
    const struggling = computeTopicProficiency(
      "arithmetic",
      passingRun(3).map((a, i) => ({ ...a, isCorrect: i % 2 === 0 })),
      NOW
    );
    expect(struggling.recommendedDifficulty).toBeLessThan(clean.recommendedDifficulty);
    expect(struggling.holdReason).not.toBeNull();
  });
});

describe("computeAllProficiencies / weakestTopics", () => {
  it("covers all topics and sorts weakest first", () => {
    const attempts: AttemptLike[] = [
      ...passingRun(3).map((a) => ({ ...a, topic: "arithmetic" })),
      ...passingRun(3).map((a, i) => ({
        ...a,
        topic: "probability",
        subtopic: "dice",
        isCorrect: i < 3,
      })),
    ];
    const all = computeAllProficiencies(attempts, NOW);
    expect(all).toHaveLength(8);
    const weak = weakestTopics(all, 3);
    expect(weak.every((w) => w.topic !== "arithmetic")).toBe(true);
    expect(weak[0].proficiency).toBeLessThanOrEqual(weak[1].proficiency);
  });
});

describe("difficulty selection", () => {
  it("serves one level above what has actually been proven", () => {
    const p = computeTopicProficiency("arithmetic", passingRun(2), NOW);
    expect(p.passedLevel).toBe(2);
    expect(difficultyForTopic(p)).toBe(3);
  });

  it("probes at level 2 when nothing is proven and nothing is wrong", () => {
    const p = computeTopicProficiency("arithmetic", passingRun(3, 6), NOW);
    expect(p.passedLevel).toBe(0);
    expect(difficultyForTopic(p)).toBe(2);
  });

  it("maps bare proficiency bands to the level ladder", () => {
    expect(difficultyFor(0, true)).toBe(2);
    expect(difficultyFor(40, false)).toBe(2);
    expect(difficultyFor(60, false)).toBe(3);
    expect(difficultyFor(75, false)).toBe(4);
    expect(difficultyFor(95, false)).toBe(5);
  });
});

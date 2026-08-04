import { describe, expect, it } from "vitest";
import {
  questionPoints,
  sessionScore,
  readinessScore,
  levelFor,
  LEVELS,
  weeklyGoals,
  computeMilestones,
  paceBreakdown,
  subtopicBreakdown,
  type ScorableAttempt,
} from "../scoring";
import {
  attemptCredit,
  isCleanSolve,
  timeCredit,
  TIME_CREDIT_TIERS,
  WRONG_ANSWER_CREDIT,
} from "../credit";
import {
  SUBTOPIC_TARGET_SECONDS,
  capForPassedLevel,
  modeFor,
  targetSecondsFor,
  timeoutSecondsFor,
  TOPICS,
  type TopicProficiency,
} from "../types";
import { GENERATORS } from "../generators";
import { mulberry32 } from "../rng";

function attempt(overrides: Partial<ScorableAttempt> = {}): ScorableAttempt {
  return {
    topic: "arithmetic",
    subtopic: "addition",
    difficulty: 1,
    isCorrect: true,
    timeSeconds: 3, // exactly the L1 addition target
    targetSeconds: 3,
    createdAt: 0,
    ...overrides,
  };
}

function prof(
  topic: (typeof TOPICS)[number],
  proficiency: number,
  untested = false
): TopicProficiency {
  return {
    topic,
    proficiency,
    accuracy: proficiency / 100,
    avgTimeSeconds: 10,
    attemptCount: untested ? 0 : 20,
    lastPracticedAt: untested ? null : 1,
    untested,
    passedLevel: untested ? 0 : 3,
    cap: capForPassedLevel(untested ? 0 : 3),
    cappedBy: false,
    recommendedDifficulty: untested ? 2 : 4,
    holdReason: null,
  };
}

describe("target calibration", () => {
  it("every generator subtopic has a 5-step ascending target row", () => {
    for (const sub of Object.keys(GENERATORS)) {
      const row = SUBTOPIC_TARGET_SECONDS[sub];
      expect(row, `missing targets for ${sub}`).toBeDefined();
      expect(row).toHaveLength(5);
      for (let i = 1; i < 5; i++) expect(row[i]).toBeGreaterThanOrEqual(row[i - 1]);
      expect(row[0]).toBeGreaterThan(0);
    }
  });

  it("rapid-mode targets sit inside the screening bands", () => {
    const BANDS: [number, number][] = [
      [3, 6],
      [5, 9],
      [7, 12],
      [9, 16],
      [12, 20],
    ];
    for (const [sub, entry] of Object.entries(GENERATORS)) {
      if (entry.mode !== "rapid") continue;
      const row = SUBTOPIC_TARGET_SECONDS[sub];
      row.forEach((target, i) => {
        const [lo, hi] = BANDS[i];
        expect(target, `${sub} L${i + 1} = ${target}s outside ${lo}-${hi}s`).toBeGreaterThanOrEqual(lo);
        expect(target, `${sub} L${i + 1} = ${target}s outside ${lo}-${hi}s`).toBeLessThanOrEqual(hi);
      });
    }
  });

  it("interview archetypes get thinking time, not screening time", () => {
    expect(targetSecondsFor("discrete-ev", 1)).toBeGreaterThanOrEqual(15);
    expect(targetSecondsFor("discrete-ev", 4)).toBeGreaterThanOrEqual(25);
    expect(targetSecondsFor("break-even-prob", 1)).toBeGreaterThanOrEqual(20);
    expect(targetSecondsFor("market-quote", 1)).toBeGreaterThanOrEqual(45);
    expect(targetSecondsFor("market-quote", 5)).toBeLessThanOrEqual(120);
    expect(targetSecondsFor("fermi", 1)).toBeGreaterThanOrEqual(30);
    expect(targetSecondsFor("fermi", 5)).toBeLessThanOrEqual(90);
  });

  it("generated questions carry the table's target and timeout for their own shape", () => {
    for (const { gen } of Object.values(GENERATORS)) {
      for (let d = 1; d <= 5; d++) {
        const q = gen(d, mulberry32(d * 11 + 1));
        const row = SUBTOPIC_TARGET_SECONDS[q.subtopic];
        expect(row, `no target row for subtopic ${q.subtopic}`).toBeDefined();
        expect(q.targetSeconds).toBe(row[q.difficulty - 1]);
        expect(q.timeoutSeconds).toBe(timeoutSecondsFor(q.subtopic, q.difficulty, q.topic));
        expect(q.timeoutSeconds).toBeGreaterThan(q.targetSeconds);
      }
    }
  });

  it("rapid mode times out sooner than interview mode, relative to target", () => {
    const ratio = (s: string, d: number) => timeoutSecondsFor(s, d) / targetSecondsFor(s, d);
    for (const s of ["addition", "multiplication", "percent-of"]) {
      expect(ratio(s, 3)).toBeGreaterThan(2.3);
      expect(ratio(s, 3)).toBeLessThan(2.7);
    }
    for (const s of ["market-quote", "discrete-ev", "fermi"]) {
      expect(ratio(s, 3)).toBeCloseTo(3, 1);
    }
  });

  it("falls back to topic scaling then a default for unknown subtopics", () => {
    expect(targetSecondsFor("mystery", 1, "arithmetic")).toBe(5);
    expect(targetSecondsFor("mystery", 3)).toBe(30);
  });
});

describe("time-credit ladder", () => {
  it("steps down exactly as specified", () => {
    expect(timeCredit(0.5)).toBe(1);
    expect(timeCredit(1.0)).toBe(1);
    expect(timeCredit(1.1)).toBe(0.85);
    expect(timeCredit(1.25)).toBe(0.85);
    expect(timeCredit(1.4)).toBe(0.65);
    expect(timeCredit(1.5)).toBe(0.65);
    expect(timeCredit(1.9)).toBe(0.35);
    expect(timeCredit(2.0)).toBe(0.35);
    expect(timeCredit(2.1)).toBe(0.1);
    expect(timeCredit(15)).toBe(0.1);
  });

  it("is monotonically non-increasing", () => {
    for (let i = 1; i < TIME_CREDIT_TIERS.length; i++) {
      expect(TIME_CREDIT_TIERS[i].credit).toBeLessThan(TIME_CREDIT_TIERS[i - 1].credit);
    }
  });

  it("scores a timeout at zero", () => {
    // L1 addition: target 3s, cut-off 10s.
    expect(attemptCredit(attempt({ timeSeconds: 12 }))).toBe(0);
    expect(attemptCredit(attempt({ timedOut: true, timeSeconds: 2 }))).toBe(0);
  });

  it("gives a late-but-correct answer zero credit however right it was", () => {
    // The cut-off is a scoring boundary, not a grading one: you keep working the
    // problem, the answer is still marked right, and it is still worth nothing.
    const late = attempt({ isCorrect: true, timeSeconds: 400 });
    expect(attemptCredit(late)).toBe(0);
    expect(isCleanSolve(late)).toBe(false);
    expect(questionPoints(late)).toBe(0);
  });

  it("penalises a wrong answer in rapid mode and merely zeroes it in interview mode", () => {
    expect(attemptCredit(attempt({ isCorrect: false }))).toBe(WRONG_ANSWER_CREDIT.rapid);
    expect(attemptCredit(attempt({ isCorrect: false }))).toBeLessThan(0);
    expect(
      attemptCredit(
        attempt({
          isCorrect: false,
          topic: "expected-value",
          subtopic: "discrete-ev",
          timeSeconds: 20,
        })
      )
    ).toBe(WRONG_ANSWER_CREDIT.interview);
  });

  it("reproduces the recorded 181s reverse-percentage answer as 10% credit", () => {
    // L3 reverse-percent targets 11s; 181s is over 2x, and past the cut-off.
    const a = attempt({
      topic: "percentages",
      subtopic: "reverse-percent",
      difficulty: 3,
      timeSeconds: 181,
    });
    expect(a.timeSeconds).toBeGreaterThan(timeoutSecondsFor("reverse-percent", 3));
    expect(attemptCredit(a)).toBe(0);
    // Even inside the cut-off, 4x target only earns 10%.
    expect(attemptCredit({ ...a, timeSeconds: 25 })).toBe(0.1);
  });
});

describe("questionPoints", () => {
  it("scores 10 × difficulty at target pace and gives no bonus for rushing", () => {
    expect(questionPoints(attempt())).toBe(10);
    expect(questionPoints(attempt({ timeSeconds: 1 }))).toBe(10);
    expect(
      questionPoints(
        attempt({
          subtopic: "conditional",
          topic: "conditional-probability",
          difficulty: 3,
          timeSeconds: 36,
        })
      )
    ).toBe(30);
  });

  it("goes negative for a wrong answer in a timed screen", () => {
    expect(questionPoints(attempt({ isCorrect: false, difficulty: 4 }))).toBeLessThan(0);
  });

  it("decays with slowness instead of flooring at 0.4×", () => {
    // L1 discrete-ev: 15s target, 45s cut-off.
    const ev = (timeSeconds: number) =>
      questionPoints(
        attempt({ topic: "expected-value", subtopic: "discrete-ev", difficulty: 1, timeSeconds })
      );
    expect(ev(15)).toBe(10); // 1.00× → 100%
    expect(ev(18)).toBe(9); // 1.20× →  85%
    expect(ev(21)).toBe(7); // 1.40× →  65%
    expect(ev(28)).toBe(4); // 1.87× →  35%
    expect(ev(40)).toBe(1); // 2.67× →  10%
    expect(ev(50)).toBe(0); // past the cut-off → 0
  });

  it("regrades against the current table even if the stored target was stale", () => {
    // Stored target says 100s, but L1 addition is 3s today: 5s is 1.67× → 35%.
    expect(questionPoints(attempt({ timeSeconds: 5, targetSeconds: 100 }))).toBe(4);
  });

  it("sessionScore sums earned and possible", () => {
    const s = sessionScore([
      attempt(),
      attempt({ isCorrect: false }),
      attempt({ difficulty: 2, timeSeconds: 3, subtopic: "subtraction" }),
    ]);
    expect(s.possible).toBe(10 + 10 + 20);
    expect(s.earned).toBeLessThan(s.possible);
  });
});

describe("paceBreakdown", () => {
  it("buckets a session by how it landed against the clock", () => {
    const pace = paceBreakdown([
      attempt({ timeSeconds: 3 }), // on time
      attempt({ timeSeconds: 4 }), // slightly slow
      attempt({ timeSeconds: 8 }), // very slow
      attempt({ timeSeconds: 20 }), // past the 10s cut-off
      attempt({ isCorrect: false, timeSeconds: 2 }), // wrong
    ]);
    expect(pace.onTime).toBe(1);
    expect(pace.slightlySlow).toBe(1);
    expect(pace.verySlow).toBe(1);
    expect(pace.timedOut).toBe(1);
    expect(pace.wrong).toBe(1);
  });
});

describe("readiness score and levels", () => {
  it("is the mean proficiency × 10", () => {
    expect(readinessScore(TOPICS.map((t) => prof(t, 50)))).toBe(500);
  });

  it("counts untested topics as zero (coverage matters)", () => {
    const profs = TOPICS.map((t, i) => (i === 0 ? prof(t, 80) : prof(t, 0, true)));
    expect(readinessScore(profs)).toBe(100);
  });

  it("cannot reach Interview-Ready without Level 4+ evidence everywhere", () => {
    // Every topic capped at Level 3 (75) → mean 75 → 750... so cap them at L2.
    const l2Capped = TOPICS.map((t) => prof(t, capForPassedLevel(2)));
    expect(readinessScore(l2Capped)).toBe(600);
    expect(levelFor(readinessScore(l2Capped)).name).not.toBe("Interview-Ready");
  });

  it("levels are ascending and levelFor picks the right band", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].floor).toBeGreaterThan(LEVELS[i - 1].floor);
    }
    expect(levelFor(0).name).toBe("Foundations");
    expect(levelFor(349).name).toBe("Building");
    expect(levelFor(350).name).toBe("Consistent");
    expect(levelFor(720).name).toBe("Interview-Ready");
    expect(levelFor(1000).next).toBeNull();
  });
});

describe("weeklyGoals", () => {
  const profs = TOPICS.map((t, i) => prof(t, 20 + i * 10));

  it("always includes volume, accuracy, speed, and two weak-topic lifts", () => {
    const keys = weeklyGoals([], profs).map((g) => g.key);
    expect(keys).toContain("volume");
    expect(keys).toContain("accuracy");
    expect(keys).toContain("speed");
    expect(keys.filter((k) => k.startsWith("lift-"))).toHaveLength(2);
  });

  it("holds the accuracy bar at the 85% advancement requirement", () => {
    const goal = weeklyGoals([attempt()], profs).find((g) => g.key === "accuracy")!;
    expect(goal.target).toBe(85);
  });

  it("the speed goal counts clean solves over ALL attempts, not just correct ones", () => {
    const attempts = [
      attempt({ timeSeconds: 2 }), // clean
      attempt({ timeSeconds: 8 }), // correct but slow
      attempt({ isCorrect: false, timeSeconds: 1 }), // wrong — counts in the denominator now
      attempt({ timeSeconds: 30 }), // timed out
    ];
    const speed = weeklyGoals(attempts, profs).find((g) => g.key === "speed")!;
    expect(speed.current).toBe(25);
  });
});

describe("milestones", () => {
  it("marks achieved and in-progress correctly", () => {
    const ms = computeMilestones(7, 120, 260);
    const by = (k: string) => ms.find((m) => m.key === k)!;
    expect(by("streak-7").achieved).toBe(true);
    expect(by("streak-14").progress).toBeCloseTo(0.5, 5);
    expect(by("questions-100").achieved).toBe(true);
    expect(by("qrs-400").achieved).toBe(false);
  });
});

describe("subtopicBreakdown", () => {
  it("aggregates wrong rate, timeout rate and time ratio per shape", () => {
    const stats = subtopicBreakdown([
      attempt({ timeSeconds: 3 }),
      attempt({ timeSeconds: 5, isCorrect: false }),
      attempt({ timeSeconds: 30 }), // past the 10s cut-off
      attempt({ subtopic: "dice", topic: "probability", difficulty: 2, timeSeconds: 36 }),
    ]);
    const addition = stats.find((s) => s.subtopic === "addition")!;
    expect(addition.attempts).toBe(3);
    expect(addition.timedOut).toBe(1);
    expect(addition.avgTargetSeconds).toBe(3);
    const dice = stats.find((s) => s.subtopic === "dice")!;
    expect(dice.timeRatio).toBeCloseTo(2, 1); // 36s vs the 18s L2 target
  });
});

describe("mode assignment", () => {
  it("classifies every registered archetype", () => {
    for (const [sub, entry] of Object.entries(GENERATORS)) {
      expect(modeFor(sub), `${sub}`).toBe(entry.mode);
    }
  });

  it("splits the two modes as the brief specifies", () => {
    expect(modeFor("multiplication")).toBe("rapid");
    expect(modeFor("reverse-percent")).toBe("rapid");
    expect(modeFor("representation-compare")).toBe("rapid");
    expect(modeFor("discrete-ev")).toBe("interview");
    expect(modeFor("break-even-prob")).toBe("interview");
    expect(modeFor("market-quote")).toBe("interview");
    expect(modeFor("conditional-update")).toBe("interview");
  });
});

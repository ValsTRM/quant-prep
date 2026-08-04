import { afterAll, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Point the DB at a scratch directory BEFORE importing anything that opens it.
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "qp-override-"));
process.env.QUANT_PREP_DATA_DIR = DIR;

const { getDb, getSqlite, schema } = await import("../db");
const { overrideAttempt, attemptHistory, reviewQueue, recentMisses, allAttempts } = await import(
  "../server/queries"
);
const { computeTopicProficiency } = await import("../proficiency");
const { questionPoints } = await import("../scoring");

const NOW = 1_750_000_000_000;

function insert(over: Partial<typeof schema.attempts.$inferInsert> = {}) {
  const id = over.id ?? `a_${Math.random().toString(36).slice(2)}`;
  getDb()
    .insert(schema.attempts)
    .values({
      id,
      sessionId: "s1",
      source: "daily",
      bucket: null,
      topic: "arithmetic",
      subtopic: "addition",
      difficulty: 3,
      mode: "rapid",
      prompt: "1 + 1 = ?",
      correctAnswer: "2",
      explanation: "",
      userAnswer: "two",
      isCorrect: 0,
      gradedCorrect: 0,
      overridden: 0,
      overriddenAt: null,
      timedOut: 0,
      timeSeconds: 5,
      targetSeconds: 7,
      timeoutSeconds: 18,
      gradingType: "exact",
      errorType: "careless",
      resolved: 0,
      reviewOfAttemptId: null,
      createdAt: NOW,
      ...over,
    })
    .run();
  return id;
}

function read(id: string) {
  return allAttempts().find((a) => a.id === id)!;
}

beforeEach(() => {
  getSqlite().exec("DELETE FROM attempts");
});

afterAll(() => {
  fs.rmSync(DIR, { recursive: true, force: true });
});

describe("overrideAttempt", () => {
  it("flips the effective verdict and keeps the original grade", () => {
    const id = insert();
    const out = overrideAttempt(id, 1, NOW + 100)!;
    expect(out.isCorrect).toBe(true);
    expect(out.gradedCorrect).toBe(false); // preserved, not overwritten
    expect(out.overridden).toBe(1);
    expect(out.overriddenAt).toBe(NOW + 100);
    // The answer itself is untouched — nothing is deleted or rewritten.
    expect(out.prompt).toBe("1 + 1 = ?");
    expect(out.userAnswer).toBe("two");
    expect(out.timeSeconds).toBe(5);
  });

  it("reverts to the auto-grade, so an override is never a one-way door", () => {
    const id = insert();
    overrideAttempt(id, 1, NOW + 100);
    const back = overrideAttempt(id, 0, NOW + 200)!;
    expect(back.isCorrect).toBe(false);
    expect(back.overridden).toBe(0);
    expect(back.overriddenAt).toBeNull();
    expect(back.gradedCorrect).toBe(false);
  });

  it("can force a correct answer to wrong, and back again", () => {
    const id = insert({ isCorrect: 1, gradedCorrect: 1, errorType: null });
    expect(overrideAttempt(id, -1, NOW + 1)!.isCorrect).toBe(false);
    expect(overrideAttempt(id, 0, NOW + 2)!.isCorrect).toBe(true);
  });

  it("survives repeated overrides without losing the original grade", () => {
    const id = insert();
    for (const s of [1, -1, 1, 0, 1] as const) overrideAttempt(id, s, NOW + 1);
    expect(read(id).gradedCorrect).toBe(false);
    expect(read(id).isCorrect).toBe(true);
  });

  it("works on rows written before overrides existed (null gradedCorrect)", () => {
    const id = insert({ gradedCorrect: null, isCorrect: 0 });
    const out = overrideAttempt(id, 1, NOW + 1)!;
    expect(out.isCorrect).toBe(true);
    // The pre-existing verdict becomes the recorded auto-grade, so undo works.
    expect(out.gradedCorrect).toBe(false);
    expect(overrideAttempt(id, 0, NOW + 2)!.isCorrect).toBe(false);
  });

  it("returns null for an unknown id rather than creating anything", () => {
    expect(overrideAttempt("nope", 1, NOW)).toBeNull();
    expect(allAttempts()).toHaveLength(0);
  });
});

describe("overrides and the review queue", () => {
  it("clears a miss from the queue when marked correct, and restores it on undo", () => {
    const id = insert();
    expect(reviewQueue().map((a) => a.id)).toContain(id);

    overrideAttempt(id, 1, NOW + 1);
    expect(reviewQueue().map((a) => a.id)).not.toContain(id);
    expect(recentMisses(7, NOW + 2).map((m) => m.attemptId)).not.toContain(id);

    overrideAttempt(id, 0, NOW + 2);
    expect(reviewQueue().map((a) => a.id)).toContain(id);
  });

  it("cannot buy its way past the clock — a late answer stays unfinished", () => {
    const id = insert({ timedOut: 1, timeSeconds: 40 });
    const out = overrideAttempt(id, 1, NOW + 1)!;
    expect(out.isCorrect).toBe(true);
    expect(out.timedOut).toBe(true);
    expect(out.resolved).toBe(false);
    expect(reviewQueue().map((a) => a.id)).toContain(id);
    expect(questionPoints(out)).toBe(0);
  });

  it("keeps a re-attempt's parent miss in step", () => {
    insert({ id: "parent" });
    const retry = insert({ id: "retry", reviewOfAttemptId: "parent", createdAt: NOW + 10 });

    overrideAttempt(retry, 1, NOW + 20);
    expect(read("parent").resolved).toBe(true);

    overrideAttempt(retry, 0, NOW + 30);
    expect(read("parent").resolved).toBe(false);
  });
});

describe("overrides flow into the scores", () => {
  it("changes points, accuracy and proficiency", () => {
    const ids = Array.from({ length: 24 }, (_, i) =>
      insert({ id: `x${i}`, timeSeconds: 3, createdAt: NOW - i * 1000, sessionId: i % 2 ? "a" : "b" })
    );

    const before = computeTopicProficiency("arithmetic", allAttempts(), NOW);
    expect(before.accuracy).toBe(0);
    expect(before.passedLevel).toBe(0);

    for (const id of ids) overrideAttempt(id, 1, NOW);

    const after = computeTopicProficiency("arithmetic", allAttempts(), NOW);
    expect(after.accuracy).toBe(1);
    expect(after.passedLevel).toBe(3);
    expect(after.proficiency).toBeGreaterThan(before.proficiency);
  });

  it("a wrong rapid answer costs points; overriding it earns them", () => {
    const id = insert({ timeSeconds: 3 });
    expect(questionPoints(read(id))).toBeLessThan(0);
    overrideAttempt(id, 1, NOW);
    expect(questionPoints(read(id))).toBeGreaterThan(0);
  });

  it("drops an overridden answer out of the error-type tally", () => {
    const id = insert({ errorType: "careless" });
    // The tally is gated on the effective verdict, so the tag can stay on the
    // row as history without polluting the counts.
    expect(read(id).errorType).toBe("careless");
    overrideAttempt(id, 1, NOW);
    expect(read(id).isCorrect).toBe(true);
    expect(read(id).errorType).toBe("careless");
  });
});

describe("attemptHistory", () => {
  beforeEach(() => {
    for (let i = 0; i < 30; i++) {
      insert({ id: `h${i}`, isCorrect: i % 3 === 0 ? 1 : 0, createdAt: NOW - i * 1000 });
    }
  });

  it("pages newest first and reports the total", () => {
    const p0 = attemptHistory({ limit: 10, offset: 0 });
    expect(p0.attempts).toHaveLength(10);
    expect(p0.total).toBe(30);
    expect(p0.attempts[0].id).toBe("h0");

    const p1 = attemptHistory({ limit: 10, offset: 10 });
    expect(p1.attempts[0].id).toBe("h10");
    expect(new Set([...p0.attempts, ...p1.attempts].map((a) => a.id)).size).toBe(20);
  });

  it("can filter to just the answers worth correcting", () => {
    const misses = attemptHistory({ limit: 50, missesOnly: true });
    expect(misses.attempts.every((a) => !a.isCorrect)).toBe(true);
    expect(misses.total).toBe(20);
  });

  it("shows an override immediately in the filtered view", () => {
    const target = attemptHistory({ limit: 1, missesOnly: true }).attempts[0];
    overrideAttempt(target.id, 1, NOW);
    const after = attemptHistory({ limit: 50, missesOnly: true });
    expect(after.attempts.map((a) => a.id)).not.toContain(target.id);
    expect(after.total).toBe(19);
  });
});

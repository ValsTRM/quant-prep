import { afterAll, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ALL_SECTIONS,
  CHAPTERS,
  authoredSections,
  isAuthored,
  problemById,
  sectionBySlug,
  totalBookProblems,
  totalProblems,
} from "../greenbook";
import { CH4_SECTIONS } from "../greenbook/ch4";
import { gradeAnswer } from "../grading";
import { TOPICS } from "../types";

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), "qp-gb-"));
process.env.QUANT_PREP_DATA_DIR = DIR;

const { getDb, getSqlite, schema } = await import("../db");
const { attemptsByTrack, allAttempts } = await import("../server/queries");
const { saveSectionProgress, sectionProgress, greenBookSummary, greenBookAttempts } = await import(
  "../server/greenbook"
);
const { computeAllProficiencies } = await import("../proficiency");

afterAll(() => fs.rmSync(DIR, { recursive: true, force: true }));

/* ------------------------------- the content ------------------------------- */

describe("book index", () => {
  it("covers all seven chapters with unique slugs", () => {
    expect(CHAPTERS.map((c) => c.chapter)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const slugs = ALL_SECTIONS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((s) => /^[0-9.]+-[a-z0-9-]+$/.test(s))).toBe(true);
  });

  it("gives every section a sane page range and a real topic", () => {
    for (const s of ALL_SECTIONS) {
      expect(s.pages[0], s.slug).toBeGreaterThan(0);
      expect(s.pages[1], s.slug).toBeGreaterThanOrEqual(s.pages[0]);
      expect(TOPICS, s.slug).toContain(s.topic);
    }
  });

  it("has Chapter 4 authored and the rest indexed", () => {
    expect(authoredSections().map((s) => s.number)).toEqual([
      "4.1",
      "4.2",
      "4.3",
      "4.4",
      "4.5",
      "4.6",
    ]);
    for (const s of ALL_SECTIONS) {
      if (s.chapter === 4) expect(isAuthored(s), s.slug).toBe(true);
      else expect(isAuthored(s), s.slug).toBe(false);
    }
  });

  it("indexes the book's own problems with page numbers inside their section", () => {
    expect(totalBookProblems()).toBe(42);
    for (const s of CH4_SECTIONS) {
      expect(s.bookProblems.length, s.slug).toBeGreaterThan(0);
      for (const bp of s.bookProblems) {
        expect(bp.page, `${bp.title} outside ${s.number}`).toBeGreaterThanOrEqual(s.pages[0] - 1);
        expect(bp.page, `${bp.title} outside ${s.number}`).toBeLessThanOrEqual(s.pages[1] + 1);
      }
    }
    const ids = CH4_SECTIONS.flatMap((s) => s.bookProblems.map((b) => b.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("authored teaching content", () => {
  it("gives each section real prose, key ideas, self-checks and an example", () => {
    for (const s of CH4_SECTIONS) {
      expect(s.concept.length, s.slug).toBeGreaterThanOrEqual(3);
      expect(s.concept.every((p) => p.length > 120), s.slug).toBe(true);
      expect(s.keyIdeas.length, s.slug).toBeGreaterThanOrEqual(4);
      expect(s.checkYourself.length, s.slug).toBeGreaterThanOrEqual(3);
      expect(s.examples.length, s.slug).toBeGreaterThanOrEqual(1);
      expect(s.summary.length, s.slug).toBeGreaterThan(20);
    }
  });

  it("gives every worked example multiple steps, an answer and a takeaway", () => {
    for (const s of CH4_SECTIONS) {
      for (const ex of s.examples) {
        expect(ex.steps.length, ex.id).toBeGreaterThanOrEqual(3);
        expect(ex.answer.length, ex.id).toBeGreaterThan(0);
        expect(ex.takeaway.length, ex.id).toBeGreaterThan(40);
      }
    }
  });
});

describe("practice problems", () => {
  const problems = CH4_SECTIONS.flatMap((s) => s.problems);

  it("has a decent pool per section, with unique ids", () => {
    expect(totalProblems()).toBe(problems.length);
    expect(problems.length).toBeGreaterThanOrEqual(36);
    for (const s of CH4_SECTIONS) expect(s.problems.length, s.slug).toBeGreaterThanOrEqual(6);
    const ids = problems.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("grades its own answer as correct and a far-off one as wrong", () => {
    for (const p of problems) {
      expect(gradeAnswer(p, p.answer).correct, p.id).toBe(true);
      const off = (p.answerValue ?? 0) + Math.max(10, Math.abs(p.answerValue ?? 0) * 3 + 1);
      expect(gradeAnswer(p, String(off)).correct, p.id).toBe(false);
    }
  });

  it("agrees between the stated answer string and its numeric value", () => {
    for (const p of problems) {
      if (p.answerValue === undefined) continue;
      expect(parseFloat(p.answer), p.id).toBeCloseTo(p.answerValue, 4);
    }
  });

  it("gives every problem a three-step hint ladder ending in the method", () => {
    for (const p of problems) {
      expect(p.hints.length, p.id).toBeGreaterThanOrEqual(3);
      expect(p.hints.map((h) => h.level), p.id).toEqual([1, 2, 3]);
      // The last hint should be more concrete than the first.
      expect(p.hints[2].text.length, p.id).toBeGreaterThan(0);
      for (const h of p.hints) expect(h.text.length, `${p.id} L${h.level}`).toBeGreaterThan(10);
    }
  });

  it("explains every answer and sits on the 1-5 difficulty ladder", () => {
    for (const p of problems) {
      expect(p.explanation.length, p.id).toBeGreaterThan(40);
      expect(p.difficulty, p.id).toBeGreaterThanOrEqual(1);
      expect(p.difficulty, p.id).toBeLessThanOrEqual(5);
      expect(p.targetSeconds, p.id).toBeGreaterThan(0);
    }
  });

  it("keeps every probability answer inside [0,1]", () => {
    for (const p of problems) {
      if (!/probability|P\(/.test(p.prompt) || p.answerValue === undefined) continue;
      if (p.gradingType === "exact") continue; // counting answers, not probabilities
      expect(p.answerValue, p.id).toBeGreaterThanOrEqual(0);
      expect(p.answerValue, p.id).toBeLessThanOrEqual(1);
    }
  });

  it("finds problems by section and id", () => {
    expect(problemById("4.3-conditional-probability-and-bayes", "4.3-p1")?.answerValue).toBeCloseTo(
      1 / 3,
      2
    );
    expect(problemById("nope", "4.3-p1")).toBeUndefined();
    expect(sectionBySlug("4.6-order-statistics")?.number).toBe("4.6");
  });
});

/* ------------------------------- the two tracks ---------------------------- */

function insertAttempt(over: Partial<typeof schema.attempts.$inferInsert> = {}) {
  const id = over.id ?? `a_${Math.random().toString(36).slice(2)}`;
  getDb()
    .insert(schema.attempts)
    .values({
      id,
      sessionId: "s",
      source: "daily",
      bucket: null,
      track: "mental-math",
      sectionSlug: null,
      topic: "probability",
      subtopic: "dice",
      difficulty: 3,
      mode: "interview",
      prompt: `q ${id}`,
      correctAnswer: "1",
      explanation: "",
      userAnswer: "1",
      isCorrect: 1,
      gradedCorrect: 1,
      overridden: 0,
      overriddenAt: null,
      timedOut: 0,
      timeSeconds: 10,
      targetSeconds: 25,
      timeoutSeconds: 75,
      gradingType: "numeric_tolerance",
      errorType: null,
      resolved: 1,
      reviewOfAttemptId: null,
      createdAt: 1_750_000_000_000,
      ...over,
    })
    .run();
  return id;
}

describe("the two tracks stay separate", () => {
  beforeEach(() => {
    getSqlite().exec("DELETE FROM attempts; DELETE FROM gb_progress");
  });

  it("defaults existing-style rows to mental math", () => {
    insertAttempt();
    expect(allAttempts()[0].track).toBe("mental-math");
  });

  it("keeps Green Book answers out of the mental-math statistics", () => {
    for (let i = 0; i < 5; i++) insertAttempt({ id: `mm${i}` });
    for (let i = 0; i < 30; i++) {
      insertAttempt({
        id: `gb${i}`,
        track: "green-book",
        sectionSlug: "4.3-conditional-probability-and-bayes",
        source: "greenbook",
      });
    }

    expect(allAttempts()).toHaveLength(35);
    expect(attemptsByTrack("mental-math")).toHaveLength(5);
    expect(attemptsByTrack("green-book")).toHaveLength(30);

    // 30 perfect Green Book answers must not lift the mental-math score.
    const mm = computeAllProficiencies(attemptsByTrack("mental-math"), 1_750_000_100_000);
    const prob = mm.find((p) => p.topic === "probability")!;
    expect(prob.attemptCount).toBe(5);
    expect(prob.passedLevel).toBe(0); // 5 answers can't pass a level
  });

  it("scopes Green Book attempts to their section", () => {
    insertAttempt({ id: "x", track: "green-book", sectionSlug: "4.1-basic-probability-and-set-operations" });
    insertAttempt({ id: "y", track: "green-book", sectionSlug: "4.6-order-statistics" });
    expect(greenBookAttempts("4.6-order-statistics")).toHaveLength(1);
    expect(greenBookAttempts()).toHaveLength(2);
  });
});

describe("section progress", () => {
  const SLUG = "4.3-conditional-probability-and-bayes";

  beforeEach(() => {
    getSqlite().exec("DELETE FROM attempts; DELETE FROM gb_progress");
  });

  it("starts every section as not-started with no state", () => {
    const p = sectionProgress(SLUG);
    expect(p.status).toBe("not-started");
    expect(p.notes).toBe("");
    expect(p.bookProblemsDone).toEqual([]);
    expect(p.attempted).toBe(0);
  });

  it("merges patches rather than replacing state", () => {
    saveSectionProgress(SLUG, { notes: "Bayes via natural frequencies", status: "learning" }, 1000);
    saveSectionProgress(SLUG, { bookProblemsDone: ["4.3-b8"] }, 2000);
    const p = sectionProgress(SLUG);
    // Ticking a problem must not wipe the notes.
    expect(p.notes).toBe("Bayes via natural frequencies");
    expect(p.bookProblemsDone).toEqual(["4.3-b8"]);

    saveSectionProgress(SLUG, { notes: "updated" }, 3000);
    expect(sectionProgress(SLUG).bookProblemsDone).toEqual(["4.3-b8"]);
    expect(sectionProgress(SLUG).notes).toBe("updated");
  });

  it("records hint usage per problem", () => {
    saveSectionProgress(SLUG, { hintsUsed: { "4.3-p5": 2 } }, 1000);
    expect(sectionProgress(SLUG).hintsUsed).toEqual({ "4.3-p5": 2 });
  });

  it("stamps completion, and clears it if you reopen the section", () => {
    saveSectionProgress(SLUG, { status: "done" }, 5000);
    expect(sectionProgress(SLUG).completedAt).toBe(5000);
    saveSectionProgress(SLUG, { status: "practising" }, 6000);
    expect(sectionProgress(SLUG).completedAt).toBeNull();
  });

  it("rejects an unknown section instead of creating one", () => {
    expect(() => saveSectionProgress("not-a-section", { notes: "x" }, 1)).toThrow();
  });

  it("counts answers against the section", () => {
    insertAttempt({ id: "g1", track: "green-book", sectionSlug: SLUG, isCorrect: 1 });
    insertAttempt({ id: "g2", track: "green-book", sectionSlug: SLUG, isCorrect: 0 });
    const p = sectionProgress(SLUG);
    expect(p.attempted).toBe(2);
    expect(p.correct).toBe(1);
  });
});

describe("greenBookSummary", () => {
  beforeEach(() => {
    getSqlite().exec("DELETE FROM attempts; DELETE FROM gb_progress");
  });

  it("is zero on a fresh install", () => {
    const s = greenBookSummary();
    expect(s.coverage).toBe(0);
    expect(s.done).toBe(0);
    expect(s.authored).toBe(6);
    expect(s.totalBookProblems).toBe(42);
  });

  it("cannot read high while most of the book is untouched", () => {
    // Finish one section perfectly out of six authored.
    saveSectionProgress("4.1-basic-probability-and-set-operations", { status: "done" }, 1);
    for (let i = 0; i < 6; i++) {
      insertAttempt({
        id: `s${i}`,
        track: "green-book",
        sectionSlug: "4.1-basic-probability-and-set-operations",
      });
    }
    const s = greenBookSummary();
    expect(s.done).toBe(1);
    expect(s.problemsCorrect).toBe(6);
    expect(s.coverage).toBeGreaterThan(0);
    expect(s.coverage).toBeLessThan(20);
  });

  it("counts the book's own problems toward coverage", () => {
    const before = greenBookSummary().coverage;
    saveSectionProgress(
      "4.3-conditional-probability-and-bayes",
      { bookProblemsDone: ["4.3-b1", "4.3-b2", "4.3-b8"] },
      1
    );
    const after = greenBookSummary();
    expect(after.bookProblemsDone).toBe(3);
    expect(after.coverage).toBeGreaterThanOrEqual(before);
  });
});

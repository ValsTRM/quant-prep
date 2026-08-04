import { describe, expect, it } from "vitest";
import {
  checkSelfGrade,
  extractQuantities,
  gradeAnswer,
  parseNumericAnswer,
  SELF_GRADE_MIN_SECONDS,
} from "../grading";

describe("parseNumericAnswer", () => {
  it("parses plain numbers", () => {
    expect(parseNumericAnswer("42")).toBe(42);
    expect(parseNumericAnswer("-3.5")).toBe(-3.5);
    expect(parseNumericAnswer("  7 ")).toBe(7);
  });

  it("parses thousands separators and currency", () => {
    expect(parseNumericAnswer("1,234")).toBe(1234);
    expect(parseNumericAnswer("$40")).toBe(40);
    expect(parseNumericAnswer("$1,250.50")).toBe(1250.5);
  });

  it("parses percents as their number", () => {
    expect(parseNumericAnswer("75%")).toBe(75);
    expect(parseNumericAnswer("12.5%")).toBe(12.5);
  });

  it("parses fractions and mixed numbers", () => {
    expect(parseNumericAnswer("3/4")).toBe(0.75);
    expect(parseNumericAnswer("5/36")).toBeCloseTo(5 / 36, 10);
    expect(parseNumericAnswer("1 1/2")).toBe(1.5);
    expect(parseNumericAnswer("-1 1/2")).toBe(-1.5);
  });

  it("rejects garbage and zero denominators", () => {
    expect(parseNumericAnswer("abc")).toBeNull();
    expect(parseNumericAnswer("")).toBeNull();
    expect(parseNumericAnswer("3/0")).toBeNull();
  });
});

describe("gradeAnswer", () => {
  const exactQ = { gradingType: "exact" as const, answer: "144", answerValue: 144 };
  const tolQ = {
    gradingType: "numeric_tolerance" as const,
    answer: "0.1389",
    answerValue: 5 / 36,
    tolerance: 0.02,
  };
  const selfQ = { gradingType: "self_grade" as const, answer: "8400000" };

  it("grades exact answers strictly", () => {
    expect(gradeAnswer(exactQ, "144").correct).toBe(true);
    expect(gradeAnswer(exactQ, " 144 ").correct).toBe(true);
    expect(gradeAnswer(exactQ, "143").correct).toBe(false);
    expect(gradeAnswer(exactQ, "144.5").correct).toBe(false);
  });

  it("accepts equivalent forms for exact answers", () => {
    const half = { gradingType: "exact" as const, answer: "0.5", answerValue: 0.5 };
    expect(gradeAnswer(half, "1/2").correct).toBe(true);
    expect(gradeAnswer(half, "0.50").correct).toBe(true);
  });

  it("grades within tolerance", () => {
    expect(gradeAnswer(tolQ, "0.139").correct).toBe(true);
    expect(gradeAnswer(tolQ, "5/36").correct).toBe(true);
    expect(gradeAnswer(tolQ, "0.14").correct).toBe(true); // within abs floor
    expect(gradeAnswer(tolQ, "0.2").correct).toBe(false);
    expect(gradeAnswer(tolQ, "1/6").correct).toBe(false);
  });

  it("never auto-passes self-graded questions", () => {
    expect(gradeAnswer(selfQ, "8400000").correct).toBe(false);
  });

  it("rejects unparseable input", () => {
    expect(gradeAnswer(exactQ, "wat").correct).toBe(false);
    expect(gradeAnswer(tolQ, "").correct).toBe(false);
  });

  it("grades A/B choice questions leniently on formatting, strictly on content", () => {
    const choiceQ = { gradingType: "choice" as const, answer: "B" };
    for (const input of ["B", "b", " b ", "b)", "(B)"]) {
      expect(gradeAnswer(choiceQ, input).correct, input).toBe(true);
    }
    expect(gradeAnswer(choiceQ, "A").correct).toBe(false);
    expect(gradeAnswer(choiceQ, "").correct).toBe(false);
  });
});

describe("checkSelfGrade", () => {
  const q = { answerValue: 8_400_000, subtopic: "fermi" };

  it("refuses credit for a blank answer — the diagnostic's free points", () => {
    const check = checkSelfGrade(q, "", 30);
    expect(check.allowed).toBe(false);
    expect(check.reason).toMatch(/decompos/i);
  });

  it("refuses credit for an answer submitted implausibly fast", () => {
    const check = checkSelfGrade(q, "about 8 million, 16/min x 60 x 24 x 365", 5);
    expect(check.allowed).toBe(false);
    expect(check.reason).toMatch(/too fast/i);
    expect(checkSelfGrade(q, "8 million via 16/min", SELF_GRADE_MIN_SECONDS).allowed).toBe(true);
  });

  it("checks a numeric estimate against the factor-of-2 band", () => {
    expect(checkSelfGrade(q, "8000000 — 16/min x 525k min", 40).withinFactor).toBe(true);
    expect(checkSelfGrade(q, "15000000 breaths, 30/min", 40).withinFactor).toBe(true);
    expect(checkSelfGrade(q, "80000000 breaths, way off", 40).withinFactor).toBe(false);
    expect(checkSelfGrade(q, "500000 breaths", 40).withinFactor).toBe(false);
  });

  it("reads the quantity out of prose, not just the first digits", () => {
    // "about 8 million, ..." must not be scored as the number 8.
    for (const answer of [
      "about 8 million, from 16/min x 60 x 24 x 365",
      "~8.4M breaths — 16 a minute, 525,600 minutes a year",
      "8.4e6",
      "roughly 8 x 10^6",
      "16 breaths/min × 60 × 24 × 365 ≈ 8400000",
    ]) {
      expect(checkSelfGrade(q, answer, 40).withinFactor, answer).toBe(true);
    }
    expect(checkSelfGrade(q, "about 8 thousand, I think", 40).withinFactor).toBe(false);
  });

  it("extracts magnitudes and scientific forms", () => {
    expect(extractQuantities("3 million")).toContain(3e6);
    expect(extractQuantities("250k")).toContain(250_000);
    expect(extractQuantities("1.5bn")).toContain(1.5e9);
    expect(extractQuantities("2.9e9")).toContain(2.9e9);
    expect(extractQuantities("3 x 10^9")).toContain(3e9);
    expect(extractQuantities("10^5")).toContain(1e5);
    expect(extractQuantities("1,234")).toContain(1234);
    expect(extractQuantities("no numbers here")).toEqual([]);
  });

  it("allows a written non-numeric answer through to the user's own judgement", () => {
    const oral = { answerValue: undefined, subtopic: "oral" };
    const check = checkSelfGrade(oral, "explained linearity of expectation with a 2-dice example", 45);
    expect(check.allowed).toBe(true);
    expect(check.withinFactor).toBeNull();
  });
});

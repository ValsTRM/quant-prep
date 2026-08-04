import { describe, expect, it } from "vitest";
import { currentWeekNumber, weekInfo, STUDY_PLAN } from "../studyPlan";
import { computeStreak, localDay } from "../streak";
import { summarizeDiagnostic } from "../diagnostic";

const DAY = 86_400_000;
const NOW = 1_750_000_000_000;

describe("studyPlan", () => {
  it("has 12 weeks in order", () => {
    expect(STUDY_PLAN).toHaveLength(12);
    STUDY_PLAN.forEach((w, i) => expect(w.week).toBe(i + 1));
  });

  it("computes the current week from the start date", () => {
    expect(currentWeekNumber(NOW, NOW)).toBe(1);
    expect(currentWeekNumber(NOW - 6 * DAY, NOW)).toBe(1);
    expect(currentWeekNumber(NOW - 7 * DAY, NOW)).toBe(2);
    expect(currentWeekNumber(NOW - 13 * DAY, NOW)).toBe(2);
    expect(currentWeekNumber(NOW - 14 * DAY, NOW)).toBe(3);
    expect(currentWeekNumber(NOW - 200 * DAY, NOW)).toBe(12); // clamped
  });

  it("maps week numbers to phases", () => {
    expect(weekInfo(1).title).toMatch(/Arithmetic/);
    expect(weekInfo(4).title).toMatch(/Conditional/);
    expect(weekInfo(9).topics).toContain("market-making");
    expect(weekInfo(12).phase).toBe("Weeks 11-12");
  });
});

describe("computeStreak", () => {
  it("is 0 with no attempts or a stale history", () => {
    expect(computeStreak([], NOW)).toBe(0);
    expect(computeStreak([NOW - 3 * DAY], NOW)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreak([NOW - 1000], NOW)).toBe(1);
    expect(computeStreak([NOW - 1000, NOW - DAY, NOW - 2 * DAY], NOW)).toBe(3);
  });

  it("survives when today hasn't been practiced yet", () => {
    expect(computeStreak([NOW - DAY, NOW - 2 * DAY], NOW)).toBe(2);
  });

  it("breaks on a gap", () => {
    expect(computeStreak([NOW - 1000, NOW - 2 * DAY], NOW)).toBe(1);
  });

  it("localDay formats as YYYY-MM-DD", () => {
    expect(localDay(NOW)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("summarizeDiagnostic", () => {
  const attemptsFor = (accByTopic: Record<string, [number, number]>) =>
    Object.entries(accByTopic).flatMap(([topic, [correct, total]]) =>
      Array.from({ length: total }, (_, i) => ({ topic, isCorrect: i < correct }))
    );

  it("recommends Jane Street basics when probability is weak", () => {
    const report = summarizeDiagnostic(
      attemptsFor({
        arithmetic: [18, 20],
        probability: [4, 12],
        "conditional-probability": [1, 4],
      }),
      [],
      NOW
    );
    expect(report.recommendation).toMatch(/Jane Street/);
  });

  it("recommends Green Book easy probability for the middle band", () => {
    const report = summarizeDiagnostic(
      attemptsFor({
        arithmetic: [18, 20],
        probability: [8, 12],
        "conditional-probability": [2, 4],
      }),
      [],
      NOW
    );
    expect(report.recommendation).toMatch(/Green Book/);
  });

  it("recommends timed QuantGuide-style practice when strong", () => {
    const report = summarizeDiagnostic(
      attemptsFor({
        arithmetic: [19, 20],
        probability: [11, 12],
        "conditional-probability": [4, 4],
      }),
      [],
      NOW
    );
    expect(report.recommendation).toMatch(/QuantGuide/);
  });

  it("surfaces the three lowest-accuracy topics as weaknesses", () => {
    const report = summarizeDiagnostic(
      attemptsFor({
        arithmetic: [20, 20],
        fractions: [10, 20],
        percentages: [3, 10],
        probability: [6, 12],
        "market-making": [0, 3],
      }),
      [],
      NOW
    );
    expect(report.weaknesses.map((w) => w.topic)).toEqual([
      "market-making",
      "percentages",
      "fractions",
    ]);
  });
});

import { describe, expect, it } from "vitest";
import {
  GENERATORS,
  QuestionSampler,
  archetypeDiversity,
  generateBySubtopic,
  generateByTopic,
  generateMixedSet,
  MODE_SUBTOPICS,
  TOPIC_SUBTOPICS,
} from "../generators";
import { FRACTION_POOLS } from "../generators/fractions";
import { gradeAnswer } from "../grading";
import { mulberry32 } from "../rng";
import { TOPICS, type GeneratedQuestion } from "../types";

const GRADING_TYPES = ["exact", "numeric_tolerance", "self_grade", "choice"];

/** Every (subtopic, level) pair the registry says is meaningful. */
function levelsOf(subtopic: string): number[] {
  return GENERATORS[subtopic].levels;
}

/** N instances of one archetype at one level. */
function sample(subtopic: string, difficulty: number, n = 40): GeneratedQuestion[] {
  return Array.from({ length: n }, (_, i) =>
    generateBySubtopic(subtopic, difficulty, mulberry32(i * 7919 + difficulty * 131 + 1))
  );
}

describe("every generator", () => {
  for (const [subtopic, { topic, mode, gen }] of Object.entries(GENERATORS)) {
    describe(subtopic, () => {
      it("produces well-formed questions at every difficulty", () => {
        for (let d = 1; d <= 5; d++) {
          for (let seed = 1; seed <= 10; seed++) {
            const q = gen(d, mulberry32(seed * 1000 + d));
            expect(q.topic).toBe(topic);
            expect(q.mode).toBe(mode);
            expect(q.difficulty).toBe(d);
            expect(q.prompt.length).toBeGreaterThan(5);
            expect(q.answer.length).toBeGreaterThan(0);
            expect(q.explanation.length).toBeGreaterThan(5);
            expect(GRADING_TYPES).toContain(q.gradingType);
            expect(q.targetSeconds).toBeGreaterThan(0);
            expect(q.timeoutSeconds).toBeGreaterThan(q.targetSeconds);
            if (q.gradingType !== "self_grade" && q.gradingType !== "choice") {
              expect(q.answerValue).toBeTypeOf("number");
              expect(Number.isFinite(q.answerValue)).toBe(true);
            }
          }
        }
      });

      it("grades its own canonical answer as correct, and a far-off answer as wrong", () => {
        for (let d = 1; d <= 5; d++) {
          const q = gen(d, mulberry32(d * 7 + 1));
          if (q.gradingType === "self_grade") continue;
          expect(gradeAnswer(q, q.answer).correct).toBe(true);
          const wrong =
            q.gradingType === "choice"
              ? q.answer === "A"
                ? "B"
                : "A"
              : String((q.answerValue ?? 0) + Math.max(10, Math.abs(q.answerValue ?? 0) * 2 + 1));
          expect(gradeAnswer(q, wrong).correct).toBe(false);
        }
      });

      it("is deterministic for a given seed", () => {
        const a = gen(3, mulberry32(42));
        const b = gen(3, mulberry32(42));
        expect(a.prompt).toBe(b.prompt);
        expect(a.answer).toBe(b.answer);
      });

      it("varies: 40 seeds produce many distinct prompts", () => {
        for (const d of levelsOf(subtopic)) {
          const prompts = new Set(sample(subtopic, d).map((q) => q.prompt));
          expect(prompts.size, `${subtopic} L${d} only made ${prompts.size} distinct prompts`)
            .toBeGreaterThanOrEqual(6);
        }
      });
    });
  }
});

/* ------------------------- structural hardness ladder ------------------------ */

/**
 * A cheap proxy for "how much work is this": digits involved, operation count,
 * and whether the numbers are the friendly kind. It only has to be monotone
 * enough to catch a level-4 question that is easier than a level-1 one — which
 * is exactly what the recorded diagnostic contained.
 */
function workload(q: GeneratedQuestion): number {
  const numbers = (q.prompt.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const digitsOf = (n: number) => String(Math.trunc(Math.abs(n))).length;
  const digits = numbers.reduce((s, n) => s + digitsOf(n), 0);
  const ops = (q.prompt.match(/[+×÷−\-*/]/g) ?? []).length;
  const decimals = (q.prompt.match(/\d\.\d/g) ?? []).length;
  const friendly = numbers.filter((n) => n % 10 === 0 || n === 1 || n === 2).length;
  // Multiplication cost is partial products, not digit count: 3d×1d needs 3,
  // 2d×2d needs 4. Without this the two look identical, and 2d×2d is plainly
  // the harder screening question.
  const partialProducts =
    q.prompt.includes("×") && numbers.length >= 2
      ? digitsOf(numbers[0]) * digitsOf(numbers[1])
      : 0;
  return digits + 2 * ops + 2 * decimals + partialProducts - friendly;
}

describe("difficulty is structural, not cosmetic", () => {
  const ARITHMETIC = ["addition", "subtraction", "multiplication", "division"];

  it.each(ARITHMETIC)("%s gets measurably heavier level by level", (subtopic) => {
    const means = [1, 2, 3, 4, 5].map((d) => {
      const qs = sample(subtopic, d, 60);
      return qs.reduce((s, q) => s + workload(q), 0) / qs.length;
    });
    for (let i = 1; i < means.length; i++) {
      expect(means[i], `${subtopic}: L${i + 1} (${means[i].toFixed(1)}) ≤ L${i} (${means[i - 1].toFixed(1)})`)
        .toBeGreaterThan(means[i - 1]);
    }
  });

  it("never serves a trivial divisor above level 2", () => {
    for (let d = 3; d <= 5; d++) {
      for (const q of sample("division", d, 80)) {
        const divisor = Number(q.prompt.split("÷")[1].trim().split(" ")[0]);
        expect(divisor % 10, `${q.prompt}`).not.toBe(0);
        expect(divisor % 5, `${q.prompt}`).not.toBe(0);
        expect(divisor).toBeGreaterThan(11);
      }
    }
  });

  it("produces non-exact division from level 3 up", () => {
    const nonExact = [3, 4, 5].flatMap((d) =>
      sample("division", d, 60).filter((q) => q.prompt.includes("decimal places"))
    );
    expect(nonExact.length).toBeGreaterThan(0);
    for (let d = 1; d <= 2; d++) {
      expect(sample("division", d, 40).every((q) => Number.isInteger(q.answerValue))).toBe(true);
    }
  });

  it("puts 2-digit × 2-digit at level 3 and 3-digit × 2-digit at level 4", () => {
    for (const q of sample("multiplication", 3, 40)) {
      const [a, b] = q.prompt.split("×").map((s) => Number(s.replace("= ?", "").trim()));
      expect(a).toBeGreaterThanOrEqual(13);
      expect(b).toBeGreaterThanOrEqual(13);
      expect(a).toBeLessThan(100);
      expect(b).toBeLessThan(100);
    }
    for (const q of sample("multiplication", 4, 40)) {
      const [a] = q.prompt.split("×").map((s) => Number(s.trim()));
      expect(a).toBeGreaterThanOrEqual(100);
    }
  });

  it("forces carries and borrows at the higher levels", () => {
    for (const q of sample("addition", 4, 40)) {
      expect(q.explanation).toMatch(/needs [2-9] carries/);
    }
    for (const q of sample("subtraction", 4, 40)) {
      expect(q.explanation).toMatch(/needs [2-9] borrows/);
    }
  });
});

describe("no degenerate-easy instances", () => {
  it("fraction pools are already reduced, so 6/12 can never become 1/2", () => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    for (const [level, pool] of Object.entries(FRACTION_POOLS)) {
      for (const { num, den } of pool) {
        expect(gcd(num, den), `L${level}: ${num}/${den} is reducible`).toBe(1);
      }
    }
  });

  it("never serves 1/2 above level 1 — the bug that produced 'Convert 1/2' at difficulty 4", () => {
    for (const subtopic of ["fraction-to-decimal", "fraction-to-percent"]) {
      for (let d = 2; d <= 5; d++) {
        for (const q of sample(subtopic, d, 60)) {
          expect(q.prompt, `${subtopic} L${d}`).not.toMatch(/\b1\/2\b/);
          expect(q.prompt, `${subtopic} L${d}`).not.toMatch(/\b(1|3)\/(4|5|10)\b/);
        }
      }
    }
  });

  it("bans memorised percentages above level 2", () => {
    for (const subtopic of ["percent-of", "reverse-percent"]) {
      for (let d = 3; d <= 5; d++) {
        for (const q of sample(subtopic, d, 60)) {
          const pct = Number(q.prompt.match(/(\d+(?:\.\d+)?)%/)![1]);
          expect([10, 20, 25, 50, 100], `${subtopic} L${d}: ${q.prompt}`).not.toContain(pct);
        }
      }
    }
  });

  it("keeps one-die questions out of level 3 and above", () => {
    for (let d = 3; d <= 5; d++) {
      for (const q of sample("dice", d, 60)) {
        expect(q.prompt, `dice L${d}`).not.toMatch(/roll one fair die/);
      }
    }
  });

  it("scales EV outcome count with level", () => {
    const outcomes = (q: GeneratedQuestion) => (q.prompt.match(/chance of/g) ?? []).length;
    const mean = (d: number) => {
      const qs = sample("discrete-ev", d, 40);
      return qs.reduce((s, q) => s + outcomes(q), 0) / qs.length;
    };
    expect(mean(1)).toBe(2);
    expect(mean(3)).toBe(3);
    expect(mean(5)).toBe(5);
  });

  it("only offers market quotes and conditional updates at level 3 and up", () => {
    expect(levelsOf("market-quote")).toEqual([3, 4, 5]);
    expect(levelsOf("conditional-update")).toEqual([3, 4, 5]);
  });
});

describe("generator-specific properties", () => {
  it("probability answers are valid probabilities", () => {
    for (const sub of ["dice", "coins", "cards", "conditional"]) {
      for (let seed = 0; seed < 60; seed++) {
        const q = generateBySubtopic(sub, 1 + (seed % 5), mulberry32(seed));
        expect(q.answerValue, `${sub}: ${q.prompt}`).toBeGreaterThan(0);
        expect(q.answerValue, `${sub}: ${q.prompt}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("break-even probabilities are between 0 and 100 percent", () => {
    for (let d = 1; d <= 5; d++) {
      for (const q of sample("break-even-prob", d, 40)) {
        expect(q.answerValue).toBeGreaterThan(0);
        expect(q.answerValue).toBeLessThan(100);
      }
    }
  });

  it("break-even answers satisfy p·win = (1−p)·loss at the simple levels", () => {
    for (const q of sample("break-even-prob", 3, 40)) {
      const [, win, loss] = q.prompt.match(/\$(\d+) when it works and loses \$(\d+)/)!.map(Number);
      expect(q.answerValue!).toBeCloseTo((loss / (win + loss)) * 100, 1);
    }
  });

  it("sequential percent answers match the changes stated in the prompt", () => {
    for (let seed = 0; seed < 60; seed++) {
      const q = generateBySubtopic("sequential-percent", 1 + (seed % 5), mulberry32(seed));
      const matches = [...q.prompt.matchAll(/(up|down) (\d+(?:\.\d+)?)%/g)];
      expect(matches.length).toBeGreaterThanOrEqual(2);
      const factor = matches.reduce(
        (f, m) => f * (1 + ((m[1] === "up" ? 1 : -1) * parseFloat(m[2])) / 100),
        1
      );
      expect((factor - 1) * 100).toBeCloseTo(q.answerValue!, 1);
    }
  });

  it("percentage chains land on the price the prompt describes", () => {
    for (let seed = 0; seed < 60; seed++) {
      const q = generateBySubtopic("percentage-chain", 2 + (seed % 4), mulberry32(seed));
      if (!q.prompt.includes("final price")) continue;
      const start = Number(q.prompt.match(/starts at \$(\d+(?:\.\d+)?)/)![1]);
      const factor = [...q.prompt.matchAll(/(rises|falls) (\d+(?:\.\d+)?)%/g)].reduce(
        (f, m) => f * (1 + ((m[1] === "rises" ? 1 : -1) * parseFloat(m[2])) / 100),
        1
      );
      expect(q.answerValue!).toBeCloseTo(start * factor, 1);
    }
  });

  it("representation comparisons pick the genuinely larger option", () => {
    for (let d = 1; d <= 5; d++) {
      for (const q of sample("representation-compare", d, 40)) {
        const [fracText, rivalText] = q.choices!;
        const [num, den] = fracText.split("/").map(Number);
        const rival = rivalText.endsWith("%")
          ? parseFloat(rivalText) / 100
          : parseFloat(rivalText);
        expect(q.answer, q.prompt).toBe(num / den > rival ? "A" : "B");
        expect(num / den).not.toBe(rival);
      }
    }
  });

  it("conditional updates move the value toward the case the fill implies", () => {
    for (let d = 3; d <= 5; d++) {
      for (const q of sample("conditional-update", d, 30)) {
        const [, high, low] = q.prompt.match(/worth \$(\d+) or \$(\d+)/)!.map(Number);
        expect(q.answerValue!).toBeGreaterThan(Math.min(low, high));
        expect(q.answerValue!).toBeLessThanOrEqual(Math.max(low, high));
        // A fill is bad news for the seller: the value updates upward from the mid.
        expect(q.answerValue!).toBeGreaterThanOrEqual((low + high) / 2 - 0.001);
      }
    }
  });

  it("market quotes sit a half-width away from fair value", () => {
    for (const q of sample("market-quote", 4, 40)) {
      if (!q.prompt.includes("What is your bid") && !q.prompt.includes("What is your offer")) continue;
      const width = Number(q.prompt.match(/market \$(\d+(?:\.\d+)?) wide/)![1]);
      const fair = Number(q.explanation.match(/Fair value is (\d+(?:\.\d+)?)/)![1]);
      expect(Math.abs(q.answerValue! - fair)).toBeCloseTo(width / 2, 2);
    }
  });

  it("fermi questions are self-graded with a positive reference", () => {
    for (let d = 1; d <= 5; d++) {
      for (const q of sample("fermi", d, 20)) {
        expect(q.gradingType).toBe("self_grade");
        expect(q.answerValue).toBeGreaterThan(0);
        expect(q.prompt).toContain("chain you used");
      }
    }
  });

  it("fermi prompts respect their level gating", () => {
    // The desk-revenue prompt is a level-5 shape and must not leak downward.
    for (let d = 1; d <= 3; d++) {
      for (const q of sample("fermi", d, 40)) {
        expect(q.prompt).not.toContain("basis points");
      }
    }
  });
});

/* ------------------------- session-level guarantees -------------------------- */

describe("QuestionSampler", () => {
  it("never repeats a prompt within a session", () => {
    const sampler = new QuestionSampler(mulberry32(11));
    const prompts: string[] = [];
    for (let i = 0; i < 40; i++) {
      prompts.push(sampler.fromSubtopic("fraction-to-decimal", 1 + (i % 3)).prompt);
    }
    // The L1 pool has 11 fractions; the sampler must not hand back a duplicate
    // until the pool is genuinely exhausted.
    const l1 = prompts.filter((p) => p.includes("/2") || p.includes("/4") || p.includes("/5"));
    expect(new Set(l1).size).toBeGreaterThan(5);
  });

  it("keeps a whole diagnostic-sized run unique across archetypes", () => {
    const sampler = new QuestionSampler(mulberry32(23));
    const seen: string[] = [];
    for (const topic of TOPICS) {
      for (let d = 1; d <= 5; d++) {
        for (let i = 0; i < 3; i++) seen.push(sampler.fromTopic(topic, d).prompt);
      }
    }
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("varies the archetype between consecutive questions from one topic", () => {
    const sampler = new QuestionSampler(mulberry32(31));
    const subs = Array.from({ length: 12 }, () => sampler.fromTopic("arithmetic", 3).subtopic);
    for (let i = 1; i < subs.length; i++) expect(subs[i]).not.toBe(subs[i - 1]);
  });
});

describe("mixed-format sets", () => {
  it("switch archetype every question and cover many shapes", () => {
    const sampler = new QuestionSampler(mulberry32(43));
    const set = generateMixedSet(sampler, mulberry32(43), 20, [2, 3, 4]);
    expect(set).toHaveLength(20);
    for (let i = 1; i < set.length; i++) expect(set[i].subtopic).not.toBe(set[i - 1].subtopic);
    expect(archetypeDiversity(set)).toBeGreaterThanOrEqual(8);
    expect(new Set(set.map((q) => q.prompt)).size).toBe(20);
    expect(new Set(set.map((q) => q.difficulty)).size).toBeGreaterThan(1);
  });

  it("can be restricted to one mode", () => {
    const sampler = new QuestionSampler(mulberry32(53));
    const rapid = generateMixedSet(sampler, mulberry32(53), 15, [2, 3, 4], "rapid");
    expect(rapid.every((q) => q.mode === "rapid")).toBe(true);
  });
});

describe("registry", () => {
  it("covers all 8 topics", () => {
    expect(Object.keys(TOPIC_SUBTOPICS).sort()).toEqual([...TOPICS].sort());
  });

  it("covers both modes with the archetypes the brief lists", () => {
    for (const s of [
      "addition",
      "subtraction",
      "multiplication",
      "division",
      "decimal-ops",
      "missing-operand",
      "sequential-arithmetic",
      "approximation",
      "fraction-to-percent",
      "representation-compare",
      "percent-of",
      "reverse-percent",
      "sequential-percent",
    ]) {
      expect(MODE_SUBTOPICS.rapid, s).toContain(s);
    }
    for (const s of [
      "discrete-ev",
      "break-even-prob",
      "odds-implied",
      "percentage-chain",
      "conditional",
      "conditional-update",
      "fair-value",
      "market-quote",
      "fermi",
      "estimation-sanity",
    ]) {
      expect(MODE_SUBTOPICS.interview, s).toContain(s);
    }
  });

  it("generateByTopic returns a question in that topic at a usable level", () => {
    for (const topic of TOPICS) {
      for (let d = 1; d <= 5; d++) {
        const q = generateByTopic(topic, d, mulberry32(7 + d));
        expect(q.topic).toBe(topic);
        expect(GENERATORS[q.subtopic].levels).toContain(d);
      }
    }
  });

  it("throws on unknown subtopic", () => {
    expect(() => generateBySubtopic("nope", 1, mulberry32(1))).toThrow();
  });
});

import { writeFileSync } from "node:fs";
import { GENERATORS, QuestionSampler } from "../src/lib/generators";
import { mulberry32 } from "../src/lib/rng";
import {
  DIFFICULTY_LEVELS,
  MODE_LABELS,
  SUBTOPIC_LABELS,
  type GeneratedQuestion,
  type QuestionMode,
} from "../src/lib/types";

/** Why this instance sits at this level — derived from the instance itself. */
function justify(q: GeneratedQuestion): string {
  const nums = (q.prompt.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const digits = nums.map((n) => String(Math.trunc(Math.abs(n))).length);
  const maxDigits = digits.length ? Math.max(...digits) : 0;
  const ops = (q.prompt.match(/[+×÷−]/g) ?? []).length;
  const bits: string[] = [];

  switch (q.subtopic) {
    case "addition":
      bits.push(`${nums.length} terms of up to ${maxDigits} digits`);
      bits.push(q.explanation.match(/needs (\d+) carries/)?.[0] ?? "carry-free");
      break;
    case "subtraction":
      bits.push(`${maxDigits}-digit minuend`);
      bits.push(q.explanation.match(/needs (\d+) borrows/)?.[0] ?? "no borrows");
      break;
    case "multiplication":
      bits.push(`${digits[0]}-digit × ${digits[1]}-digit = ${digits[0] * digits[1]} partial products`);
      if (q.difficulty === 5) bits.push("both near a round base, so the (base±x)(base±y) identity is the tractable route");
      break;
    case "division":
      bits.push(
        q.prompt.includes("decimal places")
          ? `non-exact, ${maxDigits}-digit dividend, answer carried to 2 dp`
          : `exact, divisor ${nums[1]} (not a multiple of 5 or 10 above L2)`
      );
      break;
    case "decimal-ops":
      bits.push(`decimal multiplier ${nums.find((n) => !Number.isInteger(n)) ?? "—"}; place value must be tracked`);
      break;
    case "missing-operand":
      bits.push(q.prompt.includes("(") ? "two operations to undo, in reverse order" : "one operation to invert");
      if (/\d\.\d/.test(q.prompt))
        bits.push("decimal multiplier, so the direction of the inverse is not obvious");
      break;
    case "sequential-arithmetic":
      bits.push(`${ops} chained operations held in working memory`);
      if (q.difficulty >= 4) bits.push("mixed precedence — division and multiplication before the additions");
      break;
    case "approximation":
      bits.push(
        q.difficulty <= 2
          ? "round-and-adjust; tolerance is wide"
          : "requires a first-order correction to a nearby exact anchor"
      );
      break;
    case "fraction-to-decimal":
    case "fraction-to-percent": {
      const den = Number(q.prompt.match(/\/(\d+)/)?.[1] ?? 0);
      bits.push(
        [2, 4, 5, 8, 10, 16, 20, 25, 40, 50].includes(den)
          ? `denominator ${den} terminates — recall, not computation`
          : `denominator ${den} does not terminate — must be computed`
      );
      break;
    }
    case "representation-compare":
      bits.push(`gap between the two forms is ~${[18, 11, 6, 3, 1.5][q.difficulty - 1]}%, so eyeballing fails`);
      break;
    case "percent-of":
    case "reverse-percent": {
      const pct = Number(q.prompt.match(/(\d+(?:\.\d+)?)%/)?.[1] ?? 0);
      bits.push(
        [10, 20, 25, 50, 100].includes(pct)
          ? `memorised percentage (${pct}%)`
          : `${pct}% has no shortcut — build it from 10% and 1% blocks`
      );
      if (q.subtopic === "reverse-percent") bits.push("must divide by the factor, not subtract from the result");
      break;
    }
    case "sequential-percent":
    case "percentage-chain": {
      const steps = (q.prompt.match(/(up|down|rises|falls)/g) ?? []).length;
      bits.push(`${steps} compounding moves`);
      if (q.prompt.includes("back to")) bits.push("asks for the inverse move, not the forward one");
      break;
    }
    case "discrete-ev":
      bits.push(`${(q.prompt.match(/chance of/g) ?? []).length} outcomes over a common denominator`);
      if (q.difficulty >= 5) bits.push("payoffs carry cents");
      break;
    case "break-even-prob":
      bits.push("solve EV = 0 for p");
      if (q.prompt.includes("fees")) bits.push("a fee shifts both legs");
      if (q.prompt.includes("scratched")) bits.push("a third, zero-payoff outcome changes the denominator");
      break;
    case "recursive-ev":
      bits.push(q.prompt.includes("in a row") ? "run-based recursion, not a single geometric wait" : "geometric waiting time, E = 1/p");
      break;
    case "odds-implied":
      bits.push(
        q.prompt.includes("overround") || q.prompt.includes("fair probability")
          ? "two quotes must be normalised against each other"
          : "single odds↔probability conversion"
      );
      break;
    case "dice":
    case "coins":
    case "cards":
      bits.push(`${q.prompt.match(/(one|two|three|five|\d+)/)?.[0] ?? "one"}-object sample space`);
      if (/at least|no two|none/.test(q.prompt)) bits.push("complement or inclusion–exclusion needed");
      break;
    case "conditional":
      bits.push("sample space shrinks under the condition");
      break;
    case "bayes":
      bits.push(
        q.prompt.includes("Urn A")
          ? "two hypotheses with equal priors"
          : `base rate ${q.prompt.match(/^([\d.]+)%/)?.[1]}% — low prevalence dominates test accuracy`
      );
      break;
    case "conditional-update":
      bits.push("adverse selection: the fill itself is evidence");
      bits.push(q.prompt.includes("% of counterparties") ? "mixed informed/uninformed flow" : "fully informed counterparty");
      break;
    case "fair-value":
      bits.push("price the contract's EV");
      if (/reroll|larger|smaller|two or more/.test(q.prompt)) bits.push("non-linear payoff — linearity alone won't do it");
      break;
    case "market-quote":
      bits.push("fair value, then an actual quote");
      if (q.prompt.includes("expected profit")) bits.push("edge × size");
      if (q.prompt.includes("skew") || q.prompt.includes("shift")) bits.push("position-aware skew");
      break;
    case "fermi":
      bits.push("multi-factor decomposition, self-graded within a factor of 2");
      break;
    case "estimation-sanity":
      bits.push("order-of-magnitude plausibility check on a stated claim");
      break;
    default:
      bits.push("—");
  }
  bits.push(`target ${q.targetSeconds}s, cut-off ${q.timeoutSeconds}s`);
  return bits.join("; ");
}

const lines: string[] = [];
lines.push("# Question calibration report");
lines.push("");
lines.push(
  "Generated samples straight out of the live generators — this file is produced by running them, not written by hand. It is the evidence that each level is structurally harder than the one below it."
);
lines.push("");
lines.push("Every question here is procedurally generated from original templates. Nothing is reproduced from the Green Book, QuantGuide, or any other copyrighted source.");
lines.push("");
lines.push("## The ladder");
lines.push("");
lines.push("| Level | Name | What changes | Proficiency cap |");
lines.push("|---|---|---|---|");
for (const l of DIFFICULTY_LEVELS) {
  lines.push(`| ${l.level} | ${l.name} | ${l.blurb} | ${l.cap} |`);
}
lines.push("");
lines.push("Clearing only level N caps proficiency at the value in the last column, no matter how fast or how accurate you are. Above 90 requires level-5 evidence.");
lines.push("");
lines.push("## Time-credit ladder");
lines.push("");
lines.push("| Time vs target | Credit |");
lines.push("|---|---|");
lines.push("| ≤ 1.00× | 100% |");
lines.push("| 1.00–1.25× | 85% |");
lines.push("| 1.25–1.50× | 65% |");
lines.push("| 1.50–2.00× | 35% |");
lines.push("| > 2.00× | 10% |");
lines.push("| past the cut-off (right or wrong) | 0 |");
lines.push("| wrong answer (rapid mode) | −25% |");
lines.push("| wrong answer (interview mode) | 0 |");
lines.push("");
lines.push(
  "The cut-off column below is a **scoring** boundary, not a grading one: past it the question stays open so you can finish working it, and the answer is only ever shown once you submit one or explicitly ask for it."
);
lines.push("");

// Deterministic, reproducible sampling: one seed per level.
for (let level = 1; level <= 5; level++) {
  const meta = DIFFICULTY_LEVELS[level - 1];
  const eligible = Object.entries(GENERATORS).filter(([, e]) => e.levels.includes(level));
  const sampler = new QuestionSampler(mulberry32(level * 104729 + 17));

  // At least 30 samples, cycling through every eligible archetype at this level.
  const wanted = Math.max(30, eligible.length);
  const rows: { q: GeneratedQuestion; mode: QuestionMode }[] = [];
  for (let i = 0; i < wanted; i++) {
    const [subtopic, entry] = eligible[i % eligible.length];
    rows.push({ q: sampler.fromSubtopic(subtopic, level), mode: entry.mode });
  }

  const rapid = rows.filter((r) => r.mode === "rapid").length;
  lines.push(`## Level ${level} — ${meta.name}`);
  lines.push("");
  lines.push(`${meta.blurb} Proficiency cap **${meta.cap}**. ${rows.length} samples below: ${rapid} rapid arithmetic, ${rows.length - rapid} interview numeracy, covering ${new Set(rows.map((r) => r.q.subtopic)).size} archetypes.`);
  lines.push("");
  lines.push("| # | Prompt | Answer | Archetype | Mode | Target | Cut-off | Why this level |");
  lines.push("|---|---|---|---|---|---|---|---|");
  rows.forEach(({ q, mode }, i) => {
    const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
    lines.push(
      `| ${i + 1} | ${cell(q.prompt)} | ${cell(q.answer)} | ${SUBTOPIC_LABELS[q.subtopic] ?? q.subtopic} | ${MODE_LABELS[mode]} | ${q.targetSeconds}s | ${q.timeoutSeconds}s | ${cell(justify(q))} |`
    );
  });
  lines.push("");
}

// Cross-level comparison for the same archetype.
lines.push("## The same archetype across all five levels");
lines.push("");
lines.push("Side by side, so the ladder is visible rather than asserted.");
lines.push("");
for (const subtopic of [
  "addition",
  "multiplication",
  "division",
  "fraction-to-percent",
  "percent-of",
  "discrete-ev",
  "break-even-prob",
  "fair-value",
]) {
  const entry = GENERATORS[subtopic];
  lines.push(`### ${SUBTOPIC_LABELS[subtopic] ?? subtopic} (${MODE_LABELS[entry.mode]})`);
  lines.push("");
  lines.push("| Level | Prompt | Answer | Target |");
  lines.push("|---|---|---|---|");
  for (let level = 1; level <= 5; level++) {
    if (!entry.levels.includes(level)) {
      lines.push(`| ${level} | *(not served at this level)* | — | — |`);
      continue;
    }
    const q = entry.gen(level, mulberry32(level * 31337 + 7));
    lines.push(`| ${level} | ${q.prompt.replace(/\|/g, "\\|")} | ${q.answer} | ${q.targetSeconds}s |`);
  }
  lines.push("");
}

writeFileSync(new URL("../docs/question-calibration-report.md", import.meta.url), lines.join("\n"));
console.log("wrote docs/question-calibration-report.md");

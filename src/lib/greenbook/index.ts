import type { Topic } from "../types";
import { CH4_SECTIONS } from "./ch4";
import { type GbChapter, type GbSection, isAuthored } from "./types";

export * from "./types";

/**
 * An index-only section: it names a part of the book and its page range so you can
 * navigate to it and track that you've worked it, but has no authored teaching
 * content yet. Chapter 4 is authored; the rest are stubs you can fill or I can
 * extend.
 */
function stub(
  chapter: number,
  number: string,
  title: string,
  pages: [number, number],
  topic: Topic,
  summary = ""
): GbSection {
  return {
    slug: `${number}-${title
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`,
    chapter,
    number,
    title,
    pages,
    topic,
    summary,
    concept: [],
    keyIdeas: [],
    checkYourself: [],
    examples: [],
    problems: [],
    bookProblems: [],
  };
}

/**
 * The book's structure, taken from its table of contents and confirmed against
 * section headings in the body. Page numbers are as printed.
 *
 * This is an index into your own copy — chapter and section names plus page
 * numbers, the same information a citation carries. No content from the book is
 * stored or served by this app.
 */
export const CHAPTERS: GbChapter[] = [
  {
    chapter: 1,
    title: "General Principles",
    pages: [1, 4],
    sections: [stub(1, "1.1", "General Principles", [1, 4], "estimation", "How to approach the interview itself rather than the maths.")],
  },
  {
    chapter: 2,
    title: "Brain Teasers",
    pages: [5, 34],
    sections: [
      stub(2, "2.1", "Problem Simplification", [5, 6], "probability"),
      stub(2, "2.2", "Logic Reasoning", [7, 12], "probability"),
      stub(2, "2.3", "Thinking Out of the Box", [12, 17], "estimation"),
      stub(2, "2.4", "Application of Symmetry", [17, 19], "probability"),
      stub(2, "2.5", "Series Summation", [19, 22], "arithmetic"),
      stub(2, "2.6", "The Pigeon Hole Principle", [22, 25], "probability"),
      stub(2, "2.7", "Modular Arithmetic", [25, 29], "arithmetic"),
      stub(2, "2.8", "Math Induction", [29, 33], "arithmetic"),
      stub(2, "2.9", "Proof by Contradiction", [33, 34], "probability"),
    ],
  },
  {
    chapter: 3,
    title: "Calculus and Linear Algebra",
    pages: [35, 58],
    sections: [
      stub(3, "3.1", "Limits and Derivatives", [35, 38], "arithmetic"),
      stub(3, "3.2", "Integration", [38, 42], "arithmetic"),
      stub(3, "3.3", "Partial Derivatives and Multiple Integrals", [42, 43], "arithmetic"),
      stub(3, "3.4", "Important Calculus Methods", [43, 48], "arithmetic"),
      stub(3, "3.5", "Ordinary Differential Equations", [48, 52], "arithmetic"),
      stub(3, "3.6", "Linear Algebra", [52, 58], "arithmetic"),
    ],
  },
  {
    chapter: 4,
    title: "Probability Theory",
    pages: [59, 102],
    sections: CH4_SECTIONS,
  },
  {
    chapter: 5,
    title: "Stochastic Process and Stochastic Calculus",
    pages: [105, 136],
    sections: [
      stub(5, "5.1", "Markov Chain", [105, 114], "conditional-probability"),
      stub(5, "5.2", "Martingale and Random Walk", [115, 120], "expected-value"),
      stub(5, "5.3", "Dynamic Programming", [121, 128], "expected-value"),
      stub(5, "5.4", "Brownian Motion and Stochastic Calculus", [129, 136], "expected-value"),
    ],
  },
  {
    chapter: 6,
    title: "Finance",
    pages: [137, 170],
    sections: [stub(6, "6.1", "Finance", [137, 170], "market-making", "Option pricing, greeks, portfolio theory and risk.")],
  },
  {
    chapter: 7,
    title: "Algorithms and Numerical Methods",
    pages: [171, 190],
    sections: [
      stub(7, "7.1", "Algorithms", [171, 180], "arithmetic"),
      stub(7, "7.2", "The Power of Two", [181, 183], "arithmetic"),
      stub(7, "7.3", "Numerical Methods", [184, 190], "arithmetic"),
    ],
  },
];

export const ALL_SECTIONS: GbSection[] = CHAPTERS.flatMap((c) => c.sections);

const BY_SLUG = new Map(ALL_SECTIONS.map((s) => [s.slug, s]));

export function sectionBySlug(slug: string): GbSection | undefined {
  return BY_SLUG.get(slug);
}

export function authoredSections(): GbSection[] {
  return ALL_SECTIONS.filter(isAuthored);
}

/** Total original practice problems available across the track. */
export function totalProblems(): number {
  return ALL_SECTIONS.reduce((n, s) => n + s.problems.length, 0);
}

/** Total pointers into the book's own problem set. */
export function totalBookProblems(): number {
  return ALL_SECTIONS.reduce((n, s) => n + s.bookProblems.length, 0);
}

export function problemById(slug: string, id: string) {
  return sectionBySlug(slug)?.problems.find((p) => p.id === id);
}

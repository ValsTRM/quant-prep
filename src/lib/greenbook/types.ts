import type { GradingType, Topic } from "../types";

/* ---------------------------------------------------------------------------
 * Green Book study track.
 *
 * The app never reproduces the book. Chapter/section/problem names and page
 * numbers are an index into your own copy — the same information a citation or a
 * table of contents carries. Every explanation, worked example and practice
 * problem in here is written from scratch for this app; where a section teaches a
 * standard result, the result is stated in our own words and the numbers are ours.
 * ------------------------------------------------------------------------- */

export type SectionStatus = "not-started" | "learning" | "practising" | "done";

export const SECTION_STATUS_LABELS: Record<SectionStatus, string> = {
  "not-started": "Not started",
  learning: "Learning",
  practising: "Practising",
  done: "Done",
};

/** A pointer to one of the book's own problems. Worked in your copy, scored here. */
export interface BookProblem {
  id: string;
  title: string;
  /** Printed page number in the book. */
  page: number;
}

/**
 * A progressive hint. Level 1 is a nudge; the last level is the full method.
 * Reading a hint is recorded, so "solved it cold" and "solved it after three
 * hints" don't look the same on the progress page.
 */
export interface Hint {
  level: number;
  text: string;
}

export interface WorkedExample {
  id: string;
  prompt: string;
  /** Shown one at a time, so you can stop and try to finish it yourself. */
  steps: string[];
  answer: string;
  /** The transferable lesson, separate from the arithmetic. */
  takeaway: string;
}

/** An original practice problem. Graded by the same machinery as mental math. */
export interface GbProblem {
  id: string;
  prompt: string;
  answer: string;
  answerValue?: number;
  tolerance?: number;
  gradingType: GradingType;
  explanation: string;
  /** 1-5, on the same ladder as the mental-math track. */
  difficulty: number;
  targetSeconds: number;
  hints: Hint[];
}

export interface KeyIdea {
  name: string;
  body: string;
}

export interface GbSection {
  /** URL slug, e.g. "4.3-conditional-probability-and-bayes". */
  slug: string;
  chapter: number;
  /** Section number as printed, e.g. "4.3". */
  number: string;
  title: string;
  /** Printed page range in the book. */
  pages: [number, number];
  /** Which mental-math topic this section's skill maps onto, for combined stats. */
  topic: Topic;
  /** One line on what the section is for. */
  summary: string;
  /** Original explanation, one string per paragraph. Empty = not yet authored. */
  concept: string[];
  keyIdeas: KeyIdea[];
  /** Questions worth being able to answer before moving on. */
  checkYourself: string[];
  examples: WorkedExample[];
  problems: GbProblem[];
  bookProblems: BookProblem[];
}

export interface GbChapter {
  chapter: number;
  title: string;
  pages: [number, number];
  sections: GbSection[];
}

/** True once a section has original teaching content, not just an index entry. */
export function isAuthored(section: GbSection): boolean {
  return section.concept.length > 0 && section.problems.length > 0;
}

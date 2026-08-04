import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "../db";
import { ALL_SECTIONS, isAuthored, sectionBySlug, type SectionStatus } from "../greenbook";
import type { AttemptRecord } from "../types";
import { rowToAttempt } from "./queries";

export interface SectionProgress {
  slug: string;
  status: SectionStatus;
  notes: string;
  bookProblemsDone: string[];
  hintsUsed: Record<string, number>;
  startedAt: number | null;
  updatedAt: number | null;
  completedAt: number | null;
  /** Original problems answered, and how many were right. */
  attempted: number;
  correct: number;
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Attempts recorded against the Green Book track, newest first. */
export function greenBookAttempts(slug?: string): AttemptRecord[] {
  const db = getDb();
  const rows = db
    .select()
    .from(schema.attempts)
    .where(eq(schema.attempts.track, "green-book"))
    .orderBy(desc(schema.attempts.createdAt))
    .all();
  const mapped = rows.map(rowToAttempt);
  return slug ? mapped.filter((a) => a.sectionSlug === slug) : mapped;
}

export function sectionProgress(slug: string): SectionProgress {
  const db = getDb();
  const row = db.select().from(schema.gbProgress).where(eq(schema.gbProgress.slug, slug)).get();
  const attempts = greenBookAttempts(slug);
  return {
    slug,
    status: (row?.status as SectionStatus) ?? "not-started",
    notes: row?.notes ?? "",
    bookProblemsDone: parseJson<string[]>(row?.bookProblemsDone ?? null, []),
    hintsUsed: parseJson<Record<string, number>>(row?.hintsUsed ?? null, {}),
    startedAt: row?.startedAt ?? null,
    updatedAt: row?.updatedAt ?? null,
    completedAt: row?.completedAt ?? null,
    attempted: attempts.length,
    correct: attempts.filter((a) => a.isCorrect).length,
  };
}

export function allSectionProgress(): Record<string, SectionProgress> {
  const db = getDb();
  const rows = db.select().from(schema.gbProgress).all();
  const byslug = new Map(rows.map((r) => [r.slug, r]));
  const attempts = greenBookAttempts();

  const out: Record<string, SectionProgress> = {};
  for (const section of ALL_SECTIONS) {
    const row = byslug.get(section.slug);
    const mine = attempts.filter((a) => a.sectionSlug === section.slug);
    out[section.slug] = {
      slug: section.slug,
      status: (row?.status as SectionStatus) ?? "not-started",
      notes: row?.notes ?? "",
      bookProblemsDone: parseJson<string[]>(row?.bookProblemsDone ?? null, []),
      hintsUsed: parseJson<Record<string, number>>(row?.hintsUsed ?? null, {}),
      startedAt: row?.startedAt ?? null,
      updatedAt: row?.updatedAt ?? null,
      completedAt: row?.completedAt ?? null,
      attempted: mine.length,
      correct: mine.filter((a) => a.isCorrect).length,
    };
  }
  return out;
}

export interface SectionPatch {
  status?: SectionStatus;
  notes?: string;
  bookProblemsDone?: string[];
  hintsUsed?: Record<string, number>;
}

/**
 * Upsert a section's study state. Only the fields present in `patch` are touched,
 * so saving notes never clears your problem ticks and vice versa.
 */
export function saveSectionProgress(slug: string, patch: SectionPatch, now: number): SectionProgress {
  if (!sectionBySlug(slug)) throw new Error(`Unknown section: ${slug}`);
  const db = getDb();
  const existing = db.select().from(schema.gbProgress).where(eq(schema.gbProgress.slug, slug)).get();

  const status = patch.status ?? (existing?.status as SectionStatus) ?? "learning";
  const values = {
    slug,
    status,
    notes: patch.notes ?? existing?.notes ?? null,
    bookProblemsDone: JSON.stringify(
      patch.bookProblemsDone ?? parseJson<string[]>(existing?.bookProblemsDone ?? null, [])
    ),
    hintsUsed: JSON.stringify(
      patch.hintsUsed ?? parseJson<Record<string, number>>(existing?.hintsUsed ?? null, {})
    ),
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
    completedAt: status === "done" ? (existing?.completedAt ?? now) : null,
  };

  db.insert(schema.gbProgress)
    .values(values)
    .onConflictDoUpdate({ target: schema.gbProgress.slug, set: values })
    .run();

  return sectionProgress(slug);
}

/* ------------------------------- track summary ------------------------------ */

export interface GreenBookSummary {
  /** Sections with authored teaching content. */
  authored: number;
  totalSections: number;
  started: number;
  done: number;
  /** Original problems answered across the track, and accuracy. */
  problemsAttempted: number;
  problemsCorrect: number;
  accuracy: number;
  /** The book's own problems you've ticked off. */
  bookProblemsDone: number;
  totalBookProblems: number;
  /** 0-100, the Green Book counterpart to mental-math proficiency. */
  coverage: number;
}

/**
 * Green Book progress as a single number, deliberately *not* the same formula as
 * mental-math proficiency. Mental math is measured on speed and accuracy under a
 * clock; the book is measured on ground covered and problems solved. Averaging
 * them would hide which one is moving, so the dashboard reports both.
 */
export function greenBookSummary(): GreenBookSummary {
  const progress = allSectionProgress();
  const rows = Object.values(progress);
  const authored = ALL_SECTIONS.filter(isAuthored);
  const totalBook = ALL_SECTIONS.reduce((n, s) => n + s.bookProblems.length, 0);
  const totalOriginal = ALL_SECTIONS.reduce((n, s) => n + s.problems.length, 0);

  const attempted = rows.reduce((n, r) => n + r.attempted, 0);
  const correct = rows.reduce((n, r) => n + r.correct, 0);
  const bookDone = rows.reduce((n, r) => n + r.bookProblemsDone.length, 0);
  const done = rows.filter((r) => r.status === "done").length;
  const started = rows.filter((r) => r.status !== "not-started").length;

  // Half for sections completed out of what's actually available to complete,
  // half for problems solved. Both denominators are real, so the number can't
  // sit at 100 while most of the book is untouched.
  const sectionShare = authored.length > 0 ? done / authored.length : 0;
  const problemShare =
    totalOriginal + totalBook > 0 ? (correct + bookDone) / (totalOriginal + totalBook) : 0;

  return {
    authored: authored.length,
    totalSections: ALL_SECTIONS.length,
    started,
    done,
    problemsAttempted: attempted,
    problemsCorrect: correct,
    accuracy: attempted > 0 ? correct / attempted : 0,
    bookProblemsDone: bookDone,
    totalBookProblems: totalBook,
    coverage: Math.round(100 * (0.5 * sectionShare + 0.5 * problemShare)),
  };
}

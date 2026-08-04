import { count, desc, eq, and, gt, or } from "drizzle-orm";
import { getDb, schema } from "../db";
import type { AttemptRecord, OverrideState, TrackId } from "../types";
import type { RecentMiss } from "../dailyPlan";

type AttemptRow = typeof schema.attempts.$inferSelect;

export function rowToAttempt(row: AttemptRow): AttemptRecord {
  return {
    ...row,
    isCorrect: !!row.isCorrect,
    track: (row.track === "green-book" ? "green-book" : "mental-math") as TrackId,
    gradedCorrect: row.gradedCorrect === null ? null : !!row.gradedCorrect,
    overridden: (row.overridden === 1 || row.overridden === -1 ? row.overridden : 0) as 0 | 1 | -1,
    timedOut: !!row.timedOut,
    resolved: !!row.resolved,
  };
}

export function allAttempts(): AttemptRecord[] {
  const db = getDb();
  return db
    .select()
    .from(schema.attempts)
    .orderBy(desc(schema.attempts.createdAt))
    .all()
    .map(rowToAttempt);
}

/**
 * Attempts on one programme only.
 *
 * The mental-math score must not move when you answer a Green Book problem, and
 * vice versa — they measure different things on different scales. Every
 * mental-math statistic reads through here.
 */
export function attemptsByTrack(track: TrackId): AttemptRecord[] {
  const db = getDb();
  return db
    .select()
    .from(schema.attempts)
    .where(eq(schema.attempts.track, track))
    .orderBy(desc(schema.attempts.createdAt))
    .all()
    .map(rowToAttempt);
}

export function recentAttempts(limit: number): AttemptRecord[] {
  const db = getDb();
  return db
    .select()
    .from(schema.attempts)
    .orderBy(desc(schema.attempts.createdAt))
    .limit(limit)
    .all()
    .map(rowToAttempt);
}

/**
 * Anything unfinished: got it wrong, or got it right but past the cut-off.
 * A question you can only do slowly is exactly the one worth re-drilling, so
 * timeouts feed spaced review alongside outright misses.
 */
const UNFINISHED = and(
  or(eq(schema.attempts.isCorrect, 0), eq(schema.attempts.timedOut, 1)),
  eq(schema.attempts.resolved, 0)
);

/** Unresolved misses within the last `days` days — feeds spaced review. */
export function recentMisses(days: number, now: number): RecentMiss[] {
  const db = getDb();
  const cutoff = now - days * 86_400_000;
  const rows = db
    .select()
    .from(schema.attempts)
    .where(and(UNFINISHED, gt(schema.attempts.createdAt, cutoff)))
    .orderBy(desc(schema.attempts.createdAt))
    .all();

  // Prefer variety: one miss per subtopic, newest first.
  const seen = new Set<string>();
  const out: RecentMiss[] = [];
  for (const r of rows) {
    if (seen.has(r.subtopic)) continue;
    seen.add(r.subtopic);
    out.push({
      attemptId: r.id,
      topic: r.topic,
      subtopic: r.subtopic,
      difficulty: r.difficulty,
    });
  }
  return out;
}

/** Every unfinished attempt — missed outright, or solved past the cut-off. */
export function reviewQueue(limit = 100): AttemptRecord[] {
  const db = getDb();
  return db
    .select()
    .from(schema.attempts)
    .where(UNFINISHED)
    .orderBy(desc(schema.attempts.createdAt))
    .limit(limit)
    .all()
    .map(rowToAttempt);
}

/**
 * Manually correct a graded attempt.
 *
 * `state` 1 forces correct, -1 forces wrong, 0 reverts to whatever the
 * auto-grader originally said. Only the *effective* verdict (`is_correct`) moves;
 * `graded_correct` is left alone, so no result is ever destroyed and every
 * override is reversible. Nothing about the clock changes — an answer past the
 * cut-off still earns zero, and still can't clear the review queue.
 *
 * Returns the updated attempt, or null if the id doesn't exist.
 */
export function overrideAttempt(id: string, state: OverrideState, now: number): AttemptRecord | null {
  const db = getDb();
  const row = db.select().from(schema.attempts).where(eq(schema.attempts.id, id)).get();
  if (!row) return null;

  // Fall back to the current verdict for rows written before overrides existed.
  const graded = row.gradedCorrect ?? row.isCorrect;
  const effective = state === 1 ? 1 : state === -1 ? 0 : graded;

  db.update(schema.attempts)
    .set({
      isCorrect: effective,
      gradedCorrect: graded,
      overridden: state,
      overriddenAt: state === 0 ? null : now,
      // Right AND inside the cut-off finishes a question; an override can't buy
      // its way past the clock.
      resolved: effective === 1 && !row.timedOut ? 1 : 0,
    })
    .where(eq(schema.attempts.id, id))
    .run();

  // Keep a re-attempt's parent in step: clearing a review item resolves the
  // original miss, and reverting it puts the miss back.
  if (row.reviewOfAttemptId) {
    db.update(schema.attempts)
      .set({ resolved: effective === 1 && !row.timedOut ? 1 : 0 })
      .where(eq(schema.attempts.id, row.reviewOfAttemptId))
      .run();
  }

  const updated = db.select().from(schema.attempts).where(eq(schema.attempts.id, id)).get();
  return updated ? rowToAttempt(updated) : null;
}

/** A page of attempt history, newest first, for the override UI. */
export function attemptHistory(opts: {
  limit: number;
  offset?: number;
  /** Only attempts whose effective verdict is wrong — the ones worth overriding. */
  missesOnly?: boolean;
}): { attempts: AttemptRecord[]; total: number } {
  const db = getDb();
  const where = opts.missesOnly ? eq(schema.attempts.isCorrect, 0) : undefined;
  const total = db
    .select({ n: count() })
    .from(schema.attempts)
    .where(where)
    .get()?.n ?? 0;
  const rows = db
    .select()
    .from(schema.attempts)
    .where(where)
    .orderBy(desc(schema.attempts.createdAt))
    .limit(opts.limit)
    .offset(opts.offset ?? 0)
    .all();
  return { attempts: rows.map(rowToAttempt), total };
}

export function getState(key: string): string | null {
  const db = getDb();
  const row = db.select().from(schema.appState).where(eq(schema.appState.key, key)).get();
  return row?.value ?? null;
}

export function setState(key: string, value: string): void {
  const db = getDb();
  db.insert(schema.appState)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.appState.key, set: { value } })
    .run();
}

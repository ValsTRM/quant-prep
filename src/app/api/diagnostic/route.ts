import { and, eq, isNull, asc } from "drizzle-orm";
import { buildDiagnostic, type DiagnosticSection, type SectionStats } from "@/lib/diagnostic";
import { randomRng, makeId } from "@/lib/rng";
import { getDb, schema } from "@/lib/db";

type SessionRow = typeof schema.sessions.$inferSelect;
type AttemptRow = typeof schema.attempts.$inferSelect;

/** Rebuild a completed section's stats from its saved attempts. */
function statsFromAttempts(section: DiagnosticSection, slice: AttemptRow[]): SectionStats {
  const correct = slice.filter((a) => a.isCorrect).length;
  const errorTypes: Record<string, number> = {};
  for (const a of slice) {
    if (!a.isCorrect && a.errorType) errorTypes[a.errorType] = (errorTypes[a.errorType] ?? 0) + 1;
  }
  const avg = slice.length ? slice.reduce((s, a) => s + a.timeSeconds, 0) / slice.length : 0;
  return {
    key: section.key,
    title: section.title,
    answered: slice.length,
    correct,
    accuracy: slice.length ? correct / slice.length : 0,
    avgTimeSeconds: parseFloat(avg.toFixed(1)),
    errorTypes,
    notes: "",
  };
}

function newSession(db: ReturnType<typeof getDb>, now: number): string {
  const sessionId = makeId("s");
  db.insert(schema.sessions)
    .values({ id: sessionId, type: "diagnostic", startedAt: now, meta: null })
    .run();
  return sessionId;
}

/**
 * Return a diagnostic to work on. If an unfinished diagnostic exists, resume it:
 * figure out how far the user got from their saved answers and hand back the
 * already-completed sections' stats so the client can pick up mid-way.
 * Pass ?fresh=1 to abandon any in-progress diagnostic and start clean.
 */
export async function GET(request: Request) {
  const db = getDb();
  const now = Date.now();
  const fresh = new URL(request.url).searchParams.get("fresh") === "1";

  // Structure (section keys, order, counts) is deterministic; only the specific
  // question instances differ each time — fine, since resumed sections are unseen.
  const sections = buildDiagnostic(randomRng());

  const openSessions: SessionRow[] = db
    .select()
    .from(schema.sessions)
    .where(and(eq(schema.sessions.type, "diagnostic"), isNull(schema.sessions.completedAt)))
    .all();

  if (fresh) {
    for (const s of openSessions) {
      db.delete(schema.attempts).where(eq(schema.attempts.sessionId, s.id)).run();
      db.delete(schema.sessions).where(eq(schema.sessions.id, s.id)).run();
    }
    return Response.json({ sessionId: newSession(db, now), sections, resume: null });
  }

  // Pick the active in-progress session (the one with the most saved answers),
  // and clean up empty orphan sessions left by earlier page reloads.
  let active: SessionRow | null = null;
  let activeAttempts: AttemptRow[] = [];
  for (const s of openSessions) {
    const rows = db
      .select()
      .from(schema.attempts)
      .where(eq(schema.attempts.sessionId, s.id))
      .orderBy(asc(schema.attempts.createdAt))
      .all();
    if (rows.length > activeAttempts.length) {
      active = s;
      activeAttempts = rows;
    }
  }
  for (const s of openSessions) {
    if (active && s.id === active.id) continue;
    db.delete(schema.sessions).where(eq(schema.sessions.id, s.id)).run();
  }

  if (!active) {
    return Response.json({ sessionId: newSession(db, now), sections, resume: null });
  }
  if (activeAttempts.length === 0) {
    // Session opened but nothing answered — reuse it as a clean start.
    return Response.json({ sessionId: active.id, sections, resume: null });
  }

  // Walk the sections in order, assigning saved answers to each until we hit a
  // section that isn't fully answered — that's where the user resumes.
  let offset = 0;
  let completed = 0;
  const stats: SectionStats[] = [];
  for (let i = 0; i < sections.length; i++) {
    const count = sections[i].questions.length;
    if (count === 0) break; // manual section (e.g. coding sim) can't complete via answers
    if (offset + count > activeAttempts.length) break; // partially answered → stop here
    stats.push(statsFromAttempts(sections[i], activeAttempts.slice(offset, offset + count)));
    offset += count;
    completed = i + 1;
  }

  // Drop leftover answers from a half-finished section so it restarts cleanly
  // (also removes them from the review queue).
  for (const a of activeAttempts.slice(offset)) {
    db.delete(schema.attempts).where(eq(schema.attempts.id, a.id)).run();
  }

  if (completed === 0) {
    return Response.json({ sessionId: active.id, sections, resume: null });
  }
  return Response.json({
    sessionId: active.id,
    sections,
    resume: { sectionIndex: completed, stats },
  });
}

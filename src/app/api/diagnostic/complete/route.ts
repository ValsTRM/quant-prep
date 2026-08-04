import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { summarizeDiagnostic, type SectionStats } from "@/lib/diagnostic";
import { getState, setState } from "@/lib/server/queries";
import { writeAutoBackup } from "@/lib/server/autoBackup";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sessionId: string;
    sections: SectionStats[];
  };
  const db = getDb();
  const now = Date.now();

  const sessionAttempts = db
    .select()
    .from(schema.attempts)
    .where(eq(schema.attempts.sessionId, body.sessionId))
    .all()
    .map((r) => ({ topic: r.topic, isCorrect: !!r.isCorrect }));

  const report = summarizeDiagnostic(sessionAttempts, body.sections ?? [], now);

  db.update(schema.sessions)
    .set({ completedAt: now, meta: JSON.stringify(report) })
    .where(eq(schema.sessions.id, body.sessionId))
    .run();

  setState("diagnosticCompletedAt", String(now));
  // The 12-week clock starts at the diagnostic (only set once).
  if (getState("planStartedAt") === null) setState("planStartedAt", String(now));

  writeAutoBackup("diagnostic-complete");

  return Response.json({ report });
}

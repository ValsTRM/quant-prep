import { getDb, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { localDay } from "@/lib/streak";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** All attempts as CSV. */
export async function GET() {
  const rows = getDb()
    .select()
    .from(schema.attempts)
    .orderBy(desc(schema.attempts.createdAt))
    .all();

  const header = [
    "id", "createdAt", "source", "bucket", "topic", "subtopic", "difficulty",
    "mode", "prompt", "correctAnswer", "userAnswer", "isCorrect", "gradedCorrect",
    "overridden", "overriddenAt", "timedOut", "timeSeconds", "targetSeconds",
    "timeoutSeconds", "gradingType", "errorType", "resolved",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id, new Date(r.createdAt).toISOString(), r.source, r.bucket, r.topic,
        r.subtopic, r.difficulty, r.mode, r.prompt, r.correctAnswer, r.userAnswer,
        r.isCorrect, r.gradedCorrect, r.overridden,
        r.overriddenAt === null ? "" : new Date(r.overriddenAt).toISOString(),
        r.timedOut, r.timeSeconds, r.targetSeconds, r.timeoutSeconds,
        r.gradingType, r.errorType, r.resolved,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="quant-prep-attempts-${localDay(Date.now())}.csv"`,
    },
  });
}

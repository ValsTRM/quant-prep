import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { makeId } from "@/lib/rng";
import { recentAttempts } from "@/lib/server/queries";
import { isOverrideState, modeFor, timeoutSecondsFor, type Topic } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(200, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20);
  return Response.json({ attempts: recentAttempts(limit) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();
  const now = Date.now();

  const subtopic = String(body.subtopic);
  const topic = String(body.topic);
  const difficulty = Number(body.difficulty) || 1;
  const timeSeconds = Number(body.timeSeconds) || 0;
  const timeoutSeconds =
    Number(body.timeoutSeconds) || timeoutSecondsFor(subtopic, difficulty, topic as Topic);

  // The cut-off is a scoring boundary, not a grading one. Past it the attempt
  // earns zero credit and can never count toward advancement — but if the maths
  // was right it is still recorded as right, so a question you can actually do
  // doesn't get filed as a knowledge gap. `timedOut` carries the penalty.
  const timedOut = body.timedOut === true || timeSeconds >= timeoutSeconds ? 1 : 0;
  const isCorrect = body.isCorrect ? 1 : 0;

  // An answer can arrive already corrected by hand (the "I was actually correct"
  // button in the runner). `isCorrect` is then the effective verdict and
  // `gradedCorrect` is what the auto-grader had said — same shape as a row
  // overridden later, so there is one representation to reason about.
  const overridden = isOverrideState(body.overridden) ? body.overridden : 0;
  const gradedCorrect =
    typeof body.gradedCorrect === "boolean" ? (body.gradedCorrect ? 1 : 0) : isCorrect;

  const row = {
    id: makeId("a"),
    sessionId: body.sessionId ?? null,
    source: String(body.source ?? "daily"),
    bucket: body.bucket ?? null,
    track: body.track === "green-book" ? "green-book" : "mental-math",
    sectionSlug: typeof body.sectionSlug === "string" ? body.sectionSlug : null,
    topic,
    subtopic,
    difficulty,
    mode: String(body.mode ?? modeFor(subtopic)),
    prompt: String(body.prompt),
    correctAnswer: String(body.correctAnswer),
    explanation: String(body.explanation ?? ""),
    userAnswer: String(body.userAnswer ?? ""),
    isCorrect,
    gradedCorrect,
    overridden,
    overriddenAt: overridden === 0 ? null : now,
    timedOut,
    timeSeconds,
    targetSeconds: Number(body.targetSeconds) || 30,
    timeoutSeconds,
    gradingType: String(body.gradingType ?? "exact"),
    errorType: body.errorType ? String(body.errorType) : timedOut ? "speed" : null,
    // Right and inside the cut-off clears the queue. Right but late leaves the
    // miss open — you haven't finished with a question until you can do it at pace.
    resolved: isCorrect && !timedOut ? 1 : 0,
    reviewOfAttemptId: body.reviewOfAttemptId ?? null,
    createdAt: now,
  };

  db.insert(schema.attempts).values(row).run();

  // Answering a review item correctly and on time clears the original miss.
  if (isCorrect && !timedOut && row.reviewOfAttemptId) {
    db.update(schema.attempts)
      .set({ resolved: 1 })
      .where(eq(schema.attempts.id, row.reviewOfAttemptId))
      .run();
  }

  return Response.json({ ok: true, id: row.id });
}

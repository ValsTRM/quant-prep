import { overrideAttempt } from "@/lib/server/queries";
import { isOverrideState } from "@/lib/types";

/**
 * Manually correct a graded attempt: `{ id, state }` where state is
 * `1` (I was correct), `-1` (I was wrong), or `0` (use the auto-grade again).
 *
 * Nothing is deleted — the original auto-grade is preserved on the row, so any
 * override can be reverted, and the attempt itself is never rewritten or removed.
 */
export async function POST(request: Request) {
  let body: { id?: unknown; state?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return Response.json({ error: "Missing attempt id" }, { status: 400 });

  const state = typeof body.state === "number" ? body.state : Number(body.state);
  if (!isOverrideState(state)) {
    return Response.json({ error: "state must be 1, -1, or 0" }, { status: 400 });
  }

  const updated = overrideAttempt(id, state, Date.now());
  if (!updated) return Response.json({ error: "No such attempt" }, { status: 404 });

  return Response.json({ ok: true, attempt: updated });
}

import { sectionBySlug, type SectionStatus } from "@/lib/greenbook";
import { greenBookAttempts, saveSectionProgress, sectionProgress } from "@/lib/server/greenbook";

/** One section: its authored content, your state, and your answers so far. */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return Response.json({ error: "Missing slug" }, { status: 400 });
  const section = sectionBySlug(slug);
  if (!section) return Response.json({ error: "No such section" }, { status: 404 });
  return Response.json({
    section,
    progress: sectionProgress(slug),
    attempts: greenBookAttempts(slug),
  });
}

const STATUSES: SectionStatus[] = ["not-started", "learning", "practising", "done"];

/**
 * Save notes, status, book-problem ticks, or hint usage.
 *
 * Merges rather than replaces: ticking a problem never wipes your notes, and
 * saving notes never resets your ticks.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug : null;
  if (!slug || !sectionBySlug(slug)) {
    return Response.json({ error: "Unknown section" }, { status: 400 });
  }

  const status =
    typeof body.status === "string" && STATUSES.includes(body.status as SectionStatus)
      ? (body.status as SectionStatus)
      : undefined;

  return Response.json({
    ok: true,
    progress: saveSectionProgress(
      slug,
      {
        status,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        bookProblemsDone: Array.isArray(body.bookProblemsDone)
          ? (body.bookProblemsDone as unknown[]).filter((x): x is string => typeof x === "string")
          : undefined,
        hintsUsed:
          body.hintsUsed && typeof body.hintsUsed === "object"
            ? (body.hintsUsed as Record<string, number>)
            : undefined,
      },
      Date.now()
    ),
  });
}

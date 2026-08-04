import { sectionBySlug } from "@/lib/greenbook";
import { bookExtract } from "@/lib/server/bookText";

/**
 * Your own copy of the book, for a section or an explicit printed page range.
 *
 *   ?slug=4.3-conditional-probability-and-bayes
 *   ?from=78&to=79
 *
 * Served from the gitignored local extraction on this machine — see
 * `src/lib/server/bookText.ts`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  let from: number;
  let to: number;

  if (slug) {
    const section = sectionBySlug(slug);
    if (!section) return Response.json({ error: "No such section" }, { status: 404 });
    [from, to] = section.pages;
  } else {
    from = parseInt(url.searchParams.get("from") ?? "", 10);
    to = parseInt(url.searchParams.get("to") ?? String(from), 10);
    if (!Number.isFinite(from)) {
      return Response.json({ error: "Provide slug, or from/to page numbers" }, { status: 400 });
    }
  }

  return Response.json(bookExtract(from, to));
}

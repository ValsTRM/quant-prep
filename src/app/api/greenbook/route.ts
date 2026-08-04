import { CHAPTERS, isAuthored } from "@/lib/greenbook";
import { allSectionProgress, greenBookSummary } from "@/lib/server/greenbook";

/** The chapter map: every section, whether it's authored, and how far you've got. */
export async function GET() {
  const progress = allSectionProgress();
  return Response.json({
    summary: greenBookSummary(),
    chapters: CHAPTERS.map((c) => ({
      chapter: c.chapter,
      title: c.title,
      pages: c.pages,
      sections: c.sections.map((s) => ({
        slug: s.slug,
        number: s.number,
        title: s.title,
        pages: s.pages,
        topic: s.topic,
        summary: s.summary,
        authored: isAuthored(s),
        problemCount: s.problems.length,
        bookProblemCount: s.bookProblems.length,
        progress: progress[s.slug],
      })),
    })),
  });
}

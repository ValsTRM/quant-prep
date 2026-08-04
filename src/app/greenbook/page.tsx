"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MiniBar, PageHeader, PageSkeleton, pctText } from "@/components/widgets";
import { SECTION_STATUS_LABELS, type SectionStatus } from "@/lib/greenbook";

interface SectionRow {
  slug: string;
  number: string;
  title: string;
  pages: [number, number];
  summary: string;
  authored: boolean;
  problemCount: number;
  bookProblemCount: number;
  progress: {
    status: SectionStatus;
    attempted: number;
    correct: number;
    bookProblemsDone: string[];
  };
}

interface MapData {
  summary: {
    authored: number;
    totalSections: number;
    started: number;
    done: number;
    problemsAttempted: number;
    problemsCorrect: number;
    accuracy: number;
    bookProblemsDone: number;
    totalBookProblems: number;
    coverage: number;
  };
  chapters: {
    chapter: number;
    title: string;
    pages: [number, number];
    sections: SectionRow[];
  }[];
}

const STATUS_VARIANT: Record<SectionStatus, "secondary" | "outline" | "destructive"> = {
  "not-started": "outline",
  learning: "secondary",
  practising: "secondary",
  done: "secondary",
};

export default function GreenBookPage() {
  const [data, setData] = useState<MapData | null>(null);

  useEffect(() => {
    fetch("/api/greenbook")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <>
        <PageHeader title="Green Book" description="Work the book section by section." />
        <PageSkeleton tiles={4} rows={8} />
      </>
    );
  }

  const s = data.summary;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Green Book"
        description="Learn the idea, see it worked, then do problems — section by section, tracked separately from mental math."
      />

      <Card>
        <CardHeader>
          <CardTitle>Coverage</CardTitle>
          <CardDescription>
            half for sections finished, half for problems solved — so it can&apos;t read high while
            the book is untouched
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Coverage", value: `${s.coverage}`, hint: "of 100" },
              { label: "Sections done", value: `${s.done}`, hint: `of ${s.authored} with content` },
              {
                label: "Problems solved",
                value: `${s.problemsCorrect}`,
                hint: s.problemsAttempted > 0 ? `${pctText(s.accuracy)} accuracy` : "none attempted",
              },
              {
                label: "Book problems",
                value: `${s.bookProblemsDone}`,
                hint: `of ${s.totalBookProblems} indexed`,
              },
            ].map((t) => (
              <div key={t.label} className="rounded-lg border p-3">
                <div className="text-2xl font-semibold tabular-nums">{t.value}</div>
                <div className="text-sm">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.hint}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.chapters.map((c) => (
        <Card key={c.chapter}>
          <CardHeader>
            <CardTitle>
              Chapter {c.chapter} — {c.title}
            </CardTitle>
            <CardDescription>
              pp. {c.pages[0]}–{c.pages[1]} in your copy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {c.sections.map((sec) => {
                const total = sec.problemCount;
                const pct = total > 0 ? (sec.progress.correct / total) * 100 : 0;
                const row = (
                  <div className="flex flex-wrap items-center gap-3 py-3">
                    <span className="w-10 shrink-0 font-mono text-sm text-muted-foreground">
                      {sec.number}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={sec.authored ? "font-medium" : "text-muted-foreground"}>
                        {sec.title}
                      </span>
                      {sec.summary && (
                        <span className="block text-xs text-muted-foreground">{sec.summary}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      pp. {sec.pages[0]}–{sec.pages[1]}
                    </span>
                    {sec.authored ? (
                      <>
                        <span className="w-24 shrink-0">
                          <MiniBar value={pct} />
                        </span>
                        <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {sec.progress.correct}/{total}
                        </span>
                        <Badge variant={STATUS_VARIANT[sec.progress.status]}>
                          {SECTION_STATUS_LABELS[sec.progress.status]}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="outline">index only</Badge>
                    )}
                  </div>
                );
                return (
                  <li key={sec.slug}>
                    {sec.authored ? (
                      <Link
                        href={`/greenbook/${sec.slug}`}
                        className="block rounded-md px-1 transition-colors hover:bg-muted"
                      >
                        {row}
                      </Link>
                    ) : (
                      <div className="px-1" title="No authored content yet — work it in the book">
                        {row}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-muted-foreground">
        Section titles, problem names and page numbers index your own copy of the book. All
        explanations, worked examples and practice problems in this section of the app are written
        for it; none of the book&apos;s text is reproduced or stored here.
      </p>
    </div>
  );
}

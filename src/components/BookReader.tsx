"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BookPage {
  page: number;
  pdfPage: number;
  lines: string[];
}

interface Extract {
  available: boolean;
  reason?: string;
  pages: BookPage[];
}

/**
 * The book's own pages, read from your local extraction.
 *
 * Text comes from `local/green-book/`, which is gitignored and generated on this
 * machine from your copy of the PDF — the app ships no book content. Formulas do
 * not survive OCR, so the PDF stays authoritative for anything symbolic and the
 * reader says so rather than pretending otherwise.
 */
export function BookReader({
  slug,
  pages,
  initialPage,
}: {
  slug?: string;
  pages: [number, number];
  initialPage?: number;
}) {
  const [data, setData] = useState<Extract | null>(null);
  const [page, setPage] = useState(initialPage ?? pages[0]);
  const [whole, setWhole] = useState(false);

  const load = useCallback(() => {
    const q = whole && slug ? `slug=${encodeURIComponent(slug)}` : `from=${page}&to=${page}`;
    return fetch(`/api/greenbook/text?${q}`)
      .then((r) => r.json())
      .then(setData);
  }, [slug, page, whole]);

  useEffect(() => {
    load();
  }, [load]);

  const atStart = page <= pages[0];
  const atEnd = page >= pages[1];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Read</CardTitle>
            <CardDescription>
              your copy of the book, pp. {pages[0]}–{pages[1]} · text extracted locally on this
              machine
            </CardDescription>
          </div>
          {slug && (
            <Button variant="outline" size="sm" onClick={() => setWhole((w) => !w)}>
              {whole ? "One page at a time" : "Whole section"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : !data.available ? (
          <div className="space-y-2 rounded-lg border border-dashed p-4 text-sm">
            <p className="font-medium">Book text not extracted yet</p>
            <p className="text-muted-foreground">{data.reason}</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-muted/30 p-4 max-h-[70vh] overflow-y-auto">
              {data.pages.map((p) => (
                <section key={p.page} className="mb-6 last:mb-0">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Page {p.page}
                  </h3>
                  {/* Preserved as extracted: the layout carries meaning in a
                      technical book, so lines aren't reflowed into paragraphs. */}
                  <div className="whitespace-pre-wrap font-serif text-[0.9375rem] leading-7">
                    {p.lines.join("\n")}
                  </div>
                </section>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Equations and symbols do not survive OCR — read anything symbolic in the PDF itself.
              Prose is faithful.
            </p>
          </>
        )}

        {!whole && (
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={atStart}
              onClick={() => setPage((p) => Math.max(pages[0], p - 1))}
            >
              ← p. {Math.max(pages[0], page - 1)}
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">
              page {page} of {pages[0]}–{pages[1]}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={atEnd}
              onClick={() => setPage((p) => Math.min(pages[1], p + 1))}
            >
              p. {Math.min(pages[1], page + 1)} →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

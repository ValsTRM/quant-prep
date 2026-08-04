"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SUBTOPIC_LABELS,
  targetSecondsFor,
  type AttemptRecord,
  type OverrideState,
  type Topic,
} from "@/lib/types";

const PAGE_SIZE = 25;

interface HistoryResponse {
  attempts: AttemptRecord[];
  total: number;
}

/**
 * Answer history with a manual correction control.
 *
 * The auto-grader can only compare numbers: it can't tell a formatting mismatch
 * from a genuine miss, and it has no opinion about a Fermi decomposition. This is
 * where you correct it — on any answer, from any session, at any time. An override
 * changes the effective verdict and keeps the original grade beside it, so nothing
 * is lost and every correction can be undone.
 */
export function AnswerHistory({ onChanged }: { onChanged?: () => void }) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [missesOnly, setMissesOnly] = useState(true);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    () =>
      fetch(
        `/api/attempts/history?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}&misses=${missesOnly ? 1 : 0}`
      )
        .then((r) => r.json())
        .then(setData),
    [page, missesOnly]
  );

  useEffect(() => {
    load();
  }, [load]);

  const setOverride = async (id: string, state: OverrideState) => {
    setBusy(id);
    try {
      await fetch("/api/attempts/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, state }),
      });
      await load();
      onChanged?.();
    } finally {
      setBusy(null);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Answer history</CardTitle>
            <CardDescription>
              Correct the grader on any past answer. Your original grade is kept alongside the
              override, so nothing is lost and you can undo it.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMissesOnly((m) => !m);
              setPage(0);
            }}
          >
            {missesOnly ? "Showing misses only" : "Showing all answers"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!data ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : data.attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {missesOnly
              ? "No missed answers — nothing to correct."
              : "No answers recorded yet."}
          </p>
        ) : (
          <ul className="divide-y">
            {data.attempts.map((a) => {
              const target = targetSecondsFor(a.subtopic, a.difficulty, a.topic as Topic);
              const late = a.timedOut;
              return (
                <li key={a.id} className="flex flex-wrap items-start gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm leading-snug">{a.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      you: <span className="font-mono">{a.userAnswer || "—"}</span> · answer:{" "}
                      <span className="font-mono">{a.correctAnswer}</span> ·{" "}
                      {Math.round(a.timeSeconds)}s / {target}s ·{" "}
                      {SUBTOPIC_LABELS[a.subtopic] ?? a.subtopic} · L{a.difficulty}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={a.isCorrect ? "secondary" : "destructive"}>
                        {a.isCorrect ? "correct" : "wrong"}
                      </Badge>
                      {late && <Badge variant="outline">past cut-off · 0 credit</Badge>}
                      {a.overridden !== 0 && (
                        <Badge variant="outline">
                          overridden — grader said{" "}
                          {a.gradedCorrect === null ? "?" : a.gradedCorrect ? "correct" : "wrong"}
                        </Badge>
                      )}
                      {!a.isCorrect && a.errorType && (
                        <Badge variant="outline">{a.errorType}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {!a.isCorrect && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === a.id}
                        onClick={() => setOverride(a.id, 1)}
                      >
                        I was correct
                      </Button>
                    )}
                    {a.isCorrect && a.overridden !== -1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === a.id}
                        onClick={() => setOverride(a.id, -1)}
                      >
                        Mark wrong
                      </Button>
                    )}
                    {a.overridden !== 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === a.id}
                        onClick={() => setOverride(a.id, 0)}
                      >
                        Undo
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              page {page + 1} of {pages} · {data.total} answers
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

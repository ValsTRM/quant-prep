"use client";

import { useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QuestionRunner, type RunnerItem, type RunnerResult } from "@/components/QuestionRunner";
import { EmptyState, PageHeader, PageSkeleton } from "@/components/widgets";
import { requestAutoBackup } from "@/lib/autoBackupClient";
import {
  modeFor,
  targetSecondsFor,
  timeoutSecondsFor,
  type AttemptRecord,
  type GeneratedQuestion,
  type Topic,
} from "@/lib/types";

/** Re-ask a missed question exactly as stored — but timed to TODAY's standard. */
function attemptToItem(a: AttemptRecord): RunnerItem {
  const question: GeneratedQuestion = {
    id: a.id,
    topic: a.topic as Topic,
    subtopic: a.subtopic,
    difficulty: a.difficulty,
    mode: (a.mode as GeneratedQuestion["mode"]) || modeFor(a.subtopic),
    prompt: a.prompt,
    answer: a.correctAnswer,
    explanation: a.explanation,
    gradingType: a.gradingType as GeneratedQuestion["gradingType"],
    targetSeconds: targetSecondsFor(a.subtopic, a.difficulty, a.topic as Topic),
    timeoutSeconds: timeoutSecondsFor(a.subtopic, a.difficulty, a.topic as Topic),
  };
  return { question, reviewOfAttemptId: a.id, bucket: "review" };
}

export default function ReviewPage() {
  const [queue, setQueue] = useState<AttemptRecord[] | null>(null);
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<RunnerResult[] | null>(null);

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((d) => setQueue(d.queue));
  }, []);

  if (!queue) {
    return (
      <>
        <PageHeader title="Review" description="Loading your missed-question queue…" />
        <PageSkeleton tiles={0} rows={5} />
      </>
    );
  }

  if (results) {
    const fixed = results.filter((r) => r.correct && !r.timedOut).length;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            {fixed} / {results.length} cleared from the queue. Anything still wrong — or right
            but past the cut-off — stays for next time.
          </p>
          <LinkButton href="/">Back to dashboard</LinkButton>
        </CardContent>
      </Card>
    );
  }

  if (queue.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review</CardTitle>
          <CardDescription>
            Unfinished questions come back here until you clear them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            glyph="check"
            title="Review queue is empty"
            hint="Miss a question — or solve one past its cut-off — and it lands here until you answer it correctly and on time."
            action={<LinkButton href="/practice">Go practice</LinkButton>}
          />
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    const batch = queue.slice(0, 10);
    const slow = queue.filter((a) => a.timedOut && a.isCorrect).length;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review unfinished questions</CardTitle>
          <CardDescription>
            {queue.length} in the queue
            {slow > 0 && ` (${slow} you solved, but too slowly)`} — clearing one means answering
            correctly and inside the cut-off.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1 text-sm text-muted-foreground">
            {batch.map((a) => (
              <li key={a.id} className="truncate" title={a.prompt}>
                • {a.prompt}
                {a.timedOut && a.isCorrect && (
                  <span className="ml-1 text-xs">— solved in {Math.round(a.timeSeconds)}s</span>
                )}
              </li>
            ))}
          </ul>
          <Button onClick={() => setStarted(true)}>
            Start review ({Math.min(10, queue.length)} questions)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <QuestionRunner
      items={queue.slice(0, 10).map(attemptToItem)}
      source="review"
      onComplete={(r) => {
        setResults(r);
        requestAutoBackup("review-session");
      }}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QuestionRunner, type RunnerItem, type RunnerResult } from "@/components/QuestionRunner";
import { pctText, PageHeader, PageSkeleton } from "@/components/widgets";
import { requestAutoBackup } from "@/lib/autoBackupClient";
import { sessionScore } from "@/lib/scoring";

interface PracticeData {
  day: string;
  week: { number: number; title: string };
  summary: {
    total: number;
    buckets: { weak: number; plan: number; review: number; challenge: number };
    weakTopics: string[];
  };
  items: RunnerItem[];
}

export default function PracticePage() {
  const [data, setData] = useState<PracticeData | null>(null);
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<RunnerResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/practice")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <p className="text-destructive">Failed to load practice set: {error}</p>;
  if (!data) {
    return (
      <>
        <PageHeader title="Practice" description="Building today's adaptive set…" />
        <PageSkeleton tiles={0} rows={6} />
      </>
    );
  }

  if (results) {
    const correct = results.filter((r) => r.correct).length;
    const avgTime = results.reduce((s, r) => s + r.timeSeconds, 0) / results.length;
    const score = sessionScore(
      results.map((r) => ({
        topic: r.question.topic,
        subtopic: r.question.subtopic,
        difficulty: r.question.difficulty,
        isCorrect: r.correct,
        timeSeconds: r.timeSeconds,
        targetSeconds: r.question.targetSeconds,
        createdAt: 0,
      }))
    );
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session complete</CardTitle>
          <CardDescription>{data.day} · daily adaptive set</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {score.earned}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}
              / {score.possible} pts — 10 × difficulty per correct answer, up to 1.5× for beating
              the clock
            </span>
          </p>
          <p className="text-sm">
            {correct} / {results.length} correct ({pctText(correct / results.length)}) · avg{" "}
            {avgTime.toFixed(0)}s per question
          </p>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/">Back to dashboard</LinkButton>
            <LinkButton variant="outline" href="/review">
              Review missed
            </LinkButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s practice — {data.day}</CardTitle>
          <CardDescription>
            Week {data.week.number}: {data.week.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1 text-sm">
            <li>{data.summary.buckets.weak} weak-topic questions ({data.summary.weakTopics.join(", ")})</li>
            <li>{data.summary.buckets.plan} study-plan questions</li>
            <li>{data.summary.buckets.review} spaced-review questions</li>
            <li>{data.summary.buckets.challenge} challenge questions</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            One question at a time, with a timer. Answers accept decimals, fractions (3/4), and
            percents (75%). You&apos;ll see the explanation after each submission.
          </p>
          <Button onClick={() => setStarted(true)}>Start ({data.summary.total} questions)</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <QuestionRunner
      items={data.items}
      source="daily"
      onComplete={(r) => {
        setResults(r);
        requestAutoBackup("practice-session");
      }}
    />
  );
}

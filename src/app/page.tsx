"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  StatTile,
  MiniBar,
  pctText,
  Glyph,
  EmptyState,
  PageHeader,
  PageSkeleton,
} from "@/components/widgets";
import type { AttemptRecord } from "@/lib/types";

interface Goal {
  key: string;
  label: string;
  detail: string;
  current: number;
  target: number;
  progress: number;
  unit: string;
}

interface DashboardData {
  diagnosticDone: boolean;
  streak: number;
  day: string;
  greenBook: {
    coverage: number;
    authored: number;
    done: number;
    problemsCorrect: number;
    problemsAttempted: number;
    accuracy: number;
    bookProblemsDone: number;
  };
  score: {
    qrs: number;
    delta7d: number;
    pointsToday: number;
    level: {
      name: string;
      floor: number;
      next: { name: string; floor: number } | null;
      progressToNext: number;
    };
  };
  goals: Goal[];
  week: { number: number; title: string; phase: string; topics: string[]; resources: string[] };
  todayPlan: {
    total: number;
    buckets: { weak: number; plan: number; review: number; challenge: number };
    weakTopics: string[];
    planTopics: string[];
  };
  weakTopics: { topic: string; label: string; proficiency: number; untested: boolean }[];
  proficiencies: {
    topic: string;
    label: string;
    proficiency: number;
    accuracy: number;
    avgTimeSeconds: number;
    attemptCount: number;
    untested: boolean;
  }[];
  recentAttempts: AttemptRecord[];
  reviewQueueCount: number;
  totalAttempts: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <p className="text-destructive">Failed to load dashboard: {error}</p>;
  if (!data) {
    return (
      <>
        <PageHeader title="Dashboard" description="Your daily assignment, streak, and topic proficiency." />
        <PageSkeleton tiles={4} rows={8} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Week ${data.week.number} of 12 — ${data.week.title}`}
      />

      {!data.diagnosticDone && (
        <Card>
          <CardHeader>
            <CardTitle>Start with the Day 1 diagnostic</CardTitle>
            <CardDescription>
              ~80 questions across arithmetic, percentages, EV, probability, market making, and
              estimation. It scores you by topic and calibrates your daily plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/diagnostic">Take the diagnostic</LinkButton>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mental math — Quant Readiness</CardTitle>
            <CardDescription>
              average of all eight topic proficiencies × 10 — coverage counts as much as depth
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-semibold tabular-nums tracking-tight">
                {data.score.qrs}
              </span>
              <span className="text-sm text-muted-foreground">/ 1000</span>
              <Badge variant="secondary">{data.score.level.name}</Badge>
              <span
                className={`text-sm tabular-nums ${
                  data.score.delta7d > 0
                    ? "text-primary"
                    : data.score.delta7d < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {data.score.delta7d > 0 ? "▲" : data.score.delta7d < 0 ? "▼" : "—"}{" "}
                {data.score.delta7d > 0 ? "+" : ""}
                {data.score.delta7d} vs last week
              </span>
            </div>
            {data.score.level.next ? (
              <div className="space-y-1">
                <MiniBar value={data.score.level.progressToNext * 100} />
                <p className="text-xs text-muted-foreground">
                  {data.score.level.next.floor - data.score.qrs} points to{" "}
                  {data.score.level.next.name} ({data.score.level.next.floor})
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Top level reached — keep it sharp.</p>
            )}
            <p className="text-sm">
              <span className="font-medium tabular-nums">{data.score.pointsToday}</span>{" "}
              <span className="text-muted-foreground">
                points earned today (10 × difficulty × credit — no bonus for rushing)
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Green Book — coverage</CardTitle>
            <CardDescription>
              tracked separately: this one measures ground covered and problems solved, not speed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-semibold tabular-nums tracking-tight">
                {data.greenBook.coverage}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
              <Badge variant="secondary">
                {data.greenBook.done}/{data.greenBook.authored} sections done
              </Badge>
            </div>
            <MiniBar value={data.greenBook.coverage} />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium tabular-nums text-foreground">
                {data.greenBook.problemsCorrect}
              </span>{" "}
              original problems solved
              {data.greenBook.problemsAttempted > 0 &&
                ` (${Math.round(data.greenBook.accuracy * 100)}% accuracy)`}
              {" · "}
              <span className="font-medium tabular-nums text-foreground">
                {data.greenBook.bookProblemsDone}
              </span>{" "}
              of the book&apos;s own problems ticked off
            </p>
            <LinkButton href="/greenbook" variant="outline">
              Open the Green Book
            </LinkButton>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>This week&apos;s goals</CardTitle>
            <CardDescription>rolling 7 days — designed to be beatable, barely</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.goals.map((g) => (
                <li key={g.key}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className={g.progress >= 1 ? "text-muted-foreground line-through" : ""}>
                      {g.progress >= 1 ? "✓ " : ""}
                      {g.label}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {g.current}/{g.target}
                      {g.unit === "percent" ? "%" : ""}
                    </span>
                  </div>
                  <div className="mt-1">
                    <MiniBar value={g.progress * 100} />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Streak"
          value={`${data.streak}d`}
          hint="consecutive practice days"
          glyph={
            <span className={data.streak > 0 ? "text-highlight" : undefined}>
              <Glyph name="flame" className="size-3.5" />
            </span>
          }
        />
        <StatTile label="Study plan" value={`Week ${data.week.number}/12`} hint={data.week.phase} />
        <StatTile label="Review queue" value={String(data.reviewQueueCount)} hint="missed questions" />
        <StatTile label="Attempts" value={String(data.totalAttempts)} hint="all time" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s practice — {data.day}</CardTitle>
            <CardDescription>{data.todayPlan.total} questions, adaptively allocated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-sm">
              <li>
                <span className="font-medium">{data.todayPlan.buckets.weak}</span> on weak topics
                {data.todayPlan.weakTopics.length > 0 && (
                  <span className="text-muted-foreground"> — {data.todayPlan.weakTopics.join(", ")}</span>
                )}
              </li>
              <li>
                <span className="font-medium">{data.todayPlan.buckets.plan}</span> from Week{" "}
                {data.week.number}: <span className="text-muted-foreground">{data.week.title}</span>
              </li>
              <li>
                <span className="font-medium">{data.todayPlan.buckets.review}</span> spaced review of
                recent misses
              </li>
              <li>
                <span className="font-medium">{data.todayPlan.buckets.challenge}</span> challenge
                questions
              </li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/practice">Start practice</LinkButton>
              <LinkButton variant="outline" href="/review">
                Review missed ({data.reviewQueueCount})
              </LinkButton>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 3 weak topics</CardTitle>
            <CardDescription>lowest proficiency first — today&apos;s plan targets these</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.weakTopics.map((t) => (
                <li key={t.topic} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 text-sm">{t.label}</span>
                  <MiniBar value={t.proficiency} />
                  <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">
                    {t.untested ? "—" : t.proficiency}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              “—” means untested: take the diagnostic or practice to calibrate.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Topic proficiency</CardTitle>
          <CardDescription>
            50% recent accuracy · 25% speed vs target · 15% consistency · 10% recency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Proficiency</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Recent accuracy</TableHead>
                <TableHead className="text-right">Avg time</TableHead>
                <TableHead className="text-right">Attempts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.proficiencies.map((p) => (
                <TableRow key={p.topic}>
                  <TableCell>{p.label}</TableCell>
                  <TableCell className="w-48">
                    <MiniBar value={p.proficiency} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.untested ? "—" : p.proficiency}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.untested ? "—" : pctText(p.accuracy)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.untested ? "—" : `${p.avgTimeSeconds}s`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{p.attemptCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentAttempts.length === 0 ? (
            <EmptyState
              glyph="spark"
              title="No attempts yet"
              hint="Your last ten graded questions will show up here as you practice."
              action={<LinkButton size="sm" href="/diagnostic">Take the diagnostic</LinkButton>}
            />
          ) : (
            <ul className="space-y-2">
              {data.recentAttempts.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <Badge variant={a.isCorrect ? "secondary" : "destructive"}>
                    {a.isCorrect ? "✓ right" : "✗ wrong"}
                  </Badge>
                  <span className="min-w-0 flex-1 truncate" title={a.prompt}>
                    {a.prompt}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {Math.round(a.timeSeconds)}s
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

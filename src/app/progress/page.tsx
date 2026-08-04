"use client";

import { useCallback, useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MiniBar, pctText, EmptyState, PageHeader, PageSkeleton, Glyph } from "@/components/widgets";
import { AnswerHistory } from "@/components/AnswerHistory";
import type { AttemptRecord } from "@/lib/types";

interface SubtopicStat {
  subtopic: string;
  label: string;
  topicLabel: string;
  attempts: number;
  wrong: number;
  wrongRate: number;
  timedOut: number;
  timeoutRate: number;
  avgTimeSeconds: number;
  avgTargetSeconds: number;
  timeRatio: number;
  avgCredit: number;
}

interface ProgressData {
  topics: {
    topic: string;
    label: string;
    proficiency: number;
    untested: boolean;
    allTimeAttempts: number;
    allTimeAccuracy: number;
    allTimeAvgTime: number;
    passedLevel: number;
    levelName: string;
    cap: number;
    cappedBy: boolean;
    nextLevel: number;
    nextLevelName: string;
    blocking: string[];
    holdReason: string | null;
  }[];
  pace: {
    onTime: number;
    slightlySlow: number;
    verySlow: number;
    timedOut: number;
    wrong: number;
    medianTimeRatio: number;
  };
  troubleSpots: SubtopicStat[];
  slowestTypes: SubtopicStat[];
  slowestAttempts: {
    id: string;
    prompt: string;
    subtopic: string;
    isCorrect: boolean;
    timeSeconds: number;
    targetSeconds: number;
  }[];
  milestones: { key: string; label: string; achieved: boolean; progress: number }[];
  errorTypeCounts: Record<string, number>;
  weeklyTrend: { weekStart: string; weekEnd: string; attempts: number; accuracy: number }[];
  reviewQueue: AttemptRecord[];
  totalAttempts: number;
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);

  const load = useCallback(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <>
        <PageHeader title="Progress" description="Accuracy, speed, mistakes, and trends by topic." />
        <PageSkeleton tiles={0} rows={8} />
      </>
    );
  }

  const maxErr = Math.max(1, ...Object.values(data.errorTypeCounts));
  const maxWeekly = Math.max(1, ...data.weeklyTrend.map((w) => w.attempts));

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" description="Accuracy, speed, mistakes, and trends by topic." />
      <Card>
        <CardHeader>
          <CardTitle>Against the clock</CardTitle>
          <CardDescription>
            every attempt, bucketed by how it landed. Median time is{" "}
            {data.pace.medianTimeRatio}× target.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "On time", value: data.pace.onTime, hint: "full credit" },
              { label: "Slightly slow", value: data.pace.slightlySlow, hint: "65–85% credit" },
              { label: "Very slow", value: data.pace.verySlow, hint: "10–35% credit" },
              { label: "Timed out", value: data.pace.timedOut, hint: "zero" },
              { label: "Wrong", value: data.pace.wrong, hint: "negative in rapid mode" },
            ].map((b) => (
              <div key={b.label} className="rounded-lg border p-3">
                <div className="text-2xl font-semibold tabular-nums">{b.value}</div>
                <div className="text-sm">{b.label}</div>
                <div className="text-xs text-muted-foreground">{b.hint}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By topic</CardTitle>
          <CardDescription>
            proficiency is capped by the highest difficulty level you have actually passed — 20
            questions across 2 sessions at 85%+ accuracy, with a median time at or under target
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead>Proficiency</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Level passed</TableHead>
                <TableHead>To reach the next level</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Attempts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topics.map((t) => (
                <TableRow key={t.topic}>
                  <TableCell>{t.label}</TableCell>
                  <TableCell className="w-40">
                    <MiniBar value={t.proficiency} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.untested ? "—" : t.proficiency}
                    {t.cappedBy && (
                      <span className="ml-1 text-xs text-muted-foreground">/ {t.cap} cap</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.passedLevel > 0 ? `L${t.passedLevel} ${t.levelName}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.holdReason ? (
                      <span className="text-destructive">held: {t.holdReason}</span>
                    ) : t.blocking.length > 0 ? (
                      `L${t.nextLevel}: ${t.blocking.join(", ")}`
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.allTimeAttempts > 0 ? pctText(t.allTimeAccuracy) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{t.allTimeAttempts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trouble spots — most missed</CardTitle>
            <CardDescription>
              question types by wrong rate (3+ attempts, regraded against current targets)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.troubleSpots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not enough data yet — practice a few sessions and your weak question types show up
                here.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.troubleSpots.map((s) => (
                  <li key={s.subtopic} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm" title={`${s.label} (${s.topicLabel})`}>
                      {s.label}
                    </span>
                    <MiniBar value={s.wrongRate * 100} />
                    <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {pctText(s.wrongRate)} of {s.attempts}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slowest vs target</CardTitle>
            <CardDescription>
              avg time ÷ target time — above 1.0× is slower than interview pace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.slowestTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not enough data yet — timing patterns appear after a few sessions.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.slowestTypes.map((s) => (
                  <li key={s.subtopic} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm" title={`${s.label} (${s.topicLabel})`}>
                      {s.label}
                    </span>
                    <MiniBar value={Math.min(100, (s.timeRatio / 2) * 100)} />
                    <span className="w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {s.timeRatio}× ({s.avgTimeSeconds}s / {s.avgTargetSeconds}s)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Slowest individual solves</CardTitle>
          <CardDescription>the questions that ate the most clock relative to target</CardDescription>
        </CardHeader>
        <CardContent>
          {data.slowestAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing timed yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.slowestAttempts.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`shrink-0 text-xs ${a.isCorrect ? "text-muted-foreground" : "text-destructive"}`}
                  >
                    {a.isCorrect ? "✓" : "✗"}
                  </span>
                  <span className="min-w-0 flex-1 truncate" title={a.prompt}>
                    {a.prompt}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {Math.round(a.timeSeconds)}s vs {a.targetSeconds}s target
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
          <CardDescription>streaks, volume, and readiness-score badges</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {data.milestones.map((m) => (
              <li key={m.key} className="flex items-center gap-2 text-sm">
                <span className={m.achieved ? "text-primary" : "text-muted-foreground/40"}>
                  <Glyph name={m.achieved ? "check" : "target"} className="size-4" />
                </span>
                <span className={m.achieved ? "" : "text-muted-foreground"}>
                  {m.label}
                  {!m.achieved && m.progress > 0 && (
                    <span className="ml-1 text-xs tabular-nums text-muted-foreground/70">
                      {Math.round(m.progress * 100)}%
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mistakes by error type</CardTitle>
            <CardDescription>tagged when you miss a question</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(data.errorTypeCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">No tagged errors yet.</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(data.errorTypeCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <li key={type} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 text-sm">{type}</span>
                      <MiniBar value={count} max={maxErr} />
                      <span className="w-8 text-right text-sm tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly trend</CardTitle>
            <CardDescription>attempts per week, with accuracy</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.weeklyTrend.map((w) => (
                <li key={w.weekStart} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {w.weekStart.slice(5)}
                  </span>
                  <MiniBar value={w.attempts} max={maxWeekly} />
                  <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {w.attempts > 0 ? `${w.attempts} · ${pctText(w.accuracy)}` : "0"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <AnswerHistory onChanged={load} />

      <Card>
        <CardHeader>
          <CardTitle>Review queue ({data.reviewQueue.length})</CardTitle>
          <CardDescription>cleared when you answer correctly on review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.reviewQueue.length === 0 ? (
            <EmptyState
              glyph="check"
              title="Queue is clear"
              hint="Missed questions wait here until you answer them correctly on review."
            />
          ) : (
            <>
              <ul className="space-y-1 text-sm">
                {data.reviewQueue.slice(0, 15).map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate" title={a.prompt}>
                      {a.prompt}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {a.topic} · {a.errorType ?? "untagged"}
                    </span>
                  </li>
                ))}
              </ul>
              <LinkButton href="/review">Review now</LinkButton>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

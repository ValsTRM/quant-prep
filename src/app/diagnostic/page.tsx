"use client";

import { useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuestionRunner, type RunnerResult } from "@/components/QuestionRunner";
import { MiniBar, pctText, PageHeader, PageSkeleton } from "@/components/widgets";
import { requestAutoBackup } from "@/lib/autoBackupClient";
import type { GeneratedQuestion } from "@/lib/types";

interface Section {
  key: string;
  title: string;
  description: string;
  questions: GeneratedQuestion[];
  selfGraded: boolean;
}

interface SectionStats {
  key: string;
  title: string;
  answered: number;
  correct: number;
  accuracy: number;
  avgTimeSeconds: number;
  errorTypes: Record<string, number>;
  notes: string;
  manualScore?: string;
}

interface Report {
  sections: SectionStats[];
  topicScores: { topic: string; label: string; accuracy: number; answered: number }[];
  weaknesses: { topic: string; label: string; accuracy: number }[];
  recommendation: string;
  nextDay: string[];
}

type Phase = "intro" | "running" | "section-summary" | "manual" | "report";

export default function DiagnosticPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[] | null>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [stats, setStats] = useState<SectionStats[]>([]);
  const [lastResults, setLastResults] = useState<RunnerResult[]>([]);
  const [notes, setNotes] = useState("");
  const [manualScore, setManualScore] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [resuming, setResuming] = useState(false);

  const applyLoad = (d: {
    sessionId: string;
    sections: Section[];
    resume: { sectionIndex: number; stats: SectionStats[] } | null;
  }) => {
    setSessionId(d.sessionId);
    setSections(d.sections);
    setReport(null);
    setNotes("");
    setManualScore("");
    if (d.resume && d.resume.sectionIndex > 0 && d.resume.sectionIndex < d.sections.length) {
      setStats(d.resume.stats ?? []);
      setSectionIndex(d.resume.sectionIndex);
      setResuming(true);
    } else {
      setStats([]);
      setSectionIndex(0);
      setResuming(false);
    }
    setPhase("intro");
  };

  useEffect(() => {
    // Load once on mount; startOver triggers an explicit reload.
    fetch("/api/diagnostic")
      .then((r) => r.json())
      .then(applyLoad);
  }, []);

  const startOver = async () => {
    setSections(null);
    setSessionId(null);
    const d = await fetch("/api/diagnostic?fresh=1").then((r) => r.json());
    applyLoad(d);
  };

  if (!sections || !sessionId) {
    return (
      <>
        <PageHeader title="Diagnostic" description="Generating your Day 1 question set…" />
        <PageSkeleton tiles={0} rows={9} />
      </>
    );
  }

  const section = sections[sectionIndex];

  const statsFromResults = (results: RunnerResult[]): SectionStats => {
    const correct = results.filter((r) => r.correct).length;
    const errorTypes: Record<string, number> = {};
    for (const r of results) {
      if (!r.correct && r.errorType) errorTypes[r.errorType] = (errorTypes[r.errorType] ?? 0) + 1;
    }
    return {
      key: section.key,
      title: section.title,
      answered: results.length,
      correct,
      accuracy: results.length > 0 ? correct / results.length : 0,
      avgTimeSeconds:
        results.length > 0
          ? parseFloat((results.reduce((s, r) => s + r.timeSeconds, 0) / results.length).toFixed(1))
          : 0,
      errorTypes,
      notes: "",
    };
  };

  const nextSection = async (finished: SectionStats) => {
    const all = [...stats, finished];
    setStats(all);
    setNotes("");
    setManualScore("");
    if (sectionIndex + 1 < sections.length) {
      // Snapshot after each completed section so an abandoned run loses nothing.
      requestAutoBackup(`diagnostic-${finished.key}`);
      setSectionIndex(sectionIndex + 1);
      const next = sections[sectionIndex + 1];
      setPhase(next.questions.length === 0 ? "manual" : "running");
    } else {
      setBusy(true);
      const res = await fetch("/api/diagnostic/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, sections: all }),
      });
      const d = await res.json();
      setReport(d.report);
      setPhase("report");
      setBusy(false);
    }
  };

  if (phase === "intro") {
    const totalQuestions = sections.reduce((s, sec) => s + sec.questions.length, 0);

    if (resuming && sectionIndex < sections.length) {
      const next = sections[sectionIndex];
      return (
        <Card>
          <CardHeader>
            <CardTitle>Resume your diagnostic</CardTitle>
            <CardDescription>
              You&apos;ve completed {sectionIndex} of {sections.length} sections. Pick up where you
              left off — your earlier answers are saved and already scored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="space-y-1 text-sm">
              {sections.map((s, i) => (
                <li key={s.key} className="flex items-baseline gap-2">
                  <span className="w-4 shrink-0 text-center">
                    {i < sectionIndex ? (
                      <span className="text-primary">✓</span>
                    ) : i === sectionIndex ? (
                      <span className="text-primary">→</span>
                    ) : (
                      <span className="text-muted-foreground">{i + 1}</span>
                    )}
                  </span>
                  <span
                    className={
                      i < sectionIndex
                        ? "text-muted-foreground line-through"
                        : i === sectionIndex
                          ? "font-medium"
                          : "text-muted-foreground"
                    }
                  >
                    {s.title}
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setPhase(next.questions.length === 0 ? "manual" : "running")}>
                Resume section {sectionIndex + 1}: {next.title}
              </Button>
              <Button variant="outline" onClick={startOver}>
                Start over
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Day 1 diagnostic</CardTitle>
          <CardDescription>
            {totalQuestions} questions across {sections.length} sections, plus self-scored prompts.
            Take it in one sitting if you can — it calibrates your entire plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {sections.map((s) => (
              <li key={s.key}>
                <span className="font-medium">{s.title}</span>{" "}
                <span className="text-muted-foreground">— {s.description}</span>
              </li>
            ))}
          </ol>
          <Button
            onClick={() => setPhase(sections[0].questions.length === 0 ? "manual" : "running")}
          >
            Begin section 1: {sections[0].title}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "running") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Section {sectionIndex + 1} of {sections.length}: <span className="font-medium text-foreground">{section.title}</span>{" "}
          — {section.description}
        </p>
        <QuestionRunner
          key={section.key}
          items={section.questions.map((q) => ({ question: q }))}
          source="diagnostic"
          sessionId={sessionId}
          onComplete={(results) => {
            setLastResults(results);
            setPhase("section-summary");
          }}
        />
      </div>
    );
  }

  if (phase === "section-summary") {
    const s = statsFromResults(lastResults);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Section done: {section.title}</CardTitle>
          <CardDescription>
            {s.correct}/{s.answered} correct ({pctText(s.accuracy)}) · avg {s.avgTimeSeconds}s
            {Object.keys(s.errorTypes).length > 0 && (
              <> · errors: {Object.entries(s.errorTypes).map(([k, v]) => `${k}×${v}`).join(", ")}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-sm">
            Notes for this section (optional)
            <Textarea
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What felt slow? What patterns did you miss?"
            />
          </label>
          <Button disabled={busy} onClick={() => nextSection({ ...s, notes })}>
            {sectionIndex + 1 < sections.length ? "Continue" : "Finish & see report"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "manual") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{section.title}</CardTitle>
          <CardDescription>{section.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-sm">
            Self-score (0–10)
            <Input
              className="mt-1 w-32"
              value={manualScore}
              onChange={(e) => setManualScore(e.target.value)}
              placeholder="e.g. 7"
              inputMode="numeric"
            />
          </label>
          <label className="block text-sm">
            Notes (optional)
            <Textarea
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Language used, bugs hit, how close the estimate was…"
            />
          </label>
          <Button
            disabled={busy}
            onClick={() =>
              nextSection({
                key: section.key,
                title: section.title,
                answered: 0,
                correct: 0,
                accuracy: 0,
                avgTimeSeconds: 0,
                errorTypes: {},
                notes,
                manualScore,
              })
            }
          >
            {sectionIndex + 1 < sections.length ? "Continue" : "Finish & see report"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // report
  if (!report) return <p className="text-muted-foreground">Scoring…</p>;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic report</CardTitle>
          <CardDescription>{report.recommendation}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Score by topic</h3>
            <ul className="space-y-2">
              {report.topicScores.map((t) => (
                <li key={t.topic} className="flex items-center gap-3">
                  <span className="w-48 shrink-0 text-sm">{t.label}</span>
                  <MiniBar value={t.accuracy * 100} />
                  <span className="w-20 text-right text-sm tabular-nums text-muted-foreground">
                    {pctText(t.accuracy)} ({t.answered})
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium">Top 3 weaknesses</h3>
            <p className="text-sm text-muted-foreground">
              {report.weaknesses.map((w) => `${w.label} (${pctText(w.accuracy)})`).join(" · ")}
            </p>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium">Recommended next-day plan</h3>
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
              {report.nextDay.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/">Go to dashboard</LinkButton>
            <LinkButton variant="outline" href="/practice">
              Start tomorrow&apos;s plan now
            </LinkButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Section breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
                <TableHead className="text-right">Avg time</TableHead>
                <TableHead>Errors / notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.sections.map((s) => (
                <TableRow key={s.key}>
                  <TableCell>{s.title}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.manualScore ? `${s.manualScore}/10` : `${s.correct}/${s.answered}`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.answered > 0 ? pctText(s.accuracy) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.avgTimeSeconds > 0 ? `${s.avgTimeSeconds}s` : "—"}
                  </TableCell>
                  <TableCell className="max-w-64 text-xs text-muted-foreground">
                    {[
                      Object.entries(s.errorTypes)
                        .map(([k, v]) => `${k}×${v}`)
                        .join(", "),
                      s.notes,
                    ]
                      .filter(Boolean)
                      .join(" — ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

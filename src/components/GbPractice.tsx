"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { gradeAnswer } from "@/lib/grading";
import type { GbProblem } from "@/lib/greenbook";
import type { AttemptRecord, Topic } from "@/lib/types";

interface Props {
  slug: string;
  topic: Topic;
  problems: GbProblem[];
  attempts: AttemptRecord[];
  hintsUsed: Record<string, number>;
  onAnswered: () => void;
  onHint: (problemId: string, level: number) => void;
}

/**
 * Green Book practice.
 *
 * Deliberately not the mental-math runner: these are reasoning problems, so there
 * is no clock, no timeout and no speed credit. What's tracked is whether you got
 * it and how many hints you needed. Answers post to the same attempts table under
 * the `green-book` track, so they never move the mental-math score.
 */
export function GbPractice({
  slug,
  topic,
  problems,
  attempts,
  hintsUsed,
  onAnswered,
  onHint,
}: Props) {
  const solved = new Set(
    attempts.filter((a) => a.isCorrect).map((a) => a.prompt)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice</CardTitle>
        <CardDescription>
          written for this app, not taken from the book · no clock — these are reasoning problems,
          so hints used matter more than seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {problems.map((p, i) => (
          <ProblemCard
            key={p.id}
            index={i + 1}
            problem={p}
            slug={slug}
            topic={topic}
            alreadySolved={solved.has(p.prompt)}
            hintsUsed={hintsUsed[p.id] ?? 0}
            onAnswered={onAnswered}
            onHint={onHint}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ProblemCard({
  index,
  problem,
  slug,
  topic,
  alreadySolved,
  hintsUsed,
  onAnswered,
  onHint,
}: {
  index: number;
  problem: GbProblem;
  slug: string;
  topic: Topic;
  alreadySolved: boolean;
  hintsUsed: number;
  onAnswered: () => void;
  onHint: (problemId: string, level: number) => void;
}) {
  const [input, setInput] = useState("");
  const [verdict, setVerdict] = useState<"unanswered" | "right" | "wrong">("unanswered");
  const [revealed, setRevealed] = useState(hintsUsed);
  const [showAnswer, setShowAnswer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overridden, setOverridden] = useState(false);

  const submit = async (forceCorrect?: boolean) => {
    if (saving) return;
    const graded = gradeAnswer(problem, input).correct;
    const correct = forceCorrect ?? graded;
    setVerdict(correct ? "right" : "wrong");
    setShowAnswer(true);
    if (forceCorrect) setOverridden(true);
    setSaving(true);
    try {
      await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "greenbook",
          track: "green-book",
          sectionSlug: slug,
          topic,
          subtopic: "conditional", // nearest generator shape, for grouping only
          difficulty: problem.difficulty,
          mode: "interview",
          prompt: problem.prompt,
          correctAnswer: problem.answer,
          explanation: problem.explanation,
          userAnswer: input,
          isCorrect: correct,
          gradedCorrect: graded,
          overridden: forceCorrect ? 1 : 0,
          // No clock on this track: report the target as the time so nothing is
          // ever scored as slow or timed out.
          timeSeconds: problem.targetSeconds,
          targetSeconds: problem.targetSeconds,
          timeoutSeconds: problem.targetSeconds * 1000,
          gradingType: problem.gradingType,
          errorType: correct ? null : "concept",
        }),
      });
      onAnswered();
    } catch {
      // Local-first: a failed save shouldn't block practice.
    } finally {
      setSaving(false);
    }
  };

  const nextHint = () => {
    const level = Math.min(revealed + 1, problem.hints.length);
    setRevealed(level);
    onHint(problem.id, level);
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm leading-relaxed">
          <span className="mr-2 font-mono text-muted-foreground">{index}.</span>
          {problem.prompt}
        </p>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <Badge variant="outline">L{problem.difficulty}</Badge>
          {alreadySolved && <Badge variant="secondary">solved before</Badge>}
          {revealed > 0 && (
            <Badge variant="outline">
              {revealed} hint{revealed === 1 ? "" : "s"} used
            </Badge>
          )}
        </div>
      </div>

      {revealed > 0 && (
        <ol className="list-decimal space-y-1 rounded-lg bg-muted p-3 pl-7 text-sm">
          {problem.hints.slice(0, revealed).map((h) => (
            <li key={h.level}>{h.text}</li>
          ))}
        </ol>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Your answer"
          autoComplete="off"
        />
        <Button type="submit" disabled={saving}>
          Submit
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {revealed < problem.hints.length && (
          <Button size="sm" variant="ghost" onClick={nextHint}>
            {revealed === 0 ? "Give me a nudge" : "Another hint"} ({problem.hints.length - revealed}{" "}
            left)
          </Button>
        )}
        {verdict === "wrong" && !overridden && (
          <Button size="sm" variant="outline" onClick={() => submit(true)} disabled={saving}>
            I was actually correct
          </Button>
        )}
      </div>

      {verdict !== "unanswered" && (
        <p
          className={`text-sm font-medium ${
            verdict === "right" ? "text-green-600 dark:text-green-500" : "text-destructive"
          }`}
        >
          {verdict === "right"
            ? overridden
              ? "✓ Marked correct by you"
              : "✓ Correct"
            : `✗ Not quite — answer: ${problem.answer}`}
        </p>
      )}

      {showAnswer && (
        <div className="rounded-lg bg-muted p-3 text-sm leading-relaxed">{problem.explanation}</div>
      )}
    </div>
  );
}

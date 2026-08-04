"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { checkSelfGrade, gradeAnswer, type SelfGradeCheck } from "@/lib/grading";
import { timeCredit } from "@/lib/credit";
import {
  DIFFICULTY_LEVELS,
  ERROR_TYPES,
  MODE_LABELS,
  TOPIC_LABELS,
  type GeneratedQuestion,
  type OverrideState,
  type QuestionMode,
  type Topic,
} from "@/lib/types";

export interface RunnerItem {
  question: GeneratedQuestion;
  bucket?: string;
  reviewOfAttemptId?: string;
}

export interface RunnerResult {
  question: GeneratedQuestion;
  /** Effective verdict, after any manual override. */
  correct: boolean;
  /** What the grader said, before any override. */
  gradedCorrect: boolean;
  overridden: OverrideState;
  timeSeconds: number;
  timedOut: boolean;
  userAnswer: string;
  errorType: string | null;
}

interface QuestionRunnerProps {
  items: RunnerItem[];
  source: string; // 'daily' | 'diagnostic' | 'review'
  sessionId?: string;
  onComplete: (results: RunnerResult[]) => void;
}

const BUCKET_LABELS: Record<string, string> = {
  weak: "Weak topic",
  plan: "Study plan",
  review: "Spaced review",
  challenge: "Challenge",
};

export function QuestionRunner({ items, source, sessionId, onComplete }: QuestionRunnerProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"answering" | "feedback">("answering");
  const [input, setInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [expired, setExpired] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [overridden, setOverridden] = useState<OverrideState>(0);
  const [errorType, setErrorType] = useState("");
  const [saving, setSaving] = useState(false);
  const [solveTime, setSolveTime] = useState(0);
  const [selfCheck, setSelfCheck] = useState<SelfGradeCheck | null>(null);
  const startRef = useRef(0);
  const resultsRef = useRef<RunnerResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const item = items[index];
  const question = item?.question;
  const selfGraded = question?.gradingType === "self_grade";

  // Stamp the question start time outside render (react-hooks/purity).
  useEffect(() => {
    startRef.current = Date.now();
  }, [index]);

  /**
   * The cut-off stops the *scoring*, not the *practice*.
   *
   * Passing `timeoutSeconds` locks the question to zero credit, but the question
   * stays open and the input stays live — working a problem through to the end is
   * the point of practising, and being handed the answer mid-thought destroys the
   * rep. Nothing is revealed until you submit an answer or explicitly ask for it.
   */
  useEffect(() => {
    if (phase !== "answering" || !question) return;
    const t = setInterval(() => {
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      setElapsed(seconds);
      if (seconds >= question.timeoutSeconds) setExpired(true);
    }, 250);
    return () => clearInterval(t);
  }, [phase, index, question]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [index]);

  /**
   * Move to feedback. `graded` distinguishes submitting an answer from asking to
   * see it — the only two ways the answer is ever shown.
   */
  const reveal = useCallback(
    (graded: boolean) => {
      if (phase !== "answering" || !question) return;
      const seconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
      const hitTimeout = seconds >= question.timeoutSeconds;
      setSolveTime(seconds);
      setTimedOut(hitTimeout);

      if (!graded) {
        setGaveUp(true);
        setWasCorrect(false);
        setSelfCheck(null);
      } else if (selfGraded) {
        setSelfCheck(checkSelfGrade(question, input, seconds));
        setWasCorrect(false);
      } else {
        // Late but right still reads as right — the clock is handled by the
        // timeout flag, so a question you can actually do doesn't get filed as
        // a knowledge gap in the review queue.
        setWasCorrect(gradeAnswer(question, input).correct);
      }
      setPhase("feedback");
    },
    [phase, question, input, selfGraded]
  );

  const advance = useCallback(
    async (selfScore?: boolean, forceOverride?: OverrideState) => {
      if (!question || saving) return;
      setSaving(true);
      // For self-graded questions the user's own verdict *is* the grade. For
      // auto-graded ones the grader's verdict is, and `overridden` may move it.
      // `forceOverride` lets a button set both in one click, without waiting a
      // render for the override state to land.
      const ov = forceOverride ?? overridden;
      const graded = selfScore ?? wasCorrect;
      const correct = ov === 1 ? true : ov === -1 ? false : graded;
      const resolvedErrorType =
        correct && !timedOut ? null : errorType || (timedOut ? "speed" : null);
      const result: RunnerResult = {
        question,
        correct,
        gradedCorrect: graded,
        overridden: ov,
        timeSeconds: solveTime,
        timedOut,
        userAnswer: input,
        errorType: resolvedErrorType,
      };
      resultsRef.current.push(result);

      try {
        await fetch("/api/attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionId ?? null,
            source,
            bucket: item.bucket ?? null,
            topic: question.topic,
            subtopic: question.subtopic,
            difficulty: question.difficulty,
            mode: question.mode,
            prompt: question.prompt,
            correctAnswer: question.answer,
            explanation: question.explanation,
            userAnswer: input,
            isCorrect: correct,
            gradedCorrect: graded,
            overridden: ov,
            timedOut,
            timeSeconds: result.timeSeconds,
            targetSeconds: question.targetSeconds,
            timeoutSeconds: question.timeoutSeconds,
            gradingType: question.gradingType,
            errorType: result.errorType,
            reviewOfAttemptId: item.reviewOfAttemptId ?? null,
          }),
        });
      } catch {
        // Local-first: a failed save shouldn't block practice.
      }

      setSaving(false);
      if (index + 1 >= items.length) {
        onComplete(resultsRef.current);
      } else {
        setIndex(index + 1);
        setPhase("answering");
        setInput("");
        setErrorType("");
        setElapsed(0);
        setSolveTime(0);
        setExpired(false);
        setTimedOut(false);
        setGaveUp(false);
        setOverridden(0);
        setSelfCheck(null);
      }
    },
    [
      question,
      saving,
      wasCorrect,
      overridden,
      timedOut,
      errorType,
      input,
      solveTime,
      sessionId,
      source,
      item,
      index,
      items.length,
      onComplete,
    ]
  );

  if (!question) return null;

  const overTarget = elapsed > question.targetSeconds;
  const level = DIFFICULTY_LEVELS[question.difficulty - 1];
  const ratio = solveTime / Math.max(1, question.targetSeconds);
  // The verdict shown (and scored) reflects any manual correction.
  const effectiveCorrect = overridden === 1 ? true : overridden === -1 ? false : wasCorrect;
  const credit = timedOut ? 0 : effectiveCorrect ? timeCredit(ratio) : 0;
  const isChoice = question.gradingType === "choice";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            Question {index + 1} of {items.length}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">
              {TOPIC_LABELS[question.topic as Topic] ?? question.topic}
            </Badge>
            <Badge variant="outline" title={level?.blurb}>
              L{question.difficulty} {level?.name}
            </Badge>
            <Badge variant="outline">{MODE_LABELS[question.mode as QuestionMode]}</Badge>
            {item.bucket && (
              <Badge variant="outline">{BUCKET_LABELS[item.bucket] ?? item.bucket}</Badge>
            )}
            <span
              className={`font-mono tabular-nums transition-colors ${
                expired || (overTarget && phase === "answering")
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              title={`Target ${question.targetSeconds}s · cut-off ${question.timeoutSeconds}s`}
            >
              {phase === "answering" ? elapsed : solveTime}s / {question.targetSeconds}s
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base leading-relaxed">{question.prompt}</p>

        {phase === "answering" && (
          <div className="space-y-3">
            {expired && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <span className="font-medium text-destructive">
                  Past the {question.timeoutSeconds}s cut-off — this one scores 0.
                </span>{" "}
                Keep going and finish it anyway: the answer stays hidden until you submit or
                ask for it.
              </div>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                reveal(true);
              }}
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  selfGraded
                    ? "Your estimate AND how you decomposed it"
                    : isChoice
                      ? "A or B"
                      : "Answer (e.g. 42, 0.75, 3/4, 75%)"
                }
                autoComplete="off"
              />
              <Button type="submit">
                {selfGraded ? "Show reference" : expired ? "Submit (scores 0)" : "Submit"}
              </Button>
            </form>
            {!selfGraded && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => reveal(false)}
              >
                I&apos;m stuck — show the answer (counts as a miss)
              </Button>
            )}
          </div>
        )}

        {phase === "feedback" && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none">
            {gaveUp && overridden !== 1 ? (
              <p className="font-medium text-destructive">
                Answer: {question.answer} — counted as a miss.
              </p>
            ) : !selfGraded ? (
              <p
                className={`font-medium ${effectiveCorrect ? "text-green-600 dark:text-green-500" : "text-destructive"}`}
              >
                {effectiveCorrect
                  ? timedOut
                    ? `✓ Correct, but past the ${question.timeoutSeconds}s cut-off — 0 credit. You can do the maths; you need it faster.`
                    : `✓ Correct — ${Math.round(credit * 100)}% credit (${solveTime}s vs ${question.targetSeconds}s target)`
                  : `✗ Incorrect — answer: ${question.answer}`}
              </p>
            ) : (
              <p className="font-medium">Reference answer: {question.answer}</p>
            )}

            {overridden === 1 && (
              <p className="text-sm text-muted-foreground">
                Marked correct by you — the grader said{" "}
                {wasCorrect ? "correct" : "wrong"}. Both are kept on the record.
              </p>
            )}

            {timedOut && !effectiveCorrect && !gaveUp && (
              <p className="text-sm text-destructive">
                Also past the {question.timeoutSeconds}s cut-off, so this scores 0 either way.
              </p>
            )}
            {selfCheck?.withinFactor === false && (
              <p className="text-sm text-destructive">
                Your estimate is outside a factor of 2 of the reference — that counts as a miss.
              </p>
            )}
            {selfCheck && !selfCheck.allowed && (
              <p className="text-sm text-destructive">{selfCheck.reason}</p>
            )}

            <div className="rounded-lg bg-muted p-3 text-sm leading-relaxed">
              {question.explanation}
            </div>

            {selfGraded && !gaveUp ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={() => advance(true)}
                  disabled={
                    saving || selfCheck?.allowed === false || selfCheck?.withinFactor === false
                  }
                >
                  I got it right
                </Button>
                <Button variant="outline" onClick={() => advance(false)} disabled={saving}>
                  I got it wrong
                </Button>
                {/* The factor-of-2 bar is a heuristic and the reference is only as
                    good as its assumptions, so it can be overridden — but only if
                    you actually wrote an answer. A blank one stays blocked. */}
                {selfCheck?.withinFactor === false && selfCheck?.allowed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => advance(false, 1)}
                    disabled={saving}
                  >
                    Override — my decomposition was sound
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {!effectiveCorrect && (
                  <Button variant="outline" size="sm" onClick={() => setOverridden(1)}>
                    I was actually correct
                  </Button>
                )}
                {overridden === 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setOverridden(0)}>
                    Undo
                  </Button>
                )}
                {!effectiveCorrect && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    Error type:
                    <select
                      value={errorType}
                      onChange={(e) => setErrorType(e.target.value)}
                      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">— pick one —</option>
                      {ERROR_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <Button onClick={() => advance()} disabled={saving}>
                  {index + 1 >= items.length ? "Finish" : "Next"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

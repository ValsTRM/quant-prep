"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PageSkeleton } from "@/components/widgets";
import { GbPractice } from "@/components/GbPractice";
import { BookReader } from "@/components/BookReader";
import { SECTION_STATUS_LABELS, type GbSection, type SectionStatus } from "@/lib/greenbook";
import type { AttemptRecord } from "@/lib/types";

interface SectionData {
  section: GbSection;
  progress: {
    status: SectionStatus;
    notes: string;
    bookProblemsDone: string[];
    hintsUsed: Record<string, number>;
    attempted: number;
    correct: number;
  };
  attempts: AttemptRecord[];
}

type Step = "read" | "learn" | "ask" | "example" | "practice";

const STEPS: { id: Step; label: string; blurb: string }[] = [
  { id: "read", label: "1 · Read", blurb: "The book's own pages for this section" },
  { id: "learn", label: "2 · Learn", blurb: "The idea restated, and your notes on it" },
  { id: "ask", label: "3 · Ask", blurb: "Questions worth being able to answer" },
  { id: "example", label: "4 · Worked example", blurb: "One done in full, step by step" },
  { id: "practice", label: "5 · Practice", blurb: "Your turn — scored" },
];

export default function GreenBookSectionPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [data, setData] = useState<SectionData | null>(null);
  const [step, setStep] = useState<Step>("read");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [readPage, setReadPage] = useState<number | undefined>(undefined);

  const load = useCallback(
    () =>
      fetch(`/api/greenbook/section?slug=${encodeURIComponent(slug)}`)
        .then((r) => r.json())
        .then((d: SectionData) => {
          setData(d);
          setNotes(d.progress.notes ?? "");
        }),
    [slug]
  );

  useEffect(() => {
    load();
  }, [load]);

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      await fetch("/api/greenbook/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...body }),
      });
      await load();
    },
    [slug, load]
  );

  if (!data) {
    return (
      <>
        <PageHeader title="Green Book" description="Loading section…" />
        <PageSkeleton tiles={0} rows={6} />
      </>
    );
  }

  const { section, progress } = data;
  const bookDone = new Set(progress.bookProblemsDone);

  const toggleBookProblem = (id: string) => {
    const next = new Set(bookDone);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    patch({ bookProblemsDone: [...next], status: "practising" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${section.number} ${section.title}`}
        description={`${section.summary} · pp. ${section.pages[0]}–${section.pages[1]} in your copy`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <LinkButton href="/greenbook" variant="outline">
          ← All sections
        </LinkButton>
        <Badge variant="secondary">{SECTION_STATUS_LABELS[progress.status]}</Badge>
        <Badge variant="outline">
          {progress.correct}/{section.problems.length} problems solved
        </Badge>
        <Badge variant="outline">
          {bookDone.size}/{section.bookProblems.length} book problems ticked
        </Badge>
        {progress.status !== "done" && (
          <Button size="sm" variant="outline" onClick={() => patch({ status: "done" })}>
            Mark section done
          </Button>
        )}
      </div>

      {/* Step switcher — the four stages are always reachable, so you can go back
          to the explanation mid-practice without losing your place. */}
      <nav aria-label="Section steps" className="flex flex-wrap gap-1.5">
        {STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            aria-current={step === s.id ? "step" : undefined}
            className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              step === s.id ? "border-foreground/20 bg-muted font-medium" : "hover:bg-muted"
            }`}
          >
            <span className="block">{s.label}</span>
            <span className="block text-xs text-muted-foreground">{s.blurb}</span>
          </button>
        ))}
      </nav>

      {step === "read" && (
        <>
          <BookReader
            key={readPage ?? "section"}
            slug={slug}
            pages={section.pages}
            initialPage={readPage}
          />
          <Card>
            <CardHeader>
              <CardTitle>While you read</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Jot what lands and what doesn&apos;t into <strong>My notes</strong> on the Learn
                step — it&apos;s the same box, so you can go back and forth. When you&apos;re done
                reading, Learn restates the idea independently, which is a decent check on whether
                it actually went in.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {step === "learn" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>The idea</CardTitle>
              <CardDescription>
                written for this app — read the book&apos;s own treatment on pp. {section.pages[0]}–
                {section.pages[1]} alongside it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {section.concept.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed">
                  {para}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What to hold on to</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {section.keyIdeas.map((k) => (
                  <div key={k.name}>
                    <dt className="text-sm font-medium">{k.name}</dt>
                    <dd className="text-sm text-muted-foreground">{k.body}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My notes</CardTitle>
              <CardDescription>
                your own summary as you read — saved locally, and yours to write in whatever form
                helps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setSaved(false);
                }}
                rows={8}
                placeholder="What clicked, what didn't, the version of the explanation that works for you…"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    await patch({ notes, status: "learning" });
                    setSaved(true);
                  }}
                >
                  Save notes
                </Button>
                {saved && <span className="text-xs text-muted-foreground">Saved.</span>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "ask" && (
        <Card>
          <CardHeader>
            <CardTitle>Check yourself</CardTitle>
            <CardDescription>
              if you can answer these out loud without notes, the section has landed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
              {section.checkYourself.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
            <div className="rounded-lg bg-muted p-3 text-sm">
              Anything you can&apos;t answer, write it into <strong>My notes</strong> on the Learn
              step. Every practice problem below also has a hint ladder — a nudge first, the full
              method last — so you can get unstuck without being handed the answer.
            </div>
          </CardContent>
        </Card>
      )}

      {step === "example" && (
        <div className="space-y-4">
          {section.examples.map((ex) => (
            <WorkedExampleCard key={ex.id} example={ex} />
          ))}
        </div>
      )}

      {step === "practice" && (
        <div className="space-y-6">
          <GbPractice
            slug={slug}
            topic={section.topic}
            problems={section.problems}
            attempts={data.attempts}
            hintsUsed={progress.hintsUsed}
            onAnswered={load}
            onHint={(id, level) => patch({ hintsUsed: { ...progress.hintsUsed, [id]: level } })}
          />

          <Card>
            <CardHeader>
              <CardTitle>The book&apos;s own problems</CardTitle>
              <CardDescription>
                work these in your copy at the page shown, then tick them off — the app tracks that
                you did them without reproducing them
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {section.bookProblems.map((bp) => (
                  <li key={bp.id} className="flex items-center gap-3 py-2">
                    <input
                      id={bp.id}
                      type="checkbox"
                      checked={bookDone.has(bp.id)}
                      onChange={() => toggleBookProblem(bp.id)}
                      className="size-4 shrink-0 accent-foreground"
                    />
                    <label htmlFor={bp.id} className="min-w-0 flex-1 cursor-pointer text-sm">
                      {bp.title}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setReadPage(bp.page);
                        setStep("read");
                      }}
                      className="shrink-0 rounded px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title={`Read p. ${bp.page} here`}
                    >
                      p. {bp.page} ↗
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/** Steps revealed one at a time, so you can stop and finish it yourself. */
function WorkedExampleCard({ example }: { example: GbSection["examples"][number] }) {
  const [shown, setShown] = useState(0);
  const all = shown >= example.steps.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Worked example</CardTitle>
        <CardDescription>revealed a step at a time — stop and try to finish it</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed font-medium">{example.prompt}</p>

        {shown > 0 && (
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {example.steps.slice(0, shown).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!all && (
            <Button size="sm" variant="outline" onClick={() => setShown(shown + 1)}>
              {shown === 0 ? "Show the first step" : "Next step"}
            </Button>
          )}
          {!all && shown > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShown(example.steps.length)}
            >
              Show all steps
            </Button>
          )}
          {shown > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.min(shown, example.steps.length)} of {example.steps.length}
            </span>
          )}
        </div>

        {all && (
          <>
            <p className="text-sm font-medium">Answer: {example.answer}</p>
            <div className="rounded-lg bg-muted p-3 text-sm leading-relaxed">
              <span className="font-medium">Takeaway. </span>
              {example.takeaway}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

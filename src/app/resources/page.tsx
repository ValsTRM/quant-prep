"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { ERROR_TYPES } from "@/lib/types";
import { EmptyState, PageHeader } from "@/components/widgets";

const RESOURCES = [
  { value: "green-book", label: "Green Book (chapter / problem range)" },
  { value: "quantguide", label: "QuantGuide session" },
  { value: "jane-street-guide", label: "Jane Street Probability & Markets" },
  { value: "stat-110", label: "Stat 110 (lecture / pset)" },
  { value: "mit-18-05", label: "MIT 18.05 (section)" },
  { value: "street-fighting-math", label: "MIT Street-Fighting Mathematics" },
  { value: "other", label: "Other" },
];

interface ResourceLog {
  id: string;
  resource: string;
  section: string;
  result: string | null;
  minutes: number | null;
  errorTypes: string | null;
  notes: string | null;
  date: string;
}

const resourceLabel = (value: string) =>
  RESOURCES.find((r) => r.value === value)?.label.split(" (")[0] ?? value;

export default function ResourcesPage() {
  const [logs, setLogs] = useState<ResourceLog[]>([]);
  const [resource, setResource] = useState("green-book");
  const [section, setSection] = useState("");
  const [result, setResult] = useState("");
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [errorTypes, setErrorTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch("/api/resources")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs));
  }, []);

  useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!section.trim()) return;
    setSaving(true);
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource,
        section,
        result,
        minutes: minutes ? parseInt(minutes, 10) : null,
        errorTypes,
        notes,
        date,
      }),
    });
    setSection("");
    setResult("");
    setMinutes("");
    setNotes("");
    setErrorTypes([]);
    setSaving(false);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/resources?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        description="Log sessions from external study material; the app never copies their problems."
      />
      <Card>
        <CardHeader>
          <CardTitle>Log an external study session</CardTitle>
          <CardDescription>
            Green Book, QuantGuide, Jane Street guide, Stat 110, 18.05, Street-Fighting Math. The
            app tracks your progress through them but never copies their problems.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Resource
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="mt-1 h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {RESOURCES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Section / range studied
              <Input
                className="mt-1"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Ch. 4 problems 1-12, or Lecture 5"
              />
            </label>
            <label className="block text-sm">
              Score / result
              <Input
                className="mt-1"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="e.g. 9/12 correct"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Minutes
                <Input
                  className="mt-1"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  inputMode="numeric"
                  placeholder="45"
                />
              </label>
              <label className="block text-sm">
                Date
                <Input
                  className="mt-1"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </div>
            <fieldset className="text-sm sm:col-span-2">
              <legend>Error types hit (optional)</legend>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {ERROR_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      className="accent-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      checked={errorTypes.includes(t)}
                      onChange={(e) =>
                        setErrorTypes((prev) =>
                          e.target.checked ? [...prev, t] : prev.filter((x) => x !== t)
                        )
                      }
                    />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm sm:col-span-2">
              Notes
              <Textarea
                className="mt-1"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What to revisit, patterns worth generalizing…"
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving || !section.trim()}>
                Log session
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study log ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState
              glyph="book"
              title="No sessions logged yet"
              hint="After a Green Book chapter or a QuantGuide set, log the range, score, and what tripped you up."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Errors / notes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="tabular-nums">{l.date}</TableCell>
                    <TableCell>{resourceLabel(l.resource)}</TableCell>
                    <TableCell>{l.section}</TableCell>
                    <TableCell>{l.result ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{l.minutes ?? "—"}</TableCell>
                    <TableCell className="max-w-56 text-xs text-muted-foreground">
                      {[l.errorTypes, l.notes].filter(Boolean).join(" — ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="xs" onClick={() => remove(l.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

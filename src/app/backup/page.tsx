"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/widgets";

interface AutoBackupInfo {
  file: string;
  label: string;
  createdAt: string;
  bytes: number;
}

const LABEL_TEXT: Record<string, string> = {
  "practice-session": "Practice session finished",
  "review-session": "Review session finished",
  "diagnostic-complete": "Diagnostic completed",
  "pre-import": "Before an import",
  "pre-reset": "Before a reset",
  "pre-restore": "Before a restore",
};

function labelText(label: string): string {
  if (LABEL_TEXT[label]) return LABEL_TEXT[label];
  if (label.startsWith("diagnostic-")) {
    return `Diagnostic section: ${label.slice("diagnostic-".length).replace(/-/g, " ")}`;
  }
  return label.replace(/-/g, " ");
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-CA")} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BackupPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autoBackups, setAutoBackups] = useState<AutoBackupInfo[] | null>(null);

  const loadBackups = useCallback(() => {
    fetch("/api/backup/auto")
      .then((r) => r.json())
      .then((d) => setAutoBackups(d.backups))
      .catch(() => setAutoBackups([]));
  }, []);

  useEffect(loadBackups, [loadBackups]);

  const importFile = async (file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const d = await res.json();
      if (!res.ok) {
        setMessage(`Import failed: ${d.error}`);
      } else {
        setMessage(
          `Imported ${d.imported.attempts} attempts, ${d.imported.sessions} sessions, ${d.imported.resourceLogs} resource logs. This replaced all previous data (a pre-import snapshot was saved first).`
        );
      }
    } catch (e) {
      setMessage(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setBusy(false);
    loadBackups();
  };

  const restore = async (b: AutoBackupInfo) => {
    if (
      !confirm(
        `Restore the snapshot from ${formatWhen(b.createdAt)} (${labelText(b.label)})?\n\nThis replaces all current data. A pre-restore snapshot of the current state is saved first.`
      )
    )
      return;
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/backup/restore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: b.file }),
    });
    const d = await res.json();
    setMessage(
      res.ok
        ? `Restored ${d.imported.attempts} attempts, ${d.imported.sessions} sessions, ${d.imported.resourceLogs} resource logs from ${formatWhen(b.createdAt)}.`
        : `Restore failed: ${d.error}`
    );
    setBusy(false);
    loadBackups();
  };

  const reset = async () => {
    if (!confirm("Delete ALL local data (attempts, sessions, resource logs, settings)?")) return;
    if (!confirm("Really sure? A pre-reset snapshot is saved automatically, but export too if in doubt.")) return;
    setBusy(true);
    const res = await fetch("/api/backup/reset", { method: "POST" });
    const d = await res.json();
    setMessage(
      d.preResetBackup
        ? `All data wiped. A pre-reset snapshot was saved (${d.preResetBackup}) — restore it below if this was a mistake.`
        : "All data wiped. The app is back to a fresh state."
    );
    setBusy(false);
    loadBackups();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Backup"
        description="Export, restore, or reset the local SQLite database."
      />
      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
          <CardDescription>
            Your data lives in <code className="font-mono text-xs">./data/quant-prep.sqlite</code>.
            Export a portable copy any time.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {/* Real anchors (downloads), wearing button styling — not fake buttons. */}
          <a href="/api/backup/export" download className={buttonVariants()}>
            Export everything (JSON)
          </a>
          <a href="/api/backup/csv" download className={buttonVariants({ variant: "outline" })}>
            Export attempts (CSV)
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automatic backups</CardTitle>
          <CardDescription>
            Snapshots are taken after every diagnostic section, practice session, and review
            session — and before any import, restore, or reset. Stored in{" "}
            <code className="font-mono text-xs">./data/backups/</code>, newest 40 kept.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {autoBackups === null ? (
            <p className="text-sm text-muted-foreground">Loading snapshots…</p>
          ) : autoBackups.length === 0 ? (
            <EmptyState
              glyph="shield"
              title="No snapshots yet"
              hint="Finish a diagnostic section or a practice session and a snapshot will appear here automatically."
            />
          ) : (
            <ul className="divide-y divide-border">
              {autoBackups.map((b) => (
                <li key={b.file} className="flex items-center gap-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{labelText(b.label)}</div>
                    <div className="text-xs tabular-nums text-muted-foreground">
                      {formatWhen(b.createdAt)} · {formatSize(b.bytes)}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => restore(b)}>
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import</CardTitle>
          <CardDescription>
            Restore from a JSON export. <span className="font-medium">Replaces all current data</span>{" "}
            (a pre-import snapshot is saved first).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
            Choose backup file…
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset</CardTitle>
          <CardDescription>
            Wipe everything and start fresh. A pre-reset snapshot is saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled={busy} onClick={reset}>
            Delete all data
          </Button>
        </CardContent>
      </Card>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}

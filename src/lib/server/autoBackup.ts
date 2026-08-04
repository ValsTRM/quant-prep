import fs from "node:fs";
import path from "node:path";
import { getDb, getSqlite, schema, DATA_DIR } from "../db";
import { modeFor, timeoutSecondsFor, type Topic } from "../types";

const BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_AUTO_BACKUPS = 40;
const FILE_RE = /^auto-(.+Z)-([a-z0-9-]+)\.json$/;

export interface BackupPayload {
  app: string;
  version: number;
  exportedAt: string;
  sessions: (typeof schema.sessions.$inferSelect)[];
  attempts: (typeof schema.attempts.$inferSelect)[];
  resourceLogs: (typeof schema.resourceLogs.$inferSelect)[];
  appState: (typeof schema.appState.$inferSelect)[];
}

export interface AutoBackupInfo {
  file: string;
  label: string;
  createdAt: string; // ISO
  bytes: number;
}

/** The canonical export shape — shared by manual export, auto-backup, and restore. */
export function buildExportPayload(): BackupPayload {
  const db = getDb();
  return {
    app: "quant-prep",
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: db.select().from(schema.sessions).all(),
    attempts: db.select().from(schema.attempts).all(),
    resourceLogs: db.select().from(schema.resourceLogs).all(),
    appState: db.select().from(schema.appState).all(),
  };
}

/**
 * Write a timestamped snapshot of everything to data/backups/, then prune to
 * the newest MAX_AUTO_BACKUPS. Skips when the database is empty (nothing worth
 * keeping, and it would churn the rotation).
 */
export function writeAutoBackup(label: string): { file: string | null; skipped?: string } {
  const payload = buildExportPayload();
  const empty =
    payload.sessions.length === 0 &&
    payload.attempts.length === 0 &&
    payload.resourceLogs.length === 0 &&
    payload.appState.length === 0;
  if (empty) return { file: null, skipped: "empty-database" };

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const safeLabel =
    label
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "snapshot";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = `auto-${stamp}-${safeLabel}.json`;
  fs.writeFileSync(path.join(BACKUP_DIR, file), JSON.stringify(payload));

  // ISO stamps sort lexicographically, so oldest files sort first.
  const all = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => FILE_RE.test(f))
    .sort();
  for (const old of all.slice(0, Math.max(0, all.length - MAX_AUTO_BACKUPS))) {
    fs.unlinkSync(path.join(BACKUP_DIR, old));
  }
  return { file };
}

/** Snapshots on disk, newest first. */
export function listAutoBackups(): AutoBackupInfo[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => FILE_RE.test(f))
    .sort()
    .reverse()
    .map((file) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, file));
      return {
        file,
        label: file.match(FILE_RE)?.[2] ?? "snapshot",
        createdAt: stat.mtime.toISOString(),
        bytes: stat.size,
      };
    });
}

/** Read a snapshot by filename. Rejects anything that isn't a known backup name. */
export function readAutoBackup(file: string): BackupPayload | null {
  if (!FILE_RE.test(file)) return null; // also blocks path traversal
  const p = path.join(BACKUP_DIR, file);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as BackupPayload;
  } catch {
    return null;
  }
}

/**
 * Replace ALL current data with the payload's contents, transactionally.
 * Callers are responsible for taking a pre-restore snapshot first.
 */
export function restoreFromPayload(
  payload: Partial<BackupPayload>
): { ok: true; imported: Record<string, number> } | { ok: false; error: string } {
  if (payload.app !== "quant-prep" || !Array.isArray(payload.attempts)) {
    return {
      ok: false,
      error: "Not a quant-prep backup (expected app: 'quant-prep' with an attempts array)",
    };
  }
  const sqlite = getSqlite();
  const db = getDb();
  const run = sqlite.transaction(() => {
    sqlite.exec(
      "DELETE FROM attempts; DELETE FROM sessions; DELETE FROM resource_logs; DELETE FROM app_state;"
    );
    for (const s of payload.sessions ?? []) db.insert(schema.sessions).values(s).run();
    for (const a of payload.attempts ?? []) {
      // Backups taken before the two-mode split have no mode/timeout columns.
      // Derive them from the question shape rather than defaulting everything
      // to "interview", which would give old arithmetic rows the wrong clock.
      db.insert(schema.attempts)
        .values({
          ...a,
          mode: a.mode ?? modeFor(a.subtopic),
          timedOut: a.timedOut ?? 0,
          timeoutSeconds:
            a.timeoutSeconds ?? timeoutSecondsFor(a.subtopic, a.difficulty, a.topic as Topic),
          // Backups predating manual overrides: the recorded verdict *is* the
          // auto-grade, so seeding it keeps "undo" working on restored history.
          gradedCorrect: a.gradedCorrect ?? a.isCorrect,
          overridden: a.overridden ?? 0,
          overriddenAt: a.overriddenAt ?? null,
        })
        .run();
    }
    for (const r of payload.resourceLogs ?? []) db.insert(schema.resourceLogs).values(r).run();
    for (const k of payload.appState ?? []) db.insert(schema.appState).values(k).run();
  });
  try {
    run();
  } catch (e) {
    return { ok: false, error: `Restore failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  return {
    ok: true,
    imported: {
      sessions: payload.sessions?.length ?? 0,
      attempts: payload.attempts?.length ?? 0,
      resourceLogs: payload.resourceLogs?.length ?? 0,
      appState: payload.appState?.length ?? 0,
    },
  };
}

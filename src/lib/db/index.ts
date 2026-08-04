import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Overridable so tests/tools can point at a scratch directory instead of live data.
const DATA_DIR = process.env.QUANT_PREP_DATA_DIR
  ? path.resolve(process.env.QUANT_PREP_DATA_DIR)
  : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "quant-prep.sqlite");

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  meta TEXT
);
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  source TEXT NOT NULL,
  bucket TEXT,
  track TEXT NOT NULL DEFAULT 'mental-math',
  section_slug TEXT,
  topic TEXT NOT NULL,
  subtopic TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'interview',
  prompt TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  graded_correct INTEGER,
  overridden INTEGER NOT NULL DEFAULT 0,
  overridden_at INTEGER,
  timed_out INTEGER NOT NULL DEFAULT 0,
  time_seconds REAL NOT NULL,
  target_seconds REAL NOT NULL,
  timeout_seconds REAL,
  grading_type TEXT NOT NULL,
  error_type TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  review_of_attempt_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempts_topic ON attempts(topic, created_at);
CREATE INDEX IF NOT EXISTS idx_attempts_created ON attempts(created_at);
CREATE TABLE IF NOT EXISTS resource_logs (
  id TEXT PRIMARY KEY,
  resource TEXT NOT NULL,
  section TEXT NOT NULL,
  result TEXT,
  minutes INTEGER,
  error_types TEXT,
  notes TEXT,
  date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS gb_progress (
  slug TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'learning',
  notes TEXT,
  book_problems_done TEXT,
  hints_used TEXT,
  started_at INTEGER,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER
);
`;

/**
 * Columns added after the first release. `CREATE TABLE IF NOT EXISTS` won't add
 * them to an existing file, so they're applied one at a time and any
 * "duplicate column" error is ignored — the column is already there.
 */
const ADD_COLUMNS: { table: string; column: string; ddl: string }[] = [
  { table: "attempts", column: "mode", ddl: "TEXT NOT NULL DEFAULT 'interview'" },
  { table: "attempts", column: "timed_out", ddl: "INTEGER NOT NULL DEFAULT 0" },
  { table: "attempts", column: "timeout_seconds", ddl: "REAL" },
  { table: "attempts", column: "graded_correct", ddl: "INTEGER" },
  { table: "attempts", column: "overridden", ddl: "INTEGER NOT NULL DEFAULT 0" },
  { table: "attempts", column: "overridden_at", ddl: "INTEGER" },
  // Everything answered before the Green Book track existed is mental math, and
  // the column default says so — no existing row changes meaning.
  { table: "attempts", column: "track", ddl: "TEXT NOT NULL DEFAULT 'mental-math'" },
  { table: "attempts", column: "section_slug", ddl: "TEXT" },
];

/**
 * Bump whenever CREATE_SQL or ADD_COLUMNS changes.
 *
 * A long-running dev server caches the database handle on `globalThis`, so
 * `init()` short-circuits and never re-runs the migration — which means a schema
 * change shipped by a hot reload leaves the code querying columns the open
 * connection never gained, and every request 500s with "no such column". This
 * version is stamped on the cached handle so a mismatch re-runs the migration
 * instead of silently breaking until someone thinks to restart.
 */
const SCHEMA_VERSION = 4;

/**
 * Bring the database up to the current schema. Every statement is idempotent
 * (`IF NOT EXISTS`, or guarded by a `table_info` check), so this is safe to call
 * on an already-migrated connection.
 */
function ensureSchema(sqlite: Database.Database): void {
  sqlite.exec(CREATE_SQL);

  for (const { table, column, ddl } of ADD_COLUMNS) {
    const existing = sqlite
      .prepare(`PRAGMA table_info(${table})`)
      .all() as { name: string }[];
    if (existing.some((c) => c.name === column)) continue;
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
  // Backfill `mode` for rows written before the two-mode split, using the same
  // subtopic → mode table the app uses today.
  sqlite.exec(`
    UPDATE attempts SET mode = 'rapid'
    WHERE mode = 'interview' AND subtopic IN (
      'addition','subtraction','multiplication','division','decimal-ops',
      'missing-operand','sequential-arithmetic','approximation',
      'fraction-to-decimal','fraction-to-percent','representation-compare',
      'percent-of','reverse-percent','sequential-percent'
    )
  `);
  // Rows written before overrides existed were never overridden, so their
  // effective verdict IS the auto-grade. Seeding this keeps "revert to the
  // original grade" working on the whole history, not just new answers.
  sqlite.exec(`UPDATE attempts SET graded_correct = is_correct WHERE graded_correct IS NULL`);

  // Indexes on migrated columns must come after the ALTER TABLEs above. On an
  // existing database `CREATE TABLE IF NOT EXISTS` is a no-op, so anything in
  // CREATE_SQL that references a new column would run before the column exists.
  sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_attempts_track ON attempts(track, created_at)`);
}

interface DbGlobal {
  __quantPrepSqlite?: Database.Database;
  __quantPrepDb?: BetterSQLite3Database<typeof schema>;
  /** Schema version this cached handle was migrated to. */
  __quantPrepSchemaVersion?: number;
}

const g = globalThis as DbGlobal;

function init(): { sqlite: Database.Database; db: BetterSQLite3Database<typeof schema> } {
  if (!g.__quantPrepSqlite) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    ensureSchema(sqlite);
    g.__quantPrepSqlite = sqlite;
    g.__quantPrepDb = drizzle(sqlite, { schema });
    g.__quantPrepSchemaVersion = SCHEMA_VERSION;
  } else if (g.__quantPrepSchemaVersion !== SCHEMA_VERSION) {
    // Hot-reloaded onto a newer schema than this connection was opened against.
    ensureSchema(g.__quantPrepSqlite);
    g.__quantPrepSchemaVersion = SCHEMA_VERSION;
  }
  return { sqlite: g.__quantPrepSqlite, db: g.__quantPrepDb! };
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  return init().db;
}

export function getSqlite(): Database.Database {
  return init().sqlite;
}

export { schema, DB_PATH, DATA_DIR };

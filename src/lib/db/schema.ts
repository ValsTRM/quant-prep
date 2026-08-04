import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'diagnostic' | 'daily' | 'review'
  startedAt: integer("started_at").notNull(),
  completedAt: integer("completed_at"),
  meta: text("meta"), // JSON blob (diagnostic report, plan summary, ...)
});

export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  sessionId: text("session_id"),
  source: text("source").notNull(), // 'diagnostic' | 'daily' | 'review' | 'greenbook'
  bucket: text("bucket"), // 'weak' | 'plan' | 'review' | 'challenge' | null
  /** Which programme this answer belongs to. Existing rows are mental math. */
  track: text("track").notNull().default("mental-math"), // 'mental-math' | 'green-book'
  /** Green Book section slug, when track = 'green-book'. */
  sectionSlug: text("section_slug"),
  topic: text("topic").notNull(),
  subtopic: text("subtopic").notNull(),
  difficulty: integer("difficulty").notNull(),
  mode: text("mode").notNull().default("interview"), // 'rapid' | 'interview'
  prompt: text("prompt").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  userAnswer: text("user_answer").notNull(),
  /** The EFFECTIVE verdict everything scores from — an override edits this. */
  isCorrect: integer("is_correct").notNull(), // 0 | 1
  /** What the auto-grader decided. Never edited, so an override is auditable. */
  gradedCorrect: integer("graded_correct"), // 0 | 1 | null (pre-override rows)
  /** 0 = auto-graded, 1 = manually forced correct, -1 = manually forced wrong. */
  overridden: integer("overridden").notNull().default(0),
  overriddenAt: integer("overridden_at"),
  timedOut: integer("timed_out").notNull().default(0), // 0 | 1
  timeSeconds: real("time_seconds").notNull(),
  targetSeconds: real("target_seconds").notNull(),
  timeoutSeconds: real("timeout_seconds"),
  gradingType: text("grading_type").notNull(),
  errorType: text("error_type"),
  resolved: integer("resolved").notNull().default(0), // missed question later reviewed correctly
  reviewOfAttemptId: text("review_of_attempt_id"),
  createdAt: integer("created_at").notNull(),
});

export const resourceLogs = sqliteTable("resource_logs", {
  id: text("id").primaryKey(),
  resource: text("resource").notNull(), // 'green-book' | 'quantguide' | ...
  section: text("section").notNull(), // chapter / problem range / lecture
  result: text("result"), // score or outcome, free text
  minutes: integer("minutes"),
  errorTypes: text("error_types"), // comma-separated ErrorType values
  notes: text("notes"),
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: integer("created_at").notNull(),
});

export const appState = sqliteTable("app_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * Per-section state for the Green Book track. One row per section you've touched;
 * sections you haven't started simply have no row.
 */
export const gbProgress = sqliteTable("gb_progress", {
  slug: text("slug").primaryKey(), // e.g. '4.3-conditional-probability-and-bayes'
  /** 'learning' | 'practising' | 'done' */
  status: text("status").notNull().default("learning"),
  /** Your own summary of the section, written as you read your copy of the book. */
  notes: text("notes"),
  /** Which of the book's own problems you've marked as worked, as a JSON array of ids. */
  bookProblemsDone: text("book_problems_done"),
  /** How far down the hint ladder you went, per problem, as a JSON object. */
  hintsUsed: text("hints_used"),
  startedAt: integer("started_at"),
  updatedAt: integer("updated_at").notNull(),
  completedAt: integer("completed_at"),
});

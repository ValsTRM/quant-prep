import {
  computeAllProficiencies,
  currentTargetFor,
  levelEvidence,
  proficiencyBreakdown,
} from "@/lib/proficiency";
import { attemptsByTrack, reviewQueue } from "@/lib/server/queries";
import { greenBookSummary } from "@/lib/server/greenbook";
import { computeStreak, localDay } from "@/lib/streak";
import {
  DIFFICULTY_LEVELS,
  TOPIC_LABELS,
  SUBTOPIC_LABELS,
  type Topic,
} from "@/lib/types";
import { readinessScore, computeMilestones, paceBreakdown, subtopicBreakdown } from "@/lib/scoring";

const MS_PER_DAY = 86_400_000;
const MIN_ATTEMPTS_FOR_TREND = 3;

export async function GET() {
  const now = Date.now();
  const attempts = attemptsByTrack("mental-math");
  const proficiencies = computeAllProficiencies(attempts, now);

  // All-time per-topic aggregates alongside the recent-window proficiency.
  const topics = proficiencies.map((p) => {
    const topicAttempts = attempts.filter((a) => a.topic === p.topic);
    const correct = topicAttempts.filter((a) => a.isCorrect).length;
    const avgTime =
      topicAttempts.length > 0
        ? topicAttempts.reduce((s, a) => s + a.timeSeconds, 0) / topicAttempts.length
        : 0;
    // What's blocking the next level, so a capped score is explainable.
    const nextLevel = Math.min(5, p.passedLevel + 1);
    const evidence = levelEvidence(topicAttempts, nextLevel);
    return {
      ...p,
      label: TOPIC_LABELS[p.topic as Topic],
      allTimeAttempts: topicAttempts.length,
      allTimeAccuracy: topicAttempts.length > 0 ? correct / topicAttempts.length : 0,
      allTimeAvgTime: parseFloat(avgTime.toFixed(1)),
      levelName: p.passedLevel > 0 ? DIFFICULTY_LEVELS[p.passedLevel - 1].name : "not yet passed",
      nextLevel,
      nextLevelName: DIFFICULTY_LEVELS[nextLevel - 1].name,
      blocking: evidence.missing,
      components: proficiencyBreakdown(topicAttempts, now),
    };
  });

  // Per-question-shape breakdown against CURRENT targets (regraded).
  const breakdown = subtopicBreakdown(attempts).map((s) => ({
    ...s,
    label: SUBTOPIC_LABELS[s.subtopic] ?? s.subtopic,
    topicLabel: TOPIC_LABELS[s.topic as Topic] ?? s.topic,
  }));
  const eligible = breakdown.filter((s) => s.attempts >= MIN_ATTEMPTS_FOR_TREND);
  const troubleSpots = [...eligible]
    .filter((s) => s.wrong > 0)
    .sort((a, b) => b.wrongRate - a.wrongRate)
    .slice(0, 8);
  const slowestTypes = [...eligible].sort((a, b) => b.timeRatio - a.timeRatio).slice(0, 8);

  // Slowest individual solves relative to their (current) target.
  const slowestAttempts = [...attempts]
    .map((a) => ({
      id: a.id,
      prompt: a.prompt,
      topic: a.topic,
      subtopic: a.subtopic,
      isCorrect: a.isCorrect,
      timeSeconds: a.timeSeconds,
      targetSeconds: currentTargetFor(a, a.topic as Topic),
    }))
    .sort(
      (x, y) => y.timeSeconds / Math.max(1, y.targetSeconds) - x.timeSeconds / Math.max(1, x.targetSeconds)
    )
    .slice(0, 8);

  // Mistake frequency by tagged error type.
  const errorTypeCounts: Record<string, number> = {};
  for (const a of attempts) {
    if (!a.isCorrect && a.errorType) {
      errorTypeCounts[a.errorType] = (errorTypeCounts[a.errorType] ?? 0) + 1;
    }
  }

  // Weekly trend over the last 8 weeks (7-day buckets ending today).
  const weeklyTrend = Array.from({ length: 8 }, (_, i) => {
    const end = now - i * 7 * MS_PER_DAY;
    const start = end - 7 * MS_PER_DAY;
    const bucket = attempts.filter((a) => a.createdAt > start && a.createdAt <= end);
    const correct = bucket.filter((a) => a.isCorrect).length;
    return {
      weekStart: localDay(start + MS_PER_DAY),
      weekEnd: localDay(end),
      attempts: bucket.length,
      accuracy: bucket.length > 0 ? correct / bucket.length : 0,
    };
  }).reverse();

  const qrs = readinessScore(proficiencies);
  const streak = computeStreak(attempts.map((a) => a.createdAt), now);

  return Response.json({
    topics,
    troubleSpots,
    slowestTypes,
    slowestAttempts,
    errorTypeCounts,
    weeklyTrend,
    milestones: computeMilestones(streak, attempts.length, qrs),
    pace: paceBreakdown(attempts),
    greenBook: greenBookSummary(),
    reviewQueue: reviewQueue(50),
    totalAttempts: attempts.length,
  });
}

import { computeAllProficiencies, weakestTopics } from "@/lib/proficiency";
import { computeStreak, localDay } from "@/lib/streak";
import { attemptsByTrack, recentAttempts, reviewQueue, getState } from "@/lib/server/queries";
import { greenBookSummary } from "@/lib/server/greenbook";
import { buildTodayPlan } from "@/lib/server/plan";
import { TOPIC_LABELS, type Topic } from "@/lib/types";
import { readinessScore, levelFor, weeklyGoals, questionPoints } from "@/lib/scoring";

const MS_PER_DAY = 86_400_000;

export async function GET() {
  const now = Date.now();
  // Mental-math statistics read the mental-math track only; the Green Book
  // track is summarised separately rather than averaged in.
  const attempts = attemptsByTrack("mental-math");
  const proficiencies = computeAllProficiencies(attempts, now);
  const { plan, week, weekNumber, day } = buildTodayPlan(now);

  // Readiness score, with a 7-day-ago baseline for the delta.
  const qrs = readinessScore(proficiencies);
  const weekAgo = now - 7 * MS_PER_DAY;
  const prevQrs = readinessScore(
    computeAllProficiencies(attempts.filter((a) => a.createdAt <= weekAgo), weekAgo)
  );
  const attemptsThisWeek = attempts.filter((a) => a.createdAt > weekAgo);
  const today = localDay(now);
  const pointsToday = attempts
    .filter((a) => localDay(a.createdAt) === today)
    .reduce((s, a) => s + questionPoints(a), 0);

  return Response.json({
    diagnosticDone: getState("diagnosticCompletedAt") !== null,
    streak: computeStreak(attempts.map((a) => a.createdAt), now),
    week: { number: weekNumber, ...week },
    day,
    todayPlan: plan.summary,
    score: {
      qrs,
      delta7d: qrs - prevQrs,
      level: levelFor(qrs),
      pointsToday,
    },
    goals: weeklyGoals(attemptsThisWeek, proficiencies),
    weakTopics: weakestTopics(proficiencies, 3).map((p) => ({
      ...p,
      label: TOPIC_LABELS[p.topic as Topic],
    })),
    proficiencies: proficiencies.map((p) => ({
      ...p,
      label: TOPIC_LABELS[p.topic as Topic],
    })),
    greenBook: greenBookSummary(),
    recentAttempts: recentAttempts(10),
    reviewQueueCount: reviewQueue().length,
    totalAttempts: attempts.length,
  });
}

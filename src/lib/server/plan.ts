import { mulberry32, hashSeed } from "../rng";
import { generateDailyPlan, type DailyPlan } from "../dailyPlan";
import { computeAllProficiencies } from "../proficiency";
import { currentWeekNumber, weekInfo, type StudyWeek } from "../studyPlan";
import { localDay } from "../streak";
import { attemptsByTrack, recentMisses, getState } from "./queries";

export interface TodayPlanContext {
  plan: DailyPlan;
  week: StudyWeek;
  weekNumber: number;
  day: string;
}

/**
 * Build today's plan. Seeded by the calendar date so the assignment is stable
 * across page loads within a day.
 */
export function buildTodayPlan(now: number): TodayPlanContext {
  const attempts = attemptsByTrack("mental-math");
  const proficiencies = computeAllProficiencies(attempts, now);

  const planStartRaw = getState("planStartedAt");
  const planStart = planStartRaw ? parseInt(planStartRaw, 10) : now;
  const weekNumber = currentWeekNumber(planStart, now);
  const week = weekInfo(weekNumber);

  const day = localDay(now);
  const rng = mulberry32(hashSeed(`daily-plan:${day}`));

  const plan = generateDailyPlan({
    proficiencies,
    currentWeekTopics: week.topics,
    recentMisses: recentMisses(7, now),
    rng,
  });

  return { plan, week, weekNumber, day };
}

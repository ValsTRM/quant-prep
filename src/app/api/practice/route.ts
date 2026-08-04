import { buildTodayPlan } from "@/lib/server/plan";

/** Today's adaptive practice set. Seeded by date, so stable within a day. */
export async function GET() {
  const { plan, week, weekNumber, day } = buildTodayPlan(Date.now());
  return Response.json({
    day,
    week: { number: weekNumber, title: week.title },
    summary: plan.summary,
    items: plan.items,
  });
}

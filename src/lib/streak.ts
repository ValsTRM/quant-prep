const MS_PER_DAY = 86_400_000;

/** Local YYYY-MM-DD for an epoch-ms timestamp. */
export function localDay(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Practice streak in days: consecutive days with at least one attempt,
 * ending today or yesterday (so a streak isn't broken before today's session).
 */
export function computeStreak(attemptTimestamps: number[], now: number): number {
  if (attemptTimestamps.length === 0) return 0;
  const days = new Set(attemptTimestamps.map(localDay));
  const today = localDay(now);
  const yesterday = localDay(now - MS_PER_DAY);

  let anchor: string;
  if (days.has(today)) anchor = today;
  else if (days.has(yesterday)) anchor = yesterday;
  else return 0;

  let streak = 0;
  let cursor = anchor === today ? now : now - MS_PER_DAY;
  while (days.has(localDay(cursor))) {
    streak++;
    cursor -= MS_PER_DAY;
  }
  return streak;
}

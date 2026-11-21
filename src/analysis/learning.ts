import type { Exercise } from "../data/curriculum.ts";

export type LearningRange = "30d" | "90d" | "6m" | "12m" | "30m";
export type LearningMetric = "exercises" | "xp";
export type LearningBucket = {
  key: string;
  date: Date;
  label: string;
  exercises: number;
  xp: number;
};

export const learningRanges: readonly LearningRange[] = ["30d", "90d", "6m", "12m", "30m"];

export function challengeXp(exercise: Pick<Exercise, "kind" | "finale">): number {
  if (exercise.kind === "gold") return 150;
  if (exercise.kind === "optional") return 75;
  return exercise.finale ? 200 : 100;
}

function dayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
}

/**
 * Completion timestamps are recorded already in the v1 local backup.
 * XP is a transparent, retroactive display score (not a new saved field).
 * Daily buckets: 30 days; weekly: 90 days; monthly: 6/12/30 months.
 */
export function learningHistory(
  completed: Readonly<Record<string, string>>,
  exercises: readonly Pick<Exercise, "id" | "kind" | "finale">[],
  range: LearningRange,
  locale = "en",
  today = new Date(),
): LearningBucket[] {
  const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const daily = range === "30d";
  const weekly = range === "90d";
  const count = daily ? 30 : weekly ? 13 : range === "6m" ? 6 : range === "12m" ? 12 : 30;
  const start = daily || weekly
    ? new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - (daily ? 29 : 89), 12)
    : new Date(anchor.getFullYear(), anchor.getMonth() - count + 1, 1, 12);
  const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    ...(daily || weekly ? { day: "numeric" } : { year: "2-digit" }),
  });
  const buckets: LearningBucket[] = Array.from({ length: count }, (_, i) => {
    const date = daily || weekly
      ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + i * (daily ? 1 : 7), 12)
      : new Date(start.getFullYear(), start.getMonth() + i, 1, 12);
    const key = daily || weekly
      ? String(dayNumber(date))
      : String(date.getFullYear() * 12 + date.getMonth());
    return { key, date, label: formatter.format(date), exercises: 0, xp: 0 };
  });
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  for (const [id, timestamp] of Object.entries(completed)) {
    const exercise = byId.get(id);
    if (!exercise) continue;
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) continue;
    if (dayNumber(date) > dayNumber(anchor)) continue; // no future events
    const index = daily || weekly
      ? Math.floor((dayNumber(date) - dayNumber(start)) / (daily ? 1 : 7))
      : (date.getFullYear() - start.getFullYear()) * 12 + date.getMonth() - start.getMonth();
    if (index < 0 || index >= buckets.length) continue;
    buckets[index].exercises += 1;
    buckets[index].xp += challengeXp(exercise);
  }
  return buckets;
}

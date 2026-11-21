import type { Exercise } from "../data/curriculum.ts";

export type LearningRange = "3m" | "6m" | "12m";
export type LearningBucket = {
  key: string;
  date: Date;
  label: string;
  exercises: number;
  xp: number;
};

export const learningRanges: readonly LearningRange[] = ["3m", "6m", "12m"];

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
 * Monthly buckets for the recent 3, 6 or 12 calendar months.
 */
export function learningHistory(
  completed: Readonly<Record<string, string>>,
  exercises: readonly Pick<Exercise, "id" | "kind" | "finale">[],
  range: LearningRange,
  locale = "en",
  today = new Date(),
): LearningBucket[] {
  const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const count = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const start = new Date(anchor.getFullYear(), anchor.getMonth() - count + 1, 1, 12);
  const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    year: "2-digit",
  });
  const buckets: LearningBucket[] = Array.from({ length: count }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1, 12);
    const key = String(date.getFullYear() * 12 + date.getMonth());
    return { key, date, label: formatter.format(date), exercises: 0, xp: 0 };
  });
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  for (const [id, timestamp] of Object.entries(completed)) {
    const exercise = byId.get(id);
    if (!exercise) continue;
    const date = new Date(timestamp);
    if (!Number.isFinite(date.getTime())) continue;
    if (dayNumber(date) > dayNumber(anchor)) continue; // no future events
    const index = (date.getFullYear() - start.getFullYear()) * 12 +
      date.getMonth() - start.getMonth();
    if (index < 0 || index >= buckets.length) continue;
    buckets[index].exercises += 1;
    buckets[index].xp += challengeXp(exercise);
  }
  return buckets;
}

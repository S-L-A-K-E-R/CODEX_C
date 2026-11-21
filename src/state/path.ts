import type { Exercise } from "../data/curriculum.ts";
import type { Progress } from "./progress.ts";

// Chapters are independent. The first core task opens the rest of its chapter.
export function lockedBy(
  exercise: Exercise,
  chapter: Exercise[],
  progress: Progress,
): Exercise | undefined {
  if (progress.completed[exercise.id]) return;
  const prerequisite =
    exercise.finale && exercise.kind === "core"
      ? chapter.find((e) => e.kind === "core" && !e.finale && !progress.completed[e.id])
      : exercise.kind === "gold"
      ? chapter.find((e) => e.id === exercise.base)
      : chapter.find((e) => e.kind === "core");
  if (
    !prerequisite ||
    prerequisite.id === exercise.id ||
    progress.completed[prerequisite.id]
  )
    return;
  // An original opened before chapter prerequisites existed can still be resumed.
  if (
    exercise.kind !== "gold" &&
    !exercise.finale &&
    (progress.drafts[exercise.id] || progress.attempts[exercise.id])
  )
    return;
  return prerequisite;
}

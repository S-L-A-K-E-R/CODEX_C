import {
  Award, BookOpen, Castle, Compass, Crown, Flame, Gem, Hammer, KeyRound,
  Leaf, Map, Mountain, ShieldCheck, Ship, Star, Trees, Trophy, Waves,
  Waypoints, ScrollText, Flag,
  type LucideIcon,
} from "lucide-react";
import type { Chapter, Exercise } from "./curriculum.ts";
import type { Progress } from "../state/progress.ts";

export type AchievementCategory = "journey" | "exploration" | "gold" | "craft" | "projects";
export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: LucideIcon;
  current: number;
  goal: number;
  href: string;
}

export function getAchievements(
  progress: Pick<Progress, "completed" | "lessons" | "milestones">,
  chapters: readonly Chapter[],
  exercises: readonly Exercise[],
): Achievement[] {
  const done = (exercise: Exercise) => Boolean(progress.completed[exercise.id]);
  const count = (filter: (exercise: Exercise) => boolean) =>
    exercises.filter((exercise) => filter(exercise) && done(exercise)).length;
  const total = (filter: (exercise: Exercise) => boolean) =>
    exercises.filter(filter).length;
  const chapterCore = (chapter: string) =>
    count((exercise) => exercise.kind === "core" && exercise.chapter === chapter);
  const chapterCoreTotal = (chapter: string) =>
    total((exercise) => exercise.kind === "core" && exercise.chapter === chapter);
  const chapterMastered = (chapter: string) =>
    chapterCoreTotal(chapter) > 0 && chapterCore(chapter) === chapterCoreTotal(chapter) ? 1 : 0;
  const starterChapters = chapters.filter((chapter) => chapter.stage === 0);
  const explored = chapters.filter((chapter) => chapterCore(chapter.id) > 0).length;
  const optional = count((exercise) => exercise.kind === "optional");
  const optionalTotal = total((exercise) => exercise.kind === "optional");
  const gold = count((exercise) => exercise.kind === "gold");
  const finales = count((exercise) => Boolean(exercise.finale) && exercise.kind === "core");
  const milestoneIds = ["clock-tower", "student-register", "chess-engine"];
  const projectSteps = milestoneIds.reduce((sum, id) =>
    sum + Array.from({ length: 4 }, (_, i) => Number(Boolean(progress.milestones[id + ":" + i])))
      .reduce((a, b) => a + b, 0), 0);
  const projectsFinished = milestoneIds.filter((id) =>
    Array.from({ length: 4 }, (_, i) => Boolean(progress.milestones[id + ":" + i])).every(Boolean)
  ).length;
  const achievements: Achievement[] = [];
  function add(
    id: string, category: AchievementCategory, name: string,
    description: string, icon: LucideIcon, current: number, goal: number, href: string,
  ) {
    achievements.push({ id, category, name, description, icon, current, goal, href });
  }

  add("first-win", "journey", "First small win", "Complete your first challenge", Leaf, count(() => true), 1, "#practice");
  add("trailblazer", "journey", "Trailblazer", "Complete five challenges along your journey", Compass, count(() => true), 5, "#practice");
  add("veteran", "journey", "Veteran of the road", "Complete 25 challenges", Trophy, count(() => true), 25, "#practice");
  add("atlas", "journey", "Keeper of the atlas", "Clear at least one core challenge in every region", Map, explored, chapters.length, "#path");
  add("foundations", "journey", "Solid foundations", "Master every core challenge in the five foundation regions", BookOpen,
    count((e) => e.kind === "core" && starterChapters.some((c) => c.id === e.chapter)),
    total((e) => e.kind === "core" && starterChapters.some((c) => c.id === e.chapter)), "#path");

  add("side-first", "exploration", "The hidden footpath", "Finish your first side quest", Waypoints, optional, 1, "#practice");
  add("side-three", "exploration", "Curious by nature", "Complete three side quests", Trees, optional, 3, "#practice");
  add("side-eight", "exploration", "Secret trail scout", "Find eight side-quest treasures", KeyRound, optional, 8, "#practice");
  add("side-all", "exploration", "Every stone unturned", "Complete every side quest", Gem, optional, optionalTotal, "#practice");

  add("gold-first", "gold", "Golden thinking", "Complete a gold challenge", Star, gold, 1, "#practice");
  add("gold-five", "gold", "Gilded adventurer", "Earn five golden victories", Award, gold, 5, "#practice");
  add("gold-fifteen", "gold", "The golden treasury", "Complete 15 gold challenges", Crown, gold, 15, "#practice");
  add("crown-first", "gold", "First boss defeated", "Complete a crowned chapter finale", Flag, finales, 1, "#path");
  add("crown-five", "gold", "Crown collector", "Defeat five chapter finales", Castle, finales, 5, "#path");

  const regions: Array<[string, string, string, LucideIcon]> = [
    ["decisions", "Guardian of the crossroads", "Master the crossroads of decisions", ShieldCheck],
    ["loops", "Keeper of the winding river", "Master every challenge on the looping river", Waves],
    ["arrays", "Island cartographer", "Master the islands of arrays", Ship],
    ["functions", "Sage of the library", "Master the library of functions", ScrollText],
    ["strings", "Orchard pathfinder", "Find your way through the strings orchard", Trees],
    ["dynamic-memory", "Deep cavern explorer", "Master the caverns of dynamic memory", Mountain],
    ["modular", "Master of the machine works", "Master headers and modular programs", Hammer],
    ["data-structures", "Fortress champion", "Master the final fortress of data structures", Flame],
  ];
  for (const [id, name, description, icon] of regions)
    add("region-" + id, "craft", name, description, icon, chapterMastered(id), 1, "#path/" + id);

  add("builder-first", "projects", "The first blueprint", "Complete one project milestone", Hammer, projectSteps, 1, "#projects");
  add("builder-four", "projects", "Workshop apprentice", "Complete four project milestones", BookOpen, projectSteps, 4, "#projects");
  add("builder-full", "projects", "Architect of adventures", "Finish all four milestones in one project", Castle, projectsFinished, 1, "#projects");
  return achievements;
}

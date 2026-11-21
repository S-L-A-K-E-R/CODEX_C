import content from "./content.json";
import fr from "./fr.json";
import extra1 from "./expansion-1.json";
import extra1fr from "./expansion-1-fr.json";
import extra2 from "./expansion-2.json";
import extra2fr from "./expansion-2-fr.json";
import extra3 from "./expansion-3.json";
import extra3fr from "./expansion-3-fr.json";
import extra4 from "./expansion-4.json";
import extra4fr from "./expansion-4-fr.json";
import extra5 from "./expansion-5.json";
import extra5fr from "./expansion-5-fr.json";
import finales from "./chapter-finales.json";
import finalesFr from "./chapter-finales-fr.json";
import mapExtras from "./map-extras.json";
import mapExtrasFr from "./map-extras-fr.json";
import type { TestCase } from "../runtime/types.ts";
export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  stage: number;
  concepts: string[];
  lesson: string[][];
  example: string;
  reference: string;
  widget: string;
}
export interface Exercise {
  id: string;
  chapter: string;
  title: string;
  kind: "core" | "gold" | "optional";
  /** The cumulative, crowned boss exercise at the end of a chapter. */
  finale?: boolean;
  brief: string;
  input: string;
  output: string;
  tests: TestCase[];
  starter: Record<string, string>;
  hints: string[];
  minutes: number;
  base: string | null;
  reference: string;
}
const chapters = content.chapters as Chapter[];
const exercises = [
  ...(content.exercises as Exercise[]),
  ...(extra1 as Exercise[]),
  ...(extra2 as Exercise[]),
  ...(extra3 as Exercise[]),
  ...(extra4 as Exercise[]),
  ...(extra5 as Exercise[]),
  ...(finales as Exercise[]),
  ...(mapExtras as Exercise[]),
];
const stages = [
  "Build your foundations",
  "Understand your data",
  "Think like a programmer",
];
const projects = [
  {
    id: "clock-tower",
    title: "The clock tower",
    tag: "FOUNDATIONS",
    icon: "clock",
    description:
      "Turn seconds into a living clock. Build a menu, handle time changes, and give every boundary a test.",
    chapters: ["variables", "decisions", "loops", "functions"],
    deliverables: [
      "Convert a duration into days, hours, minutes, and seconds.",
      "Support adding seconds to a clock, wrapping after midnight.",
      "Build a menu that repeats until the user chooses to quit.",
      "Write five input/output examples, including a midnight transition.",
    ],
    starter:
      "#include <stdio.h>\n\nint main(void) {\n    // Milestone 1: read a duration and convert its units.\n    // Milestone 2: add a menu and a repeating clock.\n    return 0;\n}\n",
    source:
      "https://github.com/S-L-A-K-E-R/C_courses/tree/main/HOMEWORKS/TPE07%20-%2002%20-%20Clock%20tower",
  },
  {
    id: "student-register",
    title: "The student register",
    tag: "DATA & MEMORY",
    icon: "records",
    description:
      "Give a class its own tiny database. Model records, search by name, and save your work to a text file.",
    chapters: ["structures", "strings", "dynamic-memory", "files"],
    deliverables: [
      "Model a student with a name and score.",
      "Add students to a dynamic collection with checked allocation.",
      "Search by name and display class statistics.",
      "Save and reload a documented text format; handle missing files.",
    ],
    starter:
      "#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct {\n    char name[32];\n    double score;\n} Student;\n\nint main(void) {\n    // Start by reading and displaying one student.\n    return 0;\n}\n",
    source:
      "https://github.com/S-L-A-K-E-R/C_courses/blob/main/EXERCISES/LAB_GENERAL/04_Functions-Structures.pdf",
  },
  {
    id: "chess-engine",
    title: "A little chess engine",
    tag: "CAPSTONE",
    icon: "chess",
    description:
      "Build a text board, validate moves, and separate rules from display. A project that can grow with you.",
    chapters: ["arrays", "functions", "structures", "modular"],
    deliverables: [
      "Represent and print an 8×8 board with a documented piece encoding.",
      "Translate coordinates such as e2 into array indexes safely.",
      "Validate a subset of piece movements before adding full rules.",
      "Separate board, rules, and display modules. Document unsupported rules.",
    ],
    starter:
      "#include <stdio.h>\n\nint main(void) {\n    char board[8][8];\n    // Milestone 1: initialise and display an empty board.\n    (void)board;\n    return 0;\n}\n",
    source:
      "https://github.com/S-L-A-K-E-R/C_courses/blob/main/PROJECTS/C_project_chess_v1.4.pdf",
  },
];

function catalogue(
  chapters: Chapter[],
  exercises: Exercise[],
  projectsInLanguage: typeof projects,
) {
  return {
    chapters,
    exercises,
    stages,
    projects: projectsInLanguage,
    coreTotal: exercises.filter((e) => e.kind === "core").length,
    goldTotal: exercises.filter((e) => e.kind === "gold").length,
    goldFor: (id: string) => exercises.find((e) => e.base === id),
    byChapter: (id: string) => exercises.filter((e) => e.chapter === id),
    getExercise: (id: string) => exercises.find((e) => e.id === id),
    getChapter: (id: string) => chapters.find((c) => c.id === id),
  };
}

type ExerciseText = Pick<Exercise, "title" | "brief" | "input" | "output"> & {
  hints?: string[];
};
const frenchExercises: Record<string, ExerciseText> = {
  ...fr.exercises,
  ...extra1fr,
  ...extra2fr,
  ...extra3fr,
  ...extra4fr,
  ...extra5fr,
  ...finalesFr,
  ...mapExtrasFr,
};
export const courses = {
  en: catalogue(chapters, exercises, projects),
  fr: catalogue(
    chapters.map((c) => ({
      ...c,
      ...fr.chapters[c.id as keyof typeof fr.chapters],
    })),
    exercises.map((e) => {
      const text = frenchExercises[e.id];
      return { ...e, ...text, hints: text.hints ?? fr.defaultHints };
    }),
    projects.map((p) => ({
      ...p,
      ...fr.projects[p.id as keyof typeof fr.projects],
    })),
  ),
};

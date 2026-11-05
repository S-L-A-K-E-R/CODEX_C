import content from "./content.json";
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
export const chapters = content.chapters as Chapter[];
export const exercises = content.exercises as Exercise[];
export const stages = [
  "Build your foundations",
  "Understand your data",
  "Think like a programmer",
];
export const byChapter = (id: string) =>
  exercises.filter((x) => x.chapter === id);
export const getExercise = (id: string) => exercises.find((x) => x.id === id);
export const getChapter = (id: string) => chapters.find((x) => x.id === id);
export const projects = [
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

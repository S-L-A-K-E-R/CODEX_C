import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { matchesOutput } from "../src/runtime/types.ts";
const { exercises: original } = JSON.parse(readFileSync("src/data/content.json", "utf8"));
const exercises = [
  ...original,
  ...JSON.parse(readFileSync("src/data/expansion-1.json", "utf8")),
  ...JSON.parse(readFileSync("src/data/expansion-2.json", "utf8")),
  ...JSON.parse(readFileSync("src/data/expansion-3.json", "utf8")),
  ...JSON.parse(readFileSync("src/data/expansion-4.json", "utf8")),
  ...JSON.parse(readFileSync("src/data/expansion-5.json", "utf8")),
  ...JSON.parse(readFileSync("src/data/chapter-finales.json", "utf8")),
];
const solutions = {
  ...JSON.parse(readFileSync("tests/fixtures/solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-1-solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-2-solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-3-solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-4-solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-5-solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/chapter-finales-solutions.json", "utf8")),
};
let count = 0;
for (const exercise of exercises) {
  const dir = mkdtempSync(join(tmpdir(), "codex-c-"));
  try {
    const files = solutions[exercise.id];
    for (const [name, code] of Object.entries(files))
      writeFileSync(join(dir, name), code as string);
    const build = spawnSync(
      "gcc",
      [
        "-std=c17",
        "-Wall",
        "-Wextra",
        "-O0",
        ...Object.keys(files).filter((x) => x.endsWith(".c")),
        "-lm",
        "-o",
        "program",
      ],
      { cwd: dir, encoding: "utf8", timeout: 5000 },
    );
    if (build.status !== 0) throw new Error(`${exercise.id}: ${build.stderr}`);
    for (const test of exercise.tests) {
      const run = spawnSync(join(dir, "program"), [], {
        cwd: dir,
        input: test.input,
        encoding: "utf8",
        timeout: 3000,
      });
      if (run.status !== 0 || !matchesOutput(run.stdout, test.output))
        throw new Error(
          `${exercise.id}: ${JSON.stringify({ test, actual: run.stdout, error: run.stderr })}`,
        );
      count++;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
console.log(
  `PASS: ${exercises.length} C17 reference programs; ${count} input/output cases (GCC).`,
);

import { readFile } from "node:fs/promises";
import { CEngine } from "../src/runtime/core.ts";
import { matchesOutput } from "../src/runtime/types.ts";
const { exercises, chapters } = JSON.parse(
  await readFile("src/data/content.json", "utf8"),
);
const solutions = JSON.parse(
  await readFile("tests/fixtures/solutions.json", "utf8"),
);
const engine = new CEngine(
  async (name) => new Uint8Array(await readFile("public/runtime/" + name)),
);
let count = 0;
for (const exercise of exercises) {
  const result = await engine.run({
    files: solutions[exercise.id],
    inputs: exercise.tests.map((t: { input: string }) => t.input),
  });
  if (result.error || result.results.length !== exercise.tests.length)
    throw new Error(`${exercise.id}: ${result.error} ${result.diagnostics}`);
  result.results.forEach((actual, i) => {
    if (
      actual.exitCode !== 0 ||
      !matchesOutput(actual.stdout, exercise.tests[i].output)
    )
      throw new Error(
        `${exercise.id}: ${JSON.stringify({ actual, expected: exercise.tests[i] })}`,
      );
    count++;
  });
}
for (const chapter of chapters) {
  const result = await engine.run({
    files: { "main.c": chapter.example },
    inputs: [""],
  });
  if (result.error || result.results[0]?.exitCode !== 0)
    throw new Error(
      `Lesson ${chapter.id}: ${result.error} ${result.diagnostics}`,
    );
}
console.log(
  `PASS: ${exercises.length} challenges (${count} cases) and ${chapters.length} lesson examples with the actual browser Clang/WASI engine.`,
);

// Failure paths must behave like C diagnostics, not award success or hang the UI.
const broken = await engine.run({
  files: { "main.c": "int main(void) { return 0 }" },
  inputs: [""],
});
if (
  !broken.error ||
  !broken.diagnostics.includes("error:") ||
  broken.results.length
)
  throw new Error("Missing compiler diagnostics.");
const utf8 = "é".repeat(4000) + "\n";
const echo = await engine.run({
  files: {
    "main.c":
      "#include <stdio.h>\nint main(void){ int c; while((c=getchar())!=EOF) putchar(c); }",
  },
  inputs: [utf8],
});
if (echo.results[0]?.stdout !== utf8)
  throw new Error("UTF-8 input was split or truncated.");
for (const [label, source, message] of [
  [
    "stdout flood",
    "#include <stdio.h>\nint main(void){ for(int i=0;i<100000;i++) putchar(65); }",
    "Output limit",
  ],
  [
    "sparse file",
    '#include <stdio.h>\nint main(void){ FILE *f=fopen("out.txt","w"); if(!f) return 2; fseek(f,1000000000,SEEK_SET); fputc(65,f); fclose(f); }',
    "Virtual file limit",
  ],
] as const) {
  let blocked = false;
  try {
    await engine.run({ files: { "main.c": source }, inputs: [""] });
  } catch (error) {
    blocked = error instanceof Error && error.message.includes(message);
  }
  if (!blocked) throw new Error(`Guard did not stop ${label}.`);
}
const trapped = await engine.run({
  files: { "main.c": "int main(void) { __builtin_trap(); }" },
  inputs: [""],
});
if (trapped.results[0]?.exitCode !== 134)
  throw new Error("Runtime trap not reported.");
console.log(
  "PASS: syntax errors, long UTF-8 stdin, output flood, sparse-file allocation, and runtime traps.",
);

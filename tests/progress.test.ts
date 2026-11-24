import test from "node:test";
import { readFileSync } from "node:fs";
import { lockedBy } from "../src/state/path.ts";
import type { Exercise } from "../src/data/curriculum.ts";
const chapter = (
  JSON.parse(readFileSync("src/data/content.json", "utf8"))
    .exercises as Exercise[]
).filter((e) => e.chapter === "first-programs");
import assert from "node:assert/strict";
import {
  freshProgress,
  parseBackup,
  mergeProgress,
  markComplete,
  validateProgress,
} from "../src/state/progress.ts";
import { matchesOutput } from "../src/runtime/types.ts";

test("a full backup preserves source, input, progress, activity and settings", () => {
  const p = freshProgress();
  p.profile.name = "Test learner";
  p.drafts.clockwork = {
    files: {
      "main.c": "int main(void) { return 0; }",
      "helpers.h": "#define N 42",
    },
    input: "3661\n",
    updatedAt: p.updatedAt,
  };
  p.activity["2026-11-05"] = 123;
  p.completed.clockwork = p.updatedAt;
  assert.deepEqual(parseBackup(JSON.stringify(p)), p);
});
test("malformed, oversized, unsupported or unsafe backups are rejected", () => {
  assert.throws(() => parseBackup("{ broken"));
  assert.throws(() => parseBackup(" ".repeat(2_000_001)));
  assert.throws(() =>
    validateProgress({ ...freshProgress(), schemaVersion: 99 }),
  );
  const p = freshProgress();
  p.drafts.safe = {
    files: { "main.c": "", "../secrets.txt": "bad" },
    input: "",
    updatedAt: p.updatedAt,
  };
  assert.throws(() => validateProgress(p));
  assert.throws(() =>
    parseBackup(
      JSON.stringify(freshProgress()).replace(
        '"completed":{}',
        '"completed":{"__proto__":"2026-11-05T00:00:00Z"}',
      ),
    ),
  );
  assert.throws(() =>
    validateProgress({
      ...freshProgress(),
      activity: { "2026-11-05": Infinity },
    }),
  );
});
test("a merge keeps completed work and the latest draft without doubling time", () => {
  const a = freshProgress(),
    b = freshProgress();
  a.completed.hello = "2026-11-01T00:00:00Z";
  b.completed.clock = "2026-11-02T00:00:00Z";
  a.drafts.hello = {
    files: { "main.c": "old" },
    input: "",
    updatedAt: "2026-11-01T00:00:00Z",
  };
  b.drafts.hello = {
    files: { "main.c": "new" },
    input: "42",
    updatedAt: "2026-11-02T00:00:00Z",
  };
  a.activity["2026-11-01"] = 120;
  b.activity["2026-11-01"] = 140;
  const merged = mergeProgress(a, b);
  assert.equal(Object.keys(merged.completed).length, 2);
  assert.equal(merged.drafts.hello.files["main.c"], "new");
  assert.equal(merged.activity["2026-11-01"], 140);
  assert.deepEqual(mergeProgress(merged, b), merged);
});
test("rechecking a completed challenge cannot award duplicate completion", () => {
  const p = markComplete(freshProgress(), "hello");
  assert.strictEqual(markComplete(p, "hello"), p);
  assert.equal(Object.keys(p.completed).length, 1);
});
test("comparison allows CRLF and a final newline but keeps meaningful whitespace", () => {
  assert.ok(matchesOutput("Hello!\r\n", "Hello!\n"));
  assert.ok(matchesOutput("42", "42\n"));
  assert.ok(!matchesOutput("42 ", "42"));
  assert.ok(!matchesOutput("hello", "Hello"));
  assert.ok(!matchesOutput("42\n\n", "42\n"));
  assert.ok(!matchesOutput("Enter number: 42", "42"));
});

test("tiny banner accepts optional line padding without relaxing other output rules", () => {
  const banner = chapter.find((e) => e.id === "tiny-banner")!.tests[0];
  const student = "========\nC MODE\n========";
  assert.equal(banner.comparison, "line-padding");
  assert.ok(!matchesOutput(student, banner.output));
  for (const output of [
    student,
    banner.output,
    "========\r\n\tC MODE \r\n========\r\n",
  ])
    assert.ok(matchesOutput(output, banner.output, banner.comparison));
  for (const output of [
    "=======\nC MODE\n========",
    "========\nC  MODE\n========",
    "========\nc mode\n========",
    "========\n\nC MODE\n========",
    "========\nC MODE\n========\n\n",
    "========C MODE========",
    "========\nC MODE\n========\nExtra",
  ])
    assert.ok(!matchesOutput(output, banner.output, banner.comparison));
  assert.ok(!matchesOutput("42 ", "42"));
});

test("backup size is measured in UTF-8 bytes, matching the import file limit", () => {
  const p = freshProgress();
  for (let i = 0; i < 20; i++)
    p.drafts["workspace" + i] = {
      files: { "main.c": "💻".repeat(25000) },
      input: "",
      updatedAt: p.updatedAt,
    };
  const text = JSON.stringify(p);
  assert.ok(text.length < 2_000_000);
  assert.throws(() => parseBackup(text), /smaller than 2 MB/);
});

test("chapter branches share prerequisites and preserve existing classroom work", () => {
  const [first, second] = chapter.filter((e) => e.kind === "core");
  const side = chapter.find((e) => e.kind === "optional")!;
  const gold = chapter.find((e) => e.base === second.id)!;
  const sideGold = chapter.find((e) => e.base === side.id)!;
  const p = freshProgress();
  assert.equal(lockedBy(first, chapter, p), undefined);
  assert.equal(lockedBy(second, chapter, p), first);
  assert.equal(lockedBy(side, chapter, p), first);
  assert.equal(lockedBy(gold, chapter, p), second);
  p.attempts[side.id] = 1;
  assert.equal(lockedBy(side, chapter, p), undefined);
  p.drafts[second.id] = {
    files: { "main.c": "old work" },
    input: "",
    updatedAt: p.updatedAt,
  };
  assert.equal(lockedBy(second, chapter, p), undefined);
  const completed = markComplete(freshProgress(), first.id);
  assert.equal(lockedBy(second, chapter, completed), undefined);
  assert.equal(lockedBy(side, chapter, completed), undefined);
  assert.equal(lockedBy(gold, chapter, completed), second);
  assert.equal(lockedBy(sideGold, chapter, completed), side);
  assert.equal(
    lockedBy(sideGold, chapter, markComplete(completed, side.id)),
    undefined,
  );
  assert.equal(
    lockedBy(gold, chapter, markComplete(completed, second.id)),
    undefined,
  );
});

test("a crowned finale requires every regular core, but no side quests", () => {
  const finale = (JSON.parse(readFileSync("src/data/chapter-finales.json", "utf8")) as Exercise[])
    .find((e) => e.chapter === "first-programs" && e.finale)!;
  const gold = (JSON.parse(readFileSync("src/data/chapter-finales.json", "utf8")) as Exercise[])
    .find((e) => e.base === finale.id)!;
  const items = [...chapter, finale, gold];
  const cores = chapter.filter((e) => e.kind === "core");
  const p = freshProgress();
  assert.equal(lockedBy(finale, items, p)?.id, cores[0].id);
  for (const core of cores.slice(0, -1)) p.completed[core.id] = p.updatedAt;
  assert.equal(lockedBy(finale, items, p)?.id, cores[cores.length - 1].id);
  p.drafts[finale.id] = { files: { "main.c": "// In progress" }, input: "", updatedAt: p.updatedAt };
  assert.equal(lockedBy(finale, items, p)?.id, cores[cores.length - 1].id);
  p.completed[cores[cores.length - 1].id] = p.updatedAt;
  assert.equal(lockedBy(finale, items, p), undefined);
  assert.equal(lockedBy(gold, items, p), finale);
  p.completed[finale.id] = p.updatedAt;
  assert.equal(lockedBy(gold, items, p), undefined);
});

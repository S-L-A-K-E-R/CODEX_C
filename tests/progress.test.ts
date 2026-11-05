import test from "node:test";
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

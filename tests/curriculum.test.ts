import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Chapter, Exercise } from "../src/data/curriculum.ts";
const data = JSON.parse(readFileSync("src/data/content.json", "utf8")) as {
  chapters: Chapter[];
  exercises: Exercise[];
};
const fixtures = JSON.parse(
  readFileSync("tests/fixtures/solutions.json", "utf8"),
);
test("curriculum identifiers, core path and gold dependencies are consistent", () => {
  assert.equal(
    new Set(data.chapters.map((c) => c.id)).size,
    data.chapters.length,
  );
  assert.equal(
    new Set(data.exercises.map((e) => e.id)).size,
    data.exercises.length,
  );
  for (const c of data.chapters) {
    assert.equal(
      data.exercises.filter((e) => e.chapter === c.id && e.kind === "core")
        .length,
      2,
    );
    assert.ok(c.example.includes("main("));
    assert.ok(c.lesson.length >= 3);
  }
  for (const e of data.exercises) {
    assert.ok(data.chapters.some((c) => c.id === e.chapter));
    assert.ok(e.tests.length >= 1);
    assert.ok(e.starter["main.c"]);
    assert.ok(fixtures[e.id]);
    assert.equal(e.hints.length, 3);
    if (e.kind === "gold") {
      const base = data.exercises.find((b) => b.id === e.base);
      assert.ok(base && base.kind === "core" && base.chapter === e.chapter);
    }
  }
});

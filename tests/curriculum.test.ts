import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Chapter, Exercise } from "../src/data/curriculum.ts";
const data = JSON.parse(readFileSync("src/data/content.json", "utf8")) as {
  chapters: Chapter[];
  exercises: Exercise[];
};
data.exercises.push(
  ...(JSON.parse(readFileSync("src/data/expansion-1.json", "utf8")) as Exercise[]),
  ...(JSON.parse(readFileSync("src/data/expansion-2.json", "utf8")) as Exercise[]),
  ...(JSON.parse(readFileSync("src/data/expansion-3.json", "utf8")) as Exercise[]),
  ...(JSON.parse(readFileSync("src/data/expansion-4.json", "utf8")) as Exercise[]),
  ...(JSON.parse(readFileSync("src/data/expansion-5.json", "utf8")) as Exercise[]),
);
const fixtures = {
  ...JSON.parse(readFileSync("tests/fixtures/solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-1-solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-2-solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-3-solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-4-solutions.json", "utf8")),
  ...JSON.parse(readFileSync("tests/fixtures/expansion-5-solutions.json", "utf8")),
};
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
      3,
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
    if (e.kind !== "gold") {
      const extensions = data.exercises.filter((part) => part.base === e.id);
      assert.equal(
        extensions.length,
        1,
        e.id + " needs exactly one gold version",
      );
      assert.ok(extensions[0].tests.length > 1);
    }
    if (e.kind === "gold") {
      const base = data.exercises.find((b) => b.id === e.base);
      assert.ok(base && base.kind !== "gold" && base.chapter === e.chapter);
    }
  }
});

test("French offers the same lessons, exercises and input/output contracts", () => {
  const fr = JSON.parse(readFileSync("src/data/fr.json", "utf8"));
  Object.assign(fr.exercises,
    JSON.parse(readFileSync("src/data/expansion-1-fr.json", "utf8")),
    JSON.parse(readFileSync("src/data/expansion-2-fr.json", "utf8")),
    JSON.parse(readFileSync("src/data/expansion-3-fr.json", "utf8")),
    JSON.parse(readFileSync("src/data/expansion-4-fr.json", "utf8")),
    JSON.parse(readFileSync("src/data/expansion-5-fr.json", "utf8")),
  );
  assert.deepEqual(
    Object.keys(fr.chapters).sort(),
    data.chapters.map((c) => c.id).sort(),
  );
  assert.deepEqual(
    Object.keys(fr.exercises).sort(),
    data.exercises.map((e) => e.id).sort(),
  );
  for (const c of data.chapters) {
    const translated = fr.chapters[c.id];
    assert.equal(translated.lesson.length, c.lesson.length);
    assert.equal(translated.concepts.length, c.concepts.length);
    for (const [heading, body] of translated.lesson) assert.ok(heading && body);
  }
  for (const e of data.exercises) {
    const translated = fr.exercises[e.id];
    assert.ok(
      translated.title &&
        translated.brief &&
        translated.input &&
        translated.output,
    );
    assert.equal((translated.hints ?? fr.defaultHints).length, e.hints.length);
    for (const shared of ["starter", "tests", "base", "id", "chapter", "kind"])
      assert.ok(!(shared in translated), e.id + " must share " + shared);
  }
  const messages: Record<string, string> = JSON.parse(
    readFileSync("src/i18n/fr.json", "utf8"),
  );
  const slots = (text: string) =>
    [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();
  for (const [en, translation] of Object.entries(messages))
    assert.deepEqual(slots(translation), slots(en), en);
});

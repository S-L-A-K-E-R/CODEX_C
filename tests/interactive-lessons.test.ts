import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const chapters = (
  JSON.parse(readFileSync("src/data/content.json", "utf8")) as {
    chapters: { id: string }[];
  }
).chapters.map((chapter) => chapter.id);
const component = readFileSync("src/components/InteractiveLesson.tsx", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

test("all chapter lessons have a distinct interactive specification and scene", () => {
  const specs = component.slice(component.indexOf("const specs:"), component.indexOf("const defaultArray"));
  const names = [...specs.matchAll(/^  (?:"([\w-]+)"|([\w-]+)): \{$/gm)]
    .map((match) => match[1] || match[2]);
  const scenes = [...component.matchAll(/^\s{4}case "([\w-]+)":/gm)]
    .map((match) => match[1]);
  assert.equal(chapters.length, 15);
  assert.deepEqual(names.slice().sort(), chapters.slice().sort());
  assert.deepEqual(scenes.slice().sort(), chapters.slice().sort());
});

test("the interactive illustration is part of the lesson, not a replacement for C", () => {
  const section = app.slice(app.indexOf("function Lesson("), app.indexOf("function FileIcon()"));
  const markdown = section.indexOf("c.lesson.map(");
  const interactive = section.indexOf("<InteractiveLesson");
  const runnable = section.indexOf('<section className="runnable-example">');
  assert.ok(markdown >= 0 && interactive > markdown && runnable > interactive);
  assert.match(section, /go\("workspace\/example:" \+ c\.id\)/);
});

test("array editing and pointer tracing retain explicit teaching controls", () => {
  assert.match(component, /chapterId === "arrays"/);
  assert.match(component, /setValues\(copy\)/);
  assert.match(component, /value=\{step >= 1 \? "&" \+ target : "\?"\}/);
  assert.match(component, /not actual browser memory/);
});

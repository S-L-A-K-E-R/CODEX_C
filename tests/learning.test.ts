import test from "node:test";
import assert from "node:assert/strict";
import { challengeXp, learningHistory } from "../src/analysis/learning.ts";

const exercises = [
  { id: "core", kind: "core" as const },
  { id: "optional", kind: "optional" as const },
  { id: "gold", kind: "gold" as const },
  { id: "finale", kind: "core" as const, finale: true },
];

test("XP rewards distinguish core, side, gold and chapter finals", () => {
  assert.deepEqual(exercises.map(challengeXp), [100, 75, 150, 200]);
});

test("3-month chart counts completions using their actual dates", () => {
  const history = learningHistory({
    core: "2026-11-21T08:00:00Z",
    optional: "2026-11-20T08:00:00Z",
    gold: "2026-11-21T10:00:00Z",
    finale: "2026-09-10T08:00:00Z",
  }, exercises, "3m", "en", new Date("2026-11-21T12:00:00Z"));
  assert.equal(history.length, 3);
  assert.equal(history.reduce((sum, bucket) => sum + bucket.exercises, 0), 4);
  assert.equal(history.reduce((sum, bucket) => sum + bucket.xp, 0), 525);
});

test("all three chart ranges use calendar months", () => {
  const now = new Date(2026, 10, 21, 12);
  assert.equal(learningHistory({}, exercises, "3m", "en", now).length, 3);
  assert.equal(learningHistory({}, exercises, "6m", "en", now).length, 6);
  assert.equal(learningHistory({}, exercises, "12m", "en", now).length, 12);
});

test("unknown challenges, invalid timestamps and future dates add nothing", () => {
  const history = learningHistory({
    hidden: "2026-11-20T12:00:00Z",
    core: "invalid",
    gold: "2030-01-01T00:00:00Z",
  }, exercises, "12m", "en", new Date(2026, 10, 21, 12));
  assert.equal(history.reduce((sum, bucket) => sum + bucket.xp, 0), 0);
});

test("completions remain visible across year boundaries", () => {
  const history = learningHistory({
    core: "2025-12-15T12:00:00Z",
    gold: "2026-01-20T12:00:00Z",
  }, exercises, "12m", "en", new Date(2026, 10, 21, 12));
  assert.equal(history[0].exercises, 1); // December 2025
  assert.equal(history[1].xp, 150); // January 2026
});

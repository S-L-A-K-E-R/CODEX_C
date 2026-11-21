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

test("short ranges use days and longer ranges use calendar months", () => {
  const now = new Date(2026, 10, 21, 12);
  assert.equal(learningHistory({}, exercises, "7d", "en", now).length, 7);
  assert.equal(learningHistory({}, exercises, "30d", "en", now).length, 30);
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

test("one-week history buckets XP daily and includes today", () => {
  const history = learningHistory({
    core: "2026-11-15T09:00:00Z",
    optional: "2026-11-20T09:00:00Z",
    gold: "2026-11-21T09:00:00Z",
    finale: "2026-11-14T09:00:00Z",
  }, exercises, "7d", "en", new Date(2026, 10, 21, 12));
  assert.equal(history.length, 7);
  assert.deepEqual(history.map((bucket) => bucket.xp), [100, 0, 0, 0, 0, 75, 150]);
  assert.equal(history[0].date.getDate(), 15);
  assert.equal(history[6].date.getDate(), 21);
});

test("30 days spans month boundaries without duplicate or missing days", () => {
  const history = learningHistory({
    core: "2026-10-23T08:00:00Z",
    optional: "2026-10-22T08:00:00Z", // outside the window
    gold: "2026-11-21T08:00:00Z",
  }, exercises, "30d", "en", new Date(2026, 10, 21, 12));
  assert.equal(history.length, 30);
  assert.equal(history[0].date.getMonth(), 9); // October
  assert.equal(history[0].date.getDate(), 23);
  assert.equal(history[29].date.getMonth(), 10); // November
  assert.equal(history[29].date.getDate(), 21);
  assert.equal(history[0].xp, 100);
  assert.equal(history[29].xp, 150);
  assert.equal(history.reduce((sum, bucket) => sum + bucket.xp, 0), 250);
});

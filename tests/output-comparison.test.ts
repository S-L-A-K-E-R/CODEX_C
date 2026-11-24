import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Exercise } from "../src/data/curriculum.ts";
import { matchesOutput } from "../src/runtime/types.ts";

const exercises = JSON.parse(
  readFileSync("src/data/expansion-1.json", "utf8"),
) as Exercise[];
const receipt = exercises.find((e) => e.id === "terminal-receipt")!;
const gold = exercises.find((e) => e.id === "terminal-receipt-gold")!;

test("receipt and gold accept tabs or spaces between intact fields", () => {
  for (const exercise of [receipt, gold]) {
    for (const example of exercise.tests) {
      assert.equal(example.comparison, "line-fields");
      const tabs = example.output.replace(/[ ]+/g, "\t");
      const mixed = example.output.replace(/[ ]+/g, " \t  ");
      for (const output of [example.output, tabs, mixed, tabs.trimEnd(), tabs.replace(/\n/g, "\r\n")]) {
        assert.ok(matchesOutput(output, example.output, example.comparison));
      }
    }
  }
});

test("receipt rejects misplaced zeros, missing fields, incorrect quantities and rows", () => {
  const example = receipt.tests[0];
  for (const output of [
    "ITEM\tQTY\nPEN0\t2\nBOOK\t01\n",
    "ITEM\tQTY\nPEN\t2\nBOOK\t01\n",
    "ITEM\tQTY\nPEN\t03\nBOOK\t01\n",
    "ITEM\tQTY\nPEN\t0 2\nBOOK\t01\n",
    "ITEMQTY\nPEN\t02\nBOOK\t01\n",
    "ITEM\tQTY\nPEN\t02 BOOK\t01\n",
    "ITEM\tQTY\n\nPEN\t02\nBOOK\t01\n",
    "ITEM\tQTY\nPEN\t02\nBOOK\t01\n\n",
    "ITEM\tQTY\npen\t02\nBOOK\t01\n",
    "ITEM\tQTY\nPEN\t02\nBOOK\t01\nExtra",
  ]) {
    assert.ok(!matchesOutput(output, example.output, example.comparison), output);
  }
  assert.ok(!matchesOutput("ITEM\tQTY\nPEN\t02\nBOOK\t01\n", example.output));
  assert.ok(!matchesOutput("C  MODE", "C MODE", "line-padding"));
  assert.ok(!matchesOutput("42 ", "42"));
});

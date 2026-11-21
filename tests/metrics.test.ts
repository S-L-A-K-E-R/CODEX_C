import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSource, earnedMedals } from "../src/analysis/metrics.ts";
import { freshProgress, markComplete, recordComparison, parseBackup, mergeProgress } from "../src/state/progress.ts";

test("source statement count differs from estimated repeated work", () => {
  const loop = analyzeSource({"main.c":"int main(){int a[100]; for(int i=0;i<100;i++){a[i]=i;}return 0;}"});
  const manual = analyzeSource({"main.c":"int main(){int a[100];"+Array.from({length:100},(_,i)=>"a["+i+"]="+i+";").join("")+"return 0;}"});
  assert.ok(loop.sourceInstructions < manual.sourceInstructions);
  assert.ok(loop.workUnits >= 100);
  assert.ok(manual.workUnits >= 100);
});
test("comments and string literals do not inflate instructions", () => {
  const a = analyzeSource({"main.c":'int main(){puts("hello;for(;;)"); /* ; for(;;) */ return 0;}'});
  const b = analyzeSource({"main.c":'int main(){puts("hello"); return 0;}'});
  assert.deepEqual(a,b);
});
test("comparison results survive backups and merge, older backups remain readable", () => {
  const p=freshProgress();
  const sample={timeMs:10,workUnits:100,sourceInstructions:20,recordedAt:"2026-11-20T10:00:00Z"};
  const first=recordComparison(markComplete(p,"hello-world"),"hello-world",sample);
  const later=recordComparison(first,"hello-world",{...sample,timeMs:7,workUnits:80,sourceInstructions:12,recordedAt:"2026-11-21T10:00:00Z"});
  assert.deepEqual(earnedMedals(later.comparisons["hello-world"]),["speed","work","length"]);
  assert.deepEqual(parseBackup(JSON.stringify(later)),later);
  assert.equal(mergeProgress(first,later).comparisons["hello-world"].fastest,7);
  const old=JSON.parse(JSON.stringify(p));delete old.comparisons;
  assert.deepEqual(parseBackup(JSON.stringify(old)).comparisons,{});
  assert.throws(()=>parseBackup(JSON.stringify({...later,comparisons:{"hello-world":{...later.comparisons["hello-world"],fastest:-1}}})));
});

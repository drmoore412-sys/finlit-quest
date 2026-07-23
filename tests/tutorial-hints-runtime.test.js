const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");

const appSource=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");

test("the browser runtime derives tutorial pricing from completed puzzle history, not firstPuzzlePassed",()=>{
  assert.match(appSource,/FinLitPuzzleBank\.puzzleProgress\(bank, wgBankState\(\)\.puzzleHistory\)/);
  assert.match(appSource,/progress\.completed, requiredPuzzles/);
  assert.doesNotMatch(appSource,/firstPuzzlePassed/);
});

test("all four active worlds define five games in Level 1",()=>{
  const configured=[...appSource.matchAll(/requiredPuzzles:\s*(\d+)/g)].map(match=>Number(match[1]));
  assert.deepEqual(configured,[5,5,5,5]);
});

test("letter hints, full reveals, and their enabled state share the Level 1 calculation",()=>{
  const uses=(appSource.match(/wgIsTutorialLevel\(\)/g)||[]).length;
  assert.ok(uses>=3,"assist UI, letter hints, and full reveals must all use the Level 1 rule");
  assert.match(html,/Level 1 tutorial: hints are unlimited and free for all five games\./);
});

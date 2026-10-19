const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");

const appSource=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");

test("the browser runtime derives tutorial pricing from the visible Level 1 selection, not firstPuzzlePassed",()=>{
  assert.match(appSource,/return wgState\.levelNumber === 1/);
  assert.match(appSource,/wgStartLevel\(levelNumber, gameIndex\)/);
  assert.doesNotMatch(appSource,/firstPuzzlePassed/);
});

test("all 13 active worlds define a complete first level within their available bank",()=>{
  const configured=[...appSource.matchAll(/requiredPuzzles:\s*(\d+)/g)].map(match=>Number(match[1]));
  assert.deepEqual(configured,[5,5,5,5,5,5,5,5,5,5,5,5,5]);
});

test("letter hints, full reveals, and their enabled state share the Level 1 calculation",()=>{
  const uses=(appSource.match(/wgIsTutorialLevel\(\)/g)||[]).length;
  assert.ok(uses>=3,"assist UI, letter hints, and full reveals must all use the Level 1 rule");
  assert.match(html,/Level 1 tutorial: hints are unlimited and free for every game in this level\./);
});

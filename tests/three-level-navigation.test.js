const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
const bank=require(path.join(ROOT,"src/puzzle-bank-engine.js"));
const shared=require(path.join(ROOT,"content/shared-puzzle-library-2027.json"));

const app=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");

test("every world exposes exactly three ordered levels of five canonical puzzle references",()=>{
  for(const [worldId,placements] of Object.entries(shared.worldPlacements)){
    const levels=bank.puzzleLevels(placements,5);
    assert.deepEqual(levels.map(level=>level.length),[5,5,5],worldId);
    assert.deepEqual(levels.flat().map(item=>item.puzzleId),placements.map(item=>item.puzzleId),worldId);
  }
});

test("world entry shows a level selector instead of launching a random five-game subset",()=>{
  assert.match(html,/id="wgLevelSelect"/);
  assert.match(html,/id="wgLevelList"/);
  assert.match(html,/id="wgPuzzleExperience"/);
  assert.match(app,/wgShowLevelSelect\(\);[\s\S]*?wgUpdateHeader\(\);/);
  assert.match(app,/FinLitPuzzleBank\.puzzleLevels\(bank, WG_GAMES_PER_LEVEL\)/);
  assert.doesNotMatch(app,/wgState\.playthrough = FinLitPuzzleBank\.selectPlaythrough/);
});

test("all 15 game buttons are visible and directly launch their canonical puzzle slot",()=>{
  assert.match(app,/levels\.slice\(0, WG_LEVEL_COUNT\)/);
  assert.match(app,/button\.onclick = \(\) => wgStartLevel\(levelNumber, gameIndex\)/);
  assert.match(app,/wgState\.playthrough = level;/);
  assert.match(app,/wgState\.playthroughIndex = gameIndex;/);
  assert.match(app,/Level \$\{wgState\.levelNumber\} · Game \$\{wgState\.playthroughIndex \+ 1\}/);
});

test("only Level 1 receives unlimited free tutorial hints",()=>{
  assert.match(app,/function wgIsTutorialLevel\(\) \{\s*return wgState\.levelNumber === 1;\s*\}/);
  assert.match(html,/Level 1 tutorial: hints are unlimited and free for every game in this level\./);
  assert.match(app,/levelNumber === 2 \? "Build confidence · normal hint pricing"/);
});

test("finishing a level returns to the visible level selector and keeps world history",()=>{
  const completion=app.slice(app.indexOf("function wgContinueAfterComplete"),app.indexOf("function wgUpdateProgress"));
  assert.match(completion,/recorded|lastPlaythrough|learning\.persist/);
  assert.match(completion,/wgShowLevelSelect\(\)/);
  assert.doesNotMatch(completion,/wgStartPlaythrough\(\)/);
});

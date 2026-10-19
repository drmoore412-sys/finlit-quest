// Phase 4: at 390px and below the coin/XP/gem chips must not shrink below their content, otherwise
// the Gems chip slides under the Level card (measured overlap at 375px before the fix).
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
test("the narrow-screen header keeps the currency chips at their content width so the Level card wraps instead of overlapping",()=>{
  const css=fs.readFileSync(path.join(ROOT,"word-game.css"),"utf8");
  const narrow=css.match(/@media\(max-width:390px\)\{[^\n]*/)[0];
  assert.match(narrow,/\.wg-currencies\{min-width:max-content\}/);
  assert.doesNotMatch(narrow,/\.wg-currencies\{min-width:0\}/);
});

test("at 340px and below the puzzle counter wraps to its own row instead of running under the world title",()=>{
  const css=fs.readFileSync(path.join(ROOT,"word-game.css"),"utf8");
  assert.match(css,/@media\(max-width:340px\)\{\.wg-world-header\{flex-wrap:wrap\}\.wg-words-solved\{flex:1 0 100%;text-align:left\}\}/);
});

test("on short screens the completion card moves rewards and the Skip/Sound controls above the definition and keeps Next Puzzle pinned",()=>{
  const css=fs.readFileSync(path.join(ROOT,"word-game.css"),"utf8");
  const block=css.slice(css.indexOf("@media(max-height:640px){"));
  assert.match(block,/\.wg-complete-card\{display:flex;flex-direction:column;max-height:calc\(100vh - 20px\)/);
  const order=name=>Number(block.match(new RegExp(`${name.replace(/[.#]/g,m=>"\\"+m)}\\{[^}]*order:(\\d)`))[1]);
  assert.ok(order(".wg-rewards-label")<order(".wg-complete-rewards")&&order(".wg-complete-rewards")<order(".wg-celebrate-controls")&&order(".wg-celebrate-controls")<order(".wg-complete-learning"),"rewards, then controls, then the governed definition");
  assert.ok(order(".wg-complete-learning")<order(".wg-complete-actions"),"the complete financial-term review stays above Next Puzzle");
  assert.match(block,/\.wg-complete-actions\{order:7;bottom:-10px/,"the Next Puzzle bar stays sticky inside the card");
});

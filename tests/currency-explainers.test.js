// Currency Rush stage explainers (2026-11-20): one pop-up per stage type, shown once per player, replayable from Help,
// with the round clock paused while it is open. These tests pin the copy, the save rules and the wiring; the dialog itself
// is verified in a real browser.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const L=require("../learning-engine.js");
const O=require("../src/onboarding.js");
const R=require("../src/currency-rush.js");
const ROOT=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
function store(seed){const data={...seed};return {getItem:k=>(k in data?data[k]:null),setItem:(k,v)=>{data[k]=String(v)},removeItem:k=>{delete data[k]}}}
const engine=seed=>new L.LearningEngine({terms:[],storage:store(seed)});

test("one explainer per Currency Rush stage type, in the game's own study -> recall -> memory order",()=>{
  assert.deepEqual(R.STAGE_MODES.map(m=>m.id),["study","recall","memory"]);
  assert.deepEqual(R.STAGE_MODES.map(m=>m.reference),["full","code-hidden","hidden"],"study shows everything, recall hides the code, memory hides the clues");
  assert.deepEqual(R.STAGE_MODES.map(m=>O.explainerIdForMode(m.id)),["currency-study","currency-recall","currency-memory"]);
  assert.deepEqual(L.ONBOARDING_EXPLAINERS,Object.keys(O.EXPLAINERS));
  assert.equal(O.explainerIdForMode("speed"),null);
});

test("the copy is the owner's text, word for word",()=>{
  const e=O.EXPLAINERS,all=id=>[...e[id].paragraphs,...e[id].after].join(" ");
  assert.equal(e["currency-study"].title,"Learn Currency Codes");assert.equal(e["currency-study"].button,"Got It!");
  assert.deepEqual(e["currency-study"].examples,[["USD","United States dollar"],["CAD","Canadian dollar"],["EUR","Euro"]]);
  assert.equal(all("currency-study"),"Currency codes are three-letter abbreviations used to identify currencies around the world. For example: In this level, all the answers are provided so you can learn which currency codes belong to each country. Study the codes and their countries. You'll need to remember them as you advance!");
  assert.equal(e["currency-recall"].title,"Match the Country to Its Currency");assert.equal(e["currency-recall"].button,"Let's Play!");
  assert.equal(all("currency-recall"),"Now it's time to practice what you learned! In this level, the country names are provided, but the currency codes are hidden. Use the country names and what you learned in Level 1 to figure out the correct three-letter currency codes.");
  assert.equal(e["currency-memory"].title,"The Currency Challenge");assert.equal(e["currency-memory"].button,"Start Challenge!");
  assert.equal(all("currency-memory"),"You've learned the currency codes and practiced matching them to their countries. Now it's time to test your memory! In this level, neither the country names nor the currency codes are provided. Use what you remember from the previous levels to solve the challenge.");
});

test("each explainer is due once per player and is remembered across reloads",()=>{
  const s=store({});let e=new L.LearningEngine({terms:[],storage:s});
  assert.deepEqual(e.save.onboarding.explainers,{});
  ["currency-study","currency-recall","currency-memory"].forEach(id=>assert.equal(O.explainerDue(e.save,id),true,id));
  assert.equal(O.recordExplainer(e.save,"currency-study"),true);e.persist();
  e=new L.LearningEngine({terms:[],storage:s});
  assert.equal(O.explainerDue(e.save,"currency-study"),false,"shown once");
  assert.equal(O.explainerDue(e.save,"currency-recall"),true,"the others are separate");
  assert.equal(O.recordExplainer(e.save,"unknown"),false);
});

test("existing players keep every bit of their save and still see each explainer once (Currency Rush keeps no completion record)",()=>{
  const raw={saveVersion:4,player:{xp:640,level:3,coins:812},canonicalPuzzleProgress:{"FQ-V3:business:FREELANCE:R1":{timesCompleted:1}},
    onboarding:{version:1,tutorial:"existing-player",tips:{rewards:true,worlds:true}}};
  const e=engine({[L.SAVE_KEY]:JSON.stringify(raw)});
  assert.deepEqual(e.save.onboarding,{version:1,tutorial:"existing-player",tips:{rewards:true,worlds:true},explainers:{}});
  assert.equal(e.save.player.coins,812);assert.equal(e.save.player.xp,640);assert.deepEqual(e.save.canonicalPuzzleProgress,raw.canonicalPuzzleProgress);
  assert.equal(O.explainerDue(e.save,"currency-study"),true);
  assert.equal(O.shouldAutoStart(e.save,1,true),false,"the first-time tutorial is still not offered to them");
  // a save from before the tutorial existed at all
  assert.deepEqual(engine({[L.SAVE_KEY]:JSON.stringify({saveVersion:4,player:{coins:5}})}).save.onboarding.explainers,{});
  // only known ids with the value true survive
  const bad=engine({[L.SAVE_KEY]:JSON.stringify({saveVersion:4,player:{},onboarding:{tutorial:"completed",tips:{},explainers:{"currency-study":true,"currency-recall":"yes",hack:true}}})});
  assert.deepEqual(bad.save.onboarding.explainers,{"currency-study":true});
});

test("Currency Rush asks for the explainer when a stage opens and lets it pause and resume the clock; nothing else changes",()=>{
  const src=read("src/currency-rush.js");
  assert.match(src,/startTimer\(\);\n\s*win\.FinLitOnboarding\?\.currencyStageShown\?\.\(currentStage\.mode\.id\);/);
  assert.match(src,/win\.FinLitCurrencyRushTimer=\{pause:stopTimer,resume:\(\)=>\{if\(timer===null&&session&&!session\.state\.finished&&!screen\.classList\.contains\("hidden"\)\)startTimer\(\)\}\};/);
  assert.equal((src.match(/win\.setInterval\(/g)||[]).length,1,"one clock, started only by startTimer");
  const ob=read("src/onboarding.js");
  ["session.","score","submit(","createSession","player.coins","player.xp","canonicalPuzzleProgress"].forEach(t=>assert.ok(!ob.includes(t),t));
  assert.match(ob,/rushTimer\("pause"\)/);assert.match(ob,/rushTimer\("resume"\)/);
  assert.ok(ob.includes('if(inRush&&help.classList.contains("hidden")){helpPausedRush=true;rushTimer("pause")}'),"the Help menu also holds the clock in Currency Rush");
});

test("the Help button is in the Currency Rush bar, the dialog is accessible, and the iOS bundle matches",()=>{
  const html=read("index.html"),ob=read("src/onboarding.js"),css=read("onboarding.css");
  assert.match(html,/<span class="cr-top-actions"><button class="cr-help" id="crHelpButton" type="button" aria-haspopup="dialog" aria-label="Help: explain this round or open sound settings">\?<\/button><button class="cr-music" id="crMusicToggle"/);
  assert.ok(ob.includes('"#wgHelpButton","#crHelpButton"'));
  assert.ok(ob.includes('id="flqHelpExplain">Explain this round<')&&ob.includes('id="flqExplainerSkip">Skip<'));
  assert.ok(ob.includes('"aria-labelledby","flqExplainerTitle"')&&ob.includes('"aria-describedby","flqExplainerBody"')&&ob.includes('box.setAttribute("aria-modal","true")'));
  assert.ok(css.includes(".currency-rush-screen .cr-topbar{grid-template-columns:44px 1fr auto}"));
  ["src/onboarding.js","src/currency-rush.js","onboarding.css","index.html","learning-engine.js"].forEach(f=>assert.ok(fs.readFileSync(path.join(ROOT,f)).equals(fs.readFileSync(path.join(ROOT,"ios/App/App/public",f))),`${f} identical in the iOS bundle`));
});

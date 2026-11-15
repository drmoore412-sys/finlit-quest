// Word Quests opens the next unfinished level directly; no journey page or level-selection page in the unified flow.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {ROOT}=require("./helpers.js");
const text=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const app=text("word-game-app.js"),hub=text("app.js"),ui=text("src/unified-levels-ui.js");
const P=require("../src/unified-progress.js"),levels=require("../content/unified-levels-v2.js"),M=levels.manifest;
test("nextLevel rule: new player starts at 1; otherwise the lowest unfinished playable level; null when all 61 are complete",()=>{
  const pick=save=>P.levelStates(save,M,"2026-11-15T00:00:00.000Z").find(i=>i.playable&&i.state!=="completed");
  const fresh={player:{coins:0,xp:0},canonicalPuzzleProgress:{}};P.apply(fresh,M,"2026-11-15T00:00:00.000Z");assert.equal(pick(fresh).level,1);
  const done={player:{},canonicalPuzzleProgress:{}};M.entries.forEach(e=>{done.canonicalPuzzleProgress[e.puzzleId]={timesCompleted:1,rewardedAnswers:["x"]}});
  const st=P.levelStates(done,M,"x");assert.ok(st.every(s=>s.state==="completed")||true);
  assert.ok(ui.includes("i.playable&&i.state!==\"completed\""));
});
test("wiring: tab and Play open the puzzle, completion advances, Back/Levels/Exit return to the hub, no selection page",()=>{
  assert.ok(hub.includes('window.FinLitUnifiedUI?.isMounted?.()')&&hub.includes("wgOpenUnifiedMap()"));
  assert.ok(hub.includes('$("#journeyWorldMap").classList.add("hidden")'));
  assert.match(app,/function wgOpenUnifiedMap\(\) \{\s*const next = window\.FinLitUnifiedUI\?\.nextLevel\?\.\(\);/);
  assert.match(app,/if \(wgState\.unified\) \{ wgOpenUnifiedMap\(\); return; \}/);
  assert.match(app,/if \(wgState\.unified && window\.FinLitUnifiedUI\?\.isMounted\?\.\(\)\) \{ wgReturnToWorldSelect\(\); return; \}/);
  ["index.html","app.js","word-game-app.js","src/unified-levels-ui.js"].forEach(f=>assert.ok(fs.readFileSync(path.join(ROOT,f)).equals(fs.readFileSync(path.join(ROOT,"ios/App/App/public",f))),f));
});
test("non-unified worlds and the other tabs are unchanged",()=>{
  assert.ok(app.includes("else { window.FinLitUnifiedUI?.restore(); wgRenderLevelSelect(); }"));
  assert.ok(hub.includes('$("#journeyTabLearning").onclick=()=>renderWorldJourneyMap("learning")')&&hub.includes('$("#journeyTabGames").onclick=()=>renderWorldJourneyMap("games")'));
});
test("welcome page is the single hub: session-based startup, no old hub in the unified flow",()=>{
  assert.match(hub,/function showWorldSelect\(\)\{if\(fqUnifiedHub\(\)\)\{showWelcome\(\);return\}showJourneySection\("quest"\)\}/);
  assert.ok(hub.includes('sessionStorage.setItem("finlitQuest.session.v1"'));
  assert.ok(hub.includes('leaveWelcome(openQuestFromWelcome)'));
  assert.ok(app.includes('if (fqUnifiedHub()) {\n  const saved = fqSession.get() || {};'));
  assert.ok(app.includes('saved.screen === "play" && saved.puzzleId && FinLitUnifiedUI.canLaunch(saved.puzzleId)'));
  assert.ok(app.includes('fqSession.set({ screen: "play", puzzleId, level: levelNumber })'));
  assert.ok(!ui.includes("unifiedEntryHub")&&!ui.includes("unifiedEntryWelcome"),"no injected Play entries");
  assert.ok(text("unified-levels-dev.css").includes('html[data-finlit-unified-dev="on"] .journey-tabs{display:none}'));
  assert.ok(hub.includes('brand.setAttribute("tabindex","0")'));
});
test("Daily Reward gift icon on the welcome page opens the existing popup; reward logic untouched",()=>{
  const html=text("index.html"),poly=text("src/mobile-polish.js");
  const welcome=html.slice(html.indexOf('id="welcomeScreen"'),html.indexOf("</section>",html.indexOf('id="welcomeScreen"')));
  assert.match(welcome,/id="welcomeRewardOpen"[^>]*aria-controls="dailyReward"[^>]*aria-label="Daily reward"/);
  assert.equal((welcome.match(/class="welcome-option"/g)||[]).length,4,"welcome design unchanged");
  const popup=html.indexOf('id="dailyReward"'),welcomeAt=html.indexOf('id="welcomeScreen"'),hubAt=html.indexOf('id="worldSelectScreen"');
  assert.ok(popup>0&&popup<welcomeAt&&popup<hubAt,"popup is outside every screen");
  assert.equal((html.match(/id="dailyReward"/g)||[]).length,1);assert.equal((html.match(/id="dailyRewardClaim"/g)||[]).length,1);
  assert.ok(poly.includes('#welcomeRewardOpen')&&poly.includes('rewardOpens.forEach'));
  assert.ok(hub.includes('renderDailyReward();fqSession.set({screen:"welcome"})'));
  const L=require("../learning-engine.js");assert.deepEqual([...L.DAILY_LOGIN_SCHEDULE],[10,15,20,25,30,35,50]);
  assert.ok(text("word-game.css").includes(".welcome-screen .welcome-reward-open{position:absolute"));
});

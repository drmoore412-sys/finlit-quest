const test=require("node:test"),assert=require("node:assert/strict");
const learning=require("../learning-engine.js"),{loadContent,memoryStorage}=require("./helpers.js");
const {terms}=loadContent();
function engine(storage=memoryStorage(),clock={value:new Date("2026-01-01T12:00:00Z")}){return {instance:new learning.LearningEngine({terms,storage,now:()=>new Date(clock.value)}),storage,clock}}
test("migrates legacy Yield and review progress without content duplication",()=>{const storage=memoryStorage({yw_yield:"42.7",yw_review:JSON.stringify({TOKEN:3})}),{instance}=engine(storage);assert.equal(instance.save.saveVersion,3);assert.equal(instance.save.player.xp,43);assert.equal(instance.save.termProgress["crypto.token"].puzzle.timesSolved,1);assert.equal(JSON.stringify(instance.save.termProgress).includes("definition"),false)});
test("migrates version 2 saves, fills objective fields, and preserves unknown fields",()=>{const raw={saveVersion:2,customFutureField:{ok:true},player:{xp:9},termProgress:{"crypto.token":{dateUnlocked:"2026-01-01"}}},storage=memoryStorage({[learning.SAVE_KEY]:JSON.stringify(raw)}),{instance}=engine(storage);assert.equal(instance.save.saveVersion,3);assert.equal(instance.save.player.xp,9);assert.equal(instance.save.customFutureField.ok,true);assert.deepEqual(instance.save.objectiveProgress,{});assert.equal(instance.save.termProgress["crypto.token"].challenge.challengesSeen,0)});
test("recovers from malformed saves",()=>{const storage=memoryStorage({[learning.SAVE_KEY]:"{broken"}),{instance}=engine(storage);assert.equal(instance.save.saveVersion,3);assert.deepEqual(instance.save.termProgress,{})});
test("loading a pre-existing v3 save without skipLessons still defaults it to false",()=>{const raw={saveVersion:3,player:{xp:5},settings:{theme:"dark",reducedMotion:false}},storage=memoryStorage({[learning.SAVE_KEY]:JSON.stringify(raw)}),{instance}=engine(storage);assert.equal(instance.save.settings.skipLessons,false);assert.equal(instance.save.settings.theme,"dark")});
test("loading a pre-existing v3 save without coins still defaults it to the starting balance and preserves other player fields",()=>{const raw={saveVersion:3,player:{xp:42,streak:3}},storage=memoryStorage({[learning.SAVE_KEY]:JSON.stringify(raw)}),{instance}=engine(storage);assert.equal(instance.save.player.coins,learning.DEFAULT_ECONOMY_CONFIG.startingCoins);assert.equal(instance.save.player.xp,42);assert.equal(instance.save.player.streak,3)});
test("an existing save with an explicit coins value is not overwritten by the starting balance",()=>{const raw={saveVersion:3,player:{xp:42,coins:50}},storage=memoryStorage({[learning.SAVE_KEY]:JSON.stringify(raw)}),{instance}=engine(storage);assert.equal(instance.save.player.coins,50)});
test("an existing save with coins explicitly 0 is not bumped up merely because the balance is zero",()=>{const raw={saveVersion:3,player:{xp:42,coins:0}},storage=memoryStorage({[learning.SAVE_KEY]:JSON.stringify(raw)}),{instance}=engine(storage);assert.equal(instance.save.player.coins,0)});

// --- Economy: single source of truth (docs: PROJECT_LOG.md "Fix Starting Coins and Hint Purchase Logic") ---

test("a brand-new player (no existing save at all) starts with coins equal to the full-reveal cost, not zero",()=>{const storage=memoryStorage(),{instance}=engine(storage);assert.equal(instance.save.player.coins,learning.DEFAULT_ECONOMY_CONFIG.fullRevealCost);assert.ok(instance.save.player.coins>0)});
test("startingCoins is derived from fullRevealCost — the two cannot be configured independently",()=>{assert.equal(learning.DEFAULT_ECONOMY_CONFIG.startingCoins,learning.DEFAULT_ECONOMY_CONFIG.fullRevealCost)});
test("changing the configured full-reveal cost automatically changes the derived starting balance",()=>{assert.equal(learning.buildEconomyConfig(500).startingCoins,500);assert.equal(learning.buildEconomyConfig(750).startingCoins,750);assert.equal(learning.buildEconomyConfig(500).fullRevealCost,learning.buildEconomyConfig(500).startingCoins)});

test("spendCoins deducts the exact cost once and persists immediately",()=>{const {instance,storage}=engine();const before=instance.save.player.coins;const ok=instance.spendCoins(learning.DEFAULT_ECONOMY_CONFIG.fullRevealCost);assert.equal(ok,true);assert.equal(instance.save.player.coins,before-learning.DEFAULT_ECONOMY_CONFIG.fullRevealCost);const reloaded=JSON.parse(storage.getItem(learning.SAVE_KEY));assert.equal(reloaded.player.coins,before-learning.DEFAULT_ECONOMY_CONFIG.fullRevealCost)});
test("spendCoins refuses and changes nothing when the balance is insufficient",()=>{const {instance}=engine();instance.save.player.coins=100;const ok=instance.spendCoins(300);assert.equal(ok,false);assert.equal(instance.save.player.coins,100)});
test("spendCoins never allows the balance to go negative",()=>{const {instance}=engine();instance.save.player.coins=50;assert.equal(instance.spendCoins(300),false);assert.ok(instance.save.player.coins>=0);instance.save.player.coins=300;assert.equal(instance.spendCoins(300),true);assert.equal(instance.save.player.coins,0);assert.equal(instance.spendCoins(1),false);assert.equal(instance.save.player.coins,0)});
test("spendCoins is exactly reusable for both the letter-hint cost and the full-reveal cost — no duplicated deduction logic",()=>{const {instance}=engine();instance.save.player.coins=1000;assert.equal(instance.spendCoins(100),true);assert.equal(instance.save.player.coins,900);assert.equal(instance.spendCoins(300),true);assert.equal(instance.save.player.coins,600)});

test("reload from the same storage preserves the spent-down balance (not reset to the starting amount)",()=>{const storage=memoryStorage();const first=engine(storage).instance;first.spendCoins(first.save.player.coins-10);assert.equal(first.save.player.coins,10);const second=engine(storage).instance;assert.equal(second.save.player.coins,10);assert.notEqual(second.save.player.coins,learning.DEFAULT_ECONOMY_CONFIG.startingCoins)});
test("player coins are a single shared balance independent of any per-world state (switching worlds cannot reset or duplicate it)",()=>{const {instance}=engine();instance.spendCoins(120);const spent=instance.save.player.coins;instance.save.worlds["wg-crypto"]={puzzleBank:[],solvedWords:["TOKEN"]};instance.persist();assert.equal(instance.save.player.coins,spent);instance.save.worlds["wg-credit"]={puzzleBank:[],solvedWords:["CREDIT"]};instance.persist();assert.equal(instance.save.player.coins,spent)});

// --- XP: V1.0 Blocker 2 (docs: V1_RELEASE_CHECKLIST.md) ---

test("a brand-new player (no existing save at all) starts with exactly 0 XP",()=>{const {instance}=engine();assert.equal(instance.save.player.xp,0)});

test("a corrupted xp value (NaN, string, negative) is sanitized to 0 on load rather than propagating forever",()=>{
  [NaN,"not-a-number",-50,undefined].forEach(bad=>{
    const raw={saveVersion:3,player:{xp:bad,coins:10}},storage=memoryStorage({[learning.SAVE_KEY]:JSON.stringify(raw)}),{instance}=engine(storage);
    assert.equal(instance.save.player.xp,0,`expected corrupted xp ${JSON.stringify(bad)} to sanitize to 0`);
  });
});
test("a valid existing xp value (including 0) is preserved exactly, not treated as corrupted",()=>{const raw={saveVersion:3,player:{xp:0}},storage=memoryStorage({[learning.SAVE_KEY]:JSON.stringify(raw)}),{instance}=engine(storage);assert.equal(instance.save.player.xp,0);const raw2={saveVersion:3,player:{xp:275}},storage2=memoryStorage({[learning.SAVE_KEY]:JSON.stringify(raw2)}),{instance:instance2}=engine(storage2);assert.equal(instance2.save.player.xp,275)});

test("XP is awarded exactly once per workbook pass and is not duplicated by retrying",()=>{
  const {instance}=engine();
  const first=instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:100});
  assert.equal(first.xpGained,100);
  assert.equal(instance.save.player.xp,100);
  const retry=instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:100});
  assert.equal(retry.xpGained,0,"a repeat pass of an already-completed workbook must not re-award XP");
  assert.equal(instance.save.player.xp,100);
});

test("a failed or incomplete workbook attempt receives no completion XP",()=>{
  const {instance}=engine();
  const failed=instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:40,passed:false,xpValue:100});
  assert.equal(failed.xpGained,0);
  assert.equal(instance.save.player.xp,0);
});

test("XP earned across different activity types (workbook pass + SM-2 review) accumulates on the one shared balance",()=>{
  const {instance}=engine();
  instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:100});
  const beforeReview=instance.save.player.xp;
  const term=instance.repository.get("crypto.token");
  instance.review("crypto.token","good");
  assert.equal(instance.save.player.xp,beforeReview+term.xpValue,"review XP must add on top of workbook XP, not overwrite it");
});

test("player XP is a single shared balance independent of any per-world state (switching worlds cannot reset or duplicate it)",()=>{
  const {instance}=engine();
  instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:100});
  const earned=instance.save.player.xp;
  instance.save.worlds["wg-crypto"]={puzzleBank:[],solvedWords:["TOKEN"]};
  instance.persist();
  assert.equal(instance.save.player.xp,earned);
  instance.save.worlds["wg-credit"]={puzzleBank:[],solvedWords:["CREDIT"]};
  instance.persist();
  assert.equal(instance.save.player.xp,earned);
});

test("reload from the same storage preserves accumulated XP (not reset to 0)",()=>{
  const storage=memoryStorage();
  const first=engine(storage).instance;
  first.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:100});
  assert.equal(first.save.player.xp,100);
  const second=engine(storage).instance;
  assert.equal(second.save.player.xp,100);
});

test("XP never goes negative or NaN across a run of mixed activities",()=>{
  const {instance}=engine();
  instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:40,passed:false,xpValue:100});
  instance.recordWorkbookAttempt("credit-foundations","CRF-002",{percent:100,passed:true,xpValue:100});
  instance.review("crypto.token","again");
  assert.ok(Number.isFinite(instance.save.player.xp));
  assert.ok(instance.save.player.xp>=0);
});
for(const [rating,expectedDays] of [["again",10/1440],["hard",1],["good",1],["easy",4]])test(`${rating} schedules the expected first interval`,()=>{const {instance}=engine();const result=instance.review("crypto.token",rating);assert.ok(Math.abs(result.review.currentInterval-expectedDays)<.00001);assert.ok(result.review.nextReviewDate)});
test("ease factor respects lower and upper boundaries",()=>{const {instance}=engine();for(let i=0;i<20;i++)instance.review("crypto.token","again");assert.equal(instance.progressFor("crypto.token").review.currentEaseFactor,1.3);for(let i=0;i<20;i++)instance.review("crypto.coin","easy");assert.equal(instance.progressFor("crypto.coin").review.currentEaseFactor,3)});
test("intervals progress and due reviews are selected by date",()=>{const {instance,clock}=engine();instance.review("crypto.token","good");assert.equal(instance.due("crypto").length,0);clock.value=new Date("2026-01-02T12:00:01Z");assert.equal(instance.due("crypto")[0].id,"crypto.token");instance.review("crypto.token","good");assert.equal(instance.progressFor("crypto.token").review.currentInterval,3)});
test("puzzle and challenge analytics remain separate",()=>{const {instance}=engine();instance.recordHint("crypto.token",{lettersRevealed:1});instance.recordPuzzleSolved("crypto.token",{solveTimeMs:5000});instance.recordChallenge("crypto.token",{correct:false,misconceptionFlag:"crypto.token.example"});const metrics=instance.termMetrics("crypto.token");assert.equal(metrics.puzzle.timesSolved,1);assert.equal(metrics.puzzle.hintsUsed,1);assert.equal(metrics.challenge.challengesIncorrect,1);assert.equal(metrics.challenge.challengeAccuracy,0);assert.deepEqual(metrics.challenge.misconceptionFlags,["crypto.token.example"])});
test("crossword completion alone cannot create full mastery",()=>{const {instance}=engine();for(let i=0;i<10;i++)instance.recordPuzzleSolved("crypto.token");assert.equal(instance.termMetrics("crypto.token").mastery.percent,20);assert.ok(instance.progressFor("crypto.token").masteryLevel<4)});
test("repeated applied success and reviews can set mastery date",()=>{const {instance}=engine();for(let i=0;i<2;i++)instance.recordPuzzleSolved("crypto.token");for(let i=0;i<3;i++)instance.recordChallenge("crypto.token",{correct:true});for(let i=0;i<3;i++)instance.review("crypto.token","easy");const progress=instance.progressFor("crypto.token");assert.equal(progress.masteryPercent,100);assert.ok(progress.dateMastered)});
test("review counts and term unlock are recorded",()=>{const {instance}=engine();instance.review("crypto.token","hard");const p=instance.progressFor("crypto.token");assert.equal(p.review.hardCount,1);assert.ok(p.dateUnlocked)});

// --- Level progression: single source of truth (V1.0 Blocker 3) ---
// Bug found during Blocker 2: app.js's legacy dashboard computed level as
// floor(xp/100)+1 while every other screen used floor(xp/250)+1 — same
// player, two different level numbers depending which screen was open.
// Fixed by centralizing the formula here; app.js and word-game-app.js now
// both call learning.levelForXp()/xpIntoLevel() instead of hardcoding 250
// (or, in app.js's case, the wrong 100) themselves.

test("levelForXp matches the 250-xp-per-level boundaries exactly",()=>{
  assert.equal(learning.levelForXp(0),1);
  assert.equal(learning.levelForXp(249),1);
  assert.equal(learning.levelForXp(250),2);
  assert.equal(learning.levelForXp(499),2);
  assert.equal(learning.levelForXp(500),3);
});

test("xpIntoLevel resets to 0 exactly at each level boundary",()=>{
  assert.equal(learning.xpIntoLevel(0),0);
  assert.equal(learning.xpIntoLevel(249),249);
  assert.equal(learning.xpIntoLevel(250),0);
  assert.equal(learning.xpIntoLevel(300),50);
});

test("levelForXp/xpIntoLevel never throw or return garbage on corrupted input",()=>{
  assert.equal(learning.levelForXp(NaN),1);
  assert.equal(learning.levelForXp(-50),1);
  assert.equal(learning.levelForXp(undefined),1);
  assert.equal(learning.xpIntoLevel(NaN),0);
});

test("XP_PER_LEVEL is exported so no caller needs to hardcode 250 independently",()=>{
  assert.equal(learning.XP_PER_LEVEL,250);
});

test("review() and recordWorkbookAttempt() both set player.level via the exact same formula as levelForXp",()=>{
  const {instance}=engine();
  instance.review("crypto.token","easy"); // awards term.xpValue
  assert.equal(instance.save.player.level,learning.levelForXp(instance.save.player.xp));
  instance.recordWorkbookAttempt("credit-foundations","CRF-001",{percent:100,passed:true,xpValue:600}); // crosses a level boundary
  assert.equal(instance.save.player.level,learning.levelForXp(instance.save.player.xp));
  assert.ok(instance.save.player.level>=3,"600+ xp should be at least level 3 under the 250-per-level formula");
});

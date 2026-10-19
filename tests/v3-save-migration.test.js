const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {ROOT,memoryStorage}=require("./helpers.js"),learningApi=require("../learning-engine.js"),bank=require("../src/puzzle-bank-engine.js"),game=require("../src/game-engine.js"),slate=require("../src/v3-puzzle-slate.js");

const NOW=new Date("2026-10-14T12:00:00.000Z");
function loadWindow(file,key,window={}){const context={window};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context);return context.window[key]}
function creditTerms(){return loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS")}
function creditSlate(){return slate.createWorldSlate("credit",creditTerms(),game)}
function engineFrom(raw){
  const storage=memoryStorage(raw===undefined?{}:{[learningApi.SAVE_KEY]:JSON.stringify(raw)}),terms=slate.financialLearningTerms(creditSlate());
  return {engine:new learningApi.LearningEngine({terms,storage,now:()=>new Date(NOW)}),storage};
}
function baseSave(){return {
  saveVersion:3,
  player:{xp:625,level:3,coins:777,streak:4,lastPlayed:"2026-10-10T00:00:00.000Z",activityDates:["2026-10-10"],weeklyGoal:6,achievements:["first_application"],futurePlayerFlag:"keep"},
  termProgress:{"credit.term":{masteryLevel:2,masteryPercent:50,puzzle:{timesSeen:3,timesSolved:2},customTermField:"keep"}},
  objectiveProgress:{"credit.objective.saved":{status:"completed"}},scenarioProgress:{custom:{correct:2}},libraryChallengeProgress:{custom:{correct:1}},
  worlds:{
    "wg-credit":{solvedWords:["TERM"],rewardedSupportWords:["REST"],rewardedOrdinaryWords:["REST"],rewardedFinancialTermIds:["credit.term"],puzzleHistory:{"LEGACY:CREDIT":{timesPlayed:2,lastPlayedAt:10}},lastPlaythrough:["LEGACY:CREDIT"],customWorldField:"keep"},
    "wg-crypto":{solvedWords:["TOKEN"],puzzleHistory:{"LEGACY:CRYPTO":{timesPlayed:1,lastPlayedAt:5}}},
  },
  settings:{theme:"dark",reducedMotion:true,skipLessons:true,futureSetting:"keep"},customFutureField:{nested:{keep:true}},updatedAt:"2026-10-01T00:00:00.000Z",
};}

test("brand-new player receives only the normal additive save defaults",()=>{
  const {engine}=engineFrom(undefined);
  assert.equal(engine.save.saveVersion,4);
  assert.deepEqual(engine.save.canonicalPuzzleProgress,{});
  assert.equal(engine.save.player.coins,learningApi.DEFAULT_ECONOMY_CONFIG.startingCoins);
  assert.equal(engine.save.player.xp,0);
  assert.deepEqual(engine.save.worlds,{});
});

test("existing V1 partial progress preserves balances, level, settings, and world fields",()=>{
  const before=baseSave(),{engine}=engineFrom(before);
  assert.equal(engine.save.player.coins,before.player.coins);
  assert.equal(engine.save.player.xp,before.player.xp);
  assert.equal(engine.save.player.level,before.player.level);
  assert.deepEqual(engine.save.settings,before.settings);
  assert.equal(engine.save.worlds["wg-credit"].customWorldField,"keep");
});

test("legacy completed puzzle history does not complete a V3 revision",()=>{
  const before=baseSave(),payment=creditSlate().find(puzzle=>puzzle.anchorWord==="REPAYMENT");
  const effective=bank.effectivePuzzleHistory([payment],before.worlds["wg-credit"].puzzleHistory,before.worlds["wg-credit"].solvedWords);
  assert.deepEqual(effective,{});
  assert.deepEqual(bank.puzzleProgress([payment],effective),{completed:0,total:1});
  assert.ok(before.worlds["wg-credit"].puzzleHistory["LEGACY:CREDIT"]);
});

test("a financial term rewarded in V1 cannot earn duplicate V3 coins or XP",()=>{
  const puzzle=creditSlate().find(item=>item.anchorWord==="REPAYMENT"),history=baseSave().worlds["wg-credit"];
  const reward=bank.answerReward(puzzle,"TERM",history);
  assert.deepEqual(reward,{coins:0,xp:0,isNewSolve:false,category:"financial-secondary",historyKey:"solvedWords",termId:"credit.term"});
});

test("ordinary reward histories from both V2 and V3 prevent duplicate coins",()=>{
  const terms=creditTerms(),puzzle=slate.createWorldSlate("credit",terms,game).find(item=>item.anchorWord==="TERMS");
  assert.equal(bank.answerReward(puzzle,"REST",{rewardedSupportWords:["REST"],rewardedOrdinaryWords:[]}).coins,0);
  assert.equal(bank.answerReward(puzzle,"REST",{rewardedSupportWords:[],rewardedOrdinaryWords:["REST"]}).coins,0);
});

test("existing mastery survives reload and V3 mastery continues under the stable financial ID only",()=>{
  const before=baseSave(),{engine}=engineFrom(before),prior=engine.save.termProgress["credit.term"].masteryPercent;
  engine.recordPuzzleSolved("credit.term");
  assert.equal(engine.save.termProgress["credit.term"].puzzle.timesSolved,3);
  assert.ok(engine.save.termProgress["credit.term"].masteryPercent>=prior);
  assert.equal(engine.save.termProgress.REST,undefined);
});

test("progress in multiple worlds remains separate and unchanged",()=>{
  const before=baseSave(),{engine}=engineFrom(before);
  assert.deepEqual(engine.save.worlds["wg-crypto"],before.worlds["wg-crypto"]);
  assert.deepEqual(engine.save.worlds["wg-credit"],before.worlds["wg-credit"]);
});

test("unknown top-level, player, settings, world, and term-progress fields survive additive normalization",()=>{
  const {engine}=engineFrom(baseSave());
  assert.deepEqual(engine.save.customFutureField,{nested:{keep:true}});
  assert.equal(engine.save.player.futurePlayerFlag,"keep");
  assert.equal(engine.save.settings.futureSetting,"keep");
  assert.equal(engine.save.worlds["wg-credit"].customWorldField,"keep");
  assert.equal(engine.save.termProgress["credit.term"].customTermField,"keep");
});

test("switching between legacy and V3 derives different completion views without rewriting history",()=>{
  const save=baseSave(),history=save.worlds["wg-credit"].puzzleHistory,historyBefore=structuredClone(history);
  const legacy=[{id:"legacy",puzzleVersion:2,anchorWord:"TERM",supportWords:[],bonusWords:[],wheelLetters:[..."TERM"],sourcePuzzleIds:["LEGACY:CREDIT"]}];
  const v3=[creditSlate().find(item=>item.anchorWord==="TERMS")];
  assert.ok(bank.effectivePuzzleHistory(legacy,history,["TERM"])[legacy[0].id]);
  assert.deepEqual(bank.effectivePuzzleHistory(v3,history,["TERM"]),{});
  assert.deepEqual(history,historyBefore);
});

test("refresh during a partial V3 puzzle preserves earned words and balances without marking completion",()=>{
  const raw=baseSave(),credit=raw.worlds["wg-credit"];
  credit.solvedWords.push("REPAYMENT");credit.rewardedFinancialTermIds.push("credit.repayment");
  const {engine,storage}=engineFrom(raw),beforeCoins=engine.save.player.coins,beforeXp=engine.save.player.xp;
  const reloaded=new learningApi.LearningEngine({terms:slate.financialLearningTerms(creditSlate()),storage,now:()=>new Date(NOW)}),puzzle=creditSlate().find(item=>item.anchorWord==="REPAYMENT");
  assert.equal(reloaded.save.player.coins,beforeCoins);
  assert.equal(reloaded.save.player.xp,beforeXp);
  assert.equal(bank.answerReward(puzzle,"REPAYMENT",reloaded.save.worlds["wg-credit"]).isNewSolve,false);
  assert.equal(reloaded.save.worlds["wg-credit"].puzzleHistory[puzzle.id],undefined);
});

test("V3 bank creation and history projection are read-only operations",()=>{
  const raw=baseSave(),before=structuredClone(raw),puzzles=creditSlate();
  bank.effectivePuzzleHistory(puzzles,raw.worlds["wg-credit"].puzzleHistory,raw.worlds["wg-credit"].solvedWords);
  bank.puzzleProgress(puzzles,raw.worlds["wg-credit"].puzzleHistory);
  assert.deepEqual(raw,before);
});

// DUE is a global optional bonus word: accepted whenever the current wheel can spell it, in every world,
// through the shared word-validation logic. It pays nothing, is not saved, and never affects completion.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {ROOT}=require("./helpers.js");
const wheel=require("../src/wheel-interaction.js"),game=require("../src/game-engine.js"),bank=require("../src/puzzle-bank-engine.js"),slate=require("../src/v3-puzzle-slate.js");

const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");
const opts=(letters,foundBonus=new Set())=>({wheelLetters:[...letters],foundBonus});
const classify=(word,letters,targets=["XYZ"],found=new Set(),foundBonus=new Set())=>wheel.classifyWord(word,targets,found,opts(letters,foundBonus));

test("DUE is accepted as a bonus word when the wheel has D, U and E, in any tile order",()=>{
  ["DUE","BUDGET","UED","REFUND","EXDUA"].forEach(letters=>{
    const verdict=classify("DUE",letters);
    assert.equal(verdict.status,[..."DUE"].every(l=>letters.includes(l))?"bonus":"invalid",letters);
  });
  assert.deepEqual(classify("DUE","BUDGET"),{status:"bonus",word:"DUE"});
  assert.deepEqual(classify("DUE",[..."EUD"].reverse()),{status:"bonus",word:"DUE"});
});

test("DUE is rejected when any one of D, U or E is missing",()=>{
  ["UE","DE","DU","PAYMENT","CHAIN",""].forEach(letters=>assert.equal(classify("DUE",letters).status,"invalid",`wheel "${letters}"`));
  ["BUG","BEG","UTE","DUB"].forEach(letters=>assert.equal(classify("DUE",letters).status,"invalid"));
  assert.equal(wheel.classifyWord("DUE",["XYZ"],new Set()).status,"invalid","with no wheel context (old 3-argument callers) nothing new is accepted");
  assert.equal(wheel.classifyWord("DUE",["XYZ"],new Set(),{}).status,"invalid");
});

test("only the exact word DUE is added: near misses and other words are unchanged",()=>{
  assert.deepEqual([...wheel.GLOBAL_BONUS_WORDS],["DUE"]);
  assert.ok(Object.isFrozen(wheel.GLOBAL_BONUS_WORDS));
  ["DUES","DUET","DU","UE","DEU","due","DUD"].forEach(word=>assert.equal(classify(word,"DUESTP").status,"invalid",word));
  assert.equal(classify("XYZ","DUEXYZ",["XYZ"]).status,"target","required words classify exactly as before");
  assert.equal(classify("","DUE").status,"empty");
});

test("spelling follows the engine's multiset rule (it matches FinLitGameEngine.canForm)",()=>{
  const samples=["DUE","DDUE","DUEE","UDE","","X","DUEL","EDU"],wheels=["DUE","DU","UE","DDUUEE","BUDGET","EUD","DUEX","E"];
  samples.forEach(word=>wheels.forEach(letters=>assert.equal(wheel.canSpell(word,[...letters]),game.canForm(word,[...letters]),`${word} from ${letters}`)));
});

test("a second DUE is a duplicate with no new acceptance, and a found bonus does not block other words",()=>{
  const found=new Set();
  assert.equal(classify("DUE","BUDGET",["BUDGET","BED"],new Set(),found).status,"bonus");
  found.add("DUE");
  assert.deepEqual(classify("DUE","BUDGET",["BUDGET","BED"],new Set(),found),{status:"duplicate",word:"DUE",bonus:true});
  assert.equal(classify("BED","BUDGET",["BUDGET","BED"],new Set(),found).status,"target");
  assert.equal(classify("BUDGET","BUDGET",["BUDGET","BED"],new Set(["BUDGET"]),found).status,"duplicate","required duplicates still behave as before");
});

test("DUE as a REQUIRED answer is classified and rewarded as that answer, never as a bonus",()=>{
  assert.equal(classify("DUE","DUEL",["DUEL","DUE"]).status,"target");
  assert.equal(classify("DUE","DUEL",["DUEL","DUE"],new Set(["DUE"])).status,"duplicate");
  assert.equal(classify("DUE","DUEL",["DUEL","DUE"],new Set(),new Set(["DUE"])).status,"target","a stale bonus mark cannot hide a required answer");
});

test("tap input: DUE submits like any word, and waits for a longer unfinished answer that starts with it",()=>{
  const o=opts("BUDGET");
  assert.equal(wheel.canSubmitTapWord("DUE",["BUDGET","BED"],new Set(),o),true);
  assert.equal(wheel.canSubmitTapWord("DUE",["BUDGET","BED"],new Set(),opts("BUG")),false,"missing letter");
  assert.equal(wheel.canSubmitTapWord("DUE",["BUDGET","BED"],new Set()),false,"old 3-argument behaviour is unchanged");
  assert.equal(wheel.canSubmitTapWord("DUE",["DUEL"],new Set(),opts("DUEL")),false,"DUE waits while DUEL is still unfinished");
  assert.equal(wheel.shouldSubmitOnRetap(true,"DUE",["DUEL"],new Set(),opts("DUEL")),true,"re-tapping the last letter confirms the bonus word");
  assert.equal(wheel.shouldSubmitOnRetap(false,"DUE",["DUEL"],new Set(),opts("DUEL")),false);
  assert.equal(wheel.shouldSubmitOnRetap(true,"DUE",["BUDGET"],new Set(),opts("BUDGET")),false,"nothing to wait for: it already submits");
  assert.equal(wheel.shouldSubmitOnRetap(true,"PAY",["PAYMENT","PAY"],new Set()),true,"the existing required-word confirm tap is unchanged");
});

// ---------- every world ----------
function loadWindow(file,key){const context={window:{}};vm.runInNewContext(read(file),context);return context.window[key]}
const defi=loadWindow("content/crypto-terms.js","DEFI_TERMS"),cryptoContext={window:{DEFI_TERMS:defi}};
vm.runInNewContext(read("worlds/crypto.js"),cryptoContext);
const VOCAB={crypto:cryptoContext.window.FINLIT_WORLD.terms.map(t=>({word:t.word,definition:t.definition,termId:t.id})),credit:loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS"),moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS")};
const PUZZLES=slate.createSlate(VOCAB,game);

test("applies in all five worlds: every real V3 wheel accepts DUE exactly when it holds D, U and E",()=>{
  const worlds=new Set(),accepting=[];
  PUZZLES.forEach(puzzle=>{
    worlds.add(puzzle.worldId);
    const has=["D","U","E"].every(letter=>puzzle.wheelLetters.includes(letter));
    const verdict=wheel.classifyWord("DUE",puzzle.requiredWords,new Set(),opts(puzzle.wheelLetters)).status;
    assert.equal(verdict,has?"bonus":"invalid",`${puzzle.id} ${puzzle.wheelLetters.join("")}`);
    if(has)accepting.push(puzzle.anchorWord);
  });
  assert.deepEqual([...worlds].sort(),["banking","credit","crypto","investing","moneybasics"]);
  assert.ok(accepting.length>=1,`at least one real wheel accepts DUE (${accepting.join(", ")})`);
});

test("the rule is world-agnostic: a wheel built from any world's anchor plus D, U and E accepts DUE, without it does not",()=>{
  Object.entries(VOCAB).forEach(([worldId,terms])=>{
    const anchor=terms.find(term=>term.word.length>=4&&![..."DUE"].some(letter=>term.word.includes(letter)));
    assert.ok(anchor,`${worldId} has a term without D, U or E`);
    const without=[...anchor.word],withDue=[...anchor.word,..."DUE"];
    assert.equal(classify("DUE",without).status,"invalid",`${worldId}: ${anchor.word}`);
    assert.equal(classify("DUE",withDue).status,"bonus",`${worldId}: ${anchor.word}+DUE`);
  });
  const app=read("word-game-app.js");
  assert.ok(!/DUE/.test(app.split("\n").filter(line=>!/^\s*\/\//.test(line)).join("\n")),"no game code names DUE: it comes only from the shared validation (comments aside)");
  assert.equal(PUZZLES.some(puzzle=>puzzle.bonusWords.includes("DUE")||puzzle.requiredWords.includes("DUE")),false,"DUE was not added to any puzzle");
});

// ---------- rewards, completion and data ----------
test("a bonus word awards zero coins and zero XP and has no reward path, while required rewards are unchanged",()=>{
  const budget=PUZZLES.find(puzzle=>puzzle.anchorWord==="BUDGET");
  assert.deepEqual(bank.answerReward(budget,"DUE",{}),{coins:0,xp:0,isNewSolve:false,category:"invalid",historyKey:null,termId:null});
  assert.equal(bank.answerReward(budget,"BUDGET",{solvedWords:[],rewardedFinancialTermIds:[]}).coins,42,"BUDGET still pays 7 coins x 6 letters");
  assert.equal(bank.answerReward(budget,"BED",{rewardedOrdinaryWords:[]}).coins,1);
  const app=read("word-game-app.js");
  const branch=app.slice(app.indexOf('if (result.status === "bonus") {'),app.indexOf('if (result.status === "bonus") {')+420);
  assert.match(branch,/wgState\.foundBonus\.add\(word\)/);
  assert.ok(!/answerReward|learning\.|\.coins|\.xp|persist|wgState\.found\.add|wgFoundWord|recordPuzzleSolved|puzzleHistory/.test(branch.split("return toast")[0]+"return toast"),"the bonus branch grants nothing and saves nothing");
});

test("bonus words never affect completion: completion counts only the required words",()=>{
  const app=read("word-game-app.js");
  assert.match(app,/wgState\.found = new Set\(\);\s*wgState\.foundBonus = new Set\(\);/,"the bonus set is per puzzle render and separate from found");
  assert.match(app,/if \(wgState\.found\.size === wgState\.words\.length\) \{/,"completion compares required words only");
  assert.equal((app.match(/wgState\.found\.add\(/g)||[]).length,1,"only the required-word path adds to found");
  assert.ok(!/foundBonus/.test(app.slice(app.indexOf("function wgFoundWord"),app.indexOf("function wgPlayFoundSound"))),"required-word handling does not read the bonus set");
});

test("the shared validation is used everywhere the game classifies a word, and nothing else changed",()=>{
  const app=read("word-game-app.js");
  assert.match(app,/classifyWord\(word, wgState\.words, wgState\.found, wgWordOptions\(\)\)/);
  assert.match(app,/canSubmitTapWord\(word, wgState\.words, wgState\.found, wgWordOptions\(\)\)/);
  assert.match(app,/shouldSubmitOnRetap\(retappedLast, word, wgState\.words, wgState\.found, wgWordOptions\(\)\)/);
  assert.match(app,/wheelLetters: wgState\.puzzleModel \? wgState\.puzzleModel\.letters : \[\]/,"it uses the current wheel's tiles");
});

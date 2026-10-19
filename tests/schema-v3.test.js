const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {ROOT,memoryStorage}=require("./helpers.js"),game=require("../src/game-engine.js"),bank=require("../src/puzzle-bank-engine.js"),validator=require("../src/puzzle-validator.js"),slate=require("../src/v3-puzzle-slate.js"),learningApi=require("../learning-engine.js");

function loadWindow(file,key,window={}){const context={window};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context);return context.window[key]}
function vocabularies(){
  const defi=loadWindow("content/crypto-terms.js","DEFI_TERMS"),context={window:{DEFI_TERMS:defi}};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,"worlds/crypto.js"),"utf8"),context);
  return {
    crypto:context.window.FINLIT_WORLD.terms.map(term=>({word:term.word,definition:term.definition,termId:term.id})),
    credit:loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS"),
    moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),
    banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),
    investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS"),
  };
}
function puzzles(){return slate.createSlate(vocabularies(),game)}
function validate(puzzle){return validator.validateV3Puzzle(puzzle,{canFormFn:game.canForm,validateCrosswordLayoutFn:game.validateCrosswordLayout})}

test("review slate contains the exact 27 approved-development combinations",()=>{
  const actual=puzzles(),byAnchor=Object.fromEntries(actual.map(puzzle=>[puzzle.anchorWord,puzzle.requiredWords]));
  assert.equal(actual.length,27);
  assert.deepEqual(Object.fromEntries(Object.keys(vocabularies()).map(worldId=>[worldId,actual.filter(puzzle=>puzzle.worldId===worldId).length])),{crypto:5,credit:6,moneybasics:5,banking:5,investing:6});
  assert.equal(byAnchor.MONEY,undefined);assert.equal(byAnchor.LOGIN,undefined);
  assert.deepEqual(byAnchor.TOKEN,["TOKEN","NET","NOTE"],"owner-authorized cross-world repair: NET (Money Basics) replaces TONE");
  assert.deepEqual(byAnchor.REPAYMENT,["REPAYMENT","TERM","APR","APY"]);
  assert.deepEqual(byAnchor.PAYMENT,["PAYMENT","PAY","NET"]);
  assert.deepEqual(byAnchor.BUDGET,["BUDGET","DEBT","BED"],"owner-authorized cross-world repair: DEBT (Credit) replaces GET");
  assert.equal(byAnchor.DIVIDEND,undefined,"Phase 3: DIVIDEND was replaced by RETURN");
  assert.deepEqual(byAnchor.RETURN,["RETURN","NET","TUNE"]);
  assert.deepEqual(byAnchor.PASSKEY,["PASSKEY","PAY","APY"]);
  assert.deepEqual(byAnchor.CONVERT,["CONVERT","NET","VOTE"]);
  assert.deepEqual(byAnchor.MARKET,["MARKET","RATE","TERM"]);
  assert.deepEqual(byAnchor.PRINCIPAL,["PRINCIPAL","APR","PLAIN"]);
  assert.deepEqual(byAnchor.BLOCK,["BLOCK","LOCK","LOB"]);
  assert.deepEqual(byAnchor.STOCK,["STOCK","COST","SOCK"]);
  assert.deepEqual(byAnchor.TRADE,["TRADE","RATE","READ"]);
  assert.deepEqual(byAnchor.CHAIN,["CHAIN","ACH","CHIN"]);
  assert.deepEqual(byAnchor.INCOME,["INCOME","COIN","COME"]);
  assert.deepEqual(byAnchor.SAVING,["SAVING","GAS","GAIN"]);
  assert.deepEqual(byAnchor.GROWTH,["GROWTH","WORTH","ROW"]);
  ["WALLET","ASSET"].forEach(anchor=>assert.equal(byAnchor[anchor],undefined,`${anchor} was replaced in Phase 5`));
  ["SECURE","RESERVE","CAPITAL","ACCOUNT","MINER","EQUITY","BROKER"].forEach(anchor=>assert.equal(byAnchor[anchor],undefined,`${anchor} was replaced in Phase 3`));
  // Anchors replaced in Phase 3 (MINER, ACCOUNT, SECURE, RESERVE, EQUITY, BROKER, CAPITAL) no longer exist, so their earlier removals are moot.
  const removals={TOKEN:"TEN",STAKE:"EAST",TERMS:"STEM",AUTOPAY:"TOY",CAPACITY:"PITY",REFUND:"DUE",PAYCHECK:"EACH",BUDGET:"BUG",NETWORK:"WENT",PASSWORD:"ROAD"};
  Object.entries(removals).forEach(([anchor,word])=>assert.ok(!byAnchor[anchor].includes(word),`${word} should have been removed from ${anchor}`));
});

test("all V3 records have exact anchor wheels, complete categories, and strict boundaries",()=>{
  for(const puzzle of puzzles()){
    assert.deepEqual(validate(puzzle),{valid:true,errors:[]},puzzle.id);
    assert.deepEqual(puzzle.wheelLetters,[...puzzle.anchorWord],puzzle.id);
    assert.ok(puzzle.requiredWords.length>=3&&puzzle.requiredWords.length<=5,puzzle.id);
    assert.equal(game.validateCrosswordLayout(puzzle.requiredWords,puzzle.layout).valid,true,puzzle.id);
    assert.ok(puzzle.answers.filter(answer=>answer.category==="financial-anchor").length===1,puzzle.id);
    assert.ok(puzzle.answers.filter(answer=>answer.category!=="bonus").every(answer=>game.canForm(answer.word,puzzle.wheelLetters)),puzzle.id);
  }
});

test("repeated anchor letters remain physical wheel tiles",()=>{
  // CAPITAL (A x2) and DIVIDEND (D x3) were replaced in Phase 3, and ASSET (S x2) in Phase 5; PRINCIPAL (P x2, I x2) and PASSKEY (S x2) keep the repeated-letter coverage.
  const principal=puzzles().find(puzzle=>puzzle.anchorWord==="PRINCIPAL"),passkey=puzzles().find(puzzle=>puzzle.anchorWord==="PASSKEY");
  assert.equal(principal.wheelLetters.filter(letter=>letter==="P").length,2);
  assert.equal(principal.wheelLetters.filter(letter=>letter==="I").length,2);
  assert.equal(passkey.wheelLetters.filter(letter=>letter==="S").length,2);
});

test("Credit receives deterministic V3 identities without editing governed term files",()=>{
  const credit=puzzles().filter(puzzle=>puzzle.worldId==="credit");
  for(const answer of credit.flatMap(puzzle=>puzzle.answers).filter(answer=>answer.category.startsWith("financial-"))){
    assert.equal(answer.termId,`credit.${answer.word.toLowerCase()}`);
    assert.equal(answer.masteryId,answer.termId);
    assert.ok(answer.definition.length>0);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT,"content/credit-game-terms.js"),"utf8"),/"id"\s*:/);
});

test("secondary financial, ordinary, bonus, and duplicate rewards remain isolated",()=>{
  const repayment=puzzles().find(puzzle=>puzzle.anchorWord==="REPAYMENT"),budget=puzzles().find(puzzle=>puzzle.anchorWord==="BUDGET");
  assert.deepEqual(bank.answerReward(repayment,"TERM",{solvedWords:[],rewardedFinancialTermIds:[]}),{coins:28,xp:6,isNewSolve:true,category:"financial-secondary",historyKey:"solvedWords",termId:"credit.term"});
  assert.equal(bank.answerReward(repayment,"TERM",{solvedWords:["TERM"],rewardedFinancialTermIds:[]}).isNewSolve,false);
  assert.equal(bank.answerReward(repayment,"TERM",{solvedWords:[],rewardedFinancialTermIds:["credit.term"]}).isNewSolve,false);
  assert.deepEqual(bank.answerReward(budget,"BED",{rewardedOrdinaryWords:[],rewardedSupportWords:[]}),{coins:1,xp:0,isNewSolve:true,category:"ordinary",historyKey:"rewardedOrdinaryWords",termId:null});
  assert.equal(bank.answerReward(budget,"BED",{rewardedOrdinaryWords:["BED"]}).isNewSolve,false);
  assert.equal(bank.answerReward(budget,"BED",{rewardedSupportWords:["BED"]}).isNewSolve,false,"legacy support rewards must prevent farming after migration");
  assert.deepEqual(bank.answerReward(budget,"DUG",{}),{coins:0,xp:0,isNewSolve:false,category:"invalid",historyKey:null,termId:null});
});

test("financial mastery records by stable identity while ordinary answers create no mastery object",()=>{
  const repayment=puzzles().find(puzzle=>puzzle.anchorWord==="REPAYMENT"),terms=slate.financialLearningTerms([repayment]),storage=memoryStorage(),learning=new learningApi.LearningEngine({terms:[],storage});
  learning.registerTerms(terms);
  learning.recordPuzzleSolved("credit.term");
  assert.equal(learning.save.termProgress["credit.term"].puzzle.timesSolved,1);
  assert.equal(learning.save.termProgress.REST,undefined);
  const reloaded=new learningApi.LearningEngine({terms:[],storage});
  reloaded.registerTerms(terms);
  assert.equal(reloaded.save.termProgress["credit.term"].puzzle.timesSolved,1);
});

test("V3 completion does not inherit old anchor-only or legacy puzzle completion",()=>{
  const payment=puzzles().find(puzzle=>puzzle.anchorWord==="PAYMENT"),history={"ANCHOR-V2:moneybasics:PAYMENT":{timesPlayed:2,lastPlayedAt:10},"OLD-CLUSTER":{timesPlayed:1,lastPlayedAt:5}};
  assert.deepEqual(bank.effectivePuzzleHistory([payment],history,["PAYMENT"]),{});
  const exact={...history,[payment.id]:{timesPlayed:1,lastPlayedAt:20}};
  assert.deepEqual(bank.effectivePuzzleHistory([payment],exact,["PAYMENT"]),{[payment.id]:{timesPlayed:1,lastPlayedAt:20}});
  assert.deepEqual(bank.puzzleProgress([payment],bank.effectivePuzzleHistory([payment],history,["PAYMENT"])),{completed:0,total:1});
});

test("V3 puzzle revision IDs are deterministic and revisions do not collide",()=>{
  const payment=puzzles().find(puzzle=>puzzle.anchorWord==="PAYMENT");
  assert.equal(payment.id,"FQ-V3:moneybasics:PAYMENT:R1");
  assert.equal(payment.contentRevision,1);
  assert.notEqual(payment.id,"ANCHOR-V2:moneybasics:PAYMENT");
});

test("world switching returns only that world's V3 records and keeps histories separate",()=>{
  const vocab=vocabularies(),crypto=slate.createWorldSlate("crypto",vocab.crypto,game,vocab),banking=slate.createWorldSlate("banking",vocab.banking,game,vocab);
  assert.ok(crypto.every(puzzle=>puzzle.worldId==="crypto"));assert.ok(banking.every(puzzle=>puzzle.worldId==="banking"));
  assert.equal(new Set([...crypto,...banking].map(puzzle=>puzzle.id)).size,crypto.length+banking.length);
  const histories={"wg-crypto":{puzzleHistory:{[crypto[0].id]:{timesPlayed:1}}},"wg-banking":{puzzleHistory:{}}};
  assert.equal(bank.puzzleProgress(crypto,histories["wg-crypto"].puzzleHistory).completed,1);
  assert.equal(bank.puzzleProgress(banking,histories["wg-banking"].puzzleHistory).completed,0);
});

test("legacy V1 and V2 behavior remains available outside the preview slate",()=>{
  const legacy={id:"legacy",words:["CASH","PAY","NET"],letters:[..."CASHYPNET"]},model=bank.puzzleModel(legacy);
  assert.equal(model.expanded,false);assert.deepEqual(model.words,legacy.words);
  const v2={id:"v2",puzzleVersion:2,anchorWord:"CASH",supportWords:["ASH","HAS"],bonusWords:[],wheelLetters:[..."CASH"],financialDefinition:"Money.",wordCategories:{CASH:"financial",ASH:"support",HAS:"support"},rewardPolicy:{financial:"existing-first-solve",support:{coins:1,xp:0},bonus:{coins:0,xp:0}}};
  assert.equal(bank.puzzleModel(v2).puzzleVersion,2);
  assert.equal(bank.answerCategory(v2,"ASH"),"support");
});

test("browser runtime uses V3 by default, retains an explicit legacy diagnostic route, and keeps prefix-capable input",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8"),wheel=fs.readFileSync(path.join(ROOT,"src/wheel-interaction.js"),"utf8");
  assert.match(source,/get\("puzzles"\) === "legacy"/);
  assert.match(source,/const WG_V3_ENABLED = !WG_LEGACY_DIAGNOSTIC_ENABLED/);
  assert.match(source,/FinLitV3PuzzleSlate\.createSlate/);
  assert.match(source,/FINLIT_SHARED_PUZZLE_LIBRARY_2027/);
  assert.match(source,/effectivePuzzleHistory/);
  assert.match(source,/recordPuzzleSolved\(termId/);
  assert.match(source,/event\.key === "Enter"[\s\S]+wgSubmitWord\(\)/);
  assert.match(wheel,/extendsToUnfinishedAnswer/);
});

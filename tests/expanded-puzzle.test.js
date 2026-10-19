const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const {ROOT}=require("./helpers.js");
const game=require("../src/game-engine.js");
const bank=require("../src/puzzle-bank-engine.js");
const {generateExpandedCandidate}=require("../src/puzzle-generator.js");
const {assembleExpandedPuzzle,validatePuzzle}=require("../src/puzzle-validator.js");

const anchor={word:"BUDGET",definition:"A plan for income and spending.",termId:"money.budget"};
const supports=["BUDGE","DUET","BED","BUG","TUG","TUB","GET"];

function fixture(){
  const candidate=generateExpandedCandidate(anchor,supports,{
    wheelForFn:game.wheelFor,canFormFn:game.canForm,solveCrosswordFn:game.solveCrossword,
  },{targetMin:8,targetMax:8,bonusWords:["DUG","BUT"],heldWords:["DUE","DEBT","BET"]});
  return assembleExpandedPuzzle(candidate,{id:"RESEARCH-BUDGET-001",worldId:"budgeting",now:()=>"2026-10-13T00:00:00.000Z"});
}

test("expanded generator uses only supplied approved supports and builds the full BUDGET fixture",()=>{
  const puzzle=fixture();
  assert.equal(puzzle.anchorWord,"BUDGET");
  assert.deepEqual(puzzle.supportWords,supports);
  assert.deepEqual(puzzle.bonusWords,["DUG","BUT"]);
  assert.deepEqual([...puzzle.wheelLetters].sort(),[..."BUDGET"].sort());
  ["DUE","DEBT","BET"].forEach(word=>assert.ok(!puzzle.supportWords.includes(word)&&!puzzle.bonusWords.includes(word)));
});

test("expanded schema validates categories, exact wheel, rewards, and strict layout",()=>{
  const result=validatePuzzle(fixture(),{
    canFormFn:game.canForm,wheelForFn:game.wheelFor,solveCrosswordFn:game.solveCrossword,
  });
  assert.deepEqual(result,{valid:true,errors:[]});
});

test("expanded validator rejects a non-minimal wheel and an impossible strict grid",()=>{
  const extra={...fixture(),wheelLetters:[...fixture().wheelLetters,"X"]};
  assert.ok(validatePuzzle(extra,{canFormFn:game.canForm,wheelForFn:game.wheelFor,solveCrosswordFn:game.solveCrossword}).errors.includes("anchorWheelInventory"));
  const impossible={...fixture(),supportWords:["XYZ"],wheelLetters:[..."BUDGETXYZ"],wordCategories:{BUDGET:"financial",XYZ:"support"}};
  assert.ok(validatePuzzle(impossible,{canFormFn:game.canForm,wheelForFn:game.wheelFor,solveCrosswordFn:game.solveCrossword}).errors.includes("strictCrosswordPlaceable"));
});

test("expanded wheels are exactly the anchor letters for CASH, BUDGET, and SAVINGS",()=>{
  const cases=[
    {anchor:{word:"CASH",definition:"Money available to spend."},supports:["AS","HAS","ASH"],expected:[..."CASH"]},
    {anchor,supports,expected:[..."BUDGET"]},
    {anchor:{word:"SAVINGS",definition:"Money set aside for later."},supports:["SAVING","GAIN"],expected:[..."SAVINGS"]},
  ];
  for(const item of cases){
    const candidate=generateExpandedCandidate(item.anchor,item.supports,{wheelForFn:game.wheelFor,canFormFn:game.canForm,solveCrosswordFn:game.solveCrossword},{targetMin:2,targetMax:1+item.supports.length});
    assert.ok(candidate,`${item.anchor.word} should produce a valid research candidate`);
    assert.deepEqual([...candidate.wheelLetters].sort(),item.expected.sort());
  }
  const savings=cases[2].expected;
  assert.equal(savings.filter(letter=>letter==="S").length,2);
});

test("support words cannot add letters, exceed the anchor, or exceed anchor multiplicities",()=>{
  const cash=generateExpandedCandidate({word:"CASH",definition:"Money available to spend."},["AS","CAST","CASHES"],{
    wheelForFn:game.wheelFor,canFormFn:game.canForm,solveCrosswordFn:game.solveCrossword,
  },{targetMin:2,targetMax:4});
  assert.ok(cash);
  assert.deepEqual(cash.supportWords,["AS"]);
  assert.deepEqual(cash.wheelLetters,[..."CASH"]);

  const invalid={...fixture(),supportWords:["BUDGETS"],wordCategories:{...fixture().wordCategories,BUDGETS:"support"}};
  const errors=validatePuzzle(invalid,{canFormFn:game.canForm,wheelForFn:game.wheelFor,solveCrosswordFn:game.solveCrossword}).errors;
  assert.ok(errors.includes("supportWordsFitAnchorWheel"));

  const savingsCandidate=generateExpandedCandidate({word:"SAVINGS",definition:"Money set aside for later."},["SASS","GAIN"],{
    wheelForFn:game.wheelFor,canFormFn:game.canForm,solveCrosswordFn:game.solveCrossword,
  },{targetMin:2,targetMax:3});
  assert.ok(savingsCandidate);
  assert.ok(!savingsCandidate.supportWords.includes("SASS"),"SASS needs three S tiles but SAVINGS supplies two");
});

test("financial anchor keeps the existing first-solve reward formula",()=>{
  const puzzle=fixture();
  assert.deepEqual(bank.answerReward(puzzle,"BUDGET",{solvedWords:[]}),{coins:42,xp:9,isNewSolve:true,category:"financial",historyKey:"solvedWords"});
  assert.deepEqual(bank.answerReward(puzzle,"BUDGET",{solvedWords:["BUDGET"]}),{coins:0,xp:0,isNewSolve:false,category:"financial",historyKey:"solvedWords"});
});

test("support answers pay exactly one coin once and never award XP",()=>{
  const puzzle=fixture();
  assert.deepEqual(bank.answerReward(puzzle,"BUDGE",{rewardedSupportWords:[]}),{coins:1,xp:0,isNewSolve:true,category:"support",historyKey:"rewardedSupportWords"});
  assert.deepEqual(bank.answerReward(puzzle,"BUDGE",{rewardedSupportWords:["BUDGE"]}),{coins:0,xp:0,isNewSolve:false,category:"support",historyKey:"rewardedSupportWords"});
});

test("bonus candidates have no reward and are not required for completion",()=>{
  const puzzle=fixture(),model=bank.puzzleModel(puzzle);
  assert.deepEqual(bank.answerReward(puzzle,"DUG",{}),{coins:0,xp:0,isNewSolve:false,category:"bonus",historyKey:null});
  assert.ok(!model.words.includes("DUG"));
});

test("BUDGET fixture totals 49 first-solve coins and 9 XP",()=>{
  const puzzle=fixture(),words=[puzzle.anchorWord,...puzzle.supportWords];
  const total=words.map(word=>bank.answerReward(puzzle,word,{solvedWords:[],rewardedSupportWords:[]})).reduce((sum,reward)=>({coins:sum.coins+reward.coins,xp:sum.xp+reward.xp}),{coins:0,xp:0});
  assert.deepEqual(total,{coins:49,xp:9});
});

test("legacy puzzles retain financial rewards and their unchanged schema",()=>{
  const legacy={id:"legacy",words:["CASH","PAY","NET"],letters:["A","C","E","H","N","P","S","T","Y"]};
  const model=bank.puzzleModel(legacy);
  assert.equal(model.expanded,false);
  assert.deepEqual(model.words,legacy.words);
  assert.deepEqual(bank.answerReward(legacy,"PAY",{solvedWords:[]}),{coins:21,xp:5,isNewSolve:true,category:"financial",historyKey:"solvedWords"});
});

test("runtime keeps support reward history separate and excludes supports from mastery",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  assert.match(source,/rewardedSupportWords/);
  assert.match(source,/wgIsFinancialCategory\(reward\.category\)[^\n]+recordPuzzleSolved/);
  assert.match(source,/progress\[reward\.historyKey\]\.push\(word\)/);
  assert.match(source,/governedBank\.map\(wgCloneBankPuzzle\)/,"expanded static records must not pass through the legacy words/letters clone");
});

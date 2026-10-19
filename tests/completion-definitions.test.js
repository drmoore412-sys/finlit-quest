const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {ROOT,loadContent}=require("./helpers.js"),bank=require("../src/puzzle-bank-engine.js"),game=require("../src/game-engine.js"),slate=require("../src/v3-puzzle-slate.js"),creditIds=require("../content/credit-term-identities.js"),supplement=require("../content/v3-supplemental-terms.js");

function loadWindow(file,key){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context);return context.window[key]}

function v3Puzzle(){
  const definition="A payment is money transferred to settle a bill or obligation.";
  const puzzle={id:"test",puzzleVersion:3,anchorWord:"PAYMENT",wheelLetters:[..."PAYMENT"],answers:[
    {word:"PAYMENT",category:"financial-anchor",termId:"money.payment",definition},
    {word:"PAY",category:"financial-secondary",termId:"money.pay",definition:"To give money owed for a purchase or service."},
    {word:"NET",category:"ordinary",termId:null,definition:null},
  ]};
  puzzle.layout=game.solveCrossword(puzzle.answers.map(answer=>answer.word)).placements;
  return {puzzle,definition};
}

function resolver(records){
  const byId=new Map(records.map(record=>[record.termId,record]));
  return termId=>byId.get(termId);
}

test("completion summary preserves governed primary and secondary definitions and excludes ordinary words",()=>{
  const {puzzle,definition}=v3Puzzle(),summary=bank.completionLearningSummary(puzzle,resolver([
    {termId:"money.payment",word:"PAYMENT",definition,worldId:"moneybasics"},
    {termId:"money.pay",word:"PAY",definition:"To give money owed for a purchase or service.",worldId:"moneybasics"},
  ]));
  assert.deepEqual(summary.terms,[
    {word:"PAYMENT",definition,termId:"money.payment",worldId:"moneybasics"},
    {word:"PAY",definition:"To give money owed for a purchase or service.",termId:"money.pay",worldId:"moneybasics"},
  ]);
  assert.deepEqual(summary.unresolved,[]);
  assert.equal(JSON.stringify(summary).includes("NET"),false);
});

test("completion definition is independent of rewards and remains exact when prior solves earn zero",()=>{
  const {puzzle,definition}=v3Puzzle();
  assert.equal(bank.answerReward(puzzle,"PAYMENT",{solvedWords:["PAYMENT"],rewardedFinancialTermIds:["money.payment"]}).coins,0);
  assert.equal(bank.completionLearningSummary(puzzle,resolver([{termId:"money.payment",word:"PAYMENT",definition,worldId:"moneybasics"},{termId:"money.pay",word:"PAY",definition:"To give money owed for a purchase or service.",worldId:"moneybasics"}])).terms[0].definition,definition);
});

test("long governed definitions remain unmodified and the modal keeps Next Puzzle accessible",()=>{
  const {puzzle}=v3Puzzle(),longDefinition="Long approved definition. ".repeat(40).trim();
  const summary=bank.completionLearningSummary(puzzle,resolver([{termId:"money.payment",word:"PAYMENT",definition:longDefinition,worldId:"moneybasics"},{termId:"money.pay",word:"PAY",definition:"To give money owed for a purchase or service.",worldId:"moneybasics"}]));
  assert.equal(summary.terms[0].definition,longDefinition);
  const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8"),css=fs.readFileSync(path.join(ROOT,"word-game.css"),"utf8");
  assert.match(html,/role="dialog" aria-modal="true"/);
  assert.match(html,/Financial Terms You Learned/);
  assert.match(html,/id="wgCompleteTerms"/);
  assert.match(html,/id="wgCompleteContinue"/);
  assert.match(css,/\.wg-complete-card\{[^}]*max-height:[^;}]*88vh[^}]*overflow-y:auto/);
  assert.match(css,/\.wg-complete-actions\{[^}]*position:sticky/);
});

test("missing or mismatched permanent IDs are reported without using embedded puzzle definitions",()=>{
  const {puzzle}=v3Puzzle();
  puzzle.answers.push({word:"ZERO",category:"bonus",termId:"money.zero",definition:"Must not appear."});
  const summary=bank.completionLearningSummary(puzzle,resolver([
    {termId:"money.payment",word:"PAYMENT",definition:"Registry definition.",worldId:"moneybasics"},
    {termId:"money.pay",word:"WRONG",definition:"Wrong identity.",worldId:"moneybasics"},
  ]));
  assert.deepEqual(summary.terms,[{word:"PAYMENT",definition:"Registry definition.",termId:"money.payment",worldId:"moneybasics"}]);
  assert.deepEqual(summary.unresolved,[{word:"PAY",termId:"money.pay",worldId:null,reason:"identity word mismatch: registry has WRONG"}]);
  assert.equal(JSON.stringify(summary).includes("Must not appear"),false);
});

test("legacy anchor completion also resolves through its permanent curriculum ID",()=>{
  const puzzle={id:"legacy",worldId:"credit",puzzleVersion:2,anchorWord:"APR",anchorTermId:"credit.apr",supportWords:[],bonusWords:[],wheelLetters:["A","P","R"],financialDefinition:"Stale puzzle copy."};
  const summary=bank.completionLearningSummary(puzzle,resolver([{termId:"credit.apr",word:"APR",definition:"Exact approved definition.",worldId:"credit"}]));
  assert.deepEqual(summary,{terms:[{word:"APR",definition:"Exact approved definition.",termId:"credit.apr",worldId:"credit"}],unresolved:[]});
});

test("every active V3 financial answer resolves to its exact governed record, including cross-world terms",()=>{
  const vocabularies={
    crypto:loadContent().world.terms.map(term=>({word:term.word,definition:term.definition,termId:term.id})),
    credit:loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS").map(term=>({...term,termId:creditIds.idForWord(term.word)})),
    moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),
    banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),
    investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS"),
  };
  const governed=supplement.merge(vocabularies),records=[];
  Object.entries(governed).forEach(([worldId,terms])=>terms.forEach(term=>records.push({termId:term.termId||term.id,word:term.word,definition:term.definition,worldId})));
  const byId=new Map(records.map(record=>[record.termId,record]));
  for(const puzzle of slate.createSlate(vocabularies,game)){
    const summary=bank.completionLearningSummary(puzzle,termId=>byId.get(termId));
    assert.deepEqual(summary.unresolved,[],`${puzzle.id} contains an unresolved curriculum reference`);
    assert.ok(summary.terms.length>=2,`${puzzle.id} should review its financial majority`);
    for(const term of summary.terms)assert.deepEqual(term,byId.get(term.termId));
    for(const answer of puzzle.answers.filter(answer=>answer.category==="ordinary"||answer.category==="bonus"))assert.equal(summary.terms.some(term=>term.word===answer.word),false);
  }
});

test("runtime hard-gates V3 to complete 3-5 answer layouts while leaving legacy routing available",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  assert.match(source,/get\("puzzles"\) === "legacy"/);
  assert.match(source,/const WG_V3_ENABLED = !WG_LEGACY_DIAGNOSTIC_ENABLED/);
  assert.match(source,/model\.words\.length < 3 \|\| model\.words\.length > 5/);
  assert.match(source,/model\.words\.some\(word=>!renderedWords\.has\(word\)\)/);
  assert.match(source,/return wgPlayableBank\(bankState\.puzzleBank\)/);
  assert.match(source,/renderedAnswerCount/);
});

const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {ROOT}=require("./helpers.js"),game=require("../src/game-engine.js"),bank=require("../src/puzzle-bank-engine.js");

function loadWindowFile(file,key){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context);return context.window[key]}

test("actual Money Basics CASH record is adapted to a four-tile single-answer strict puzzle",()=>{
  const raw=loadWindowFile("content/money-basics-puzzle-bank.js","MONEY_BASICS_PUZZLES");
  const terms=loadWindowFile("content/money-basics-terms.js","MONEY_BASICS_TERMS");
  const playable=bank.toAnchorPuzzles(raw,terms.map(term=>({word:term.word,definition:term.definition,termId:term.id})),"moneybasics");
  const cash=playable.find(p=>p.anchorWord==="CASH");
  assert.ok(cash);
  assert.deepEqual(cash.wheelLetters,[..."CASH"]);
  assert.deepEqual(bank.puzzleModel(cash).words,["CASH"]);
  assert.ok(!playable.some(p=>bank.puzzleModel(p).words.join("|")==="CASH|PAY|NET"));
  const layout=game.solveCrossword(["CASH"]);
  assert.equal(layout.ok,true);
  assert.deepEqual(game.validateCrosswordLayout(["CASH"],layout.placements),{valid:true,errors:[]});
});

test("all governed static-world playable puzzles use exactly their anchor wheel and strict boundaries",()=>{
  const worlds=[
    ["moneybasics","content/money-basics-puzzle-bank.js","MONEY_BASICS_PUZZLES","content/money-basics-terms.js","MONEY_BASICS_TERMS"],
    ["banking","content/banking-basics-puzzle-bank.js","BANKING_BASICS_PUZZLES","content/banking-basics-terms.js","BANKING_BASICS_TERMS"],
    ["investing","content/investing-basics-puzzle-bank.js","INVESTING_BASICS_PUZZLES","content/investing-basics-terms.js","INVESTING_BASICS_TERMS"],
  ];
  for(const [worldId,bankFile,bankKey,termsFile,termsKey] of worlds){
    const raw=loadWindowFile(bankFile,bankKey),terms=loadWindowFile(termsFile,termsKey);
    const playable=bank.toAnchorPuzzles(raw,terms.map(term=>({word:term.word,definition:term.definition,termId:term.id})),worldId);
    assert.ok(playable.length>0);
    playable.forEach(puzzle=>{
      assert.deepEqual(puzzle.wheelLetters,[...puzzle.anchorWord]);
      const layout=game.solveCrossword([puzzle.anchorWord]);
      assert.equal(layout.ok,true,`${puzzle.id} should lay out`);
      assert.equal(game.validateCrosswordLayout([puzzle.anchorWord],layout.placements).valid,true);
    });
  }
});

test("dynamic Credit and Crypto style banks are also separated into one approved financial anchor each",()=>{
  const raw=[{id:"DYNAMIC-OLD",words:["TOKEN","COIN"],letters:[..."CEIKNOT"]}];
  const vocabulary=[{word:"TOKEN",definition:"A token."},{word:"COIN",definition:"A coin."}];
  for(const worldId of ["credit","crypto"]){
    const playable=bank.toAnchorPuzzles(raw,vocabulary,worldId);
    assert.deepEqual(playable.map(p=>p.anchorWord),["TOKEN","COIN"]);
    assert.deepEqual(playable.map(p=>p.wheelLetters.join("")),["TOKEN","COIN"]);
    assert.ok(playable.every(p=>p.contentReviewRequired));
  }
});

test("browser runtime retains the legacy anchor adapter for diagnostics, preserves old history, and exposes a loaded-puzzle diagnostic",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  assert.match(source,/return FinLitPuzzleBank\.toAnchorPuzzles\(rawBank/);
  assert.match(source,/effectivePuzzleHistory/);
  assert.doesNotMatch(source,/bankState\.puzzleHistory = \{\}/);
  assert.match(source,/window\.finLitPuzzleDiagnostic = wgPuzzleDiagnostic/);
  assert.match(source,/window\.finLitPuzzleBankDiagnostic = wgPuzzleBankDiagnostic/);
  assert.match(source,/WG_RUNTIME_VERSION = "schema-v4-three-levels-/);
  assert.match(source,/WG_LEGACY_DIAGNOSTIC_ENABLED/);
});

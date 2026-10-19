const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {ROOT}=require("./helpers.js"),game=require("../src/game-engine.js"),bank=require("../src/puzzle-bank-engine.js"),slate=require("../src/v3-puzzle-slate.js");

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

test("every V3 ordinary answer in all 27 puzzles receives the approved non-financial display copy",()=>{
  const puzzles=slate.createSlate(vocabularies(),game),worlds=new Set(),ordinary=[];
  assert.equal(puzzles.length,27);
  for(const puzzle of puzzles){
    worlds.add(puzzle.worldId);
    for(const answer of puzzle.answers.filter(item=>item.category==="ordinary")){
      ordinary.push(answer);
      assert.deepEqual(bank.answerPresentation(answer),{
        heading:`NON-FINANCIAL WORD: ${answer.word}`,
        instruction:"Solve this word to help complete the crossword.",
        reward:"Reward: +1 coin | +0 XP",
        hintPrefix:"Hint for non-financial word",
        revealMessage:"Non-financial word revealed",
        accessibilityLabel:`NON-FINANCIAL WORD: ${answer.word}. Solve this word to help complete the crossword. Reward: +1 coin | +0 XP.`,
      },puzzle.id);
    }
  }
  assert.deepEqual([...worlds].sort(),["banking","credit","crypto","investing","moneybasics"]);
  // 45 before the owner-authorized composition repair; 38 after the cross-world repair; 26 after Phase 3 (eight anchors replaced: their old ordinary words were removed and
  // five editor-selected ordinary words were added: PLAIN, SOCK, READ, TUNE and LOB (Phase 4 replaced COB with LOB)).
  // Phase 5 (owner-approved): WALLET, ASSET and the old CHAIN/GROWTH ordinary words (INCH, WALL, TELL, SEAT, EAST, THROW) left; COME joined: 21.
  assert.equal(ordinary.length,21);
});

test("financial and bonus categories never receive non-financial presentation copy",()=>{
  const puzzles=slate.createSlate(vocabularies(),game);
  for(const answer of puzzles.flatMap(puzzle=>puzzle.answers).filter(item=>item.category!=="ordinary"))assert.equal(bank.answerPresentation(answer),null);
  assert.equal(bank.answerPresentation({word:"EXTRA",category:"bonus"}),null);
});

test("legacy support answers use the new display term without changing their internal category",()=>{
  const answer={word:"ASH",category:"support"},copy=bank.answerPresentation(answer);
  assert.equal(copy.heading,"NON-FINANCIAL WORD: ASH");
  assert.equal(answer.category,"support");
});

test("terminology changes presentation only and preserves the one-coin zero-XP reward rule",()=>{
  const puzzle=slate.createSlate(vocabularies(),game).find(item=>item.answers.some(answer=>answer.category==="ordinary"));
  const answer=puzzle.answers.find(item=>item.category==="ordinary");
  assert.deepEqual(bank.answerReward(puzzle,answer.word,{rewardedOrdinaryWords:[],rewardedSupportWords:[]}),{coins:1,xp:0,isNewSolve:true,category:"ordinary",historyKey:"rewardedOrdinaryWords",termId:null});
  assert.equal(answer.category,"ordinary");
});

test("mission, definitions, hints, rewards, and accessibility use the centralized copy",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8"),html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
  assert.match(source,/answerPresentation\?\.\(answer/);
  assert.match(source,/presentation\?\.heading/);
  assert.match(source,/presentation\?\.instruction/);
  assert.match(source,/presentation\?\.reward/);
  assert.match(source,/presentation\.accessibilityLabel/);
  assert.match(source,/presentation\.hintPrefix/);
  assert.match(source,/presentation\?\.revealMessage/);
  assert.doesNotMatch(source,/Ordinary crossword word|Complete this ordinary crossword word|Ordinary word revealed/i);
  assert.match(html,/id="wgMissionCard" aria-live="polite"/);
  assert.match(html,/id="wgMissionRewardLabel"/);
});

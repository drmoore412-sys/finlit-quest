const test=require("node:test"),assert=require("node:assert/strict");
const {puzzleId,buildOneCandidate,buildBank,selectPlaythrough,recordPlaythrough,wordReward,isFirstLevelPractice,hintCost,canAffordHint,puzzleProgress,hasPrefixConflict}=require("../src/puzzle-bank-engine.js");
const {wheelFor}=require("../src/game-engine.js");

const VOCAB=["TOKEN","NODE","COIN","MINT","POOL","LOCK","BLOCK","FORK","HASH","GAS","CHAIN","YIELD","LEDGER","PEER","STAKE","SWAP","VAULT","WALLET","MINER","BURN"];
function shuffled(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

// A large, letter-diverse synthetic vocabulary (short CVC-style words) so bank
// sizes well beyond Crypto/Credit's real vocabularies (50, 150) are actually
// reachable in tests, matching the configuration examples in the spec.
function makeVocab(n){
  const consonants=[..."BCDFGHJKLMNPQRSTVWXYZ"],vowels=[..."AEIOU"];
  const words=new Set();
  outer:
  for(const c1 of consonants)for(const v of vowels)for(const c2 of consonants){
    words.add(c1+v+c2);
    if(words.size>=n)break outer;
  }
  return [...words];
}

test("puzzleId is stable regardless of word order",()=>{
  assert.equal(puzzleId(["TOKEN","COIN"]),puzzleId(["COIN","TOKEN"]));
});

// Confirmed live 2026-07-23: the shared word-game engine submits a word the
// moment a player's letter selection spells any known answer in the puzzle
// (word-game-app.js's wgAddLetter). If a puzzle contains both a word and a
// strict prefix of that word (e.g. PAY and PAYCHECK), selecting the prefix's
// letters always auto-submits it first, making the longer word structurally
// unsolvable — on drag input or discrete taps alike. buildOneCandidate must
// never produce such a pairing, the same way it already refuses to exceed
// the wheel budget.
test("hasPrefixConflict detects a word that is a strict prefix of another word in the list",()=>{
  assert.equal(hasPrefixConflict(["PAY","PAYCHECK"]),true);
  assert.equal(hasPrefixConflict(["PAYCHECK","PAY"]),true,"direction of the list must not matter");
  assert.equal(hasPrefixConflict(["CASH","PAY","NET"]),false);
  assert.equal(hasPrefixConflict(["NET","NETWORK","ROUTING"]),true);
});
test("hasPrefixConflict does not flag equal-length or unrelated words",()=>{
  assert.equal(hasPrefixConflict(["CAT","BAT"]),false);
  assert.equal(hasPrefixConflict(["SAME","SAME"]),false,"identical words at different positions aren't a prefix relationship");
});
test("buildOneCandidate never returns a candidate containing a word that prefixes another",()=>{
  const vocab=["CASH","PAY","PAYCHECK","NET"];
  for(let i=0;i<200;i++){
    const candidate=buildOneCandidate(vocab,shuffled,wheelFor);
    if(candidate)assert.equal(hasPrefixConflict(candidate.words),false,`got a conflicting candidate: ${candidate.words.join(",")}`);
  }
});

test("buildBank produces at least the requested number of distinct puzzles",()=>{
  const bank=buildBank(VOCAB,10,shuffled,wheelFor);
  assert.ok(bank.length>=10,"must reach at least the requested size");
  const ids=new Set(bank.map(p=>p.id));
  assert.equal(ids.size,bank.length,"all bank entries must be distinct puzzles");
  bank.forEach(p=>assert.ok(p.words.length>=2&&p.letters.length<=9));
});

// buildBank may need to grow past the requested size to guarantee every
// vocabulary word is reachable (see the coverage test below) — it is a
// floor, not an exact count.
test("buildBank supports different sizes without code changes (10, 15, 20)",()=>{
  [10,15,20].forEach(size=>{
    const bank=buildBank(VOCAB,size,shuffled,wheelFor);
    assert.ok(bank.length>=size,`expected at least a bank of size ${size}`);
  });
});

test("buildBank tops up an existing bank rather than discarding it",()=>{
  const first=buildBank(VOCAB,5,shuffled,wheelFor);
  const topped=buildBank(VOCAB,10,shuffled,wheelFor,first);
  assert.ok(topped.length>=10);
  first.forEach(p=>assert.ok(topped.some(q=>q.id===p.id),"original entries must be preserved"));
});

// V1.0 Blocker 6: confirmed live that a 10-slot bank drawn from Crypto's real
// 20-word vocabulary permanently omitted 3 words (MINT, LEDGER, MINER) for
// the lifetime of a save, since the bank is only topped up when short of
// size and never re-checked for coverage. Every word must be reachable.
test("buildBank guarantees every vocabulary word appears in at least one puzzle",()=>{
  const bank=buildBank(VOCAB,10,shuffled,wheelFor);
  const covered=new Set(bank.flatMap(p=>p.words));
  const missing=VOCAB.filter(w=>!covered.has(w));
  assert.deepEqual(missing,[],`expected full coverage, missing: ${missing.join(", ")}`);
});

test("selectPlaythrough with no history returns a random 5 from the bank",()=>{
  const bank=buildBank(VOCAB,10,shuffled,wheelFor);
  const selection=selectPlaythrough(bank,{},[],5,shuffled);
  assert.equal(selection.length,5);
  const ids=new Set(selection.map(p=>p.id));
  assert.equal(ids.size,5,"selection must be unique puzzles");
  selection.forEach(p=>assert.ok(bank.some(b=>b.id===p.id)));
});

test("selectPlaythrough prefers never-played puzzles over played ones",()=>{
  // buildBank is a floor, not an exact count (it may grow to guarantee
  // coverage) — take a fixed first-10 slice so this test's own 8/2 played
  // split stays exact regardless of how many entries buildBank returned.
  const bank=buildBank(VOCAB,10,shuffled,wheelFor).slice(0,10);
  // Mark 8 of 10 as played, leave 2 never-played.
  const history={};
  bank.slice(0,8).forEach((p,i)=>{history[p.id]={timesPlayed:1,lastPlayedAt:1000+i}});
  const neverPlayedIds=new Set(bank.slice(8).map(p=>p.id));
  const selection=selectPlaythrough(bank,history,[],5,shuffled);
  const selectedNeverPlayed=selection.filter(p=>neverPlayedIds.has(p.id));
  assert.equal(selectedNeverPlayed.length,2,"both never-played puzzles should be included first");
});

test("selectPlaythrough prefers least-recently-played among played puzzles",()=>{
  const bank=buildBank(VOCAB,7,shuffled,wheelFor);
  // All played (no never-played available), with distinct lastPlayedAt timestamps.
  const history={};
  bank.forEach((p,i)=>{history[p.id]={timesPlayed:1,lastPlayedAt:i}}); // bank[0] is oldest (least recent)
  const selection=selectPlaythrough(bank,history,[],5,list=>list); // identity shuffle to inspect order deterministically
  const selectedIds=new Set(selection.map(p=>p.id));
  const expectedLeastRecent=bank.slice(0,5).map(p=>p.id);
  expectedLeastRecent.forEach(id=>assert.ok(selectedIds.has(id),`expected least-recently-played ${id} to be selected`));
});

test("selectPlaythrough avoids more than two overlaps with the previous playthrough when possible",()=>{
  const bank=buildBank(VOCAB,10,shuffled,wheelFor);
  const history={};
  bank.forEach((p,i)=>{history[p.id]={timesPlayed:1,lastPlayedAt:i}});
  const lastPlaythrough=bank.slice(0,5).map(p=>p.id);
  const selection=selectPlaythrough(bank,history,lastPlaythrough,5,shuffled);
  const overlap=selection.filter(p=>lastPlaythrough.includes(p.id));
  assert.ok(overlap.length<=2,`expected at most 2 overlaps with the previous playthrough, got ${overlap.length}`);
});

test("selectPlaythrough falls back to overlapping puzzles when the bank is too small to avoid it",()=>{
  const bank=buildBank(VOCAB,5,shuffled,wheelFor); // bank size equals playthrough size
  const history={};
  bank.forEach((p,i)=>{history[p.id]={timesPlayed:1,lastPlayedAt:i}});
  const lastPlaythrough=bank.map(p=>p.id); // entire previous playthrough == entire bank
  const selection=selectPlaythrough(bank,history,lastPlaythrough,5,shuffled);
  assert.equal(selection.length,5,"must still return a full playthrough even though overlap is unavoidable");
});

test("recordPlaythrough increments timesPlayed and updates lastPlayedAt for played puzzles only",()=>{
  const history=recordPlaythrough({},["a","b"],1000);
  assert.deepEqual(history,{a:{timesPlayed:1,lastPlayedAt:1000},b:{timesPlayed:1,lastPlayedAt:1000}});
  const again=recordPlaythrough(history,["a"],2000);
  assert.equal(again.a.timesPlayed,2);
  assert.equal(again.a.lastPlayedAt,2000);
  assert.equal(again.b.timesPlayed,1,"untouched puzzle must be preserved unchanged");
});

// wordReward: a word's vocabulary is shared across multiple puzzles/playthroughs
// (e.g. "CHAIN" can appear in two different clusters), so this must pay out only
// on the first-ever solve of a given word, never on a repeat encounter — this is
// the exact bug reproduced live during Blocker 4 (XP doubled on a repeat solve).
test("wordReward pays coins/xp for a word not in solvedWords",()=>{
  const reward=wordReward("MINT",[]);
  assert.equal(reward.isNewSolve,true);
  assert.equal(reward.coins,"MINT".length*7);
  assert.equal(reward.xp,Math.round("MINT".length*1.5));
});
test("wordReward pays nothing for a word already in solvedWords",()=>{
  const reward=wordReward("MINT",["MINT","CHAIN"]);
  assert.deepEqual(reward,{coins:0,xp:0,isNewSolve:false});
});
test("wordReward treats a missing/undefined solvedWords list as empty rather than throwing",()=>{
  assert.equal(wordReward("GAS",undefined).isNewSolve,true);
});

test("the first unpassed puzzle is the free-hint practice level",()=>{
  assert.equal(isFirstLevelPractice(false,"puzzle-1","puzzle-1"),true);
  assert.equal(isFirstLevelPractice(false,"puzzle-2","puzzle-1"),false);
  assert.equal(isFirstLevelPractice(true,"puzzle-1","puzzle-1"),false);
});

// Tutorial (first-level) hints: free, unlimited, never blocked by balance.
// Using them does not affect whether the puzzle can be completed — that's
// governed entirely by isFirstLevelPractice/firstPuzzlePassed above, not by
// whether a hint was used during the attempt.
test("hintCost is zero on the tutorial level regardless of the governed price",()=>{
  assert.equal(hintCost(true,100),0);
  assert.equal(hintCost(true,300),0);
});
test("hintCost returns the governed price once the tutorial level is passed",()=>{
  assert.equal(hintCost(false,100),100);
  assert.equal(hintCost(false,300),300);
});
test("canAffordHint always allows a zero-cost (tutorial) hint regardless of balance",()=>{
  assert.equal(canAffordHint(0,0),true);
  assert.equal(canAffordHint(-5,0),true);
  assert.equal(canAffordHint(undefined,0),true);
});
test("canAffordHint enforces the governed price once it is non-zero",()=>{
  assert.equal(canAffordHint(50,100),false);
  assert.equal(canAffordHint(100,100),true);
  assert.equal(canAffordHint(150,100),true);
});

// Progress must reflect completed puzzles, not vocabulary terms — a world
// with N puzzle-bank entries and 0 completions shows 0/N, not (vocab size).
test("puzzleProgress counts completed puzzles against the active bank size, not vocabulary terms",()=>{
  const bank=[{id:"p1"},{id:"p2"},{id:"p3"}];
  assert.deepEqual(puzzleProgress(bank,{}),{completed:0,total:3});
  assert.deepEqual(puzzleProgress(bank,{p1:{timesPlayed:1}}),{completed:1,total:3});
  assert.deepEqual(puzzleProgress(bank,{p1:{timesPlayed:2},p2:{timesPlayed:1},p3:{timesPlayed:0}}),{completed:2,total:3});
});
test("puzzleProgress handles a missing/undefined history without throwing",()=>{
  assert.deepEqual(puzzleProgress([{id:"p1"}],undefined),{completed:0,total:1});
});

// Configurable playthrough size: requiredPuzzles is a per-world config value fed
// straight into selectPlaythrough's `count` parameter — the engine itself never
// assumes 5. Each pair below matches a configuration example from the spec.
for(const [bankSize,requiredPuzzles] of [[10,5],[15,5],[20,8],[50,10],[150,15]]){
  test(`bankSize ${bankSize} / requiredPuzzles ${requiredPuzzles}: builds the full bank and selects exactly requiredPuzzles unique puzzles`,()=>{
    const vocab=makeVocab(Math.max(60,bankSize*3));
    const bank=buildBank(vocab,bankSize,shuffled,wheelFor);
    assert.ok(bank.length>=bankSize,`expected at least a full bank of ${bankSize}`);
    const selection=selectPlaythrough(bank,{},[],requiredPuzzles,shuffled);
    assert.equal(selection.length,requiredPuzzles,`expected exactly ${requiredPuzzles} puzzles selected`);
    assert.equal(new Set(selection.map(p=>p.id)).size,requiredPuzzles,"selected puzzles must be unique");
  });
}

test("different worlds can use different requiredPuzzles values independently in the same run",()=>{
  const vocabA=makeVocab(60),vocabB=makeVocab(200);
  const bankA=buildBank(vocabA,20,shuffled,wheelFor);
  const bankB=buildBank(vocabB,50,shuffled,wheelFor);
  const selectionA=selectPlaythrough(bankA,{},[],8,shuffled);
  const selectionB=selectPlaythrough(bankB,{},[],10,shuffled);
  assert.equal(selectionA.length,8);
  assert.equal(selectionB.length,10);
});

test("anti-repetition rules still hold with a non-default requiredPuzzles value",()=>{
  const vocab=makeVocab(80);
  const bank=buildBank(vocab,20,shuffled,wheelFor);
  const requiredPuzzles=8;
  const history={};
  bank.forEach((p,i)=>{history[p.id]={timesPlayed:1,lastPlayedAt:i}});
  const lastPlaythrough=bank.slice(0,requiredPuzzles).map(p=>p.id);
  const selection=selectPlaythrough(bank,history,lastPlaythrough,requiredPuzzles,shuffled);
  const overlap=selection.filter(p=>lastPlaythrough.includes(p.id));
  assert.equal(selection.length,requiredPuzzles);
  assert.ok(overlap.length<=2,`expected at most 2 overlaps, got ${overlap.length}`);
});

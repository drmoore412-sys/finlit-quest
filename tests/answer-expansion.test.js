// Phase 2b (owner-authorized 2026-11-18): the exhaustive-answer rule. Every approved financial term in the reconciled 207-term dictionary that a
// puzzle's wheel can spell is a required answer, in all 58 canonical puzzles and all 61 active unified levels. Puzzle IDs and anchors never change.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process");
const {ROOT}=require("./helpers.js");
const H=require("./unified-release-helpers.js");
const A=require("../src/answer-expansion.js"),G=require("../src/game-engine.js"),bank=require("../src/puzzle-bank-engine.js"),P=require("../src/unified-progress.js");
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f),"utf8")),text=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const manifest=read("content/answer-expansion-v1.json"),dictionary=A.loadDictionary(ROOT),canon=H.canonicalMap();
const sequencePuzzles=read("content/unified-prototype-12-puzzles-dev.json").puzzles;
const allPuzzles=[...canon.values(),...sequencePuzzles];

test("the reconciled dictionary has exactly 211 approved terms (207 + the four Crypto terms restored under CAL-0012) from the seven content files",()=>{
  assert.equal(A.EXPECTED_TERM_COUNT,211);assert.equal(dictionary.size,211);assert.equal(A.SOURCES.length,7);
  assert.equal(manifest.dictionary.termCount,211);
});

test("every one of the 58 canonical puzzles requires every approved term its wheel can spell",()=>{
  assert.equal(canon.size,58);
  for(const puzzle of canon.values())assert.deepEqual(A.missingAnswers(puzzle,dictionary),[],puzzle.id);
});

test("the nine unified-sequence puzzles are exhaustive too",()=>{
  assert.equal(sequencePuzzles.length,9);
  for(const puzzle of sequencePuzzles)assert.deepEqual(A.missingAnswers(puzzle,dictionary),[],puzzle.id);
});

test("every required answer is spellable from its wheel, using each physical tile at most once",()=>{
  for(const puzzle of allPuzzles){
    const wheel=puzzle.wheelLetters;
    for(const word of A.requiredWordsOf(puzzle))assert.ok(G.canForm(word,wheel)&&A.spellable(word,wheel),`${puzzle.id} ${word}`);
  }
});

test("totals: 44 puzzles (35 canonical + 9 sequence) gained 113 answer occurrences (73 + 40)",()=>{
  assert.equal(manifest.totals.puzzles,44);assert.equal(manifest.totals.addedOccurrences,113);
  const records=Object.entries(manifest.puzzles),sequenceIds=new Set(sequencePuzzles.map(p=>p.id));
  const sequence=records.filter(([id])=>sequenceIds.has(id)),canonical=records.filter(([id])=>!sequenceIds.has(id));
  assert.equal(canonical.length,35);assert.equal(sequence.length,9);
  assert.equal(canonical.reduce((n,[,r])=>n+r.added.length,0),73);assert.equal(sequence.reduce((n,[,r])=>n+r.added.length,0),40);
  assert.equal(records.reduce((n,[,r])=>n+r.added.length,0),113);
});

test("IDs and anchors are preserved: no puzzle was added, removed, renamed or re-anchored",()=>{
  const index=read("content/shared-puzzle-library-2027.json").canonicalPuzzleIndex;
  assert.equal(index.length,58);assert.deepEqual([...canon.keys()].sort(),index.map(x=>x.id).sort());
  for(const [id,record] of Object.entries(manifest.puzzles)){
    const puzzle=canon.get(id)||sequencePuzzles.find(p=>p.id===id);
    assert.ok(puzzle,`${id} exists`);assert.equal(puzzle.anchorWord,record.anchorWord);
    assert.ok(new RegExp(`:${record.anchorWord}:R\\d+$`).test(id),`${id} still encodes its anchor and revision`);
    assert.deepEqual([...record.previousRequiredWords,...record.added.map(a=>a.word)].sort(),[...record.requiredWords].sort(),`${id} previous + added = required`);
    record.previousRequiredWords.forEach(word=>assert.ok(record.requiredWords.includes(word),`${id} keeps ${word}`));
    assert.deepEqual([...A.requiredWordsOf(puzzle)].sort(),[...record.requiredWords].sort(),`${id} manifest matches the shipped puzzle`);
  }
});

test("each key term uses the wheel exactly; the seven v3 sequence puzzles do so after their declared extra letters",()=>{
  for(const puzzle of canon.values()){
    assert.deepEqual([...puzzle.wheelLetters].sort(),[...puzzle.anchorWord].sort(),puzzle.id);
    assert.equal(A.anchorUsesWheelExactly(puzzle),true,puzzle.id);
  }
  let withExtras=0;
  for(const puzzle of sequencePuzzles){
    const extras=puzzle.declaredExtraLetters||[];if(extras.length)withExtras++;
    assert.deepEqual([...puzzle.wheelLetters].sort(),[...puzzle.anchorWord,...extras].sort(),puzzle.id);
    assert.equal(A.anchorUsesWheelExactly(puzzle),true,puzzle.id);
  }
  // Documented limit of the literal rule: those puzzles' wheels carry letters beyond the key term by owner-approved design (declaredExtraLetters).
  assert.equal(withExtras,7);
});

test("the expansion manifest is fresh: regenerating its check from the shipped sources reports no drift",()=>{
  const out=cp.execFileSync("node",["scripts/build-answer-expansion.mjs","check"],{cwd:ROOT,encoding:"utf8"});
  assert.match(out,/expansion manifest matches sources/);
});

test("release validation rejects a puzzle that is missing a spellable approved term, and an anchor that does not spell its wheel",()=>{
  const Rel=require("../src/unified-release.js"),S=require("../src/unified-sequence.js"),R=require("../src/composition-rules.js");
  const deps={Sequence:S,Rules:R,canFormFn:G.canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout,Expansion:A};
  const gated=read("content/unified-sequence-v3-dev.json"),replaced=new Set(gated.retired.map(r=>r.puzzleId)),active=[...sequencePuzzles.filter(p=>!replaced.has(p.id)),...read("content/unified-exact-wheel-revisions-dev.json").puzzles],ids=new Set(active.map(p=>p.id));gated.devOnly=false;gated.entries.forEach(e=>{if(ids.has(e.puzzleId))e.releaseStatus="approved"});
  const canonicalIds=new Set(read("content/shared-puzzle-library-2027.json").canonicalPuzzleIndex.map(x=>x.id));
  const run=(canonicalPuzzles,puzzles)=>Rel.validateRelease({manifest:gated,baseline:read("content/unified-legacy-v2-baseline.json"),canonicalPuzzles,canonicalIds,puzzles,whitelist:read("content/unified-prototype-12-whitelist-dev.json"),termDefinitions:H.termDefinitions(),sha256:H.sha256,dictionary},deps);
  const seq=new Map(active.map(p=>[p.id,p]));
  const ok=run(canon,seq);assert.deepEqual(ok.errors,[]);assert.equal(ok.summary.exhaustiveVerified,61);
  // an active legacy puzzle that lost ATM
  const dropped=new Map(canon),puzzle=structuredClone(canon.get("FQ-V3:moneybasics:PAYMENT:R1"));puzzle.answers=puzzle.answers.filter(a=>a.word!=="ATM");puzzle.requiredWords=puzzle.requiredWords.filter(w=>w!=="ATM");dropped.set(puzzle.id,puzzle);
  assert.ok(run(dropped,seq).errors.some(e=>/PAYMENT:R1: notExhaustive ATM/.test(e)));
  // an upgraded puzzle that lost a spellable term
  const trimmed=new Map(seq),upgraded=structuredClone(seq.get("FQ-V3:credit:REPAYMENT:R2")),gone=A.requiredWordsOf(upgraded).find(w=>w==="ATM");
  upgraded.answers=upgraded.answers.filter(a=>a.word!==gone);upgraded.requiredWords=upgraded.requiredWords.filter(w=>w!==gone);trimmed.set(upgraded.id,upgraded);
  assert.ok(run(canon,trimmed).errors.some(e=>/REPAYMENT:R2: notExhaustive ATM/.test(e)));
  // an anchor that no longer spells its wheel
  const bad=new Map(canon),wrong=structuredClone(canon.get("FQ-V3:credit:TERMS:R1"));wrong.wheelLetters=[...wrong.wheelLetters,"Z"];bad.set(wrong.id,wrong);
  assert.ok(run(bad,seq).errors.some(e=>/TERMS:R1: anchorDoesNotSpellWheel/.test(e)));
});

// ---- added-answer reward guard -------------------------------------------------------------------------------------------------------
const REPAYMENT="FQ-V3:credit:REPAYMENT:R1";
const repayment=canon.get(REPAYMENT),record=manifest.puzzles[REPAYMENT],ADDED=record.added.map(a=>a.word),PREVIOUS=record.previousRequiredWords;
const completedBefore=()=>bank.canonicalPuzzleRecord({timesCompleted:1,rewardedAnswers:PREVIOUS,firstCompletedAt:1,lastCompletedAt:2,worldIds:["credit"]});
const fresh=()=>bank.canonicalPuzzleRecord();

test("reward guard: a player who already completed the puzzle earns no coins or XP for answers added later",()=>{
  assert.ok(ADDED.length>=8);
  for(const word of ADDED){
    const reward=bank.canonicalAnswerReward(repayment,word,{},completedBefore(),manifest);
    assert.deepEqual([reward.coins,reward.xp,reward.isNewSolve],[0,0,false],word);assert.equal(reward.guard,"added-answer-on-completed-puzzle");
  }
});

test("reward guard: new players and players who have not completed the puzzle are paid normally for every answer",()=>{
  for(const record of [fresh(),bank.canonicalPuzzleRecord({timesCompleted:0,rewardedAnswers:[repayment.anchorWord]})])
    for(const word of [...ADDED,...PREVIOUS.filter(w=>w!==repayment.anchorWord)]){
      const reward=bank.canonicalAnswerReward(repayment,word,{},record,manifest),plain=bank.answerReward(repayment,word,{});
      assert.deepEqual([reward.coins,reward.xp,reward.isNewSolve],[plain.coins,plain.xp,plain.isNewSolve],word);
      assert.ok(reward.coins>0&&reward.isNewSolve,`${word} pays a new player`);
    }
});

test("reward guard: original answers on a completed puzzle are unaffected by the guard, and the guard is idempotent and never mutates the record",()=>{
  const rec=completedBefore(),snapshot=JSON.stringify(rec);
  for(const word of PREVIOUS){
    const reward=bank.canonicalAnswerReward(repayment,word,{},rec,manifest);
    assert.equal(reward.coins,0);assert.equal(reward.isNewSolve,false);assert.equal(reward.guard,undefined,"already-rewarded answers are not 'guarded'");
  }
  for(const word of ADDED){bank.canonicalAnswerReward(repayment,word,{},rec,manifest);bank.canonicalAnswerReward(repayment,word,{},rec,manifest)}
  assert.equal(JSON.stringify(rec),snapshot);
  assert.equal(bank.isAddedAnswer(manifest,REPAYMENT,ADDED[0]),true);assert.equal(bank.isAddedAnswer(manifest,REPAYMENT,PREVIOUS[0]),false);
  assert.equal(bank.isAddedAnswer(null,REPAYMENT,ADDED[0]),false);
});

test("reward guard: puzzles that were not expanded are unaffected, and a missing manifest changes nothing",()=>{
  const untouched=[...canon.values()].find(p=>!manifest.puzzles[p.id]);assert.ok(untouched);
  const word=A.requiredWordsOf(untouched)[1],rec=bank.canonicalPuzzleRecord({timesCompleted:3,rewardedAnswers:[]});
  assert.deepEqual(bank.canonicalAnswerReward(untouched,word,{},rec,manifest),bank.canonicalAnswerReward(untouched,word,{},rec,null));
  assert.equal(bank.canonicalAnswerReward(repayment,ADDED[0],{},completedBefore(),null).coins>0,true,"without the manifest nothing is guarded (the page always loads it)");
});

test("reward guard: learning mastery credit is recorded independently of coins and XP",()=>{
  const src=text("word-game-app.js"),block=src.slice(src.indexOf("if (reward.isNewSolve) {"),src.indexOf("learning.save.canonicalPuzzleProgress[wgState.puzzle.id]"));
  assert.doesNotMatch(block,/recordPuzzleSolved/,"mastery is not inside the reward branch");
  assert.match(src,/if \(wgIsFinancialCategory\(reward\.category\) && termId && \(FinLitPuzzleBank\.isV3Puzzle\?\.\(wgState\.puzzle\) \|\| wgState\.worldId === "crypto"\)\) learning\.recordPuzzleSolved\(termId/);
  const addedTermId=repayment.answers.find(a=>a.word===ADDED[0]).termId;
  assert.ok(addedTermId,"added answers carry a permanent term ID so mastery can be credited");
});

test("migration and progression: completed puzzles stay completed after expansion, and no save field is rewritten",()=>{
  const v1=read("content/unified-sequence-dev.json"),g={coins:7,xp:9,termProgress:{},canonicalPuzzleProgress:{}};
  v1.entries.forEach(e=>{g.canonicalPuzzleProgress[e.puzzleId]={timesCompleted:1,rewardedAnswers:manifest.puzzles[e.puzzleId]?manifest.puzzles[e.puzzleId].previousRequiredWords:[]}});
  const before=JSON.stringify(g.canonicalPuzzleProgress);
  P.apply(g,v1,"2026-11-18T00:00:00Z");
  assert.equal(JSON.stringify(g.canonicalPuzzleProgress),before,"unified progression never edits canonical progress");
  const states=P.levelStates(g,v1,"2026-11-18T00:00:00Z");
  assert.equal(states.length,58);assert.equal(states.every(s=>s.state==="completed"),true);
  assert.deepEqual([g.coins,g.xp],[7,9]);
});

test("migration: the canonical-progress migration keeps completed history and never lowers a count; running it twice changes nothing",()=>{
  const puzzles=[...canon.values()];
  const worlds={"wg-credit":{puzzleHistory:{[REPAYMENT]:{timesPlayed:2,lastPlayedAt:1760000000000}}}};
  const once=bank.migrateCanonicalPuzzleProgress({},puzzles,worlds,{"wg-credit":"credit"});
  assert.equal(once[REPAYMENT].timesCompleted,2);
  const twice=bank.migrateCanonicalPuzzleProgress(once,puzzles,worlds,{"wg-credit":"credit"});
  assert.deepEqual(twice,once);
  assert.equal(bank.canonicalAnswerReward(repayment,ADDED[0],{},once[REPAYMENT],manifest).coins,0,"a player migrated from legacy world history is guarded as well");
  const unplayed=bank.migrateCanonicalPuzzleProgress({},puzzles,{},{});
  assert.deepEqual(unplayed,{});
});

test("save version stays 4 and nothing in the save schema changes for this release",()=>{
  const L=require("../learning-engine.js");assert.equal(L.SAVE_VERSION||4,4);
  assert.match(text("content/answer-expansion-v1.json"),/"rewardGuard"/);
});

// ---- layout and phones ------------------------------------------------------------------------------------------------------------------
test("every expanded puzzle has a legal, connected crossword layout stored in the manifest",()=>{
  for(const [id,r] of Object.entries(manifest.puzzles)){
    const puzzle=canon.get(id)||sequencePuzzles.find(p=>p.id===id);
    assert.equal(G.validateCrosswordLayout(r.requiredWords,r.layout).valid,true,id);
    assert.equal(G.validateCrosswordLayout(A.requiredWordsOf(puzzle),puzzle.layout).valid,true,id);
    assert.ok(r.requiredWords.length>=3&&r.requiredWords.length<=14,`${id} has ${r.requiredWords.length} answers`);
  }
  assert.equal(Math.max(...Object.values(manifest.puzzles).map(r=>r.requiredWords.length)),14,"the densest puzzle (MARKETING) has 14 answers");
});

test("phone fit report: only MARKETING is below 20 px at 375x667 and only MARKETING and TRIPDELAY at 320x568; zoom covers those",()=>{
  const below=key=>Object.entries(manifest.puzzles).filter(([,r])=>r.cellFit[key]<20).map(([id,r])=>`${r.anchorWord}:${r.cellFit[key]}`).sort();
  assert.deepEqual(below("phone375x667"),["MARKETING:18.9"]);
  assert.deepEqual(below("phone320x568"),["MARKETING:15.1","TRIPDELAY:19.63"]);
  const Z=require("../src/dense-grid-zoom.js");
  assert.equal(Z.zoomNeeded(18.9),true);assert.equal(Z.zoomNeeded(24),false);
  assert.ok(Z.maxScaleFor(15.1)*15.1>=29.9,"zoom lifts the smallest cell to the 30 px target");
  assert.equal(Z.maxScaleFor(30),1);
});

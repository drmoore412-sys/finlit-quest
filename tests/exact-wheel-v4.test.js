// Phase 2b (owner-approved 2026-11-18): exact-wheel puzzles under composition rule v4.
//  - every wheel is exactly the letters of its financial key term, repeated letters included, with no exceptions
//  - rule v4 allows a minimum of one required financial answer and no filler / direct-support / three-substantive-term requirements
//  - every approved (211-term) financial term the wheel can spell is a required answer
//  - the seven corrected puzzles are new revisions that replace their predecessors; rewards already earned never pay twice
//  - previous rule versions (v1, v2, v3) stay frozen and keep validating the historical records
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {ROOT}=require("./helpers.js");
const H=require("./unified-release-helpers.js");
const S=require("../src/unified-sequence.js"),R=require("../src/composition-rules.js"),G=require("../src/game-engine.js"),Rel=require("../src/unified-release.js"),L=require("../src/unified-prototype-loader.js"),A=require("../src/answer-expansion.js"),P=require("../src/unified-progress.js"),Sha=require("../src/sha256.js"),PV=require("../src/puzzle-validator.js");
const bank=require("../src/puzzle-bank-engine.js");
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f),"utf8")),text=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const dictionary=A.loadDictionary(ROOT),canon=H.canonicalMap(),canonicalIds=new Set(canon.keys());
const levels=()=>structuredClone(require("../content/unified-levels-v2.js"));
const v2Manifest=()=>read("content/unified-sequence-v2-gated-dev.json"),v3Manifest=()=>read("content/unified-sequence-v3-dev.json");
const oldFile=()=>read("content/unified-prototype-12-puzzles-dev.json"),revisions=()=>read("content/unified-exact-wheel-revisions-dev.json").puzzles;
const deps={Sequence:S,Rules:R,Release:Rel,Expansion:A,canFormFn:G.canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout};
const vdeps=(over={})=>({canFormFn:G.canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout,existingIds:new Set(),dictionary,missingAnswersFn:A.missingAnswers,...over});
const REVISIONS={
  "FQ-V3:business:RETAIL:R1":["FQ-V3:business:RETAIL:R2","RETAIL",["RETAIL","ALERT","RATE","TILA","REIT"]],
  "FQ-V3:moneybasics:RECEIPT:R3":["FQ-V3:moneybasics:RECEIPT:R4","RECEIPT",["RECEIPT","PRICE","PEER","REIT"]],
  "FQ-V3:investing:TRADE:R3":["FQ-V3:investing:TRADE:R4","TRADE",["TRADE","RATE"]],
  "FQ-V3:investing:MARKET:R3":["FQ-V3:investing:MARKET:R4","MARKET",["MARKET","TERM","RATE","ATM"]],
  "FQ-V3:investing:RETURN:R3":["FQ-V3:investing:RETURN:R4","RETURN",["RETURN","NET","RENT"]],
  "FQ-V3:credit:DEFAULT:R1":["FQ-V3:credit:DEFAULT:R2","DEFAULT",["DEFAULT"]],
  "FQ-V3:credit:CREDIT:R1":["FQ-V3:credit:CREDIT:R2","CREDIT",["CREDIT","REIT"]],
};
const byId=()=>new Map(revisions().map(p=>[p.id,p]));
const activeNine=()=>{const retired=new Set(v3Manifest().retired.map(r=>r.puzzleId));return [...oldFile().puzzles.filter(p=>!retired.has(p.id)),...revisions()]};

test("rule v4 is a new version: v1/v2/v3 are unchanged and still validate their historical records",()=>{
  assert.equal(R.RULE_VERSION,"v2");assert.equal(R.RULE_VERSION_V3,"v3");assert.equal(R.RULE_VERSION_V4,"v4");assert.equal(R.MIN_ANSWERS,5);assert.equal(R.MIN_ANSWERS_V4,1);
  assert.equal(typeof R.validatorFor("v2"),"function");assert.equal(typeof R.validatorFor("v3"),"function");assert.equal(typeof R.validatorFor("v4"),"function");assert.equal(R.validatorFor("v9"),null);
  // historical sequence-v2 records still pass their own rule version (v3 with declared extra letters; v2 unchanged)
  const whitelist=read("content/unified-prototype-12-whitelist-dev.json"),replaced=new Set(v3Manifest().retired.map(r=>r.puzzleId));
  let checked=0;
  for(const p of oldFile().puzzles){
    const r=R.validatorFor(p.compositionRuleVersion)(p,{canFormFn:G.canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout,fillerWhitelist:whitelist,existingIds:canonicalIds,release:false});
    assert.deepEqual(r.errors,[],`${p.id} (${p.compositionRuleVersion}) still validates historically`);checked++;
    if(replaced.has(p.id))assert.equal(p.compositionRuleVersion,"v3");
  }
  assert.equal(checked,9);
  // the frozen rule limits are intact: v2 still demands five answers and direct support, v3 still allows two declared extra letters
  const defaultV3=oldFile().puzzles.find(p=>p.id==="FQ-V3:credit:DEFAULT:R1");assert.equal(defaultV3.declaredExtraLetters.length,2);
  const cut=structuredClone(oldFile().puzzles.find(p=>p.id==="FQ-V3:credit:REPAYMENT:R2"));cut.answers=cut.answers.slice(0,2);cut.requiredWords=cut.answers.map(a=>a.word);
  assert.ok(R.validateV2Puzzle(cut,{canFormFn:G.canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout,existingIds:new Set()}).errors.includes("requiredAnswerCount"),"v2 keeps its five-answer minimum");
  // the central validator routes by version
  assert.equal(PV.validatePuzzle(revisions()[0],vdeps()).valid,true);
  assert.deepEqual(PV.validatePuzzle({...revisions()[0],compositionRuleVersion:"v9"},vdeps()).errors,["unknownCompositionRuleVersion"]);
});

test("v4 accepts one required financial answer and imposes no filler, direct-support or three-substantive-term requirement",()=>{
  const only=byId().get("FQ-V3:credit:DEFAULT:R2");
  assert.deepEqual(only.requiredWords,["DEFAULT"]);assert.equal(only.answers.length,1);assert.deepEqual(only.supportRelevance,{});
  assert.deepEqual(R.validateV4Puzzle(only,vdeps()).errors,[]);
  const two=byId().get("FQ-V3:credit:CREDIT:R2");assert.equal(two.requiredWords.length,2);assert.deepEqual(R.validateV4Puzzle(two,vdeps()).errors,[]);
  // the v2/v3 rules would have refused both for exactly the reasons the owner removed
  const asV2={...only,compositionRuleVersion:"v2"};const e2=R.validateV2Puzzle(asV2,vdeps()).errors;
  ["requiredAnswerCount","threeSubstantiveKeyTerms","directSupportRequired"].forEach(code=>assert.ok(e2.includes(code),code));
  // v4 still refuses an empty puzzle, a missing key term, a non-financial answer and an unlabeled support
  const empty=structuredClone(only);empty.answers=[];empty.requiredWords=[];empty.layout=[];assert.ok(R.validateV4Puzzle(empty,vdeps()).errors.includes("requiredAnswerCount"));
  const ordinary=structuredClone(two);ordinary.answers.push({word:"RED",category:"ordinary",fillerId:"filler.red",termId:null,masteryId:null,definition:null,worldId:"credit",rewardPolicy:"ordinary-first-solve"});
  assert.ok(R.validateV4Puzzle(ordinary,vdeps()).errors.includes("onlyFinancialAnswers"),"no filler words in v4");
  const unlabeled=structuredClone(two);delete unlabeled.supportRelevance.REIT;assert.ok(R.validateV4Puzzle(unlabeled,vdeps()).errors.includes("relevanceLabelMissing"));
  const noAnchor=structuredClone(only);noAnchor.answers[0].category="financial-secondary";assert.ok(R.validateV4Puzzle(noAnchor,vdeps()).errors.includes("singleFinancialAnchor"));
  const wrongVersion={...only,compositionRuleVersion:"v3"};assert.ok(R.validateV4Puzzle(wrongVersion,vdeps()).errors.includes("compositionRuleVersion"));
});

test("v4 enforces the exact wheel: no extra letters, no missing letters, correct repeated-letter counts, no exceptions",()=>{
  const good=byId().get("FQ-V3:investing:MARKET:R4");assert.deepEqual(R.validateV4Puzzle(good,vdeps()).errors,[]);
  const extra=structuredClone(good);extra.wheelLetters=[...extra.wheelLetters,"B"];assert.ok(R.validateV4Puzzle(extra,vdeps()).errors.includes("anchorWheelInventory"));
  const declared=structuredClone(good);declared.wheelLetters=[...declared.wheelLetters,"B"];declared.declaredExtraLetters=["B"];
  const errs=R.validateV4Puzzle(declared,vdeps()).errors;assert.ok(errs.includes("anchorWheelInventory")&&errs.includes("extraLettersForbidden"),"declared extras are not an exception");
  const short=structuredClone(good);short.wheelLetters=short.wheelLetters.slice(1);assert.ok(R.validateV4Puzzle(short,vdeps()).errors.includes("anchorWheelInventory"));
  // repeated letters: RETURN has two R's, RECEIPT two E's, TRADE none; the wheels carry exactly those counts
  const count=(letters,l)=>letters.filter(x=>x===l).length;
  assert.equal(count(byId().get("FQ-V3:investing:RETURN:R4").wheelLetters,"R"),2);assert.equal(count(byId().get("FQ-V3:moneybasics:RECEIPT:R4").wheelLetters,"E"),2);
  const swapped=structuredClone(byId().get("FQ-V3:investing:RETURN:R4"));swapped.wheelLetters=[...swapped.wheelLetters];swapped.wheelLetters[swapped.wheelLetters.lastIndexOf("R")]="T";
  assert.ok(R.validateV4Puzzle(swapped,vdeps()).errors.includes("anchorWheelInventory"),"a wrong repeated-letter count is rejected");
  assert.equal(A.anchorSpellsWheelExactly(declared),false);assert.equal(A.anchorSpellsWheelExactly(good),true);
});

test("v4 requires every approved financial term the wheel can spell (exhaustive-answer rule)",()=>{
  const good=byId().get("FQ-V3:moneybasics:RECEIPT:R4");
  const dropped=structuredClone(good);dropped.answers=dropped.answers.filter(a=>a.word!=="PEER");dropped.requiredWords=dropped.requiredWords.filter(w=>w!=="PEER");
  dropped.layout=G.solveCompactCrossword(dropped.requiredWords).placements;
  assert.deepEqual(R.validateV4Puzzle(dropped,vdeps({dictionary:null})).errors,[],"without the dictionary only structure is checked");
  assert.ok(R.validateV4Puzzle(dropped,vdeps()).errors.includes("exhaustiveFinancialAnswers"),"with the dictionary the missing term is caught");
  assert.deepEqual(A.missingAnswers(dropped,dictionary).map(m=>m.word),["PEER"]);
});

test("the seven revisions: key terms unchanged, wheel = key term, answers recomputed against the 211-term dictionary",()=>{
  assert.equal(dictionary.size,211);const puzzles=byId();assert.equal(puzzles.size,7);
  const old=new Map(oldFile().puzzles.map(p=>[p.id,p]));
  for(const [oldId,[newId,anchor,expected]] of Object.entries(REVISIONS)){
    const p=puzzles.get(newId),before=old.get(oldId);assert.ok(p,newId);assert.ok(before,oldId);
    assert.equal(p.anchorWord,anchor);assert.equal(p.anchorWord,before.anchorWord,"the financial key term is kept");assert.equal(p.anchorTermId,before.anchorTermId);
    assert.equal(p.compositionRuleVersion,"v4");assert.equal(p.contentRevision,Number(newId.split(":").pop().slice(1)));assert.equal(p.exactWheelRevision.replaces,oldId);
    assert.deepEqual([...p.wheelLetters].sort(),[...anchor].sort(),`${newId} wheel is exactly the key term`);assert.equal(p.declaredExtraLetters,undefined);
    assert.deepEqual([...p.requiredWords].sort(),[...expected].sort(),`${newId} required answers`);
    assert.deepEqual(A.missingAnswers(p,dictionary),[],`${newId} requires every spellable approved term`);
    assert.equal(p.answers.filter(a=>a.category==="ordinary").length,0,"no filler words");assert.deepEqual(p.bonusWords,[]);
    // every surviving answer keeps its approved term identity and definition verbatim
    for(const a of p.answers){const prior=before.answers.find(x=>x.word===a.word);assert.ok(prior,`${newId} ${a.word} existed before`);assert.equal(a.termId,prior.termId);assert.equal(a.definition,prior.definition)}
    assert.deepEqual(R.validateV4Puzzle(p,vdeps({existingIds:canonicalIds})).errors,[],newId);
    // the previous revision is preserved untouched in the historical file
    assert.equal(before.compositionRuleVersion,"v3");assert.ok(before.declaredExtraLetters.length>=1&&before.declaredExtraLetters.length<=2);
  }
  // DEFAULT: DATE removed, DEFAULT is the sole required answer
  assert.deepEqual(puzzles.get("FQ-V3:credit:DEFAULT:R2").requiredWords,["DEFAULT"]);assert.equal(puzzles.get("FQ-V3:credit:DEFAULT:R2").answers.some(a=>a.word==="DATE"),false);
});

test("replacement mechanism: new revisions replace their predecessors, predecessors are retired with lineage kept, positions are unchanged",()=>{
  const v2=v2Manifest(),v3=v3Manifest();
  assert.equal(v3.sequenceId,"main-levels");assert.equal(v3.sequenceVersion,v2.sequenceVersion+1);assert.equal(v3.entries.length,61);
  assert.deepEqual(S.validateEvolution(v2,v3),{valid:true,errors:[]});assert.deepEqual(S.validateManifest(v3).errors,[]);
  for(const [oldId,[newId]] of Object.entries(REVISIONS)){
    const at=v2.entries.findIndex(e=>e.puzzleId===oldId),entry=v3.entries[at];
    assert.equal(entry.puzzleId,newId,"same position");assert.equal(entry.position,at+1);assert.deepEqual(entry.replaces,[oldId]);assert.equal(entry.compatibility,"fresh");assert.equal(entry.compositionRuleVersion,"v4");
    const retired=v3.retired.find(r=>r.puzzleId===oldId);assert.ok(retired,`${oldId} retired`);assert.equal(retired.retiredAtSequenceVersion,v2.sequenceVersion);
    assert.equal(v3.entries.some(e=>e.puzzleId===oldId),false);
  }
  // earlier lineage survives: RECEIPT:R4 -> R3 -> R2 is one chain through the retired records
  const idx=P.indexManifest(v3),receipt=v3.entries.find(e=>e.puzzleId==="FQ-V3:moneybasics:RECEIPT:R4");
  assert.deepEqual([...P.replacedIds(idx,receipt)].sort(),["FQ-V3:moneybasics:RECEIPT:R2","FQ-V3:moneybasics:RECEIPT:R3"]);
  // the 54 other entries are byte-identical to sequence v2 (same IDs, same order, same content)
  const keep=v3.entries.filter(e=>e.compositionRuleVersion!=="v4");assert.equal(keep.length,54);keep.forEach(e=>assert.deepEqual(e,v2.entries[e.position-1]));
});

test("all 61 unified levels pass the new release validation with the exhaustive check and the exact-wheel rule",()=>{
  const lv=levels();
  const r=Rel.validateRelease({manifest:lv.manifest,baseline:lv.baseline,canonicalPuzzles:canon,canonicalIds,puzzles:new Map(lv.puzzles.map(p=>[p.id,p])),whitelist:lv.whitelist,termDefinitions:H.termDefinitions(),sha256:Sha.hex,dictionary},deps);
  assert.deepEqual(r.errors,[]);assert.equal(r.valid,true);assert.deepEqual(r.summary,{entries:61,legacyVerified:52,upgradedVerified:9,exhaustiveVerified:61});
  // startup validation in the app (no dictionary available) also passes and loads exactly the nine
  const boot=L.loadRelease({levels:lv,canonicalPuzzles:canon,canonicalIds,sha256:Sha.hex},deps);assert.equal(boot.ok,true,boot.errors.join(";"));assert.equal(boot.library.size,9);
  // every one of the 61 key terms uses every wheel letter
  const manifestIds=lv.manifest.entries.map(e=>e.puzzleId),lib=new Map([...canon,...lv.puzzles.map(p=>[p.id,p])]);
  assert.equal(manifestIds.length,61);
  manifestIds.forEach(id=>{const p=lib.get(id);assert.ok(p,id);assert.deepEqual([...p.wheelLetters].sort(),[...p.anchorWord].sort(),`${id} wheel = key term`);assert.equal(A.anchorSpellsWheelExactly(p),true,id)});
  // tampering is refused: an extra wheel letter (even a declared one), a missing spellable term, or a v3 entry
  let t=levels();const p=t.puzzles.find(x=>x.id==="FQ-V3:investing:TRADE:R4");p.wheelLetters.push("B");assert.equal(L.loadRelease({levels:t,canonicalPuzzles:canon,canonicalIds,sha256:Sha.hex},deps).ok,false);
  t=levels();const q=t.puzzles.find(x=>x.id==="FQ-V3:investing:TRADE:R4");q.wheelLetters.push("B");q.declaredExtraLetters=["B"];
  assert.ok(Rel.validateRelease({manifest:t.manifest,baseline:t.baseline,canonicalPuzzles:canon,canonicalIds,puzzles:new Map(t.puzzles.map(x=>[x.id,x])),whitelist:t.whitelist,termDefinitions:null,skipTermRecords:true,sha256:Sha.hex,dictionary},deps).errors.some(e=>/anchorWheelInventory|anchorDoesNotSpellWheel/.test(e)));
  t=levels();t.manifest.entries.find(e=>e.anchor==="MARKET").compositionRuleVersion="v3";t.puzzles.find(x=>x.anchorWord==="MARKET").compositionRuleVersion="v3";assert.equal(L.loadRelease({levels:t,canonicalPuzzles:canon,canonicalIds,sha256:Sha.hex},deps).ok,false,"v3 is not releasable");
  t=levels();const d=t.puzzles.find(x=>x.id==="FQ-V3:moneybasics:RECEIPT:R4");d.answers=d.answers.filter(a=>a.word!=="PEER");d.requiredWords=d.requiredWords.filter(w=>w!=="PEER");d.layout=G.solveCompactCrossword(d.requiredWords).placements;
  assert.ok(Rel.validateRelease({manifest:t.manifest,baseline:t.baseline,canonicalPuzzles:canon,canonicalIds,puzzles:new Map(t.puzzles.map(x=>[x.id,x])),whitelist:t.whitelist,termDefinitions:null,skipTermRecords:true,sha256:Sha.hex,dictionary},deps).errors.some(e=>/notExhaustive PEER|exhaustiveFinancialAnswers/.test(e)));
});

test("all 58 canonical-library puzzles remain valid, exact-wheel and exhaustive; legacy baseline v1 is preserved and v2 is the versioned baseline",()=>{
  assert.equal(canon.size,58);
  for(const p of canon.values()){assert.deepEqual([...p.wheelLetters].sort(),[...p.anchorWord].sort(),p.id);assert.deepEqual(A.missingAnswers(p,dictionary),[],p.id)}
  const slate=require("../src/v3-puzzle-slate.js");
  const v1=text("content/unified-legacy-v1-baseline.json");assert.equal(H.sha256(Buffer.from(v1)),"de2fbca0734cdb40e336a40aae11218d1834c4aaba38097f18b2d31deb79d182","baseline v1 is frozen");
  const b2=read("content/unified-legacy-v2-baseline.json");assert.equal(b2.baselineVersion,2);assert.equal(b2.entries.length,52);b2.entries.forEach(e=>assert.equal(H.hashOf(canon.get(e.puzzleId)),e.sha256,e.puzzleId));
  assert.ok(slate.MIN_REQUIRED_ANSWERS>=1);
});

test("reward-once: answers already earned on a replaced revision never pay again; unearned answers pay once; no completion or reward is lost",()=>{
  const m=levels().manifest,lv=levels(),puzzles=new Map(lv.puzzles.map(p=>[p.id,p]));
  for(const [oldId,[newId,,expected]] of Object.entries(REVISIONS)){
    const old=oldFile().puzzles.find(p=>p.id===oldId),next=puzzles.get(newId);
    // a player who finished the previous revision and was paid for every answer
    const save={canonicalPuzzleProgress:{[oldId]:{timesCompleted:1,rewardedAnswers:old.answers.map(a=>a.word)}}};
    const record=P.lineageRewardRecord(save,m,newId);
    for(const word of expected)assert.equal(record.rewardedAnswers.includes(word),true,`${newId} ${word} inherited`);
    for(const word of expected){const reward=bank.canonicalAnswerReward(next,word,{},record,null);assert.equal(reward.coins,0,`${newId} ${word}`);assert.equal(reward.xp,0);assert.equal(reward.isNewSolve,false)}
    // nothing is lost: progress access and the earlier record are untouched
    const before=JSON.stringify(save.canonicalPuzzleProgress);P.apply(save,m,"2026-11-18T00:00:00.000Z");assert.equal(JSON.stringify(save.canonicalPuzzleProgress),before);
    assert.equal(P.earned(save,P.indexManifest(m),m.entries.find(e=>e.puzzleId===newId)),true,"earned access carries over to the replacement");
    // a word the player never earned on the old revision still pays once on the new one
    const partial={canonicalPuzzleProgress:{[oldId]:{timesCompleted:0,rewardedAnswers:[]}}};
    const fresh=P.lineageRewardRecord(partial,m,newId);const paid=bank.canonicalAnswerReward(next,next.anchorWord,{},fresh,null);assert.ok(paid.coins>0,`${newId} first solve pays`);
    const again=bank.recordCanonicalAnswer(fresh,next.anchorWord);assert.equal(bank.canonicalAnswerReward(next,next.anchorWord,{},again,null).coins,0,"and only once");
  }
  // a player partway through the old revision keeps exactly what they were paid
  const midId="FQ-V3:investing:MARKET:R3",nextId="FQ-V3:investing:MARKET:R4";
  const mid={canonicalPuzzleProgress:{[midId]:{timesCompleted:0,rewardedAnswers:["MARKET","TRADE"]}}};
  const rec=P.lineageRewardRecord(mid,m,nextId);assert.equal(rec.rewardedAnswers.includes("MARKET"),true);
  assert.equal(bank.canonicalAnswerReward(puzzles.get(nextId),"MARKET",{},rec,null).coins,0);assert.ok(bank.canonicalAnswerReward(puzzles.get(nextId),"TERM",{},rec,null).coins>0);
});

test("browser guard and bundle: the render guard accepts one answer; the iOS bundle carries the same rule files",()=>{
  const app=text("word-game-app.js");assert.ok(/isV3 && \(model\.words\.length < 1 \|\|/.test(app));assert.equal(/model\.words\.length < 3/.test(app),false);
  ["src/composition-rules.js","src/unified-sequence.js","src/unified-release.js","src/unified-prototype-loader.js","word-game-app.js","content/unified-levels-v2.js"].forEach(f=>assert.ok(fs.readFileSync(path.join(ROOT,f)).equals(fs.readFileSync(path.join(ROOT,"ios/App/App/public",f))),f));
  // generated files are current
  const cp=require("node:child_process");
  cp.execFileSync("node",["scripts/build-exact-wheel-revisions.mjs","check"],{cwd:ROOT});cp.execFileSync("node",["scripts/build-unified-levels-v2.mjs","--check"],{cwd:ROOT});cp.execFileSync("node",["scripts/build-answer-expansion.mjs","check"],{cwd:ROOT});
});

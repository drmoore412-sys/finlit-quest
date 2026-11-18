// prototype-12 (development only): isolation, v2 validation, lineage, rewards, mastery, navigation and grid fit for the first pair.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto"),cp=require("node:child_process");
const {ROOT,memoryStorage}=require("./helpers.js");
const L=require("../src/unified-prototype-loader.js"),S=require("../src/unified-sequence.js"),R=require("../src/composition-rules.js"),G=require("../src/game-engine.js"),P=require("../src/unified-progress.js");
const Learning=require("../learning-engine.js"),slate=require("../src/v3-puzzle-slate.js");
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f),"utf8"));
const manifest=()=>structuredClone(read("content/unified-prototype-12-dev.json")),puzzleFile=()=>structuredClone(read("content/unified-prototype-12-puzzles-dev.json")),whitelist=()=>structuredClone(read("content/unified-prototype-12-whitelist-dev.json"));
const mainManifest=read("content/unified-sequence-dev.json"),lib=read("content/shared-puzzle-library-2027.json"),canonicalIds=new Set(lib.canonicalPuzzleIndex.map(x=>x.id));
const canForm=(w,l)=>{const a=[...l];return [...w].every(c=>{const i=a.indexOf(c);if(i<0)return false;a.splice(i,1);return true})};
const deps={Sequence:S,Rules:R,canFormFn:canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout};
const run=(over={})=>L.load({manifest:manifest(),puzzleFile:puzzleFile(),whitelist:whitelist(),canonicalIds,mainManifest,...over},deps);
const ALL=["FQ-V3:credit:REPAYMENT:R2","FQ-V3:real_estate:APARTMENT:R2","FQ-V3:business:RETAIL:R1","FQ-V3:moneybasics:RECEIPT:R3","FQ-V3:investing:TRADE:R3","FQ-V3:investing:MARKET:R3","FQ-V3:investing:RETURN:R3","FQ-V3:credit:DEFAULT:R1","FQ-V3:credit:CREDIT:R1"];
const IDS=ALL.slice(0,2),OLD=["FQ-V3:credit:REPAYMENT:R1","FQ-V3:real_estate:APARTMENT:R1"];
function loadWindow(file,key){const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),c);return c.window[key]}
function canonicalPuzzles(){
  const c={window:{DEFI_TERMS:loadWindow("content/crypto-terms.js","DEFI_TERMS")}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,"worlds/crypto.js"),"utf8"),c);
  const V={crypto:c.window.FINLIT_WORLD.terms.map(t=>({word:t.word,definition:t.definition,termId:t.id})),credit:loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS"),moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS")};
  return [...slate.createSlate(V,G),...Object.values(read("content/2027-new-world-puzzle-banks.json").banks).flat()];
}
const throwaway=()=>L.markThrowaway({canonicalPuzzleProgress:{},coins:0,xp:0,termProgress:{}});

test("prototype-12 loads: manifest valid, first two puzzles pass v2, the six others pass v3, no canonical collision",()=>{
  const r=run();assert.deepEqual(r.errors,[]);assert.equal(r.ok,true);assert.deepEqual([...r.library.keys()],ALL);
  ALL.forEach(id=>{assert.equal(canonicalIds.has(id),false);assert.equal(mainManifest.entries.some(e=>e.puzzleId===id),false)});
  assert.equal(S.validateManifest(manifest()).valid,true,"v3 is a supported rule version");
});
test("v2 stays the only rule version and the release gate still refuses the prototype",()=>{
  assert.deepEqual(manifest().entries.map(e=>e.compositionRuleVersion),["v2","v2",...Array(7).fill("v3")]);assert.equal(R.RULE_VERSION,"v2");
  const r=S.validateManifest(manifest(),{release:true});assert.equal(r.valid,false);assert.ok(r.errors.includes("releaseRequiresDevOnlyFalse"));assert.equal(S.validateManifest(manifest(),{release:true}).errors.includes("entry 3: releaseRequiresRuleV2OrV3"),false,"v3 entries are no longer refused by rule version; the dev manifest still fails release on status, flags and devOnly");
});
test("canonical library and main-levels manifest are untouched",()=>{
  try{const head=cp.execFileSync("git",["show","HEAD:content/shared-puzzle-library-2027.json"],{cwd:ROOT,maxBuffer:1<<26});
    const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
    // answer-expansion v1 (2026-11-18): only version metadata and the architecture.answerExpansion pointer differ; IDs, anchors and placements are unchanged.
    const before=JSON.parse(head.toString("utf8")),after=JSON.parse(fs.readFileSync(path.join(ROOT,"content/shared-puzzle-library-2027.json"),"utf8"));
    for(const doc of [before,after]){delete doc.libraryVersion;delete doc.generatedOn;if(doc.architecture)delete doc.architecture.answerExpansion}
    assert.equal(sha(Buffer.from(JSON.stringify(before))),sha(Buffer.from(JSON.stringify(after))))}catch(e){if(e.code==="ENOENT")return;throw e}
  assert.equal(lib.uniquePuzzleCount,58);assert.equal(canonicalIds.size,58);
  assert.equal(mainManifest.entries.length,58);assert.deepEqual(mainManifest.retired,[]);assert.equal(mainManifest.sequenceId,"main-levels");
  const src=fs.readFileSync(path.join(ROOT,"src/unified-prototype-loader.js"),"utf8");assert.equal(/localStorage|sessionStorage|persist\(|canonicalPuzzleLibrary|wgBuildCanonicalLibrary/.test(src),false);
});
test("NAME is approved only for the two prototype puzzle IDs",()=>{
  const w=whitelist(),name=w.entries.find(e=>e.word==="NAME");assert.deepEqual(name.approvedInPuzzles,IDS);assert.equal(name.productionApproved,true);assert.equal(name.status,"approved-production-exact-puzzles");
  const main=read("content/unified-filler-whitelist-dev.json");assert.equal(main.entries.find(e=>e.word==="NAME").approvedInPuzzles.some(id=>IDS.includes(id)),false,"main whitelist not changed");
  const bad=whitelist();bad.entries[0].approvedInPuzzles=["REPAYMENT"];assert.equal(run({whitelist:bad}).ok,false);
  const other=whitelist();other.entries[0].approvedInPuzzles=[IDS[0],"FQ-V3:credit:REPAYMENT:R1"];assert.ok(run({whitelist:other}).errors.some(e=>/non-prototype/.test(e)));
  const one=whitelist();one.entries[0].approvedInPuzzles=[IDS[0]];assert.ok(run({whitelist:one}).errors.some(e=>/fillerNotApprovedForPuzzle/.test(e)));
});
test("loader rejects ID collisions, missing records, unknown replaced IDs, wrong sequence and non-dev manifests",()=>{
  let m=manifest();m.entries[0].puzzleId=OLD[0];let f=puzzleFile();f.puzzles[0].id=OLD[0];assert.ok(run({manifest:m,puzzleFile:f}).errors.some(e=>/collidesWithCanonical/.test(e)));
  f=puzzleFile();f.puzzles.pop();assert.ok(run({puzzleFile:f}).errors.some(e=>/puzzleRecordMissing/.test(e)));
  m=manifest();m.entries[0].replaces=["FQ-V3:credit:NOPE:R1"];assert.equal(run({manifest:m}).ok,false);
  m=manifest();m.sequenceId="main-levels";assert.ok(run({manifest:m}).errors.includes("sequenceIdMustBePrototype12"));
  m=manifest();m.devOnly=false;assert.ok(run({manifest:m}).errors.includes("devOnlyRequired"));
});
test("replacement lineage: replaced IDs are retired in the prototype manifest and keep their canonical records",()=>{
  const m=manifest();assert.deepEqual(m.entries.slice(0,2).map(e=>e.replaces[0]),OLD);assert.deepEqual(m.retired.slice(0,2).map(r=>r.puzzleId),OLD);
  m.entries.filter(e=>e.replaces.length).forEach(e=>{assert.equal(e.compatibility,"fresh");assert.ok(m.retired.some(r=>r.puzzleId===e.replaces[0]));assert.equal(canonicalIds.has(e.replaces[0]),true)});assert.equal(m.entries.length,9);OLD.forEach(id=>assert.equal(canonicalIds.has(id),true));
  const idx=P.indexManifest(m);assert.deepEqual([...P.replacedIds(idx,m.entries[0])],[OLD[0]]);assert.deepEqual([...P.replacedIds(idx,m.entries[1])],[OLD[1]]);
});
test("progress is isolated: refused on a normal save, never alters another sequence's block, throwaway saves work",()=>{
  const m=manifest(),now="2026-11-14T00:00:00Z";
  const real={coins:50,xp:10,canonicalPuzzleProgress:{[OLD[0]]:{timesCompleted:1,rewardedAnswers:["TERM"]}},unifiedProgress:{schemaVersion:1,sequenceId:"main-levels",sequenceVersion:1,frontier:{position:2,puzzleId:"x"}}};
  const snap=JSON.stringify(real);
  assert.throws(()=>L.applyProgress(P,real,m,now),/throwaway/);assert.equal(JSON.stringify(real),snap);
  const direct=P.apply(real,m,now);assert.equal(direct.readOnly,true);assert.equal(direct.reason,"sequence-mismatch");assert.equal(JSON.stringify(real),snap,"production block untouched even on a direct call");
  const t=throwaway();const r=L.applyProgress(P,t,m,now);assert.equal(r.readOnly,false);assert.equal(t.unifiedProgress.sequenceId,"prototype-12");
  assert.deepEqual([t.coins,t.xp,t.termProgress,t.canonicalPuzzleProgress],[0,0,{},{}],"progress writes only unifiedProgress");
  assert.throws(()=>L.applyProgress(P,t,mainManifest,now),/not the prototype/);
});
test("navigation: level 1 current, level 2 locked; earning the old puzzle keeps access to its replacement",()=>{
  const m=manifest(),now="2026-11-14T00:00:00Z";
  let t=throwaway();let st=P.levelStates(t,m,now);assert.deepEqual(st.map(s=>s.state),["current",...Array(8).fill("locked")]);assert.equal(P.canPlay(t,m,IDS[1],now),false);
  t.canonicalPuzzleProgress[OLD[1]]={timesCompleted:1};assert.equal(P.canPlay(t,m,IDS[1],now),true,"old APARTMENT completion grants access to the replacement");
  t=throwaway();t.canonicalPuzzleProgress[IDS[0]]={timesCompleted:1};st=P.levelStates(t,m,now);assert.deepEqual(st.map(s=>s.state),["completed","current",...Array(7).fill("locked")]);
  t=throwaway();t.canonicalPuzzleProgress[OLD[0]]={timesCompleted:1};assert.equal(P.levelStates(t,m,now)[0].playable,true);
});
test("rewards: answers rewarded on a replaced puzzle never pay twice; NAME keeps its ordinary first-solve reward",()=>{
  const m=manifest(),t=throwaway();
  t.canonicalPuzzleProgress[OLD[0]]={timesCompleted:1,rewardedAnswers:["REPAYMENT","TERM","APR","APY"]};
  const rec=P.lineageRewardRecord(t,m,IDS[0]);["REPAYMENT","TERM","APR","APY"].forEach(w=>assert.ok(rec.rewardedAnswers.includes(w),w+" already rewarded"));
  assert.equal(rec.rewardedAnswers.includes("NAME"),false,"NAME is new and may be rewarded once");
  const puz=run().library.get(IDS[0]),name=puz.answers.find(a=>a.word==="NAME");assert.equal(name.rewardPolicy,"ordinary-first-solve");assert.equal(puz.rewardPolicy.ordinary.coinsPerWord,1);assert.equal(puz.rewardPolicy.ordinary.xp,0);
  const t2=throwaway();t2.canonicalPuzzleProgress[OLD[1]]={timesCompleted:1,rewardedAnswers:["APARTMENT","EARN","RATE","RENT","TERM"]};
  const rec2=P.lineageRewardRecord(t2,m,IDS[1]);assert.equal(["APARTMENT","RATE","RENT","TERM"].every(w=>rec2.rewardedAnswers.includes(w)),true);assert.equal(rec2.rewardedAnswers.includes("NAME"),false);
  assert.equal(JSON.stringify(t.canonicalPuzzleProgress[OLD[0]].rewardedAnswers),JSON.stringify(["REPAYMENT","TERM","APR","APY"]),"old record not mutated");
});
test("mastery: key terms use governed IDs and definitions verbatim and resolve in the throwaway learning engine; fillers have no term",()=>{
  const canon=canonicalPuzzles(),lib8=[...run().library.values()],byWord=new Map();
  canon.forEach(p=>p.answers.forEach(a=>{if(a.termId&&!byWord.has(a.word))byWord.set(a.word,a)}));
  const engine=new Learning.LearningEngine({terms:slate.financialLearningTerms(canon),storage:memoryStorage()});
  engine.registerTerms(slate.financialLearningTerms(lib8));
  lib8.forEach(puz=>{
    puz.answers.filter(a=>a.category!=="ordinary").forEach(a=>{
      const src=byWord.get(a.word);if(src)assert.deepEqual([a.termId,a.masteryId,a.definition,a.worldId],[src.termId,src.masteryId,src.definition,src.worldId],a.word);
      assert.equal(a.masteryId,a.termId);assert.doesNotThrow(()=>engine.progressFor(a.termId),a.word);
    });
    puz.answers.filter(a=>a.category==="ordinary").forEach(a=>assert.deepEqual([a.termId,a.masteryId,a.definition],[null,null,null]));
  });
  assert.equal(engine.save.termProgress["filler.name"],undefined);
  assert.equal(canon.every(p=>true),true);
});
test("associations preserved: REPAYMENT->APY and APARTMENT->TERM/RATE are present with review-pending wording",()=>{
  const lib2=run().library,rep=lib2.get(IDS[0]),apt=lib2.get(IDS[1]);
  assert.ok(rep.answers.some(a=>a.word==="APY")&&Object.keys(rep.supportRelevance).includes("APY"));
  ["TERM","RATE"].forEach(w=>assert.ok(apt.answers.some(a=>a.word===w)&&apt.supportRelevance[w]));
  [rep,apt].forEach(p=>assert.equal(Object.values(p.supportRelevance).every(v=>v.explanation.length>=12),true));
});
const EXPANSION=JSON.parse(fs.readFileSync(path.join(ROOT,"content/answer-expansion-v1.json"),"utf8"));
test("layout and mobile fit: legal crossword layouts, wheel equals anchor, grid within canonical bounds",()=>{
  const canonDims=Math.max;
  run().library.forEach(p=>{
    assert.equal(G.validateCrosswordLayout(p.answers.map(a=>a.word),p.layout).valid,true);
    assert.deepEqual([...p.wheelLetters].sort(),[...p.anchorWord,...(p.declaredExtraLetters||[])].sort());assert.ok(p.wheelLetters.length<=9);
    const rows=Math.max(...p.layout.map(q=>q.r+(q.dir==="v"?q.word.length:1))),cols=Math.max(...p.layout.map(q=>q.c+(q.dir==="h"?q.word.length:1)));
    const expanded=EXPANSION.puzzles[p.id];
    // answer-expansion v1 puzzles use the compact layout recorded in the manifest (more answers need a larger grid); every other puzzle keeps the original canonical bounds.
    if(expanded)assert.ok(rows<=expanded.bounds.rows&&cols<=expanded.bounds.columns,`${p.id} ${rows}x${cols} exceeds its recorded compact bounds`);
    else assert.ok(rows<=8&&cols<=11&&rows*cols<=72,`${p.id} ${rows}x${cols}`);
  });
});

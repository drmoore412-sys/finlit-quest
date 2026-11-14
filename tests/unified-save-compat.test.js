const test=require("node:test");
const assert=require("node:assert/strict");
const {execFileSync}=require("node:child_process");
const vm=require("node:vm");
const L=require("../learning-engine.js");
const U=require("../src/unified-progress.js");
const NOW=new Date("2026-11-13T10:00:00Z");
let baseline=null;
try{const src=execFileSync("git",["show","3ebc7a2f237ec88ddb18eee3fb488d8d28b3a523:learning-engine.js"],{cwd:require("node:path").join(__dirname,".."),encoding:"utf8",stdio:["ignore","pipe","ignore"],maxBuffer:8e6});
  const box={module:{exports:{}},console};box.globalThis=box;vm.runInNewContext(src+"\n;this.__api=module.exports;",box);baseline=box.__api}catch{baseline=null}
const M={sequenceId:"main-levels",sequenceVersion:1,devOnly:true,entries:["A","B","C"].map((id,i)=>({position:i+1,puzzleId:id,compositionRuleVersion:"v1",releaseStatus:"development",validation:{},replaces:[],compatibility:null})),retired:[]};
const base=()=>({saveVersion:4,player:{coins:40,xp:12},canonicalPuzzleProgress:{A:{timesCompleted:1,rewardedAnswers:["X"]}},termProgress:{},settings:{theme:"dark"},engagement:{streak:{n:3}},someFutureField:{keep:[1,2]}});
test("save version stays 4 and a version-4 save loads without losing any field",()=>{
  assert.equal(L.CURRENT_SAVE_VERSION,4);
  const out=L.normalizeSave(base(),null,NOW);
  assert.equal(out.saveVersion,4);assert.deepEqual(out.someFutureField,{keep:[1,2]});assert.equal(out.settings.theme,"dark");assert.deepEqual(out.canonicalPuzzleProgress.A.rewardedAnswers,["X"]);
});
test("a future unifiedProgress block survives the engine untouched and the unified layer stays read-only on it",()=>{
  const out=L.normalizeSave({...base(),unifiedProgress:{schemaVersion:7,z:1}},null,NOW);
  assert.deepEqual(out.unifiedProgress,{schemaVersion:7,z:1});
  const r=U.apply(out,M,NOW.toISOString());assert.equal(r.readOnly,true);assert.deepEqual(out.unifiedProgress,{schemaVersion:7,z:1});
});
test("unifiedProgress is preserved through the engine normalization (additive, unknown fields kept)",()=>{
  const s=L.normalizeSave(base(),null,NOW);U.apply(s,M,NOW.toISOString());
  const again=L.normalizeSave(JSON.parse(JSON.stringify(s)),null,NOW);
  assert.deepEqual(again.unifiedProgress,s.unifiedProgress);assert.equal(again.unifiedProgress.frontier.puzzleId,"B");assert.equal(again.saveVersion,4);
});
test("the shipped (HEAD) engine and this engine are the same save engine: the block survives and the frontier resumes",{skip:baseline?false:"git baseline unavailable"},()=>{
  const v5=L.normalizeSave(base(),null,NOW);U.apply(v5,M,NOW.toISOString());
  const old=baseline.normalizeSave(JSON.parse(JSON.stringify(v5)),null,NOW);
  assert.equal(old.saveVersion,4,"version stays 4");assert.deepEqual(old.unifiedProgress,v5.unifiedProgress,"old build keeps unknown additive block");
  assert.deepEqual(old.someFutureField,{keep:[1,2]});
  old.canonicalPuzzleProgress.B={timesCompleted:1};          // progress made on the old build
  const up=L.normalizeSave(old,null,NOW);U.apply(up,M,NOW.toISOString());
  assert.equal(up.saveVersion,4);assert.equal(up.unifiedProgress.frontier.puzzleId,"C","frontier advances past levels solved while downgraded");
  assert.deepEqual(up.canonicalPuzzleProgress.A,v5.canonicalPuzzleProgress.A);
});
test("old shuffle key is not referenced by new code",()=>{
  const fs=require("node:fs");["../src/unified-progress.js","../src/unified-sequence.js","../src/composition-rules.js"].forEach(f=>assert.equal(fs.readFileSync(require.resolve(f),"utf8").includes("puzzleOrder"),false));
});

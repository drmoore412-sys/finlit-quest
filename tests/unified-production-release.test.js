// Production release of main-levels sequenceVersion 2: generated data, startup release validation, wiring and fallback.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const H=require("./unified-release-helpers.js");
const S=require("../src/unified-sequence.js"),R=require("../src/composition-rules.js"),G=require("../src/game-engine.js"),Rel=require("../src/unified-release.js"),L=require("../src/unified-prototype-loader.js"),Sha=require("../src/sha256.js"),P=require("../src/unified-progress.js");
const {ROOT,read}=H;
const text=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const canForm=(w,l)=>{const a=[...l];return [...w].every(c=>{const i=a.indexOf(c);if(i<0)return false;a.splice(i,1);return true})};
const deps={Sequence:S,Rules:R,Release:Rel,canFormFn:canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout};
const canon=H.canonicalMap(),canonicalIds=new Set(canon.keys());
const levels=()=>structuredClone(require("../content/unified-levels-v2.js"));
const load=(lv,over={})=>L.loadRelease({levels:lv,canonicalPuzzles:canon,canonicalIds,sha256:Sha.hex,...over},deps);

test("sha256 module matches Node crypto",()=>{
  ["","abc","é€𝄞"+"x".repeat(200),"a".repeat(55),"a".repeat(56),"a".repeat(64),"a".repeat(1000)].forEach(t=>assert.equal(Sha.hex(t),crypto.createHash("sha256").update(t).digest("hex")));
});
test("generated production data is current and carries only the release flags changes",async()=>{
  const {build}=await import("../scripts/build-unified-levels-v2.mjs");assert.equal(text("content/unified-levels-v2.js"),build());
  const lv=levels(),m=lv.manifest,dev=read("content/unified-sequence-v2-gated-dev.json");
  assert.equal(m.sequenceId,"main-levels");assert.equal(m.sequenceVersion,2);assert.equal(m.devOnly,false);assert.equal(m.releaseGate.status,"open");assert.equal(m.entries.length,61);
  const nine=new Set(lv.puzzles.map(p=>p.id));assert.equal(nine.size,9);
  m.entries.forEach((e,i)=>{const d=dev.entries[i];assert.equal(e.puzzleId,d.puzzleId);assert.equal(e.position,d.position);
    if(nine.has(e.puzzleId)){assert.equal(e.releaseStatus,"approved");assert.ok(["v2","v3"].includes(e.compositionRuleVersion))}else assert.deepEqual(e,d,"legacy entry unchanged")});
  assert.deepEqual(lv.puzzles,read("content/unified-prototype-12-puzzles-dev.json").puzzles);
  assert.equal(lv.baseline.entries.length,52);assert.ok(lv.whitelist.entries.every(e=>e.productionApproved===true&&e.approvedInPuzzles.every(id=>nine.has(id))));
  ["TITLE","CLIENT","TICKER","DTI"].forEach(h=>m.entries.forEach(e=>assert.notEqual(e.anchor,h)));
});
test("startup release validation passes for the shipped data (52 legacy exact matches, 9 fully validated) and loads exactly the nine",()=>{
  const r=load(levels());assert.deepEqual(r.errors,[]);assert.equal(r.ok,true);assert.deepEqual(r.summary,{entries:61,legacyVerified:52,upgradedVerified:9});assert.equal(r.library.size,9);
  assert.equal(S.validateManifest(levels().manifest,{release:true}).valid,false,"v1 is still not generally releasable");
});
test("startup validation fails closed: any tampering returns ok:false and an empty library",()=>{
  let lv=levels();lv.manifest.devOnly=true;assert.equal(load(lv).ok,false);
  lv=levels();lv.manifest.releaseGate.status="closed";assert.equal(load(lv).ok,false);
  lv=levels();lv.puzzles[0].answers[0].word+="X";assert.equal(load(lv).ok,false);
  lv=levels();lv.whitelist.entries[0].productionApproved=false;const r=load(lv);assert.equal(r.ok,false);assert.equal(r.library.size,0);
  lv=levels();lv.baseline.entries[0].sha256="0".repeat(64);assert.equal(load(lv).ok,false);
  lv=levels();lv.baseline.entries.pop();assert.equal(load(lv).ok,false);
  lv=levels();lv.manifest.entries.push({position:62,puzzleId:"FQ-V3:credit:APR:R9",anchor:"APR",replaces:[],compatibility:null,compositionRuleVersion:"v1",releaseStatus:"approved",validation:{}});assert.equal(load(lv).ok,false);
  const mod=new Map(canon);const p=structuredClone(mod.get("FQ-V3:business:FREELANCE:R1"));p.answers[0].definition+=".";mod.set(p.id,p);assert.equal(load(levels(),{canonicalPuzzles:mod}).ok,false);
  assert.equal(load(levels(),{canonicalIds:new Set()}).ok,false);
});
test("term records for the nine are governed (FEE, BID, DEFAULT, RETAIL, CREDIT and the rest match approved definitions)",()=>{
  const t=H.termDefinitions();const r=Rel.validateRelease({manifest:levels().manifest,baseline:levels().baseline,canonicalPuzzles:canon,canonicalIds,puzzles:new Map(levels().puzzles.map(p=>[p.id,p])),whitelist:levels().whitelist,termDefinitions:t,sha256:Sha.hex},deps);
  assert.deepEqual(r.errors,[]);assert.equal(r.valid,true);
});
test("wiring: scripts load before word-game-app.js, production path falls back to the existing flow, bundle is identical, save stays version 4",()=>{
  const html=text("index.html"),app=text("word-game-app.js"),i=name=>html.indexOf(`src="${name}?v=`);
  ["src/unified-progress.js","src/unified-sequence.js","src/composition-rules.js","src/sha256.js","src/unified-release.js","src/unified-prototype-loader.js","src/unified-levels-ui.js","content/unified-levels-v2.js"].forEach(n=>{assert.ok(i(n)>0,n);assert.ok(i(n)<i("word-game-app.js"),n+" must precede word-game-app.js")});
  assert.ok(html.includes('href="unified-levels-dev.css?v='));
  assert.ok(app.includes("FinLitUnifiedPrototypeLoader.loadRelease")&&app.includes("using the existing level flow"));
  assert.ok(app.includes("window.__finlitUnifiedLevels = { ready: false"),"failure path leaves the existing flow");
  ["index.html","word-game-app.js","unified-levels-dev.css","content/unified-levels-v2.js"].forEach(f=>assert.ok(fs.readFileSync(path.join(ROOT,f)).equals(fs.readFileSync(path.join(ROOT,"ios/App/App/public",f))),f));
  assert.equal(require("../learning-engine.js").CURRENT_SAVE_VERSION,4);
});
test("completed-player progression and reward lineage: finishing all 58 puts the frontier at level 59 without losing rewards",()=>{
  const m=levels().manifest;
  const save={player:{coins:0,xp:0},canonicalPuzzleProgress:{}};canon.forEach((p,id)=>{save.canonicalPuzzleProgress[id]={timesCompleted:1,rewardedAnswers:p.answers.map(a=>a.word)}});
  const before=JSON.stringify(save.canonicalPuzzleProgress),now="2026-11-14T00:00:00.000Z";
  P.apply(save,m,now);assert.equal(save.unifiedProgress.frontier.position,59);
  const st=P.levelStates(save,m,now);assert.equal(st[58].state,"current");assert.equal(st[59].state,"locked");assert.equal(st.slice(0,58).filter(x=>x.state==="completed").length,52);
  assert.equal(JSON.stringify(save.canonicalPuzzleProgress),before,"no reward or completion record is lost or changed");
});

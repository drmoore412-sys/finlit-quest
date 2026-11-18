// Release validation for the nine approved puzzles: exact-ID filler approvals, governed term records, ID collisions, v3 release support.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {ROOT,memoryStorage}=require("./helpers.js");
const S=require("../src/unified-sequence.js"),R=require("../src/composition-rules.js"),G=require("../src/game-engine.js"),L=require("../src/unified-prototype-loader.js");
const Learning=require("../learning-engine.js"),slate=require("../src/v3-puzzle-slate.js");
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f),"utf8"));
const lib=read("content/shared-puzzle-library-2027.json"),canonicalIds=new Set(lib.canonicalPuzzleIndex.map(x=>x.id));
const canForm=(w,l)=>{const a=[...l];return [...w].every(c=>{const i=a.indexOf(c);if(i<0)return false;a.splice(i,1);return true})};
const wl=()=>read("content/unified-prototype-12-whitelist-dev.json"),puzzles=()=>read("content/unified-prototype-12-puzzles-dev.json").puzzles,gated=()=>read("content/unified-sequence-v2-gated-dev.json");
const NINE=puzzles().map(p=>p.id);
const lw=(f,k)=>{const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,f),"utf8"),c);return c.window[k]};
const releaseDeps=w=>({canFormFn:canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout,fillerWhitelist:w,existingIds:canonicalIds,release:true});

test("filler placements are production-approved for their exact puzzle IDs only",()=>{
  const w=wl(),placed=[];
  puzzles().forEach(p=>p.answers.filter(a=>a.category==="ordinary").forEach(a=>placed.push([a.fillerId,a.word,p.id])));
  assert.equal(placed.length,12);
  placed.forEach(([fid,word,id])=>{const e=w.entries.find(x=>x.fillerId===fid);assert.ok(e,fid);assert.equal(e.word,word);assert.equal(e.productionApproved,true);assert.ok(e.approvedInPuzzles.includes(id),fid+" for "+id)});
  w.entries.forEach(e=>e.approvedInPuzzles.forEach(id=>{assert.ok(NINE.includes(id),"only the nine exact IDs: "+id);assert.equal(id.startsWith("FQ-V3:"),true)}));
  const listed=w.entries.reduce((n,e)=>n+e.approvedInPuzzles.length,0);assert.equal(listed,placed.length,"no approval without a placement");
  const main=read("content/unified-filler-whitelist-dev.json");NINE.forEach(id=>assert.equal(main.entries.some(e=>(e.approvedInPuzzles||[]).includes(id)),false,"main dev whitelist not changed"));
});
test("every one of the nine passes puzzle-level release validation (v2 and v3), and an unapproved filler would fail it",()=>{
  const w=wl();
  puzzles().forEach(p=>{const fn=p.compositionRuleVersion==="v3"?R.validateV3Puzzle:R.validateV2Puzzle;assert.deepEqual(fn(p,releaseDeps(w)).errors,[],p.id)});
  assert.deepEqual(puzzles().map(p=>p.compositionRuleVersion).sort(),["v2","v2","v3","v3","v3","v3","v3","v3","v3"]);
  const bad=wl();bad.entries.find(e=>e.fillerId==="filler.act").productionApproved=false;
  assert.ok(R.validateV3Puzzle(puzzles().find(p=>p.anchorWord==="CREDIT"),releaseDeps(bad)).errors.includes("fillerNotProductionApproved"));
  const unlisted=wl();unlisted.entries.find(e=>e.fillerId==="filler.date").approvedInPuzzles=unlisted.entries.find(e=>e.fillerId==="filler.date").approvedInPuzzles.filter(id=>!id.includes("CREDIT"));
  assert.ok(R.validateV3Puzzle(puzzles().find(p=>p.anchorWord==="CREDIT"),releaseDeps(unlisted)).errors.includes("fillerNotApprovedForPuzzle"));
});
test("term records: FEE, BID and DEFAULT resolve to existing governed records with their approved definitions; no definition was written",()=>{
  const V={credit:lw("content/credit-game-terms.js","CREDIT_GAME_TERMS"),moneybasics:lw("content/money-basics-terms.js","MONEY_BASICS_TERMS"),investing:lw("content/investing-basics-terms.js","INVESTING_BASICS_TERMS")};
  const ident=fs.readFileSync(path.join(ROOT,"content/credit-term-identities.js"),"utf8");assert.ok(ident.includes('["DEFAULT","credit.default"]'));
  const all=[...puzzles()];
  [["FEE","moneybasics","moneybasics.fee"],["BID","investing","investing.bid"],["DEFAULT","credit","credit.default"]].forEach(([word,world,id])=>{
    const t=V[world].find(x=>x.word===word);assert.ok(t,word+" is governed vocabulary");assert.equal(slate.stableTermId(world,t),id);
    const answer=all.flatMap(p=>p.answers).find(a=>a.word===word&&a.category!=="ordinary");assert.ok(answer,word+" appears as a key term");
    assert.deepEqual([answer.termId,answer.masteryId,answer.definition,answer.worldId],[id,id,t.definition,world]);
  });
  const engine=new Learning.LearningEngine({terms:[],storage:memoryStorage()});
  engine.registerTerms(slate.financialLearningTerms(all));
  all.forEach(p=>p.answers.filter(a=>a.category!=="ordinary").forEach(a=>assert.doesNotThrow(()=>engine.progressFor(a.termId),a.word)));
  ["moneybasics.fee","investing.bid","credit.default"].forEach(id=>assert.equal(engine.repository.get(id).id,id));
});
test("a save holding progress for these terms stays safe when they are not registered (flag off, older build)",()=>{
  const storage=memoryStorage({[Learning.SAVE_KEY]:JSON.stringify({saveVersion:4,termProgress:{"moneybasics.fee":{masteryLevel:1},"investing.bid":{masteryLevel:2},"credit.default":{masteryLevel:1}},player:{xp:5,coins:9}})});
  const terms=slate.financialLearningTerms(puzzles()).filter(t=>t.id==="credit.tila");assert.equal(terms.length,1);
  const e=new Learning.LearningEngine({terms,storage});
  assert.doesNotThrow(()=>e.due("credit"));assert.equal(e.save.termProgress["moneybasics.fee"].masteryLevel,1);assert.equal(e.save.saveVersion,4);assert.deepEqual([e.save.player.xp,e.save.player.coins],[5,9]);
});
test("production IDs RETAIL:R1, DEFAULT:R1 and CREDIT:R1 do not collide with any canonical, main-levels or other puzzle ID",()=>{
  const ids=["FQ-V3:business:RETAIL:R1","FQ-V3:credit:DEFAULT:R1","FQ-V3:credit:CREDIT:R1"];
  ids.forEach(id=>{assert.equal(canonicalIds.has(id),false,id);assert.ok(NINE.includes(id))});
  const main=read("content/unified-sequence-dev.json"),seen=new Set([...main.entries.map(e=>e.puzzleId),...main.retired.map(e=>e.puzzleId)]);ids.forEach(id=>assert.equal(seen.has(id),false,id));
  // no other content bank defines these IDs
  fs.readdirSync(path.join(ROOT,"content")).filter(f=>/\.(json|js)$/.test(f)&&!/^unified-/.test(f)&&!/^answer-expansion-/.test(f)).forEach(f=>{const t=fs.readFileSync(path.join(ROOT,"content",f),"utf8");ids.forEach(id=>assert.equal(t.includes(id),false,f+" contains "+id))});
  assert.equal(new Set(NINE).size,9);
  // revision numbering: first revision of a new anchor; replacements continue past the retired revision
  puzzles().forEach(p=>assert.equal(p.contentRevision,Number(p.id.split(":").pop().slice(1))));
});
test("release view (sequence v3): the nine entries are release-valid; the only remaining release errors are the 52 legacy v1 entries",()=>{
  const g=read("content/unified-sequence-v3-dev.json"),replaced=new Set(g.retired.map(r=>r.puzzleId));
  const active=[...puzzles().filter(p=>!replaced.has(p.id)),...read("content/unified-exact-wheel-revisions-dev.json").puzzles].map(p=>p.id),nineIds=new Set(active),view=structuredClone(g);view.devOnly=false;
  view.entries.forEach(e=>{if(nineIds.has(e.puzzleId))e.releaseStatus="approved"});
  const r=S.validateManifest(view,{release:true});assert.equal(r.valid,false);
  const nine=view.entries.map((e,i)=>[e,i+1]).filter(([e])=>nineIds.has(e.puzzleId)).map(([,n])=>n),legacy=view.entries.map((e,i)=>[e,i+1]).filter(([e])=>!nineIds.has(e.puzzleId)).map(([,n])=>n);
  assert.equal(nine.length,9);assert.equal(legacy.length,52);
  const nineErrors=r.errors.filter(e=>nine.some(n=>e.startsWith(`entry ${n}:`)));assert.deepEqual(nineErrors,[],"the nine pass every release rule");
  const rest=r.errors.filter(e=>!nineIds.has(e));assert.ok(rest.length>0);
  rest.forEach(e=>{const n=Number((/^entry (\d+):/.exec(e)||[])[1]);assert.ok(legacy.includes(n),"only legacy entries fail: "+e)});
  assert.ok(rest.some(e=>/releaseRequiresRuleV2OrV4/.test(e)),"legacy v1 entries are the blocker");
  assert.equal(g.devOnly,true);assert.equal(g.entries.filter(e=>e.releaseStatus==="candidate").length,9);
  nine.forEach(n=>{const v=g.entries[n-1].validation;["relevanceReviewed","definitionsVerified","fillersApproved","ownerApproved","layoutVerified"].forEach(k=>assert.equal(v[k],true,k))});
  // the superseded sequence-v2 candidate used the declared-extra-letter rule v3, which is no longer releasable: the four unified in-place v3 entries now refuse release
  const old=structuredClone(gated());old.devOnly=false;old.entries.forEach(e=>{if(e.releaseStatus==="candidate")e.releaseStatus="approved"});
  assert.ok(S.validateManifest(old,{release:true}).errors.some(e=>/releaseRequiresRuleV2OrV4/.test(e)&&Number((/^entry (\d+):/.exec(e)||[])[1])===6),"v3 is historical only");
});

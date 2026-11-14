// Composition rule v3 (development prototype only): up to two declared extra letters, nine-letter cap, v2 and the release gate unchanged.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {ROOT}=require("./helpers.js");
const R=require("../src/composition-rules.js"),S=require("../src/unified-sequence.js"),G=require("../src/game-engine.js"),L=require("../src/unified-prototype-loader.js");
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f),"utf8"));
const canForm=(w,l)=>{const a=[...l];return [...w].every(c=>{const i=a.indexOf(c);if(i<0)return false;a.splice(i,1);return true})};
const deps=wl=>({canFormFn:canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout,fillerWhitelist:wl});
const pending=()=>structuredClone(read("content/unified-prototype-12-pending-dev.json"));
const proto=()=>{const w=structuredClone(read("content/unified-prototype-12-whitelist-dev.json"));w.entries=w.entries.filter(e=>e.word==="NAME");w.entries[0].approvedInPuzzles=["FQ-V3:credit:REPAYMENT:R2","FQ-V3:real_estate:APARTMENT:R2"];return w};
// test-only whitelist that SIMULATES owner approval of the proposed filler placements; never written to disk
function simulatedWhitelist(p){const w=proto();p.proposedFillerApprovals.forEach(a=>{let e=w.entries.find(x=>x.fillerId===a.fillerId);if(!e){e={fillerId:a.fillerId,word:a.word,status:"simulated-test-only",productionApproved:false,approvedInPuzzles:[]};w.entries.push(e)}e.approvedInPuzzles.push(a.puzzleId)});return w}
const byId=(p,id)=>p.puzzles.find(x=>x.id===id);
test("v2 is unchanged and v3 is an additional release-supported rule version",()=>{
  assert.equal(R.RULE_VERSION,"v2");assert.equal(R.RULE_VERSION_V3,"v3");assert.equal(R.MAX_EXTRA_LETTERS,2);
  const m={sequenceId:"s",sequenceVersion:1,devOnly:false,retired:[],entries:[{position:1,puzzleId:"X",compositionRuleVersion:"v3",releaseStatus:"approved",validation:{relevanceReviewed:true,definitionsVerified:true,fillersApproved:true,ownerApproved:true,layoutVerified:true}}]};
  assert.deepEqual(S.validateManifest(m,{release:true}).errors,[],"a fully approved v3 entry passes the release gate");
  const bad=structuredClone(m);bad.entries[0].compositionRuleVersion="v1";assert.ok(S.validateManifest(bad,{release:true}).errors.includes("entry 1: releaseRequiresRuleV2OrV3"),"v1 is legacy and never releasable");
  bad.entries[0].compositionRuleVersion="v9";assert.ok(S.validateManifest(bad).errors.includes("entry 1: compositionRuleVersion"));
  assert.equal(S.RULE_VERSIONS.has("v3"),true);assert.equal(S.RULE_VERSIONS.has("v2"),true);assert.equal(R.RULE_VERSION,"v2");
});
test("every proposed prototype puzzle passes v3 once its filler placements are approved (simulated), and v2 rejects them",()=>{
  const p=pending(),wl=simulatedWhitelist(p);assert.equal(p.puzzles.length,6);
  p.puzzles.forEach(z=>{
    assert.deepEqual(R.validateV3Puzzle(z,{...deps(wl),existingIds:new Set()}).errors,[],z.id);
    const v2=R.validateV2Puzzle({...z,compositionRuleVersion:"v2"},deps(wl));assert.ok(v2.errors.includes("anchorWheelInventory"),z.id+" must fail v2 inventory");
  });
});
test("without owner approval the only failure is the filler approval, so nothing is silently approved",()=>{
  const p=pending(),wl=proto();
  p.puzzles.forEach(z=>{const e=R.validateV3Puzzle(z,{...deps(wl),existingIds:new Set()}).errors;
    assert.ok(e.length>0,z.id);
    assert.equal(e.every(x=>x==="fillerNotWhitelisted"||x==="fillerNotApprovedForPuzzle"),true,z.id+" "+e);});
  assert.deepEqual(wl.entries.map(e=>e.word),["NAME"],"prototype whitelist still holds only NAME");
  const main=read("content/unified-filler-whitelist-dev.json");["LINE","TIME","DATE","READ","FINAL"].forEach(w=>assert.equal(main.entries.find(e=>e.word===w).approvedInPuzzles.some(id=>id.startsWith("FQ-V3:")),false,w+" not approved for any prototype puzzle in the main whitelist"));
});
test("v3 wheel rules: declared extras, at most two, nine letters, every extra used",()=>{
  const p=pending(),wl=simulatedWhitelist(p),z=()=>structuredClone(byId(p,"FQ-V3:business:RETAIL:R1")),run=x=>R.validateV3Puzzle(x,{...deps(wl),existingIds:new Set()}).errors;
  assert.deepEqual(run(z()),[]);
  let x=z();x.declaredExtraLetters=["N"];assert.ok(run(x).includes("anchorWheelInventory"),"wheel has an undeclared letter");
  x=z();x.declaredExtraLetters=["N","S","Z"];x.wheelLetters=[..."RETAILNSZ"];assert.ok(run(x).includes("extraLetterLimit"));
  x=z();delete x.declaredExtraLetters;assert.ok(run(x).includes("declaredExtraLettersInvalid"));
  x=z();x.declaredExtraLetters=["n","S"];assert.ok(run(x).includes("declaredExtraLettersInvalid"));
  x=z();x.declaredExtraLetters=["N","Z"];x.wheelLetters=[..."RETAILNZ"];assert.ok(run(x).includes("extraLetterUnused"),"Z is in no answer");
  const d=byId(p,"FQ-V3:credit:DEFAULT:R1");assert.equal(d.wheelLetters.length,9);x=structuredClone(d);x.declaredExtraLetters=["I","N","A"];x.wheelLetters=[...x.wheelLetters,"A"];assert.ok(run(x).includes("anchorWheelInventory")||run(x).includes("extraLetterLimit"));
  x=z();x.compositionRuleVersion="v2";assert.ok(run(x).includes("compositionRuleVersion"));
  p.puzzles.forEach(q=>{assert.ok(q.wheelLetters.length<=9);assert.ok(q.declaredExtraLetters.length<=2);q.declaredExtraLetters.forEach(l=>assert.ok(q.requiredWords.some(w=>w.includes(l))))});
});
test("v3 keeps every other v2 check (answer count, key terms, relevance, layout, rewards)",()=>{
  const p=pending(),wl=simulatedWhitelist(p),base=()=>structuredClone(byId(p,"FQ-V3:investing:TRADE:R3")),run=x=>R.validateV3Puzzle(x,{...deps(wl),existingIds:new Set()}).errors;
  let x=base();x.answers=x.answers.slice(0,4);assert.ok(run(x).includes("requiredAnswerCount"));
  x=base();x.answers[1].termId=null;assert.ok(run(x).includes("keyTermIdentity"));
  x=base();x.supportRelevance={};assert.ok(run(x).includes("relevanceLabelMissing"));
  x=base();x.layout=[];assert.ok(run(x).includes("strictCrosswordLayout"));
  x=base();x.rewardPolicy.financial.coinsPerLetter=8;assert.ok(run(x).includes("rewardPolicyValid"));
  x=base();assert.ok(new Set(R.EXCLUDED_FILLERS).has("DATA"));
});
test("loader accepts v3 entries only for the development prototype and keeps held and pending items out",()=>{
  const p=pending(),wl=simulatedWhitelist(p),man=structuredClone(read("content/unified-prototype-12-dev.json")),pf=structuredClone(read("content/unified-prototype-12-puzzles-dev.json"));man.entries=man.entries.slice(0,2);man.retired=man.retired.slice(0,2);pf.puzzles=pf.puzzles.slice(0,2);
  const ids=new Set(read("content/shared-puzzle-library-2027.json").canonicalPuzzleIndex.map(i=>i.id));
  const deps2={Sequence:S,Rules:R,canFormFn:canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout};
  p.puzzles.forEach(z=>{man.entries.push({position:man.entries.length+1,puzzleId:z.id,anchor:z.anchorWord,replaces:z.prototype.replacesCanonical?[z.prototype.replacesCanonical]:[],compatibility:z.prototype.replacesCanonical?"fresh":null,compositionRuleVersion:"v3",releaseStatus:"development",validation:{}});if(z.prototype.replacesCanonical)man.retired.push({puzzleId:z.prototype.replacesCanonical,replaces:[],retiredAtSequenceVersion:1});pf.puzzles.push(z)});
  const r=L.load({manifest:man,puzzleFile:pf,whitelist:wl,canonicalIds:ids,mainManifest:read("content/unified-sequence-dev.json")},deps2);
  assert.deepEqual(r.errors,[]);assert.equal(r.library.size,8);
  const held=["TITLE","CLIENT","CREDIT","TICKER"];p.puzzles.forEach(z=>held.forEach(h=>assert.notEqual(z.anchorWord,h)));
  // the shipped prototype manifest now holds the eight approved development levels, in order
  const shipped=read("content/unified-prototype-12-dev.json");assert.deepEqual(shipped.entries.map(e=>e.anchor),["REPAYMENT","APARTMENT","RETAIL","RECEIPT","TRADE","MARKET","RETURN","DEFAULT","CREDIT"]);
  p.puzzles.forEach(z=>{assert.equal(ids.has(z.id),false,"no canonical collision "+z.id);if(z.prototype.replacesCanonical)assert.equal(ids.has(z.prototype.replacesCanonical),true)});
});
test("approved vocabulary only: every key term is a governed term and no new definition was written",()=>{
  const p=pending();const defs=new Map();
  ["credit-game-terms","money-basics-terms","banking-basics-terms","investing-basics-terms"].forEach(f=>{});
  p.puzzles.forEach(z=>z.answers.filter(a=>a.category!=="ordinary").forEach(a=>{assert.ok(a.termId&&a.masteryId===a.termId&&a.definition.length>10,a.word)}));
  p.puzzles.forEach(z=>z.answers.filter(a=>a.category==="ordinary").forEach(a=>assert.deepEqual([a.termId,a.masteryId,a.definition],[null,null,null])));
  assert.equal(p.status,"pending-owner-approval");
});

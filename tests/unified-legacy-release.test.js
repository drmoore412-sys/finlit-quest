// Release gate for the 61-level sequence: full v2/v3 release validation for the nine upgraded puzzles, and a narrow legacy
// exception for the 52 unchanged canonical v1 puzzles (exact ID, anchor and content hash). Nothing here activates production content.
const test=require("node:test");
const assert=require("node:assert/strict");
const cp=require("node:child_process");
const H=require("./unified-release-helpers.js");
const S=require("../src/unified-sequence.js"),R=require("../src/composition-rules.js"),G=require("../src/game-engine.js"),Rel=require("../src/unified-release.js");
const {read,ROOT}=H;
const canForm=(w,l)=>{const a=[...l];return [...w].every(c=>{const i=a.indexOf(c);if(i<0)return false;a.splice(i,1);return true})};
const deps={Sequence:S,Rules:R,canFormFn:canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout};
const canon=H.canonicalMap(),canonicalIds=new Set(read("content/shared-puzzle-library-2027.json").canonicalPuzzleIndex.map(x=>x.id)),terms=H.termDefinitions();
const gated=()=>read("content/unified-sequence-v2-gated-dev.json"),baseline=()=>read("content/unified-legacy-v1-baseline.json");
const nine=()=>new Map(read("content/unified-prototype-12-puzzles-dev.json").puzzles.map(p=>[p.id,p]));
const whitelist=()=>read("content/unified-prototype-12-whitelist-dev.json");
// release VIEW only: what the manifest would look like once the owner activates it. The shipped candidate file is never changed.
function view(){const m=gated(),ids=new Set(nine().keys());m.devOnly=false;m.entries.forEach(e=>{if(ids.has(e.puzzleId))e.releaseStatus="approved"});return m}
const run=(over={})=>Rel.validateRelease({manifest:view(),baseline:baseline(),canonicalPuzzles:canon,canonicalIds,puzzles:nine(),whitelist:whitelist(),termDefinitions:terms,sha256:H.sha256,...over},deps);

test("baseline: 52 unchanged canonical puzzles, hashes match the current canonical build, and the canonical sources are identical to HEAD",()=>{
  const b=baseline();assert.equal(b.entries.length,52);
  b.entries.forEach(e=>{assert.ok(canonicalIds.has(e.puzzleId),e.puzzleId);assert.equal(H.hashOf(canon.get(e.puzzleId)),e.sha256,e.puzzleId)});
  const retired=new Set(gated().retired.map(r=>r.puzzleId));b.entries.forEach(e=>assert.equal(retired.has(e.puzzleId),false,"the six replaced puzzles are not in the legacy baseline"));
  const files=["content/shared-puzzle-library-2027.json","content/2027-new-world-puzzle-banks.json","content/credit-game-terms.js","content/money-basics-terms.js","content/banking-basics-terms.js","content/investing-basics-terms.js","content/crypto-terms.js","src/v3-puzzle-slate.js","worlds/crypto.js"];
  try{cp.execFileSync("git",["diff","--quiet","HEAD","--",...files],{cwd:ROOT})}catch(e){if(e.status===1)assert.fail("canonical sources differ from HEAD");if(e.code!=="ENOENT")throw e}
});
test("the complete 61-level sequence passes release validation (52 legacy exact matches + 9 fully validated upgrades)",()=>{
  const r=run();assert.deepEqual(r.errors,[]);assert.equal(r.valid,true);assert.deepEqual(r.summary,{entries:61,legacyVerified:52,upgradedVerified:9});
  assert.equal(view().entries.filter(e=>e.compositionRuleVersion==="v1").length,52);
});
test("v1 is not generally releasable: without the exception the gate still refuses every v1 entry, and the shipped candidate stays closed",()=>{
  const r=S.validateManifest(view(),{release:true});assert.equal(r.valid,false);assert.equal(r.errors.filter(e=>/releaseRequiresRuleV2OrV3/.test(e)).length,52);
  const g=gated();assert.equal(g.releaseGate.status,"closed");assert.equal(g.devOnly,true);assert.equal(S.validateManifest(g,{release:true,legacy:{baseline:Rel.baselineMap(baseline()),contentHash:id=>H.hashOf(canon.get(id))}}).valid,false,"candidate/dev entries still fail");
  assert.equal(S.validateManifest(view(),{release:true,legacy:{baseline:{},contentHash:()=>null}}).valid,false,"a malformed exception grants nothing");
});
test("legacy rejections: changed content, unknown IDs, changed entries and anything outside the baseline",()=>{
  // content changed after baseline
  const mod=new Map(canon);const p=structuredClone(mod.get("FQ-V3:business:FREELANCE:R1"));p.answers[1].word=p.answers[1].word+"S";mod.set(p.id,p);
  assert.ok(run({canonicalPuzzles:mod}).errors.some(e=>/FREELANCE.*legacyContentChanged|legacyContentChanged/.test(e)));
  const missing=new Map(canon);missing.delete("FQ-V3:business:FREELANCE:R1");assert.ok(run({canonicalPuzzles:missing}).errors.some(e=>/legacyContentUnverified/.test(e)));
  // unknown ID in the legacy lane
  let m=view();m.entries.push({position:62,puzzleId:"FQ-V3:credit:APR:R9",anchor:"APR",replaces:[],compatibility:null,compositionRuleVersion:"v1",releaseStatus:"approved",validation:{}});
  let r=run({manifest:m});assert.ok(r.errors.some(e=>/legacyNotInBaseline/.test(e)));assert.ok(r.errors.some(e=>/legacyUnknownId/.test(e)));
  // a modified/new puzzle cannot hide in the v1 lane
  m=view();m.entries.find(e=>e.anchor==="RETAIL").compositionRuleVersion="v1";assert.ok(run({manifest:m}).errors.some(e=>/legacyNotInBaseline/.test(e)));
  // entry shape changes
  m=view();m.entries[0].anchor="CHANGED";assert.ok(run({manifest:m}).errors.some(e=>/legacyAnchorChanged/.test(e)));
  m=view();m.entries[0].replaces=["FQ-V3:business:OTHER:R1"];m.entries[0].compatibility="fresh";assert.ok(run({manifest:m}).errors.some(e=>/legacyEntryChanged/.test(e)));
  // baseline missing or altered hash
  assert.ok(run({baseline:{entries:[]}}).errors.includes("baselineMissing"));
  const b=baseline();b.entries[3].sha256="0".repeat(64);assert.ok(run({baseline:b}).errors.some(e=>/legacyContentChanged/.test(e)));
});
test("the nine upgraded puzzles keep full release validation: fillers, term records, rule versions, records and status",()=>{
  // unapproved filler
  let w=whitelist();w.entries.find(e=>e.fillerId==="filler.act").productionApproved=false;assert.ok(run({whitelist:w}).errors.some(e=>/CREDIT.*fillerNotProductionApproved/.test(e)));
  w=whitelist();w.entries.find(e=>e.fillerId==="filler.line").approvedInPuzzles=[];assert.ok(run({whitelist:w}).errors.some(e=>/RETAIL.*fillerNotApprovedForPuzzle/.test(e)));
  w=whitelist();w.entries=w.entries.filter(e=>e.fillerId!=="filler.read");assert.ok(run({whitelist:w}).errors.some(e=>/fillerNotWhitelisted/.test(e)));
  // missing / altered term records
  let t=new Map(terms);t.delete("credit.default");assert.ok(run({termDefinitions:t}).errors.some(e=>/DEFAULT.*missingTermRecord|missingTermRecord DEFAULT/.test(e)));
  t=new Map(terms);t.delete("moneybasics.fee");assert.ok(run({termDefinitions:t}).errors.some(e=>/missingTermRecord FEE/.test(e)));
  t=new Map(terms);t.set("investing.bid","a different definition");assert.ok(run({termDefinitions:t}).errors.some(e=>/termDefinitionMismatch BID/.test(e)));
  // rule version, record and status
  let m=view();m.entries.find(e=>e.anchor==="CREDIT").compositionRuleVersion="v2";assert.ok(run({manifest:m}).errors.some(e=>/CREDIT.*ruleVersionMismatch/.test(e)));
  const p=nine();p.delete("FQ-V3:credit:CREDIT:R1");assert.ok(run({puzzles:p}).errors.some(e=>/unknownPuzzle/.test(e)));
  m=view();m.entries.find(e=>e.anchor==="TRADE").releaseStatus="candidate";assert.ok(run({manifest:m}).errors.some(e=>/releaseRequiresApproved/.test(e)));
  m=view();m.entries.find(e=>e.anchor==="TRADE").validation.definitionsVerified=false;assert.ok(run({manifest:m}).errors.some(e=>/validation\.definitionsVerified/.test(e)));
  m=view();m.devOnly=true;assert.ok(run({manifest:m}).errors.some(e=>/releaseRequiresDevOnlyFalse/.test(e)));
  // an unapproved collision
  const dup=nine();const c=structuredClone(dup.get("FQ-V3:credit:CREDIT:R1"));
  m=view();m.entries.find(e=>e.anchor==="CREDIT").puzzleId=[...canonicalIds][0];assert.equal(run({manifest:m}).valid,false);
});
test("compatibility preserved: save version 4, v2 rules and v3 support, canonical library and the two non-level surfaces are untouched",()=>{
  const L=require("../learning-engine.js");assert.equal(L.CURRENT_SAVE_VERSION,4);
  assert.equal(R.RULE_VERSION,"v2");assert.equal(S.RULE_VERSIONS.has("v1")&&S.RULE_VERSIONS.has("v2")&&S.RULE_VERSIONS.has("v3"),true);
  assert.equal(read("content/shared-puzzle-library-2027.json").uniquePuzzleCount,58);
  const idx=require("node:fs").readFileSync(require("node:path").join(ROOT,"scripts/build-www.sh"),"utf8");["unified-legacy","unified-sequence-v2"].forEach(x=>assert.equal(idx.includes(x),false));
});

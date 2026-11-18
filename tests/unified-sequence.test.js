const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const S=require("../src/unified-sequence.js");
const dev=require("../content/unified-sequence-dev.js");
const lib=JSON.parse(fs.readFileSync(require.resolve("../content/shared-puzzle-library-2027.json"),"utf8"));
const libIds=new Set(Object.values(lib.worldPlacements).flat().map(p=>p.puzzleId));
const mk=(n)=>({sequenceId:"s",sequenceVersion:1,devOnly:true,entries:Array.from({length:n},(_,i)=>({position:i+1,puzzleId:"P"+(i+1),compositionRuleVersion:"v1",releaseStatus:"development",validation:{}})),retired:[]});
test("the development manifest is valid, development-only, and references only canonical puzzles",()=>{
  const r=S.validateManifest(dev,{library:libIds});assert.deepEqual(r.errors,[]);assert.equal(dev.devOnly,true);assert.equal(dev.entries.length,58);
  assert.equal(new Set(dev.entries.map(e=>e.puzzleId)).size,58);assert.equal(dev.entries[0].anchor,"FREELANCE");
  assert.equal(JSON.stringify(dev).includes('"question"'),false,"no puzzle definitions copied into the manifest");
});
test("the canonical library and 2027 placements are untouched by the manifest",()=>{
  assert.equal(lib.uniquePuzzleCount,58);assert.equal(lib.totalWorldPlacements,195);
});
test("release validation fails for any development entry or dev-only manifest",()=>{
  const r=S.validateManifest(dev,{library:libIds,release:true});
  assert.ok(r.errors.includes("releaseRequiresDevOnlyFalse"));assert.ok(r.errors.some(e=>e.endsWith("releaseRequiresApproved")));assert.ok(r.errors.some(e=>e.endsWith("releaseRequiresRuleV2OrV4")));
});
test("manifest validation catches duplicates, gaps, unknown puzzles, bad versions, and missing metadata",()=>{
  const m=mk(3);m.entries[1].puzzleId="P1";m.entries[2].position=9;m.entries[0].compositionRuleVersion="v9";m.entries[1].releaseStatus="legacy";delete m.entries[2].validation;
  const r=S.validateManifest(m,{library:new Set(["P3"])});
  ["entry 2: duplicatePuzzleId","entry 3: positionContiguous","entry 1: compositionRuleVersion","entry 2: releaseStatus","entry 3: validationMetadata","entry 1: unknownCanonicalPuzzle"].forEach(e=>assert.ok(r.errors.includes(e),e));
  assert.ok(S.validateManifest({...mk(1),devOnly:undefined}).errors.includes("devOnlyFlagRequired"));
});
test("replacements require fresh compatibility; inherit is rejected; lineage cycles are rejected",()=>{
  const m=S.replace(mk(2),1,{puzzleId:"P1b",compositionRuleVersion:"v2",releaseStatus:"development",validation:{}});
  assert.deepEqual(S.validateManifest(m).errors,[]);assert.equal(m.entries[0].compatibility,"fresh");
  const inherit=structuredClone(m);inherit.entries[0].compatibility="inherit";assert.ok(S.validateManifest(inherit).errors.includes("entry 1: replacesRequiresFreshCompatibility"));
  const missing=structuredClone(m);missing.entries[0].replaces=["ghost"];assert.ok(S.validateManifest(missing).errors.includes("entry 1: replacedIdNotRetired"));
  const stray=structuredClone(mk(1));stray.entries[0].compatibility="fresh";assert.ok(S.validateManifest(stray).errors.includes("entry 1: compatibilityWithoutReplacement"));
  const cyc=structuredClone(m);cyc.retired=[{puzzleId:"P1",replaces:["Q"]},{puzzleId:"Q",replaces:["P1"]}];assert.ok(S.validateManifest(cyc).errors.some(e=>e.includes("lineageCycle")));
});
test("insert, append and replace renumber positions and bump the sequence version",()=>{
  const base=mk(3),e={puzzleId:"N",compositionRuleVersion:"v2",releaseStatus:"development",validation:{}};
  const ins=S.insert(base,2,e),app=S.append(base,e),rep=S.replace(base,3,e);
  assert.deepEqual(ins.entries.map(x=>x.puzzleId),["P1","N","P2","P3"]);assert.deepEqual(ins.entries.map(x=>x.position),[1,2,3,4]);
  assert.equal(app.entries.at(-1).puzzleId,"N");assert.deepEqual(rep.retired.map(x=>x.puzzleId),["P3"]);
  [ins,app,rep].forEach(m=>{assert.equal(m.sequenceVersion,2);assert.deepEqual(S.validateManifest(m).errors,[])});
  assert.equal(base.sequenceVersion,1,"inputs are never mutated");
});
test("released manifests may only insert, append or replace: deletes and reorders fail",()=>{
  const base=mk(3),e={puzzleId:"N",compositionRuleVersion:"v2",releaseStatus:"development",validation:{}};
  assert.equal(S.validateEvolution(base,S.insert(base,1,e)).valid,true);assert.equal(S.validateEvolution(base,S.append(base,e)).valid,true);assert.equal(S.validateEvolution(base,S.replace(base,2,e)).valid,true);
  const del=structuredClone(base);del.entries.splice(1,1);del.entries.forEach((x,i)=>x.position=i+1);del.sequenceVersion=2;
  assert.ok(S.validateEvolution(base,del).errors.some(x=>x.startsWith("removedWithoutReplacement")));
  const re=structuredClone(base);re.entries.reverse().forEach((x,i)=>x.position=i+1);re.sequenceVersion=2;assert.ok(S.validateEvolution(base,re).errors.includes("reordered"));
});
test("player-facing level text is only 'Level N' and never carries internal status words",()=>{
  dev.entries.forEach(entry=>{const text=JSON.stringify(S.levelDisplay(entry));assert.match(text,/^\{"title":"Level \d+"\}$/);assert.equal(/legacy|draft|development|approved|candidate|v1|v2|dev/i.test(text),false)});
});
test("development-only content gating: dev data is flagged and never marked approved",()=>{
  const wl=require("../content/unified-filler-whitelist-dev.js");
  assert.equal(wl.devOnly,true);assert.equal(wl.productionApproved,false);wl.entries.forEach(e=>{assert.equal(e.productionApproved,false);assert.equal(e.ownerReview,"pending")});
  dev.entries.forEach(e=>{assert.equal(e.releaseStatus,"development");assert.equal(e.validation.ownerApproved,false)});
  ["PAT","TOY","NOTE","TEEN","PAIN","DIET","TOP","PUT","SINCE","CODE","DATA","LEVEL","WORD"].forEach(w=>assert.equal(wl.entries.some(e=>e.word===w),false,w+" must not be whitelisted"));
  assert.equal(wl.entries.length,35);
});

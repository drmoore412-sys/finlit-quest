const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
const engine=require(path.join(ROOT,"src/game-engine.js"));
const validator=require(path.join(ROOT,"src/puzzle-validator.js"));
const slate=require(path.join(ROOT,"src/v3-puzzle-slate.js"));
const banks=require(path.join(ROOT,"content/2027-new-world-puzzle-banks.json"));
const terms=require(path.join(ROOT,"content/2027-new-world-terms.json"));
const definitions=require(path.join(ROOT,"content/world-definitions-2027.json"));
const shared=require(path.join(ROOT,"content/shared-puzzle-library-2027.json"));

const EXPECTED={coins:4,ai_technology:1,real_estate:2,taxes:3,insurance:4,business:10,social_media:2,retirement:5};
const originalSpecs=slate.SPECS.map(spec=>`${spec.worldId}:${spec.anchor}`);

test("31 qualifying proposals activate all eight new worlds without altering the original 27",()=>{
  assert.equal(banks.approvedProposalCount,31);
  assert.deepEqual(Object.fromEntries(Object.entries(banks.banks).map(([id,bank])=>[id,bank.length])),EXPECTED);
  assert.equal(Object.values(banks.banks).flat().length,31);
  assert.equal(originalSpecs.length,27);
  assert.deepEqual(definitions.worlds.slice(5).map(world=>[world.id,world.implementedPuzzleCount]),Object.keys(EXPECTED).map(id=>[id,15]));
  assert.equal(shared.uniquePuzzleCount,58);
});

test("every activated puzzle passes the strict V3 validator",()=>{
  const seen=new Set();
  for(const puzzle of Object.values(banks.banks).flat()){
    const result=validator.validateV3Puzzle(puzzle,{canFormFn:engine.canForm,validateCrosswordLayoutFn:engine.validateCrosswordLayout,existingIds:seen,wheelBudget:9});
    assert.deepEqual(result,{valid:true,errors:[]},`${puzzle.id}: ${result.errors.join(", ")}`);
    assert.equal(puzzle.anchorWord.length,9,puzzle.id);
    assert.equal(puzzle.contentStatus,"owner-approved-playable",puzzle.id);
    seen.add(puzzle.id);
  }
});

test("permanent term identities are unique, complete, and stable across repeated answers",()=>{
  const registry=new Map(terms.terms.map(term=>[term.id,term]));
  assert.equal(registry.size,terms.terms.length);
  const observed=new Map();
  for(const puzzle of Object.values(banks.banks).flat())for(const answer of puzzle.answers){
    if(answer.category==="ordinary"){
      assert.equal(answer.word,"FRACTION");
      assert.equal(answer.termId,null);
      continue;
    }
    assert.ok(answer.termId&&answer.masteryId===answer.termId,puzzle.id);
    const signature=JSON.stringify([answer.word,answer.definition,answer.worldId]);
    if(observed.has(answer.termId))assert.equal(signature,observed.get(answer.termId),answer.termId);
    observed.set(answer.termId,signature);
    if(registry.has(answer.termId))assert.equal(answer.definition,registry.get(answer.termId).definition,answer.termId);
    if(answer.worldId!==puzzle.worldId)assert.equal(answer.crossWorld,true,`${puzzle.id}/${answer.word}`);
  }
});

test("three ineligible anchors are rejected with explicit reasons",()=>{
  assert.deepEqual(banks.rejectedProposals.map(item=>item.candidateId),["FQ-2027-INSURANCE-04","FQ-2027-INSURANCE-05","FQ-2027-RETIREMENT-02"]);
  assert.match(banks.rejectedProposals[0].reason,/not a financial, business, or technology key term/);
  assert.match(banks.rejectedProposals[1].reason,/healthcare procedure/);
  assert.match(banks.rejectedProposals[2].reason,/general social concept/);
});

test("runtime registers all 13 save namespaces and resolves every world through canonical puzzle references",()=>{
  const runtime=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  for(const worldId of Object.keys(EXPECTED)){
    assert.match(runtime,new RegExp(`${worldId.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}: \\{`));
    assert.ok(shared.worldPlacements[worldId].length===15);
  }
  assert.equal(new Set([...runtime.matchAll(/key: "(wg-[^"]+)"/g)].map(match=>match[1])).size,13);
  assert.match(runtime,/manifest\.worldPlacements\[worldId\]/);
  assert.match(runtime,/library\.get\(reference\.puzzleId\)/);
});

test("generated web adapter data exactly matches its JSON source",()=>{
  const jsTerms=require(path.join(ROOT,"content/2027-new-world-terms.js"));
  const jsBanks=require(path.join(ROOT,"content/2027-new-world-puzzle-banks.js"));
  assert.deepEqual(jsTerms,terms);
  assert.deepEqual(jsBanks,banks);
});

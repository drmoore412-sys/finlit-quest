const test=require("node:test");
const assert=require("node:assert/strict");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
const bank=require(path.join(ROOT,"src/puzzle-bank-engine.js"));
const slate=require(path.join(ROOT,"src/v3-puzzle-slate.js"));
const shared=require(path.join(ROOT,"content/shared-puzzle-library-2027.json"));
const generated=require(path.join(ROOT,"content/2027-new-world-puzzle-banks.json"));

test("shared library keeps 58 canonical identities and 195 reference-only placements",()=>{
  assert.equal(shared.uniquePuzzleCount,58);
  assert.equal(shared.canonicalPuzzleIndex.length,58);
  assert.equal(new Set(shared.canonicalPuzzleIndex.map(item=>item.id)).size,58);
  assert.equal(Object.values(shared.worldPlacements).flat().length,195);
  assert.equal(new Set(Object.values(shared.worldPlacements).flat().map(item=>item.puzzleId)).size,58);
  for(const [worldId,placements] of Object.entries(shared.worldPlacements)){
    assert.equal(placements.length,15,worldId);
    assert.equal(new Set(placements.map(item=>item.puzzleId)).size,15,worldId);
    assert.deepEqual(placements.map(item=>item.position),Array.from({length:15},(_,index)=>index+1),worldId);
    placements.filter(item=>item.placementType==="shared").forEach(item=>assert.ok(item.relevance.includes(":"),`${worldId}/${item.puzzleId}`));
  }
});

test("the five original worlds retain their exact canonical puzzle order",()=>{
  for(const worldId of ["moneybasics","credit","crypto","banking","investing"]){
    const expected=slate.SPECS.filter(spec=>spec.worldId===worldId).map(spec=>slate.puzzleId(spec.worldId,spec.anchor,spec.revision||slate.CONTENT_REVISION));
    assert.deepEqual(shared.worldPlacements[worldId].slice(0,expected.length).map(item=>item.puzzleId),expected,worldId);
  }
});

test("every placement resolves to exactly one existing canonical definition",()=>{
  const ids=new Set(slate.SPECS.map(spec=>slate.puzzleId(spec.worldId,spec.anchor,spec.revision||slate.CONTENT_REVISION)));
  Object.values(generated.banks).flat().forEach(puzzle=>{assert.ok(!ids.has(puzzle.id),puzzle.id);ids.add(puzzle.id)});
  assert.equal(ids.size,58);
  for(const placement of Object.values(shared.worldPlacements).flat())assert.ok(ids.has(placement.puzzleId),placement.puzzleId);
});

test("canonical progress migrates old world history without erasing world-specific progress",()=>{
  const puzzle=generated.banks.coins[0],worlds={"wg-coins":{puzzleHistory:{[puzzle.id]:{timesPlayed:2,lastPlayedAt:100}}},"wg-crypto":{puzzleHistory:{[puzzle.id]:{timesPlayed:1,lastPlayedAt:200}}}};
  const frozen=structuredClone(worlds);
  const progress=bank.migrateCanonicalPuzzleProgress({},[puzzle],worlds,{"wg-coins":"coins","wg-crypto":"crypto"});
  assert.deepEqual(worlds,frozen,"migration never changes per-world curriculum history");
  assert.equal(progress[puzzle.id].timesCompleted,3);
  assert.deepEqual(progress[puzzle.id].worldIds,["coins","crypto"]);
  assert.deepEqual(new Set(progress[puzzle.id].rewardedAnswers),new Set(puzzle.requiredWords));
});

test("a shared puzzle answer pays once canonically while another world can still record curriculum completion",()=>{
  const puzzle=generated.banks.coins[0],answer=puzzle.requiredWords[0],histories={solvedWords:[],rewardedFinancialTermIds:[],rewardedOrdinaryWords:[],rewardedSupportWords:[]};
  const first=bank.canonicalAnswerReward(puzzle,answer,histories,{});
  assert.ok(first.coins>0&&first.isNewSolve);
  const record=bank.recordCanonicalAnswer({},answer),repeat=bank.canonicalAnswerReward(puzzle,answer,histories,record);
  assert.deepEqual({coins:repeat.coins,xp:repeat.xp,isNewSolve:repeat.isNewSolve},{coins:0,xp:0,isNewSolve:false});
  const completed=bank.recordCanonicalCompletion(record,"coins",10),sharedCompletion=bank.recordCanonicalCompletion(completed,"crypto",20);
  assert.equal(sharedCompletion.timesCompleted,2);
  assert.deepEqual(sharedCompletion.worldIds,["coins","crypto"]);
});

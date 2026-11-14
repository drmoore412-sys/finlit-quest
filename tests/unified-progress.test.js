const test=require("node:test");
const assert=require("node:assert/strict");
const U=require("../src/unified-progress.js");
const S=require("../src/unified-sequence.js");
const bank=require("../src/puzzle-bank-engine.js");
const NOW="2026-11-13T00:00:00.000Z";
const entry=(position,puzzleId,extra={})=>({position,puzzleId,compositionRuleVersion:"v1",releaseStatus:"development",validation:{},replaces:[],compatibility:null,...extra});
const manifest=(ids,extra={})=>({sequenceId:"main-levels",sequenceVersion:1,devOnly:true,entries:ids.map((id,i)=>entry(i+1,id)),retired:[],...extra});
const done=(...ids)=>Object.fromEntries(ids.map(id=>[id,{timesCompleted:1,firstCompletedAt:1,lastCompletedAt:1,rewardedAnswers:[],worldIds:[]}]));
const save=(canonical={},extra={})=>({saveVersion:5,player:{coins:10,xp:5},canonicalPuzzleProgress:canonical,...extra});
const M5=manifest(["A","B","C","D","E"]);
const frontier=(s,m=M5)=>U.normalize(s,m,NOW).ordinal+1;

test("N1 brand-new save starts at level 1 and unlocks one level at a time",()=>{
  const s=save(),states=U.levelStates(s,M5,NOW).map(x=>x.state);
  assert.deepEqual(states,["current","locked","locked","locked","locked"]);
  assert.equal(U.canPlay(s,M5,"B",NOW),false);
  s.canonicalPuzzleProgress=done("A");
  assert.equal(U.canPlay(s,M5,"B",NOW),true);assert.equal(U.canPlay(s,M5,"C",NOW),false);
});
test("N2/N3 existing completions: frontier is the first incomplete level; completed levels ahead stay playable",()=>{
  assert.equal(frontier(save(done("A","B","C"))),4);
  const s=save(done("A","D"));
  assert.equal(frontier(s),2);
  const states=Object.fromEntries(U.levelStates(s,M5,NOW).map(x=>[x.puzzleId,x.state+"/"+x.playable]));
  assert.deepEqual(states,{A:"completed/true",B:"current/true",C:"locked/false",D:"completed/true",E:"locked/false"});
});
test("M1 malformed unified-progress values are treated as missing and never throw",()=>{
  [null,[],"x",7,true,{},{frontier:"zz"},{frontier:null}].forEach(bad=>{
    const s=save(done("A"),{unifiedProgress:bad});
    const r=U.normalize(s,M5,NOW);assert.equal(r.ordinal+1,2,JSON.stringify(bad));assert.equal(r.readOnly,false);
    U.apply(s,M5,NOW);assert.equal(s.unifiedProgress.frontier.puzzleId,"B");
  });
  assert.doesNotThrow(()=>U.normalize(null,M5,NOW));assert.doesNotThrow(()=>U.normalize(save(),null,NOW));assert.doesNotThrow(()=>U.normalize(save(),{entries:"bad"},NOW));
});
test("M2/M3/P1/P2 bad or partial frontier fields are repaired",()=>{
  [-3,0,1.5,NaN,"2",Infinity].forEach(p=>assert.equal(frontier(save({}, {unifiedProgress:{schemaVersion:1,sequenceId:"main-levels",sequenceVersion:1,frontier:{position:p,puzzleId:"A"}}})),1));
  assert.equal(frontier(save(done("A"),{unifiedProgress:{frontier:{position:3}}})),3,"position only");
  assert.equal(frontier(save(done("A"),{unifiedProgress:{frontier:{puzzleId:"C"}}})),3,"puzzleId only");
  assert.equal(frontier(save({}, {unifiedProgress:{frontier:{puzzleId:"nope",position:2}}})),2,"unknown id falls back to clamped position");
  assert.equal(frontier(save({}, {unifiedProgress:{frontier:{position:99}}})),5,"position above N clamps");
});
test("M4 unknown fields inside unifiedProgress and frontier are preserved",()=>{
  const s=save(done("A"),{unifiedProgress:{schemaVersion:1,sequenceId:"main-levels",sequenceVersion:1,futureKey:{deep:[1,2,{x:1}]},frontier:{position:1,puzzleId:"A",hint:"keep"},updatedAt:"old"}});
  U.apply(s,M5,NOW);
  assert.deepEqual(s.unifiedProgress.futureKey,{deep:[1,2,{x:1}]});assert.equal(s.unifiedProgress.frontier.hint,"keep");assert.equal(s.unifiedProgress.frontier.puzzleId,"B");
});
test("F1-F3 future schema, other sequence id, or newer sequence version is read-only",()=>{
  const cases=[["future-schema",{schemaVersion:2,sequenceId:"main-levels",sequenceVersion:1,frontier:{position:4,puzzleId:"D"},z:1}],["sequence-mismatch",{schemaVersion:1,sequenceId:"other",sequenceVersion:1,frontier:{position:4,puzzleId:"D"}}],["future-sequence-version",{schemaVersion:1,sequenceId:"main-levels",sequenceVersion:9,frontier:{position:4,puzzleId:"D"}}]];
  cases.forEach(([reason,block])=>{
    const s=save(done("A"),{unifiedProgress:structuredClone(block)}),before=JSON.stringify(s);
    const r=U.apply(s,M5,NOW);assert.equal(r.readOnly,true);assert.equal(r.reason,reason);assert.equal(JSON.stringify(s),before,"save untouched");
    assert.ok(r.ordinal>=1,"still usable for access");
  });
});
test("O1 oversized block is rebuilt from known fields only",()=>{
  const s=save(done("A"),{unifiedProgress:{schemaVersion:1,sequenceId:"main-levels",sequenceVersion:1,frontier:{position:1,puzzleId:"A"},junk:"x".repeat(U.MAX_BLOCK_CHARS+10)}});
  const r=U.apply(s,M5,NOW);assert.equal(r.reason,"oversize-rebuilt");assert.equal(s.unifiedProgress.junk,undefined);assert.equal(s.unifiedProgress.frontier.puzzleId,"B");
});
test("I1/I2 insertions behind the frontier never move the player backward; appended levels need unlocking",()=>{
  const s=save(done("A","B"));U.apply(s,M5,NOW);assert.equal(s.unifiedProgress.frontier.puzzleId,"C");
  const inserted=S.insert(M5,2,entry(0,"NEW",{}));
  const states=Object.fromEntries(U.levelStates(s,inserted,NOW).map(x=>[x.puzzleId,x.state]));
  assert.equal(states.NEW,"available","inserted incomplete level behind frontier is playable");
  U.apply(s,inserted,NOW);assert.equal(s.unifiedProgress.frontier.puzzleId,"C");assert.equal(s.unifiedProgress.frontier.position,4,"frontier follows its puzzle, never decreases");
  const appended=S.append(inserted,entry(0,"LAST"));assert.equal(U.levelStates(s,appended,NOW).pop().state,"locked");
});
test("R1-R5 fresh revisions and replacement chains keep earned access",()=>{
  const s=save(done("A","B"));U.apply(s,M5,NOW);
  const r1=S.replace(M5,2,entry(0,"B2"));
  assert.equal(r1.entries[1].compatibility,"fresh");
  let states=Object.fromEntries(U.levelStates(s,r1,NOW).map(x=>[x.puzzleId,x.state]));
  assert.equal(states.B2,"available","revised puzzle is incomplete (fresh) but playable (earned)");
  assert.equal(U.solved(s,"B2"),false);
  const r2=S.replace(r1,2,entry(0,"B3"));
  assert.deepEqual([...U.replacedIds(U.indexManifest(r2),r2.entries[1])].sort(),["B","B2"],"chain lineage");
  assert.equal(U.canPlay(s,r2,"B3",NOW),true);
  U.apply(s,r2,NOW);assert.equal(s.unifiedProgress.frontier.puzzleId,"C","frontier never goes back to the revised level");
  // frontier puzzle itself replaced: stored id follows lineage
  const t=save(done("A"));U.apply(t,M5,NOW);assert.equal(t.unifiedProgress.frontier.puzzleId,"B");
  const r3=S.replace(M5,2,entry(0,"B2"));U.apply(t,r3,NOW);assert.equal(t.unifiedProgress.frontier.puzzleId,"B2");
  // retired id not found anywhere: clamp, no throw
  const u=save({}, {unifiedProgress:{frontier:{puzzleId:"GONE",position:3}}});assert.equal(frontier(u),3);
});
test("C1-C5 completion advances one level, skips completed runs, stops at the end, ignores replays, never decreases",()=>{
  const s=save();U.apply(s,M5,NOW);assert.equal(s.unifiedProgress.frontier.position,1);
  s.canonicalPuzzleProgress={...done("A")};U.apply(s,M5,NOW);assert.equal(s.unifiedProgress.frontier.position,2);
  s.canonicalPuzzleProgress={...done("A","C","D")};s.canonicalPuzzleProgress.B={timesCompleted:1};U.apply(s,M5,NOW);assert.equal(s.unifiedProgress.frontier.position,5,"skips the completed run");
  s.canonicalPuzzleProgress.E={timesCompleted:1};U.apply(s,M5,NOW);assert.equal(s.unifiedProgress.frontier.position,5,"last level stays at N");
  const stamp=s.unifiedProgress.updatedAt;s.canonicalPuzzleProgress.A.timesCompleted=4;const r=U.apply(s,M5,"2027-01-01T00:00:00.000Z");
  assert.equal(r.changed,false);assert.equal(s.unifiedProgress.updatedAt,stamp,"replay writes nothing");
  s.canonicalPuzzleProgress={};U.apply(s,M5,NOW);assert.equal(s.unifiedProgress.frontier.position,5,"lost completions never lower the frontier");
});
test("X1-X3 only unifiedProgress changes, and normalization is idempotent",()=>{
  const raw=save(done("A"),{worlds:{"wg-credit":{puzzleHistory:{P:{timesPlayed:2}}}},termProgress:{"x.y":{masteryLevel:3}},settings:{theme:"dark"},engagement:{streak:{n:4}},"future":{k:1}});
  const before=structuredClone(raw);U.apply(raw,M5,NOW);
  const {unifiedProgress,...rest}=raw;assert.deepEqual(rest,before);
  const once=structuredClone(raw);U.apply(raw,M5,"2030-01-01T00:00:00.000Z");assert.deepEqual(raw,once);
});
test("the legacy shuffle key and local storage are never read or written",()=>{
  const source=require("node:fs").readFileSync(require.resolve("../src/unified-progress.js"),"utf8");
  assert.equal(/puzzleOrder|localStorage|sessionStorage/.test(source),false);
});
test("Y1 reward-once: revised puzzles never repay previously rewarded answers; new answers pay normally",()=>{
  const generated=JSON.parse(require("node:fs").readFileSync(require.resolve("../content/2027-new-world-puzzle-banks.json"),"utf8"));
  const puzzle=generated.banks.coins[0],[first,second]=puzzle.requiredWords,histories={solvedWords:[],rewardedFinancialTermIds:[],rewardedOrdinaryWords:[],rewardedSupportWords:[]};
  const m=S.replace(manifest(["OLD","X"]),1,entry(0,puzzle.id));
  const s=save({OLD:{timesCompleted:1,rewardedAnswers:[first]}});
  const record=U.lineageRewardRecord(s,m,puzzle.id);
  assert.deepEqual(record.rewardedAnswers,[first]);
  const old=bank.canonicalAnswerReward(puzzle,first,histories,record),fresh=bank.canonicalAnswerReward(puzzle,second,histories,record);
  assert.deepEqual({coins:old.coins,xp:old.xp,isNewSolve:old.isNewSolve},{coins:0,xp:0,isNewSolve:false});
  assert.ok(fresh.coins>0&&fresh.isNewSolve,"a newly introduced answer pays its normal first-solve reward");
  assert.equal(U.solved(s,puzzle.id),false,"fresh: the revision is not completed");assert.equal(s.canonicalPuzzleProgress.OLD.timesCompleted,1,"historical record intact");
});

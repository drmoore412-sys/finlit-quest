// Gated candidate: main-levels sequenceVersion 2 (nine approved development puzzles). Development-only; release gate stays closed.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto"),cp=require("node:child_process");
const {ROOT}=require("./helpers.js");
const L=require("../src/unified-prototype-loader.js"),S=require("../src/unified-sequence.js"),R=require("../src/composition-rules.js"),G=require("../src/game-engine.js"),P=require("../src/unified-progress.js");
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f),"utf8")),text=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const v1=()=>read("content/unified-sequence-dev.json"),v2=()=>read("content/unified-sequence-v2-gated-dev.json");
const lib=read("content/shared-puzzle-library-2027.json"),canonicalIds=new Set(lib.canonicalPuzzleIndex.map(x=>x.id));
const canForm=(w,l)=>{const a=[...l];return [...w].every(c=>{const i=a.indexOf(c);if(i<0)return false;a.splice(i,1);return true})};
const deps={Sequence:S,Rules:R,canFormFn:canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout};
const run=(over={})=>L.loadGated({manifest:v2(),previousManifest:v1(),puzzleFile:read("content/unified-prototype-12-puzzles-dev.json"),whitelist:read("content/unified-prototype-12-whitelist-dev.json"),canonicalIds,...over},deps);
const NINE=["FQ-V3:credit:REPAYMENT:R2","FQ-V3:real_estate:APARTMENT:R2","FQ-V3:moneybasics:RECEIPT:R3","FQ-V3:investing:TRADE:R3","FQ-V3:investing:MARKET:R3","FQ-V3:investing:RETURN:R3","FQ-V3:business:RETAIL:R1","FQ-V3:credit:DEFAULT:R1","FQ-V3:credit:CREDIT:R1"];
const NOW="2026-11-14T00:00:00Z";
const fresh=()=>({coins:0,xp:0,termProgress:{},canonicalPuzzleProgress:{}});

test("gated v2 loads: nine candidates validate, the other 52 entries are unchanged, six replacements are retired",()=>{
  const r=run();assert.deepEqual(r.errors,[]);assert.equal(r.ok,true);assert.deepEqual([...r.library.keys()].sort(),[...NINE].sort());
  const a=v1(),b=v2();assert.equal(b.sequenceVersion,2);assert.equal(b.entries.length,61);assert.equal(b.sequenceId,"main-levels");
  const was=new Map(a.entries.map(e=>[e.puzzleId,e]));
  b.entries.filter(e=>e.releaseStatus!=="candidate").forEach(e=>assert.deepEqual({...was.get(e.puzzleId),position:0},{...e,position:0}));
  assert.equal(b.entries.filter(e=>e.releaseStatus!=="candidate").length,52);
  assert.deepEqual(b.retired.map(r=>r.puzzleId).sort(),["FQ-V3:credit:REPAYMENT:R1","FQ-V3:investing:MARKET:R2","FQ-V3:investing:RETURN:R2","FQ-V3:investing:TRADE:R2","FQ-V3:moneybasics:RECEIPT:R2","FQ-V3:real_estate:APARTMENT:R1"]);
  b.retired.forEach(x=>assert.equal(canonicalIds.has(x.puzzleId),true,"replaced puzzles keep their canonical record"));
  assert.deepEqual(b.entries.slice(58).map(e=>e.anchor),["RETAIL","DEFAULT","CREDIT"]);
  assert.deepEqual(S.validateEvolution(a,b).errors,[]);
});
test("v3 only where needed: REPAYMENT and APARTMENT stay v2, the seven new-wheel levels use v3",()=>{
  const c=v2().entries.filter(e=>e.releaseStatus==="candidate");
  assert.deepEqual(c.map(e=>e.compositionRuleVersion).sort(),["v2","v2","v3","v3","v3","v3","v3","v3","v3"]);
  assert.equal(R.RULE_VERSION,"v2");assert.equal(S.RULE_VERSIONS.has("v3"),true);
});
test("the production release gate stays closed: v3, development status and devOnly all refuse release",()=>{
  const rel=S.validateManifest(v2(),{release:true});assert.equal(rel.valid,false);
  assert.ok(rel.errors.includes("releaseRequiresDevOnlyFalse"));
  assert.ok(rel.errors.some(e=>/releaseRequiresRuleV2OrV4/.test(e)),"the 52 legacy v1 entries");assert.ok(rel.errors.some(e=>/releaseRequiresApproved/.test(e)));
  assert.equal(S.validateManifest(v2(),{release:true}).valid,false);
  assert.equal(S.validateManifest(v2()).valid,true);
  const m=v2();assert.equal(m.releaseGate.status,"closed");assert.equal(m.devOnly,true);
  m.releaseGate.status="open";assert.ok(run({manifest:m}).errors.includes("releaseGateMustBeClosed"));
  const n=v2();n.devOnly=false;assert.ok(run({manifest:n}).errors.includes("devOnlyRequired"));
});
test("gated loader refuses changed existing entries, missing records, collisions, unapproved fillers and stray records",()=>{
  let m=v2();m.entries[0].anchor="CHANGED";assert.ok(run({manifest:m}).errors.some(e=>/existingEntryChanged/.test(e)));
  let f=read("content/unified-prototype-12-puzzles-dev.json");f.puzzles.pop();assert.ok(run({puzzleFile:f}).errors.some(e=>/puzzleRecordMissing/.test(e)));
  f=read("content/unified-prototype-12-puzzles-dev.json");f.puzzles.push({...f.puzzles[0],id:"FQ-V3:credit:APR:R1"});assert.ok(run({puzzleFile:f}).errors.some(e=>/recordWithoutCandidateEntry/.test(e)));
  const w=read("content/unified-prototype-12-whitelist-dev.json");w.entries.find(e=>e.word==="ACT").approvedInPuzzles=[];assert.ok(run({whitelist:w}).errors.some(e=>/fillerNotApprovedForPuzzle|fillerNotWhitelisted/.test(e)));
  m=v2();m.entries.find(e=>e.anchor==="CREDIT").replaces=["FQ-V3:credit:NOPE:R1"];assert.equal(run({manifest:m}).ok,false);
  m=v2();m.sequenceVersion=1;assert.ok(run({manifest:m}).errors.some(e=>/sequenceVersionMustIncrease|evolution/.test(e)));
});
test("existing-player migration v1 to v2: progress, coins, XP and mastery untouched; replacements are playable via lineage",()=>{
  const a=v1(),b=v2();
  const save=fresh();save.coins=900;save.xp=140;save.termProgress={"credit.apr":{mastery:2}};
  // a mid-game player who has finished the first 10 levels, including APARTMENT:R1 (position 9)
  a.entries.slice(0,10).forEach(e=>{save.canonicalPuzzleProgress[e.puzzleId]={timesCompleted:1,rewardedAnswers:["TERM","APR"]}});
  P.apply(save,a,NOW);assert.equal(save.unifiedProgress.sequenceVersion,1);assert.equal(save.unifiedProgress.frontier.position,11);
  const before=JSON.stringify({c:save.coins,x:save.xp,t:save.termProgress,p:save.canonicalPuzzleProgress});
  const r=P.apply(save,b,NOW);assert.equal(r.readOnly,false);assert.equal(save.unifiedProgress.sequenceVersion,2);
  assert.equal(JSON.stringify({c:save.coins,x:save.xp,t:save.termProgress,p:save.canonicalPuzzleProgress}),before,"migration never writes coins, XP, mastery or puzzle progress");
  assert.equal(save.unifiedProgress.frontier.position,11,"frontier keeps its ordinal; level 11 is now the REPAYMENT replacement");
  assert.equal(save.unifiedProgress.frontier.puzzleId,"FQ-V3:credit:REPAYMENT:R2");
  const st=P.levelStates(save,b,NOW);const replacedPos=new Set([6,9]);assert.deepEqual(st.slice(0,10).map(s=>s.state),st.slice(0,10).map((s,i)=>replacedPos.has(i+1)?"available":"completed"),"unchanged levels stay completed; the two replaced levels are unlocked for their new content");assert.equal(st[10].state,"current");assert.equal(st[60].state,"locked");
  assert.equal(P.canPlay(save,b,"FQ-V3:real_estate:APARTMENT:R2",NOW),true,"old APARTMENT completion grants access to its replacement");
  assert.equal(st[8].playable,true);
});
test("no duplicate rewards: answers rewarded in a replaced puzzle never pay again in its replacement",()=>{
  const b=v2(),save=fresh();
  save.canonicalPuzzleProgress["FQ-V3:credit:REPAYMENT:R1"]={timesCompleted:1,rewardedAnswers:["REPAYMENT","TERM","APR","APY"]};
  save.canonicalPuzzleProgress["FQ-V3:investing:TRADE:R2"]={timesCompleted:2,rewardedAnswers:["TRADE","BEAR","REIT","ASK","DATE"]};
  const rep=P.lineageRewardRecord(save,b,"FQ-V3:credit:REPAYMENT:R2"),trade=P.lineageRewardRecord(save,b,"FQ-V3:investing:TRADE:R3");
  ["REPAYMENT","TERM","APR","APY"].forEach(w=>assert.ok(rep.rewardedAnswers.includes(w),w));
  ["TRADE","BEAR","REIT"].forEach(w=>assert.ok(trade.rewardedAnswers.includes(w),w));
  assert.equal(rep.rewardedAnswers.includes("NAME"),false,"new answers can still be rewarded once");assert.equal(trade.rewardedAnswers.includes("BID"),false);
  assert.equal(JSON.stringify(save.canonicalPuzzleProgress["FQ-V3:credit:REPAYMENT:R1"].rewardedAnswers),JSON.stringify(["REPAYMENT","TERM","APR","APY"]),"old record not mutated");
});
test("a player who finished all 58 lands on level 59 (RETAIL); a fresh player starts at level 1; rollback is read-only safe",()=>{
  const a=v1(),b=v2(),done=fresh();a.entries.forEach(e=>{done.canonicalPuzzleProgress[e.puzzleId]={timesCompleted:1}});
  P.apply(done,a,NOW);assert.equal(done.unifiedProgress.frontier.position,58);
  P.apply(done,b,NOW);const st=P.levelStates(done,b,NOW);
  assert.equal(st.slice(0,58).filter(s=>s.state==="completed").length,52);assert.equal(st.slice(0,58).filter(s=>s.state==="available"&&s.playable).length,6,"six replaced levels unlocked, none locked");assert.equal(st[58].state,"current");assert.equal(st[59].state,"locked");assert.equal(st[60].state,"locked");
  assert.equal(done.unifiedProgress.frontier.puzzleId,"FQ-V3:business:RETAIL:R1");
  const f=fresh();P.apply(f,b,NOW);assert.equal(f.unifiedProgress.frontier.position,1);assert.equal(P.levelStates(f,b,NOW)[0].state,"current");
  const snap=JSON.stringify(done);const back=P.apply(done,a,NOW);assert.equal(back.readOnly,true);assert.equal(back.reason,"future-sequence-version");assert.equal(JSON.stringify(done),snap,"an older build cannot damage a v2 save");
  const sf=fresh();[...b.entries.slice(58)].forEach((e,i)=>{});
  // finishing level 59, 60, 61 in order unlocks each next level
  let g=fresh();a.entries.forEach(e=>{g.canonicalPuzzleProgress[e.puzzleId]={timesCompleted:1}});P.apply(g,a,NOW);P.apply(g,b,NOW);
  // a finished player who never opened the unified map (no stored block) goes straight to level 59; replacements stay playable
  const nb=fresh();a.entries.forEach(e=>{nb.canonicalPuzzleProgress[e.puzzleId]={timesCompleted:1}});P.apply(nb,b,NOW);assert.equal(nb.unifiedProgress.frontier.position,59);assert.equal(nb.unifiedProgress.frontier.puzzleId,"FQ-V3:business:RETAIL:R1");
  assert.equal(P.canPlay(nb,b,"FQ-V3:business:RETAIL:R1",NOW),true);assert.equal(P.canPlay(nb,b,"FQ-V3:moneybasics:RECEIPT:R3",NOW),true,"replacement still playable for its new content");assert.equal(P.canPlay(nb,b,"FQ-V3:credit:DEFAULT:R1",NOW),false);
  ["FQ-V3:business:RETAIL:R1","FQ-V3:credit:DEFAULT:R1","FQ-V3:credit:CREDIT:R1"].forEach((id,i)=>{assert.equal(P.canPlay(g,b,id,NOW),true,id);g.canonicalPuzzleProgress[id]={timesCompleted:1};P.apply(g,b,NOW);if(i<2)assert.equal(P.levelStates(g,b,NOW)[59+i].state,"current")});
  assert.equal(P.levelStates(g,b,NOW).some(s=>s.state==="locked"||s.state==="current"),false);
});
test("every candidate key term resolves governed vocabulary only; fillers carry no term record",()=>{
  const r=run();r.library.forEach(p=>{p.answers.filter(a=>a.category!=="ordinary").forEach(a=>assert.ok(a.termId&&a.masteryId===a.termId&&a.definition&&a.definition.length>10,a.word));
    p.answers.filter(a=>a.category==="ordinary").forEach(a=>assert.deepEqual([a.termId,a.masteryId,a.definition],[null,null,null]))});
});
test("canonical library, main-levels v1 manifest and held anchors are untouched; production build excludes the development-only gated files",()=>{
  try{const head=cp.execFileSync("git",["show","HEAD:content/shared-puzzle-library-2027.json"],{cwd:ROOT,maxBuffer:1<<26}),sha=b=>crypto.createHash("sha256").update(b).digest("hex");
    // answer-expansion v1 (2026-11-18) regenerated the library (libraryVersion 2027.2). Puzzle IDs, anchors and world placements are unchanged;
    // only version metadata and the new architecture.answerExpansion pointer differ.
    const before=JSON.parse(head.toString("utf8")),after=JSON.parse(fs.readFileSync(path.join(ROOT,"content/shared-puzzle-library-2027.json"),"utf8"));
    for(const doc of [before,after]){delete doc.libraryVersion;delete doc.generatedOn;if(doc.architecture)delete doc.architecture.answerExpansion}
    assert.equal(sha(Buffer.from(JSON.stringify(before))),sha(Buffer.from(JSON.stringify(after))))}catch(e){if(e.code==="ENOENT")return;throw e}
  const a=v1();assert.equal(a.sequenceVersion,1);assert.equal(a.entries.length,58);assert.equal(a.retired.length,0);assert.equal(a.devOnly,true);
  assert.equal(lib.uniquePuzzleCount,58);assert.equal(canonicalIds.size,58);
  v2().entries.forEach(e=>["TITLE","CLIENT","TICKER"].forEach(h=>assert.notEqual(e.anchor,h)));
  const build=text("scripts/build-www.sh");["unified-sequence-v2-gated","unified-prototype-12","unified-sequence-dev","unified-filler-whitelist"].forEach(x=>assert.equal(build.includes(x),false,x));
  assert.equal(text("index.html").includes("unified-sequence-v2-gated"),false);
});
test("app wiring: the gated path needs the dev host flag plus ?unifiedGated=v2 and falls back to the 58-level sequence; iOS copy is identical",()=>{
  const app=text("word-game-app.js");
  assert.ok(/function fqUnifiedGatedEnabled\(\)\s*\{\s*try\s*\{\s*if \(!fqUnifiedDevEnabled\(\)\) return false;/.test(app));
  assert.ok(app.includes('"finlit.dev.unifiedGated"')&&app.includes('query === "v2"'));
  assert.ok(app.includes("Gated levels unavailable; using the 58-level sequence"));
  assert.equal(app,text("ios/App/App/public/word-game-app.js"));
});
test("the shared puzzle validator accepts v3 puzzles through the v3 rules and still rejects unknown versions",()=>{
  const V=require("../src/puzzle-validator.js"),puzzles=[...run().library.values()],wl=read("content/unified-prototype-12-whitelist-dev.json");
  const d={canFormFn:canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout,fillerWhitelist:wl,existingIds:canonicalIds,compositionRules:R};
  puzzles.forEach(p=>{const r=V.validatePuzzle(p,d);assert.deepEqual(r.errors,[],p.id)});
  assert.deepEqual(V.validatePuzzle({compositionRuleVersion:"v9"},{}).errors,["unknownCompositionRuleVersion"]);
  const v3=puzzles.find(p=>p.compositionRuleVersion==="v3"),bad=structuredClone(v3);bad.declaredExtraLetters=[];assert.ok(V.validatePuzzle(bad,d).errors.includes("anchorWheelInventory"));
});

test("completed-player progression: derived and stored paths agree, nothing is lost and no reward is created or removed",()=>{
  const a=v1(),b=v2(),all=()=>{const x=fresh();x.coins=1234;x.xp=567;x.termProgress={"credit.apr":{mastery:3}};a.entries.forEach(e=>{x.canonicalPuzzleProgress[e.puzzleId]={timesCompleted:2,rewardedAnswers:["TERM","APR"]}});return x};
  const noBlock=all(),withBlock=all();P.apply(withBlock,a,NOW);P.apply(noBlock,b,NOW);P.apply(withBlock,b,NOW);
  assert.equal(noBlock.unifiedProgress.frontier.position,withBlock.unifiedProgress.frontier.position);assert.equal(noBlock.unifiedProgress.frontier.position,59);
  [noBlock,withBlock].forEach(x=>{assert.deepEqual([x.coins,x.xp,x.termProgress],[1234,567,{"credit.apr":{mastery:3}}]);a.entries.forEach(e=>assert.deepEqual(x.canonicalPuzzleProgress[e.puzzleId],{timesCompleted:2,rewardedAnswers:["TERM","APR"]}));});
  // one level short: the frontier stops exactly there and the new levels stay locked
  const gap=all();delete gap.canonicalPuzzleProgress[a.entries[39].puzzleId];P.apply(gap,b,NOW);assert.equal(gap.unifiedProgress.frontier.position,40);assert.equal(P.canPlay(gap,b,"FQ-V3:business:RETAIL:R1",NOW),false);
  // a player who completed only some replaced puzzles' originals passes those levels, not the ones they never finished
  const part=fresh();a.entries.slice(0,12).forEach(e=>{part.canonicalPuzzleProgress[e.puzzleId]={timesCompleted:1}});P.apply(part,b,NOW);assert.equal(part.unifiedProgress.frontier.position,13);
  assert.equal(P.canPlay(part,b,"FQ-V3:credit:REPAYMENT:R2",NOW),true);
  // replacing a level never rewrites old records, and finishing a replacement is independent progress
  const rec=JSON.stringify(part.canonicalPuzzleProgress);part.canonicalPuzzleProgress["FQ-V3:credit:REPAYMENT:R2"]={timesCompleted:1};P.apply(part,b,NOW);assert.equal(JSON.stringify(part.canonicalPuzzleProgress).includes(rec.slice(1,-1)),true);
  // idempotent
  const once=JSON.stringify(withBlock);P.apply(withBlock,b,NOW);assert.equal(JSON.stringify(withBlock.unifiedProgress.frontier),JSON.stringify(JSON.parse(once).unifiedProgress.frontier));
});

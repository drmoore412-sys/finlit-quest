const test=require("node:test"),assert=require("node:assert/strict");
const collector=require("../src/candidate-source-collector.js"),pipeline=require("../src/crossword-candidate-pipeline.js"),game=require("../src/game-engine.js");

const TERMS=[
  {id:"credit.repayment",world:"credit",word:"REPAYMENT",definition:"Paying borrowed money back under agreed terms."},
  {id:"credit.term",world:"credit",word:"TERM",definition:"A condition or duration in an agreement."},
  {id:"credit.apr",world:"credit",word:"APR",definition:"The yearly cost of borrowing."},
  {id:"credit.apy",world:"credit",word:"APY",definition:"A yearly yield including compounding."},
  {id:"moneybasics.payment",world:"moneybasics",word:"PAYMENT",definition:"Money provided to satisfy an amount owed."},
  {id:"moneybasics.net",world:"moneybasics",word:"NET",definition:"An amount remaining after deductions."},
];
const registry=pipeline.createRegistry(TERMS),deps={registry,solveCrosswordFn:game.solveCrossword,validateCrosswordLayoutFn:game.validateCrosswordLayout};

test("collector strips HTML, records provenance, and leaves every scraped keyword unreviewed",()=>{
  const result=collector.collectDocuments([{id:"official",url:"https://example.gov",contentType:"text/html",text:"<style>hidden</style><h1>Repayment terms</h1><p>Payment payment plan.</p>"}]);
  assert.equal(result.documentCount,1);assert.equal(result.keywords.find(item=>item.word==="PAYMENT").totalCount,2);
  assert.ok(result.keywords.every(item=>item.approvalStatus==="unreviewed"));
  assert.equal(result.keywords.find(item=>item.word==="REPAYMENT").sources[0].sourceId,"official");
});

test("cross-world governed terms preserve permanent identity, definition, ownership, and mastery",()=>{
  const answer=pipeline.financialAnswer(registry.byId.get("moneybasics.payment"),"credit","financial-secondary");
  assert.deepEqual(answer,{word:"PAYMENT",category:"financial-secondary",termId:"moneybasics.payment",masteryId:"moneybasics.payment",definition:"Money provided to satisfy an amount owed.",worldId:"moneybasics",rewardPolicy:"financial-first-solve",crossWorld:true});
});

test("same word set can produce multiple strict valid crossword layouts",()=>{
  const words=["REPAYMENT","TERM","APR","APY","PAYMENT"],layouts=pipeline.enumerateLayouts(words,deps,{maxLayouts:4});
  assert.ok(layouts.length>=2);assert.equal(new Set(layouts.map(item=>pipeline.canonicalLayout(item.placements))).size,layouts.length);
  layouts.forEach(item=>assert.equal(game.validateCrosswordLayout(words,item.placements).valid,true));
});

test("generator validates before ranking and returns reviewable alternatives",()=>{
  const result=pipeline.generateCandidates({worldId:"credit",anchorTermId:"credit.repayment",ordinaryWords:[]},deps,{candidateLimit:6,maxLayouts:3,combinationLimit:100});
  assert.ok(result.candidates.length>=2);assert.ok(result.candidates.every(item=>item.validation.status==="PASS"));
  assert.ok(result.candidates.every(item=>item.ranking.eligible&&Number.isFinite(item.ranking.score)));
  assert.ok(result.candidates.some(item=>item.answers.some(answer=>answer.crossWorld)));
  assert.match(pipeline.reviewMarkdown(result.candidates[0]),/Crossword preview/);
});

test("unapproved ordinary vocabulary fails and receives no recommendation score",()=>{
  const words=["REPAYMENT","TERM","PLAN"],layout=game.solveCrossword(words).placements,candidate={worldId:"credit",anchorWord:"REPAYMENT",anchorTermId:"credit.repayment",wheelLetters:[..."REPAYMENT"],answers:[pipeline.financialAnswer(registry.byId.get("credit.repayment"),"credit","financial-anchor"),pipeline.financialAnswer(registry.byId.get("credit.term"),"credit","financial-secondary"),pipeline.ordinaryAnswer({word:"PLAN",approvalStatus:"unreviewed"},"credit")],layout,rewardPolicy:{financial:{coinsPerLetter:7,xpPerLetter:1.5,roundXp:true},ordinary:{coinsPerWord:1,xp:0},bonus:{coins:0,xp:0}}};
  const validation=pipeline.validateCandidate(candidate,{...deps,ordinaryByWord:new Map([["PLAN",{word:"PLAN",approvalStatus:"unreviewed"}]])}),ranking=pipeline.rankCandidate(candidate,validation);
  assert.equal(validation.status,"FAIL");assert.ok(validation.failures.some(item=>item.rule==="approvedOrdinaryVocabulary"));assert.equal(ranking.score,null);
});

test("invented financial metadata cannot pass the authoritative registry gate",()=>{
  const generated=pipeline.generateCandidates({worldId:"credit",anchorTermId:"credit.repayment",ordinaryWords:[]},deps,{candidateLimit:1,combinationLimit:100}).candidates[0],forged=JSON.parse(JSON.stringify(generated));
  Object.assign(forged.answers[1],{word:"FAKE",termId:"credit.fake",masteryId:"credit.fake",definition:"Invented.",worldId:"credit"});forged.requiredWords=forged.answers.map(item=>item.word);
  const validation=pipeline.validateCandidate(forged,deps);assert.ok(validation.failures.some(item=>item.rule==="approvedFinancialIdentity"));
});

test("exact repeated-letter inventory and financial majority are mandatory",()=>{
  const generated=pipeline.generateCandidates({worldId:"credit",anchorTermId:"credit.repayment",ordinaryWords:[]},deps,{candidateLimit:1,combinationLimit:100}).candidates[0],brokenWheel=JSON.parse(JSON.stringify(generated));brokenWheel.wheelLetters=[..."REPAYMET"];
  assert.ok(pipeline.validateCandidate(brokenWheel,deps).failures.some(item=>item.rule==="exactLetterMultiset"));
  const majority=JSON.parse(JSON.stringify(generated));majority.answers.slice(1).forEach((answer,index)=>Object.assign(answer,{word:["PLAN","TEAM","PART","TYPE"][index]||"PLAN",category:"ordinary",termId:null,masteryId:null,definition:null,worldId:"credit",rewardPolicy:"ordinary-first-solve",supportApproval:"approved-support"}));majority.requiredWords=majority.answers.map(item=>item.word);
  assert.ok(pipeline.validateCandidate(majority,{...deps,ordinaryByWord:new Map(majority.answers.slice(1).map(item=>[item.word,{word:item.word,approvalStatus:"approved-support"}]))}).failures.some(item=>item.rule==="financialMajority"));
});

test("contained words require their own slot and crossing failures identify coordinates",()=>{
  const candidate={answers:[{word:"PAYMENT",category:"financial-anchor",termId:"moneybasics.payment",masteryId:"moneybasics.payment",definition:registry.byId.get("moneybasics.payment").definition,worldId:"moneybasics",rewardPolicy:"financial-first-solve"},{word:"PAY",category:"ordinary",termId:null,masteryId:null,definition:null,worldId:"moneybasics",rewardPolicy:"ordinary-first-solve"}],worldId:"moneybasics",wheelLetters:[..."PAYMENT"],layout:[{word:"PAYMENT",r:0,c:0,dir:"h"}],rewardPolicy:{financial:{coinsPerLetter:7,xpPerLetter:1.5,roundXp:true},ordinary:{coinsPerWord:1,xp:0},bonus:{coins:0,xp:0}}};
  const validation=pipeline.validateCandidate(candidate,{...deps,ordinaryByWord:new Map([["PAY",{word:"PAY",approvalStatus:"approved-support"}]])});
  assert.ok(validation.failures.some(item=>item.rule==="containedWordHasDistinctSlot"&&item.words.includes("PAY")));
  const conflict={...candidate,answers:[candidate.answers[0],{...candidate.answers[1],word:"MAP"}],layout:[{word:"PAYMENT",r:0,c:0,dir:"h"},{word:"MAP",r:0,c:0,dir:"v"}]};
  const conflictValidation=pipeline.validateCandidate(conflict,{...deps,ordinaryByWord:new Map([["MAP",{word:"MAP",approvalStatus:"approved-support"}]])});
  assert.ok(conflictValidation.failures.some(item=>item.rule==="crossingLetters"&&item.coordinates.row===0&&item.coordinates.column===0));
});

test("export refuses pending or failed candidates and preserves approved identities",()=>{
  const candidate=pipeline.generateCandidates({worldId:"credit",anchorTermId:"credit.repayment",ordinaryWords:[]},deps,{candidateLimit:1,combinationLimit:100}).candidates[0];
  assert.throws(()=>pipeline.exportApprovedCandidate(candidate),/owner-approved/);
  candidate.approvalStatus="owner-approved";assert.throws(()=>pipeline.exportApprovedCandidate(candidate,{revision:4}),/authoritative registry/);const exported=pipeline.exportApprovedCandidate(candidate,{revision:4},deps);
  assert.equal(exported.id,"FQ-V3:credit:REPAYMENT:R4");assert.deepEqual(exported.answers.map(item=>item.termId),candidate.answers.map(item=>item.termId));
  candidate.answers[1].definition="Tampered";assert.throws(()=>pipeline.exportApprovedCandidate(candidate,{revision:5},deps),/fresh validation/);
});

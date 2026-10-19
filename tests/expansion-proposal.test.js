const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {ROOT}=require("./helpers.js");
const pipeline=require("../src/crossword-candidate-pipeline.js");
const game=require("../src/game-engine.js");
const slate=require("../src/v3-puzzle-slate.js");
const creditIds=require("../content/credit-term-identities.js");
const supplement=require("../content/v3-supplemental-terms.js");

const proposal=JSON.parse(fs.readFileSync(path.join(ROOT,"staging/research/expansion/2026-10-17/finlit-quest-27-quiz-expansion-proposal.json"),"utf8"));
function loadWindow(file,key){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context);return context.window[key]}
const vocabularies={
  credit:loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS"),
  moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),
  banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),
  investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS"),
  crypto:loadWindow("content/crypto-terms.js","DEFI_TERMS"),
};
const merged=supplement.merge(vocabularies);
const evidence=JSON.parse(fs.readFileSync(path.join(ROOT,"staging/research/consolidated/2026-10-17/term-evidence-register.json"),"utf8"));
const approvedResearch=new Map(evidence.concepts.map(item=>[item.recommendedWord||item.word,{word:item.recommendedWord||item.word,definition:item.proposedDefinition,world:item.world}]));
const terms=[];
for(const [world,records] of Object.entries(merged))for(const record of records)terms.push({id:world==="credit"?creditIds.idForWord(record.word):(record.id||record.termId),word:record.word,definition:record.definition,world});
for(const item of proposal.termRegister.filter(item=>!terms.some(term=>term.id===item.permanentId))){
  const source=approvedResearch.get(item.word);assert.ok(source,`CAL-0008 evidence missing for ${item.word}`);
  terms.push({id:item.permanentId,word:item.word,definition:source.definition,world:source.world});
}
const registry=pipeline.createRegistry(terms);
const activeSignatures=new Set(slate.SPECS.map(spec=>[spec.anchor,...spec.secondary.map(item=>typeof item==="string"?item:item.word),...spec.ordinary].sort().join("|")));

function candidateFor(row){
  const answers=[
    ...row.financialTerms.map(term=>({word:term.word,category:term.word===row.anchorWord?"financial-anchor":"financial-secondary",termId:term.permanentId,masteryId:term.permanentId,definition:term.definition,worldId:term.originWorld,rewardPolicy:"financial-first-solve",...(term.crossWorld?{crossWorld:true}:{})})),
    ...row.ordinarySupportingWords.map(word=>({word,category:"ordinary",termId:null,masteryId:null,definition:null,worldId:row.worldId,rewardPolicy:"ordinary-first-solve",supportApproval:"approved-support"})),
  ];
  return {worldId:row.worldId,anchorTermId:row.anchorTermId,anchorWord:row.anchorWord,wheelLetters:row.wheelLetters,answers,requiredWords:row.requiredWords,layout:row.layout,rewardPolicy:{financial:{coinsPerLetter:7,xpPerLetter:1.5,roundXp:true},ordinary:{coinsPerWord:1,xp:0},bonus:{coins:0,xp:0}}};
}

test("the expansion proposal is research-only and leaves the active 27-puzzle slate untouched",()=>{
  assert.equal(proposal.status,"PENDING OWNER REVIEW — IMPLEMENTATION NOT AUTHORIZED");
  assert.equal(proposal.qualityStandard.path,"docs/FINLIT_QUEST_NEW_QUIZ_QUALITY_STANDARD.md");
  assert.equal(proposal.qualityStandard.standardConfirmationDoesNotApproveProposals,true);
  assert.equal(proposal.qualityStandard.financialVocabularyDrivesPuzzleCreation,true);
  assert.equal(proposal.baseline.activeSlatePreserved,true);
  assert.equal(slate.SPECS.length,27);
  assert.equal(proposal.quizzes.length,27);
  proposal.quizzes.forEach(row=>assert.equal(row.implementationStatus,"research-only-not-active"));
});

test("the proposed distribution reaches 54 total quizzes while preserving the five-world balance",()=>{
  assert.deepEqual(Object.fromEntries(["moneybasics","credit","crypto","banking","investing"].map(world=>[world,proposal.quizzes.filter(row=>row.worldId===world).length])),{moneybasics:5,credit:6,crypto:5,banking:5,investing:6});
  assert.equal(proposal.baseline.activeQuizCount+proposal.quizzes.length,54);
  assert.deepEqual({five:proposal.qualityGate.fiveWordPuzzles,four:proposal.qualityGate.fourWordPuzzles,three:proposal.qualityGate.threeWordExceptions},{five:14,four:11,three:2});
});

test("every proposal passes strict validation with exact governed identities and at least three financial terms",()=>{
  assert.deepEqual(registry.errors,[]);
  for(const row of proposal.quizzes){
    const ordinaryByWord=new Map(row.ordinarySupportingWords.map(word=>[word,{word,approvalStatus:"approved-support"}]));
    const verdict=pipeline.validateCandidate(candidateFor(row),{registry,ordinaryByWord,validateCrosswordLayoutFn:game.validateCrosswordLayout});
    assert.equal(verdict.status,"PASS",`${row.proposalId}: ${JSON.stringify(verdict.failures)}`);
    assert.ok(row.requiredWords.length>=3&&row.requiredWords.length<=5,row.proposalId);
    assert.ok(row.financialTerms.length>=3,row.proposalId);
    assert.ok(["Intermediate","Advanced"].includes(row.difficulty),row.proposalId);
    assert.ok(row.alternativeLayoutCount>=2,row.proposalId);
  }
});

test("no proposal duplicates the active slate or another proposal",()=>{
  const seen=new Set();
  for(const row of proposal.quizzes){
    const signature=[...row.requiredWords].sort().join("|");
    assert.equal(activeSignatures.has(signature),false,`${row.proposalId} duplicates active composition`);
    assert.equal(seen.has(signature),false,`${row.proposalId} duplicates another proposal`);
    seen.add(signature);
  }
});

test("every proposed comprehension question is complete, answerable, and source-referenced",()=>{
  for(const row of proposal.quizzes){
    const quiz=row.proposedComprehensionQuestion;
    assert.ok(quiz.question&&quiz.explanation,row.proposalId);
    assert.equal(quiz.answers.length,3,row.proposalId);
    assert.ok(Number.isInteger(quiz.correct)&&quiz.correct>=0&&quiz.correct<quiz.answers.length,row.proposalId);
    assert.ok(quiz.sourceIds.length>=1,row.proposalId);
    quiz.sourceIds.forEach(id=>assert.ok(proposal.researchSources[id],`${row.proposalId}: unknown source ${id}`));
  }
});

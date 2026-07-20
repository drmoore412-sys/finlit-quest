const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {ROOT}=require("./helpers.js");

const {wheelFor,canForm,layoutWords}=require("../src/game-engine.js");
const {puzzleId}=require("../src/puzzle-bank-engine.js");
const {generateCandidate}=require("../src/puzzle-generator.js");
const {scoreDifficulty}=require("../src/difficulty-scorer.js");
const {generateHint}=require("../src/hint-generator.js");
const {validatePuzzle,assemblePuzzle}=require("../src/puzzle-validator.js");
const {generatePuzzleBank,filterBankByTags,deriveCumulativeAllowlists,normalizeTerm}=require("../src/puzzle-pipeline-service.js");
const {migrateLegacyBank}=require("../src/puzzle-bank-migration.js");

function shuffled(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

const VOCAB=[
  {word:"TOKEN",definition:"A digital unit that represents value, access, or ownership.",termId:"crypto.token"},
  {word:"NODE",definition:"A computer that participates in a blockchain network.",termId:"crypto.node"},
  {word:"COIN",definition:"A native digital currency of its own blockchain.",termId:"crypto.coin"},
  {word:"MINT",definition:"To create new tokens or coins on a blockchain.",termId:"crypto.mint"},
  {word:"POOL",definition:"A shared collection of funds or liquidity.",termId:"crypto.pool"},
  {word:"LOCK",definition:"To restrict tokens from being moved for a period.",termId:"crypto.lock"},
  {word:"BLOCK",definition:"A batch of transactions recorded on a blockchain.",termId:"crypto.block"},
  {word:"FORK",definition:"A split in a blockchain's transaction history.",termId:"crypto.fork"},
  {word:"HASH",definition:"A fixed-length fingerprint produced from data.",termId:"crypto.hash"},
  {word:"GAS",definition:"The fee paid to process a blockchain transaction.",termId:"crypto.gas"},
  {word:"CHAIN",definition:"The full sequence of linked blocks.",termId:"crypto.chain"},
  {word:"YIELD",definition:"Earnings generated from putting assets to work.",termId:"crypto.yield"},
];

function makeVocab(n){
  const consonants=[..."BCDFGHJKLMNPQRSTVWXYZ"],vowels=[..."AEIOU"];
  const words=[];
  outer:
  for(const c1 of consonants)for(const v of vowels)for(const c2 of consonants){
    const word=c1+v+c2;
    if(!words.includes(word))words.push(word);
    if(words.length>=n)break outer;
  }
  return words.map(word=>({word,definition:`Definition for ${word}.`,termId:null}));
}

function deps(){
  return {
    generateCandidate,scoreDifficulty,generateHint,validatePuzzle,assemblePuzzle,
    puzzleIdFor:puzzleId,shuffleFn:shuffled,wheelForFn:wheelFor,canFormFn:canForm,layoutWordsFn:layoutWords,
  };
}

// --- difficulty-scorer ---

test("scoreDifficulty rates a small plain candidate as Easy",()=>{
  const {score,difficulty}=scoreDifficulty({letters:["C","O","I","N"],requiredWords:["COIN"],bonusWords:[],focusWord:"COIN"});
  assert.ok(score>=0&&score<=25);
  assert.equal(difficulty,"Easy");
});

test("scoreDifficulty rates a large rare-letter-heavy candidate higher",()=>{
  const easy=scoreDifficulty({letters:["C","O","I","N"],requiredWords:["COIN"],bonusWords:[],focusWord:"COIN"});
  const hard=scoreDifficulty({letters:["Y","I","E","L","D","X","Z","Q"],requiredWords:["YIELD","QUARTZ"],bonusWords:["ZIP","QUIZ"],focusWord:"QUARTZ"});
  assert.ok(hard.score>easy.score);
});

test("scoreDifficulty always returns a bucket in range",()=>{
  ["Easy","Medium","Hard","Expert"].includes(scoreDifficulty({letters:[],requiredWords:[],bonusWords:[],focusWord:""}).difficulty);
});

// --- hint-generator ---

test("generateHint produces a length-clued, definition-derived hint",()=>{
  const hint=generateHint({focusWord:"TOKEN",definition:"A digital unit that represents value, access, or ownership."});
  assert.equal(hint,"A 5-letter word. A digital unit that represents value, access, or ownership.");
});

test("generateHint throws on an unknown strategy",()=>{
  assert.throws(()=>generateHint({focusWord:"TOKEN",definition:"x"},"nonexistent-strategy"));
});

// --- puzzle-generator ---

test("generateCandidate produces a candidate whose focus word is required and buildable",()=>{
  const candidate=generateCandidate(VOCAB,shuffled,wheelFor,canForm,{maxWords:5,wheelBudget:9});
  assert.ok(candidate);
  assert.ok(candidate.requiredWords.includes(candidate.focusWord));
  candidate.requiredWords.forEach(w=>assert.ok(canForm(w,candidate.letters)));
  assert.ok(candidate.letters.length<=9);
});

test("generateCandidate honors a pinned focus word",()=>{
  const candidate=generateCandidate(VOCAB,shuffled,wheelFor,canForm,{focusWord:"HASH",maxWords:5,wheelBudget:9});
  assert.ok(candidate);
  assert.equal(candidate.focusWord,"HASH");
  assert.ok(candidate.requiredWords.includes("HASH"));
});

test("generateCandidate returns null when the pinned focus word isn't in the Knowledge Base",()=>{
  assert.equal(generateCandidate(VOCAB,shuffled,wheelFor,canForm,{focusWord:"NOTAWORD"}),null);
});

test("generateCandidate's bonus words are all formable from the wheel and not already required",()=>{
  const candidate=generateCandidate(VOCAB,shuffled,wheelFor,canForm,{maxWords:5,wheelBudget:9});
  candidate.bonusWords.forEach(w=>{
    assert.ok(canForm(w,candidate.letters));
    assert.ok(!candidate.requiredWords.includes(w));
  });
});

test("generateCandidate tags default to the required words",()=>{
  const candidate=generateCandidate(VOCAB,shuffled,wheelFor,canForm,{maxWords:5,wheelBudget:9});
  assert.deepEqual([...candidate.tags].sort(),[...candidate.requiredWords].sort());
});

// --- puzzle-validator ---

function assembleValid(){
  const candidate=generateCandidate(VOCAB,shuffled,wheelFor,canForm,{focusWord:"TOKEN",maxWords:4,wheelBudget:9});
  const {score,difficulty}=scoreDifficulty(candidate);
  const hint=generateHint(candidate);
  return assemblePuzzle(candidate,{worldId:"crypto",seq:1,score,difficulty,hint,generatorVersion:1});
}

test("validatePuzzle accepts a well-formed puzzle assembled from a real candidate",()=>{
  const puzzle=assembleValid();
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords});
  assert.deepEqual(result.errors,[]);
  assert.equal(result.valid,true);
});

test("validatePuzzle flags a focus word missing from requiredWords",()=>{
  const puzzle={...assembleValid(),focusWord:"NOTREQUIRED"};
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords});
  assert.ok(result.errors.includes("focusWordExists"));
});

test("validatePuzzle flags a wheel that exceeds budget",()=>{
  const puzzle={...assembleValid(),letters:[..."ABCDEFGHIJ"]};
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords,wheelBudget:9});
  assert.ok(result.errors.includes("wheelWithinBudget"));
});

test("validatePuzzle flags a duplicate id against existingIds",()=>{
  const puzzle=assembleValid();
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords,existingIds:new Set([puzzle.id])});
  assert.ok(result.errors.includes("noDuplicateId"));
});

test("validatePuzzle flags a missing definition and hint",()=>{
  const puzzle={...assembleValid(),definition:"",hint:""};
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords});
  assert.ok(result.errors.includes("definitionPresent"));
  assert.ok(result.errors.includes("hintPresent"));
});

test("validatePuzzle flags an unassigned difficulty",()=>{
  const puzzle={...assembleValid(),difficulty:"Impossible"};
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords});
  assert.ok(result.errors.includes("difficultyAssigned"));
});

// --- puzzle-pipeline-service: generatePuzzleBank ---

test("generatePuzzleBank produces the requested number of unique, valid puzzles",()=>{
  const vocab=makeVocab(80);
  const {bank,rejected}=generatePuzzleBank(vocab,"credit",20,deps());
  assert.equal(bank.length,20);
  assert.equal(new Set(bank.map(p=>p.id)).size,20,"ids must be unique");
  assert.equal(new Set(bank.map(p=>puzzleId(p.requiredWords))).size,20,"no two puzzles may share the same word set");
  bank.forEach(p=>{
    const result=validatePuzzle(p,{canFormFn:canForm,layoutWordsFn:layoutWords,existingIds:new Set()});
    assert.deepEqual(result.errors,[],`puzzle ${p.id} should validate cleanly`);
  });
  assert.ok(Array.isArray(rejected));
});

test("generatePuzzleBank tops up an existing bank rather than discarding it",()=>{
  const vocab=makeVocab(60);
  const {bank:first}=generatePuzzleBank(vocab,"credit",8,deps());
  const {bank:topped}=generatePuzzleBank(vocab,"credit",15,deps(),{existingBank:first});
  assert.equal(topped.length,15);
  first.forEach(p=>assert.ok(topped.some(q=>q.id===p.id)));
});

test("generatePuzzleBank assigns world-scoped sequential ids",()=>{
  const vocab=makeVocab(50);
  const {bank}=generatePuzzleBank(vocab,"crypto",5,deps());
  bank.forEach(p=>assert.ok(/^CRYPTO-P\d{4}$/.test(p.id)));
});

// --- puzzle-pipeline-service: filterBankByTags (Concept Filter stage) ---

test("filterBankByTags keeps only puzzles whose every tag is in the allowed set",()=>{
  const bank=[
    {id:"A",tags:["TOKEN","COIN"]},
    {id:"B",tags:["TOKEN","YIELD"]},
    {id:"C",tags:["COIN"]},
  ];
  const filtered=filterBankByTags(bank,["TOKEN","COIN"]);
  assert.deepEqual(filtered.map(p=>p.id),["A","C"]);
});

test("filterBankByTags excludes a puzzle if even one tag is outside the allowed set",()=>{
  const bank=[{id:"A",tags:["TOKEN","YIELD"]}];
  assert.deepEqual(filterBankByTags(bank,["TOKEN"]),[]);
});

// --- puzzle-pipeline-service: deriveCumulativeAllowlists ---

test("deriveCumulativeAllowlists builds cumulative per-lesson allowlists in sequence order",()=>{
  const runtime={workbooks:[
    {id:"CRF-002",sequence:2,flashcards:[{term:"Interest"},{term:"Credit limit"}]},
    {id:"CRF-001",sequence:1,flashcards:[{term:"Credit"},{term:"Debt"}]},
  ]};
  const allowlists=deriveCumulativeAllowlists(runtime);
  assert.deepEqual(allowlists["CRF-001"].sort(),["CREDIT","DEBT"]);
  assert.deepEqual(allowlists["CRF-002"].sort(),["CREDIT","DEBT","INTEREST"],"multi-word 'Credit limit' must be skipped, and CRF-001 terms carried forward");
});

test("normalizeTerm skips multi-word and sub-3-letter terms",()=>{
  assert.equal(normalizeTerm("Credit limit"),null);
  assert.equal(normalizeTerm("Fi"),null);
  assert.equal(normalizeTerm("Fee"),"FEE");
  assert.equal(normalizeTerm("Interest"),"INTEREST");
});

test("deriveCumulativeAllowlists on the real Credit Foundations curriculum grows monotonically and matches the extracted game terms",()=>{
  const runtimePath=path.join(ROOT,"curriculum/credit/approved/runtime/credit-foundations.json");
  const runtime=JSON.parse(fs.readFileSync(runtimePath,"utf8"));
  const allowlists=deriveCumulativeAllowlists(runtime);
  const workbooks=[...runtime.workbooks].sort((a,b)=>a.sequence-b.sequence);

  let previousSize=0;
  workbooks.forEach(wb=>{
    assert.ok(allowlists[wb.id].length>=previousSize,`allowlist for ${wb.id} must not shrink`);
    previousSize=allowlists[wb.id].length;
  });

  const gameTerms=JSON.parse(fs.readFileSync(path.join(ROOT,"content/credit-game-terms.json"),"utf8")).map(t=>t.word);
  const finalAllowlist=allowlists[workbooks[workbooks.length-1].id];
  gameTerms.forEach(word=>assert.ok(finalAllowlist.includes(word),`${word} from credit-game-terms.json should be reachable in the final cumulative allowlist`));
});

// --- puzzle-bank-migration ---

test("migrateLegacyBank backfills old {id,words,letters} entries to the full schema",()=>{
  const legacy=[{id:"abc",words:["TOKEN","COIN"],letters:wheelFor(["TOKEN","COIN"])}];
  const migrated=migrateLegacyBank(legacy,"crypto",VOCAB,{scoreDifficulty,generateHint,now:()=>"2026-01-01T00:00:00.000Z"});
  assert.equal(migrated.length,1);
  const p=migrated[0];
  assert.equal(p.id,"abc");
  assert.equal(p.worldId,"crypto");
  assert.deepEqual(p.requiredWords,["TOKEN","COIN"]);
  assert.equal(p.focusWord,"TOKEN");
  assert.ok(p.definition.length>0);
  assert.ok(["Easy","Medium","Hard","Expert"].includes(p.difficulty));
  assert.ok(p.hint.length>0);
  assert.equal(p.generatorVersion,0);
  assert.equal(p.createdAt,"2026-01-01T00:00:00.000Z");
});

test("migrateLegacyBank leaves already-migrated entries untouched",()=>{
  const already=[{id:"xyz",worldId:"crypto",requiredWords:["TOKEN"],letters:["T","O","K","E","N"],bonusWords:[],focusWord:"TOKEN",definition:"d",difficulty:"Easy",hint:"h",estimatedSolveSeconds:30,generatorVersion:1,createdAt:"now"}];
  const migrated=migrateLegacyBank(already,"crypto",VOCAB,{scoreDifficulty,generateHint});
  assert.deepEqual(migrated,already);
});

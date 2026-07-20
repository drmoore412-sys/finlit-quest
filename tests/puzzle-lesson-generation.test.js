const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {ROOT}=require("./helpers.js");

const {wheelFor,canForm,layoutWords}=require("../src/game-engine.js");
const {puzzleId}=require("../src/puzzle-bank-engine.js");
const {generateCandidate}=require("../src/puzzle-generator.js");
const {scoreDifficulty}=require("../src/difficulty-scorer.js");
const {generateHint}=require("../src/hint-generator.js");
const {validatePuzzle,assemblePuzzle}=require("../src/puzzle-validator.js");
const {
  generatePuzzleBank,filterBankByTags,deriveCumulativeAllowlists,
  computeEligibleLessons,detectUnplayableTerms,generateLessonPuzzles,
}=require("../src/puzzle-pipeline-service.js");

function shuffled(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

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

// Real Credit Foundations data, matching what the CLI actually operates on.
const CREDIT_VOCAB=JSON.parse(fs.readFileSync(path.join(ROOT,"content/credit-game-terms.json"),"utf8")).map(t=>({word:t.word,definition:t.definition,termId:null}));
const CREDIT_RUNTIME=JSON.parse(fs.readFileSync(path.join(ROOT,"curriculum/credit/approved/runtime/credit-foundations.json"),"utf8"));
const CREDIT_ALLOWLISTS=deriveCumulativeAllowlists(CREDIT_RUNTIME);

// --- validator: puzzleMode-aware wordCountInRange ---

function assembleWithMode(requiredWords,puzzleMode){
  const focusWord=requiredWords[0];
  const letters=wheelFor(requiredWords);
  const candidate={focusWord,definition:"A definition.",letters,requiredWords,bonusWords:[],tags:[...requiredWords]};
  const {score,difficulty}=scoreDifficulty(candidate);
  const hint=generateHint(candidate);
  return assemblePuzzle(candidate,{worldId:"credit",seq:1,score,difficulty,hint,puzzleMode});
}

test("validatePuzzle accepts a single-term puzzle at exactly 1 required word",()=>{
  const puzzle=assembleWithMode(["CREDIT"],"single-term");
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords});
  assert.deepEqual(result.errors,[]);
});

test("validatePuzzle rejects a single-term puzzle that actually has 2+ required words",()=>{
  const puzzle=assembleWithMode(["CREDIT","TERMS"],"single-term");
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords});
  assert.ok(result.errors.includes("wordCountInRange"));
});

test("validatePuzzle still rejects a 1-word multi-term puzzle (default mode unchanged)",()=>{
  const puzzle=assembleWithMode(["CREDIT"],"multi-term");
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords});
  assert.ok(result.errors.includes("wordCountInRange"));
});

test("validatePuzzle flags an unrecognized puzzleMode",()=>{
  const puzzle={...assembleWithMode(["CREDIT","TERMS"],"multi-term"),puzzleMode:"triple-term"};
  const result=validatePuzzle(puzzle,{canFormFn:canForm,layoutWordsFn:layoutWords});
  assert.ok(result.errors.includes("puzzleModeValid"));
});

test("assemblePuzzle defaults puzzleMode to multi-term and sourceGenerationScope to world",()=>{
  const puzzle=assembleWithMode(["CREDIT","TERMS"],undefined);
  assert.equal(puzzle.puzzleMode,"multi-term");
  assert.deepEqual(puzzle.sourceGenerationScope,{type:"world"});
  assert.deepEqual(puzzle.eligibleLessonIds,[]);
});

// --- computeEligibleLessons / detectUnplayableTerms (pure helpers) ---

test("computeEligibleLessons returns every lesson whose allowlist is a superset of the tags",()=>{
  const allowlists={"L1":["A","B"],"L2":["A","B","C"],"L3":["A"]};
  assert.deepEqual(computeEligibleLessons(["A","B"],allowlists).sort(),["L1","L2"]);
  assert.deepEqual(computeEligibleLessons(["A"],allowlists).sort(),["L1","L2","L3"]);
  assert.deepEqual(computeEligibleLessons(["A","B","C"],allowlists),["L2"]);
});

test("computeEligibleLessons returns an empty array when no allowlists are supplied",()=>{
  assert.deepEqual(computeEligibleLessons(["A"],null),[]);
});

test("detectUnplayableTerms flags only words whose wheel size exceeds the budget",()=>{
  const vocab=[{word:"CAT",definition:"x"},{word:"OBLIGATION",definition:"x"}];
  const report=detectUnplayableTerms(vocab,"credit","CRF-001",wheelFor,9);
  assert.equal(report.length,1);
  assert.equal(report[0].term,"OBLIGATION");
  assert.equal(report[0].status,"unplayable_under_current_budget");
  assert.equal(report[0].worldId,"credit");
  assert.equal(report[0].lessonId,"CRF-001");
  assert.equal(report[0].configuredWheelLimit,9);
  assert.equal(report[0].normalizedLength,10);
});

// --- generateLessonPuzzles: real CRF-001 / CRF-002 data (the ticket's acceptance scenario) ---

test("CRF-001 generates at least one eligible puzzle from its real cumulative allowlist",()=>{
  const allowedTags=CREDIT_ALLOWLISTS["CRF-001"];
  const result=generateLessonPuzzles(CREDIT_VOCAB,"credit","CRF-001",allowedTags,10,deps());
  assert.ok(result.added.length>0,"expected at least one eligible CRF-001 puzzle");
  result.added.forEach(p=>{
    const check=validatePuzzle(p,{canFormFn:canForm,layoutWordsFn:layoutWords});
    assert.deepEqual(check.errors,[],`puzzle ${p.id} must validate cleanly`);
    assert.ok(p.tags.every(t=>allowedTags.includes(t)),"every tag must be within CRF-001's allowlist");
  });
});

test("CRF-002 generates at least one eligible puzzle from its real cumulative allowlist",()=>{
  const allowedTags=CREDIT_ALLOWLISTS["CRF-002"];
  const result=generateLessonPuzzles(CREDIT_VOCAB,"credit","CRF-002",allowedTags,10,deps());
  assert.ok(result.added.length>0,"expected at least one eligible CRF-002 puzzle");
});

test("CRF-001's real Knowledge Base genuinely cannot reach 10 puzzles — reports the shortfall honestly rather than fabricating content",()=>{
  const allowedTags=CREDIT_ALLOWLISTS["CRF-001"];
  const result=generateLessonPuzzles(CREDIT_VOCAB,"credit","CRF-001",allowedTags,10,deps());
  assert.equal(result.warnings.length,1);
  assert.equal(result.warnings[0].lessonId,"CRF-001");
  assert.equal(result.warnings[0].requested,10);
  assert.ok(result.warnings[0].shortfall>0);
  assert.ok(result.warnings[0].limitingTerms.includes("OBLIGATION"));
  // Confirm no duplicate/fabricated content was produced to mask the shortfall.
  const contentIds=result.added.map(p=>puzzleId(p.requiredWords));
  assert.equal(new Set(contentIds).size,contentIds.length,"no duplicate puzzle signatures");
});

test("CRF-001's long-term report flags OBLIGATION as unplayable under the current wheel budget",()=>{
  const allowedTags=CREDIT_ALLOWLISTS["CRF-001"];
  const result=generateLessonPuzzles(CREDIT_VOCAB,"credit","CRF-001",allowedTags,10,deps());
  const obligation=result.longTermReport.find(r=>r.term==="OBLIGATION");
  assert.ok(obligation,"expected OBLIGATION in the unplayable-term report");
  assert.equal(obligation.status,"unplayable_under_current_budget");
  assert.equal(obligation.lessonId,"CRF-001");
});

// --- generation priority: multi-term first, single-term only fills genuine shortfall ---

test("with a generous lesson vocabulary, generateLessonPuzzles fills the request entirely with multi-term puzzles",()=>{
  const vocab=makeVocab(60);
  const allowedTags=vocab.map(v=>v.word);
  const result=generateLessonPuzzles(vocab,"credit","GENEROUS-LESSON",allowedTags,10,deps());
  assert.equal(result.added.length,10);
  assert.ok(result.added.every(p=>p.puzzleMode==="multi-term"));
  assert.equal(result.warnings.length,0);
});

test("with a scarce lesson vocabulary (real CRF-001), single-term puzzles fill the shortfall multi-term alone can't reach",()=>{
  const allowedTags=CREDIT_ALLOWLISTS["CRF-001"];
  const result=generateLessonPuzzles(CREDIT_VOCAB,"credit","CRF-001",allowedTags,10,deps());
  const modes=result.added.map(p=>p.puzzleMode);
  assert.ok(modes.includes("multi-term"),"expected at least one multi-term puzzle (CREDIT+TERMS)");
  assert.ok(modes.includes("single-term"),"expected single-term puzzles filling the shortfall");
});

test("multi-term puzzles always precede single-term puzzles in generation order",()=>{
  const allowedTags=CREDIT_ALLOWLISTS["CRF-001"];
  const result=generateLessonPuzzles(CREDIT_VOCAB,"credit","CRF-001",allowedTags,10,deps());
  const modes=result.added.map(p=>p.puzzleMode);
  const firstSingle=modes.indexOf("single-term");
  if(firstSingle>=0)modes.slice(firstSingle).forEach(m=>assert.equal(m,"single-term","no multi-term puzzle should appear after the first single-term puzzle"));
});

// --- idempotency and duplicate rejection ---

test("generateLessonPuzzles is idempotent: re-running against a bank that already meets the target adds nothing new",()=>{
  const vocab=makeVocab(60);
  const allowedTags=vocab.map(v=>v.word);
  const first=generateLessonPuzzles(vocab,"credit","IDEMPOTENT-LESSON",allowedTags,10,deps());
  assert.equal(first.added.length,10);
  const second=generateLessonPuzzles(vocab,"credit","IDEMPOTENT-LESSON",allowedTags,10,deps(),{existingBank:first.bank});
  assert.equal(second.added.length,0,"nothing new should be generated once the target is already met");
  assert.equal(second.bank.length,first.bank.length);
});

test("generateLessonPuzzles is idempotent even in a genuine-shortfall scenario (CRF-001 can't reach 10 either time)",()=>{
  const allowedTags=CREDIT_ALLOWLISTS["CRF-001"];
  const first=generateLessonPuzzles(CREDIT_VOCAB,"credit","CRF-001",allowedTags,10,deps());
  const second=generateLessonPuzzles(CREDIT_VOCAB,"credit","CRF-001",allowedTags,10,deps(),{existingBank:first.bank});
  assert.equal(second.added.length,0,"a genuine shortfall must not be papered over with new generation attempts on a second pass");
  assert.equal(second.warnings.length,1);
  assert.equal(second.warnings[0].produced,first.added.length);
});

test("generateLessonPuzzles never produces two puzzles with the same content signature",()=>{
  const vocab=makeVocab(60);
  const allowedTags=vocab.map(v=>v.word);
  const result=generateLessonPuzzles(vocab,"credit","DEDUP-LESSON",allowedTags,15,deps());
  const contentIds=result.bank.map(p=>puzzleId(p.requiredWords));
  assert.equal(new Set(contentIds).size,contentIds.length);
});

// --- existing world-level generation is unaffected ---

test("generatePuzzleBank still produces valid puzzles and now tags them multi-term/world-scoped by default",()=>{
  const vocab=makeVocab(60);
  const {bank}=generatePuzzleBank(vocab,"credit",10,deps());
  assert.equal(bank.length,10);
  bank.forEach(p=>{
    assert.equal(p.puzzleMode,"multi-term");
    assert.deepEqual(p.sourceGenerationScope,{type:"world"});
    const check=validatePuzzle(p,{canFormFn:canForm,layoutWordsFn:layoutWords,existingIds:new Set()});
    assert.deepEqual(check.errors,[]);
  });
});

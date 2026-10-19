const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {ROOT}=require("./helpers.js"),game=require("../src/game-engine.js"),identities=require("../content/credit-term-identities.js"),slate=require("../src/v3-puzzle-slate.js");

function loadWindow(file,key,window={}){const context={window};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context);return context.window[key]}
function creditTerms(){return loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS")}
function allVocabularies(){
  const defi=loadWindow("content/crypto-terms.js","DEFI_TERMS"),context={window:{DEFI_TERMS:defi}};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,"worlds/crypto.js"),"utf8"),context);
  return {
    crypto:context.window.FINLIT_WORLD.terms.map(term=>({word:term.word,definition:term.definition,termId:term.id})),
    credit:creditTerms(),
    moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),
    banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),
    investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS"),
  };
}

test("all 42 approved Credit identities (38 workbook + 4 CAL-0008) are explicit and unique, and the 38 frozen terms resolve",()=>{
  const terms=creditTerms(),ids=terms.map(term=>identities.resolveTerm(term));
  assert.equal(terms.length,38);
  assert.equal(identities.size,42);
  assert.equal(identities.entries.length,42);
  assert.equal(new Set(terms.map(term=>term.word)).size,38);
  assert.equal(new Set(ids).size,38);
  terms.forEach((term,index)=>{
    assert.equal(ids[index],`credit.${term.word.toLowerCase()}`);
    assert.equal(term.id,undefined);
    assert.equal(term.termId,undefined);
  });
});

test("an explicit permanent ID survives display-label and definition changes",()=>{
  assert.equal(slate.stableTermId("credit",{word:"APR",definition:"Old",termId:"credit.apr"}),"credit.apr");
  assert.equal(slate.stableTermId("credit",{word:"Annual percentage rate",definition:"New",termId:"credit.apr"}),"credit.apr");
});

test("Credit identity registry rejects missing, duplicate, unknown, and conflicting identities",()=>{
  assert.throws(()=>identities.idForWord("NOT_APPROVED"),/Missing approved Credit identity/);
  assert.throws(()=>identities.createRegistry([{word:"APR",id:"credit.apr"},{word:"APR",id:"credit.other"}]),/Duplicate Credit identity word/);
  assert.throws(()=>identities.createRegistry([{word:"APR",id:"credit.apr"},{word:"RATE",id:"credit.apr"}]),/Duplicate Credit identity id/);
  assert.throws(()=>identities.resolveTerm({word:"APR",termId:"credit.loan"}),/Conflicting Credit identity/);
  assert.throws(()=>identities.resolveTerm({word:"APR",termId:"credit.unknown"}),/Unknown approved Credit identity/);
  assert.throws(()=>identities.validateVocabulary(creditTerms().slice(1)),/coverage mismatch/);
});

test("frozen Credit vocabulary remains byte-identical to the approved source",()=>{
  const crypto=require("node:crypto"),bytes=fs.readFileSync(path.join(ROOT,"content/credit-game-terms.js"));
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),"9f100f43e4e2e7f4e27f311b8ff07f988f74ac1c18c7bcd1a485d7d10f57181e");
});

test("current Credit V3 answers preserve world ownership, definitions, and permanent registry IDs",()=>{
  const terms=creditTerms(),byWord=new Map(terms.map(term=>[term.word,term])),puzzles=slate.createWorldSlate("credit",terms,game);
  for(const answer of puzzles.flatMap(puzzle=>puzzle.answers).filter(answer=>answer.category.startsWith("financial-"))){
    assert.equal(answer.worldId,"credit");
    assert.equal(answer.termId,`credit.${answer.word.toLowerCase()}`);
    assert.equal(answer.definition,byWord.get(answer.word).definition);
  }
});

test("browser and native build paths load the Credit registry before the V3 slate",()=>{
  const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8"),build=fs.readFileSync(path.join(ROOT,"scripts/build-www.sh"),"utf8");
  assert.ok(html.indexOf("content/credit-term-identities.js")>html.indexOf("content/credit-game-terms.js"));
  assert.ok(html.indexOf("content/credit-term-identities.js")<html.indexOf("src/v3-puzzle-slate.js"));
  assert.match(build,/content\/credit-term-identities\.js/);
});

// 2026-10-17 (CAL-0008): 49/39/59 -> 49/43/63 and 147 -> 155 (the four Credit terms are existing-education: Credit is never a futureInterface world) when ATM, WIRE, PHISHING and LIQUIDITY were added to the supplement; none is in a V3 puzzle yet.
// Updated 2026-10-17 (owner-authorized cross-world composition, then Phase 3 anchor replacements): the partition moved 36/43/66 -> 40/41/64 -> 44/40/61 as approved
// terms entered V3 puzzles; 44/40/61 -> 49/39/59 after the owner-approved Phase 5 compositions, which also added ACH and WORTH (145 -> 147). The terms remain mutually exclusive and exhaustive.
test("the 155-term coverage partition (145 original + ACH, WORTH and the eight CAL-0008 Credit/Banking/Investing terms) is mutually exclusive and reconciles to 49/43/63",()=>{
  const vocab=require("../content/v3-supplemental-terms.js").merge(allVocabularies()),all=Object.entries(vocab).flatMap(([worldId,terms])=>terms.map(term=>({worldId,word:term.word,id:worldId==="credit"?identities.resolveTerm(term):(term.termId||term.id||`${worldId}.${term.word.toLowerCase()}`)})));
  const puzzles=slate.createSlate(vocab,game),v3Ids=new Set(puzzles.flatMap(puzzle=>puzzle.answers).filter(answer=>answer.category.startsWith("financial-")).map(answer=>answer.termId));
  const existingEducation=new Set(all.filter(term=>(term.worldId==="crypto"||term.worldId==="credit")&&!v3Ids.has(term.id)).map(term=>term.id));
  const futureInterface=new Set(all.filter(term=>!v3Ids.has(term.id)&&!existingEducation.has(term.id)).map(term=>term.id));
  const classified=[...v3Ids,...existingEducation,...futureInterface];
  assert.equal(all.length,155);
  assert.equal(new Set(all.map(term=>term.id)).size,155);
  assert.equal(v3Ids.size,49);
  assert.equal(existingEducation.size,43);
  assert.equal(futureInterface.size,63);
  assert.equal(classified.length,155);
  assert.equal(new Set(classified).size,155);
});

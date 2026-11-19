// Approved-financial-term acceptance in every puzzle + three-letter currency bonus (owner assignment 2026-11-18, narrowed to financial terms).
// These tests drive the REAL runtime functions of word-game-app.js (wgBuildWordContext, wgWordOptions, wgSubmitWord) and src/wheel-interaction.js
// for all 61 released puzzles, so acceptance is judged exactly as in gameplay, not by comparing data files.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),cp=require("node:child_process");
const X=require("./universal-acceptance-helpers.js");
const {ROOT,Wheel,Vocab,Currency,session,activePuzzles}=X;
const A=require("../src/answer-expansion.js");
const doc=JSON.parse(fs.readFileSync(path.join(ROOT,"content/universal-vocabulary-v1.json"),"utf8"));
const currencyDoc=JSON.parse(fs.readFileSync(path.join(ROOT,"content/currency-bonus-v1.json"),"utf8"));
const vocab=Vocab.shared(),dictionary=A.loadDictionary(ROOT),puzzles=activePuzzles();
const text=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
const CURRENCY_NAMES={NIO:"Nicaraguan córdoba",INR:"Indian rupee",AED:"UAE dirham",RON:"Romanian leu",IDR:"Indonesian rupiah",SAR:"Saudi riyal",ARS:"Argentine peso",TRY:"Turkish lira",EUR:"Euro",PEN:"Peruvian sol",SCR:"Seychellois rupee",CAD:"Canadian dollar",NPR:"Nepalese rupee",AUD:"Australian dollar",LSL:"Lesotho loti",NAD:"Namibian dollar",KES:"Kenyan shilling",SEK:"Swedish krona",NOK:"Norwegian krone",USD:"United States dollar"};
const DESIGNATED_NAMES={AFN:"Afghan afghani",ERN:"Eritrean nakfa",BDT:"Bangladeshi taka",HTG:"Haitian gourde",AOA:"Angolan kwanza",XAF:"Central African CFA franc",ALL:"Albanian lek",UAH:"Ukrainian hryvnia",PKR:"Pakistani rupee"};
const DESIGNATED={FREELANCE:"AFN",BREAKEVEN:"ERN",BUDGET:"BDT",GROWTH:"HTG",AUTOPAY:"AOA",TAXFILING:"XAF",LIABILITY:"ALL",CASHVALUE:"UAH",PROOFLIKE:"PKR",MELTVALUE:"ALL"};
const ALL_NAMES=Object.assign({},CURRENCY_NAMES,DESIGNATED_NAMES);
const GAMEPLAY_WORDS=["FREE","COINS","PAYOUT","NETPAY"];
const canForm=(word,letters)=>{const have={};for(const l of letters)have[l]=(have[l]||0)+1;for(const l of word){if(!have[l])return false;have[l]--}return true};
// a synthetic wheel for vocabulary checks; it has no designated currency unless a test sets one
const synthetic=(anchor,letters)=>{const puzzle={id:"TEST:"+anchor,worldId:"test",anchorWord:anchor,wheelLetters:[...letters]};const s=session(puzzle,{letters:[...letters],words:[],answers:[],anchorWord:anchor});s.state.wordContext=Object.assign({},s.state.wordContext,{currency:null});return s};
const eligibleTerms=letters=>[...dictionary.keys()].filter(w=>w.length>=3&&canForm(w,letters));

// ---------------------------------------------------------------- vocabulary = approved financial terms only
test("the vocabulary is exactly the approved financial terms that fit a wheel: no general English, nothing added",()=>{
  assert.equal(dictionary.size,211);assert.equal(A.EXPECTED_TERM_COUNT,211);
  assert.equal(doc.general.length,0);assert.equal(doc.counts.general,0);
  assert.deepEqual(doc.financial,[...dictionary.keys()].filter(w=>w.length>=3&&w.length<=9).sort());
  assert.equal(doc.financial.length,196);assert.equal(doc.tooLongForAnyWheel.length,15);assert.equal(vocab.size,196);
  doc.tooLongForAnyWheel.forEach(w=>assert.ok(w.length>9,w));
  assert.equal(JSON.parse(text("content/answer-expansion-v1.json")).dictionary.termCount,211);
});

test("example words: approved terms are accepted; FREE, COINS, PAYOUT, NETPAY are approved gameplay words (not terms); other words are not",()=>{
  const approved=["FEE","FEES","PAY","NET","TERM","COIN","APR","APY","ATM","PAYMENT","AUTOPAY"];
  approved.forEach(w=>{assert.ok(dictionary.has(w),w+" is an approved term");assert.equal(vocab.kindOf(w),"financial",w);assert.equal(synthetic("EX_"+w,[...w,"X"]).submit(w).outcome,"bonus",w+" accepted from a wheel that spells it")});
  GAMEPLAY_WORDS.forEach(w=>{assert.equal(dictionary.has(w),false,w+" stays out of the curriculum");assert.equal(vocab.kindOf(w),null,w);assert.equal(synthetic("EX_"+w,[...w,"X"]).submit(w).outcome,"bonus",w+" accepted as a gameplay bonus word")});
  ["ARP","IRA","ETF","TAX"].forEach(w=>{assert.equal(dictionary.has(w),false,w+" is not an approved term");assert.equal(synthetic("EX_"+w,[...w,"X"]).submit(w).outcome,"rejected",w+" is not accepted")});
});

// ---------------------------------------------------------------- every released puzzle, through the runtime
test("61 released puzzles across all 13 worlds are tested, and every puzzle keeps its integrity",()=>{
  assert.equal(puzzles.length,61);assert.equal(new Set(puzzles.map(p=>p.worldId)).size,13);
  for(const puzzle of puzzles){
    const s=session(puzzle),letters=s.model.letters;
    assert.deepEqual([...letters].sort(),[...puzzle.anchorWord].sort(),`${puzzle.id} wheel = key term`);
    assert.equal(A.anchorSpellsWheelExactly(puzzle),true,puzzle.id);
    assert.equal(new Set(s.model.words).size,s.model.words.length);
    s.model.words.forEach(w=>assert.ok(canForm(w,letters),`${puzzle.id} ${w}`));
    assert.ok(s.model.words.includes(puzzle.anchorWord));
  }
});

test("every approved term a wheel can spell is accepted by the real submit logic in all 61 puzzles, and none is rejected",()=>{
  let combos=0,accepted=0,rejected=0,required=0,bonus=0;
  for(const puzzle of puzzles){
    const s=session(puzzle);
    for(const word of eligibleTerms(s.model.letters)){
      combos++;
      const first=s.submit(word).outcome;
      if(first==="required"){accepted++;required++}else if(first==="bonus"){accepted++;bonus++}else rejected++;
      assert.ok(first==="required"||first==="bonus",`${puzzle.id}: approved term ${word} -> ${first}`);
      if(s.model.words.includes(word))assert.equal(first,"required",`${puzzle.id}: ${word} stays a required answer`);
      assert.equal(s.submit(word).outcome,"duplicate",`${puzzle.id}: ${word} cannot be credited twice`);
    }
  }
  assert.equal(rejected,0);assert.equal(accepted,combos);
  // the exhaustive-answer rule already makes every spellable approved term a required answer in the released puzzles
  assert.equal(bonus,0,"no released puzzle needs the vocabulary for an approved term: all are already required");assert.equal(required,combos);
  assert.ok(combos>=250);
});

test("approved terms from other worlds are accepted by a wheel that can spell them (generated puzzles with no answer list)",()=>{
  let crossWorld=0;
  for(const puzzle of puzzles){
    const s=synthetic(puzzle.anchorWord,activePuzzlesLetters(puzzle));
    for(const word of eligibleTerms(s.model.letters)){if(dictionary.get(word).worldId!==puzzle.worldId)crossWorld++;assert.equal(s.submit(word).outcome,"bonus",`${puzzle.id} ${word}`)}
  }
  assert.ok(crossWorld>0);
  function activePuzzlesLetters(p){return X.Bank.puzzleModel(p).letters}
});

test("invalid letter combinations are rejected and repeated-letter counts are enforced",()=>{
  const t=synthetic("AUTOPAYMENT",[..."AAEMNOPTTUY"]);
  ["TOMATO","MAMMA","POTATO","TEEN","MUMMY","UNEQUAL","ZZZ","AB","","mutant","pay"].forEach(w=>assert.ok(["rejected","duplicate"].includes(t.submit(w).outcome)||w==="",w));
  assert.equal(t.submit("PAYMENT").outcome,"bonus");assert.equal(t.submit("AUTOPAY").outcome,"bonus");assert.equal(t.submit("PAY").outcome,"bonus");
  assert.equal(t.submit("PUTT").outcome,"rejected","PUTT is not an approved term, so it is rejected (two T tiles alone do not make a word valid)");
  assert.equal(t.submit("MUTANT").outcome,"rejected","ordinary English words are not accepted");
  assert.equal(synthetic("TWOTILES",[..."FEXE"]).submit("FEE").outcome,"bonus","two E tiles allow FEE");
  assert.equal(synthetic("ONEE",[..."FEX"]).submit("FEE").outcome,"rejected","one E tile does not");
  assert.equal(synthetic("ONES",[..."FEEX"]).submit("FEES").outcome,"rejected","FEES needs an S tile");
});

test("required answers, completion and progression are unchanged: approved terms never leave the required path, bonus words never reach it",()=>{
  for(const puzzle of puzzles){
    const s=session(puzzle);
    s.model.words.forEach(w=>assert.equal(s.submit(w).outcome,"required"));
    assert.equal(s.state.found.size,s.model.words.length,puzzle.id);assert.equal(s.log.found.length,s.model.words.length);
    if(Wheel.canSpell("DUE",s.model.letters)&&!s.model.words.includes("DUE"))assert.equal(s.submit("DUE").outcome,"bonus","DUE keeps working");
  }
  assert.equal(Wheel.classifyWord("TEA",["TEAM"],new Set(),{wheelLetters:[..."TEAM"],foundBonus:new Set()}).status,"invalid","legacy callers: unchanged");
});

// ---------------------------------------------------------------- tap input is back to the original behaviour
test("tap-input deferral: unfound required answers, plus unfound bonus words since the owner-approved tap fix (2026-11-18; see tap-bonus-prefix.test.js)",()=>{
  const src=text("src/wheel-interaction.js");
  assert.ok(!src.includes("hasLongerPending")&&!src.includes("options.candidates"));
  assert.equal(Wheel.isDeferredTarget.length,4,"isDeferredTarget(word, targets, found, options)");
  assert.equal(Wheel.canSubmitTapWord("PAY",["PAY","PAYMENT"],new Set()),false,"PAY waits while PAYMENT is unfound");
  assert.equal(Wheel.shouldSubmitOnRetap(true,"PAY",["PAY","PAYMENT"],new Set()),true,"and the retap submits it");
  assert.ok(text("word-game-app.js").includes("FinLitWheelInteraction.isDeferredTarget(word, wgState.words, wgState.found, wgWordOptions())"));
});

// ---------------------------------------------------------------- currency bonus
test("the currency pool is the 20 approved ISO 4217 codes; the 9 further approved codes are used only on their 10 designated puzzles",()=>{
  assert.equal(Currency.POOL.length,20);assert.deepEqual(Object.fromEntries(Currency.POOL.map(c=>[c.code,c.name])),CURRENCY_NAMES);
  assert.deepEqual(currencyDoc.pool.map(c=>c.code),Currency.CODES);
  assert.deepEqual(Object.fromEntries(Currency.DESIGNATED_POOL.map(c=>[c.code,c.name])),DESIGNATED_NAMES);assert.equal(Currency.ALL_CODES.length,29);
  Currency.DESIGNATED_POOL.forEach(c=>assert.equal(Currency.CODES.includes(c.code),false,c.code+" is not in the automatic pool"));
  assert.deepEqual(Object.fromEntries(Object.entries(Currency.DESIGNATED).map(([id,c])=>[puzzles.find(p=>p.id===id).anchorWord,c])),DESIGNATED);
});

test("exactly one designated code per puzzle where one fits: 51 verified (41 pool + 10 designated), 10 without; each spellable from the wheel (repeats respected) and never a required answer",()=>{
  assert.equal(currencyDoc.puzzleCount,61);
  assert.deepEqual(Object.keys(currencyDoc.assignments).sort(),puzzles.map(p=>p.id).sort());
  let assigned=0;
  for(const puzzle of puzzles){
    const s=session(puzzle),code=currencyDoc.assignments[puzzle.id],context=s.options().currency;
    const possible=Currency.CODES.filter(c=>canForm(c,s.model.letters));
    if(code===null){assert.equal(context,null);assert.deepEqual(Currency.eligibleCodes(s.model.letters,s.model.words),[]);assert.ok(possible.every(c=>s.model.words.includes(c)),`${puzzle.id}: no approved code fits the wheel`);continue}
    assigned++;
    if(DESIGNATED[puzzle.anchorWord])assert.equal(code,DESIGNATED[puzzle.anchorWord],puzzle.id);
    else if(Currency.GRID_SUBSTITUTIONS[puzzle.id])assert.equal(code,Currency.GRID_SUBSTITUTIONS[puzzle.id],puzzle.id+" owner-approved grid substitution");
    else assert.ok(CURRENCY_NAMES[code],puzzle.id+" uses the 20-code pool");
    assert.ok(ALL_NAMES[code]);assert.ok(canForm(code,s.model.letters),`${puzzle.id} can spell ${code}`);
    assert.equal(s.model.words.includes(code),false);assert.deepEqual(context,{code,name:ALL_NAMES[code]});
  }
  assert.equal(assigned,51);assert.equal(currencyDoc.withoutCode.length,10);
  assert.deepEqual(currencyDoc.withoutCode.map(id=>puzzles.find(p=>p.id===id).anchorWord).sort(),["BLOCK","CAPACITY","CHAIN","MARKET","PAYCHECK","RECEIPT","RETAIL","SAVING","STOCK","TERMS"]);
  // for the 10, the evidence: not one of the 29 approved codes can be spelled from the wheel
  currencyDoc.withoutCode.forEach(id=>{const p=puzzles.find(x=>x.id===id),m=X.Bank.puzzleModel(p);assert.deepEqual(Currency.ALL_CODES.filter(c=>canForm(c,m.letters)),[],id)});
});

test("repeated letters are respected for currency codes (LSL needs two L tiles)",()=>{
  assert.equal(Currency.canSpell("LSL",[..."SALT"]),false);assert.equal(Currency.canSpell("LSL",[..."SALLY"]),true);
  assert.equal(Currency.canSpell("NAD",[..."AD"]),false);
  puzzles.filter(p=>currencyDoc.assignments[p.id]==="LSL").forEach(p=>assert.ok([...p.wheelLetters].filter(l=>l==="L").length>=2));
});

test("assignment is deterministic and varied; the committed manifest equals a fresh computation",()=>{
  const inputs=puzzles.map(p=>{const m=X.Bank.puzzleModel(p);return{id:p.id,letters:m.letters,requiredWords:m.words}});
  assert.deepEqual(Currency.assign(inputs),Currency.assign(inputs));assert.deepEqual(Currency.assign(inputs),currencyDoc.assignments);
  const usage=Object.values(currencyDoc.assignments).filter(Boolean).reduce((m,c)=>(m[c]=(m[c]||0)+1,m),{});
  assert.ok(Object.keys(usage).length>=15);assert.deepEqual(usage,currencyDoc.usage);
});

test("finding the code: special bonus, shows code and full currency name, pays nothing, once only, never required",()=>{
  let verified=0;
  for(const puzzle of puzzles){
    const s=session(puzzle),d=s.options().currency;if(!d)continue;
    const before={reward:s.log.found.length,found:s.state.found.size};
    const first=s.submit(d.code);
    assert.equal(first.outcome,"currency",puzzle.id);
    assert.equal(first.toast,`Currency bonus: ${d.code} · ${ALL_NAMES[d.code]}`);
    assert.equal(first.feedback.message,`${d.code} — ${ALL_NAMES[d.code]}`);
    assert.equal(s.log.found.length,before.reward,"no coins or XP: the required-answer reward path is never entered");
    assert.equal(s.state.found.size,before.found,"not counted toward completion");
    assert.equal(s.submit(d.code).outcome,"duplicate","never credited twice");
    assert.equal(s.log.toasts.filter(t=>t.startsWith("Currency bonus")).length,1);
    verified++;
  }
  assert.equal(verified,51);
});

test("only the designated code is a currency bonus, and completion never needs it (with or without a code)",()=>{
  const t=synthetic("OTHER",[..."EURTRY"]);t.state.wordContext=Object.assign({},t.state.wordContext,{currency:{code:"TRY",name:"Turkish lira"}});
  assert.equal(t.submit("EUR").outcome,"rejected","an undesignated code is not a bonus");assert.equal(t.submit("TRY").outcome,"currency");
  for(const puzzle of puzzles){
    const s=session(puzzle),d=s.options().currency;
    if(d&&puzzle.id.length%2===0)s.submit(d.code);
    s.model.words.forEach(w=>assert.equal(s.submit(w).outcome,"required"));
    assert.equal(s.state.found.size,s.model.words.length,puzzle.id);
  }
});

// ---------------------------------------------------------------- regression and bundles
test("the seven Phase 2b revisions and the 61-level sequence are untouched",()=>{
  const revisions=JSON.parse(text("content/unified-exact-wheel-revisions-dev.json")).puzzles;
  assert.equal(revisions.length,7);const ids=new Set(puzzles.map(p=>p.id));revisions.forEach(r=>assert.ok(ids.has(r.id),r.id));
  assert.ok(ids.has("FQ-V3:moneybasics:RECEIPT:R4"));assert.equal(JSON.parse(text("content/unified-sequence-v3-dev.json")).entries.length,61);
});

test("wiring: modules load before the app, the build copies them, web and iOS bundles are identical",()=>{
  const html=text("index.html"),build=text("scripts/build-www.sh");
  const files=["src/universal-vocabulary.js","src/currency-bonus.js","content/universal-vocabulary-v1.js","content/currency-bonus-v1.js"];
  files.forEach(f=>{assert.ok(html.includes(`src="${f}?v=`),f);assert.ok(html.indexOf(`src="${f}?v=`)<html.indexOf('src="word-game-app.js'),f);assert.ok(build.includes(f),f)});
  [...files,"word-game-app.js","index.html","src/wheel-interaction.js"].forEach(f=>assert.ok(fs.readFileSync(path.join(ROOT,f)).equals(fs.readFileSync(path.join(ROOT,"ios/App/App/public",f))),`${f} identical in iOS bundle`));
  assert.ok(text("word-game-app.js").includes("Currency bonus:"));
});

test("generated data matches its generators",()=>{
  cp.execFileSync("node",["scripts/build-currency-bonus.mjs","check"],{cwd:ROOT});cp.execFileSync("node",["scripts/build-universal-vocabulary.mjs","check"],{cwd:ROOT});
});

// ---------------------------------------------------------------- approved gameplay words (owner-approved 2026-11-18; not curriculum terms)
test("FREE, COINS, PAYOUT and NETPAY: accepted by the real submit logic wherever the wheel can spell them, rejected elsewhere, once only, no reward",()=>{
  const counts={};
  for(const puzzle of puzzles){
    const s=session(puzzle);
    for(const w of GAMEPLAY_WORDS){
      const fits=canForm(w,s.model.letters),before={found:s.log.found.length,completion:s.state.found.size};
      const first=s.submit(w).outcome;
      if(!fits){assert.equal(first,"rejected",`${puzzle.anchorWord} cannot spell ${w}`);continue}
      counts[w]=(counts[w]||[]).concat(puzzle.anchorWord);
      assert.equal(first,"bonus",`${puzzle.anchorWord}: ${w}`);
      assert.equal(s.log.found.length,before.found,"no coins or XP");assert.equal(s.state.found.size,before.completion,"not counted toward completion");
      assert.equal(s.submit(w).outcome,"duplicate","recognised once");
    }
  }
  assert.deepEqual(counts,{FREE:["FREELANCE","REFINANCE"],COINS:["EXCLUSION"],PAYOUT:["AUTOPAY"],NETPAY:["PAYMENT","REPAYMENT"]});
  assert.equal(Wheel.classifyWord("FREE",["XYZ"],new Set(),{wheelLetters:[..."FRE"]}).status,"invalid","FREE needs two E tiles");
});

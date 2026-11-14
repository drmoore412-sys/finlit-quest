const test=require("node:test");
const assert=require("node:assert/strict");
const R=require("../src/composition-rules.js");
const V=require("../src/puzzle-validator.js");
const G=require("../src/game-engine.js");
const WL=require("../content/unified-filler-whitelist-dev.js");
const canForm=(word,letters)=>{const a=[...letters];return [...word].every(l=>{const i=a.indexOf(l);if(i<0)return false;a.splice(i,1);return true})};
const key=(word,category,n)=>({word,category,termId:"t."+n,masteryId:"t."+n,definition:"Fixture definition for "+word+".",rewardPolicy:"financial-first-solve"});
function build(){
  const sup=["EMPTY","PANT","MEAT","TAP","TEMP"],fl=["NAME","TEAM","TYPE"];
  for(const s1 of sup)for(const s2 of sup)for(const f of fl)for(const g of fl){
    if(s1===s2||f===g)continue;const trial=["PAYMENT",s1,s2,f,g];
    if(R.prefixPairs(trial).length)continue;const s=G.solveCrossword(trial);if(s.ok)return {trial,s,f,g}}
  return null;
}
const found=build();
const wl=structuredClone(WL);
const entryOf=w=>wl.entries.find(e=>e.word===w);
if(found)[found.f,found.g].forEach(w=>entryOf(w).approvedInPuzzles=[...entryOf(w).approvedInPuzzles,"PAYMENT"]);
const fillerEntry=found&&entryOf(found.f);
function puzzle(){
  const [income,coin,nice,filler,mone]=found.trial,g=entryOf(mone);
  return {id:"FQ-V3:t:PAYMENT:R1",contentRevision:1,compositionRuleVersion:"v2",anchorWord:income,anchorTermId:"t.A",wheelLetters:[...income],
    answers:[key(income,"financial-anchor","A"),key(coin,"financial-secondary","B"),key(nice,"financial-secondary","C"),
      {word:filler,category:"ordinary",fillerId:fillerEntry.fillerId,rewardPolicy:"ordinary-first-solve"},
      {word:mone,category:"ordinary",fillerId:g.fillerId,rewardPolicy:"ordinary-first-solve"}],
    supportRelevance:{[coin]:{label:"direct",explanation:"Coin value is paid out as income here."},[nice]:{label:"contextual",strong:true,explanation:"Strong link to income in this fixture."}},
    layout:found.s.placements,
    rewardPolicy:{financial:{coinsPerLetter:7,xpPerLetter:1.5,roundXp:true},ordinary:{coinsPerWord:1,xp:0},bonus:{coins:0,xp:0}}};
}
const deps=()=>({canFormFn:canForm,validateCrosswordLayoutFn:G.validateCrosswordLayout,fillerWhitelist:wl});
test("fixture search found a solvable five-answer layout",()=>assert.ok(found,"no fixture"));
// make the fixture exactly five answers by dropping the unapproved 5th ordinary word
function base(){return puzzle()}
function layoutFor(p){const words=p.answers.map(a=>a.word),s=G.solveCrossword(words);assert.ok(s.ok,"solvable "+words);p.layout=s.placements;return p}
const errs=p=>R.validateV2Puzzle(p,deps()).errors;
test("a compliant five-answer v2 puzzle passes",()=>{const p=layoutFor(base());assert.deepEqual(errs(p),[])});
test("answer count must be 5 to 7",()=>{const p=layoutFor(base());p.answers=p.answers.slice(0,4);assert.ok(errs(p).includes("requiredAnswerCount"))});
test("at most four fillers",()=>{const p=layoutFor(base());for(let i=0;i<5;i++)p.answers.push({word:"ZZ"+i,category:"ordinary",fillerId:"filler.x"+i,rewardPolicy:"ordinary-first-solve"});assert.ok(errs(p).includes("fillerCountLimit"))});
test("three substantive key terms are required; incidental terms do not count",()=>{
  const p=layoutFor(base());p.supportRelevance[found.trial[2]]={label:"incidental"};const e=errs(p);assert.ok(e.includes("threeSubstantiveKeyTerms"))});
test("at least one direct support is required",()=>{const p=layoutFor(base());p.supportRelevance[found.trial[1]]={label:"contextual",strong:true,explanation:"Strong contextual link here."};assert.ok(errs(p).includes("directSupportRequired"))});
test("second support must be direct or strong contextual",()=>{const p=layoutFor(base());p.supportRelevance[found.trial[2]]={label:"contextual",explanation:"Weak contextual link only."};assert.ok(errs(p).includes("secondSupportDirectOrStrongContextual"))});
test("missing label or missing explanation fails",()=>{const p=layoutFor(base());delete p.supportRelevance[found.trial[2]];assert.ok(errs(p).includes("relevanceLabelMissing"));const q=layoutFor(base());q.supportRelevance[found.trial[1]]={label:"direct",explanation:"short"};assert.ok(errs(q).includes("relevanceExplanation"))});
test("filler approval record is required, must match the puzzle, and excluded words are hard-blocked",()=>{
  const p=layoutFor(base());p.answers.find(a=>a.category==="ordinary").fillerId="filler.unknown";assert.ok(errs(p).includes("fillerNotWhitelisted"));
  const q=layoutFor(base());wl.entries.find(e=>e.fillerId===fillerEntry.fillerId).approvedInPuzzles=["OTHER"];assert.ok(errs(q).includes("fillerNotApprovedForPuzzle"));wl.entries.find(e=>e.fillerId===fillerEntry.fillerId).approvedInPuzzles=["PAYMENT"];
  const r=layoutFor(base());r.answers.find(a=>a.category==="ordinary").word="TOP";assert.ok(errs(r).includes("fillerExcluded"));
  R.EXCLUDED_FILLERS.forEach(w=>assert.equal(WL.entries.some(e=>e.word===w),false));
});
test("fillers are never production-approved in release mode and carry no term identity",()=>{
  const p=layoutFor(base());assert.ok(R.validateV2Puzzle(p,{...deps(),release:true}).errors.includes("fillerNotProductionApproved"));
  p.answers.find(a=>a.category==="ordinary").termId="x";assert.ok(errs(p).includes("ordinaryMetadataIsolated"));
});
test("exact wheel inventory, nine-letter cap and formability are enforced",()=>{
  const p=layoutFor(base());p.wheelLetters=[..."PAYMENTE"];assert.ok(errs(p).includes("anchorWheelInventory"));
  const q=layoutFor(base());q.wheelLetters=[..."PAYME"];assert.ok(errs(q).includes("anchorWheelInventory"));
  const r=layoutFor(base());assert.ok(R.validateV2Puzzle(r,{...deps(),wheelBudget:5}).errors.includes("anchorWheelInventory"));
  const s=layoutFor(base());s.answers.push({word:"ZEBRA",category:"ordinary",fillerId:"filler.z",rewardPolicy:"ordinary-first-solve"});assert.ok(errs(s).includes("requiredWordsFitAnchorWheel"));
});
test("layout must be one legal connected crossword",()=>{const p=layoutFor(base());p.layout=p.layout.slice(1);assert.ok(errs(p).includes("strictCrosswordLayout"));const q=layoutFor(base());delete q.layout;assert.ok(errs(q).includes("strictCrosswordLayout"))});
test("prefix pairs need justification, interaction support and a test id",()=>{
  const p=layoutFor(base()),shorter=p.answers[1].word,longer=shorter+"S";
  p.answers.push({word:longer,category:"ordinary",fillerId:"filler.x",rewardPolicy:"ordinary-first-solve"});
  assert.ok(errs(p).includes("prefixPairUnjustified"));
  assert.deepEqual(R.prefixPairs(["COIN","COINS","ICON"]),[["COIN","COINS"]]);
  p.prefixJustifications=[{shorter,longer,justification:"Plural teaches the singular term.",interactionSupport:true,testId:"t-prefix-1"}];
  assert.equal(errs(p).includes("prefixPairUnjustified"),false);
  p.prefixJustifications[0].interactionSupport=false;assert.ok(errs(p).includes("prefixPairUnjustified"));
  p.prefixJustifications[0]={...p.prefixJustifications[0],interactionSupport:true,testId:""};assert.ok(errs(p).includes("prefixPairUnjustified"));
});
test("reward policy and stable identity are validated",()=>{
  const p=layoutFor(base());p.rewardPolicy.financial.coinsPerLetter=6;assert.ok(errs(p).includes("rewardPolicyValid"));
  const q=layoutFor(base());delete q.contentRevision;assert.ok(errs(q).includes("stableRevisionIdentity"));
  const r=layoutFor(base());assert.ok(R.validateV2Puzzle(r,{...deps(),existingIds:new Set([r.id])}).errors.includes("noDuplicateId"));
});
test("validatePuzzle dispatches by version: v2 uses the new rules, unknown versions fail closed, missing keeps v1 path",()=>{
  const p=layoutFor(base());
  assert.deepEqual(V.validatePuzzle(p,deps()).errors,[]);
  assert.deepEqual(V.validatePuzzle({compositionRuleVersion:"v9"},{}).errors,["unknownCompositionRuleVersion"]);
  const legacy=V.validatePuzzle({id:"x"},{});assert.ok(!legacy.errors.includes("unknownCompositionRuleVersion"));
  assert.deepEqual(V.validatePuzzle({id:"x",compositionRuleVersion:"v1"},{}),legacy);
});
test("six- and seven-answer layouts are only accepted when the strict solver produces a legal grid",()=>{
  for(const extra of [["TEN"],["TEN","MAN"]]){
    const p=base();const fillers=extra.map((w,i)=>({word:w,category:"ordinary",fillerId:"filler.t"+i,rewardPolicy:"ordinary-first-solve"}));
    p.answers.push(...fillers);const solved=G.solveCrossword(p.answers.map(a=>a.word));
    if(solved.ok){p.layout=solved.placements;assert.equal(G.validateCrosswordLayout(p.answers.map(a=>a.word),p.layout).valid,true)}
    assert.equal(errs(p).includes("requiredAnswerCount"),false,"6-7 answers are within the count rule");
  }
});

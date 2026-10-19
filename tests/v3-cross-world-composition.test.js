// Owner decision 2026-10-17: all 145 approved financial terms may be used across worlds.
// These tests prove the 145-term inventory is intact, cross-world terms keep their
// original identity and governed definition, first-discovery rewards cannot be claimed
// twice globally, mastery stays one record per term, and existing saves are untouched.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {ROOT,memoryStorage}=require("./helpers.js");
const slate=require("../src/v3-puzzle-slate.js"),game=require("../src/game-engine.js"),bank=require("../src/puzzle-bank-engine.js"),validator=require("../src/puzzle-validator.js"),identities=require("../content/credit-term-identities.js"),learningApi=require("../learning-engine.js");

function loadWindow(file,key){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context);return context.window[key]}
function vocabularies(){
  const context={window:{DEFI_TERMS:loadWindow("content/crypto-terms.js","DEFI_TERMS")}};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,"worlds/crypto.js"),"utf8"),context);
  return {
    crypto:context.window.FINLIT_WORLD.terms.map(term=>({word:term.word,definition:term.definition,termId:term.id})),
    credit:loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS"),
    moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),
    banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),
    investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS"),
  };
}
const VOCAB=vocabularies();
const WORLDS=["moneybasics","credit","crypto","banking","investing"];
function termId(worldId,term){return worldId==="credit"?identities.resolveTerm(term):(term.termId||term.id||`${worldId}.${term.word.toLowerCase()}`)}
const supplement=require("../content/v3-supplemental-terms.js");
// BASE_INVENTORY is the original 145-term approved vocabulary. INVENTORY adds the two owner-approved V3 supplement terms (ACH, WORTH; Phase 5, 2026-10-16) = 147.
const BASE_INVENTORY=WORLDS.flatMap(worldId=>VOCAB[worldId].map(term=>({worldId,word:term.word,id:termId(worldId,term),definition:String(term.definition||"")})));
const INVENTORY=[...BASE_INVENTORY,...supplement.TERMS.map(term=>({worldId:term.world,word:term.word,id:term.id,definition:term.definition}))];
const BY_WORD=new Map(INVENTORY.map(term=>[term.word,term]));
const PUZZLES=slate.createSlate(VOCAB,game);
const validate=puzzle=>validator.validateV3Puzzle(puzzle,{canFormFn:game.canForm,validateCrosswordLayoutFn:game.validateCrosswordLayout});
const letterCounts=word=>[...word].reduce((counts,letter)=>({...counts,[letter]:(counts[letter]||0)+1}),{});
// Every recomposed puzzle (revision 2): seven from the cross-world repair, eight from Phase 3 (three financial-only and five with one editor-selected ordinary word).
const CHANGED={TOKEN:["TOKEN","NET","NOTE"],STAKE:["STAKE","ASK","TAKE"],CREDITOR:["CREDITOR","CREDIT","DIRECT"],RECEIPT:["RECEIPT","PRICE","PIECE"],BUDGET:["BUDGET","DEBT","BED"],NETWORK:["NETWORK","OWNER","WORK"],PASSWORD:["PASSWORD","SWAP","PASS"],
  PASSKEY:["PASSKEY","PAY","APY"],CONVERT:["CONVERT","NET","VOTE"],MARKET:["MARKET","RATE","TERM"],PRINCIPAL:["PRINCIPAL","APR","PLAIN"],BLOCK:["BLOCK","LOCK","LOB"],STOCK:["STOCK","COST","SOCK"],TRADE:["TRADE","RATE","READ"],RETURN:["RETURN","NET","TUNE"],
  // Phase 5 (owner-approved 2026-10-16): the last four puzzles, using ACH and WORTH and two cross-world anchors.
  CHAIN:["CHAIN","ACH","CHIN"],INCOME:["INCOME","COIN","COME"],SAVING:["SAVING","GAS","GAIN"],GROWTH:["GROWTH","WORTH","ROW"]};
// Approved terms that appear in a puzzle of a world other than their own, with their owning world.
// Revision of each recomposed puzzle. BLOCK is revision 3: Phase 4 replaced the ordinary word COB with LOB (owner decision), so BLOCK:R2 completions are not inherited.
const REVISION_OF=anchor=>anchor==="BLOCK"?3:2;
const CROSS={NET:"moneybasics",ASK:"investing",DEBT:"credit",OWNER:"investing",SWAP:"crypto",PAY:"moneybasics",APY:"credit",VOTE:"investing",RATE:"moneybasics",TERM:"credit",COST:"moneybasics",ACH:"banking",GAS:"crypto",INCOME:"moneybasics",SAVING:"moneybasics"};
// INCOME and SAVING are the two approved cross-world ANCHORS (FLQ-V3-CROSS-WORLD-ANCHOR-001); every other cross-world answer is a secondary.
const CROSS_ANCHORS=new Set(["INCOME","SAVING"]);

// ---------- Task 1: the 145-term inventory ----------
test("the original approved vocabulary is exactly 145 terms with unique permanent identities and governed definitions",()=>{
  const INVENTORY=BASE_INVENTORY;
  assert.equal(INVENTORY.length,145);
  assert.deepEqual(Object.fromEntries(WORLDS.map(worldId=>[worldId,INVENTORY.filter(term=>term.worldId===worldId).length])),{moneybasics:36,credit:38,crypto:20,banking:26,investing:25});
  assert.equal(new Set(INVENTORY.map(term=>term.id)).size,145);
  assert.equal(new Set(INVENTORY.map(term=>term.word)).size,145,"no word belongs to two worlds");
  INVENTORY.forEach(term=>{
    assert.ok(term.id&&term.id.startsWith(`${term.worldId}.`),`${term.word} identity ${term.id}`);
    assert.ok(term.definition.trim().length>0,`${term.word} has a governed definition`);
  });
  const credit=INVENTORY.filter(term=>term.worldId==="credit");
  assert.ok(credit.every(term=>identities.resolveTerm(VOCAB.credit.find(entry=>entry.word===term.word))===term.id),"Credit identities come only from the approved registry");
});

test("the owner-approved supplement adds exactly ACH, WORTH and the four CAL-0008 terms (155 terms) without touching the original 145",()=>{
  assert.equal(INVENTORY.length,155);
  assert.deepEqual(Object.fromEntries(WORLDS.map(worldId=>[worldId,INVENTORY.filter(term=>term.worldId===worldId).length])),{moneybasics:36,credit:42,crypto:20,banking:30,investing:27});
  assert.equal(new Set(INVENTORY.map(term=>term.id)).size,155);
  assert.equal(new Set(INVENTORY.map(term=>term.word)).size,155,"the supplement duplicates no existing word");
  assert.deepEqual(supplement.TERMS.map(term=>[term.id,term.word,term.world]),[["banking.ach","ACH","banking"],["investing.worth","WORTH","investing"],["banking.atm","ATM","banking"],["banking.wire","WIRE","banking"],["banking.phishing","PHISHING","banking"],["investing.liquidity","LIQUIDITY","investing"],["credit.report","REPORT","credit"],["credit.bureau","BUREAU","credit"],["credit.freeze","FREEZE","credit"],["credit.history","HISTORY","credit"]]);
  const json=JSON.parse(fs.readFileSync(path.join(ROOT,"content/v3-supplemental-terms.json"),"utf8"));
  assert.deepEqual(json.map(({id,word,world,definition})=>({id,word,world,definition})),supplement.TERMS.map(({id,word,world,definition})=>({id,word,world,definition})),"runtime and governance record are identical");
  json.forEach(term=>{assert.match(term.sourceUrl,/^https:\/\//);if(term.secondarySourceUrl)assert.match(term.secondarySourceUrl,/^https:\/\//);/* CAL-0008 terms WIRE, PHISHING and LIQUIDITY have one registered official source; no second source is invented */assert.ok(term.verificationNote&&term.definitionStatus&&term.sourceOrganization)});
  assert.match(BY_WORD.get("WORTH").definition,/^The amount of money something is valued at/,"WORTH describes monetary value, not an investment instrument");
  assert.doesNotMatch(BY_WORD.get("WORTH").definition,/investment|security|stock|fund/i);
  assert.equal(BASE_INVENTORY.some(term=>["ACH","WORTH","ATM","WIRE","PHISHING","LIQUIDITY","REPORT","BUREAU","FREEZE","HISTORY"].includes(term.word)),false);
  const legacyBanking=JSON.parse(fs.readFileSync(path.join(ROOT,"content/banking-basics-terms.json"),"utf8"));
  assert.equal(legacyBanking.length,26,"the frozen Banking v1.1 record and its 13 clusters are untouched");
});

// ---------- Task 2: composition of the repaired puzzles ----------
test("the nineteen recomposed puzzles have exactly the approved composition and a new revision ID",()=>{
  Object.entries(CHANGED).forEach(([anchor,words])=>{
    const puzzle=PUZZLES.find(item=>item.anchorWord===anchor);
    assert.deepEqual(puzzle.requiredWords,words,anchor);
    assert.equal(puzzle.contentRevision,REVISION_OF(anchor));
    assert.match(puzzle.id,new RegExp(`:R${REVISION_OF(anchor)}$`));
  });
  const unchanged=PUZZLES.filter(puzzle=>!CHANGED[puzzle.anchorWord]);
  assert.equal(unchanged.length,8);
  unchanged.forEach(puzzle=>{assert.equal(puzzle.contentRevision,1);assert.match(puzzle.id,/:R1$/)});
  const specs=slate.SPECS.filter(spec=>!CHANGED[spec.anchor]);
  assert.ok(specs.every(spec=>spec.revision===undefined&&spec.secondary.every(entry=>typeof entry==="string")),"the other 8 specs are untouched");
});

test("CREDITOR and RECEIPT remove only EDITOR and TIRE and keep 3 required words with a financial majority",()=>{
  ["CREDITOR","RECEIPT"].forEach(anchor=>{
    const puzzle=PUZZLES.find(item=>item.anchorWord===anchor),verdict=slate.validateComposition(puzzle,game);
    assert.equal(puzzle.requiredWords.length,3);
    assert.deepEqual(verdict,{valid:true,errors:[],counts:{required:3,financial:2,minimumFinancial:2}});
  });
  const all=PUZZLES.flatMap(puzzle=>puzzle.requiredWords);
  assert.ok(!all.includes("EDITOR")&&!all.includes("TIRE"));
});

test("every cross-world puzzle meets all rules: wheel multiplicity, spelling, connected legal crossword, financial majority",()=>{
  PUZZLES.filter(puzzle=>puzzle.answers.some(answer=>answer.crossWorld)).forEach(puzzle=>{
    assert.deepEqual(validate(puzzle),{valid:true,errors:[]},puzzle.id);
    const verdict=slate.validateComposition(puzzle,game);
    assert.equal(verdict.valid,true,`${puzzle.id}: ${verdict.errors.join("; ")}`);
    assert.equal(puzzle.wheelLetters.join(""),puzzle.anchorWord);
    const wheel=letterCounts(puzzle.wheelLetters.join(""));
    puzzle.requiredWords.forEach(word=>Object.entries(letterCounts(word)).forEach(([letter,count])=>assert.ok((wheel[letter]||0)>=count,`${puzzle.id}: ${word} needs ${count} ${letter}`)));
    assert.equal(game.validateCrosswordLayout(puzzle.requiredWords,puzzle.layout).valid,true);
    assert.ok(puzzle.requiredWords.length>=3&&puzzle.requiredWords.length<=5);
  });
});

test("all 27 puzzles are compliant (8 originally, 15 after the cross-world repair, 23 after Phase 3, 27 after the owner-approved Phase 5 compositions)",()=>{
  const compliant=PUZZLES.filter(puzzle=>slate.validateComposition(puzzle,game).valid);
  assert.equal(compliant.length,27);
  assert.equal(PUZZLES.length-compliant.length,0);
});

// ---------- Task 4: identity, definitions, vocabulary ----------
test("cross-world terms keep their ORIGINAL permanent identity, governed definition, and world ownership",()=>{
  const found=PUZZLES.flatMap(puzzle=>puzzle.answers.filter(answer=>answer.crossWorld).map(answer=>({puzzle,answer})));
  assert.deepEqual([...new Set(found.map(entry=>entry.answer.word))].sort(),Object.keys(CROSS).sort());
  found.forEach(({puzzle,answer})=>{
    const origin=BY_WORD.get(answer.word);
    assert.equal(answer.worldId,CROSS[answer.word]);
    assert.equal(answer.worldId,origin.worldId);
    assert.notEqual(answer.worldId,puzzle.worldId);
    assert.equal(answer.termId,origin.id,`${answer.word} identity`);
    assert.equal(answer.masteryId,origin.id);
    assert.equal(answer.definition,origin.definition,`${answer.word} governed definition is unchanged`);
    assert.equal(answer.crossWorld,true);
    assert.equal(answer.rewardPolicy,"financial-first-solve");
    assert.equal(answer.category,CROSS_ANCHORS.has(answer.word)?"financial-anchor":"financial-secondary");
  });
  assert.equal(PUZZLES.find(puzzle=>puzzle.anchorWord==="BUDGET").answers.find(answer=>answer.word==="DEBT").termId,"credit.debt","Credit terms resolve through the approved registry");
});

test("the validator rejects a cross-world answer that is unmarked, mislabeled, or carries a foreign identity",()=>{
  const puzzle=JSON.parse(JSON.stringify(PUZZLES.find(item=>item.anchorWord==="TOKEN")));
  const net=puzzle.answers.find(answer=>answer.word==="NET");
  assert.deepEqual(validate(puzzle),{valid:true,errors:[]});
  const unmarked=JSON.parse(JSON.stringify(puzzle));delete unmarked.answers.find(answer=>answer.word==="NET").crossWorld;
  assert.ok(validate(unmarked).errors.includes("financialMetadataComplete")||validate(unmarked).valid===false,"an unmarked foreign-world answer is invalid");
  const foreignId=JSON.parse(JSON.stringify(puzzle));foreignId.answers.find(answer=>answer.word==="NET").termId="crypto.net";
  assert.equal(validate(foreignId).valid,false,"identity prefix must match the owning world");
  const falseFlag=JSON.parse(JSON.stringify(puzzle));falseFlag.answers.find(answer=>answer.word==="TOKEN").crossWorld=true;
  assert.equal(validate(falseFlag).valid,false,"a same-world answer cannot be flagged cross-world");
  assert.equal(net.worldId,"moneybasics");
});

test("no governed vocabulary, definition, or identity is modified by building the slate",()=>{
  const before=JSON.stringify(VOCAB),beforeRegistry=JSON.stringify(identities.APPROVED_ENTRIES||null);
  slate.createSlate(vocabularies(),game);
  assert.equal(JSON.stringify(VOCAB),before);
  assert.equal(JSON.stringify(identities.APPROVED_ENTRIES||null),beforeRegistry);
  assert.throws(()=>slate.createWorldSlate("crypto",VOCAB.crypto,game),/requires the moneybasics vocabulary/,"cross-world specs never silently invent a term");
});

// ---------- Task 4: rewards ----------
function newSave(){return Object.fromEntries(WORLDS.map(worldId=>[`wg-${worldId}`,{solvedWords:[],rewardedSupportWords:[],rewardedOrdinaryWords:[],rewardedFinancialTermIds:[]}]))}
// Mirrors wgFoundWord: global history for the reward lookup, then record in the CURRENT world's lists.
function award(worlds,puzzle,word){
  const progress=worlds[`wg-${puzzle.worldId}`];
  const reward=bank.answerReward(puzzle,word,bank.globalRewardHistory(progress,Object.entries(worlds).filter(([key])=>key.startsWith("wg-")).map(([,value])=>value)));
  if(reward.isNewSolve){progress[reward.historyKey].push(word);if(reward.termId&&!progress.rewardedFinancialTermIds.includes(reward.termId))progress.rewardedFinancialTermIds.push(reward.termId)}
  return reward;
}

test("a cross-world term pays its first-discovery reward once globally, in either order",()=>{
  const payment=PUZZLES.find(puzzle=>puzzle.anchorWord==="PAYMENT"),token=PUZZLES.find(puzzle=>puzzle.anchorWord==="TOKEN");
  const forward=newSave();
  assert.deepEqual([award(forward,payment,"NET").coins,award(forward,payment,"NET").coins],[21,0]);
  assert.equal(award(forward,token,"NET").isNewSolve,false,"already discovered in Money Basics");
  assert.deepEqual(forward["wg-crypto"].solvedWords,[],"the host world records nothing for a term it did not pay");
  const reverse=newSave();
  assert.equal(award(reverse,token,"NET").coins,21);
  assert.equal(award(reverse,payment,"NET").coins,0,"discovered first in Crypto, so Money Basics pays nothing");
  assert.equal(reverse["wg-moneybasics"].solvedWords.length,0);
});

test("every cross-world term pays exactly once across origin and host puzzles",()=>{
  PUZZLES.filter(puzzle=>puzzle.answers.some(answer=>answer.crossWorld)).forEach(host=>{
    host.answers.filter(answer=>answer.crossWorld).forEach(shared=>{
      const origins=PUZZLES.filter(puzzle=>puzzle.id!==host.id&&puzzle.answers.some(answer=>answer.word===shared.word));
      const save=newSave();
      const paid=[award(save,host,shared.word).coins];
      origins.forEach(origin=>paid.push(award(save,origin,shared.word).coins));
      assert.equal(paid.filter(coins=>coins>0).length,1,`${shared.word} paid ${paid.join("/")}`);
      assert.equal(paid[0],shared.word.length*7);
    });
  });
});

test("across the whole slate every distinct financial term pays once in total, whatever the play order",()=>{
  const expected=[...new Map(PUZZLES.flatMap(puzzle=>puzzle.answers.filter(answer=>answer.category.startsWith("financial-"))).map(answer=>[answer.termId,answer.word.length*7])).values()].reduce((sum,coins)=>sum+coins,0);
  [PUZZLES,[...PUZZLES].reverse(),[...PUZZLES].sort((a,b)=>a.worldId.localeCompare(b.worldId)||b.anchorWord.localeCompare(a.anchorWord))].forEach(order=>{
    const save=newSave();let financial=0;
    order.forEach(puzzle=>puzzle.answers.filter(answer=>answer.category.startsWith("financial-")).forEach(answer=>{financial+=award(save,puzzle,answer.word).coins}));
    assert.equal(financial,expected);
  });
});

test("non-financial words keep their approved per-world, one-coin, zero-XP behavior",()=>{
  const world={solvedWords:["NET"],rewardedFinancialTermIds:["moneybasics.net"],rewardedSupportWords:[],rewardedOrdinaryWords:["NOTE"]};
  const other={solvedWords:[],rewardedFinancialTermIds:[],rewardedSupportWords:[],rewardedOrdinaryWords:[]};
  const merged=bank.globalRewardHistory(other,[world,other]);
  assert.deepEqual(merged.rewardedOrdinaryWords,[],"ordinary history is NOT shared across worlds");
  assert.deepEqual(merged.solvedWords,["NET"]);
  const token=PUZZLES.find(puzzle=>puzzle.anchorWord==="TOKEN");
  assert.deepEqual(bank.answerReward(token,"NOTE",merged),{coins:1,xp:0,isNewSolve:true,category:"ordinary",historyKey:"rewardedOrdinaryWords",termId:null});
  assert.equal(bank.answerReward(token,"NOTE",{rewardedOrdinaryWords:["NOTE"]}).isNewSolve,false);
  assert.deepEqual(bank.answerReward(token,"NET",merged),{coins:0,xp:0,isNewSolve:false,category:"financial-secondary",historyKey:"solvedWords",termId:"moneybasics.net"});
  assert.deepEqual(bank.answerReward(token,"NET",{}),{coins:21,xp:5,isNewSolve:true,category:"financial-secondary",historyKey:"solvedWords",termId:"moneybasics.net"});
});

test("existing reward histories are only read, never changed",()=>{
  const worlds=newSave();
  worlds["wg-crypto"].solvedWords=["TOKEN"];worlds["wg-moneybasics"].solvedWords=["CASH","NET"];worlds["wg-moneybasics"].rewardedFinancialTermIds=["moneybasics.net"];worlds["wg-credit"].rewardedOrdinaryWords=["REST"];
  const frozen=JSON.stringify(worlds);
  Object.values(worlds).forEach(world=>Object.values(world).forEach(list=>Object.freeze(list)));Object.values(worlds).forEach(Object.freeze);
  const merged=bank.globalRewardHistory(worlds["wg-crypto"],Object.values(worlds));
  assert.equal(JSON.stringify(worlds),frozen);
  assert.deepEqual(merged.solvedWords.sort(),["CASH","NET","TOKEN"]);
  assert.deepEqual(bank.globalRewardHistory(undefined,undefined),{solvedWords:[],rewardedFinancialTermIds:[]});
});

// ---------- Task 4: mastery ----------
test("mastery stays one record per permanent term identity, never duplicated across worlds",()=>{
  const storage=memoryStorage(),learning=new learningApi.LearningEngine({terms:[],storage});
  const payment=PUZZLES.find(puzzle=>puzzle.anchorWord==="PAYMENT"),token=PUZZLES.find(puzzle=>puzzle.anchorWord==="TOKEN"),stake=PUZZLES.find(puzzle=>puzzle.anchorWord==="STAKE");
  assert.doesNotThrow(()=>{learning.registerTerms(slate.financialLearningTerms([payment]));learning.registerTerms(slate.financialLearningTerms([token]));learning.registerTerms(slate.financialLearningTerms([stake]))},"the same term registered from two worlds is one learning object");
  assert.equal(learning.repository.get("moneybasics.net").world,"moneybasics");
  assert.equal(learning.repository.idsForWorld("crypto").includes("moneybasics.net"),false,"a host world does not take ownership");
  learning.recordPuzzleSolved("moneybasics.net");learning.recordPuzzleSolved("moneybasics.net");
  assert.equal(Object.keys(learning.save.termProgress).filter(id=>id.endsWith(".net")).length,1);
  assert.equal(learning.save.termProgress["moneybasics.net"].puzzle.timesSolved,2);
  const reloaded=new learningApi.LearningEngine({terms:[],storage});reloaded.registerTerms(slate.financialLearningTerms([token]));
  assert.equal(reloaded.save.termProgress["moneybasics.net"].puzzle.timesSolved,2,"mastery persists across a restart");
});

test("registering every V3 term from every world's bank never conflicts",()=>{
  const learning=new learningApi.LearningEngine({terms:[],storage:memoryStorage()});
  WORLDS.forEach(worldId=>assert.doesNotThrow(()=>learning.registerTerms(slate.financialLearningTerms(PUZZLES.filter(puzzle=>puzzle.worldId===worldId)))));
  assert.equal(learning.repository.size,49,"49 distinct approved terms appear in V3 puzzles (44 before Phase 5: WALLET and ASSET left, seven terms joined)");
});

// ---------- Task 5: save compatibility ----------
test("existing-player saves are untouched: old puzzle-revision history stays but is not inherited by the recomposed puzzle",()=>{
  const token=PUZZLES.find(puzzle=>puzzle.anchorWord==="TOKEN"),payment=PUZZLES.find(puzzle=>puzzle.anchorWord==="PAYMENT");
  const history={"FQ-V3:crypto:TOKEN:R1":{timesPlayed:3,lastPlayedAt:1760000000000},[payment.id]:{timesPlayed:1,lastPlayedAt:1760000001000}};
  const frozen=JSON.stringify(history);
  assert.deepEqual(bank.effectivePuzzleHistory([token],history,["TOKEN"]),{},"R1 completion does not count toward the recomposed R2 puzzle");
  assert.deepEqual(Object.keys(bank.effectivePuzzleHistory([payment],history,[])),[payment.id],"unchanged R1 puzzles keep their history");
  assert.equal(JSON.stringify(history),frozen,"the saved history itself is never edited");
  const raw={saveVersion:3,futureTop:{a:1},player:{xp:625,level:3,coins:777,streak:4,activityDates:[],achievements:["first_application"],futurePlayerFlag:"keep"},termProgress:{},
    worlds:{"wg-crypto":{solvedWords:["TOKEN"],puzzleHistory:history},"wg-moneybasics":{solvedWords:["CASH"]}},settings:{theme:"dark"}};
  const storage=memoryStorage({[learningApi.SAVE_KEY]:JSON.stringify(raw)}),learning=new learningApi.LearningEngine({terms:slate.financialLearningTerms(PUZZLES),storage});
  const worlds=JSON.stringify(learning.save.worlds);
  learning.registerTerms(slate.financialLearningTerms(PUZZLES));
  assert.equal(JSON.stringify(learning.save.worlds),worlds);
  assert.equal(learning.save.player.coins,777);assert.equal(learning.save.player.xp,625);assert.deepEqual(learning.save.futureTop,{a:1});assert.equal(learning.save.player.futurePlayerFlag,"keep");
});

test("canonical puzzle progress prevents duplicate shared-puzzle rewards while world progress stays separate",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  assert.equal((source.match(/canonicalAnswerReward\(wgState\.puzzle, (word|nextWord), wgRewardHistory\(/g)||[]).length,2,"award and preview use canonical reward history");
  assert.match(source,/function wgRewardHistory\(progress\)[\s\S]*?globalRewardHistory\(progress, worldProgress\)[\s\S]*?\}/);
  assert.match(source,/canonicalPuzzleProgress/);
  assert.match(source,/recordCanonicalCompletion/);
  assert.match(source,/manifest\.worldPlacements\[worldId\]/);
});


// ---------- Phase 3: eight replacement anchors ----------
const REPLACED={SECURE:"PASSKEY",RESERVE:"CONVERT",CAPITAL:"MARKET",ACCOUNT:"PRINCIPAL",MINER:"BLOCK",EQUITY:"STOCK",BROKER:"TRADE",DIVIDEND:"RETURN"};
const FINANCIAL_ONLY=["PASSKEY","CONVERT","MARKET"];
// Ordinary words chosen for owner review (not governed vocabulary).
const ORDINARY_CHOICES={PRINCIPAL:"PLAIN",BLOCK:"LOB",STOCK:"SOCK",TRADE:"READ",RETURN:"TUNE"};

test("the eight replacements sit in their old world and slot, are approved terms of that world, and the old anchors are gone",()=>{
  const worldCounts=Object.fromEntries(WORLDS.map(worldId=>[worldId,PUZZLES.filter(puzzle=>puzzle.worldId===worldId).length]));
  assert.deepEqual(worldCounts,{moneybasics:5,credit:6,crypto:5,banking:5,investing:6},"every world keeps its puzzle count");
  Object.entries(REPLACED).forEach(([oldAnchor,newAnchor])=>{
    assert.equal(PUZZLES.find(puzzle=>puzzle.anchorWord===oldAnchor),undefined,`${oldAnchor} is replaced`);
    const puzzle=PUZZLES.find(item=>item.anchorWord===newAnchor);
    assert.ok(puzzle,`${newAnchor} exists`);
    assert.equal(BY_WORD.get(newAnchor).worldId,puzzle.worldId,`${newAnchor} is an approved term owned by the puzzle's own world`);
    assert.equal(puzzle.anchorTermId,BY_WORD.get(newAnchor).id);
    assert.deepEqual(puzzle.requiredWords,CHANGED[newAnchor]);
    assert.equal(puzzle.contentRevision,REVISION_OF(newAnchor));
    assert.match(puzzle.id,new RegExp(`:${newAnchor}:R${REVISION_OF(newAnchor)}$`));
    assert.deepEqual(validate(puzzle),{valid:true,errors:[]});
    assert.equal(slate.validateComposition(puzzle,game).valid,true,`${newAnchor} meets every composition rule`);
  });
});

test("the three financial-only replacements use approved terms only (no ordinary word) and keep a 3-of-3 financial majority",()=>{
  FINANCIAL_ONLY.forEach(anchor=>{
    const puzzle=PUZZLES.find(item=>item.anchorWord===anchor);
    assert.equal(puzzle.answers.filter(answer=>answer.category==="ordinary").length,0);
    puzzle.requiredWords.forEach(word=>assert.ok(BY_WORD.has(word),`${anchor}: ${word} is one of the 145 approved terms`));
    assert.deepEqual(slate.validateComposition(puzzle,game).counts,{required:3,financial:3,minimumFinancial:2});
  });
});

test("every secondary financial term in the replacements keeps its owner's permanent ID and governed definition",()=>{
  Object.values(REPLACED).forEach(anchor=>{
    const puzzle=PUZZLES.find(item=>item.anchorWord===anchor);
    puzzle.answers.filter(answer=>answer.category.startsWith("financial-")).forEach(answer=>{
      const origin=BY_WORD.get(answer.word);
      assert.equal(answer.termId,origin.id,`${anchor}/${answer.word} identity`);
      assert.equal(answer.definition,origin.definition,`${anchor}/${answer.word} definition`);
      assert.equal(answer.worldId,origin.worldId);
      assert.equal(Boolean(answer.crossWorld),origin.worldId!==puzzle.worldId);
    });
  });
});

test("the five editor-selected ordinary words are exactly the documented list and are not approved financial terms",()=>{
  Object.entries(ORDINARY_CHOICES).forEach(([anchor,word])=>{
    const puzzle=PUZZLES.find(item=>item.anchorWord===anchor);
    const ordinary=puzzle.answers.filter(answer=>answer.category==="ordinary");
    assert.deepEqual(ordinary.map(answer=>answer.word),[word],anchor);
    assert.equal(BY_WORD.has(word),false,`${word} must not be one of the 145 approved terms`);
    assert.ok(/^[A-Z]{3,6}$/.test(word));
    assert.equal(word.length<anchor.length&&(anchor.startsWith(word)),false,`${word} is not a prefix of ${anchor}, so it needs no confirm tap`);
  });
  const everyOrdinary=PUZZLES.flatMap(puzzle=>puzzle.answers.filter(answer=>answer.category==="ordinary").map(answer=>answer.word));
  assert.ok(everyOrdinary.every(word=>!BY_WORD.has(word)),"no ordinary word anywhere is an approved financial term");
});

test("ordinary words pay 1 coin and 0 XP once per world and create no mastery or learning object",()=>{
  Object.entries(ORDINARY_CHOICES).forEach(([anchor,word])=>{
    const puzzle=PUZZLES.find(item=>item.anchorWord===anchor);
    assert.deepEqual(bank.answerReward(puzzle,word,{rewardedOrdinaryWords:[],rewardedSupportWords:[]}),{coins:1,xp:0,isNewSolve:true,category:"ordinary",historyKey:"rewardedOrdinaryWords",termId:null});
    assert.equal(bank.answerReward(puzzle,word,{rewardedOrdinaryWords:[word]}).coins,0);
    const answer=puzzle.answers.find(item=>item.word===word);
    assert.deepEqual([answer.termId,answer.masteryId,answer.definition],[null,null,null]);
    assert.equal(slate.financialLearningTerms([puzzle]).some(term=>term.word===word),false,"no learning object for an ordinary word");
  });
});

test("the four owner-approved Phase 5 compositions sit in the original world slots with new revisions",()=>{
  const slots=[["CHAIN","crypto",4,"CHAIN"],["WALLET","crypto",5,"INCOME"],["ASSET","investing",1,"SAVING"],["GROWTH","investing",3,"GROWTH"]];
  const ordered=world=>slate.SPECS.filter(spec=>spec.worldId===world).map(spec=>spec.anchor);
  assert.deepEqual(ordered("crypto"),["TOKEN","CHAIN","STAKE","INCOME","BLOCK"],"INCOME takes WALLET's slot");
  assert.deepEqual(ordered("investing"),["SAVING","STOCK","GROWTH","TRADE","MARKET","RETURN"],"SAVING takes ASSET's slot");
  const worldCounts=Object.fromEntries(WORLDS.map(worldId=>[worldId,PUZZLES.filter(puzzle=>puzzle.worldId===worldId).length]));
  assert.deepEqual(worldCounts,{moneybasics:5,credit:6,crypto:5,banking:5,investing:6});
  ["CHAIN","INCOME","SAVING","GROWTH"].forEach(anchor=>{
    const puzzle=PUZZLES.find(item=>item.anchorWord===anchor);
    assert.deepEqual(puzzle.requiredWords,CHANGED[anchor]);
    assert.equal(puzzle.contentRevision,2);
    assert.match(puzzle.id,new RegExp(`:${anchor}:R2$`));
    assert.equal(slate.validateComposition(puzzle,game).valid,true);
    assert.deepEqual(validate(puzzle),{valid:true,errors:[]});
  });
  ["WALLET","ASSET"].forEach(anchor=>assert.equal(PUZZLES.find(puzzle=>puzzle.anchorWord===anchor),undefined,`${anchor} is no longer an anchor`));
  assert.equal(PUZZLES.find(puzzle=>puzzle.anchorWord==="SAVING").answers.filter(answer=>answer.category==="ordinary").length,0,"SAVING / GAS / GAIN is financial-only");
});

test("the cross-world ANCHORS keep their original identity, definition and mastery id and carry the crossWorld mark",()=>{
  [["INCOME","crypto","moneybasics"],["SAVING","investing","moneybasics"]].forEach(([anchor,puzzleWorld,origin])=>{
    const puzzle=PUZZLES.find(item=>item.anchorWord===anchor),answer=puzzle.answers.find(item=>item.category==="financial-anchor");
    assert.equal(puzzle.worldId,puzzleWorld);
    assert.equal(answer.worldId,origin);assert.equal(answer.crossWorld,true);
    assert.equal(answer.termId,`${origin}.${anchor.toLowerCase()}`);assert.equal(answer.masteryId,answer.termId);
    assert.equal(puzzle.anchorTermId,answer.termId);
    assert.equal(answer.definition,BY_WORD.get(anchor).definition,"governed definition unchanged");
  });
  assert.deepEqual(slate.financialLearningTerms(PUZZLES.filter(puzzle=>puzzle.anchorWord==="INCOME")).map(term=>[term.id,term.world]).sort(),[["crypto.coin","crypto"],["moneybasics.income","moneybasics"]]);
  assert.throws(()=>slate.buildPuzzle({worldId:"crypto",anchor:"INCOME",secondary:["COIN"],ordinary:["COME"],revision:2},VOCAB.crypto,game,VOCAB),/Missing governed crypto term: INCOME/,"without anchorFrom an off-world anchor is still rejected");
  assert.throws(()=>slate.buildPuzzle({worldId:"crypto",anchor:"INCOME",anchorFrom:"moneybasics",secondary:["COIN"],ordinary:["COME"],revision:2},VOCAB.crypto,game),/requires the moneybasics vocabulary/);
});

test("GAS and GAIN are governed financial terms and stay financial-secondary answers",()=>{
  const saving=PUZZLES.find(puzzle=>puzzle.anchorWord==="SAVING");
  [["GAS","crypto.gas","crypto",true],["GAIN","investing.gain","investing",false]].forEach(([word,id,origin,cross])=>{
    const answer=saving.answers.find(item=>item.word===word);
    assert.equal(answer.category,"financial-secondary");assert.equal(answer.termId,id);assert.equal(answer.worldId,origin);
    assert.equal(Boolean(answer.crossWorld),cross);assert.equal(answer.definition,BY_WORD.get(word).definition);
  });
});

test("the new answers pay their first-discovery reward once in total and never twice across worlds",()=>{
  const save=newSave();
  ["CHAIN","INCOME","SAVING","GROWTH"].forEach(anchor=>{
    const puzzle=PUZZLES.find(item=>item.anchorWord===anchor);
    puzzle.answers.filter(answer=>answer.category.startsWith("financial-")).forEach(answer=>{
      const first=award(save,puzzle,answer.word),again=award(save,puzzle,answer.word);
      assert.equal(first.coins,answer.word.length*7,`${answer.word} first solve`);
      assert.equal(first.xp,Math.round(answer.word.length*1.5));
      assert.equal(again.coins,0,`${answer.word} replay pays nothing`);
    });
  });
  const other=newSave();
  assert.equal(award(other,PUZZLES.find(item=>item.anchorWord==="INCOME"),"COIN").coins,28);
});

test("replacement terms that are shared across puzzles pay their first-discovery reward once in total",()=>{
  const heavy=["PAY","APY","NET","RATE","TERM"];            // each now appears in 2 or more puzzles (NET and APY in 4)
  heavy.forEach(word=>{
    const hosts=PUZZLES.filter(puzzle=>puzzle.requiredWords.includes(word));
    assert.ok(hosts.length>=2,`${word} appears in ${hosts.length} puzzles`);
    const save=newSave(),paid=hosts.map(puzzle=>award(save,puzzle,word).coins);
    assert.equal(paid.filter(coins=>coins>0).length,1,`${word}: ${paid.join("/")}`);
    assert.equal(paid[0],word.length*7);
  });
});

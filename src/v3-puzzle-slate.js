(function(root,factory){const creditIdentities=typeof module==="object"&&module.exports?require("../content/credit-term-identities.js"):root.FINLIT_CREDIT_TERM_IDENTITIES;const supplement=typeof module==="object"&&module.exports?require("../content/v3-supplemental-terms.js"):root.FinLitV3Supplement;const expansion=typeof module==="object"&&module.exports?require("../content/answer-expansion-v1.json"):root.FINLIT_ANSWER_EXPANSION;const newWorld=typeof module==="object"&&module.exports?require("../content/2027-new-world-terms.json"):root.FINLIT_2027_NEW_WORLD_TERMS;const api=factory(creditIdentities,supplement,expansion,newWorld);if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitV3PuzzleSlate=api})(typeof globalThis!=="undefined"?globalThis:this,function(creditIdentities,supplement,expansion,newWorld){
  "use strict";

  const PUZZLE_VERSION=3,CONTENT_REVISION=1;
  const CATEGORY=Object.freeze({ANCHOR:"financial-anchor",SECONDARY:"financial-secondary",ORDINARY:"ordinary",BONUS:"bonus"});
  const WORLD_NAMES=Object.freeze({crypto:"Crypto Foundations",credit:"Credit Foundations",moneybasics:"Money Basics",banking:"Banking Basics",investing:"Investing Basics"});
  // Each spec: the puzzle's world, its approved primary financial anchor, secondary
  // financial terms, and ordinary words. A secondary entry is either a word owned by
  // the puzzle's own world (a string) or an approved term owned by ANOTHER world
  // ({word, from}). Owner decision (2026-10-17): any of the 145 approved financial
  // terms may appear in any world's puzzle; a cross-world term always keeps its
  // ORIGINAL permanent identity, governed definition, and world ownership, and
  // `revision` is bumped to 2 on every puzzle whose composition changed so earlier
  // completion of the old composition is never inherited by the new one.
  const SPECS=Object.freeze([
    {worldId:"crypto",anchor:"TOKEN",secondary:[{word:"NET",from:"moneybasics"}],ordinary:["NOTE"],revision:2},
    {worldId:"crypto",anchor:"CHAIN",secondary:[{word:"ACH",from:"banking"}],ordinary:["CHIN"],revision:2},
    {worldId:"crypto",anchor:"STAKE",secondary:[{word:"ASK",from:"investing"}],ordinary:["TAKE"],revision:2},
    {worldId:"crypto",anchor:"INCOME",anchorFrom:"moneybasics",secondary:["COIN"],ordinary:["COME"],revision:2},
    {worldId:"crypto",anchor:"BLOCK",secondary:["LOCK"],ordinary:["LOB"],revision:3},
    {worldId:"credit",anchor:"TERMS",secondary:["TERM"],ordinary:["REST"]},
    {worldId:"credit",anchor:"PRINCIPAL",secondary:["APR"],ordinary:["PLAIN"],revision:2},
    {worldId:"credit",anchor:"CREDITOR",secondary:["CREDIT",{word:"ORDER",from:"investing"},{word:"REIT",from:"real_estate"}],ordinary:["DIRECT"],revision:2},
    {worldId:"credit",anchor:"REPAYMENT",secondary:["TERM","APR","APY",{word:"PEER",from:"crypto"},{word:"PAYMENT",from:"moneybasics"},{word:"EARN",from:"moneybasics"},{word:"RATE",from:"moneybasics"},{word:"PAY",from:"moneybasics"},{word:"NET",from:"moneybasics"},{word:"RENT",from:"real_estate"},{word:"ATM",from:"banking"}],ordinary:[]},
    {worldId:"credit",anchor:"AUTOPAY",secondary:["APY",{word:"PAY",from:"moneybasics"}],ordinary:["AUTO"]},
    {worldId:"credit",anchor:"CAPACITY",secondary:["APY",{word:"PAY",from:"moneybasics"}],ordinary:["CITY"]},
    {worldId:"moneybasics",anchor:"PAYMENT",secondary:["PAY","NET",{word:"APY",from:"credit"},{word:"ATM",from:"banking"}],ordinary:[]},
    {worldId:"moneybasics",anchor:"RECEIPT",secondary:["PRICE",{word:"PEER",from:"crypto"},{word:"REIT",from:"real_estate"}],ordinary:["PIECE"],revision:2},
    {worldId:"moneybasics",anchor:"REFUND",secondary:["FUND"],ordinary:["RUN"]},
    {worldId:"moneybasics",anchor:"PAYCHECK",secondary:["PAY",{word:"APY",from:"credit"},{word:"ACH",from:"banking"}],ordinary:["CHECK"]},
    {worldId:"moneybasics",anchor:"BUDGET",secondary:[{word:"DEBT",from:"credit"}],ordinary:["BED"],revision:2},
    {worldId:"banking",anchor:"DEPOSITOR",secondary:["POSTED",{word:"DEPOSIT",from:"moneybasics"},{word:"REPO",from:"investing"},{word:"REIT",from:"real_estate"}],ordinary:["POST"]},
    {worldId:"banking",anchor:"NETWORK",secondary:[{word:"OWNER",from:"investing"},{word:"TOKEN",from:"crypto"},{word:"NET",from:"moneybasics"},{word:"RENT",from:"real_estate"}],ordinary:["WORK"],revision:2},
    {worldId:"banking",anchor:"PASSWORD",secondary:[{word:"SWAP",from:"crypto"},{word:"APR",from:"credit"}],ordinary:["PASS"],revision:2},
    {worldId:"banking",anchor:"PASSKEY",secondary:[{word:"PAY",from:"moneybasics"},{word:"APY",from:"credit"},{word:"ASK",from:"investing"}],ordinary:[],revision:2},
    {worldId:"banking",anchor:"CONVERT",secondary:[{word:"NET",from:"moneybasics"},{word:"VOTE",from:"investing"},{word:"RENT",from:"real_estate"}],ordinary:[],revision:2},
    {worldId:"investing",anchor:"SAVING",anchorFrom:"moneybasics",secondary:[{word:"GAS",from:"crypto"},"GAIN"],ordinary:[],revision:2},
    {worldId:"investing",anchor:"STOCK",secondary:[{word:"COST",from:"moneybasics"}],ordinary:["SOCK"],revision:2},
    {worldId:"investing",anchor:"GROWTH",secondary:["WORTH"],ordinary:["ROW"],revision:2},
    {worldId:"investing",anchor:"TRADE",secondary:[{word:"RATE",from:"moneybasics"}],ordinary:["READ"],revision:2},
    {worldId:"investing",anchor:"MARKET",secondary:[{word:"RATE",from:"moneybasics"},{word:"TERM",from:"credit"},{word:"ATM",from:"banking"}],ordinary:[],revision:2},
    {worldId:"investing",anchor:"RETURN",secondary:[{word:"NET",from:"moneybasics"},{word:"RENT",from:"real_estate"}],ordinary:["TUNE"],revision:2},
  ]);

  function normalizeWord(word){return String(word||"").trim().toUpperCase()}
  function stableTermId(worldId,term){
    if(worldId==="credit"){
      if(!creditIdentities)throw new Error("Credit identity registry is unavailable");
      return creditIdentities.resolveTerm(term);
    }
    if(term&&(term.termId||term.id))return term.termId||term.id;
    return `${worldId}.${normalizeWord(term&&term.word).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`;
  }
  function puzzleId(worldId,anchor,revision=CONTENT_REVISION){return `FQ-V3:${worldId}:${anchor}:R${revision}`}
  // originWorldId owns the term: its permanent identity, governed definition, and
  // mastery record come from that world's vocabulary, never from the puzzle's world.
  function financialAnswer(word,category,puzzleWorldId,originWorldId,byWord){
    const term=byWord.get(word);
    if(!term)throw new Error(`Missing governed ${originWorldId} term: ${word}`);
    const termId=stableTermId(originWorldId,term);
    const answer={word,category,termId,masteryId:termId,definition:String(term.definition||""),worldId:originWorldId,rewardPolicy:"financial-first-solve"};
    if(originWorldId!==puzzleWorldId)answer.crossWorld=true;
    return answer;
  }
  function secondaryEntry(entry){return typeof entry==="string"?{word:entry,from:null}:{word:entry.word,from:entry.from||null}}
  // The owner-approved V3 supplement (ACH, WORTH) is appended to a world's governed vocabulary here, so every caller sees it.
  // Approved 2027 terms owned by a world (for example REPO, owned by Investing) live in the 2027 term file, not in that world's
  // original vocabulary. The exhaustive-answer rule can place them in any puzzle whose wheel spells them, so they are resolvable
  // here with their own permanent ID and governed definition. Words the world's vocabulary already has are never overridden.
  function withNewWorldTerms(worldId,vocabulary){
    const have=new Set((vocabulary||[]).map(term=>normalizeWord(term.word)));
    const extra=((newWorld&&newWorld.terms)||[]).filter(term=>term.worldId===worldId&&!have.has(normalizeWord(term.word))).map(term=>({word:term.word,definition:term.definition,termId:term.id}));
    return extra.length?[...(vocabulary||[]),...extra]:(vocabulary||[]);
  }
  function withSupplement(worldId,vocabulary){return withNewWorldTerms(worldId,supplement?supplement.merge({[worldId]:vocabulary||[]})[worldId]:(vocabulary||[]))}
  function vocabularyIndex(vocabulary,worldId){return new Map((worldId?withSupplement(worldId,vocabulary):(vocabulary||[])).map(term=>[normalizeWord(term.word),term]))}
  function ordinaryAnswer(word,worldId){return {word,category:CATEGORY.ORDINARY,termId:null,masteryId:null,definition:null,worldId,rewardPolicy:"ordinary-first-solve"}}
  function buildPuzzle(spec,vocabulary,game,allVocabularies){
    const own=vocabularyIndex(vocabulary,spec.worldId);
    const secondary=spec.secondary.map(entry=>{
      const {word,from}=secondaryEntry(entry);
      if(!from||from===spec.worldId)return financialAnswer(word,CATEGORY.SECONDARY,spec.worldId,spec.worldId,own);
      // A world whose terms all come from the 2027 term file (no separate vocabulary list) resolves from that file.
      const owned=(allVocabularies&&allVocabularies[from])||(withNewWorldTerms(from,[]).length?[]:null);
      if(!owned)throw new Error(`Cross-world term ${word} in ${spec.anchor} requires the ${from} vocabulary`);
      if(from==="credit"&&!creditIdentities)throw new Error("Credit identity registry is unavailable");
      return financialAnswer(word,CATEGORY.SECONDARY,spec.worldId,from,vocabularyIndex(owned,from));
    });
    // Cross-world anchor exception (owner-approved 2026-10-16, FLQ-V3-CROSS-WORLD-ANCHOR-001): an approved term owned by
    // another world may anchor a puzzle in this slot. It keeps its own permanent ID, governed definition and mastery identity.
    const anchorFrom=spec.anchorFrom&&spec.anchorFrom!==spec.worldId?spec.anchorFrom:null;
    if(anchorFrom&&(!allVocabularies||!allVocabularies[anchorFrom]))throw new Error(`Cross-world anchor ${spec.anchor} requires the ${anchorFrom} vocabulary`);
    if(anchorFrom==="credit"&&!creditIdentities)throw new Error("Credit identity registry is unavailable");
    const answers=[financialAnswer(spec.anchor,CATEGORY.ANCHOR,spec.worldId,anchorFrom||spec.worldId,anchorFrom?vocabularyIndex(allVocabularies[anchorFrom],anchorFrom):own),...secondary,...spec.ordinary.map(word=>ordinaryAnswer(word,spec.worldId))];
    const requiredWords=answers.map(answer=>answer.word),id=puzzleId(spec.worldId,spec.anchor,spec.revision||CONTENT_REVISION);
    // Expanded puzzles use the compact layout stored in the answer-expansion manifest (the search is slow, so it is done once at build time);
    // if the stored layout does not match the answers it is ignored and a compact layout is searched instead. Unexpanded puzzles keep the original solver.
    const stored=expansion&&expansion.puzzles&&expansion.puzzles[id],storedFits=stored&&stored.requiredWords.length===requiredWords.length&&requiredWords.every(word=>stored.requiredWords.includes(word))&&game.validateCrosswordLayout(requiredWords,stored.layout).valid;
    const layout=storedFits?{ok:true,placements:stored.layout}:(requiredWords.length>5&&game.solveCompactCrossword?game.solveCompactCrossword(requiredWords):game.solveCrossword(requiredWords,{maxNodes:250000,maxSolutions:1000}));
    if(!layout.ok)throw new Error(`Reviewed V3 puzzle ${spec.anchor} no longer lays out: ${layout.reason}`);
    const validation=game.validateCrosswordLayout(requiredWords,layout.placements);
    if(!validation.valid)throw new Error(`Reviewed V3 puzzle ${spec.anchor} failed boundaries: ${validation.errors.join(",")}`);
    return {
      id,worldId:spec.worldId,worldName:WORLD_NAMES[spec.worldId],puzzleVersion:PUZZLE_VERSION,
      puzzleMode:"v3",contentRevision:spec.revision||CONTENT_REVISION,contentStatus:"development-review",sourceReviewId:`REVIEW:${spec.worldId}:${spec.anchor}`,
      anchorWord:spec.anchor,anchorTermId:answers[0].termId,wheelLetters:[...spec.anchor],answers,bonusWords:[],requiredWords,
      layout:layout.placements.map(item=>({...item})),rewardPolicy:{financial:{coinsPerLetter:7,xpPerLetter:1.5,roundXp:true},ordinary:{coinsPerWord:1,xp:0},bonus:{coins:0,xp:0}},
    };
  }
  // allVocabularies (worldId -> vocabulary) is required only for specs that use an
  // approved term owned by another world.
  function createWorldSlate(worldId,vocabulary,game,allVocabularies){
    if(worldId==="credit"){
      if(!creditIdentities)throw new Error("Credit identity registry is unavailable");
      creditIdentities.validateVocabulary(vocabulary);
    }
    return SPECS.filter(spec=>spec.worldId===worldId).map(spec=>buildPuzzle(spec,vocabulary,game,allVocabularies));
  }
  function createSlate(vocabularies,game){
    if(!creditIdentities)throw new Error("Credit identity registry is unavailable");
    creditIdentities.validateVocabulary(vocabularies.credit||[]);
    return SPECS.map(spec=>buildPuzzle(spec,vocabularies[spec.worldId]||[],game,vocabularies));
  }
  // Approved V3 composition rules (owner requirements). Required words are every
  // non-bonus answer. Financial = the primary anchor plus approved secondary
  // financial terms; ordinary words never count toward the majority.
  //   3 required words -> at least 2 financial
  //   4 required words -> at least 3 financial
  //   5 required words -> at least 3 financial
  // Plus: 3-5 required words (no single-word puzzles), at least one primary
  // financial anchor, at least two additional required words, a wheel that is
  // exactly the anchor's letters (repeated-letter counts included) from which
  // every required word can be spelled, and, when a game engine is supplied, a
  // connected crossword with legal intersections and boundaries.
  const FINANCIAL_MINIMUM_BY_REQUIRED_WORDS=Object.freeze({3:2,4:3,5:3});
  // Answer count is not capped editorially: the exhaustive-answer rule decides how many answers a puzzle has. MAX_REQUIRED_ANSWERS is only a
  // layout-feasibility ceiling (the largest expanded puzzle has 14 answers); above 5 answers at least three must be financial.
  const MIN_REQUIRED_ANSWERS=3,MAX_REQUIRED_ANSWERS=20;
  const financialMinimum=count=>FINANCIAL_MINIMUM_BY_REQUIRED_WORDS[count]!==undefined?FINANCIAL_MINIMUM_BY_REQUIRED_WORDS[count]:(count>5&&count<=MAX_REQUIRED_ANSWERS?3:null);
  function letterCounts(word){return [...String(word)].reduce((counts,letter)=>({...counts,[letter]:(counts[letter]||0)+1}),{})}
  function validateComposition(puzzle,game){
    const errors=[],answers=(puzzle&&puzzle.answers)||[],required=answers.filter(answer=>answer.category!==CATEGORY.BONUS);
    const words=required.map(answer=>answer.word),count=words.length;
    const anchors=required.filter(answer=>answer.category===CATEGORY.ANCHOR);
    const financial=required.filter(answer=>answer.category===CATEGORY.ANCHOR||answer.category===CATEGORY.SECONDARY).length;
    const minimumFinancial=financialMinimum(count);
    if(count<MIN_REQUIRED_ANSWERS||count>MAX_REQUIRED_ANSWERS)errors.push(`requires ${MIN_REQUIRED_ANSWERS}-${MAX_REQUIRED_ANSWERS} required words (has ${count})`);
    if(anchors.length<1)errors.push("requires at least one approved primary financial term");
    if(count-Math.min(anchors.length,1)<2)errors.push("requires at least two additional required words");
    if(minimumFinancial!==null&&financial<minimumFinancial)errors.push(`financial majority not met: ${financial} of ${count} required words are financial, minimum is ${minimumFinancial}`);
    const anchorWord=puzzle&&puzzle.anchorWord,wheel=((puzzle&&puzzle.wheelLetters)||[]).join("");
    if(!anchorWord||[...anchorWord].sort().join("")!==[...wheel].sort().join(""))errors.push("wheel must contain exactly the anchor's letters, including repeated-letter counts");
    const available=letterCounts(wheel);
    words.forEach(word=>{if(!Object.entries(letterCounts(word)).every(([letter,total])=>(available[letter]||0)>=total))errors.push(`${word} cannot be spelled from the wheel`)});
    if(game){
      const layout=puzzle.layout||[],placed=new Set(layout.map(item=>item.word));
      if(words.some(word=>!placed.has(word)))errors.push("every required word must appear in the crossword");
      const validation=game.validateCrosswordLayout(words,layout);
      if(!validation.valid)errors.push(`crossword layout invalid: ${validation.errors.join(",")}`);
    }
    return {valid:errors.length===0,errors,counts:{required:count,financial,minimumFinancial}};
  }
  function financialLearningTerms(puzzles){
    const seen=new Set(),terms=[];
    for(const puzzle of puzzles||[])for(const answer of puzzle.answers||[])if((answer.category===CATEGORY.ANCHOR||answer.category===CATEGORY.SECONDARY)&&!seen.has(answer.termId)){
      seen.add(answer.termId);terms.push({id:answer.termId,world:answer.worldId,category:"financial-term",difficulty:"Foundation",word:answer.word,normalizedWord:answer.word.toLowerCase(),definition:answer.definition,pronunciation:"",realLifeExample:"",didYouKnow:"",commonMistake:"",relatedTermIds:[],quickChallenge:{prompt:"",options:[],correctIndex:0,explanation:""},xpValue:0,reviewWeight:1});
    }
    return terms;
  }
  return {PUZZLE_VERSION,CONTENT_REVISION,CATEGORY,WORLD_NAMES,SPECS,FINANCIAL_MINIMUM_BY_REQUIRED_WORDS,MIN_REQUIRED_ANSWERS,MAX_REQUIRED_ANSWERS,stableTermId,puzzleId,buildPuzzle,createWorldSlate,createSlate,validateComposition,financialLearningTerms};
});

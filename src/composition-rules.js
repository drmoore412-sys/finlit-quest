(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitCompositionRules=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Composition rule v2 (unified levels). v1 (missing version) is frozen in puzzle-validator.js.
  // MAX_ANSWERS is a layout-feasibility ceiling, not an editorial limit: the exhaustive-answer rule (2026-11-18) requires every approved spellable financial term, so unified puzzles may have up to 14 answers (largest today: 13).
  const RULE_VERSION="v2",MIN_ANSWERS=5,MAX_ANSWERS=20,MAX_FILLERS=4,MIN_SUBSTANTIVE_KEYS=3,MAX_EXTRA_LETTERS=2;
  const LABELS=new Set(["direct","contextual","incidental"]);
  const CATEGORIES=new Set(["financial-anchor","financial-secondary","ordinary","bonus"]);
  // Words owner-rejected as fillers (checkpoint 4). Hard-blocked regardless of whitelist content.
  const EXCLUDED_FILLERS=Object.freeze(["PAT","TOY","NOTE","TEEN","PAIN","DIET","TOP","PUT","SINCE","CODE","DATA","LEVEL","WORD"]);
  const isPlain=value=>Object.prototype.toString.call(value)==="[object Object]";
  const text=value=>typeof value==="string"&&value.trim().length>=12;

  function prefixPairs(words){const pairs=[];words.forEach(a=>words.forEach(b=>{if(a!==b&&b.startsWith(a))pairs.push([a,b])}));return pairs}

  // One engine, two versions. v2 is byte-for-byte the previous behaviour; v3 only changes the wheel-inventory check.
  function validatePuzzle(puzzle,deps={},version="v2"){
    const {canFormFn,validateCrosswordLayoutFn,fillerWhitelist=null,release=false,existingIds=new Set(),wheelBudget=9}=deps,errors=[];
    const answers=Array.isArray(puzzle&&puzzle.answers)?puzzle.answers:[],required=answers.filter(a=>a&&a.category!=="bonus");
    const words=required.map(a=>a.word),letters=(puzzle&&puzzle.wheelLetters)||[];
    if(!puzzle||puzzle.compositionRuleVersion!==version)errors.push("compositionRuleVersion");
    if(!puzzle||!puzzle.id||!Number.isInteger(puzzle.contentRevision)||puzzle.contentRevision<1)errors.push("stableRevisionIdentity");
    if(puzzle&&existingIds.has(puzzle.id))errors.push("noDuplicateId");
    if(answers.some(a=>!a||!a.word||!CATEGORIES.has(a.category)))errors.push("answerCategoriesValid");
    const anchors=answers.filter(a=>a&&a.category==="financial-anchor");
    if(anchors.length!==1||anchors[0].word!==puzzle.anchorWord||anchors[0].termId!==puzzle.anchorTermId)errors.push("singleFinancialAnchor");
    if(required.length<MIN_ANSWERS||required.length>MAX_ANSWERS||new Set(words).size!==words.length)errors.push("requiredAnswerCount");
    const keys=required.filter(a=>a&&String(a.category).startsWith("financial-")),fillers=required.filter(a=>a&&a.category==="ordinary");
    if(keys.some(a=>!a.termId||!a.masteryId||!String(a.definition||"").trim()))errors.push("keyTermIdentity");
    if(fillers.length>MAX_FILLERS)errors.push("fillerCountLimit");
    // relevance: anchor + >=2 substantive supports, >=1 direct, second direct or strong contextual
    const relevance=isPlain(puzzle&&puzzle.supportRelevance)?puzzle.supportRelevance:{};
    const supports=keys.filter(a=>a.category!=="financial-anchor"),labeled=supports.map(a=>({word:a.word,record:relevance[a.word]}));
    if(labeled.some(item=>!isPlain(item.record)||!LABELS.has(item.record.label)))errors.push("relevanceLabelMissing");
    if(labeled.some(item=>isPlain(item.record)&&(item.record.label==="direct"||item.record.label==="contextual")&&!text(item.record.explanation)))errors.push("relevanceExplanation");
    const good=labeled.filter(item=>isPlain(item.record)&&(item.record.label==="direct"||item.record.label==="contextual"));
    const direct=good.filter(item=>item.record.label==="direct");
    if(1+good.length<MIN_SUBSTANTIVE_KEYS)errors.push("threeSubstantiveKeyTerms");
    if(!direct.length)errors.push("directSupportRequired");
    else if(!good.some(item=>item!==direct[0]&&(item.record.label==="direct"||item.record.strong===true)))errors.push("secondSupportDirectOrStrongContextual");
    // fillers: explicit ordinary answers from the owner whitelist
    fillers.forEach(a=>{
      if(a.termId||a.masteryId||a.definition||a.rewardPolicy!=="ordinary-first-solve")errors.push("ordinaryMetadataIsolated");
      if(EXCLUDED_FILLERS.includes(a.word))errors.push("fillerExcluded");
      const entry=fillerWhitelist&&Array.isArray(fillerWhitelist.entries)?fillerWhitelist.entries.find(e=>e.fillerId===a.fillerId):null;
      if(!entry||entry.word!==a.word||entry.status==="rejected")errors.push("fillerNotWhitelisted");
      else{
        if(!(Array.isArray(entry.approvedInPuzzles)&&(entry.approvedInPuzzles.includes(puzzle.anchorWord)||entry.approvedInPuzzles.includes(puzzle.id))))errors.push("fillerNotApprovedForPuzzle");
        if(release&&entry.productionApproved!==true)errors.push("fillerNotProductionApproved");
      }
    });
    // exact wheel inventory, nine-letter cap, every answer formable
    if(version==="v3"){
      // v3: wheel = anchor letters + up to two declared extra letters, at most wheelBudget (9) letters; every extra is used by a required answer.
      const extras=Array.isArray(puzzle&&puzzle.declaredExtraLetters)?puzzle.declaredExtraLetters:[];
      if(!Array.isArray(puzzle&&puzzle.declaredExtraLetters)||extras.some(l=>typeof l!=="string"||!/^[A-Z]$/.test(l)))errors.push("declaredExtraLettersInvalid");
      else{
        if(extras.length>MAX_EXTRA_LETTERS)errors.push("extraLetterLimit");
        const expectedV3=[...(puzzle.anchorWord||""),...extras].sort(),actualV3=[...letters].sort();
        if(!expectedV3.length||expectedV3.length!==actualV3.length||expectedV3.some((l,i)=>l!==actualV3[i])||letters.length>wheelBudget)errors.push("anchorWheelInventory");
        if(extras.some(l=>!required.some(a=>a.word.includes(l))))errors.push("extraLetterUnused");
      }
    }else{
    const expected=[...(puzzle&&puzzle.anchorWord||"")].sort(),actual=[...letters].sort();
    if(!expected.length||expected.length!==actual.length||expected.some((l,i)=>l!==actual[i])||letters.length>wheelBudget)errors.push("anchorWheelInventory");
    }
    if(!canFormFn||required.some(a=>a.word.length>puzzle.anchorWord.length||!canFormFn(a.word,letters)))errors.push("requiredWordsFitAnchorWheel");
    if(!Array.isArray(puzzle&&puzzle.layout)||!validateCrosswordLayoutFn||!validateCrosswordLayoutFn(words,puzzle.layout).valid)errors.push("strictCrosswordLayout");
    // prefix pairs need a recorded justification, interaction support and a test reference
    const just=Array.isArray(puzzle&&puzzle.prefixJustifications)?puzzle.prefixJustifications:[];
    prefixPairs(words).forEach(([shorter,longer])=>{
      const found=just.find(item=>isPlain(item)&&item.shorter===shorter&&item.longer===longer);
      if(!found||!text(found.justification)||found.interactionSupport!==true||!found.testId)errors.push("prefixPairUnjustified");
    });
    const policy=(puzzle&&puzzle.rewardPolicy)||{};
    if(!policy.financial||!policy.ordinary||!policy.bonus||policy.financial.coinsPerLetter!==7||policy.financial.xpPerLetter!==1.5||policy.financial.roundXp!==true||policy.ordinary.coinsPerWord!==1||policy.ordinary.xp!==0||policy.bonus.coins!==0||policy.bonus.xp!==0)errors.push("rewardPolicyValid");
    return {valid:errors.length===0,errors:[...new Set(errors)]};
  }
  const validateV2Puzzle=(puzzle,deps)=>validatePuzzle(puzzle,deps,"v2"),validateV3Puzzle=(puzzle,deps)=>validatePuzzle(puzzle,deps,"v3");

  // Composition rule v4 (exact-wheel puzzles, owner-approved 2026-11-18). v1, v2 and v3 above are unchanged and stay valid for historical records.
  //  - The wheel is exactly the letters of the financial key term (repeated letters included): no extra letters, no exceptions.
  //  - One required financial answer is enough (the key term itself). There is no answer-count minimum, no three-substantive-term minimum
  //    and no direct-support requirement.
  //  - Every approved financial term the wheel can spell is a required answer (exhaustive-answer rule). That needs the approved-term
  //    dictionary, so it is enforced whenever deps.dictionary and deps.missingAnswersFn are supplied (build, tests and release validation).
  //  - Filler words are not part of v4: nothing is added to reach an answer count.
  const RULE_VERSION_V4="v4",MIN_ANSWERS_V4=1;
  function validateV4Puzzle(puzzle,deps={}){
    const {canFormFn,validateCrosswordLayoutFn,existingIds=new Set(),wheelBudget=9,dictionary=null,missingAnswersFn=null}=deps,errors=[];
    const answers=Array.isArray(puzzle&&puzzle.answers)?puzzle.answers:[],required=answers.filter(a=>a&&a.category!=="bonus");
    const words=required.map(a=>a&&a.word),letters=(puzzle&&puzzle.wheelLetters)||[];
    if(!puzzle||puzzle.compositionRuleVersion!==RULE_VERSION_V4)errors.push("compositionRuleVersion");
    if(!puzzle||!puzzle.id||!Number.isInteger(puzzle.contentRevision)||puzzle.contentRevision<1)errors.push("stableRevisionIdentity");
    if(puzzle&&existingIds.has(puzzle.id))errors.push("noDuplicateId");
    if(answers.some(a=>!a||!a.word||!CATEGORIES.has(a.category)))errors.push("answerCategoriesValid");
    const anchors=answers.filter(a=>a&&a.category==="financial-anchor");
    if(anchors.length!==1||anchors[0].word!==puzzle.anchorWord||anchors[0].termId!==puzzle.anchorTermId)errors.push("singleFinancialAnchor");
    if(required.length<MIN_ANSWERS_V4||required.length>MAX_ANSWERS||new Set(words).size!==words.length)errors.push("requiredAnswerCount");
    if(required.some(a=>!a||!String(a.category).startsWith("financial-")))errors.push("onlyFinancialAnswers");
    if(required.some(a=>a&&String(a.category).startsWith("financial-")&&(!a.termId||!a.masteryId||!String(a.definition||"").trim())))errors.push("keyTermIdentity");
    const relevance=isPlain(puzzle&&puzzle.supportRelevance)?puzzle.supportRelevance:{};
    required.filter(a=>a&&a.category==="financial-secondary").forEach(a=>{
      const record=relevance[a.word];
      if(!isPlain(record)||!LABELS.has(record.label))errors.push("relevanceLabelMissing");
      else if(!text(record.explanation))errors.push("relevanceExplanation");
    });
    // exact wheel: sorted wheel letters equal sorted key-term letters, no declared extras, at most wheelBudget letters
    const expected=[...(puzzle&&puzzle.anchorWord||"")].sort(),actual=[...letters].sort();
    if(!expected.length||expected.length!==actual.length||expected.some((l,i)=>l!==actual[i])||letters.length>wheelBudget)errors.push("anchorWheelInventory");
    if(puzzle&&puzzle.declaredExtraLetters!==undefined&&!(Array.isArray(puzzle.declaredExtraLetters)&&puzzle.declaredExtraLetters.length===0))errors.push("extraLettersForbidden");
    if(!canFormFn||required.some(a=>!a||!a.word||a.word.length>puzzle.anchorWord.length||!canFormFn(a.word,letters)))errors.push("requiredWordsFitAnchorWheel");
    if(!Array.isArray(puzzle&&puzzle.layout)||!validateCrosswordLayoutFn||!validateCrosswordLayoutFn(words,puzzle.layout).valid)errors.push("strictCrosswordLayout");
    const just=Array.isArray(puzzle&&puzzle.prefixJustifications)?puzzle.prefixJustifications:[];
    prefixPairs(words).forEach(([shorter,longer])=>{
      const found=just.find(item=>isPlain(item)&&item.shorter===shorter&&item.longer===longer);
      if(!found||!text(found.justification)||found.interactionSupport!==true||!found.testId)errors.push("prefixPairUnjustified");
    });
    const policy=(puzzle&&puzzle.rewardPolicy)||{};
    if(!policy.financial||!policy.ordinary||!policy.bonus||policy.financial.coinsPerLetter!==7||policy.financial.xpPerLetter!==1.5||policy.financial.roundXp!==true||policy.ordinary.coinsPerWord!==1||policy.ordinary.xp!==0||policy.bonus.coins!==0||policy.bonus.xp!==0)errors.push("rewardPolicyValid");
    if(dictionary&&typeof missingAnswersFn==="function"&&missingAnswersFn(puzzle,dictionary).length)errors.push("exhaustiveFinancialAnswers");
    return {valid:errors.length===0,errors:[...new Set(errors)]};
  }
  const VALIDATORS={v2:validateV2Puzzle,v3:validateV3Puzzle,v4:validateV4Puzzle};
  const validatorFor=version=>VALIDATORS[version]||null;
  return {RULE_VERSION,RULE_VERSION_V3:"v3",RULE_VERSION_V4,MIN_ANSWERS,MIN_ANSWERS_V4,MAX_ANSWERS,MAX_FILLERS,MAX_EXTRA_LETTERS,EXCLUDED_FILLERS,prefixPairs,validateV2Puzzle,validateV3Puzzle,validateV4Puzzle,validatorFor};
});

(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitPuzzleValidator=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const DIFFICULTIES=new Set(["Easy","Medium","Hard","Expert"]);
  const PUZZLE_MODES=new Set(["multi-term","single-term","expanded","anchor-only","v3"]);
  const V3_CATEGORIES=new Set(["financial-anchor","financial-secondary","ordinary","bonus"]);
  // All governed worlds. A financial answer owned by a different world is allowed only when it is explicitly marked crossWorld and carries that world's own permanent identity.
  const V3_WORLDS=new Set(["crypto","credit","moneybasics","banking","investing","coins","ai_technology","real_estate","taxes","insurance","business","social_media","retirement"]);

  function validateV3Puzzle(puzzle,deps={}){
    const {canFormFn,validateCrosswordLayoutFn,existingIds=new Set(),wheelBudget=9}=deps,errors=[];
    const answers=Array.isArray(puzzle?.answers)?puzzle.answers:[],required=answers.filter(answer=>answer.category!=="bonus"),bonus=answers.filter(answer=>answer.category==="bonus");
    const anchors=answers.filter(answer=>answer.category==="financial-anchor"),words=required.map(answer=>answer.word),letters=puzzle?.wheelLetters||[];
    if(puzzle?.puzzleVersion!==3||puzzle?.puzzleMode!=="v3")errors.push("v3VersionAndMode");
    if(!puzzle?.id||!Number.isInteger(puzzle?.contentRevision)||puzzle.contentRevision<1)errors.push("stableRevisionIdentity");
    if(existingIds.has(puzzle?.id))errors.push("noDuplicateId");
    if(anchors.length!==1||anchors[0]?.word!==puzzle?.anchorWord||anchors[0]?.termId!==puzzle?.anchorTermId)errors.push("singleFinancialAnchor");
    if(required.length<3||required.length>5||new Set(words).size!==words.length)errors.push("requiredAnswerCount");
    if(answers.some(answer=>!answer?.word||!V3_CATEGORIES.has(answer.category)))errors.push("answerCategoriesValid");
    if(answers.some(answer=>answer.category.startsWith("financial-")&&(!answer.termId||!answer.masteryId||!String(answer.definition||"").trim()||(answer.crossWorld===true?(answer.worldId===puzzle.worldId||!V3_WORLDS.has(answer.worldId)||!String(answer.termId).startsWith(`${answer.worldId}.`)):answer.worldId!==puzzle.worldId)||answer.rewardPolicy!=="financial-first-solve")))errors.push("financialMetadataComplete");
    if(answers.some(answer=>answer.category==="ordinary"&&(answer.termId||answer.masteryId||answer.definition||answer.rewardPolicy!=="ordinary-first-solve")))errors.push("ordinaryMetadataIsolated");
    if(bonus.some(answer=>words.includes(answer.word)))errors.push("bonusNotRequired");
    const expected=[...(puzzle?.anchorWord||"")].sort(),actual=[...letters].sort();
    if(expected.length!==actual.length||expected.some((letter,index)=>letter!==actual[index])||letters.length>wheelBudget)errors.push("anchorWheelInventory");
    if(!canFormFn||required.some(answer=>answer.word.length>puzzle.anchorWord.length||!canFormFn(answer.word,letters)))errors.push("requiredWordsFitAnchorWheel");
    if(!Array.isArray(puzzle?.layout)||!validateCrosswordLayoutFn||!validateCrosswordLayoutFn(words,puzzle.layout).valid)errors.push("strictCrosswordLayout");
    const policy=puzzle?.rewardPolicy||{};
    if(policy.financial?.coinsPerLetter!==7||policy.financial?.xpPerLetter!==1.5||policy.financial?.roundXp!==true||policy.ordinary?.coinsPerWord!==1||policy.ordinary?.xp!==0||policy.bonus?.coins!==0||policy.bonus?.xp!==0)errors.push("rewardPolicyValid");
    return {valid:errors.length===0,errors:[...new Set(errors)]};
  }

  // wordCountInRange is puzzleMode-aware: a "single-term" puzzle is legitimate
  // at exactly 1 required word (see docs/CRF_EARLY_LESSON_ELIGIBILITY_INVESTIGATION.md
  // — CREDIT/TERMS/ACCOUNT pass every other check standalone). Anything else
  // (including the default "multi-term" and legacy records with no mode set)
  // keeps the original [2,5] rule unchanged — this does not weaken multi-term
  // validation, it only legitimizes a separately-flagged puzzle shape.
  function checkWordCount(requiredWords,puzzleMode,wordCountRange){
    const count=(requiredWords||[]).length;
    if(puzzleMode==="single-term")return count===1;
    const [minWords,maxWords]=wordCountRange;
    return count>=minWords&&count<=maxWords;
  }

  // Named checks against a fully-formed puzzle record (post difficulty/hint).
  // Returns {valid, errors[]} with one entry per failed check name so callers
  // (bank-building retry loops, CLI validate command) get a real reason, not a
  // silent discard.
  function validatePuzzle(puzzle,deps){
    if(Number(puzzle?.puzzleVersion)===3||puzzle?.puzzleMode==="v3")return validateV3Puzzle(puzzle,deps);
    const {canFormFn,layoutWordsFn,solveCrosswordFn,existingIds=new Set(),wordCountRange=[2,5],expandedWordCountRange=[2,9],wheelBudget=9}=deps||{};
    const errors=[];
    const expanded=Number(puzzle.puzzleVersion)>=2||puzzle.puzzleMode==="expanded";
    const requiredWords=expanded?[puzzle.anchorWord,...(puzzle.supportWords||[])].filter(Boolean):(puzzle.requiredWords||[]);
    const bonusWords=puzzle.bonusWords||[];
    const letters=expanded?(puzzle.wheelLetters||[]):(puzzle.letters||[]);

    if(expanded){
      if(!Number.isInteger(puzzle.puzzleVersion)||puzzle.puzzleVersion<2)errors.push("expandedPuzzleVersion");
      if(!puzzle.anchorWord||requiredWords[0]!==puzzle.anchorWord)errors.push("anchorWordExists");
      if(!Array.isArray(puzzle.supportWords)||(puzzle.puzzleMode!=="anchor-only"&&!puzzle.supportWords.length))errors.push("supportWordsPresent");
      if(new Set([...requiredWords,...bonusWords]).size!==requiredWords.length+bonusWords.length)errors.push("wordCategoriesDisjoint");
      if(!String(puzzle.financialDefinition||"").trim())errors.push("financialDefinitionPresent");
      if(!puzzle.wordCategories||puzzle.wordCategories[puzzle.anchorWord]!=="financial"||puzzle.supportWords.some(word=>puzzle.wordCategories[word]!=="support")||bonusWords.some(word=>puzzle.wordCategories[word]!=="bonus"))errors.push("wordCategoriesValid");
      const policy=puzzle.rewardPolicy||{};
      if(policy.financial!=="existing-first-solve"||policy.support?.coins!==1||policy.support?.xp!==0||policy.bonus?.coins!==0||policy.bonus?.xp!==0)errors.push("rewardPolicyValid");
      const expected=[...puzzle.anchorWord].sort(),actual=[...letters].sort();
      if(expected.length!==actual.length||expected.some((letter,index)=>letter!==actual[index]))errors.push("anchorWheelInventory");
      if((puzzle.supportWords||[]).some(word=>word.length>puzzle.anchorWord.length||!canFormFn(word,[...puzzle.anchorWord])))errors.push("supportWordsFitAnchorWheel");
      const solved=solveCrosswordFn?solveCrosswordFn(requiredWords):null;
      if(!solved||!solved.ok)errors.push("strictCrosswordPlaceable");
      if(puzzle.puzzleMode==="anchor-only"?requiredWords.length!==1:!checkWordCount(requiredWords,"multi-term",expandedWordCountRange))errors.push("wordCountInRange");
    }

    if(!expanded&&(!puzzle.focusWord||!requiredWords.includes(puzzle.focusWord)))errors.push("focusWordExists");
    if(!requiredWords.length||!requiredWords.every(w=>canFormFn(w,letters)))errors.push("everyRequiredWordBuildable");
    if(bonusWords.some(w=>!canFormFn(w,letters)))errors.push("noImpossibleBonusWords");

    if(!expanded){
      const placed=layoutWordsFn?layoutWordsFn(requiredWords):requiredWords;
      if(!placed||placed.length!==requiredWords.length)errors.push("crosswordPlaceable");
    }

    if(puzzle.puzzleMode!==undefined&&!PUZZLE_MODES.has(puzzle.puzzleMode))errors.push("puzzleModeValid");
    if(!expanded&&!checkWordCount(requiredWords,puzzle.puzzleMode,wordCountRange))errors.push("wordCountInRange");
    if(letters.length>wheelBudget)errors.push("wheelWithinBudget");
    if(puzzle.id&&existingIds.has(puzzle.id))errors.push("noDuplicateId");
    if(puzzle.difficulty!==undefined&&!DIFFICULTIES.has(puzzle.difficulty))errors.push("difficultyAssigned");
    if(!expanded&&!DIFFICULTIES.has(puzzle.difficulty))errors.push("difficultyAssigned");
    if(!expanded&&!String(puzzle.definition||"").trim())errors.push("definitionPresent");
    if(!expanded&&!String(puzzle.hint||"").trim())errors.push("hintPresent");

    return {valid:errors.length===0,errors};
  }

  function estimateSolveSeconds(candidate,score){
    const requiredWords=candidate.requiredWords||[];
    const bonusWords=candidate.bonusWords||[];
    return Math.round(20+requiredWords.length*15+bonusWords.length*5+score*0.5);
  }

  // Attaches id/worldId/estimatedSolveSeconds/generatorVersion/createdAt to a
  // scored+hinted candidate. Does not validate — call validatePuzzle after.
  //
  // puzzleMode: "multi-term" (default) | "single-term" — must match how the
  //   candidate was produced (see puzzle-generator.js's `mode` option).
  // eligibleLessonIds: denormalized list of every lesson whose allowlist the
  //   puzzle's tags fit within (computed by the caller, e.g. via
  //   puzzle-pipeline-service.js's computeEligibleLessons) — tags remain the
  //   source of truth; this is a read-convenience cache, not authoritative.
  // sourceGenerationScope: {type:"world"} for untargeted world-bank
  //   generation, or {type:"lesson", lessonId} for lesson-targeted generation.
  function assemblePuzzle(candidate,{worldId,seq,score,difficulty,hint,generatorVersion=1,now,puzzleMode="multi-term",eligibleLessonIds=[],sourceGenerationScope={type:"world"}}){
    const id=`${worldId.toUpperCase()}-P${String(seq).padStart(4,"0")}`;
    return {
      id,
      worldId,
      tags:candidate.tags||candidate.requiredWords,
      letters:candidate.letters,
      requiredWords:candidate.requiredWords,
      bonusWords:candidate.bonusWords,
      focusWord:candidate.focusWord,
      definition:candidate.definition,
      difficulty,
      hint,
      estimatedSolveSeconds:estimateSolveSeconds(candidate,score),
      generatorVersion,
      createdAt:now?now():new Date().toISOString(),
      puzzleMode,
      eligibleLessonIds,
      sourceGenerationScope,
    };
  }

  function assembleExpandedPuzzle(candidate,{id,worldId,now,puzzleVersion=2}){
    return {
      id,worldId,puzzleVersion,puzzleMode:"expanded",
      anchorWord:candidate.anchorWord,supportWords:[...candidate.supportWords],bonusWords:[...(candidate.bonusWords||[])],
      wheelLetters:[...candidate.wheelLetters],financialDefinition:candidate.financialDefinition,
      anchorTermId:candidate.anchorTermId||null,wordCategories:{...candidate.wordCategories},
      rewardPolicy:{financial:candidate.rewardPolicy.financial,support:{...candidate.rewardPolicy.support},bonus:{...candidate.rewardPolicy.bonus}},
      createdAt:now?now():new Date().toISOString(),
    };
  }

  return {validatePuzzle,validateV3Puzzle,assemblePuzzle,assembleExpandedPuzzle,estimateSolveSeconds,DIFFICULTIES:[...DIFFICULTIES],PUZZLE_MODES:[...PUZZLE_MODES],V3_CATEGORIES:[...V3_CATEGORIES]};
});

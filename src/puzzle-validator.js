(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitPuzzleValidator=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const DIFFICULTIES=new Set(["Easy","Medium","Hard","Expert"]);
  const PUZZLE_MODES=new Set(["multi-term","single-term"]);

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
    const {canFormFn,layoutWordsFn,existingIds=new Set(),wordCountRange=[2,5],wheelBudget=9}=deps||{};
    const errors=[];
    const requiredWords=puzzle.requiredWords||[];
    const bonusWords=puzzle.bonusWords||[];
    const letters=puzzle.letters||[];

    if(!puzzle.focusWord||!requiredWords.includes(puzzle.focusWord))errors.push("focusWordExists");
    if(!requiredWords.length||!requiredWords.every(w=>canFormFn(w,letters)))errors.push("everyRequiredWordBuildable");
    if(bonusWords.some(w=>!canFormFn(w,letters)))errors.push("noImpossibleBonusWords");

    const placed=layoutWordsFn?layoutWordsFn(requiredWords):requiredWords;
    if(!placed||placed.length!==requiredWords.length)errors.push("crosswordPlaceable");

    if(puzzle.puzzleMode!==undefined&&!PUZZLE_MODES.has(puzzle.puzzleMode))errors.push("puzzleModeValid");
    if(!checkWordCount(requiredWords,puzzle.puzzleMode,wordCountRange))errors.push("wordCountInRange");
    if(letters.length>wheelBudget)errors.push("wheelWithinBudget");
    if(puzzle.id&&existingIds.has(puzzle.id))errors.push("noDuplicateId");
    if(!DIFFICULTIES.has(puzzle.difficulty))errors.push("difficultyAssigned");
    if(!String(puzzle.definition||"").trim())errors.push("definitionPresent");
    if(!String(puzzle.hint||"").trim())errors.push("hintPresent");

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

  return {validatePuzzle,assemblePuzzle,estimateSolveSeconds,DIFFICULTIES:[...DIFFICULTIES],PUZZLE_MODES:[...PUZZLE_MODES]};
});

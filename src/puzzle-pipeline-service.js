(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitPuzzlePipelineService=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // Orchestrates the pure stages (puzzle-generator, difficulty-scorer,
  // hint-generator, puzzle-validator) into the two operations the CLI needs:
  // building a world-scoped bank, and filtering that bank down to what a
  // lesson is currently allowed to draw puzzles from. This is backend
  // infrastructure only — it does not touch word-game-app.js or any live
  // gameplay path.

  function requireDep(deps,name){
    if(!deps[name])throw new Error(`puzzle-pipeline-service requires deps.${name}`);
    return deps[name];
  }

  // Builds (or tops up) a world-scoped puzzle bank from a Knowledge Base.
  // vocabulary: [{word, definition, termId}]
  // deps: {generateCandidate, scoreDifficulty, generateHint, validatePuzzle,
  //        assemblePuzzle, puzzleIdFor, shuffleFn, wheelForFn, canFormFn,
  //        layoutWordsFn}
  // Returns {bank, rejected}. `bank` includes any existingBank entries passed
  // in (top-up semantics, matching buildBank in puzzle-bank-engine.js).
  function generatePuzzleBank(vocabulary,worldId,size,deps,options={}){
    const generateCandidate=requireDep(deps,"generateCandidate");
    const scoreDifficulty=requireDep(deps,"scoreDifficulty");
    const generateHint=requireDep(deps,"generateHint");
    const validatePuzzle=requireDep(deps,"validatePuzzle");
    const assemblePuzzle=requireDep(deps,"assemblePuzzle");
    const puzzleIdFor=requireDep(deps,"puzzleIdFor");
    const shuffleFn=requireDep(deps,"shuffleFn");
    const wheelForFn=requireDep(deps,"wheelForFn");
    const canFormFn=requireDep(deps,"canFormFn");
    const layoutWordsFn=deps.layoutWordsFn;

    const existingBank=options.existingBank||[];
    const generatorVersion=options.generatorVersion||1;
    const wordCountRange=options.wordCountRange||[2,5];
    const wheelBudget=options.wheelBudget||9;
    const maxAttempts=options.maxAttempts||size*40;

    const bank=[...existingBank];
    const seenContentIds=new Set(bank.map(p=>puzzleIdFor(p.requiredWords)));
    const existingIds=new Set(bank.map(p=>p.id));
    let seq=bank.length;
    const rejected=[];
    let attempts=0;

    while(bank.length<size&&attempts<maxAttempts){
      attempts++;
      const candidate=generateCandidate(vocabulary,shuffleFn,wheelForFn,canFormFn,{maxWords:5,wheelBudget});
      if(!candidate)continue;

      const contentId=puzzleIdFor(candidate.requiredWords);
      if(seenContentIds.has(contentId))continue;

      const {score,difficulty}=scoreDifficulty(candidate);
      const hint=generateHint(candidate);
      seq++;
      const puzzle=assemblePuzzle(candidate,{worldId,seq,score,difficulty,hint,generatorVersion});

      const result=validatePuzzle(puzzle,{canFormFn,layoutWordsFn,existingIds,wordCountRange,wheelBudget});
      if(!result.valid){rejected.push({puzzle,errors:result.errors});continue}

      seenContentIds.add(contentId);
      existingIds.add(puzzle.id);
      bank.push(puzzle);
    }

    return {bank,rejected};
  }

  // Concept Filter stage: a puzzle is eligible for a lesson only if every tag
  // on the puzzle is within the lesson's allowed-concept set (doc §5) — this
  // keeps early lessons from surfacing vocabulary the learner hasn't reached
  // yet, even as a single bonus word.
  function filterBankByTags(bank,allowedTags){
    const allowed=new Set(allowedTags);
    return bank.filter(puzzle=>(puzzle.tags||[]).every(tag=>allowed.has(tag)));
  }

  // Denormalized companion to filterBankByTags: given ALL lessons' allowlists,
  // returns which lesson ids a single puzzle's tags qualify for. Used to fill
  // in a puzzle record's eligibleLessonIds at generation time — a read
  // convenience, not the source of truth (tags + filterBankByTags remain
  // authoritative; this can go stale if allowlists change later and that's fine,
  // callers doing real filtering should always re-derive from tags).
  function computeEligibleLessons(tags,lessonAllowlists){
    if(!lessonAllowlists)return [];
    return Object.keys(lessonAllowlists).filter(lessonId=>{
      const allowed=new Set(lessonAllowlists[lessonId]);
      return (tags||[]).every(tag=>allowed.has(tag));
    });
  }

  // Detects vocabulary terms that cannot appear in ANY puzzle because the
  // word alone already exceeds the wheel-letter budget (e.g. OBLIGATION at 10
  // letters vs. a 9-letter budget — see docs/CRF_EARLY_LESSON_ELIGIBILITY_INVESTIGATION.md).
  // Deliberately does not exclude these terms from anything; it only reports
  // them so the shortfall has a documented, honest reason instead of a silent gap.
  function detectUnplayableTerms(vocabulary,worldId,lessonId,wheelForFn,wheelBudget=9){
    return vocabulary
      .map(entry=>({entry,letters:wheelForFn([entry.word])}))
      .filter(({letters})=>letters.length>wheelBudget)
      .map(({entry,letters})=>({
        worldId,
        lessonId,
        term:entry.word,
        normalizedLength:entry.word.length,
        configuredWheelLimit:wheelBudget,
        reason:`Wheel size ${letters.length} exceeds the configured budget of ${wheelBudget} letters.`,
        status:"unplayable_under_current_budget",
      }));
  }

  // Lesson-targeted generation (doc §1/§5 Concept Filter + Recommendation).
  // Unlike generatePuzzleBank (which draws from the whole world Knowledge Base
  // and lets tag-eligible puzzles for a small lesson turn up by chance —
  // confirmed in the investigation to be a needle-in-a-haystack problem),
  // this restricts the REQUIRED/focus word pool to exactly the lesson's
  // cumulative allowlist, so eligible puzzles are produced deliberately.
  //
  // Priority order per the spec: multi-term puzzles first, then single-term
  // puzzles fill any remaining shortfall toward `count`. Never fabricates
  // duplicate puzzle signatures to hit `count` — a real shortfall is reported
  // in `warnings`, not hidden. Idempotent: existingBank puzzles already
  // eligible for this lesson (via filterBankByTags) count toward `count`
  // before any new generation is attempted, so re-running with the same
  // inputs and a bank that already meets the target adds nothing new.
  //
  // worldVocabulary: the full world Knowledge Base — used for bonus-word
  //   detection (see puzzle-generator.js's bonusVocabulary option) so bonus
  //   words aren't artificially limited to the lesson's tiny allowlist.
  // Returns {bank, added, longTermReport, warnings}.
  function generateLessonPuzzles(worldVocabulary,worldId,lessonId,allowedTags,count,deps,options={}){
    const generateCandidate=requireDep(deps,"generateCandidate");
    const scoreDifficulty=requireDep(deps,"scoreDifficulty");
    const generateHint=requireDep(deps,"generateHint");
    const validatePuzzle=requireDep(deps,"validatePuzzle");
    const assemblePuzzle=requireDep(deps,"assemblePuzzle");
    const puzzleIdFor=requireDep(deps,"puzzleIdFor");
    const shuffleFn=requireDep(deps,"shuffleFn");
    const wheelForFn=requireDep(deps,"wheelForFn");
    const canFormFn=requireDep(deps,"canFormFn");
    const layoutWordsFn=deps.layoutWordsFn;

    const existingBank=options.existingBank||[];
    const generatorVersion=options.generatorVersion||1;
    const wordCountRange=options.wordCountRange||[2,5];
    const wheelBudget=options.wheelBudget||9;
    const maxWords=options.maxWords||5;
    const lessonAllowlists=options.lessonAllowlists||null;

    const lessonVocabulary=worldVocabulary.filter(entry=>allowedTags.includes(entry.word));
    const longTermReport=detectUnplayableTerms(lessonVocabulary,worldId,lessonId,wheelForFn,wheelBudget);
    const unplayableWords=new Set(longTermReport.map(r=>r.term));

    const alreadyEligible=filterBankByTags(existingBank,allowedTags);
    const targetShortfall=Math.max(0,count-alreadyEligible.length);

    const bank=[...existingBank];
    const seenContentIds=new Set(bank.map(p=>puzzleIdFor(p.requiredWords)));
    const existingIds=new Set(bank.map(p=>p.id));
    let seq=bank.length;
    const added=[];
    const rejected=[];

    function assembleAndValidate(candidate,puzzleMode){
      const {score,difficulty}=scoreDifficulty(candidate);
      const hint=generateHint(candidate);
      seq++;
      const eligibleLessonIds=lessonAllowlists?computeEligibleLessons(candidate.tags,lessonAllowlists):[lessonId];
      const puzzle=assemblePuzzle(candidate,{worldId,seq,score,difficulty,hint,generatorVersion,puzzleMode,eligibleLessonIds,sourceGenerationScope:{type:"lesson",lessonId}});
      const result=validatePuzzle(puzzle,{canFormFn,layoutWordsFn,existingIds,wordCountRange,wheelBudget});
      if(!result.valid){seq--;rejected.push({puzzle,errors:result.errors});return null}
      return puzzle;
    }

    // Pass 1: multi-term, preferred.
    let multiAdded=0;
    let attempts=0;
    const maxAttempts=options.maxAttempts||Math.max(200,targetShortfall*80);
    while(multiAdded<targetShortfall&&attempts<maxAttempts){
      attempts++;
      const candidate=generateCandidate(lessonVocabulary,shuffleFn,wheelForFn,canFormFn,{mode:"multi-term",maxWords,wheelBudget,bonusVocabulary:worldVocabulary});
      if(!candidate)continue;
      const contentId=puzzleIdFor(candidate.requiredWords);
      if(seenContentIds.has(contentId))continue;
      const puzzle=assembleAndValidate(candidate,"multi-term");
      if(!puzzle)continue;
      seenContentIds.add(contentId);existingIds.add(puzzle.id);
      bank.push(puzzle);added.push(puzzle);multiAdded++;
    }

    // Pass 2: single-term fills whatever multi-term couldn't reach.
    let singleAdded=0;
    const remainingAfterMulti=targetShortfall-multiAdded;
    if(remainingAfterMulti>0){
      for(const entry of lessonVocabulary){
        if(singleAdded>=remainingAfterMulti)break;
        if(unplayableWords.has(entry.word))continue; // already known to exceed the wheel budget alone
        const contentId=puzzleIdFor([entry.word]);
        if(seenContentIds.has(contentId))continue;
        const candidate=generateCandidate(lessonVocabulary,shuffleFn,wheelForFn,canFormFn,{mode:"single-term",focusWord:entry.word,wheelBudget,bonusVocabulary:worldVocabulary});
        if(!candidate)continue;
        const puzzle=assembleAndValidate(candidate,"single-term");
        if(!puzzle)continue;
        seenContentIds.add(contentId);existingIds.add(puzzle.id);
        bank.push(puzzle);added.push(puzzle);singleAdded++;
      }
    }

    const produced=alreadyEligible.length+added.length;
    const warnings=[];
    if(produced<count){
      warnings.push({
        worldId,lessonId,requested:count,produced,shortfall:count-produced,
        reason:"Lesson vocabulary cannot support the requested puzzle count without duplicate signatures or invalid puzzles under the current wheel budget.",
        limitingTerms:lessonVocabulary.map(e=>e.word),
        unplayableTerms:[...unplayableWords],
      });
    }

    return {bank,added,longTermReport,warnings,rejected};
  }

  // Mirrors the word-normalization build-credit-game-terms.mjs already applies
  // (single-word terms only, uppercase, letters only, length >= 3) so derived
  // allowlists match the vocabulary word() strings puzzle tags are built from.
  function normalizeTerm(term){
    if(/[\s-]/.test(term))return null;
    const word=String(term||"").toUpperCase().replace(/[^A-Z]/g,"");
    return word.length>=3?word:null;
  }

  // Derives each Credit Foundations workbook's cumulative allowed-concept list
  // (its own flashcard terms plus every prerequisite workbook's) directly from
  // the existing curriculum runtime data — no new authoring needed.
  function deriveCumulativeAllowlists(runtime){
    const workbooks=[...(runtime.workbooks||[])].sort((a,b)=>a.sequence-b.sequence);
    const cumulative=new Set();
    const allowlists={};
    workbooks.forEach(workbook=>{
      (workbook.flashcards||[]).forEach(card=>{
        const word=normalizeTerm(card.term);
        if(word)cumulative.add(word);
      });
      allowlists[workbook.id]=[...cumulative];
    });
    return allowlists;
  }

  return {generatePuzzleBank,filterBankByTags,deriveCumulativeAllowlists,normalizeTerm,computeEligibleLessons,detectUnplayableTerms,generateLessonPuzzles};
});

(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitPuzzleGenerator=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // Pure candidate generator. Extends the greedy word-selection already proven
  // in puzzle-bank-engine.js's buildOneCandidate with focus-word pinning and
  // bonus-word detection. Does not score, hint, validate, or assemble a final
  // record — see difficulty-scorer.js, hint-generator.js, puzzle-validator.js.
  //
  // vocabulary: [{word, definition, termId}] — the pool required/focus words
  // may be drawn from. For lesson-targeted generation this is the lesson's
  // allowlist-filtered subset, not necessarily the whole world.
  //
  // options: {
  //   mode="multi-term" | "single-term",
  //   focusWord?, maxWords=5, wheelBudget=9,
  //   bonusVocabulary=vocabulary  — pool bonus words are detected against;
  //     defaults to `vocabulary` so existing (world-scoped) callers are
  //     unaffected, but lesson-targeted generation can pass the full world
  //     Knowledge Base here even while `vocabulary` is lesson-restricted.
  // }
  //
  // "multi-term" (default, unchanged behavior): requires >=2 required words.
  // "single-term": requires options.focusWord, produces exactly one required
  //   word. Returns null if that word alone exceeds the wheel budget — this
  //   is the same check detectUnplayableTerms uses to build its report.
  //
  // returns a candidate {focusWord, definition, letters, requiredWords, bonusWords, tags} or null
  function generateCandidate(vocabulary,shuffleFn,wheelForFn,canFormFn,options={}){
    const mode=options.mode||"multi-term";
    const wheelBudget=options.wheelBudget||9;
    const bonusVocabulary=options.bonusVocabulary||vocabulary;
    const byWord=new Map(vocabulary.map(entry=>[entry.word,entry]));

    function bonusWordsFor(requiredWords,letters){
      const bonusWords=[];
      for(const entry of bonusVocabulary){
        if(requiredWords.includes(entry.word))continue;
        if(bonusWords.includes(entry.word))continue;
        if(canFormFn(entry.word,letters))bonusWords.push(entry.word);
      }
      return bonusWords;
    }

    if(mode==="single-term"){
      const focusWord=options.focusWord;
      if(!focusWord)return null;
      const entry=byWord.get(focusWord);
      if(!entry)return null; // focus word isn't in this vocabulary pool
      const letters=wheelForFn([focusWord]);
      if(letters.length>wheelBudget)return null; // exceeds the wheel budget alone — see detectUnplayableTerms
      const definition=entry.definition||"";
      if(!definition)return null;
      return {focusWord,definition,letters,requiredWords:[focusWord],bonusWords:bonusWordsFor([focusWord],letters),tags:[focusWord]};
    }

    const maxWords=options.maxWords||5;
    let focusEntry=null;
    if(options.focusWord){
      focusEntry=byWord.get(options.focusWord)||null;
      if(!focusEntry)return null; // pinned focus word isn't in this vocabulary pool
    }

    const words=[];
    let letters=[];

    if(focusEntry){
      const focusLetters=wheelForFn([focusEntry.word]);
      if(focusLetters.length>wheelBudget)return null; // focus word alone exceeds the wheel budget
      words.push(focusEntry.word);
      letters=focusLetters;
    }

    const rest=shuffleFn(vocabulary.filter(entry=>entry.word!==(focusEntry&&focusEntry.word)));
    for(const entry of rest){
      if(words.length>=maxWords)break;
      const candidateLetters=wheelForFn([...words,entry.word]);
      if(candidateLetters.length<=wheelBudget){words.push(entry.word);letters=candidateLetters}
    }

    if(words.length<2)return null;

    const focusWord=focusEntry?focusEntry.word:words[0];
    const definition=(byWord.get(focusWord)||{}).definition||"";
    if(!definition)return null;

    return {focusWord,definition,letters,requiredWords:words,bonusWords:bonusWordsFor(words,letters),tags:[...words]};
  }

  // Expanded candidates are built only from a caller-supplied approved support
  // list. No dictionary lookup or random word invention occurs here. Prefix
  // pairs are permitted because versioned expanded puzzles use release-based
  // submission and prefix-aware tap handling.
  function generateExpandedCandidate(anchor,supportVocabulary,deps,options={}){
    const {canFormFn,solveCrosswordFn}=deps||{};
    if(!anchor||!anchor.word||!String(anchor.definition||"").trim()||!canFormFn||!solveCrosswordFn)return null;
    const anchorWord=String(anchor.word).toUpperCase(),held=new Set((options.heldWords||[]).map(word=>String(word).toUpperCase()));
    const wheelBudget=Number.isFinite(options.wheelBudget)?options.wheelBudget:9;
    const wheelLetters=[...anchorWord];
    if(!anchorWord||wheelLetters.length>wheelBudget)return null;
    const seen=new Set([anchorWord]),supports=[];
    for(const item of supportVocabulary||[]){
      const word=String(typeof item==="string"?item:item&&item.word||"").toUpperCase();
      if(word.length<2||word.length>anchorWord.length||seen.has(word)||held.has(word)||!canFormFn(word,wheelLetters))continue;
      seen.add(word);supports.push(word);
    }
    const targetMin=Number.isFinite(options.targetMin)?Math.max(2,options.targetMin):6;
    const targetMax=Number.isFinite(options.targetMax)?Math.max(targetMin,options.targetMax):8;
    const maxCombinations=Number.isFinite(options.maxCombinations)?Math.max(1,options.maxCombinations):5000;
    let examined=0;

    function choose(start,needed,chosen){
      if(examined>=maxCombinations)return null;
      if(needed===0){
        examined++;
        const requiredWords=[anchorWord,...chosen];
        if(!requiredWords.every(word=>canFormFn(word,wheelLetters)))return null;
        const layout=solveCrosswordFn(requiredWords,options.solverOptions||{});
        if(!layout.ok)return null;
        const bonusWords=(options.bonusWords||[]).map(word=>String(word).toUpperCase()).filter((word,index,list)=>!requiredWords.includes(word)&&!held.has(word)&&list.indexOf(word)===index&&canFormFn(word,wheelLetters));
        const wordCategories=Object.fromEntries([[anchorWord,"financial"],...chosen.map(word=>[word,"support"]),...bonusWords.map(word=>[word,"bonus"])]);
        return {
          puzzleVersion:2,anchorWord,supportWords:[...chosen],bonusWords,wheelLetters,
          financialDefinition:String(anchor.definition),anchorTermId:anchor.termId||null,
          wordCategories,rewardPolicy:{financial:"existing-first-solve",support:{coins:1,xp:0},bonus:{coins:0,xp:0}},
          requiredWords,layout:layout.placements,search:{combinationsExamined:examined,layoutNodes:layout.nodes},
        };
      }
      for(let index=start;index<=supports.length-needed;index++){
        const result=choose(index+1,needed-1,[...chosen,supports[index]]);
        if(result)return result;
        if(examined>=maxCombinations)break;
      }
      return null;
    }

    const largest=Math.min(targetMax,1+supports.length);
    for(let total=largest;total>=targetMin;total--){const result=choose(0,total-1,[]);if(result)return result}
    return null;
  }

  return {generateCandidate,generateExpandedCandidate};
});

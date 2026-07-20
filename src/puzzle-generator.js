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

  return {generateCandidate};
});

(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitPuzzleBank=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  function puzzleId(words){return [...words].sort().join("|")}

  // Builds one candidate puzzle from a vocabulary word list, greedily adding words
  // while the combined letter-wheel size stays within budget. Same algorithm the
  // engine already used for on-the-fly puzzle generation; kept pure/injectable here
  // (wheelFor passed in) so it's usable identically from Node tests and the browser.
  // forcedWord (optional): tried first in the pool instead of shuffled in at
  // random, so a candidate containing it can be found in one attempt instead
  // of waiting for random luck — used by buildBank's coverage guarantee below
  // to pair a hard-to-reach word with others rather than isolating it alone.
  // True if any word in the list is a strict prefix of another — the shared
  // word-game engine submits a word the instant a player's letter selection
  // spells any known answer (word-game-app.js's wgAddLetter), so a shorter
  // word that's a prefix of a longer one in the same puzzle auto-submits the
  // short word before the long one can ever be completed, on any input
  // method. Confirmed live 2026-07-23 with a real production example
  // (PAY/PAYCHECK, Money Basics) — see
  // docs/MONEY_BASICS_CLUSTER_GOVERNANCE_GAP_2026-07-23.md.
  function hasPrefixConflict(words){
    return words.some((a,i)=>words.some((b,j)=>i!==j&&b.length>a.length&&b.startsWith(a)));
  }

  function buildOneCandidate(vocabularyWords,shuffleFn,wheelForFn,maxWords=5,wheelBudget=9,forcedWord=null){
    const rest=forcedWord?vocabularyWords.filter(w=>w!==forcedWord):vocabularyWords;
    const pool=forcedWord?[forcedWord,...shuffleFn(rest)]:shuffleFn(rest);
    const words=[];let letters=[];
    for(const word of pool){
      if(words.length>=maxWords)break;
      const candidateWords=[...words,word];
      const candidateLetters=wheelForFn(candidateWords);
      if(candidateLetters.length<=wheelBudget&&!hasPrefixConflict(candidateWords)){words.push(word);letters=candidateLetters}
    }
    return words.length>=2?{words,letters}:null;
  }

  // Builds (or tops up) a persisted bank of up to `size` distinct candidate
  // puzzles. Bank size is caller-supplied, never hardcoded — supports 10, 15, 20,
  // 25+ without code changes. Existing bank entries are preserved by id.
  function buildBank(vocabularyWords,size,shuffleFn,wheelForFn,existingBank=[]){
    const bank=[...existingBank];
    const seenIds=new Set(bank.map(p=>p.id));
    let attempts=0;
    while(bank.length<size&&attempts<size*25){
      attempts++;
      const candidate=buildOneCandidate(vocabularyWords,shuffleFn,wheelForFn);
      if(!candidate)continue;
      const id=puzzleId(candidate.words);
      if(seenIds.has(id))continue;
      seenIds.add(id);
      bank.push({id,words:candidate.words,letters:candidate.letters});
    }
    // Guarantee every vocabulary word is reachable. A bank built purely by
    // random attempts can permanently miss a handful of words (confirmed
    // live: a 10-slot bank drawn from 20 words omitted 3 of them) — the bank
    // is only topped up when its size is below target, never re-checked for
    // coverage, so a missed word would stay unreachable for the life of a
    // save. Uses forcedWord so the missing word pairs naturally with others
    // (a real multi-word puzzle) instead of burning many blind attempts.
    // Grows past `size` only for the words actually missing.
    const coveredWords=new Set(bank.flatMap(p=>p.words));
    const missingWords=vocabularyWords.filter(w=>!coveredWords.has(w));
    for(const word of missingWords){
      let found=false,wordAttempts=0;
      while(!found&&wordAttempts<20){
        wordAttempts++;
        const candidate=buildOneCandidate(vocabularyWords,shuffleFn,wheelForFn,5,9,word);
        if(!candidate)continue;
        const id=puzzleId(candidate.words);
        if(seenIds.has(id))continue;
        seenIds.add(id);
        bank.push({id,words:candidate.words,letters:candidate.letters});
        coveredWords.add(word);
        found=true;
      }
    }
    return bank;
  }

  // Anti-repetition selection:
  //   1. Never-played puzzles first (shuffled among themselves).
  //   2. Then least-recently-played puzzles.
  //   3. Avoid selecting more than two puzzles that were also in the immediately
  //      previous playthrough, falling back to them only if the bank is too small
  //      to avoid it.
  //   4. If no play history exists at all, this reduces to a plain random pick of
  //      `count`, satisfying the "randomly select" fallback rule.
  // Final order is shuffled ("Shuffle their order").
  function selectPlaythrough(bank,history,lastPlaythrough,count,shuffleFn){
    const lastSet=new Set(lastPlaythrough||[]);
    const h=history||{};
    const neverPlayed=bank.filter(p=>!h[p.id]||!h[p.id].timesPlayed);
    const played=bank.filter(p=>h[p.id]&&h[p.id].timesPlayed>0)
      .sort((a,b)=>(h[a.id].lastPlayedAt||0)-(h[b.id].lastPlayedAt||0));
    const candidates=[...shuffleFn(neverPlayed),...played];
    const selected=[];const deferred=[];let overlapCount=0;
    for(const candidate of candidates){
      if(selected.length>=count)break;
      const isOverlap=lastSet.has(candidate.id);
      if(isOverlap&&overlapCount>=2){deferred.push(candidate);continue}
      selected.push(candidate);
      if(isOverlap)overlapCount++;
    }
    for(const candidate of deferred){
      if(selected.length>=count)break;
      selected.push(candidate);
    }
    return shuffleFn(selected);
  }

  // Single source of truth for what solving a word pays out. A word already
  // present in the player's permanent solvedWords list pays nothing on a
  // repeat encounter (vocabulary is shared across puzzles/playthroughs, so
  // the same word can legitimately reappear) — only the first-ever solve of
  // a given word earns coins/XP.
  function wordReward(word,alreadySolvedWords){
    if((alreadySolvedWords||[]).includes(word))return{coins:0,xp:0,isNewSolve:false};
    return{coins:word.length*7,xp:Math.round(word.length*1.5),isNewSolve:true};
  }

  function recordPlaythrough(history,playedIds,now=Date.now()){
    const next={...history};
    playedIds.forEach(id=>{
      const prior=next[id]||{timesPlayed:0,lastPlayedAt:null};
      next[id]={timesPlayed:prior.timesPlayed+1,lastPlayedAt:now};
    });
    return next;
  }

  // A puzzle is the first-level tutorial exactly once: while it's the bank's
  // first entry and hasn't been passed yet. Passing it (with or without
  // hints — see hintCost below) permanently switches later visits to
  // governed pricing, tracked via the per-world firstPuzzlePassed flag.
  function isFirstLevelPractice(firstPuzzlePassed,currentPuzzleId,firstPuzzleId){
    return !firstPuzzlePassed&&Boolean(currentPuzzleId)&&currentPuzzleId===firstPuzzleId;
  }

  function hintCost(isTutorialLevel,governedCost){
    return isTutorialLevel?0:governedCost;
  }

  function canAffordHint(balance,cost){
    return cost===0||(Number.isFinite(balance)&&balance>=cost);
  }

  function puzzleProgress(bank,history){
    const activeBank=Array.isArray(bank)?bank:[];
    const puzzleHistory=history||{};
    const completed=activeBank.filter(puzzle=>puzzleHistory[puzzle.id]&&puzzleHistory[puzzle.id].timesPlayed>0).length;
    return{completed,total:activeBank.length};
  }

  return {puzzleId,buildOneCandidate,buildBank,selectPlaythrough,recordPlaythrough,wordReward,isFirstLevelPractice,hintCost,canAffordHint,puzzleProgress,hasPrefixConflict};
});

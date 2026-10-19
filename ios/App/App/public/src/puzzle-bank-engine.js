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

  function anchorPuzzleId(worldId,word){return `ANCHOR-V2:${worldId}:${word}`}

  // Non-destructive compatibility view for the five frozen V1 banks. The raw
  // governed/saved records remain untouched; each approved financial word is
  // exposed as one anchor-only V2 puzzle with a stable word-based id.
  function toAnchorPuzzles(bank,vocabulary,worldId){
    const byWord=new Map((vocabulary||[]).map(entry=>[entry.word,entry])),byAnchor=new Map();
    for(const source of bank||[]){
      if(isExpandedPuzzle(source)){
        byAnchor.set(source.anchorWord,{...source,sourcePuzzleIds:[...(source.sourcePuzzleIds||[source.id])]});
        continue;
      }
      for(const word of source.words||[]){
        const prior=byAnchor.get(word);
        if(prior){if(!prior.sourcePuzzleIds.includes(source.id))prior.sourcePuzzleIds.push(source.id);continue}
        const term=byWord.get(word);
        if(!term)continue;
        byAnchor.set(word,{
          id:anchorPuzzleId(worldId,word),worldId,puzzleVersion:2,puzzleMode:"anchor-only",
          anchorWord:word,supportWords:[],bonusWords:[],wheelLetters:[...word],
          financialDefinition:term.definition||"",anchorTermId:term.termId||null,
          wordCategories:{[word]:"financial"},
          rewardPolicy:{financial:"existing-first-solve",support:{coins:1,xp:0},bonus:{coins:0,xp:0}},
          sourcePuzzleIds:[source.id],contentReviewRequired:true,contentStatus:"needs-approved-support-words",
        });
      }
    }
    return [...byAnchor.values()];
  }

  // Old completion evidence is projected onto derived anchor ids without
  // deleting or rewriting the original history. New completions are stored
  // under their stable anchor id alongside the legacy entries.
  function effectiveAnchorHistory(bank,history,solvedWords){
    const raw=history||{},solved=new Set(solvedWords||[]),effective={};
    for(const puzzle of bank||[]){
      if(raw[puzzle.id]){effective[puzzle.id]={...raw[puzzle.id]};continue}
      const sourceRecords=(puzzle.sourcePuzzleIds||[]).map(id=>raw[id]).filter(Boolean);
      if(!sourceRecords.length&&!solved.has(puzzle.anchorWord))continue;
      effective[puzzle.id]={
        timesPlayed:Math.max(1,...sourceRecords.map(record=>record.timesPlayed||0)),
        lastPlayedAt:Math.max(0,...sourceRecords.map(record=>record.lastPlayedAt||0))||null,
      };
    }
    return effective;
  }

  // V3 revisions intentionally do not inherit completion from V1/V2 puzzle
  // records. A solved anchor alone is not evidence that the new 3-5 answer
  // crossword was completed. Existing history remains stored untouched.
  function effectivePuzzleHistory(bank,history,solvedWords){
    if((bank||[]).some(isV3Puzzle)){
      const raw=history||{},effective={};
      for(const puzzle of bank||[])if(raw[puzzle.id])effective[puzzle.id]={...raw[puzzle.id]};
      return effective;
    }
    return effectiveAnchorHistory(bank,history,solvedWords);
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

  function isExpandedPuzzle(puzzle){
    return isV3Puzzle(puzzle)||(Number(puzzle&&puzzle.puzzleVersion)>=2&&typeof puzzle.anchorWord==="string"&&Array.isArray(puzzle.supportWords));
  }

  function isV3Puzzle(puzzle){return Number(puzzle&&puzzle.puzzleVersion)===3&&Array.isArray(puzzle.answers)&&typeof puzzle.anchorWord==="string"}
  function isFinancialCategory(category){return category==="financial"||category==="financial-anchor"||category==="financial-secondary"}

  // Player-facing terminology for V3's internal `ordinary` category and the
  // legacy `support` equivalent. Keeping this copy behind the category check
  // prevents display labels from leaking into puzzle data, reward histories,
  // mastery identities, or save fields.
  function answerPresentation(answer){
    if(!answer||!(answer.category==="ordinary"||answer.category==="support"))return null;
    const word=String(answer.word||"").trim().toUpperCase();
    const heading=`NON-FINANCIAL WORD: ${word}`;
    const instruction="Solve this word to help complete the crossword.";
    const reward="Reward: +1 coin | +0 XP";
    return {
      heading,instruction,reward,
      hintPrefix:"Hint for non-financial word",
      revealMessage:"Non-financial word revealed",
      accessibilityLabel:`${heading}. ${instruction} ${reward}.`,
    };
  }

  // One compatibility adapter keeps the frozen V1 schema unchanged while the
  // runtime consumes explicit categories for versioned expanded puzzles.
  function puzzleModel(puzzle){
    if(isV3Puzzle(puzzle)){
      const answers=puzzle.answers.map(answer=>({...answer})),requiredAnswers=answers.filter(answer=>answer.category!=="bonus");
      return {
        expanded:true,puzzleVersion:3,anchorWord:puzzle.anchorWord,answers,requiredAnswers,
        supportWords:requiredAnswers.filter(answer=>answer.category==="ordinary").map(answer=>answer.word),
        bonusWords:answers.filter(answer=>answer.category==="bonus").map(answer=>answer.word),
        words:requiredAnswers.map(answer=>answer.word),letters:[...(puzzle.wheelLetters||[])],
        definition:requiredAnswers.find(answer=>answer.word===puzzle.anchorWord)?.definition||"",
      };
    }
    if(isExpandedPuzzle(puzzle)){
      const anchorWord=puzzle.anchorWord;
      const supportWords=[...puzzle.supportWords];
      return {
        expanded:true,puzzleVersion:puzzle.puzzleVersion,anchorWord,supportWords,
        bonusWords:[...(puzzle.bonusWords||[])],words:[anchorWord,...supportWords],
        letters:[...(puzzle.wheelLetters||[])],definition:puzzle.financialDefinition||"",
      };
    }
    const words=[...((puzzle&&puzzle.words)||(puzzle&&puzzle.requiredWords)||[])];
    return {
      expanded:false,puzzleVersion:1,anchorWord:(puzzle&&puzzle.focusWord)||words[0]||null,
      supportWords:[],bonusWords:[],words,letters:[...((puzzle&&puzzle.letters)||[])],definition:(puzzle&&puzzle.definition)||"",
    };
  }

  // Builds the completion review from permanent IDs, then resolves the display
  // copy from the authoritative vocabulary supplied by the runtime. Definitions
  // embedded in puzzle records are intentionally not used as a fallback: if an
  // identity is missing or broken, the player sees a reference warning and the
  // defect remains visible to validation instead of silently showing stale copy.
  // Ordinary/support answers and zero-reward bonus words never enter this list.
  function completionLearningSummary(puzzle,resolveTerm){
    const model=puzzleModel(puzzle),references=[];
    if(isV3Puzzle(puzzle)){
      for(const answer of model.answers||[])if(isFinancialCategory(answer.category))references.push({
        word:answer.word,termId:answer.termId||null,worldId:answer.worldId||null,
      });
    }else if(model.anchorWord){
      references.push({word:model.anchorWord,termId:puzzle&&puzzle.anchorTermId||null,worldId:puzzle&&puzzle.worldId||null});
    }
    const terms=[],unresolved=[];
    for(const reference of references){
      if(!reference.termId){unresolved.push({...reference,reason:"missing permanent term ID"});continue}
      const governed=typeof resolveTerm==="function"?resolveTerm(reference.termId):null;
      if(!governed){unresolved.push({...reference,reason:"permanent term ID not found"});continue}
      const governedWord=String(governed.word||"").trim().toUpperCase();
      if(!governedWord||governedWord!==String(reference.word||"").trim().toUpperCase()){
        unresolved.push({...reference,reason:`identity word mismatch${governedWord?`: registry has ${governedWord}`:""}`});continue;
      }
      const definition=String(governed.definition||"");
      if(!definition){unresolved.push({...reference,reason:"approved definition missing"});continue}
      terms.push({word:governedWord,definition,termId:reference.termId,worldId:governed.worldId||governed.world||reference.worldId||null});
    }
    return {terms,unresolved};
  }

  function answerCategory(puzzle,word){
    if(isV3Puzzle(puzzle))return puzzle.answers.find(answer=>answer.word===word)?.category||"invalid";
    const model=puzzleModel(puzzle);
    if(model.expanded&&word===model.anchorWord)return "financial";
    if(model.expanded&&model.supportWords.includes(word))return "support";
    if(model.expanded&&model.bonusWords.includes(word))return "bonus";
    if(!model.expanded&&model.words.includes(word))return "financial";
    return "invalid";
  }

  // Financial first-discovery rewards are global per term. A term owned by one
  // world can appear in another world's puzzle (owner decision 2026-10-17), and the
  // existing save keeps reward histories per world, so the history handed to
  // answerReward() must also include what every other world has already paid:
  // the union of every world's solvedWords (words are unique across the 145 approved
  // terms) and rewardedFinancialTermIds. Ordinary/support lists stay per-world, so
  // non-financial reward behavior is unchanged. This only READS existing histories:
  // no save field is added, moved, or rewritten, and the inputs are never mutated.
  function globalRewardHistory(current,allWorldProgress){
    const base=current||{},worlds=(allWorldProgress||[]).filter(entry=>entry&&typeof entry==="object");
    const union=key=>[...new Set([...(base[key]||[]),...worlds.flatMap(entry=>Array.isArray(entry[key])?entry[key]:[])])];
    return {...base,solvedWords:union("solvedWords"),rewardedFinancialTermIds:union("rewardedFinancialTermIds")};
  }

  function answerReward(puzzle,word,histories={}){
    const category=answerCategory(puzzle,word);
    if(isV3Puzzle(puzzle)){
      const answer=puzzle.answers.find(item=>item.word===word);
      if(isFinancialCategory(category)){
        const rewardedByWord=(histories.solvedWords||[]).includes(word),rewardedById=answer?.termId&&(histories.rewardedFinancialTermIds||[]).includes(answer.termId);
        if(rewardedByWord||rewardedById)return {coins:0,xp:0,isNewSolve:false,category,historyKey:"solvedWords",termId:answer?.termId||null};
        const value=wordReward(word,[]);
        return {...value,category,historyKey:"solvedWords",termId:answer?.termId||null};
      }
      if(category==="ordinary"){
        const rewarded=(histories.rewardedOrdinaryWords||[]).includes(word)||(histories.rewardedSupportWords||[]).includes(word);
        return {coins:rewarded?0:1,xp:0,isNewSolve:!rewarded,category,historyKey:"rewardedOrdinaryWords",termId:null};
      }
      return {coins:0,xp:0,isNewSolve:false,category,historyKey:null,termId:null};
    }
    if(category==="financial")return {...wordReward(word,histories.solvedWords),category,historyKey:"solvedWords"};
    if(category==="support"){
      const rewarded=(histories.rewardedSupportWords||[]).includes(word);
      return {coins:rewarded?0:1,xp:0,isNewSolve:!rewarded,category,historyKey:"rewardedSupportWords"};
    }
    return {coins:0,xp:0,isNewSolve:false,category,historyKey:null};
  }

  function recordPlaythrough(history,playedIds,now=Date.now()){
    const next={...history};
    playedIds.forEach(id=>{
      const prior=next[id]||{timesPlayed:0,lastPlayedAt:null};
      next[id]={timesPlayed:prior.timesPlayed+1,lastPlayedAt:now};
    });
    return next;
  }

  // A canonical puzzle may be referenced by several world curricula. These
  // helpers keep its first-discovery reward state separate from each world's
  // curriculum completion history. The format is additive and corruption
  // tolerant so old saves can be upgraded without resetting progress.
  function canonicalPuzzleRecord(value={}){
    return {
      timesCompleted:Number.isFinite(value.timesCompleted)&&value.timesCompleted>0?Math.floor(value.timesCompleted):0,
      firstCompletedAt:Number.isFinite(value.firstCompletedAt)&&value.firstCompletedAt>0?value.firstCompletedAt:null,
      lastCompletedAt:Number.isFinite(value.lastCompletedAt)&&value.lastCompletedAt>0?value.lastCompletedAt:null,
      rewardedAnswers:[...new Set((Array.isArray(value.rewardedAnswers)?value.rewardedAnswers:[]).filter(word=>typeof word==="string"&&word))],
      worldIds:[...new Set((Array.isArray(value.worldIds)?value.worldIds:[]).filter(id=>typeof id==="string"&&id))],
    };
  }
  function migrateCanonicalPuzzleProgress(current,puzzles,worlds,worldKeyToId={}){
    const next={};
    Object.entries(current&&typeof current==="object"&&!Array.isArray(current)?current:{}).forEach(([id,value])=>{next[id]=canonicalPuzzleRecord(value)});
    for(const puzzle of puzzles||[]){
      const model=puzzleModel(puzzle),matches=[];
      Object.entries(worlds&&typeof worlds==="object"?worlds:{}).forEach(([worldKey,world])=>{
        const record=world&&world.puzzleHistory&&world.puzzleHistory[puzzle.id];
        if(record&&Number.isFinite(record.timesPlayed)&&record.timesPlayed>0)matches.push({worldId:worldKeyToId[worldKey]||worldKey,timesPlayed:Math.floor(record.timesPlayed),lastPlayedAt:record.lastPlayedAt});
      });
      if(!matches.length)continue;
      const prior=canonicalPuzzleRecord(next[puzzle.id]),total=matches.reduce((sum,item)=>sum+item.timesPlayed,0);
      const dates=matches.map(item=>item.lastPlayedAt).filter(value=>Number.isFinite(value)&&value>0);
      next[puzzle.id]={
        ...prior,
        timesCompleted:Math.max(prior.timesCompleted,total),
        firstCompletedAt:prior.firstCompletedAt||(dates.length?Math.min(...dates):null),
        lastCompletedAt:Math.max(prior.lastCompletedAt||0,dates.length?Math.max(...dates):0)||null,
        rewardedAnswers:[...new Set([...prior.rewardedAnswers,...model.words])],
        worldIds:[...new Set([...prior.worldIds,...matches.map(item=>item.worldId)])],
      };
    }
    return next;
  }
  function canonicalAnswerReward(puzzle,word,histories,record){
    const reward=answerReward(puzzle,word,histories),canonical=canonicalPuzzleRecord(record);
    return canonical.rewardedAnswers.includes(word)?{...reward,coins:0,xp:0,isNewSolve:false}:reward;
  }
  function recordCanonicalAnswer(record,word){
    const next=canonicalPuzzleRecord(record);
    if(typeof word==="string"&&word&&!next.rewardedAnswers.includes(word))next.rewardedAnswers.push(word);
    return next;
  }
  function recordCanonicalCompletion(record,worldId,now=Date.now()){
    const next=canonicalPuzzleRecord(record);
    next.timesCompleted++;
    if(!next.firstCompletedAt)next.firstCompletedAt=now;
    next.lastCompletedAt=now;
    if(worldId&&!next.worldIds.includes(worldId))next.worldIds.push(worldId);
    return next;
  }

  // Level 1 is the world's complete first playthrough, not just bank[0].
  // Completion is derived from stable per-world puzzle history so games 1-5
  // remain tutorial-priced across reloads and world changes.
  function isTutorialLevel(completedPuzzleCount,requiredPuzzles){
    const completed=Number.isFinite(completedPuzzleCount)?Math.max(0,completedPuzzleCount):0;
    const required=Number.isFinite(requiredPuzzles)?Math.max(1,requiredPuzzles):1;
    return completed<required;
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

  function puzzleLevels(bank,gamesPerLevel=5){
    const activeBank=Array.isArray(bank)?bank:[],size=Number.isInteger(gamesPerLevel)&&gamesPerLevel>0?gamesPerLevel:5,levels=[];
    for(let start=0;start<activeBank.length;start+=size)levels.push(activeBank.slice(start,start+size));
    return levels;
  }

  return {puzzleId,buildOneCandidate,buildBank,anchorPuzzleId,toAnchorPuzzles,effectiveAnchorHistory,effectivePuzzleHistory,globalRewardHistory,selectPlaythrough,recordPlaythrough,wordReward,isExpandedPuzzle,isV3Puzzle,isFinancialCategory,answerPresentation,puzzleModel,completionLearningSummary,answerCategory,answerReward,canonicalPuzzleRecord,migrateCanonicalPuzzleProgress,canonicalAnswerReward,recordCanonicalAnswer,recordCanonicalCompletion,isTutorialLevel,hintCost,canAffordHint,puzzleProgress,puzzleLevels,hasPrefixConflict};
});

(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitAnswerExpansion=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Exhaustive-answer rule (owner decision, 2026-11-18): every approved financial term that can be spelled from a puzzle's wheel
  // is a required answer of that puzzle. "Approved financial terms" are the union of the seven governed term files below
  // (207 distinct words). Added answers are recorded, per puzzle, in content/answer-expansion-v1.json so that (a) the exhaustive
  // rule can be re-checked by tests and release validation and (b) the reward guard knows which answers were added after a
  // player may already have completed the puzzle. Puzzle IDs and anchors never change.
  const EXPANSION_VERSION=1,EXPECTED_TERM_COUNT=211;
  const SOURCES=Object.freeze([
    {file:"content/credit-game-terms.json",world:"credit"},
    {file:"content/crypto-terms.json",world:"crypto"},
    {file:"content/banking-basics-terms.json",world:"banking"},
    {file:"content/investing-basics-terms.json",world:"investing"},
    {file:"content/money-basics-terms.json",world:"moneybasics"},
    {file:"content/2027-new-world-terms.json",world:null},
    {file:"content/v3-supplemental-terms.json",world:null},
  ]);
  const normalizeWord=word=>String(word||"").toUpperCase().replace(/[^A-Z]/g,"");
  function letterCounts(letters){const out={};for(const letter of letters)out[letter]=(out[letter]||0)+1;return out}
  function spellable(word,wheelLetters){
    const available=letterCounts([...wheelLetters].map(String)),need=letterCounts([...word]);
    return Object.entries(need).every(([letter,count])=>(available[letter]||0)>=count);
  }
  // entries: [{word, termId, worldId, definition, source}] in source order. First occurrence of a word wins; a word that appears in
  // two files must carry the same termId or the dictionary refuses to build (it would be ambiguous which term the answer means).
  function buildDictionary(entries){
    const map=new Map();
    for(const entry of entries){
      const word=normalizeWord(entry.word);
      if(!word)continue;
      const prior=map.get(word);
      if(prior){if(prior.termId!==entry.termId)throw new Error(`Ambiguous dictionary word ${word}: ${prior.termId} vs ${entry.termId}`);continue}
      map.set(word,{word,termId:entry.termId,worldId:entry.worldId,definition:entry.definition,source:entry.source});
    }
    return map;
  }
  // Node only: reads the seven governed files from the repository root.
  function loadDictionary(rootDir){
    const fs=require("node:fs"),path=require("node:path"),identities=require(path.join(rootDir,"content/credit-term-identities.js"));
    const entries=[];
    for(const source of SOURCES){
      const json=JSON.parse(fs.readFileSync(path.join(rootDir,source.file),"utf8")),list=Array.isArray(json)?json:json.terms;
      for(const term of list){
        const world=source.world||term.worldId||term.world,termId=source.world==="credit"?identities.resolveTerm(term):(term.id||term.termId);
        entries.push({word:term.word,termId,worldId:world,definition:String(term.definition||""),source:source.file});
      }
    }
    return buildDictionary(entries);
  }
  function requiredWordsOf(puzzle){
    if(Array.isArray(puzzle&&puzzle.requiredWords)&&puzzle.requiredWords.length)return puzzle.requiredWords;
    return ((puzzle&&puzzle.answers)||[]).filter(answer=>answer.category!=="bonus").map(answer=>answer.word);
  }
  // Dictionary terms that can be spelled from the puzzle's wheel but are not required answers of the puzzle.
  function missingAnswers(puzzle,dictionary){
    const required=new Set(requiredWordsOf(puzzle)),wheel=(puzzle&&puzzle.wheelLetters)||[],out=[];
    for(const entry of dictionary.values())if(!required.has(entry.word)&&spellable(entry.word,wheel))out.push(entry);
    return out;
  }
  // The key (anchor) term spells the wheel exactly once per letter; v3 puzzles with declared extra letters add those letters to
  // the wheel on top of the anchor, so the anchor is compared with the wheel minus the declared extras.
  function anchorUsesWheelExactly(puzzle){
    const wheel=[...((puzzle&&puzzle.wheelLetters)||[])],extras=[...((puzzle&&puzzle.declaredExtraLetters)||[])];
    for(const extra of extras){const index=wheel.indexOf(extra);if(index<0)return false;wheel.splice(index,1)}
    return wheel.sort().join("")===[...((puzzle&&puzzle.anchorWord)||"")].sort().join("");
  }
  // Strict exact-wheel rule (v4 and release): the wheel is the key term's letters, repeated letters included, with no declared extras.
  function anchorSpellsWheelExactly(puzzle){
    if(Array.isArray(puzzle&&puzzle.declaredExtraLetters)&&puzzle.declaredExtraLetters.length)return false;
    return [...((puzzle&&puzzle.wheelLetters)||[])].sort().join("")===[...((puzzle&&puzzle.anchorWord)||"")].sort().join("");
  }
  function addedAnswers(expansion,puzzleId){
    const record=expansion&&expansion.puzzles&&expansion.puzzles[puzzleId];
    return record&&Array.isArray(record.added)?record.added.map(item=>item.word):[];
  }
  return {EXPANSION_VERSION,EXPECTED_TERM_COUNT,SOURCES,normalizeWord,spellable,buildDictionary,loadDictionary,requiredWordsOf,missingAnswers,anchorUsesWheelExactly,anchorSpellsWheelExactly,addedAnswers};
});

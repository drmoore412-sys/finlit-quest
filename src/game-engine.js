(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitGameEngine=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  function canForm(word,letters){const available=[...letters];return [...word].every(letter=>{const index=available.indexOf(letter);if(index<0)return false;available.splice(index,1);return true})}
  function evaluateWord(word,level,foundWords,bonusWords){if(!word)return {status:"empty"};if(foundWords.has(word))return {status:"duplicate"};if(level.words.includes(word))return {status:"target",word};if(bonusWords.includes(word)&&canForm(word,level.letters))return {status:"bonus",word};return {status:"invalid",word}}

  // Frozen V1 banks were authored against this permissive layout, including
  // documented disconnected fallbacks. Keep it only for those legacy records;
  // versioned expanded puzzles use solveCrossword below.
  function canPlace(word,row,column,direction,occupied){for(let i=0;i<word.length;i++){const key=`${row+(direction==="v"?i:0)},${column+(direction==="h"?i:0)}`;if(occupied.has(key)&&occupied.get(key)!==word[i])return false}return true}
  function layoutWords(words){const occupied=new Map(),placed=[];let minRow=0,minColumn=0;words.forEach((word,wordIndex)=>{let best=null;if(!wordIndex)best={r:2,c:1,dir:"h"};else for(const placedWord of placed)for(let a=0;a<word.length;a++)for(let b=0;b<placedWord.word.length;b++)if(word[a]===placedWord.word[b]){const direction=placedWord.dir==="h"?"v":"h",row=placedWord.r+(placedWord.dir==="v"?b:0)-(direction==="v"?a:0),column=placedWord.c+(placedWord.dir==="h"?b:0)-(direction==="h"?a:0);if(canPlace(word,row,column,direction,occupied)){best={r:row,c:column,dir:direction};break}}if(!best){const usedRows=placed.map(item=>item.r+(item.dir==="v"?item.word.length:0));best={r:Math.max(...usedRows,0)+1,c:1,dir:"h"}}placed.push({...best,word});for(let i=0;i<word.length;i++){const row=best.r+(best.dir==="v"?i:0),column=best.c+(best.dir==="h"?i:0);occupied.set(`${row},${column}`,word[i]);minRow=Math.min(minRow,row);minColumn=Math.min(minColumn,column)}});return placed.map(item=>({...item,r:item.r-minRow,c:item.c-minColumn}))}

  function key(row,column){return `${row},${column}`}
  function point(placement,index){return {row:placement.r+(placement.dir==="v"?index:0),column:placement.c+(placement.dir==="h"?index:0)}}
  function boundsFor(placements){
    let minRow=Infinity,minColumn=Infinity,maxRow=-Infinity,maxColumn=-Infinity;
    placements.forEach(placement=>[...placement.word].forEach((_,index)=>{const p=point(placement,index);minRow=Math.min(minRow,p.row);minColumn=Math.min(minColumn,p.column);maxRow=Math.max(maxRow,p.row);maxColumn=Math.max(maxColumn,p.column)}));
    return placements.length?{minRow,minColumn,maxRow,maxColumn,rows:maxRow-minRow+1,columns:maxColumn-minColumn+1}:{minRow:0,minColumn:0,maxRow:0,maxColumn:0,rows:0,columns:0};
  }
  function normalizedPlacements(placements){const bounds=boundsFor(placements);return placements.map(item=>({...item,r:item.r-bounds.minRow,c:item.c-bounds.minColumn}))}
  function buildCells(placements){
    const cells=new Map();
    for(const placement of placements)for(let index=0;index<placement.word.length;index++){
      const p=point(placement,index),cellKey=key(p.row,p.column),prior=cells.get(cellKey);
      if(prior&&prior.letter!==placement.word[index])return null;
      const cell=prior||{letter:placement.word[index],directions:new Set(),words:new Set()};
      if(cell.directions.has(placement.dir))return null;
      cell.directions.add(placement.dir);cell.words.add(placement.word);cells.set(cellKey,cell);
    }
    return cells;
  }
  function strictPlacementCheck(word,row,column,direction,cells,requireCrossing){
    let crossings=0;
    const before=key(row-(direction==="v"?1:0),column-(direction==="h"?1:0));
    const after=key(row+(direction==="v"?word.length:0),column+(direction==="h"?word.length:0));
    if(cells.has(before)||cells.has(after))return null;
    for(let index=0;index<word.length;index++){
      const r=row+(direction==="v"?index:0),c=column+(direction==="h"?index:0),cell=cells.get(key(r,c));
      if(cell){
        if(cell.letter!==word[index]||cell.directions.has(direction))return null;
        crossings++;
      }else{
        const neighbors=direction==="h"?[key(r-1,c),key(r+1,c)]:[key(r,c-1),key(r,c+1)];
        if(neighbors.some(neighbor=>cells.has(neighbor)))return null;
      }
    }
    if(requireCrossing&&crossings===0)return null;
    return {r:row,c:column,dir:direction,crossings};
  }
  function candidatePlacements(word,cells){
    const candidates=[],seen=new Set();
    for(const [cellKey,cell] of cells){
      const [cellRow,cellColumn]=cellKey.split(",").map(Number);
      for(let index=0;index<word.length;index++)if(word[index]===cell.letter){
        for(const direction of ["h","v"]){
          if(cell.directions.has(direction))continue;
          const row=cellRow-(direction==="v"?index:0),column=cellColumn-(direction==="h"?index:0),signature=`${row},${column},${direction}`;
          if(seen.has(signature))continue;
          seen.add(signature);
          const valid=strictPlacementCheck(word,row,column,direction,cells,true);
          if(valid)candidates.push(valid);
        }
      }
    }
    return candidates.sort((a,b)=>b.crossings-a.crossings||a.r-b.r||a.c-b.c||a.dir.localeCompare(b.dir));
  }
  function layoutScore(placements){
    const cells=buildCells(placements),bounds=boundsFor(placements);
    if(!cells)return -Infinity;
    const crossings=[...cells.values()].filter(cell=>cell.directions.size===2).length;
    return crossings*10000-bounds.rows*bounds.columns*100-(bounds.rows+bounds.columns)*10;
  }

  // Deterministic bounded backtracking. It returns an explicit failure instead
  // of fabricating disconnected rows when no legal connected crossword is found.
  function solveCrossword(inputWords,options={}){
    const words=(inputWords||[]).map(word=>String(word||"").toUpperCase());
    if(!words.length)return {ok:false,reason:"no_words",placements:[],nodes:0};
    if(words.some(word=>word.length<2)||new Set(words).size!==words.length)return {ok:false,reason:"invalid_words",placements:[],nodes:0};
    const maxNodes=Number.isFinite(options.maxNodes)?Math.max(1,options.maxNodes):50000;
    const maxSolutions=Number.isFinite(options.maxSolutions)?Math.max(1,options.maxSolutions):250;
    const first={word:words[0],r:0,c:0,dir:"h"};
    let nodes=0,solutions=0,limited=false,best=null,bestScore=-Infinity;

    function search(placements,remaining){
      if(nodes>=maxNodes||solutions>=maxSolutions){limited=true;return}
      nodes++;
      if(!remaining.length){
        const validation=validateCrosswordLayout(words,placements);
        if(!validation.valid)return;
        solutions++;
        const score=layoutScore(placements);
        if(score>bestScore){bestScore=score;best=placements.map(item=>({...item}))}
        return;
      }
      const cells=buildCells(placements);
      const choices=remaining.map((word,index)=>({word,index,candidates:candidatePlacements(word,cells)})).filter(choice=>choice.candidates.length)
        .sort((a,b)=>a.candidates.length-b.candidates.length||b.word.length-a.word.length||a.word.localeCompare(b.word));
      for(const choice of choices){
        const nextRemaining=remaining.filter((_,index)=>index!==choice.index);
        for(const candidate of choice.candidates){
          search([...placements,{word:choice.word,r:candidate.r,c:candidate.c,dir:candidate.dir}],nextRemaining);
          if(nodes>=maxNodes||solutions>=maxSolutions)break;
        }
        if(nodes>=maxNodes||solutions>=maxSolutions)break;
      }
    }

    search([first],words.slice(1));
    if(!best)return {ok:false,reason:limited?"search_limit":"no_valid_layout",placements:[],nodes};
    const placements=normalizedPlacements(best);
    return {ok:true,reason:limited?"best_within_limit":null,placements,nodes,score:bestScore,bounds:boundsFor(placements)};
  }

  function validateCrosswordLayout(words,placements){
    const errors=[],expected=words||[],actual=placements||[];
    if(actual.length!==expected.length||new Set(actual.map(item=>item.word)).size!==expected.length||expected.some(word=>!actual.some(item=>item.word===word)))errors.push("everyWordPlacedOnce");
    if(actual.some(item=>item.dir!=="h"&&item.dir!=="v"))errors.push("directionsValid");
    const cells=buildCells(actual);
    if(!cells)errors.push("noConflictsOrSameDirectionOverlap");
    if(cells){
      for(const placement of actual){
        const before={row:placement.r-(placement.dir==="v"?1:0),column:placement.c-(placement.dir==="h"?1:0)};
        const after=point(placement,placement.word.length);
        if(cells.has(key(before.row,before.column))||cells.has(key(after.row,after.column)))errors.push("endcapsClear");
        for(let index=0;index<placement.word.length;index++){
          const p=point(placement,index),cell=cells.get(key(p.row,p.column));
          if(!cell||cell.directions.size===2)continue;
          const sideKeys=placement.dir==="h"?[key(p.row-1,p.column),key(p.row+1,p.column)]:[key(p.row,p.column-1),key(p.row,p.column+1)];
          if(sideKeys.some(sideKey=>cells.has(sideKey)))errors.push("noIllegalAdjacency");
        }
      }
      const wordBySignature=new Set(actual.map(item=>`${item.r},${item.c},${item.dir}:${item.word}`));
      for(const direction of ["h","v"])for(const cellKey of cells.keys()){
        const [r,c]=cellKey.split(",").map(Number),previous=direction==="h"?key(r,c-1):key(r-1,c);
        if(cells.has(previous))continue;
        let text="",length=0;
        while(cells.has(direction==="h"?key(r,c+length):key(r+length,c))){text+=cells.get(direction==="h"?key(r,c+length):key(r+length,c)).letter;length++}
        if(length>1&&!wordBySignature.has(`${r},${c},${direction}:${text}`))errors.push("noUnintendedWords");
      }
      if(actual.length){
        const connectedIndexes=new Set([0]),pending=[0];
        while(pending.length){const current=pending.pop();for(const cell of cells.values())if(cell.words.has(actual[current].word))for(let index=0;index<actual.length;index++)if(cell.words.has(actual[index].word)&&!connectedIndexes.has(index)){connectedIndexes.add(index);pending.push(index)}}
        if(connectedIndexes.size!==actual.length)errors.push("singleConnectedGrid");
      }
    }
    return {valid:errors.length===0,errors:[...new Set(errors)]};
  }

  function wheelFor(words){const counts={};words.forEach(word=>{const own={};[...word].forEach(letter=>own[letter]=(own[letter]||0)+1);Object.entries(own).forEach(([letter,count])=>counts[letter]=Math.max(counts[letter]||0,count))});return Object.entries(counts).flatMap(([letter,count])=>Array(count).fill(letter))}
  function positionFor(placement,index){return {row:placement.r+(placement.dir==="v"?index:0),column:placement.c+(placement.dir==="h"?index:0)}}
  function isCrossingVisible(word,index,words,foundWords,placements){const activePlacements=placements||layoutWords(words),target=activePlacements.find(item=>item.word===word);if(!target)return false;const position=positionFor(target,index);return activePlacements.some(item=>foundWords.has(item.word)&&[...item.word].some((_,i)=>{const other=positionFor(item,i);return other.row===position.row&&other.column===position.column}))}
  function nextHint(words,foundWords,hints,placements){const unfinished=words.filter(word=>!foundWords.has(word));for(const word of unfinished){for(let index=0;index<word.length;index++){if(!hints.has(`${word}:${index}`)&&!isCrossingVisible(word,index,words,foundWords,placements))return {word,index,letter:word[index]}}}return null}
  return {canForm,evaluateWord,layoutWords,solveCrossword,validateCrosswordLayout,wheelFor,isCrossingVisible,nextHint};
});

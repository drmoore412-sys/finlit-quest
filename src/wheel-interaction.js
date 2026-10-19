(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitWheelInteraction=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  function transitionSelection(selected,tileId){
    const current=[...(selected||[])];
    if(tileId===undefined||tileId===null)return{selected:current,action:"ignored"};
    if(current.at(-1)===tileId)return{selected:current,action:"ignored"};
    if(current.length>1&&current.at(-2)===tileId){
      current.pop();
      return{selected:current,action:"backtracked"};
    }
    if(current.includes(tileId))return{selected:current,action:"ignored"};
    current.push(tileId);
    return{selected:current,action:"added"};
  }

  function wordFor(selected,tiles){
    const byId=new Map((tiles||[]).map(tile=>[tile.id,tile.letter]));
    return(selected||[]).map(id=>byId.get(id)||"").join("");
  }

  // Words accepted in EVERY world whenever the current wheel can spell them. They are optional bonus words:
  // they never count toward completion, never pay coins or XP, and are not saved. A word that is also a required
  // answer of the puzzle is classified as that answer first, so its normal reward and progression are untouched.
  const GLOBAL_BONUS_WORDS=Object.freeze(["DUE"]);
  // Same multiset rule as FinLitGameEngine.canForm: every letter must be available, repeats need repeated tiles.
  function canSpell(word,letters){
    const available=[...(letters||[])];
    return [...String(word||"")].every(letter=>{const index=available.indexOf(letter);if(index<0)return false;available.splice(index,1);return true});
  }
  function isGlobalBonus(word,options){return GLOBAL_BONUS_WORDS.includes(word)&&canSpell(word,options&&options.wheelLetters)}
  function classifyWord(word,targetWords,foundWords,options){
    if(!word)return{status:"empty"};
    if(foundWords&&foundWords.has(word))return{status:"duplicate",word};
    if((targetWords||[]).includes(word))return{status:"target",word};
    if(isGlobalBonus(word,options))return options.foundBonus&&options.foundBonus.has(word)?{status:"duplicate",word,bonus:true}:{status:"bonus",word};
    return{status:"invalid",word};
  }

  function canSubmitTapWord(word,targetWords,foundWords,options){
    const targets=targetWords||[],found=foundWords||new Set();
    const isAnswer=targets.includes(word)||found.has(word)||isGlobalBonus(word,options);
    const extendsToUnfinishedAnswer=targets.some(candidate=>candidate!==word&&candidate.startsWith(word)&&!found.has(candidate));
    return isAnswer&&!extendsToUnfinishedAnswer;
  }

  // A required word that is also the start of a longer, still-unfound required
  // word (PAY / PAYMENT) is not auto-submitted by taps, so the player can keep
  // building the longer word. Without another way to confirm it, a player who
  // only taps could never submit the shorter word, which looked like a correct
  // answer being rejected. isDeferredTarget() identifies exactly that state so
  // the UI can say so, and shouldSubmitOnRetap() is the confirmation: tapping
  // the last selected tile again submits the pending word. Swipe release and
  // keyboard Enter continue to work exactly as before.
  function isDeferredTarget(word,targetWords,foundWords){
    const targets=targetWords||[],found=foundWords||new Set();
    return Boolean(word)&&targets.includes(word)&&!found.has(word)&&!canSubmitTapWord(word,targets,found);
  }
  function shouldSubmitOnRetap(retappedLastTile,word,targetWords,foundWords,options){
    if(!retappedLastTile)return false;
    if(isDeferredTarget(word,targetWords,foundWords))return true;
    const targets=targetWords||[],found=foundWords||new Set();
    return isGlobalBonus(word,options)&&!targets.includes(word)&&targets.some(candidate=>candidate.startsWith(word)&&!found.has(candidate));
  }

  function shuffledOrder(tiles,shuffleFn){
    const source=[...(tiles||[])];
    if(source.length<2)return source;
    let next=shuffleFn(source);
    for(let attempt=0;attempt<4&&next.every((tile,index)=>tile.id===source[index].id);attempt++)next=shuffleFn(source);
    if(next.every((tile,index)=>tile.id===source[index].id))next=[...source.slice(1),source[0]];
    return next;
  }

  function positionsFor(tileCount,radius=.38){
    if(!Number.isInteger(tileCount)||tileCount<1||tileCount>9)throw new RangeError("Letter wheels support 1-9 physical tiles.");
    return Array.from({length:tileCount},(_,index)=>{
      const angle=Math.PI*2*index/tileCount-Math.PI/2;
      return{x:.5+radius*Math.cos(angle),y:.5+radius*Math.sin(angle)};
    });
  }

  return{GLOBAL_BONUS_WORDS,canSpell,transitionSelection,wordFor,classifyWord,canSubmitTapWord,isDeferredTarget,shouldSubmitOnRetap,shuffledOrder,positionsFor};
});

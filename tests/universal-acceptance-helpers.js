// Shared harness for the universal word acceptance + currency bonus tests and the audit script. Not a test file.
// It executes the REAL runtime functions copied out of word-game-app.js (wgBuildWordContext, wgWordOptions, wgCanSubmitTapWord, wgSubmitWord)
// together with the real src modules, with only the DOM/audio/reward side effects stubbed, so a word is judged exactly as it is in gameplay.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {ROOT}=require("./helpers.js");
const H=require("./unified-release-helpers.js");
const Engine=require("../src/game-engine.js"),Bank=require("../src/puzzle-bank-engine.js"),Wheel=require("../src/wheel-interaction.js"),Vocab=require("../src/universal-vocabulary.js"),Currency=require("../src/currency-bonus.js");

const appSource=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
function grabFunction(source,name){
  const start=source.indexOf(`function ${name}(`);
  if(start<0)throw new Error("runtime function not found: "+name);
  let depth=0,i=source.indexOf("{",start);const open=i;
  for(;i<source.length;i++){const ch=source[i];if(ch==="{")depth++;else if(ch==="}"){depth--;if(depth===0)break}}
  return source.slice(start,i+1);
}
const RUNTIME_FUNCTIONS=["wgWordOptions","wgBuildWordContext","wgCanSubmitTapWord","wgSubmitWord","wgLayout","wgCurrencyPlacement","wgGridCells","wgCurrencyDefinition","wgHintPattern","wgIsLetterVisible","wgIsCurrencyAnswer","wgCurrencyAnswerReward"];
const runtimeSource=RUNTIME_FUNCTIONS.map(name=>grabFunction(appSource,name)).join("\n");

// One simulated play session of one puzzle through the real runtime functions.
function session(puzzle,modelOverride){
  const model=modelOverride||Bank.puzzleModel(puzzle);
  const log={feedback:[],toasts:[],found:[],audio:[],gridRenders:0};
  const wgState={puzzle,puzzleModel:model,words:model.words,found:new Set(),foundBonus:new Set(),tries:{},selected:[],pending:""};
  const context={
    FinLitWheelInteraction:Wheel,FinLitUniversalVocabulary:Vocab,FinLitCurrencyBonus:Currency,wgState,
    wgSelectedWord:()=>wgState.pending,wgClearSelection:()=>{},
    wgShowWordFeedback:(message,status)=>log.feedback.push({message,status}),
    wgAudio:{duplicate:()=>log.audio.push("duplicate"),wrong:()=>log.audio.push("wrong")},
    toast:message=>log.toasts.push(message),
    wgFoundWord:word=>{wgState.found.add(word);log.found.push(word)},
    FinLitGameEngine:Engine,FinLitPuzzleBank:Bank,
    // the grid redraw is recorded through the real cell model (wgGridCells); tests read it through grid()
    wgRenderGrid:()=>{log.gridRenders++;wgState.lastFoundWord=null},
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(runtimeSource+"\nthis.wgCurrencyPlacement=wgCurrencyPlacement;this.wgGridCells=wgGridCells;this.wgCurrencyDefinition=wgCurrencyDefinition;this.wgCurrencyAnswerReward=wgCurrencyAnswerReward;this.wgIsCurrencyAnswer=wgIsCurrencyAnswer;this.wgHintPattern=wgHintPattern;this.wgBuildWordContext=wgBuildWordContext;this.wgWordOptions=wgWordOptions;this.wgCanSubmitTapWord=wgCanSubmitTapWord;this.wgSubmitWord=wgSubmitWord;",context);
  wgState.wordContext=context.wgBuildWordContext(puzzle,model);
  // as when the puzzle opens: the stored layout, then the currency entry (wgRenderPuzzle order)
  wgState.placements=(puzzle.layout||[]).map(item=>({...item}));
  wgState.currencyPlacement=context.wgCurrencyPlacement(puzzle,model,wgState.wordContext.currency);
  if(wgState.currencyPlacement)wgState.words=[...model.words,wgState.currencyPlacement.word]; // as wgRenderPuzzle: the code is a required answer
  wgState.hints=new Set();
  const grid=()=>context.wgGridCells();
  // submit one word exactly as gameplay does; returns what the player saw
  function submit(word){
    const before={feedback:log.feedback.length,toasts:log.toasts.length,found:log.found.length};
    wgState.pending=word;context.wgSubmitWord();
    const toast=log.toasts.slice(before.toasts).pop()||null,feedback=log.feedback.slice(before.feedback).pop()||null,foundNow=log.found.length>before.found;
    let outcome;
    if(foundNow)outcome="required";
    else if(toast==="Already found")outcome="duplicate";
    else if(toast==="Not in this puzzle")outcome="rejected";
    else if(toast&&toast.startsWith("Currency bonus:"))outcome="currency";
    else if(toast==="Bonus word — no coins or XP")outcome="bonus";
    else outcome="other:"+toast;
    return{outcome,toast,feedback};
  }
  return{puzzle,model,state:wgState,log,submit,options:()=>context.wgWordOptions(),grid,definition:()=>context.wgCurrencyDefinition(),currencyReward:(word,record)=>JSON.parse(JSON.stringify(context.wgCurrencyAnswerReward(word,record))),hintPattern:w=>context.wgHintPattern(w),canTap:word=>context.wgCanSubmitTapWord(word)};
}

// The 61 released levels exactly as the loader resolves them (canonical library + the sequence/revision files).
function activePuzzles(){
  const levels=structuredClone(require("../content/unified-levels-v2.js"));
  const library=new Map([...H.canonicalMap(),...levels.puzzles.map(p=>[p.id,p])]);
  return levels.manifest.entries.map(entry=>{const puzzle=library.get(entry.puzzleId);if(!puzzle)throw new Error("missing "+entry.puzzleId);return puzzle});
}
module.exports={ROOT,appSource,runtimeSource,grabFunction,session,activePuzzles,Bank,Wheel,Vocab,Currency};

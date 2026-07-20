(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitDifficultyScorer=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const RARE_LETTERS=new Set(["J","K","Q","V","W","X","Y","Z"]);
  const BANDS=[{max:25,label:"Easy"},{max:50,label:"Medium"},{max:75,label:"Hard"},{max:Infinity,label:"Expert"}];

  function averageLength(words){if(!words||!words.length)return 0;return words.reduce((sum,w)=>sum+w.length,0)/words.length}

  function scoreDifficulty(candidate){
    const letters=candidate.letters||[];
    const requiredWords=candidate.requiredWords||[];
    const bonusWords=candidate.bonusWords||[];
    const focusWord=candidate.focusWord||"";

    let raw=0;
    raw+=Math.max(0,letters.length-4)*2;
    raw+=letters.filter(l=>RARE_LETTERS.has(l)).length*6;
    raw+=Math.max(0,averageLength(requiredWords)-4)*3;
    raw+=bonusWords.length*2;
    raw+=Math.max(0,focusWord.length-5)*2;

    const score=Math.round(Math.max(0,Math.min(100,raw)));
    const difficulty=BANDS.find(band=>score<=band.max).label;
    return {score,difficulty};
  }

  return {scoreDifficulty,RARE_LETTERS:[...RARE_LETTERS],BANDS:BANDS.map(b=>({...b}))};
});

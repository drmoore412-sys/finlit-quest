(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitHintGenerator=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  function firstClause(definition){
    const text=String(definition||"").trim();
    if(!text)return "";
    const match=text.match(/^[^.;]+[.;]?/);
    return (match?match[0]:text).replace(/[.;]+$/,"").trim();
  }

  const STRATEGIES={
    "definition-clause":(candidate)=>{
      const word=String(candidate.focusWord||"");
      const clause=firstClause(candidate.definition);
      if(!word||!clause)return "";
      return `A ${word.length}-letter word. ${clause}.`;
    }
  };

  function generateHint(candidate,strategy="definition-clause"){
    const fn=STRATEGIES[strategy];
    if(!fn)throw new Error(`Unknown hint strategy '${strategy}'.`);
    return fn(candidate);
  }

  return {generateHint,firstClause,STRATEGIES:Object.keys(STRATEGIES)};
});

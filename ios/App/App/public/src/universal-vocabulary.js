// Universal approved-financial-term vocabulary: the approved curriculum terms that fit a wheel, shared by every puzzle in every world.
// (General English words are intentionally not part of it.) A word is accepted in a puzzle when (1) it is in this vocabulary, (2) the puzzle's wheel can spell it with its exact letter counts,
// and (3) it is at least the approved minimum length (3). It never depends on which world introduced the word.
// This module only answers "is this word valid for this wheel?". Whether a word is a required answer, a bonus word or the currency bonus is
// decided by FinLitWheelInteraction.classifyWord, so required answers, rewards and progression are untouched.
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitUniversalVocabulary=api})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const MIN_LENGTH=3,MAX_LENGTH=9;
  const split=value=>Array.isArray(value)?value:String(value||"").split(" ").filter(Boolean);
  function create(data){
    const financial=new Set(split(data&&data.financial)),general=new Set(split(data&&data.general));
    const cache=new Map();
    const counts=word=>{const c=Object.create(null);for(const ch of word)c[ch]=(c[ch]||0)+1;return c};
    function kindOf(word){return financial.has(word)?"financial":general.has(word)?"general":null}
    function has(word){return financial.has(word)||general.has(word)}
    // every vocabulary word the wheel can spell (multiset rule: repeats need repeated tiles), memoized per letter set
    function eligible(letters){
      const key=[...(letters||[])].map(String).map(s=>s.toUpperCase()).sort().join("");
      if(cache.has(key))return cache.get(key);
      const have=counts(key),out=[];
      const scan=set=>{for(const word of set){
        if(word.length<MIN_LENGTH||word.length>key.length)continue;
        let ok=true;const need=Object.create(null);
        for(const ch of word){need[ch]=(need[ch]||0)+1;if(need[ch]>(have[ch]||0)){ok=false;break}}
        if(ok)out.push(word);
      }};
      scan(financial);scan(general);out.sort();
      cache.set(key,out);return out;
    }
    return Object.freeze({has,kindOf,eligible,size:financial.size+general.size,financialCount:financial.size,generalCount:general.size});
  }

  let shared=null;
  function defaultInstance(){
    if(shared)return shared;
    let data=root.FINLIT_UNIVERSAL_VOCABULARY||null;
    if(!data&&typeof require==="function"){try{data=require("../content/universal-vocabulary-v1.json")}catch(error){data=null}}
    shared=create(data||{financial:[],general:[]});return shared;
  }
  return {MIN_LENGTH,MAX_LENGTH,create,shared:defaultInstance};
});

// Three-letter currency bonus (owner assignment 2026-11-18). Every puzzle can have at most ONE designated ISO 4217 code that its wheel can spell.
// The code is a special optional bonus: it is never required for completion, pays nothing extra (it uses the existing bonus-word recognition:
// a message, no coins and no XP) and can be recognised only once per puzzle. Wheels, key terms and required answers are never changed to fit a code.
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitCurrencyBonus=api})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  // The 20 owner-approved candidate codes, verified against ISO 4217 (names as shown to the player).
  const POOL=Object.freeze([
    ["NIO","Nicaraguan córdoba"],["INR","Indian rupee"],["AED","UAE dirham"],["RON","Romanian leu"],["IDR","Indonesian rupiah"],
    ["SAR","Saudi riyal"],["ARS","Argentine peso"],["TRY","Turkish lira"],["EUR","Euro"],["PEN","Peruvian sol"],
    ["SCR","Seychellois rupee"],["CAD","Canadian dollar"],["NPR","Nepalese rupee"],["AUD","Australian dollar"],["LSL","Lesotho loti"],
    ["NAD","Namibian dollar"],["KES","Kenyan shilling"],["SEK","Swedish krona"],["NOK","Norwegian krone"],["USD","United States dollar"],
  ].map(([code,name])=>Object.freeze({code,name})));
  const CODES=Object.freeze(POOL.map(c=>c.code));
  // Nine further owner-approved ISO 4217 codes (2026-11-18). They are NOT part of the automatic pool: each is used only on the
  // puzzle(s) it is designated for below, so the 41 automatic assignments from the 20-code pool are unchanged.
  const DESIGNATED_POOL=Object.freeze([
    ["AFN","Afghan afghani"],["ERN","Eritrean nakfa"],["BDT","Bangladeshi taka"],["HTG","Haitian gourde"],["AOA","Angolan kwanza"],
    ["XAF","Central African CFA franc"],["ALL","Albanian lek"],["UAH","Ukrainian hryvnia"],["PKR","Pakistani rupee"],
  ].map(([code,name])=>Object.freeze({code,name})));
  // The ten owner-approved designated assignments (puzzle id -> code). These puzzles have no code from the 20-code pool.
  const DESIGNATED=Object.freeze({
    "FQ-V3:business:FREELANCE:R1":"AFN","FQ-V3:business:BREAKEVEN:R1":"ERN","FQ-V3:moneybasics:BUDGET:R2":"BDT","FQ-V3:investing:GROWTH:R2":"HTG",
    "FQ-V3:credit:AUTOPAY:R1":"AOA","FQ-V3:taxes:TAXFILING:R1":"XAF","FQ-V3:insurance:LIABILITY:R1":"ALL","FQ-V3:insurance:CASHVALUE:R1":"UAH",
    "FQ-V3:coins:PROOFLIKE:R1":"PKR","FQ-V3:coins:MELTVALUE:R1":"ALL",
  });
  const NAMES=Object.freeze(Object.fromEntries([...POOL,...DESIGNATED_POOL].map(c=>[c.code,c.name])));
  const ALL_CODES=Object.freeze(Object.keys(NAMES));

  // same multiset rule as FinLitGameEngine.canForm: every letter must be on the wheel, repeats need repeated tiles (LSL needs two L tiles)
  function canSpell(word,letters){
    const available=[...(letters||[])].map(l=>String(l).toUpperCase());
    return[...String(word||"")].every(letter=>{const index=available.indexOf(letter);if(index<0)return false;available.splice(index,1);return true});
  }
  function hash(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h>>>0}
  // codes the wheel can spell that are not already a required answer (a required answer is credited as that answer, so no duplicate credit)
  function eligibleCodes(letters,requiredWords){
    const required=new Set(requiredWords||[]);
    return CODES.filter(code=>!required.has(code)&&canSpell(code,letters));
  }
  // Deterministic assignment across an ordered set of puzzles, preferring variety: each puzzle takes the eligible code used the fewest times so far;
  // ties are broken by a fixed hash of puzzleId+code, so the result depends only on the ordered puzzle list.
  function assign(puzzles){
    const used=Object.fromEntries(CODES.map(code=>[code,0])),assignments={};
    for(const puzzle of puzzles){
      const designated=DESIGNATED[puzzle.id];
      if(designated){
        if(!canSpell(designated,puzzle.letters)||(puzzle.requiredWords||[]).includes(designated))throw new Error(`designated ${designated} does not fit ${puzzle.id}`);
        assignments[puzzle.id]=designated;continue; // not counted in the pool usage, so the automatic picks elsewhere do not move
      }
      const options=eligibleCodes(puzzle.letters,puzzle.requiredWords);
      if(!options.length){assignments[puzzle.id]=null;continue}
      options.sort((a,b)=>used[a]-used[b]||hash(puzzle.id+":"+a)-hash(puzzle.id+":"+b)||a.localeCompare(b));
      assignments[puzzle.id]=options[0];used[options[0]]++;
    }
    return assignments;
  }
  let manifest;
  function loadManifest(){
    if(manifest!==undefined)return manifest;
    let data=root.FINLIT_CURRENCY_BONUS||null;
    if(!data&&typeof require==="function"){try{data=require("../content/currency-bonus-v1.json")}catch(error){data=null}}
    manifest=data;return manifest;
  }
  // The designated code of one puzzle, or null. Puzzles in the generated manifest use their recorded assignment (re-checked against the wheel);
  // any other puzzle (for example a generated Credit or Crypto bank puzzle) gets a pure deterministic pick from its own eligible codes.
  function forPuzzle(puzzle,dataOverride){
    if(!puzzle||!puzzle.id)return null;
    const letters=puzzle.letters||[],data=dataOverride||loadManifest();
    let code;
    if(data&&data.assignments&&Object.prototype.hasOwnProperty.call(data.assignments,puzzle.id)){
      code=data.assignments[puzzle.id];
      if(code&&(!canSpell(code,letters)||(puzzle.requiredWords||[]).includes(code)))code=null;
    }else{
      const options=eligibleCodes(letters,puzzle.requiredWords);
      code=options.length?options.slice().sort((a,b)=>hash(puzzle.id+":"+a)-hash(puzzle.id+":"+b)||a.localeCompare(b))[0]:null;
    }
    return code?{code,name:NAMES[code]}:null;
  }
  return {POOL,CODES,DESIGNATED_POOL,DESIGNATED,ALL_CODES,NAMES,canSpell,hash,eligibleCodes,assign,forPuzzle};
});

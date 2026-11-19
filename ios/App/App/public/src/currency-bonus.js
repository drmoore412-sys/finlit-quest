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
  // Owner-approved substitutions for puzzles whose assigned code has no valid crossword placement (2026-11-19).
  const GRID_SUBSTITUTIONS=Object.freeze({
    "FQ-V3:moneybasics:REFUND:R1":"ERN","FQ-V3:banking:CONVERT:R2":"ERN","FQ-V3:real_estate:REFINANCE:R1":"AFN","FQ-V3:coins:COINGRADE:R1":"CAD",
  });
  const NAMES=Object.freeze(Object.fromEntries([...POOL,...DESIGNATED_POOL].map(c=>[c.code,c.name])));
  const ALL_CODES=Object.freeze(Object.keys(NAMES));
  // Definitions for the currency entries (owner format 2026-11-19): "[Country] — Currency code for [currency name]", with a region for a
  // shared currency. Shown in the puzzle's Definitions section and the end-of-level list. NOT curriculum terms: they live here only.
  const COUNTRIES=Object.freeze({
    NIO:"Nicaragua",INR:"India",AED:"United Arab Emirates",RON:"Romania",IDR:"Indonesia",SAR:"Saudi Arabia",ARS:"Argentina",TRY:"Türkiye",
    EUR:"Eurozone",PEN:"Peru",SCR:"Seychelles",CAD:"Canada",NPR:"Nepal",AUD:"Australia",LSL:"Lesotho",NAD:"Namibia",KES:"Kenya",
    SEK:"Sweden",NOK:"Norway",USD:"United States",AFN:"Afghanistan",ERN:"Eritrea",BDT:"Bangladesh",HTG:"Haiti",AOA:"Angola",
    XAF:"Central Africa",ALL:"Albania",UAH:"Ukraine",PKR:"Pakistan",
  });
  function countryFor(code){return Object.prototype.hasOwnProperty.call(COUNTRIES,code)?COUNTRIES[code]:null}
  function definitionFor(code){const country=countryFor(code);return country&&NAMES[code]?`${country} — Currency code for ${NAMES[code]}`:null}

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
    // Owner-approved substitutions (2026-11-19): the assigned code could not be placed in the crossword grid, so another approved
    // code that fits is used. Applied after the automatic picks, so no other puzzle's assignment moves.
    for(const puzzle of puzzles){
      const substitute=GRID_SUBSTITUTIONS[puzzle.id];
      if(!substitute)continue;
      if(!canSpell(substitute,puzzle.letters)||(puzzle.requiredWords||[]).includes(substitute))throw new Error(`substitute ${substitute} does not fit ${puzzle.id}`);
      assignments[puzzle.id]=substitute;
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
  // ---- crossword grid entry (owner correction 2026-11-18): the code gets its own three squares in the puzzle's crossword ----
  // Deterministic search over every crossing with an existing answer. A candidate is accepted only if the puzzle's own layout plus
  // the code still passes the game's crossword validator (validateFn = FinLitGameEngine.validateCrosswordLayout): matching letters at
  // crossings, clear end caps, no side-by-side letters, no unintended words, connected. Smallest grid growth wins, then position.
  // The puzzle layout is never changed; the code's placement is stored separately in the generated manifest.
  function gridBounds(placements){
    let r0=Infinity,c0=Infinity,r1=-Infinity,c1=-Infinity;
    placements.forEach(p=>{for(let i=0;i<p.word.length;i++){const r=p.r+(p.dir==="v"?i:0),c=p.c+(p.dir==="h"?i:0);r0=Math.min(r0,r);c0=Math.min(c0,c);r1=Math.max(r1,r);c1=Math.max(c1,c)}});
    return {rows:r1-r0+1,columns:c1-c0+1};
  }
  function findGridPlacement(code,layout,requiredWords,validateFn){
    const base=gridBounds(layout),area=b=>b.rows*b.columns,candidates=[];
    for(const q of layout)for(let b=0;b<q.word.length;b++)for(let a=0;a<code.length;a++){
      if(code[a]!==q.word[b])continue;
      const dir=q.dir==="h"?"v":"h",candidate={word:code,r:q.r+(q.dir==="v"?b:0)-(dir==="v"?a:0),c:q.c+(q.dir==="h"?b:0)-(dir==="h"?a:0),dir};
      if(!validateFn([...requiredWords,code],[...layout,candidate]).valid)continue;
      candidates.push({candidate,growth:area(gridBounds([...layout,candidate]))-area(base)});
    }
    candidates.sort((x,y)=>x.growth-y.growth||x.candidate.r-y.candidate.r||x.candidate.c-y.candidate.c||(x.candidate.dir<y.candidate.dir?-1:x.candidate.dir>y.candidate.dir?1:0));
    return candidates.length?candidates[0].candidate:null;
  }
  // The stored grid placement of a puzzle's currency code ({word,r,c,dir} in the puzzle layout's coordinates), or null.
  function placementFor(puzzleId,dataOverride){
    const data=dataOverride||loadManifest(),placement=data&&data.placements&&puzzleId?data.placements[puzzleId]:null;
    return placement?{word:placement.word,r:placement.r,c:placement.c,dir:placement.dir}:null;
  }
  return {POOL,CODES,DESIGNATED_POOL,DESIGNATED,GRID_SUBSTITUTIONS,COUNTRIES,countryFor,definitionFor,ALL_CODES,NAMES,gridBounds,findGridPlacement,placementFor,canSpell,hash,eligibleCodes,assign,forPuzzle};
});

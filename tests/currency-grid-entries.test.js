// Owner correction 2026-11-18: each eligible puzzle's assigned currency code is an actual three-square crossword entry. The squares
// are on the grid from the moment the puzzle opens and fill when the player spells the code; the full currency name is shown.
// The code stays optional and pays nothing. Puzzle layouts are never edited: the entry is stored in content/currency-bonus-v1.json.
// Drives the real word-game-app.js functions (wgCurrencyPlacement, wgGridCells, wgSubmitWord) for all 61 released puzzles.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const X=require("./universal-acceptance-helpers.js");
const {session,activePuzzles,Currency,ROOT}=X;
const Engine=require("../src/game-engine.js");
const puzzles=activePuzzles(),byAnchor=a=>puzzles.find(p=>p.anchorWord===a);
const doc=JSON.parse(fs.readFileSync(path.join(ROOT,"content/currency-bonus-v1.json"),"utf8"));
const NOT_PLACED={};
// LONGEVITY: owner-approved layout adjustment (2026-11-19) moved LONG so NIO fits; recorded in answer-expansion-v1.json layoutAdjustments
const SUBSTITUTED={REFUND:["EUR","ERN"],CONVERT:["RON","ERN"],REFINANCE:["INR","AFN"],COINGRADE:["NAD","CAD"]}; // owner-approved 2026-11-19
const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");

test("the manifest is current: all 51 assigned codes have a grid entry; nothing is forced",()=>{
  // freshness of content/currency-bonus-v1.json is checked by universal-word-acceptance.test.js (build-currency-bonus.mjs check)
  const assigned=Object.entries(doc.assignments).filter(([,c])=>c);
  assert.equal(assigned.length,51);assert.equal(Object.keys(doc.placements).length,51);
  assert.deepEqual(doc.placements["FQ-V3:retirement:LONGEVITY:R1"],{word:"NIO",r:0,c:1,dir:"v"});
  const adj=JSON.parse(read("content/answer-expansion-v1.json")).layoutAdjustments;assert.deepEqual(adj.map(a=>[a.puzzleId,a.word,a.to]),[["FQ-V3:retirement:LONGEVITY:R1","LONG",{r:2,c:0,dir:"v"}]]);
  Object.entries(SUBSTITUTED).forEach(([anchor,[,code]])=>{const p=byAnchor(anchor);assert.equal(doc.assignments[p.id],code,anchor);assert.equal(Currency.GRID_SUBSTITUTIONS[p.id],code);assert.ok(doc.placements[p.id],anchor+" placed")});
  Object.entries(doc.placements).forEach(([id,p])=>assert.equal(p.word,doc.assignments[id],id));
  assert.deepEqual(Object.fromEntries(doc.notPlaced.map(n=>[n.anchor,n.code])),NOT_PLACED);
  doc.notPlaced.forEach(n=>{const p=puzzles.find(x=>x.id===n.id);assert.equal(Currency.findGridPlacement(n.code,p.layout,X.Bank.puzzleModel(p).words,Engine.validateCrosswordLayout),null,n.anchor)});
});

test("every placed code is a real three-square entry on the opened grid, crossing an existing answer under the crossword rules",()=>{
  let placed=0;
  puzzles.forEach(p=>{
    const s=session(p),entry=s.state.currencyPlacement,code=doc.assignments[p.id];
    if(!doc.placements[p.id]){assert.equal(entry,null,p.anchorWord);assert.ok(s.grid().every(c=>!c.currency),p.anchorWord);return}
    placed++;assert.deepEqual(entry,doc.placements[p.id]);assert.equal(entry.word,code);
    assert.equal(Engine.validateCrosswordLayout([...s.model.words,code],[...p.layout,entry]).valid,true,p.anchorWord);
    const cells=s.grid(),codeCells=cells.filter(c=>c.currency);
    assert.equal(codeCells.length,3,`${p.anchorWord}: three squares`);
    assert.ok(codeCells.some(c=>c.words.length>1),`${p.anchorWord}: crosses an existing answer`);
    const ordered=[...codeCells].sort((a,b)=>entry.dir==="h"?a.c-b.c:a.r-b.r);assert.equal(ordered.map(c=>c.letter).join(""),code);
    assert.ok(codeCells.every(c=>!c.filled),"empty squares when the puzzle opens");
    // every existing answer keeps all its squares with the same letters
    p.layout.forEach(q=>assert.equal(cells.filter(c=>c.words.includes(q.word)).map(c=>c.letter).sort().join(""),[...q.word].sort().join(""),`${p.anchorWord}: ${q.word}`));
  });
  assert.equal(placed,51);
});

test("spelling the code fills its three squares, shows the full currency name, pays nothing and never blocks completion",()=>{
  puzzles.filter(p=>doc.placements[p.id]).forEach(p=>{
    const s=session(p),code=doc.assignments[p.id],name=Currency.NAMES[code];
    const r=s.submit(code);
    assert.equal(r.outcome,"currency");assert.equal(r.toast,`Currency bonus: ${code} · ${name}`);assert.equal(r.feedback.message,`${code} — ${name}`);
    assert.ok(s.log.gridRenders>=1,"the grid is redrawn");
    assert.ok(s.grid().filter(c=>c.currency).every(c=>c.filled),`${p.anchorWord}: squares filled`);
    assert.deepEqual(s.log.found,[],"no reward path");assert.equal(s.state.found.size,0,"not counted toward completion");
    assert.equal(s.submit(code).outcome,"duplicate","recognised once");
    assert.ok(s.grid().filter(c=>c.currency).every(c=>c.filled),"stays filled");
    s.model.words.forEach(w=>assert.equal(s.submit(w).outcome,"required"));
    assert.equal(s.state.found.size,s.model.words.length,"completes with the required answers");
    // and a puzzle completes without ever finding the code
    const t=session(p);t.model.words.forEach(w=>t.submit(w));assert.equal(t.state.found.size,t.model.words.length);
    assert.ok(t.grid().filter(c=>c.currency&&c.words.length===1).every(c=>!c.filled),"the code's own squares stay empty if it was not found");
  });
});

test("puzzle content is untouched and the banner is gone",()=>{
  const lib=X.activePuzzles();lib.forEach(p=>{const s=session(p);assert.deepEqual(s.state.placements,p.layout,`${p.anchorWord} layout`)});
  ["index.html","word-game-app.js","word-game.css","mobile-polish.css"].forEach(f=>assert.ok(!/wgCurrencyCode|wg-currency-code|wgRenderCurrencyCode/.test(read(f)),f));
  assert.match(read("word-game-app.js"),/wgState\.currencyPlacement = wgCurrencyPlacement\(puzzle, model, wgState\.wordContext\.currency\);/);
});

// ---- currency entries in the Definitions section and the end-of-level list (owner instruction 2026-11-19) ----
const COUNTRY={NIO:"Nicaragua",INR:"India",AED:"United Arab Emirates",RON:"Romania",IDR:"Indonesia",SAR:"Saudi Arabia",ARS:"Argentina",TRY:"Türkiye",EUR:"Eurozone",PEN:"Peru",SCR:"Seychelles",CAD:"Canada",NPR:"Nepal",AUD:"Australia",LSL:"Lesotho",NAD:"Namibia",KES:"Kenya",SEK:"Sweden",NOK:"Norway",USD:"United States",AFN:"Afghanistan",ERN:"Eritrea",BDT:"Bangladesh",HTG:"Haiti",AOA:"Angola",XAF:"Central Africa",ALL:"Albania",UAH:"Ukraine",PKR:"Pakistan"};
const DEFINITION=code=>`${COUNTRY[code]} — Currency code for ${Currency.NAMES[code]}`;

test("every one of the 51 currency entries is defined as \"[Country] — Currency code for [currency name]\"; codes stay out of the curriculum",()=>{
  assert.deepEqual({...Currency.COUNTRIES},COUNTRY);
  [["CAD","Canada — Currency code for Canadian dollar"],["USD","United States — Currency code for United States dollar"],["AFN","Afghanistan — Currency code for Afghan afghani"],["ERN","Eritrea — Currency code for Eritrean nakfa"],["INR","India — Currency code for Indian rupee"]].forEach(([c,d])=>assert.equal(Currency.definitionFor(c),d,"owner example "+c));assert.equal(Object.keys(COUNTRY).length,Currency.ALL_CODES.length);
  const A=require("../src/answer-expansion.js"),dictionary=A.loadDictionary(ROOT);
  let defined=0;
  puzzles.forEach(p=>{
    const s=session(p),code=doc.assignments[p.id];
    if(!doc.placements[p.id]){assert.equal(s.definition(),null,p.anchorWord);return}
    defined++;
    assert.deepEqual(JSON.parse(JSON.stringify(s.definition())),{word:code,definition:DEFINITION(code),found:false},p.anchorWord);
    assert.equal(s.hintPattern(code),"_ _ _","the clue shows the pattern while unsolved");
    assert.equal(dictionary.has(code),false,`${code} is not a curriculum term`);
    s.submit(code);assert.deepEqual(JSON.parse(JSON.stringify(s.definition())),{word:code,definition:DEFINITION(code),found:true});
    // a crossing required answer reveals its shared letter in the code's pattern, like any other clue
    const t=session(p),crossing=t.grid().find(c=>c.currency&&c.words.length>1),other=crossing.words.find(w=>w!==code);
    t.submit(other);const i=[...t.grid().filter(c=>c.currency)].sort((a,b)=>doc.placements[p.id].dir==="h"?a.c-b.c:a.r-b.r).indexOf(crossing);
    assert.equal(t.hintPattern(code).split(" ")[i],code[i],`${p.anchorWord}: crossing letter shown`);
  });
  assert.equal(defined,51);
});

test("wiring: the definition is added to the existing Definitions list and the end-of-level list, in their existing formats",()=>{
  const app=read("word-game-app.js"),defs=app.slice(app.indexOf("function wgRenderDefinitionsList()"),app.indexOf("function wgRenderWheel("));
  assert.match(defs,/const currency = wgCurrencyDefinition\(\);[\s\S]*item\.className = `clue \$\{currency\.found \? "found" : ""\}`;[\s\S]*clue-number[\s\S]*clue-answer[\s\S]*list\.append\(item\);/);
  const done=app.slice(app.indexOf("function wgShowPuzzleComplete()"),app.indexOf("learningSummary.unresolved.forEach"));
  assert.match(done,/const currency = wgCurrencyDefinition\(\);[\s\S]*item\.className = "wg-complete-term";[\s\S]*heading\.textContent = currency\.word;[\s\S]*definition\.textContent = currency\.definition;/);
  assert.ok(!/termProgress|recordPuzzleSolved|learning\./.test(done.slice(done.indexOf("const currency = wgCurrencyDefinition"))),"no learning record for the code");
});

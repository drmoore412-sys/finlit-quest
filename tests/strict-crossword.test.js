const test=require("node:test"),assert=require("node:assert/strict");
const {solveCrossword,validateCrosswordLayout,wheelFor}=require("../src/game-engine.js");

const BUDGET_WORDS=["BUDGET","BUDGE","DUET","BED","BUG","TUG","TUB","GET"];

test("strict solver builds the eight-answer BUDGET fixture as one legal connected grid",()=>{
  const result=solveCrossword(BUDGET_WORDS);
  assert.equal(result.ok,true,result.reason);
  assert.equal(result.placements.length,8);
  assert.deepEqual(validateCrosswordLayout(BUDGET_WORDS,result.placements),{valid:true,errors:[]});
  assert.ok(result.bounds.rows<=11&&result.bounds.columns<=11,"fixture should remain compact enough for mobile scaling");
});

test("every continuous across/down sequence is exactly one intended BUDGET answer",()=>{
  const result=solveCrossword(BUDGET_WORDS),cells=new Map();
  result.placements.forEach(placement=>[...placement.word].forEach((letter,index)=>{
    const row=placement.r+(placement.dir==="v"?index:0),column=placement.c+(placement.dir==="h"?index:0);
    cells.set(`${row},${column}`,letter);
  }));
  const sequences=[];
  for(const direction of ["h","v"])for(const cellKey of cells.keys()){
    const [row,column]=cellKey.split(",").map(Number);
    const previous=direction==="h"?`${row},${column-1}`:`${row-1},${column}`;
    if(cells.has(previous))continue;
    let word="",offset=0;
    while(cells.has(direction==="h"?`${row},${column+offset}`:`${row+offset},${column}`)){
      word+=cells.get(direction==="h"?`${row},${column+offset}`:`${row+offset},${column}`);offset++;
    }
    if(word.length>1)sequences.push(word);
  }
  assert.deepEqual(sequences.sort(),[...BUDGET_WORDS].sort());
});

test("BUDGET fixture uses the exact minimal six-tile wheel",()=>{
  assert.deepEqual(wheelFor(BUDGET_WORDS).sort(),[..."BUDGET"].sort());
});

test("strict solver is deterministic for identical input and limits",()=>{
  const first=solveCrossword(BUDGET_WORDS,{maxNodes:50000,maxSolutions:250});
  const second=solveCrossword(BUDGET_WORDS,{maxNodes:50000,maxSolutions:250});
  assert.deepEqual(second.placements,first.placements);
  assert.equal(second.nodes,first.nodes);
});

test("strict solver reports an impossible disconnected vocabulary instead of adding fallback rows",()=>{
  const result=solveCrossword(["ABC","DEF"]);
  assert.equal(result.ok,false);
  assert.equal(result.reason,"no_valid_layout");
  assert.deepEqual(result.placements,[]);
});

test("strict solver honors its deterministic search-node limit",()=>{
  const result=solveCrossword(BUDGET_WORDS,{maxNodes:1});
  assert.equal(result.ok,false);
  assert.equal(result.reason,"search_limit");
  assert.equal(result.nodes,1);
});

test("strict validator rejects side adjacency, occupied endcaps, and disconnected words",()=>{
  const placements=[
    {word:"CAT",r:0,c:0,dir:"h"},
    {word:"DOG",r:1,c:0,dir:"h"},
  ];
  const result=validateCrosswordLayout(["CAT","DOG"],placements);
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes("noIllegalAdjacency"));
  assert.ok(result.errors.includes("singleConnectedGrid"));
  assert.ok(result.errors.includes("noUnintendedWords"));
});

test("strict validator rejects a conflicting overlap",()=>{
  const result=validateCrosswordLayout(["CAT","DOG"],[
    {word:"CAT",r:0,c:0,dir:"h"},
    {word:"DOG",r:0,c:0,dir:"v"},
  ]);
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes("noConflictsOrSameDirectionOverlap"));
});

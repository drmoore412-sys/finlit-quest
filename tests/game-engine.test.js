const test=require("node:test"),assert=require("node:assert/strict"),game=require("../src/game-engine.js");
const level={letters:"YIELDGERP",words:["YIELD","LEDGER","PEER"]};
test("duplicate wheel letters are consumed independently",()=>{assert.equal(game.canForm("LEDGER",level.letters),true);assert.equal(game.canForm("LEEDGER",level.letters),false)});
test("classifies target, duplicate, bonus, and invalid words",()=>{assert.equal(game.evaluateWord("LEDGER",level,new Set(),[]).status,"target");assert.equal(game.evaluateWord("LEDGER",level,new Set(["LEDGER"]),[]).status,"duplicate");assert.equal(game.evaluateWord("YELP",level,new Set(),["YELP"]).status,"bonus");assert.equal(game.evaluateWord("NOPE",level,new Set(),[]).status,"invalid")});
test("crossword layout preserves every word",()=>{const placed=game.layoutWords(level.words);assert.deepEqual(placed.map(item=>item.word),level.words);assert.ok(placed.some(item=>item.dir==="v"))});
test("wheel generation preserves the maximum repeated-letter count",()=>{const wheel=game.wheelFor(["PEER","LEDGER"]);assert.equal(wheel.filter(letter=>letter==="E").length,2)});
test("hint selection skips a letter exposed by a crossing",()=>{const found=new Set(["YIELD"]),hints=new Set(),hint=game.nextHint(level.words,found,hints);assert.ok(hint);assert.equal(game.isCrossingVisible(hint.word,hint.index,level.words,found),false)});

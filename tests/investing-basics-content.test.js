const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const crypto=require("node:crypto");
const {ROOT}=require("./helpers.js");

const terms=JSON.parse(fs.readFileSync(path.join(ROOT,"content/investing-basics-terms.json"),"utf8"));
const reserve=JSON.parse(fs.readFileSync(path.join(ROOT,"content/investing-basics-reserve.json"),"utf8"));
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"content/investing-basics-terms.js"),"utf8"),context);
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"content/investing-basics-puzzle-bank.js"),"utf8"),context);
const runtimeTerms=context.window.INVESTING_BASICS_TERMS;
const puzzles=context.window.INVESTING_BASICS_PUZZLES;

const creditContext={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"content/credit-game-terms.js"),"utf8"),creditContext);
const cryptoSource=JSON.parse(fs.readFileSync(path.join(ROOT,"content/crypto-terms.json"),"utf8"));
const moneyTerms=JSON.parse(fs.readFileSync(path.join(ROOT,"content/money-basics-terms.json"),"utf8"));
const moneyReserve=JSON.parse(fs.readFileSync(path.join(ROOT,"content/money-basics-reserve.json"),"utf8"));
const bankingTerms=JSON.parse(fs.readFileSync(path.join(ROOT,"content/banking-basics-terms.json"),"utf8"));
const bankingReserve=JSON.parse(fs.readFileSync(path.join(ROOT,"content/banking-basics-reserve.json"),"utf8"));
const earlierWorldWords=new Set([
  ...creditContext.window.CREDIT_GAME_TERMS.map(term=>term.word),
  ...(Array.isArray(cryptoSource)?cryptoSource:cryptoSource.terms).map(term=>term.word),
  ...moneyTerms.map(term=>term.word),
  ...moneyReserve.terms.map(term=>term.term),
  ...bankingTerms.map(term=>term.word),
  ...bankingReserve.terms.map(term=>term.term),
]);

function counts(value){return [...value].reduce((out,c)=>(out[c]=(out[c]||0)+1,out),{})}

test("approved Investing governance record remains byte-identical to the supplied source",()=>{
  const record=fs.readFileSync(path.join(ROOT,"docs/INVESTING_BASICS_MAIN_GAME_VOCABULARY_v1.1_FINAL_APPROVED.md"));
  assert.equal(record.length,16972);
  assert.equal(
    crypto.createHash("sha256").update(record).digest("hex"),
    "26f780ad8bd255146bbea178391568be33cba3bd0cdb88b75acf427116a559c5"
  );
});

test("Investing Basics has 25 approved active terms with stable IDs and source metadata",()=>{
  assert.equal(terms.length,25);
  assert.equal(new Set(terms.map(term=>term.id)).size,25);
  assert.equal(new Set(terms.map(term=>term.word)).size,25);
  terms.forEach(term=>{
    assert.equal(term.id,`investing.${term.word.toLowerCase()}`);
    assert.match(term.word,/^[A-Z]+$/);
    assert.ok(term.word.length<=9,`${term.word} exceeds nine letters`);
    assert.ok(term.definition);
    assert.ok(term.sourceOrganization);
    assert.match(term.sourceUrl,/^https:\/\//);
    assert.match(term.clusterId,/^IB-C0[1-9]$/);
    assert.ok(!earlierWorldWords.has(term.word),`${term.word} duplicates an earlier-world active or reserve term`);
  });
});

test("Investing JavaScript runtime preserves every approved id, word, and definition",()=>{
  assert.deepEqual(
    JSON.parse(JSON.stringify(runtimeTerms)),
    terms.map(({id,word,definition})=>({id,word,definition}))
  );
});

test("Investing bank has seven three-word clusters and exactly two approved two-word exceptions",()=>{
  assert.equal(puzzles.length,9);
  assert.equal(puzzles.filter(puzzle=>puzzle.words.length===3).length,7);
  assert.deepEqual(
    JSON.parse(JSON.stringify(puzzles.filter(puzzle=>puzzle.words.length===2).map(puzzle=>puzzle.id))),
    ["IB-C08","IB-C09"]
  );
  puzzles.filter(puzzle=>puzzle.words.length===2).forEach(puzzle=>{
    assert.equal(puzzle.longWordException,true);
    assert.ok(puzzle.longWordExceptionReason);
  });
  assert.ok(puzzles.every(puzzle=>puzzle.words.length>=2),"single-term puzzles are prohibited");
});

test("all nine approved Investing word and wheel relationships are preserved exactly",()=>{
  const actual=JSON.parse(JSON.stringify(puzzles.map(({id,words,letters})=>({id,words,letters:letters.join("")}))));
  assert.deepEqual(actual,[
    {id:"IB-C01",words:["STOCK","SELL","ASK"],letters:"ACEKLLOST"},
    {id:"IB-C02",words:["SHARE","ASSET","ISSUER"],letters:"AEHIRSSTU"},
    {id:"IB-C03",words:["BOND","GAIN","LONG"],letters:"ABDGINLO"},
    {id:"IB-C04",words:["BROKER","MARKET","BEAR"],letters:"ABEKMORRT"},
    {id:"IB-C05",words:["RETURN","TRADE","ORDER"],letters:"ADENORRTU"},
    {id:"IB-C06",words:["EQUITY","BUY","BULL"],letters:"BEILLQTUY"},
    {id:"IB-C07",words:["GROWTH","OWNER","VOTE"],letters:"EGHNORTVW"},
    {id:"IB-C08",words:["DIVIDEND","INDEX"],letters:"DDDEIINVX"},
    {id:"IB-C09",words:["CAPITAL","BID"],letters:"AABCDILPT"},
  ]);
});

test("all 25 Investing terms are assigned to their approved cluster exactly once",()=>{
  const assigned=puzzles.flatMap(puzzle=>puzzle.words);
  assert.equal(assigned.length,25);
  assert.equal(new Set(assigned).size,25);
  assert.deepEqual(new Set(assigned),new Set(terms.map(term=>term.word)));
  terms.forEach(term=>{
    const puzzle=puzzles.find(candidate=>candidate.id===term.clusterId);
    assert.ok(puzzle,`${term.clusterId} is missing`);
    assert.ok(puzzle.words.includes(term.word),`${term.word} is not assigned to ${term.clusterId}`);
  });
});

test("every Investing wheel preserves approved size, repeated letters, and prefix safety",()=>{
  puzzles.forEach(puzzle=>{
    assert.ok(puzzle.letters.length<=9,`${puzzle.id} exceeds nine tiles`);
    const available=counts(puzzle.letters.join(""));
    puzzle.words.forEach(word=>{
      const needed=counts(word);
      Object.entries(needed).forEach(([letter,count])=>{
        assert.ok((available[letter]||0)>=count,`${puzzle.id} cannot form ${word}`);
      });
      puzzle.words.forEach(other=>{
        if(word!==other)assert.ok(!other.startsWith(word),`${puzzle.id}: ${word} is a prefix of ${other}`);
      });
    });
  });
});

test("PORTFOLIO and DIVERSIFY remain inactive reserve terms",()=>{
  assert.equal(reserve.vocabularyVersion,"v1.1");
  assert.equal(reserve.governanceStatus,"FINAL APPROVED");
  assert.equal(reserve.activeInMainGame,false);
  assert.deepEqual(reserve.terms.map(term=>term.id),["investing.portfolio","investing.diversify"]);
  assert.ok(reserve.terms.every(term=>term.active===false&&term.status==="Future Expanded-Wheel Reserve"));
  const activeWords=new Set(puzzles.flatMap(puzzle=>puzzle.words));
  reserve.terms.forEach(term=>assert.ok(!activeWords.has(term.term),`${term.term} was activated`));
  assert.deepEqual(reserve.removedTerms,["ALLOT"]);
  assert.ok(reserve.crossWorldExclusions.some(entry=>entry.term==="PRICE"&&entry.controllingWorld==="Money Basics"));
});

test("Investing world is registered with the governed static bank and stable save key",()=>{
  const app=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  assert.match(app,/investing:\s*\{/);
  assert.match(app,/key:\s*"wg-investing"/);
  assert.match(app,/staticBank:\s*\(\)\s*=>\s*window\.INVESTING_BASICS_PUZZLES/);
  assert.match(app,/window\.INVESTING_BASICS_TERMS/);
});

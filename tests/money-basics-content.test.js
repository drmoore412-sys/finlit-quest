const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {ROOT}=require("./helpers.js");

const terms=JSON.parse(fs.readFileSync(path.join(ROOT,"content/money-basics-terms.json"),"utf8"));
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"content/money-basics-puzzle-bank.js"),"utf8"),context);
const puzzles=context.window.MONEY_BASICS_PUZZLES;
const moneyJsContext={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"content/money-basics-terms.js"),"utf8"),moneyJsContext);
const creditContext={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"content/credit-game-terms.js"),"utf8"),creditContext);
const cryptoSource=JSON.parse(fs.readFileSync(path.join(ROOT,"content/crypto-terms.json"),"utf8"));
const earlierWorldWords=new Set([
  ...creditContext.window.CREDIT_GAME_TERMS.map(term=>term.word),
  ...(Array.isArray(cryptoSource)?cryptoSource:cryptoSource.terms).map(term=>term.word),
]);

function counts(value){return [...value].reduce((out,c)=>(out[c]=(out[c]||0)+1,out),{})}

test("Money Basics has 36 unique governed terms with stable IDs and no cross-world duplicates",()=>{
  assert.equal(terms.length,36);
  assert.equal(new Set(terms.map(t=>t.word)).size,36);
  terms.forEach(t=>{
    assert.equal(t.id,`moneybasics.${t.word.toLowerCase()}`);
    assert.match(t.word,/^[A-Z]+$/);
    assert.ok(t.word.length<=9,`${t.word} exceeds nine letters`);
  });
  const excluded=new Set(["COIN","DEBT","BALANCE","INTEREST"]);
  terms.forEach(t=>{
    assert.ok(!excluded.has(t.word),`${t.word} is an explicitly excluded cross-world duplicate`);
    assert.ok(!earlierWorldWords.has(t.word),`${t.word} duplicates an active term in Credit or Crypto`);
  });
});

test("Money Basics JavaScript and JSON runtime records remain identical",()=>{
  assert.deepEqual(
    JSON.parse(JSON.stringify(moneyJsContext.window.MONEY_BASICS_TERMS)),
    terms
  );
});

test("Money Basics governed bank contains 14 clusters and 6 single-term puzzles covering every term",()=>{
  assert.equal(puzzles.length,20);
  assert.equal(puzzles.filter(p=>p.words.length>1).length,14);
  assert.equal(puzzles.filter(p=>p.words.length===1).length,6);
  assert.deepEqual(new Set(puzzles.flatMap(p=>p.words)),new Set(terms.map(t=>t.word)));
});

test("every Money Basics puzzle obeys the nine-letter wheel and repeated-letter rules",()=>{
  puzzles.forEach(p=>{
    assert.ok(p.letters.length<=9,`${p.id} exceeds the wheel limit`);
    const available=counts(p.letters.join(""));
    p.words.forEach(word=>{
      const needed=counts(word);
      Object.entries(needed).forEach(([letter,count])=>assert.ok((available[letter]||0)>=count,`${p.id} cannot form ${word}`));
    });
  });
});

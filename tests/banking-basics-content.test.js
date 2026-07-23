const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const crypto=require("node:crypto");
const {ROOT}=require("./helpers.js");

const terms=JSON.parse(fs.readFileSync(path.join(ROOT,"content/banking-basics-terms.json"),"utf8"));
const reserve=JSON.parse(fs.readFileSync(path.join(ROOT,"content/banking-basics-reserve.json"),"utf8"));
const bankingContext={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"content/banking-basics-terms.js"),"utf8"),bankingContext);
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"content/banking-basics-puzzle-bank.js"),"utf8"),bankingContext);
const runtimeTerms=bankingContext.window.BANKING_BASICS_TERMS;
const puzzles=bankingContext.window.BANKING_BASICS_PUZZLES;

const creditContext={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(ROOT,"content/credit-game-terms.js"),"utf8"),creditContext);
const cryptoSource=JSON.parse(fs.readFileSync(path.join(ROOT,"content/crypto-terms.json"),"utf8"));
const moneySource=JSON.parse(fs.readFileSync(path.join(ROOT,"content/money-basics-terms.json"),"utf8"));
const earlierWorldWords=new Set([
  ...creditContext.window.CREDIT_GAME_TERMS.map(term=>term.word),
  ...(Array.isArray(cryptoSource)?cryptoSource:cryptoSource.terms).map(term=>term.word),
  ...moneySource.map(term=>term.word),
]);

function counts(value){return [...value].reduce((out,c)=>(out[c]=(out[c]||0)+1,out),{})}

test("complete Banking controlling record remains byte-identical to the approved source",()=>{
  const repositoryRecord=fs.readFileSync(path.join(ROOT,"docs/BANKING_BASICS_v1.1_COMPLETE_CONTROLLING_RECORD_2026-07-23.md"));
  assert.equal(repositoryRecord.length,18198);
  assert.equal(
    crypto.createHash("sha256").update(repositoryRecord).digest("hex"),
    "9551d3377533ab6ad569b618520b3a264d6733df067c83a6615feed5e1acb3ed"
  );
});

test("Banking Basics has 26 governed active terms with stable IDs and complete source metadata",()=>{
  assert.equal(terms.length,26);
  assert.equal(new Set(terms.map(term=>term.id)).size,26);
  assert.equal(new Set(terms.map(term=>term.word)).size,26);
  terms.forEach(term=>{
    assert.equal(term.id,`banking.${term.word.toLowerCase()}`);
    assert.match(term.word,/^[A-Z]+$/);
    assert.ok(term.word.length<=9,`${term.word} exceeds nine letters`);
    assert.ok(term.definition);
    assert.ok(term.definitionStatus);
    assert.ok(term.sourceOrganization);
    assert.match(term.sourceUrl,/^https:\/\//);
    assert.match(term.clusterId,/^BB-C\d{2}$/);
    assert.ok(term.verificationNote);
    assert.ok(term.supportFlag);
    assert.ok(!earlierWorldWords.has(term.word),`${term.word} duplicates an active earlier-world term`);
  });
});

test("Banking JavaScript runtime preserves every approved id, word, and definition",()=>{
  assert.deepEqual(
    JSON.parse(JSON.stringify(runtimeTerms)),
    terms.map(({id,word,definition})=>({id,word,definition}))
  );
});

test("Banking governed bank has 13 multi-term clusters covering all active terms exactly once",()=>{
  assert.equal(puzzles.length,13);
  assert.ok(puzzles.every(puzzle=>puzzle.words.length===2));
  const assigned=puzzles.flatMap(puzzle=>puzzle.words);
  assert.equal(assigned.length,26);
  assert.equal(new Set(assigned).size,26);
  assert.deepEqual(new Set(assigned),new Set(terms.map(term=>term.word)));
  terms.forEach(term=>{
    const puzzle=puzzles.find(candidate=>candidate.id===term.clusterId);
    assert.ok(puzzle,`${term.clusterId} is missing`);
    assert.ok(puzzle.words.includes(term.word),`${term.word} is not assigned to ${term.clusterId}`);
  });
});

test("every Banking cluster obeys exact letter counts and the nine-tile limit",()=>{
  puzzles.forEach(puzzle=>{
    assert.ok(puzzle.letters.length<=9,`${puzzle.id} exceeds nine tiles`);
    const available=counts(puzzle.letters.join(""));
    puzzle.words.forEach(word=>{
      const needed=counts(word);
      Object.entries(needed).forEach(([letter,count])=>{
        assert.ok((available[letter]||0)>=count,`${puzzle.id} cannot form ${word}`);
      });
    });
  });
});

test("the 15 reserve terms stay inactive and GLOBAL stays removed",()=>{
  assert.equal(reserve.vocabularyVersion,"v1.1");
  assert.equal(reserve.activeInMainGame,false);
  assert.equal(reserve.terms.length,15);
  assert.ok(reserve.terms.every(term=>term.active===false));
  assert.deepEqual(reserve.removedTerms,["GLOBAL"]);
  const active=new Set(terms.map(term=>term.word));
  reserve.terms.forEach(term=>assert.ok(!active.has(term.term),`${term.term} was activated`));
  assert.equal(reserve.terms.find(term=>term.term==="SAVINGS").definition,"An account designed to hold money for future needs and potentially earn interest.");
  assert.equal(reserve.terms.find(term=>term.term==="RECURRING").definition,"Describes a payment or transfer scheduled to happen repeatedly.");
});

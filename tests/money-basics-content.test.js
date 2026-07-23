const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const {ROOT}=require("./helpers.js");

const terms=JSON.parse(fs.readFileSync(path.join(ROOT,"content/money-basics-terms.json"),"utf8"));
const reserve=JSON.parse(fs.readFileSync(path.join(ROOT,"content/money-basics-reserve.json"),"utf8"));
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

// V1.0 Money Basics puzzle-structure fix: one puzzle per vocabulary term
// produced a wave of one-answer levels in production. The governed bank must
// cluster terms into puzzles of at least three answers, with two-answer
// puzzles allowed only as an explicitly documented exception, and one-answer
// puzzles prohibited outright. A term that genuinely cannot be clustered
// (INFLATION — needs all nine wheel tiles, no compatible partner exists in
// the approved vocabulary) stays governed vocabulary but is not forced into
// an invalid puzzle; see docs/MONEY_BASICS_CLUSTER_GOVERNANCE_GAP_2026-07-23.md.
test("no active Money Basics puzzle has fewer than two required answers",()=>{
  puzzles.forEach(p=>assert.ok(p.words.length>=2,`${p.id} has only ${p.words.length} answer(s)`));
});
test("standard Money Basics puzzles (not a documented long-word exception) target at least three answers",()=>{
  puzzles.filter(p=>!p.longWordException).forEach(p=>assert.ok(p.words.length>=3,`${p.id} is not a documented exception but has only ${p.words.length} answers`));
});
test("every two-answer Money Basics puzzle is an explicitly documented long-word exception",()=>{
  puzzles.filter(p=>p.words.length===2).forEach(p=>{
    assert.equal(p.longWordException,true,`${p.id} has two answers but isn't flagged as an exception`);
    assert.ok(p.longWordExceptionReason&&p.longWordExceptionReason.length>0,`${p.id} exception has no documented reason`);
  });
});
// PAYCHECK joined INFLATION as a documented gap after a live-reproduced bug:
// its only viable cluster (CASH+PAY+PAYCHECK) put PAY, a literal prefix of
// PAYCHECK, in the same puzzle — the shared engine auto-submits "PAY" the
// moment its letters are selected, so PAYCHECK could never be completed.
// See docs/MONEY_BASICS_CLUSTER_GOVERNANCE_GAP_2026-07-23.md.
test("every active Money Basics puzzle word is a real governed term, with INFLATION and PAYCHECK the documented non-active gaps",()=>{
  const activeWords=new Set(puzzles.flatMap(p=>p.words));
  const termWords=new Set(terms.map(t=>t.word));
  activeWords.forEach(word=>assert.ok(termWords.has(word),`${word} is not an approved Money Basics term`));
  const inactive=[...termWords].filter(word=>!activeWords.has(word)).sort();
  assert.deepEqual(inactive,["INFLATION","PAYCHECK"],"exactly two terms should be inactive, and they should be the documented gaps");
});
// Governance decision approved 2026-07-23: INFLATION and PAYCHECK are
// classified Future Expanded-Wheel Reserve — the same status/label already
// established for Banking Basics' reserve terms (content/banking-basics-
// reserve.json) — rather than removed from vocabulary or forced into an
// invalid puzzle. Unlike Banking's reserve terms, these two stay fully
// present in content/money-basics-terms.json with unchanged stable IDs and
// definitions; the reserve file only records their puzzle-eligibility
// classification. See docs/MONEY_BASICS_CLUSTER_GOVERNANCE_GAP_2026-07-23.md.
test("INFLATION and PAYCHECK are recorded as Future Expanded-Wheel Reserve, not removed from vocabulary",()=>{
  assert.equal(reserve.activeInPuzzleBank,false);
  assert.equal(reserve.terms.length,2);
  const reserveWords=reserve.terms.map(t=>t.term).sort();
  assert.deepEqual(reserveWords,["INFLATION","PAYCHECK"]);
  reserve.terms.forEach(rt=>{
    assert.equal(rt.status,"Future Expanded-Wheel Reserve");
    assert.equal(rt.active,false);
    const term=terms.find(t=>t.word===rt.term);
    assert.ok(term,`${rt.term} must still exist in the main Money Basics term list`);
    assert.equal(term.id,rt.id,`${rt.term}'s stable ID must be unchanged`);
  });
});
test("every reserve term is absent from the active puzzle bank",()=>{
  const activeWords=new Set(puzzles.flatMap(p=>p.words));
  reserve.terms.forEach(rt=>assert.ok(!activeWords.has(rt.term),`${rt.term} is reserve but appears in an active puzzle`));
});
test("no active Money Basics puzzle contains a word that is a prefix of another word in the same puzzle",()=>{
  puzzles.forEach(p=>{
    p.words.forEach(a=>p.words.forEach(b=>{
      if(a!==b)assert.ok(!b.startsWith(a),`${p.id}: "${a}" is a prefix of "${b}" — selecting ${a}'s letters would auto-submit it before ${b} could be completed`);
    }));
  });
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

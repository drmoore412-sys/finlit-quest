// Phase 5 approved implementation (owner approval 2026-10-16): ACH and WORTH are governed V3 terms, two
// anchors come from other worlds, and all 27 puzzles comply. These tests pin the approved boundaries.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
const supplement=require("../content/v3-supplemental-terms.js");

test("ACH, WORTH and the eight CAL-0008 terms carry the approved permanent IDs and are the only additions",()=>{
  assert.deepEqual(supplement.TERMS.map(term=>term.id),["banking.ach","investing.worth","banking.atm","banking.wire","banking.phishing","investing.liquidity","credit.report","credit.bureau","credit.freeze","credit.history"]);
  assert.equal(supplement.TERMS.length,10);
  assert.deepEqual(supplement.forWorld("banking").map(term=>term.termId),["banking.ach","banking.atm","banking.wire","banking.phishing"]);
  assert.deepEqual(supplement.forWorld("investing").map(term=>term.termId),["investing.worth","investing.liquidity"]);
  assert.deepEqual(supplement.forWorld("credit").map(term=>term.termId),["credit.report","credit.bureau","credit.freeze","credit.history"]);
  assert.deepEqual(supplement.forWorld("crypto"),[]);
});

test("merge never mutates its input, never duplicates a word, and leaves other worlds alone",()=>{
  const input={banking:[{word:"ACCESS",definition:"d",termId:"banking.access"}],investing:[{word:"WORTH",definition:"existing",termId:"investing.worth"}],crypto:[{word:"COIN",definition:"c",termId:"crypto.coin"}]};
  const frozen=JSON.stringify(input),merged=supplement.merge(input);
  assert.equal(JSON.stringify(input),frozen);
  assert.deepEqual(merged.banking.map(term=>term.word),["ACCESS","ACH","ATM","WIRE","PHISHING"]);
  assert.deepEqual(merged.investing.map(term=>term.word),["WORTH","LIQUIDITY"],"an existing WORTH is not duplicated");
  assert.deepEqual(merged.crypto,input.crypto);
});

test("the frozen legacy Banking and Investing v1.1 data is untouched, so their puzzle banks are unchanged",()=>{
  const banking=fs.readFileSync(path.join(ROOT,"content/banking-basics-terms.js"),"utf8"),investing=fs.readFileSync(path.join(ROOT,"content/investing-basics-terms.js"),"utf8");
  assert.ok(!/ACH|banking\.ach/.test(banking),"ACH is not written into the legacy Banking runtime");
  assert.ok(!/WORTH|investing\.worth/.test(investing),"WORTH is not written into the legacy Investing runtime");
});

test("the supplement script loads before the V3 slate in the page and ships in the native bundle",()=>{
  const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
  assert.ok(html.indexOf("content/v3-supplemental-terms.js")>0);
  assert.ok(html.indexOf("content/v3-supplemental-terms.js")<html.indexOf("src/v3-puzzle-slate.js"));
  assert.match(fs.readFileSync(path.join(ROOT,"scripts/build-www.sh"),"utf8"),/content\/v3-supplemental-terms\.js/);
});

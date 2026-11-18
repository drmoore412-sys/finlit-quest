// CAL-0012 (owner instruction 2026-11-18): the four Crypto terms approved under CAL-0008 are restored to implementation.
// ADDRESS, CUSTODY, SCAM and CONFIRMED carry exactly the approved wording and permanent IDs, join the 207-term dictionary (211 total),
// and no puzzle, key term or answer list changes because no current wheel can spell any of them.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {ROOT}=require("./helpers.js");
const H=require("./unified-release-helpers.js");
const A=require("../src/answer-expansion.js");
const log=fs.readFileSync(path.join(ROOT,"docs/CURRICULUM_APPROVAL_LOG.md"),"utf8");
const APPROVED=[
  ["crypto.address","ADDRESS","A string of letters and numbers used as a destination for sending or receiving cryptocurrency."],
  ["crypto.custody","CUSTODY","The responsibility for safeguarding the keys or accounts that control access to cryptocurrency."],
  ["crypto.scam","SCAM","A deceptive scheme designed to steal money or cryptocurrency."],
  ["crypto.confirmed","CONFIRMED","Describes a blockchain transaction or block whose inclusion has been accepted through network consensus."],
];
const dictionary=A.loadDictionary(ROOT);

test("the four restored definitions equal the CAL-0008 approved wording exactly, character for character",()=>{
  for(const [id,word,definition] of APPROVED){
    assert.ok(log.includes(`| ${word} | \`${id}\` | Crypto |`),`${word} is recorded in CAL-0008 with ID ${id}`);
    assert.ok(log.includes(definition),`${word}: CAL-0008 holds the exact definition`);
    const entry=dictionary.get(word);
    assert.equal(entry.termId,id);assert.equal(entry.worldId,"crypto");assert.equal(entry.definition,definition);
  }
});

test("the dictionary is 211 terms: the original 207 plus the four restored Crypto terms, Crypto 20 -> 24, no other world changes",()=>{
  assert.equal(dictionary.size,211);assert.equal(A.EXPECTED_TERM_COUNT,211);
  const counts={};[...dictionary.values()].forEach(e=>counts[e.worldId]=(counts[e.worldId]||0)+1);
  assert.deepEqual(counts,{credit:46,crypto:24,banking:31,investing:28,moneybasics:36,ai_technology:1,business:13,coins:5,insurance:5,real_estate:6,retirement:9,social_media:2,taxes:5});
  assert.equal(new Set([...dictionary.values()].map(e=>e.termId)).size,211);
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT,"content/crypto-terms.json"),"utf8")).length,20,"the 20 original Crypto learning objects are untouched");
});

test("no puzzle record in the release can spell any restored term, so no puzzle, key term or answer list changes",()=>{
  const sequence=H.read("content/unified-prototype-12-puzzles-dev.json").puzzles,revisions=H.read("content/unified-exact-wheel-revisions-dev.json").puzzles;
  const all=[...H.canonicalPuzzles(),...sequence,...revisions];assert.ok(all.length>=67);
  for(const puzzle of all)for(const [,word] of APPROVED)assert.equal(A.spellable(word,puzzle.wheelLetters),false,`${puzzle.id} cannot spell ${word}`);
  for(const puzzle of all)assert.equal(A.missingAnswers(puzzle,dictionary).length,0,`${puzzle.id} is still exhaustive against the 211-term dictionary`);
});

test("the restored terms ship in the native bundle, byte-identical to the source",()=>{
  for(const f of ["content/v3-supplemental-terms.js","content/answer-expansion-v1.js"])
    assert.equal(fs.readFileSync(path.join(ROOT,"ios/App/App/public",f),"utf8"),fs.readFileSync(path.join(ROOT,f),"utf8"),f);
  const bundled=fs.readFileSync(path.join(ROOT,"ios/App/App/public/content/v3-supplemental-terms.js"),"utf8");
  for(const [id] of APPROVED)assert.ok(bundled.includes(id));
});

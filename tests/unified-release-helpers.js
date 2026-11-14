// Shared helpers for release-gate tests and for regenerating the frozen legacy baseline. Not a test file.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),crypto=require("node:crypto");
const {ROOT}=require("./helpers.js");
const G=require("../src/game-engine.js"),slate=require("../src/v3-puzzle-slate.js"),Release=require("../src/unified-release.js");
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f),"utf8"));
const sha256=text=>crypto.createHash("sha256").update(text).digest("hex");
function loadWindow(file,key){const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),c);return c.window[key]}
function vocabularies(){
  const c={window:{DEFI_TERMS:loadWindow("content/crypto-terms.js","DEFI_TERMS")}};vm.runInNewContext(fs.readFileSync(path.join(ROOT,"worlds/crypto.js"),"utf8"),c);
  return {crypto:c.window.FINLIT_WORLD.terms.map(t=>({word:t.word,definition:t.definition,termId:t.id})),credit:loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS"),moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS")};
}
function canonicalPuzzles(){return [...slate.createSlate(vocabularies(),G),...Object.values(read("content/2027-new-world-puzzle-banks.json").banks).flat()]}
function canonicalMap(){return new Map(canonicalPuzzles().map(p=>[p.id,p]))}
// every governed term id -> its approved definition (canonical key answers plus the governed vocabulary files)
function termDefinitions(){
  const out=new Map(),V=vocabularies();
  canonicalPuzzles().forEach(p=>p.answers.forEach(a=>{if(a.termId&&a.definition)out.set(a.termId,a.definition)}));
  Object.entries(V).forEach(([world,list])=>list.forEach(t=>{const id=t.termId||t.id||slate.stableTermId(world,t);if(id&&t.definition&&!out.has(id))out.set(id,t.definition)}));
  return out;
}
const hashOf=puzzle=>Release.contentHash(puzzle,sha256);
function buildBaseline(manifestV1){
  const map=canonicalMap();
  return {baselineVersion:1,note:"Frozen baseline of the unchanged canonical v1 puzzles allowed into the 61-level release sequence under the owner-approved legacy compatibility exception (2026-11-14). sha256 is of the stable-JSON canonical puzzle record built from the committed vocabularies and puzzle banks at repository HEAD 3ebc7a2. Regenerating this file is a content change and needs owner approval.",
    algorithm:"sha256(stable-json(canonical puzzle record))",entries:manifestV1.entries.map(e=>({puzzleId:e.puzzleId,anchor:e.anchor,sha256:hashOf(map.get(e.puzzleId))}))};
}
module.exports={ROOT,read,sha256,canonicalPuzzles,canonicalMap,termDefinitions,hashOf,buildBaseline};

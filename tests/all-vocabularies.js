// Governed per-world vocabularies for tests that build V3 slates. The exhaustive-answer rule places approved terms owned by
// other worlds in puzzles whose wheels spell them, so a slate needs every owning world's vocabulary, not only its own.
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const {ROOT}=require("./helpers.js");
function loadWindow(file,key,window={}){const context={window};vm.runInNewContext(fs.readFileSync(path.join(ROOT,file),"utf8"),context);return context.window[key]}
function allVocabularies(){
  const context={window:{DEFI_TERMS:loadWindow("content/crypto-terms.js","DEFI_TERMS")}};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,"worlds/crypto.js"),"utf8"),context);
  return {
    crypto:context.window.FINLIT_WORLD.terms.map(term=>({word:term.word,definition:term.definition,termId:term.id})),
    credit:loadWindow("content/credit-game-terms.js","CREDIT_GAME_TERMS"),
    moneybasics:loadWindow("content/money-basics-terms.js","MONEY_BASICS_TERMS"),
    banking:loadWindow("content/banking-basics-terms.js","BANKING_BASICS_TERMS"),
    investing:loadWindow("content/investing-basics-terms.js","INVESTING_BASICS_TERMS"),
  };
}
module.exports={allVocabularies};

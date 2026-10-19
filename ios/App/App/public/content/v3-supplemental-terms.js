(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitV3Supplement=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Owner-approved additions to the governed vocabulary (2026-10-16, V3 Phase 5). They are kept apart
  // from the frozen v1.1 legacy records (Banking: 26 terms / 13 clusters, Investing: 25 terms) so the
  // legacy puzzle banks are unchanged; the V3 slate reads them through merge().
  // Full source metadata lives in content/v3-supplemental-terms.json (a test keeps the two identical).
  const TERMS=Object.freeze([
    Object.freeze({id:"banking.ach",world:"banking",word:"ACH",definition:"An electronic network that moves money between bank and credit union accounts, used for direct deposits and recurring bill payments."}),
    Object.freeze({id:"investing.worth",world:"investing",word:"WORTH",definition:"The amount of money something is valued at, or the amount by which what a person owns is greater than what they owe, as in net worth."}),
    Object.freeze({id:"banking.atm",world:"banking",word:"ATM",definition:"An automated teller machine that lets bank customers complete basic transactions such as deposits and withdrawals."}),
    Object.freeze({id:"banking.wire",world:"banking",word:"WIRE",definition:"An electronic bank transfer sent through a wire network to a named recipient."}),
    Object.freeze({id:"banking.phishing",world:"banking",word:"PHISHING",definition:"A scam using deceptive emails or text messages to steal passwords, account numbers, or other personal and financial information."}),
    Object.freeze({id:"investing.liquidity",world:"investing",word:"LIQUIDITY",definition:"How easily or quickly an investment can be bought or sold without a large effect on its price."}),
    Object.freeze({id:"credit.report",world:"credit",word:"REPORT",definition:"A record of your credit activity and current credit situation, including account and payment information."}),
    Object.freeze({id:"credit.bureau",world:"credit",word:"BUREAU",definition:"A common name for a credit reporting company that collects credit information and creates credit reports."}),
    Object.freeze({id:"credit.freeze",world:"credit",word:"FREEZE",definition:"A free protection that restricts access to your credit file to help prevent new accounts from being opened in your name."}),
    Object.freeze({id:"credit.history",world:"credit",word:"HISTORY",definition:"A record of how you have used and repaid credit over time."}),
  ]);
  function forWorld(worldId){return TERMS.filter(term=>term.world===worldId).map(term=>({word:term.word,definition:term.definition,termId:term.id}))}
  // Returns new vocabulary lists (inputs are never mutated) with the approved supplement appended.
  function merge(vocabularies){
    const merged={};
    Object.keys(vocabularies||{}).forEach(worldId=>{
      const base=vocabularies[worldId]||[],have=new Set(base.map(term=>String(term.word).toUpperCase()));
      merged[worldId]=[...base,...forWorld(worldId).filter(term=>!have.has(term.word))];
    });
    return merged;
  }
  return{TERMS,forWorld,merge};
});

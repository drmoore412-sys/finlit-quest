// Governed Credit Foundations identity registry.
// Owner approved 2026-10-14. Display words and definitions remain governed by
// content/credit-game-terms.js; these permanent IDs must not be derived from or
// changed with future display-copy revisions.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FINLIT_CREDIT_TERM_IDENTITIES=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const APPROVED_ENTRIES=Object.freeze([
    ["CREDIT","credit.credit"],["TERMS","credit.terms"],["ACCOUNT","credit.account"],["OBLIGATION","credit.obligation"],
    ["BORROWER","credit.borrower"],["APPLICANT","credit.applicant"],["COSIGNER","credit.cosigner"],["AFFORDABILITY","credit.affordability"],
    ["CREDITOR","credit.creditor"],["LENDER","credit.lender"],["UNDERWRITING","credit.underwriting"],["RISK","credit.risk"],
    ["SERVICER","credit.servicer"],["DEBT","credit.debt"],["BALANCE","credit.balance"],["LOAN","credit.loan"],
    ["TERM","credit.term"],["DISBURSEMENT","credit.disbursement"],["PRINCIPAL","credit.principal"],["CAPITALIZATION","credit.capitalization"],
    ["AMORTIZATION","credit.amortization"],["INTEREST","credit.interest"],["APR","credit.apr"],["APY","credit.apy"],
    ["REPAYMENT","credit.repayment"],["AUTOPAY","credit.autopay"],["DISCLOSURE","credit.disclosure"],["PREPAYMENT","credit.prepayment"],
    ["COLLATERAL","credit.collateral"],["REPOSSESSION","credit.repossession"],["FORECLOSURE","credit.foreclosure"],["CREDITWORTHINESS","credit.creditworthiness"],
    ["CAPACITY","credit.capacity"],["DELINQUENCY","credit.delinquency"],["DEFAULT","credit.default"],["ACCELERATION","credit.acceleration"],
    ["COLLECTION","credit.collection"],["REMEDY","credit.remedy"],
    // Owner approved 2026-10-17 (CAL-0008): shipped through content/v3-supplemental-terms.js, not the 38-term workbook record.
    ["REPORT","credit.report"],["BUREAU","credit.bureau"],["FREEZE","credit.freeze"],["HISTORY","credit.history"],
  ].map(([word,id])=>Object.freeze({word,id})));

  // CAL-0008 additions arrive through content/v3-supplemental-terms.js, so a vocabulary that is only the 38-term workbook record stays valid.
  const SUPPLEMENT_IDS=Object.freeze(["credit.report","credit.bureau","credit.freeze","credit.history"]);
  function normalizeWord(value){return String(value||"").trim().toUpperCase()}
  function createRegistry(entries=APPROVED_ENTRIES,optionalIds=SUPPLEMENT_IDS){
    if(!Array.isArray(entries)||!entries.length)throw new Error("Credit identity registry must contain entries");
    const byWord=new Map(),byId=new Map(),frozenEntries=[];
    for(const raw of entries){
      const word=normalizeWord(raw&&raw.word),id=String(raw&&raw.id||"").trim();
      if(!word)throw new Error("Credit identity is missing a governed word key");
      if(!/^credit\.[a-z0-9-]+$/.test(id))throw new Error(`Invalid Credit identity for ${word}: ${id||"(missing)"}`);
      if(byWord.has(word))throw new Error(`Duplicate Credit identity word: ${word}`);
      if(byId.has(id))throw new Error(`Duplicate Credit identity id: ${id}`);
      byWord.set(word,id);byId.set(id,word);frozenEntries.push(Object.freeze({word,id}));
    }
    function idForWord(word){
      const normalized=normalizeWord(word),id=byWord.get(normalized);
      if(!id)throw new Error(`Missing approved Credit identity for: ${normalized||"(empty)"}`);
      return id;
    }
    function resolveTerm(term){
      if(!term||typeof term!=="object")throw new Error("Credit identity resolution requires a term record");
      const word=normalizeWord(term.word),explicit=String(term.termId||term.id||"").trim();
      if(explicit){
        if(!byId.has(explicit))throw new Error(`Unknown approved Credit identity: ${explicit}`);
        const mapped=byWord.get(word);
        if(mapped&&mapped!==explicit)throw new Error(`Conflicting Credit identity for ${word}: ${explicit} does not match ${mapped}`);
        return explicit;
      }
      return idForWord(word);
    }
    function validateVocabulary(terms){
      if(!Array.isArray(terms))throw new Error("Credit vocabulary must be an array");
      const resolved=new Set();
      for(const term of terms){const id=resolveTerm(term);if(resolved.has(id))throw new Error(`Duplicate Credit vocabulary identity: ${id}`);resolved.add(id)}
      const optional=new Set(optionalIds),required=[...byId.keys()].filter(id=>!optional.has(id)),missing=required.filter(id=>!resolved.has(id));
      if(missing.length||[...resolved].some(id=>!byId.has(id)))throw new Error(`Credit vocabulary identity coverage mismatch; missing: ${missing.join(", ")||"none"}`);
      return true;
    }
    return Object.freeze({entries:Object.freeze(frozenEntries),size:frozenEntries.length,idForWord,resolveTerm,validateVocabulary});
  }

  const registry=createRegistry();
  if(registry.size!==42)throw new Error(`Credit identity registry must contain exactly 42 entries (38 workbook + 4 CAL-0008); found ${registry.size}`);
  return Object.freeze({...registry,APPROVED_ENTRIES,createRegistry,normalizeWord});
});

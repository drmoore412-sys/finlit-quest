#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const SOURCE=path.join(ROOT,"staging/research/expansion/2026-10-18/finlit-quest-2027-thirteen-world-puzzle-proposals.json");
const TERMS_JSON=path.join(ROOT,"content/2027-new-world-terms.json");
const TERMS_JS=path.join(ROOT,"content/2027-new-world-terms.js");
const BANKS_JSON=path.join(ROOT,"content/2027-new-world-puzzle-banks.json");
const BANKS_JS=path.join(ROOT,"content/2027-new-world-puzzle-banks.js");

const WORLD_NAMES={
  coins:"Coins & Currency",ai_technology:"AI & Technology",real_estate:"Real Estate",taxes:"Taxes",
  insurance:"Insurance & Protection",business:"Business & Entrepreneurship",
  social_media:"Social Media & Digital Income",retirement:"Retirement & Wealth Planning",
};
const REJECTED=new Map([
  ["FQ-2027-INSURANCE-04","RENTAL CAR is a product or service, not a financial, business, or technology key term as written."],
  ["FQ-2027-INSURANCE-05","ROOT CANAL is a healthcare procedure, not a financial, business, or technology key term."],
  ["FQ-2027-RETIREMENT-02","COMMUNITY is a general social concept, not a financial, business, or technology key term as written."],
]);
// Owner-authorized permanent identity decisions. Existing governed identities in
// proposal records are never remapped. FRACTION remains an ordinary support word:
// the earlier research record explicitly required clarification of the financial
// concept "fractional share," so the generic word does not receive an identity.
const NEW_TERM_OWNERS={
  COINGRADE:["coins","coin-grade"],COINAGE:["coins","coinage"],MELTVALUE:["coins","melt-value"],
  PROOFLIKE:["coins","prooflike"],SPOTPRICE:["coins","spot-price"],REPO:["investing","repo"],
  AUTOTRADE:["ai_technology","auto-trade"],APARTMENT:["real_estate","apartment"],RENT:["real_estate","rent"],
  REFINANCE:["real_estate","refinance"],FCRA:["credit","fcra"],FIRE:["retirement","fire"],
  INCOMETAX:["taxes","income-tax"],ECOA:["credit","ecoa"],TAXCREDIT:["taxes","tax-credit"],
  TAXID:["taxes","tax-id"],TAXFILING:["taxes","tax-filing"],GIFT:["taxes","gift"],TILA:["credit","tila"],
  CASHVALUE:["insurance","cash-value"],EXCLUSION:["insurance","exclusion"],LIEN:["real_estate","lien"],
  LIABILITY:["insurance","liability"],TRIPDELAY:["insurance","trip-delay"],RETAIL:["business","retail"],
  BREAKEVEN:["business","break-even"],BANK:["banking","bank"],FACTORING:["business","factoring"],
  FRANCHISE:["business","franchise"],HEIR:["retirement","heir"],FREELANCE:["business","freelance"],
  INVENTORY:["business","inventory"],REIT:["real_estate","reit"],MARKETING:["business","marketing"],
  MARGIN:["business","margin"],NETINCOME:["business","net-income"],RETENTION:["business","retention"],
  TRADEMARK:["business","trademark"],WHOLESALE:["business","wholesale"],LEASE:["real_estate","lease"],
  ROYALTIES:["social_media","royalties"],ADREVENUE:["social_media","ad-revenue"],REVENUE:["business","revenue"],
  COASTFIRE:["retirement","coast-fire"],FIDUCIARY:["retirement","fiduciary"],FRAUD:["credit","fraud"],
  LIFESTYLE:["retirement","lifestyle"],FEES:["retirement","fees"],LONGEVITY:["retirement","longevity"],
  SIMPLEIRA:["retirement","simple-ira"],LAPSE:["insurance","lapse"],SEPIRA:["retirement","sep-ira"],
};
const DEFINITION_OVERRIDES={
  AUTOTRADE:"A service or system that sends trading instructions directly to a brokerage account for immediate execution.",
  MARGIN:"The difference between a business's revenue and its costs, often expressed as a percentage of revenue.",
  FCRA:"The Fair Credit Reporting Act, a federal law governing consumer credit information and credit-reporting agencies.",
  ECOA:"The Equal Credit Opportunity Act, a federal law that prohibits discrimination in credit transactions.",
  TILA:"The Truth in Lending Act, a federal law requiring important borrowing-cost and credit-term disclosures.",
  REIT:"A company that owns and typically operates income-producing real estate or related assets.",
  SIMPLEIRA:"A retirement savings plan for eligible small employers that uses employee SIMPLE individual retirement accounts.",
  SEPIRA:"An individual retirement account funded through a Simplified Employee Pension arrangement established by an employer.",
};
const SOURCE_URLS={
  coins:"https://www.usmint.gov/learn/collecting-basics/glossary",
  ai_technology:"https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders",
  real_estate:"https://www.consumerfinance.gov/owning-a-home/",
  taxes:"https://www.irs.gov/help/ita",
  insurance:"https://content.naic.org/consumer",
  business:"https://www.sba.gov/business-guide",
  social_media:"https://www.irs.gov/businesses/small-businesses-self-employed/gig-economy-tax-center",
  retirement:"https://www.irs.gov/retirement-plans/resources-ira-based-plans",
  credit:"https://www.consumerfinance.gov/compliance/compliance-resources/other-applicable-requirements/fair-credit-reporting-act/",
  banking:"https://www.fdic.gov/consumer-resource-center",
  investing:"https://www.investor.gov/introduction-investing/investing-basics/glossary",
};
const TERM_SOURCE_URLS={
  AUTOTRADE:"https://syndication.finra.org/content/know-risks-auto-trading-services-offered-unregistered-entities",
  ECOA:"https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/credit-discrimination-is-illegal/",
  FCRA:"https://www.consumerfinance.gov/compliance/compliance-resources/other-applicable-requirements/fair-credit-reporting-act/",
  TILA:"https://www.consumerfinance.gov/rules-policy/regulations/1026/",
  REIT:"https://www.investor.gov/introduction-investing/investing-basics/glossary/real-estate-investment-trust-reit",
  FIDUCIARY:"https://www.investor.gov/introduction-investing/getting-started/working-investment-professional",
  FEES:"https://www.investor.gov/introduction-investing/getting-started/understanding-fees",
  SIMPLEIRA:"https://www.irs.gov/retirement-plans/simple-ira-plan",
  SEPIRA:"https://www.irs.gov/retirement-plans/plan-sponsor/simplified-employee-pension-plan-sep",
  ROYALTIES:"https://apps.irs.gov/app/tax-withholding-estimator/income/",
};

const source=JSON.parse(fs.readFileSync(SOURCE,"utf8"));
const proposals=source.newWorldProposals;
const approved=proposals.filter(item=>!REJECTED.has(item.candidateId));
const termsById=new Map();

function permanentAnswer(answer,puzzleWorld){
  const word=answer.answer;
  if(word==="FRACTION")return {word,category:"ordinary",termId:null,masteryId:null,definition:null,worldId:puzzleWorld,rewardPolicy:"ordinary-first-solve"};
  let termId=answer.permanentTermId,worldId=answer.owningWorld;
  if(!termId){
    const owner=NEW_TERM_OWNERS[word];
    if(!owner)throw new Error(`Missing identity decision for ${word}`);
    [worldId]=owner; termId=`${owner[0]}.${owner[1]}`;
    const definition=DEFINITION_OVERRIDES[word]||answer.clue.text;
    const prior=termsById.get(termId);
    const record={id:termId,word,displayTerm:answer.displayTerm,worldId,definition,approvalStatus:"owner-approved-for-play-2026-10-18",sourceCandidateIds:[],sourceUrl:TERM_SOURCE_URLS[word]||SOURCE_URLS[worldId]||SOURCE_URLS[puzzleWorld]};
    if(prior&&prior.definition!==definition)throw new Error(`Conflicting definition for ${termId}`);
    if(!prior)termsById.set(termId,record);
  }
  const definition=termId===answer.permanentTermId?answer.clue.text:termsById.get(termId).definition;
  const result={word,category:answer.role,termId,masteryId:termId,definition,worldId,rewardPolicy:"financial-first-solve"};
  if(worldId!==puzzleWorld)result.crossWorld=true;
  return result;
}

const banks=Object.fromEntries(Object.keys(WORLD_NAMES).map(worldId=>[worldId,[]]));
for(const proposal of approved){
  const answers=proposal.answers.map(answer=>permanentAnswer(answer,proposal.worldId));
  for(const answer of answers)if(answer.termId&&termsById.has(answer.termId))termsById.get(answer.termId).sourceCandidateIds.push(proposal.candidateId);
  const anchor=answers[0];
  banks[proposal.worldId].push({
    id:`FQ-V3:${proposal.worldId}:${proposal.wheelKey}:R1`,worldId:proposal.worldId,worldName:WORLD_NAMES[proposal.worldId],
    puzzleVersion:3,puzzleMode:"v3",contentRevision:1,contentStatus:"owner-approved-playable",
    sourceReviewId:proposal.candidateId,anchorWord:proposal.wheelKey,anchorTermId:anchor.termId,
    wheelLetters:[...proposal.wheelKey],answers,bonusWords:[],requiredWords:answers.map(answer=>answer.word),
    layout:proposal.layout.map(({word,r,c,dir})=>({word,r,c,dir})),
    rewardPolicy:{financial:{coinsPerLetter:7,xpPerLetter:1.5,roundXp:true},ordinary:{coinsPerWord:1,xp:0},bonus:{coins:0,xp:0}},
  });
}
for(const [worldId,bank] of Object.entries(banks))if(!bank.length)throw new Error(`${worldId} has no approved puzzle`);
for(const term of termsById.values())term.sourceCandidateIds=[...new Set(term.sourceCandidateIds)].sort();

const termPayload={schemaVersion:1,approvalDate:"2026-10-18",approvalScope:"Owner-reviewed terms required by qualifying new-world proposals",terms:[...termsById.values()].sort((a,b)=>a.id.localeCompare(b.id))};
const bankPayload={schemaVersion:1,approvalDate:"2026-10-18",sourceProposalFile:path.relative(ROOT,SOURCE),approvedProposalCount:approved.length,rejectedProposals:[...REJECTED].map(([candidateId,reason])=>({candidateId,reason})),banks};
const js=(globalName,value)=>`(function(root,factory){const value=factory();if(typeof module==="object"&&module.exports)module.exports=value;root.${globalName}=value;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";return ${JSON.stringify(value)};});\n`;
fs.writeFileSync(TERMS_JSON,`${JSON.stringify(termPayload,null,2)}\n`);
fs.writeFileSync(TERMS_JS,js("FINLIT_2027_NEW_WORLD_TERMS",termPayload));
fs.writeFileSync(BANKS_JSON,`${JSON.stringify(bankPayload,null,2)}\n`);
fs.writeFileSync(BANKS_JS,js("FINLIT_2027_NEW_WORLD_PUZZLE_BANKS",bankPayload));
console.log(JSON.stringify({approved:approved.length,rejected:REJECTED.size,terms:termPayload.terms.length,counts:Object.fromEntries(Object.entries(banks).map(([id,bank])=>[id,bank.length]))},null,2));

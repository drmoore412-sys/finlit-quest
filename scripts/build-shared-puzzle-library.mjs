#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(import.meta.url);
const slate=require(path.join(ROOT,"src/v3-puzzle-slate.js"));
const generated=JSON.parse(fs.readFileSync(path.join(ROOT,"content/2027-new-world-puzzle-banks.json"),"utf8"));

const worldOrder=["moneybasics","credit","crypto","banking","investing","coins","ai_technology","real_estate","taxes","insurance","business","social_media","retirement"];
const worldNames={moneybasics:"Money Basics",credit:"Credit Foundations",crypto:"Crypto Foundations",banking:"Banking Basics",investing:"Investing Basics",coins:"Coins & Currency",ai_technology:"AI & Technology",real_estate:"Real Estate",taxes:"Taxes",insurance:"Insurance & Protection",business:"Business & Entrepreneurship",social_media:"Social Media & Digital Income",retirement:"Retirement & Wealth Planning"};
const key=(world,anchor)=>`${world}:${anchor}`;
const original=slate.SPECS.map(spec=>({key:key(spec.worldId,spec.anchor),id:slate.puzzleId(spec.worldId,spec.anchor,spec.revision||slate.CONTENT_REVISION),originWorldId:spec.worldId,anchorWord:spec.anchor}));
const newer=Object.entries(generated.banks).flatMap(([worldId,bank])=>bank.map(puzzle=>({key:key(worldId,puzzle.anchorWord),id:puzzle.id,originWorldId:worldId,anchorWord:puzzle.anchorWord})));
const canonical=[...original,...newer],byKey=new Map(canonical.map(item=>[item.key,item]));
if(canonical.length!==58||byKey.size!==58)throw new Error(`Expected 58 unique canonical puzzles; found ${canonical.length}/${byKey.size}`);

const reasons={
  cashflow:"Connects the key term to household cash flow, earning, spending, saving, or everyday money decisions.",
  credit:"Connects the key term to borrowing capacity, repayment, credit accounts, debt, or credit-based affordability.",
  security:"Connects the key term to protecting financial accounts, identity, credentials, or digital access.",
  investing:"Connects the key term to markets, assets, return, growth, valuation, or portfolio decisions.",
  crypto:"Connects the key term to digital currency, blockchain networks, token markets, or crypto transactions.",
  banking:"Connects the key term to deposits, payments, account services, lending, or the banking relationship.",
  housing:"Connects the key term to renting, home finance, refinancing, property costs, or real-estate obligations.",
  tax:"Connects the key term to taxable income, deductions, credits, filing, or financial records used for taxes.",
  risk:"Connects the key term to financial risk, protection, liability, insured property, or long-term safeguards.",
  business:"Connects the key term to business cash flow, operations, financing, sales, assets, or profitability.",
  creator:"Connects the key term to creator earnings, digital commerce, online marketing, platforms, or account safety.",
  retirement:"Connects the key term to long-term saving, debt readiness, investment growth, income planning, or retirement risk.",
  ai:"Connects the key term to automation, data-driven decisions, technology security, or AI-assisted financial activity.",
  currency:"Connects the key term to money, exchange, purchasing value, physical coins, or digital forms of currency."
};
const shared={
  moneybasics:[["banking:DEPOSITOR","banking"],["banking:CONVERT","currency"],["investing:SAVING","cashflow"],["investing:GROWTH","investing"],["investing:RETURN","investing"],["taxes:INCOMETAX","tax"],["taxes:TAXCREDIT","tax"],["insurance:CASHVALUE","risk"],["business:NETINCOME","business"],["business:BREAKEVEN","business"]],
  credit:[["moneybasics:PAYMENT","credit"],["moneybasics:BUDGET","credit"],["moneybasics:PAYCHECK","credit"],["banking:DEPOSITOR","banking"],["banking:PASSWORD","security"],["banking:PASSKEY","security"],["real_estate:APARTMENT","housing"],["real_estate:REFINANCE","credit"],["insurance:LIABILITY","risk"]],
  crypto:[["coins:COINGRADE","currency"],["coins:MELTVALUE","currency"],["coins:PROOFLIKE","crypto"],["coins:SPOTPRICE","investing"],["ai_technology:AUTOTRADE","ai"],["taxes:INCOMETAX","tax"],["taxes:TAXFILING","tax"],["business:NETINCOME","business"],["investing:TRADE","investing"],["investing:MARKET","investing"]],
  banking:[["moneybasics:PAYMENT","banking"],["moneybasics:REFUND","banking"],["moneybasics:PAYCHECK","banking"],["moneybasics:BUDGET","cashflow"],["credit:PRINCIPAL","credit"],["credit:REPAYMENT","credit"],["credit:AUTOPAY","banking"],["real_estate:REFINANCE","housing"],["business:BREAKEVEN","business"],["taxes:INCOMETAX","tax"]],
  investing:[["crypto:TOKEN","crypto"],["crypto:STAKE","crypto"],["coins:SPOTPRICE","investing"],["ai_technology:AUTOTRADE","ai"],["business:BREAKEVEN","business"],["business:NETINCOME","business"],["retirement:FIDUCIARY","retirement"],["retirement:COASTFIRE","retirement"],["retirement:SIMPLEIRA","retirement"]],
  coins:[["crypto:TOKEN","crypto"],["crypto:CHAIN","crypto"],["crypto:INCOME","currency"],["crypto:BLOCK","crypto"],["moneybasics:PAYMENT","currency"],["moneybasics:RECEIPT","currency"],["moneybasics:REFUND","currency"],["moneybasics:BUDGET","cashflow"],["investing:MARKET","investing"],["investing:TRADE","investing"],["investing:RETURN","investing"]],
  ai_technology:[["banking:NETWORK","ai"],["banking:PASSWORD","security"],["banking:PASSKEY","security"],["crypto:BLOCK","crypto"],["crypto:CHAIN","crypto"],["crypto:TOKEN","crypto"],["investing:STOCK","investing"],["investing:MARKET","investing"],["investing:TRADE","investing"],["business:MARKETING","ai"],["business:INVENTORY","ai"],["business:RETENTION","ai"],["social_media:ADREVENUE","creator"],["business:FREELANCE","ai"]],
  real_estate:[["credit:TERMS","housing"],["credit:PRINCIPAL","housing"],["credit:REPAYMENT","housing"],["credit:CAPACITY","housing"],["moneybasics:PAYMENT","housing"],["moneybasics:BUDGET","housing"],["investing:SAVING","housing"],["taxes:TAXCREDIT","tax"],["taxes:TAXFILING","tax"],["insurance:EXCLUSION","risk"],["insurance:LIABILITY","risk"],["business:INVENTORY","business"],["business:WHOLESALE","housing"]],
  taxes:[["moneybasics:PAYCHECK","tax"],["moneybasics:REFUND","tax"],["crypto:INCOME","tax"],["investing:SAVING","tax"],["investing:RETURN","tax"],["business:NETINCOME","tax"],["business:FREELANCE","tax"],["business:FACTORING","tax"],["business:WHOLESALE","tax"],["social_media:ROYALTIES","tax"],["social_media:ADREVENUE","tax"],["retirement:SIMPLEIRA","tax"]],
  insurance:[["moneybasics:BUDGET","risk"],["real_estate:APARTMENT","risk"],["real_estate:REFINANCE","risk"],["banking:PASSWORD","security"],["banking:PASSKEY","security"],["business:INVENTORY","risk"],["business:FREELANCE","risk"],["business:FRANCHISE","risk"],["retirement:LONGEVITY","retirement"],["retirement:LIFESTYLE","retirement"],["business:WHOLESALE","risk"]],
  business:[["ai_technology:AUTOTRADE","business"],["taxes:TAXFILING","tax"],["insurance:LIABILITY","risk"],["social_media:ADREVENUE","creator"],["social_media:ROYALTIES","creator"]],
  social_media:[["business:MARKETING","creator"],["business:FREELANCE","creator"],["business:NETINCOME","creator"],["business:TRADEMARK","creator"],["business:RETENTION","creator"],["business:BREAKEVEN","creator"],["business:INVENTORY","creator"],["banking:PASSWORD","security"],["banking:PASSKEY","security"],["taxes:INCOMETAX","tax"],["taxes:TAXFILING","tax"],["crypto:TOKEN","creator"],["crypto:CHAIN","creator"]],
  retirement:[["investing:SAVING","retirement"],["investing:STOCK","retirement"],["investing:GROWTH","retirement"],["investing:TRADE","retirement"],["investing:MARKET","retirement"],["investing:RETURN","retirement"],["moneybasics:BUDGET","retirement"],["credit:REPAYMENT","retirement"],["real_estate:REFINANCE","retirement"],["insurance:CASHVALUE","retirement"]]
};

const placements={};
for(const worldId of worldOrder){
  const own=canonical.filter(item=>item.originWorldId===worldId).map(item=>({puzzleId:item.id,originWorldId:item.originWorldId,placementType:"original",relevance:`Canonical ${worldNames[worldId]} puzzle retained in its original order.`}));
  const additions=(shared[worldId]||[]).map(([lookup,reasonKey])=>{const item=byKey.get(lookup);if(!item)throw new Error(`Unknown shared puzzle ${lookup}`);return {puzzleId:item.id,originWorldId:item.originWorldId,placementType:"shared",relevance:`${item.anchorWord}: ${reasons[reasonKey]}`};});
  const list=[...own,...additions].map((item,index)=>({...item,position:index+1}));
  if(list.length!==15)throw new Error(`${worldId} has ${list.length} placements, expected 15`);
  if(new Set(list.map(item=>item.puzzleId)).size!==list.length)throw new Error(`${worldId} contains duplicate puzzle references`);
  placements[worldId]=list;
}

const placementIds=new Set(Object.values(placements).flat().map(item=>item.puzzleId));
if(placementIds.size!==58)throw new Error(`Shared library lost canonical puzzles: ${placementIds.size}/58 referenced`);
const report={
  schemaVersion:1,libraryVersion:"2027.1",generatedOn:"2026-10-19",uniquePuzzleCount:58,totalWorldPlacements:worldOrder.length*15,
  architecture:{canonicalDefinitionRule:"Puzzle definitions remain in their existing approved canonical sources. This manifest stores references only.",originalSource:"src/v3-puzzle-slate.js",newWorldSource:"content/2027-new-world-puzzle-banks.json",rewardRule:"First-discovery rewards are keyed to canonical puzzle IDs; world progress is recorded separately."},
  canonicalPuzzleIndex:canonical.map(({key:_,...item})=>item),worldPlacements:placements
};
const json=JSON.stringify(report,null,2)+"\n";
fs.writeFileSync(path.join(ROOT,"content/shared-puzzle-library-2027.json"),json);
fs.writeFileSync(path.join(ROOT,"content/shared-puzzle-library-2027.js"),`window.FINLIT_SHARED_PUZZLE_LIBRARY_2027 = ${JSON.stringify(report)};\n`);
console.log(`Shared puzzle library: ${report.uniquePuzzleCount} canonical puzzles, ${report.totalWorldPlacements} placements, 15 per world.`);

#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require=createRequire(import.meta.url),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const collector=require("../src/candidate-source-collector.js"),pipeline=require("../src/crossword-candidate-pipeline.js"),game=require("../src/game-engine.js"),slate=require("../src/v3-puzzle-slate.js"),creditIds=require("../content/credit-term-identities.js"),supplement=require("../content/v3-supplemental-terms.js");

function argsFor(tokens){const args={_:[]};for(const token of tokens){if(!token.startsWith("--")){args._.push(token);continue}const [key,...rest]=token.slice(2).split("=");args[key]=rest.length?rest.join("="):true}return args}
function required(args,key){if(!args[key]||args[key]===true)throw new Error(`Missing --${key}=...`);return args[key]}
async function readJson(file){return JSON.parse(await fs.readFile(path.resolve(file),"utf8"))}
async function writeFile(file,content){const target=path.resolve(file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,content);return target}
function isProtectedOutput(file){const relative=path.relative(root,path.resolve(file));return !relative.startsWith("..")&&(/^(content|curriculum)(\/|$)/.test(relative)||relative==="src"||relative.startsWith("src/")||relative==="worlds"||relative.startsWith("worlds/"))}
function safeOutput(file){if(isProtectedOutput(file))throw new Error("Candidate tooling cannot write to content/, curriculum/, src/, or worlds/. Use a staging/review directory.");return file}

async function governedTerms(){
  const files={credit:"content/credit-game-terms.json",moneybasics:"content/money-basics-terms.json",banking:"content/banking-basics-terms.json",investing:"content/investing-basics-terms.json",crypto:"content/crypto-terms.json"},worlds={};
  for(const [world,file] of Object.entries(files)){const records=JSON.parse(await fs.readFile(path.join(root,file),"utf8"));worlds[world]=records.map(record=>({id:world==="credit"?creditIds.idForWord(record.word):(record.id||record.termId),word:record.word,definition:record.definition,world}))}
  const merged=supplement.merge(worlds);return Object.values(merged).flat().map(term=>({id:term.id||term.termId,word:term.word,definition:term.definition,world:term.world||String(term.id||term.termId).split(".")[0]}));
}
function approvedOrdinaryWords(){const words=[...new Set(slate.SPECS.flatMap(spec=>spec.ordinary||[]))];return words.map(word=>({word,approvalStatus:"approved-support",familiarity:10,sources:[{sourceId:"CAL-0007/V3-reviewed-compositions"}]}))}
async function loadKeywords(file){if(!file)return approvedOrdinaryWords();const data=await readJson(file),records=Array.isArray(data)?data:(data.keywords||[]),approved=approvedOrdinaryWords(),byWord=new Map(approved.map(item=>[item.word,item]));for(const item of records)if(!byWord.has(String(item.word).toUpperCase()))byWord.set(String(item.word).toUpperCase(),item);return [...byWord.values()]}
async function loadDocument(source){
  if(source.url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch(source.url,{headers:{"User-Agent":"FinLitQuest-CandidateCollector/1.0 (owner-review staging)"},signal:controller.signal});if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);const text=await response.text();if(text.length>2_000_000)throw new Error("Source exceeds the 2 MB collection limit");return {...source,text,contentType:response.headers.get("content-type")?.includes("html")?"text/html":"text/plain"}}finally{clearTimeout(timer)}}
  if(source.path){const target=path.resolve(source.path),text=await fs.readFile(target,"utf8");return {...source,path:target,text,contentType:source.contentType||(/\.html?$/i.test(target)?"text/html":"text/plain")}}
  throw new Error(`Source ${source.id||"(unnamed)"} requires url or path.`);
}

function usage(){return `FinLit Quest crossword candidate pipeline

Commands:
  collect   --sources=manifest.json --out=staging/keywords.json
  generate  --world=<id> --anchor=<term.id> [--keywords=file] --out=staging/review
  benchmark --world=<id> [--keywords=file] --out=staging/benchmark.json
  export    --candidate=file.json --revision=<n> --out=staging/export.json

All outputs must remain outside content/, curriculum/, src/, and worlds/.`}

const args=argsFor(process.argv.slice(2)),command=args._[0];
if(!command||args.help){console.log(usage());process.exit(0)}

if(command==="collect"){
  const manifest=await readJson(required(args,"sources")),sources=manifest.sources||[];
  const documents=[];for(const source of sources)documents.push(await loadDocument(source));
  const result=collector.collectDocuments(documents,{minLength:Number(args["min-length"]||3),maxLength:Number(args["max-length"]||9),stopWords:manifest.stopWords});
  result.world=manifest.world||null;result.notice="Collected words are unreviewed candidates. They are not approved curriculum or ordinary supporting words.";
  const target=await writeFile(safeOutput(required(args,"out")),`${JSON.stringify(result,null,2)}\n`);console.log(`Collected ${result.keywordCount} candidate keywords from ${result.documentCount} source(s): ${target}`);
}else if(command==="generate"){
  const worldId=required(args,"world"),anchorTermId=required(args,"anchor"),outDir=safeOutput(required(args,"out")),terms=await governedTerms(),registry=pipeline.createRegistry(terms);if(registry.errors.length)throw new Error(JSON.stringify(registry.errors));
  const ordinaryWords=await loadKeywords(args.keywords),started=performance.now(),result=pipeline.generateCandidates({worldId,anchorTermId,ordinaryWords},{registry,solveCrosswordFn:game.solveCrossword,validateCrosswordLayoutFn:game.validateCrosswordLayout},{candidateLimit:Number(args.limit||20),combinationLimit:Number(args.combinations||5000),maxLayouts:Number(args.layouts||3),targetDifficultyWords:Number(args["target-words"]||4)}),elapsedMs=performance.now()-started;
  await fs.mkdir(path.resolve(outDir),{recursive:true});
  for(const candidate of result.candidates){await writeFile(path.join(outDir,`${candidate.candidateId.replace(/[:]/g,"_")}.json`),`${JSON.stringify(candidate,null,2)}\n`);await writeFile(path.join(outDir,`${candidate.candidateId.replace(/[:]/g,"_")}.md`),pipeline.reviewMarkdown(candidate))}
  const summary={schemaVersion:1,worldId,anchorTermId,generatedAt:new Date().toISOString(),elapsedMs:+elapsedMs.toFixed(3),combinationsExamined:result.examined,candidatesGenerated:result.candidates.length,eligibleCandidates:result.candidates.filter(item=>item.validation.eligible).length,candidatesPerMinute:result.candidates.length?+(result.candidates.length/(elapsedMs/60000)).toFixed(1):0,manualReviewRequired:result.candidates.length,files:result.candidates.map(item=>item.candidateId)};
  await writeFile(path.join(outDir,"summary.json"),`${JSON.stringify(summary,null,2)}\n`);console.log(JSON.stringify(summary,null,2));
}else if(command==="benchmark"){
  const worldId=required(args,"world"),out=safeOutput(required(args,"out")),terms=await governedTerms(),registry=pipeline.createRegistry(terms),ordinaryWords=await loadKeywords(args.keywords),anchors=registry.terms.filter(term=>term.world===worldId&&term.word.length<=9),started=performance.now();let generated=0,eligible=0,examined=0;
  for(const anchor of anchors){const result=pipeline.generateCandidates({worldId,anchorTermId:anchor.id,ordinaryWords},{registry,solveCrosswordFn:game.solveCrossword,validateCrosswordLayoutFn:game.validateCrosswordLayout},{candidateLimit:Number(args.limit||3),combinationLimit:Number(args.combinations||1000),maxLayouts:Number(args.layouts||2)});generated+=result.candidates.length;eligible+=result.candidates.filter(item=>item.validation.eligible).length;examined+=result.examined}
  const elapsedMs=performance.now()-started,report={schemaVersion:1,worldId,generatedAt:new Date().toISOString(),anchorsAttempted:anchors.length,combinationsExamined:examined,candidatesGenerated:generated,eligibleCandidates:eligible,validationPassPercentage:generated?+(eligible/generated*100).toFixed(1):null,candidatesPerMinute:generated?+(generated/(elapsedMs/60000)).toFixed(1):0,manualReviewRequired:generated,automatedElapsedMs:+elapsedMs.toFixed(3),ownerApprovalTimeMinutes:null,ownerApprovalTimeNote:"Not measurable until owner review timestamps exist."};await writeFile(out,`${JSON.stringify(report,null,2)}\n`);console.log(JSON.stringify(report,null,2));
}else if(command==="export"){
  const candidate=await readJson(required(args,"candidate")),terms=await governedTerms(),registry=pipeline.createRegistry(terms),record=pipeline.exportApprovedCandidate(candidate,{revision:Number(args.revision||1)},{registry,validateCrosswordLayoutFn:game.validateCrosswordLayout}),target=await writeFile(safeOutput(required(args,"out")),`${JSON.stringify(record,null,2)}\n`);console.log(`Exported owner-approved candidate to ${target}`);
}else throw new Error(`Unknown command '${command}'.\n${usage()}`);

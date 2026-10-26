#!/usr/bin/env node
// Mechanical importer for Currency Rush. The editorial/runtime source is the
// ISO 4217 List One XML maintained by SIX; this script never invents codes.
import fs from "node:fs";
import path from "node:path";

const input=process.argv[2];
const output=process.argv[3]||path.resolve("content/currency-rush-data.js");
if(!input)throw new Error("Usage: node scripts/import-currency-rush-data.mjs list-one.xml [output]");
const xml=fs.readFileSync(input,"utf8");
const published=(xml.match(/<ISO_4217[^>]*Pblshd="([^"]+)"/)||[])[1];
if(!published)throw new Error("Could not read the ISO 4217 publication date");
const decode=value=>value.replace(/&amp;/g,"&").replace(/&apos;/g,"'").replace(/&quot;/g,'"').replace(/&#x([0-9A-F]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const text=(block,tag)=>{const match=block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));return match?decode(match[1].trim()):""};
const records=new Map();
for(const match of xml.matchAll(/<CcyNtry>([\s\S]*?)<\/CcyNtry>/g)){
  const block=match[1],code=text(block,"Ccy"),name=text(block,"CcyNm"),country=text(block,"CtryNm");
  if(!/^[A-Z]{3}$/.test(code)||!name)continue;
  if(!records.has(code))records.set(code,{code,name,isFund:/<CcyNm\s[^>]*IsFund="true"/i.test(block),countries:[]});
  if(country&&!records.get(code).countries.includes(country))records.get(code).countries.push(country);
}
const wheels=["SKZRUEADC","NXIRDMYTC","HFODPKNUC","PBNLGERUT","ADMNGRVSE","LHRDWABTK","JPYUSDERA"];
const counts=value=>[...value].reduce((map,char)=>(map[char]=(map[char]||0)+1,map),{});
const canForm=(code,wheel)=>{const available=counts(wheel);return Object.entries(counts(code)).every(([letter,count])=>(available[letter]||0)>=count)};
const rounds=wheels.map((wheel,index)=>({
  id:`currency-rush-${String(index+1).padStart(2,"0")}`,
  number:index+1,
  wheel,
  requiredCodes:[...records.values()].filter(record=>canForm(record.code,wheel)).map(record=>record.code).sort(),
}));
const used=new Set(rounds.flatMap(round=>round.requiredCodes));
const currencies=Object.fromEntries([...used].sort().map(code=>[code,records.get(code)]));
const payload={
  schemaVersion:1,
  status:"practice-only",
  source:{name:"ISO 4217 List One",maintainer:"SIX Financial Information AG — ISO 4217 Maintenance Agency",published,url:"https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml",imported:"2026-10-26"},
  scoring:{code:100,streak:50,streakLength:3,completion:250,perSecond:10,durationSeconds:60},
  rounds,currencies,
};
const source=`(function(root,factory){const data=factory();if(typeof module==="object"&&module.exports)module.exports=data;root.FINLIT_CURRENCY_RUSH_DATA=data})(typeof globalThis!=="undefined"?globalThis:this,function(){\n  "use strict";\n  return Object.freeze(${JSON.stringify(payload,null,2)});\n});\n`;
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,source);
console.log(`Generated ${output}: ${rounds.length} rounds, ${used.size} unique codes, ${rounds.reduce((sum,round)=>sum+round.requiredCodes.length,0)} placements`);

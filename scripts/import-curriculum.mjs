import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import {createRequire} from "node:module";
import {FileBlob,SpreadsheetFile} from "@oai/artifact-tool";

const require=createRequire(import.meta.url);
const {mapDataset}=require("../src/curriculum-import-core.js");
const validator=require("../src/curriculum-validator.js");
const {buildImportReport,toMarkdown}=require("../src/curriculum-import-report.js");
const {approvedPaths,assertWorkbookPath}=require("../src/curriculum-path-policy.js");
const args=Object.fromEntries(process.argv.slice(2).map((value,index,all)=>value.startsWith("--")?[value.slice(2),all[index+1]]:null).filter(Boolean));
if(!args.map)throw new Error("Usage: node scripts/import-curriculum.mjs --map curriculum/<world>/approved/import-map.json");
const mapPath=path.resolve(args.map),mapping=JSON.parse(await fs.readFile(mapPath,"utf8")),locations=approvedPaths(mapPath,mapping.world,mapping.curriculumVersion),cache=new Map(),sources=new Map();
async function openWorkbook(file){const absolute=assertWorkbookPath(locations.workbooksDir,path.resolve(locations.workbooksDir,file));if(!cache.has(absolute)){const bytes=await fs.readFile(absolute);cache.set(absolute,await SpreadsheetFile.importXlsx(await FileBlob.load(absolute)));sources.set(absolute,{fileName:path.basename(absolute),sha256:crypto.createHash("sha256").update(bytes).digest("hex")})}return cache.get(absolute)}
async function dataset(name){const spec=mapping.datasets?.[name];if(!spec)throw new Error(`Import map is missing datasets.${name}.`);const workbook=await openWorkbook(spec.workbook),sheet=workbook.worksheets.getItem(spec.sheet),matrix=sheet.getUsedRange(true).values;return mapDataset(matrix,spec)}
const [sections,objectives,approvalRows,controlledRows]=await Promise.all([dataset("sections"),dataset("objectives"),dataset("approvalLog"),dataset("controlledValues")]);
const stableHash=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const output={schemaVersion:1,curriculumVersion:mapping.curriculumVersion,world:mapping.world,generatedAt:new Date().toISOString(),source:{workbooks:[...sources.values()],approvalLogHash:stableHash(approvalRows),controlledValuesHash:stableHash(controlledRows)},sections,objectives};
const validation=validator.validateCurriculum(output,{termIds:mapping.termIds||[]}),report=buildImportReport(output,validation),outputPath=locations.runtimeFile,reportDir=locations.reportsDir;
await fs.mkdir(reportDir,{recursive:true});
await Promise.all([fs.writeFile(path.join(reportDir,`${output.world}-world-import-report.json`),`${JSON.stringify(report,null,2)}\n`),fs.writeFile(path.join(reportDir,`${output.world}-world-import-report.md`),toMarkdown(report)),fs.writeFile(path.join(reportDir,`${output.world}-world-validation-report.json`),`${JSON.stringify(report.validation,null,2)}\n`)]);
if(!validation.valid)throw new Error(`Curriculum validation failed. Runtime JSON was not generated. See ${output.world}-world-import-report.md.`);
await fs.mkdir(path.dirname(outputPath),{recursive:true});
await fs.writeFile(outputPath,`${JSON.stringify(output,null,2)}\n`);
console.log(`Validated ${sections.length} sections and ${objectives.length} objectives for ${output.world} curriculum ${output.curriculumVersion}. Import report: ${path.join(reportDir,`${output.world}-world-import-report.md`)}`);

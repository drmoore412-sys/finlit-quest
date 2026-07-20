const test=require("node:test"),assert=require("node:assert/strict");
const {validateWorkbookWorld}=require("../src/workbook-validator.js");
const fs=require("node:fs"),path=require("node:path");

function loadValid(){
  const runtime=JSON.parse(fs.readFileSync(path.join(__dirname,"../curriculum/credit/approved/runtime/credit-foundations.json"),"utf8"));
  const world=JSON.parse(fs.readFileSync(path.join(__dirname,"../worlds/credit-foundations.json"),"utf8"));
  return {world,workbooks:structuredClone(runtime.workbooks)};
}

test("rejects a workbook with an out-of-range correctIndex",()=>{
  const {world,workbooks}=loadValid();
  workbooks[0].assessment.multipleChoice[0].correctIndex=99;
  const result=validateWorkbookWorld(world,workbooks);
  assert.equal(result.valid,false);
  assert.match(result.errors.join("\n"),/correctIndex must be a valid option index/);
});

test("rejects a broken prerequisite chain",()=>{
  const {world,workbooks}=loadValid();
  workbooks.find(w=>w.id==="CRF-005").prerequisiteWorkbookId="CRF-002";
  const result=validateWorkbookWorld(world,workbooks);
  assert.equal(result.valid,false);
  assert.match(result.errors.join("\n"),/immediately preceding sequence/);
});

test("rejects duplicate workbook ids",()=>{
  const {world,workbooks}=loadValid();
  workbooks[1].id=workbooks[0].id;
  const result=validateWorkbookWorld(world,workbooks);
  assert.equal(result.valid,false);
  assert.match(result.errors.join("\n"),/Duplicate workbook id/);
});

test("rejects a workbook missing an assessment type",()=>{
  const {world,workbooks}=loadValid();
  workbooks[0].assessment.matching=[];
  const result=validateWorkbookWorld(world,workbooks);
  assert.equal(result.valid,false);
  assert.match(result.errors.join("\n"),/assessment\.matching must be non-empty/);
});

test("rejects a world whose workbookIds do not match the provided workbooks",()=>{
  const {world,workbooks}=loadValid();
  const brokenWorld={...world,workbookIds:world.workbookIds.slice(0,10)};
  const result=validateWorkbookWorld(brokenWorld,workbooks);
  assert.equal(result.valid,false);
  assert.match(result.errors.join("\n"),/workbookIds must exactly match/);
});

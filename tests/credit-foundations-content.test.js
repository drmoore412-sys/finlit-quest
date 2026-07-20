const test=require("node:test"),assert=require("node:assert/strict");
const {validateWorkbookWorld}=require("../src/workbook-validator.js");
const fs=require("node:fs"),path=require("node:path");

function load(){
  const runtime=JSON.parse(fs.readFileSync(path.join(__dirname,"../curriculum/credit/approved/runtime/credit-foundations.json"),"utf8"));
  const world=JSON.parse(fs.readFileSync(path.join(__dirname,"../worlds/credit-foundations.json"),"utf8"));
  return {world,workbooks:runtime.workbooks};
}

test("exactly fifteen Credit Foundations workbooks exist, CRF-001 through CRF-015",()=>{
  const {workbooks}=load();
  assert.equal(workbooks.length,15);
  const ids=workbooks.map(w=>w.id).sort();
  const expected=Array.from({length:15},(_,i)=>`CRF-${String(i+1).padStart(3,"0")}`).sort();
  assert.deepEqual(ids,expected);
});

test("the generated world and workbook set pass workbook-world validation",()=>{
  const {world,workbooks}=load();
  const result=validateWorkbookWorld(world,workbooks);
  assert.equal(result.valid,true,result.errors.join("\n"));
});

test("sequence is contiguous 1-15 with no duplicates or gaps",()=>{
  const {workbooks}=load();
  const sequences=workbooks.map(w=>w.sequence).sort((a,b)=>a-b);
  assert.deepEqual(sequences,Array.from({length:15},(_,i)=>i+1));
});

test("prerequisite chain unlocks each workbook from exactly the previous one, CRF-001 has none",()=>{
  const {workbooks}=load();
  const byId=new Map(workbooks.map(w=>[w.id,w]));
  workbooks.forEach(w=>{
    if(w.sequence===1){assert.equal(w.prerequisiteWorkbookId,null,`${w.id} should have no prerequisite`)}
    else{
      assert.ok(w.prerequisiteWorkbookId,`${w.id} must declare a prerequisite`);
      const prereq=byId.get(w.prerequisiteWorkbookId);
      assert.ok(prereq,`${w.id} prerequisite must exist`);
      assert.equal(prereq.sequence,w.sequence-1,`${w.id} prerequisite must be the immediately preceding workbook`);
    }
  });
});

test("every workbook has a complete practice and assessment set",()=>{
  const {workbooks}=load();
  workbooks.forEach(w=>{
    assert.ok(w.flashcards.length>=1,`${w.id} needs flashcards`);
    assert.ok(w.assessment.multipleChoice.length>=1,`${w.id} needs multiple-choice questions`);
    assert.ok(w.assessment.trueFalse.length>=1,`${w.id} needs true/false questions`);
    assert.ok(w.assessment.matching.length>=1,`${w.id} needs a matching activity`);
    assert.ok(w.assessment.scenario.prompt&&w.assessment.scenario.expectedAnswer,`${w.id} needs a scenario activity`);
    assert.ok(w.masteryRule.passingScore>0&&w.masteryRule.passingScore<=1,`${w.id} needs a valid passing score`);
  });
});

test("no duplicate assessment ids exist across the world",()=>{
  const {workbooks}=load();
  const ids=new Set();
  workbooks.forEach(w=>{
    [...w.assessment.multipleChoice,...w.assessment.trueFalse].forEach(item=>{
      assert.ok(!ids.has(item.id),`Duplicate assessment id '${item.id}'`);
      ids.add(item.id);
    });
  });
});

test("multiple-choice correctIndex always points at a real option",()=>{
  const {workbooks}=load();
  workbooks.forEach(w=>{
    w.assessment.multipleChoice.forEach(q=>{
      assert.ok(q.correctIndex>=0&&q.correctIndex<q.options.length,`${w.id} ${q.id} correctIndex out of range`);
    });
  });
});

test("XP is positive and increases with difficulty across the sequence in aggregate",()=>{
  const {workbooks}=load();
  workbooks.forEach(w=>assert.ok(w.xp>0,`${w.id} xp must be positive`));
  const firstThird=workbooks.filter(w=>w.sequence<=5).reduce((sum,w)=>sum+w.xp,0)/5;
  const lastThird=workbooks.filter(w=>w.sequence>=11).reduce((sum,w)=>sum+w.xp,0)/5;
  assert.ok(lastThird>=firstThird,"later workbooks should not award less XP on average than earlier ones");
});

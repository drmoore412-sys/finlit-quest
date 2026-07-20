const test=require("node:test"),assert=require("node:assert/strict");
const engine=require("../src/workbook-engine.js");
const fs=require("node:fs"),path=require("node:path");

function loadWorkbooks(){
  const runtime=JSON.parse(fs.readFileSync(path.join(__dirname,"../curriculum/credit/approved/runtime/credit-foundations.json"),"utf8"));
  return runtime.workbooks;
}

test("scoreQuiz reports the correct percent and pass/fail at the 80% boundary",()=>{
  const [crf001]=loadWorkbooks();
  const allCorrectMc=crf001.assessment.multipleChoice.map(q=>q.correctIndex);
  const allCorrectTf=crf001.assessment.trueFalse.map(q=>q.answer);
  const perfect=engine.scoreQuiz(crf001,allCorrectMc,allCorrectTf);
  assert.equal(perfect.percent,100);
  assert.equal(perfect.passed,true);
  assert.equal(perfect.correct,8);
  assert.equal(perfect.total,8);

  // 6/8 = 75%, below the 80% bar
  const mostlyWrongMc=[...allCorrectMc];
  mostlyWrongMc[0]=(mostlyWrongMc[0]+1)%crf001.assessment.multipleChoice[0].options.length;
  mostlyWrongMc[1]=(mostlyWrongMc[1]+1)%crf001.assessment.multipleChoice[1].options.length;
  const belowBar=engine.scoreQuiz(crf001,mostlyWrongMc,allCorrectTf);
  assert.equal(belowBar.percent,75);
  assert.equal(belowBar.passed,false);
});

test("scoreQuiz throws on mismatched answer counts",()=>{
  const [crf001]=loadWorkbooks();
  assert.throws(()=>engine.scoreQuiz(crf001,[0,0],[]),/multiple-choice answers/);
});

// --- answerPositionForType: the on-screen-position -> per-type-array-index
// mapping workbook-app.js relies on to build mcAnswers/tfAnswers as the
// learner answers an interleaved mc/tf quiz. This is the one piece of the
// scoring pipeline that previously lived only in DOM-coupled workbook-app.js
// (untestable there) — extracted so it has real automated coverage.

test("answerPositionForType maps a question's on-screen index to its position within its own type",()=>{
  const quizQuestions=[{type:"mc"},{type:"tf"},{type:"mc"},{type:"mc"},{type:"tf"}];
  assert.equal(engine.answerPositionForType(quizQuestions,0,"mc"),0); // 1st mc
  assert.equal(engine.answerPositionForType(quizQuestions,1,"tf"),0); // 1st tf
  assert.equal(engine.answerPositionForType(quizQuestions,2,"mc"),1); // 2nd mc
  assert.equal(engine.answerPositionForType(quizQuestions,3,"mc"),2); // 3rd mc
  assert.equal(engine.answerPositionForType(quizQuestions,4,"tf"),1); // 2nd tf
});

test("a full simulated quiz walk (mc/tf concatenated, answered in on-screen order) scores identically to the workbook's own answer key",()=>{
  // Mirrors exactly what wbOpenQuiz/wbAnswerMc/wbAnswerTf/wbFinishQuiz do in
  // workbook-app.js: build the concatenated [...mc, ...tf] question list,
  // answer each in on-screen order using answerPositionForType to place it,
  // then score. Deliberately gets the 2nd mc question and the 1st tf question
  // wrong so a real mismatch would be caught, not just a perfect/all-wrong run.
  const [crf001]=loadWorkbooks();
  const mc=crf001.assessment.multipleChoice,tf=crf001.assessment.trueFalse;
  const quizQuestions=[...mc.map(q=>({type:"mc",question:q})),...tf.map(q=>({type:"tf",question:q}))];
  const mcAnswers=new Array(mc.length).fill(-1),tfAnswers=new Array(tf.length).fill(null);

  quizQuestions.forEach((item,index)=>{
    if(item.type==="mc"){
      const pos=engine.answerPositionForType(quizQuestions,index,"mc");
      const wrongOnPurpose=pos===1; // 2nd mc question answered incorrectly
      mcAnswers[pos]=wrongOnPurpose?(item.question.correctIndex+1)%item.question.options.length:item.question.correctIndex;
    } else {
      const pos=engine.answerPositionForType(quizQuestions,index,"tf");
      const wrongOnPurpose=pos===0; // 1st tf question answered incorrectly
      tfAnswers[pos]=wrongOnPurpose?!item.question.answer:item.question.answer;
    }
  });

  const result=engine.scoreQuiz(crf001,mcAnswers,tfAnswers);
  assert.equal(result.total,8);
  assert.equal(result.correct,6); // everything right except the 2 deliberately-wrong questions
  assert.equal(result.mcResults[1].correct,false);
  assert.equal(result.tfResults[0].correct,false);
  assert.ok(result.mcResults.filter((r,i)=>i!==1).every(r=>r.correct));
  assert.ok(result.tfResults.filter((r,i)=>i!==0).every(r=>r.correct));
});

test("buildMatchingRound preserves pair mapping through the shuffle",()=>{
  const workbook=loadWorkbooks().find(w=>w.id==="CRF-008");
  const {lefts,rights}=engine.buildMatchingRound(workbook,list=>[...list].reverse());
  assert.equal(lefts.length,workbook.assessment.matching.length);
  assert.equal(rights.length,workbook.assessment.matching.length);
  lefts.forEach(left=>{
    const correctRight=rights.find(r=>r.pairIndex===left.pairIndex);
    assert.equal(correctRight.text,workbook.assessment.matching[left.pairIndex].right);
  });
});

test("isWorkbookUnlocked honors the prerequisite chain",()=>{
  const workbooks=loadWorkbooks();
  const crf001=workbooks.find(w=>w.id==="CRF-001"),crf002=workbooks.find(w=>w.id==="CRF-002");
  assert.equal(engine.isWorkbookUnlocked(crf001,[]),true);
  assert.equal(engine.isWorkbookUnlocked(crf002,[]),false);
  assert.equal(engine.isWorkbookUnlocked(crf002,["CRF-001"]),true);
});

test("workbookStatus reflects locked, available, in_progress, and completed",()=>{
  const workbooks=loadWorkbooks();
  const crf002=workbooks.find(w=>w.id==="CRF-002");
  assert.equal(engine.workbookStatus(crf002,null,[]),"locked");
  assert.equal(engine.workbookStatus(crf002,null,["CRF-001"]),"available");
  assert.equal(engine.workbookStatus(crf002,{attempts:1,status:"available"},["CRF-001"]),"in_progress");
  assert.equal(engine.workbookStatus(crf002,{attempts:2,status:"completed"},["CRF-001"]),"completed");
});

test("nextAvailableWorkbook finds the first non-locked, non-completed workbook in sequence",()=>{
  const workbooks=loadWorkbooks();
  const progress={"CRF-001":{status:"completed",attempts:1},"CRF-002":{status:"completed",attempts:1}};
  const next=engine.nextAvailableWorkbook(workbooks,progress);
  assert.equal(next.id,"CRF-003");
});

test("nextAvailableWorkbook returns null once every workbook is completed",()=>{
  const workbooks=loadWorkbooks();
  const progress=Object.fromEntries(workbooks.map(w=>[w.id,{status:"completed",attempts:1}]));
  assert.equal(engine.nextAvailableWorkbook(workbooks,progress),null);
});

test("worldCompletionPercent computes completed / total workbooks",()=>{
  const workbooks=loadWorkbooks();
  const progress={"CRF-001":{status:"completed"},"CRF-002":{status:"completed"},"CRF-003":{status:"available"}};
  assert.equal(engine.worldCompletionPercent(workbooks,progress),Math.round((2/15)*100));
});

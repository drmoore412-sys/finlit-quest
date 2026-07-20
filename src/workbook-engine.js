(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitWorkbookEngine=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // Maps a position in the on-screen (possibly mc/tf-interleaved) quiz question
  // list back to the index within that type's own answer array — e.g. the 2nd
  // "mc"-type question shown is mcAnswers[1], regardless of how many "tf"
  // questions appear before it on screen. scoreQuiz assumes mcAnswers[i]/
  // tfAnswers[i] line up positionally with workbook.assessment.multipleChoice[i]/
  // trueFalse[i], so this mapping is the one thing standing between "answered
  // correctly" and "scored correctly" — previously inlined separately in both
  // wbAnswerMc and wbAnswerTf (workbook-app.js), untestable there since that
  // file is DOM-coupled. Extracted here so it's covered by an automated test.
  function answerPositionForType(quizQuestions,index,type){
    return quizQuestions.slice(0,index).filter(q=>q.type===type).length;
  }

  function scoreQuiz(workbook,mcAnswers,tfAnswers){
    const mc=workbook.assessment.multipleChoice,tf=workbook.assessment.trueFalse;
    if(!Array.isArray(mcAnswers)||mcAnswers.length!==mc.length)throw new Error(`Expected ${mc.length} multiple-choice answers.`);
    if(!Array.isArray(tfAnswers)||tfAnswers.length!==tf.length)throw new Error(`Expected ${tf.length} true/false answers.`);
    const mcResults=mc.map((q,i)=>({id:q.id,correct:mcAnswers[i]===q.correctIndex,selectedIndex:mcAnswers[i],correctIndex:q.correctIndex,explanation:q.explanation,prompt:q.prompt}));
    const tfResults=tf.map((q,i)=>({id:q.id,correct:tfAnswers[i]===q.answer,selected:tfAnswers[i],answer:q.answer,explanation:q.explanation,statement:q.statement}));
    const total=mcResults.length+tfResults.length,correct=mcResults.filter(r=>r.correct).length+tfResults.filter(r=>r.correct).length;
    const percent=total?Math.round((correct/total)*100):0;
    const passed=percent>=Math.round(workbook.masteryRule.passingScore*100);
    return {total,correct,percent,passed,mcResults,tfResults};
  }

  function buildMatchingRound(workbook,shuffleFn=defaultShuffle){
    const pairs=workbook.assessment.matching;
    const lefts=pairs.map((p,index)=>({id:`left-${index}`,text:p.left,pairIndex:index}));
    const rights=shuffleFn(pairs.map((p,index)=>({id:`right-${index}`,text:p.right,pairIndex:index})));
    return {lefts,rights};
  }

  function defaultShuffle(list){
    const copy=[...list];
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
    return copy;
  }

  function isMatchingComplete(pairCount,matchedCount){return matchedCount>=pairCount}

  function isWorkbookUnlocked(workbook,completedWorkbookIds){
    if(workbook.prerequisiteWorkbookId===null)return true;
    return new Set(completedWorkbookIds).has(workbook.prerequisiteWorkbookId);
  }

  function workbookStatus(workbook,progress,completedWorkbookIds){
    if(progress&&progress.status==="completed")return "completed";
    if(!isWorkbookUnlocked(workbook,completedWorkbookIds))return "locked";
    if(progress&&progress.attempts>0)return "in_progress";
    return "available";
  }

  function nextAvailableWorkbook(workbooks,progressByWorkbookId){
    const sorted=[...workbooks].sort((a,b)=>a.sequence-b.sequence);
    const completedIds=sorted.filter(w=>progressByWorkbookId[w.id]?.status==="completed").map(w=>w.id);
    return sorted.find(w=>workbookStatus(w,progressByWorkbookId[w.id],completedIds)!=="locked"&&progressByWorkbookId[w.id]?.status!=="completed")||null;
  }

  function worldCompletionPercent(workbooks,progressByWorkbookId){
    if(!workbooks.length)return 0;
    const completed=workbooks.filter(w=>progressByWorkbookId[w.id]?.status==="completed").length;
    return Math.round((completed/workbooks.length)*100);
  }

  return {scoreQuiz,answerPositionForType,buildMatchingRound,defaultShuffle,isMatchingComplete,isWorkbookUnlocked,workbookStatus,nextAvailableWorkbook,worldCompletionPercent};
});

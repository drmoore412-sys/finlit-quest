(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitWorkbookValidator=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const DIFFICULTIES=new Set(["beginner","intermediate","advanced","expert","master"]);
  const WORKBOOK_ID=/^[A-Z]{2,6}-[0-9]{3}$/;

  function validateWorkbook(workbook,path=`workbook`){
    const errors=[];
    if(!workbook||typeof workbook!=="object")return [`${path} must be an object.`];
    if(!WORKBOOK_ID.test(workbook.id||""))errors.push(`${path}.id '${workbook.id}' must match ${WORKBOOK_ID}.`);
    if(!String(workbook.worldId||"").trim())errors.push(`${path}.worldId is required.`);
    if(!Number.isInteger(workbook.sequence)||workbook.sequence<1)errors.push(`${path}.sequence must be a positive integer.`);
    if(!String(workbook.title||"").trim())errors.push(`${path}.title is required.`);
    if(!DIFFICULTIES.has(workbook.difficulty))errors.push(`${path}.difficulty '${workbook.difficulty}' is invalid.`);
    const est=workbook.estimatedMinutes;
    if(!est||!Number.isFinite(est.min)||!Number.isFinite(est.max)||est.min<=0||est.max<est.min)errors.push(`${path}.estimatedMinutes must have a positive min <= max.`);
    if(!Number.isInteger(workbook.xp)||workbook.xp<=0)errors.push(`${path}.xp must be a positive integer.`);
    if(workbook.prerequisiteWorkbookId!==null&&!WORKBOOK_ID.test(workbook.prerequisiteWorkbookId||""))errors.push(`${path}.prerequisiteWorkbookId must be null or a valid workbook id.`);
    if(!String(workbook.learningObjective||"").trim())errors.push(`${path}.learningObjective is required.`);

    const lesson=workbook.lesson;
    if(!lesson||typeof lesson!=="object")errors.push(`${path}.lesson is required.`);
    else{
      if(!Array.isArray(lesson.coreLesson)||!lesson.coreLesson.length||lesson.coreLesson.some(p=>!String(p||"").trim()))errors.push(`${path}.lesson.coreLesson must be a non-empty array of non-empty paragraphs.`);
      ["example","nonExample","commonMisconception","keyTakeaway"].forEach(field=>{if(!String(lesson[field]||"").trim())errors.push(`${path}.lesson.${field} is required.`)});
    }

    if(!Array.isArray(workbook.flashcards)||!workbook.flashcards.length)errors.push(`${path}.flashcards must be non-empty.`);
    else workbook.flashcards.forEach((card,index)=>{if(!String(card?.term||"").trim())errors.push(`${path}.flashcards[${index}].term is required.`);if(!String(card?.definition||"").trim())errors.push(`${path}.flashcards[${index}].definition is required.`)});

    const assessment=workbook.assessment;
    if(!assessment||typeof assessment!=="object")errors.push(`${path}.assessment is required.`);
    else{
      if(!Array.isArray(assessment.multipleChoice)||!assessment.multipleChoice.length)errors.push(`${path}.assessment.multipleChoice must be non-empty.`);
      else assessment.multipleChoice.forEach((q,index)=>{
        const qp=`${path}.assessment.multipleChoice[${index}]`;
        if(!String(q?.id||"").trim())errors.push(`${qp}.id is required.`);
        if(!String(q?.prompt||"").trim())errors.push(`${qp}.prompt is required.`);
        if(!Array.isArray(q?.options)||q.options.length<2)errors.push(`${qp}.options must have at least two choices.`);
        if(!Number.isInteger(q?.correctIndex)||q.correctIndex<0||q.correctIndex>=(q?.options?.length||0))errors.push(`${qp}.correctIndex must be a valid option index.`);
        if(!String(q?.explanation||"").trim())errors.push(`${qp}.explanation is required.`);
      });
      if(!Array.isArray(assessment.trueFalse)||!assessment.trueFalse.length)errors.push(`${path}.assessment.trueFalse must be non-empty.`);
      else assessment.trueFalse.forEach((q,index)=>{
        const qp=`${path}.assessment.trueFalse[${index}]`;
        if(!String(q?.id||"").trim())errors.push(`${qp}.id is required.`);
        if(!String(q?.statement||"").trim())errors.push(`${qp}.statement is required.`);
        if(typeof q?.answer!=="boolean")errors.push(`${qp}.answer must be a boolean.`);
        if(!String(q?.explanation||"").trim())errors.push(`${qp}.explanation is required.`);
      });
      if(!Array.isArray(assessment.matching)||!assessment.matching.length)errors.push(`${path}.assessment.matching must be non-empty.`);
      else assessment.matching.forEach((pair,index)=>{if(!String(pair?.left||"").trim()||!String(pair?.right||"").trim())errors.push(`${path}.assessment.matching[${index}] must have non-empty left and right.`)});
      const scenario=assessment.scenario;
      if(!scenario||!String(scenario.prompt||"").trim()||!String(scenario.expectedAnswer||"").trim())errors.push(`${path}.assessment.scenario must have a prompt and expectedAnswer.`);
    }

    const mastery=workbook.masteryRule;
    if(!mastery||!Number.isFinite(mastery.passingScore)||mastery.passingScore<=0||mastery.passingScore>1)errors.push(`${path}.masteryRule.passingScore must be in (0, 1].`);
    if(!mastery||!String(mastery.description||"").trim())errors.push(`${path}.masteryRule.description is required.`);

    return errors;
  }

  function validateWorkbookWorld(world,workbooks){
    const errors=[];
    if(!world||typeof world!=="object")return {valid:false,errors:["World manifest must be an object."]};
    if(world.worldType!=="workbook")errors.push(`world.worldType must be 'workbook'.`);
    ["id","name","eyebrow"].forEach(field=>{if(!String(world[field]||"").trim())errors.push(`world.${field} is required.`)});
    if(!Array.isArray(workbooks)||!workbooks.length)errors.push("World must contain at least one workbook.");

    const seenIds=new Set(),seenSequences=new Set();
    (workbooks||[]).forEach((workbook,index)=>{
      const path=`workbooks[${index}] (${workbook?.id||"unknown"})`;
      validateWorkbook(workbook,path).forEach(e=>errors.push(e));
      if(workbook?.worldId!==world.id)errors.push(`${path}.worldId '${workbook?.worldId}' must match world id '${world.id}'.`);
      if(seenIds.has(workbook?.id))errors.push(`Duplicate workbook id '${workbook.id}'.`);seenIds.add(workbook?.id);
      if(seenSequences.has(workbook?.sequence))errors.push(`Duplicate workbook sequence '${workbook.sequence}'.`);seenSequences.add(workbook?.sequence);
    });

    const sortedSequences=[...seenSequences].sort((a,b)=>a-b);
    sortedSequences.forEach((seq,index)=>{if(seq!==index+1)errors.push(`Workbook sequence must be contiguous starting at 1; found gap or misordering at position ${index+1} (value ${seq}).`)});

    (workbooks||[]).forEach(workbook=>{
      if(workbook?.prerequisiteWorkbookId===null){
        if(workbook.sequence!==1)errors.push(`Workbook '${workbook.id}' has no prerequisite but sequence ${workbook.sequence} !== 1.`);
      } else {
        if(!seenIds.has(workbook?.prerequisiteWorkbookId))errors.push(`Workbook '${workbook?.id}' references unknown prerequisite '${workbook?.prerequisiteWorkbookId}'.`);
        const prereq=(workbooks||[]).find(w=>w.id===workbook.prerequisiteWorkbookId);
        if(prereq&&prereq.sequence!==workbook.sequence-1)errors.push(`Workbook '${workbook.id}' prerequisite '${workbook.prerequisiteWorkbookId}' is not the immediately preceding sequence.`);
      }
    });

    if(!Array.isArray(world.workbookIds)||world.workbookIds.length!==seenIds.size||!world.workbookIds.every(id=>seenIds.has(id)))errors.push("world.workbookIds must exactly match the set of provided workbook ids.");

    return {valid:errors.length===0,errors};
  }

  function assertValidWorkbookWorld(world,workbooks){const result=validateWorkbookWorld(world,workbooks);if(!result.valid)throw new Error(`Invalid FinLit workbook world:\n- ${result.errors.join("\n- ")}`);return true}

  return {validateWorkbook,validateWorkbookWorld,assertValidWorkbookWorld,DIFFICULTIES:[...DIFFICULTIES]};
});

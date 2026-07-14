(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitObjectiveValidator=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const DIFFICULTIES=new Set(["beginner","intermediate","advanced","expert","master"]),ID_PATTERN=/^[a-z0-9_-]+\.objective\.[a-z0-9_-]+$/;
  function duplicates(values){const seen=new Set();return values.filter(value=>seen.has(value)||!seen.add(value))}
  function validateObjectives(objectives,{worldId,termIds=[]}={}){
    const errors=[],objectiveIds=new Set(),knownTerms=new Set(termIds);
    if(!Array.isArray(objectives))return {valid:false,errors:["Objectives must be an array."]};
    objectives.forEach((objective,index)=>{
      const path=`objectives[${index}]`;
      ["id","world","sectionId","title","statement","difficulty","approvalStatus","curriculumVersion"].forEach(field=>{if(!String(objective?.[field]||"").trim())errors.push(`${path}.${field} must be non-empty.`)});
      if(!ID_PATTERN.test(objective?.id||""))errors.push(`${path}.id must use '<world>.objective.<name>'.`);
      if(objectiveIds.has(objective?.id))errors.push(`Duplicate objective id '${objective.id}'.`);objectiveIds.add(objective?.id);
      if(worldId&&objective?.world!==worldId)errors.push(`${path}.world '${objective?.world}' must match '${worldId}'.`);
      if(objective?.approvalStatus!=="approved_locked")errors.push(`${path}.approvalStatus must be 'approved_locked'.`);
      if(!DIFFICULTIES.has(objective?.difficulty))errors.push(`${path}.difficulty '${objective?.difficulty}' is invalid.`);
      ["termIds","prerequisiteObjectiveIds"].forEach(field=>{if(!Array.isArray(objective?.[field]))errors.push(`${path}.${field} must be an array.`);else duplicates(objective[field]).forEach(value=>errors.push(`${path}.${field} contains duplicate '${value}'.`))});
      ["scenarioIds","challengeIds"].forEach(field=>{if(field in (objective||{})&&!Array.isArray(objective[field]))errors.push(`${path}.${field} must be an array when present.`);else if(Array.isArray(objective?.[field]))duplicates(objective[field]).forEach(value=>errors.push(`${path}.${field} contains duplicate '${value}'.`))});
      if(Array.isArray(objective?.termIds)&&!objective.termIds.length)errors.push(`${path}.termIds must link at least one approved term.`);
      (objective?.termIds||[]).forEach(id=>{if(knownTerms.size&&!knownTerms.has(id))errors.push(`Objective '${objective.id}' references unknown term '${id}'.`)});
      if(!objective?.metadata||!Number.isInteger(objective.metadata.order)||objective.metadata.order<0)errors.push(`${path}.metadata.order must be a non-negative integer.`);
    });
    objectives.forEach(objective=>(objective?.prerequisiteObjectiveIds||[]).forEach(id=>{if(!objectiveIds.has(id))errors.push(`Objective '${objective.id}' references unknown prerequisite '${id}'.`);if(id===objective.id)errors.push(`Objective '${objective.id}' cannot require itself.`)}));
    return {valid:errors.length===0,errors};
  }
  function assertValidObjectives(objectives,context){const result=validateObjectives(objectives,context);if(!result.valid)throw new Error(`Invalid FinLit objectives:\n- ${result.errors.join("\n- ")}`);return true}
  return {validateObjectives,assertValidObjectives};
});

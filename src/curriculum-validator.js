(function(root,factory){const api=factory(typeof module==="object"&&module.exports?require("./objective-validator.js"):root.FinLitObjectiveValidator);if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitCurriculumValidator=api})(typeof globalThis!=="undefined"?globalThis:this,function(objectiveValidator){
  "use strict";
  const HASH=/^[a-f0-9]{64}$/;
  function duplicates(values){const seen=new Set();return values.filter(value=>seen.has(value)||!seen.add(value))}
  function validateCurriculum(data,{termIds=[]}={}){
    const errors=[];
    if(!data||typeof data!=="object"||Array.isArray(data))return {valid:false,errors:["Curriculum export must be an object."]};
    if(data.schemaVersion!==1)errors.push("schemaVersion must be 1.");
    ["world","curriculumVersion","generatedAt"].forEach(field=>{if(!String(data[field]||"").trim())errors.push(`${field} must be non-empty.`)});
    if(data.generatedAt&&Number.isNaN(Date.parse(data.generatedAt)))errors.push("generatedAt must be an ISO date-time.");
    ["scenarios","challenges","scenarioMappings","challengeMappings"].forEach(field=>{if(field in data)errors.push(`${field} must not be exported before its approved library exists.`)});
    if(!data.source||typeof data.source!=="object")errors.push("source is required.");
    else{
      if(!Array.isArray(data.source.workbooks)||!data.source.workbooks.length)errors.push("source.workbooks must identify at least one canonical workbook.");
      else data.source.workbooks.forEach((item,index)=>{if(!String(item?.fileName||"").trim())errors.push(`source.workbooks[${index}].fileName is required.`);if(!HASH.test(item?.sha256||""))errors.push(`source.workbooks[${index}].sha256 must be a SHA-256 hash.`)});
      ["approvalLogHash","controlledValuesHash"].forEach(field=>{if(!HASH.test(data.source[field]||""))errors.push(`source.${field} must be a SHA-256 hash.`)});
    }
    if(!Array.isArray(data.sections)||!data.sections.length)errors.push("sections must contain approved records.");
    if(!Array.isArray(data.objectives)||!data.objectives.length)errors.push("objectives must contain approved records.");
    const objectiveResult=objectiveValidator.validateObjectives(data.objectives||[],{worldId:data.world,termIds});errors.push(...objectiveResult.errors);
    const objectiveIds=new Set((data.objectives||[]).map(item=>item.id)),sectionIds=new Set();
    (data.sections||[]).forEach((section,index)=>{
      const path=`sections[${index}]`;
      ["id","world","title","approvalStatus","curriculumVersion"].forEach(field=>{if(!String(section?.[field]||"").trim())errors.push(`${path}.${field} must be non-empty.`)});
      if(sectionIds.has(section?.id))errors.push(`Duplicate section id '${section.id}'.`);sectionIds.add(section?.id);
      if(section?.world!==data.world)errors.push(`${path}.world must match '${data.world}'.`);
      if(section?.approvalStatus!=="approved_locked")errors.push(`${path}.approvalStatus must be 'approved_locked'.`);
      if(section?.curriculumVersion!==data.curriculumVersion)errors.push(`${path}.curriculumVersion must match the export version.`);
      if(!Array.isArray(section?.objectiveIds))errors.push(`${path}.objectiveIds must be an array.`);
      else{duplicates(section.objectiveIds).forEach(id=>errors.push(`${path}.objectiveIds contains duplicate '${id}'.`));section.objectiveIds.forEach(id=>{if(!objectiveIds.has(id))errors.push(`Section '${section.id}' references unknown objective '${id}'.`)})}
      if(!section?.metadata||!Number.isInteger(section.metadata.order)||section.metadata.order<0)errors.push(`${path}.metadata.order must be a non-negative integer.`);
    });
    (data.objectives||[]).forEach(objective=>{if(!sectionIds.has(objective.sectionId))errors.push(`Objective '${objective.id}' references unknown section '${objective.sectionId}'.`);if(objective.curriculumVersion!==data.curriculumVersion)errors.push(`Objective '${objective.id}' curriculumVersion must match the export version.`);const section=(data.sections||[]).find(item=>item.id===objective.sectionId);if(section&&Array.isArray(section.objectiveIds)&&!section.objectiveIds.includes(objective.id))errors.push(`Section '${section.id}' does not list objective '${objective.id}'.`)});
    return {valid:errors.length===0,errors};
  }
  function assertValidCurriculum(data,context){const result=validateCurriculum(data,context);if(!result.valid)throw new Error(`Invalid FinLit curriculum export:\n- ${result.errors.join("\n- ")}`);return true}
  return {validateCurriculum,assertValidCurriculum};
});

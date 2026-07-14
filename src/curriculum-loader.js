(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitCurriculum=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  function deepFreeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(deepFreeze)}return value}
  class CurriculumLoader{
    constructor({validator,termIds=[]}){this.validator=validator;this.termIds=termIds}
    load(input){const data=typeof input==="string"?JSON.parse(input):input;this.validator.assertValidCurriculum(data,{termIds:this.termIds});const frozen=deepFreeze(structuredClone(data)),sectionsById=new Map(frozen.sections.map(item=>[item.id,item])),objectivesById=new Map(frozen.objectives.map(item=>[item.id,item]));return Object.freeze({schemaVersion:frozen.schemaVersion,curriculumVersion:frozen.curriculumVersion,world:frozen.world,data:frozen,sectionsById,objectivesById,objectivesForSection:id=>(sectionsById.get(id)?.objectiveIds||[]).map(objectiveId=>objectivesById.get(objectiveId))})}
  }
  return {CurriculumLoader,deepFreeze};
});

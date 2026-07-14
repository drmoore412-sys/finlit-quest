(function(root,factory){const api=factory(root.FinLitContentValidator);if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitWorldLoader=api})(typeof globalThis!=="undefined"?globalThis:this,function(validator){
  "use strict";
  function loadWorld(manifest,terms){
    if(!validator)throw new Error("Content validator is not available.");
    validator.assertValidWorld(manifest,terms);
    const termsById=new Map(terms.map(term=>[term.id,Object.freeze({...term})]));
    const termsByWord=new Map(terms.map(term=>[term.word,Object.freeze({...term})]));
    return Object.freeze({...manifest,terms:Object.freeze([...terms]),termsById,termsByWord});
  }
  return {loadWorld};
});

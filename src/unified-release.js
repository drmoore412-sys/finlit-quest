// Release validation for the unified level sequence (loaded by the level loader at startup; term-record checks run in the release tests).
// Full v2/v3 release validation for every new or upgraded puzzle, plus the narrow, owner-approved legacy exception: the unchanged
// canonical v1 puzzles pass only when ID, anchor and content hash exactly match the frozen baseline. v1 is not generally releasable.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitUnifiedRelease=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const isPlain=value=>Object.prototype.toString.call(value)==="[object Object]";
  function stable(value){
    if(Array.isArray(value))return "["+value.map(stable).join(",")+"]";
    if(isPlain(value))return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+stable(value[k])).join(",")+"}";
    return JSON.stringify(value===undefined?null:value);
  }
  const contentHash=(puzzle,sha256)=>sha256(stable(puzzle));
  function baselineMap(baseline){return new Map(((baseline&&baseline.entries)||[]).map(e=>[e.puzzleId,e]))}

  // input: {manifest, baseline, canonicalPuzzles:Map(id->record), canonicalIds:Set, puzzles:Map(id->record for the upgraded/new puzzles),
  //         whitelist, termDefinitions:Map(termId->definition), sha256:(text)=>hex}; deps: {Sequence, Rules, canFormFn, validateCrosswordLayoutFn}
  function validateRelease(input,deps){
    const {manifest,baseline,canonicalPuzzles,canonicalIds,puzzles,whitelist,termDefinitions,sha256,skipTermRecords,dictionary}=input,errors=[],summary={entries:0,legacyVerified:0,upgradedVerified:0};
    const base=baselineMap(baseline);
    if(!base.size)errors.push("baselineMissing");
    const legacy={baseline:base,contentHash:id=>{const p=canonicalPuzzles&&canonicalPuzzles.get(id);return p?contentHash(p,sha256):null}};
    deps.Sequence.validateManifest(manifest,{release:true,legacy}).errors.forEach(e=>errors.push("manifest: "+e));
    const entries=Array.isArray(manifest&&manifest.entries)?manifest.entries:[];summary.entries=entries.length;
    const retiredIds=new Set((Array.isArray(manifest&&manifest.retired)?manifest.retired:[]).map(r=>r&&r.puzzleId));
    entries.forEach((entry,i)=>{
      const tag=`entry ${i+1} ${entry.puzzleId}`;
      if(entry.compositionRuleVersion==="v1"){
        if(canonicalIds.has(entry.puzzleId)&&base.has(entry.puzzleId))summary.legacyVerified++;else errors.push(`${tag}: legacyUnknownId`);
        return;
      }
      const puzzle=puzzles&&puzzles.get(entry.puzzleId);
      if(!puzzle){errors.push(`${tag}: unknownPuzzle`);return}
      if(puzzle.compositionRuleVersion!==entry.compositionRuleVersion)errors.push(`${tag}: ruleVersionMismatch`);
      (entry.replaces||[]).forEach(old=>{if(!canonicalIds.has(old)&&!retiredIds.has(old))errors.push(`${tag}: replacesUnknown ${old}`)});
      if(canonicalIds.has(entry.puzzleId))errors.push(`${tag}: collidesWithCanonical`);
      const validate=deps.Rules.validatorFor(entry.compositionRuleVersion)||deps.Rules.validateV2Puzzle;
      const r=validate(puzzle,{canFormFn:deps.canFormFn,validateCrosswordLayoutFn:deps.validateCrosswordLayoutFn,fillerWhitelist:whitelist,existingIds:canonicalIds,release:true,dictionary:dictionary||null,missingAnswersFn:deps.Expansion?deps.Expansion.missingAnswers:null});
      r.errors.forEach(e=>errors.push(`${tag}: ${e}`));
      if(!skipTermRecords)(puzzle.answers||[]).filter(a=>a.category!=="ordinary").forEach(a=>{
        if(!termDefinitions||!termDefinitions.has(a.termId))errors.push(`${tag}: missingTermRecord ${a.word}`);
        else if(termDefinitions.get(a.termId)!==a.definition)errors.push(`${tag}: termDefinitionMismatch ${a.word}`);
      });
      if(!r.errors.length)summary.upgradedVerified++;
    });
    // Exhaustive-answer rule (2026-11-18): when the approved-term dictionary is supplied (build and test time; the browser release
    // check does not carry it) every entry's puzzle, legacy or upgraded, must require every dictionary term its wheel can spell,
    // and its key term must spell the wheel exactly, repeated letters included, with no declared extra letters and no exceptions.
    if(dictionary&&deps.Expansion){
      summary.exhaustiveVerified=0;
      entries.forEach((entry,i)=>{
        const tag=`entry ${i+1} ${entry.puzzleId}`,puzzle=entry.compositionRuleVersion==="v1"?(canonicalPuzzles&&canonicalPuzzles.get(entry.puzzleId)):(puzzles&&puzzles.get(entry.puzzleId));
        if(!puzzle)return;
        const missing=deps.Expansion.missingAnswers(puzzle,dictionary);
        if(missing.length)errors.push(`${tag}: notExhaustive ${missing.map(m=>m.word).join(",")}`);
        else if(!deps.Expansion.anchorSpellsWheelExactly(puzzle))errors.push(`${tag}: anchorDoesNotSpellWheel`);
        else summary.exhaustiveVerified++;
      });
    }
    return {valid:errors.length===0,errors:[...new Set(errors)],summary};
  }
  return {stable,contentHash,baselineMap,validateRelease};
});

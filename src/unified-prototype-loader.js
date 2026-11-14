// Development-only loader for the prototype-12 sequence. Not wired into the app, index.html, the build or iOS.
// It never reads from or writes to the canonical library map or to production saves: prototype puzzles live in
// their own Map, and prototype progress may only be applied to a throwaway save.
(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitUnifiedPrototypeLoader=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const SEQUENCE_ID="prototype-12",THROWAWAY="prototypeThrowaway";
  const isPlain=value=>Object.prototype.toString.call(value)==="[object Object]";

  // deps: {Sequence, Rules, canFormFn, validateCrosswordLayoutFn}. canonicalIds: Set of the 58 canonical IDs.
  // mainManifest (optional): the main-levels manifest, used only to prove no ID overlaps.
  function load({manifest,puzzleFile,whitelist,canonicalIds,mainManifest=null},deps){
    const errors=[],library=new Map();
    if(!isPlain(manifest)||manifest.sequenceId!==SEQUENCE_ID)errors.push("sequenceIdMustBePrototype12");
    if(!manifest||manifest.devOnly!==true)errors.push("devOnlyRequired");
    if(!(canonicalIds instanceof Set)||!canonicalIds.size)errors.push("canonicalIdsRequired");
    if(errors.length)return {ok:false,errors,library};
    // no canonical library option: prototype IDs are intentionally not canonical
    const m=deps.Sequence.validateManifest(manifest,{release:false});
    m.errors.forEach(error=>errors.push("manifest: "+error));
    const mainIds=new Set();
    if(mainManifest){(mainManifest.entries||[]).forEach(e=>mainIds.add(e.puzzleId));(mainManifest.retired||[]).forEach(e=>mainIds.add(e.puzzleId))}
    const puzzles=isPlain(puzzleFile)&&Array.isArray(puzzleFile.puzzles)?puzzleFile.puzzles:[];
    const byId=new Map(puzzles.map(p=>[p&&p.id,p]));
    if(byId.size!==puzzles.length)errors.push("duplicatePrototypePuzzleId");
    // prototype whitelist approvals must name prototype puzzle IDs only
    const protoIds=new Set((manifest.entries||[]).map(e=>e.puzzleId));
    ((whitelist&&whitelist.entries)||[]).forEach(entry=>(entry.approvedInPuzzles||[]).forEach(id=>{if(!protoIds.has(id))errors.push(`whitelist: ${entry.word} approved for non-prototype ${id}`)}));
    (manifest.entries||[]).forEach(entry=>{
      const id=entry.puzzleId,puzzle=byId.get(id);
      if(canonicalIds.has(id))errors.push(`${id}: collidesWithCanonical`);
      if(mainIds.has(id))errors.push(`${id}: collidesWithMainLevels`);
      (entry.replaces||[]).forEach(old=>{if(!canonicalIds.has(old))errors.push(`${id}: replacesUnknownCanonical ${old}`)});
      if(!puzzle){errors.push(`${id}: puzzleRecordMissing`);return}
      const validate=entry.compositionRuleVersion==="v3"?deps.Rules.validateV3Puzzle:deps.Rules.validateV2Puzzle;
      if(puzzle.compositionRuleVersion!==entry.compositionRuleVersion)errors.push(`${id}: ruleVersionMismatch`);
      const r=validate(puzzle,{canFormFn:deps.canFormFn,validateCrosswordLayoutFn:deps.validateCrosswordLayoutFn,fillerWhitelist:whitelist,existingIds:canonicalIds,release:false});
      r.errors.forEach(error=>errors.push(`${id}: ${error}`));
      if(!r.errors.length)library.set(id,puzzle);
    });
    return {ok:errors.length===0,errors,library:errors.length?new Map():library};
  }

  // Gated candidate (main-levels sequenceVersion 2): the nine approved development puzzles merged into the unified progression
  // behind a closed release gate. It validates and returns the nine records in their own Map; it never touches the canonical
  // library, any save, or the v2-only production release gate (validateManifest with release:true still refuses v3).
  function loadGated({manifest,previousManifest,puzzleFile,whitelist,canonicalIds},deps){
    const errors=[],library=new Map();
    if(!isPlain(manifest)||manifest.sequenceId!=="main-levels")errors.push("sequenceIdMustBeMainLevels");
    if(!manifest||manifest.devOnly!==true)errors.push("devOnlyRequired");
    if(!manifest||!manifest.releaseGate||manifest.releaseGate.status!=="closed")errors.push("releaseGateMustBeClosed");
    if(!(canonicalIds instanceof Set)||!canonicalIds.size)errors.push("canonicalIdsRequired");
    if(!isPlain(previousManifest))errors.push("previousManifestRequired");
    if(errors.length)return {ok:false,errors,library};
    deps.Sequence.validateManifest(manifest,{release:false}).errors.forEach(e=>errors.push("manifest: "+e));
    deps.Sequence.validateEvolution(previousManifest,manifest).errors.forEach(e=>errors.push("evolution: "+e));
    const prevById=new Map((previousManifest.entries||[]).map(e=>[e.puzzleId,e]));
    const puzzles=isPlain(puzzleFile)&&Array.isArray(puzzleFile.puzzles)?puzzleFile.puzzles:[];
    const byId=new Map(puzzles.map(p=>[p&&p.id,p]));
    if(byId.size!==puzzles.length)errors.push("duplicateGatedPuzzleId");
    const candidates=(manifest.entries||[]).filter(e=>e.releaseStatus==="candidate"),candIds=new Set(candidates.map(e=>e.puzzleId));
    ((whitelist&&whitelist.entries)||[]).forEach(entry=>(entry.approvedInPuzzles||[]).forEach(id=>{if(!candIds.has(id))errors.push(`whitelist: ${entry.word} approved for non-candidate ${id}`)}));
    byId.forEach((_,id)=>{if(!candIds.has(id))errors.push(`${id}: recordWithoutCandidateEntry`)});
    (manifest.entries||[]).forEach(entry=>{
      const id=entry.puzzleId;
      if(entry.releaseStatus!=="candidate"){
        const before=prevById.get(id);
        if(!before||JSON.stringify({...before,position:0})!==JSON.stringify({...entry,position:0}))errors.push(`${id}: existingEntryChanged`);
        return;
      }
      const puzzle=byId.get(id);
      if(canonicalIds.has(id)||prevById.has(id))errors.push(`${id}: collidesWithExisting`);
      (entry.replaces||[]).forEach(old=>{if(!canonicalIds.has(old)||!prevById.has(old))errors.push(`${id}: replacesUnknown ${old}`)});
      if(!puzzle){errors.push(`${id}: puzzleRecordMissing`);return}
      if(puzzle.compositionRuleVersion!==entry.compositionRuleVersion)errors.push(`${id}: ruleVersionMismatch`);
      const validate=entry.compositionRuleVersion==="v3"?deps.Rules.validateV3Puzzle:deps.Rules.validateV2Puzzle;
      const r=validate(puzzle,{canFormFn:deps.canFormFn,validateCrosswordLayoutFn:deps.validateCrosswordLayoutFn,fillerWhitelist:whitelist,existingIds:canonicalIds,release:false});
      r.errors.forEach(error=>errors.push(`${id}: ${error}`));
      if(!r.errors.length)library.set(id,puzzle);
    });
    if(!errors.length&&library.size!==candidates.length)errors.push("candidateCountMismatch");
    return {ok:errors.length===0,errors,library:errors.length?new Map():library};
  }

  // Production release (main-levels sequenceVersion 2). Runs the full release validation at startup: the nine upgraded puzzles pass
  // v2/v3 release rules; the 52 legacy v1 puzzles must match the frozen baseline by ID, anchor and content hash. Any failure returns
  // ok:false and the caller keeps the existing 58-level flow unchanged. Term-record checks run in the release tests.
  function loadRelease({levels,canonicalPuzzles,canonicalIds,sha256},deps){
    const errors=[],library=new Map(),manifest=levels&&levels.manifest;
    if(!isPlain(manifest)||manifest.sequenceId!=="main-levels")errors.push("sequenceIdMustBeMainLevels");
    else{
      if(manifest.devOnly!==false)errors.push("devOnlyMustBeFalse");
      if(!manifest.releaseGate||manifest.releaseGate.status!=="open")errors.push("releaseGateMustBeOpen");
    }
    if(!(canonicalIds instanceof Set)||!canonicalIds.size)errors.push("canonicalIdsRequired");
    if(errors.length)return {ok:false,errors,library};
    const puzzles=new Map((levels.puzzles||[]).map(p=>[p&&p.id,p]));
    if(puzzles.size!==(levels.puzzles||[]).length)errors.push("duplicateUpgradedPuzzleId");
    const referenced=new Set((manifest.entries||[]).filter(e=>e.compositionRuleVersion!=="v1").map(e=>e.puzzleId));
    puzzles.forEach((_,id)=>{if(!referenced.has(id))errors.push(`${id}: recordWithoutEntry`)});
    const result=deps.Release.validateRelease({manifest,baseline:levels.baseline,canonicalPuzzles,canonicalIds,puzzles,whitelist:levels.whitelist,termDefinitions:null,skipTermRecords:true,sha256},deps);
    result.errors.forEach(e=>errors.push(e));
    if(!errors.length)puzzles.forEach((p,id)=>library.set(id,p));
    return {ok:errors.length===0,errors,library:errors.length?new Map():library,summary:result.summary};
  }

  function markThrowaway(save){if(!isPlain(save))throw new Error("throwaway save must be an object");save[THROWAWAY]=true;return save}
  function isThrowaway(save){return isPlain(save)&&save[THROWAWAY]===true}
  // The only way the loader applies progress for prototype-12; refuses anything that is not a marked throwaway save.
  function applyProgress(Progress,save,manifest,nowIso){
    if(!manifest||manifest.sequenceId!==SEQUENCE_ID)throw new Error("applyProgress: not the prototype-12 manifest");
    if(!isThrowaway(save))throw new Error("applyProgress: prototype-12 may only use a throwaway save");
    return Progress.apply(save,manifest,nowIso);
  }
  return {SEQUENCE_ID,load,loadGated,loadRelease,markThrowaway,isThrowaway,applyProgress};
});

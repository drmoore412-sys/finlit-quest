(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitUnifiedSequence=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Unified level-sequence manifest: references canonical puzzle IDs, never copies puzzle definitions.
  // Level number is a display position, not a completion identity.
  const RELEASE_STATUSES=new Set(["development","candidate","approved"]);
  const RULE_VERSIONS=new Set(["v1","v2","v3"]);
  // Release accepts v2 (kept unchanged) and v3 (v2 plus up to two declared extra letters, nine-letter wheel). v1 is legacy and never releasable.
  const RELEASE_RULE_VERSIONS=new Set(["v2","v3"]);
  const isPlain=value=>Object.prototype.toString.call(value)==="[object Object]";
  const clone=value=>JSON.parse(JSON.stringify(value));

  function validateManifest(manifest,options={}){
    const {library=null,release=false,legacy=null}=options,errors=[],warnings=[];
    if(!isPlain(manifest))return {valid:false,errors:["manifestObject"],warnings};
    if(typeof manifest.sequenceId!=="string"||!manifest.sequenceId)errors.push("sequenceId");
    if(!Number.isInteger(manifest.sequenceVersion)||manifest.sequenceVersion<1)errors.push("sequenceVersion");
    if(typeof manifest.devOnly!=="boolean")errors.push("devOnlyFlagRequired");
    const entries=Array.isArray(manifest.entries)?manifest.entries:null;
    if(!entries||!entries.length){errors.push("entriesRequired");return {valid:false,errors,warnings}}
    const retired=Array.isArray(manifest.retired)?manifest.retired:[],active=new Set(),retiredIds=new Set();
    entries.forEach((entry,index)=>{
      const tag=`entry ${index+1}`;
      if(!isPlain(entry)){errors.push(`${tag}: object`);return}
      if(entry.position!==index+1)errors.push(`${tag}: positionContiguous`);
      if(typeof entry.puzzleId!=="string"||!entry.puzzleId)errors.push(`${tag}: puzzleId`);
      else{if(active.has(entry.puzzleId))errors.push(`${tag}: duplicatePuzzleId`);active.add(entry.puzzleId);if(library&&!library.has(entry.puzzleId))errors.push(`${tag}: unknownCanonicalPuzzle`)}
      if(!RULE_VERSIONS.has(entry.compositionRuleVersion))errors.push(`${tag}: compositionRuleVersion`);
      if(!RELEASE_STATUSES.has(entry.releaseStatus))errors.push(`${tag}: releaseStatus`);
      if(!isPlain(entry.validation))errors.push(`${tag}: validationMetadata`);
      const replaces=entry.replaces===undefined?[]:entry.replaces;
      if(!Array.isArray(replaces)||replaces.some(id=>typeof id!=="string"||!id))errors.push(`${tag}: replacesShape`);
      else if(replaces.length){
        if(entry.compatibility!=="fresh")errors.push(`${tag}: replacesRequiresFreshCompatibility`);
        if(replaces.includes(entry.puzzleId))errors.push(`${tag}: replacesSelf`);
      }else if(entry.compatibility!==undefined&&entry.compatibility!==null)errors.push(`${tag}: compatibilityWithoutReplacement`);
    });
    retired.forEach((entry,index)=>{
      if(!isPlain(entry)||typeof entry.puzzleId!=="string"||!entry.puzzleId){errors.push(`retired ${index+1}: shape`);return}
      if(retiredIds.has(entry.puzzleId))errors.push(`retired ${index+1}: duplicateRetiredId`);
      if(active.has(entry.puzzleId))errors.push(`retired ${index+1}: retiredAndActive`);
      retiredIds.add(entry.puzzleId);
    });
    // every replaced ID must be a retired record, and lineage must not loop
    const retiredById=new Map(retired.filter(isPlain).map(entry=>[entry.puzzleId,entry]));
    entries.filter(isPlain).forEach((entry,index)=>(Array.isArray(entry.replaces)?entry.replaces:[]).forEach(id=>{if(!retiredIds.has(id))errors.push(`entry ${index+1}: replacedIdNotRetired`)}));
    retiredById.forEach(entry=>{const seen=new Set([entry.puzzleId]);let frontier=[...(entry.replaces||[])],depth=0;while(frontier.length&&depth++<64){const next=[];for(const id of frontier){if(seen.has(id)){errors.push(`retired ${entry.puzzleId}: lineageCycle`);return}seen.add(id);const parent=retiredById.get(id);if(parent)next.push(...(parent.replaces||[]))}frontier=next}});
    if(release){
      if(manifest.devOnly!==false)errors.push("releaseRequiresDevOnlyFalse");
      entries.filter(isPlain).forEach((entry,index)=>{
        // Narrow legacy exception (owner-approved): an UNCHANGED canonical v1 puzzle may ride along when its ID, anchor and content hash
        // exactly match the frozen baseline. It never applies to new or modified puzzles, and v1 is not generally releasable.
        if(entry.compositionRuleVersion==="v1"&&legacy&&legacy.baseline instanceof Map){
          const tag=`entry ${index+1}`,base=legacy.baseline.get(entry.puzzleId);
          if(!base)errors.push(`${tag}: legacyNotInBaseline`);
          else{
            if(entry.anchor!==base.anchor)errors.push(`${tag}: legacyAnchorChanged`);
            if((entry.replaces||[]).length||(entry.compatibility!==undefined&&entry.compatibility!==null))errors.push(`${tag}: legacyEntryChanged`);
            const hash=typeof legacy.contentHash==="function"?legacy.contentHash(entry.puzzleId):null;
            if(!hash)errors.push(`${tag}: legacyContentUnverified`);else if(hash!==base.sha256)errors.push(`${tag}: legacyContentChanged`);
          }
          return;
        }
        if(entry.releaseStatus!=="approved")errors.push(`entry ${index+1}: releaseRequiresApproved`);
        if(!RELEASE_RULE_VERSIONS.has(entry.compositionRuleVersion))errors.push(`entry ${index+1}: releaseRequiresRuleV2OrV3`);
        const v=entry.validation||{};
        ["relevanceReviewed","definitionsVerified","fillersApproved","ownerApproved","layoutVerified"].forEach(key=>{if(v[key]!==true)errors.push(`entry ${index+1}: validation.${key}`)});
      });
    }else if(manifest.devOnly===true)warnings.push("development-only manifest");
    return {valid:errors.length===0,errors:[...new Set(errors)],warnings};
  }

  // A released manifest may only insert, append or replace. Deleting or reordering released puzzles is an error.
  function validateEvolution(previous,next){
    const errors=[],prevIds=(previous.entries||[]).map(entry=>entry.puzzleId),nextIds=(next.entries||[]).map(entry=>entry.puzzleId);
    const replacedBy=new Map();
    (next.entries||[]).forEach(entry=>(entry.replaces||[]).forEach(id=>replacedBy.set(id,entry.puzzleId)));
    const retiredNext=new Set((next.retired||[]).map(entry=>entry.puzzleId));
    prevIds.forEach(id=>{if(!nextIds.includes(id)&&!(replacedBy.has(id)&&retiredNext.has(id)))errors.push(`removedWithoutReplacement:${id}`)});
    const survivors=prevIds.map(id=>nextIds.includes(id)?id:replacedBy.get(id)).filter(Boolean),order=survivors.map(id=>nextIds.indexOf(id));
    for(let i=1;i<order.length;i++)if(order[i]<order[i-1]){errors.push("reordered");break}
    if(!(next.sequenceVersion>previous.sequenceVersion))errors.push("sequenceVersionMustIncrease");
    if(next.sequenceId!==previous.sequenceId)errors.push("sequenceIdChanged");
    return {valid:errors.length===0,errors};
  }
  function renumber(entries){entries.forEach((entry,index)=>{entry.position=index+1})}
  function bump(manifest){manifest.sequenceVersion=(manifest.sequenceVersion||0)+1;return manifest}
  function append(manifest,entry){const next=clone(manifest);next.entries.push({replaces:[],compatibility:null,...clone(entry)});renumber(next.entries);return bump(next)}
  function insert(manifest,position,entry){
    const next=clone(manifest),at=Math.min(Math.max(1,Math.floor(position)),next.entries.length+1)-1;
    next.entries.splice(at,0,{replaces:[],compatibility:null,...clone(entry)});renumber(next.entries);return bump(next);
  }
  // The old entry is retired (kept for lineage); the new one is always `fresh`.
  function replace(manifest,position,entry){
    const next=clone(manifest),old=next.entries[position-1];
    if(!old)throw new Error("replace: no entry at position "+position);
    next.retired=[...(next.retired||[]),{puzzleId:old.puzzleId,replaces:old.replaces||[],retiredAtSequenceVersion:next.sequenceVersion}];
    next.entries[position-1]={...clone(entry),replaces:[old.puzzleId],compatibility:"fresh"};
    renumber(next.entries);return bump(next);
  }
  // The only text the player sees for a level. Internal status words never reach the UI.
  function levelDisplay(entry){return {title:`Level ${entry.position}`}}
  return {validateManifest,validateEvolution,append,insert,replace,levelDisplay,RELEASE_STATUSES,RULE_VERSIONS,RELEASE_RULE_VERSIONS};
});

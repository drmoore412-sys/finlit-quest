(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitUnifiedProgress=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Unified main-level progress (development-only until the sequence is approved).
  // The frontier is ACCESS state, kept separate from completion. Completion stays in
  // save.canonicalPuzzleProgress[canonicalPuzzleId]. This module never writes anything
  // except save.unifiedProgress, and never reads or writes coins, XP, mastery, rewards,
  // settings, world histories or the legacy puzzle-order key.
  const SCHEMA_VERSION=1,MAX_BLOCK_CHARS=32768,MAX_LINEAGE_DEPTH=16;
  const isPlain=value=>Object.prototype.toString.call(value)==="[object Object]";

  function indexManifest(manifest){
    const raw=Array.isArray(manifest&&manifest.entries)?manifest.entries:[];
    const entries=raw.filter(entry=>isPlain(entry)&&typeof entry.puzzleId==="string"&&entry.puzzleId).slice().sort((a,b)=>(Number(a.position)||0)-(Number(b.position)||0));
    const ordinalById=new Map(),retiredById=new Map();
    entries.forEach((entry,index)=>{if(!ordinalById.has(entry.puzzleId))ordinalById.set(entry.puzzleId,index)});
    (Array.isArray(manifest&&manifest.retired)?manifest.retired:[]).forEach(entry=>{if(isPlain(entry)&&typeof entry.puzzleId==="string"&&entry.puzzleId)retiredById.set(entry.puzzleId,entry)});
    return {entries,N:entries.length,ordinalById,retiredById};
  }
  // Every canonical ID this entry (transitively) replaced. Cycle- and depth-guarded.
  function replacedIds(index,entry,seen=new Set(),depth=0){
    const out=new Set();
    if(!isPlain(entry)||depth>MAX_LINEAGE_DEPTH)return out;
    (Array.isArray(entry.replaces)?entry.replaces:[]).forEach(id=>{
      if(typeof id!=="string"||!id||seen.has(id))return;
      seen.add(id);out.add(id);
      const retired=index.retiredById.get(id);
      if(retired)replacedIds(index,retired,seen,depth+1).forEach(value=>out.add(value));
    });
    return out;
  }
  function solved(save,id){
    const records=save&&isPlain(save.canonicalPuzzleProgress)?save.canonicalPuzzleProgress:null,record=records?records[id]:null;
    return isPlain(record)&&Number.isFinite(record.timesCompleted)&&record.timesCompleted>0;
  }
  // Earned access: the player completed this puzzle, or any puzzle it replaced, in any compatibility.
  function earned(save,index,entry){
    if(solved(save,entry.puzzleId))return true;
    for(const id of replacedIds(index,entry))if(solved(save,id))return true;
    return false;
  }
  function resolveStored(index,block){
    const frontier=isPlain(block&&block.frontier)?block.frontier:null;
    let ordinal=-1;
    if(frontier&&typeof frontier.puzzleId==="string"&&frontier.puzzleId){
      if(index.ordinalById.has(frontier.puzzleId))ordinal=index.ordinalById.get(frontier.puzzleId);
      else for(let i=0;i<index.N;i++)if(replacedIds(index,index.entries[i]).has(frontier.puzzleId)){ordinal=i;break}
    }
    const storedPosition=frontier&&Number.isInteger(frontier.position)&&frontier.position>=1?Math.min(frontier.position,index.N)-1:-1;
    // Monotonic: never lower than the stored numeric position.
    return Math.max(ordinal,storedPosition,0);
  }
  function advance(save,index,ordinal){
    let next=ordinal;
    while(next<index.N-1&&earned(save,index,index.entries[next]))next++; // a level whose replaced puzzle was completed never blocks the frontier (its replacement stays playable)
    return next;
  }
  function derivedOrdinal(save,index){return advance(save,index,0)}

  // Pure. Returns {block,changed,readOnly,reason,ordinal,index}. Never throws.
  function normalize(save,manifest,nowIso){
    let index={entries:[],N:0,ordinalById:new Map(),retiredById:new Map()};
    try{
      index=indexManifest(manifest);
      if(!index.N)return {block:null,changed:false,readOnly:true,reason:"empty-manifest",ordinal:0,index};
      const sequenceId=manifest.sequenceId,sequenceVersion=Number.isInteger(manifest.sequenceVersion)?manifest.sequenceVersion:1;
      const raw=isPlain(save&&save.unifiedProgress)?save.unifiedProgress:null;
      let reason=null;
      if(raw){
        if(Number.isInteger(raw.schemaVersion)&&raw.schemaVersion>SCHEMA_VERSION)reason="future-schema";
        else if(typeof raw.sequenceId==="string"&&raw.sequenceId&&raw.sequenceId!==sequenceId)reason="sequence-mismatch";
        else if(Number.isInteger(raw.sequenceVersion)&&raw.sequenceVersion>sequenceVersion)reason="future-sequence-version";
      }
      if(reason){ // read-only: leave the stored block untouched; use a transient frontier
        const ordinal=reason==="sequence-mismatch"?derivedOrdinal(save,index):advance(save,index,resolveStored(index,raw));
        return {block:raw,changed:false,readOnly:true,reason,ordinal,index};
      }
      let oversize=false;
      if(raw){try{oversize=JSON.stringify(raw).length>MAX_BLOCK_CHARS}catch(_){oversize=true}}
      const source=raw?(oversize?{frontier:isPlain(raw.frontier)?{position:raw.frontier.position,puzzleId:raw.frontier.puzzleId}:undefined}:raw):{};
      const ordinal=advance(save,index,resolveStored(index,source)),entry=index.entries[ordinal];
      const previousFrontier=isPlain(source.frontier)?source.frontier:{};
      const changed=!raw||oversize||raw.schemaVersion!==SCHEMA_VERSION||raw.sequenceId!==sequenceId||raw.sequenceVersion!==sequenceVersion||!isPlain(raw.frontier)||raw.frontier.position!==ordinal+1||raw.frontier.puzzleId!==entry.puzzleId;
      if(!changed)return {block:raw,changed:false,readOnly:false,reason:null,ordinal,index};
      const block={...source,schemaVersion:SCHEMA_VERSION,sequenceId,sequenceVersion,frontier:{...previousFrontier,position:ordinal+1,puzzleId:entry.puzzleId},updatedAt:nowIso};
      if(!block.frontier)delete block.frontier;
      return {block,changed:true,readOnly:false,reason:oversize?"oversize-rebuilt":null,ordinal,index};
    }catch(error){
      const ordinal=index.N?derivedOrdinal(save,index):0;
      return {block:null,changed:false,readOnly:true,reason:"error",ordinal,index};
    }
  }
  // Mutates save.unifiedProgress only, and only when the normalized block changed.
  function apply(save,manifest,nowIso){
    const result=normalize(save,manifest,nowIso);
    if(!result.readOnly&&result.changed)save.unifiedProgress=result.block;
    return result;
  }
  function levelStates(save,manifest,nowIso){
    const result=normalize(save,manifest,nowIso),{index,ordinal}=result;
    return index.entries.map((entry,i)=>{
      const completed=solved(save,entry.puzzleId),playable=completed||i<=ordinal||earned(save,index,entry);
      const state=completed?"completed":i===ordinal?"current":playable?"available":"locked";
      return {level:i+1,puzzleId:entry.puzzleId,state,playable};
    });
  }
  function resume(save,manifest,nowIso){
    const result=normalize(save,manifest,nowIso);
    return result.index.N?{level:result.ordinal+1,puzzleId:result.index.entries[result.ordinal].puzzleId,readOnly:result.readOnly}:null;
  }
  function canPlay(save,manifest,puzzleId,nowIso){
    const found=levelStates(save,manifest,nowIso).find(item=>item.puzzleId===puzzleId);
    return !!(found&&found.playable);
  }
  // Canonical-record view used for reward-once: rewarded answers of every replaced puzzle count as already rewarded.
  function lineageRewardRecord(save,manifest,puzzleId){
    const index=indexManifest(manifest),entry=index.entries[index.ordinalById.has(puzzleId)?index.ordinalById.get(puzzleId):-1];
    const own=save&&isPlain(save.canonicalPuzzleProgress)&&isPlain(save.canonicalPuzzleProgress[puzzleId])?save.canonicalPuzzleProgress[puzzleId]:{};
    const rewarded=new Set(Array.isArray(own.rewardedAnswers)?own.rewardedAnswers:[]);
    if(entry)replacedIds(index,entry).forEach(id=>{const record=save&&isPlain(save.canonicalPuzzleProgress)?save.canonicalPuzzleProgress[id]:null;if(isPlain(record)&&Array.isArray(record.rewardedAnswers))record.rewardedAnswers.forEach(word=>{if(typeof word==="string"&&word)rewarded.add(word)})});
    return {...own,rewardedAnswers:[...rewarded]};
  }
  return {SCHEMA_VERSION,MAX_BLOCK_CHARS,solved,earned,replacedIds,indexManifest,normalize,apply,levelStates,resume,canPlay,lineageRewardRecord};
});

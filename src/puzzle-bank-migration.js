(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitPuzzleBankMigration=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  // Backfills pre-pipeline bank entries ({id, words, letters}, the shape
  // buildBank in puzzle-bank-engine.js has always produced) to the new puzzle
  // schema. Non-destructive: entries that already look migrated (have
  // requiredWords) pass through unchanged. No save-version bump, no forced
  // regeneration — matches the backfill pattern learning-engine.js already
  // uses for save-schema upgrades.
  function migrateLegacyBank(bank,worldId,vocabulary,deps){
    const {scoreDifficulty,generateHint,now}=deps||{};
    const byWord=new Map((vocabulary||[]).map(entry=>[entry.word,entry]));

    return (bank||[]).map(entry=>{
      if(entry.requiredWords)return entry;

      const requiredWords=entry.words||[];
      const letters=entry.letters||[];
      const focusWord=requiredWords[0]||"";
      const definition=(byWord.get(focusWord)||{}).definition||"";
      const candidate={focusWord,definition,letters,requiredWords,bonusWords:[],tags:[...requiredWords]};

      const {score,difficulty}=scoreDifficulty(candidate);
      const hint=definition?generateHint(candidate):"";

      return {
        id:entry.id,
        worldId,
        tags:candidate.tags,
        letters,
        requiredWords,
        bonusWords:[],
        focusWord,
        definition,
        difficulty,
        hint,
        estimatedSolveSeconds:Math.round(20+requiredWords.length*15+score*0.5),
        generatorVersion:0,
        createdAt:entry.createdAt||(now?now():new Date().toISOString()),
      };
    });
  }

  return {migrateLegacyBank};
});

(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitLearning=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const CURRENT_SAVE_VERSION=3,SAVE_KEY="finlitQuest.save",DAY_MS=86400000;
  const DEFAULT_MASTERY_CONFIG=Object.freeze({puzzleWeight:.2,challengeWeight:.45,reviewWeight:.35,puzzleSolvesForFullCredit:2,challengeAttemptsForConfidence:3,reviewAttemptsForConfidence:3,masteryThresholds:[0,25,50,75,90],maxReviewIntervalDays:3650});
  // Single source of truth for the word game's coin economy. startingCoins is
  // derived from fullRevealCost (not a second hardcoded number) so a new player
  // can always afford exactly one full word-and-definition reveal, and the two
  // values can never drift apart — see word-game-app.js's WG_FULL_REVEAL_COST,
  // which reads fullRevealCost from here instead of hardcoding its own copy.
  const DEFAULT_FULL_REVEAL_COST=300;
  function buildEconomyConfig(fullRevealCost=DEFAULT_FULL_REVEAL_COST){return Object.freeze({fullRevealCost,startingCoins:fullRevealCost})}
  const DEFAULT_ECONOMY_CONFIG=buildEconomyConfig();
  const iso=(date=new Date())=>date.toISOString(),clamp=(value,min,max)=>Math.min(max,Math.max(min,value)),addDays=(date,days)=>new Date(date.getTime()+days*DAY_MS);
  // Guards against a corrupted/tampered save persisting a non-numeric or
  // negative xp value forever (every runtime path only ever adds validated
  // positive amounts to player.xp, so the one realistic way it could go bad
  // is a hand-edited or corrupted localStorage value at load time).
  function sanitizeXp(value){return Number.isFinite(value)&&value>=0?value:0}
  function puzzleDefaults(){return {timesSeen:0,timesSolved:0,lettersRevealed:0,hintsUsed:0,validAttempts:0,invalidAttempts:0,totalSolveTimeMs:0,lastSolveDate:null}}
  function challengeDefaults(){return {challengesSeen:0,challengesCorrect:0,challengesIncorrect:0,lastChallengeDate:null,lastChallengeResult:null,consecutiveCorrect:0,misconceptionFlags:[]}}
  function reviewDefaults(){return {againCount:0,hardCount:0,goodCount:0,easyCount:0,currentEaseFactor:2.5,currentInterval:0,nextReviewDate:null,lastReviewed:null}}
  function emptyProgress(){return {masteryLevel:0,masteryPercent:0,puzzle:puzzleDefaults(),challenge:challengeDefaults(),review:reviewDefaults(),dateUnlocked:null,dateMastered:null}}
  function playerDefaults(){return {xp:0,level:1,coins:DEFAULT_ECONOMY_CONFIG.startingCoins,streak:0,lastPlayed:null,activityDates:[],weeklyGoal:5,achievements:[]}}
  function createSave(now=new Date()){return {saveVersion:CURRENT_SAVE_VERSION,player:playerDefaults(),termProgress:{},objectiveProgress:{},scenarioProgress:{},libraryChallengeProgress:{},worlds:{},settings:{theme:"light",reducedMotion:false,skipLessons:false},updatedAt:iso(now)}}
  function mergeProgress(value={}){
    const progress={...emptyProgress(),...value,puzzle:{...puzzleDefaults(),...(value.puzzle||{})},challenge:{...challengeDefaults(),...(value.challenge||{})},review:{...reviewDefaults(),...(value.review||{})}};
    if(value.timesSeen&&!progress.puzzle.timesSeen)progress.puzzle.timesSeen=value.timesSeen;
    if(value.timesCorrect&&!progress.review.goodCount)progress.review.goodCount=value.timesCorrect;
    if(value.timesIncorrect&&!progress.review.againCount)progress.review.againCount=value.timesIncorrect;
    if(value.easeFactor)progress.review.currentEaseFactor=value.easeFactor;
    if(value.reviewInterval)progress.review.currentInterval=value.reviewInterval;
    if(value.nextReview)progress.review.nextReviewDate=value.nextReview;
    if(value.lastReviewed)progress.review.lastReviewed=value.lastReviewed;
    return progress;
  }
  function normalizeSave(raw,storage,now){
    if(!raw||typeof raw!=="object"||Array.isArray(raw)){
      const save=createSave(now),legacyReview=safeJson(storage.getItem("yw_review"),{}),legacyYield=Number(storage.getItem("yw_yield")||0);
      save.player.xp=Math.max(0,Math.round(legacyYield));
      Object.entries(legacyReview).forEach(([word,weight])=>{const id=`crypto.${word.toLowerCase()}`,p=emptyProgress();p.dateUnlocked=iso(now);p.puzzle.timesSeen=Math.max(1,Number(weight)||1);p.puzzle.timesSolved=1;save.termProgress[id]=p});
      return save;
    }
    const save={...createSave(now),...raw,player:{...playerDefaults(),...(raw.player||{})},settings:{theme:"light",reducedMotion:false,skipLessons:false,...(raw.settings||{})},termProgress:{...(raw.termProgress||{})},objectiveProgress:{...(raw.objectiveProgress||{})},scenarioProgress:{...(raw.scenarioProgress||{})},libraryChallengeProgress:{...(raw.libraryChallengeProgress||{})},worlds:{...(raw.worlds||{})}};
    save.player.xp=sanitizeXp(save.player.xp);
    Object.keys(save.termProgress).forEach(id=>save.termProgress[id]=mergeProgress(save.termProgress[id]));
    save.saveVersion=CURRENT_SAVE_VERSION;return save;
  }
  function safeJson(value,fallback){try{return JSON.parse(value||"")}catch(_){return fallback}}
  function accuracy(correct,incorrect){return correct+incorrect?Math.round(correct/(correct+incorrect)*100):0}
  function dateKey(date){return date.toISOString().slice(0,10)}
  function calculateStreak(activityDates,now=new Date()){
    const dates=new Set(activityDates||[]),cursor=new Date(now);cursor.setHours(0,0,0,0);let streak=0;
    if(!dates.has(dateKey(cursor))){cursor.setDate(cursor.getDate()-1)}
    while(dates.has(dateKey(cursor))){streak++;cursor.setDate(cursor.getDate()-1)}return streak;
  }
  function calculateMastery(progress,config=DEFAULT_MASTERY_CONFIG){
    const puzzle=Math.min(1,progress.puzzle.timesSolved/config.puzzleSolvesForFullCredit);
    const challengeAccuracy=progress.challenge.challengesSeen?progress.challenge.challengesCorrect/progress.challenge.challengesSeen:0;
    const challenge=challengeAccuracy*Math.min(1,progress.challenge.challengesSeen/config.challengeAttemptsForConfidence);
    const totalReviews=progress.review.againCount+progress.review.hardCount+progress.review.goodCount+progress.review.easyCount;
    const reviewScore=totalReviews?(progress.review.hardCount*.45+progress.review.goodCount*.75+progress.review.easyCount)/totalReviews:0;
    const review=reviewScore*Math.min(1,totalReviews/config.reviewAttemptsForConfidence);
    const percent=Math.round((puzzle*config.puzzleWeight+challenge*config.challengeWeight+review*config.reviewWeight)*100);
    const level=config.masteryThresholds.reduce((result,threshold,index)=>percent>=threshold?index:result,0);
    return {percent,level,components:{puzzle:Math.round(puzzle*100),challenge:Math.round(challenge*100),review:Math.round(review*100)}};
  }
  class LearningRepository{
    constructor(terms){this.byId=new Map();this.idsByWorld=new Map();terms.forEach(term=>{const normalized=this.normalize(term);if(this.byId.has(normalized.id))throw new Error(`Duplicate learning object id: ${normalized.id}`);const frozen=Object.freeze(normalized);this.byId.set(normalized.id,frozen);if(!this.idsByWorld.has(normalized.world))this.idsByWorld.set(normalized.world,[]);this.idsByWorld.get(normalized.world).push(normalized.id)})}
    normalize(term){return {id:term.id,world:term.world,category:term.category,difficulty:term.difficulty,word:term.word,normalizedWord:term.normalizedWord,definition:term.definition,pronunciation:term.pronunciation,realLifeExample:term.realLifeExample,didYouKnow:term.didYouKnow,commonMistake:term.commonMistake,relatedTermIds:[...term.relatedTermIds],quickChallenge:{...term.quickChallenge,options:[...term.quickChallenge.options]},xpValue:term.xpValue,reviewWeight:term.reviewWeight}}
    get(id){return this.byId.get(id)||null}findByWord(world,word){return this.get(`${world}.${String(word).toLowerCase()}`)}idsForWorld(world){return this.idsByWorld.get(world)||[]}get size(){return this.byId.size}
  }
  class LearningEngine{
    constructor({terms,storage,now=()=>new Date(),masteryConfig={}}){this.repository=new LearningRepository(terms);this.storage=storage;this.now=now;this.masteryConfig=Object.freeze({...DEFAULT_MASTERY_CONFIG,...masteryConfig});const raw=safeJson(storage.getItem(SAVE_KEY),null);this.save=normalizeSave(raw,storage,this.now());this.persist()}
    persist(){this.save.updatedAt=iso(this.now());this.storage.setItem(SAVE_KEY,JSON.stringify(this.save))}
    progressFor(id){if(!this.repository.get(id))throw new Error(`Unknown term id: ${id}`);if(!this.save.termProgress[id])this.save.termProgress[id]=emptyProgress();return this.save.termProgress[id]}
    learningObject(id){const content=this.repository.get(id);return content?{...content,...this.progressFor(id)}:null}
    // Single source of truth for spending coins: checks the balance, deducts
    // the exact cost once, persists immediately, and never allows a negative
    // balance. Used for both the letter hint and the full word-and-definition
    // reveal (word-game-app.js) so every purchase path shares one guarantee.
    spendCoins(cost){if((this.save.player.coins||0)<cost)return false;this.save.player.coins-=cost;this.persist();return true}
    touchActivity(){const today=dateKey(this.now());if(!this.save.player.activityDates.includes(today))this.save.player.activityDates.push(today);this.save.player.activityDates=this.save.player.activityDates.slice(-400);this.save.player.lastPlayed=iso(this.now());this.save.player.streak=calculateStreak(this.save.player.activityDates,this.now())}
    unlock(id){const p=this.progressFor(id);if(!p.dateUnlocked)p.dateUnlocked=iso(this.now());return p}
    recordPuzzleSeen(id){const p=this.unlock(id);p.puzzle.timesSeen++;this.touchActivity();this.updateMastery(id);this.persist();return this.learningObject(id)}
    recordPuzzleAttempt(id,{valid=false}={}){const p=this.unlock(id);valid?p.puzzle.validAttempts++:p.puzzle.invalidAttempts++;this.persist()}
    recordHint(id,{lettersRevealed=1}={}){const p=this.unlock(id);p.puzzle.hintsUsed++;p.puzzle.lettersRevealed+=lettersRevealed;this.updateMastery(id);this.persist();return this.learningObject(id)}
    recordPuzzleSolved(id,{solveTimeMs=0}={}){const p=this.unlock(id);p.puzzle.timesSeen++;p.puzzle.timesSolved++;p.puzzle.validAttempts++;p.puzzle.totalSolveTimeMs+=Math.max(0,solveTimeMs);p.puzzle.lastSolveDate=iso(this.now());this.touchActivity();this.updateMastery(id);this.persist();return this.learningObject(id)}
    recordChallenge(id,{correct,misconceptionFlag=null}){const p=this.unlock(id);p.challenge.challengesSeen++;p.challenge.lastChallengeDate=iso(this.now());p.challenge.lastChallengeResult=Boolean(correct);if(correct){p.challenge.challengesCorrect++;p.challenge.consecutiveCorrect++}else{p.challenge.challengesIncorrect++;p.challenge.consecutiveCorrect=0;if(misconceptionFlag&&!p.challenge.misconceptionFlags.includes(misconceptionFlag))p.challenge.misconceptionFlags.push(misconceptionFlag)}this.touchActivity();this.updateMastery(id);this.persist();return this.learningObject(id)}
    review(id,rating){
      if(!["again","hard","good","easy"].includes(rating))throw new Error(`Invalid review rating: ${rating}`);const term=this.repository.get(id),p=this.unlock(id),r=p.review,now=this.now(),previous=r.currentInterval||0;r[`${rating}Count`]++;r.lastReviewed=iso(now);
      if(rating==="again"){r.currentEaseFactor=clamp(r.currentEaseFactor-.2,1.3,3);r.currentInterval=10/1440;p.dateMastered=null}
      if(rating==="hard"){r.currentEaseFactor=clamp(r.currentEaseFactor-.15,1.3,3);r.currentInterval=Math.max(1,previous*1.2||1)}
      if(rating==="good")r.currentInterval=previous===0?1:previous<2?3:Math.max(3,previous*r.currentEaseFactor*term.reviewWeight);
      if(rating==="easy"){r.currentEaseFactor=clamp(r.currentEaseFactor+.15,1.3,3);r.currentInterval=previous===0?4:Math.max(4,previous*r.currentEaseFactor*1.3*term.reviewWeight)}
      r.currentInterval=Math.min(r.currentInterval,this.masteryConfig.maxReviewIntervalDays);r.nextReviewDate=iso(addDays(now,r.currentInterval));this.save.player.xp+=term.xpValue;this.save.player.level=Math.floor(this.save.player.xp/250)+1;this.touchActivity();this.updateMastery(id);this.unlockAchievements();this.persist();return this.learningObject(id)
    }
    updateMastery(id){const p=this.progressFor(id),result=calculateMastery(p,this.masteryConfig);p.masteryPercent=result.percent;p.masteryLevel=result.level;if(result.level>=4&&!p.dateMastered)p.dateMastered=iso(this.now());if(result.level<4)p.dateMastered=null;return result}
    unlockAchievements(){const achievements=this.save.player.achievements;if(Object.values(this.save.termProgress).some(p=>p.challenge.challengesCorrect>0)&&!achievements.includes("first_application"))achievements.push("first_application");if(this.save.player.streak>=3&&!achievements.includes("three_day_streak"))achievements.push("three_day_streak")}
    due(world,limit=20){const now=this.now().getTime();return this.repository.idsForWorld(world).filter(id=>{const date=this.save.termProgress[id]?.review.nextReviewDate;return date&&new Date(date).getTime()<=now}).sort((a,b)=>new Date(this.save.termProgress[a].review.nextReviewDate)-new Date(this.save.termProgress[b].review.nextReviewDate)).slice(0,limit).map(id=>this.learningObject(id))}
    worldStats(world){const ids=this.repository.idsForWorld(world),records=ids.map(id=>this.save.termProgress[id]).filter(Boolean),learned=records.filter(p=>p.dateUnlocked).length,totalChallengeCorrect=records.reduce((n,p)=>n+p.challenge.challengesCorrect,0),totalChallengeIncorrect=records.reduce((n,p)=>n+p.challenge.challengesIncorrect,0),intervals=records.map(p=>p.review.currentInterval).filter(Boolean),masteryTotal=records.reduce((n,p)=>n+p.masteryPercent,0);return {world,totalTerms:ids.length,completionPercent:ids.length?Math.round(learned/ids.length*100):0,masteryPercent:ids.length?Math.round(masteryTotal/ids.length):0,wordsLearned:learned,wordsRemaining:Math.max(0,ids.length-learned),averageAccuracy:accuracy(totalChallengeCorrect,totalChallengeIncorrect),averageReviewInterval:intervals.length?Number((intervals.reduce((a,b)=>a+b,0)/intervals.length).toFixed(1)):0,reviewsDue:this.due(world,50000).length}}
    termMetrics(id){const p=this.progressFor(id);return {puzzle:{...p.puzzle,solveAccuracy:accuracy(p.puzzle.validAttempts,p.puzzle.invalidAttempts),averageSolveSpeedMs:p.puzzle.timesSolved?Math.round(p.puzzle.totalSolveTimeMs/p.puzzle.timesSolved):0},challenge:{...p.challenge,challengeAccuracy:accuracy(p.challenge.challengesCorrect,p.challenge.challengesIncorrect)},review:{...p.review},mastery:calculateMastery(p,this.masteryConfig)}}
    workbookProgress(worldId,workbookId){const worlds=this.save.worlds;if(!worlds[worldId])worlds[worldId]={workbooks:{}};if(!worlds[worldId].workbooks)worlds[worldId].workbooks={};if(!worlds[worldId].workbooks[workbookId])worlds[worldId].workbooks[workbookId]={status:"available",attempts:0,bestScorePercent:0,dateCompleted:null,xpAwarded:0,practiceCompleted:false};return worlds[worldId].workbooks[workbookId]}
    recordWorkbookPractice(worldId,workbookId){const p=this.workbookProgress(worldId,workbookId);p.practiceCompleted=true;this.touchActivity();this.persist();return p}
    recordWorkbookAttempt(worldId,workbookId,{percent,passed,xpValue}){const p=this.workbookProgress(worldId,workbookId);p.attempts++;p.bestScorePercent=Math.max(p.bestScorePercent,percent);let xpGained=0;if(passed&&p.status!=="completed"){p.status="completed";p.dateCompleted=iso(this.now());xpGained=xpValue;p.xpAwarded=xpValue;this.save.player.xp+=xpValue;this.save.player.level=Math.floor(this.save.player.xp/250)+1;this.unlockAchievements()}this.touchActivity();this.persist();return {progress:{...p},xpGained}}
    workbookWorldStats(worldId,workbookIds){const worlds=this.save.worlds[worldId]||{workbooks:{}};const records=workbookIds.map(id=>worlds.workbooks?.[id]).filter(Boolean);const completed=records.filter(r=>r.status==="completed").length;const xpEarned=records.reduce((sum,r)=>sum+(r.xpAwarded||0),0);return {worldId,totalWorkbooks:workbookIds.length,completed,completionPercent:workbookIds.length?Math.round(completed/workbookIds.length*100):0,xpEarned}}
  }
  return {LearningEngine,LearningRepository,CURRENT_SAVE_VERSION,SAVE_KEY,DEFAULT_MASTERY_CONFIG,DEFAULT_ECONOMY_CONFIG,buildEconomyConfig,calculateMastery,calculateStreak,createSave,emptyProgress,normalizeSave};
});

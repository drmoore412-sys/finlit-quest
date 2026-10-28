(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitLearning=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const CURRENT_SAVE_VERSION=4,SAVE_KEY="finlitQuest.save",DAY_MS=86400000;
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
  // negative value forever for any counter field (every runtime path only
  // ever adds validated positive amounts, so the one realistic way it could
  // go bad is a hand-edited or corrupted localStorage value at load time).
  // Shared by xp, coins, and streak below.
  function sanitizeCount(value){return Number.isFinite(value)&&value>=0?value:0}
  function sanitizeXp(value){return sanitizeCount(value)}
  // Single source of truth for level progression. Previously duplicated as a
  // literal "250" in four places (this file's review()/recordWorkbookAttempt(),
  // word-game-app.js's wgFoundWord()/wgUpdateHeader()) and, separately, as a
  // stale "100" in app.js's legacy dashboard — the two divisors disagreed,
  // so the same xp value displayed a different level depending which screen
  // you were on (found during V1.0 Blocker 2, fixed in Blocker 3).
  const XP_PER_LEVEL=250;
  function levelForXp(xp){return Math.floor(sanitizeXp(xp)/XP_PER_LEVEL)+1}
  function xpIntoLevel(xp){return sanitizeXp(xp)%XP_PER_LEVEL}
  // Single source of truth for achievements: the same record drives the XP that is
  // awarded and the copy the dashboard displays, so the two cannot drift apart
  // (previously app.js advertised "+25 XP"/"+50 XP" while unlockAchievements()
  // only pushed the id and granted nothing).
  const ACHIEVEMENTS=Object.freeze({
    first_application:Object.freeze({id:"first_application",title:"Applied Thinker",description:"Answered your first applied challenge.",xp:25}),
    three_day_streak:Object.freeze({id:"three_day_streak",title:"On a Roll",description:"Learned on three consecutive days.",xp:50}),
  });
  const DAILY_CLAIM_HISTORY_LIMIT=60;
  // Owner-approved 7-day daily login schedule (Phase 2). Coins only; the cycle
  // repeats after Day 7 and a missed eligible day restarts it at Day 1.
  const DAILY_LOGIN_SCHEDULE=Object.freeze([10,15,20,25,30,35,50]);
  // Local clock-manipulation safeguards (no trusted time source exists offline).
  const CLOCK_ROLLBACK_TOLERANCE_MS=10*60*1000;   // ordinary NTP corrections are far smaller
  const TIMEZONE_CLAIM_COOLDOWN_MS=24*60*60*1000; // a real zone change cannot open a new claim sooner than this
  const TRAVEL_FORGIVENESS_MS=36*60*60*1000;      // a date skipped by eastward travel is not a missed day
  function timeZoneId(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||null}catch(_){return null}}
  function cycleDayForStreak(streak){return ((Math.max(1,streak)-1)%DAILY_LOGIN_SCHEDULE.length)+1}
  function dailyRewardForStreak(streak){return DAILY_LOGIN_SCHEDULE[cycleDayForStreak(streak)-1]}
  function isPlainObject(value){return Boolean(value)&&typeof value==="object"&&!Array.isArray(value)}
  // Non-mutating, corruption-tolerant read of save.engagement.dailyClaim.
  function readDailyClaim(engagement){
    const raw=isPlainObject(engagement)&&isPlainObject(engagement.dailyClaim)?engagement.dailyClaim:{};
    const history=Array.isArray(raw.history)?raw.history.filter(entry=>isPlainObject(entry)&&isDayKey(entry.day)).slice(-DAILY_CLAIM_HISTORY_LIMIT):[];
    return {lastClaimDay:isDayKey(raw.lastClaimDay)?raw.lastClaimDay:null,claimStreak:sanitizeCount(raw.claimStreak),longestClaimStreak:sanitizeCount(raw.longestClaimStreak),history,
      lastClaimAtMs:Number.isFinite(raw.lastClaimAtMs)&&raw.lastClaimAtMs>0?raw.lastClaimAtMs:null,lastClaimTimeZone:typeof raw.lastClaimTimeZone==="string"&&raw.lastClaimTimeZone?raw.lastClaimTimeZone:null};
  }
  function puzzleDefaults(){return {timesSeen:0,timesSolved:0,lettersRevealed:0,hintsUsed:0,validAttempts:0,invalidAttempts:0,totalSolveTimeMs:0,lastSolveDate:null}}
  function challengeDefaults(){return {challengesSeen:0,challengesCorrect:0,challengesIncorrect:0,lastChallengeDate:null,lastChallengeResult:null,consecutiveCorrect:0,misconceptionFlags:[]}}
  function reviewDefaults(){return {againCount:0,hardCount:0,goodCount:0,easyCount:0,currentEaseFactor:2.5,currentInterval:0,nextReviewDate:null,lastReviewed:null}}
  function emptyProgress(){return {masteryLevel:0,masteryPercent:0,puzzle:puzzleDefaults(),challenge:challengeDefaults(),review:reviewDefaults(),dateUnlocked:null,dateMastered:null}}
  function playerDefaults(){return {xp:0,level:1,coins:DEFAULT_ECONOMY_CONFIG.startingCoins,streak:0,lastPlayed:null,activityDates:[],weeklyGoal:5,achievements:[]}}
  function createSave(now=new Date()){return {saveVersion:CURRENT_SAVE_VERSION,player:playerDefaults(),termProgress:{},objectiveProgress:{},scenarioProgress:{},libraryChallengeProgress:{},canonicalPuzzleProgress:{},worlds:{},settings:{theme:"light",reducedMotion:false,skipLessons:false},updatedAt:iso(now)}}
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
    const save={...createSave(now),...raw,player:{...playerDefaults(),...(raw.player||{})},settings:{theme:"light",reducedMotion:false,skipLessons:false,...(raw.settings||{})},termProgress:{...(raw.termProgress||{})},objectiveProgress:{...(raw.objectiveProgress||{})},scenarioProgress:{...(raw.scenarioProgress||{})},libraryChallengeProgress:{...(raw.libraryChallengeProgress||{})},canonicalPuzzleProgress:isPlainObject(raw.canonicalPuzzleProgress)?{...raw.canonicalPuzzleProgress}:{},worlds:{...(raw.worlds||{})}};
    save.player.xp=sanitizeXp(save.player.xp);
    save.player.coins=sanitizeCount(save.player.coins);
    save.player.streak=sanitizeCount(save.player.streak);
    if(!Array.isArray(save.player.activityDates))save.player.activityDates=[];
    if(!Array.isArray(save.player.achievements))save.player.achievements=[];
    if(save.player.achievementRewards!==undefined&&!isPlainObject(save.player.achievementRewards))delete save.player.achievementRewards;
    Object.keys(save.termProgress).forEach(id=>save.termProgress[id]=mergeProgress(save.termProgress[id]));
    save.saveVersion=CURRENT_SAVE_VERSION;return save;
  }
  function safeJson(value,fallback){try{return JSON.parse(value||"")}catch(_){return fallback}}
  function accuracy(correct,incorrect){return correct+incorrect?Math.round(correct/(correct+incorrect)*100):0}
  // Local calendar-day keys ("YYYY-MM-DD" in the player's own time zone). The
  // previous dateKey() used toISOString() (UTC), so a US evening play was filed
  // under the next UTC day and the streak/"today" boundary fell at UTC midnight
  // (e.g. 5 pm Pacific) instead of local midnight. Day arithmetic goes through
  // dayNumber() (UTC-based calendar index of the Y-M-D parts), so adding or
  // subtracting a day is immune to 23/25-hour daylight-saving days.
  function localDayKey(date){const y=date.getFullYear(),m=date.getMonth()+1,d=date.getDate();return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`}
  function isDayKey(value){return typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)}
  function dayNumber(key){const [y,m,d]=key.split("-").map(Number);return Math.round(Date.UTC(y,m-1,d)/DAY_MS)}
  function calculateStreak(activityDates,now=new Date()){
    const days=new Set((activityDates||[]).filter(isDayKey).map(dayNumber));let cursor=dayNumber(localDayKey(now)),streak=0;
    if(!days.has(cursor))cursor--;
    while(days.has(cursor)){streak++;cursor--}return streak;
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
    constructor(terms){this.byId=new Map();this.idsByWorld=new Map();terms.forEach(term=>this.register(term))}
    normalize(term){return {id:term.id,world:term.world,category:term.category,difficulty:term.difficulty,word:term.word,normalizedWord:term.normalizedWord,definition:term.definition,pronunciation:term.pronunciation,realLifeExample:term.realLifeExample,didYouKnow:term.didYouKnow,commonMistake:term.commonMistake,relatedTermIds:[...term.relatedTermIds],quickChallenge:{...term.quickChallenge,options:[...term.quickChallenge.options]},xpValue:term.xpValue,reviewWeight:term.reviewWeight}}
    register(term){const normalized=this.normalize(term),prior=this.byId.get(normalized.id);if(prior){if(prior.word!==normalized.word||prior.world!==normalized.world)throw new Error(`Conflicting learning object id: ${normalized.id}`);return prior}const frozen=Object.freeze(normalized);this.byId.set(normalized.id,frozen);if(!this.idsByWorld.has(normalized.world))this.idsByWorld.set(normalized.world,[]);this.idsByWorld.get(normalized.world).push(normalized.id);return frozen}
    registerMany(terms){return (terms||[]).map(term=>this.register(term))}
    get(id){return this.byId.get(id)||null}findByWord(world,word){return this.get(`${world}.${String(word).toLowerCase()}`)}idsForWorld(world){return this.idsByWorld.get(world)||[]}get size(){return this.byId.size}
  }
  class LearningEngine{
    constructor({terms,storage,now=()=>new Date(),masteryConfig={}}){this.repository=new LearningRepository(terms);this.storage=storage;this.now=now;this.masteryConfig=Object.freeze({...DEFAULT_MASTERY_CONFIG,...masteryConfig});const raw=safeJson(storage.getItem(SAVE_KEY),null);this.save=normalizeSave(raw,storage,this.now());this.sessionStartEvidenceMs=Date.parse(this.save.updatedAt)||0;this.clockHighMs=0;this.persist()}
    persist(){this.save.updatedAt=iso(this.now());this.storage.setItem(SAVE_KEY,JSON.stringify(this.save))}
    registerTerms(terms){return this.repository.registerMany(terms)}
    progressFor(id){if(!this.repository.get(id))throw new Error(`Unknown term id: ${id}`);if(!this.save.termProgress[id])this.save.termProgress[id]=emptyProgress();return this.save.termProgress[id]}
    learningObject(id){const content=this.repository.get(id);return content?{...content,...this.progressFor(id)}:null}
    // Single source of truth for spending coins: checks the balance, deducts
    // the exact cost once, persists immediately, and never allows a negative
    // balance. Used for both the letter hint and the full word-and-definition
    // reveal (word-game-app.js) so every purchase path shares one guarantee.
    spendCoins(cost){if((this.save.player.coins||0)<cost)return false;this.save.player.coins-=cost;this.persist();return true}
    // Counts a qualifying activity on the player's LOCAL calendar day.
    //  - same local day as the last counted activity: no mutation at all
    //  - the next local day: streak = stored streak + 1 (an earned streak is never
    //    recomputed downward from date keys)
    //  - a gap of 2+ local days: streak restarts at 1
    // The last counted day comes from lastPlayed (a full instant, so it converts to
    // the correct local day even for saves written under the old UTC keys); only if
    // that is missing does it fall back to the newest recorded activity date. A
    // clock/time-zone change that makes "today" earlier than the last counted day is
    // treated as the same day (nothing is added or removed). Returns the list of
    // achievements newly granted by this activity (usually empty).
    touchActivity(){
      const player=this.save.player,now=this.now(),today=localDayKey(now),todayNumber=dayNumber(today);
      if(!Array.isArray(player.activityDates))player.activityDates=[];
      let lastDay=null;
      if(player.lastPlayed){const parsed=new Date(player.lastPlayed);if(!Number.isNaN(parsed.getTime()))lastDay=localDayKey(parsed)}
      if(!lastDay){const known=player.activityDates.filter(isDayKey).sort();lastDay=known.length?known[known.length-1]:null}
      const gap=lastDay===null?null:todayNumber-dayNumber(lastDay);
      if(gap!==null&&gap<=0)return this.unlockAchievements();
      if(!player.activityDates.includes(today))player.activityDates.push(today);
      player.activityDates=player.activityDates.slice(-400);
      player.lastPlayed=iso(now);
      const calculated=calculateStreak(player.activityDates,now),carried=sanitizeCount(player.streak);
      player.streak=gap===1?Math.max(carried+1,calculated):gap===null?Math.max(1,calculated):1;
      return this.unlockAchievements();
    }
    unlock(id){const p=this.progressFor(id);if(!p.dateUnlocked)p.dateUnlocked=iso(this.now());return p}
    recordPuzzleSeen(id){const p=this.unlock(id);p.puzzle.timesSeen++;this.touchActivity();this.updateMastery(id);this.persist();return this.learningObject(id)}
    recordPuzzleAttempt(id,{valid=false}={}){const p=this.unlock(id);valid?p.puzzle.validAttempts++:p.puzzle.invalidAttempts++;this.persist()}
    recordHint(id,{lettersRevealed=1}={}){const p=this.unlock(id);p.puzzle.hintsUsed++;p.puzzle.lettersRevealed+=lettersRevealed;this.updateMastery(id);this.persist();return this.learningObject(id)}
    recordPuzzleSolved(id,{solveTimeMs=0}={}){const p=this.unlock(id);p.puzzle.timesSeen++;p.puzzle.timesSolved++;p.puzzle.validAttempts++;p.puzzle.totalSolveTimeMs+=Math.max(0,solveTimeMs);p.puzzle.lastSolveDate=iso(this.now());this.touchActivity();this.updateMastery(id);this.persist();return this.learningObject(id)}
    recordChallenge(id,{correct,misconceptionFlag=null}){const p=this.unlock(id);p.challenge.challengesSeen++;p.challenge.lastChallengeDate=iso(this.now());p.challenge.lastChallengeResult=Boolean(correct);if(correct){p.challenge.challengesCorrect++;p.challenge.consecutiveCorrect++}else{p.challenge.challengesIncorrect++;p.challenge.consecutiveCorrect=0;if(misconceptionFlag&&!p.challenge.misconceptionFlags.includes(misconceptionFlag))p.challenge.misconceptionFlags.push(misconceptionFlag)}this.touchActivity();this.unlockAchievements();this.updateMastery(id);this.persist();return this.learningObject(id)}
    review(id,rating){
      if(!["again","hard","good","easy"].includes(rating))throw new Error(`Invalid review rating: ${rating}`);const term=this.repository.get(id),p=this.unlock(id),r=p.review,now=this.now(),previous=r.currentInterval||0;r[`${rating}Count`]++;r.lastReviewed=iso(now);
      if(rating==="again"){r.currentEaseFactor=clamp(r.currentEaseFactor-.2,1.3,3);r.currentInterval=10/1440;p.dateMastered=null}
      if(rating==="hard"){r.currentEaseFactor=clamp(r.currentEaseFactor-.15,1.3,3);r.currentInterval=Math.max(1,previous*1.2||1)}
      if(rating==="good")r.currentInterval=previous===0?1:previous<2?3:Math.max(3,previous*r.currentEaseFactor*term.reviewWeight);
      if(rating==="easy"){r.currentEaseFactor=clamp(r.currentEaseFactor+.15,1.3,3);r.currentInterval=previous===0?4:Math.max(4,previous*r.currentEaseFactor*1.3*term.reviewWeight)}
      r.currentInterval=Math.min(r.currentInterval,this.masteryConfig.maxReviewIntervalDays);r.nextReviewDate=iso(addDays(now,r.currentInterval));this.save.player.xp+=term.xpValue;this.save.player.level=levelForXp(this.save.player.xp);this.touchActivity();this.updateMastery(id);this.unlockAchievements();this.persist();return this.learningObject(id)
    }
    updateMastery(id){
      const p=this.progressFor(id),calculated=calculateMastery(p,this.masteryConfig);
      // Migration safety: saved mastery is an earned-progress floor. A newer
      // weighting model or newly registered V3 identity may raise mastery, but
      // must never reinterpret prior achievement as a lower percentage/level
      // or erase an existing mastered date.
      const priorPercent=Number.isFinite(p.masteryPercent)?p.masteryPercent:0,priorLevel=Number.isFinite(p.masteryLevel)?p.masteryLevel:0;
      const result={...calculated,percent:Math.max(priorPercent,calculated.percent),level:Math.max(priorLevel,calculated.level)};
      p.masteryPercent=result.percent;p.masteryLevel=result.level;
      if(result.level>=4&&!p.dateMastered)p.dateMastered=iso(this.now());
      return result;
    }
    // Grants each newly earned achievement and its advertised XP exactly once.
    // A reward is claimed only when the id is neither already in `achievements`
    // nor already recorded in `achievementRewards`, so repeated calls, refreshes,
    // and reloads cannot pay twice. Achievements already held in an existing save
    // are NOT back-filled: older saves cannot show whether the XP was ever
    // granted (it was not, in the code that wrote them), so they are left alone
    // and reported by achievementStatus() as earned without a recorded reward.
    unlockAchievements(){
      const player=this.save.player;if(!Array.isArray(player.achievements))player.achievements=[];
      const conditions={
        first_application:()=>Object.values(this.save.termProgress).some(p=>p.challenge.challengesCorrect>0),
        three_day_streak:()=>sanitizeCount(player.streak)>=3,
      };
      const granted=[];
      Object.values(ACHIEVEMENTS).forEach(definition=>{
        if(player.achievements.includes(definition.id)||!conditions[definition.id]())return;
        player.achievements.push(definition.id);
        if(!isPlainObject(player.achievementRewards))player.achievementRewards={};
        if(player.achievementRewards[definition.id])return;
        player.achievementRewards[definition.id]={xp:definition.xp,claimedAt:iso(this.now())};
        player.xp=sanitizeXp(player.xp)+definition.xp;player.level=levelForXp(player.xp);
        granted.push({id:definition.id,title:definition.title,xp:definition.xp});
      });
      return granted;
    }
    // What the UI may truthfully show for one achievement: the XP it advertises
    // is only reported as awarded when a claim was actually recorded.
    achievementStatus(id){
      const definition=ACHIEVEMENTS[id];if(!definition)return null;
      const earned=this.save.player.achievements.includes(id),claim=isPlainObject(this.save.player.achievementRewards)?this.save.player.achievementRewards[id]:null;
      return {id,title:definition.title,description:definition.description,advertisedXp:definition.xp,earned,xpAwarded:claim&&Number.isFinite(claim.xp)?claim.xp:0,rewardRecorded:Boolean(claim)};
    }
    // Puzzles the player has COMPLETED on today's local calendar day, across every
    // world. Derived from the per-world puzzleHistory the game already records on
    // completion (lastPlayedAt), so it needs no new save field, survives refresh,
    // rolls over at local midnight by construction, and counts each puzzle id once
    // per day no matter how many times it is replayed.
    dailyPuzzleProgress(){
      const day=localDayKey(this.now()),completed=[],seen=new Set();
      Object.entries(this.save.worlds||{}).forEach(([worldKey,world])=>{
        const history=world&&world.puzzleHistory;if(!isPlainObject(history))return;
        Object.entries(history).forEach(([puzzleId,record])=>{
          const playedAt=record&&record.lastPlayedAt;
          if(Number.isFinite(playedAt)&&playedAt>0&&record.timesPlayed>0&&localDayKey(new Date(playedAt))===day&&!seen.has(puzzleId)){seen.add(puzzleId);completed.push(puzzleId)}
        });
      });
      return {day,count:completed.length,puzzleIds:completed};
    }
    // ---- Daily login rewards (Phase 2) ----
    // One claim per local calendar day, COINS ONLY (never XP, mastery, or any
    // other currency). Amounts come from DAILY_LOGIN_SCHEDULE; claimDailyLogin()
    // is the generic claim primitive and claimDailyReward() applies the schedule.
    // State is an additive save.engagement.dailyClaim object created on the first
    // successful claim; reading status never writes.
    //
    // CLOCK SAFEGUARDS (local only — a client-side game has no trusted time
    // source, so these reduce abuse but cannot eliminate it):
    //  1. a claim day can never be on/before the last claimed day;
    //  2. a clock earlier than evidence the game itself recorded (previous
    //     session's last save, last play, last claim, completed-puzzle times, or
    //     any time already seen this session) blocks claiming (clock-rolled-back);
    //  3. a time-zone change within 24 h of the last claim cannot open a new claim,
    //     while an ordinary DST change (same zone id) never does;
    //  4. a persisted claim in another tab/window is adopted before claiming.
    // Not preventable offline: setting the clock FORWARD (one claim per fabricated
    // day) and then relaunching. See the Phase 2 report.
    clockEvidenceMs(){
      const player=this.save.player,history=Object.values(this.save.worlds||{}).flatMap(world=>isPlainObject(world&&world.puzzleHistory)?Object.values(world.puzzleHistory):[]).map(record=>record&&record.lastPlayedAt).filter(value=>Number.isFinite(value)&&value>0);
      const claim=readDailyClaim(this.save.engagement),lastPlayed=Date.parse(player.lastPlayed);
      return Math.max(this.sessionStartEvidenceMs||0,this.clockHighMs||0,Number.isFinite(lastPlayed)?lastPlayed:0,claim.lastClaimAtMs||0,...history);
    }
    // Merge a claim that another tab/window already persisted, so two stale
    // copies of the save cannot both pay out the same day.
    adoptPersistedClaim(){
      const persisted=safeJson(this.storage.getItem(SAVE_KEY),null),theirs=readDailyClaim(persisted&&persisted.engagement),mine=readDailyClaim(this.save.engagement);
      if(theirs.lastClaimDay&&(!mine.lastClaimDay||theirs.lastClaimDay>mine.lastClaimDay)){
        this.save.engagement={...(isPlainObject(this.save.engagement)?this.save.engagement:{}),dailyClaim:persisted.engagement.dailyClaim};
        if(persisted.player&&Number.isFinite(persisted.player.coins))this.save.player.coins=sanitizeCount(persisted.player.coins);
      }
    }
    dailyClaimStatus(){
      const nowDate=this.now(),nowMs=nowDate.getTime(),day=localDayKey(nowDate),state=readDailyClaim(this.save.engagement),last=state.lastClaimDay;
      const evidence=this.clockEvidenceMs();this.clockHighMs=Math.max(this.clockHighMs||0,nowMs);
      const zone=timeZoneId(),zoneChanged=Boolean(state.lastClaimTimeZone&&zone&&state.lastClaimTimeZone!==zone);
      const elapsed=state.lastClaimAtMs===null?null:nowMs-state.lastClaimAtMs;
      let claimable=true,reason=null,nextStreak=1;
      if(last){
        let gap=dayNumber(day)-dayNumber(last);
        if(gap<=0){claimable=false;reason=gap===0?"already-claimed":"clock-behind-last-claim";nextStreak=state.claimStreak}
        else if(zoneChanged&&elapsed!==null&&elapsed>=0&&elapsed<TIMEZONE_CLAIM_COOLDOWN_MS){claimable=false;reason="recent-timezone-change";nextStreak=state.claimStreak}
        else{
          if(gap===2&&zoneChanged&&elapsed!==null&&elapsed>=0&&elapsed<TRAVEL_FORGIVENESS_MS)gap=1;
          nextStreak=gap===1?state.claimStreak+1:1;
        }
      }
      if(claimable&&nowMs<evidence-CLOCK_ROLLBACK_TOLERANCE_MS){claimable=false;reason="clock-rolled-back";nextStreak=state.claimStreak}
      return {day,claimable,reason,currentStreak:state.claimStreak,nextStreak,longestStreak:state.longestClaimStreak,lastClaimDay:last};
    }
    claimDailyLogin({coins}={}){
      if(!Number.isInteger(coins)||coins<0)throw new TypeError("claimDailyLogin requires an explicit non-negative integer coin amount chosen by the caller");
      this.adoptPersistedClaim();
      const status=this.dailyClaimStatus();
      if(!status.claimable)return {claimed:false,reason:status.reason,day:status.day,streak:status.currentStreak,coins:0};
      const state=readDailyClaim(this.save.engagement),player=this.save.player,nowMs=this.now().getTime();
      player.coins=sanitizeCount(player.coins)+coins;
      const history=[...state.history,{day:status.day,coins,streak:status.nextStreak,cycleDay:cycleDayForStreak(status.nextStreak)}].slice(-DAILY_CLAIM_HISTORY_LIMIT);
      this.save.engagement={...(isPlainObject(this.save.engagement)?this.save.engagement:{}),dailyClaim:{...(isPlainObject(this.save.engagement&&this.save.engagement.dailyClaim)?this.save.engagement.dailyClaim:{}),lastClaimDay:status.day,claimStreak:status.nextStreak,longestClaimStreak:Math.max(state.longestClaimStreak,status.nextStreak),history,lastClaimAtMs:nowMs,lastClaimTimeZone:timeZoneId()}};
      this.persist();
      return {claimed:true,reason:null,day:status.day,streak:status.nextStreak,coins};
    }
    // Everything the daily reward UI needs, read-only: today's reward, the
    // seven-day schedule with per-day state, and what comes next.
    dailyRewardStatus(){
      const status=this.dailyClaimStatus(),count=DAILY_LOGIN_SCHEDULE.length,restarted=status.claimable&&status.nextStreak===1&&Boolean(status.lastClaimDay);
      const reference=status.claimable?status.nextStreak:status.currentStreak,cycleDay=status.claimable||status.currentStreak>0?cycleDayForStreak(reference):0;
      const claimedDays=status.claimable?(cycleDay>0?cycleDay-1:0):cycleDay;
      const schedule=DAILY_LOGIN_SCHEDULE.map((coins,index)=>({day:index+1,coins,state:index<claimedDays?"claimed":(status.claimable&&index===cycleDay-1?"current":"upcoming")}));
      const upcomingStreak=status.claimable?status.nextStreak+1:status.currentStreak+1;
      return {day:status.day,claimable:status.claimable,reason:status.reason,claimedToday:status.reason==="already-claimed",restarted,streak:status.currentStreak,cycleDay,cycleLength:count,coins:status.claimable?dailyRewardForStreak(status.nextStreak):0,nextCycleDay:cycleDayForStreak(upcomingStreak),nextCoins:dailyRewardForStreak(upcomingStreak),schedule};
    }
    claimDailyReward(){
      const status=this.dailyRewardStatus();
      if(!status.claimable)return {claimed:false,reason:status.reason,coins:0,cycleDay:status.cycleDay,streak:status.streak};
      const result=this.claimDailyLogin({coins:status.coins});
      return {...result,cycleDay:status.cycleDay,restarted:status.restarted};
    }
    due(world,limit=20){const now=this.now().getTime();return this.repository.idsForWorld(world).filter(id=>{const date=this.save.termProgress[id]?.review.nextReviewDate;return date&&new Date(date).getTime()<=now}).sort((a,b)=>new Date(this.save.termProgress[a].review.nextReviewDate)-new Date(this.save.termProgress[b].review.nextReviewDate)).slice(0,limit).map(id=>this.learningObject(id))}
    worldStats(world){const ids=this.repository.idsForWorld(world),records=ids.map(id=>this.save.termProgress[id]).filter(Boolean),learned=records.filter(p=>p.dateUnlocked).length,totalChallengeCorrect=records.reduce((n,p)=>n+p.challenge.challengesCorrect,0),totalChallengeIncorrect=records.reduce((n,p)=>n+p.challenge.challengesIncorrect,0),intervals=records.map(p=>p.review.currentInterval).filter(Boolean),masteryTotal=records.reduce((n,p)=>n+p.masteryPercent,0);return {world,totalTerms:ids.length,completionPercent:ids.length?Math.round(learned/ids.length*100):0,masteryPercent:ids.length?Math.round(masteryTotal/ids.length):0,wordsLearned:learned,wordsRemaining:Math.max(0,ids.length-learned),averageAccuracy:accuracy(totalChallengeCorrect,totalChallengeIncorrect),averageReviewInterval:intervals.length?Number((intervals.reduce((a,b)=>a+b,0)/intervals.length).toFixed(1)):0,reviewsDue:this.due(world,50000).length}}
    termMetrics(id){const p=this.progressFor(id);return {puzzle:{...p.puzzle,solveAccuracy:accuracy(p.puzzle.validAttempts,p.puzzle.invalidAttempts),averageSolveSpeedMs:p.puzzle.timesSolved?Math.round(p.puzzle.totalSolveTimeMs/p.puzzle.timesSolved):0},challenge:{...p.challenge,challengeAccuracy:accuracy(p.challenge.challengesCorrect,p.challenge.challengesIncorrect)},review:{...p.review},mastery:calculateMastery(p,this.masteryConfig)}}
    workbookProgress(worldId,workbookId){const worlds=this.save.worlds;if(!worlds[worldId])worlds[worldId]={workbooks:{}};if(!worlds[worldId].workbooks)worlds[worldId].workbooks={};if(!worlds[worldId].workbooks[workbookId])worlds[worldId].workbooks[workbookId]={status:"available",attempts:0,bestScorePercent:0,dateCompleted:null,xpAwarded:0,practiceCompleted:false};return worlds[worldId].workbooks[workbookId]}
    recordWorkbookPractice(worldId,workbookId){const p=this.workbookProgress(worldId,workbookId);p.practiceCompleted=true;this.touchActivity();this.persist();return p}
    recordWorkbookAttempt(worldId,workbookId,{percent,passed,xpValue}){const p=this.workbookProgress(worldId,workbookId);p.attempts++;p.bestScorePercent=Math.max(p.bestScorePercent,percent);let xpGained=0;if(passed&&p.status!=="completed"){p.status="completed";p.dateCompleted=iso(this.now());xpGained=xpValue;p.xpAwarded=xpValue;this.save.player.xp+=xpValue;this.save.player.level=levelForXp(this.save.player.xp);this.unlockAchievements()}this.touchActivity();this.persist();return {progress:{...p},xpGained}}
    workbookWorldStats(worldId,workbookIds){const worlds=this.save.worlds[worldId]||{workbooks:{}};const records=workbookIds.map(id=>worlds.workbooks?.[id]).filter(Boolean);const completed=records.filter(r=>r.status==="completed").length;const xpEarned=records.reduce((sum,r)=>sum+(r.xpAwarded||0),0);return {worldId,totalWorkbooks:workbookIds.length,completed,completionPercent:workbookIds.length?Math.round(completed/workbookIds.length*100):0,xpEarned}}
  }
  return {LearningEngine,LearningRepository,CURRENT_SAVE_VERSION,SAVE_KEY,DEFAULT_MASTERY_CONFIG,DEFAULT_ECONOMY_CONFIG,buildEconomyConfig,XP_PER_LEVEL,levelForXp,xpIntoLevel,ACHIEVEMENTS,DAILY_LOGIN_SCHEDULE,localDayKey,calculateMastery,calculateStreak,createSave,emptyProgress,normalizeSave};
});

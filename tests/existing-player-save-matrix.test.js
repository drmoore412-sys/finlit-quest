// Release check: synthetic existing-player saves from every era must load, play,
// and claim the daily reward without losing or changing anything they already
// had. No real player save is read or written.
const test=require("node:test");
const assert=require("node:assert/strict");
const L=require("../learning-engine.js");

const PACIFIC="America/Los_Angeles";
function withTz(tz,fn){const previous=process.env.TZ;process.env.TZ=tz;try{return fn()}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}}
function store(seed){const data={...seed};return {getItem:key=>(key in data?data[key]:null),setItem:(key,value)=>{data[key]=String(value)},removeItem:key=>{delete data[key]},dump:()=>data}}
const TERM={id:"credit.credit",world:"credit",category:"c",difficulty:"d",word:"CREDIT",normalizedWord:"credit",definition:"d",pronunciation:"",realLifeExample:"",didYouKnow:"",commonMistake:"",relatedTermIds:[],quickChallenge:{prompt:"",options:["a"],correctIndex:0,explanation:""},xpValue:10,reviewWeight:1};
const NOW=new Date("2026-10-17T10:00:00-07:00");
const progress=(extra={})=>({masteryLevel:2,masteryPercent:62,dateUnlocked:"2026-09-01T00:00:00.000Z",dateMastered:null,puzzle:{timesSeen:3,timesSolved:2},challenge:{challengesSeen:2,challengesCorrect:2},review:{currentInterval:4},...extra});

// Each profile: [name, raw localStorage entries, optional expectations]
const PROFILES=[
  ["V1-era Crypto-only player (legacy keys, no save object)",{yw_review:JSON.stringify({TOKEN:2,CHAIN:1}),yw_yield:"340"},{coins:L.DEFAULT_ECONOMY_CONFIG.startingCoins,xp:340}],
  ["early saveVersion 3 player with only a player block",{[L.SAVE_KEY]:JSON.stringify({saveVersion:3,player:{xp:120,level:1,coins:410,streak:2,lastPlayed:"2026-10-16T18:00:00.000Z",activityDates:["2026-10-15","2026-10-16"],achievements:[]}})},{coins:410,xp:120}],
  ["multi-world V1 player with histories and mastery",{[L.SAVE_KEY]:JSON.stringify({saveVersion:3,player:{xp:900,level:4,coins:1234,streak:9,lastPlayed:"2026-10-16T20:00:00.000Z",activityDates:["2026-10-08","2026-10-09","2026-10-10","2026-10-11","2026-10-12","2026-10-13","2026-10-14","2026-10-15","2026-10-16"],weeklyGoal:6,achievements:["first_application","three_day_streak"]},
    termProgress:{"credit.credit":progress()},worlds:{"wg-credit":{solvedWords:["TERM","RISK"],rewardedFinancialTermIds:["credit.term"],puzzleHistory:{"LEGACY:CREDIT":{timesPlayed:3,lastPlayedAt:1760000000000}},puzzleBank:[{id:"LEGACY:CREDIT",words:["TERM"],letters:["T","E","R","M"]}],lastPlaythrough:["LEGACY:CREDIT"]},"wg-crypto":{solvedWords:["TOKEN"]},"wg-moneybasics":{solvedWords:["CASH"],puzzleHistory:{"MB-V2-C01":{timesPlayed:1,lastPlayedAt:11}}},"wg-banking":{solvedWords:[]},"wg-investing":{solvedWords:["ASSET"]}},settings:{theme:"dark",reducedMotion:true,skipLessons:true}})},{coins:1234,xp:900}],
  ["V3-era player (FQ-V3 puzzle history, rewarded term ids)",{[L.SAVE_KEY]:JSON.stringify({saveVersion:3,player:{xp:625,level:3,coins:777,streak:4,lastPlayed:"2026-10-10T00:00:00.000Z",activityDates:["2026-10-10"],weeklyGoal:6,achievements:["first_application"],futurePlayerFlag:"keep"},termProgress:{"credit.credit":progress({masteryLevel:3,masteryPercent:80})},worlds:{"wg-credit":{solvedWords:["TERM"],rewardedSupportWords:["REST"],rewardedOrdinaryWords:["REST"],rewardedFinancialTermIds:["credit.term"],puzzleHistory:{"FQ-V3:credit:TERMS:R1":{timesPlayed:1,lastPlayedAt:9}}}}})},{coins:777,xp:625}],
  ["Phase 1-era player (achievement rewards recorded, old-style claim record)",{[L.SAVE_KEY]:JSON.stringify({saveVersion:3,player:{xp:300,level:2,coins:500,streak:3,lastPlayed:"2026-10-16T17:00:00.000Z",activityDates:["2026-10-14","2026-10-15","2026-10-16"],achievements:["three_day_streak"],achievementRewards:{three_day_streak:{xp:50,claimedAt:"2026-10-14T00:00:00.000Z"}}},engagement:{dailyClaim:{lastClaimDay:"2026-10-16",claimStreak:6,longestClaimStreak:6,history:[]},futureKey:1}})},{coins:500,xp:300}],
  ["player who already claimed today",{[L.SAVE_KEY]:JSON.stringify({saveVersion:3,player:{xp:50,level:1,coins:60,streak:1,lastPlayed:"2026-10-17T16:00:00.000Z",activityDates:["2026-10-17"],achievements:[]},engagement:{dailyClaim:{lastClaimDay:"2026-10-17",claimStreak:2,longestClaimStreak:2,history:[{day:"2026-10-17",coins:15,streak:2}],lastClaimAtMs:Date.parse("2026-10-17T16:00:00.000Z"),lastClaimTimeZone:"America/Los_Angeles"}}})},{coins:60,xp:50,claimBlocked:true}],
  ["very large save (400 activity dates, 60 history entries)",{[L.SAVE_KEY]:JSON.stringify({saveVersion:3,player:{xp:99999,level:400,coins:88888,streak:400,lastPlayed:"2026-10-16T18:00:00.000Z",activityDates:Array.from({length:400},(_,i)=>new Date(Date.UTC(2025,8,1+i)).toISOString().slice(0,10)),achievements:["first_application","three_day_streak"]},engagement:{dailyClaim:{lastClaimDay:"2026-10-16",claimStreak:60,longestClaimStreak:60,history:Array.from({length:60},(_,i)=>({day:`2026-08-${String(1+(i%28)).padStart(2,"0")}`,coins:10,streak:i+1}))}}})},{coins:88888,xp:99999}],
  ["lightly corrupted save (wrong types in several fields)",{[L.SAVE_KEY]:JSON.stringify({saveVersion:3,player:{xp:"x",coins:-5,streak:"y",activityDates:"oops",achievements:"oops",achievementRewards:"oops"},termProgress:{},worlds:{"wg-credit":{puzzleHistory:"corrupt"},"wg-x":null},engagement:"bad"})},{coins:0,xp:0}],
];

PROFILES.forEach(([name,seed,expect])=>{
  test(`existing player: ${name}`,()=>{
    withTz(PACIFIC,()=>{
      const storage=store(seed);let clock=new Date(NOW);
      let engine;
      assert.doesNotThrow(()=>{engine=new L.LearningEngine({terms:[TERM],storage,now:()=>clock})},"loads");
      const before={coins:engine.save.player.coins,xp:engine.save.player.xp,terms:JSON.stringify(engine.save.termProgress),worlds:JSON.stringify(engine.save.worlds),settings:JSON.stringify(engine.save.settings)};
      assert.equal(before.coins,expect.coins);assert.equal(before.xp,expect.xp);
      // Exercise every code path this release added.
      let result;
      assert.doesNotThrow(()=>{engine.dailyRewardStatus();result=engine.claimDailyReward();engine.touchActivity();engine.unlockAchievements();engine.dailyPuzzleProgress();engine.persist()});
      if(expect.claimBlocked)assert.equal(result.claimed,false);else assert.equal(result.claimed,true);
      const paid=result.claimed?result.coins:0;
      assert.equal(engine.save.player.coins,before.coins+paid,"coins change only by the claim");
      assert.ok(engine.save.player.xp>=before.xp,"XP never decreases (only achievement XP can add)");
      assert.equal(JSON.stringify(engine.save.termProgress),before.terms,"mastery untouched");
      assert.equal(JSON.stringify(engine.save.worlds),before.worlds,"world progress and puzzle histories untouched");
      assert.equal(JSON.stringify(engine.save.settings),before.settings,"settings untouched");
      // A restart reads the same state back.
      const reloaded=new L.LearningEngine({terms:[TERM],storage,now:()=>clock});
      assert.equal(reloaded.save.player.coins,engine.save.player.coins);
      assert.equal(reloaded.dailyRewardStatus().claimable,false,"claimed state survives the restart");
    });
  });
});

test("unknown fields at every level survive across all profiles that carry them",()=>{
  withTz(PACIFIC,()=>{
    const raw={saveVersion:3,futureTop:{a:1},player:{xp:10,coins:20,futurePlayerFlag:"keep"},worlds:{"wg-future":{anything:[1,2,3]}},engagement:{futureKey:true,dailyClaim:{unknownClaimField:"x"}},settings:{futureSetting:1}};
    const storage=store({[L.SAVE_KEY]:JSON.stringify(raw)}),engine=new L.LearningEngine({terms:[TERM],storage,now:()=>NOW});
    engine.claimDailyReward();engine.touchActivity();
    const out=JSON.parse(storage.getItem(L.SAVE_KEY));
    assert.deepEqual(out.futureTop,{a:1});assert.equal(out.player.futurePlayerFlag,"keep");assert.deepEqual(out.worlds["wg-future"],{anything:[1,2,3]});
    assert.equal(out.engagement.futureKey,true);assert.equal(out.engagement.dailyClaim.unknownClaimField,"x");assert.equal(out.settings.futureSetting,1);
  });
});

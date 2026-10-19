// Phase 1 reward/streak repair + daily-claim foundation tests.
// All saves here are synthetic in-memory objects: no real player save is read or written.
const test=require("node:test");
const assert=require("node:assert/strict");
const L=require("../learning-engine.js");

const PACIFIC="America/Los_Angeles";
function withTz(tz,fn){const previous=process.env.TZ;process.env.TZ=tz;try{return fn()}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}}
function memoryStorage(seed={}){const data={...seed};return {getItem:key=>(key in data?data[key]:null),setItem:(key,value)=>{data[key]=String(value);this.writes=(this.writes||0)+1},removeItem:key=>{delete data[key]},dump:()=>({...data}),writes:0}}
const TERM={id:"credit.credit",world:"credit",category:"c",difficulty:"d",word:"CREDIT",normalizedWord:"credit",definition:"d",pronunciation:"",realLifeExample:"",didYouKnow:"",commonMistake:"",relatedTermIds:[],quickChallenge:{prompt:"",options:["a"],correctIndex:0,explanation:""},xpValue:10,reviewWeight:1};
function makeEngine({at,raw,storage}={}){
  const store=storage||memoryStorage(raw?{[L.SAVE_KEY]:JSON.stringify(raw)}:{});
  let clock=new Date(at||"2026-10-17T10:00:00-07:00");
  const engine=new L.LearningEngine({terms:[TERM],storage:store,now:()=>clock});
  engine.setNow=value=>{clock=new Date(value)};engine.store=store;return engine;
}
const snapshot=value=>JSON.stringify(value);

// ---------- 1-3. Achievement XP ----------
test("achievement XP is awarded exactly as advertised and the level follows",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine();
    engine.recordChallenge(TERM.id,{correct:true});
    assert.deepEqual(engine.save.player.achievements,["first_application"]);
    assert.equal(engine.save.player.xp,L.ACHIEVEMENTS.first_application.xp);
    assert.equal(L.ACHIEVEMENTS.first_application.xp,25);
    assert.equal(L.ACHIEVEMENTS.three_day_streak.xp,50);
    const p=engine.save.player;p.xp=240;p.level=L.levelForXp(240); // 240 + 25 crosses the 250 boundary
    const fresh=makeEngine();fresh.save.player.xp=240;fresh.save.player.level=1;
    fresh.recordChallenge(TERM.id,{correct:true});
    assert.equal(fresh.save.player.xp,265);assert.equal(fresh.save.player.level,2);
  });
});

test("three_day_streak grants +50 XP from ordinary gameplay activity, not only reviews",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-15T10:00:00-07:00"});
    engine.touchActivity();engine.setNow("2026-10-16T10:00:00-07:00");engine.touchActivity();
    assert.deepEqual(engine.save.player.achievements,[]);
    engine.setNow("2026-10-17T10:00:00-07:00");const granted=engine.touchActivity();
    assert.equal(engine.save.player.streak,3);
    assert.deepEqual(granted.map(g=>[g.id,g.xp]),[["three_day_streak",50]]);
    assert.equal(engine.save.player.xp,50);
    assert.equal(engine.achievementStatus("three_day_streak").xpAwarded,50);
  });
});

test("achievement rewards are granted only once across repeats, reviews, and reloads",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine();
    engine.recordChallenge(TERM.id,{correct:true});
    const afterFirst=engine.save.player.xp;
    engine.recordChallenge(TERM.id,{correct:true});engine.unlockAchievements();engine.unlockAchievements();engine.touchActivity();
    assert.equal(engine.save.player.xp,afterFirst);
    assert.deepEqual(engine.save.player.achievements,["first_application"]);
    const reloaded=makeEngine({storage:engine.store});
    reloaded.unlockAchievements();reloaded.recordChallenge(TERM.id,{correct:true});
    assert.equal(reloaded.save.player.xp,afterFirst);
    assert.equal(Object.keys(reloaded.save.player.achievementRewards).length,1);
    // Even if the achievements array were lost, the recorded claim blocks a second payout.
    reloaded.save.player.achievements=[];reloaded.unlockAchievements();
    assert.equal(reloaded.save.player.xp,afterFirst);
  });
});

test("achievements already held in an existing save keep every balance and are not back-filled",()=>{
  withTz(PACIFIC,()=>{
    const raw={saveVersion:3,player:{xp:625,level:3,coins:777,streak:4,lastPlayed:"2026-10-16T18:00:00.000Z",activityDates:["2026-10-15","2026-10-16"],weeklyGoal:6,achievements:["first_application"]},termProgress:{},worlds:{}};
    const engine=makeEngine({raw,at:"2026-10-17T10:00:00-07:00"});
    engine.recordChallenge(TERM.id,{correct:true});engine.unlockAchievements();
    assert.equal(engine.save.player.coins,777);
    // Stored streak 4 continues to 5 on the next local day, which newly earns three_day_streak (+50 XP).
    // first_application was already held, so it is not paid again.
    assert.equal(engine.save.player.xp,625+50);
    assert.deepEqual(engine.save.player.achievements,["first_application","three_day_streak"]);
    const status=engine.achievementStatus("first_application");
    assert.equal(status.earned,true);assert.equal(status.rewardRecorded,false);assert.equal(status.xpAwarded,0);
    assert.equal(engine.save.player.achievementRewards?.first_application,undefined,"no retroactive claim recorded");
  });
});

test("the displayed reward is the awarded reward (UI reads achievementStatus)",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine();
    assert.equal(engine.achievementStatus("first_application").rewardRecorded,false);
    engine.recordChallenge(TERM.id,{correct:true});
    const status=engine.achievementStatus("first_application");
    assert.deepEqual([status.advertisedXp,status.xpAwarded,status.rewardRecorded],[25,25,true]);
    assert.equal(engine.achievementStatus("nope"),null);
  });
});

// ---------- 4-5. Daily progress ----------
const history=(entries)=>Object.fromEntries(entries.map(([id,ms,played=1])=>[id,{timesPlayed:played,lastPlayedAt:ms}]));
test("daily progress counts puzzles completed today across worlds and ignores other days",()=>{
  withTz(PACIFIC,()=>{
    const today=new Date("2026-10-17T12:00:00-07:00").getTime(),yesterday=new Date("2026-10-16T12:00:00-07:00").getTime();
    const raw={saveVersion:3,player:{},worlds:{
      "wg-moneybasics":{puzzleHistory:history([["MB-1",today],["MB-2",today],["MB-OLD",yesterday]])},
      "wg-credit":{puzzleHistory:history([["FQ-V3:credit:TERMS:R1",today],["LEGACY:CREDIT",5]])},
    }};
    const engine=makeEngine({raw,at:"2026-10-17T20:00:00-07:00"});
    const progress=engine.dailyPuzzleProgress();
    assert.equal(progress.count,3);assert.equal(progress.day,"2026-10-17");
    assert.ok(!progress.puzzleIds.some(id=>id.includes("OLD")||id.includes("LEGACY")));
  });
});

test("daily progress never double-counts: replays, zero plays, malformed records, and the same id in one world",()=>{
  withTz(PACIFIC,()=>{
    const t=new Date("2026-10-17T09:00:00-07:00").getTime();
    const raw={saveVersion:3,player:{},worlds:{"wg-crypto":{puzzleHistory:{A:{timesPlayed:7,lastPlayedAt:t},B:{timesPlayed:0,lastPlayedAt:t},C:null,D:{timesPlayed:1,lastPlayedAt:"x"},E:{timesPlayed:1,lastPlayedAt:-4}}},"wg-banking":{puzzleHistory:"corrupt"},"wg-x":null}};
    const engine=makeEngine({raw,at:"2026-10-17T18:00:00-07:00"});
    assert.equal(engine.dailyPuzzleProgress().count,1);
    assert.equal(engine.dailyPuzzleProgress().count,1,"calling twice does not change the result");
    // The same canonical puzzle id in two curricula is one daily completion.
    raw.worlds["wg-banking"]={puzzleHistory:{A:{timesPlayed:1,lastPlayedAt:t}}};
    assert.equal(makeEngine({raw,at:"2026-10-17T18:00:00-07:00"}).dailyPuzzleProgress().count,1);
  });
});

// ---------- 6. Local calendar-day boundaries ----------
test("a 9 pm Pacific play is filed under the Pacific day, not the next UTC day",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-17T21:00:00-07:00"});engine.touchActivity();
    assert.deepEqual(engine.save.player.activityDates,["2026-10-17"]);
    assert.equal(L.localDayKey(new Date("2026-10-18T06:59:00Z")),"2026-10-17");
    assert.equal(L.localDayKey(new Date("2026-10-18T07:00:00Z")),"2026-10-18"); // exactly local midnight (PDT = UTC-7)
  });
});

test("two plays on two different Pacific days (same UTC day) count as a 2-day streak",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-17T18:00:00-07:00"});engine.touchActivity();
    engine.setNow("2026-10-18T09:00:00-07:00");engine.touchActivity();
    assert.deepEqual(engine.save.player.activityDates,["2026-10-17","2026-10-18"]);
    assert.equal(engine.save.player.streak,2);
  });
});

test("daily progress rolls over at local midnight, not UTC midnight",()=>{
  withTz(PACIFIC,()=>{
    const lateEvening=new Date("2026-10-17T23:30:00-07:00").getTime(); // = 06:30 UTC on Oct 18
    const raw={saveVersion:3,player:{},worlds:{"wg-credit":{puzzleHistory:history([["P1",lateEvening]])}}};
    assert.equal(makeEngine({raw,at:"2026-10-17T23:45:00-07:00"}).dailyPuzzleProgress().count,1,"still the same local day at 11:45 pm");
    assert.equal(makeEngine({raw,at:"2026-10-18T00:05:00-07:00"}).dailyPuzzleProgress().count,0,"new local day at 12:05 am");
  });
});

test("zones ahead of UTC also use their own calendar day",()=>{
  withTz("Pacific/Auckland",()=>{
    const engine=makeEngine({at:"2026-10-18T00:30:00+13:00"});engine.touchActivity(); // = 11:30 UTC on Oct 17
    assert.deepEqual(engine.save.player.activityDates,["2026-10-18"]);
    engine.setNow("2026-10-19T00:10:00+13:00");engine.touchActivity();
    assert.equal(engine.save.player.streak,2);
  });
});

// ---------- 7-8. Streak progression ----------
test("consecutive local days extend the streak; the same day never counts twice and writes nothing",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-17T08:00:00-07:00"});engine.touchActivity();
    const before=snapshot(engine.save);
    engine.setNow("2026-10-17T22:00:00-07:00");const granted=engine.touchActivity();
    assert.deepEqual(granted,[]);assert.equal(snapshot(engine.save),before,"same-day activity does not mutate the save");
    engine.setNow("2026-10-18T08:00:00-07:00");engine.touchActivity();
    engine.setNow("2026-10-19T08:00:00-07:00");engine.touchActivity();
    assert.equal(engine.save.player.streak,3);
    assert.equal(engine.save.player.activityDates.length,3);
  });
});

test("a missed local day restarts the streak at 1; a stored streak continues on the next day",()=>{
  withTz(PACIFIC,()=>{
    const missed=makeEngine({at:"2026-10-17T10:00:00-07:00"});missed.touchActivity();
    missed.setNow("2026-10-19T10:00:00-07:00");missed.touchActivity();
    assert.equal(missed.save.player.streak,1);
    const raw={saveVersion:3,player:{streak:7,lastPlayed:"2026-10-17T19:00:00.000Z",activityDates:["2026-10-17"],achievements:["three_day_streak"],xp:100},termProgress:{},worlds:{}};
    const continuing=makeEngine({raw,at:"2026-10-18T09:00:00-07:00"});continuing.touchActivity();
    assert.equal(continuing.save.player.streak,8,"an earned streak is carried forward, not recomputed from date keys");
    assert.equal(continuing.save.player.xp,100);
  });
});

test("an old save keyed by UTC dates keeps its streak when play continues on the next local day",()=>{
  withTz(PACIFIC,()=>{
    // Written by the old code: evening play on Pacific Oct 17 was stored under UTC key 2026-10-18.
    const raw={saveVersion:3,player:{streak:5,lastPlayed:"2026-10-18T03:00:00.000Z",activityDates:["2026-10-14","2026-10-15","2026-10-16","2026-10-17","2026-10-18"],achievements:["three_day_streak"]},termProgress:{},worlds:{}};
    const engine=makeEngine({raw,at:"2026-10-18T08:00:00-07:00"}); // next Pacific day
    engine.touchActivity();
    assert.equal(engine.save.player.streak,6,"streak is never reduced by the day-key change");
  });
});

test("clock or time-zone moves backwards do not reduce or double-count the streak",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-17T10:00:00-07:00"});engine.touchActivity();
    engine.setNow("2026-10-18T10:00:00-07:00");engine.touchActivity();
    const before=snapshot(engine.save.player);
    engine.setNow("2026-10-17T09:00:00-07:00");engine.touchActivity();
    assert.equal(snapshot(engine.save.player),before);
  });
});

// ---------- 9. Daylight saving ----------
test("streaks stay consecutive across the spring-forward day (2026-03-08, Pacific)",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-03-07T23:30:00-08:00"});engine.touchActivity();
    engine.setNow("2026-03-08T12:30:00-07:00");engine.touchActivity();
    engine.setNow("2026-03-09T00:10:00-07:00");engine.touchActivity();
    assert.deepEqual(engine.save.player.activityDates,["2026-03-07","2026-03-08","2026-03-09"]);
    assert.equal(engine.save.player.streak,3);
    assert.equal(L.calculateStreak(engine.save.player.activityDates,new Date("2026-03-09T20:00:00-07:00")),3);
  });
});

test("streaks stay consecutive across the fall-back 25-hour day (2026-11-01, Pacific)",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-31T22:00:00-07:00"});engine.touchActivity();
    engine.setNow("2026-11-01T22:00:00-08:00");engine.touchActivity(); // DST ended at 02:00 that day, so the evening offset is -08:00
    engine.setNow("2026-11-02T00:30:00-08:00");engine.touchActivity();
    assert.equal(engine.save.player.streak,3);
    assert.equal(L.localDayKey(new Date("2026-11-01T08:30:00Z")),"2026-11-01"); // 00:30 PDT, first pass of the repeated hour
    assert.equal(L.localDayKey(new Date("2026-11-01T09:30:00Z")),"2026-11-01"); // 01:30 PST, second pass: same calendar day
  });
});

test("daily puzzle progress is correct on a DST day",()=>{
  withTz(PACIFIC,()=>{
    const springPlay=new Date("2026-03-08T03:30:00-07:00").getTime();
    const raw={saveVersion:3,player:{},worlds:{"wg-money":{puzzleHistory:history([["A",springPlay]])}}};
    assert.equal(makeEngine({raw,at:"2026-03-08T23:59:00-07:00"}).dailyPuzzleProgress().count,1);
    assert.equal(makeEngine({raw,at:"2026-03-09T00:00:00-07:00"}).dailyPuzzleProgress().count,0);
  });
});

// ---------- 10. Refresh / persistence ----------
test("streak, achievements, daily progress, and claims survive a page refresh (reload from storage)",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-15T10:00:00-07:00"});engine.touchActivity();
    engine.setNow("2026-10-16T10:00:00-07:00");engine.touchActivity();
    engine.setNow("2026-10-17T10:00:00-07:00");engine.touchActivity();
    engine.save.worlds["wg-credit"]={puzzleHistory:history([["P",new Date("2026-10-17T09:30:00-07:00").getTime()]])};
    engine.claimDailyLogin({coins:10});engine.persist();
    const reloaded=makeEngine({storage:engine.store,at:"2026-10-17T15:00:00-07:00"});
    assert.equal(reloaded.save.player.streak,3);
    assert.deepEqual(reloaded.save.player.achievements,["three_day_streak"]);
    assert.equal(reloaded.save.player.achievementRewards.three_day_streak.xp,50);
    assert.equal(reloaded.dailyPuzzleProgress().count,1);
    assert.equal(reloaded.dailyClaimStatus().claimable,false);
    assert.equal(reloaded.save.player.coins,L.DEFAULT_ECONOMY_CONFIG.startingCoins+10);
  });
});

// ---------- 11-12. Daily login claim foundation ----------
test("daily login claim: one claim per local day, idempotent under repeated taps and refreshes",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-17T09:00:00-07:00"});
    const start=engine.save.player.coins;
    assert.equal(engine.dailyClaimStatus().claimable,true);
    const results=[1,2,3,4,5].map(()=>engine.claimDailyLogin({coins:20}));
    assert.equal(results.filter(r=>r.claimed).length,1);
    assert.equal(results.find(r=>!r.claimed).reason,"already-claimed");
    assert.equal(engine.save.player.coins,start+20);
    assert.equal(engine.save.engagement.dailyClaim.history.length,1);
    const refreshed=makeEngine({storage:engine.store,at:"2026-10-17T23:59:00-07:00"});
    assert.equal(refreshed.claimDailyLogin({coins:20}).claimed,false,"still the same local day at 11:59 pm");
    assert.equal(refreshed.save.player.coins,start+20);
  });
});

test("daily login claim: next local day claims again with streak 2; a missed day restarts at 1",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-17T09:00:00-07:00"});
    engine.claimDailyLogin({coins:10});
    engine.setNow("2026-10-18T00:01:00-07:00");
    const status=engine.dailyClaimStatus();assert.deepEqual([status.claimable,status.nextStreak],[true,2]);
    const second=engine.claimDailyLogin({coins:10});assert.deepEqual([second.claimed,second.streak],[true,2]);
    engine.setNow("2026-10-20T09:00:00-07:00");
    assert.equal(engine.dailyClaimStatus().nextStreak,1);
    const third=engine.claimDailyLogin({coins:10});assert.equal(third.streak,1);
    assert.equal(engine.save.engagement.dailyClaim.longestClaimStreak,2);
  });
});

test("daily login claim: reading status never writes, and a clock set behind the last claim is refused",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-17T09:00:00-07:00"});
    const before=snapshot(engine.save);const writes=engine.store.writes;
    engine.dailyClaimStatus();engine.dailyClaimStatus();
    assert.equal(snapshot(engine.save),before);assert.equal(engine.store.writes,writes);
    engine.claimDailyLogin({coins:5});
    engine.setNow("2026-10-10T09:00:00-07:00");
    const status=engine.dailyClaimStatus();assert.deepEqual([status.claimable,status.reason],[false,"clock-behind-last-claim"]);
    assert.equal(engine.claimDailyLogin({coins:5}).claimed,false);
  });
});

test("daily login claim awards coins only: XP, level, streak, and achievements are untouched",()=>{
  withTz(PACIFIC,()=>{
    const raw={saveVersion:3,player:{xp:240,level:1,coins:50,streak:2,lastPlayed:"2026-10-16T17:00:00.000Z",activityDates:["2026-10-15","2026-10-16"],achievements:[]},termProgress:{},worlds:{}};
    const engine=makeEngine({raw,at:"2026-10-17T09:00:00-07:00"});
    const before={xp:engine.save.player.xp,level:engine.save.player.level,streak:engine.save.player.streak,achievements:[...engine.save.player.achievements],dates:[...engine.save.player.activityDates]};
    const result=engine.claimDailyLogin({coins:100});
    assert.equal(result.claimed,true);assert.equal(engine.save.player.coins,150);
    assert.equal(engine.save.player.xp,before.xp);assert.equal(engine.save.player.level,before.level);
    assert.equal(engine.save.player.streak,before.streak);assert.deepEqual(engine.save.player.achievements,before.achievements);
    assert.deepEqual(engine.save.player.activityDates,before.dates);
    assert.equal(engine.save.player.achievementRewards,undefined);
  });
});

test("daily login claim never invents a coin amount",()=>{
  const engine=makeEngine();
  [undefined,{},{coins:-1},{coins:1.5},{coins:"10"},{coins:NaN}].forEach(arg=>assert.throws(()=>engine.claimDailyLogin(arg),TypeError));
  assert.equal(engine.save.engagement,undefined);
  assert.equal(engine.claimDailyLogin({coins:0}).claimed,true,"a zero-coin claim (streak bookkeeping only) is allowed because the caller chose it");
});

// ---------- 13. V1 / V3 saved-progress compatibility ----------
test("legacy V1 and V3 saves load unchanged and survive the new logic with every number intact",()=>{
  withTz(PACIFIC,()=>{
    const raw={saveVersion:3,
      player:{xp:625,level:3,coins:777,streak:4,lastPlayed:"2026-10-10T00:00:00.000Z",activityDates:["2026-10-10"],weeklyGoal:6,achievements:["first_application"]},
      termProgress:{"credit.credit":{masteryLevel:2,masteryPercent:60,dateUnlocked:"2026-10-01T00:00:00.000Z",puzzle:{timesSolved:2}}},
      worlds:{
        "wg-credit":{solvedWords:["TERM"],rewardedFinancialTermIds:["credit.term"],puzzleHistory:{"LEGACY:CREDIT":{timesPlayed:2,lastPlayedAt:5},"FQ-V3:credit:TERMS:R1":{timesPlayed:1,lastPlayedAt:9}},puzzleBank:[{id:"LEGACY:CREDIT",words:["TERM"],letters:["T","E","R","M"]}],lastPlaythrough:["LEGACY:CREDIT"]},
        "wg-crypto":{solvedWords:["TOKEN"],puzzleHistory:{"CRYPTO-OLD":{timesPlayed:1,lastPlayedAt:7}}},
        "wg-moneybasics":{solvedWords:["CASH"],puzzleHistory:{"MB-V2-C01":{timesPlayed:1,lastPlayedAt:11}}},
      },
      settings:{theme:"dark",reducedMotion:true,skipLessons:true}};
    const engine=makeEngine({raw,at:"2026-10-17T09:00:00-07:00"});
    const worldsBefore=snapshot(engine.save.worlds),termsBefore=snapshot(engine.save.termProgress),settingsBefore=snapshot(engine.save.settings);
    const xpBefore=engine.save.player.xp,coinsBefore=engine.save.player.coins;
    engine.touchActivity();engine.unlockAchievements();engine.dailyPuzzleProgress();engine.dailyClaimStatus();engine.persist();
    assert.equal(snapshot(engine.save.worlds),worldsBefore);
    assert.equal(snapshot(engine.save.termProgress),termsBefore);
    assert.equal(snapshot(engine.save.settings),settingsBefore);
    assert.equal(engine.save.player.coins,coinsBefore);
    assert.equal(engine.save.player.level,3);
    assert.equal(engine.save.player.weeklyGoal,6);
    assert.ok(engine.save.player.xp>=xpBefore,"XP never decreases");
    assert.equal(engine.dailyPuzzleProgress().count,0,"1970-era lastPlayedAt values are not today");
    assert.equal(engine.save.player.streak,1,"a 7-day gap restarts the streak (real gap, not a day-key artifact)");
  });
});

// ---------- 14. Unknown field preservation ----------
test("unknown save fields at every level survive touch, unlock, claim, and reload",()=>{
  withTz(PACIFIC,()=>{
    const raw={saveVersion:3,futureTopLevel:{a:1},player:{xp:10,coins:20,futurePlayerFlag:"keep",activityDates:[]},termProgress:{},worlds:{"wg-future":{anything:[1,2,3]}},
      engagement:{futureEngagementKey:true,dailyClaim:{unknownClaimField:"x",lastClaimDay:"2026-10-16",claimStreak:4,longestClaimStreak:9,history:[]}},settings:{theme:"light",futureSetting:1}};
    const engine=makeEngine({raw,at:"2026-10-17T09:00:00-07:00"});
    engine.touchActivity();engine.recordChallenge(TERM.id,{correct:true});
    assert.equal(engine.claimDailyLogin({coins:15}).streak,5);
    const reloaded=makeEngine({storage:engine.store,at:"2026-10-17T12:00:00-07:00"});
    assert.deepEqual(reloaded.save.futureTopLevel,{a:1});
    assert.equal(reloaded.save.player.futurePlayerFlag,"keep");
    assert.deepEqual(reloaded.save.worlds["wg-future"],{anything:[1,2,3]});
    assert.equal(reloaded.save.engagement.futureEngagementKey,true);
    assert.equal(reloaded.save.engagement.dailyClaim.unknownClaimField,"x");
    assert.equal(reloaded.save.engagement.dailyClaim.longestClaimStreak,9);
    assert.equal(reloaded.save.settings.futureSetting,1);
  });
});

// ---------- hardening: corrupted values must not throw ----------
test("corrupted activity, achievement, reward, and claim fields are tolerated",()=>{
  withTz(PACIFIC,()=>{
    const raw={saveVersion:3,player:{activityDates:"oops",achievements:"oops",achievementRewards:"oops",lastPlayed:"not-a-date",streak:"x"},termProgress:{},worlds:{},engagement:{dailyClaim:{lastClaimDay:"garbage",claimStreak:-3,history:"x"}}};
    const engine=makeEngine({raw,at:"2026-10-17T09:00:00-07:00"});
    assert.doesNotThrow(()=>{engine.touchActivity();engine.unlockAchievements();engine.dailyPuzzleProgress()});
    assert.equal(engine.dailyClaimStatus().claimable,true);
    assert.equal(engine.claimDailyLogin({coins:1}).claimed,true);
    assert.equal(engine.save.player.streak,1);
  });
});

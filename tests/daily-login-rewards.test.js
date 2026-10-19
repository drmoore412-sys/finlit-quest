// Phase 2 daily login reward tests. Synthetic in-memory saves only.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const L=require("../learning-engine.js");
const {ROOT}=require("./helpers.js");

const PACIFIC="America/Los_Angeles";
function withTz(tz,fn){const previous=process.env.TZ;process.env.TZ=tz;try{return fn()}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}}
function memoryStorage(seed={}){const data={...seed};return {getItem:key=>(key in data?data[key]:null),setItem:(key,value)=>{data[key]=String(value);this.writes=(this.writes||0)+1},removeItem:key=>{delete data[key]},writes:0}}
const TERM={id:"credit.credit",world:"credit",category:"c",difficulty:"d",word:"CREDIT",normalizedWord:"credit",definition:"d",pronunciation:"",realLifeExample:"",didYouKnow:"",commonMistake:"",relatedTermIds:[],quickChallenge:{prompt:"",options:["a"],correctIndex:0,explanation:""},xpValue:10,reviewWeight:1};
function makeEngine({at,raw,storage}={}){
  const store=storage||memoryStorage(raw?{[L.SAVE_KEY]:JSON.stringify(raw)}:{});
  let clock=new Date(at||"2026-10-01T09:00:00-07:00");
  const engine=new L.LearningEngine({terms:[TERM],storage:store,now:()=>clock});
  engine.setNow=value=>{clock=new Date(value)};engine.store=store;return engine;
}
const snapshot=value=>JSON.stringify(value);
// Claim once per consecutive local day starting at `start`, returning coins per claim.
function claimDays(engine,start,count){
  const out=[];
  for(let i=0;i<count;i++){const day=new Date(start);day.setDate(day.getDate()+i);engine.setNow(day);out.push(engine.claimDailyReward())}
  return out;
}
const DAY1="2026-10-01T09:00:00-07:00";

// ---------- schedule ----------
test("the approved schedule is exactly 10/15/20/25/30/35/50 and is not mutable",()=>{
  assert.deepEqual([...L.DAILY_LOGIN_SCHEDULE],[10,15,20,25,30,35,50]);
  assert.ok(Object.isFrozen(L.DAILY_LOGIN_SCHEDULE));
});

test("all seven reward days pay the approved coins, in order, on consecutive local days",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:DAY1}),start=engine.save.player.coins;
    const results=claimDays(engine,DAY1,7);
    assert.deepEqual(results.map(r=>r.coins),[10,15,20,25,30,35,50]);
    assert.deepEqual(results.map(r=>r.cycleDay),[1,2,3,4,5,6,7]);
    assert.ok(results.every(r=>r.claimed));
    assert.equal(engine.save.player.coins,start+185);
  });
});

test("the cycle repeats after Day 7 (Day 8 = 10, Day 14 = 50, Day 15 = 10)",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:DAY1});
    const results=claimDays(engine,DAY1,15);
    assert.deepEqual(results.slice(7,14).map(r=>r.coins),[10,15,20,25,30,35,50]);
    assert.equal(results[14].coins,10);
    assert.equal(results[14].cycleDay,1);
    assert.equal(engine.save.engagement.dailyClaim.claimStreak,15);
    assert.equal(engine.save.engagement.dailyClaim.history.length,15);
  });
});

test("a missed eligible day restarts the cycle at Day 1, in every cycle position",()=>{
  withTz(PACIFIC,()=>{
    [1,3,6,7].forEach(claimedBefore=>{
      const engine=makeEngine({at:DAY1});
      claimDays(engine,DAY1,claimedBefore);
      const skip=new Date(DAY1);skip.setDate(skip.getDate()+claimedBefore+1); // one full local day skipped
      engine.setNow(skip);
      const status=engine.dailyRewardStatus();
      assert.deepEqual([status.claimable,status.cycleDay,status.coins,status.restarted],[true,1,10,true],`after ${claimedBefore} claims`);
      const result=engine.claimDailyReward();
      assert.deepEqual([result.claimed,result.coins,result.cycleDay,result.restarted],[true,10,1,true]);
    });
  });
});

test("status exposes the seven-day schedule with claimed / current / upcoming states",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:DAY1});
    let status=engine.dailyRewardStatus();
    assert.deepEqual(status.schedule.map(d=>d.state),["current","upcoming","upcoming","upcoming","upcoming","upcoming","upcoming"]);
    assert.deepEqual(status.schedule.map(d=>d.coins),[10,15,20,25,30,35,50]);
    claimDays(engine,DAY1,3);                                   // claimed Days 1-3, today is claimed
    status=engine.dailyRewardStatus();
    assert.deepEqual([status.claimable,status.claimedToday,status.cycleDay,status.nextCycleDay,status.nextCoins],[false,true,3,4,25]);
    assert.deepEqual(status.schedule.map(d=>d.state),["claimed","claimed","claimed","upcoming","upcoming","upcoming","upcoming"]);
    const tomorrow=new Date(DAY1);tomorrow.setDate(tomorrow.getDate()+3);engine.setNow(tomorrow);
    status=engine.dailyRewardStatus();
    assert.deepEqual([status.claimable,status.cycleDay,status.coins],[true,4,25]);
    assert.deepEqual(status.schedule.map(d=>d.state),["claimed","claimed","claimed","current","upcoming","upcoming","upcoming"]);
    // After Day 7 is claimed, the next claim starts a new cycle.
    claimDays(engine,tomorrow,4);
    const afterSeven=engine.dailyRewardStatus();
    assert.ok(afterSeven.schedule.every(d=>d.state==="claimed"));
    assert.deepEqual([afterSeven.nextCycleDay,afterSeven.nextCoins],[1,10]);
  });
});

// ---------- coins only ----------
test("claims add coins to the existing balance and change nothing else (no XP, level, mastery, achievements, worlds)",()=>{
  withTz(PACIFIC,()=>{
    const raw={saveVersion:3,player:{xp:240,level:1,coins:50,streak:2,lastPlayed:"2026-09-30T17:00:00.000Z",activityDates:["2026-09-29","2026-09-30"],achievements:["first_application"]},
      termProgress:{"credit.credit":{masteryLevel:2,masteryPercent:60,dateUnlocked:"2026-09-01T00:00:00.000Z",puzzle:{timesSolved:2}}},
      worlds:{"wg-credit":{solvedWords:["TERM"],puzzleHistory:{"A":{timesPlayed:1,lastPlayedAt:5}}}},settings:{theme:"dark"}};
    const engine=makeEngine({raw,at:DAY1});
    const before={xp:engine.save.player.xp,level:engine.save.player.level,streak:engine.save.player.streak,achievements:snapshot(engine.save.player.achievements),terms:snapshot(engine.save.termProgress),worlds:snapshot(engine.save.worlds),settings:snapshot(engine.save.settings),keys:Object.keys(engine.save.player).sort()};
    const result=engine.claimDailyReward();
    assert.equal(result.coins,10);assert.equal(engine.save.player.coins,60);
    assert.equal(engine.save.player.xp,before.xp);assert.equal(engine.save.player.level,before.level);
    assert.equal(engine.save.player.streak,before.streak);
    assert.equal(snapshot(engine.save.player.achievements),before.achievements);
    assert.equal(snapshot(engine.save.termProgress),before.terms);
    assert.equal(snapshot(engine.save.worlds),before.worlds);
    assert.equal(snapshot(engine.save.settings),before.settings);
    assert.deepEqual(Object.keys(engine.save.player).sort(),before.keys,"no new player fields (no gems or second currency)");
    assert.equal(engine.save.player.gems,undefined);
    assert.equal(engine.save.player.achievementRewards,undefined);
  });
});

// ---------- duplicate claims, refresh, restart ----------
test("repeated taps and refreshes on one local day pay exactly once",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:DAY1}),start=engine.save.player.coins;
    const taps=Array.from({length:6},()=>engine.claimDailyReward());
    assert.equal(taps.filter(r=>r.claimed).length,1);
    assert.ok(taps.slice(1).every(r=>r.reason==="already-claimed"&&r.coins===0));
    engine.setNow("2026-10-01T23:59:00-07:00");
    assert.equal(engine.claimDailyReward().claimed,false,"still the same local day at 11:59 pm");
    const refreshed=makeEngine({storage:engine.store,at:"2026-10-01T23:59:30-07:00"});
    assert.equal(refreshed.claimDailyReward().claimed,false);
    assert.equal(refreshed.save.player.coins,start+10);
  });
});

test("claims survive an app restart, and the next local day continues the cycle",()=>{
  withTz(PACIFIC,()=>{
    const first=makeEngine({at:DAY1});first.claimDailyReward();
    first.setNow("2026-10-02T09:00:00-07:00");first.claimDailyReward();
    const restarted=makeEngine({storage:first.store,at:"2026-10-02T21:00:00-07:00"});
    assert.equal(restarted.dailyRewardStatus().claimedToday,true);
    assert.equal(restarted.save.engagement.dailyClaim.claimStreak,2);
    const nextDay=makeEngine({storage:first.store,at:"2026-10-03T08:00:00-07:00"});
    const result=nextDay.claimDailyReward();
    assert.deepEqual([result.claimed,result.coins,result.cycleDay],[true,20,3]);
  });
});

test("two stale copies of the save (two tabs) cannot both claim the same day",()=>{
  withTz(PACIFIC,()=>{
    const tabA=makeEngine({at:DAY1}),tabB=makeEngine({storage:tabA.store,at:DAY1});
    const start=tabA.save.player.coins;
    assert.equal(tabA.claimDailyReward().claimed,true);
    const stale=tabB.claimDailyReward();
    assert.deepEqual([stale.claimed,stale.reason],[false,"already-claimed"]);
    assert.equal(tabB.save.player.coins,start+10,"the second tab adopts the first tab's payout instead of paying again");
    const stored=JSON.parse(tabA.store.getItem(L.SAVE_KEY));
    assert.equal(stored.player.coins,start+10);
  });
});

test("reading reward status never writes to storage or mutates the save",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:DAY1}),before=snapshot(engine.save),writes=engine.store.writes;
    engine.dailyRewardStatus();engine.dailyClaimStatus();engine.dailyRewardStatus();
    assert.equal(snapshot(engine.save),before);assert.equal(engine.store.writes,writes);
  });
});

test("the claim primitive still refuses to invent an amount",()=>{
  const engine=makeEngine({at:DAY1});
  [undefined,{},{coins:-5},{coins:2.5},{coins:"10"}].forEach(arg=>assert.throws(()=>engine.claimDailyLogin(arg),TypeError));
  assert.equal(engine.save.engagement,undefined);
});

// ---------- local date boundaries ----------
test("eligibility flips exactly at local midnight, not UTC midnight",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-17T10:00:00-07:00"});engine.claimDailyReward();
    engine.setNow("2026-10-17T23:59:59-07:00");assert.equal(engine.dailyRewardStatus().claimable,false);
    engine.setNow("2026-10-18T00:00:00-07:00");assert.equal(engine.dailyRewardStatus().claimable,true);
    // 5 pm Pacific is already the next UTC day; it must not open a claim.
    const evening=makeEngine({at:"2026-10-17T10:00:00-07:00"});evening.claimDailyReward();
    evening.setNow("2026-10-17T17:05:00-07:00");assert.equal(evening.dailyRewardStatus().claimable,false);
  });
});

test("zones ahead of UTC use their own local midnight",()=>{
  withTz("Pacific/Auckland",()=>{
    const engine=makeEngine({at:"2026-10-18T09:00:00+13:00"});engine.claimDailyReward();
    engine.setNow("2026-10-18T23:59:00+13:00");assert.equal(engine.dailyRewardStatus().claimable,false);
    engine.setNow("2026-10-19T00:01:00+13:00");assert.equal(engine.dailyRewardStatus().claimable,true);
  });
});

// ---------- daylight saving ----------
test("seven consecutive daily claims across spring-forward (2026-03-08) keep one unbroken cycle",()=>{
  withTz(PACIFIC,()=>{
    const start="2026-03-05T09:00:00-08:00";
    const engine=makeEngine({at:start});
    const results=[];
    ["2026-03-05T09:00:00-08:00","2026-03-06T09:00:00-08:00","2026-03-07T09:00:00-08:00","2026-03-08T09:00:00-07:00","2026-03-09T09:00:00-07:00","2026-03-10T09:00:00-07:00","2026-03-11T09:00:00-07:00"].forEach(at=>{engine.setNow(at);results.push(engine.claimDailyReward())});
    assert.deepEqual(results.map(r=>r.coins),[10,15,20,25,30,35,50]);
  });
});

test("claims across fall-back (2026-11-01, 25-hour day) stay consecutive, including late-night then after-midnight",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-31T23:50:00-07:00"});
    assert.equal(engine.claimDailyReward().coins,10);
    engine.setNow("2026-11-01T00:10:00-07:00");const second=engine.claimDailyReward();   // 20 min later, new local day
    assert.deepEqual([second.claimed,second.coins],[true,15]);
    engine.setNow("2026-11-01T09:00:00-08:00");assert.equal(engine.claimDailyReward().claimed,false,"the repeated hour never opens a second claim");
    engine.setNow("2026-11-02T00:30:00-08:00");assert.deepEqual([engine.claimDailyReward().claimed,engine.dailyRewardStatus().streak],[true,3]);
  });
});

test("a DST change alone is not treated as a time-zone change",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-11-01T00:30:00-07:00"});engine.claimDailyReward();
    engine.setNow("2026-11-02T00:20:00-08:00");  // < 24 h later, offset changed by DST only
    const status=engine.dailyRewardStatus();
    assert.deepEqual([status.claimable,status.reason],[true,null]);
  });
});

// ---------- time-zone changes ----------
function claimInZoneThenMove(firstZone,firstAt,secondZone,secondAt){
  const store=memoryStorage();
  let engine;
  withTz(firstZone,()=>{engine=makeEngine({at:firstAt,storage:store});engine.claimDailyReward()});
  let status,result;
  withTz(secondZone,()=>{const moved=makeEngine({at:secondAt,storage:store});status=moved.dailyRewardStatus();result=moved.claimDailyReward()});
  return {status,result,store};
}

test("changing time zone to open a second claim within 24 hours is refused",()=>{
  // Claimed 11 pm Pacific Oct 17 (= 6 pm Oct 18 in Tokyo). The Tokyo date is already the 18th, but only 1 hour has passed.
  const {status,result}=claimInZoneThenMove(PACIFIC,"2026-10-17T23:00:00-07:00","Asia/Tokyo","2026-10-18T07:00:00-07:00");
  assert.deepEqual([status.claimable,status.reason],[false,"recent-timezone-change"]);
  assert.deepEqual([result.claimed,result.coins],[false,0]);
});

test("a genuine time-zone change more than 24 hours after the last claim does not block or reset a streak",()=>{
  const {status,result}=claimInZoneThenMove(PACIFIC,"2026-10-17T09:00:00-07:00","Asia/Tokyo","2026-10-19T03:00:00-07:00"); // 42 h later; Tokyo date Oct 19...
  assert.equal(status.claimable,true);
  assert.equal(result.claimed,true);
});

test("eastward travel that skips a calendar date within 36 hours is not a missed day",()=>{
  // Claim Oct 17, 8 pm Pacific. Land in Tokyo 27 hours later: Tokyo local date is Oct 19 (a gap of 2 calendar days), but only 27 real hours passed.
  const {status,result}=claimInZoneThenMove(PACIFIC,"2026-10-17T20:00:00-07:00","Asia/Tokyo","2026-10-19T00:00:00-07:00");
  assert.equal(status.claimable,true);
  assert.deepEqual([result.claimed,result.cycleDay,result.coins],[true,2,15],"cycle continues at Day 2");
});

test("a real two-day absence in the same zone still restarts the cycle",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-17T20:00:00-07:00"});engine.claimDailyReward();
    engine.setNow("2026-10-19T09:00:00-07:00");
    const status=engine.dailyRewardStatus();
    assert.deepEqual([status.claimable,status.cycleDay,status.restarted],[true,1,true]);
  });
});

test("westward travel (local date behind the last claim) pauses claims and loses nothing",()=>{
  const store=memoryStorage();
  withTz("Asia/Tokyo",()=>{const e=makeEngine({at:"2026-10-18T09:00:00+09:00",storage:store});e.claimDailyReward()});
  withTz("Pacific/Honolulu",()=>{
    const e=makeEngine({at:"2026-10-17T20:00:00-10:00",storage:store}); // same instant range, Honolulu local date is the 17th
    const status=e.dailyRewardStatus();
    assert.equal(status.claimable,false);
    assert.equal(e.save.engagement.dailyClaim.claimStreak,1,"streak preserved");
  });
});

// ---------- clock manipulation ----------
test("rolling the clock back to claim again is refused",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-10T09:00:00-07:00"});engine.claimDailyReward();
    engine.setNow("2026-10-09T09:00:00-07:00");
    assert.deepEqual([engine.dailyRewardStatus().claimable,engine.dailyRewardStatus().reason],[false,"clock-behind-last-claim"]);
    assert.equal(engine.claimDailyReward().claimed,false);
    engine.setNow("2026-10-10T20:00:00-07:00");assert.equal(engine.claimDailyReward().claimed,false,"same real day, still claimed");
  });
});

test("play evidence blocks a rewind that would otherwise preserve a streak",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-10T09:00:00-07:00"});engine.claimDailyReward();
    // The player keeps playing until Oct 15 (touchActivity records lastPlayed), then rewinds the clock to Oct 11.
    engine.setNow("2026-10-15T09:00:00-07:00");engine.touchActivity();
    engine.setNow("2026-10-11T09:00:00-07:00");
    const status=engine.dailyRewardStatus();
    assert.deepEqual([status.claimable,status.reason],[false,"clock-rolled-back"]);
    assert.equal(engine.claimDailyReward().claimed,false);
    engine.setNow("2026-10-15T09:30:00-07:00");
    assert.equal(engine.dailyRewardStatus().claimable,true,"restoring the real clock restores eligibility (and the missed days reset the cycle)");
    assert.equal(engine.dailyRewardStatus().cycleDay,1);
  });
});

test("a rewind made before the app was relaunched is caught from the previous session's last save",()=>{
  withTz(PACIFIC,()=>{
    const session1=makeEngine({at:"2026-10-10T09:00:00-07:00"});session1.claimDailyReward();
    session1.setNow("2026-10-15T09:00:00-07:00");session1.persist();   // last save: Oct 15
    const session2=makeEngine({storage:session1.store,at:"2026-10-11T09:00:00-07:00"}); // clock rewound, app relaunched
    const status=session2.dailyRewardStatus();
    assert.deepEqual([status.claimable,status.reason],[false,"clock-rolled-back"]);
  });
});

test("a rewind inside one session is caught even when nothing was saved in between",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-10T09:00:00-07:00"});engine.claimDailyReward();
    engine.setNow("2026-10-14T09:00:00-07:00");engine.dailyRewardStatus();   // observed clock reaches Oct 14 (no write)
    engine.setNow("2026-10-12T09:00:00-07:00");
    assert.equal(engine.dailyRewardStatus().reason,"clock-rolled-back");
  });
});

test("small clock corrections (NTP-sized) never block a legitimate claim",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-10T09:00:30-07:00"});engine.persist();
    engine.setNow("2026-10-11T09:00:00-07:00");
    engine.setNow("2026-10-11T08:55:00-07:00"); // 5 minutes behind previously observed time, same next day
    assert.equal(engine.dailyRewardStatus().claimable,true);
  });
});

test("jumping the clock far forward cannot bank extra rewards: the cycle simply restarts at Day 1",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-01T09:00:00-07:00"});claimDays(engine,"2026-10-01T09:00:00-07:00",5);
    engine.setNow("2027-03-01T09:00:00-08:00");
    const result=engine.claimDailyReward();
    assert.deepEqual([result.claimed,result.coins,result.cycleDay],[true,10,1]);
    assert.equal(engine.claimDailyReward().claimed,false,"and only one claim for that fabricated day");
  });
});

test("KNOWN LIMITATION (documented, not claimed as prevented): advancing the clock one day at a time still yields one claim per fabricated day",()=>{
  withTz(PACIFIC,()=>{
    const engine=makeEngine({at:"2026-10-01T09:00:00-07:00"});
    const results=claimDays(engine,"2026-10-01T09:00:00-07:00",3);
    assert.ok(results.every(r=>r.claimed),"without a trusted time source, forward changes look like ordinary days");
  });
});

// ---------- save migration / compatibility ----------
test("a save from before any claim feature loads unchanged and gains only additive fields on first claim",()=>{
  withTz(PACIFIC,()=>{
    const raw={saveVersion:3,futureTop:{a:1},player:{xp:625,level:3,coins:777,streak:4,lastPlayed:"2026-09-30T20:00:00.000Z",activityDates:["2026-09-30"],weeklyGoal:6,achievements:["first_application"],futurePlayerFlag:"keep"},
      termProgress:{},worlds:{"wg-credit":{solvedWords:["TERM"],puzzleHistory:{"LEGACY":{timesPlayed:1,lastPlayedAt:5}}},"wg-crypto":{solvedWords:["TOKEN"]},"wg-future":{x:[1]}},settings:{theme:"dark",futureSetting:1}};
    const engine=makeEngine({raw,at:DAY1});
    assert.equal(engine.save.engagement,undefined);
    const playerKeysBefore=Object.keys(engine.save.player).sort();
    engine.claimDailyReward();
    assert.equal(engine.save.player.coins,787);
    assert.deepEqual(Object.keys(engine.save.player).sort(),playerKeysBefore);
    const reloaded=makeEngine({storage:engine.store,at:"2026-10-01T18:00:00-07:00"});
    assert.deepEqual(reloaded.save.futureTop,{a:1});
    assert.equal(reloaded.save.player.futurePlayerFlag,"keep");
    assert.deepEqual(reloaded.save.worlds["wg-future"],{x:[1]});
    assert.equal(reloaded.save.settings.futureSetting,1);
    assert.equal(reloaded.save.player.xp,625);
  });
});

test("a Phase 1 style claim record (without the new fields) is read safely and keeps unknown fields",()=>{
  withTz(PACIFIC,()=>{
    const raw={saveVersion:3,player:{coins:100},termProgress:{},worlds:{},engagement:{futureKey:true,dailyClaim:{unknownClaimField:"x",lastClaimDay:"2026-09-30",claimStreak:6,longestClaimStreak:9,history:[]}}};
    const engine=makeEngine({raw,at:DAY1});
    const result=engine.claimDailyReward();
    assert.deepEqual([result.claimed,result.cycleDay,result.coins],[true,7,50]);
    assert.equal(engine.save.engagement.futureKey,true);
    assert.equal(engine.save.engagement.dailyClaim.unknownClaimField,"x");
    assert.equal(engine.save.engagement.dailyClaim.longestClaimStreak,9);
  });
});

test("corrupted claim data degrades to a fresh claim instead of throwing",()=>{
  withTz(PACIFIC,()=>{
    [{dailyClaim:"oops"},{dailyClaim:{lastClaimDay:12,claimStreak:"x",history:7,lastClaimAtMs:"never"}},"string",null].forEach(engagement=>{
      const engine=makeEngine({raw:{saveVersion:3,player:{coins:10},termProgress:{},worlds:{},engagement},at:DAY1});
      assert.doesNotThrow(()=>engine.dailyRewardStatus());
      assert.equal(engine.claimDailyReward().coins,10);
    });
  });
});

// ---------- daily goal / progress ----------
test("the approved five-puzzle daily goal is retained and still maps to one playthrough",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  assert.match(source,/const WG_DEFAULT_REQUIRED_PUZZLES = 5;/);
  assert.match(source,/const WG_DAILY_PUZZLE_GOAL = WG_DEFAULT_REQUIRED_PUZZLES;/);
  assert.equal((source.match(/requiredPuzzles: 5,/g)||[]).length,13,"all worlds draw five puzzles per playthrough");
});

test("daily puzzle progress counts completions once and a daily claim never changes it or pays for it",()=>{
  withTz(PACIFIC,()=>{
    const t=new Date("2026-10-01T08:30:00-07:00").getTime();
    const raw={saveVersion:3,player:{coins:100},termProgress:{},worlds:{"wg-credit":{puzzleHistory:{P1:{timesPlayed:3,lastPlayedAt:t},P2:{timesPlayed:1,lastPlayedAt:t}}},"wg-crypto":{puzzleHistory:{P1:{timesPlayed:1,lastPlayedAt:t}}}}};
    const engine=makeEngine({raw,at:DAY1});
    assert.equal(engine.dailyPuzzleProgress().count,2,"a canonical puzzle completed in two curricula counts once");
    engine.claimDailyReward();
    assert.equal(engine.dailyPuzzleProgress().count,2);
    assert.equal(engine.save.player.coins,110,"progress is not itself a reward");
  });
});

// ---------- accessibility / markup contract ----------
test("the daily reward markup is a labelled region with a real button, an ordered list, and a polite live status",()=>{
  const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
  const card=html.split('id="dailyReward"')[1].split("</p>\n      </div>")[0];
  assert.match(html,/<div class="daily-reward" id="dailyReward" role="region" aria-labelledby="dailyRewardTitle">/);
  assert.match(card,/<h2 id="dailyRewardTitle">/);
  assert.match(card,/<button type="button" class="daily-reward-claim" id="dailyRewardClaim">/);
  assert.match(card,/<ol class="daily-reward-days" id="dailyRewardDays" aria-label="[^"]+">/);
  assert.match(card,/id="dailyRewardStatus" role="status" aria-live="polite" tabindex="-1"/);
  assert.ok(html.indexOf('id="dailyReward"')>html.indexOf('id="worldSelectScreen"'),"card lives on the journey screen");
});

test("the daily reward styles provide visible keyboard focus, a 44px target, and reduced-motion handling",()=>{
  const css=fs.readFileSync(path.join(ROOT,"journey.css"),"utf8");
  assert.match(css,/\.daily-reward-claim:focus-visible/);
  assert.match(css,/\.daily-reward-claim\{[^}]*min-height:44px/);
  assert.match(css,/prefers-reduced-motion:reduce\)\{\.daily-reward-claim/);
  assert.ok(!/\.daily-reward[^{]*\{[^}]*outline:\s*none/.test(css),"focus outline is never removed");
});

test("the UI layer routes claims through the engine only (no direct coin/XP writes, no gems)",()=>{
  const source=fs.readFileSync(path.join(ROOT,"app.js"),"utf8");
  const start=source.indexOf("function renderDailyReward"),end=source.indexOf("const WORLD_JOURNEY_ORDER");
  const block=source.slice(start,end);
  assert.match(block,/learning\.claimDailyReward\(\)/);
  assert.ok(!/\.coins\s*[+\-]?=/.test(block)&&!/\.xp\s*[+\-]?=/.test(block)&&!/gems/i.test(block));
});

test("claiming does not touch crossword reward logic",()=>{
  const bank=require("../src/puzzle-bank-engine.js");
  const before=snapshot([bank.wordReward("CASH",[]),bank.wordReward("CASH",["CASH"])]);
  withTz(PACIFIC,()=>{const engine=makeEngine({at:DAY1});engine.claimDailyReward()});
  assert.equal(snapshot([bank.wordReward("CASH",[]),bank.wordReward("CASH",["CASH"])]),before);
  assert.deepEqual(bank.wordReward("CASH",[]),{coins:28,xp:6,isNewSolve:true});
});

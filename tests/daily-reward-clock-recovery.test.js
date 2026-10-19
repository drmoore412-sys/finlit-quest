// Recovery behavior for players whose device clock was accidentally advanced.
// Guarantees under test: balances and reward history are never erased, there is
// no hidden reset path, rewards resume automatically, and the player is told
// what to do. Synthetic saves only.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const L=require("../learning-engine.js");
const {ROOT}=require("./helpers.js");

const PACIFIC="America/Los_Angeles";
function withTz(tz,fn){const previous=process.env.TZ;process.env.TZ=tz;try{return fn()}finally{if(previous===undefined)delete process.env.TZ;else process.env.TZ=previous}}
function memoryStorage(){const data={};return {getItem:key=>(key in data?data[key]:null),setItem:(key,value)=>{data[key]=String(value);this.writes=(this.writes||0)+1},removeItem:key=>{delete data[key]},writes:0}}
const TERM={id:"credit.credit",world:"credit",category:"c",difficulty:"d",word:"CREDIT",normalizedWord:"credit",definition:"d",pronunciation:"",realLifeExample:"",didYouKnow:"",commonMistake:"",relatedTermIds:[],quickChallenge:{prompt:"",options:["a"],correctIndex:0,explanation:""},xpValue:10,reviewWeight:1};
function engineAt(store,at){let clock=new Date(at);const engine=new L.LearningEngine({terms:[TERM],storage:store,now:()=>clock});engine.setNow=value=>{clock=new Date(value)};return engine}
const T0=new Date("2026-10-10T09:00:00-07:00").getTime(),DAY=86400000,HOUR=3600000;
const snap=value=>JSON.stringify(value);

test("an accidentally advanced clock pauses claims, erases nothing, and resumes automatically on the real date",()=>{
  withTz(PACIFIC,()=>{
    const store=memoryStorage(),engine=engineAt(store,T0);
    engine.claimDailyReward();engine.setNow(T0+DAY);engine.claimDailyReward();            // two genuine claims
    engine.setNow(T0+5*DAY);const accidental=engine.claimDailyReward();                    // device date wrongly 5 days ahead
    engine.touchActivity();
    assert.equal(accidental.claimed,true);
    const guard={coins:engine.save.player.coins,xp:engine.save.player.xp,streak:engine.save.player.streak,history:snap(engine.save.engagement.dailyClaim.history)};
    // The player notices and sets the date back to automatic.
    const paused=[];
    [2,3,4].forEach(offset=>{
      engine.setNow(T0+offset*DAY+HOUR);
      const before=snap(engine.save),writes=store.writes;
      const status=engine.dailyRewardStatus(),attempt=engine.claimDailyReward();
      paused.push(status.reason);
      assert.equal(attempt.claimed,false);
      assert.equal(snap(engine.save),before,"a paused claim changes nothing");
      assert.equal(store.writes,writes,"a paused claim writes nothing");
    });
    assert.deepEqual(paused,["clock-behind-last-claim","clock-behind-last-claim","clock-behind-last-claim"]);
    engine.setNow(T0+5*DAY+HOUR);assert.equal(engine.dailyRewardStatus().reason,"already-claimed");
    assert.equal(engine.save.player.coins,guard.coins,"coins are never clawed back");
    assert.equal(engine.save.player.xp,guard.xp);
    assert.equal(engine.save.player.streak,guard.streak,"the play streak is not reduced");
    assert.equal(snap(engine.save.engagement.dailyClaim.history),guard.history,"claim history is intact");
    // Resumes by itself on the first local day after the recorded claim day.
    engine.setNow(T0+6*DAY+HOUR);
    const resumed=engine.dailyRewardStatus();
    assert.deepEqual([resumed.claimable,resumed.cycleDay,resumed.coins],[true,2,15],"the claim made on the wrong date counted as Day 1, so recovery continues at Day 2");
    assert.equal(engine.claimDailyReward().claimed,true);
  });
});

test("merely opening the app with a wrong clock pauses claims until real time catches up, without creating or erasing claim data",()=>{
  withTz(PACIFIC,()=>{
    const store=memoryStorage(),first=engineAt(store,T0);first.claimDailyReward();first.persist();
    const wrong=engineAt(store,T0+DAY+2*DAY);                          // launched while the clock was 3 days ahead; nothing claimed or played
    wrong.persist();
    const corrected=engineAt(store,T0+DAY+HOUR);                       // clock fixed, app relaunched the next real day
    const before=snap(corrected.save.engagement);
    assert.deepEqual([corrected.dailyRewardStatus().claimable,corrected.dailyRewardStatus().reason],[false,"clock-rolled-back"]);
    assert.equal(snap(corrected.save.engagement),before,"claim history untouched");
    corrected.setNow(T0+DAY+2*DAY+11*60*1000);                         // past the recorded launch time + tolerance
    assert.equal(corrected.dailyRewardStatus().claimable,true,"resumes on its own");
  });
});

test("a player who never claimed while the date was wrong keeps their cycle position after the pause",()=>{
  withTz(PACIFIC,()=>{
    const store=memoryStorage(),engine=engineAt(store,T0);
    engine.claimDailyReward();engine.setNow(T0+DAY);engine.claimDailyReward();engine.persist();   // Day 1, Day 2 claimed
    const afterOpenOnly=engineAt(store,T0+DAY+3*HOUR);                                            // clock correct, same day
    assert.equal(afterOpenOnly.dailyRewardStatus().reason,"already-claimed");
    const nextDay=engineAt(store,T0+2*DAY+HOUR);
    const status=nextDay.dailyRewardStatus();
    assert.deepEqual([status.claimable,status.cycleDay,status.coins],[true,3,20]);
  });
});

test("there is no reset path: no daily-reward method resets, clears, or forgives state",()=>{
  const names=Object.getOwnPropertyNames(L.LearningEngine.prototype).filter(name=>/daily|claim|clock/i.test(name)).sort();
  assert.deepEqual(names,["adoptPersistedClaim","claimDailyLogin","claimDailyReward","clockEvidenceMs","dailyClaimStatus","dailyPuzzleProgress","dailyRewardStatus"]);
  assert.ok(!names.some(name=>/reset|clear|forgive|restore|erase|delete|wipe/i.test(name)));
});

test("property: over a long, jumbled clock walk, coins and reward history never decrease",()=>{
  withTz(PACIFIC,()=>{
    let seed=12345;const random=()=>{seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff};
    const store=memoryStorage(),engine=engineAt(store,T0);
    let lastCoins=engine.save.player.coins,lastLongest=0,lastHistory=0,claims=0;
    for(let step=0;step<400;step++){
      const jump=Math.round((random()-0.4)*6*DAY);               // mostly forward, often backward
      engine.setNow(T0+step*HOUR*5+jump);
      const action=random();
      if(action<0.6)engine.claimDailyReward();else if(action<0.8)engine.touchActivity();else engine.dailyRewardStatus();
      const claim=engine.save.engagement&&engine.save.engagement.dailyClaim;
      assert.ok(engine.save.player.coins>=lastCoins,`coins decreased at step ${step}`);
      if(claim){
        assert.ok(claim.longestClaimStreak>=lastLongest,"longest streak never decreases");
        assert.ok(claim.history.length>=Math.min(lastHistory,60),"history never shrinks (cap 60)");
        lastLongest=claim.longestClaimStreak;lastHistory=claim.history.length;
      }
      lastCoins=engine.save.player.coins;
    }
    const achievementXp=Object.values(engine.save.player.achievementRewards||{}).reduce((sum,reward)=>sum+reward.xp,0);
    assert.equal(engine.save.player.xp,achievementXp,"every XP point came from an achievement reward; claims never award XP");
  });
});

test("the paused-state messages tell the player what to do and that nothing was lost",()=>{
  const source=fs.readFileSync(path.join(ROOT,"app.js"),"utf8");
  ["clock-behind-last-claim","clock-rolled-back"].forEach(reason=>{
    const line=source.split("\n").find(entry=>entry.includes(`"${reason}":`));
    assert.ok(line,`message for ${reason} exists`);
    assert.match(line,/set Date & Time back to automatic/);
    assert.match(line,/coins and reward history are safe/);
    assert.match(line,/resume on their own/);
  });
});

test("the default daily-goal text in the puzzle header matches the approved goal of 5",()=>{
  const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
  assert.match(html,/<b id="wgDailyProgress">0 \/ 5<\/b>/);
});

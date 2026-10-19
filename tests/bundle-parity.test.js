// Release guard: the iOS web-asset bundle (ios/App/App/public, built by
// scripts/build-www.sh + `npx cap sync ios`) must carry the same daily-reward
// implementation as the web source. If this fails after a source edit, the
// bundle is stale: run stamp-cache-bust, build-www.sh, and `npx cap sync ios`.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");

const BUNDLE=path.join(ROOT,"ios/App/App/public");
const read=(base,file)=>fs.readFileSync(path.join(base,file));
const MIRRORED=["learning-engine.js","word-game-app.js","app.js","index.html","journey.css","src/puzzle-bank-engine.js","src/v3-puzzle-slate.js","src/victory-celebration.js","src/game-audio.js","word-game.css","content/credit-term-identities.js","content/v3-supplemental-terms.js"];

test("the reward feature files in the iOS bundle are byte-identical to the web source",()=>{
  MIRRORED.forEach(file=>assert.ok(read(ROOT,file).equals(read(BUNDLE,file)),`${file} differs between source and ios/App/App/public — re-sync the bundle`));
});

test("every local asset index.html references exists in the iOS bundle",()=>{
  const html=read(BUNDLE,"index.html").toString("utf8");
  const refs=[...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|webmanifest|ico|png))(?:\?v=\d+)?"/g)].map(match=>match[1]);
  assert.ok(refs.length>20);
  refs.forEach(ref=>assert.ok(fs.existsSync(path.join(BUNDLE,ref)),`${ref} is referenced by index.html but missing from the iOS bundle (add it to scripts/build-www.sh)`));
});

test("index.html carries a single cache-bust stamp across all references",()=>{
  const stamps=new Set([...read(ROOT,"index.html").toString("utf8").matchAll(/\?v=(\d+)/g)].map(match=>match[1]));
  assert.equal(stamps.size,1,`expected one stamp, found ${[...stamps].join(",")}`);
});

test("web and iOS engines apply identical daily-reward rules and save structures",()=>{
  const web=require(path.join(ROOT,"learning-engine.js"));
  const native=require(path.join(BUNDLE,"learning-engine.js"));
  assert.deepEqual([...native.DAILY_LOGIN_SCHEDULE],[...web.DAILY_LOGIN_SCHEDULE]);
  assert.deepEqual([...native.DAILY_LOGIN_SCHEDULE],[10,15,20,25,30,35,50]);
  const TERM={id:"credit.credit",world:"credit",category:"c",difficulty:"d",word:"CREDIT",normalizedWord:"credit",definition:"d",pronunciation:"",realLifeExample:"",didYouKnow:"",commonMistake:"",relatedTermIds:[],quickChallenge:{prompt:"",options:["a"],correctIndex:0,explanation:""},xpValue:10,reviewWeight:1};
  function run(api){
    const data={};const storage={getItem:key=>(key in data?data[key]:null),setItem:(key,value)=>{data[key]=String(value)},removeItem:key=>{delete data[key]}};
    let clock=new Date("2026-10-01T09:00:00Z");
    const engine=new api.LearningEngine({terms:[TERM],storage,now:()=>clock});
    const trace=[];
    for(let i=0;i<9;i++){clock=new Date(Date.UTC(2026,9,1+i,9));trace.push(engine.claimDailyReward());trace.push(engine.claimDailyReward())}
    clock=new Date("2026-10-14T09:00:00Z");trace.push(engine.dailyRewardStatus());trace.push(engine.claimDailyReward());
    clock=new Date("2026-10-13T09:00:00Z");trace.push(engine.dailyRewardStatus());
    engine.touchActivity();trace.push(engine.dailyPuzzleProgress());
    const save=JSON.parse(data[api.SAVE_KEY]);
    return {trace,coins:save.player.coins,xp:save.player.xp,engagement:save.engagement,playerKeys:Object.keys(save.player).sort()};
  }
  const a=run(web),b=run(native);
  assert.deepEqual(b,a);
  assert.equal(a.xp,0,"daily claims never award XP");
});

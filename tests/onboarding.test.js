// First-time tutorial, one-time tips and Help (2026-11-19): rules, save migration and wiring.
// The tutorial UI itself is verified in a real browser; these tests pin the rules it relies on.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const L=require("../learning-engine.js");
const O=require("../src/onboarding.js");
const ROOT=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8");
function store(seed){const data={...seed};return {getItem:k=>(k in data?data[k]:null),setItem:(k,v)=>{data[k]=String(v)},removeItem:k=>{delete data[k]},dump:()=>data}}
const engine=seed=>new L.LearningEngine({terms:[],storage:store(seed)});

test("a brand-new save starts the tutorial as pending with no tips shown",()=>{
  const e=engine({});
  assert.deepEqual(e.save.onboarding,{version:1,tutorial:"pending",tips:{}});
  assert.equal(O.shouldAutoStart(e.save,1,true),true,"Level 1 of the unified levels");
  assert.equal(O.shouldAutoStart(e.save,2,true),false,"not on other levels");
  assert.equal(O.shouldAutoStart(e.save,1,false),false,"not in the old per-world flow");
});

test("existing players never get the automatic tutorial or the one-time tips, and keep every bit of their data",()=>{
  const raw={saveVersion:4,player:{xp:640,level:3,coins:812,streak:4,lastPlayed:"2026-11-10T10:00:00.000Z",activityDates:["2026-11-09","2026-11-10"],weeklyGoal:5,achievements:["first-word"]},
    canonicalPuzzleProgress:{"FQ-V3:business:FREELANCE:R1":{timesCompleted:1,rewardedAnswers:["EARN","FEE"]}},worlds:{"wg-crypto":{puzzleHistory:{A:{timesPlayed:2}}}},settings:{theme:"dark",reducedMotion:true,skipLessons:false},customField:{keep:true}};
  const e=engine({[L.SAVE_KEY]:JSON.stringify(raw)});
  assert.equal(e.save.onboarding.tutorial,"existing-player");
  assert.deepEqual(e.save.onboarding.tips,{rewards:true,worlds:true});
  assert.equal(O.shouldAutoStart(e.save,1,true),false);
  assert.equal(O.tipDue(e.save,"rewards"),false);assert.equal(O.tipDue(e.save,"worlds"),false);
  // no loss: everything that was stored is still there, unchanged
  assert.equal(e.save.player.coins,812);assert.equal(e.save.player.xp,640);assert.equal(e.save.player.streak,4);
  assert.deepEqual(e.save.player.achievements,["first-word"]);assert.deepEqual(e.save.player.activityDates,["2026-11-09","2026-11-10"]);
  assert.deepEqual(e.save.canonicalPuzzleProgress,raw.canonicalPuzzleProgress);assert.deepEqual(e.save.worlds,raw.worlds);
  assert.deepEqual(e.save.settings,raw.settings);assert.deepEqual(e.save.customField,{keep:true});
  assert.equal(e.save.saveVersion,L.CURRENT_SAVE_VERSION);
});

test("a pre-tutorial save with no progress at all is still treated as an existing player",()=>{
  const e=engine({[L.SAVE_KEY]:JSON.stringify({saveVersion:3,player:{}})});
  assert.equal(e.save.onboarding.tutorial,"existing-player");
});

test("legacy (pre-save) progress counts as an existing player; no legacy data is a new player",()=>{
  assert.equal(engine({yw_review:JSON.stringify({TOKEN:2}),yw_yield:"40"}).save.onboarding.tutorial,"existing-player");
  assert.equal(engine({}).save.onboarding.tutorial,"pending");
});

test("Skip and completion are remembered across reloads; a corrupted record falls back safely",()=>{
  const s=store({});let e=new L.LearningEngine({terms:[],storage:s});
  assert.equal(O.recordTutorial(e.save,"skipped"),true);e.persist();
  e=new L.LearningEngine({terms:[],storage:s});
  assert.equal(e.save.onboarding.tutorial,"skipped");assert.equal(O.shouldAutoStart(e.save,1,true),false);
  assert.equal(O.recordTutorial(e.save,"completed"),true,"a later replay can complete it");
  assert.equal(O.recordTutorial(e.save,"bogus"),false);assert.equal(O.recordTutorial(e.save,"pending"),false,"replay never re-arms the automatic start");
  const bad=engine({[L.SAVE_KEY]:JSON.stringify({saveVersion:4,player:{},onboarding:{tutorial:"weird",tips:{rewards:"yes",worlds:true}}})});
  assert.deepEqual(bad.save.onboarding,{version:1,tutorial:"existing-player",tips:{worlds:true}});
});

test("one-time tips fire once each, even for players who skipped the tutorial",()=>{
  const s=store({});let e=new L.LearningEngine({terms:[],storage:s});
  O.recordTutorial(e.save,"skipped");
  assert.equal(O.tipDue(e.save,"rewards"),true);assert.equal(O.tipDue(e.save,"worlds"),true);
  O.recordTip(e.save,"rewards");e.persist();e=new L.LearningEngine({terms:[],storage:s});
  assert.equal(O.tipDue(e.save,"rewards"),false,"shown once");assert.equal(O.tipDue(e.save,"worlds"),true);
  O.recordTip(e.save,"worlds");assert.equal(O.tipDue(e.save,"worlds"),false);
  assert.equal(O.tipDue(e.save,"settings"),false,"there is no automatic settings tip");
  assert.equal(O.recordTip(e.save,"unknown"),false);
});

test("the five steps target real controls in the page, in the agreed order, with plain-language copy",()=>{
  const html=read("index.html");
  assert.deepEqual(O.STEPS.map(s=>s.id),["wheel","grid","definitions","mission","hints"]);
  O.STEPS.forEach(s=>{const id=s.target.replace("#","");assert.ok(html.includes(`id="${id}"`),`${s.id} -> ${s.target}`);assert.ok(s.text.length<170&&s.title.length<40,s.id)});
  assert.ok(html.includes('id="wgCompleteContinue"'),"the worlds tip anchors to Next Puzzle");
  assert.ok(/class="wg-currencies"/.test(html)&&/class="wg-coin-chip"/.test(html),"the rewards tip anchors to the coin counter");
});

test("the tutorial never spends coins, triggers hints or touches rewards and progress: it only writes save.onboarding",()=>{
  const src=read("src/onboarding.js");
  ["wgHint(","wgRevealFull(","spendCoins","canonicalPuzzleProgress","player.coins","player.xp","recordCanonical","wgFoundWord(","wgSubmitWord("].forEach(token=>assert.ok(!src.includes(token),token));
  assert.match(src,/function recordTutorial\(save,outcome\)\{\s*const o=state\(save\)/);
  assert.match(src,/function recordTip\(save,id\)\{\s*const o=state\(save\)/);
});

test("wiring: styles and script load before the game, the Help button exists, and the game reports the right moments",()=>{
  const html=read("index.html"),app=read("word-game-app.js");
  const at=name=>html.indexOf(`src="${name}?v=`);
  assert.ok(at("src/onboarding.js")>0&&at("src/onboarding.js")<at("word-game-app.js"));
  assert.ok(html.includes('href="onboarding.css?v='));
  assert.match(html,/<button class="wg-help-button" id="wgHelpButton" type="button" aria-haspopup="dialog" aria-label="Help: replay the tutorial or open sound and settings">\?<\/button>/);
  assert.match(app,/window\.FinLitOnboarding\?\.mount\?\.\(\{ getSave: \(\) => learning\.save, persist: \(\) => learning\.persist\(\) \}\);/);
  assert.match(app,/window\.FinLitOnboarding\?\.puzzleShown\?\.\(wgState\.levelNumber, Boolean\(wgState\.unified\)\);/);
  assert.match(app,/if \(reward\.isNewSolve && \(reward\.coins > 0 \|\| reward\.xp > 0\)\) window\.FinLitOnboarding\?\.rewardGranted\?\.\(\);/);
  assert.match(app,/window\.FinLitOnboarding\?\.levelCompleted\?\.\(wgState\.levelNumber, Boolean\(wgState\.unified\)\);/);
  assert.match(read("src/mobile-polish.js"),/root\.FinLitSettingsSheet=\{open:openSheet,close:closeSheet\};/);
  const build=read("scripts/build-www.sh");assert.ok(build.includes("onboarding.css")&&build.includes("src/onboarding.js"));
  ["src/onboarding.js","onboarding.css","index.html","word-game-app.js","learning-engine.js","src/mobile-polish.js"].forEach(f=>assert.ok(fs.readFileSync(path.join(ROOT,f)).equals(fs.readFileSync(path.join(ROOT,"ios/App/App/public",f))),`${f} identical in the iOS bundle`));
});

test("accessibility basics are in place: dialog roles, labels, Escape handling, reduced motion and safe areas",()=>{
  const src=read("src/onboarding.js"),css=read("onboarding.css");
  assert.ok(src.includes('setAttribute("role","dialog")')&&src.includes('"aria-labelledby","flqTourTitle"')&&src.includes('"aria-describedby","flqTourText"'));
  assert.ok(src.includes('event.key!=="Escape"')&&src.includes('event.key==="Escape"')&&src.includes('event.key!=="Tab"'));
  assert.ok(src.includes("prefers-reduced-motion")&&css.includes("prefers-reduced-motion"));
  assert.ok(css.includes("env(safe-area-inset-top)")&&css.includes("min-height:44px"));
});

// Phase 4 victory celebration: presentation only. These tests pin when it fires, that it never
// touches rewards or saves, that sound is quiet / mutable / persisted safely, that reduced motion
// removes all movement, that it can be skipped, and that the effects stay lightweight.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
const victory=require("../src/victory-celebration.js");

const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

function fakeDocument(){
  const created=[];
  function element(tag){
    const attrs={},styles={};
    const el={tag,className:"",textContent:"",children:[],style:{setProperty:(k,v)=>{styles[k]=v},styles},attrs,
      setAttribute:(k,v)=>{attrs[k]=v},append(...nodes){nodes.forEach(n=>{n.parent=el;el.children.push(n)})},remove(){el.removed=true;if(el.parent)el.parent.children=el.parent.children.filter(n=>n!==el)}};
    created.push(el);return el;
  }
  const body=element("body");
  return{createElement:element,body,created};
}
function fakeStorage(initial={},{throws=false}={}){
  const data={...initial},writes=[];
  return{getItem:k=>{if(throws)throw new Error("blocked");return k in data?data[k]:null},setItem:(k,v)=>{if(throws)throw new Error("blocked");writes.push([k,v]);data[k]=String(v)},data,writes};
}
function fakeAudioWindow(){
  const log={contexts:0,tones:[],closed:0};
  class Ctx{
    constructor(){log.contexts++;this.currentTime=0;this.state="running";this.destination={}}
    createOscillator(){const o={frequency:{},connect(){},start(t){o.startAt=t},stop(t){o.stopAt=t}};log.tones.push(o);return o}
    createGain(){const g={gain:{setValueAtTime(){},linearRampToValueAtTime(v){g.peak=Math.max(g.peak||0,v)},exponentialRampToValueAtTime(){}},connect(){}};log.tones.at(-1).gainNode=g;return g}
    close(){log.closed++}
  }
  return{win:{AudioContext:Ctx,innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false})},log};
}
function rect(x,y,w=20,h=20){return{getBoundingClientRect:()=>({left:x,top:y,width:w,height:h})}}

test("only a newly completed puzzle is celebrated; a replay gets the readable panel only",()=>{
  const first=victory.plan({newlyCompleted:true,coins:35,soundEnabled:true});
  assert.equal(first.celebrate,true);assert.equal(first.motion,true);assert.equal(first.sound,true);
  assert.equal(first.confetti,0,"confetti is removed");assert.ok(first.dollars>0&&first.coins>0);
  const replay=victory.plan({newlyCompleted:false,coins:0,soundEnabled:true});
  assert.deepEqual(replay,{celebrate:false,motion:false,confetti:0,coins:0,dollars:0,sound:false,durationMs:0});
});

test("the effects run for about two to three seconds and stay lightweight",()=>{
  const p=victory.plan({coins:9999});
  assert.ok(p.durationMs>=2000&&p.durationMs<=3000,"2-3 seconds");
  assert.equal(p.confetti,0);assert.ok(p.coins<=12&&p.dollars<=10,"bounded DOM element counts");
  assert.equal(victory.coinCount(0),0,"no coins earned, no cascade");
  assert.equal(victory.coinCount(7),victory.LIMITS.minCoins);
  assert.equal(victory.coinCount(63),victory.LIMITS.minCoins);
  assert.equal(victory.coinCount(1e9),victory.LIMITS.coins);
  assert.equal(victory.coinCount(-5),0);
  assert.equal(victory.coinCount("not a number"),0);
});

test("a newly rewarded financial term gets a compact coin-only celebration",()=>{
  const p=victory.termPlan({coins:49,newlySolved:true});
  assert.equal(p.celebrate,true);assert.equal(p.motion,true);assert.equal(p.sound,false);
  assert.equal(p.dollars,0);assert.equal(p.confetti,0);assert.ok(p.coins>=3&&p.coins<=6);
  assert.equal(p.durationMs,victory.TERM_DURATION_MS);
  assert.deepEqual(victory.termPlan({coins:0,newlySolved:true}),{celebrate:false,motion:false,confetti:0,coins:0,dollars:0,sound:false,durationMs:0});
  assert.equal(victory.termPlan({coins:49,newlySolved:false}).celebrate,false,"a replay cannot imply another payout");
});

test("the term controller draws only a short coin flight and never invokes audio",()=>{
  const doc=fakeDocument(),timers=[],calls=[];
  const controller=victory.createController({document:doc,window:{innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false})},storage:fakeStorage(),audio:{play:()=>calls.push("play"),stop:()=>calls.push("stop"),reset:()=>calls.push("reset")},setTimer:(fn,ms)=>{timers.push({fn,ms});return 1},clearTimer:()=>{}});
  const result=controller.start({kind:"term",coins:49,newlySolved:true,from:rect(180,500),to:rect(20,40,60,30)});
  assert.equal(result.running,true);assert.equal(result.announcement,null);
  const layer=doc.body.children[0];assert.equal(layer.className,"vc-layer vc-term-layer");
  assert.equal(layer.children.filter(node=>node.className==="vc-coin").length,result.plan.coins);
  assert.equal(layer.children.filter(node=>node.className==="vc-dollar").length,0);
  assert.equal(timers[0].ms,victory.TERM_DURATION_MS);
  assert.equal(calls.includes("play"),false);assert.equal(calls.includes("reset"),false);
});

test("reduced motion removes every moving effect but keeps the reward information and sound choice",()=>{
  const p=victory.plan({reducedMotion:true,newlyCompleted:true,coins:63,soundEnabled:true});
  assert.equal(p.motion,false);assert.deepEqual([p.confetti,p.coins,p.dollars,p.durationMs],[0,0,0,0]);
  assert.equal(p.sound,true,"a single quiet chime is not motion");
  assert.equal(victory.plan({reducedMotion:true,soundEnabled:false}).sound,false);
  assert.equal(victory.prefersReducedMotion({matchMedia:q=>({matches:q==="(prefers-reduced-motion: reduce)"})}),true);
  assert.equal(victory.prefersReducedMotion({matchMedia:()=>({matches:false})}),false);
  assert.equal(victory.prefersReducedMotion({}),false);
  assert.equal(victory.prefersReducedMotion({matchMedia:()=>{throw new Error("x")}}),false);
  assert.match(read("word-game.css"),/@media\(prefers-reduced-motion:reduce\)\{\.vc-layer\{display:none\}/);
  assert.match(read("app.js"),/function celebrate\(\)\{\}/,"the shared win hook remains safe but no longer creates confetti");
});

test("the completion announcement states the actual coins and XP",()=>{
  assert.equal(victory.announcement({coins:35,xp:8}),"Puzzle solved! You earned 35 coins and 8 XP.");
  assert.equal(victory.announcement({coins:1,xp:0}),"Puzzle solved! You earned 1 coin and 0 XP.");
  assert.equal(victory.announcement({coins:0,xp:0,newlyCompleted:false}),"Puzzle solved again. You earned 0 coins and 0 XP.");
  assert.equal(victory.announcement({coins:35,xp:8,soundKind:"level"}),"Level complete! You earned 35 coins and 8 XP.");
  assert.equal(victory.announcement({coins:35,xp:8,soundKind:"world"}),"World complete! You earned 35 coins and 8 XP.");
});

test("the sound preference defaults on, persists, and fails safely when storage is blocked",()=>{
  const storage=fakeStorage();
  assert.equal(victory.loadSoundEnabled(storage),true);
  assert.equal(victory.saveSoundEnabled(storage,false),true);
  assert.deepEqual(storage.writes,[["finlitQuest.victorySound","off"]],"only the dedicated key is written; no save data is touched");
  assert.equal(victory.loadSoundEnabled(storage),false);
  victory.saveSoundEnabled(storage,true);
  assert.equal(victory.loadSoundEnabled(storage),true);
  const blocked=fakeStorage({},{throws:true});
  assert.equal(victory.loadSoundEnabled(blocked),true);
  assert.equal(victory.saveSoundEnabled(blocked,false),false);
  assert.equal(victory.SOUND_KEY,"finlitQuest.victorySound");
});

test("sound volume defaults to the established level, persists, clamps safely, and uses a dedicated key",()=>{
  const storage=fakeStorage();
  assert.equal(victory.DEFAULT_VOLUME,90);
  assert.equal(victory.loadSoundVolume(storage),90);
  assert.equal(victory.saveSoundVolume(storage,40),true);
  assert.equal(victory.loadSoundVolume(storage),40);
  assert.deepEqual(storage.writes,[["finlitQuest.soundVolume","40"]]);
  victory.saveSoundVolume(storage,150);assert.equal(victory.loadSoundVolume(storage),100);
  victory.saveSoundVolume(storage,-10);assert.equal(victory.loadSoundVolume(storage),0);
  assert.equal(victory.clampVolume("bad"),90);
  const blocked=fakeStorage({},{throws:true});
  assert.equal(victory.loadSoundVolume(blocked),90);
  assert.equal(victory.saveSoundVolume(blocked,50),false);
  assert.equal(victory.VOLUME_KEY,"finlitQuest.soundVolume");
});

test("music volume has an independent persistent preference",()=>{
  const storage=fakeStorage();
  assert.equal(victory.DEFAULT_MUSIC_VOLUME,28);
  assert.equal(victory.loadMusicVolume(storage),28);
  assert.equal(victory.saveMusicVolume(storage,35),true);
  assert.equal(victory.loadMusicVolume(storage),35);
  assert.deepEqual(storage.writes,[["finlitQuest.musicVolume","35"]]);
  const blocked=fakeStorage({},{throws:true});
  assert.equal(victory.loadMusicVolume(blocked),28);
  assert.equal(victory.saveMusicVolume(blocked,20),false);
  assert.equal(victory.MUSIC_VOLUME_KEY,"finlitQuest.musicVolume");
});

test("background music mute has its own persistent preference and never changes effect sound",()=>{
  const storage=fakeStorage();
  assert.equal(victory.loadMusicEnabled(storage),true,"music defaults on");
  assert.equal(victory.saveMusicEnabled(storage,false),true);
  assert.equal(victory.loadMusicEnabled(storage),false);
  assert.equal(victory.loadSoundEnabled(storage),true,"effects remain enabled");
  assert.deepEqual(storage.writes,[["finlitQuest.musicEnabled","off"]]);
  assert.equal(victory.saveMusicEnabled(storage,true),true);
  assert.equal(victory.loadMusicEnabled(storage),true);
  const blocked=fakeStorage({},{throws:true});
  assert.equal(victory.loadMusicEnabled(blocked),true);
  assert.equal(victory.saveMusicEnabled(blocked,false),false);
  assert.equal(victory.MUSIC_ENABLED_KEY,"finlitQuest.musicEnabled");
});

test("the controller drives the injected audio: it plays only for a new, unmuted completion and stops on skip",()=>{
  const make=(storage,audio)=>victory.createController({document:fakeDocument(),window:{innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false})},storage,audio,setTimer:()=>1,clearTimer:()=>{}});
  const spy=()=>{const calls=[];return{calls,play:o=>{calls.push(["play",o.pings]);return true},stop:()=>calls.push(["stop"]),reset:()=>calls.push(["reset"])}};
  const on=spy(),c1=make(fakeStorage(),on);
  c1.start({coins:140,xp:20,newlyCompleted:true});
  assert.deepEqual(on.calls.filter(call=>call[0]==="play"),[["play",7]],"one grand jackpot per new completion, sized to the coin cascade");
  c1.skip();
  assert.ok(on.calls.some(call=>call[0]==="stop"),"skipping stops the audio");
  const muted=spy();make(fakeStorage({[victory.SOUND_KEY]:"off"}),muted).start({coins:140,newlyCompleted:true});
  assert.equal(muted.calls.filter(call=>call[0]==="play").length,0,"muted: nothing plays");
  const replay=spy();make(fakeStorage(),replay).start({coins:140,newlyCompleted:false});
  assert.equal(replay.calls.filter(call=>call[0]==="play").length,0,"a replay is silent");
  const none=make(fakeStorage(),null);
  assert.equal(none.start({coins:35,xp:8,newlyCompleted:true}).running,true,"without an audio engine the celebration still runs, silently");
});

test("the controller forwards crossword, level, and world sound tiers without touching rewards",()=>{
  const played=[];const audio={play:options=>played.push(options),stop(){},reset(){}};
  const controller=victory.createController({document:fakeDocument(),window:{innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false})},storage:fakeStorage(),audio,setTimer:()=>1,clearTimer:()=>{}});
  controller.start({coins:80,xp:12,newlyCompleted:true,soundKind:"level"});
  controller.start({coins:80,xp:12,newlyCompleted:true,soundKind:"world"});
  assert.deepEqual(played.map(item=>item.soundKind),["level","world"]);
  assert.ok(played.every(item=>Number.isInteger(item.pings)&&item.pings>0));
});

test("a failing audio engine never breaks the celebration",()=>{
  const broken={play(){throw new Error("no audio")},stop(){throw new Error("no audio")},reset(){throw new Error("no audio")}};
  const controller=victory.createController({document:fakeDocument(),window:{innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false})},storage:fakeStorage(),audio:broken,setTimer:()=>1,clearTimer:()=>{}});
  assert.equal(controller.start({coins:35,xp:8,newlyCompleted:true}).running,true);
  assert.doesNotThrow(()=>controller.skip());
});

test("the effects layer is aria-hidden, bounded, aims coins at the balance, and removes itself",()=>{
  const doc=fakeDocument(),timers=[];
  const controller=victory.createController({document:doc,window:{innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false})},storage:fakeStorage({[victory.SOUND_KEY]:"off"}),setTimer:(fn,ms)=>{timers.push({fn,ms});return timers.length},clearTimer:()=>{}});
  let done=0;
  const result=controller.start({coins:140,xp:20,newlyCompleted:true,from:rect(190,500),to:rect(20,40,60,30),onDone:()=>{done++}});
  assert.equal(result.running,true);assert.equal(controller.isRunning(),true);
  const layer=doc.body.children[0];
  assert.equal(layer.className,"vc-layer");assert.equal(layer.attrs["aria-hidden"],"true");
  const kinds=name=>layer.children.filter(n=>n.className===name);
  assert.equal(kinds("vc-confetti").length,0,"the completion layer creates no confetti");
  assert.equal(kinds("vc-coin").length,result.plan.coins);
  assert.equal(kinds("vc-dollar").length,result.plan.dollars);
  assert.ok(layer.children.length<=70,"lightweight");
  assert.ok(kinds("vc-dollar").every(n=>n.textContent==="$"));
  const coin=kinds("vc-coin")[0].style.styles;
  assert.equal(coin["--tx"],`${50-200}px`);assert.equal(coin["--ty"],`${55-510}px`,"each coin flies from the reward to the coin balance");
  assert.equal(timers.at(-1).ms,victory.DURATION_MS);
  timers.at(-1).fn();
  assert.equal(layer.removed,true);assert.equal(controller.isRunning(),false);assert.equal(done,1);
});

test("starting again never stacks layers, and skipping removes the effects immediately",()=>{
  const doc=fakeDocument();
  const controller=victory.createController({document:doc,window:{innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false})},storage:fakeStorage({[victory.SOUND_KEY]:"off"}),setTimer:()=>1,clearTimer:()=>{}});
  controller.start({coins:35,newlyCompleted:true});
  controller.start({coins:35,newlyCompleted:true});
  assert.equal(doc.body.children.length,1,"the first layer was removed before the second was drawn");
  assert.equal(controller.skip(),true);
  assert.equal(doc.body.children.length,0);
  assert.equal(controller.isRunning(),false);
  assert.equal(controller.skip(),false,"skipping when idle is harmless");
});

test("reduced motion draws no layer at all",()=>{
  const doc=fakeDocument();
  const win={innerWidth:400,innerHeight:800,matchMedia:()=>({matches:true})};
  const controller=victory.createController({document:doc,window:win,storage:fakeStorage({[victory.SOUND_KEY]:"off"}),setTimer:()=>1,clearTimer:()=>{}});
  let done=0;
  const result=controller.start({coins:140,xp:20,newlyCompleted:true,onDone:()=>{done++}});
  assert.equal(result.running,false);assert.equal(doc.body.children.length,0);assert.equal(done,1);
  assert.equal(result.announcement,"Puzzle solved! You earned 140 coins and 20 XP.","information stays available without animation");
});

test("the celebration module cannot change rewards: it has no access to saves or reward code",()=>{
  const source=read("src/victory-celebration.js");
  ["learning","FinLitLearning","FinLitPuzzleBank","answerReward","player.coins","player.xp","spendCoins","persist("].forEach(token=>assert.ok(!source.includes(token),`module must not reference ${token}`));
  assert.ok(!/\bcoins\s*[+\-*]?=(?!=)/.test(source.replace(/coins=0/g,"")),"no assignment to a coin balance");
  assert.ok(!/localStorage/.test(source),"storage is injected, only the sound key is written");
});

test("confetti is removed from ordinary wins and puzzle completion while coins and dollars remain",()=>{
  const ordinary=read("app.js"),module=read("src/victory-celebration.js"),css=read("word-game.css")+read("premium.css");
  assert.ok(!/createElement\("i"\)[\s\S]*className="confetti"/.test(ordinary));
  assert.ok(!/piece\("vc-confetti"/.test(module));
  assert.ok(!/\.vc-confetti|\.confetti\s*\{|@keyframes vcFall|@keyframes confettiFall/.test(css));
  assert.match(module,/piece\("vc-coin"/);assert.match(module,/piece\("vc-dollar"/);
});

test("the game wires the celebration after rewards are granted, once per puzzle, and only for a new completion",()=>{
  const app=read("word-game-app.js");
  assert.match(app,/wgState\.completedBefore = wgCanonicalRecord\(puzzle\)\.timesCompleted > 0/,"replay detection follows canonical completion across worlds");
  assert.match(app,/if \(wgState\.found\.size < wgState\.words\.length\) celebrate\(\);/,"the per-word confetti no longer doubles up on the final word");
  assert.match(app,/function wgStartVictory\(\) \{\s*if \(wgState\.victoryShown\) return;\s*wgState\.victoryShown = true;/,"once per puzzle render");
  assert.match(app,/newlyCompleted = !wgState\.completedBefore/);
  assert.match(app,/coins: wgState\.puzzleCoins, xp: wgState\.puzzleXp/,"the animation is handed the actual earned amounts");
  const start=app.indexOf("function wgStartVictory()"),end=app.indexOf("\n}\n",start);
  const body=app.slice(start,end);
  assert.ok(!/learning\.save|\.coins\s*\+?=|\.xp\s*\+?=|answerReward/.test(body),"wgStartVictory grants nothing");
  const found=app.slice(app.indexOf("function wgFoundWord"),app.indexOf("function wgShowPuzzleComplete"));
  assert.equal((found.match(/canonicalAnswerReward\(/g)||[]).length,1,"rewards are computed in one place, before any celebration");
  assert.ok(found.indexOf("answerReward(")<found.indexOf("wgShowPuzzleComplete()"));
  assert.match(app,/function wgContinueAfterComplete\(\) \{\s*wgSkipVictory\(\);/,"continuing never waits for the animation");
  assert.match(app,/event\.key === "Escape" && wgVictory\.isRunning\(\)/,"Escape skips the animation");
});

test("new financial terms receive the compact coin celebration without changing rewards or double-celebrating the final word",()=>{
  const app=read("word-game-app.js"),fn=app.slice(app.indexOf("function wgCelebrateFinancialTerm"),app.indexOf("// Victory celebration"));
  assert.match(fn,/completesPuzzle \|\| !reward\.isNewSolve \|\| !wgIsFinancialCategory\(reward\.category\) \|\| reward\.coins <= 0/);
  assert.match(fn,/kind: "term"/);assert.match(fn,/coins: reward\.coins/);
  assert.ok(!/learning\.save|\.coins\s*\+?=|\.xp\s*\+?=|answerReward/.test(fn),"term animation grants nothing");
  const found=app.slice(app.indexOf("function wgFoundWord"),app.indexOf("function wgPlayFoundSound"));
  assert.ok(found.indexOf("answerReward(")<found.indexOf("wgCelebrateFinancialTerm(reward)"));
});

test("the completion panel exposes the announcement, skip, mute, and an accessible volume control",()=>{
  const html=read("index.html");
  assert.match(html,/id="wgCompleteAnnouncement" role="status" aria-live="polite"/);
  assert.match(html,/<button type="button" class="wg-btn-ghost" id="wgCelebrateSkip" hidden>Skip animation<\/button>/);
  assert.match(html,/<button type="button" class="wg-btn-ghost" id="wgSoundToggle" aria-pressed="true">/);
  assert.match(html,/id="wgCompleteVolumeSlider"[^>]*aria-label="Effects volume"/);
  assert.match(html,/id="wgCompleteMusicVolumeSlider"[^>]*aria-label="Music volume"/);
  assert.match(html,/src\/victory-celebration\.js\?v=\d+/);
  assert.match(read("scripts/build-www.sh"),/src\/victory-celebration\.js/,"the module ships in the iOS bundle");
  assert.match(read("word-game.css"),/\.vc-layer\{[^}]*pointer-events:none/,"effects never block taps");
  assert.match(read("word-game.css"),/@media\(max-height:640px\)[\s\S]*\.wg-celebrate-controls\{order:4[^}]*\}[\s\S]*\.wg-complete-volume\{order:4\}/,"on very short screens the volume row stays beside the Sound controls instead of moving above the title");
});

test("while dragging, the wheel never tells the player to tap the last letter; lifting off the last letter submits",()=>{
  const app=read("word-game-app.js");
  assert.match(app,/const deferred = !wgPointerDown && FinLitWheelInteraction\.isDeferredTarget\(/,"the retap hint is for tapped words only");
  assert.match(app,/const shouldSubmit = wgState\.selected\.length > 1 && wgGestureLetters > 1/,"a drag of two or more letters submits on pointer-up");
});

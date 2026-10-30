// Phase 6 gameplay audio. A fake AudioContext records every voice so the tests can prove pitch climb,
// durations, gain caps, no overlapping jackpots, mute/autoplay behaviour and graceful fallback.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
const audio=require("../src/game-audio.js");

const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

function fakeWindow({state="running",throwOn=null}={}){
  const log={contexts:0,oscillators:[],gains:[],closed:0,resumed:0,buses:[],mediaSources:0};
  class Ctx{
    constructor(){if(throwOn==="construct")throw new Error("no audio");log.contexts++;log.ctx=this;this.currentTime=0;this.state=state;this.destination={}}
    resume(){log.resumed++;this.state="running";return Promise.resolve()}
    close(){log.closed++}
    createGain(){
      const g={peak:0,value:1,gain:{value:1,cancelled:false,rampedToZero:false,setValueAtTime(v){if(typeof v==="number")g.peak=Math.max(g.peak,v)},linearRampToValueAtTime(v){g.peak=Math.max(g.peak,v);if(v===0)g.gain.rampedToZero=true},exponentialRampToValueAtTime(){},cancelScheduledValues(){g.gain.cancelled=true}},connect(){}};
      log.gains.push(g);return g;
    }
    createDynamicsCompressor(){return{threshold:{},ratio:{},connect(){}}}
    createBiquadFilter(){return{type:"",frequency:{},connect(){}}}
    createMediaElementSource(){log.mediaSources++;return{connect(){}}}
    createOscillator(){
      if(throwOn==="oscillator")throw new Error("boom");
      const o={type:"",frequency:{value:0,setValueAtTime(v){o.freq=v},exponentialRampToValueAtTime(v){o.endFreq=v}},connect(){},start(t){o.startAt=t},stop(t){o.stopAt=t}};
      log.oscillators.push(o);return o;
    }
  }
  return{win:{AudioContext:Ctx},log};
}
function engine(options={}){
  const {win,log}=fakeWindow(options.win||{});
  const api=audio.create({window:win,isEnabled:options.isEnabled||(()=>true),getVolume:options.getVolume||(()=>audio.DEFAULT_VOLUME)});
  return{api,log,win};
}
function musicEngine(options={}){
  const {win,log}=fakeWindow(options.win||{});const intervals=[];const cleared=[];
  const api=audio.create({
    window:win,isEnabled:options.isEnabled||(()=>true),getVolume:options.getVolume||(()=>audio.DEFAULT_VOLUME),
    getMusicVolume:options.getMusicVolume||(()=>audio.DEFAULT_MUSIC_VOLUME),
    setIntervalFn:(callback,delay)=>{intervals.push({callback,delay});return intervals.length},
    clearIntervalFn:id=>cleared.push(id),
  });
  return{api,log,intervals,cleared};
}
const span=log=>Math.max(...log.oscillators.map(o=>o.stopAt))-Math.min(...log.oscillators.map(o=>o.startAt));
const firstFreqs=log=>log.oscillators.filter(o=>o.type==="triangle").map(o=>o.freq);

test("nothing plays and no AudioContext exists until the player has interacted",()=>{
  const {api,log}=engine();
  assert.equal(api.letter(1),false);assert.equal(api.correct("ordinary"),false);assert.equal(api.miniJackpot(),false);assert.equal(api.grandJackpot(),false);
  assert.equal(log.contexts,0,"no context before a gesture (browser autoplay rules)");
  assert.equal(api.isUnlocked(),false);
  assert.equal(api.unlock(),true);
  assert.equal(log.contexts,1);assert.equal(api.isUnlocked(),true);
  assert.equal(api.letter(1),true);
});

test("a suspended context (iOS Safari / WKWebView) is resumed inside the gesture",()=>{
  const {api,log}=engine({win:{state:"suspended"}});
  api.unlock();
  assert.equal(log.resumed,1);
});

test("mute: nothing plays and no context is created, even after a gesture; unmuting works again",()=>{
  let on=false;
  const {api,log}=engine({isEnabled:()=>on});
  assert.equal(api.unlock(),false);
  ["letter","correct","wrong","duplicate","miniJackpot","grandJackpot"].forEach(name=>assert.equal(api[name](1),false,name));
  assert.equal(log.contexts,0);
  on=true;
  assert.equal(api.letter(1),true,"sound returns as soon as the preference is on");
  on=false;
  assert.equal(api.letter(2),false,"muting takes effect on the very next sound");
});

test("volume is adjustable, clamped, and applied to every sound without recreating the context",()=>{
  let volume=.4;
  const {api,log}=engine({getVolume:()=>volume});
  api.unlock();
  assert.equal(log.gains[0].gain.value,.4,"saved volume initializes the master output");
  api.letter(1);
  volume=.7;api.correct("ordinary");
  assert.equal(log.gains[0].gain.value,.7,"the current preference is applied before the next sound");
  assert.equal(api.setVolume(.2),.2);assert.equal(log.gains[0].gain.value,.2,"a slider change applies immediately, including mid-jackpot");
  assert.equal(api.setVolume(5),1);assert.equal(api.setVolume(-1),0,"out-of-range values are clamped safely");
  assert.equal(api.setVolume("bad"),audio.DEFAULT_VOLUME,"invalid values fall back safely");
  assert.equal(log.contexts,1,"volume changes reuse the existing AudioContext");
});

test("each connected letter is one short metallic click and the pitch climbs with every letter",()=>{
  const freqs=[];
  for(let n=1;n<=9;n++){
    const {api,log}=engine();api.unlock();api.letter(n);
    freqs.push(firstFreqs(log)[0]);
    assert.equal(log.oscillators.length,3,"body plus two metallic partials");
    assert.ok(span(log)<.13,`click ${n} is short (${span(log).toFixed(3)} s)`);
  }
  freqs.forEach((f,i)=>{if(i)assert.ok(f>freqs[i-1],`letter ${i+1} is higher than letter ${i}`)});
  assert.ok(freqs[8]/freqs[0]<3.3,"the climb is gentle (under about a twelfth)");
  assert.ok(Math.abs(freqs[0]-audio.LETTER_BASE_HZ)<1);
  assert.equal(audio.letterFrequency(99),audio.letterFrequency(audio.LETTER_STEPS.length),"the pitch is capped");
  assert.equal(audio.letterFrequency(0),audio.letterFrequency(1));
});

test("one click per call: repeated calls make repeated clicks, and the engine adds none of its own",()=>{
  const {api,log}=engine();api.unlock();
  api.letter(1);const one=log.oscillators.length;
  api.letter(2);api.letter(3);
  assert.equal(log.oscillators.length,one*3);
});

test("background music waits for unlock, loops once, and never restarts between words or puzzles",()=>{
  const {api,log,intervals}=musicEngine();
  assert.equal(api.startMusic(),false,"autoplay rules block music before a gesture");
  assert.equal(log.contexts,0);
  assert.equal(api.unlock(),true,"the real gesture unlock starts requested music");
  assert.equal(api.isMusicPlaying(),true);
  assert.equal(intervals.length,1);assert.equal(intervals[0].delay,audio.MUSIC_BEAT_MS);
  const voicesAfterFirstBeat=log.oscillators.length;
  api.letter(1);api.correct("ordinary");api.startMusic();api.startMusic();
  assert.equal(intervals.length,1,"word results and repeated puzzle starts keep the original loop");
  assert.equal(log.contexts,1,"music and effects share one AudioContext");
  intervals[0].callback();
  assert.ok(log.oscillators.length>voicesAfterFirstBeat,"the next background beat is scheduled");
});

test("a future licensed soundtrack drops into the same seamless music bus without changing gameplay",()=>{
  const {win,log}=fakeWindow();let played=0,paused=0;
  const track={src:"",loop:false,preload:"",crossOrigin:"",play(){played++;return Promise.resolve()},pause(){paused++}};
  const intervals=[];
  const api=audio.create({window:win,musicUrl:"assets/audio/finlit-quest-theme.m4a",createAudioElement:()=>track,setIntervalFn:callback=>{intervals.push(callback);return 1},clearIntervalFn:()=>{}});
  api.unlock();assert.equal(api.startMusic(),true);
  assert.equal(api.musicMode(),"licensed");assert.equal(track.src,"assets/audio/finlit-quest-theme.m4a");assert.equal(track.loop,true);assert.equal(track.preload,"auto");
  assert.equal(played,1);assert.equal(log.mediaSources,1);assert.equal(intervals.length,0,"licensed playback replaces, rather than layers over, the synth loop");
  api.startMusic();assert.equal(played,1,"game and level transitions never restart the licensed track");
  api.stopMusic();assert.equal(paused,1);
});

test("music has an independent saved-volume input and can pause without disabling effects",()=>{
  let musicVolume=.28;const {api,log,intervals,cleared}=musicEngine({getMusicVolume:()=>musicVolume});
  api.unlock();api.startMusic();
  assert.equal(log.gains[1].gain.value,.28,"music uses its own master bus");
  musicVolume=.12;assert.equal(api.setMusicVolume(.12),.12);assert.equal(log.gains[1].gain.value,.12);
  assert.equal(api.setMusicVolume(0),0);assert.equal(api.isMusicPlaying(),false);assert.deepEqual(cleared,[1]);
  const before=log.oscillators.length;api.letter(2);assert.ok(log.oscillators.length>before,"effects remain available when music is at zero");
  musicVolume=.2;api.setMusicVolume(.2);assert.equal(api.isMusicPlaying(),true);assert.equal(intervals.length,2,"raising music above zero resumes the requested loop");
  api.stopMusic();assert.equal(api.isMusicPlaying(),false);assert.equal(api.letter(3),true,"leaving gameplay stops music, not effects");
});

test("background voices stay quiet and do not consume the rapid-swipe effects voice cap",()=>{
  const {api,log,intervals}=musicEngine();api.unlock();api.startMusic();
  for(let i=0;i<20;i++)intervals[0].callback();
  assert.ok(log.gains[1].gain.value<=audio.DEFAULT_MUSIC_VOLUME,"the music master remains below effects volume");
  const before=log.oscillators.length;assert.equal(api.letter(1),true);assert.equal(log.oscillators.length,before+3,"letter feedback remains immediate after many music beats");
});

test("word feedback tiers are distinct and soft",()=>{
  const sig=name=>{const {api,log}=engine();api.unlock();api[name](name==="correct"?"x":undefined);return log};
  const ordinary=(()=>{const {api,log}=engine();api.unlock();api.correct("ordinary");return log})();
  const financial=(()=>{const {api,log}=engine();api.unlock();api.correct("financial");return log})();
  const wrong=sig("wrong"),duplicate=sig("duplicate");
  assert.notDeepEqual(ordinary.oscillators.map(o=>o.freq),financial.oscillators.map(o=>o.freq),"financial chime differs from the confirmation");
  assert.ok(financial.oscillators.length>ordinary.oscillators.length,"the financial chime is richer");
  assert.ok(span(ordinary)<.4&&span(financial)<.8&&span(wrong)<.25&&span(duplicate)<.12);
  const loudest=log=>Math.max(...log.gains.map(g=>g.peak));
  assert.ok(loudest(wrong)<=.04&&loudest(duplicate)<=.03,"wrong and duplicate are soft");
  assert.ok(wrong.oscillators[0].endFreq<wrong.oscillators[0].freq,"wrong falls gently rather than rising like a win");
});

test("coin, crossword, level, and world rewards have distinct bounded cues",()=>{
  const sound=name=>{const {api,log}=engine();api.unlock();api[name]({coins:8});return log};
  const coin=sound("coinReward"),crossword=sound("grandJackpot"),level=sound("levelComplete"),world=sound("worldComplete");
  assert.ok(span(coin)<.4,"coin reward stays compact");
  assert.ok(span(crossword)>=2&&span(crossword)<=3);
  assert.ok(span(level)>=1.8&&span(level)<=2.4);
  assert.ok(span(world)>=2.5&&span(world)<=3);
  const signatures=[coin,crossword,level,world].map(log=>log.oscillators.map(o=>`${o.type}:${Math.round(o.freq)}`).join("|"));
  assert.equal(new Set(signatures).size,4,"every progression event has its own composition");
  [coin,crossword,level,world].forEach(log=>assert.ok(Math.max(...log.gains.map(g=>g.peak))<=audio.MAX_GAIN+1e-9));
});

test("the key-term mini jackpot lasts about 1 to 1.5 seconds and is bigger than a financial chime",()=>{
  const {api,log}=engine();api.unlock();api.miniJackpot();
  const length=Math.max(...log.oscillators.map(o=>o.stopAt));
  assert.ok(length>=1&&length<=1.5,`mini jackpot length ${length.toFixed(2)} s`);
  const chime=(()=>{const e=engine();e.api.unlock();e.api.correct("financial");return e.log})();
  assert.ok(log.oscillators.length>chime.oscillators.length*4,"many more voices: chime, flourish and a coin cascade");
  assert.ok(log.oscillators.some(o=>o.endFreq>o.freq*2),"it includes a rising flourish sweep");
});

test("the grand jackpot lasts about 2 to 3 seconds: anticipation, fanfare, coin cascade, final chime",()=>{
  const {api,log}=engine();api.unlock();api.grandJackpot({coins:12});
  const length=Math.max(...log.oscillators.map(o=>o.stopAt));
  assert.ok(length>=2&&length<=3,`grand jackpot length ${length.toFixed(2)} s`);
  const mini=(()=>{const e=engine();e.api.unlock();e.api.miniJackpot();return e.log})();
  assert.ok(log.oscillators.length>mini.oscillators.length,"bigger than the mini jackpot");
  assert.ok(log.oscillators.some(o=>o.type==="sawtooth"),"fanfare voices");
  const finalChime=log.oscillators.filter(o=>o.stopAt>=2.5);
  assert.ok(finalChime.length>=3&&finalChime.every(o=>o.freq>=2000),"a bright, sustained final chime closes the sequence");
  assert.ok(length>=2.6,"the sequence runs to its final chime");
  const few=(()=>{const e=engine();e.api.unlock();e.api.grandJackpot({coins:0});return e.log})();
  assert.ok(few.oscillators.length>=mini.oscillators.length/2&&few.oscillators.length<log.oscillators.length+1,"a small coin cascade is still a full jackpot, just a shorter cascade");
  assert.ok(Math.max(...few.oscillators.map(o=>o.stopAt))>=2,"it still runs its full length");
});

test("jackpots never overlap: a mini cannot start during a grand, a grand replaces a running mini, and two minis do not stack",()=>{
  const {api,log,win}=engine();api.unlock();
  assert.equal(api.miniJackpot(),true);
  const miniVoices=log.oscillators.length;
  assert.equal(api.miniJackpot(),false,"a second mini while one is playing is ignored");
  assert.equal(log.oscillators.length,miniVoices);
  const miniBus=log.gains.find(g=>g.gain.rampedToZero===false&&g.peak>0);
  assert.equal(api.grandJackpot({coins:8}),true,"a grand takes over");
  assert.ok(log.gains.some(g=>g.gain.cancelled&&g.gain.rampedToZero),"the running mini is faded out");
  const after=log.oscillators.length;
  assert.equal(api.miniJackpot(),false,"a mini during a grand is refused");
  assert.equal(log.oscillators.length,after);
  assert.equal(api.grandJackpot({coins:8}),false,"a running grand is never restarted or stacked");
  assert.ok(miniBus);
});

test("a jackpot can start again once the previous one has ended",()=>{
  const {api,log}=engine();api.unlock();
  assert.equal(api.grandJackpot(),true);
  assert.equal(api.isRunningJackpot(),true);
  log.ctx.currentTime=1;assert.equal(api.grandJackpot(),false,"still running at 1 s");
  log.ctx.currentTime=3;assert.equal(api.isRunningJackpot(),false,"finished after its 2.65 s");
  assert.equal(api.miniJackpot(),true,"a new jackpot may start");
  log.ctx.currentTime=3.2;assert.equal(api.miniJackpot(),false);
  log.ctx.currentTime=5;assert.equal(api.miniJackpot(),true);
});

test("stopJackpots fades the running sequence (Skip) while stop closes the context (mute)",()=>{
  const {api,log}=engine();api.unlock();api.grandJackpot();
  api.stopJackpots();
  assert.ok(log.gains.some(g=>g.gain.rampedToZero),"Skip fades the jackpot out");
  assert.equal(log.closed,0,"the context stays for the next sound");
  api.stop();
  assert.equal(log.closed,1);
  assert.equal(api.isRunningJackpot(),false);
});

test("loudness is capped on every voice, and clicks never pile up on top of a long sequence",()=>{
  const {api,log}=engine();api.unlock();
  api.grandJackpot({coins:12});api.miniJackpot();api.correct("financial");api.wrong();
  assert.ok(Math.max(...log.gains.map(g=>g.peak))<=audio.MAX_GAIN+1e-9,"no voice exceeds the gain cap");
  assert.ok(audio.MAX_GAIN<=.07);
  const crowded=engine();crowded.api.unlock();
  for(let i=0;i<60;i++)crowded.api.letter(1+i%9);
  assert.ok(crowded.log.oscillators.length<=(audio.MAX_VOICES+4)*1.2+3,`the voice cap holds (${crowded.log.oscillators.length})`);
});

test("audio is optional: no AudioContext, a throwing constructor or a throwing oscillator never throws or blocks",()=>{
  const none=audio.create({window:{}});
  assert.equal(none.unlock(),false);
  ["letter","correct","wrong","duplicate","cancel","coinReward","miniJackpot","grandJackpot","levelComplete","worldComplete","startMusic","stopMusic","stop","stopJackpots"].forEach(name=>assert.doesNotThrow(()=>none[name](1),name));
  const broken=engine({win:{throwOn:"construct"}});
  assert.doesNotThrow(()=>{broken.api.unlock();broken.api.letter(1);broken.api.grandJackpot()});
  const boom=engine({win:{throwOn:"oscillator"}});boom.api.unlock();
  assert.equal(boom.api.letter(1),false);
  assert.equal(boom.api.grandJackpot(),false);
  assert.doesNotThrow(()=>audio.create({window:null}).letter(1));
  const throwingPref=audio.create({window:fakeWindow().win,isEnabled:()=>{throw new Error("storage blocked")}});
  assert.equal(throwingPref.unlock(),true,"a blocked preference falls back to sound on");
});

test("the audio module is presentation only: no access to rewards, saves or storage",()=>{
  const source=read("src/game-audio.js");
  ["learning","FinLitLearning","FinLitPuzzleBank","answerReward","player.coins","player.xp","localStorage","persist(","spendCoins"].forEach(token=>assert.ok(!source.includes(token),`must not reference ${token}`));
  assert.ok(!/fetch\(|XMLHttpRequest|new Audio\(|\.mp3|\.wav|\.ogg/.test(source),"synthesized only: no files and no network");
});

// ---------- wiring in the game ----------
const app=read("word-game-app.js");

test("a click plays for each newly added letter only, so hovering the same letter is silent",()=>{
  assert.match(app,/if \(transition\.action === "added"\) \{ wgGestureLetters\+\+; wgAudio\.letter\(wgState\.selected\.length\); \}/);
  const fn=app.slice(app.indexOf("function wgAddLetter"),app.indexOf("function wgUpdateSelection"));
  assert.equal((fn.match(/wgAudio\./g)||[]).length,1,"exactly one audio call per added letter");
  assert.match(fn,/if \(transition\.action === "ignored"\) return;/,"an ignored (same or already selected) letter returns before any sound");
  assert.match(fn,/transitionSelection/);
});

test("tap, swipe and keyboard all reach the same single sound path",()=>{
  const pointer=app.slice(app.indexOf("function wgBeginPointer"),app.indexOf("function wgCancelPointer"));
  assert.ok(!/wgAudio/.test(pointer),"pointer handlers add no sound of their own; they call wgSyncGesture");
  assert.match(pointer,/wgSyncGesture\(events\)/,"pointer down goes through wgSyncGesture, the one place swipe sounds are triggered");
  const processor=app.slice(app.indexOf("function wgProcessPointerPosition"),app.indexOf("function wgRequestPaint"));
  assert.match(processor,/wgSyncGesture\(wgGesture\.advance\(point\)\)/,"all swept swipe hits go through the same wgSyncGesture path");
  assert.match(app,/wgWheelElement\.addEventListener\("click",[\s\S]{0,200}wgAddLetter\(button\)/,"keyboard activation uses it too");
});

test("audio is unlocked only by a real player gesture",()=>{
  assert.match(app,/\["pointerdown", "keydown", "touchend"\]\.forEach\(type => document\.addEventListener\(type, \(\) => wgAudio\.unlock\(\), \{ capture: true, passive: true \}\)\)/);
  assert.ok(!/wgAudio\.unlock\(\)[\s\S]{0,40}(DOMContentLoaded|setTimeout|requestAnimationFrame)/.test(app));
});

test("wrong, duplicate and optional bonus words get neutral feedback and never a jackpot",()=>{
  const fn=app.slice(app.indexOf("function wgSubmitWord"),app.indexOf("function wgFoundWord"));
  assert.match(fn,/status === "duplicate"\) \{[^}]*wgAudio\.duplicate\(\)/);
  assert.match(fn,/status === "bonus"\)[\s\S]*?wgAudio\.duplicate\(\)/);
  assert.match(fn,/wgAudio\.wrong\(\)/);
  assert.ok(!/Jackpot/.test(fn),"submit never plays a jackpot");
  assert.equal((fn.match(/wgAudio\.duplicate\(\)/g)||[]).length,2,"duplicates and zero-reward bonus words share the brief neutral tick");
  assert.ok(!/wgAudio\.correct/.test(fn),"zero-reward bonus words never play a win sound");
});

test("sound tiers: completion fanfares only use the victory controller, mini only uses the key term, and other answers chime",()=>{
  const fn=app.slice(app.indexOf("function wgPlayFoundSound"),app.indexOf("function wgShowPuzzleComplete"));
  assert.match(fn,/if \(complete && fresh\) return;/,"the last word of a new completion plays nothing here: the grand jackpot starts once, so the key term as the last word never plays a mini first");
  assert.match(fn,/fresh && word === wgState\.puzzleModel\.anchorWord/);
  assert.equal((fn.match(/miniJackpot\(\)/g)||[]).length,1);
  assert.ok(!/grandJackpot/.test(fn),"the grand jackpot is never started from the per-word path");
  assert.match(fn,/wgAudio\.correct\(wgIsFinancialCategory\(reward\.category\) \? "financial" : "ordinary"\)/);
  assert.match(app,/world: wgAudio\.worldComplete,[\s\S]*level: wgAudio\.levelComplete,[\s\S]*crossword: wgAudio\.grandJackpot/,"the victory controller selects the progression tier");
  assert.equal((app.match(/wgAudio\.grandJackpot/g)||[]).length,2,"crossword is the explicit tier and safe fallback in one dispatcher");
  const found=app.slice(app.indexOf("function wgFoundWord"),app.indexOf("function wgPlayFoundSound"));
  assert.ok(found.indexOf("answerReward(")<found.indexOf("wgPlayFoundSound("),"the sound tier is chosen after the reward is computed and only reads it");
  assert.ok(!/learning\.save|\.coins\s*\+?=|\.xp\s*\+?=/.test(fn),"the sound path grants nothing");
  assert.match(fn,/reward\.isNewSolve && reward\.coins > 0\) wgAudio\.coinReward/,"a rewarded accepted word receives the compact coin cue");
});

test("level and world completion sounds derive from recorded progress without changing progress",()=>{
  const fn=app.slice(app.indexOf("function wgCompletionSoundKind"),app.indexOf("// A small coin flight"));
  assert.match(fn,/bank\.length && bank\.every\(completed\).*return "world"/s);
  assert.match(fn,/level\.length && level\.every\(completed\) \? "level" : "crossword"/);
  assert.ok(!/persist|recordPlaythrough|\.coins|\.xp/.test(fn),"tier detection is read-only");
  assert.match(app,/wgState\.completionSoundKind = wgCompletionSoundKind\(\)/,"tier is chosen only after completion is recorded");
  assert.match(app,/soundKind: wgState\.completionSoundKind/);
});

test("persistent mute and accessible volume controls stay synchronized in play and completion states",()=>{
  const html=read("index.html");
  assert.match(html,/id="wgSoundButton" aria-pressed="true" aria-label="Sound on"/);
  assert.match(html,/id="wgSoundToggle" aria-pressed="true"/);
  assert.match(html,/id="wgVolumeSlider" type="range" min="0" max="100" step="10" value="90" aria-label="Effects volume"/);
  assert.match(html,/id="wgCompleteVolumeSlider" type="range" min="0" max="100" step="10" value="90" aria-label="Effects volume"/);
  assert.match(html,/id="wgMusicVolumeSlider" type="range" min="0" max="100" step="1" value="28" aria-label="Music volume"/);
  assert.match(html,/id="wgCompleteMusicVolumeSlider" type="range" min="0" max="100" step="1" value="28" aria-label="Music volume"/);
  assert.match(html,/id="worldMapMusicToggle"[^>]*aria-label="Mute background music"/);
  assert.match(html,/id="wgMusicToggle"[^>]*aria-label="Mute background music"/);
  assert.match(app,/\$\("#wgSoundToggle"\)\.onclick = wgToggleSound;\s*\$\("#wgSoundButton"\)\.onclick = wgToggleSound;/);
  assert.match(app,/\$\("#wgVolumeSlider"\)\.oninput = wgSetSoundVolume;\s*\$\("#wgCompleteVolumeSlider"\)\.oninput = wgSetSoundVolume;/);
  assert.match(app,/\$\("#wgMusicVolumeSlider"\)\.oninput = wgSetMusicVolume;\s*\$\("#wgCompleteMusicVolumeSlider"\)\.oninput = wgSetMusicVolume;/);
  assert.match(app,/\$\("#worldMapMusicToggle"\)\.onclick = wgToggleMusic;\s*\$\("#wgMusicToggle"\)\.onclick = wgToggleMusic;/);
  assert.equal((app.match(/saveSoundEnabled\(/g)||[]).length,1,"the preference is written in exactly one place");
  assert.equal((app.match(/saveSoundVolume\(/g)||[]).length,1,"volume is written through one shared handler");
  assert.equal((app.match(/saveMusicVolume\(/g)||[]).length,1,"music volume is written through one shared handler");
  assert.equal((app.match(/saveMusicEnabled\(/g)||[]).length,1,"music mute is written through one shared handler");
  assert.match(app,/if \(!next\) \{ wgVictory\.stopSound\(\); wgAudio\.stop\(\); \}/,"muting cuts any playing sound at once");
  assert.match(app,/isEnabled: \(\) => FinLitVictory\.loadSoundEnabled\(localStorage\)/,"the engine reads the same preference the celebration uses");
  assert.match(app,/getVolume: \(\) => FinLitVictory\.loadSoundVolume\(localStorage\) \/ 100/);
  assert.match(app,/getMusicVolume: \(\) => FinLitVictory\.loadMusicEnabled\(localStorage\) \? FinLitVictory\.loadMusicVolume\(localStorage\) \/ 100 : 0/);
  assert.match(app,/wgAudio\.setVolume\(volume \/ 100\)/,"a slider change reaches the live master output immediately");
  assert.match(app,/wgAudio\.setMusicVolume\(FinLitVictory\.loadMusicEnabled\(localStorage\) \? volume \/ 100 : 0\)/,"music changes reach only the separate music output");
  assert.match(app,/function wgToggleMusic[\s\S]*?saveMusicEnabled[\s\S]*?setMusicVolume\(0\)/,"music-only mute cuts the music bus immediately");
  const musicToggle=app.slice(app.indexOf("function wgToggleMusic"),app.indexOf("function wgToggleSound"));
  assert.ok(!/saveSoundEnabled|setVolume\(/.test(musicToggle),"music mute cannot change effects preferences or volume");
});

test("music spans journey, level selection, words, puzzle changes and completion without restarting",()=>{
  assert.match(app,/function wgOpenWorld[\s\S]*?wgAudio\.startMusic\(\);\s*\}/);
  const render=app.slice(app.indexOf("function wgRenderPuzzle"),app.indexOf("function wgRenderGrid"));
  const submit=app.slice(app.indexOf("function wgSubmitWord"),app.indexOf("function wgShowPuzzleComplete"));
  const completion=app.slice(app.indexOf("function wgShowPuzzleComplete"),app.indexOf("// Victory celebration"));
  assert.ok(!/startMusic|stopMusic/.test(render),"rendering a new puzzle does not restart the music");
  assert.ok(!/startMusic|stopMusic/.test(submit),"word results do not restart the music");
  assert.ok(!/startMusic|stopMusic/.test(completion),"completion does not restart the music");
  assert.match(app,/window\.FinLitMusic = \{[\s\S]*?enterJourney\(\)[\s\S]*?wgAudio\.startMusic\(\)/);
  assert.match(read("app.js"),/function showWorldSelect\(\)[\s\S]{0,260}window\.FinLitMusic\?\.enterJourney\(\)/);
  assert.match(app,/function wgReturnToWorldSelect\(\) \{\s*showWorldSelect\(\);\s*\}/);
  assert.doesNotMatch(app,/function wgReturnToWorldSelect\(\) \{\s*wgAudio\.stopMusic/);
});

test("music toggle styling stays touch accessible on journey and gameplay screens",()=>{
  const journey=read("journey.css"),game=read("word-game.css");
  assert.match(journey,/\.music-toggle\{[^}]*width:44px[^}]*height:44px/);
  assert.match(journey,/\.music-toggle:focus-visible\{[^}]*outline:3px solid/);
  assert.match(journey,/\.music-toggle\.is-muted/);
  assert.match(game,/\.wg-topbar>\.wg-music-toggle/);
});

test("pointer, Escape, and clear-button cancellations resolve gently",()=>{
  assert.match(app,/function wgCancelPointer[\s\S]*?if \(hadSelection\) wgAudio\.cancel\(\)/);
  assert.match(app,/event\.key === "Escape"[\s\S]{0,180}wgAudio\.cancel\(\)/);
  assert.match(app,/\$\("#wgClearSelection"\)\.onclick[\s\S]{0,180}wgAudio\.cancel\(\)/);
});

test("the audio module ships in the page and the native bundle and loads before the game",()=>{
  const html=read("index.html");
  assert.ok(html.indexOf("src/game-audio.js")>0&&html.indexOf("src/game-audio.js")<html.indexOf("word-game-app.js"));
  assert.match(read("scripts/build-www.sh"),/src\/game-audio\.js/);
  assert.match(read("tests/bundle-parity.test.js"),/src\/game-audio\.js/);
  assert.match(html,/content\/audio-config\.js\?v=\d+/);
  assert.match(app,/musicUrl: window\.FINLIT_AUDIO_CONFIG\?\.musicTrackUrl \|\| ""/);
  assert.match(read("content/audio-config.js"),/musicTrackUrl:""/,"the unlicensed placeholder stays empty and the synth remains active");
});

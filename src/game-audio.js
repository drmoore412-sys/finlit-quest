(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitAudio=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // Original FinLit Quest game audio, synthesized with the Web Audio API (no files, no libraries, no server).
  // Presentation only: it never reads or writes a save and never touches rewards.
  //   letter(n)        a short metallic click that climbs a little with each connected letter
  //   correct(kind)    ordinary confirmation or a distinct financial chime
  //   wrong()/duplicate()/cancel()  soft, neutral feedback
  //   startMusic()     a quiet original loop that continues across words and puzzles
  //   coinReward()     a compact coin sparkle following an accepted rewarded word
  //   miniJackpot()    key financial term, about 1.3 s
  //   grandJackpot()   completed crossword, about 2.6 s, synchronized by the victory celebration
  //   levelComplete()/worldComplete() distinct progression fanfares
  // Nothing plays (and no AudioContext exists) until unlock() is called from a real player gesture, and
  // nothing plays while isEnabled() is false. Every call is wrapped so audio can never block gameplay.
  const MAX_GAIN=.07;
  const MAX_VOICES=30;
  const DEFAULT_VOLUME=.9;
  const DEFAULT_MUSIC_VOLUME=.28;
  const DURATIONS=Object.freeze({mini:1.3,grand:2.65,level:2.25,world:2.85});
  const JACKPOT_PRIORITY=Object.freeze({mini:1,grand:2,level:3,world:4});
  const MUSIC_BEAT_MS=500;
  const MUSIC_NOTES=Object.freeze([261.63,329.63,392,440,349.23,440,523.25,392]);
  const MUSIC_ROOTS=Object.freeze([130.81,130.81,146.83,146.83,174.61,174.61,196,196]);
  // Climbing steps for connected letters (semitones above the first click): a bright pentatonic run.
  const LETTER_STEPS=Object.freeze([0,2,4,7,9,12,14,16,19,21,24]);
  const LETTER_BASE_HZ=520;
  const COIN_PITCHES=Object.freeze([2093,2637,2349,3136,2489,2794,3322,2217,2960,2637,3136,2349]);

  function letterFrequency(position){
    const index=Math.min(Math.max(1,Math.floor(Number(position)||1)),LETTER_STEPS.length)-1;
    return LETTER_BASE_HZ*Math.pow(2,LETTER_STEPS[index]/12);
  }

  function create({window:win,isEnabled=()=>true,getVolume=()=>DEFAULT_VOLUME,getMusicVolume=()=>DEFAULT_MUSIC_VOLUME,musicUrl="",createAudioElement,voiceLimit=MAX_VOICES,setIntervalFn,clearIntervalFn}={}){
    const Context=win&&(win.AudioContext||win.webkitAudioContext);
    const scheduleInterval=setIntervalFn||(win&&typeof win.setInterval==="function"?win.setInterval.bind(win):typeof setInterval==="function"?setInterval:null);
    const cancelInterval=clearIntervalFn||(win&&typeof win.clearInterval==="function"?win.clearInterval.bind(win):typeof clearInterval==="function"?clearInterval:null);
    const makeAudioElement=createAudioElement||(win&&typeof win.Audio==="function"?()=>new win.Audio():null);
    let ctx=null,master=null,musicMaster=null,unlocked=false,jackpot=null,musicTimer=null,musicRunning=false,musicRequested=false,musicStep=0,musicMode=null,trackElement=null,trackSource=null;
    const ends=[];                                    // scheduled end times of recent voices (for the voice cap)

    function enabled(){try{return Boolean(isEnabled())}catch(_){return true}}
    function volume(value){
      try{const number=Number(value===undefined?getVolume():value);return Number.isFinite(number)?Math.min(1,Math.max(0,number)):DEFAULT_VOLUME}catch(_){return DEFAULT_VOLUME}
    }
    function musicVolume(value){
      try{const number=Number(value===undefined?getMusicVolume():value);return Number.isFinite(number)?Math.min(1,Math.max(0,number)):DEFAULT_MUSIC_VOLUME}catch(_){return DEFAULT_MUSIC_VOLUME}
    }
    function applyVolume(value){
      const next=volume(value);
      try{if(master)master.gain.value=next}catch(_){}
      return next;
    }
    function applyMusicVolume(value){
      const next=musicVolume(value);
      try{if(musicMaster)musicMaster.gain.value=next}catch(_){}
      return next;
    }
    function ensure(){
      if(!Context||!unlocked||!enabled())return null;
      if(!ctx){
        try{
          ctx=new Context();
          master=ctx.createGain();master.gain.value=volume();
          musicMaster=ctx.createGain();musicMaster.gain.value=musicVolume();
          let out=ctx.destination;
          if(typeof ctx.createDynamicsCompressor==="function"){const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=6;comp.connect(ctx.destination);out=comp}
          master.connect(out);musicMaster.connect(out);
        }catch(_){ctx=null;master=null;return null}
      }
      try{if(ctx.state==="suspended"&&typeof ctx.resume==="function"){const pending=ctx.resume();if(pending&&typeof pending.catch==="function")pending.catch(()=>{})}}catch(_){}
      return ctx;
    }
    function busyVoices(now){while(ends.length&&ends[0]<=now)ends.shift();return ends.length}
    function track(end){ends.push(end);ends.sort((a,b)=>a-b)}

    // One enveloped oscillator. `gain` is capped at MAX_GAIN so no single voice can be loud.
    function voice(bus,{type="sine",freq,end=null,start,dur,gain=.04,attack=.004,filter=null,tracked=true}){
      const osc=ctx.createOscillator(),amp=ctx.createGain(),level=Math.min(MAX_GAIN,gain);
      osc.type=type;osc.frequency.setValueAtTime(freq,start);
      if(end!==null)osc.frequency.exponentialRampToValueAtTime(Math.max(1,end),start+dur);
      amp.gain.setValueAtTime(0,start);
      amp.gain.linearRampToValueAtTime(level,start+attack);
      amp.gain.exponentialRampToValueAtTime(.0001,start+dur);
      let node=osc;
      if(filter&&typeof ctx.createBiquadFilter==="function"){const f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=filter;osc.connect(f);node=f}
      node.connect(amp);amp.connect(bus);
      osc.start(start);osc.stop(start+dur+.02);
      if(tracked)track(start+dur+.02);
      return osc;
    }
    // Metallic strike: a bright body plus two inharmonic partials with a fast decay.
    function metal(bus,freq,start,dur,gain){
      voice(bus,{type:"triangle",freq,start,dur,gain});
      voice(bus,{type:"sine",freq:freq*2.76,start,dur:dur*.7,gain:gain*.5});
      voice(bus,{type:"sine",freq:freq*5.4,start,dur:dur*.4,gain:gain*.25});
    }
    function bell(bus,freq,start,dur,gain){
      voice(bus,{type:"sine",freq,start,dur,gain,attack:.006});
      voice(bus,{type:"sine",freq:freq*2.01,start,dur:dur*.75,gain:gain*.55,attack:.006});
      voice(bus,{type:"sine",freq:freq*3.99,start,dur:dur*.45,gain:gain*.3,attack:.006});
    }
    function bus(){const g=ctx.createGain();g.gain.value=1;g.connect(master);return g}
    function musicBus(){const g=ctx.createGain();g.gain.value=1;g.connect(musicMaster);return g}

    function guarded(fn){
      return (...args)=>{
        try{
          const c=ensure();
          if(!c)return false;
          applyVolume();
          return fn(c,...args)!==false;
        }catch(_){return false}
      };
    }

    const letter=guarded((c,position)=>{
      const now=c.currentTime;
      if(busyVoices(now)>=voiceLimit)return false;    // never pile clicks on top of a long sequence
      metal(bus(),letterFrequency(position),now,.085,.05);
    });
    const correct=guarded((c,kind)=>{
      const now=c.currentTime,b=bus();
      if(kind==="financial"){                          // distinct financial reward chime
        bell(b,987.77,now,.42,.05);bell(b,1318.5,now+.09,.46,.045);metal(b,2637,now+.2,.14,.03);
      }else{                                           // short pleasant confirmation
        voice(b,{type:"triangle",freq:659.25,start:now,dur:.13,gain:.05});voice(b,{type:"triangle",freq:830.6,start:now+.08,dur:.17,gain:.05});
      }
    });
    const wrong=guarded(c=>{
      const now=c.currentTime;
      voice(bus(),{type:"sine",freq:210,end:150,start:now,dur:.12,gain:.035,attack:.01});
    });
    const duplicate=guarded(c=>{
      const now=c.currentTime;
      voice(bus(),{type:"sine",freq:440,start:now,dur:.06,gain:.022,attack:.006});
    });
    const cancel=guarded(c=>{
      const now=c.currentTime;
      voice(bus(),{type:"sine",freq:330,end:260,start:now,dur:.09,gain:.018,attack:.008});
    });
    const coinReward=guarded((c,options={})=>{
      const now=c.currentTime+Math.max(0,Math.min(.5,Number(options.delay)||0)),b=bus();
      const count=Math.min(3,Math.max(1,Math.ceil(Math.max(1,Number(options.coins)||1)/20)));
      for(let i=0;i<count;i++)metal(b,COIN_PITCHES[(musicStep+i)%COIN_PITCHES.length],now+i*.06,.085,.022);
    });

    // Calm eight-beat loop: soft roots, a sparse pentatonic melody, and a warm chord
    // at each phrase boundary. It deliberately uses its own low-volume bus, never
    // consumes the effects voice cap, and is not restarted by word/puzzle changes.
    function playMusicBeat(){
      try{
        if(!musicRunning||!ctx||!enabled()||musicVolume()<=0)return false;
        applyMusicVolume();
        const now=ctx.currentTime+.015,index=musicStep%MUSIC_NOTES.length,b=musicBus();
        voice(b,{type:"sine",freq:MUSIC_ROOTS[index],start:now,dur:.62,gain:.026,attack:.08,filter:900,tracked:false});
        voice(b,{type:"triangle",freq:MUSIC_NOTES[index],start:now+.03,dur:.42,gain:.016,attack:.035,filter:1400,tracked:false});
        if(index%4===0){
          [1,1.25,1.5].forEach((ratio,i)=>voice(b,{type:"sine",freq:MUSIC_ROOTS[index]*2*ratio,start:now,dur:.95,gain:.009-i*.0015,attack:.12,filter:1100,tracked:false}));
        }
        musicStep++;
        return true;
      }catch(_){return false}
    }
    function startSynthMusic(){
      if(!scheduleInterval)return false;
      musicRunning=true;musicMode="synth";musicStep=0;playMusicBeat();
      musicTimer=scheduleInterval(playMusicBeat,MUSIC_BEAT_MS);
      return true;
    }
    function startLicensedMusic(){
      if(!musicUrl||!makeAudioElement||!ctx||typeof ctx.createMediaElementSource!=="function")return false;
      try{
        if(!trackElement){
          trackElement=makeAudioElement();trackElement.src=musicUrl;trackElement.loop=true;trackElement.preload="auto";trackElement.crossOrigin="anonymous";
          trackSource=ctx.createMediaElementSource(trackElement);trackSource.connect(musicMaster);
        }
        musicRunning=true;musicMode="licensed";
        const pending=trackElement.play();
        if(pending&&typeof pending.catch==="function")pending.catch(()=>{if(musicRunning&&musicMode==="licensed"){musicRunning=false;musicMode=null;startSynthMusic()}});
        return true;
      }catch(_){trackElement=null;trackSource=null;musicRunning=false;musicMode=null;return false}
    }
    function startMusic(){
      musicRequested=true;
      const c=ensure();
      if(!c||musicVolume()<=0)return false;
      applyMusicVolume();
      if(musicRunning)return true;
      return startLicensedMusic()||startSynthMusic();
    }
    function pauseMusic(keepRequested){
      if(musicTimer!==null&&cancelInterval)try{cancelInterval(musicTimer)}catch(_){}
      musicTimer=null;musicRunning=false;
      try{if(trackElement&&typeof trackElement.pause==="function")trackElement.pause()}catch(_){}
      musicMode=null;
      if(!keepRequested)musicRequested=false;
      try{if(ctx&&musicMaster){const t=ctx.currentTime;musicMaster.gain.cancelScheduledValues(t);musicMaster.gain.setValueAtTime(musicMaster.gain.value,t);musicMaster.gain.linearRampToValueAtTime(0,t+.08)}}catch(_){}
    }
    function stopMusic(){pauseMusic(false)}
    function setMusicVolume(value){
      const next=applyMusicVolume(value);
      if(next<=0)pauseMusic(true);else if(musicRequested&&!musicRunning)startMusic();
      return next;
    }

    function startJackpot(c,kind){
      const now=c.currentTime;
      if(jackpot&&jackpot.endsAt>now){
        if((JACKPOT_PRIORITY[jackpot.kind]||0)>=(JACKPOT_PRIORITY[kind]||0))return null;
        cancelJackpot(c);
      }
      const b=bus();
      jackpot={kind,bus:b,endsAt:now+DURATIONS[kind]};
      try{
        if(musicRunning&&musicMaster){const base=musicVolume(),factor=kind==="mini"?.62:.32;musicMaster.gain.cancelScheduledValues(now);musicMaster.gain.setValueAtTime(musicMaster.gain.value,now);musicMaster.gain.linearRampToValueAtTime(base*factor,now+.05);musicMaster.gain.linearRampToValueAtTime(base,now+DURATIONS[kind]);}
      }catch(_){}
      return {now,b};
    }
    function cancelJackpot(c){
      if(!jackpot)return;
      try{const t=c.currentTime;jackpot.bus.gain.cancelScheduledValues(t);jackpot.bus.gain.setValueAtTime(jackpot.bus.gain.value,t);jackpot.bus.gain.linearRampToValueAtTime(0,t+.03)}catch(_){}
      jackpot=null;
    }
    const miniJackpot=guarded(c=>{
      const started=startJackpot(c,"mini");
      if(!started)return false;
      const {now,b}=started;
      bell(b,1046.5,now,.4,.06);bell(b,1568,now,.36,.04);                         // bright winning chime
      [1046.5,1318.5,1568,2093].forEach((f,i)=>metal(b,f,now+.08+i*.07,.12,.045)); // short rising flourish...
      voice(b,{type:"sine",freq:600,end:2200,start:now+.1,dur:.32,gain:.025});     // ...with a sweep
      for(let i=0;i<7;i++)metal(b,COIN_PITCHES[i],now+.45+i*.085,.1,.032);         // metallic coin cascade
      bell(b,2093,now+.98,.32,.045);                                                // closing sparkle (ends at 1.3 s)
    });
    const grandJackpot=guarded((c,options)=>{
      const started=startJackpot(c,"grand");
      if(!started)return false;
      const {now,b}=started,pings=Math.min(12,Math.max(6,Math.floor(Number(options&&options.coins)||12)));
      // rising anticipation: accelerating clicks that climb, under a rising sweep
      let t=0,gap=.11;
      for(let i=0;i<9;i++){metal(b,letterFrequency(i+1)*1.05,now+t,.07,.04);t+=gap;gap=Math.max(.05,gap-.007)}
      voice(b,{type:"sine",freq:300,end:1250,start:now,dur:.85,gain:.02,attack:.05});
      // winning fanfare
      const chord=(freqs,start,dur,gain)=>freqs.forEach(f=>voice(b,{type:"sawtooth",freq:f,start:now+start,dur,gain,filter:1800,attack:.01}));
      chord([392,493.9,587.3],.88,.16,.022);chord([523.25,659.25,783.99],1.05,.16,.022);chord([523.25,659.25,783.99,1046.5],1.22,.55,.024);
      // coin cascade
      for(let i=0;i<pings;i++)metal(b,COIN_PITCHES[i%COIN_PITCHES.length],now+1.25+i*.08,.11,.03);
      // bright final chime (ends at 2.65 s)
      bell(b,2093,now+2.15,.5,.05);bell(b,3136,now+2.2,.45,.03);
    });
    const levelComplete=guarded((c,options)=>{
      const started=startJackpot(c,"level");if(!started)return false;
      const {now,b}=started,pings=Math.min(8,Math.max(4,Math.floor(Number(options&&options.coins)||6)));
      [523.25,659.25,783.99,1046.5].forEach((f,i)=>bell(b,f,now+i*.13,.34,.038));
      [392,493.88,587.33].forEach(f=>voice(b,{type:"triangle",freq:f,start:now+.62,dur:.65,gain:.024,attack:.025}));
      for(let i=0;i<pings;i++)metal(b,COIN_PITCHES[i],now+.8+i*.075,.1,.025);
      bell(b,1568,now+1.55,.62,.04);bell(b,2093,now+1.62,.55,.026);
    });
    const worldComplete=guarded((c,options)=>{
      const started=startJackpot(c,"world");if(!started)return false;
      const {now,b}=started,pings=Math.min(12,Math.max(7,Math.floor(Number(options&&options.coins)||10)));
      voice(b,{type:"sine",freq:220,end:1320,start:now,dur:1.05,gain:.022,attack:.06});
      [[261.63,329.63,392],[349.23,440,523.25],[523.25,659.25,783.99,1046.5]].forEach((chord,i)=>chord.forEach(f=>voice(b,{type:"sawtooth",freq:f,start:now+.35+i*.32,dur:i===2?.9:.24,gain:.02,filter:1900,attack:.018})));
      for(let i=0;i<pings;i++)metal(b,COIN_PITCHES[i],now+1.2+i*.065,.1,.026);
      bell(b,2093,now+2.1,.65,.045);bell(b,3136,now+2.18,.58,.03);bell(b,4186,now+2.25,.5,.018);
    });
    function unlock(){
      unlocked=true;
      if(!Context||!enabled())return false;
      const ready=Boolean(ensure());
      if(ready&&musicRequested&&!musicRunning)startMusic();
      return ready;
    }
    function stop(){
      pauseMusic(true);
      try{if(ctx&&jackpot)cancelJackpot(ctx)}catch(_){}
      try{if(ctx&&typeof ctx.close==="function")ctx.close()}catch(_){}
      ctx=null;master=null;musicMaster=null;trackElement=null;trackSource=null;musicMode=null;jackpot=null;ends.length=0;
    }
    // Cuts a running jackpot (used by Skip) but keeps the audio context for the next sound.
    function stopJackpots(){try{if(ctx&&jackpot)cancelJackpot(ctx)}catch(_){}jackpot=null}
    return{unlock,letter,correct,wrong,duplicate,cancel,coinReward,miniJackpot,grandJackpot,levelComplete,worldComplete,startMusic,stopMusic,stop,stopJackpots,setVolume:applyVolume,setMusicVolume,isUnlocked:()=>unlocked,isMusicPlaying:()=>musicRunning,musicMode:()=>musicMode,isRunningJackpot:()=>Boolean(jackpot&&ctx&&jackpot.endsAt>ctx.currentTime)};
  }

  return{MAX_GAIN,MAX_VOICES,DEFAULT_VOLUME,DEFAULT_MUSIC_VOLUME,MUSIC_BEAT_MS,MUSIC_NOTES,MUSIC_ROOTS,DURATIONS,JACKPOT_PRIORITY,LETTER_STEPS,LETTER_BASE_HZ,letterFrequency,create};
});

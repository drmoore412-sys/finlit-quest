(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitAudio=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const MAX_GAIN=.07,MAX_VOICES=30,DEFAULT_VOLUME=.9;
  const DURATIONS=Object.freeze({mini:1.3,grand:2.65});
  const LETTER_STEPS=Object.freeze([0,2,4,7,9,12,14,16,19,21,24]);
  const LETTER_BASE_HZ=520;
  const COIN_PITCHES=Object.freeze([2093,2637,2349,3136,2489,2794,3322,2217,2960,2637,3136,2349]);
  function letterFrequency(position){const index=Math.min(Math.max(1,Math.floor(Number(position)||1)),LETTER_STEPS.length)-1;return LETTER_BASE_HZ*Math.pow(2,LETTER_STEPS[index]/12)}
  function create({window:win,isEnabled=()=>true,getVolume=()=>DEFAULT_VOLUME,voiceLimit=MAX_VOICES}={}){
    const Context=win&&(win.AudioContext||win.webkitAudioContext);
    let ctx=null,master=null,unlocked=false,jackpot=null;
    const ends=[];
    function enabled(){try{return Boolean(isEnabled())}catch(_){return true}}
    function volume(value){try{const number=Number(value===undefined?getVolume():value);return Number.isFinite(number)?Math.min(1,Math.max(0,number)):DEFAULT_VOLUME}catch(_){return DEFAULT_VOLUME}}
    function applyVolume(value){const next=volume(value);try{if(master)master.gain.value=next}catch(_){}return next}
    function ensure(){
      if(!Context||!unlocked||!enabled())return null;
      if(!ctx){
        try{
          ctx=new Context();master=ctx.createGain();master.gain.value=volume();
          let out=master;
          if(typeof ctx.createDynamicsCompressor==="function"){const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=6;master.connect(comp);out=comp}
          out.connect(ctx.destination);
        }catch(_){ctx=null;master=null;return null}
      }
      try{if(ctx.state==="suspended"&&typeof ctx.resume==="function"){const pending=ctx.resume();if(pending&&typeof pending.catch==="function")pending.catch(()=>{})}}catch(_){}
      return ctx;
    }
    function busyVoices(now){while(ends.length&&ends[0]<=now)ends.shift();return ends.length}
    function track(end){ends.push(end);ends.sort((a,b)=>a-b)}
    function voice(bus,{type="sine",freq,end=null,start,dur,gain=.04,attack=.004,filter=null}){
      const osc=ctx.createOscillator(),amp=ctx.createGain(),level=Math.min(MAX_GAIN,gain);
      osc.type=type;osc.frequency.setValueAtTime(freq,start);if(end!==null)osc.frequency.exponentialRampToValueAtTime(Math.max(1,end),start+dur);
      amp.gain.setValueAtTime(0,start);amp.gain.linearRampToValueAtTime(level,start+attack);amp.gain.exponentialRampToValueAtTime(.0001,start+dur);
      let node=osc;
      if(filter&&typeof ctx.createBiquadFilter==="function"){const f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=filter;osc.connect(f);node=f}
      node.connect(amp);amp.connect(bus);osc.start(start);osc.stop(start+dur+.02);track(start+dur+.02);return osc;
    }
    function metal(bus,freq,start,dur,gain){voice(bus,{type:"triangle",freq,start,dur,gain});voice(bus,{type:"sine",freq:freq*2.76,start,dur:dur*.7,gain:gain*.5});voice(bus,{type:"sine",freq:freq*5.4,start,dur:dur*.4,gain:gain*.25})}
    function bell(bus,freq,start,dur,gain){voice(bus,{type:"sine",freq,start,dur,gain,attack:.006});voice(bus,{type:"sine",freq:freq*2.01,start,dur:dur*.75,gain:gain*.55,attack:.006});voice(bus,{type:"sine",freq:freq*3.99,start,dur:dur*.45,gain:gain*.3,attack:.006})}
    function bus(){const g=ctx.createGain();g.gain.value=1;g.connect(master);return g}
    function guarded(fn){return(...args)=>{try{const c=ensure();if(!c)return false;applyVolume();return fn(c,...args)!==false}catch(_){return false}}}
    const letter=guarded((c,position)=>{const now=c.currentTime;if(busyVoices(now)>voiceLimit)return false;metal(bus(),letterFrequency(position),now,.085,.05)});
    const correct=guarded((c,kind)=>{const now=c.currentTime,b=bus();if(kind==="financial"){bell(b,987.77,now,.42,.05);bell(b,1318.5,now+.09,.46,.045);metal(b,2637,now+.2,.14,.03)}else{voice(b,{type:"triangle",freq:659.25,start:now,dur:.13,gain:.05});voice(b,{type:"triangle",freq:830.6,start:now+.08,dur:.17,gain:.05})}});
    const wrong=guarded(c=>{const now=c.currentTime;voice(bus(),{type:"sine",freq:210,end:150,start:now,dur:.12,gain:.035,attack:.01})});
    const duplicate=guarded(c=>{const now=c.currentTime;voice(bus(),{type:"sine",freq:440,start:now,dur:.06,gain:.022,attack:.006})});
    function cancelJackpot(c){if(!jackpot)return;try{const t=c.currentTime;jackpot.bus.gain.cancelScheduledValues(t);jackpot.bus.gain.setValueAtTime(jackpot.bus.gain.value,t);jackpot.bus.gain.linearRampToValueAtTime(0,t+.03)}catch(_){}jackpot=null}
    function startJackpot(c,kind){const now=c.currentTime;if(jackpot&&jackpot.endsAt>now){if(jackpot.kind==="grand"||kind==="mini")return null;cancelJackpot(c)}const b=bus();jackpot={kind,bus:b,endsAt:now+DURATIONS[kind]};return{now,b}}
    const miniJackpot=guarded(c=>{const started=startJackpot(c,"mini");if(!started)return false;const{now,b}=started;bell(b,1046.5,now,.4,.06);bell(b,1568,now,.36,.04);[1046.5,1318.5,1568,2093].forEach((f,i)=>metal(b,f,now+.08+i*.07,.12,.045));voice(b,{type:"sine",freq:600,end:2200,start:now+.1,dur:.32,gain:.025});for(let i=0;i<7;i++)metal(b,COIN_PITCHES[i],now+.45+i*.085,.1,.032);bell(b,2093,now+.98,.32,.045)});
    const grandJackpot=guarded((c,options)=>{
      const started=startJackpot(c,"grand");if(!started)return false;
      const{now,b}=started,pings=Math.min(12,Math.max(6,Math.floor(Number(options&&options.coins)||12)));
      let t=0,gap=.11;for(let i=0;i<9;i++){metal(b,letterFrequency(i+1)*1.05,now+t,.07,.04);t+=gap;gap=Math.max(.05,gap-.007)}
      voice(b,{type:"sine",freq:300,end:1250,start:now,dur:.85,gain:.02,attack:.05});
      const chord=(freqs,start,dur,gain)=>freqs.forEach(f=>voice(b,{type:"sawtooth",freq:f,start:now+start,dur,gain,filter:1800,attack:.01}));
      chord([392,493.9,587.3],.88,.16,.022);chord([523.25,659.25,783.99],1.05,.16,.022);chord([523.25,659.25,783.99,1046.5],1.22,.55,.024);
      for(let i=0;i<pings;i++)metal(b,COIN_PITCHES[i%COIN_PITCHES.length],now+1.25+i*.08,.11,.03);
      bell(b,2093,now+2.15,.5,.05);bell(b,3136,now+2.2,.45,.03);
    });
    function unlock(){unlocked=true;if(!Context||!enabled())return false;return Boolean(ensure())}
    function stop(){try{if(ctx&&jackpot)cancelJackpot(ctx)}catch(_){}try{if(ctx&&typeof ctx.close==="function")ctx.close()}catch(_){}ctx=null;master=null;jackpot=null;ends.length=0}
    function stopJackpots(){try{if(ctx&&jackpot)cancelJackpot(ctx)}catch(_){}jackpot=null}
    return{unlock,letter,correct,wrong,duplicate,miniJackpot,grandJackpot,stop,stopJackpots,setVolume:applyVolume,isUnlocked:()=>unlocked,isRunningJackpot:()=>Boolean(jackpot&&ctx&&jackpot.endsAt>ctx.currentTime)};
  }
  return{MAX_GAIN,MAX_VOICES,DEFAULT_VOLUME,DURATIONS,LETTER_STEPS,LETTER_BASE_HZ,letterFrequency,create};
});

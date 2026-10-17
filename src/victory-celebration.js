(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitVictory=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const SOUND_KEY="finlitQuest.victorySound";
  const VOLUME_KEY="finlitQuest.soundVolume";
  const DEFAULT_VOLUME=90;
  const DURATION_MS=2600;
  const LIMITS=Object.freeze({coins:12,dollars:8,minCoins:4});

  function prefersReducedMotion(win){
    try{return Boolean(win&&typeof win.matchMedia==="function"&&win.matchMedia("(prefers-reduced-motion: reduce)").matches)}catch(_){return false}
  }
  function loadSoundEnabled(storage){try{return storage.getItem(SOUND_KEY)!=="off"}catch(_){return true}}
  function saveSoundEnabled(storage,enabled){try{storage.setItem(SOUND_KEY,enabled?"on":"off");return true}catch(_){return false}}
  function clampVolume(value){const number=Number(value);return Number.isFinite(number)?Math.min(100,Math.max(0,Math.round(number))):DEFAULT_VOLUME}
  function loadSoundVolume(storage){try{const stored=storage.getItem(VOLUME_KEY);return stored===null?DEFAULT_VOLUME:clampVolume(stored)}catch(_){return DEFAULT_VOLUME}}
  function saveSoundVolume(storage,volume){try{storage.setItem(VOLUME_KEY,String(clampVolume(volume)));return true}catch(_){return false}}
  function coinCount(coins){
    const earned=Math.max(0,Math.floor(Number(coins)||0));
    return earned===0?0:Math.min(LIMITS.coins,Math.max(LIMITS.minCoins,Math.ceil(earned/20)));
  }
  function plan({reducedMotion=false,newlyCompleted=true,coins=0,soundEnabled=true}={}){
    const celebrate=Boolean(newlyCompleted),motion=celebrate&&!reducedMotion;
    return{celebrate,motion,confetti:0,coins:motion?coinCount(coins):0,dollars:motion?LIMITS.dollars:0,sound:celebrate&&Boolean(soundEnabled),durationMs:motion?DURATION_MS:0};
  }
  function announcement({coins=0,xp=0,newlyCompleted=true}={}){
    const c=Math.max(0,Math.floor(Number(coins)||0)),x=Math.max(0,Math.floor(Number(xp)||0));
    const plural=(n,word)=>`${n} ${word}${n===1?"":"s"}`;
    const earned=`You earned ${plural(c,"coin")} and ${x} XP.`;
    return newlyCompleted?`Puzzle solved! ${earned}`:`Puzzle solved again. ${earned}`;
  }
  function createController({document:doc,window:win,storage,audio,setTimer=setTimeout,clearTimer=clearTimeout,random=Math.random}={}){
    let layer=null,timer=null,running=false;
    const sound=audio||{play(){return false},stop(){},reset(){}};
    function rectCenter(el){const rect=el&&typeof el.getBoundingClientRect==="function"?el.getBoundingClientRect():null;return rect&&(rect.width||rect.height)?{x:rect.left+rect.width/2,y:rect.top+rect.height/2}:null}
    function piece(className,styles,text){const node=doc.createElement("i");node.className=className;Object.entries(styles).forEach(([key,value])=>node.style.setProperty(key,value));if(text)node.textContent=text;return node}
    function finish(){
      if(timer!==null){clearTimer(timer);timer=null}
      if(layer&&typeof layer.remove==="function")layer.remove();
      layer=null;
      try{sound.stop()}catch(_){}
      const was=running;running=false;return was;
    }
    function start({coins=0,xp=0,newlyCompleted=true,from=null,to=null,onDone=null}={}){
      finish();
      const settings=plan({reducedMotion:prefersReducedMotion(win),newlyCompleted,coins,soundEnabled:loadSoundEnabled(storage)});
      const result={plan:settings,announcement:announcement({coins,xp,newlyCompleted})};
      if(settings.sound){try{sound.reset();sound.play({pings:settings.coins})}catch(_){}}
      if(!settings.motion){result.running=false;if(typeof onDone==="function")onDone();return result}
      layer=doc.createElement("div");layer.className="vc-layer";layer.setAttribute("aria-hidden","true");
      const origin=rectCenter(from)||{x:(win.innerWidth||360)/2,y:(win.innerHeight||640)/2},end=rectCenter(to);
      for(let i=0;i<settings.coins;i++){
        const dx=end?Math.round(end.x-origin.x):0,dy=end?Math.round(end.y-origin.y):-240;
        layer.append(piece("vc-coin",{"--sx":`${Math.round(origin.x)}px`,"--sy":`${Math.round(origin.y)}px`,"--tx":`${dx}px`,"--ty":`${dy}px`,"--jx":`${Math.round((random()-.5)*90)}px`,"--delay":`${200+i*90}ms`},"●"));
      }
      for(let i=0;i<settings.dollars;i++)layer.append(piece("vc-dollar",{"--left":`${8+random()*84}%`,"--top":`${40+random()*40}%`,"--delay":`${Math.round(random()*900)}ms`,"--size":`${18+Math.round(random()*14)}px`},"$"));
      doc.body.append(layer);running=true;result.running=true;
      timer=setTimer(()=>{finish();if(typeof onDone==="function")onDone()},settings.durationMs);
      return result;
    }
    return{start,skip:finish,stopSound:()=>sound.stop(),isRunning:()=>running};
  }
  return{SOUND_KEY,VOLUME_KEY,DEFAULT_VOLUME,DURATION_MS,LIMITS,prefersReducedMotion,loadSoundEnabled,saveSoundEnabled,clampVolume,loadSoundVolume,saveSoundVolume,coinCount,plan,announcement,createController};
});

// FinLit Quest first-time tutorial, one-time tips and Help (2026-11-19).
// - A five-step guided tour on the real Level 1 puzzle, started automatically for new players only (save.onboarding.tutorial
//   is "pending"). Each step spotlights a real control and shows a short card with Back, Next and Skip tutorial.
// - Two one-time tips: coins and XP after the first reward, worlds and levels after Level 1 is completed.
// - A Help entry ("?" in the puzzle header) to replay the tutorial and reach sound and settings.
// The tutorial never spends coins, never triggers a hint, and never changes answers, rewards or progress. It only reads the
// page and writes save.onboarding. Pure rules are exported for tests; the UI mounts only in a browser.
(function(root,factory){const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitOnboarding=api})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const STEPS=Object.freeze([
    Object.freeze({id:"wheel",target:"#wgWheel",title:"Spell words on the wheel",
      text:"Swipe across the letters, or tap them one at a time. Lift your finger or press Submit to try the word. Give it a go now!"}),
    Object.freeze({id:"grid",target:"#wgCrossword",title:"Answers fill the grid",
      text:"Every correct word drops into the crossword. Fill all the squares to finish the level."}),
    Object.freeze({id:"definitions",target:"#wgDefinitionsButton",title:"Use the Definitions",
      text:"Tap Definitions to read a clue for each answer. The clues tell you which money words to look for."}),
    Object.freeze({id:"mission",target:"#wgMissionCard",title:"Your mission",
      text:"This bar shows the next word to find, the coins and XP it is worth, and how many answers are left."}),
    Object.freeze({id:"hints",target:"#wgHintButton",title:"Need a hand?",
      text:"Tap Hint to see one letter of the next word. Hints are free on Level 1. That's the tour. Have fun!"}),
  ]);
  const TIPS=Object.freeze({
    rewards:Object.freeze({title:"You earned coins and XP!",target:".wg-currencies, .wg-coin-chip",
      text:"Coins pay for hints in later levels. XP fills up your player level. You can see both at the top of the screen."}),
    worlds:Object.freeze({title:"Level 1 complete!",target:"#wgCompleteContinue",
      text:"Levels unlock one after another, and each comes from one of 13 money worlds, such as Banking, Credit and Crypto. Tap Next Puzzle to keep going."}),
  });

  // ---------- pure rules (tested) ----------
  function state(save){
    const o=save&&save.onboarding;
    return o&&typeof o==="object"?o:null;
  }
  function shouldAutoStart(save,levelNumber,unified){
    const o=state(save);return Boolean(o&&o.tutorial==="pending"&&unified&&levelNumber===1);
  }
  function recordTutorial(save,outcome){
    const o=state(save);if(!o||!["completed","skipped"].includes(outcome))return false;
    o.tutorial=outcome;return true;
  }
  function tipDue(save,id){
    const o=state(save);return Boolean(o&&TIPS[id]&&o.tutorial!=="existing-player"&&!(o.tips&&o.tips[id]===true));
  }
  function recordTip(save,id){
    const o=state(save);if(!o||!TIPS[id])return false;
    if(!o.tips||typeof o.tips!=="object")o.tips={};
    o.tips[id]=true;return true;
  }

  // ---------- browser UI ----------
  let env=null,ui=null,active=null,tip=null,pendingTip=null,tipTimer=0,layoutQueued=0,observer=null;
  const doc=()=>root.document;
  const $=selector=>doc().querySelector(selector);
  function visible(el){if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=="hidden"}
  function firstVisible(selectors){return String(selectors).split(",").map(s=>$(s.trim())).find(visible)||null}
  function reducedMotion(){
    try{if(env&&env.getSave&&env.getSave().settings&&env.getSave().settings.reducedMotion)return true}catch(_){}
    try{return root.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(_){return false}
  }
  function persist(){try{env&&env.persist&&env.persist()}catch(_){}}
  function save(){try{return env&&env.getSave?env.getSave():null}catch(_){return null}}

  function build(){
    if(ui)return ui;
    const d=doc(),ring=d.createElement("div"),card=d.createElement("div"),probe=d.createElement("div");
    ring.className="flq-tour-ring hidden";ring.setAttribute("aria-hidden","true");
    card.className="flq-tour-card hidden";card.setAttribute("role","dialog");card.setAttribute("aria-modal","false");
    card.setAttribute("aria-labelledby","flqTourTitle");card.setAttribute("aria-describedby","flqTourText");
    card.innerHTML='<p class="flq-tour-step" id="flqTourStep"></p><h2 class="flq-tour-title" id="flqTourTitle" tabindex="-1"></h2>'+
      '<p class="flq-tour-text" id="flqTourText"></p><div class="flq-tour-actions"><button type="button" class="flq-tour-skip" id="flqTourSkip">Skip tutorial</button>'+
      '<span class="flq-tour-nav"><button type="button" class="flq-tour-back" id="flqTourBack">Back</button><button type="button" class="flq-tour-next" id="flqTourNext">Next</button></span></div>';
    probe.className="flq-safe-probe";probe.setAttribute("aria-hidden","true");
    d.body.append(ring,card,probe);
    card.querySelector("#flqTourSkip").addEventListener("click",()=>tip?closeTip():finish("skipped"));
    card.querySelector("#flqTourBack").addEventListener("click",()=>go(-1));
    card.querySelector("#flqTourNext").addEventListener("click",()=>tip?closeTip():go(1));
    d.addEventListener("keydown",event=>{
      if(event.key!=="Escape")return;
      if(active){event.preventDefault();finish("skipped")}else if(tip){event.preventDefault();closeTip()}
    });
    const relayout=()=>{if(layoutQueued)return;layoutQueued=(root.requestAnimationFrame||setTimeout)(()=>{layoutQueued=0;layout()})};
    root.addEventListener("resize",relayout);root.addEventListener("orientationchange",relayout);root.addEventListener("scroll",relayout,true);
    if(root.visualViewport)root.visualViewport.addEventListener("resize",relayout);
    if(root.ResizeObserver)observer=new root.ResizeObserver(relayout);
    ui={ring,card,probe,relayout};return ui;
  }
  function safeInsets(){
    const s=getComputedStyle(ui.probe);
    return {top:parseFloat(s.paddingTop)||0,right:parseFloat(s.paddingRight)||0,bottom:parseFloat(s.paddingBottom)||0,left:parseFloat(s.paddingLeft)||0};
  }
  function currentTarget(){return active?firstVisible(STEPS[active.index].target):tip?firstVisible(TIPS[tip].target):null}
  // Spotlight the target and place the card beside it, inside the viewport and the iOS safe areas.
  function layout(){
    if(!ui||(!active&&!tip))return;
    const target=currentTarget(),ring=ui.ring,card=ui.card,vw=root.innerWidth,vh=root.innerHeight,inset=safeInsets(),gap=12,edge=12;
    if(active&&target){
      const r=target.getBoundingClientRect(),pad=6;
      Object.assign(ring.style,{left:`${r.left-pad}px`,top:`${r.top-pad}px`,width:`${r.width+pad*2}px`,height:`${r.height+pad*2}px`});
      ring.classList.remove("hidden");
    }else ring.classList.add("hidden");
    const width=Math.min(340,vw-inset.left-inset.right-edge*2);card.style.width=`${width}px`;
    const h=card.offsetHeight,minX=inset.left+edge,maxX=vw-inset.right-edge-width,minY=inset.top+edge,maxY=vh-inset.bottom-edge-h;
    let left=(vw-width)/2,top=maxY;
    if(target){
      const r=target.getBoundingClientRect();
      left=r.left+r.width/2-width/2;
      if(r.bottom+gap+h<=vh-inset.bottom-edge)top=r.bottom+gap;          // below
      else if(r.top-gap-h>=minY)top=r.top-gap-h;                         // above
      else top=r.top+r.height/2>vh/2?minY:maxY;                          // the free half of the screen
    }
    card.style.left=`${Math.round(Math.max(minX,Math.min(maxX,left)))}px`;
    card.style.top=`${Math.round(Math.max(minY,Math.min(maxY,top)))}px`;
  }
  function watch(target){if(observer){observer.disconnect();if(target)observer.observe(target)}}
  function show(title,text,stepLabel,{back,next,skip}){
    build();const {card}=ui;
    card.querySelector("#flqTourStep").textContent=stepLabel;
    card.querySelector("#flqTourTitle").textContent=title;
    card.querySelector("#flqTourText").textContent=text;
    const backBtn=card.querySelector("#flqTourBack"),nextBtn=card.querySelector("#flqTourNext"),skipBtn=card.querySelector("#flqTourSkip");
    backBtn.hidden=!back;nextBtn.textContent=next;skipBtn.hidden=!skip;
    card.classList.toggle("flq-reduced",reducedMotion());ui.ring.classList.toggle("flq-reduced",reducedMotion());
    card.classList.remove("hidden");
  }
  function focusCard(){try{ui.card.querySelector("#flqTourTitle").focus({preventScroll:true})}catch(_){}}
  function renderStep(){
    const step=STEPS[active.index],target=firstVisible(step.target);
    if(target&&typeof target.scrollIntoView==="function"){
      const r=target.getBoundingClientRect();
      if(r.top<0||r.bottom>root.innerHeight)target.scrollIntoView({block:"center",behavior:reducedMotion()?"auto":"smooth"});
    }
    const last=active.index===STEPS.length-1;
    show(step.title,step.text+(active.index===0&&active.solved?" Nice, you found one!":""),`Step ${active.index+1} of ${STEPS.length}`,{back:active.index>0,next:last?"Finish":"Next",skip:true});
    watch(target);layout();setTimeout(layout,reducedMotion()?0:350);focusCard();
  }
  function go(delta){
    if(!active)return;
    const next=active.index+delta;
    if(next>=STEPS.length)return finish("completed");
    active.index=Math.max(0,next);renderStep();
  }
  function hideCard(){if(ui){ui.card.classList.add("hidden");ui.ring.classList.add("hidden");watch(null)}}
  function finish(outcome){
    if(!active)return;
    const returnFocus=active.returnFocus;active=null;hideCard();
    const s=save();if(recordTutorial(s,outcome))persist();
    try{if(returnFocus&&returnFocus.focus)returnFocus.focus({preventScroll:true})}catch(_){}
    if(pendingTip){const id=pendingTip;pendingTip=null;setTimeout(()=>showTip(id),300)}
  }
  function start(options={}){
    if(active||!$("#wgWheel"))return false;
    closeTip();
    active={index:0,solved:false,replay:Boolean(options.replay),returnFocus:doc().activeElement};
    renderStep();return true;
  }
  function showTip(id){
    const s=save();if(!tipDue(s,id))return false;
    if(active){pendingTip=id;return false}
    recordTip(s,id);persist();                          // shown once, even if the player never taps "Got it"
    tip=id;const t=TIPS[id];
    show(t.title,t.text,"Tip",{back:false,next:"Got it",skip:false});
    watch(firstVisible(t.target));layout();
    clearTimeout(tipTimer);tipTimer=setTimeout(closeTip,15000);
    return true;
  }
  function closeTip(){if(!tip)return;clearTimeout(tipTimer);tip=null;hideCard()}

  // ---------- Help ----------
  function buildHelp(){
    let help=$("#flqHelp");if(help)return help;
    help=doc().createElement("div");help.id="flqHelp";help.className="flq-help hidden";help.setAttribute("role","dialog");
    help.setAttribute("aria-modal","true");help.setAttribute("aria-labelledby","flqHelpTitle");
    help.innerHTML='<div class="flq-help-card"><h2 id="flqHelpTitle" tabindex="-1">Help</h2><p>Need a refresher, or want to change the sound?</p>'+
      '<button type="button" class="flq-help-action" id="flqHelpReplay">Replay the tutorial</button>'+
      '<button type="button" class="flq-help-action" id="flqHelpSettings">Sound and settings</button>'+
      '<button type="button" class="flq-help-close" id="flqHelpClose">Close</button></div>';
    doc().body.append(help);
    const close=()=>{help.classList.add("hidden");try{$("#wgHelpButton").focus({preventScroll:true})}catch(_){}};
    help.addEventListener("click",event=>{if(event.target===help)close()});
    help.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();close();return}
      if(event.key!=="Tab")return;
      const items=[...help.querySelectorAll("button")],first=items[0],last=items[items.length-1];
      if(event.shiftKey&&doc().activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&doc().activeElement===last){event.preventDefault();first.focus()}
    });
    help.querySelector("#flqHelpClose").addEventListener("click",close);
    help.querySelector("#flqHelpReplay").addEventListener("click",()=>{help.classList.add("hidden");setTimeout(()=>start({replay:true}),150)});
    help.querySelector("#flqHelpSettings").addEventListener("click",()=>{help.classList.add("hidden");openSettings()});
    return help;
  }
  function openHelp(){const help=buildHelp();help.classList.remove("hidden");help.querySelector("#flqHelpTitle").focus({preventScroll:true})}
  // Phones: the gear's settings sheet. Wider screens: the sound and volume controls that are always in the top bar.
  function openSettings(){
    const gear=$("#wgInfoButton");
    if(visible(gear)){if(root.FinLitSettingsSheet&&root.FinLitSettingsSheet.open)root.FinLitSettingsSheet.open();else gear.click();return}
    const control=$("#wgVolumeSlider")||$("#wgSoundButton"),bar=$(".wg-topbar");
    if(bar&&bar.scrollIntoView)bar.scrollIntoView({block:"start",behavior:reducedMotion()?"auto":"smooth"});
    if(bar){bar.classList.add("flq-settings-flash");setTimeout(()=>bar.classList.remove("flq-settings-flash"),1600)}
    try{control&&control.focus({preventScroll:true})}catch(_){}
  }

  // ---------- game hooks ----------
  function mount(options){
    env=options||{};
    const button=$("#wgHelpButton");if(button&&!button.dataset.flqBound){button.dataset.flqBound="1";button.addEventListener("click",openHelp)}
  }
  function puzzleShown(levelNumber,unified){
    if(active)finish("skipped");                       // leaving the tutorial puzzle ends the tour
    closeTip();
    if(shouldAutoStart(save(),levelNumber,unified))setTimeout(()=>{if(!active)start()},500);
  }
  function wordFound(){if(active&&active.index===0&&!active.solved){active.solved=true;renderStep()}}
  function rewardGranted(){showTip("rewards")}
  function levelCompleted(levelNumber,unified){if(unified&&levelNumber===1)setTimeout(()=>showTip("worlds"),900)}

  return {STEPS,TIPS,shouldAutoStart,recordTutorial,tipDue,recordTip,mount,start,finish,openHelp,openSettings,puzzleShown,wordFound,rewardGranted,levelCompleted,
    isActive:()=>Boolean(active),activeStep:()=>active?STEPS[active.index].id:null,activeTip:()=>tip,closeTip};
});

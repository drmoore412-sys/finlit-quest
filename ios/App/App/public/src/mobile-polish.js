// Mobile polish (2026-11-13, owner request). Presentation only.
// It never grants rewards, reads curriculum, or writes the learning save:
//   - marks the Word Quest screen as "playing" so the phone layout can fit one screen
//   - settings popup, compact mission line, coin chip mirror
//   - Daily reward popup opened from the gift button (the claim rules stay in learning-engine.js / app.js)
//   - coin confetti when the key term is found (called from word-game-app.js)
(function(root){
  "use strict";
  const doc=root.document;
  if(!doc)return;
  const $=selector=>doc.querySelector(selector);
  const reducedMotion=()=>{try{return root.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(_){return false}};

  // ---------- coin confetti ----------
  const RIBBONS=["#2ee6c8","#ffffff","#7ab8ff","#ffdc76"];
  let confettiTimer=null;
  function clearConfetti(){
    if(confettiTimer){clearTimeout(confettiTimer);confettiTimer=null}
    doc.querySelectorAll(".flq-confetti,.flq-confetti-badge").forEach(node=>node.remove());
  }
  function burst({coins=0,label="",from=null}={}){
    clearConfetti();
    const width=root.innerWidth||360,height=root.innerHeight||640;
    const rect=from&&from.getBoundingClientRect?from.getBoundingClientRect():null;
    const ox=rect&&rect.width?rect.left+rect.width/2:width/2,oy=rect&&rect.height?rect.top+rect.height/2:height*.35;
    const text=label||(coins>0?`Key term! +${coins} coins`:"Key term found!");
    const badge=doc.createElement("div");
    badge.className="flq-confetti-badge";badge.setAttribute("aria-hidden","true");badge.textContent=text;
    doc.body.append(badge);
    if(!reducedMotion()){
      const layer=doc.createElement("div");
      layer.className="flq-confetti";layer.setAttribute("aria-hidden","true");
      const count=34;
      for(let i=0;i<count;i++){
        const piece=doc.createElement("i"),angle=Math.random()*Math.PI*2,reach=70+Math.random()*Math.min(width,height)*.34;
        const mx=Math.cos(angle)*reach,my=Math.sin(angle)*reach-60,ribbon=i%4===3;
        if(ribbon){piece.className="is-ribbon";piece.style.setProperty("--c",RIBBONS[i%RIBBONS.length])}
        piece.style.setProperty("--x",`${Math.round(ox)}px`);piece.style.setProperty("--y",`${Math.round(oy)}px`);
        piece.style.setProperty("--s",`${ribbon?14:12+Math.round(Math.random()*10)}px`);
        piece.style.setProperty("--mx",`${Math.round(mx)}px`);piece.style.setProperty("--my",`${Math.round(my)}px`);
        piece.style.setProperty("--ex",`${Math.round(mx*1.15)}px`);piece.style.setProperty("--ey",`${Math.round(my+height*.45)}px`);
        piece.style.setProperty("--r",`${Math.round((Math.random()-.5)*540)}deg`);
        piece.style.setProperty("--d",`${1300+Math.round(Math.random()*500)}ms`);piece.style.setProperty("--w",`${Math.round(Math.random()*140)}ms`);
        layer.append(piece);
      }
      doc.body.append(layer);
    }
    confettiTimer=setTimeout(clearConfetti,2100);
    return true;
  }
  root.FinLitCoinConfetti={burst,clear:clearConfetti};

  // ---------- Word Quest screen state ----------
  const screen=$("#worldGameScreen"),experience=$("#wgPuzzleExperience"),app=$("#app");
  const phone=()=>{try{return root.matchMedia("(max-width: 640px)").matches}catch(_){return false}};
  function closeSheet(){
    if(!screen||!screen.classList.contains("wg-sheet-open"))return;
    screen.classList.remove("wg-sheet-open");
    $("#wgSheetBackdrop")?.classList.remove("is-open");
    $("#wgInfoButton")?.setAttribute("aria-expanded","false");
  }
  function openSheet(){
    if(!screen)return;
    screen.classList.add("wg-sheet-open");
    $("#wgSheetBackdrop")?.classList.add("is-open");
    $("#wgInfoButton")?.setAttribute("aria-expanded","true");
    $("#wgSheetClose")?.focus({preventScroll:true});
  }
  function syncScreen(){
    if(!screen||!experience)return;
    const visible=!screen.classList.contains("hidden"),playing=visible&&!experience.classList.contains("hidden");
    // only write when something changes: an unconditional class write would re-trigger this observer
    const set=(node,name,on)=>{if(node&&node.classList.contains(name)!==on)node.classList.toggle(name,on)};
    set(screen,"wg-playing",playing);
    set(app,"flq-game-open",visible);
    set(doc.body,"flq-no-scroll",playing&&phone());
    if(!visible)closeSheet();
    if(!playing)set($("#wgMissionCard"),"is-expanded",false);
  }
  if(screen&&experience&&root.MutationObserver){
    const observer=new MutationObserver(syncScreen);
    observer.observe(screen,{attributes:true,attributeFilter:["class"]});
    observer.observe(experience,{attributes:true,attributeFilter:["class"]});
    root.addEventListener("resize",syncScreen);
    syncScreen();
  }
  $("#wgInfoButton")?.addEventListener("click",()=>screen.classList.contains("wg-sheet-open")?closeSheet():openSheet());
  $("#wgSheetBackdrop")?.addEventListener("click",closeSheet);
  $("#wgSheetClose")?.addEventListener("click",()=>{closeSheet();$("#wgInfoButton")?.focus({preventScroll:true})});

  // coin balance mirror for the compact puzzle header
  const coins=$("#wgCoins"),chip=$("#wgCoinChip");
  if(coins&&chip&&root.MutationObserver){
    const copy=()=>{chip.textContent=coins.textContent};
    new MutationObserver(copy).observe(coins,{childList:true,characterData:true,subtree:true});
    copy();
  }

  // mission: compact line on phones, tap (or Enter/Space) to read the full card; opens by itself when a definition is revealed
  const mission=$("#wgMissionCard"),missionWord=$("#wgMissionWord"),missionText=$("#wgMissionDefinition");
  if(mission&&missionWord&&missionText){
    mission.tabIndex=0;
    const toggle=()=>{if(screen.classList.contains("wg-playing")&&phone())mission.classList.toggle("is-expanded")};
    mission.addEventListener("click",toggle);
    mission.addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();toggle()}});
    if(root.MutationObserver){
      let lastWord="";
      new MutationObserver(()=>{
        const word=missionWord.textContent||"",revealed=word&&word!=="—"&&!word.includes("_")&&!/^Solve |^Find /.test(missionText.textContent||"");
        if(word!==lastWord){lastWord=word;mission.classList.toggle("is-expanded",Boolean(revealed)&&screen.classList.contains("wg-playing")&&phone())}
      }).observe(mission,{childList:true,characterData:true,subtree:true});
    }
  }

  // ---------- Daily reward popup ----------
  const reward=$("#dailyReward"),rewardOpen=$("#dailyRewardOpen"),rewardBackdrop=$("#dailyRewardBackdrop"),claim=$("#dailyRewardClaim");
  function closeReward(){
    if(!reward||!reward.classList.contains("is-open"))return;
    reward.classList.remove("is-open");rewardBackdrop?.classList.remove("is-open");
    rewardOpen?.setAttribute("aria-expanded","false");rewardOpen?.focus({preventScroll:true});
  }
  function openReward(){
    if(!reward)return;
    reward.classList.add("is-open");rewardBackdrop?.classList.add("is-open");
    rewardOpen?.setAttribute("aria-expanded","true");
    (claim&&!claim.disabled?claim:$("#dailyRewardClose"))?.focus({preventScroll:true});
  }
  function syncRewardDot(){
    if(!rewardOpen||!claim)return;
    const ready=!claim.disabled&&Boolean(claim.textContent);
    rewardOpen.classList.toggle("is-ready",ready);
    rewardOpen.setAttribute("aria-label",ready?"Daily reward: ready to claim":"Daily reward");
  }
  if(reward&&rewardOpen){
    rewardOpen.setAttribute("aria-expanded","false");
    rewardOpen.addEventListener("click",()=>reward.classList.contains("is-open")?closeReward():openReward());
    rewardBackdrop?.addEventListener("click",closeReward);
    $("#dailyRewardClose")?.addEventListener("click",closeReward);
    if(claim&&root.MutationObserver)new MutationObserver(syncRewardDot).observe(claim,{attributes:true,attributeFilter:["disabled"],childList:true,characterData:true,subtree:true});
    syncRewardDot();
    const home=$("#worldSelectScreen");
    if(home&&root.MutationObserver)new MutationObserver(()=>{if(home.classList.contains("hidden"))closeReward()}).observe(home,{attributes:true,attributeFilter:["class"]});
  }
  doc.addEventListener("keydown",event=>{if(event.key==="Escape"){closeReward();closeSheet()}});
})(typeof window!=="undefined"?window:globalThis);

(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitCurrencyRush=api;if(root.document){const boot=()=>api.init({window:root,document:root.document,data:root.FINLIT_CURRENCY_RUSH_DATA,audio:root.FinLitBonusAudio});if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",boot,{once:true});else root.setTimeout(boot,0)}})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const FLAG_BY_CODE=Object.freeze({AED:"🇦🇪",ARS:"🇦🇷",AUD:"🇦🇺",BDT:"🇧🇩",BHD:"🇧🇭",BRL:"🇧🇷",BTN:"🇧🇹",CAD:"🇨🇦",CDF:"🇨🇩",CHF:"🇨🇭",CNY:"🇨🇳",COP:"🇨🇴",COU:"🇨🇴",CUP:"🇨🇺",CZK:"🇨🇿",DOP:"🇩🇴",EGP:"🇪🇬",ERN:"🇪🇷",ETB:"🇪🇹",EUR:"🇪🇺",FKP:"🇫🇰",GBP:"🇬🇧",GEL:"🇬🇪",GMD:"🇬🇲",HKD:"🇭🇰",HUF:"🇭🇺",IDR:"🇮🇩",INR:"🇮🇳",JPY:"🇯🇵",KES:"🇰🇪",KHR:"🇰🇭",KRW:"🇰🇷",KWD:"🇰🇼",LAK:"🇱🇦",LBP:"🇱🇧",LKR:"🇱🇰",LRD:"🇱🇷",MAD:"🇲🇦",MGA:"🇲🇬",MNT:"🇲🇳",MVR:"🇲🇻",MXN:"🇲🇽",MYR:"🇲🇾",NAD:"🇳🇦",NOK:"🇳🇴",NPR:"🇳🇵",PEN:"🇵🇪",PLN:"🇵🇱",RSD:"🇷🇸",RUB:"🇷🇺",SAR:"🇸🇦",SCR:"🇸🇨",SDG:"🇸🇩",SEK:"🇸🇪",SGD:"🇸🇬",SRD:"🇸🇷",SYP:"🇸🇾",THB:"🇹🇭",TND:"🇹🇳",TRY:"🇹🇷",TWD:"🇹🇼",USD:"🇺🇸",UZS:"🇺🇿",VED:"🇻🇪",VES:"🇻🇪",VND:"🇻🇳",XCD:"🌎",XDR:"🌐",YER:"🇾🇪",ZAR:"🇿🇦"});
  const countLetters=value=>[...String(value||"").toUpperCase()].reduce((counts,letter)=>(counts[letter]=(counts[letter]||0)+1,counts),{});
  function canFormCode(code,wheel){const available=countLetters(wheel);return /^[A-Z]{3}$/.test(String(code||"").toUpperCase())&&Object.entries(countLetters(code)).every(([letter,count])=>(available[letter]||0)>=count)}
  function answersForRound(data,round){return round.requiredCodes.filter(code=>data.currencies[code]&&canFormCode(code,round.wheel))}
  const STAGE_MODES=Object.freeze([
    Object.freeze({id:"study",label:"GUIDED STUDY",reference:"full"}),
    Object.freeze({id:"recall",label:"CODE RECALL",reference:"code-hidden"}),
    Object.freeze({id:"memory",label:"MEMORY CHALLENGE",reference:"hidden"}),
  ]);
  function stageForNumber(data,stageNumber=1){
    const total=(data?.rounds?.length||0)*STAGE_MODES.length,number=Math.min(Math.max(1,Number(stageNumber)||1),Math.max(1,total));
    const wheelIndex=Math.floor((number-1)/STAGE_MODES.length),modeIndex=(number-1)%STAGE_MODES.length;
    return{number,total,wheelNumber:wheelIndex+1,round:data.rounds[wheelIndex]||data.rounds[0],mode:STAGE_MODES[modeIndex]};
  }
  function createSession(data,roundNumber=1,options={}){
    const round=data.rounds.find(item=>item.number===roundNumber)||data.rounds[0],scoring=data.scoring;
    const required=answersForRound(data,round),duration=Math.max(1,Number(options.durationSeconds)||scoring.durationSeconds);
    const state={round,required,found:[],attempts:0,correctAttempts:0,score:0,streak:0,bestStreak:0,streakBonus:0,completionBonus:0,timeBonus:0,remaining:duration,finished:false,completed:false};
    function submit(rawCode,remaining=state.remaining){
      if(state.finished)return{status:"finished",score:state.score};
      const code=String(rawCode||"").trim().toUpperCase();state.attempts++;
      if(state.found.includes(code)){state.streak=0;return{status:"duplicate",code,score:state.score}}
      if(!required.includes(code)){state.streak=0;return{status:"invalid",code,score:state.score}}
      state.correctAttempts++;state.found.push(code);state.score+=scoring.code;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);
      let bonus=0;
      if(state.streak%scoring.streakLength===0){bonus=scoring.streak;state.streakBonus+=bonus;state.score+=bonus}
      if(state.found.length===required.length){
        state.completed=true;state.finished=true;state.remaining=Math.max(0,Math.floor(Number(remaining)||0));
        state.completionBonus=scoring.completion;state.timeBonus=state.remaining*scoring.perSecond;state.score+=state.completionBonus+state.timeBonus;
      }
      return{status:"correct",code,bonus,completed:state.completed,currency:data.currencies[code],score:state.score};
    }
    function tick(seconds=1){if(state.finished)return state.remaining;state.remaining=Math.max(0,state.remaining-Math.max(0,Number(seconds)||0));if(state.remaining<=0)state.finished=true;return state.remaining}
    function finish(){state.finished=true;return summary()}
    function summary(){return{...state,found:[...state.found],missed:required.filter(code=>!state.found.includes(code)),accuracy:state.attempts?Math.round(state.correctAttempts/state.attempts*100):0}}
    return{state,submit,tick,finish,summary};
  }
  function displayCountry(value){return String(value||"").toLowerCase().replace(/(^|[\s([\-])([a-zà-ž])/g,(_,lead,char)=>lead+char.toUpperCase()).replace(/\bAnd\b/g,"and").replace(/\bOf\b/g,"of").replace(/\bThe\b/g,"the").replace(/\bUsa\b/g,"USA").replace(/\bImf\b/g,"IMF")}
  function countrySummary(currency){
    const countries=currency.countries.map(displayCountry);
    if(currency.code==="EUR")return`Used across the euro area and ${countries.length} listed territories`;
    if(currency.code==="USD")return`United States and ${Math.max(0,countries.length-1)} other listed economies`;
    if(countries.length<=2)return countries.join(" · ");
    return`${countries[0]} + ${countries.length-1} more`;
  }
  const flagFor=code=>FLAG_BY_CODE[code]||"🌐";

  function init({window:win,document:doc,data,audio}={}){
    if(!win||!doc||!data)return null;
    const screen=doc.getElementById("currencyRushScreen");if(!screen)return null;
    const $=id=>doc.getElementById(id),requestedStage=Number(new URLSearchParams(win.location.search).get("round"));let session=null,stageNumber=Number.isInteger(requestedStage)&&requestedStage>=1&&requestedStage<=data.rounds.length*STAGE_MODES.length?requestedStage:1,currentStage=stageForNumber(data,stageNumber),timer=null,selected=[],pointerDown=false,pointerMoved=false,pointerId=null,pointerPoint=null,revealTimer=null,launchSource="learning";
    const allScreens=["welcomeScreen","worldSelectScreen","worldGameScreen","dashboardScreen","workbookScreen"];
    function syncMusic(){const enabled=audio?.isMusicEnabled?.()!==false,button=$("crMusicToggle");button.textContent=enabled?"🔊":"🔇";button.setAttribute("aria-pressed",String(!enabled));button.setAttribute("aria-label",enabled?"Mute background music":"Unmute background music");button.title=button.getAttribute("aria-label")}
    function show(options={}){launchSource=options.source||launchSource||"learning";allScreens.forEach(id=>$(id)?.classList.add("hidden"));screen.classList.remove("hidden");doc.body.classList.add("currency-rush-active");audio?.unlock?.();audio?.startMusic?.();syncMusic();startRound(options.stage||stageNumber)}
    function leave(){stopTimer();screen.classList.add("hidden");doc.body.classList.remove("currency-rush-active");const url=new URL(win.location.href);url.searchParams.delete("bonus");url.searchParams.delete("round");win.history.replaceState({},"",url);if(launchSource==="crossword-bonus")$("worldGameScreen")?.classList.remove("hidden");else if(typeof win.showWorldSelect==="function"){win.showWorldSelect();win.renderWorldJourneyMap?.("learning")}else $("worldSelectScreen")?.classList.remove("hidden")}
    function startRound(number){
      stopTimer();stageNumber=Math.min(data.rounds.length*STAGE_MODES.length,Math.max(1,Number(number)||1));currentStage=stageForNumber(data,stageNumber);session=createSession(data,currentStage.wheelNumber);selected=[];
      const hasReference=currentStage.mode.reference!=="hidden";screen.classList.toggle("is-guided-round",hasReference);screen.classList.toggle("is-memory-round",!hasReference);screen.dataset.learningStage=currentStage.mode.id;
      $("crRoundLabel").textContent=`ROUND ${stageNumber} OF ${currentStage.total} · ${currentStage.mode.label}`;$("crRoundTitle").textContent=`Currency Wheel ${currentStage.wheelNumber} · Stage ${(stageNumber-1)%3+1}`;
      $("crReferencePanel").classList.toggle("hidden",!hasReference);$("crReferenceTitle").textContent=currentStage.mode.reference==="full"?"Currency Reference":"Country & Currency Clues";$("crReferenceNote").textContent=currentStage.mode.reference==="full"?"Study the country, currency, and code while you play.":"Recall each three-letter code from the country and currency name.";$("crCountLabel").textContent=hasReference?"CURRENCIES FOUND":"CURRENCIES REMAINING";
      $("crResults").classList.add("hidden");$("crReveal").classList.add("hidden");renderWheel();renderStats();renderFound();setMessage("Connect three letters to discover a currency","");
      timer=win.setInterval(()=>{session.tick(1);renderStats();if(session.state.finished){stopTimer();showResults()}},1000);
    }
    function stopTimer(){if(timer!==null)win.clearInterval(timer);timer=null}
    function renderStats(){$("crTime").textContent=String(Math.ceil(session.state.remaining)).padStart(2,"0");$("crScore").textContent=session.state.score.toLocaleString();$("crFoundCount").textContent=currentStage.mode.reference!=="hidden"?`${session.state.found.length} / ${session.state.required.length}`:String(session.state.required.length-session.state.found.length);$("crTimerRing").style.setProperty("--time-ratio",session.state.remaining/data.scoring.durationSeconds)}
    function renderWheel(){
      const wheel=$("crWheel");wheel.querySelectorAll(".cr-letter").forEach(item=>item.remove());
      [...session.state.round.wheel].forEach((letter,index)=>{const angle=index/9*Math.PI*2-Math.PI/2,button=doc.createElement("button");button.type="button";button.className="cr-letter";button.dataset.index=String(index);button.dataset.letter=letter;button.textContent=letter;button.setAttribute("aria-label",`Letter ${letter}, position ${index+1}`);button.style.setProperty("--x",`${50+39*Math.cos(angle)}%`);button.style.setProperty("--y",`${50+39*Math.sin(angle)}%`);wheel.append(button)});renderSelection()
    }
    function renderSelection(){
      const tiles=[...$("crWheel").querySelectorAll(".cr-letter")];tiles.forEach(tile=>tile.classList.toggle("selected",selected.includes(Number(tile.dataset.index))));
      const points=selected.map(index=>{const tile=tiles[index];return tile?`${tile.offsetLeft+tile.offsetWidth/2},${tile.offsetTop+tile.offsetHeight/2}`:""}).filter(Boolean).join(" ");$("crTrace").setAttribute("points",points);
      $("crCurrentWord").textContent=selected.map(index=>session.state.round.wheel[index]).join("")||"—";
    }
    function addIndex(index){if(selected.length>=3||selected.includes(index))return false;selected.push(index);audio?.letter?.(selected.length);renderSelection();return true}
    function clear(){selected=[];renderSelection()}
    function submitSelection(){const code=selected.map(index=>session.state.round.wheel[index]).join("");clear();if(code.length!==3){if(code)audio?.cancel?.();return}submit(code)}
    function submit(code){
      const result=session.submit(code,session.state.remaining);renderStats();
      if(result.status==="correct"){audio?.correct?.();audio?.coin?.();showReveal(result);renderFound();setMessage(`${result.code} found! +${data.scoring.code}${result.bonus?` · +${result.bonus} streak bonus`:""}`,"correct");if(result.completed){stopTimer();audio?.complete?.();win.setTimeout(showResults,1250)}}
      else if(result.status==="duplicate"){audio?.duplicate?.();setMessage(`${result.code} already discovered`,"duplicate")}
      else if(result.status==="invalid"){audio?.wrong?.();setMessage(`${result.code||"That code"} is not on this currency board`,"invalid")}
    }
    function setMessage(text,status){const el=$("crMessage");el.textContent=text;el.className=`cr-message${status?` ${status}`:""}`}
    function showReveal(result){
      win.clearTimeout(revealTimer);const currency=result.currency,reveal=$("crReveal");$("crRevealFlag").textContent=flagFor(result.code);$("crRevealCode").textContent=`${result.code} FOUND!`;$("crRevealName").textContent=currency.name;$("crRevealCountry").textContent=countrySummary(currency);$("crRevealPoints").textContent=`+${data.scoring.code} KNOWLEDGE POINTS`;reveal.classList.remove("hidden");reveal.classList.remove("is-showing");void reveal.offsetWidth;reveal.classList.add("is-showing");coinRain();revealTimer=win.setTimeout(()=>reveal.classList.add("hidden"),2200)
    }
    function coinRain(){const layer=$("crCoinRain");layer.innerHTML="";for(let index=0;index<24;index++){const coin=doc.createElement("i");coin.textContent=index%4?"$":"✦";coin.style.setProperty("--left",`${(index*37)%100}%`);coin.style.setProperty("--delay",`${(index%8)*.045}s`);coin.style.setProperty("--drift",`${(index%5-2)*24}px`);layer.append(coin)}win.setTimeout(()=>{layer.innerHTML=""},1600)}
    function renderFound(){
      const list=$("crFoundList");list.innerHTML="";if(currentStage.mode.reference==="hidden")return;
      session.state.required.forEach(code=>{const currency=data.currencies[code],found=session.state.found.includes(code),showCode=currentStage.mode.reference==="full"||found,item=doc.createElement("li");item.className=found?"is-found":"";item.setAttribute("aria-label",`${countrySummary(currency)}, ${currency.name}${showCode?`, code ${code}`:", code hidden"}${found?", discovered":""}`);const codeText=showCode?code:"???";item.innerHTML=`<span>${found?"✓":flagFor(code)}</span><div><small>${countrySummary(currency)}</small><b>${currency.name}</b></div><strong class="cr-reference-code${showCode?"":" is-hidden-code"}">${codeText}</strong>`;list.append(item)})
    }
    function showResults(){
      stopTimer();const summary=session.finish(),results=$("crResults");$("crResultHeadline").textContent=summary.completed?"Currency Board Complete!":"Time's Up!";$("crResultScore").textContent=summary.score.toLocaleString();$("crResultFound").textContent=`${summary.found.length} / ${summary.required.length}`;$("crResultAccuracy").textContent=`${summary.accuracy}%`;$("crResultStreak").textContent=`+${summary.streakBonus}`;$("crResultBonuses").textContent=summary.completed?`Completion +${summary.completionBonus} · Time +${summary.timeBonus}`:"Completion and time bonuses require every code.";
      const resultItem=code=>{const currency=data.currencies[code],item=doc.createElement("article");item.innerHTML=`<span>${flagFor(code)}</span><div><strong>${code} · ${currency.name}</strong><small>${countrySummary(currency)}</small></div>`;return item};
      const collection=$("crCollection");collection.innerHTML="";summary.found.forEach(code=>collection.append(resultItem(code)));
      const missed=$("crMissed");missed.innerHTML="";if(summary.missed.length)summary.missed.forEach(code=>missed.append(resultItem(code)));else{const perfect=doc.createElement("p");perfect.textContent="None — perfect board!";missed.append(perfect)}results.classList.remove("hidden");$("crReplay").focus()
    }
    const wheel=$("crWheel");
    function currencyTargets(){return[...wheel.querySelectorAll(".cr-letter")].map(tile=>{const rect=tile.getBoundingClientRect();return{tile,x:rect.left+rect.width/2,y:rect.top+rect.height/2,radius:Math.max(rect.width,rect.height)*.7}})}
    function processPointer(event){const samples=typeof event.getCoalescedEvents==="function"?event.getCoalescedEvents():[],points=[...samples,event].map(sample=>({x:sample.clientX,y:sample.clientY})).filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y));points.forEach(point=>{const targets=win.FinLitWheelInteraction?.targetsAlongSegment(pointerPoint||point,point,currencyTargets())||[];targets.forEach(target=>{if(addIndex(Number(target.tile.dataset.index)))pointerMoved=true});pointerPoint=point})}
    wheel.addEventListener("pointerdown",event=>{const tile=event.target.closest(".cr-letter");if(!tile)return;pointerDown=true;pointerMoved=false;pointerId=event.pointerId;pointerPoint={x:event.clientX,y:event.clientY};wheel.setPointerCapture?.(event.pointerId);addIndex(Number(tile.dataset.index));event.preventDefault()});
    wheel.addEventListener("pointermove",event=>{if(!pointerDown||event.pointerId!==pointerId)return;event.preventDefault();processPointer(event)});
    const endPointer=event=>{if(!pointerDown||event.pointerId!==pointerId)return;processPointer(event);pointerDown=false;pointerId=null;pointerPoint=null;if(selected.length===3)submitSelection();else if(pointerMoved){audio?.cancel?.();clear()}};wheel.addEventListener("pointerup",endPointer);wheel.addEventListener("pointercancel",()=>{pointerDown=false;pointerMoved=false;pointerId=null;pointerPoint=null;if(selected.length)audio?.cancel?.();clear()});
    wheel.addEventListener("click",event=>{if(event.detail!==0)return;const tile=event.target.closest(".cr-letter");if(tile&&addIndex(Number(tile.dataset.index))&&selected.length===3)submitSelection()});
    screen.addEventListener("keydown",event=>{if(screen.classList.contains("hidden")||session?.state.finished)return;const key=event.key.toUpperCase();if(/^[A-Z]$/.test(key)){const index=[...session.state.round.wheel].findIndex((letter,index)=>letter===key&&!selected.includes(index));if(index>=0){event.preventDefault();addIndex(index);if(selected.length===3)submitSelection()}}else if(event.key==="Enter"){event.preventDefault();submitSelection()}else if(event.key==="Backspace"){event.preventDefault();selected.pop();renderSelection()}else if(event.key==="Escape"){event.preventDefault();if(selected.length)audio?.cancel?.();clear()}});
    $("crClear").onclick=()=>{if(selected.length)audio?.cancel?.();clear()};$("crReplay").onclick=()=>startRound(stageNumber);$("crNextRound").onclick=()=>startRound(stageNumber%currentStage.total+1);$("crExit").onclick=leave;$("crResultsExit").onclick=leave;$("crMusicToggle").onclick=()=>{audio?.toggleMusic?.();syncMusic()};
    win.addEventListener("resize",renderSelection);win.openCurrencyRush=(options={})=>{launchSource=options.source||"learning";const url=new URL(win.location.href);url.searchParams.set("bonus","currency-rush");if(options.stage)url.searchParams.set("round",String(options.stage));win.history.replaceState({},"",url);show(options)};
    const controller={show,leave,startRound,submit:code=>submit(code),getSession:()=>session};
    win.FinLitCurrencyRushController=controller;
    if(new URLSearchParams(win.location.search).get("bonus")==="currency-rush")win.setTimeout(()=>show({source:"learning"}),0);
    return controller;
  }
  return{STAGE_MODES,countLetters,canFormCode,answersForRound,stageForNumber,createSession,displayCountry,countrySummary,flagFor,init};
});

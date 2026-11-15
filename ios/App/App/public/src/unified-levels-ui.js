(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitUnifiedUI=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  // DEVELOPMENT-ONLY unified level map. Loaded dynamically by word-game-app.js only when the local dev flag is on;
  // this file is deliberately not part of index.html, scripts/build-www.sh or the iOS bundle.
  // It renders into the existing level-select section of the word-game screen and never owns completion data:
  // canonicalPuzzleProgress stays the source of truth and FinLitUnifiedProgress only derives access from it.
  const INTRO={eyebrow:"YOUR JOURNEY",title:"Levels",note:"Solve each puzzle to unlock the next level."};
  const LABELS={completed:"completed",current:"current level",available:"unlocked",locked:"locked"};
  let ctx=null,original=null;

  function sequence(){return ctx.manifest}
  function states(){return ctx.progress.levelStates(ctx.bridge.save(),sequence(),ctx.bridge.now())}
  function settle(){
    const result=ctx.progress.apply(ctx.bridge.save(),sequence(),ctx.bridge.now());
    if(result.changed&&!result.readOnly)ctx.bridge.persist();
    return result;
  }
  function canLaunch(puzzleId){return ctx.progress.canPlay(ctx.bridge.save(),sequence(),puzzleId,ctx.bridge.now())}
  // The lowest-numbered level that is playable and not yet completed (new players: Level 1). null when everything is complete.
  function nextLevel(){settle();const item=states().find(i=>i.playable&&i.state!=="completed");return item?{level:item.level,puzzleId:item.puzzleId}:null}
  function resumeTarget(){const r=ctx.progress.resume(ctx.bridge.save(),sequence(),ctx.bridge.now());return r}

  function rememberIntro(){
    if(original)return;const doc=ctx.document,box=doc.querySelector(".wg-level-select-intro");if(!box)return;
    original={eyebrow:box.querySelector("p").textContent,title:box.querySelector("h2").textContent,note:box.querySelector("span").textContent};
  }
  function setIntro(values){const box=ctx.document.querySelector(".wg-level-select-intro");if(!box)return;box.querySelector("p").textContent=values.eyebrow;box.querySelector("h2").textContent=values.title;box.querySelector("span").textContent=values.note}
  function restore(){if(original){setIntro(original)}ctx&&ctx.document.getElementById("wgLevelList")&&ctx.document.getElementById("wgLevelList").classList.remove("unified-level-list")}

  function renderMap(){
    const doc=ctx.document,list=doc.getElementById("wgLevelList");rememberIntro();setIntro(INTRO);settle();
    const items=states(),target=resumeTarget();
    const heading=doc.getElementById("wgPuzzleTitle");if(heading)heading.textContent="Levels";
    list.classList.add("unified-level-list");list.textContent="";
    const play=doc.createElement("button");play.type="button";play.className="unified-play";play.id="unifiedPlayButton";
    play.innerHTML=`<b>Play</b><small>Level ${target?target.level:1}</small>`;
    play.setAttribute("aria-label",`Play Level ${target?target.level:1}`);
    play.onclick=()=>{const t=resumeTarget();if(t)ctx.bridge.open(t.puzzleId,t.level)};
    list.append(play);
    const grid=doc.createElement("div");grid.className="unified-level-grid";grid.setAttribute("role","list");grid.setAttribute("aria-label","Levels");
    items.forEach(item=>{
      const cell=doc.createElement("div");cell.setAttribute("role","listitem");
      const button=doc.createElement("button");button.type="button";button.className=`unified-level is-${item.state}`;button.dataset.level=String(item.level);button.dataset.puzzleId=item.puzzleId;
      button.setAttribute("aria-label",`Level ${item.level}, ${LABELS[item.state]}`);
      button.innerHTML=`<span>${item.level}</span>${item.state==="completed"?'<i aria-hidden="true">✓</i>':item.state==="locked"?'<i aria-hidden="true">🔒</i>':""}`;
      if(item.playable)button.onclick=()=>ctx.bridge.open(item.puzzleId,item.level);
      else{button.disabled=true;button.setAttribute("aria-disabled","true")}
      cell.append(button);grid.append(cell);
    });
    list.append(grid);
  }
  function decorateHeader(){
    const doc=ctx.document,items=states(),done=items.filter(i=>i.state==="completed").length;
    const set=(id,v)=>{const el=doc.getElementById(id);if(el)el.textContent=v};
    set("wgWordsSolved",done);set("wgWordsTotal",items.length);
    const bar=doc.getElementById("wgWordsBar");if(bar)bar.style.width=`${items.length?Math.min(100,done/items.length*100):0}%`;
    set("wgWorldName","FINLIT QUEST");
    const label=doc.querySelector(".wg-words-solved>span");if(label)label.textContent="LEVELS COMPLETE";
  }
  function afterCompletion(){settle()}
  function rewardRecord(record,puzzleId){return puzzleId?ctx.progress.lineageRewardRecord(ctx.bridge.save(),sequence(),puzzleId):record}

  function mount(options){
    ctx=options;const doc=ctx.document;
    // The welcome page is the single hub: no extra Play entries are injected.
    doc.documentElement.dataset.finlitUnifiedDev="on";
  }
  return {mount,isMounted:()=>!!ctx,nextLevel,renderMap,restore,decorateHeader,afterCompletion,rewardRecord,canLaunch,INTRO,LABELS};
});

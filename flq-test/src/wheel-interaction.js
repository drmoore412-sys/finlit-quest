(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.FinLitWheelInteraction=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  function transitionSelection(selected,tileId){
    const current=[...(selected||[])];
    if(tileId===undefined||tileId===null)return{selected:current,action:"ignored"};
    if(current.at(-1)===tileId)return{selected:current,action:"ignored"};
    if(current.length>1&&current.at(-2)===tileId){
      current.pop();
      return{selected:current,action:"backtracked"};
    }
    if(current.includes(tileId))return{selected:current,action:"ignored"};
    current.push(tileId);
    return{selected:current,action:"added"};
  }

  function wordFor(selected,tiles){
    const byId=new Map((tiles||[]).map(tile=>[tile.id,tile.letter]));
    return(selected||[]).map(id=>byId.get(id)||"").join("");
  }

  // Words accepted in EVERY world whenever the current wheel can spell them. They are optional bonus words:
  // they never count toward completion, never pay coins or XP, and are not saved. A word that is also a required
  // answer of the puzzle is classified as that answer first, so its normal reward and progression are untouched.
  const GLOBAL_BONUS_WORDS=Object.freeze(["DUE"]);
  // Same multiset rule as FinLitGameEngine.canForm: every letter must be available, repeats need repeated tiles.
  function canSpell(word,letters){
    const available=[...(letters||[])];
    return [...String(word||"")].every(letter=>{const index=available.indexOf(letter);if(index<0)return false;available.splice(index,1);return true});
  }
  function isGlobalBonus(word,options){return GLOBAL_BONUS_WORDS.includes(word)&&canSpell(word,options&&options.wheelLetters)}
  function classifyWord(word,targetWords,foundWords,options){
    if(!word)return{status:"empty"};
    if(foundWords&&foundWords.has(word))return{status:"duplicate",word};
    if((targetWords||[]).includes(word))return{status:"target",word};
    if(isGlobalBonus(word,options))return options.foundBonus&&options.foundBonus.has(word)?{status:"duplicate",word,bonus:true}:{status:"bonus",word};
    return{status:"invalid",word};
  }

  function canSubmitTapWord(word,targetWords,foundWords,options){
    const targets=targetWords||[],found=foundWords||new Set();
    const isAnswer=targets.includes(word)||found.has(word)||isGlobalBonus(word,options);
    const extendsToUnfinishedAnswer=targets.some(candidate=>candidate!==word&&candidate.startsWith(word)&&!found.has(candidate));
    return isAnswer&&!extendsToUnfinishedAnswer;
  }

  // A required word that is also the start of a longer, still-unfound required
  // word (PAY / PAYMENT) is not auto-submitted by taps, so the player can keep
  // building the longer word. Without another way to confirm it, a player who
  // only taps could never submit the shorter word, which looked like a correct
  // answer being rejected. isDeferredTarget() identifies exactly that state so
  // the UI can say so, and shouldSubmitOnRetap() is the confirmation: tapping
  // the last selected tile again submits the pending word. Swipe release and
  // keyboard Enter continue to work exactly as before.
  function isDeferredTarget(word,targetWords,foundWords){
    const targets=targetWords||[],found=foundWords||new Set();
    return Boolean(word)&&targets.includes(word)&&!found.has(word)&&!canSubmitTapWord(word,targets,found);
  }
  function shouldSubmitOnRetap(retappedLastTile,word,targetWords,foundWords,options){
    if(!retappedLastTile)return false;
    if(isDeferredTarget(word,targetWords,foundWords))return true;
    const targets=targetWords||[],found=foundWords||new Set();
    return isGlobalBonus(word,options)&&!targets.includes(word)&&targets.some(candidate=>candidate.startsWith(word)&&!found.has(candidate));
  }

  function shuffledOrder(tiles,shuffleFn){
    const source=[...(tiles||[])];
    if(source.length<2)return source;
    let next=shuffleFn(source);
    for(let attempt=0;attempt<4&&next.every((tile,index)=>tile.id===source[index].id);attempt++)next=shuffleFn(source);
    if(next.every((tile,index)=>tile.id===source[index].id))next=[...source.slice(1),source[0]];
    return next;
  }

  function positionsFor(tileCount,radius=.38){
    if(!Number.isInteger(tileCount)||tileCount<1||tileCount>9)throw new RangeError("Letter wheels support 1-9 physical tiles.");
    return Array.from({length:tileCount},(_,index)=>{
      const angle=Math.PI*2*index/tileCount-Math.PI/2;
      return{x:.5+radius*Math.cos(angle),y:.5+radius*Math.sin(angle)};
    });
  }

  // Pointer events can be several pixels apart on busy mobile browsers. Test
  // the whole travelled segment, not only the latest event coordinate, so a
  // quick swipe cannot jump over a letter between two samples.
  function targetsAlongSegment(start,end,targets){
    if(!start||!end)return[];
    const dx=end.x-start.x,dy=end.y-start.y,lengthSquared=dx*dx+dy*dy;
    return(targets||[]).map((target,index)=>{
      const rawT=lengthSquared?((target.x-start.x)*dx+(target.y-start.y)*dy)/lengthSquared:0;
      const t=Math.max(0,Math.min(1,rawT)),x=start.x+dx*t,y=start.y+dy*t;
      return{target,index,t,distance:Math.hypot(target.x-x,target.y-y)};
    }).filter(hit=>hit.distance<=Math.max(1,Number(hit.target.radius)||1))
      .sort((a,b)=>a.t-b.t||a.distance-b.distance||a.index-b.index)
      .map(hit=>hit.target);
  }


  // ---------------------------------------------------------------------------
  // Shared gesture engine (crossword wheel and Currency Rush use the same code).
  //
  // The engine is a small pure state machine: it receives pointer positions in
  // client coordinates plus cached tile geometry ({id,x,y,radius}, radius = the
  // tile's visual radius) and returns what was added or removed. It never reads
  // the DOM, so a swipe costs no layout work and behaves identically at any
  // speed: the whole travelled segment is tested, never just the latest sample.
  //
  // enter     - a new tile is picked up when the path passes through the visible tile
  //             (within enter x radius of its centre). The old catch zone was ~1.4x the
  //             visible tile, so a straight swipe between two letters also clipped the
  //             letter beside the path and added it to the word. Measured with the
  //             gesture simulation: straight swipes were right 69% of the time at 1.4x
  //             and 97% at 1.0x. The press, the release and sliding in from the gap keep
  //             a more forgiving zone (start / release below) because there the player is aiming.
  // start     - a press this close to a tile (x radius) starts on that tile; farther away
  //             it only arms the swipe, which then picks up the first tile it slides over.
  // backtrack - the previous tile only removes the last letter when the path goes
  //             clearly inside it (backtrack x radius). Merely grazing it while
  //             turning toward the next tile no longer deletes a letter.
  // ---------------------------------------------------------------------------
  const GESTURE_DEFAULTS=Object.freeze({enter:1,start:1.3,backtrack:.55,release:1.6,releaseMargin:.3,max:Infinity});

  function closestApproach(start,end,target){
    const dx=end.x-start.x,dy=end.y-start.y,lengthSquared=dx*dx+dy*dy;
    const rawT=lengthSquared?((target.x-start.x)*dx+(target.y-start.y)*dy)/lengthSquared:0;
    const t=Math.max(0,Math.min(1,rawT)),x=start.x+dx*t,y=start.y+dy*t;
    return{t,distance:Math.hypot(target.x-x,target.y-y)};
  }
  function segmentHits(start,end,targets,scale){
    if(!start||!end)return[];
    const factor=scale||GESTURE_DEFAULTS.enter;
    return(targets||[]).map((target,index)=>{const hit=closestApproach(start,end,target);return{target,index,t:hit.t,distance:hit.distance}})
      .filter(hit=>hit.distance<=(Number(hit.target.radius)||1)*factor)
      .sort((a,b)=>a.t-b.t||a.distance-b.distance||a.index-b.index);
  }
  // The single tile under a point (nearest centre wins when tolerance zones overlap).
  function tileAtPoint(point,targets,scale){
    if(!point)return null;
    const factor=scale||GESTURE_DEFAULTS.start;let best=null,bestDistance=Infinity;
    (targets||[]).forEach(target=>{const distance=Math.hypot(point.x-target.x,point.y-target.y);if(distance<=(Number(target.radius)||1)*factor&&distance<bestDistance){best=target;bestDistance=distance}});
    return best;
  }
  function createGesture(options){
    const config=Object.assign({},GESTURE_DEFAULTS,options||{});
    let targets=[],selected=[],last=null,added=0,trail=[];
    function visit(hit,events){
      const id=hit.target.id;
      if(selected.at(-1)===id)return;
      if(selected.length>1&&selected.at(-2)===id){
        if(hit.distance<=(Number(hit.target.radius)||1)*config.backtrack){const removed=selected.pop();events.push({type:"backtrack",id:removed})}
        return;
      }
      if(selected.includes(id)||selected.length>=config.max)return;
      selected.push(id);added++;events.push({type:"add",id});
    }
    return{
      // seed keeps letters the player already tapped so a swipe can continue them.
      begin(point,tileTargets,seed){
        targets=tileTargets||[];selected=[...(seed||[])];added=0;last=point;trail=[point];
        const events=[],start=tileAtPoint(point,targets,config.start);
        // The player pressed this tile on purpose, so a press always counts as deep (it can undo the previous tile).
        if(start)visit({target:start,distance:0},events);
        return events;
      },
      advance(point){
        const events=[];
        if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return events;
        if(!last)last=point;
        segmentHits(last,point,targets,config.enter).forEach(hit=>visit(hit,events));
        last=point;trail.push(point);if(trail.length>10)trail.shift();return events;
      },
      // Finger lifted: finish the last segment, then accept ONE tile the finger was clearly heading into but stopped
      // just short of (released at its edge). Never guesses when two tiles are almost equally close.
      end(point){
        const events=this.advance(point);
        if(!point||!selected.length)return events;
        // Heading = from the most recent earlier sample at least 8px away (pointerup repeats the last move position).
        let anchor=null;for(let i=trail.length-1;i>=0;i--){if(Math.hypot(point.x-trail[i].x,point.y-trail[i].y)>=8){anchor=trail[i];break}}
        if(!anchor)return events;
        const ranked=targets.filter(target=>!selected.includes(target.id)).map(target=>({target,distance:Math.hypot(point.x-target.x,point.y-target.y),before:Math.hypot(anchor.x-target.x,anchor.y-target.y)})).sort((a,b)=>a.distance-b.distance);
        const best=ranked[0];
        if(!best)return events;
        const radius=Number(best.target.radius)||1,second=ranked[1];
        if(best.distance>radius*config.release||best.before<=best.distance)return events;
        if(second&&second.distance-best.distance<radius*config.releaseMargin&&second.distance<=(Number(second.target.radius)||1)*config.release)return events;
        visit({target:best.target,distance:best.distance},events);
        return events;
      },
      reset(){targets=[];selected=[];last=null;added=0;trail=[]},
      get selected(){return[...selected]},
      get added(){return added},
      get lastPoint(){return last}
    };
  }

  return{GLOBAL_BONUS_WORDS,canSpell,transitionSelection,wordFor,classifyWord,canSubmitTapWord,isDeferredTarget,shouldSubmitOnRetap,shuffledOrder,positionsFor,targetsAlongSegment,GESTURE_DEFAULTS,closestApproach,segmentHits,tileAtPoint,createGesture};
});

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
const W=require("../src/wheel-interaction.js");

// A wheel of n tiles of the given visual size inside a square box, laid out exactly like the game (percentage positions).
function wheel(n,box=310,tile=60,positions){
  const pos=positions||W.positionsFor(n);
  return{hub:{x:box/2,y:box/2},tiles:pos.map((p,i)=>({id:`t${i}`,letter:String.fromCharCode(65+i),x:p.x*box,y:p.y*box,radius:tile/2}))};
}
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const quad=(a,c,b,t)=>{const u=1-t;return{x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y}};
// Polyline through tile centres (via the hub for non-adjacent hops, as a player avoids tiles in between).
function route(w,seq,{curve=false}={}){
  const n=w.tiles.length,pts=[{...w.tiles[seq[0]]}];
  for(let k=1;k<seq.length;k++){
    const a=w.tiles[seq[k-1]],b=w.tiles[seq[k]],adjacent=((seq[k]-seq[k-1]+n)%n===1)||((seq[k-1]-seq[k]+n)%n===1);
    const control=adjacent&&!curve?null:{x:(a.x+b.x)/2*.35+w.hub.x*.65,y:(a.y+b.y)/2*.35+w.hub.y*.65};
    for(let s=1;s<=40;s++)pts.push(control?quad(a,control,b,s/40):lerp(a,b,s/40));
  }
  return pts.map(p=>({x:p.x,y:p.y}));
}
// Re-sample a path as pointer events roughly `step` px apart (small step = slow swipe, large step = fast swipe).
function events(path,step){
  const out=[path[0]];let acc=0;
  for(let i=1;i<path.length;i++){acc+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);if(acc>=step){out.push(path[i]);acc=0}}
  const last=path.at(-1);if(out.at(-1)!==last)out.push(last);return out;
}
function trace(w,pts,options){
  const g=W.createGesture(options);g.begin(pts[0],w.tiles);
  pts.slice(1).forEach(point=>g.advance(point));return g;
}
const ids=seq=>seq.map(i=>`t${i}`);

test("a quick swipe selects the same letters, in the same order, as a slow swipe over the same path",()=>{
  for(const n of [5,7,9]){
    const w=wheel(n),seq=[0,1,2,3].filter(i=>i<n);
    const slow=trace(w,events(route(w,seq),4)).selected,medium=trace(w,events(route(w,seq),24)).selected,fast=trace(w,events(route(w,seq),70)).selected;
    assert.deepEqual(slow,ids(seq));assert.deepEqual(medium,slow);assert.deepEqual(fast,slow);
  }
});

test("a pointer jump that skips over intermediate tiles still picks them up in travel order",()=>{
  const w=wheel(9),g=W.createGesture();g.begin(w.tiles[0],w.tiles);
  // one single sample from tile 0 straight to tile 2: the segment passes over tile 1 on the way
  const events2=g.advance(w.tiles[2]);
  assert.deepEqual(events2.map(e=>e.id),["t1","t2"]);
  assert.deepEqual(g.selected,["t0","t1","t2"]);
});

test("the final tile is processed from the pointer-up position and a missing last pointermove loses nothing",()=>{
  const w=wheel(7),pts=events(route(w,[0,1,2,3]),30),withoutLast=pts.slice(0,-1);
  const g=W.createGesture();g.begin(withoutLast[0],w.tiles);withoutLast.slice(1).forEach(p=>g.advance(p));
  assert.ok(g.selected.length<4||g.selected.at(-1)==="t3");
  g.end(pts.at(-1));
  assert.deepEqual(g.selected,ids([0,1,2,3]));
});

test("curved and wobbly gestures stay in order and never reorder letters to fit an answer",()=>{
  const w=wheel(8);
  for(const seq of [[0,1,2],[3,2,1,0],[0,2,4,6],[5,1,6]]){
    const got=trace(w,events(route(w,seq,{curve:true}),18)).selected;
    assert.deepEqual(got,ids(seq),`path ${seq}`);
  }
});

test("repeated letters are separate tiles and a tile is never used twice in one attempt",()=>{
  const w=wheel(6);w.tiles.forEach(t=>t.letter=["P","A","Y","M","E","N"][0]=== "P"?"P":"P");  // every tile spells the same letter
  const g=trace(w,events(route(w,[0,1,2]),20));
  assert.deepEqual(g.selected,["t0","t1","t2"]);
  assert.equal(W.wordFor(g.selected,w.tiles),"PPP");
  const again=W.createGesture();again.begin(w.tiles[0],w.tiles);again.advance(w.tiles[1]);again.advance(w.tiles[0]);again.advance(w.tiles[1]);
  assert.equal(new Set(again.selected).size,again.selected.length);
});

test("boundary tolerance: a path that clips a tile edge counts, one that clearly misses does not",()=>{
  const g=()=>{const x=W.createGesture(),tiles=[{id:"a",x:0,y:0,radius:30},{id:"b",x:200,y:0,radius:30}];x.begin({x:0,y:0},tiles);return{x,tiles}};
  let t=g();t.x.advance({x:200,y:W.GESTURE_DEFAULTS.enter*30-1});assert.deepEqual(t.x.selected,["a","b"]);
  t=g();t.x.advance({x:200,y:W.GESTURE_DEFAULTS.enter*30+8});assert.deepEqual(t.x.selected,["a"]);
});

test("overlapping tolerance zones resolve to the nearest tile, never to two distant tiles",()=>{
  const tiles=[{id:"a",x:0,y:0,radius:30},{id:"b",x:60,y:0,radius:30},{id:"far",x:400,y:0,radius:30}];
  assert.equal(W.tileAtPoint({x:20,y:0},tiles).id,"a");
  assert.equal(W.tileAtPoint({x:41,y:0},tiles).id,"b");
  assert.equal(W.tileAtPoint({x:200,y:0},tiles),null);
});

test("grazing the previous tile while turning toward the next one does not delete a letter",()=>{
  const tiles=[{id:"a",x:0,y:0,radius:30},{id:"b",x:70,y:0,radius:30},{id:"c",x:70,y:100,radius:30}];
  const g=W.createGesture();g.begin(tiles[0],tiles);g.advance(tiles[1]);
  g.advance({x:44,y:40});   // clips tile a's outer zone only
  g.advance(tiles[2]);
  assert.deepEqual(g.selected,["a","b","c"]);
});

test("dragging deliberately back into the previous tile removes only the last letter",()=>{
  const w=wheel(7),g=W.createGesture();g.begin(w.tiles[0],w.tiles);g.advance(w.tiles[1]);g.advance(w.tiles[2]);
  const events2=g.advance(w.tiles[1]);
  assert.deepEqual(events2,[{type:"backtrack",id:"t2"}]);
  assert.deepEqual(g.selected,["t0","t1"]);
});

test("a press in the gap beside a letter arms the swipe and picks up the first tile it slides over",()=>{
  const w=wheel(7),t0=w.tiles[0],pressPoint={x:t0.x+46,y:t0.y};            // 46px from the centre: outside the tile zone
  const g=W.createGesture();assert.deepEqual(g.begin(pressPoint,w.tiles),[]);
  g.advance(t0);g.advance(w.tiles[1]);g.advance(w.tiles[2]);
  assert.deepEqual(g.selected,["t0","t1","t2"]);
});

test("releasing just short of the final tile accepts that one tile, but never guesses between two",()=>{
  const tiles=[{id:"a",x:0,y:0,radius:30},{id:"b",x:140,y:0,radius:30}];
  let g=W.createGesture();g.begin({x:0,y:0},tiles);[20,60,100].forEach(x=>g.advance({x,y:0}));g.advance({x:96,y:0});
  const before=g.selected.length;g.end({x:96,y:0});
  assert.ok(before===1&&g.selected.length===2,"released 44px from the final tile while heading into it");
  const two=[{id:"a",x:0,y:0,radius:30},{id:"b",x:110,y:-24,radius:30},{id:"c",x:110,y:24,radius:30}];
  g=W.createGesture();g.begin({x:0,y:0},two);[20,40,60].forEach(x=>g.advance({x,y:0}));g.end({x:62,y:0});
  assert.deepEqual(g.selected,["a"],"two equally close candidates are ambiguous, so none is added");
});

test("gesture geometry is scale-free: the same relative path selects the same tiles at any wheel size",()=>{
  for(const [box,tile] of [[252,48],[304,58.5],[310,60],[415,66]]){
    const w=wheel(7,box,tile),got=trace(w,events(route(w,[1,2,3,4]),box/12)).selected;
    assert.deepEqual(got,ids([1,2,3,4]),`box ${box}`);
  }
});

test("a Currency Rush style capped gesture stops at three letters but can still backtrack",()=>{
  const w=wheel(9,415,66,Array.from({length:9},(_,i)=>({x:.5+.39*Math.cos(i/9*Math.PI*2-Math.PI/2),y:.5+.39*Math.sin(i/9*Math.PI*2-Math.PI/2)})));
  const g=trace(w,events(route(w,[0,1,2,3,4]),20),{max:3});
  assert.deepEqual(g.selected,["t0","t1","t2"]);
});

test("accuracy sweep: accurately traced answers are selected on the first attempt at slow, medium and fast speeds",()=>{
  let ok=0,total=0;
  for(const n of [5,6,7,8,9])for(const length of [3,4,5])for(let start=0;start<n&&length<=n;start++)for(const step of [5,20,48])for(const dir of [1,-1]){
    const w=wheel(n),seq=Array.from({length},(_,k)=>(start+dir*k+n*10)%n);
    const got=trace(w,events(route(w,seq),step)).selected;total++;if(got.join()===ids(seq).join())ok++;
  }
  assert.ok(ok/total>=.98,`first-attempt acceptance ${ok}/${total}`);
});

test("audio can never gate selection: a throwing sound cannot lose a letter",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8"),cr=fs.readFileSync(path.join(ROOT,"src/currency-rush.js"),"utf8");
  assert.match(source,/try \{ wgAudio\.letter\(/);
  assert.match(cr,/try\{audio\?\.letter\?\.\(/);
});

test("both wheels run on the same shared gesture engine with the same tile-hit rules",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8"),cr=fs.readFileSync(path.join(ROOT,"src/currency-rush.js"),"utf8");
  [source,cr].forEach(code=>{assert.match(code,/createGesture\(/);assert.match(code,/tileAtPoint\(/);assert.match(code,/\.end\(/);assert.match(code,/getCoalescedEvents/)});
  assert.match(cr,/createGesture\(\{max:3\}\)/);
  assert.doesNotMatch(source,/getBoundingClientRect\(\)[\s\S]{0,80}wgButtonsAlongPointer/,"geometry is cached per gesture, not re-measured on every pointer sample");
});

test("pointer cancel and lost capture recover the attempt instead of discarding it, and release the gesture",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8"),cr=fs.readFileSync(path.join(ROOT,"src/currency-rush.js"),"utf8");
  assert.match(source,/addEventListener\("pointercancel", wgRecoverPointer\)/);
  assert.match(source,/addEventListener\("lostpointercapture", wgRecoverPointer\)/);
  assert.match(source,/function wgResetPointer\(\)[\s\S]{0,300}wgGesture\.reset\(\)/);
  assert.match(cr,/addEventListener\("pointercancel",finishPointer\)/);
  assert.match(cr,/addEventListener\("lostpointercapture"/);
});

test("a swipe that ends short in Currency Rush is cleared so it cannot contaminate the next attempt",()=>{
  const cr=fs.readFileSync(path.join(ROOT,"src/currency-rush.js"),"utf8");
  assert.match(cr,/swiped=Boolean\(gesture&&gesture\.added>1\)/);
  assert.match(cr,/else if\(swiped\)\{[^}]*clear\(\)\}/);
});

test("a straight swipe past a letter does not add the letter beside the path (the old oversized catch zone did)",()=>{
  const w=wheel(8),ids2=["t0","t2"];
  const chord=events([w.tiles[0],w.tiles[2]].map(t=>({x:t.x,y:t.y})),6);
  // t1 sits ~35px off the straight chord from t0 to t2: outside a 30px tile, inside the old 1.4x zone
  assert.deepEqual(trace(w,chord).selected,ids2,"default zone follows the visible tile");
  assert.deepEqual(trace(w,chord,{enter:1.4}).selected,["t0","t1","t2"],"documents what the old zone did");
});

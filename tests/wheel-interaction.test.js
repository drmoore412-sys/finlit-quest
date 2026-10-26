const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const wheel=require("../src/wheel-interaction.js"),{ROOT}=require("./helpers.js");

const tiles=[
  {id:"e-1",letter:"E"},{id:"a",letter:"A"},{id:"r",letter:"R"},{id:"n",letter:"N"},{id:"e-2",letter:"E"},
];

test("selection treats repeated-letter tiles as separate physical tiles",()=>{
  let selected=[];
  for(const id of ["e-1","a","r","n","e-2"])selected=wheel.transitionSelection(selected,id).selected;
  assert.equal(wheel.wordFor(selected,tiles),"EARNE");
  assert.equal(wheel.transitionSelection(selected,"e-1").action,"ignored","one physical tile cannot be reused");
});

test("dragging back to the previous tile removes only the last selection",()=>{
  const selected=["e-1","a","r"];
  const result=wheel.transitionSelection(selected,"a");
  assert.equal(result.action,"backtracked");
  assert.deepEqual(result.selected,["e-1","a"]);
  assert.deepEqual(selected,["e-1","a","r"],"transitions do not mutate caller state");
});

test("word classification keeps target, duplicate, invalid, and empty outcomes distinct",()=>{
  const targets=["EARN","NEAR"],found=new Set(["NEAR"]);
  assert.equal(wheel.classifyWord("EARN",targets,found).status,"target");
  assert.equal(wheel.classifyWord("NEAR",targets,found).status,"duplicate");
  assert.equal(wheel.classifyWord("EEL",targets,found).status,"invalid");
  assert.equal(wheel.classifyWord("",targets,found).status,"empty");
});

test("prefix-aware tap waits for the longer answer while release submission remains available",()=>{
  const targets=["BUDGE","BUDGET"],found=new Set();
  assert.equal(wheel.canSubmitTapWord("BUDGE",targets,found),false);
  assert.equal(wheel.classifyWord("BUDGE",targets,found).status,"target","release-based swipe and keyboard submission may still submit the shorter word");
  found.add("BUDGET");
  assert.equal(wheel.canSubmitTapWord("BUDGE",targets,found),true);
  assert.equal(wheel.canSubmitTapWord("PAY",["PAY","PAYCHECK"],new Set()),false);
  assert.equal(wheel.classifyWord("PAYCHECK",["PAY","PAYCHECK"],new Set()).status,"target");
});

test("shuffle preserves every tile identity and repeated-letter quantity while changing order",()=>{
  const nine=[..."LETTERBOX"].map((letter,index)=>({id:`tile-${index}`,letter}));
  const next=wheel.shuffledOrder(nine,list=>[...list]);
  assert.equal(next.length,9);
  assert.notDeepEqual(next.map(tile=>tile.id),nine.map(tile=>tile.id));
  assert.deepEqual(next.map(tile=>tile.id).sort(),nine.map(tile=>tile.id).sort());
  assert.equal(next.filter(tile=>tile.letter==="T").length,2);
});

test("3-9 tile geometry stays inside and non-overlapping at narrow mobile widths",()=>{
  const viewports=[
    {width:320,wheel:252,tile:48},
    {width:375,wheel:286,tile:56.25},
    {width:390,wheel:286,tile:58.5},
  ];
  for(const viewport of viewports){
    assert.ok(viewport.wheel<viewport.width,`${viewport.width}px wheel must leave horizontal breathing room`);
    for(let count=3;count<=9;count++){
      const positions=wheel.positionsFor(count).map(point=>({x:point.x*viewport.wheel,y:point.y*viewport.wheel}));
      positions.forEach(point=>{
        assert.ok(point.x>=viewport.tile/2&&point.x<=viewport.wheel-viewport.tile/2);
        assert.ok(point.y>=viewport.tile/2&&point.y<=viewport.wheel-viewport.tile/2);
      });
      positions.forEach((point,index)=>{
        const next=positions[(index+1)%positions.length];
        assert.ok(Math.hypot(point.x-next.x,point.y-next.y)>viewport.tile,`${count} tiles overlap at ${viewport.width}px`);
      });
    }
  }
  assert.throws(()=>wheel.positionsFor(10),/1-9/);
});

test("fast pointer segments recover every crossed tile in travel order",()=>{
  const targets=[
    {id:"a",x:10,y:10,radius:8},
    {id:"b",x:50,y:10,radius:8},
    {id:"c",x:90,y:10,radius:8},
    {id:"off-path",x:50,y:35,radius:8},
  ];
  assert.deepEqual(wheel.targetsAlongSegment({x:0,y:10},{x:100,y:10},targets).map(target=>target.id),["a","b","c"]);
  assert.deepEqual(wheel.targetsAlongSegment({x:100,y:10},{x:0,y:10},targets).map(target=>target.id),["c","b","a"]);
});

test("runtime uses pointer movement hit testing, cancellation cleanup, and keyboard alternatives",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  assert.match(source,/addEventListener\("pointermove", wgMovePointer\)/);
  assert.match(source,/wgHitTestLetter\(e\.clientX, e\.clientY\)/);
  assert.match(source,/targetsAlongSegment\(from, to, targets\)/);
  assert.match(source,/getCoalescedEvents/);
  assert.match(source,/wgProcessPointerPosition\(e\);[\s\S]{0,160}const shouldSubmit/,"pointer-up is sampled before submission");
  assert.match(source,/addEventListener\("pointercancel", wgRecoverPointer\)/);
  assert.match(source,/addEventListener\("lostpointercapture", wgRecoverPointer\)/);
  assert.match(source,/function wgRecoverPointer\(\)[\s\S]{0,420}wgFinishPointerSelection\(\)/,"capture loss recovers rather than discards the attempt");
  assert.match(source,/addEventListener\("dragstart", event => event\.preventDefault\(\)\)/,"native ghost dragging is disabled");
  assert.match(source,/addEventListener\("selectstart", event => event\.preventDefault\(\)\)/,"text selection cannot steal the wheel gesture");
  assert.match(source,/b\.draggable = false/,"letter tiles never create a browser drag image");
  assert.match(source,/const shouldSubmit = wgState\.selected\.length > 1 && wgGestureLetters > 1/,"a one-tile finger wobble must not submit an incomplete gesture");
  assert.match(source,/event\.key === "Backspace"/);
  assert.match(source,/\["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"\]/);
  assert.doesNotMatch(source,/addEventListener\("pointerenter"/);
});

test("shuffle repositions persistent buttons instead of rebuilding the wheel",()=>{
  const source=fs.readFileSync(path.join(ROOT,"word-game-app.js"),"utf8");
  const body=source.slice(source.indexOf("function wgShuffle()"),source.indexOf("function wgUpdateAssistUi()"));
  assert.match(body,/FinLitWheelInteraction\.shuffledOrder/);
  assert.match(body,/wgPositionWheelTiles\(true\)/);
  assert.doesNotMatch(body,/wgRenderWheel/);
  assert.doesNotMatch(body,/innerHTML/);
});

test("responsive UI includes a live word readout, layered trace, and narrow-phone rules",()=>{
  const html=fs.readFileSync(path.join(ROOT,"index.html"),"utf8");
  const css=fs.readFileSync(path.join(ROOT,"word-game.css"),"utf8");
  assert.match(html,/id="wgWordReadout"[^>]*aria-live="polite"/);
  assert.match(html,/id="wgTraceShadow"/);
  assert.match(html,/id="wgClearSelection"/);
  assert.match(html,/id="wgSubmitSelection"[^>]*disabled/);
  assert.match(html,/tap letters and press Submit/i);
  assert.match(css,/@media\(max-width:340px\)/);
  assert.match(css,/width:min\(78vw,310px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/-webkit-user-drag:none/);
  assert.match(css,/-webkit-touch-callout:none/);
});

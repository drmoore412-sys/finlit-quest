// Dense-grid zoom/pan (Phase 2b): only offered when fitted cells are small; the wheel and controls are outside the zoomed board.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const {ROOT}=require("./helpers.js");
const Z=require("../src/dense-grid-zoom.js");
const text=f=>fs.readFileSync(path.join(ROOT,f),"utf8");

test("zoom is offered only below 24 px cells and never scales past a 30 px cell or 3x",()=>{
  assert.equal(Z.MIN_CELL,24);
  [[18.9,true],[23.99,true],[24,false],[30,false],[0,false]].forEach(([cell,expected])=>assert.equal(Z.zoomNeeded(cell),expected,String(cell)));
  assert.ok(Math.abs(Z.maxScaleFor(18.9)*18.9-30)<1e-9);assert.equal(Z.maxScaleFor(5),3);assert.equal(Z.maxScaleFor(40),1);
  assert.equal(Z.clampScale(0.4,2),1);assert.equal(Z.clampScale(9,2),2);assert.equal(Z.clampScale(1.5,2),1.5);
});

test("the first-use hint is brief, remembered in try/catch storage, and shown only when zoom is enabled",()=>{
  const src=text("src/dense-grid-zoom.js");
  assert.match(Z.HINT_TEXT,/pinch/i);assert.ok(Z.HINT_TEXT.length<=60);
  assert.match(src,/try \{ return root\.localStorage\.getItem\(HINT_KEY\)/);assert.match(src,/try \{ root\.localStorage\.setItem\(HINT_KEY/);
  assert.match(src,/if \(!state\.enabled\) \{ hideHint\(false\); return; \}[\s\S]*showHint\(\)/,"the hint is only shown for zoomable boards");
  assert.match(src,/HINT_MS/);
});

test("gestures act on the board only: pinch, one-finger pan, double-tap reset; the wheel is never touched",()=>{
  const src=text("src/dense-grid-zoom.js");
  assert.match(src,/board\.addEventListener\("touchmove"[\s\S]*passive: false/);
  assert.match(src,/e\.touches\.length === 2/);assert.match(src,/DOUBLE_TAP_MS/);
  assert.doesNotMatch(src,/wgWheel/,"no reference to the letter wheel");
  const css=text("mobile-polish.css");
  assert.match(css,/\.wg-board\.wg-zoomable\{touch-action:none/);
});

test("the module is wired into the web page and the native bundle build, after mobile-polish and with a matching iOS copy",()=>{
  const html=text("index.html"),build=text("scripts/build-www.sh");
  assert.ok(html.indexOf("src/dense-grid-zoom.js")>html.indexOf("src/mobile-polish.js"));
  assert.ok(html.indexOf("content/answer-expansion-v1.js")<html.indexOf("src/v3-puzzle-slate.js"),"the manifest loads before the slate");
  assert.match(build,/src\/dense-grid-zoom\.js/);assert.match(build,/content\/answer-expansion-v1\.js/);
  ["src/dense-grid-zoom.js","content/answer-expansion-v1.js","mobile-polish.css","index.html"].forEach(f=>assert.ok(fs.readFileSync(path.join(ROOT,f)).equals(fs.readFileSync(path.join(ROOT,"ios/App/App/public",f))),`${f} iOS copy`));
});

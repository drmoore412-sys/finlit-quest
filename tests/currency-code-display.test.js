// Owner correction 2026-11-18: each puzzle's assigned currency code and full currency name are shown on the puzzle screen
// as soon as the puzzle opens (not only after the player happens to find the code). Display only: the code remains a
// zero-reward bonus answer that never counts toward completion. Puzzles without a code show nothing.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const X=require("./universal-acceptance-helpers.js");
const {session,activePuzzles,Currency,ROOT}=X;
const puzzles=activePuzzles();
const doc=JSON.parse(fs.readFileSync(path.join(ROOT,"content/currency-bonus-v1.json"),"utf8"));
const UNCOVERED=["BLOCK","CAPACITY","CHAIN","MARKET","PAYCHECK","RECEIPT","RETAIL","SAVING","STOCK","TERMS"];

test("on open: the 51 assigned puzzles show their code and full currency name; the 10 uncovered puzzles show nothing",()=>{
  let shown=0;const hidden=[];
  puzzles.forEach(p=>{
    const d=session(p).display(),code=doc.assignments[p.id];
    if(code){shown++;assert.deepEqual(d,{visible:true,code,name:Currency.NAMES[code],status:"Bonus · no coins or XP",found:false},p.anchorWord)}
    else{assert.equal(d.visible,false,p.anchorWord);hidden.push(p.anchorWord)}
  });
  assert.equal(shown,51);assert.deepEqual(hidden.sort(),UNCOVERED);
});

test("finding the code marks it found; rewards and completion are unchanged",()=>{
  puzzles.forEach(p=>{
    const s=session(p),code=doc.assignments[p.id];if(!code)return;
    assert.equal(s.submit(code).outcome,"currency");
    assert.deepEqual(s.display(),{visible:true,code,name:Currency.NAMES[code],status:"Found ✓",found:true},p.anchorWord);
    assert.deepEqual(s.log.found,[],"no reward path");assert.equal(s.state.found.size,0,"not counted toward completion");
    s.model.words.forEach(w=>assert.equal(s.submit(w).outcome,"required"));
    assert.equal(s.state.found.size,s.model.words.length,"completes with the required answers only");
  });
});

test("wiring: the bar is on the puzzle screen, rendered when a puzzle opens and when the code is found, and styled for phones",()=>{
  const read=f=>fs.readFileSync(path.join(ROOT,f),"utf8"),html=read("index.html"),app=read("word-game-app.js");
  assert.match(html,/<div class="wg-currency-code hidden" id="wgCurrencyCode"[^>]*>.*id="wgCurrencyCodeValue".*id="wgCurrencyCodeName".*<\/div>/);
  assert.ok(html.indexOf('id="wgCurrencyCode"')>html.indexOf('id="wgMissionCard"'),"directly after the mission bar");
  assert.match(app,/wgState\.foundBonus = new Set\(\);\n\s*wgRenderCurrencyCode\(\);/,"rendered when the puzzle opens");
  assert.match(app,/wgState\.foundBonus\.add\(word\);\n\s*wgRenderCurrencyCode\(\);/,"updated when the code is found");
  assert.match(read("word-game.css"),/\.wg-currency-code\{/);
  assert.match(read("mobile-polish.css"),/#worldGameScreen\.wg-playing \.wg-currency-code\{order:-1/);
});

test("the full currency name is never cut off: the bar wraps instead of truncating",()=>{
  const css=fs.readFileSync(path.join(ROOT,"word-game.css"),"utf8"),bar=css.slice(css.indexOf(".wg-currency-code{"));
  assert.match(bar,/^\.wg-currency-code\{[^}]*flex-wrap:wrap/);
  assert.match(css,/\.wg-currency-code em\{font-style:normal\}/);
  assert.ok(!/\.wg-currency-code em\{[^}]*(ellipsis|nowrap)/.test(css+fs.readFileSync(path.join(ROOT,"mobile-polish.css"),"utf8")));
});

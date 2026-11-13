// Mobile polish (2026-11-13): one-screen puzzle layout, Daily reward popup, key-term coin confetti,
// and a per-player game order so a world does not open on the same key term for everyone.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

test("index.html loads the mobile polish stylesheet last and its script after the game controllers",()=>{
  const html=read("index.html");
  assert.match(html,/href="mobile-polish\.css\?v=\d+"/);
  assert.ok(html.indexOf("mobile-polish.css")>html.indexOf("currency-rush.css"),"overrides must come after the base styles");
  assert.ok(html.indexOf("src/mobile-polish.js")>html.indexOf("word-game-app.js"));
});

test("the Daily reward is opened from a gift button and is no longer laid out on the home screen",()=>{
  const html=read("index.html"),css=read("mobile-polish.css");
  assert.match(html,/<button class="reward-open" id="dailyRewardOpen" type="button" aria-haspopup="dialog" aria-controls="dailyReward"/);
  assert.match(html,/id="dailyRewardClose" aria-label="Close daily reward"/);
  assert.match(css,/#dailyReward\{display:none!important\}/);
  assert.match(css,/#dailyReward\.is-open\{display:block!important;position:fixed/);
});

test("the journey artwork is never stretched: it is drawn with cover from the compressed copy",()=>{
  const css=read("mobile-polish.css");
  assert.match(css,/golden-castle-journey\.webp"\) 70% center\/cover no-repeat/);
  assert.doesNotMatch(css,/background-size:100% 100%/);
  assert.ok(fs.existsSync(path.join(ROOT,"assets/images/golden-castle-journey.webp")));
});

test("on phones a puzzle fits one screen and motion-heavy layers are switched off",()=>{
  const css=read("mobile-polish.css");
  assert.match(css,/#worldGameScreen\.wg-playing\{height:100vh;height:100dvh;min-height:0;overflow:hidden;display:flex;flex-direction:column/);
  assert.match(css,/\.wg-screen:before\{animation:none/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.flq-confetti\{display:none\}/);
});

function mixer(){
  const source=read("word-game-app.js"),fn=source.match(/function wgMixLevelOrder\([\s\S]*?\n\}\n/)[0];
  return new Function("WG_GAMES_PER_LEVEL",`${fn};return wgMixLevelOrder;`)(5);
}
test("the per-player game order keeps every puzzle in its own level and never opens a level on its original first game",()=>{
  const mix=mixer(),ids=Array.from({length:15},(_,index)=>`p${index}`);
  for(let run=0;run<200;run++){
    const order=mix(ids);
    assert.deepEqual([...order].sort(),[...ids].sort(),"same puzzles, nothing added or lost");
    for(let level=0;level<3;level++){
      const original=ids.slice(level*5,level*5+5),mixed=order.slice(level*5,level*5+5);
      assert.deepEqual([...mixed].sort(),[...original].sort(),"a puzzle never changes level");
      assert.notEqual(mixed[0],original[0],"the level does not open on its original first game");
    }
  }
});

test("the key-term confetti is presentation only and the order is not written into the learning save",()=>{
  const source=read("word-game-app.js"),polish=read("src/mobile-polish.js");
  assert.match(source,/if \(word === wgState\.puzzleModel\.anchorWord\) window\.FinLitCoinConfetti\?\.burst\(/);
  assert.doesNotMatch(polish,/learning\.|localStorage/);
  assert.match(source,/const WG_PUZZLE_ORDER_KEY = "finlitQuest\.puzzleOrder\.v1";/);
});

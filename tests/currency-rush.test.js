const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {ROOT}=require("./helpers.js");
const game=require("../src/currency-rush.js");
const data=require("../content/currency-rush-data.js");
const read=file=>fs.readFileSync(path.join(ROOT,file),"utf8");

test("the seven owner-supplied wheels are preserved and contain exactly nine tiles",()=>{
  assert.deepEqual(data.rounds.map(round=>round.wheel),["SKZRUEADC","NXIRDMYTC","HFODPKNUC","PBNLGERUT","ADMNGRVSE","LHRDWABTK","JPYUSDERA"]);
  data.rounds.forEach(round=>assert.match(round.wheel,/^[A-Z]{9}$/));
});

test("runtime currency records are traceable to the official current ISO 4217 list",()=>{
  assert.equal(data.source.name,"ISO 4217 List One");
  assert.match(data.source.maintainer,/SIX.+Maintenance Agency/);
  assert.equal(data.source.published,"2026-09-17");
  assert.match(data.source.url,/six-group\.com\/.*list-one\.xml/);
  assert.equal(Object.keys(data.currencies).length,71);
  assert.equal(data.rounds.reduce((sum,round)=>sum+round.requiredCodes.length,0),88);
});

test("every accepted code is a unique three-letter ISO record constructible from its exact wheel multiset",()=>{
  data.rounds.forEach(round=>{
    assert.equal(new Set(round.requiredCodes).size,round.requiredCodes.length);
    assert.deepEqual(game.answersForRound(data,round),round.requiredCodes);
    round.requiredCodes.forEach(code=>{assert.match(code,/^[A-Z]{3}$/);assert.ok(data.currencies[code]);assert.equal(game.canFormCode(code,round.wheel),true,`${code} cannot be made from ${round.wheel}`)});
  });
  assert.equal(game.canFormCode("AAA","SKZRUEADC"),false,"repeated letters are counted, not presence-checked");
});

test("round one includes every detected official code, not only the starter examples",()=>{
  assert.deepEqual(data.rounds[0].requiredCodes,["AED","ARS","AUD","CAD","CZK","EUR","KES","RSD","SAR","SCR","SEK","SRD","USD","UZS","ZAR"]);
  assert.equal(data.currencies.EUR.name,"Euro");assert.ok(data.currencies.EUR.countries.length>20);
  assert.match(game.countrySummary(data.currencies.EUR),/euro area/i);
});

test("unique correct codes score 100 and duplicate or invalid answers never score",()=>{
  const session=game.createSession(data,1);
  assert.equal(session.submit("AED").status,"correct");assert.equal(session.state.score,100);
  assert.equal(session.submit("AED").status,"duplicate");assert.equal(session.state.score,100);
  assert.equal(session.submit("AAA").status,"invalid");assert.equal(session.state.score,100);
  assert.deepEqual(session.state.found,["AED"]);
});

test("each uninterrupted group of three correct codes earns one 50-point streak bonus",()=>{
  const session=game.createSession(data,1);
  ["AED","ARS","AUD"].forEach(code=>session.submit(code));
  assert.equal(session.state.score,350);assert.equal(session.state.streakBonus,50);
  session.submit("AAA");["CAD","CZK","EUR"].forEach(code=>session.submit(code));
  assert.equal(session.state.score,700);assert.equal(session.state.streakBonus,100);
});

test("completion and time bonuses require every target and are awarded once",()=>{
  const session=game.createSession(data,2);
  session.state.required.slice(0,-1).forEach(code=>session.submit(code,25));
  assert.equal(session.state.completionBonus,0);assert.equal(session.state.timeBonus,0);
  const result=session.submit(session.state.required.at(-1),25);
  assert.equal(result.completed,true);assert.equal(session.state.completionBonus,250);assert.equal(session.state.timeBonus,250);
  const score=session.state.score;assert.equal(session.submit("CNY").status,"finished");assert.equal(session.state.score,score);
});

test("timer expiry reports missed learning codes without granting completion rewards",()=>{
  const session=game.createSession(data,3,{durationSeconds:2});session.submit("CHF");session.tick();session.tick();
  const result=session.summary();assert.equal(result.finished,true);assert.equal(result.completed,false);assert.equal(result.completionBonus,0);assert.equal(result.timeBonus,0);assert.ok(result.missed.includes("HKD"));
});

test("the UI is an isolated practice route with touch, pointer, keyboard, results, and accessible mute controls",()=>{
  const html=read("index.html"),js=read("src/currency-rush.js"),css=read("currency-rush.css");
  assert.match(html,/id="currencyRushScreen"/);assert.match(html,/PRACTICE ONLY/);assert.match(html,/id="crMusicToggle"[^>]+aria-label="Mute background music"/);
  assert.match(js,/pointerdown/);assert.match(js,/pointermove/);assert.match(js,/pointerMoved/);assert.match(js,/selected\.length===3\)submitSelection/);assert.match(js,/keydown/);assert.match(js,/new URLSearchParams\(win\.location\.search\).*bonus/);
  assert.doesNotMatch(js,/learning\.save|player\.coins|player\.xp|achievement/i,"bonus UI must not touch permanent progression or spendable rewards");
  assert.match(css,/touch-action:none/);assert.match(css,/@media\(max-width:520px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test("Rounds 1 and 2 are guided, while Round 3 onward hides every pre-answer reference",()=>{
  const html=read("index.html"),js=read("src/currency-rush.js"),css=read("currency-rush.css");
  assert.match(html,/id="crReferencePanel"/);assert.match(html,/country, currency, and code/i);
  assert.match(js,/const guided=roundNumber<=2/);assert.match(js,/crReferencePanel.*toggle\("hidden",!guided\)/);
  assert.match(js,/if\(roundNumber>2\)return/);assert.match(js,/CURRENCIES REMAINING/);
  assert.match(css,/is-memory-round \.cr-layout/);
  assert.match(html,/id="crMissed"/);assert.match(js,/summary\.missed\.forEach\(code=>missed\.append\(resultItem\(code\)\)\)/);
});

test("the audio bridge exposes presentation sounds only and keeps music mute independent",()=>{
  const source=read("word-game-app.js");
  const bridge=source.slice(source.indexOf("window.FinLitBonusAudio"),source.indexOf("window.FinLitBonusAudio")+1100);
  ["letter","correct","wrong","duplicate","cancel","coin","complete","toggleMusic"].forEach(name=>assert.match(bridge,new RegExp(`${name}:`)));
  assert.doesNotMatch(bridge,/learning|coins\s*[+\-]=|xp\s*[+\-]=/i);
});

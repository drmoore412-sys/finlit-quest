// DeFi Tower (Financial City bonus feature, educational draft). Logic, scoring, replay, saved state, keyboard, touch,
// integration and educational-safety guardrails. The module runs in Node (no DOM), so these exercise the real code.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("./helpers.js");

const T = require(path.join(ROOT, "defi-tower.js"));
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
const fc = read("financial-city.html");
const css = read("defi-tower.css");

function memStore(init) {
  const m = new Map(init ? Object.entries(init) : []);
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m };
}
function mounted(store) {
  T.unmountForTest();
  const renders = [];
  const sounds = [];
  T.mount({ storage: store || memStore(), esc: s => String(s), sfx: n => sounds.push(n), rerender: f => renders.push(f) });
  return { renders, sounds };
}
const best = f => f.choices.find(c => c.tier === "best");
const weak = f => f.choices.find(c => c.tier === "weak");
const ok = f => f.choices.filter(c => c.tier !== "weak");

/* ---------- content: all eight floors ---------- */
test("there are exactly eight floors with the requested themes, in order, with three choices each", () => {
  assert.equal(T.FLOORS.length, 8);
  const titles = ["High-Yield Temptation", "Stablecoin or Bank", "Crypto-Backed Borrowing", "Liquidity Pool", "Wallet Security", "International Payments", "Market Crash", "Financial Future"];
  T.FLOORS.forEach((f, i) => {
    assert.equal(f.n, i + 1);
    assert.equal(f.title, titles[i]);
    assert.equal(f.choices.length, 3, `${f.title} must have three choices`);
    assert.equal(new Set(f.choices.map(c => c.id)).size, 3);
    assert.ok(f.setup.length > 80 && f.question.endsWith("?") && f.takeaway.length > 30);
    assert.ok(f.assumptions.length >= 2, `${f.title} must label its educational assumptions`);
    f.choices.forEach(c => assert.ok(c.fb.length > 60 && ["best", "ok", "weak"].includes(c.tier), `${f.title} ${c.id} needs feedback and a tier`));
  });
  assert.equal(new Set(T.FLOORS.map(f => f.id)).size, 8);
});

test("every floor has a best-fit answer, at least one not-best answer, and best-fit never requires DeFi", () => {
  T.FLOORS.forEach(f => {
    assert.equal(f.choices.filter(c => c.tier === "best").length, 1, `${f.title}: exactly one best fit`);
    assert.ok(weak(f), `${f.title}: needs a not-best-fit choice to teach from`);
    assert.equal(best(f).defi, false, `${f.title}: the best fit must not require DeFi`);
  });
});

test("nuanced floors accept more than one defensible answer instead of forcing a single rule", () => {
  const multi = T.FLOORS.filter(f => ok(f).length >= 2);
  assert.ok(multi.length >= 4, "several floors should allow more than one defensible choice");
  ["Crypto-Backed Borrowing", "Liquidity Pool", "International Payments", "Market Crash", "Financial Future"].forEach(t => {
    assert.ok(ok(T.FLOORS.find(f => f.title === t)).length >= 2, `${t} should have two defensible choices`);
  });
});

test("the correct answers are not always in the same position", () => {
  const positions = new Set(T.FLOORS.map(f => f.choices.findIndex(c => c.tier === "best")));
  assert.ok(positions.size >= 3);
});

/* ---------- scoring ---------- */
test("100 knowledge points per correct first answer, 800 maximum", () => {
  assert.equal(T.POINTS, 100);
  assert.equal(T.maxScore(), 800);
  const saved = T.emptySaved(), run = T.startRun(saved);
  T.FLOORS.forEach((f, i) => { const r = T.answer(saved, run, i, best(f).id); assert.equal(r.points, 100); assert.equal(r.correct, true); });
  assert.equal(T.runScore(run), 800);
  assert.equal(T.bankedTotal(saved), 800);
});

test("a perfect 800 is reachable without choosing any DeFi option", () => {
  const saved = T.emptySaved(), run = T.startRun(saved);
  T.FLOORS.forEach((f, i) => {
    const c = f.choices.find(x => x.tier !== "weak" && !x.defi);
    assert.ok(c, `${f.title} needs a non-DeFi correct answer`);
    T.answer(saved, run, i, c.id);
  });
  assert.equal(T.runScore(run), 800);
});

test("defensible (ok) answers earn the same 100 points as the best fit, and weak answers earn 0", () => {
  const saved = T.emptySaved(), run = T.startRun(saved);
  const f3 = T.FLOORS[2];
  const okc = f3.choices.find(c => c.tier === "ok");
  assert.equal(T.answer(saved, run, 2, okc.id).points, 100);
  const r = T.answer(saved, run, 0, weak(T.FLOORS[0]).id);
  assert.equal(r.points, 0); assert.equal(r.correct, false);
  assert.equal(T.runScore(run), 100);
});

test("the first answer on a floor is final: a second tap or a changed answer scores nothing", () => {
  const saved = T.emptySaved(), run = T.startRun(saved), f = T.FLOORS[0];
  assert.equal(T.answer(saved, run, 0, weak(f).id).points, 0);
  const again = T.answer(saved, run, 0, best(f).id);
  assert.equal(again.ok, false); assert.equal(again.reason, "locked");
  assert.equal(T.runScore(run), 0);
  assert.equal(T.bankedTotal(saved), 0, "changing a wrong first answer to the right one must not bank points");
});

test("invalid floors and choices are rejected without changing state", () => {
  const saved = T.emptySaved(), run = T.startRun(saved);
  assert.equal(T.answer(saved, run, 99, "a").ok, false);
  assert.equal(T.answer(saved, run, 0, "zzz").ok, false);
  assert.equal(T.answeredCount(run), 0);
});

/* ---------- replay and reward farming ---------- */
test("replaying can never farm permanent points: saved total stays at 800 after many perfect climbs", () => {
  const saved = T.emptySaved();
  for (let climb = 0; climb < 5; climb++) {
    const run = T.startRun(saved);
    T.FLOORS.forEach((f, i) => T.answer(saved, run, i, best(f).id));
    T.finishRun(saved, run);
    assert.equal(T.runScore(run), 800);
    assert.equal(T.bankedTotal(saved), 800, `climb ${climb + 1}`);
  }
  assert.equal(saved.runs, 5);
  assert.equal(saved.best, 800);
});

test("the second climb of a floor reports the points were already saved", () => {
  const saved = T.emptySaved();
  let run = T.startRun(saved);
  assert.equal(T.answer(saved, run, 0, best(T.FLOORS[0]).id).banked, true);
  run = T.startRun(saved);
  const r = T.answer(saved, run, 0, best(T.FLOORS[0]).id);
  assert.equal(r.points, 100, "the climb score still shows the practice points");
  assert.equal(r.banked, false); assert.equal(r.alreadyBanked, true);
  assert.equal(T.bankedTotal(saved), 100);
});

test("a wrong first attempt does not bank points, and a later correct climb can bank that floor once", () => {
  const saved = T.emptySaved();
  let run = T.startRun(saved);
  T.answer(saved, run, 0, weak(T.FLOORS[0]).id);
  assert.equal(T.bankedTotal(saved), 0);
  run = T.startRun(saved);
  T.answer(saved, run, 0, best(T.FLOORS[0]).id);
  assert.equal(T.bankedTotal(saved), 100);
  run = T.startRun(saved);
  T.answer(saved, run, 0, best(T.FLOORS[0]).id);
  assert.equal(T.bankedTotal(saved), 100);
});

test("a finished climb is counted once even if finish is triggered repeatedly", () => {
  const saved = T.emptySaved(), run = T.startRun(saved);
  T.FLOORS.forEach((f, i) => T.answer(saved, run, i, best(f).id));
  assert.equal(T.finishRun(saved, run).counted, true);
  assert.equal(T.finishRun(saved, run).counted, false);
  assert.equal(T.finishRun(saved, run).counted, false);
  assert.equal(saved.runs, 1);
});

test("an unfinished climb cannot be finished or counted", () => {
  const saved = T.emptySaved(), run = T.startRun(saved);
  T.answer(saved, run, 0, best(T.FLOORS[0]).id);
  assert.equal(T.finishRun(saved, run).counted, false);
  assert.equal(saved.runs, 0); assert.equal(saved.best, 0);
});

test("best climb only goes up", () => {
  const saved = T.emptySaved();
  let run = T.startRun(saved); T.FLOORS.forEach((f, i) => T.answer(saved, run, i, best(f).id)); T.finishRun(saved, run);
  run = T.startRun(saved); T.FLOORS.forEach((f, i) => T.answer(saved, run, i, weak(f).id)); T.finishRun(saved, run);
  assert.equal(saved.best, 800); assert.equal(saved.runs, 2);
});

/* ---------- saved state ---------- */
test("progress persists in its own storage key and resumes after a reload", () => {
  const store = memStore();
  mounted(store);
  T.actions.tstart();
  T.actions.tpick({ dataset: { id: best(T.FLOORS[0]).id } });
  T.actions.tnext();
  T.actions.tpick({ dataset: { id: weak(T.FLOORS[1]).id } });
  assert.deepEqual([...store._m.keys()], ["flq-defi-tower-v1"], "only its own key is written");
  mounted(store); // simulated reload
  const s = T.state().saved;
  assert.equal(T.answeredCount(s.run), 2);
  assert.equal(T.runScore(s.run), 100);
  assert.equal(T.bankedTotal(s), 100);
  assert.match(T.view(), /Continue on floor 3/);
  T.actions.tcontinue();
  assert.equal(T.state().idx, 2);
});

test("saved data is validated: tampered scores, unknown floors and bad choices are discarded", () => {
  const evil = { banked: { "tower-f1": 100, "tower-f2": 99999, bogus: 100 }, seen: { "tower-f3": true, nope: true }, best: 10000, runs: -3,
    run: { idx: 99, done: true, answers: { "tower-f1": "zzz", "tower-f2": "a", other: "a" } } };
  const s = T.sanitizeSaved(evil);
  assert.equal(s.banked["tower-f1"], 100); assert.equal(s.banked["tower-f2"], undefined); assert.equal(s.banked.bogus, undefined);
  assert.equal(T.bankedTotal(s), 100);
  assert.equal(s.best, 0); assert.equal(s.runs, 0);
  assert.equal(s.run.idx, 7);
  assert.equal(s.run.done, false, "done requires all eight floors answered");
  assert.deepEqual(Object.keys(s.run.answers), ["tower-f2"]);
  assert.equal(T.runScore(s.run), 100, "points are recomputed from the data, never read from storage");
});

test("corrupt or missing storage falls back to a clean state and never throws", () => {
  assert.equal(T.bankedTotal(T.loadSaved(memStore({ "flq-defi-tower-v1": "{not json" }))), 0);
  assert.equal(T.bankedTotal(T.loadSaved(null)), 0);
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("full"); } };
  assert.equal(T.bankedTotal(T.loadSaved(broken)), 0);
  assert.equal(T.saveSaved(broken, T.emptySaved()), false);
  mounted(broken);
  assert.doesNotThrow(() => { T.actions.tstart(); T.actions.tpick({ dataset: { id: "a" } }); });
});

test("tower saves never touch Financial City's own saved data, wallet, lessons or scores", () => {
  const cityKey = "flq-financial-city-proto-v1";
  const city = JSON.stringify({ best: 450, coins: 50, xp: 40, claimed: { "level-1-crosswords": true }, lessons: { bank: true }, bBest: { p1: 700 }, runs: 3 });
  const store = memStore({ [cityKey]: city });
  mounted(store);
  T.actions.tstart();
  T.FLOORS.forEach((f, i) => { T.actions.tpick({ dataset: { id: best(f).id } }); if (i < 7) T.actions.tnext(); });
  T.actions.tfinish();
  assert.equal(store.getItem(cityKey), city, "Financial City data must be byte-for-byte unchanged");
  assert.ok(!/coins|xp/i.test(JSON.stringify(T.state().saved)), "tower saves no coins or XP");
});

/* ---------- screens, navigation, keyboard, touch ---------- */
test("the intro, floor and results screens render, with a floor progress indicator and draft labels", () => {
  mounted();
  let v = T.view();
  assert.match(v, /The DeFi Tower/); assert.match(v, /Educational draft/); assert.match(v, /data-action='tstart'/);
  T.actions.tstart();
  v = T.view();
  assert.match(v, /Floor 1 of 8/); assert.match(v, /High-Yield Temptation/);
  assert.equal((v.match(/class='tw-step/g) || []).length, 8, "eight progress steps");
  assert.match(v, /aria-current='step'/);
  assert.match(v, /Fictional example · educational assumptions/);
  assert.equal((v.match(/data-action='tpick'/g) || []).length, 3, "three choices");
  assert.match(v, /data-action='tprev' disabled/, "previous is disabled on the first floor");
  assert.match(v, /data-action='tnext' disabled/, "next waits for an answer");
});

test("immediate feedback appears the moment a choice is made, with explanation and takeaway", () => {
  mounted();
  T.actions.tstart();
  T.actions.tpick({ dataset: { id: weak(T.FLOORS[0]).id } });
  const v = T.view();
  assert.match(v, /Not the best fit/); assert.match(v, /No points this time/); assert.match(v, /Takeaway\./);
  assert.match(v, /How the other choices compare/);
  assert.equal((v.match(/data-action='tpick'[^>]*disabled/g) || []).length, 3, "answers lock after the first choice");
  assert.doesNotMatch(v, /data-action='tnext' disabled/, "next opens after answering");
});

test("next and previous navigate between floors and can review earlier answers", () => {
  mounted();
  T.actions.tstart();
  T.actions.tnext(); // blocked: unanswered
  assert.equal(T.state().idx, 0);
  T.actions.tpick({ dataset: { id: best(T.FLOORS[0]).id } });
  T.actions.tnext(); assert.equal(T.state().idx, 1);
  T.actions.tprev(); assert.equal(T.state().idx, 0);
  assert.match(T.view(), /Your choice/);
  T.actions.tprev(); assert.equal(T.state().idx, 0, "cannot go before floor 1");
});

test("the full climb ends in a final score screen with a replay option", () => {
  const { sounds } = mounted();
  T.actions.tstart();
  T.FLOORS.forEach((f, i) => { T.actions.tpick({ dataset: { id: (i % 2 ? best(f) : weak(f)).id } }); if (i < 7) T.actions.tnext(); });
  assert.match(T.view(), /data-action='tfinish'(?! disabled)/, "results button is enabled after floor 8 is answered");
  T.actions.tfinish();
  const v = T.view();
  assert.match(v, /You reached the top/); assert.match(v, /400<span/); assert.match(v, /data-action='treplay'/); assert.match(v, /Floor by floor/);
  assert.ok(sounds.includes("confirm"));
  T.actions.treplay();
  assert.equal(T.state().idx, 0);
  assert.equal(T.answeredCount(T.state().saved.run), 0, "replay starts a fresh climb");
  assert.equal(T.bankedTotal(T.state().saved), 400, "but keeps what was already saved");
});

test("results cannot be reached before every floor is answered", () => {
  mounted();
  T.actions.tstart();
  T.actions.tpick({ dataset: { id: "a" } });
  T.actions.tfinish();
  assert.notEqual(T.state().view, "results");
});

test("keyboard: keys 1-3 answer, arrows move between floors, modifiers and form fields are ignored", () => {
  mounted();
  T.actions.tstart();
  assert.equal(T.onKey({ key: "ArrowRight", target: {} }), false, "cannot skip an unanswered floor");
  assert.equal(T.onKey({ key: "4", target: {} }), false);
  assert.equal(T.onKey({ key: "2", ctrlKey: true, target: {} }), false);
  assert.equal(T.onKey({ key: "2", target: { tagName: "INPUT" } }), false);
  assert.equal(T.onKey({ key: "2", target: { tagName: "BODY" } }), true);
  assert.equal(T.state().saved.run.answers["tower-f1"], "b");
  assert.equal(T.onKey({ key: "1", target: {} }), false, "answers are locked");
  assert.equal(T.state().saved.run.answers["tower-f1"], "b");
  assert.equal(T.onKey({ key: "ArrowRight", target: {} }), true); assert.equal(T.state().idx, 1);
  assert.equal(T.onKey({ key: "ArrowLeft", target: {} }), true); assert.equal(T.state().idx, 0);
  assert.equal(T.onKey({ key: "ArrowLeft", target: {} }), false);
});

test("keys do nothing outside a floor", () => {
  mounted();
  assert.equal(T.onKey({ key: "1", target: {} }), false);
});

test("touch and click: answers use real buttons with large targets and no hover-only behavior", () => {
  mounted(); T.actions.tstart();
  const v = T.view();
  assert.equal((v.match(/<button type='button' class='opt tw-opt'/g) || []).length, 3, "answers are native buttons");
  assert.match(css, /\.tw-opt\{[^}]*min-height:60px/);
  assert.match(css, /\.tw-opt\{[^}]*touch-action:manipulation/);
  assert.match(css, /\.tw-nav \.btn\{min-height:46px\}/);
  assert.doesNotMatch(css, /:hover\s*\{[^}]*display:none/);
  // a tap is a click on a data-action button, handled by Financial City's delegated click listener
  assert.match(fc, /app\.addEventListener\("click"[\s\S]{0,400}FLQ_TOWER\.actions\[act\]/);
  T.actions.tpick({ dataset: { id: "b" } });
  assert.equal(T.state().saved.run.answers["tower-f1"], "b");
});

test("double taps cannot double-score a floor", () => {
  mounted(); T.actions.tstart();
  T.actions.tpick({ dataset: { id: "b" } }); T.actions.tpick({ dataset: { id: "b" } }); T.actions.tpick({ dataset: { id: "b" } });
  assert.equal(T.runScore(T.state().saved.run), 100);
  assert.equal(T.bankedTotal(T.state().saved), 100);
});

test("responsive and reduced-motion support in the styles", () => {
  assert.match(css, /@media \(max-width:760px\)[\s\S]*\.tw-hero\{grid-template-columns:1fr\}/);
  assert.match(css, /@media \(prefers-reduced-motion:no-preference\)/, "animations are opt-in");
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)[\s\S]*animation:none/);
  assert.match(css, /\.sr\{/);
});

test("answers are announced and focus moves to the feedback for screen-reader and keyboard users", () => {
  const src = read("defi-tower.js");
  assert.match(src, /id='tw-fb' tabindex='-1'/);
  assert.match(src, /focusFeedback\(\)/);
  assert.match(src, /aria-current='step'/);
  assert.match(src, /aria-keyshortcuts/);
});

/* ---------- educational safety ---------- */
test("every screen carries the draft label and the no-insurance, no-guarantee warnings", () => {
  mounted();
  const screens = [T.view()];
  T.actions.tstart(); screens.push(T.view());
  T.actions.tpick({ dataset: { id: "b" } }); screens.push(T.view());
  screens.forEach(v => { assert.match(v, /Educational draft/); assert.match(v, /insured-deposit protection/); assert.match(v, /never guaranteed/); });
  assert.match(T.RISK_NOTE, /generally do not have the standard insured-deposit protection/);
  assert.match(T.DRAFT_NOTE, /not been reviewed or approved/);
});

test("scenario text never promises returns or safety, and labels figures as illustrative or fictional", () => {
  const all = T.FLOORS.map(f => [f.setup, f.question, f.takeaway, ...f.assumptions, ...f.choices.flatMap(c => [c.text, c.fb])].join(" ")).join(" ");
  [/guaranteed (?:return|yield|profit|income)s?(?! are not)/i, /risk[- ]free/i, /can(?:not|'t) lose/i, /safe investment/i, /will (?:always )?(?:go up|earn)/i].forEach(re => assert.doesNotMatch(all.replace(/not guaranteed|never guaranteed|no guarantees|not a guarantee|not guarantee/gi, ""), re));
  assert.match(all, /fictional/i); assert.match(all, /illustrative|made-up/i);
  T.FLOORS.forEach(f => assert.match([f.setup, ...f.assumptions].join(" "), /fictional|illustrative|made-up|teaching/i, `${f.title} must be labelled fictional or illustrative`));
  const defiFloors = T.FLOORS.filter(f => f.choices.some(c => c.defi));
  assert.ok(defiFloors.length >= 6);
});

test("deposit-insurance and de-peg risks are explained where they matter", () => {
  const text = id => { const f = T.FLOORS.find(x => x.id === id); return f.choices.map(c => c.fb).join(" ") + f.assumptions.join(" "); };
  assert.match(text("tower-f1"), /deposit insurance/i);
  assert.match(text("tower-f2"), /deposit insurance/i); assert.match(text("tower-f2"), /slip below|de-peg/i);
  assert.match(text("tower-f3"), /liquidat/i);
  assert.match(text("tower-f4"), /impermanent loss/i); assert.match(text("tower-f4"), /smart-contract|hack/i);
  assert.match(text("tower-f5"), /recovery phrase/i);
  assert.match(text("tower-f6"), /total cost/i);
  assert.match(text("tower-f7"), /lose most or all|borrow/i);
  assert.match(text("tower-f8"), /diversif/i);
});

/* ---------- integration with Financial City (preserved features, isolation from other games) ---------- */
test("Financial City loads the tower module and wires the screen, click, key and mount hooks", () => {
  assert.match(fc, /<link rel="stylesheet" href="defi-tower\.css">/);
  assert.match(fc, /<script src="defi-tower\.js"><\/script>\s*<script id="ui">/);
  assert.match(fc, /S\.screen==="tower"&&window\.FLQ_TOWER\?FLQ_TOWER\.view\(\)/);
  assert.match(fc, /tower:function\(\)\{[^}]*FLQ_TOWER\.enter\(\)/);
  assert.match(fc, /S\.screen==="tower" && window\.FLQ_TOWER\) \{ if \(FLQ_TOWER\.onKey\(e\)\)/);
  assert.match(fc, /FLQ_TOWER\.mount\(\{ storage:tstore/);
});

test("the DeFi Tower is a selectable building on the home map, and absent from the allocation and simulation scenes", () => {
  assert.match(fc, /HOME_ORDER = \["treasury","tower","defi"/);
  assert.match(fc, /var order = mode==="home" \? HOME_ORDER : DRAW_ORDER/);
  assert.match(fc, /data-action='tower' tabindex='0' role='button' aria-label='DeFi Tower/);
  assert.match(fc, /var DRAW_ORDER = \["treasury","defi","stocks","bank","stable","credit","retire","hysa"\]/, "the original eight-building order is unchanged");
  assert.match(fc, /tower:'DeFi Tower'/);
  assert.match(fc, /tw-enter-card" data-action="tower"/, "a list/card entry exists for small screens and keyboards");
});

test("the original eight destinations, saved keys and challenge modes are untouched", () => {
  assert.match(fc, /var KEY = "flq-financial-city-proto-v1"/);
  assert.match(fc, /Explore eight destinations, then make six real-life calls/);
  assert.match(fc, /data-action="intro">Decision challenge/); assert.match(fc, /data-action="bprofiles">The \$10,000 challenge/);
  assert.match(fc, /reset:function\(\)\{ saved=\{ best:0, claimed:\{\}, coins:0, xp:0, lessons:\{\}, runs:0, bBest:\{\} \}/);
  assert.notEqual(T.STORAGE_KEY, "flq-financial-city-proto-v1");
  assert.equal(T.STORAGE_KEY, "flq-defi-tower-v1");
});

test("the tower uses Financial City's shared music and effects system and its saved mute preference", () => {
  const src = read("defi-tower.js");
  assert.doesNotMatch(src, /AudioContext|new Audio\(/, "no separate audio engine");
  assert.match(src, /ctx\.sfx\(n\)/);
  assert.match(fc, /FLQ_TOWER\.mount\(\{ storage:tstore, esc:esc, sfx:sfx/, "sound goes through the page's sfx() -> FLQ_AUDIO, which honors the saved music and effects switches");
  assert.match(fc, /function sfx\(n, o\)\{ try \{ if \(window\.FLQ_AUDIO\) FLQ_AUDIO\.play\(n, o\)/);
});

test("Word Quest and Currency Rush are not touched by the tower", () => {
  ["word-game-app.js", "src/currency-rush.js", "currency-rush.css", "src/wheel-interaction.js", "word-game.css"].forEach(f => assert.doesNotMatch(read(f), /FLQ_TOWER|defi-tower/, f));
  assert.doesNotMatch(read("index.html"), /defi-tower/);
  assert.doesNotMatch(read("app.js"), /FLQ_TOWER|defi-tower/);
});

test("the tower files ship in the web build and the iOS bundle", () => {
  const build = read("scripts/build-www.sh");
  assert.match(build, /defi-tower\.js/); assert.match(build, /defi-tower\.css/);
  ["defi-tower.js", "defi-tower.css", "financial-city.html"].forEach(f => {
    assert.ok(fs.readFileSync(path.join(ROOT, f)).equals(fs.readFileSync(path.join(ROOT, "ios/App/App/public", f))), `${f} must match the iOS bundle copy`);
  });
});

test("artwork helpers render the eight-floor crystal tower with lit floors for visited floors", () => {
  const art = T.heroSvg([true, true, false, false, false, false, false, false], 2);
  assert.equal((art.match(/class='tw-floor/g) || []).length, 8);
  assert.equal((art.match(/tw-floor on/g) || []).length, 2);
  assert.match(art, /tw-floor cur/); assert.match(art, /role='img'/); assert.match(art, /aria-label=/);
  assert.match(T.sceneBuilding(3), /tw-floor on/);
});

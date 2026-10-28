/* DeFi in Real Life — six character journeys for Financial City (Zoe, Maya, Jules, Marcus, Elena, Dana).
   EDUCATIONAL DRAFT, LOCAL ONLY, OFF BY DEFAULT. The wording is generated from locked curriculum workbooks and the locked financial
   engines by scripts/defi_rl_export.py; nothing here computes a balance or decides a score. This file only walks a precomputed
   decision tree (curriculum/defi-real-life/approved/runtime/<slug>.tree.v1.json) and stores the player's progress.
   Works in the browser (window.FLQ_DEFI_RL) and in Node (module.exports) so the logic is testable without a DOM.
   Its progress lives under its own storage key and never touches Tower points, Financial City scores, the prototype wallet,
   coins, XP, mastery or any other game save. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FLQ_DEFI_RL = api;
})(typeof self !== "undefined" ? self : this, function (root) {
  "use strict";

  var STORAGE_KEY = "flq-defi-rl-v1";
  var SCHEMA = 1;
  var POINTS = 100;
  var QUESTIONS = 7;
  var MAX_POINTS = POINTS * QUESTIONS;
  var BASE = "curriculum/defi-real-life/approved/";
  var URLS = { manifest: BASE + "runtime/manifest.json", claims: BASE + "claims-register.json" };
  var ORDER = ["zoe", "maya", "jules", "marcus", "elena", "dana"];
  var DRAFT_NOTE = "Educational draft. These journeys have not been released. Every person, app and coin is fictional, every number is a made-up teaching assumption, and nothing here is financial advice.";
  var RISK_NOTE = "Crypto assets, stablecoins and DeFi apps generally do not have the standard insured-deposit protection that covers eligible bank accounts. Advertised returns are variable and never guaranteed, and you can lose some or all of what you put in.";

  /* ---------- feature flag: OFF unless the page sets window.FLQ_DEFI_RL_ENABLED = true (or mount({enabled:true})) ---------- */
  var ctx = null;
  function enabled() { return !!(ctx && ctx.enabled === true) || (root && root.FLQ_DEFI_RL_ENABLED === true && !!ctx); }

  /* ---------- small deterministic helpers ---------- */
  function hash32(str) { var h = 2166136261 >>> 0; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  /* The answer order shown to the player for one question: a permutation of the three option positions, fixed by (seed, question id). */
  function permutation(seed, qid) {
    var rnd = mulberry32(hash32(String(seed) + ":" + qid)), p = [0, 1, 2];
    for (var i = 2; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; }
    return p;
  }
  function isPerm(a) { return Array.isArray(a) && a.length === 3 && [0, 1, 2].every(function (n) { return a.indexOf(n) >= 0; }); }

  /* ---------- tree access ---------- */
  function letterOf(optId) { var m = /\.opt_([abc])$/.exec(String(optId)); return m ? m[1].toUpperCase() : ""; }
  function qIndexOfOpt(tree, optId) { for (var i = 0; i < tree.Q.length; i++) if (tree.Q[i].opts.indexOf(optId) >= 0) return i; return -1; }
  /* Node key = the letters of the answers already given; the Other-cash twin of Dana's last question ends with "+". */
  function keyFor(tree, run, k) {
    var key = "";
    for (var i = 0; i < k; i++) {
      var a = run.answers[tree.Q[i].id];
      if (!a) return null;
      key += letterOf(a);
    }
    if (k === 6 && run.alloc === true) key += "+";
    return key;
  }
  function nodeAt(tree, run, k) { var key = keyFor(tree, run, k); return key === null ? null : (tree.N[key] || null); }
  function answeredCount(tree, run) { var n = 0; tree.Q.forEach(function (q) { if (run.answers[q.id]) n++; }); return n; }
  function allAnswered(tree, run) { return answeredCount(tree, run) === tree.Q.length; }
  function firstOpen(tree, run) { for (var i = 0; i < tree.Q.length; i++) if (!run.answers[tree.Q[i].id]) return i; return tree.Q.length - 1; }
  /* Points are always read from the tree for the node the answers lead to; stored points are never trusted. */
  function pointsOf(tree, run, k) {
    var a = run.answers[tree.Q[k].id], node = nodeAt(tree, run, k);
    if (!a || !node) return 0;
    var idx = tree.Q[k].opts.indexOf(a);
    return idx >= 0 ? node.o[idx].p : 0;
  }
  function runScore(tree, run) { var s = 0; for (var k = 0; k < tree.Q.length; k++) s += pointsOf(tree, run, k); return s; }

  /* ---------- save data ---------- */
  function emptyStore() { return { v: SCHEMA, journeys: {} }; }
  function freshJourney(tree) { return { ver: { logic: tree.logic, text: tree.text }, run: null, banked: {}, best: 0, runs: 0, seen: {} }; }
  function newRun(seed) { return { seed: seed >>> 0, answers: {}, order: {}, idx: 0, done: false, alloc: false }; }

  /* Checks a stored run against the tree: every answer must be one of that question's options and lead to an existing node. */
  function sanitizeRun(raw, tree) {
    if (!raw || typeof raw !== "object") return null;
    var run = newRun(isFinite(parseInt(raw.seed, 10)) ? parseInt(raw.seed, 10) : 1);
    run.alloc = raw.alloc === true && tree.slug === "dana";
    for (var k = 0; k < tree.Q.length; k++) {
      var q = tree.Q[k], a = raw.answers && raw.answers[q.id];
      if (typeof a === "string" && q.opts.indexOf(a) >= 0) {
        run.answers[q.id] = a;
        if (!nodeAt(tree, run, k)) { delete run.answers[q.id]; break; }
      } else break;                           // answers are a chain: stop at the first gap
    }
    tree.Q.forEach(function (q) { var o = raw.order && raw.order[q.id]; if (isPerm(o)) run.order[q.id] = o.slice(); });
    var i = parseInt(raw.idx, 10); run.idx = isFinite(i) ? Math.max(0, Math.min(tree.Q.length - 1, i)) : 0;
    if (run.alloc && run.answers[tree.Q[6].id]) run.alloc = raw.alloc === true;
    run.done = raw.done === true && allAnswered(tree, run);
    return run;
  }
  /* Version rule: the LOGIC version identifies scoring and ledgers. If it changed, saved progress for that journey is reset.
     A TEXT-only change never resets banked points, best score, runs, seen flags or the run in progress. */
  function sanitizeJourney(raw, tree) {
    var j = freshJourney(tree), info = { reset: false, textChanged: false };
    if (!raw || typeof raw !== "object") return { j: j, info: info };
    var ver = raw.ver || {};
    if (ver.logic !== tree.logic) { info.reset = !!(raw.banked && Object.keys(raw.banked).length) || !!raw.runs || !!raw.run; return { j: j, info: info }; }
    info.textChanged = ver.text !== tree.text;
    tree.Q.forEach(function (q) {
      if (raw.banked && raw.banked[q.id] === POINTS) { j.banked[q.id] = POINTS; j.seen[q.id] = true; }
      if (raw.seen && raw.seen[q.id] === true) j.seen[q.id] = true;
    });
    var b = parseInt(raw.best, 10); if (isFinite(b) && b >= 0 && b <= MAX_POINTS) j.best = Math.floor(b / POINTS) * POINTS;
    var r = parseInt(raw.runs, 10); if (isFinite(r) && r >= 0 && r < 100000) j.runs = r;
    j.run = sanitizeRun(raw.run, tree);
    return { j: j, info: info };
  }
  function sanitizeStore(raw) {
    var s = emptyStore();
    if (!raw || typeof raw !== "object" || raw.v !== SCHEMA || !raw.journeys || typeof raw.journeys !== "object") return s;
    Object.keys(raw.journeys).forEach(function (k) { if (ORDER.indexOf(k) >= 0 && raw.journeys[k] && typeof raw.journeys[k] === "object") s.journeys[k] = raw.journeys[k]; });
    return s;
  }
  function loadStore(storage) { try { var raw = storage && storage.getItem(STORAGE_KEY); return sanitizeStore(raw ? JSON.parse(raw) : null); } catch (e) { return emptyStore(); } }
  function saveStore(storage, store) { try { if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(store)); return true; } catch (e) { return false; } }
  function bankedTotal(j) { var s = 0; if (j && j.banked) Object.keys(j.banked).forEach(function (k) { if (j.banked[k] === POINTS) s += POINTS; }); return Math.min(s, MAX_POINTS); }

  /* ---------- answering ---------- */
  function ensureOrder(run, tree, k) {
    var qid = tree.Q[k].id;
    if (!isPerm(run.order[qid])) run.order[qid] = permutation(run.seed, qid);
    return run.order[qid];
  }
  /* The three options as the player sees them: numerals 1-3 in the persisted order; the internal option ids never change. */
  function displayOptions(tree, run, k) {
    var node = nodeAt(tree, run, k); if (!node) return [];
    var order = ensureOrder(run, tree, k), q = tree.Q[k], taken = run.answers[q.id];
    return order.map(function (idx, pos) {
      var o = node.o[idx];
      return { pos: pos + 1, idx: idx, id: q.opts[idx], text: tree.S[o.t], points: o.p, feedback: tree.S[o.f], unavailable: o.u !== undefined && o.u >= 0 ? tree.S[o.u] : "",
               closing: o.cn !== undefined && o.cn >= 0 ? tree.S[o.cn] : "", picked: taken === q.opts[idx] };
    });
  }
  /* Answer question k by DISPLAY position 1-3. The first answer is final for the run; points bank once per question, ever. */
  function answer(store, tree, run, k, pos) {
    var q = tree.Q[k]; if (!q) return { ok: false, reason: "no-question" };
    if (run.answers[q.id]) return { ok: false, reason: "locked" };
    for (var i = 0; i < k; i++) if (!run.answers[tree.Q[i].id]) return { ok: false, reason: "out-of-order" };
    var opts = displayOptions(tree, run, k), o = opts[pos - 1];
    if (!o) return { ok: false, reason: "no-option" };
    if (o.unavailable) return { ok: false, reason: "unavailable" };
    var j = store.journeys[tree.slug];
    run.answers[q.id] = o.id; j.seen[q.id] = true;
    var banked = false;
    if (o.points > 0 && j.banked[q.id] !== POINTS) { j.banked[q.id] = POINTS; banked = true; }
    return { ok: true, optionId: o.id, points: o.points, correct: o.points > 0, banked: banked, alreadyBanked: o.points > 0 && !banked };
  }
  function setAlloc(tree, run, flag) {
    if (tree.slug !== "dana") return false;
    var q = tree.Q[6]; if (run.answers[q.id]) return false;
    for (var i = 0; i < 6; i++) if (!run.answers[tree.Q[i].id]) return false;
    var base = tree.N[keyFor(tree, run, 6).replace(/\+$/, "")];
    if (!base || !base.ac) return false;
    run.alloc = flag === true; delete run.order[q.id];       // the three answers are re-shown for the recalculated screen
    return true;
  }
  function finishRun(store, tree, run) {
    var j = store.journeys[tree.slug];
    if (run.done || !allAnswered(tree, run)) return { counted: false, score: runScore(tree, run) };
    run.done = true; j.runs += 1;
    var s = runScore(tree, run); if (s > j.best) j.best = s;
    return { counted: true, score: s };
  }
  function startRun(store, tree, seed) {
    var j = store.journeys[tree.slug]; j.run = newRun(seed); return j.run;
  }

  /* ---------- claims register (financial-claims verification gate) ---------- */
  function claimsSummary(reg, slug) {
    var all = (reg && reg.entries) || [], mine = all.filter(function (e) { return e.journey === slug || e.journey === "all"; });
    var open = mine.filter(function (e) { return !(e.status === "VERIFIED" || e.status === "WAIVED" || (e.status === "SIMULATION ASSUMPTION" && e.sim_basis) || e.status === "NAMING REVIEW — UNASSESSED"); });  /* a labeled simulation assumption needs no real-world verification; it is not a waiver */
    return { total: mine.length, unverified: open.length, ok: !!reg && open.length === 0 };
  }
  /* A journey may be started in release mode only when its wording is approved and every financial claim is VERIFIED or WAIVED.
     In draft (local) mode it can always be started, but the draft banner says what is still open. */
  function canStart(tree, reg, releaseMode) {
    if (!releaseMode) return { ok: true, reason: "" };
    if (tree.pending && tree.pending.length) return { ok: false, reason: "Wording is still pending approval (" + tree.pending.length + " items)." };
    var cs = claimsSummary(reg, tree.slug);
    if (!cs.ok) return { ok: false, reason: cs.unverified + " financial claims are not yet verified." };
    return { ok: true, reason: "" };
  }

  /* ---------- text and screens ---------- */
  var T = { view: "hub", slug: null, k: 0, trees: {}, manifest: null, claims: null, store: null, loading: {}, error: "", notice: "", last: {} };
  function esc(s) { return (ctx && ctx.esc) ? ctx.esc(s) : String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* paragraphs on blank lines, line breaks on single newlines, **bold** from the workbooks */
  function fmt(s) {
    return String(s || "").split(/\n\n+/).map(function (p) {
      return "<p>" + esc(p).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }
  function persist() { if (ctx && T.store) saveStore(ctx.storage, T.store); }
  function sfx(n) { try { if (ctx && ctx.sfx) ctx.sfx(n); } catch (e) {} }
  function rerender(f) { if (ctx && ctx.rerender) ctx.rerender(f); }
  function top() { if (typeof window !== "undefined" && window.scrollTo) window.scrollTo(0, 0); }
  function tree() { return T.slug ? T.trees[T.slug] : null; }
  function jr() { var t = tree(); return t ? T.store.journeys[t.slug] : null; }
  function name(slug) { var t = T.trees[slug]; if (t) return t.name; var m = T.manifest && T.manifest.journeys.filter(function (x) { return x.slug === slug; })[0]; return m ? m.name : slug; }

  function header(t) {
    var j = t && T.store.journeys[t.slug];
    return "<div class='top'><div class='brand'><b>FinLit Quest</b><span>DeFi in Real Life · educational draft</span></div>" +
      "<div class='stats rl-stats' aria-label='Your journey progress'>" +
      (t ? "<span class='chip'>Journey points saved <b>" + bankedTotal(j) + " / " + MAX_POINTS + "</b></span>" : "") + "</div></div>";
  }
  function draftBanner(t) {
    var cs = t && T.claims ? claimsSummary(T.claims, t.slug) : null, extra = "";
    if (t && t.pending && t.pending.length) extra += " " + t.pending.length + " wording items are still waiting for approval.";
    if (cs && !cs.ok) extra += " " + cs.unverified + " of " + cs.total + " financial claims for this journey are not yet verified.";
    if (t && !T.claims) extra += " The financial-claims register could not be loaded, so claims are treated as unverified.";
    return "<p class='rl-draft' role='note'><b>Educational draft.</b> " + esc(DRAFT_NOTE.replace(/^Educational draft\.\s*/, "")) + esc(extra) + "</p>";
  }
  function footer() {
    return "<div class='foot'><p>" + esc(RISK_NOTE) + "</p>" +
      "<p>Insurance limits, tax rules and lender behavior differ by place and change over time, so verify current details with official sources.</p>" +
      "<p>Journey points are knowledge points only. They are stored separately in this browser and never change Tower points, Financial City scores, the prototype wallet, coins, XP or mastery.</p></div>";
  }
  function hubCard(slug) {
    var m = T.manifest.journeys.filter(function (x) { return x.slug === slug; })[0]; if (!m) return "";
    var j = T.store.journeys[slug], pts = bankedTotal(j), started = j && j.run && Object.keys(j.run.answers || {}).length;
    return "<li><button class='rl-card' data-action='rlopen' data-id='" + slug + "'><b>" + esc(m.name) + "</b> <span class='tag gold'>Draft</span>" +
      "<small>" + esc(m.blurb || "") + "</small><small class='rl-card-meta'>" + (started ? "In progress · " : "") + "Journey points saved " + pts + " / " + MAX_POINTS + "</small></button></li>";
  }
  function viewHub() {
    if (T.error) return header(null) + "<div class='row'><button class='btn ghost' data-action='home'>← City</button></div>" + draftBanner(null) + "<section class='panel'><h1 tabindex='-1' id='focus'>DeFi in Real Life</h1><p class='rl-err' role='alert'>" + esc(T.error) + "</p><div class='row'><button class='btn primary' data-action='rlretry'>Try again</button></div></section>" + footer();
    if (!T.manifest) return header(null) + "<div class='row'><button class='btn ghost' data-action='home'>← City</button></div>" + draftBanner(null) + "<section class='panel'><h1 tabindex='-1' id='focus'>DeFi in Real Life</h1><p class='muted' aria-live='polite'>Loading journeys…</p></section>" + footer();
    return header(null) + "<div class='row'><button class='btn ghost' data-action='home'>← City</button></div>" + draftBanner(null) +
      "<section class='panel rl-hero'><span class='eyebrow'>Financial City · Educational draft</span><h1 tabindex='-1' id='focus'>DeFi in Real Life</h1>" +
      "<p class='lede'>Six people, seven real-life money decisions each. Three answers per question, feedback straight away, and the numbers on screen come from a tested money model.</p>" +
      "<ul class='clean rl-facts'><li>100 knowledge points for each best-fit first answer, 700 at most per journey.</li><li>Replaying is practice. Saved points can be earned once per question, so replays cannot inflate them.</li><li>Some questions have more than one defensible answer. A perfect score never requires using DeFi.</li></ul></section>" +
      "<section class='panel'><h2>Choose a journey</h2><ul class='rl-cards'>" + ORDER.map(hubCard).join("") + "</ul></section>" + footer();
  }
  function viewIntro() {
    var t = tree(), j = jr(), run = j.run, started = run && answeredCount(t, run) > 0, done = run && run.done, gate = canStart(t, T.claims, ctx && ctx.release === true);
    var cta;
    if (!gate.ok) cta = "<p class='rl-err' role='alert'>" + esc(gate.reason) + "</p>";
    else if (done) cta = "<button class='btn primary' data-action='rlresults'>See my results</button><button class='btn' data-action='rlreplay'>Play again</button>";
    else if (started) cta = "<button class='btn primary' data-action='rlcontinue'>Continue on question " + (firstOpen(t, run) + 1) + "</button><button class='btn' data-action='rlreplay'>Start over</button>";
    else cta = "<button class='btn primary' data-action='rlstart'>Start</button>";
    return header(t) + "<div class='row'><button class='btn ghost' data-action='rlhub'>← Journeys</button><button class='btn ghost' data-action='home'>City</button></div>" + draftBanner(t) +
      (T.notice ? "<p class='rl-notice' role='status'>" + esc(T.notice) + "</p>" : "") +
      "<section class='panel rl-hero'><span class='eyebrow'>DeFi in Real Life</span><h1 tabindex='-1' id='focus'>" + esc(t.name) + "</h1>" + fmt(t.blurb) + fmt(t.intro) +
      "<h3>The rules of this story</h3><ul class='clean'>" + t.plan.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" +
      "<div class='row'>" + cta + "</div>" +
      "<p class='small muted'>Your best: <b>" + (j.best ? j.best + " / " + MAX_POINTS : "not finished yet") + "</b> · Saved journey points: <b>" + bankedTotal(j) + " / " + MAX_POINTS + "</b></p></section>" + footer();
  }
  function progress(t, run) {
    var items = "";
    t.Q.forEach(function (q, i) {
      var a = run.answers[q.id], cls = "rl-step", state = "not answered yet";
      if (a) { var ok = pointsOf(t, run, i) > 0; cls += ok ? " good" : " learn"; state = ok ? "answered, earned points" : "answered, no points"; }
      if (i === T.k) cls += " now";
      items += "<li class='" + cls + "'" + (i === T.k ? " aria-current='step'" : "") + "><span class='rl-dot' aria-hidden='true'>" + q.n + "</span><span class='sr'>Question " + q.n + ": " + esc(tree().S[q.title]) + ", " + state + "</span></li>";
    });
    return "<ol class='rl-prog' aria-label='Question progress, question " + (T.k + 1) + " of " + t.Q.length + "'>" + items + "</ol>";
  }
  function showTable(t, node) {
    if (!node.show.length) return "";
    return "<table class='rl-state'><caption class='sr'>Where things stand</caption><tbody>" + node.show.map(function (r) { return "<tr><th scope='row'>" + esc(t.S[r[0]]) + "</th><td>" + esc(t.S[r[1]]) + "</td></tr>"; }).join("") + "</tbody></table>";
  }
  function cmpTable(t, node) {
    if (!node.cmp) return "";
    return "<div class='rl-cmp'><table><thead><tr><th scope='col'><span class='sr'>Topic</span></th>" + node.cmp.h.map(function (h) { return "<th scope='col'>" + esc(t.S[h]) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      node.cmp.r.map(function (r) { return "<tr><th scope='row'>" + esc(t.S[r[0]]) + "</th>" + r.slice(1).map(function (c) { return "<td>" + esc(t.S[c]) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }
  function optionButton(o, answered) {
    var cls = "opt rl-opt", mark = "";
    if (answered) { if (o.picked) { cls += o.points ? " best" : " picked-wrong"; mark = " <small class='rl-pick'>Your choice</small>"; } }
    var dis = answered || !!o.unavailable;
    return "<button type='button' class='" + cls + "' data-action='rlpick' data-pos='" + o.pos + "'" + (dis ? " disabled" : "") + " aria-keyshortcuts='" + o.pos + "'>" +
      "<span class='rl-num' aria-hidden='true'>" + o.pos + "</span><span class='rl-ctext'>" + esc(o.text) + mark + (o.unavailable ? "<small class='rl-unavail'>" + esc(o.unavailable) + "</small>" : "") + "</span><span class='k' aria-hidden='true'>" + o.pos + "</span></button>";
  }
  function feedbackHtml(t, run, k, node, opts) {
    var q = t.Q[k], got = opts.filter(function (o) { return o.picked; })[0]; if (!got) return "";
    var j = jr(), last = T.last[q.id] || {}, note;
    if (got.points > 0) note = last.banked ? "These " + POINTS + " points are now saved to your journey total." : last.alreadyBanked ? "You already saved this question’s " + POINTS + " points earlier. Replays are practice and don’t add to the saved total." : j.banked[q.id] ? "This question’s " + POINTS + " points are saved (each question counts once)." : "";
    else note = "No points this time. Read why below, then continue. Saved points can still be earned on a later play.";
    var others = opts.filter(function (o) { return !o.picked; }).map(function (o) {
      return "<div><b>Answer " + o.pos + " (" + (o.points ? "earns " + POINTS : "earns 0") + "):</b> " + esc(o.text) + "<p class='muted small'>" + esc(o.feedback) + "</p></div>";
    }).join("");
    var tk = node.tk !== undefined && node.tk >= 0 ? t.S[node.tk] : (q.tk >= 0 ? t.S[q.tk] : "");
    return "<div class='rl-fb' role='region' aria-label='Feedback'><div class='verdict'><span class='pts " + (got.points ? "good-t" : "learn-t") + "'>+" + got.points + "</span>" +
      "<div><b id='rl-fb' tabindex='-1' class='" + (got.points ? "good-t" : "learn-t") + "'>" + (got.points ? "Best fit" : "Not the best fit") + "</b><div class='muted small'>" + esc(note) + "</div></div></div>" +
      "<div class='rl-ftext'>" + fmt(got.feedback) + "</div>" +
      (node.w !== undefined && node.w >= 0 ? "<div class='box'><b>Why.</b>" + fmt(t.S[node.w]) + "</div>" : "") +
      cmpTable(t, node) +
      (node.aft !== undefined && node.aft >= 0 ? "<p class='rl-note'>" + esc(t.S[node.aft]) + "</p>" : "") +
      (got.closing ? "<p class='rl-note'><b>Closing.</b> " + esc(got.closing) + "</p>" : "") +
      "<details style='margin-top:12px'><summary>How the other answers compare</summary><div class='others' style='margin-top:10px'>" + others + "</div></details>" +
      (tk ? "<p class='box' style='margin-top:14px'><b>Takeaway.</b> " + esc(tk) + "</p>" : "") + "</div>";
  }
  function allocControl(t, run, k, node, answered) {
    if (t.slug !== "dana" || k !== 6 || !node.ac) return "";
    return "<div class='rl-alloc'><label><input type='checkbox' data-action='rlalloc'" + (run.alloc ? " checked" : "") + (answered ? " disabled" : "") + "> Move my Other available cash into home savings first</label>" +
      "<small class='muted'>Not one of the three answers. The screen recalculates today’s balance, the projection, the gap and which answers can earn credit.</small></div>";
  }
  function viewQuestion() {
    var t = tree(), j = jr(), run = j.run, k = T.k, q = t.Q[k], node = nodeAt(t, run, k);
    if (!node) return viewIntro();
    var opts = displayOptions(t, run, k), answered = !!run.answers[q.id], last = k === t.Q.length - 1;
    var next = last ? "<button class='btn primary' data-action='rlfinish'" + (allAnswered(t, run) ? "" : " disabled") + ">See my results</button>"
                    : "<button class='btn primary' data-action='rlnext'" + (answered ? "" : " disabled") + ">Next question →</button>";
    return header(t) + "<div class='row'><button class='btn ghost' data-action='rlintro'>← " + esc(t.name) + "</button><button class='btn ghost' data-action='home'>City</button></div>" + draftBanner(t) + progress(t, run) +
      "<article class='panel rl-card-q'><div class='rl-q-head'><span class='rl-badge' aria-hidden='true'>" + q.n + "</span><div><span class='eyebrow'>Question " + q.n + " of " + t.Q.length + " · Month " + q.month + "</span>" +
      "<h1 tabindex='-1' id='focus' style='font-size:clamp(1.5rem,4.2vw,2.2rem)'>" + esc(t.S[q.title]) + "</h1></div></div>" +
      "<div class='rl-sit'>" + fmt(t.S[node.sit]) + "</div>" + showTable(t, node) +
      (node.note >= 0 ? "<div class='rl-assume'>" + fmt(t.S[node.note]) + "</div>" : "") +
      allocControl(t, run, k, node, answered) +
      "<div class='opts rl-opts' role='group' aria-label='Choose one answer. Keys 1 to 3 also work.'>" + opts.map(function (o) { return optionButton(o, answered); }).join("") + "</div>" +
      (answered ? feedbackHtml(t, run, k, node, opts) : "<p class='muted small' style='margin-top:12px'>Pick one answer to see feedback right away. Tip: keys 1, 2 and 3 work too.</p>") +
      "<div class='row rl-nav'><button class='btn' data-action='rlprev'" + (k === 0 ? " disabled" : "") + ">← Previous</button>" + next + "</div></article>" + footer();
  }
  function viewResults() {
    var t = tree(), j = jr(), run = j.run, score = runScore(t, run);
    var rows = t.Q.map(function (q, i) { var p = pointsOf(t, run, i); return "<li><span>Question " + q.n + " · " + esc(t.S[q.title]) + "</span><b class='" + (p ? "good-t" : "learn-t") + "'>" + (p ? "Best fit" : "Not the best fit") + " · +" + p + "</b></li>"; }).join("");
    return header(t) + "<div class='row'><button class='btn ghost' data-action='rlintro'>← " + esc(t.name) + "</button><button class='btn ghost' data-action='home'>City</button></div>" + draftBanner(t) +
      "<section class='panel celebrate rl-result'><span class='eyebrow'>Journey complete</span><h1 tabindex='-1' id='focus'>" + esc(t.name) + "</h1>" +
      "<div class='score' aria-label='Score this play: " + score + " out of " + MAX_POINTS + "'>" + score + "<span class='muted' style='font-size:.4em'> / " + MAX_POINTS + "</span></div>" +
      "<p class='muted'>Knowledge points this play" + (score === j.best && j.runs > 1 ? " · your best so far" : "") + "</p>" +
      "<p style='margin-top:10px'>Saved journey points: <b>" + bankedTotal(j) + " / " + MAX_POINTS + "</b>. Each question can add its " + POINTS + " points to the saved total only once.</p>" +
      "<p class='box' style='margin-top:12px'>Good decisions do not guarantee outcomes. Your score measures the quality of your decisions given what you knew, not how the story turned out.</p>" +
      "<div class='row' style='margin-top:16px'><button class='btn primary' data-action='rlreplay'>Play again</button><button class='btn' data-action='rlhub'>All journeys</button><button class='btn ghost' data-action='home'>Back to the city</button></div></section>" +
      "<section class='panel'><h2>Question by question</h2><ul class='rl-review'>" + rows + "</ul></section>" + footer();
  }
  function view() {
    if (!enabled()) return "";
    if (T.view === "loading") return header(null) + "<section class='panel'><h1 tabindex='-1' id='focus'>Loading…</h1></section>";
    var t = tree(), j = t && jr();
    if (T.view === "question" && t && j.run) return viewQuestion();
    if (T.view === "results" && t && j.run && j.run.done) return viewResults();
    if (T.view === "intro" && t) return viewIntro();
    return viewHub();
  }

  /* ---------- data loading (fetch in the browser; tests pass data directly) ---------- */
  function fetchJson(url) {
    if (ctx && ctx.loader) return ctx.loader(url);
    return fetch(url, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(url + " " + r.status); return r.json(); });
  }
  function loadManifest() {
    if (T.manifest) return Promise.resolve(T.manifest);
    return fetchJson(URLS.manifest).then(function (m) {
      if (!m || m.schema !== "flq.defi-rl.manifest.v1" || !Array.isArray(m.journeys)) throw new Error("bad manifest");
      T.manifest = m; T.error = ""; return m;
    });
  }
  function loadClaims() {
    if (T.claims) return Promise.resolve(T.claims);
    return fetchJson(URLS.claims).then(function (c) { T.claims = (c && Array.isArray(c.entries)) ? c : null; return T.claims; }, function () { return null; });
  }
  function adopt(slug, tr) {
    if (!tr || tr.schema !== "flq.defi-rl.tree.v1" || tr.slug !== slug) throw new Error("bad tree");
    T.trees[slug] = tr;
    var res = sanitizeJourney(T.store.journeys[slug], tr);
    T.store.journeys[slug] = res.j;
    T.notice = res.info.reset ? "This journey was updated and its scoring changed, so your earlier saved points for it were reset." : "";
    persist();
  }
  function loadTree(slug) {
    if (T.trees[slug]) return Promise.resolve(T.trees[slug]);
    var m = T.manifest.journeys.filter(function (x) { return x.slug === slug; })[0];
    if (!m) return Promise.reject(new Error("unknown journey"));
    return fetchJson(BASE + "runtime/" + m.file).then(function (tr) { adopt(slug, tr); return tr; });
  }
  function boot() {
    T.view = "hub";
    return Promise.all([loadManifest(), loadClaims()]).then(function () { rerender(false); }, function (e) { T.error = "The journeys could not be loaded. " + (e && e.message ? e.message : ""); rerender(false); });
  }

  /* ---------- actions (called by Financial City's click dispatcher) ---------- */
  function show(k) { var t = tree(), run = jr().run; T.k = Math.max(0, Math.min(t.Q.length - 1, k)); run.idx = T.k; T.view = "question"; ensureOrder(run, t, T.k); jr().seen[t.Q[T.k].id] = true; persist(); rerender(); top(); }
  function seed() { return ctx && typeof ctx.seed === "number" ? ctx.seed : (Math.floor(Math.random() * 4294967295) + 1); }
  var actions = {
    rlhub: function () { T.view = "hub"; T.slug = null; rerender(); top(); },
    rlretry: function () { T.error = ""; boot(); },
    rlopen: function (el) {
      var slug = el.dataset.id; T.view = "loading"; T.slug = slug; rerender();
      loadTree(slug).then(function () { T.view = "intro"; rerender(); top(); }, function () { T.view = "hub"; T.slug = null; T.error = "That journey could not be loaded."; rerender(); });
    },
    rlintro: function () { T.view = "intro"; rerender(); top(); },
    rlstart: function () { var t = tree(); if (!canStart(t, T.claims, ctx && ctx.release === true).ok) return; startRun(T.store, t, seed()); T.last = {}; show(0); },
    rlreplay: function () { var t = tree(); if (!canStart(t, T.claims, ctx && ctx.release === true).ok) return; startRun(T.store, t, seed()); T.last = {}; show(0); },
    rlcontinue: function () { var t = tree(), j = jr(); if (!j.run) startRun(T.store, t, seed()); show(firstOpen(t, j.run)); },
    rlpick: function (el) {
      var t = tree(); if (T.view !== "question" || !t || !jr().run) return;
      var res = answer(T.store, t, jr().run, T.k, parseInt(el.dataset.pos, 10));
      if (!res.ok) return;
      T.last[t.Q[T.k].id] = res; persist(); sfx("confirm");
      setTimeout(function () { sfx(res.correct ? "correct" : "learn"); }, 450);
      rerender(false); focusFeedback();
    },
    rlalloc: function (el) { var t = tree(); if (setAlloc(t, jr().run, !!el.checked)) { persist(); rerender(false); } },
    rlnext: function () { var t = tree(), run = jr().run; if (!run.answers[t.Q[T.k].id]) return; if (T.k < t.Q.length - 1) show(T.k + 1); },
    rlprev: function () { if (T.k > 0) show(T.k - 1); },
    rlfinish: function () { var t = tree(), run = jr().run; if (!allAnswered(t, run)) return; finishRun(T.store, t, run); persist(); T.view = "results"; sfx("correct"); rerender(); top(); },
    rlresults: function () { var run = jr().run; if (run && run.done) { T.view = "results"; rerender(); top(); } }
  };
  function focusFeedback() { if (typeof document === "undefined") return; var el = document.getElementById("rl-fb"); if (el) { try { el.focus(); } catch (e) {} } }
  /* Keyboard: 1-3 choose an answer by its on-screen number, arrows move between questions. Returns true when the key was used. */
  function onKey(e) {
    if (!enabled() || T.view !== "question" || !tree() || e.metaKey || e.ctrlKey || e.altKey) return false;
    var t = e.target; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || "")) return false;
    var tr = tree(), run = jr().run, q = tr.Q[T.k];
    if (/^[1-3]$/.test(e.key)) { if (run.answers[q.id]) return false; actions.rlpick({ dataset: { pos: e.key } }); return true; }
    if (e.key === "ArrowRight") { if (!run.answers[q.id] || T.k >= tr.Q.length - 1) return false; actions.rlnext(); return true; }
    if (e.key === "ArrowLeft") { if (T.k > 0) { actions.rlprev(); return true; } return false; }
    return false;
  }

  function mount(c) {
    ctx = c || {};
    T = { view: "hub", slug: null, k: 0, trees: {}, manifest: null, claims: null, store: null, loading: {}, error: "", notice: "", last: {} };
    if (!enabled()) return api;                            // flag off: nothing is read, written or fetched
    T.store = loadStore(ctx.storage);
    if (ctx.data) { T.manifest = ctx.data.manifest; T.claims = ctx.data.claims || null; Object.keys(ctx.data.trees || {}).forEach(function (s) { adopt(s, ctx.data.trees[s]); }); }
    return api;
  }
  function enter() { if (!enabled()) return; T.view = "hub"; T.slug = null; if (!T.manifest) boot(); }
  function state() { return T; }
  function unmountForTest() { ctx = null; T = { view: "hub", slug: null, k: 0, trees: {}, manifest: null, claims: null, store: null, loading: {}, error: "", notice: "", last: {} }; }

  var api = {
    STORAGE_KEY: STORAGE_KEY, SCHEMA: SCHEMA, POINTS: POINTS, MAX_POINTS: MAX_POINTS, QUESTIONS: QUESTIONS, ORDER: ORDER, BASE: BASE, URLS: URLS, DRAFT_NOTE: DRAFT_NOTE,
    enabled: enabled, permutation: permutation, keyFor: keyFor, nodeAt: nodeAt, displayOptions: displayOptions, answer: answer, setAlloc: setAlloc, finishRun: finishRun, startRun: startRun,
    runScore: runScore, pointsOf: pointsOf, bankedTotal: bankedTotal, answeredCount: answeredCount, allAnswered: allAnswered, firstOpen: firstOpen,
    emptyStore: emptyStore, freshJourney: freshJourney, newRun: newRun, sanitizeStore: sanitizeStore, sanitizeJourney: sanitizeJourney, sanitizeRun: sanitizeRun,
    loadStore: loadStore, saveStore: saveStore, claimsSummary: claimsSummary, canStart: canStart, fmt: fmt,
    mount: mount, enter: enter, view: view, actions: actions, onKey: onKey, state: state, unmountForTest: unmountForTest
  };
  return api;
});

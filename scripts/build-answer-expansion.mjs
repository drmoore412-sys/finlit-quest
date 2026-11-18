#!/usr/bin/env node
// Exhaustive-answer expansion (owner-authorised 2026-11-18, Phase 2b).
//   node scripts/build-answer-expansion.mjs generate   one-time: compute the added answers + compact layouts from the sources as they
//                                                       were BEFORE expansion and write content/answer-expansion-v1.json/.js
//   node scripts/build-answer-expansion.mjs apply      write the expansion into the new-world banks and the nine sequence puzzles
//                                                       (the 14 slate puzzles read the manifest at build time, see v3-puzzle-slate.js)
//   node scripts/build-answer-expansion.mjs check      verify the repository sources match the manifest (used by tests)
// Layout search is slow (seconds per puzzle), so `generate` keeps a resumable cache in the OS temp folder.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const A = require(path.join(ROOT, "src/answer-expansion.js")), G = require(path.join(ROOT, "src/game-engine.js"));
const readJson = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const writeJson = (f, o) => fs.writeFileSync(path.join(ROOT, f), JSON.stringify(o, null, 2) + "\n");
const MANIFEST = "content/answer-expansion-v1.json";
const BANKS = "content/2027-new-world-puzzle-banks.json", BANKS_JS = "content/2027-new-world-puzzle-banks.js", SEQ = "content/unified-prototype-12-puzzles-dev.json";

function financialRecord(entry, puzzleWorld) {
  const record = { word: entry.word, category: "financial-secondary", termId: entry.termId, masteryId: entry.termId, definition: entry.definition, worldId: entry.worldId, rewardPolicy: "financial-first-solve" };
  if (entry.worldId !== puzzleWorld) record.crossWorld = true;
  return record;
}
export function writeBanksJs(banks) {
  const file = path.join(ROOT, BANKS_JS), old = fs.readFileSync(file, "utf8"), start = old.indexOf("return {") + 7, tail = "};});\n";
  // the generated adapter is `return {…};});` — the object literal is replaced whole, so the closing brace is part of the JSON

  if (!old.endsWith(tail)) throw new Error("unexpected banks .js tail");
  fs.writeFileSync(file, old.slice(0, start) + JSON.stringify(banks) + tail.slice(1));
}
function sources() {
  const slate = require(path.join(ROOT, "src/v3-puzzle-slate.js")), H = require(path.join(ROOT, "tests/unified-release-helpers.js"));
  const banks = readJson(BANKS), seq = readJson(SEQ);
  return { canonical: H.canonicalPuzzles(), banks, seq, slate };
}
function generate() {
  const dictionary = A.loadDictionary(ROOT);
  if (dictionary.size !== A.EXPECTED_TERM_COUNT) throw new Error(`dictionary has ${dictionary.size} terms, expected ${A.EXPECTED_TERM_COUNT}`);
  const { canonical, seq } = sources(), slateIds = new Set(require(path.join(ROOT, "src/v3-puzzle-slate.js")).SPECS.map(s => `FQ-V3:${s.worldId}:${s.anchor}:R${s.revision || 1}`));
  const cachePath = path.join(os.tmpdir(), "finlit-answer-expansion-cache.json"), cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : {};
  const started = Date.now(), budgetMs = Number(process.env.BUDGET_MS || 140000), puzzles = {};
  const all = [...canonical.map(p => ({ p, source: slateIds.has(p.id) ? "slate" : "bank" })), ...seq.puzzles.map(p => ({ p, source: "sequence" }))];
  let pending = 0;
  for (const { p, source } of all) {
    const missing = A.missingAnswers(p, dictionary);
    if (!missing.length) continue;
    const previous = A.requiredWordsOf(p), required = [...previous, ...missing.map(m => m.word)];
    let layout = cache[p.id];
    if (!layout || layout.words !== required.join(",")) {
      if (Date.now() - started > budgetMs) { pending++; continue; }
      const solved = G.solveCompactCrossword(required);
      if (!solved.ok) throw new Error(`${p.id} does not lay out: ${solved.reason}`);
      layout = cache[p.id] = { words: required.join(","), placements: solved.placements, bounds: solved.bounds, cellFit: solved.cellFit };
      fs.writeFileSync(cachePath, JSON.stringify(cache));
    }
    puzzles[p.id] = { source, worldId: p.worldId, anchorWord: p.anchorWord, previousRequiredWords: previous,
      added: missing.map(m => ({ word: m.word, termId: m.termId, worldId: m.worldId })), requiredWords: required, layout: layout.placements, bounds: layout.bounds, cellFit: layout.cellFit };
  }
  if (pending) { console.log(`PARTIAL: ${pending} puzzles still pending, run again`); process.exit(2); }
  const manifest = { schemaVersion: 1, expansionVersion: A.EXPANSION_VERSION, approvedOn: "2026-11-18",
    rule: "Every approved financial term in the dictionary that can be spelled from a puzzle's wheel is a required answer of that puzzle.",
    dictionary: { sources: A.SOURCES.map(s => s.file), termCount: dictionary.size },
    rewardGuard: "An answer listed in `added` never pays coins or XP on a puzzle whose record already shows a completion; learning mastery is unaffected.",
    totals: { puzzles: Object.keys(puzzles).length, addedOccurrences: Object.values(puzzles).reduce((n, v) => n + v.added.length, 0) }, puzzles };
  writeJson(MANIFEST, manifest);
  fs.writeFileSync(path.join(ROOT, "content/answer-expansion-v1.js"), `window.FINLIT_ANSWER_EXPANSION = ${JSON.stringify(manifest)};\n`);
  console.log("wrote", MANIFEST, JSON.stringify(manifest.totals));
}
function apply() {
  const manifest = readJson(MANIFEST), dictionary = A.loadDictionary(ROOT), banks = readJson(BANKS), seq = readJson(SEQ);
  let touched = 0;
  const patch = (puzzle, record) => {
    const have = new Set(A.requiredWordsOf(puzzle));
    for (const item of record.added) if (!have.has(item.word)) {
      const entry = dictionary.get(item.word);
      puzzle.answers.push(financialRecord(entry, puzzle.worldId));
      if (puzzle.compositionRuleVersion) { puzzle.supportRelevance = puzzle.supportRelevance || {}; puzzle.supportRelevance[item.word] = { label: "incidental", explanation: "Approved financial term the wheel spells; required by the exhaustive-answer rule (answer-expansion v1)." }; }
    }
    puzzle.requiredWords = record.requiredWords.slice();
    puzzle.layout = record.layout.map(x => ({ ...x }));
    touched++;
  };
  for (const list of Object.values(banks.banks)) for (const puzzle of list) { const r = manifest.puzzles[puzzle.id]; if (r && r.source === "bank") patch(puzzle, r); }
  for (const puzzle of seq.puzzles) { const r = manifest.puzzles[puzzle.id]; if (r && r.source === "sequence") patch(puzzle, r); }
  writeJson(BANKS, banks); writeBanksJs(banks); writeJson(SEQ, seq);
  console.log("patched", touched, "puzzle records");
}
function check() {
  const manifest = readJson(MANIFEST), dictionary = A.loadDictionary(ROOT), { canonical, seq } = sources(), errors = [];
  const revisions = readJson("content/unified-exact-wheel-revisions-dev.json").puzzles;
  const byId = new Map([...canonical, ...seq.puzzles, ...revisions].map(p => [p.id, p]));
  for (const [id, r] of Object.entries(manifest.puzzles)) {
    const p = byId.get(id);
    if (!p) { errors.push(`${id}: missing puzzle`); continue; }
    if ([...p.requiredWords].sort().join(",") !== [...r.requiredWords].sort().join(",")) errors.push(`${id}: requiredWords differ from manifest`);
  }
  for (const p of byId.values()) { const m = A.missingAnswers(p, dictionary); if (m.length) errors.push(`${p.id}: not exhaustive (${m.map(x => x.word).join(",")})`); }
  // the seven exact-wheel revisions (composition rule v4) must spell their wheel exactly with no declared extras; the superseded revisions in SEQ are historical
  for (const p of revisions) if (!A.anchorSpellsWheelExactly(p)) errors.push(`${p.id}: wheel is not exactly the key term's letters`);
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  console.log("expansion manifest matches sources");
}
const mode = process.argv[2];
if (mode === "generate") generate(); else if (mode === "apply") apply(); else if (mode === "check") check(); else { console.error("usage: generate | apply | check"); process.exit(1); }

// Generates the seven exact-wheel revisions (composition rule v4, owner-approved 2026-11-18) and the main-levels sequenceVersion 3 manifest.
//   node scripts/build-exact-wheel-revisions.mjs generate   writes content/unified-exact-wheel-revisions-dev.json and content/unified-sequence-v3-dev.json
//   node scripts/build-exact-wheel-revisions.mjs check      verifies both files are what generate would write (no drift)
// The superseded revisions stay untouched in content/unified-prototype-12-puzzles-dev.json and content/unified-sequence-v2-gated-dev.json.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const A = require(path.join(ROOT, "src/answer-expansion.js")), G = require(path.join(ROOT, "src/game-engine.js")), S = require(path.join(ROOT, "src/unified-sequence.js"));
const readJson = f => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const OUT_PUZZLES = "content/unified-exact-wheel-revisions-dev.json", OUT_SEQ = "content/unified-sequence-v3-dev.json";
const OLD_PUZZLES = "content/unified-prototype-12-puzzles-dev.json", OLD_SEQ = "content/unified-sequence-v2-gated-dev.json";
// the seven owner-approved corrections: superseded revision -> new revision
const REVISIONS = [
  ["FQ-V3:business:RETAIL:R1", "FQ-V3:business:RETAIL:R2"],
  ["FQ-V3:moneybasics:RECEIPT:R3", "FQ-V3:moneybasics:RECEIPT:R4"],
  ["FQ-V3:investing:TRADE:R3", "FQ-V3:investing:TRADE:R4"],
  ["FQ-V3:investing:MARKET:R3", "FQ-V3:investing:MARKET:R4"],
  ["FQ-V3:investing:RETURN:R3", "FQ-V3:investing:RETURN:R4"],
  ["FQ-V3:credit:DEFAULT:R1", "FQ-V3:credit:DEFAULT:R2"],
  ["FQ-V3:credit:CREDIT:R1", "FQ-V3:credit:CREDIT:R2"],
];
const INCIDENTAL = "Approved financial term the wheel spells; required by the exhaustive-answer rule (composition rule v4).";

export function build() {
  const dictionary = A.loadDictionary(ROOT), oldFile = readJson(OLD_PUZZLES), oldSeq = readJson(OLD_SEQ);
  const byId = new Map(oldFile.puzzles.map(p => [p.id, p]));
  const puzzles = [];
  for (const [oldId, newId] of REVISIONS) {
    const old = byId.get(oldId);
    if (!old) throw new Error(`missing superseded revision ${oldId}`);
    const revision = Number(/:R(\d+)$/.exec(newId)[1]), wheel = [...old.anchorWord];
    const spellable = [...dictionary.values()].filter(e => e.word !== old.anchorWord && A.spellable(e.word, wheel)).map(e => e.word);
    // keep the previous order of the answers that survive; the anchor is always first
    const order = [old.anchorWord, ...old.answers.map(a => a.word).filter(w => w !== old.anchorWord && spellable.includes(w))];
    for (const w of spellable) if (!order.includes(w)) order.push(w);
    const answers = order.map(word => {
      const previous = old.answers.find(a => a.word === word);
      if (previous) return { ...previous };
      const entry = dictionary.get(word);
      return { word, category: "financial-secondary", termId: entry.termId, masteryId: entry.termId, definition: entry.definition, worldId: entry.worldId, rewardPolicy: "financial-first-solve", ...(entry.worldId !== old.worldId ? { crossWorld: true } : {}) };
    });
    const solved = G.solveCompactCrossword(order);
    if (!solved.ok) throw new Error(`${newId} does not lay out: ${solved.reason}`);
    const supportRelevance = {};
    for (const a of answers) if (a.category === "financial-secondary") supportRelevance[a.word] = (old.supportRelevance && old.supportRelevance[a.word]) || { label: "incidental", explanation: INCIDENTAL };
    const removed = old.answers.map(a => a.word).filter(w => !order.includes(w));
    const puzzle = { ...old, id: newId, contentRevision: revision, compositionRuleVersion: "v4" };
    delete puzzle.declaredExtraLetters;
    Object.assign(puzzle, {
      contentStatus: "owner-approved-exact-wheel-revision",
      prototype: undefined,
      wheelLetters: wheel, answers, requiredWords: order.slice(), bonusWords: [], supportRelevance, layout: solved.placements.map(x => ({ ...x })),
      exactWheelRevision: { replaces: oldId, approvedOn: "2026-11-18", rule: "v4", previousWheel: old.wheelLetters.join(""), previousDeclaredExtraLetters: old.declaredExtraLetters || [], removedAnswers: removed, keyTermUnchanged: true },
    });
    delete puzzle.prototype;
    puzzles.push(puzzle);
  }
  // sequence v3 = released sequence v2 with the seven replacements applied through the existing replace() mechanism
  let manifest = JSON.parse(JSON.stringify(oldSeq));
  for (const [oldId, newId] of REVISIONS) {
    const position = manifest.entries.findIndex(e => e.puzzleId === oldId) + 1;
    if (!position) throw new Error(`${oldId} is not an entry of sequence v2`);
    const prior = manifest.entries[position - 1];
    manifest = S.replace(manifest, position, { puzzleId: newId, anchor: prior.anchor, compositionRuleVersion: "v4", releaseStatus: "candidate", validation: { ...prior.validation, ruleVersionChecked: "v4" } });
    manifest.sequenceVersion -= 1; // replace() bumps once per call; the seven replacements are one release (v2 -> v3)
  }
  manifest.sequenceVersion = oldSeq.sequenceVersion + 1;
  manifest.retired = manifest.retired.map(r => ({ ...r }));
  manifest.note = "GATED CANDIDATE (sequenceVersion 3 of main-levels): sequenceVersion 2 plus seven exact-wheel replacements (RETAIL, RECEIPT, TRADE, MARKET, RETURN, DEFAULT, CREDIT) under composition rule v4. Development-only until the owner approves the release.";
  return { puzzleFile: { prototypeId: "exact-wheel-revisions", devOnly: true, note: "Seven exact-wheel revisions under composition rule v4 (owner-approved 2026-11-18). Each keeps its financial key term; the wheel is exactly the key term's letters and every approved spellable financial term is a required answer. Generated by scripts/build-exact-wheel-revisions.mjs.", puzzles }, manifest };
}
const text = o => JSON.stringify(o, null, 2) + "\n";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { puzzleFile, manifest } = build(), mode = process.argv[2];
  if (mode === "generate") { fs.writeFileSync(path.join(ROOT, OUT_PUZZLES), text(puzzleFile)); fs.writeFileSync(path.join(ROOT, OUT_SEQ), text(manifest)); console.log("wrote", OUT_PUZZLES, OUT_SEQ); }
  else if (mode === "check") {
    const stale = [[OUT_PUZZLES, puzzleFile], [OUT_SEQ, manifest]].filter(([f, o]) => !fs.existsSync(path.join(ROOT, f)) || fs.readFileSync(path.join(ROOT, f), "utf8") !== text(o));
    if (stale.length) { console.error("stale:", stale.map(s => s[0]).join(", ")); process.exit(1); }
    console.log("exact-wheel revisions up to date");
  } else { console.error("usage: generate | check"); process.exit(1); }
}

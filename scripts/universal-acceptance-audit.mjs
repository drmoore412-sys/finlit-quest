#!/usr/bin/env node
// Audit of approved-term acceptance + currency bonus across the 61 released puzzles, run through the real runtime functions.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const X = require("../tests/universal-acceptance-helpers.js");
const A = require("../src/answer-expansion.js");
const dictionary = A.loadDictionary(process.cwd());
let combos = 0, accepted = 0, required = 0, bonus = 0, rejected = 0;
const byWorld = {}, perPuzzle = [];
for (const puzzle of X.activePuzzles()) {
  byWorld[puzzle.worldId] = (byWorld[puzzle.worldId] || 0) + 1;
  const s = X.session(puzzle), eligible = [...dictionary.keys()].filter(w => w.length >= 3 && X.Wheel.canSpell(w, s.model.letters));
  for (const w of eligible) { combos++; const r = s.submit(w).outcome; if (r === "required") { accepted++; required++ } else if (r === "bonus") { accepted++; bonus++ } else rejected++ }
  perPuzzle.push({ id: puzzle.id, letters: s.model.letters.join(""), eligible: eligible.length, currency: s.options().currency && s.options().currency.code });
}
const termsEligibleSomewhere = new Set();
for (const puzzle of X.activePuzzles()) { const s = X.session(puzzle); for (const w of dictionary.keys()) if (w.length >= 3 && X.Wheel.canSpell(w, s.model.letters)) termsEligibleSomewhere.add(w) }
console.log(JSON.stringify({ approvedTerms: dictionary.size, distinctTermsEligibleSomewhere: termsEligibleSomewhere.size, puzzles: perPuzzle.length, byWorld, combos, accepted, required, bonus, rejected, currencyAssigned: perPuzzle.filter(p => p.currency).length, noCurrency: perPuzzle.filter(p => !p.currency).map(p => p.id + " [" + p.letters + "]") }, null, 1));

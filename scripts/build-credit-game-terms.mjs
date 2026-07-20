// Extracts single-word vocabulary (word + definition) from the Credit Foundations
// workbook flashcards for use in the Credit word-connect game. Multi-word terms
// (e.g. "Credit limit") are skipped — the crossword/wheel mechanic needs single
// unbroken words, same constraint as the Crypto word list.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const runtime = JSON.parse(fs.readFileSync(path.join(root, "curriculum/credit/approved/runtime/credit-foundations.json"), "utf8"));

const seen = new Map();
runtime.workbooks.forEach((workbook) => {
  workbook.flashcards.forEach((card) => {
    if (/[\s-]/.test(card.term)) return;
    const word = card.term.toUpperCase().replace(/[^A-Z]/g, "");
    if (word.length < 3 || seen.has(word)) return;
    seen.set(word, card.definition);
  });
});

const terms = [...seen.entries()].map(([word, definition]) => ({ word, definition }));

const outJsonPath = path.join(root, "content/credit-game-terms.json");
const outJsPath = path.join(root, "content/credit-game-terms.js");
fs.writeFileSync(outJsonPath, JSON.stringify(terms, null, 2) + "\n");
fs.writeFileSync(outJsPath, `// Generated from Credit Foundations workbook flashcards by scripts/build-credit-game-terms.mjs. Do not edit by hand.\nwindow.CREDIT_GAME_TERMS = ${JSON.stringify(terms, null, 2)};\n`);

console.log(`Extracted ${terms.length} single-word credit terms.`);
console.log(`Wrote ${path.relative(root, outJsonPath)}`);
console.log(`Wrote ${path.relative(root, outJsPath)}`);

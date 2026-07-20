// Validates every puzzle in a bank file against the formal validator.
// Usage: node scripts/validate-puzzle-bank.mjs <file>
// Exits non-zero if any puzzle is invalid.

import { readBankFile, gameEngine, puzzleValidator } from "./puzzle-cli-shared.mjs";

const file = process.argv[2];
if (!file) throw new Error("Usage: node scripts/validate-puzzle-bank.mjs <file>");

const envelope = await readBankFile(file);
const puzzles = envelope.puzzles || [];
const allIds = new Set(puzzles.map((p) => p.id));

let invalidCount = 0;
puzzles.forEach((puzzle) => {
  const existingIds = new Set(allIds);
  existingIds.delete(puzzle.id); // don't flag a puzzle as a duplicate of itself
  const result = puzzleValidator.validatePuzzle(puzzle, {
    canFormFn: gameEngine.canForm,
    layoutWordsFn: gameEngine.layoutWords,
    existingIds,
  });
  if (!result.valid) {
    invalidCount++;
    console.log(`INVALID ${puzzle.id || "(no id)"}: ${result.errors.join(", ")}`);
  }
});

console.log(`${puzzles.length - invalidCount}/${puzzles.length} puzzles valid in ${file}.`);
if (invalidCount > 0) {
  console.error(`${invalidCount} invalid puzzle(s) found.`);
  process.exit(1);
}

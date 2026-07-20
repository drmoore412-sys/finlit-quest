// Regenerates a single puzzle in place (same id/seq/focusWord/puzzleMode,
// fresh letters and required/bonus words), retrying until a valid
// replacement is found.
// Usage: node scripts/regenerate-puzzle.mjs <file> <puzzleId>

import { readBankFile, writeBankFile, loadVocabulary, loadLessonAllowlists, pipelineDeps, puzzleValidator, pipelineService } from "./puzzle-cli-shared.mjs";

const [file, puzzleId] = process.argv.slice(2);
if (!file || !puzzleId) throw new Error("Usage: node scripts/regenerate-puzzle.mjs <file> <puzzleId>");

const envelope = await readBankFile(file);
const puzzles = envelope.puzzles || [];
const index = puzzles.findIndex((p) => p.id === puzzleId);
if (index < 0) throw new Error(`No puzzle with id '${puzzleId}' in ${file}.`);

const old = puzzles[index];
const seq = Number(String(old.id).split("-P").pop());
const worldVocabulary = await loadVocabulary(envelope.worldId);
const deps = pipelineDeps();
const existingIds = new Set(puzzles.map((p) => p.id).filter((id) => id !== puzzleId));
const puzzleMode = old.puzzleMode || "multi-term";

// A lesson-targeted puzzle must be regenerated from the SAME restricted
// lesson vocabulary it originally came from — otherwise the replacement
// could silently pull in words the lesson hasn't unlocked yet. World-scoped
// puzzles keep drawing from the whole Knowledge Base, as before.
let candidateVocabulary = worldVocabulary;
let lessonAllowlists = null;
if (old.sourceGenerationScope && old.sourceGenerationScope.type === "lesson") {
  const lessonId = old.sourceGenerationScope.lessonId;
  lessonAllowlists = await loadLessonAllowlists(envelope.worldId);
  const allowedTags = lessonAllowlists[lessonId];
  if (!allowedTags) throw new Error(`Puzzle '${puzzleId}' was generated for lesson '${lessonId}', which no longer exists in '${envelope.worldId}'.`);
  candidateVocabulary = worldVocabulary.filter((entry) => allowedTags.includes(entry.word));
}

let replacement = null;
const maxAttempts = 100;
for (let attempt = 0; attempt < maxAttempts && !replacement; attempt++) {
  const candidate = deps.generateCandidate(candidateVocabulary, deps.shuffleFn, deps.wheelForFn, deps.canFormFn, { mode: puzzleMode, focusWord: old.focusWord, maxWords: 5, wheelBudget: 9, bonusVocabulary: worldVocabulary });
  if (!candidate) continue;
  const { score, difficulty } = deps.scoreDifficulty(candidate);
  const hint = deps.generateHint(candidate);
  const eligibleLessonIds = lessonAllowlists ? pipelineService.computeEligibleLessons(candidate.tags, lessonAllowlists) : (old.eligibleLessonIds || []);
  const puzzle = deps.assemblePuzzle(candidate, { worldId: envelope.worldId, seq, score, difficulty, hint, generatorVersion: old.generatorVersion || 1, puzzleMode, eligibleLessonIds, sourceGenerationScope: old.sourceGenerationScope || { type: "world" } });
  const result = puzzleValidator.validatePuzzle(puzzle, { canFormFn: deps.canFormFn, layoutWordsFn: deps.layoutWordsFn, existingIds });
  if (result.valid) replacement = puzzle;
}

if (!replacement) throw new Error(`Could not generate a valid replacement for '${puzzleId}' (mode: ${puzzleMode}) after ${maxAttempts} attempts.`);

puzzles[index] = replacement;
await writeBankFile(file, { ...envelope, puzzles, generatedAt: new Date().toISOString() });

console.log(`Regenerated ${puzzleId} (${puzzleMode}): [${old.requiredWords.join(", ")}] (${old.difficulty}) -> [${replacement.requiredWords.join(", ")}] (${replacement.difficulty})`);

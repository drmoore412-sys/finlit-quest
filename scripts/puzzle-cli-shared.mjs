// Shared helpers for the puzzle pipeline CLI scripts. Deliberately thin: all
// generation/validation/filtering logic lives in src/*.js services, these are
// just argv parsing + file I/O + wiring shuffle/wheel/canForm deps together.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const gameEngine = require("../src/game-engine.js");
export const puzzleBankEngine = require("../src/puzzle-bank-engine.js");
export const puzzleGenerator = require("../src/puzzle-generator.js");
export const difficultyScorer = require("../src/difficulty-scorer.js");
export const hintGenerator = require("../src/hint-generator.js");
export const puzzleValidator = require("../src/puzzle-validator.js");
export const pipelineService = require("../src/puzzle-pipeline-service.js");

export function parseArgs(argv) {
  const args = {};
  argv.forEach((token) => {
    if (!token.startsWith("--")) return;
    const [key, value] = token.slice(2).split("=");
    args[key] = value === undefined ? true : value;
  });
  return args;
}

export function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const VOCAB_SOURCES = {
  crypto: { file: "content/crypto-terms.json", map: (t) => ({ word: t.word, definition: t.definition, termId: t.id }) },
  credit: { file: "content/credit-game-terms.json", map: (t) => ({ word: t.word, definition: t.definition, termId: null }) },
};

export async function loadVocabulary(worldId) {
  const source = VOCAB_SOURCES[worldId];
  if (!source) throw new Error(`Unknown world '${worldId}'. Known worlds: ${Object.keys(VOCAB_SOURCES).join(", ")}`);
  const raw = JSON.parse(await fs.readFile(path.join(root, source.file), "utf8"));
  return raw.map(source.map);
}

// Only worlds with a discrete lesson sequence (today: Credit Foundations) can
// use lesson-targeted generation. Crypto has no lesson structure yet — its
// whole vocabulary is one implicit allowlist (see docs/PUZZLE_GENERATOR_PIPELINE.md §5).
const LESSON_SOURCES = {
  credit: { runtimeFile: "curriculum/credit/approved/runtime/credit-foundations.json" },
};

// Returns {lessonId: allowedTags[]} in sequence order (object key insertion
// order == workbook sequence order, since deriveCumulativeAllowlists sorts by
// sequence before building the map).
export async function loadLessonAllowlists(worldId) {
  const source = LESSON_SOURCES[worldId];
  if (!source) throw new Error(`World '${worldId}' has no lesson structure yet — lesson-targeted generation isn't available for it. Known lesson-capable worlds: ${Object.keys(LESSON_SOURCES).join(", ")}`);
  const runtime = JSON.parse(await fs.readFile(path.join(root, source.runtimeFile), "utf8"));
  return pipelineService.deriveCumulativeAllowlists(runtime);
}

export function defaultUnplayableReportPath(worldId) {
  return path.join(root, "content/puzzle-banks", `${worldId}-unplayable-terms.json`);
}

// Merges newly-found unplayable-term entries into whatever report already
// exists on disk, deduping by (lessonId, term) so repeated CLI runs don't
// grow the file unboundedly.
export async function mergeUnplayableReport(file, newEntries) {
  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile(file, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  const key = (e) => `${e.worldId}::${e.lessonId}::${e.term}`;
  const merged = new Map(existing.map((e) => [key(e), e]));
  newEntries.forEach((e) => merged.set(key(e), e));
  const combined = [...merged.values()];
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(combined, null, 2)}\n`);
  return combined;
}

export function defaultBankPath(worldId) {
  return path.join(root, "content/puzzle-banks", `${worldId}-puzzle-bank.json`);
}

export async function readBankFile(file) {
  const raw = JSON.parse(await fs.readFile(file, "utf8"));
  return raw;
}

export async function writeBankFile(file, envelope) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(envelope, null, 2)}\n`);
}

export function pipelineDeps() {
  return {
    generateCandidate: puzzleGenerator.generateCandidate,
    scoreDifficulty: difficultyScorer.scoreDifficulty,
    generateHint: hintGenerator.generateHint,
    validatePuzzle: puzzleValidator.validatePuzzle,
    assemblePuzzle: puzzleValidator.assemblePuzzle,
    puzzleIdFor: puzzleBankEngine.puzzleId,
    shuffleFn: shuffle,
    wheelForFn: gameEngine.wheelFor,
    canFormFn: gameEngine.canForm,
    layoutWordsFn: gameEngine.layoutWords,
  };
}

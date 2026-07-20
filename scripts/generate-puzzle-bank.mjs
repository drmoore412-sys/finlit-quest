// Generates (or tops up) a world-scoped puzzle bank. Three modes:
//
// World-level (untargeted, draws from the whole Knowledge Base):
//   node scripts/generate-puzzle-bank.mjs --world=credit --size=50 [--in=file] [--out=file]
//
// Single lesson (targeted — restricts generation to that lesson's cumulative allowlist):
//   node scripts/generate-puzzle-bank.mjs --world=credit --lesson=CRF-001 --count=10 [--out=file]
//
// A range of lessons, from the first lesson through the given one:
//   node scripts/generate-puzzle-bank.mjs --world=credit --through=CRF-005 --count-per-lesson=10 [--out=file]
//
// Every lesson in the world:
//   node scripts/generate-puzzle-bank.mjs --world=credit --all-lessons --count-per-lesson=10 [--out=file]
//
// Lesson-targeted modes also write/merge a structured unplayable-term report
// (see docs/CRF_EARLY_LESSON_ELIGIBILITY_INVESTIGATION.md) to
// content/puzzle-banks/<world>-unplayable-terms.json whenever a lesson's
// vocabulary contains a word that exceeds the wheel budget on its own.

import { parseArgs, loadVocabulary, loadLessonAllowlists, defaultBankPath, defaultUnplayableReportPath, mergeUnplayableReport, readBankFile, writeBankFile, pipelineService, pipelineDeps } from "./puzzle-cli-shared.mjs";

function usage() {
  throw new Error([
    "Usage:",
    "  node scripts/generate-puzzle-bank.mjs --world=<id> --size=<n> [--in=file] [--out=file]",
    "  node scripts/generate-puzzle-bank.mjs --world=<id> --lesson=<lessonId> --count=<n> [--out=file]",
    "  node scripts/generate-puzzle-bank.mjs --world=<id> --through=<lessonId> --count-per-lesson=<n> [--out=file]",
    "  node scripts/generate-puzzle-bank.mjs --world=<id> --all-lessons --count-per-lesson=<n> [--out=file]",
  ].join("\n"));
}

function positiveInt(value, flag) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error(`${flag} must be a positive integer, got '${value}'.`);
  return n;
}

function reportLesson(lessonId, count, allowedTags, result) {
  const eligible = pipelineService.filterBankByTags(result.bank, allowedTags).length;
  const modes = result.added.reduce((acc, p) => { acc[p.puzzleMode] = (acc[p.puzzleMode] || 0) + 1; return acc; }, {});
  console.log(`  ${lessonId}: ${eligible}/${count} eligible puzzles in bank (${result.added.length} new: ${JSON.stringify(modes)}).`);
  if (result.warnings.length) {
    result.warnings.forEach((w) => {
      console.warn(`    WARNING: short by ${w.shortfall}. ${w.reason}`);
      console.warn(`    Limiting terms: ${w.limitingTerms.join(", ")}`);
      if (w.unplayableTerms.length) console.warn(`    Unplayable under current budget: ${w.unplayableTerms.join(", ")}`);
    });
  }
}

const args = parseArgs(process.argv.slice(2));
const worldId = args.world;
if (!worldId) usage();

const outPath = args.out || defaultBankPath(worldId);
const inPath = args.in || outPath;

let existingBank = [];
try {
  const envelope = await readBankFile(inPath);
  if (envelope.worldId && envelope.worldId !== worldId) throw new Error(`${inPath} is a '${envelope.worldId}' bank, not '${worldId}'.`);
  existingBank = envelope.puzzles || [];
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

const vocabulary = await loadVocabulary(worldId);

async function writeResult(bank) {
  const envelope = { worldId, generatedAt: new Date().toISOString(), count: bank.length, puzzles: bank };
  await writeBankFile(outPath, envelope);
  console.log(`Wrote ${outPath} (${bank.length} total puzzles).`);
}

if (args.lesson) {
  const count = positiveInt(args.count || usage(), "--count");
  const lessonAllowlists = await loadLessonAllowlists(worldId);
  const allowedTags = lessonAllowlists[args.lesson];
  if (!allowedTags) throw new Error(`Unknown lesson '${args.lesson}' for world '${worldId}'. Known lessons: ${Object.keys(lessonAllowlists).join(", ")}`);

  const result = pipelineService.generateLessonPuzzles(vocabulary, worldId, args.lesson, allowedTags, count, pipelineDeps(), { existingBank, lessonAllowlists });
  console.log(`Generated lesson '${args.lesson}' for '${worldId}':`);
  reportLesson(args.lesson, count, allowedTags, result);
  await writeResult(result.bank);
  if (result.longTermReport.length) {
    const reportPath = defaultUnplayableReportPath(worldId);
    await mergeUnplayableReport(reportPath, result.longTermReport);
    console.log(`Unplayable-term report updated: ${reportPath}`);
  }
} else if (args.through || args["all-lessons"]) {
  const countPerLesson = positiveInt(args["count-per-lesson"] || usage(), "--count-per-lesson");
  const lessonAllowlists = await loadLessonAllowlists(worldId);
  const allLessonIds = Object.keys(lessonAllowlists); // already in sequence order
  let lessonIds = allLessonIds;
  if (args.through) {
    const cutoff = allLessonIds.indexOf(args.through);
    if (cutoff < 0) throw new Error(`Unknown lesson '${args.through}' for world '${worldId}'. Known lessons: ${allLessonIds.join(", ")}`);
    lessonIds = allLessonIds.slice(0, cutoff + 1);
  }

  let bank = existingBank;
  const allLongTermReport = [];
  console.log(`Generating ${lessonIds.length} lesson(s) for '${worldId}' (${countPerLesson} eligible puzzles each):`);
  for (const lessonId of lessonIds) {
    const allowedTags = lessonAllowlists[lessonId];
    const result = pipelineService.generateLessonPuzzles(vocabulary, worldId, lessonId, allowedTags, countPerLesson, pipelineDeps(), { existingBank: bank, lessonAllowlists });
    bank = result.bank;
    allLongTermReport.push(...result.longTermReport);
    reportLesson(lessonId, countPerLesson, allowedTags, result);
  }
  await writeResult(bank);
  if (allLongTermReport.length) {
    const reportPath = defaultUnplayableReportPath(worldId);
    await mergeUnplayableReport(reportPath, allLongTermReport);
    console.log(`Unplayable-term report updated: ${reportPath}`);
  }
} else if (args.size) {
  const size = positiveInt(args.size, "--size");
  const { bank, rejected } = pipelineService.generatePuzzleBank(vocabulary, worldId, size, pipelineDeps(), { existingBank });
  console.log(`Generated bank for '${worldId}': ${bank.length}/${size} puzzles (${bank.length - existingBank.length} new).`);
  if (rejected.length) {
    const counts = {};
    rejected.forEach((r) => r.errors.forEach((e) => { counts[e] = (counts[e] || 0) + 1; }));
    console.log(`Rejected ${rejected.length} candidates during generation:`, counts);
  }
  if (bank.length < size) {
    console.warn(`Warning: only reached ${bank.length}/${size} puzzles before exhausting attempts. The '${worldId}' Knowledge Base may be too small for this bank size yet.`);
  }
  await writeResult(bank);
} else {
  usage();
}

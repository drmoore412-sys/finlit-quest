const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const engine = require(path.join(root, "src/game-engine.js"));
const slate = require(path.join(root, "src/v3-puzzle-slate.js"));
const definitions = require(path.join(root, "content/world-definitions-2027.json"));
const vocabulary = require(path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-thirteen-world-vocabulary.json"));
const puzzles = require(path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-thirteen-world-puzzle-proposals.json"));
const study = require(path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-thirteen-world-study-vocabulary.json"));

function normalize(value) { return String(value || "").toUpperCase().replace(/[^A-Z]/g, ""); }
function signature(words) { return [...new Set(words.map(normalize))].sort().join("|"); }
function canForm(word, wheel) {
  const available = {};
  for (const letter of wheel) available[letter] = (available[letter] || 0) + 1;
  for (const letter of word) {
    if (!available[letter]) return false;
    available[letter] -= 1;
  }
  return true;
}

test("the product registry contains the five existing and eight owner-approved new worlds in order", () => {
  assert.equal(definitions.worlds.length, 13);
  assert.deepEqual(definitions.worlds.map((world) => world.order), Array.from({ length: 13 }, (_, index) => index + 1));
  assert.deepEqual(definitions.worlds.map((world) => world.currentRuntimeStatus), Array(13).fill("playable"));
  assert.ok(definitions.worlds.every((world) => world.ownerStatus === "owner-approved-world"));
});

test("the existing 27-puzzle slate remains unchanged and proposed puzzles are not counted as implemented", () => {
  assert.equal(slate.SPECS.length, 27);
  assert.equal(puzzles.counts.activePuzzlesUnchanged, 27);
  assert.equal(puzzles.statusByWorld.slice(0, 5).reduce((sum, world) => sum + world.implementedPuzzles, 0), 27);
  assert.ok(puzzles.statusByWorld.slice(5).every((world) => world.implementedPuzzles === 0));
  assert.ok(puzzles.statusByWorld.slice(5).every((world) => world.currentRuntimeStatus === "vocabulary-only"));
});

test("all 34 new-world candidates obey the nine-letter and strict crossword rules", () => {
  assert.equal(puzzles.newWorldProposals.length, 34);
  for (const candidate of puzzles.newWorldProposals) {
    assert.equal(candidate.wheelKey.length, 9, candidate.candidateId);
    assert.deepEqual(candidate.nineLetterWheel, [...candidate.wheelKey], candidate.candidateId);
    assert.ok(candidate.answers.length >= 3 && candidate.answers.length <= 5, candidate.candidateId);
    assert.equal(candidate.validation.anchorAssociatedWithWorld, true, candidate.candidateId);
    for (const answer of candidate.answers) {
      assert.ok(answer.answer.length >= 4 && answer.answer.length <= 9, `${candidate.candidateId}/${answer.answer}`);
      assert.equal(canForm(answer.answer, candidate.wheelKey), true, `${candidate.candidateId}/${answer.answer}`);
    }
    assert.equal(engine.validateCrosswordLayout(candidate.requiredWords, candidate.layout).valid, true, candidate.candidateId);
    assert.equal(candidate.validation.status, "PASS", candidate.candidateId);
  }
});

test("the consolidated queue contains no duplicate active or proposed composition", () => {
  const active = slate.SPECS.map((spec) => signature([
    spec.anchor,
    ...spec.secondary.map((item) => typeof item === "string" ? item : item.word),
    ...(spec.ordinary || []),
  ]));
  const proposed = [...puzzles.priorProposalsRetained, ...puzzles.newWorldProposals].map((candidate) => signature(candidate.requiredWords));
  assert.equal(proposed.length, 57);
  assert.equal(new Set([...active, ...proposed]).size, active.length + proposed.length);
  assert.equal(puzzles.counts.priorProposalsReclassified, 4);
});

test("every compatible financial term is either selected or recorded unused", () => {
  const uniqueRecords = new Map();
  for (const world of vocabulary.worlds) for (const record of world.records) uniqueRecords.set(normalize(record.normalizedKey || record.canonicalTerm), record);
  const pool = [...uniqueRecords.values()].filter((record) =>
    record.crosswordEligible && record.letterCount >= 4 && record.letterCount <= 9 &&
    record.domainTypes.some((type) => ["financial-literacy-governed", "financial-literacy-candidate", "financial-technology-candidate"].includes(type))
  );
  for (const candidate of puzzles.newWorldProposals) {
    const expected = pool.filter((record) => canForm(normalize(record.normalizedKey), candidate.wheelKey)).map((record) => normalize(record.normalizedKey)).sort();
    const recorded = [
      ...candidate.answers.map((answer) => answer.answer),
      ...candidate.unusedWheelCompatibleFinancialTerms.map((term) => term.answer),
    ].sort();
    assert.deepEqual(recorded, expected, candidate.candidateId);
  }
});

test("Social Media is separated from Business while platforms remain context-only", () => {
  const social = vocabulary.worlds.find((world) => world.worldId === "social_media");
  assert.ok(social);
  assert.ok(social.records.some((record) => record.canonicalTerm === "Ad Revenue"));
  assert.ok(social.records.some((record) => record.canonicalTerm === "Royalties"));
  assert.ok(vocabulary.platformContext.some((record) => record.canonicalTerm === "TikTok"));
  assert.ok(vocabulary.platformContext.some((record) => record.canonicalTerm === "YouTube"));
  assert.ok(vocabulary.platformContext.every((record) => record.approvalStatus === "platform-context-only-not-financial-term"));
  assert.ok(puzzles.newWorldProposals.filter((candidate) => candidate.worldId === "social_media").every((candidate) => !candidate.answers.some((answer) => ["TIKTOK", "YOUTUBE", "INSTAGRAM"].includes(answer.answer))));
});

test("all long and short study vocabulary is preserved without shortening", () => {
  assert.equal(study.worlds.length, 13);
  for (const world of study.worlds) {
    assert.ok(world.longTerms10Plus.every((term) => normalize(term.term).length >= 10), world.worldId);
    assert.ok(world.shortTerms1To3.every((term) => normalize(term.term).length >= 1 && normalize(term.term).length <= 3), world.worldId);
  }
  assert.ok(study.socialMediaPlatformContext.length > 0);
});

test("research terms receive no invented permanent ID and governed clues remain exact", () => {
  const governed = new Map();
  for (const world of vocabulary.worlds) for (const record of world.records) for (const item of record.exactGovernedDefinitions || []) governed.set(item.id, item.definition);
  for (const candidate of puzzles.newWorldProposals) for (const answer of candidate.answers) {
    if (answer.permanentTermId) {
      assert.equal(answer.clue.status, "exact-owner-approved-definition", `${candidate.candidateId}/${answer.answer}`);
      assert.equal(answer.clue.text, governed.get(answer.permanentTermId), `${candidate.candidateId}/${answer.answer}`);
      assert.equal(answer.researchKey, null, `${candidate.candidateId}/${answer.answer}`);
    } else {
      assert.match(answer.researchKey, /^research:/, `${candidate.candidateId}/${answer.answer}`);
      assert.equal(answer.clue.status, "draft-research-clue-pending-owner-review", `${candidate.candidateId}/${answer.answer}`);
    }
  }
});

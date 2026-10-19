const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const engine = require(path.join(root, "src/game-engine.js"));
const slate = require(path.join(root, "src/v3-puzzle-slate.js"));
const output = require(path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-flexible-puzzle-proposals.json"));
const prior = require(path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-thirteen-world-puzzle-proposals.json"));
const support = require(path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-ordinary-support-review.json"));

function normalize(value) { return String(value || "").toUpperCase().replace(/[^A-Z]/g, ""); }
function signature(words) { return [...new Set(words.map(normalize))].sort().join("|"); }

test("updated-rule package preserves active and earlier proposal counts", () => {
  const priorRecords = [...prior.priorProposalsRetained, ...prior.newWorldProposals];
  assert.equal(slate.SPECS.length, 27);
  assert.equal(priorRecords.length, 57);
  assert.deepEqual(output.preservation, {
    activePuzzlesUnchanged: 27,
    priorProposalsUnchanged: 57,
    runtimeFilesModified: false,
  });
});

test("all new proposals use exact nine-letter anchors and 4-9 letter answers", () => {
  assert.equal(output.proposals.length, 90);
  for (const candidate of output.proposals) {
    assert.equal(candidate.wheelKey.length, 9, candidate.candidateId);
    assert.equal(candidate.anchor.answer, candidate.wheelKey, candidate.candidateId);
    assert.ok(candidate.requiredWords.length >= 3 && candidate.requiredWords.length <= 5, candidate.candidateId);
    for (const word of candidate.requiredWords) {
      assert.ok(word.length >= 4 && word.length <= 9, `${candidate.candidateId}/${word}`);
      assert.equal(engine.canForm(word, candidate.nineLetterWheel), true, `${candidate.candidateId}/${word}`);
    }
  }
});

test("every proposed layout passes the strict crossword validator", () => {
  for (const candidate of output.proposals) {
    const validation = engine.validateCrosswordLayout(candidate.requiredWords, candidate.layout);
    assert.deepEqual(validation, { valid: true, errors: [] }, candidate.candidateId);
    assert.equal(candidate.validation.status, "PASS", candidate.candidateId);
  }
});

test("new compositions are unique and do not duplicate active or prior content", () => {
  const active = slate.SPECS.map((spec) => signature([spec.anchor, ...spec.secondary.map((item) => typeof item === "string" ? item : item.word), ...(spec.ordinary || [])]));
  const earlier = [...prior.priorProposalsRetained, ...prior.newWorldProposals].map((candidate) => signature(candidate.requiredWords));
  const generated = output.proposals.map((candidate) => signature(candidate.requiredWords));
  assert.equal(new Set(generated).size, generated.length);
  const protectedSignatures = new Set([...active, ...earlier]);
  assert.deepEqual(generated.filter((item) => protectedSignatures.has(item)), []);
});

test("ordinary support is isolated, dictionary evidenced, and not a mastery identity", () => {
  const reviewedWords = new Set(support.words.map((item) => item.answer));
  assert.equal(reviewedWords.size, output.counts.selectedOrdinaryWords);
  for (const candidate of output.proposals) for (const answer of candidate.answers.filter((item) => item.role === "ordinary-support")) {
    assert.equal(reviewedWords.has(answer.answer), true, `${candidate.candidateId}/${answer.answer}`);
    assert.equal(answer.permanentTermId, null);
    assert.equal(answer.researchKey, null);
    assert.equal(answer.vocabularyStatus, "dictionary-verified-pending-owner-review");
    assert.equal(answer.clue.status, "ordinary-clue-copy-review-required");
    assert.ok(answer.dictionaryEvidence.exactEntry);
  }
});

test("financial counts follow the owner-defined progression as aims, not universal gates", () => {
  const aim = (level) => level === 1 ? [1, 1] : level <= 5 ? [2, 2] : level <= 10 ? [3, 3] : level <= 15 ? [3, 4] : [4, 5];
  for (const candidate of output.proposals) {
    assert.deepEqual(candidate.validation.financialAimForLevel, aim(candidate.proposedLevel), candidate.candidateId);
    assert.ok(candidate.validation.financialAnswerCount >= 1, candidate.candidateId);
    assert.equal(typeof candidate.validation.meetsFinancialAim, "boolean");
  }
});

test("all 13 worlds are reported and shortfalls are explicit", () => {
  assert.equal(output.statusByWorld.length, 13);
  assert.equal(output.statusByWorld.reduce((sum, row) => sum + row.newFlexibleProposals, 0), output.proposals.length);
  assert.equal(output.statusByWorld.every((row) => Number.isInteger(row.remainingTo15) && row.remainingTo15 >= 0), true);
  assert.equal(output.statusByWorld.find((row) => row.worldId === "ai_technology").remainingTo15, 12);
  assert.equal(output.statusByWorld.find((row) => row.worldId === "social_media").remainingTo15, 9);
});

test("proposal records and report exist without runtime output paths", () => {
  assert.equal(fs.existsSync(path.join(root, "docs/FINLIT_QUEST_2027_UPDATED_PUZZLE_CONSTRUCTION.md")), true);
  assert.equal(output.counts.failedAnchors, 0);
  assert.equal(output.proposals.some((candidate) => candidate.implementationEligible), false);
});

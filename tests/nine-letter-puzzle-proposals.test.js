const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const engine = require(path.join(root, "src/game-engine.js"));
const slate = require(path.join(root, "src/v3-puzzle-slate.js"));
const master = require(path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-vocabulary-master.json"));
const initial = require(path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-puzzle-candidates.json"));
const package2027 = require(path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-nine-letter-puzzle-proposals.json"));

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

const newCandidates = [
  ...package2027.ownerReviewEligibleProposals,
  ...package2027.deferredStructuralCandidates,
];

test("the package preserves the active slate and the three initial candidates", () => {
  assert.equal(slate.SPECS.length, 27);
  assert.equal(package2027.counts.activePuzzlesUnchanged, 27);
  assert.equal(package2027.initialValidatedProposals.length, 3);
  package2027.initialValidatedProposals.forEach((candidate, index) => {
    const { carriedForwardUnchanged, ...preserved } = candidate;
    assert.equal(carriedForwardUnchanged, true);
    assert.deepEqual(preserved, initial.recommendedCandidates[index]);
  });
});

test("all 45 generated records pass the numeric and strict layout gates", () => {
  assert.equal(newCandidates.length, 45);
  assert.equal(package2027.counts.strictValidationPass, 45);
  assert.equal(package2027.counts.strictValidationFail, 0);
  for (const candidate of newCandidates) {
    assert.equal(candidate.wheelKey.length, 9, candidate.candidateId);
    assert.deepEqual(candidate.nineLetterWheel, [...candidate.wheelKey], candidate.candidateId);
    assert.ok(candidate.answers.length >= 3 && candidate.answers.length <= 5, candidate.candidateId);
    for (const answer of candidate.answers) {
      assert.ok(answer.answer.length >= 4 && answer.answer.length <= 9, `${candidate.candidateId}/${answer.answer}`);
      assert.equal(canForm(answer.answer, candidate.wheelKey), true, `${candidate.candidateId}/${answer.answer}`);
    }
    assert.deepEqual(candidate.requiredWords, candidate.answers.map((answer) => answer.answer));
    assert.equal(engine.validateCrosswordLayout(candidate.requiredWords, candidate.layout).valid, true, candidate.candidateId);
    assert.equal(candidate.validation.structuralStatus, "PASS", candidate.candidateId);
  }
});

test("the owner-review queue applies the world-fit gate instead of forcing the target", () => {
  assert.equal(package2027.ownerReviewEligibleProposals.length, 24);
  assert.equal(package2027.deferredStructuralCandidates.length, 21);
  package2027.ownerReviewEligibleProposals.forEach((candidate) => {
    assert.equal(candidate.validation.proposalEligibility, "PASS", candidate.candidateId);
    assert.equal(candidate.validation.educationalWorldFit.status, "PASS", candidate.candidateId);
  });
  package2027.deferredStructuralCandidates.forEach((candidate) => {
    assert.equal(candidate.validation.proposalEligibility, "DEFER", candidate.candidateId);
    assert.equal(candidate.validation.educationalWorldFit.status, "DEFER", candidate.candidateId);
  });
  assert.deepEqual(
    Object.fromEntries(Object.entries(package2027.totalsByWorld).map(([worldId, totals]) => [worldId, totals.minimumShortfall])),
    { moneybasics: 5, credit: 4, crypto: 5, banking: 4, investing: 3 },
  );
});

test("all new compositions are unique and do not duplicate active or initial records", () => {
  const active = slate.SPECS.map((spec) => signature([
    spec.anchor,
    ...spec.secondary.map((item) => typeof item === "string" ? item : item.word),
    ...(spec.ordinary || []),
  ]));
  const preserved = package2027.initialValidatedProposals.map((candidate) => signature(candidate.requiredWords));
  const generated = newCandidates.map((candidate) => signature(candidate.requiredWords));
  const all = [...active, ...preserved, ...generated];
  assert.equal(new Set(all).size, all.length);
});

test("wheel-compatible financial vocabulary is exhaustively selected or recorded unused", () => {
  const pool = master.integratedVocabulary.filter((record) =>
    record.crosswordEligible && record.letterCount >= 4 && record.letterCount <= 9 &&
    record.domainTypes.some((type) => ["financial-literacy-governed", "financial-literacy-candidate", "financial-technology-candidate"].includes(type))
  );
  for (const candidate of newCandidates) {
    const expected = pool.filter((record) => canForm(normalize(record.normalizedKey), candidate.wheelKey)).map((record) => normalize(record.normalizedKey)).sort();
    const recorded = [
      ...candidate.answers.map((answer) => answer.answer),
      ...candidate.unusedWheelCompatibleFinancialTerms.map((term) => term.answer),
    ].sort();
    assert.deepEqual(recorded, expected, candidate.candidateId);
  }
});

test("permanent identities reuse exact definitions and research terms receive no invented ID", () => {
  const governedById = new Map(master.integratedVocabulary.flatMap((record) =>
    record.exactGovernedDefinitions.map((item) => [item.id, item.definition])
  ));
  for (const candidate of newCandidates) for (const answer of candidate.answers) {
    if (answer.permanentTermId) {
      assert.equal(answer.clue.status, "exact-owner-approved-definition", `${candidate.candidateId}/${answer.answer}`);
      assert.equal(answer.clue.text, governedById.get(answer.permanentTermId), `${candidate.candidateId}/${answer.answer}`);
      assert.equal(answer.researchKey, null, `${candidate.candidateId}/${answer.answer}`);
    } else {
      assert.match(answer.researchKey, /^research:/, `${candidate.candidateId}/${answer.answer}`);
      assert.equal(answer.clue.status, "draft-research-clue-pending-owner-review", `${candidate.candidateId}/${answer.answer}`);
    }
  }
});

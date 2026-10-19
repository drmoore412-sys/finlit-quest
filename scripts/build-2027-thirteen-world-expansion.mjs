#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engine = require(path.join(root, "src/game-engine.js"));
const pipeline = require(path.join(root, "src/crossword-candidate-pipeline.js"));
const slate = require(path.join(root, "src/v3-puzzle-slate.js"));

const DATE = "2026-10-18";
const DIR = path.join(root, "staging/research/expansion", DATE);
const MASTER_PATH = path.join(DIR, "finlit-quest-2027-vocabulary-master.json");
const FIVE_WORLD_PATH = path.join(DIR, "finlit-quest-2027-nine-letter-puzzle-proposals.json");
const SOURCE_PATH = path.join(DIR, "source-documents/FinLit_Quest_2027_Remaining_Worlds_Backlog.md");
const WORLD_PATH = path.join(root, "content/world-definitions-2027.json");
const VOCAB_PATH = path.join(DIR, "finlit-quest-2027-thirteen-world-vocabulary.json");
const PUZZLE_PATH = path.join(DIR, "finlit-quest-2027-thirteen-world-puzzle-proposals.json");
const STUDY_PATH = path.join(DIR, "finlit-quest-2027-thirteen-world-study-vocabulary.json");
const REPORT_PATH = path.join(root, "docs/FINLIT_QUEST_2027_THIRTEEN_WORLD_EXPANSION.md");

const WORLDS = Object.freeze([
  { id: "moneybasics", name: "Money Basics", order: 1, existing: true },
  { id: "credit", name: "Credit Foundations", order: 2, existing: true },
  { id: "crypto", name: "Crypto Foundations", order: 3, existing: true },
  { id: "banking", name: "Banking Basics", order: 4, existing: true },
  { id: "investing", name: "Investing Basics", order: 5, existing: true },
  { id: "coins", name: "Coins & Currency", order: 6, existing: false },
  { id: "ai_technology", name: "AI & Technology", order: 7, existing: false },
  { id: "real_estate", name: "Real Estate", order: 8, existing: false },
  { id: "taxes", name: "Taxes", order: 9, existing: false },
  { id: "insurance", name: "Insurance & Protection", order: 10, existing: false },
  { id: "business", name: "Business & Entrepreneurship", order: 11, existing: false },
  { id: "social_media", name: "Social Media & Digital Income", order: 12, existing: false },
  { id: "retirement", name: "Retirement & Wealth Planning", order: 13, existing: false },
]);

// One composition per anchor. These are the complete nine-letter anchors in the
// integrated vocabulary that can support at least two additional meaningful
// financial answers after primary-world placement and duplicate removal.
const NEW_WORLD_ANCHORS = Object.freeze({
  coins: ["Coin Grade", "Melt Value", "Prooflike", "Spot Price"],
  ai_technology: ["Auto Trade"],
  real_estate: ["Apartment", "Refinance"],
  taxes: ["Income Tax", "Tax Credit", "Tax Filing"],
  insurance: ["Cash Value", "Exclusion", "Liability", "Rental Car", "Root Canal", "Trip Delay"],
  business: ["Break Even", "Factoring", "Franchise", "Freelance", "Inventory", "Marketing", "Net Income", "Retention", "Trademark", "Wholesale"],
  social_media: ["Royalties", "Ad Revenue"],
  retirement: ["Coast FIRE", "Community", "Fiduciary", "Lifestyle", "Longevity", "SIMPLE IRA"],
});

// These candidates passed the previous five-world gate but their anchors now
// have a newly approved primary world. The old report stays unchanged; the new
// consolidated package moves the composition instead of duplicating it.
const RECLASSIFIED_ANCHORS = Object.freeze({
  BREAKEVEN: "business",
  CASHVALUE: "insurance",
  APARTMENT: "real_estate",
  COMMUNITY: "retirement",
});

const SOCIAL_FINANCIAL_TERMS = new Set([
  "White Label", "UGC", "NIL", "Franchise", "Domain Name", "Websites", "Amazon Affiliate", "Ecommerce",
  "Private Label", "Dropshipping", "Affiliate", "Reseller", "Creator", "Influencer", "Licensing", "Royalties",
  "Digital Product", "Monetize", "Sponsor", "Ad Revenue", "Marketplace", "Seller", "Listing", "Fulfillment",
  "FBA", "FBM", "Print on Demand", "Subscription", "SaaS", "Coaching", "Consulting", "Freelancer", "Agency",
  "Template", "Ebook", "Course", "Membership", "Automation", "Amazon Associates", "Affiliate Marketing",
  "Creator Economy", "Sponsored Content", "Brand Partnerships", "User-Generated Content", "Name Image and Likeness",
]);

const EXCLUDED_ANSWERS = new Set(["CLUE", "DENTAL", "DIME", "LOGIN", "NEEDS", "TESTNET", "CHECKOUT", "PATENT"]);

const NEW_DRAFT_CLUES = Object.freeze({
  ADREVENUE: "Income earned when advertising is displayed with digital content or on an online property.",
  AGENT: "A person or organization authorized to act for another party in a transaction.",
  AUTOTRADE: "An order or system that buys or sells an asset automatically under preset rules.",
  CLEAR: "To complete the processing and reconciliation steps required before a financial transaction settles.",
  COASTFIRE: "A retirement strategy in which existing investments may grow toward a future goal without additional contributions.",
  COLA: "A cost-of-living adjustment intended to help a payment keep pace with inflation.",
  ECOA: "The Equal Credit Opportunity Act, which prohibits certain discrimination in credit transactions.",
  EXCLUSION: "A condition, event, or loss that an insurance policy does not cover.",
  FACTORING: "Selling accounts receivable to another company for immediate cash at a discount.",
  FCRA: "The Fair Credit Reporting Act, which governs consumer-reporting information and related rights.",
  FIDUCIARY: "A person or organization required to act in another party's best financial interest.",
  FIRE: "A financial strategy focused on reaching financial independence and the option to retire early.",
  FORK: "A change to blockchain rules that can create a new version of a network or ledger history.",
  FRACTION: "A portion of a whole asset, payment, or ownership interest.",
  FRANCHISE: "A business arrangement allowing an operator to use another company's brand and operating system for agreed fees.",
  FREELANCE: "Independent paid work performed for clients rather than as a permanent employee.",
  FRAUD: "Intentional deception for financial or personal gain.",
  GIFT: "Money or property transferred without receiving equal value in return.",
  HEIR: "A person legally entitled to inherit property under applicable law.",
  LAPSE: "The ending of coverage or a financial right because required conditions or payments were not maintained.",
  LIEN: "A legal claim against property that can secure repayment of a debt.",
  LONG: "An investment position that generally benefits when the asset's price rises.",
  LONGEVITY: "Length of life, which affects how long retirement savings and income may need to last.",
  MARKETING: "Activities used to promote and sell a product or service.",
  MARGIN: "Borrowed brokerage funds used to purchase investments, or the difference between revenue and cost.",
  MARKET: "A system or venue where buyers and sellers exchange assets, goods, or services.",
  MINTAGE: "The number or process of coins produced in a particular issue.",
  ORDER: "An instruction to buy, sell, transfer, or otherwise process a financial transaction.",
  REIT: "A company that owns, operates, or finances income-producing real estate under qualifying tax rules.",
  REPO: "A repurchase agreement involving the sale and later repurchase of securities.",
  RENTAL: "Property or an item provided for temporary use in exchange for payment.",
  REVENUE: "Money a business earns from sales or other operating activity before expenses are subtracted.",
  RETAIL: "The sale of goods or services directly to consumers.",
  ROOTCANAL: "A dental treatment whose cost may be subject to insurance coverage, deductibles, and annual limits.",
  ROYALTIES: "Payments made for the continuing use of property, creative work, or mineral rights.",
  SHARE: "A unit representing ownership in a company or investment.",
  TAXFILING: "The process of preparing and submitting a tax return to the appropriate tax authority.",
  TILA: "The Truth in Lending Act, which requires specified disclosures about consumer credit costs and terms.",
  TRADEMARK: "A protected word, symbol, or design that identifies the source of goods or services.",
  TRIPDELAY: "A travel disruption that may qualify for reimbursement under eligible insurance coverage.",
  YIELD: "Income produced by an investment, usually expressed relative to its price or value.",
});

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function normalize(value) { return String(value || "").toUpperCase().replace(/[^A-Z]/g, ""); }
function signature(words) { return [...new Set(words.map(normalize))].sort().join("|"); }
function recordWorlds(record) { return [...new Set((record.worldAssociations || []).map((item) => item.worldId))]; }
function hasWorld(record, worldId) { return recordWorlds(record).includes(worldId); }
function canForm(word, wheel) {
  const available = {};
  for (const letter of wheel) available[letter] = (available[letter] || 0) + 1;
  for (const letter of word) {
    if (!available[letter]) return false;
    available[letter] -= 1;
  }
  return true;
}
function combinations(items, size) {
  const output = [];
  function visit(start, chosen) {
    if (chosen.length === size) { output.push(chosen); return; }
    for (let index = start; index <= items.length - (size - chosen.length); index += 1) visit(index + 1, [...chosen, items[index]]);
  }
  visit(0, []);
  return output;
}
function extractList(source, prefix) {
  const line = source.split("\n").find((item) => item.startsWith(prefix));
  if (!line) throw new Error(`Missing source list: ${prefix}`);
  return line.slice(prefix.length).split(",").map((term) => term.trim().replace(/\.$/, "")).filter(Boolean);
}
function classifyLength(key) {
  if (key.length >= 4 && key.length <= 9) return "crossword-potential-4-9";
  if (key.length >= 10) return "study-long-10-plus";
  return "study-short-1-3";
}

const master = readJson(MASTER_PATH);
const fiveWorld = readJson(FIVE_WORLD_PATH);
const source = fs.readFileSync(SOURCE_PATH, "utf8");
const integrated = master.integratedVocabulary.map((record) => JSON.parse(JSON.stringify(record)));
const byKey = new Map(integrated.map((record) => [normalize(record.normalizedKey || record.canonicalTerm), record]));

const digitalTerms = extractList(source, "Digital business user requests:");
const platforms = extractList(source, "Platforms:");
for (const term of digitalTerms) {
  const key = normalize(term);
  let record = byKey.get(key);
  if (!record) {
    record = {
      canonicalTerm: term,
      normalizedKey: key,
      displayVariants: [term],
      permanentIdentities: [],
      exactGovernedDefinitions: [],
      worldAssociations: [],
      sourceDocuments: [path.basename(SOURCE_PATH)],
      domainTypes: SOCIAL_FINANCIAL_TERMS.has(term) ? ["financial-literacy-candidate"] : ["digital-income-educational-context"],
      approvalStatus: "owner-supplied-research-term-not-definition-approved",
      vocabularyClass: classifyLength(key),
      crosswordEligible: SOCIAL_FINANCIAL_TERMS.has(term) && key.length >= 4 && key.length <= 9,
      letterCount: key.length,
    };
    integrated.push(record);
    byKey.set(key, record);
  }
  if (!record.worldAssociations.some((item) => item.worldId === "social_media")) record.worldAssociations.push({
    worldId: "social_media",
    worldName: "Social Media & Digital Income",
    sourceType: "owner-approved-world-source-association",
    sourceFile: path.basename(SOURCE_PATH),
    section: "Digital business user requests",
  });
}

const platformRecords = platforms.map((term) => ({
  canonicalTerm: term,
  normalizedKey: normalize(term),
  worldId: "social_media",
  vocabularyRole: "platform-context-study-only",
  approvalStatus: "platform-context-only-not-financial-term",
  sourceFile: path.basename(SOURCE_PATH),
}));

const worldDefinitions = {
  schemaVersion: 1,
  decisionDate: DATE,
  ownerDecision: "Eight additional worlds approved as separate future playable worlds.",
  runtimeIntegrationStatus: "not-integrated-pending-approved-puzzle-banks-and-term-governance",
  worlds: WORLDS.map((world) => ({
    id: world.id,
    name: world.name,
    order: world.order,
    ownerStatus: "owner-approved-world",
    intendedProductStatus: "playable-world",
    currentRuntimeStatus: world.existing ? "playable" : "vocabulary-only-awaiting-approved-puzzles",
    implementedPuzzleCount: world.existing ? slate.SPECS.filter((spec) => spec.worldId === world.id).length : 0,
    minimumPuzzleTarget: 15,
    preferredPuzzleTarget: 20,
  })),
};

const worldVocabulary = WORLDS.map((world) => {
  const records = integrated.filter((record) => hasWorld(record, world.id));
  const financial = records.filter((record) => record.domainTypes.some((type) => ["financial-literacy-governed", "financial-literacy-candidate", "financial-technology-candidate"].includes(type)));
  return {
    worldId: world.id,
    worldName: world.name,
    records,
    counts: {
      totalAssociatedRecords: records.length,
      financialTerms: financial.length,
      crosswordPotential4To9: financial.filter((record) => record.crosswordEligible && record.letterCount >= 4 && record.letterCount <= 9).length,
      longStudy10Plus: records.filter((record) => record.letterCount >= 10).length,
      shortStudy1To3: records.filter((record) => record.letterCount > 0 && record.letterCount <= 3).length,
    },
  };
});

const vocabularyPackage = {
  schemaVersion: 1,
  generatedDate: DATE,
  status: "thirteen-world-vocabulary-organized-research-and-governance-review-required",
  worlds: worldVocabulary,
  platformContext: platformRecords,
};

const priorCandidates = [
  ...fiveWorld.initialValidatedProposals,
  ...fiveWorld.ownerReviewEligibleProposals,
  ...fiveWorld.deferredStructuralCandidates,
];
const priorClues = new Map();
for (const candidate of priorCandidates) for (const answer of candidate.answers || []) {
  const word = answer.answer || answer.word;
  const clue = answer.clue || (answer.definition ? { text: answer.definition, status: "exact-owner-approved-definition", permanentTermId: answer.termId || null } : null);
  if (word && clue) priorClues.set(normalize(word), clue);
}
function clueFor(record) {
  const governed = record.exactGovernedDefinitions?.[0];
  if (governed) return { text: governed.definition, status: "exact-owner-approved-definition", permanentTermId: governed.id };
  const prior = priorClues.get(normalize(record.normalizedKey || record.canonicalTerm));
  if (prior) return { ...prior, permanentTermId: null, status: "draft-research-clue-pending-owner-review" };
  const draft = NEW_DRAFT_CLUES[normalize(record.normalizedKey || record.canonicalTerm)];
  if (!draft) throw new Error(`Missing research clue for ${record.canonicalTerm}`);
  return { text: draft, status: "draft-research-clue-pending-owner-review", permanentTermId: null };
}

const financialPool = integrated.filter((record) =>
  record.crosswordEligible && record.letterCount >= 4 && record.letterCount <= 9 &&
  record.domainTypes.some((type) => ["financial-literacy-governed", "financial-literacy-candidate", "financial-technology-candidate"].includes(type))
);
const financialByKey = new Map(financialPool.map((record) => [normalize(record.normalizedKey || record.canonicalTerm), record]));

const priorEligible = [...fiveWorld.initialValidatedProposals, ...fiveWorld.ownerReviewEligibleProposals];
const retainedPrior = priorEligible.filter((candidate) => !RECLASSIFIED_ANCHORS[normalize(candidate.anchorWord || candidate.anchor?.answer || candidate.anchor?.displayTerm)]);
const activeSignatures = new Set(slate.SPECS.map((spec) => signature([spec.anchor, ...spec.secondary.map((item) => typeof item === "string" ? item : item.word), ...(spec.ordinary || [])])));
const retainedSignatures = new Set(retainedPrior.map((candidate) => signature(candidate.requiredWords)));
const generatedSignatures = new Set();
const useCount = new Map();
const newCandidates = [];

for (const [worldId, anchorNames] of Object.entries(NEW_WORLD_ANCHORS)) for (const anchorName of anchorNames) {
  const anchorKey = normalize(anchorName);
  const anchor = financialByKey.get(anchorKey);
  if (!anchor || anchor.letterCount !== 9 || !hasWorld(anchor, worldId)) throw new Error(`Missing nine-letter ${worldId} anchor: ${anchorName}`);
  const compatible = financialPool.filter((record) => normalize(record.normalizedKey || record.canonicalTerm) !== anchorKey && canForm(normalize(record.normalizedKey || record.canonicalTerm), anchorKey));
  const usable = compatible.filter((record) => !EXCLUDED_ANSWERS.has(normalize(record.normalizedKey || record.canonicalTerm)));
  const options = [];
  for (const secondaryCount of [4, 3, 2]) for (const group of combinations(usable, secondaryCount)) {
    const selected = [anchor, ...group];
    const words = selected.map((record) => normalize(record.normalizedKey || record.canonicalTerm));
    const composition = signature(words);
    if (activeSignatures.has(composition) || retainedSignatures.has(composition) || generatedSignatures.has(composition)) continue;
    const solved = engine.solveCrossword(words, { maxNodes: 50000, maxSolutions: 100 });
    if (!solved.ok || !engine.validateCrosswordLayout(words, solved.placements).valid) continue;
    const own = selected.filter((record) => hasWorld(record, worldId)).length;
    const governed = selected.filter((record) => record.permanentIdentities.length).length;
    const repeats = selected.reduce((total, record) => total + (useCount.get(normalize(record.normalizedKey || record.canonicalTerm)) || 0), 0);
    const metrics = pipeline.layoutMetrics(solved.placements);
    const score = selected.length * 15 + own * 24 + governed * 12 - repeats * 6 + metrics.crossings * 3;
    options.push({ selected, composition, score, own, governed, repeats, compatible });
  }
  options.sort((left, right) => right.score - left.score || right.selected.length - left.selected.length || left.composition.localeCompare(right.composition));
  const best = options[0];
  if (!best) throw new Error(`No unique strict crossword for ${worldId}/${anchorName}`);
  const words = best.selected.map((record) => normalize(record.normalizedKey || record.canonicalTerm));
  const layouts = pipeline.enumerateLayouts(words, { solveCrosswordFn: engine.solveCrossword, validateCrosswordLayoutFn: engine.validateCrosswordLayout }, { maxLayouts: 3, attemptLimit: 12, solverOptions: { maxNodes: 100000, maxSolutions: 250 } });
  if (!layouts.length) throw new Error(`Selected crossword lost layout for ${worldId}/${anchorName}`);
  generatedSignatures.add(best.composition);
  best.selected.forEach((record) => {
    const key = normalize(record.normalizedKey || record.canonicalTerm);
    useCount.set(key, (useCount.get(key) || 0) + 1);
  });
  const selectedKeys = new Set(words);
  const answers = best.selected.map((record, index) => {
    const permanent = record.permanentIdentities[0] || null;
    return {
      displayTerm: record.canonicalTerm,
      answer: normalize(record.normalizedKey || record.canonicalTerm),
      role: index === 0 ? "financial-anchor" : "financial-secondary",
      permanentTermId: permanent?.id || null,
      researchKey: permanent ? null : `research:${normalize(record.normalizedKey || record.canonicalTerm).toLowerCase()}`,
      owningWorld: permanent?.originWorld || null,
      worldAssociations: recordWorlds(record),
      vocabularyStatus: record.approvalStatus,
      clue: clueFor(record),
    };
  });
  const layout = layouts[0];
  const priorMatch = priorCandidates.find((candidate) => normalize(candidate.anchorWord || candidate.anchor?.answer || candidate.anchor?.displayTerm) === anchorKey);
  newCandidates.push({
    schemaVersion: 1,
    candidateId: `FQ-2027-${worldId.toUpperCase()}-${String(newCandidates.filter((item) => item.worldId === worldId).length + 1).padStart(2, "0")}`,
    worldId,
    worldName: WORLDS.find((world) => world.id === worldId).name,
    approvalStatus: "research-candidate-pending-owner-review-not-implemented",
    implementationEligible: false,
    reclassifiedFromCandidateId: priorMatch?.candidateId || null,
    nineLetterWheel: [...anchorKey],
    wheelKey: anchorKey,
    anchor: answers[0],
    answers,
    requiredWords: answers.map((answer) => answer.answer),
    unusedWheelCompatibleFinancialTerms: best.compatible.filter((record) => !selectedKeys.has(normalize(record.normalizedKey || record.canonicalTerm))).map((record) => ({
      displayTerm: record.canonicalTerm,
      answer: normalize(record.normalizedKey || record.canonicalTerm),
      permanentTermIds: record.permanentIdentities.map((item) => item.id),
      worldAssociations: recordWorlds(record),
      vocabularyStatus: record.approvalStatus,
      disposition: "wheel-compatible-not-in-selected-layout",
    })),
    layout: layout.placements,
    layoutPreview: pipeline.renderGrid({ layout: layout.placements }),
    layoutMetrics: layout.metrics,
    alternativeLayoutCount: layouts.length,
    validation: {
      status: "PASS",
      exactNineWheelLetters: anchorKey.length === 9,
      answerLength4To9: answers.every((answer) => answer.answer.length >= 4 && answer.answer.length <= 9),
      exactRepeatedLetterCounts: answers.every((answer) => canForm(answer.answer, anchorKey)),
      meaningfulFinancialTerms: answers.length,
      strictCrosswordEngine: engine.validateCrosswordLayout(answers.map((answer) => answer.answer), layout.placements),
      uniqueComposition: true,
      anchorAssociatedWithWorld: true,
      governanceGate: answers.every((answer) => answer.permanentTermId) ? "all-terms-have-permanent-identities" : "working-vocabulary-requires-term-and-clue-approval-before-implementation",
    },
  });
}

const consolidated = [...retainedPrior, ...newCandidates];
if (new Set(consolidated.map((candidate) => signature(candidate.requiredWords))).size !== consolidated.length) throw new Error("Duplicate composition in consolidated thirteen-world queue");

const proposalsByWorld = Object.fromEntries(WORLDS.map((world) => [world.id, consolidated.filter((candidate) => candidate.worldId === world.id).length]));
const statusRows = WORLDS.map((world) => {
  const implemented = world.existing ? slate.SPECS.filter((spec) => spec.worldId === world.id).length : 0;
  const proposals = proposalsByWorld[world.id];
  return {
    worldId: world.id,
    worldName: world.name,
    currentRuntimeStatus: world.existing ? "playable" : "vocabulary-only",
    implementedPuzzles: implemented,
    ownerReviewProposals: proposals,
    projectedTotalIfApproved: implemented + proposals,
    remainingTo15: Math.max(0, 15 - implemented - proposals),
    remainingTo20: Math.max(0, 20 - implemented - proposals),
    longStudyTerms: worldVocabulary.find((item) => item.worldId === world.id).counts.longStudy10Plus,
  };
});

const puzzlePackage = {
  schemaVersion: 1,
  generatedDate: DATE,
  status: "thirteen-world-consolidated-owner-review-queue-not-implemented",
  counts: {
    worlds: WORLDS.length,
    currentlyPlayableWorlds: WORLDS.filter((world) => world.existing).length,
    vocabularyOnlyWorlds: WORLDS.filter((world) => !world.existing).length,
    activePuzzlesUnchanged: slate.SPECS.length,
    priorEligibleProposals: priorEligible.length,
    priorProposalsReclassified: Object.keys(RECLASSIFIED_ANCHORS).length,
    newWorldCandidateRecords: newCandidates.length,
    consolidatedUniqueProposals: consolidated.length,
    projectedPuzzlesIfAllApproved: slate.SPECS.length + consolidated.length,
  },
  statusByWorld: statusRows,
  priorProposalsRetained: retainedPrior,
  newWorldProposals: newCandidates,
};

const studyPackage = {
  schemaVersion: 1,
  generatedDate: DATE,
  status: "reserved-for-future-study-features-not-implemented",
  rule: "Preserve all associated terms with 10 or more letters and all terms shorter than four letters; platform names remain context-only.",
  worlds: WORLDS.map((world) => {
    const vocabulary = worldVocabulary.find((item) => item.worldId === world.id).records;
    return {
      worldId: world.id,
      worldName: world.name,
      longTerms10Plus: vocabulary.filter((record) => record.letterCount >= 10).map((record) => ({ term: record.canonicalTerm, normalizedKey: record.normalizedKey, approvalStatus: record.approvalStatus, permanentTermIds: record.permanentIdentities.map((item) => item.id) })),
      shortTerms1To3: vocabulary.filter((record) => record.letterCount > 0 && record.letterCount <= 3).map((record) => ({ term: record.canonicalTerm, normalizedKey: record.normalizedKey, approvalStatus: record.approvalStatus, permanentTermIds: record.permanentIdentities.map((item) => item.id) })),
    };
  }),
  socialMediaPlatformContext: platformRecords,
};

fs.writeFileSync(WORLD_PATH, `${JSON.stringify(worldDefinitions, null, 2)}\n`);
fs.writeFileSync(VOCAB_PATH, `${JSON.stringify(vocabularyPackage, null, 2)}\n`);
fs.writeFileSync(PUZZLE_PATH, `${JSON.stringify(puzzlePackage, null, 2)}\n`);
fs.writeFileSync(STUDY_PATH, `${JSON.stringify(studyPackage, null, 2)}\n`);

const report = [];
report.push("# FinLit Quest 2027 — Thirteen-World Expansion", "", `**Date:** ${DATE}`, "", "**Status:** Eight new world identities recorded; vocabulary and puzzle proposals prepared; runtime implementation pending curriculum approval", "", "## Executive result", "", `FinLit Quest now has a governed 13-world product definition: five currently playable worlds and eight owner-approved future playable worlds. The eight new worlds are currently **vocabulary-only** because proposed terms and puzzles are not implemented or definition-approved. The existing ${slate.SPECS.length} puzzles remain unchanged.`, "", `The consolidated queue contains ${consolidated.length} unique puzzle proposals. If every proposal were later approved and implemented, the game would contain ${slate.SPECS.length + consolidated.length} puzzles. No world yet reaches the 15-puzzle minimum under the quality rules, so exact shortfalls are preserved rather than filled with artificial terminology.`, "", "## All 13 worlds", "", "| # | World | Current status | Implemented | Proposed | Projected | To 15 | To 20 | Long study terms |", "|---:|---|---|---:|---:|---:|---:|---:|---:|");
statusRows.forEach((row, index) => report.push(`| ${index + 1} | ${row.worldName} | ${row.currentRuntimeStatus} | ${row.implementedPuzzles} | ${row.ownerReviewProposals} | ${row.projectedTotalIfApproved} | ${row.remainingTo15} | ${row.remainingTo20} | ${row.longStudyTerms} |`));
report.push("", "## New-world vocabulary", "", "| World | Associated records | Financial terms | Crossword 4–9 | Long 10+ | Short 1–3 |", "|---|---:|---:|---:|---:|---:|");
worldVocabulary.filter((item) => !WORLDS.find((world) => world.id === item.worldId).existing).forEach((item) => report.push(`| ${item.worldName} | ${item.counts.totalAssociatedRecords} | ${item.counts.financialTerms} | ${item.counts.crosswordPotential4To9} | ${item.counts.longStudy10Plus} | ${item.counts.shortStudy1To3} |`));
report.push("", "Social Media & Digital Income was separated mechanically from the source document's Digital business and Platforms lists. Platform names are preserved as study context, not misclassified as financial terms or crossword rewards.", "", "## New-world puzzle proposals", "");
for (const world of WORLDS.filter((item) => !item.existing)) {
  const candidates = newCandidates.filter((candidate) => candidate.worldId === world.id);
  report.push(`### ${world.name}`, "", `${candidates.length} validated proposal(s); ${Math.max(0, 15 - candidates.length)} more needed to reach 15 before implementation.`, "");
  for (const candidate of candidates) {
    report.push(`#### ${candidate.candidateId} — ${candidate.anchor.displayTerm}`, "", `- Wheel: \`${candidate.wheelKey}\``, `- Required financial answers: ${candidate.answers.map((answer) => `**${answer.displayTerm}**`).join(", ")}`, `- Strict layout: **${candidate.validation.status}**; ${candidate.layoutMetrics.crossings} crossings; ${candidate.alternativeLayoutCount} retained layout(s)`, `- Prior research relationship: ${candidate.reclassifiedFromCandidateId ? `reclassified from ${candidate.reclassifiedFromCandidateId}` : "new composition for the thirteen-world queue"}`, `- Governance: ${candidate.validation.governanceGate}`, "", "Clues:", "");
    candidate.answers.forEach((answer) => report.push(`- **${answer.displayTerm}:** ${answer.clue.text} _(${answer.clue.status})_`));
    report.push("", "```text", candidate.layoutPreview, "```", "", "Unused wheel-compatible financial terms:", "");
    if (!candidate.unusedWheelCompatibleFinancialTerms.length) report.push("- None.");
    else candidate.unusedWheelCompatibleFinancialTerms.forEach((term) => report.push(`- ${term.displayTerm} (${term.vocabularyStatus})`));
    report.push("");
  }
}
report.push("## Flashcards and study preservation", "", `All ${statusRows.reduce((sum, row) => sum + row.longStudyTerms, 0)} world associations for 10+ letter terms are retained in the study package. Counts are associations, not globally unique terms; one cross-world term may appear in more than one world. Short terms are also preserved. No term was shortened to fit a crossword, and no flashcard feature was implemented.`, "", "## Implementation blockers", "", "1. The eight world identities are owner-approved, but most terms still lack owner-approved definitions, permanent IDs, clues, and mastery ownership.", "2. No new world has an approved runtime puzzle bank; proposed puzzles must not be counted as implemented.", "3. Each world remains below the 15-puzzle minimum under the exact-nine-letter and financial-quality rules.", "4. AI & Technology has only one qualifying nine-letter composition in the current financial vocabulary; platform and tool names cannot substitute for three financial terms.", "5. Social-media platform names are contextual brands, not financial concepts. The Digital Income curriculum needs term-level definitions and more compatible nine-letter anchors.", "6. Runtime cards, saves, navigation, and iOS bundling should be extended only after a new world's term registry and first puzzle bank are approved together.", "", "## Files and restrictions", "", "The world definitions, vocabulary index, consolidated proposal package, study package, and this report are data/research artifacts only. Existing gameplay, navigation, active puzzles, rewards, saves, and native bundles were not changed.", "");
fs.writeFileSync(REPORT_PATH, `${report.join("\n")}\n`);

console.log(JSON.stringify({
  worldDefinitions: path.relative(root, WORLD_PATH),
  vocabulary: path.relative(root, VOCAB_PATH),
  puzzles: path.relative(root, PUZZLE_PATH),
  study: path.relative(root, STUDY_PATH),
  report: path.relative(root, REPORT_PATH),
  counts: puzzlePackage.counts,
  statusByWorld: statusRows,
}, null, 2));

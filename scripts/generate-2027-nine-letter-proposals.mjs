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

const MASTER_PATH = path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-vocabulary-master.json");
const INITIAL_PATH = path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-puzzle-candidates.json");
const PRIOR_PROPOSAL_PATH = path.join(root, "staging/research/expansion/2026-10-17/finlit-quest-27-quiz-expansion-proposal.json");
const OUTPUT_PATH = path.join(root, "staging/research/expansion/2026-10-18/finlit-quest-2027-nine-letter-puzzle-proposals.json");
const REPORT_PATH = path.join(root, "docs/FINLIT_QUEST_2027_NINE_LETTER_PUZZLE_PROPOSALS.md");

const WORLD_NAMES = Object.freeze({
  moneybasics: "Money Basics",
  credit: "Credit Foundations",
  crypto: "Crypto Foundations",
  banking: "Banking Basics",
  investing: "Investing Basics",
});

// Exactly nine additional candidates per world. Together with the 27 active
// puzzles and three previously validated proposals, this reaches 15 per world.
// These are research selections, not runtime content or approval decisions.
const PLANS = Object.freeze({
  moneybasics: ["Break Even", "Cash Value", "Custodian", "INFLATION", "Net Income", "Lifestyle", "Liability", "Income Tax", "Wholesale"],
  credit: ["Tradeline", "Credit Mix", "Unsecured", "Charge Off", "APPLICANT", "Refinance", "Rental Car", "Tax Credit", "Direct Pay"],
  crypto: ["Hot Wallet", "Coin Grade", "Community", "Melt Value", "Prooflike", "Spot Price", "Tokenized", "Deception", "Marketing"],
  banking: ["Debit Card", "Bank Fraud", "Overdraft", "Jumbo Loan", "SIMPLE IRA", "Brokerage", "Factoring", "Retention", "Inventory"],
  investing: ["Apartment", "Index Fund", "Rebalance", "Valuation", "Diversify", "Portfolio", "Fiduciary", "Royalties", "Coast FIRE"],
});

const EXCLUDED_SUPPORT = new Set(["CLUE", "DENTAL", "DIME", "LOGIN", "NEEDS", "TESTNET", "CHECKOUT", "PATENT"]);

// These clues are proposals for working vocabulary only. Governed terms always
// use the exact definition stored under their permanent identity.
const DRAFT_CLUES = Object.freeze({
  APPLICANT: "A person who requests credit, a loan, insurance, or another financial product.",
  APARTMENT: "A rented housing unit that usually requires recurring rent payments.",
  AUTOTRADE: "An order or system that buys or sells an asset automatically under preset rules.",
  BANK: "A financial institution that accepts deposits and provides financial services.",
  BANKFRAUD: "Illegal deception involving a bank, account, payment, or banking service.",
  BEAR: "A market participant or outlook expecting prices to fall.",
  BREAKEVEN: "The point where total income equals total costs, producing neither profit nor loss.",
  BROKER: "A person or firm that executes financial transactions for clients.",
  BROKERAGE: "A firm or account used to buy and sell investments.",
  BURN: "The permanent removal of digital tokens or coins from circulation.",
  CAPITAL: "Money or other financial resources used to fund activity or investment.",
  CASHVALUE: "The savings component that can accumulate inside certain permanent life insurance policies.",
  CHARGE: "An amount added to an account or required as payment.",
  CHARGEOFF: "A creditor's accounting designation for debt considered unlikely to be collected.",
  COASTFIRE: "A retirement strategy in which existing investments may grow toward a future goal without additional contributions.",
  COINGRADE: "An assessment of a collectible coin's condition and quality.",
  COINAGE: "Coins collectively, or the system of producing and using coins.",
  COMMUNITY: "A group whose shared participation can influence a financial network or cooperative.",
  CREDITMIX: "The variety of credit account types shown in a consumer's credit history.",
  CUSTODIAN: "An institution or person responsible for safeguarding financial assets.",
  DECEPTION: "Misleading conduct used to influence a financial decision or obtain money dishonestly.",
  DEFI: "Financial services built with decentralized blockchain applications rather than traditional intermediaries.",
  DEBITCARD: "A payment card that generally draws money directly from a linked deposit account.",
  DIRECTPAY: "A payment sent directly from one account or payer to a recipient.",
  DIVERSIFY: "To spread money across different investments to reduce concentration risk.",
  FACTORING: "Selling accounts receivable to another company for immediate cash at a discount.",
  ECOA: "The Equal Credit Opportunity Act, which prohibits certain discrimination in credit transactions.",
  FCRA: "The Fair Credit Reporting Act, which governs consumer-reporting information and related rights.",
  FEES: "Amounts charged for financial products, services, or transactions.",
  FIDUCIARY: "A person or organization required to act in another party's best financial interest.",
  FIRE: "A financial strategy focused on reaching financial independence and the option to retire early.",
  FIXED: "Set at a rate or amount that does not change during a stated period.",
  FRACTION: "A portion of a whole asset, payment, or ownership interest.",
  FRAUD: "Intentional deception for financial or personal gain.",
  GIFT: "Money or property transferred to another person without receiving equal value in return.",
  HOTWALLET: "A cryptocurrency wallet connected to the internet for convenient transactions.",
  INCOMETAX: "A tax imposed on income received by a person or organization.",
  INDEX: "A measured group of assets used to track part of a market.",
  INDEXFUND: "A fund designed to track the performance of a specified market index.",
  INVENTORY: "Goods a business holds for sale or for use in producing items for sale.",
  JUMBO: "Describes a loan amount above the conforming-loan limit.",
  JUMBOLOAN: "A mortgage larger than the conforming-loan limit set for standard agency purchase.",
  LAPSE: "The ending of coverage or a financial right because required conditions or payments were not maintained.",
  LEASE: "A contract granting use of property for recurring payments during a stated term.",
  LIABILITY: "A debt or financial obligation owed to another party.",
  LIEN: "A legal claim against property that can secure repayment of a debt.",
  LIFESTYLE: "A pattern of living choices that affects spending, saving, and financial needs.",
  MARKETING: "Activities used to promote and sell a product or service.",
  MARGIN: "Borrowed brokerage funds used to purchase investments, or the difference between revenue and cost.",
  MARKET: "A system or venue where buyers and sellers exchange assets, goods, or services.",
  MELTVALUE: "The value of a coin or object based on the market value of its metal content.",
  MINT: "A facility that produces coins, or the creation of a new digital token.",
  MINTAGE: "The number or process of coins produced in a particular issue.",
  NETINCOME: "Income remaining after expenses, taxes, and other deductions are subtracted.",
  OVERDRAFT: "A transaction or account condition in which spending exceeds the available account balance.",
  PORTFOLIO: "A collection of investments owned by a person or organization.",
  PRICE: "The amount of money required to buy a good, service, or asset.",
  PROOFLIKE: "A coin finish with mirrorlike fields and sharply detailed design elements.",
  REBALANCE: "To adjust a portfolio back toward its intended asset allocation.",
  REFINANCE: "To replace an existing loan with a new loan, usually with different terms.",
  REMIT: "To send money as payment or transfer.",
  RENT: "Money paid for temporary use of property.",
  RENTAL: "Property or an item provided for temporary use in exchange for payment.",
  RENTALCAR: "A vehicle used temporarily in exchange for a rental payment and agreement.",
  REPO: "A repurchase agreement involving the sale and later repurchase of securities.",
  REIT: "A company that owns, operates, or finances income-producing real estate under qualifying tax rules.",
  RETAIL: "The sale of goods or services directly to consumers.",
  RETENTION: "Keeping customers, employees, funds, or risk over a period of time.",
  ROYALTIES: "Payments made for the continuing use of property, creative work, or mineral rights.",
  SALE: "A transaction in which ownership is transferred for payment.",
  SECURE: "To protect an asset or to support a debt with collateral.",
  SECURED: "Backed by collateral that a lender may claim after default.",
  SELL: "To transfer an asset, good, or service to a buyer for payment.",
  SEPIRA: "A retirement account that lets eligible employers contribute for themselves and employees.",
  SIMPLEIRA: "A retirement plan for small employers that permits employee and employer contributions.",
  SPOTPRICE: "The current market price for immediate delivery of an asset or commodity.",
  TAXCREDIT: "An amount that directly reduces tax owed, subject to applicable rules.",
  TAXID: "An identifying number used for tax administration and reporting.",
  TILA: "The Truth in Lending Act, which requires specified disclosures about consumer credit costs and terms.",
  TOKENIZE: "To represent ownership or rights as a digital token.",
  TOKENIZED: "Represented as a digital token on a ledger or blockchain.",
  TRADE: "An exchange or purchase and sale of an asset, good, or service.",
  TRADELINE: "A credit account record reported on a consumer credit report.",
  UNSECURED: "Not backed by collateral that a lender can claim after default.",
  USDC: "A U.S.-dollar-referenced stablecoin used to transfer value on supported blockchains.",
  USDT: "A U.S.-dollar-referenced stablecoin commonly used in digital-asset markets.",
  VALUATION: "The process of estimating the economic value of an asset or business.",
  VALUE: "The monetary worth or usefulness of an asset, good, or service.",
  VALOAN: "A mortgage program guaranteed by the U.S. Department of Veterans Affairs for eligible borrowers.",
  VERIFY: "To check that financial information, identity, or a transaction is accurate and authentic.",
  VOTE: "A formal choice that can influence corporate or cooperative decisions.",
  WHOLESALE: "The sale of goods in quantity, usually to businesses rather than final consumers.",
});

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function normalize(value) { return String(value || "").toUpperCase().replace(/[^A-Z]/g, ""); }
function signature(words) { return [...new Set(words.map(normalize))].sort().join("|"); }
function hasWorld(record, worldId) { return record.worldAssociations.some((item) => item.worldId === worldId); }
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
function recordKey(record) { return normalize(record.normalizedKey || record.canonicalTerm); }
function recordWorlds(record) { return [...new Set(record.worldAssociations.map((item) => item.worldId))]; }
function clueFor(record) {
  const governed = record.exactGovernedDefinitions[0];
  if (governed) return { text: governed.definition, status: "exact-owner-approved-definition", permanentTermId: governed.id };
  const clue = DRAFT_CLUES[recordKey(record)];
  if (!clue) throw new Error(`Missing draft clue for ${record.canonicalTerm} (${recordKey(record)})`);
  return { text: clue, status: "draft-research-clue-pending-owner-review", permanentTermId: null };
}
function placementsPreview(layout) {
  return pipeline.renderGrid({ layout });
}

const master = readJson(MASTER_PATH);
const initial = readJson(INITIAL_PATH);
const prior = readJson(PRIOR_PROPOSAL_PATH);
const records = master.integratedVocabulary;
const financialPool = records.filter((record) =>
  record.crosswordEligible && record.letterCount >= 4 && record.letterCount <= 9 &&
  record.domainTypes.some((type) => ["financial-literacy-governed", "financial-literacy-candidate", "financial-technology-candidate"].includes(type))
);
const byKey = new Map(financialPool.map((record) => [recordKey(record), record]));

const activeSignatures = new Set(slate.SPECS.map((spec) => signature([
  spec.anchor,
  ...spec.secondary.map((item) => typeof item === "string" ? item : item.word),
  ...(spec.ordinary || []),
])));
const priorSignatures = new Set((prior.proposals || prior.candidates || []).map((candidate) => signature(candidate.requiredWords || candidate.words || [])));
const initialSignatures = new Set(initial.recommendedCandidates.map((candidate) => signature(candidate.requiredWords)));
const generatedSignatures = new Set();
const useCount = new Map();
const generated = [];

for (const [worldId, anchorNames] of Object.entries(PLANS)) {
  for (const anchorName of anchorNames) {
    const anchor = byKey.get(normalize(anchorName));
    if (!anchor || anchor.letterCount !== 9) throw new Error(`Missing nine-letter anchor: ${anchorName}`);
    const wheel = recordKey(anchor);
    const compatible = financialPool.filter((record) => recordKey(record) !== wheel && canForm(recordKey(record), wheel));
    const usable = compatible.filter((record) => !EXCLUDED_SUPPORT.has(recordKey(record)));
    const options = [];
    for (const secondaryCount of [4, 3, 2]) {
      for (const group of combinations(usable, secondaryCount)) {
        const selected = [anchor, ...group];
        const words = selected.map(recordKey);
        const composition = signature(words);
        if (activeSignatures.has(composition) || priorSignatures.has(composition) || initialSignatures.has(composition) || generatedSignatures.has(composition)) continue;
        const solved = engine.solveCrossword(words, { maxNodes: 50000, maxSolutions: 100 });
        if (!solved.ok || !engine.validateCrosswordLayout(words, solved.placements).valid) continue;
        const relevance = selected.filter((record) => hasWorld(record, worldId)).length;
        const governed = selected.filter((record) => record.permanentIdentities.length).length;
        const repetition = selected.reduce((total, record) => total + (useCount.get(recordKey(record)) || 0), 0);
        const metrics = pipeline.layoutMetrics(solved.placements);
        const score = selected.length * 15 + relevance * 22 + governed * 14 - repetition * 6 + metrics.crossings * 3;
        options.push({ selected, compatible, solved, composition, score, relevance, governed, repetition });
      }
    }
    options.sort((left, right) => right.score - left.score || right.selected.length - left.selected.length || left.composition.localeCompare(right.composition));
    const best = options[0];
    if (!best) throw new Error(`No unique strict layout found for ${worldId}/${anchorName}`);
    generatedSignatures.add(best.composition);
    best.selected.forEach((record) => useCount.set(recordKey(record), (useCount.get(recordKey(record)) || 0) + 1));

    const bestWords = best.selected.map(recordKey);
    const bestLayouts = pipeline.enumerateLayouts(bestWords, {
      solveCrosswordFn: engine.solveCrossword,
      validateCrosswordLayoutFn: engine.validateCrosswordLayout,
    }, { maxLayouts: 3, attemptLimit: 12, solverOptions: { maxNodes: 100000, maxSolutions: 250 } });
    if (!bestLayouts.length) throw new Error(`Selected composition lost its strict layout: ${worldId}/${anchorName}`);
    const answers = best.selected.map((record, index) => {
      const permanent = record.permanentIdentities[0] || null;
      const clue = clueFor(record);
      return {
        displayTerm: record.canonicalTerm,
        answer: recordKey(record),
        role: index === 0 ? "financial-anchor" : "financial-secondary",
        permanentTermId: permanent?.id || null,
        researchKey: permanent ? null : `research:${recordKey(record).toLowerCase()}`,
        owningWorld: permanent?.originWorld || null,
        worldAssociations: recordWorlds(record),
        vocabularyStatus: record.approvalStatus,
        clue,
      };
    });
    const selectedKeys = new Set(best.selected.map(recordKey));
    const unused = best.compatible.filter((record) => !selectedKeys.has(recordKey(record))).map((record) => ({
      displayTerm: record.canonicalTerm,
      answer: recordKey(record),
      permanentTermIds: record.permanentIdentities.map((item) => item.id),
      worldAssociations: recordWorlds(record),
      vocabularyStatus: record.approvalStatus,
      disposition: "wheel-compatible-not-in-selected-layout",
    }));
    const layout = bestLayouts[0];
    const validation = engine.validateCrosswordLayout(answers.map((item) => item.answer), layout.placements);
    const anchorMatchesWorld = hasWorld(best.selected[0], worldId);
    const majorityWorldFit = best.relevance >= Math.ceil(answers.length / 2);
    const educationalWorldFit = anchorMatchesWorld || majorityWorldFit;
    const ordinal = generated.filter((item) => item.worldId === worldId).length + 1;
    generated.push({
      schemaVersion: 1,
      candidateId: `FQ-2027-${worldId.toUpperCase()}-${String(ordinal).padStart(2, "0")}`,
      worldId,
      worldName: WORLD_NAMES[worldId],
      approvalStatus: "research-candidate-pending-owner-review",
      implementationEligible: false,
      nineLetterWheel: [...wheel],
      wheelKey: wheel,
      anchor: answers[0],
      answers,
      requiredWords: answers.map((item) => item.answer),
      unusedWheelCompatibleFinancialTerms: unused,
      layout: layout.placements,
      layoutPreview: placementsPreview(layout.placements),
      layoutMetrics: layout.metrics,
      alternativeLayoutCount: bestLayouts.length,
      validation: {
        structuralStatus: validation.valid && answers.length >= 3 && answers.length <= 5 && answers.every((item) => canForm(item.answer, wheel)) ? "PASS" : "FAIL",
        proposalEligibility: educationalWorldFit ? "PASS" : "DEFER",
        exactNineWheelLetters: wheel.length === 9,
        answerLength4To9: answers.every((item) => item.answer.length >= 4 && item.answer.length <= 9),
        exactRepeatedLetterCounts: answers.every((item) => canForm(item.answer, wheel)),
        meaningfulFinancialTerms: answers.length,
        strictCrosswordEngine: validation,
        uniqueComposition: true,
        duplicateOfActivePuzzle: false,
        duplicateOfPriorProposal: false,
        governanceGate: answers.every((item) => item.permanentTermId) ? "all-terms-have-permanent-identities" : "working-vocabulary-requires-owner-approval-before-implementation",
        educationalWorldFit: {
          status: educationalWorldFit ? "PASS" : "DEFER",
          anchorAssociatedWithTargetWorld: anchorMatchesWorld,
          targetWorldAssociatedTerms: best.relevance,
          requiredForMajority: Math.ceil(answers.length / 2),
          explanation: educationalWorldFit
            ? "The anchor belongs to the target world or at least half of the answers are associated with it."
            : "The strict layout is mechanically valid, but its anchor and answer set do not have enough documented association with the target world.",
        },
      },
      selection: {
        score: best.score,
        targetWorldAssociatedTerms: best.relevance,
        permanentIdentityTerms: best.governed,
        priorTermUsesAtSelection: best.repetition,
      },
    });
  }
}

const carried = initial.recommendedCandidates.map((candidate) => ({ ...candidate, carriedForwardUnchanged: true }));
const eligibleGenerated = generated.filter((candidate) => candidate.validation.proposalEligibility === "PASS");
const deferredGenerated = generated.filter((candidate) => candidate.validation.proposalEligibility !== "PASS");
const allProposals = [...carried, ...eligibleGenerated];
const activeByWorld = Object.fromEntries(Object.keys(WORLD_NAMES).map((worldId) => [worldId, slate.SPECS.filter((spec) => spec.worldId === worldId).length]));
const proposedByWorld = Object.fromEntries(Object.keys(WORLD_NAMES).map((worldId) => [worldId, allProposals.filter((candidate) => candidate.worldId === worldId).length]));
const totalsByWorld = Object.fromEntries(Object.keys(WORLD_NAMES).map((worldId) => [worldId, {
  activeUnchanged: activeByWorld[worldId],
  validatedProposals: proposedByWorld[worldId],
  projectedTotalIfAllApproved: activeByWorld[worldId] + proposedByWorld[worldId],
  minimumTarget: 15,
  preferredTarget: 20,
  minimumShortfall: Math.max(0, 15 - activeByWorld[worldId] - proposedByWorld[worldId]),
  preferredShortfall: Math.max(0, 20 - activeByWorld[worldId] - proposedByWorld[worldId]),
}]));

const output = {
  schemaVersion: 1,
  generatedDate: "2026-10-18",
  status: "validated-research-proposals-pending-owner-review-not-implemented",
  sourceVocabularyMaster: path.relative(root, MASTER_PATH),
  constraints: {
    exactWheelLetters: 9,
    answerLength: { min: 4, max: 9 },
    requiredFinancialAnswers: { min: 3, preferred: [4, 5], max: 5 },
    activePuzzlesPreserved: 27,
    runtimeFilesModified: false,
  },
  counts: {
    activePuzzlesUnchanged: slate.SPECS.length,
    initialValidatedProposalsPreserved: carried.length,
    newStrictLayoutsGenerated: generated.length,
    newOwnerReviewEligibleProposals: eligibleGenerated.length,
    deferredForWorldFit: deferredGenerated.length,
    totalOwnerReviewEligibleProposals: allProposals.length,
    projectedPuzzleTotal: slate.SPECS.length + allProposals.length,
    strictValidationPass: generated.filter((item) => item.validation.structuralStatus === "PASS").length,
    strictValidationFail: generated.filter((item) => item.validation.structuralStatus !== "PASS").length,
  },
  totalsByWorld,
  initialValidatedProposals: carried,
  ownerReviewEligibleProposals: eligibleGenerated,
  deferredStructuralCandidates: deferredGenerated,
};

if (output.counts.strictValidationFail) throw new Error(`${output.counts.strictValidationFail} generated candidates failed validation`);
if (new Set(allProposals.map((candidate) => signature(candidate.requiredWords))).size !== allProposals.length) throw new Error("Duplicate composition found in consolidated proposal set");

fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

const report = [];
report.push("# FinLit Quest 2027 — Nine-Letter Puzzle Proposals", "", "**Date:** 2026-10-18", "", "**Status:** Validated research proposals — pending owner review; not implemented", "", "## Outcome", "", `The existing ${slate.SPECS.length} playable puzzles remain unchanged. The three previously validated candidates are preserved. This pass found ${generated.length} new strict crossword layouts; ${eligibleGenerated.length} also passed the documented world-fit gate and ${deferredGenerated.length} were deferred rather than lowering educational relevance.`, "", `If every eligible proposal is later approved, the project reaches **${output.counts.projectedPuzzleTotal} total puzzles**. The 15-per-world minimum is not yet reached in every world; exact shortfalls are reported below.`, "", "A candidate counts toward a world only when its anchor is associated with that world or at least half of its required answers carry that world association in the integrated vocabulary master. Cross-world terms remain allowed and keep their original identities.", "", "## World totals", "", "| World | Active unchanged | Eligible proposals | Projected total | Minimum shortfall | Preferred shortfall |", "|---|---:|---:|---:|---:|---:|");
for (const [worldId, totals] of Object.entries(totalsByWorld)) report.push(`| ${WORLD_NAMES[worldId]} | ${totals.activeUnchanged} | ${totals.validatedProposals} | ${totals.projectedTotalIfAllApproved} | ${totals.minimumShortfall} | ${totals.preferredShortfall} |`);
report.push("", "## Validation interpretation", "", "Every new candidate passes the exact nine-letter inventory check, 4–9-letter answer rule, strict crossword placement validation, separation rules, contained-word rule, and duplicate-composition checks. Every required answer is drawn from the integrated financial-literacy vocabulary master.", "", "A structural PASS is not curriculum approval. Working 2027 vocabulary retains a research key and draft clue; it receives no permanent ID. Exact owner-approved definitions are reused only when a permanent identity already exists. Owner approval is required before any candidate can be exported to runtime.", "");
for (const worldId of Object.keys(WORLD_NAMES)) {
  const candidates = eligibleGenerated.filter((item) => item.worldId === worldId);
  const existing = carried.filter((item) => item.worldId === worldId);
  report.push(`## ${WORLD_NAMES[worldId]}`, "", `Active puzzles: ${activeByWorld[worldId]}. Preserved prior proposals: ${existing.length}. New proposals: ${candidates.length}. Projected total: ${totalsByWorld[worldId].projectedTotalIfAllApproved}.`, "");
  for (const candidate of candidates) {
    report.push(`### ${candidate.candidateId} — ${candidate.anchor.displayTerm}`, "", `- Wheel: \`${candidate.wheelKey}\``, `- Required financial answers (${candidate.answers.length}): ${candidate.answers.map((item) => `**${item.displayTerm}**`).join(", ")}`, `- Structural validation: **${candidate.validation.structuralStatus}** — ${candidate.layoutMetrics.crossings} crossings; ${candidate.alternativeLayoutCount} valid layout(s) retained`, `- Educational world fit: **${candidate.validation.educationalWorldFit.status}** — ${candidate.validation.educationalWorldFit.explanation}`, `- Governance: ${candidate.validation.governanceGate}`, "", "Financial clues:", "");
    candidate.answers.forEach((answer) => report.push(`- **${answer.displayTerm}:** ${answer.clue.text} _(${answer.clue.status})_`));
    report.push("", "Crossword preview:", "", "```text", candidate.layoutPreview, "```", "", "Unused wheel-compatible financial vocabulary:", "");
    if (!candidate.unusedWheelCompatibleFinancialTerms.length) report.push("- None.");
    else candidate.unusedWheelCompatibleFinancialTerms.forEach((term) => report.push(`- ${term.displayTerm} (${term.vocabularyStatus}; ${term.disposition})`));
    report.push("");
  }
}
report.push("## Deferred structural candidates", "", "These records passed the strict crossword solver but are **not puzzle proposals eligible for owner approval** because the documented vocabulary associations do not support their assigned world strongly enough. They are retained for future recategorization or use in their owning worlds.", "", "| Candidate | Assigned world | Anchor | Answers | Reason |", "|---|---|---|---|---|");
deferredGenerated.forEach((candidate) => report.push(`| ${candidate.candidateId} | ${candidate.worldName} | ${candidate.anchor.displayTerm} | ${candidate.answers.map((item) => item.displayTerm).join(", ")} | ${candidate.validation.educationalWorldFit.explanation} |`));
report.push("");
report.push("## Restrictions preserved", "", "- No active puzzle, runtime file, save schema, reward formula, or gameplay mechanic was changed.", "- No permanent term ID was created.", "- No research term was promoted to approved vocabulary.", "- No proposal is implementation-authorized.", "");
fs.writeFileSync(REPORT_PATH, `${report.join("\n")}\n`);

console.log(JSON.stringify({ output: path.relative(root, OUTPUT_PATH), report: path.relative(root, REPORT_PATH), counts: output.counts, totalsByWorld }, null, 2));

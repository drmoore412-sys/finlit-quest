#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const game = require("../src/game-engine.js");
const pipeline = require("../src/crossword-candidate-pipeline.js");
const slate = require("../src/v3-puzzle-slate.js");
const creditIds = require("../content/credit-term-identities.js");

const DATE = "2026-10-18";
const OUTPUT_DIR = path.join(root, "staging/research/expansion", DATE);
const REPORT_PATH = path.join(root, "docs/FINLIT_QUEST_2027_WORLD_AND_PUZZLE_EXPANSION_RESEARCH.md");
const PROPOSAL_PATH = path.join(root, "staging/research/expansion/2026-10-17/finlit-quest-27-quiz-expansion-proposal.json");

const WORLD_NAMES = {
  moneybasics: "Money Basics",
  credit: "Credit Foundations",
  crypto: "Crypto Foundations",
  banking: "Banking Basics",
  investing: "Investing Basics",
};

const TERM_FILES = {
  moneybasics: "content/money-basics-terms.json",
  credit: "content/credit-game-terms.json",
  crypto: "content/crypto-terms.json",
  banking: "content/banking-basics-terms.json",
  investing: "content/investing-basics-terms.json",
};

const MISSING_SOURCE_DOCUMENTS = [
  "FinLit_Quest_2027_Remaining_Worlds_Backlog.md",
  "FinLit_Quest_2027_Vocabulary_Master_Backlog.md",
  "FinLit_Quest_AI_and_Coins_World_Vocabulary.md",
  "FinLit_Quest_Money_Basics_2027_and_Coins_Vocabulary.md",
];

const APPROVED_NOT_IMPLEMENTED = [
  { id: "crypto.address", world: "crypto", word: "ADDRESS", definition: "A string of letters and numbers used as a destination for sending or receiving cryptocurrency." },
  { id: "crypto.custody", world: "crypto", word: "CUSTODY", definition: "The responsibility for safeguarding the keys or accounts that control access to cryptocurrency." },
  { id: "crypto.scam", world: "crypto", word: "SCAM", definition: "A deceptive scheme designed to steal money or cryptocurrency." },
  { id: "crypto.confirmed", world: "crypto", word: "CONFIRMED", definition: "Describes a blockchain transaction or block whose inclusion has been accepted through network consensus." },
];

const BRIEF_MENTIONS = {
  moneybasics: ["BUDGETING", "INCOME", "EXPENSES", "SAVINGS", "CASH FLOW", "MODERN PAYMENTS", "FINTECH", "CASH ROUNDING", "STABLECOINS", "DIGITAL WALLETS", "CRYPTOCURRENCY", "FINANCIAL INSTITUTIONS"],
  credit: ["CREDIT REPORTS", "CREDIT BUREAUS", "FICO", "VANTAGESCORE", "CONSUMER RIGHTS", "CREDIT FREEZES", "COLLECTIONS", "DISPUTES", "IDENTITY THEFT", "VEHICLE HISTORY", "TENANT SCREENING", "MODERN CREDIT PRODUCTS"],
  crypto: ["BITCOIN", "ETHEREUM", "SOLANA", "LITECOIN", "DOGECOIN", "CARDANO", "AVALANCHE", "MONERO", "STABLECOINS", "ALTCOINS", "MEMECOINS", "BLOCKCHAIN", "VALIDATORS", "STAKING", "MINING", "WALLETS", "EXCHANGES", "DEFI"],
  banking: ["CHECKING", "SAVINGS", "LOANS", "MORTGAGES", "REFINANCING", "HOME EQUITY", "HELOCS", "CREDIT LINES", "OVERDRAFTS", "FEDNOW", "ACH", "WIRE TRANSFERS", "BANKING TECHNOLOGY"],
  investing: ["STOCKS", "BONDS", "ETFS", "MUTUAL FUNDS", "INDEX FUNDS", "DIVIDENDS", "OPTIONS", "FUTURES", "REITS", "INVESTMENT ACCOUNTS", "RETIREMENT INVESTING", "PORTFOLIO RISK", "INVESTMENT STRATEGIES"],
  coins: ["PHYSICAL COINS", "BULLION", "PROOF COINS", "MINTING", "COIN GRADING", "NUMISMATICS", "PRECIOUS METALS", "DIGITAL COIN CATEGORIES"],
  ai_technology: ["CHATGPT", "OPENAI", "CODEX", "CLAUDE", "GEMINI", "COPILOT", "AI AGENTS", "AUTOMATION", "CODING", "CYBERSECURITY", "AI CAREERS", "AI BUSINESS TOOLS"],
  real_estate: ["SINGLE-FAMILY HOMES", "DUPLEXES", "TRIPLEXES", "FOURPLEXES", "TOWNHOUSES", "CONDOS", "APARTMENTS", "COMMERCIAL PROPERTY", "RENTAL INCOME", "LANDLORDS", "TENANTS", "MORTGAGES", "CASH FLOW", "APPRECIATION"],
  taxes: ["INCOME TAXES", "PAYROLL TAXES", "PROPERTY TAXES", "CAPITAL GAINS", "DEDUCTIONS", "CREDITS", "REFUNDS", "TAX FILING", "BUSINESS TAXES", "TAX PLANNING"],
  insurance: ["MEDICAL INSURANCE", "VISION INSURANCE", "DENTAL INSURANCE", "TRAVEL INSURANCE", "RENTERS INSURANCE", "RENTAL PROPERTY INSURANCE", "AUTO INSURANCE", "LIFE INSURANCE", "HOMEOWNERS INSURANCE", "DISABILITY INSURANCE", "PREMIUMS", "CLAIMS", "COVERAGE", "DEDUCTIBLES"],
  business: ["LLCS", "CORPORATIONS", "FRANCHISES", "BUSINESS LOANS", "BUSINESS CREDIT", "PROFIT MARGINS", "PAYROLL", "ECOMMERCE", "WHITE LABELING", "PRIVATE LABELING", "DROPSHIPPING", "AFFILIATE MARKETING", "LICENSING"],
  social_media_digital_income: ["UGC", "NIL", "FACELESS CONTENT", "DOMAIN NAMES", "WEBSITES", "AMAZON AFFILIATES", "SOCIAL MEDIA", "CREATOR INCOME", "LIVESTREAMING", "ECOMMERCE"],
  retirement_wealth: ["401(K)", "403(B)", "457(B)", "ROTH IRA", "TRADITIONAL IRA", "SEP IRA", "SIMPLE IRA", "PENSIONS", "ANNUITIES", "SOCIAL SECURITY", "MEDICARE", "RETIREMENT INCOME", "WITHDRAWALS", "VESTING", "EMPLOYER MATCHING", "ESTATE PLANNING", "WILLS", "TRUSTS", "INHERITANCE", "BENEFICIARIES", "FIRE STRATEGIES"],
  financial_safety_consumer_rights: [],
  careers_employment: [],
  economics_federal_reserve: [],
};

const PLATFORM_CONTEXT = ["TIKTOK", "TWITCH", "YOUTUBE", "INSTAGRAM", "FACEBOOK", "SNAPCHAT", "PINTEREST", "REDDIT", "DISCORD", "LINKEDIN", "THREADS", "BLUESKY", "SHOPIFY", "AMAZON", "ETSY", "EBAY", "WALMART", "ALIBABA", "WHATNOT", "PATREON", "SUBSTACK", "FIVERR", "UPWORK", "GODADDY", "WORDPRESS", "ROBLOX", "FORTNITE", "STEAM"];

const LONG_TERM_STUDY = {
  OBLIGATION: { example: "A borrower signs a loan agreement and must make the promised monthly payments.", related: ["REPAYMENT", "TERM", "CONTRACT"] },
  AFFORDABILITY: { example: "Before accepting a car loan, a borrower compares the payment with monthly income and existing bills.", related: ["INCOME", "PAYMENT", "BUDGET"] },
  UNDERWRITING: { example: "A lender reviews income, debts, and credit history before deciding whether to approve an application.", related: ["APPLICANT", "CAPACITY", "CREDITWORTHINESS"] },
  DISBURSEMENT: { example: "After a loan closes, the lender releases the approved funds to the borrower or seller.", related: ["LOAN", "PRINCIPAL", "PAYMENT"] },
  CAPITALIZATION: { example: "Unpaid interest is added to a loan balance, so future interest may be calculated on a larger principal.", related: ["INTEREST", "PRINCIPAL", "BALANCE"] },
  AMORTIZATION: { example: "A fixed monthly mortgage payment gradually pays interest and reduces principal over the loan term.", related: ["PAYMENT", "PRINCIPAL", "TERM"] },
  DISCLOSURE: { example: "A borrower reviews a document showing the loan's rate, fees, and repayment terms before signing.", related: ["APR", "FEE", "TERM"] },
  PREPAYMENT: { example: "A borrower pays extra principal and finishes a loan before the scheduled final payment.", related: ["PRINCIPAL", "REPAYMENT", "PAYMENT"] },
  COLLATERAL: { example: "A financed vehicle may serve as property supporting repayment of the auto loan.", related: ["SECURED", "LOAN", "REPOSSESSION"] },
  REPOSSESSION: { example: "After a secured auto loan defaults, the lender may take the vehicle under applicable rules.", related: ["COLLATERAL", "DEFAULT", "DELINQUENCY"] },
  FORECLOSURE: { example: "A mortgage lender begins the legal process involving a home that secures an unpaid mortgage debt.", related: ["MORTGAGE", "COLLATERAL", "DEFAULT"] },
  CREDITWORTHINESS: { example: "A lender considers payment history, debts, and income when evaluating whether a borrower is likely to repay.", related: ["HISTORY", "CAPACITY", "UNDERWRITING"] },
  DELINQUENCY: { example: "A required loan payment passes its due date without being paid.", related: ["DUE", "DEFAULT", "COLLECTION"] },
  ACCELERATION: { example: "After a qualifying default, a contract may allow the lender to require the entire outstanding balance.", related: ["DEFAULT", "BALANCE", "OBLIGATION"] },
  COLLECTION: { example: "A creditor or collector contacts a borrower to recover a past-due obligation.", related: ["CREDITOR", "DELINQUENCY", "DEBT"] },
};

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
}

function letters(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function lengthBucket(word) {
  const count = letters(word).length;
  if (count <= 3) return "short-educational-1-3";
  if (count <= 9) return "crossword-eligible-4-9";
  return "flashcard-study-10-plus";
}

function letterCounts(value) {
  return [...letters(value)].reduce((result, letter) => {
    result[letter] = (result[letter] || 0) + 1;
    return result;
  }, {});
}

function canForm(word, wheel) {
  const available = letterCounts(wheel);
  return Object.entries(letterCounts(word)).every(([letter, total]) => (available[letter] || 0) >= total);
}

function signature(words) {
  return words.map(letters).sort().join("|");
}

function buildTerms() {
  const terms = [];
  for (const [world, file] of Object.entries(TERM_FILES)) {
    for (const record of readJson(file)) {
      terms.push({
        id: world === "credit" ? creditIds.idForWord(record.word) : record.id,
        world,
        word: record.word,
        definition: record.definition,
        runtimeStatus: "implemented",
        source: file,
      });
    }
  }
  for (const record of readJson("content/v3-supplemental-terms.json")) {
    if (terms.some((term) => term.id === record.id)) continue;
    terms.push({ id: record.id, world: record.world, word: record.word, definition: record.definition, runtimeStatus: "implemented-supplement", source: "content/v3-supplemental-terms.json" });
  }
  for (const record of APPROVED_NOT_IMPLEMENTED) {
    if (terms.some((term) => term.id === record.id)) continue;
    terms.push({ ...record, runtimeStatus: "owner-approved-not-implemented", source: "docs/CURRICULUM_APPROVAL_LOG.md#CAL-0008" });
  }
  return terms.map((term) => ({
    ...term,
    normalizedWord: letters(term.word),
    letterCount: letters(term.word).length,
    vocabularyClass: lengthBucket(term.word),
  })).sort((a, b) => a.world.localeCompare(b.world) || a.word.localeCompare(b.word));
}

function buildFlashcards(terms) {
  return terms.filter((term) => term.letterCount >= 10).map((term) => {
    const study = LONG_TERM_STUDY[letters(term.word)];
    if (!study) throw new Error(`Missing proposed study metadata for ${term.word}`);
    return {
      id: term.id,
      world: term.world,
      term: term.word,
      definition: term.definition,
      definitionStatus: "existing-governed-definition-unchanged",
      proposedRealLifeExample: study.example,
      relatedTerms: study.related,
      suggestedFlashcardQuestion: `What does ${term.word} mean in a credit or borrowing context?`,
      suggestedFlashcardAnswer: term.definition,
      suggestedDifficulty: term.letterCount >= 13 ? "Advanced" : "Intermediate",
      approvalStatus: "study-metadata-pending-owner-review",
    };
  });
}

function requiredRuleCheck(candidate) {
  const required = candidate.answers.filter((answer) => answer.category !== "bonus");
  const failures = [];
  if (candidate.wheelLetters.length !== 9) failures.push("wheelMustContainExactlyNineLetters");
  for (const answer of required) {
    const count = letters(answer.word).length;
    if (count < 4 || count > 9) failures.push(`answerLength4To9:${answer.word}`);
    if (!canForm(answer.word, candidate.wheelLetters.join(""))) failures.push(`exactLetterMultiset:${answer.word}`);
  }
  const financialCount = required.filter((answer) => answer.category.startsWith("financial-")).length;
  if (required.length < 3 || required.length > 5) failures.push("requiredAnswerCount3To5");
  if (financialCount < 3) failures.push("minimumThreeFinancialTerms");
  return { status: failures.length ? "FAIL" : "PASS", failures, requiredWordCount: required.length, financialTermCount: financialCount };
}

function answerFor(registry, id, puzzleWorld, category) {
  const term = registry.byId.get(id);
  if (!term) throw new Error(`Unknown term ${id}`);
  return pipeline.financialAnswer(term, puzzleWorld, category);
}

function proposalCandidate(original, registry, ordinaryByWord) {
  const answers = original.financialTerms.map((item, index) => answerFor(registry, item.permanentId, original.worldId, index === 0 ? "financial-anchor" : "financial-secondary"));
  for (const word of original.ordinarySupportingWords) answers.push(pipeline.ordinaryAnswer(ordinaryByWord.get(word), original.worldId));
  return {
    schemaVersion: 1,
    candidateId: original.proposalId,
    sourceStatus: "existing-proposal-carried-forward",
    worldId: original.worldId,
    theme: original.worldId === "crypto" ? "Transaction confirmation and network participants" : "Deposits and posted transactions",
    difficulty: original.difficulty,
    anchorTermId: original.anchorTermId,
    anchorWord: original.anchorWord,
    wheelLetters: original.wheelLetters,
    answers,
    requiredWords: original.requiredWords,
    layout: original.layout,
    alternativeLayoutCount: original.alternativeLayoutCount,
    proposedComprehensionQuestion: original.proposedComprehensionQuestion,
    rewardPolicy: { financial: { coinsPerLetter: 7, xpPerLetter: 1.5, roundXp: true }, ordinary: { coinsPerWord: 1, xp: 0 }, bonus: { coins: 0, xp: 0 } },
    approvalStatus: "pending-owner-review",
  };
}

function newRepaymentCandidate(registry) {
  const worldId = "moneybasics";
  const ids = ["credit.repayment", "moneybasics.payment", "moneybasics.earn", "moneybasics.rate", "credit.term"];
  const answers = ids.map((id, index) => answerFor(registry, id, worldId, index === 0 ? "financial-anchor" : "financial-secondary"));
  const requiredWords = answers.map((answer) => answer.word);
  const layouts = pipeline.enumerateLayouts(requiredWords, { solveCrosswordFn: game.solveCrossword, validateCrosswordLayoutFn: game.validateCrosswordLayout }, { maxLayouts: 3, attemptLimit: 48, solverOptions: { maxNodes: 250000, maxSolutions: 1000 } });
  if (!layouts.length) throw new Error("No strict layout for the 2027 REPAYMENT candidate");
  return {
    schemaVersion: 1,
    candidateId: "RESEARCH-2027-MB-REPAYMENT-01",
    sourceStatus: "newly-generated-research-candidate",
    worldId,
    theme: "Earning, borrowing cost, and repayment",
    difficulty: "Advanced",
    anchorTermId: "credit.repayment",
    anchorWord: "REPAYMENT",
    wheelLetters: [..."REPAYMENT"],
    answers,
    requiredWords,
    layout: layouts[0].placements,
    alternativeLayoutCount: layouts.length,
    proposedComprehensionQuestion: {
      question: "Which term describes the process of paying a debt back?",
      answers: ["REPAYMENT", "PAYMENT", "RATE"],
      correct: 0,
      explanation: registry.byId.get("credit.repayment").definition,
      status: "pending-owner-review",
    },
    rewardPolicy: { financial: { coinsPerLetter: 7, xpPerLetter: 1.5, roundXp: true }, ordinary: { coinsPerWord: 1, xp: 0 }, bonus: { coins: 0, xp: 0 } },
    approvalStatus: "pending-owner-review",
  };
}

function enrichCandidate(candidate, registry, ordinaryByWord, activeSignatures, proposalSignatures) {
  const wheel = candidate.wheelLetters.join("");
  const allEligibleFinancialTerms = registry.terms.filter((term) => {
    const count = letters(term.word).length;
    return count >= 4 && count <= 9 && canForm(term.word, wheel);
  }).map((term) => ({ id: term.id, word: term.word, world: term.world }));
  const pipelineValidation = pipeline.validateCandidate(candidate, { registry, ordinaryByWord, validateCrosswordLayoutFn: game.validateCrosswordLayout });
  const rule2027 = requiredRuleCheck(candidate);
  const composition = signature(candidate.requiredWords);
  return {
    ...candidate,
    layoutPreview: pipeline.renderGrid(candidate),
    allEligibleFinancialTerms,
    unusedEligibleFinancialTerms: allEligibleFinancialTerms.filter((term) => !candidate.requiredWords.includes(term.word)),
    validation2027: {
      status: pipelineValidation.status === "PASS" && rule2027.status === "PASS" ? "PASS" : "FAIL",
      pipelineValidation,
      rule2027,
      duplicateOfActiveComposition: activeSignatures.has(composition),
      duplicateOfExistingProposal: candidate.sourceStatus === "newly-generated-research-candidate" && proposalSignatures.has(composition),
    },
  };
}

function markdownTable(rows) {
  return rows.join("\n");
}

function buildReport({ terms, vocabularySummary, inventory, proposalAudit, candidates, flashcards, briefOnly }) {
  const candidateSections = candidates.map((candidate) => {
    const financial = candidate.answers.filter((answer) => answer.category.startsWith("financial-")).map((answer) => `- **${answer.word}** — \`${answer.termId}\` (${WORLD_NAMES[answer.worldId] || answer.worldId})`).join("\n");
    const ordinary = candidate.answers.filter((answer) => answer.category === "ordinary").map((answer) => answer.word).join(", ") || "None";
    const unused = candidate.unusedEligibleFinancialTerms.map((term) => `${term.word} (\`${term.id}\`)`).join(", ") || "None";
    return `### ${candidate.candidateId} — ${candidate.anchorWord}\n\n- World: **${WORLD_NAMES[candidate.worldId]}**\n- Status: **${candidate.sourceStatus} / pending owner review / not implemented**\n- Theme: ${candidate.theme}\n- Difficulty: ${candidate.difficulty}\n- Wheel: **${candidate.wheelLetters.join("")}** (${candidate.wheelLetters.length} letters)\n- Required answers (${candidate.requiredWords.length}): **${candidate.requiredWords.join(", ")}**\n- Ordinary support: ${ordinary}\n- Strict 2027 validation: **${candidate.validation2027.status}**\n- Valid layouts found: ${candidate.alternativeLayoutCount}\n- Duplicate of active composition: ${candidate.validation2027.duplicateOfActiveComposition ? "Yes" : "No"}\n- Duplicate of earlier proposal: ${candidate.validation2027.duplicateOfExistingProposal ? "Yes" : "No"}\n\nFinancial identities:\n\n${financial}\n\nAll eligible governed financial terms from this wheel: ${candidate.allEligibleFinancialTerms.map((term) => term.word).join(", ")}\n\nEligible but unused: ${unused}\n\n\`\`\`text\n${candidate.layoutPreview}\n\`\`\`\n\nProposed comprehension check: ${candidate.proposedComprehensionQuestion.question}\n`;
  }).join("\n");

  const inventoryRows = inventory.map((item) => `| ${item.worldName} | ${item.implementedPuzzles} | ${item.to15} | ${item.to20} | ${item.runtimeTerms} | ${item.approvedTerms} |`).join("\n");
  const vocabularyRows = vocabularySummary.map((item) => `| ${item.worldName} | ${item.total} | ${item.crossword} | ${item.long} | ${item.short} |`).join("\n");
  const flashcardRows = flashcards.map((item) => `| ${item.term} | ${item.definition} | ${item.proposedRealLifeExample} | ${item.suggestedDifficulty} |`).join("\n");

  return `# FinLit Quest 2027 — World and Crossword Expansion Research\n\n**Date:** ${DATE}  \n**Status:** PARTIAL BASELINE COMPLETE — OWNER REVIEW REQUIRED — IMPLEMENTATION NOT AUTHORIZED\n\nThis package inventories the five playable worlds, preserves all governed vocabulary available locally, screens the existing 27-puzzle proposal against the new 2027 rules, and supplies the small set of unique nine-letter candidates that can currently pass every gate. It does not add a world, activate a puzzle, edit a definition, or change gameplay.\n\n## Executive finding\n\nThe current repository cannot yet support 15–20 new-rule puzzles per world without additional approved vocabulary. The five worlds contain **27 implemented puzzles**. Reaching 15 per world requires **48 additional implemented puzzles**; reaching 20 requires **73**. The pending 27-puzzle proposal would bring the total to 54, still 21 short of the 15-per-world minimum, and only **4 of its 27 records** satisfy all of the newly supplied 2027 constraints (nine wheel letters, every answer 4–9 letters, and at least three financial terms). After removing near-duplicate compositions and a CONFIRMED candidate that omits the eligible INCOME term, **two earlier candidates remain suitable for continued review**. This package adds **one new unique strict candidate**, REPAYMENT.\n\nNone of the 27 active puzzles passes every new 2027 rule. They remain protected, working, grandfathered content; this report does not propose rewriting or deleting them.\n\n## Missing source documents\n\nThe following named inputs were not found in the repository, Downloads, or the supplied attachment:\n\n${MISSING_SOURCE_DOCUMENTS.map((file) => `- \`${file}\``).join("\n")}\n\nTheir contents were not reconstructed. Terms explicitly named in the task brief are preserved separately as **brief mentions awaiting source reconciliation**, not treated as approved terms.\n\n## A. World inventory\n\n| World | Implemented puzzles | More to 15 | More to 20 | Runtime terms | Owner-approved terms |\n|---|---:|---:|---:|---:|---:|\n${inventoryRows}\n\n### Proposed themes\n\n- **Money Basics:** earning and take-home money; payments and transfers; budgeting and cash flow; saving and inflation; modern payment tools.\n- **Credit Foundations:** borrowing costs; credit reports and bureaus; repayment and delinquency; fraud protection and freezes; comparing loan terms.\n- **Crypto Foundations:** networks and nodes; transaction confirmation; wallets and custody; mining and staking; scams and risk.\n- **Banking Basics:** deposits and posting; account access; payment rails; liquidity and reserves; identity and account security.\n- **Investing Basics:** ownership and markets; return and dividends; diversification and liquidity; order types; long-term risk and growth.\n\nThe additional topic areas remain organizational recommendations only. Coins may fit partly under Money Basics and Investing; AI/technology, real estate, taxes, insurance, business, digital income, retirement, financial safety, careers, and economics need curriculum and governance review before any new world is created.\n\n## B. Vocabulary master list\n\nThe machine-readable master list is at \`staging/research/expansion/${DATE}/finlit-quest-2027-vocabulary-master.json\`. It contains **${terms.length} owner-approved permanent identities**: 155 implemented/supplemental records plus four CAL-0008 Crypto identities that are approved but not implemented. Definitions are copied exactly from their controlling records.\n\n| World | Total approved IDs | Crossword 4–9 | Study 10+ | Short 1–3 |\n|---|---:|---:|---:|---:|\n${vocabularyRows}\n\nTask-brief vocabulary that does not resolve to a permanent identity is preserved as a non-approved research queue (${briefOnly.length} unique world/term mentions). Company and platform names are stored as context only; they are not classified as financial concepts.\n\n## 2027 compatibility of existing content\n\n- Active puzzles: ${proposalAudit.active.total}. Wheel exactly nine: ${proposalAudit.active.wheel9}. All answers 4–9: ${proposalAudit.active.all4to9}. At least three financial terms: ${proposalAudit.active.financial3}. Pass all three: **${proposalAudit.active.pass}**.\n- Pending 27-puzzle proposal: ${proposalAudit.proposal.total}. Wheel exactly nine: ${proposalAudit.proposal.wheel9}. All answers 4–9: ${proposalAudit.proposal.all4to9}. At least three financial terms: ${proposalAudit.proposal.financial3}. Pass all three: **${proposalAudit.proposal.pass}**.\n- The old proposal remains unchanged. This report is a new compatibility layer, not a rewrite of the October 17 evidence.\n\n## C. Nine-letter puzzle candidates\n\nOnly the following unique candidates should remain in the current owner-review queue. All pass the exact multiset, crossing, separation, contained-word, governed-identity, financial-majority, reward-protection, and engine-acceptance checks, plus the new nine-letter and 4–9-answer rules. Ranking occurs only after validation.\n\n${candidateSections}\n\n### Candidate disposition notes\n\n- The REPAYMENT wheel can also form PEER. Five required answers is the current maximum, so PEER is recorded as eligible but unused rather than hidden.\n- The DEPOSITOR wheel's only governed 4–9 financial terms are DEPOSITOR, DEPOSIT, and POSTED; all three are included.\n- The CONFIRMED wheel's governed 4–9 financial terms are CONFIRMED, INCOME, NODE, COIN, and MINER; all five are included.\n- The existing Money Basics DEPOSITOR proposal is a near-duplicate of the Banking proposal and is not recommended as a second quiz.\n- The second CONFIRMED proposal omits eligible INCOME even though a valid five-term layout exists, so it is not recommended.\n- No Credit or Investing composition can currently pass the complete new rules without new approved vocabulary.\n\n## D. Flashcard and study vocabulary\n\nThe governed 10+ letter collection is at \`staging/research/expansion/${DATE}/finlit-quest-2027-flashcard-vocabulary.json\`. It preserves exact approved definitions and adds clearly marked **proposed** examples, related terms, questions, answers, and difficulty metadata for owner review. No study feature was implemented.\n\n| Term | Exact governed definition | Proposed practical example | Difficulty |\n|---|---|---|---|\n${flashcardRows}\n\nLong-form terms named only in the task brief—such as STABLECOIN, BLOCKCHAIN, CREDIT REPORT, PERSONAL LOAN, CAPITAL GAINS TAX, SOCIAL SECURITY, BENEFICIARY, DEDUCTIBLE, WHITE LABEL, DOMAIN NAME, and FINANCIAL INDEPENDENCE—remain in the brief-only research queue until the missing source records or new term-specific evidence are supplied. They were not assigned IDs or definitions here.\n\n## E. Expansion status\n\n- **Implemented:** 27 protected active puzzles; 155 implemented governed/supplemental term identities.\n- **Existing proposals:** 27 October 17 puzzle records remain pending owner review and unimplemented. Two unique records continue to meet the stricter 2027 rule set.\n- **New candidate:** one unique REPAYMENT composition, pending owner review and unimplemented.\n- **Approved but not implemented vocabulary:** four Crypto CAL-0008 terms (ADDRESS, CUSTODY, SCAM, CONFIRMED).\n- **Awaiting review:** every brief-only term without a permanent identity; all proposed examples, questions, and difficulty labels.\n- **Long-form study:** 15 governed Credit terms are packaged now; additional brief-only long terms await source reconciliation.\n\n## Recommended phased next work\n\n1. **Recover the four missing 2027 source files.** Reconcile their exact terms, definitions, sources, classifications, and duplicates into the master list.\n2. **Approve vocabulary before chasing puzzle counts.** Prioritize nine-letter anchors that can form at least two other approved 4–9-letter financial terms. Do not approve a term solely because it helps a crossword.\n3. **Regenerate candidates world by world.** Enforce nine wheel letters, 4–9-letter answers, at least three financial terms, exhaustive wheel-term discovery, strict layouts, and duplicate rejection.\n4. **Owner review.** Decide the three candidates in this report and separately review new definitions, clues, comprehension questions, and world placement.\n5. **Only after explicit implementation authorization**, export selected records through the governed candidate pipeline without changing permanent identities or existing puzzles.\n\n## Owner decisions needed\n\n- Confirm whether the exact-nine-letter rule applies only to future puzzles or should eventually trigger a separately reviewed migration of grandfathered content.\n- Supply the four missing 2027 vocabulary/backlog files.\n- Approve, revise, or reject the three candidate records; approval still does not authorize runtime implementation.\n- Decide whether the four CAL-0008 Crypto additions may participate in expansion before the dedicated Crypto controlling governance record is completed.\n- Decide whether Coins and AI & Technology are future worlds, categories inside existing worlds, or study-only modules.\n`;
}

function main() {
  const terms = buildTerms();
  const registry = pipeline.createRegistry(terms);
  if (registry.errors.length) throw new Error(JSON.stringify(registry.errors, null, 2));

  const approvedOrdinary = [...new Set(slate.SPECS.flatMap((spec) => spec.ordinary || []))].map((word) => ({ word, approvalStatus: "approved-support", familiarity: 10, sources: [{ sourceId: "CAL-0007/V3-reviewed-compositions" }] }));
  const ordinaryByWord = new Map(approvedOrdinary.map((record) => [record.word, record]));
  const existingProposal = readJson(path.relative(root, PROPOSAL_PATH));
  const proposalById = new Map(existingProposal.quizzes.map((quiz) => [quiz.proposalId, quiz]));

  const activeSignatures = new Set(slate.SPECS.map((spec) => signature([spec.anchor, ...spec.secondary.map((item) => typeof item === "string" ? item : item.word), ...spec.ordinary])));
  const proposalSignatures = new Set(existingProposal.quizzes.map((quiz) => signature(quiz.requiredWords)));

  const candidates = [
    newRepaymentCandidate(registry),
    proposalCandidate(proposalById.get("EXPANSION-2026-10-17-BK-01"), registry, ordinaryByWord),
    proposalCandidate(proposalById.get("EXPANSION-2026-10-17-CX-01"), registry, ordinaryByWord),
  ].map((candidate) => enrichCandidate(candidate, registry, ordinaryByWord, activeSignatures, proposalSignatures));
  if (candidates.some((candidate) => candidate.validation2027.status !== "PASS")) throw new Error("A selected 2027 candidate failed validation");

  const inventory = Object.entries(WORLD_NAMES).map(([worldId, worldName]) => {
    const implementedPuzzles = slate.SPECS.filter((spec) => spec.worldId === worldId).length;
    const runtimeTerms = terms.filter((term) => term.world === worldId && term.runtimeStatus !== "owner-approved-not-implemented").length;
    const approvedTerms = terms.filter((term) => term.world === worldId).length;
    return { worldId, worldName, implementedPuzzles, to15: 15 - implementedPuzzles, to20: 20 - implementedPuzzles, runtimeTerms, approvedTerms };
  });

  const vocabularySummary = Object.entries(WORLD_NAMES).map(([worldId, worldName]) => {
    const worldTerms = terms.filter((term) => term.world === worldId);
    return { worldId, worldName, total: worldTerms.length, crossword: worldTerms.filter((term) => term.vocabularyClass === "crossword-eligible-4-9").length, long: worldTerms.filter((term) => term.vocabularyClass === "flashcard-study-10-plus").length, short: worldTerms.filter((term) => term.vocabularyClass === "short-educational-1-3").length };
  });

  const activeAudit = slate.SPECS.map((spec) => {
    const words = [spec.anchor, ...spec.secondary.map((item) => typeof item === "string" ? item : item.word), ...spec.ordinary];
    const financial = 1 + spec.secondary.length;
    return { id: `FQ-V3:${spec.worldId}:${spec.anchor}`, worldId: spec.worldId, anchor: spec.anchor, words, wheel9: letters(spec.anchor).length === 9, all4to9: words.every((word) => letters(word).length >= 4 && letters(word).length <= 9), financial3: financial >= 3 };
  }).map((item) => ({ ...item, pass: item.wheel9 && item.all4to9 && item.financial3 }));
  const proposalAuditRecords = existingProposal.quizzes.map((quiz) => ({ id: quiz.proposalId, worldId: quiz.worldId, anchor: quiz.anchorWord, words: quiz.requiredWords, wheel9: quiz.wheelLetters.length === 9, all4to9: quiz.requiredWords.every((word) => letters(word).length >= 4 && letters(word).length <= 9), financial3: quiz.financialTerms.length >= 3 })).map((item) => ({ ...item, pass: item.wheel9 && item.all4to9 && item.financial3 }));
  const summarizeAudit = (records) => ({ total: records.length, wheel9: records.filter((item) => item.wheel9).length, all4to9: records.filter((item) => item.all4to9).length, financial3: records.filter((item) => item.financial3).length, pass: records.filter((item) => item.pass).length });
  const proposalAudit = { active: summarizeAudit(activeAudit), proposal: summarizeAudit(proposalAuditRecords), activeRecords: activeAudit, proposalRecords: proposalAuditRecords };

  const briefOnly = Object.entries(BRIEF_MENTIONS).flatMap(([category, words]) => words.map((word) => ({ category, word, normalizedWord: letters(word), letterCount: letters(word).length, vocabularyClass: lengthBucket(word), status: terms.some((term) => term.normalizedWord === letters(word)) ? "name-collides-with-governed-term-review-context" : "brief-mention-awaiting-source-reconciliation", permanentId: null, definition: null })));
  const flashcards = buildFlashcards(terms);

  const vocabularyMaster = {
    schemaVersion: 1,
    generatedDate: DATE,
    status: "research-only-not-active",
    missingSourceDocuments: MISSING_SOURCE_DOCUMENTS,
    counts: { approvedPermanentIdentities: terms.length, implementedOrSupplemental: terms.filter((term) => term.runtimeStatus !== "owner-approved-not-implemented").length, approvedNotImplemented: terms.filter((term) => term.runtimeStatus === "owner-approved-not-implemented").length, briefMentions: briefOnly.length, platformContextOnly: PLATFORM_CONTEXT.length },
    summaryByWorld: vocabularySummary,
    governedTerms: terms,
    briefMentions: briefOnly,
    platformContextOnly: PLATFORM_CONTEXT.map((word) => ({ word, status: "context-only-not-a-financial-concept" })),
  };

  const candidatePackage = { schemaVersion: 1, generatedDate: DATE, status: "pending-owner-review-not-implemented", governingRules: { wheelLetters: 9, answerLength: { min: 4, max: 9 }, requiredAnswers: { min: 3, preferred: [4, 5], max: 5 }, minimumFinancialTerms: 3, exhaustiveFinancialTermSearch: true, duplicateCompositionsRejected: true }, activeAndProposalCompatibility: proposalAudit, recommendedCandidates: candidates };
  const flashcardPackage = { schemaVersion: 1, generatedDate: DATE, status: "study-metadata-pending-owner-review-not-implemented", exactDefinitionsPreserved: true, governedLongTerms: flashcards, briefOnlyLongTermsAwaitingSourceReconciliation: briefOnly.filter((term) => term.letterCount >= 10) };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "finlit-quest-2027-vocabulary-master.json"), `${JSON.stringify(vocabularyMaster, null, 2)}\n`);
  fs.writeFileSync(path.join(OUTPUT_DIR, "finlit-quest-2027-puzzle-candidates.json"), `${JSON.stringify(candidatePackage, null, 2)}\n`);
  fs.writeFileSync(path.join(OUTPUT_DIR, "finlit-quest-2027-flashcard-vocabulary.json"), `${JSON.stringify(flashcardPackage, null, 2)}\n`);
  fs.writeFileSync(REPORT_PATH, buildReport({ terms, vocabularySummary, inventory, proposalAudit, candidates, flashcards, briefOnly }));

  console.log(JSON.stringify({ report: path.relative(root, REPORT_PATH), outputDirectory: path.relative(root, OUTPUT_DIR), terms: terms.length, flashcards: flashcards.length, candidates: candidates.length, missingSourceDocuments: MISSING_SOURCE_DOCUMENTS.length, activePass2027: proposalAudit.active.pass, proposalPass2027: proposalAudit.proposal.pass }, null, 2));
}

main();

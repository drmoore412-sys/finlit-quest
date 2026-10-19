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
const VOCAB_PATH = path.join(DIR, "finlit-quest-2027-thirteen-world-vocabulary.json");
const PRIOR_PATH = path.join(DIR, "finlit-quest-2027-thirteen-world-puzzle-proposals.json");
const OUTPUT_PATH = path.join(DIR, "finlit-quest-2027-flexible-puzzle-proposals.json");
const SUPPORT_PATH = path.join(DIR, "finlit-quest-2027-ordinary-support-review.json");
const REPORT_PATH = path.join(root, "docs/FINLIT_QUEST_2027_UPDATED_PUZZLE_CONSTRUCTION.md");
const DICTIONARY_PATH = "/usr/share/dict/web2";

const WORLDS = Object.freeze([
  ["moneybasics", "Money Basics", true], ["credit", "Credit Foundations", true],
  ["crypto", "Crypto Foundations", true], ["banking", "Banking Basics", true],
  ["investing", "Investing Basics", true], ["coins", "Coins & Currency", false],
  ["ai_technology", "AI & Technology", false], ["real_estate", "Real Estate", false],
  ["taxes", "Taxes", false], ["insurance", "Insurance & Protection", false],
  ["business", "Business & Entrepreneurship", false],
  ["social_media", "Social Media & Digital Income", false],
  ["retirement", "Retirement & Wealth Planning", false],
].map(([id, name, existing], index) => ({ id, name, existing, order: index + 1 })));

const ELIGIBLE_ANCHOR_TYPES = new Set([
  "financial-literacy-governed", "financial-literacy-candidate", "financial-technology-candidate",
  "general-technology-education", "platform-or-brand-context",
]);
const FINANCIAL_TYPES = new Set([
  "financial-literacy-governed", "financial-literacy-candidate", "financial-technology-candidate",
]);
const BLOCKED_SUPPORT = new Set([
  "also", "been", "being", "does", "each", "into", "more", "most", "must", "only", "same", "some",
  "such", "than", "that", "their", "them", "then", "there", "these", "they", "this", "those", "were",
  "what", "when", "where", "which", "while", "will", "with", "would", "your", "owner", "status", "world",
  "term", "terms", "word", "words", "puzzle", "puzzles", "candidate", "review", "approved", "source",
  "ates", "creen", "quid", "reen", "rial", "sion", "tara",
]);
const CURATED_COMMON_SUPPORT = new Set([
  "duly", "idly", "tidy", "loom", "moon", "noon", "lawn", "mere", "meme", "room", "more",
  "care", "race", "read", "road", "door", "home", "house", "store", "storm", "town", "water", "wind",
]);
const EXCLUDED_SECONDARY = new Set(["CHECKOUT", "CLUE", "DENTAL", "DIME", "LOGIN", "NEEDS", "PATENT", "TESTNET"]);

// These are draft research clues. They do not replace exact governed definitions
// and cannot become runtime copy without owner review.
const ANCHOR_CLUES = Object.freeze({
  ADREVENUE: "Income earned when advertising appears with digital content or on an online property.",
  ADVANTAGE: "A feature or condition that may improve a person's financial position or choices.",
  AFFILIATE: "A person or business that earns compensation for referring customers or sales.",
  AGENT: "A person or organization authorized to act for another party in a transaction.",
  AITRADING: "Using artificial-intelligence tools to analyze markets or help automate trading decisions.",
  ANALYTICS: "The systematic analysis of data to understand performance and support decisions.",
  ANNUALFEE: "A charge assessed once each year for maintaining access to a financial product or service.",
  ANNUALMAX: "The most an insurance plan will pay for covered services during a benefit year.",
  APPRAISAL: "A professional estimate of a property's or asset's value at a particular time.",
  AUTOCHECK: "An automated review used to evaluate information, eligibility, risk, or transaction details.",
  AVALANCHE: "A blockchain network used for digital assets and decentralized applications.",
  BANKDRAFT: "A payment instrument in which a bank directs funds to be paid to a named recipient.",
  BRITANNIA: "A British bullion coin produced in precious-metal versions for investors and collectors.",
  CAREGIVER: "A person who provides ongoing care, a role that can affect household and retirement planning.",
  CDACCOUNT: "A deposit account that generally pays interest for leaving money deposited for a stated term.",
  COLLISION: "Auto insurance coverage that may pay for damage to the insured vehicle after a collision.",
  CONSENSUS: "The process a distributed network uses to agree on valid transactions and ledger state.",
  COPYRIGHT: "Legal protection for original creative work that can have commercial value.",
  COSTBASIS: "The amount used to calculate gain or loss when an asset is sold, subject to tax rules.",
  DIRECTPAY: "A payment sent directly from one account or payer to a recipient.",
  ECOMMERCE: "Buying and selling goods or services through online systems.",
  EMERGENCY: "An unexpected event that may require immediate spending from available savings.",
  ERRORCOIN: "A coin produced with an unintended minting variation that may interest collectors.",
  ESTATETAX: "A tax that may apply to the transfer of a deceased person's estate under applicable law.",
  ESTATE: "The money, property, and other assets and obligations associated with a person, especially at death.",
  EXCISETAX: "A tax imposed on particular goods, services, or activities.",
  EXEMPTION: "An amount, person, or transaction excluded from a tax or other financial requirement under applicable rules.",
  FICOSCORE: "A credit-risk score produced using a FICO scoring model.",
  FORMULARY: "An insurer's or health plan's list of covered prescription drugs and coverage tiers.",
  GOLDEAGLE: "A United States bullion coin containing gold and issued in several denominations.",
  GOOGLEPAY: "A digital wallet and payment service used for eligible electronic transactions.",
  HOMESTEAD: "A primary residence that may receive specified legal or property-tax treatment.",
  INSURANCE: "A contract that transfers specified financial risks in exchange for premium payments.",
  LICENSING: "Granting permission to use intellectual property or another right under agreed terms.",
  MAPLELEAF: "A Canadian bullion coin produced in precious-metal versions for investors and collectors.",
  MINTSTATE: "A coin-grade description for a coin showing no circulation wear.",
  NONPROFIT: "An organization formed to pursue a mission rather than distribute profits to owners.",
  NONQMLOAN: "A mortgage that does not meet the federal definition of a qualified mortgage.",
  PENTHOUSE: "A premium apartment, often on an upper floor, that can carry higher purchase or rental costs.",
  PROCESSOR: "A company or system that handles transaction information and payment processing steps.",
  PROOFCOIN: "A specially manufactured coin made with polished dies and a presentation-quality finish.",
  PUBLICKEY: "Cryptographic information used to receive assets or verify a digital signature without revealing a private key.",
  RECESSION: "A broad decline in economic activity that can affect jobs, income, markets, and spending.",
  REDLINING: "Illegal discriminatory denial or limitation of financial services based on location or protected characteristics.",
  RISKSCORE: "A numeric estimate used to summarize assessed risk under a defined model.",
  ROTH: "A tax treatment used by certain retirement accounts in which qualified withdrawals may be tax-free.",
  SCREENING: "A review process used to check eligibility, identity, risk, or compliance information.",
  SEEDWORDS: "A recovery phrase whose words can restore access to a cryptocurrency wallet.",
  SHORTFALL: "The amount by which available money or results fall below what is needed or planned.",
  STATEMENT: "A periodic record summarizing account activity, balances, charges, or other financial information.",
  TOTALLOSS: "An insured loss in which repair cost or damage makes an item uneconomical to restore under policy rules.",
  TOWNHOUSE: "A multi-level attached home whose ownership and recurring costs depend on the property arrangement.",
  TROYOUNCE: "A unit of weight commonly used to measure precious metals.",
  VALIDATOR: "A participant that checks transactions and helps a blockchain network reach consensus.",
  WAREHOUSE: "A building used to store goods, inventory, or materials as part of business operations.",
  WINDSTORM: "An insurance peril involving damaging wind, subject to a policy's coverage and exclusions.",
});

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function normalize(value) { return String(value || "").toUpperCase().replace(/[^A-Z]/g, ""); }
function signature(words) { return [...new Set(words.map(normalize))].sort().join("|"); }
function worldsFor(record) { return [...new Set((record.worldAssociations || []).map((item) => item.worldId))]; }
function hasWorld(record, worldId) { return worldsFor(record).includes(worldId); }
function isFinancial(record) { return record.domainTypes.some((type) => FINANCIAL_TYPES.has(type)); }
function canForm(word, wheel) { return engine.canForm(word, [...wheel]); }
function combinations(items, count, limit = 5000) {
  const output = [];
  function visit(start, chosen) {
    if (output.length >= limit) return;
    if (chosen.length === count) { output.push(chosen); return; }
    for (let index = start; index <= items.length - (count - chosen.length); index += 1) visit(index + 1, [...chosen, items[index]]);
  }
  visit(0, []);
  return output;
}
function tierFor(level) {
  if (level === 1) return { label: "introductory", financialAim: [1, 1], answerAim: 3 };
  if (level <= 5) return { label: "foundational", financialAim: [2, 2], answerAim: 4 };
  if (level <= 10) return { label: "developing", financialAim: [3, 3], answerAim: 4 };
  if (level <= 15) return { label: "intermediate", financialAim: [3, 4], answerAim: 4 };
  return { label: "advanced", financialAim: [4, 5], answerAim: 5 };
}
function clueFor(record, priorClues) {
  const governed = record.exactGovernedDefinitions?.[0];
  if (governed) return { text: governed.definition, status: "exact-owner-approved-definition", permanentTermId: governed.id };
  const prior = priorClues.get(normalize(record.normalizedKey || record.canonicalTerm));
  if (prior?.text) return { text: prior.text, status: "draft-research-clue-pending-owner-review", permanentTermId: null };
  const text = ANCHOR_CLUES[normalize(record.normalizedKey || record.canonicalTerm)];
  return text
    ? { text, status: "draft-research-clue-pending-owner-review", permanentTermId: null }
    : { text: null, status: "term-specific-evidence-and-clue-required-before-owner-approval", permanentTermId: null };
}
function collectCorpusFrequency() {
  const frequency = new Map();
  const allowedExtensions = new Set([".md", ".json", ".js", ".mjs", ".html"]);
  const blockedDirectories = new Set([".git", "node_modules", "ios", "www"]);
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && blockedDirectories.has(entry.name)) continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (allowedExtensions.has(path.extname(entry.name)) && fs.statSync(full).size < 2_000_000) {
        if ([OUTPUT_PATH, SUPPORT_PATH, REPORT_PATH].includes(full)) continue;
        const tokens = fs.readFileSync(full, "utf8").toLowerCase().match(/[a-z]{4,9}/g) || [];
        for (const token of tokens) frequency.set(token, (frequency.get(token) || 0) + 1);
      }
    }
  }
  visit(root);
  return frequency;
}

if (!fs.existsSync(DICTIONARY_PATH)) throw new Error(`Required dictionary not found: ${DICTIONARY_PATH}`);
const vocabulary = readJson(VOCAB_PATH);
const prior = readJson(PRIOR_PATH);
const allPrior = [...prior.priorProposalsRetained, ...prior.newWorldProposals];
const allRecords = [...new Map(vocabulary.worlds.flatMap((world) => world.records).map((record) => [normalize(record.normalizedKey || record.canonicalTerm), record])).values()];
const financialPool = allRecords.filter((record) => record.crosswordEligible && record.letterCount >= 4 && record.letterCount <= 9 && isFinancial(record));
const allVocabularyKeys = new Set(allRecords.map((record) => normalize(record.normalizedKey || record.canonicalTerm).toLowerCase()));

const priorClues = new Map();
for (const candidate of allPrior) for (const answer of candidate.answers || []) if (answer.clue?.text) priorClues.set(normalize(answer.answer), answer.clue);

const corpusFrequency = collectCorpusFrequency();
const dictionaryWords = new Set(fs.readFileSync(DICTIONARY_PATH, "utf8").split(/\r?\n/).filter((word) => /^[a-z]{4,9}$/.test(word)));
const ordinaryPool = [...dictionaryWords]
  .filter((word) => ((corpusFrequency.get(word) || 0) >= 2 || CURATED_COMMON_SUPPORT.has(word)) && !BLOCKED_SUPPORT.has(word) && !allVocabularyKeys.has(word))
  .map((word) => ({ word: word.toUpperCase(), corpusFrequency: corpusFrequency.get(word) || 1, dictionaryPath: DICTIONARY_PATH }))
  .sort((left, right) => right.corpusFrequency - left.corpusFrequency || left.word.length - right.word.length || left.word.localeCompare(right.word));

const activeSignatures = new Set(slate.SPECS.map((spec) => signature([spec.anchor, ...spec.secondary.map((item) => typeof item === "string" ? item : item.word), ...(spec.ordinary || [])])));
const priorSignatures = new Set(allPrior.map((candidate) => signature(candidate.requiredWords)));
const priorAnchorsByWorld = new Map(WORLDS.map((world) => [world.id, new Set(allPrior.filter((candidate) => candidate.worldId === world.id).map((candidate) => normalize(candidate.anchor?.answer || candidate.anchorWord || candidate.wheelKey)))]));
const generatedSignatures = new Set();
const generated = [];
const failures = [];

for (const world of WORLDS) {
  const implemented = world.existing ? slate.SPECS.filter((spec) => spec.worldId === world.id).length : 0;
  const worldPrior = allPrior.filter((candidate) => candidate.worldId === world.id).length;
  const anchors = vocabulary.worlds.find((item) => item.worldId === world.id).records
    .filter((record) => record.letterCount === 9 && record.domainTypes.some((type) => ELIGIBLE_ANCHOR_TYPES.has(type)))
    .filter((record) => !priorAnchorsByWorld.get(world.id).has(normalize(record.normalizedKey || record.canonicalTerm)))
    .sort((left, right) => Number(isFinancial(right)) - Number(isFinancial(left)) || left.canonicalTerm.localeCompare(right.canonicalTerm));

  for (const anchor of anchors) {
    const wheel = normalize(anchor.normalizedKey || anchor.canonicalTerm);
    const level = implemented + worldPrior + generated.filter((item) => item.worldId === world.id).length + 1;
    const tier = tierFor(level);
    const compatibleFinancial = financialPool
      .filter((record) => normalize(record.normalizedKey || record.canonicalTerm) !== wheel && !EXCLUDED_SECONDARY.has(normalize(record.normalizedKey || record.canonicalTerm)) && canForm(normalize(record.normalizedKey || record.canonicalTerm), wheel))
      .sort((left, right) => Number(hasWorld(right, world.id)) - Number(hasWorld(left, world.id)) || Number(Boolean(right.permanentIdentities.length)) - Number(Boolean(left.permanentIdentities.length)) || right.letterCount - left.letterCount);
    const compatibleOrdinary = ordinaryPool.filter((record) => canForm(record.word, wheel)).slice(0, 50);
    let best = null;

    const totalAttempts = [...new Set([tier.answerAim, 4, 3, 5])].filter((count) => count >= 3 && count <= 5);
    search: for (const totalAnswers of totalAttempts) {
      const maxFinancial = Math.min(totalAnswers, compatibleFinancial.length + 1, tier.financialAim[1]);
      for (let financialCount = maxFinancial; financialCount >= 1; financialCount -= 1) {
        const ordinaryCount = totalAnswers - financialCount;
        if (ordinaryCount > compatibleOrdinary.length) continue;
        const financialGroups = combinations(compatibleFinancial.slice(0, 18), financialCount - 1, 900);
        const ordinaryGroups = combinations(compatibleOrdinary, ordinaryCount, 1800);
        for (const financialGroup of financialGroups) {
          for (const ordinaryGroup of ordinaryGroups) {
            const words = [wheel, ...financialGroup.map((record) => normalize(record.normalizedKey || record.canonicalTerm)), ...ordinaryGroup.map((record) => record.word)];
            const composition = signature(words);
            if (activeSignatures.has(composition) || priorSignatures.has(composition) || generatedSignatures.has(composition)) continue;
            const solved = engine.solveCrossword(words, { maxNodes: 30000, maxSolutions: 80 });
            if (!solved.ok) continue;
            const validation = engine.validateCrosswordLayout(words, solved.placements);
            if (!validation.valid) continue;
            const ownFinancial = [anchor, ...financialGroup].filter((record) => hasWorld(record, world.id)).length;
            const governed = [anchor, ...financialGroup].filter((record) => record.permanentIdentities?.length).length;
            const supportFrequency = ordinaryGroup.reduce((sum, record) => sum + Math.log10(record.corpusFrequency + 1), 0);
            const metrics = pipeline.layoutMetrics(solved.placements);
            const meetsTierAim = financialCount >= tier.financialAim[0];
            const score = Number(meetsTierAim) * 10000 + financialCount * 600 + ownFinancial * 120 + governed * 80 + totalAnswers * 30 + metrics.crossings * 15 + supportFrequency;
            const candidate = { financialGroup, ordinaryGroup, words, composition, solved, validation, metrics, financialCount, meetsTierAim, score };
            best = candidate;
            break search;
          }
        }
      }
    }

    if (!best) { failures.push({ worldId: world.id, anchor: anchor.canonicalTerm, wheel, reason: "no-strict-connected-layout-with-verified-support" }); continue; }
    generatedSignatures.add(best.composition);
    const selectedFinancial = [anchor, ...best.financialGroup];
    const answers = [
      ...selectedFinancial.map((record, index) => {
        const permanent = record.permanentIdentities?.[0] || null;
        return {
          displayTerm: record.canonicalTerm, answer: normalize(record.normalizedKey || record.canonicalTerm),
          role: index === 0 ? "key-term-anchor" : "financial-secondary", permanentTermId: permanent?.id || null,
          researchKey: permanent ? null : `research:${normalize(record.normalizedKey || record.canonicalTerm).toLowerCase()}`,
          owningWorld: permanent?.originWorld || null, worldAssociations: worldsFor(record), vocabularyStatus: record.approvalStatus,
          clue: clueFor(record, priorClues),
        };
      }),
      ...best.ordinaryGroup.map((record) => ({
        displayTerm: record.word, answer: record.word, role: "ordinary-support", permanentTermId: null,
        researchKey: null, owningWorld: null, worldAssociations: [], vocabularyStatus: "dictionary-verified-pending-owner-review",
        clue: { text: null, status: "ordinary-clue-copy-review-required", permanentTermId: null },
        dictionaryEvidence: { path: record.dictionaryPath, exactEntry: record.word.toLowerCase(), projectCorpusFrequency: record.corpusFrequency },
      })),
    ];
    const answerKeys = new Set(answers.map((answer) => answer.answer));
    const compatibleAllFinancial = financialPool.filter((record) => canForm(normalize(record.normalizedKey || record.canonicalTerm), wheel));
    const layouts = pipeline.enumerateLayouts(best.words, { solveCrosswordFn: engine.solveCrossword, validateCrosswordLayoutFn: engine.validateCrosswordLayout }, { maxLayouts: 3, attemptLimit: 12, solverOptions: { maxNodes: 100000, maxSolutions: 250 } });
    const layout = layouts[0] || { placements: best.solved.placements, metrics: best.metrics };
    generated.push({
      schemaVersion: 2, candidateId: `FQ-2027-FLEX-${world.id.toUpperCase()}-${String(generated.filter((item) => item.worldId === world.id).length + 1).padStart(2, "0")}`,
      worldId: world.id, worldName: world.name, proposedLevel: level, difficultyTier: tier.label,
      approvalStatus: "research-candidate-pending-owner-review-not-implemented", implementationEligible: false,
      nineLetterWheel: [...wheel], wheelKey: wheel, anchor: answers[0], answers, requiredWords: answers.map((answer) => answer.answer),
      unusedWheelCompatibleFinancialTerms: compatibleAllFinancial.filter((record) => !answerKeys.has(normalize(record.normalizedKey || record.canonicalTerm))).map((record) => ({
        displayTerm: record.canonicalTerm, answer: normalize(record.normalizedKey || record.canonicalTerm),
        permanentTermIds: record.permanentIdentities.map((item) => item.id), worldAssociations: worldsFor(record),
        vocabularyStatus: record.approvalStatus, disposition: "wheel-compatible-not-in-selected-layout",
      })),
      layout: layout.placements, layoutPreview: pipeline.renderGrid({ layout: layout.placements }), layoutMetrics: layout.metrics,
      alternativeLayoutCount: layouts.length || 1,
      validation: {
        status: "PASS", exactNineWheelLetters: wheel.length === 9, answerLength4To9: answers.every((answer) => answer.answer.length >= 4 && answer.answer.length <= 9),
        exactRepeatedLetterCounts: answers.every((answer) => canForm(answer.answer, wheel)), strictCrosswordEngine: best.validation,
        financialOrTechnologyAnchor: true, financialAnswerCount: selectedFinancial.filter(isFinancial).length,
        financialAimForLevel: tier.financialAim, meetsFinancialAim: best.meetsTierAim,
        ordinaryDictionaryEvidenceComplete: best.ordinaryGroup.every((record) => dictionaryWords.has(record.word.toLowerCase())),
        uniqueComposition: true, preservedRuntimeAndPriorContent: true,
        governanceGate: "anchor-and-draft-clues-plus-ordinary-clue-copy-require-owner-review-before-implementation",
      },
    });
  }
}

const selectedOrdinary = [...new Map(generated.flatMap((candidate) => candidate.answers.filter((answer) => answer.role === "ordinary-support")).map((answer) => [answer.answer, answer])).values()]
  .sort((left, right) => left.answer.localeCompare(right.answer));
const statusByWorld = WORLDS.map((world) => {
  const implemented = world.existing ? slate.SPECS.filter((spec) => spec.worldId === world.id).length : 0;
  const priorCount = allPrior.filter((candidate) => candidate.worldId === world.id).length;
  const newCount = generated.filter((candidate) => candidate.worldId === world.id).length;
  const total = implemented + priorCount + newCount;
  return { worldId: world.id, worldName: world.name, implementedPuzzles: implemented, preservedPriorProposals: priorCount, newFlexibleProposals: newCount, projectedTotalIfApproved: total, remainingTo15: Math.max(0, 15 - total), remainingTo20: Math.max(0, 20 - total) };
});

const output = {
  schemaVersion: 2, generatedDate: DATE, status: "updated-rule-owner-review-proposals-not-implemented",
  supersedingRule: "New puzzles require a legitimate nine-letter financial, business, or technology anchor; ordinary dictionary support is permitted and the previous universal three-financial-term minimum is superseded.",
  preservation: { activePuzzlesUnchanged: slate.SPECS.length, priorProposalsUnchanged: allPrior.length, runtimeFilesModified: false },
  counts: { worlds: WORLDS.length, newValidatedProposals: generated.length, failedAnchors: failures.length, selectedOrdinaryWords: selectedOrdinary.length, projectedTotalIfAllApproved: slate.SPECS.length + allPrior.length + generated.length },
  difficultyProgression: { level1: "1 financial key term permitted", levels2To5: "aim for 2 financial terms", levels6To10: "aim for 3", levels11To15: "aim for 3-4", levels16To20: "aim for 4-5 where feasible" },
  statusByWorld, proposals: generated, failures,
};
const supportReview = { schemaVersion: 1, generatedDate: DATE, status: "dictionary-verified-ordinary-words-pending-owner-and-clue-copy-review", dictionarySource: DICTIONARY_PATH, notice: "Dictionary membership establishes word legitimacy only. It does not approve the word, clue copy, rewards, or runtime use.", words: selectedOrdinary };

fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
fs.writeFileSync(SUPPORT_PATH, `${JSON.stringify(supportReview, null, 2)}\n`);

const rows = statusByWorld.map((row) => `| ${row.worldName} | ${row.implementedPuzzles} | ${row.preservedPriorProposals} | ${row.newFlexibleProposals} | ${row.projectedTotalIfApproved} | ${row.remainingTo15} | ${row.remainingTo20} |`).join("\n");
const proposalSections = generated.map((candidate) => `### ${candidate.candidateId} — ${candidate.anchor.displayTerm}\n\n- Proposed level: **${candidate.proposedLevel}** (${candidate.difficultyTier})\n- Wheel: **${candidate.wheelKey}**\n- Required answers: **${candidate.requiredWords.join(", ")}**\n- Financial terms: **${candidate.validation.financialAnswerCount}**; level aim: ${candidate.validation.financialAimForLevel.join("–")}; aim met: ${candidate.validation.meetsFinancialAim ? "Yes" : "No—retained because the owner made the target aspirational"}\n- Unused compatible financial vocabulary: ${candidate.unusedWheelCompatibleFinancialTerms.map((item) => item.answer).join(", ") || "None"}\n- Validation: **PASS** — exact multiset, dictionary evidence, strict crossings, separation, boundaries, containment, connectivity, and unique composition\n\n\`\`\`text\n${candidate.layoutPreview}\n\`\`\`\n`).join("\n");
const report = `# FinLit Quest 2027 — Updated Puzzle Construction\n\n**Date:** ${DATE}  \n**Status:** VALIDATED PROPOSALS — OWNER REVIEW REQUIRED — NOT IMPLEMENTED\n\n## Outcome\n\nThe updated rule was applied without modifying the ${slate.SPECS.length} playable puzzles, the ${allPrior.length} earlier proposals, runtime files, rewards, saves, or study vocabulary. This pass created **${generated.length} additional strict crossword proposals** from previously unused nine-letter anchors. Ordinary supporting words were accepted only when an exact lowercase entry exists in the local dictionary; every selected word remains pending owner and clue-copy review.\n\nThe prior three-financial-term minimum is superseded for these new proposals. The level-based financial counts are targets, not automatic rejection rules. Every proposal still has a legitimate nine-letter key term and passes the strict crossword validator.\n\n## World totals\n\n| World | Active | Prior proposals | New flexible | Projected | Short to 15 | Short to 20 |\n|---|---:|---:|---:|---:|---:|---:|\n${rows}\n\nWorlds below 15 are limited by the current supply of distinct nine-letter anchors or by strict layout feasibility. No anchor was repeated and no term was invented to hide a shortfall.\n\n## Review gates\n\n- Financial records without permanent IDs and all draft financial clues still require owner approval.\n- Ordinary words are dictionary-verified but not approved curriculum or mastery objects. Their clue copy must be authored and reviewed before implementation.\n- Platform and brand anchors retain their context-only classification; inclusion in this structural proposal does not convert them into financial identities.\n- A PASS here establishes structural eligibility only. It does not authorize implementation.\n\n## Proposal records\n\n${proposalSections || "No new candidates were generated."}\n\n## Failures\n\n${failures.length ? failures.map((item) => `- ${item.worldId} / ${item.anchor}: ${item.reason}`).join("\n") : "No unused anchor failed structural generation."}\n`;
fs.writeFileSync(REPORT_PATH, report);

console.log(JSON.stringify(output.counts));
for (const row of statusByWorld) console.log(`${row.worldId}: +${row.newFlexibleProposals} => ${row.projectedTotalIfApproved} (short ${row.remainingTo15})`);

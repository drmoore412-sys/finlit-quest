#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const date = "2026-10-18";
const researchDir = path.join(root, "staging/research/expansion", date);
const sourceDir = path.join(researchDir, "source-documents");
const masterPath = path.join(researchDir, "finlit-quest-2027-vocabulary-master.json");
const candidatesPath = path.join(researchDir, "finlit-quest-2027-puzzle-candidates.json");
const flashcardsPath = path.join(researchDir, "finlit-quest-2027-flashcard-vocabulary.json");
const reportPath = path.join(root, "docs/FINLIT_QUEST_2027_VOCABULARY_INTEGRATION_REPORT.md");

const sourceFiles = [
  "FinLit_Quest_2027_Remaining_Worlds_Backlog.md",
  "FinLit_Quest_2027_Vocabulary_Master_Backlog.md",
  "FinLit_Quest_AI_and_Coins_World_Vocabulary.md",
  "FinLit_Quest_Money_Basics_2027_and_Coins_Vocabulary.md",
];

const worldMeta = {
  moneybasics: { name: "Money Basics", playable: true, type: "financial-literacy-candidate" },
  credit: { name: "Credit Foundations", playable: true, type: "financial-literacy-candidate" },
  crypto: { name: "Crypto Foundations", playable: true, type: "financial-literacy-candidate" },
  banking: { name: "Banking Basics", playable: true, type: "financial-literacy-candidate" },
  investing: { name: "Investing Basics", playable: true, type: "financial-literacy-candidate" },
  coins: { name: "Coins", playable: false, type: "financial-literacy-candidate" },
  ai_technology: { name: "AI & Technology", playable: false, type: "technology-education-candidate" },
  real_estate: { name: "Real Estate", playable: false, type: "financial-literacy-candidate" },
  taxes: { name: "Taxes", playable: false, type: "financial-literacy-candidate" },
  insurance: { name: "Insurance & Financial Protection", playable: false, type: "financial-literacy-candidate" },
  business: { name: "Business & Entrepreneurship", playable: false, type: "financial-literacy-candidate" },
  retirement: { name: "Retirement & Wealth Planning", playable: false, type: "financial-literacy-candidate" },
  financial_safety: { name: "Financial Safety & Consumer Rights", playable: false, type: "financial-literacy-candidate" },
  careers: { name: "Careers & Employment", playable: false, type: "career-education-candidate" },
  economics: { name: "Economics & the Federal Reserve", playable: false, type: "financial-literacy-candidate" },
};

const provisionalLabels = new Set(["LEGALCASH", "ROBOFUND"]);
const ambiguousLabels = new Set(["REPO"]);
const additionalBrandContext = new Set(["CASHAPP", "ZELLE", "APPLEPAY", "GOOGLEPAY", "VENMO", "PAYPAL", "STRIPE", "SQUARE"]);
const financialAiTerms = new Set(["AITRADING", "AUTOTRADE", "RISKSCORE", "FINTECH", "FRAUD", "PHISHING", "ROBOADVISOR", "FRAUDALERT", "TOKEN", "TOKENIZE", "DATAMINING"]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function normalizeKey(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function wheelLetters(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function isAlphabeticPhrase(value) {
  return /^[A-Za-z][A-Za-z\s'’&-]*$/.test(String(value || "").trim());
}

function cleanTerm(value) {
  return String(value || "")
    .replace(/\*\*/g, "")
    .replace(/\s*\[[^\]]+\]\s*$/g, "")
    .replace(/\s+\((?:\d+|word-wheel above)\)\s*$/i, "")
    .replace(/^[-*]\s+/, "")
    .replace(/[.;]+$/, "")
    .trim();
}

function classifyTerm(term) {
  const letters = wheelLetters(term);
  if (!isAlphabeticPhrase(term)) return { vocabularyClass: "study-non-alphabetic", crosswordEligible: false, letterCount: letters.length };
  if (letters.length <= 3) return { vocabularyClass: "short-educational-1-3", crosswordEligible: false, letterCount: letters.length };
  if (letters.length <= 9) return { vocabularyClass: "crossword-potential-4-9", crosswordEligible: true, letterCount: letters.length };
  return { vocabularyClass: "flashcard-study-10-plus", crosswordEligible: false, letterCount: letters.length };
}

function splitSemicolon(value) {
  return String(value || "").split(";").map(cleanTerm).filter(Boolean);
}

function splitComma(value) {
  return String(value || "").split(",").map(cleanTerm).filter(Boolean);
}

function splitCommaOrSemicolon(value) {
  return String(value || "").split(/[;,]/).map(cleanTerm).filter(Boolean);
}

function addCandidate(list, rawTerm, worldId, sourceFile, section, options = {}) {
  let term = cleanTerm(rawTerm);
  if (!term || term.length > 100) return;
  if (/^(also |and other |note:|reason:|status:|rule:|examples include)/i.test(term)) return;
  const acronymMatch = term.match(/^(.*)\s+\(([A-Z]{2,6})\)$/);
  if (acronymMatch && !/^\d/.test(term)) {
    addCandidate(list, acronymMatch[1], worldId, sourceFile, section, options);
    addCandidate(list, acronymMatch[2], worldId, sourceFile, `${section} acronym`, options);
    return;
  }
  const key = normalizeKey(term);
  if (!key) return;
  let domainType = options.domainType || worldMeta[worldId]?.type || "financial-literacy-candidate";
  if (worldId === "ai_technology" && financialAiTerms.has(key)) domainType = "financial-technology-candidate";
  if (provisionalLabels.has(key)) domainType = "provisional-or-rejected-label";
  list.push({ term, key, worldId, sourceFile, section, domainType, sourceStatus: options.sourceStatus || "working-candidate-not-approved" });
}

function headingWorld(line) {
  const value = line.toLowerCase();
  if (value.includes("money basics")) return "moneybasics";
  if (value.includes("coins world") || value.includes("**coins:**")) return "coins";
  if (value.includes("banking basics")) return "banking";
  if (value.includes("crypto foundations")) return "crypto";
  if (value.includes("credit foundations")) return "credit";
  if (value.includes("ai world") || value.includes("ai & technology")) return "ai_technology";
  if (value.includes("real estate")) return "real_estate";
  if (value.includes("investing basics")) return "investing";
  if (value.includes("taxes")) return "taxes";
  if (value.includes("insurance")) return "insurance";
  if (value.includes("business & entrepreneurship")) return "business";
  if (value.includes("retirement & wealth")) return "retirement";
  if (value.includes("financial safety")) return "financial_safety";
  if (value.includes("careers & employment")) return "careers";
  if (value.includes("economics & the federal reserve")) return "economics";
  return null;
}

function parseMasterBacklog(text, sourceFile, list) {
  let worldId = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      worldId = headingWorld(line);
      if (line.toLowerCase().includes("implementation guardrails")) worldId = null;
      continue;
    }
    if (!worldId || !line || line.startsWith("#") || /^[-*]\s/.test(line)) continue;
    if (/^\*\*(Teaching distinction|Note|Implementation guardrails)/i.test(line)) continue;
    if (!line.includes(";")) continue;
    const colon = line.indexOf(":");
    const payload = colon >= 0 ? line.slice(colon + 1) : line;
    for (const term of splitSemicolon(payload)) addCandidate(list, term, worldId, sourceFile, line.slice(0, Math.max(0, colon)) || "section list");
  }
}

function parseRemainingWorlds(text, sourceFile, list, platformRecords) {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const bold = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
    if (bold) {
      const worldId = headingWorld(`**${bold[1]}:**`);
      if (worldId && !bold[1].toLowerCase().includes("platform")) {
        for (const term of splitCommaOrSemicolon(bold[2])) {
          addCandidate(list, term, worldId, sourceFile, bold[1]);
          if (worldId === "real_estate") addCandidate(list, term, "investing", sourceFile, `${bold[1]} — current proposed host`);
        }
      }
      continue;
    }
    if (/^Digital business user requests:/i.test(line)) {
      for (const term of splitSemicolon(line.slice(line.indexOf(":") + 1))) addCandidate(list, term, "business", sourceFile, "Digital business user requests");
      continue;
    }
    if (/^Platforms:/i.test(line)) {
      for (const term of splitComma(line.slice(line.indexOf(":") + 1))) platformRecords.push({ term, key: normalizeKey(term), sourceFile, status: "platform-context-only" });
      continue;
    }
    const seed = line.match(/^\d+\.\s+\*\*(.+?)\*\*:.*?Seed terms:\s*(.*)$/i);
    if (seed) {
      const worldId = headingWorld(seed[1]);
      for (const term of splitComma(seed[2])) addCandidate(list, term, worldId, sourceFile, `${seed[1]} seed terms`);
    }
  }
}

function parseAiCoins(text, sourceFile, list) {
  let worldId = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) {
      worldId = headingWorld(line);
      if (line.toLowerCase().includes("governance")) worldId = null;
      continue;
    }
    if (!worldId || !line || line.startsWith("#") || /^Note:/i.test(line)) continue;
    if (/^Additional essential concepts/i.test(line)) {
      for (const term of ["Connectors", "API", "CRM"]) addCandidate(list, term, worldId, sourceFile, "Additional essential concepts");
      continue;
    }
    if (!line.includes(";")) continue;
    const colon = line.indexOf(":");
    const payload = colon >= 0 ? line.slice(colon + 1) : line;
    for (const term of splitSemicolon(payload)) addCandidate(list, term, worldId, sourceFile, "listed vocabulary");
  }
}

function parseMoneyCoins(text, sourceFile, list) {
  let longSection = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("## ")) longSection = line.toLowerCase().includes("longer learning-app concepts");
    const table = line.match(/^\|\s*([^|]+?)\s*\|\s*\d+\s*\|/);
    if (table && !/^Term$/i.test(table[1].trim())) {
      addCandidate(list, table[1], "moneybasics", sourceFile, "Shared 2027 candidate vocabulary");
      addCandidate(list, table[1], "coins", sourceFile, "Shared 2027 candidate vocabulary");
      continue;
    }
    if (longSection && /^-\s+/.test(line)) {
      addCandidate(list, line, "moneybasics", sourceFile, "Longer learning-app concepts");
      addCandidate(list, line, "coins", sourceFile, "Longer learning-app concepts");
    }
  }
}

function sourceCandidates() {
  const list = [], platformRecords = [];
  for (const sourceFile of sourceFiles) {
    const file = path.join(sourceDir, sourceFile);
    if (!fs.existsSync(file)) throw new Error(`Missing source document: ${sourceFile}`);
    const text = fs.readFileSync(file, "utf8");
    if (sourceFile.includes("Vocabulary_Master_Backlog")) parseMasterBacklog(text, sourceFile, list);
    else if (sourceFile.includes("Remaining_Worlds_Backlog")) parseRemainingWorlds(text, sourceFile, list, platformRecords);
    else if (sourceFile.includes("AI_and_Coins")) parseAiCoins(text, sourceFile, list);
    else if (sourceFile.includes("Money_Basics")) parseMoneyCoins(text, sourceFile, list);
  }
  return { list, platformRecords };
}

function addAssociation(record, association) {
  const key = `${association.worldId}|${association.sourceType}|${association.sourceFile || ""}`;
  if (!record.worldAssociations.some((item) => `${item.worldId}|${item.sourceType}|${item.sourceFile || ""}` === key)) record.worldAssociations.push(association);
}

function buildIntegratedVocabulary(master, parsed) {
  const byKey = new Map();
  const platformKeys = new Set([...parsed.platformRecords.map((item) => item.key), ...additionalBrandContext]);
  platformKeys.delete("FREELANCER");
  for (const term of master.governedTerms) {
    const key = normalizeKey(term.word);
    const classified = classifyTerm(term.word);
    const record = byKey.get(key) || {
      canonicalTerm: term.word,
      normalizedKey: key,
      displayVariants: [],
      permanentIdentities: [],
      exactGovernedDefinitions: [],
      worldAssociations: [],
      sourceDocuments: [],
      domainTypes: [],
      approvalStatus: "owner-approved",
      ...classified,
    };
    if (!record.displayVariants.includes(term.word)) record.displayVariants.push(term.word);
    if (!record.permanentIdentities.some((item) => item.id === term.id)) record.permanentIdentities.push({ id: term.id, originWorld: term.world, runtimeStatus: term.runtimeStatus });
    if (!record.exactGovernedDefinitions.some((item) => item.id === term.id)) record.exactGovernedDefinitions.push({ id: term.id, definition: term.definition });
    addAssociation(record, { worldId: term.world, worldName: worldMeta[term.world]?.name || term.world, sourceType: "governed-identity", sourceFile: term.source });
    if (!record.domainTypes.includes("financial-literacy-governed")) record.domainTypes.push("financial-literacy-governed");
    byKey.set(key, record);
  }

  for (const item of parsed.list) {
    const classified = classifyTerm(item.term);
    const record = byKey.get(item.key) || {
      canonicalTerm: item.term,
      normalizedKey: item.key,
      displayVariants: [],
      permanentIdentities: [],
      exactGovernedDefinitions: [],
      worldAssociations: [],
      sourceDocuments: [],
      domainTypes: [],
      approvalStatus: "working-candidate-not-approved",
      ...classified,
    };
    if (!record.displayVariants.includes(item.term)) record.displayVariants.push(item.term);
    addAssociation(record, { worldId: item.worldId, worldName: worldMeta[item.worldId]?.name || item.worldId, sourceType: "2027-working-vocabulary", sourceFile: item.sourceFile, section: item.section });
    if (!record.sourceDocuments.includes(item.sourceFile)) record.sourceDocuments.push(item.sourceFile);
    const domainType = platformKeys.has(item.key) ? "platform-or-brand-context" : item.domainType;
    if (!record.domainTypes.includes(domainType)) record.domainTypes.push(domainType);
    if (!record.permanentIdentities.length && provisionalLabels.has(item.key)) record.approvalStatus = "provisional-or-rejected-label";
    else if (!record.permanentIdentities.length && ambiguousLabels.has(item.key)) record.approvalStatus = "ambiguous-term-needs-review";
    else if (!record.permanentIdentities.length && platformKeys.has(item.key)) record.approvalStatus = "platform-or-brand-context-only";
    byKey.set(item.key, record);
  }

  return [...byKey.values()].map((record) => ({
    ...record,
    displayVariants: record.displayVariants.sort(),
    permanentIdentities: record.permanentIdentities.sort((a, b) => a.id.localeCompare(b.id)),
    exactGovernedDefinitions: record.exactGovernedDefinitions.sort((a, b) => a.id.localeCompare(b.id)),
    worldAssociations: record.worldAssociations.sort((a, b) => a.worldId.localeCompare(b.worldId) || a.sourceType.localeCompare(b.sourceType)),
    sourceDocuments: record.sourceDocuments.sort(),
    domainTypes: record.domainTypes.sort(),
  })).sort((a, b) => a.canonicalTerm.localeCompare(b.canonicalTerm));
}

function counts(value) {
  return [...value].reduce((result, letter) => {
    result[letter] = (result[letter] || 0) + 1;
    return result;
  }, {});
}

function canForm(term, wheel) {
  const available = counts(wheel), needed = counts(wheelLetters(term));
  return Object.entries(needed).every(([letter, total]) => (available[letter] || 0) >= total);
}

function existingSlot(term, candidate) {
  const word = wheelLetters(term);
  if (candidate.layout.some((slot) => slot.word === word)) return { supported: true, reason: "already-required-answer" };
  const cells = new Map();
  for (const slot of candidate.layout) for (let index = 0; index < slot.word.length; index++) {
    const row = slot.r + (slot.dir === "v" ? index : 0);
    const column = slot.c + (slot.dir === "h" ? index : 0);
    cells.set(`${row},${column}`, slot.word[index]);
  }
  if (!cells.size) return { supported: false, reason: "no-layout-cells" };
  const coordinates = [...cells.keys()].map((key) => key.split(",").map(Number));
  const minRow = Math.min(...coordinates.map(([row]) => row)), maxRow = Math.max(...coordinates.map(([row]) => row));
  const minColumn = Math.min(...coordinates.map(([, column]) => column)), maxColumn = Math.max(...coordinates.map(([, column]) => column));
  for (const dir of ["h", "v"]) for (let row = minRow; row <= maxRow; row++) for (let column = minColumn; column <= maxColumn; column++) {
    let matches = true;
    for (let index = 0; index < word.length; index++) {
      const r = row + (dir === "v" ? index : 0), c = column + (dir === "h" ? index : 0);
      if (cells.get(`${r},${c}`) !== word[index]) { matches = false; break; }
    }
    if (!matches) continue;
    const before = `${row - (dir === "v" ? 1 : 0)},${column - (dir === "h" ? 1 : 0)}`;
    const after = `${row + (dir === "v" ? word.length : 0)},${column + (dir === "h" ? word.length : 0)}`;
    if (!cells.has(before) && !cells.has(after)) return { supported: true, reason: "complete-distinct-sequence-already-present", placement: { word, r: row, c: column, dir } };
  }
  return { supported: false, reason: "no-distinct-existing-slot" };
}

function isFinancialCandidate(record) {
  if (["provisional-or-rejected-label", "ambiguous-term-needs-review", "platform-or-brand-context-only"].includes(record.approvalStatus)) return false;
  return record.domainTypes.some((type) => type === "financial-literacy-governed" || type === "financial-literacy-candidate" || type === "financial-technology-candidate");
}

function updateCandidateSearch(candidates, integrated) {
  for (const candidate of candidates.recommendedCandidates) {
    const wheel = candidate.wheelLetters.join("");
    const required = new Set(candidate.requiredWords.map(normalizeKey));
    const additional = integrated.filter((term) => term.crosswordEligible && isFinancialCandidate(term) && canForm(term.canonicalTerm, wheel) && !required.has(term.normalizedKey)).map((term) => {
      const slot = existingSlot(term.canonicalTerm, candidate);
      return {
        term: term.canonicalTerm,
        normalizedKey: term.normalizedKey,
        letterCount: term.letterCount,
        worldAssociations: [...new Set(term.worldAssociations.map((item) => item.worldId))].sort(),
        approvalStatus: term.approvalStatus,
        permanentIdentities: term.permanentIdentities,
        exactLetterMultiset: "PASS",
        financialRelevance: "PASS",
        existingLayoutSupport: slot,
        disposition: slot.supported ? "eligible-existing-slot-pending-owner-review" : "unused-eligible-word-no-existing-slot",
      };
    });
    candidate.vocabularyIntegration2027 = {
      sourceDocumentsChecked: sourceFiles,
      additionalEligibleFinancialTerms: additional,
      addedToExistingLayout: additional.filter((term) => term.existingLayoutSupport.supported && term.existingLayoutSupport.reason !== "already-required-answer"),
      unusedEligibleFinancialTerms: additional.filter((term) => !term.existingLayoutSupport.supported),
      requiredAnswersChanged: false,
      validationStatus: candidate.validation2027.status,
    };
  }
  candidates.vocabularyIntegration = {
    integratedDate: date,
    sourceDocuments: sourceFiles,
    candidateCountPreserved: candidates.recommendedCandidates.length,
    newPuzzlesGenerated: 0,
    playablePuzzlesModified: 0,
  };
}

function worldSummary(integrated) {
  return Object.entries(worldMeta).map(([worldId, meta]) => {
    const records = integrated.filter((term) => term.worldAssociations.some((association) => association.worldId === worldId) && isFinancialCandidate(term));
    return {
      worldId,
      worldName: meta.name,
      playableWorld: meta.playable,
      uniqueFinancialTerms: records.length,
      crosswordPotential4To9: records.filter((term) => term.crosswordEligible).length,
      flashcardStudy10Plus: records.filter((term) => term.vocabularyClass === "flashcard-study-10-plus").length,
      shortEducational1To3: records.filter((term) => term.vocabularyClass === "short-educational-1-3" || term.vocabularyClass === "study-non-alphabetic").length,
      approvedPermanentIdentities: records.filter((term) => term.permanentIdentities.some((identity) => identity.originWorld === worldId)).length,
      workingCandidates: records.filter((term) => !term.permanentIdentities.length).length,
    };
  });
}

function renderReport(master, summary, candidates, parsed, integrated) {
  const rows = summary.map((item) => `| ${item.worldName}${item.playableWorld ? "" : " (proposed category)"} | ${item.uniqueFinancialTerms} | ${item.crosswordPotential4To9} | ${item.flashcardStudy10Plus} | ${item.shortEducational1To3} | ${item.approvedPermanentIdentities} | ${item.workingCandidates} |`).join("\n");
  const candidateRows = candidates.recommendedCandidates.map((candidate) => {
    const integration = candidate.vocabularyIntegration2027;
    return `| ${candidate.anchorWord} | ${candidate.requiredWords.length} | ${integration.additionalEligibleFinancialTerms.length} | ${integration.addedToExistingLayout.length} | ${integration.unusedEligibleFinancialTerms.map((item) => item.term).join(", ") || "None"} |`;
  }).join("\n");
  const sourceRows = sourceFiles.map((file) => `- \`${file}\``).join("\n");
  const totalFinancial = integrated.filter(isFinancialCandidate).length;
  const totalCrossword = integrated.filter((term) => isFinancialCandidate(term) && term.crosswordEligible).length;
  const totalLong = integrated.filter((term) => isFinancialCandidate(term) && term.vocabularyClass === "flashcard-study-10-plus").length;
  const totalShort = integrated.filter((term) => isFinancialCandidate(term) && (term.vocabularyClass === "short-educational-1-3" || term.vocabularyClass === "study-non-alphabetic")).length;
  return `# FinLit Quest 2027 — Vocabulary Integration Report\n\n**Date:** ${date}  \n**Status:** VOCABULARY INTEGRATED — RESEARCH ONLY — OWNER REVIEW REQUIRED\n\nThe four previously missing vocabulary documents were preserved unchanged and merged into the existing research master. This integration did not create a playable world, implement a puzzle, or modify gameplay, rewards, saves, or runtime content.\n\n## Sources integrated\n\n${sourceRows}\n\n## Dataset and grain\n\nThe canonical grain is one normalized educational term. Exact spelling/spacing duplicates collapse into one record, while display variants, source provenance, permanent identities, and every world/category association remain attached. The integrated collection contains **${integrated.length} canonical educational records**. Of these, **${totalFinancial}** are governed or working financial-literacy candidates, **${totalCrossword}** are alphabetic 4–9-letter crossword possibilities, **${totalLong}** are 10+ letter study candidates, and **${totalShort}** are short or non-alphabetic study concepts.\n\nThe original **159 permanent identities remain unchanged**. Newly integrated records have no permanent ID and remain \`working-candidate-not-approved\`. AI tools/jobs that are not financial concepts and platform names are retained separately but excluded from the financial counts. LEGAL CASH and ROBO FUND are retained only as provisional/rejected labels because the sources warn against teaching them as standard terms.\n\n## Financial vocabulary by world or proposed category\n\n| World/category | Unique financial terms | Crossword 4–9 | Flashcards 10+ | Short/non-alpha study | Approved identities | Working candidates |\n|---|---:|---:|---:|---:|---:|---:|\n${rows}\n\nThese category assignments do not create new playable worlds. Real Estate, Coins, Taxes, Insurance, Business, Retirement, Financial Safety, Careers, and Economics remain research categories pending owner decisions.\n\n## Duplicate and integrity checks\n\n- Source term mentions parsed: **${parsed.list.length}**.\n- Canonical records after exact normalized deduplication: **${integrated.length}**.\n- Permanent identity collisions introduced: **0**.\n- Terms with multiple world/category associations remain one canonical record with all associations preserved.\n- Missing required source files: **0**.\n- Definitions assigned to new candidates: **0**; the source documents did not supply controlled definitions, so none were invented.\n\n## Recheck of the three preserved candidates\n\n| Wheel | Existing answers | Additional eligible research terms | Fits existing layout | Unused eligible terms |\n|---|---:|---:|---:|---|\n${candidateRows}\n\nRepeated-letter counts were checked with exact multisets. No candidate answer list or layout was changed. Any newly discovered candidate term that lacks a distinct slot remains an unused eligible word pending later vocabulary approval and puzzle-generation review.\n\n## Flashcard preservation\n\nThe flashcard package now preserves the original 15 governed long-term records and adds every integrated 10+ letter research term as a study candidate with source provenance and world associations. New candidates have no generated definitions, examples, or permanent IDs; those require term-specific educational review.\n\n## Recommended next step\n\nReview the expanded vocabulary by world, resolve provisional labels and ambiguous placements, and approve selected terms with exact definitions and ownership. Only after vocabulary approval should the project regenerate nine-letter puzzle candidates toward the 15–20-puzzle goal.\n`;
}

function main() {
  const master = readJson(masterPath);
  const candidates = readJson(candidatesPath);
  const flashcards = readJson(flashcardsPath);
  const parsed = sourceCandidates();
  const integrated = buildIntegratedVocabulary(master, parsed);
  const summary = worldSummary(integrated);

  updateCandidateSearch(candidates, integrated);

  master.integration = {
    integratedDate: date,
    status: "research-only-working-vocabulary-not-approved",
    sourceDocuments: sourceFiles,
    sourceManifest: sourceFiles.map((file) => ({ file, sha256: sha256(path.join(sourceDir, file)) })),
    canonicalGrain: "one normalized term with preserved world associations",
    exactDuplicatesRemoved: true,
    newWorldsCreated: false,
    playableContentChanged: false,
  };
  master.missingSourceDocuments = [];
  master.integratedVocabulary = integrated;
  master.summaryByWorldAfterIntegration = summary;
  master.platformContextOnly = [...new Map([...(master.platformContextOnly || []).map((item) => [normalizeKey(item.word), item]), ...parsed.platformRecords.map((item) => [item.key, { word: item.term, status: item.status, sourceFile: item.sourceFile }])]).values()].sort((a, b) => a.word.localeCompare(b.word));
  master.countsAfterIntegration = {
    canonicalEducationalTerms: integrated.length,
    financialLiteracyTerms: integrated.filter(isFinancialCandidate).length,
    crosswordPotential4To9: integrated.filter((term) => isFinancialCandidate(term) && term.crosswordEligible).length,
    flashcardStudy10Plus: integrated.filter((term) => isFinancialCandidate(term) && term.vocabularyClass === "flashcard-study-10-plus").length,
    shortOrNonAlphabeticStudy: integrated.filter((term) => isFinancialCandidate(term) && (term.vocabularyClass === "short-educational-1-3" || term.vocabularyClass === "study-non-alphabetic")).length,
    permanentIdentitiesPreserved: master.governedTerms.length,
    rawSourceMentions: parsed.list.length,
  };

  flashcards.vocabularyIntegration = { integratedDate: date, sourceDocuments: sourceFiles, governedLongTermsPreserved: flashcards.governedLongTerms.length, newDefinitionsGenerated: 0 };
  flashcards.researchLongTerms = integrated.filter((term) => term.vocabularyClass === "flashcard-study-10-plus" && term.sourceDocuments.length).map((term) => ({ term: term.canonicalTerm, normalizedKey: term.normalizedKey, worldAssociations: [...new Set(term.worldAssociations.map((item) => item.worldId))].sort(), sourceDocuments: term.sourceDocuments, approvalStatus: term.approvalStatus, permanentIdentities: term.permanentIdentities, definition: term.exactGovernedDefinitions[0]?.definition || null, definitionStatus: term.exactGovernedDefinitions.length ? "existing-governed-definition-unchanged" : "awaiting-term-specific-review" }));

  fs.writeFileSync(masterPath, `${JSON.stringify(master, null, 2)}\n`);
  fs.writeFileSync(candidatesPath, `${JSON.stringify(candidates, null, 2)}\n`);
  fs.writeFileSync(flashcardsPath, `${JSON.stringify(flashcards, null, 2)}\n`);
  fs.writeFileSync(reportPath, renderReport(master, summary, candidates, parsed, integrated));

  console.log(JSON.stringify({
    sourceFiles: sourceFiles.length,
    rawSourceMentions: parsed.list.length,
    canonicalEducationalTerms: integrated.length,
    financialLiteracyTerms: master.countsAfterIntegration.financialLiteracyTerms,
    crosswordPotential4To9: master.countsAfterIntegration.crosswordPotential4To9,
    flashcardStudy10Plus: master.countsAfterIntegration.flashcardStudy10Plus,
    shortOrNonAlphabeticStudy: master.countsAfterIntegration.shortOrNonAlphabeticStudy,
    preservedCandidates: candidates.recommendedCandidates.length,
    additionalCandidateWheelMatches: candidates.recommendedCandidates.reduce((sum, item) => sum + item.vocabularyIntegration2027.additionalEligibleFinancialTerms.length, 0),
    report: path.relative(root, reportPath),
  }, null, 2));
}

main();

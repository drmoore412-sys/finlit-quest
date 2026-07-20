// Parses curriculum/credit/approved/workbooks/CRF-001-015-source.md (immutable source)
// into validated runtime JSON at curriculum/credit/approved/runtime/credit-foundations.json
// and a workbook-style world manifest at worlds/credit-foundations.json.
//
// The source file is never rewritten by this script.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const sourcePath = path.join(root, "curriculum/credit/approved/workbooks/CRF-001-015-source.md");
const runtimeDir = path.join(root, "curriculum/credit/approved/runtime");
const runtimeOutPath = path.join(runtimeDir, "credit-foundations.json");
const worldOutPath = path.join(root, "worlds/credit-foundations.json");

const { validateWorkbookWorld } = require(path.join(root, "src/workbook-validator.js"));

const DIFFICULTY_MAP = { Beginner: "beginner", Intermediate: "intermediate", Advanced: "advanced" };

function splitSections(block) {
  const headingRe = /^## (.+)$/gm;
  const matches = [...block.matchAll(headingRe)];
  const sections = {};
  matches.forEach((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : block.length;
    sections[m[1].trim()] = block.slice(start, end).trim();
  });
  return sections;
}

function parseVocabulary(text) {
  const lines = text.split("\n").filter((l) => l.trim().startsWith("-"));
  return lines.map((line) => {
    const m = line.match(/^-\s+\*\*(.+?):\*\*\s*(.+)$/);
    if (!m) throw new Error(`Could not parse flashcard line: ${line}`);
    return { term: m[1].trim(), definition: m[2].trim() };
  });
}

function parseMultipleChoice(text, workbookId) {
  const blocks = text.split(/\n(?=\d+\.\s)/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const promptMatch = lines[0].match(/^\d+\.\s+(.+)$/);
    const prompt = promptMatch[1].trim();
    const options = [];
    let correctIndex = -1;
    let explanation = "";
    lines.slice(1).forEach((line) => {
      const explMatch = line.match(/^-\s+Explanation:\s*(.+)$/);
      if (explMatch) {
        explanation = explMatch[1].trim();
        return;
      }
      const boldMatch = line.match(/^-\s+\*\*([A-D])\.\s+(.+?)\*\*$/);
      const plainMatch = line.match(/^-\s+([A-D])\.\s+(.+)$/);
      const m = boldMatch || plainMatch;
      if (!m) throw new Error(`Could not parse MC option line in ${workbookId}: ${line}`);
      const optionIndex = m[1].charCodeAt(0) - "A".charCodeAt(0);
      options[optionIndex] = m[2].trim();
      if (boldMatch) correctIndex = optionIndex;
    });
    if (correctIndex === -1) throw new Error(`No correct option found for MC question ${index + 1} in ${workbookId}`);
    return {
      id: `${workbookId.toLowerCase()}.mc.${index + 1}`,
      prompt,
      options,
      correctIndex,
      explanation,
    };
  });
}

function parseTrueFalse(text, workbookId) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line, index) => {
    const m = line.match(/^\d+\.\s+(.+?)\s+—\s+\*\*(True|False)\*\*\.\s+(.+)$/);
    if (!m) throw new Error(`Could not parse True/False line in ${workbookId}: ${line}`);
    return {
      id: `${workbookId.toLowerCase()}.tf.${index + 1}`,
      statement: m[1].trim(),
      answer: m[2] === "True",
      explanation: m[3].trim(),
    };
  });
}

function parseMatching(text, workbookId) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const m = line.match(/^-\s+(.+?)\s+↔\s+(.+)$/);
    if (!m) throw new Error(`Could not parse matching line in ${workbookId}: ${line}`);
    return { left: m[1].trim(), right: m[2].trim() };
  });
}

function parseScenario(text, workbookId) {
  const promptMatch = text.match(/\*\*Prompt:\*\*\s*([\s\S]+?)(?=\n\n\*\*Expected answer:\*\*|\n\*\*Expected answer:\*\*)/);
  const answerMatch = text.match(/\*\*Expected answer:\*\*\s*([\s\S]+)$/);
  if (!promptMatch || !answerMatch) throw new Error(`Could not parse scenario in ${workbookId}`);
  return { prompt: promptMatch[1].trim(), expectedAnswer: answerMatch[1].trim() };
}

function parseWorkbookBlock(block) {
  const titleMatch = block.match(/^# (CRF-\d{3}) — (.+)$/m);
  if (!titleMatch) throw new Error("Could not find workbook id/title header.");
  const [, id, title] = titleMatch;

  const sequenceMatch = block.match(/\*\*Sequence:\*\*\s*(\d+)/);
  const difficultyMatch = block.match(/\*\*Difficulty:\*\*\s*(\w+)/);
  const estimateMatch = block.match(/\*\*Estimated time:\*\*\s*(\d+)-(\d+) minutes/);
  const xpMatch = block.match(/\*\*XP:\*\*\s*(\d+)/);
  const unlockMatch = block.match(/\*\*Unlock:\*\*\s*(.+)/);
  if (!sequenceMatch || !difficultyMatch || !estimateMatch || !xpMatch || !unlockMatch) {
    throw new Error(`Missing metadata fields for ${id}`);
  }

  const prereqMatch = unlockMatch[1].match(/Complete (CRF-\d{3})/);
  const prerequisiteWorkbookId = prereqMatch ? prereqMatch[1] : null;

  const sections = splitSections(block);
  const required = [
    "Learning Objective", "Core Lesson", "Example", "Non-Example", "Common Misconception",
    "Key Takeaway", "Vocabulary / Flashcards", "Multiple-Choice Bank", "True/False Bank",
    "Matching Activity", "Scenario Activity", "Mastery Rule",
  ];
  required.forEach((key) => {
    if (!sections[key]) throw new Error(`Missing section '${key}' in ${id}`);
  });

  return {
    id,
    worldId: "credit-foundations",
    sequence: Number(sequenceMatch[1]),
    title: title.trim(),
    difficulty: DIFFICULTY_MAP[difficultyMatch[1]] || difficultyMatch[1].toLowerCase(),
    estimatedMinutes: { min: Number(estimateMatch[1]), max: Number(estimateMatch[2]) },
    xp: Number(xpMatch[1]),
    prerequisiteWorkbookId,
    learningObjective: sections["Learning Objective"].trim(),
    lesson: {
      coreLesson: sections["Core Lesson"].split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
      example: sections["Example"].trim(),
      nonExample: sections["Non-Example"].trim(),
      commonMisconception: sections["Common Misconception"].trim(),
      keyTakeaway: sections["Key Takeaway"].trim(),
    },
    flashcards: parseVocabulary(sections["Vocabulary / Flashcards"]),
    assessment: {
      multipleChoice: parseMultipleChoice(sections["Multiple-Choice Bank"], id),
      trueFalse: parseTrueFalse(sections["True/False Bank"], id),
      matching: parseMatching(sections["Matching Activity"], id),
      scenario: parseScenario(sections["Scenario Activity"], id),
    },
    masteryRule: {
      passingScore: 0.8,
      description: sections["Mastery Rule"].trim(),
    },
  };
}

function main() {
  const source = fs.readFileSync(sourcePath, "utf8");
  const bodyOnly = source.split(/\n# Source and Editorial Notes/)[0];
  const blocks = bodyOnly.split(/\n(?=# CRF-\d{3} — )/).filter((b) => /^# CRF-\d{3} — /.test(b.trim()));

  const workbooks = blocks.map(parseWorkbookBlock).sort((a, b) => a.sequence - b.sequence);

  const world = {
    schemaVersion: 1,
    id: "credit-foundations",
    worldType: "workbook",
    name: "Credit Foundations",
    eyebrow: "Learn how credit actually works",
    sequential: true,
    workbookIds: workbooks.map((w) => w.id),
  };

  const result = validateWorkbookWorld(world, workbooks);
  if (!result.valid) {
    console.error("Validation failed:\n- " + result.errors.join("\n- "));
    process.exit(1);
  }

  const runtimeData = { schemaVersion: 1, world: "credit-foundations", workbooks };

  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(runtimeOutPath, JSON.stringify(runtimeData, null, 2) + "\n");
  fs.writeFileSync(worldOutPath, JSON.stringify(world, null, 2) + "\n");

  // JS adapters: opening index.html directly (file://) blocks local JSON fetches,
  // so canonical JSON is mirrored as window-global assignments, same pattern as
  // content/crypto-terms.js / worlds/crypto.js (see scripts/sync-content.js).
  const runtimeAdapterPath = path.join(runtimeDir, "credit-foundations.js");
  const worldAdapterPath = path.join(root, "worlds/credit-foundations.js");
  fs.writeFileSync(runtimeAdapterPath, `// Generated from credit-foundations.json. Do not edit by hand.\nwindow.CREDIT_FOUNDATIONS_RUNTIME = ${JSON.stringify(runtimeData, null, 2)};\n`);
  fs.writeFileSync(worldAdapterPath, `// Generated from credit-foundations.json world manifest. Do not edit by hand.\nwindow.CREDIT_FOUNDATIONS_WORLD = ${JSON.stringify(world, null, 2)};\n`);

  console.log(`Parsed and validated ${workbooks.length} workbooks.`);
  console.log(`Wrote ${path.relative(root, runtimeOutPath)}`);
  console.log(`Wrote ${path.relative(root, worldOutPath)}`);
  console.log(`Wrote ${path.relative(root, runtimeAdapterPath)}`);
  console.log(`Wrote ${path.relative(root, worldAdapterPath)}`);
}

main();

#!/usr/bin/env node
// Baseline version 2 for the 52 legacy (composition rule v1) puzzles of the 61-level sequence.
// content/unified-legacy-v1-baseline.json stays frozen and is never rewritten. Version 2 keeps every puzzle ID and anchor and
// re-hashes the puzzles whose content changed under the exhaustive-answer expansion (30 of 52); the other 22 keep their v1 hashes.
// Usage: node scripts/build-legacy-baseline-v2.mjs [--check]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const H = require(path.join(ROOT, "tests/unified-release-helpers.js"));
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");
export function build() {
  const v1Text = read("content/unified-legacy-v1-baseline.json"), v1 = JSON.parse(v1Text), expansion = JSON.parse(read("content/answer-expansion-v1.json")), map = H.canonicalMap();
  const entries = v1.entries.map(e => {
    const puzzle = map.get(e.puzzleId);
    if (!puzzle) throw new Error(`canonical puzzle missing: ${e.puzzleId}`);
    if (puzzle.anchorWord !== e.anchor) throw new Error(`anchor changed for ${e.puzzleId}`);
    return { puzzleId: e.puzzleId, anchor: e.anchor, sha256: H.hashOf(puzzle) };
  });
  const changed = entries.filter((e, i) => e.sha256 !== v1.entries[i].sha256).map(e => e.puzzleId);
  const expectedChanged = v1.entries.map(e => e.puzzleId).filter(id => expansion.puzzles[id]);
  if (changed.join() !== expectedChanged.join()) throw new Error(`changed entries differ from the expansion manifest\n${changed}\n${expectedChanged}`);
  return {
    baselineVersion: 2,
    supersedes: { baselineVersion: 1, file: "content/unified-legacy-v1-baseline.json", fileSha256: H.sha256(v1Text) },
    note: "Baseline v2 of the canonical v1 puzzles allowed into the 61-level release sequence under the owner-approved legacy compatibility exception. It differs from v1 only for the puzzles expanded by the exhaustive-answer rule (owner-authorised 2026-11-18, content/answer-expansion-v1.json): same IDs, same anchors, new content hashes. Unexpanded puzzles keep their v1 hashes. sha256 is of the stable-JSON canonical puzzle record built from the committed vocabularies and puzzle sources.",
    algorithm: v1.algorithm,
    changedFromV1: changed,
    unchangedFromV1: entries.filter(e => !changed.includes(e.puzzleId)).map(e => e.puzzleId),
    entries,
  };
}
const out = path.join(ROOT, "content/unified-legacy-v2-baseline.json");
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = JSON.stringify(build(), null, 2) + "\n";
  if (process.argv.includes("--check")) { if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== text) { console.error("content/unified-legacy-v2-baseline.json is stale"); process.exit(1); } console.log("baseline v2 up to date"); }
  else { fs.writeFileSync(out, text); const b = JSON.parse(text); console.log("wrote baseline v2:", b.entries.length, "entries,", b.changedFromV1.length, "re-hashed,", b.unchangedFromV1.length, "unchanged"); }
}

#!/usr/bin/env node
/* Educational Terminology Standard check.  Usage: node scripts/check-terminology.js [--strict] [--json] [--root DIR] [--only SUBSTRING] [--paths-from-stdin]
 * Exit 1 if a known prohibited name is found, or (with --strict) any unreviewed suspect phrase is found. */
"use strict";
const path = require("node:path");
const ts = require("../src/terminology-standard.js");
const args = process.argv.slice(2), flag = n => args.includes("--" + n), val = n => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : undefined; };
const root = path.resolve(val("root") || path.join(__dirname, ".."));
const { findings, scanned } = ts.scanRepo(root, { only: val("only") });
const sum = ts.summarize(findings, flag("strict"));
if (flag("json")) console.log(JSON.stringify({ scanned: scanned.length, summary: sum, findings }, null, 1));
else {
  console.log("Educational Terminology Standard check: " + scanned.length + " files scanned" + (flag("strict") ? " (strict)" : ""));
  for (const f of findings) console.log("  [" + f.kind.toUpperCase() + "] " + f.file + " :: " + f.location + " :: \"" + f.term + "\" (" + f.rule + ")" + (f.replacement ? " -> use: " + f.replacement : "") + "\n      " + (f.snippet || ""));
  console.log("prohibited: " + sum.prohibited + ", suspect: " + sum.suspect + " => " + (sum.pass ? "PASS" : "FAIL"));
  console.log("Note: this is a review aid, not proof that no invented name exists.");
}
process.exitCode = sum.pass ? 0 : 1;

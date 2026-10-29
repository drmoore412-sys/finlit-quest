/* FinLit Quest Educational Terminology Standard: review aid.
 *
 * Finds (1) known prohibited invented provider/product names and (2) phrases that LOOK like an invented
 * provider or product name, so a person can review them. A list and a few heuristics cannot prove that no
 * invented name exists; they catch the known cases and the common shapes of the mistake.
 *
 * Findings:
 *   kind "prohibited"  known invented name (always an error unless owner-authorized in the data file)
 *   kind "suspect"     looks like an invented name; an error under strict mode unless reviewed or labeled
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const DATA_PATH = path.join(__dirname, "..", "curriculum", "terminology-standard.json");
function loadStandard(file) { return JSON.parse(fs.readFileSync(file || DATA_PATH, "utf8")); }

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function compile(std) {
  const nouns = std.provider_nouns.map(esc).join("|");
  const chars = new Set(std.character_names);
  return {
    std, chars,
    ignore: (std.ignore_patterns || []).map(i => new RegExp(i.regex, "g")),
    prohibited: std.prohibited.map(p => ({ ...p, re: new RegExp("(?<![A-Za-z])" + esc(p.term) + "(?![A-Za-z])", "g") })),
    // Capitalized one- or two-word name directly followed by a provider noun, e.g. "Ostrel Vault", "Nexa Lending".
    nameNoun: new RegExp("\\b([A-Z][a-z]{2,}(?:[A-Z][a-z]+)?(?:\\s[A-Z][a-z]{2,})?)\\s+(" + nouns + ")\\b", "g"),
    // "(a fictional lender)" style label that marks an invented provider just named.
    fictionalLabel: /\((?:a |an )?(?:fictional|made-up|imaginary|invented) (?:lender|vault|bank|platform|protocol|exchange|app|company|provider|pool|service|broker|wallet)\)/gi,
    legalSuffix: /\b[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?\s(?:Inc|LLC|Ltd|Corp)\b\.?/g,
    // A capitalized phrase that continues into one of these words is a statute or agency name, not a provider.
    officialBody: /^(?:\s+[A-Z][A-Za-z]+){0,3}?\s+(Act|Acts|Corporation|Bureau|Commission|Administration|Association|Board|Agency|Department|Service|Council|Congress|Reserve|Treasury|Code|Rule|Regulation|Institute)\b/,
    labelRe: new RegExp(std.label_words.map(esc).join("|"), "i"),
  };
}

function sentenceAround(text, index) {
  const start = Math.max(text.lastIndexOf(". ", index) + 2, text.lastIndexOf("\n", index) + 1, 0);
  let end = text.indexOf(". ", index); if (end < 0) end = text.length;
  return text.slice(start, end + 1);
}
function isSentenceStart(text, index) {
  const before = text.slice(0, index).replace(/[\s"'(*_]+$/, "");
  return before === "" || /[.!?:]$/.test(before);
}
function snippet(text, index, len) {
  const a = Math.max(0, index - 30);
  return (a > 0 ? "..." : "") + text.slice(a, index + len + 40).replace(/\s+/g, " ") + (index + len + 40 < text.length ? "..." : "");
}

function scanText(text, rules, opts = {}) {
  const out = [];
  if (typeof text !== "string" || !text) return out;
  // Blank out documented non-player text (e.g. internal ledger lookups) while keeping character offsets.
  for (const re of rules.ignore) text = text.replace(re, m => " ".repeat(m.length));
  const authorized = new Set((rules.std.authorized || []).map(a => a.term));
  const reviewed = new Set((rules.std.reviewed || []).map(r => r.term.toLowerCase()));
  const covered = [];
  for (const p of rules.prohibited) {
    if (authorized.has(p.term)) continue;
    for (const m of text.matchAll(p.re)) {
      out.push({ kind: "prohibited", rule: "prohibited-name", term: m[0], replacement: p.replacement, snippet: snippet(text, m.index, m[0].length) });
      covered.push([m.index, m.index + m[0].length]);
    }
  }
  const inCovered = i => covered.some(([a, b]) => i >= a && i < b);
  for (const m of text.matchAll(rules.nameNoun)) {
    let name = m[1], at = m.index;
    if (inCovered(m.index)) continue;
    // Drop a leading article that the capitalized-word pattern swallowed ("The Fair Credit Reporting Act").
    const lead = name.match(/^(The|A|An|This|That|Your|Our)\s+(.+)$/);
    if (lead) { name = lead[2]; at += m[1].length - name.length; }
    if (!/^[A-Z][a-z]{2,}(?:[A-Z][a-z]+)?(?:\s[A-Z][a-z]{2,})?$/.test(name)) continue;
    const tail = text.slice(m.index + m[0].length, m.index + m[0].length + 60);
    if (rules.officialBody.test(tail.split(/[.,;:()]/)[0])) continue; // part of a statute or agency name, e.g. "... Credit Reporting Act"
    const words = name.split(/\s+/);
    if (words.every(w => rules.chars.has(w)) ) continue;
    const phrase = (name + " " + m[2]).trim();
    if (!isSentenceStart(text, at) && /^(The|A|An)$/.test(name)) continue;
    if (reviewed.has(phrase.toLowerCase())) continue;
    // A sentence-initial single word is usually just a capitalized common word ("Credit cards ..."), so it is skipped.
    if (words.length === 1 && isSentenceStart(text, m.index)) continue;
    const labeled = rules.labelRe.test(sentenceAround(text, m.index));
    if (labeled && !opts.reportLabeled) continue;
    out.push({ kind: "suspect", rule: "capitalized-name-plus-provider-noun", term: phrase, snippet: snippet(text, m.index, phrase.length) });
  }
  for (const m of text.matchAll(rules.fictionalLabel)) {
    out.push({ kind: "suspect", rule: "fictional-provider-label", term: m[0], snippet: snippet(text, m.index, m[0].length) });
  }
  for (const m of text.matchAll(rules.legalSuffix)) {
    if (reviewed.has(m[0].toLowerCase())) continue;
    out.push({ kind: "suspect", rule: "company-legal-suffix", term: m[0], snippet: snippet(text, m.index, m[0].length) });
  }
  return out;
}

/** Walk a parsed JSON value, scanning every string except under excluded keys. */
function scanValue(value, file, rules, opts = {}, pointer = "") {
  const excluded = new Set(opts.excludedKeys || rules.std.excluded_keys);
  const out = [];
  const walk = (v, p) => {
    if (typeof v === "string") { for (const f of scanText(v, rules, opts)) out.push({ file, location: p || "/", ...f }); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, p + "[" + i + "]"));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { if (!excluded.has(k)) walk(x, p ? p + "." + k : k); }
  };
  walk(value, pointer);
  return out;
}

/** Player-facing JSON sources across all worlds. Returns [{file, root(optional keys)}]. */
function discoverTargets(root) {
  const targets = [];
  const add = (rel, only) => { const abs = path.join(root, rel); if (fs.existsSync(abs)) targets.push({ file: rel, abs, only }); };
  const list = d => { const abs = path.join(root, d); return fs.existsSync(abs) ? fs.readdirSync(abs).sort() : []; };
  for (const f of list("content")) if (f.endsWith(".json")) add("content/" + f);
  for (const f of list("worlds")) if (f.endsWith(".json")) add("worlds/" + f);
  add("terms.json");
  for (const world of list("curriculum")) {
    const base = path.join("curriculum", world, "approved");
    for (const f of list(path.join(base, "runtime"))) {
      if (f.endsWith(".tree.v1.json")) add(path.join(base, "runtime", f), ["S", "intro", "blurb", "plan", "name"]);
      else if (f.endsWith(".json")) add(path.join(base, "runtime", f));
    }
    for (const f of list(path.join(base, "workbooks"))) if (f.endsWith(".journey.json")) add(path.join(base, "workbooks", f));
  }
  return targets;
}

function scanRepo(root, opts = {}) {
  const rules = compile(loadStandard(opts.dataFile));
  const findings = [], scanned = [];
  for (const t of discoverTargets(root)) {
    if (opts.only && !t.file.includes(opts.only)) continue;
    let json; try { json = JSON.parse(fs.readFileSync(t.abs, "utf8")); } catch (e) { findings.push({ file: t.file, location: "/", kind: "error", rule: "unreadable-json", term: String(e.message) }); continue; }
    const body = t.only ? Object.fromEntries(t.only.filter(k => k in json).map(k => [k, json[k]])) : json;
    scanned.push(t.file);
    findings.push(...scanValue(body, t.file, rules, opts));
  }
  return { findings, scanned, rules };
}

function summarize(findings, strict) {
  const errors = findings.filter(f => f.kind === "prohibited" || f.kind === "error" || (strict && f.kind === "suspect"));
  return { prohibited: findings.filter(f => f.kind === "prohibited").length, suspect: findings.filter(f => f.kind === "suspect").length, errors: errors.length, pass: errors.length === 0 };
}

module.exports = { loadStandard, compile, scanText, scanValue, scanRepo, discoverTargets, summarize, DATA_PATH };

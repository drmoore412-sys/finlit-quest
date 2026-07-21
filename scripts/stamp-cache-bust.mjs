// GitHub Pages serves every file with a flat `Cache-Control: max-age=600`
// and no other cache-busting mechanism (no content hashing, no custom
// headers support). Without this, a browser can end up with a stale mix of
// old JS + new HTML (or vice versa) for up to 10 minutes after any deploy —
// confirmed as the cause of a real user-facing bug report (onboarding flow
// skipped on a device with cached pre-deploy JS).
//
// This stamps every same-origin <script src>/<link href> in index.html with
// a `?v=<timestamp>` query string, replacing any existing stamp so it's
// idempotent. Browsers treat a different query string as a different URL,
// forcing a fresh fetch on every deploy regardless of the 10-minute header.
//
// Run this right before every commit that touches any HTML/CSS/JS file,
// then commit the stamped index.html along with those changes. See
// docs/FQ-APP-002-native-build-release-standard.md's release checklist.
//
// Usage: node scripts/stamp-cache-bust.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "index.html");
const stamp = Date.now();

let html = fs.readFileSync(indexPath, "utf8");
let count = 0;

// Matches src="..."/href="..." for local files only (relative paths — no
// "://" — so external/CDN references, if any are ever added, are untouched).
html = html.replace(/((?:src|href)=")([^"]+\.(?:js|css|webmanifest|ico|png))(?:\?v=\d+)?(")/g, (match, prefix, url, suffix) => {
  count++;
  return `${prefix}${url}?v=${stamp}${suffix}`;
});

fs.writeFileSync(indexPath, html);
console.log(`Stamped ${count} local resource references in index.html with ?v=${stamp}`);

# FinLit Quest project log

This file is the single source of truth for development continuity. Read it before changing the project. Update it after every completed milestone with the date, work completed, files modified, architectural decisions, known issues, and recommended next steps.

## Product direction

FinLit Quest is an applied financial-learning platform, not primarily a word game. Word-connect puzzles are an engagement mechanic that unlock short lessons, application challenges, rewards, mastery progression, and scheduled review.

The intended experience is premium, modern, friendly, intelligent, and game-like without appearing childish. When a material UX improvement is identified, propose the layout, navigation, visual, or interaction change before implementing it. Prefer a cohesive experience over preserving legacy presentation.

---

## 2026-07-21 (later) — Confirmed this Mac can never submit to the App Store; added FQ-APP-002 release standard doc

Researched step 1 of the user's own "what's next" plan (verify Xcode compatibility) before spending effort on steps 2-3 (free storage, install Xcode). Good thing — it changes the plan.

**Finding:** this machine is a `MacBookAir7,2` (2015/2017 MacBook Air). Apple's maximum supported macOS for that model is Monterey (12) — already what it's running; it cannot be upgraded to Ventura, Sonoma, or anything newer, period. macOS 12 caps at Xcode 14.2. Apple has required Xcode 26+ with the iOS 26 SDK for **all** new App Store submissions since 2026-04-28. That's four major Xcode versions beyond what this hardware can ever run. No amount of freed disk space or Xcode reinstallation changes this — it's a hardware ceiling. Real options: use a different/newer Mac for the build-archive-sign-submit step, or a cloud Mac CI service (Codemagic, Bitrise, GitHub Actions macOS runners, Xcode Cloud) — not yet decided which.

**New doc:** `docs/FQ-APP-002-native-build-release-standard.md`, per request — the durable, repeatable native-build/release process (separate from `V1_RELEASE_CHECKLIST.md`, which is the current-launch status tracker). Documents the constraint above, current toolchain versions (Node v24.18.0 via direct nodejs.org binary — not Homebrew, which fails on this OS — Capacitor 8.4.2, no CocoaPods needed), bundle identity, the `build-www.sh`/`cap sync` pipeline and why `ios/App/App/public/` is committed, signing/TestFlight/submission process (marked not-yet-established where true rather than guessed), a proposed version-numbering scheme, and a release checklist for 1.1/2.0 and beyond.

### Files modified

- New: `docs/FQ-APP-002-native-build-release-standard.md`
- Modified: `docs/V1_RELEASE_CHECKLIST.md` (Blocker 9b's Xcode-compatibility line updated from "needs checking" to the confirmed finding)

---

## 2026-07-21 — Native iOS app wrapper (Capacitor) scaffolded and branded

App Store submission was flagged as impossible before this: Apple requires a compiled binary, not a website/PWA, and this repo had zero native project. Wrapped the existing static site with Capacitor (no rewrite — thin native shell around what already exists).

### Environment problems hit and fixed

- No Node.js anywhere on this Mac. `brew install node` silently tried to compile from source (no Homebrew "bottle" for macOS 12 Monterey anymore) and **failed** after ~15 min: `Error: You are using macOS 12. We (and Apple) do not provide support for this old version.` The background-task notification said "exit code 0" — misleading, that was `tail`'s exit code from the `| tail -30` pipe, not `brew install`'s. Caught by reading the actual captured output rather than trusting the status summary.
- Fixed by downloading Node's official prebuilt binary directly from nodejs.org (queried their release API for the real current version rather than guessing one) into `~/.local/nodejs` — no compilation, no sudo, no system-wide install. Added to `~/.zshrc` PATH.

### What was built

- `package.json`, Capacitor 8.4.2 (`core`/`cli`/`ios`), `capacitor.config.json` (appId `com.finlitquest.app`, appName "FinLit Quest").
- `scripts/build-www.sh`: traced every file `index.html`/manifest actually reference and built a script that copies exactly those ~33 files (908K) into `www/` — deliberately not pointing Capacitor's `webDir` at the repo root, which would have shipped `.git`, `node_modules`, `tests/`, `docs/`, raw multi-MB brand source PNGs, and internal project docs inside the actual App Store binary. Verified the trimmed bundle live (served locally, loaded both the word-game and Credit workbook screens, zero console errors) before wiring it into Capacitor.
- `npx cap add ios` succeeded without Xcode installed (scaffolding only; building/signing needs Xcode). Uses Swift Package Manager, no CocoaPods needed.
- Replaced Capacitor's default app icon and splash screen with real branding: the prepared 1024×1024 App Store icon, and a new branded splash (transparent compass mark centered on the app's own navy background color, verified no hidden transparency by flattening to JPEG). Fixed the storyboard's white fallback background to navy too.
- `.gitignore`: `www/` excluded (regenerable), `ios/App/App/public/` (what Xcode actually builds from) committed so the project builds immediately after a fresh clone.

### Still blocked — needs the user, not more code

No Xcode installed, and macOS 12.7.6 may not support a current-enough Xcode version for Apple's present submission requirements (needs checking). Only ~9.8GB free disk space, likely insufficient for Xcode. Installing Xcode needs interactive Apple ID sign-in. Apple Developer Program enrollment status unknown. All of real device testing, signing, TestFlight, and submission are still ahead once Xcode exists.

### Files modified

- New: `package.json`, `package-lock.json`, `capacitor.config.json`, `scripts/build-www.sh`, `ios/` (native Xcode project)
- Modified: `.gitignore`

Full suite still 156/156 passing — no existing JS logic touched.

---

## 2026-07-20 (latest) — finlitquest.com confirmed live end-to-end; root cause was local DNS cache, not GoDaddy

Closes out the deployment from the entry below. GitHub's Pages settings UI showed a DNS check failure after the A records were added, which looked like a GoDaddy problem at first — it wasn't.

### Root cause

Not GoDaddy domain forwarding (user confirmed both domain and subdomain forwarding were off). The actual A records were correct the entire time, confirmed independently via `dig` against the local resolver, Google's 8.8.8.8, Cloudflare's 1.1.1.1, and GoDaddy's own authoritative nameserver — all four agreed on GitHub's IPs. The mismatch was that `curl`/browsers on the user's Mac don't consult `dig`'s resolution path — they go through macOS's `dscacheutil`/`mDNSResponder` cache, which had a stale entry (GoDaddy's old parking IP, `76.223.105.230`) cached from before the DNS records were fixed. Confirmed by forcing a direct connection to GitHub's real IP with `curl --resolve`, which worked immediately (valid Let's Encrypt cert, HTTP/2 200) — proving the server side was already correct and the fault was purely local-machine DNS caching.

### Fix

`sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` on the user's Mac. (First attempt got stuck at a `quote>` zsh prompt from pasting text containing an apostrophe — resolved with Ctrl+C, then typing the command directly instead of pasting.)

### Live verification

Loaded `https://finlitquest.com` for real in the browser: correct logo/branding in the header, a fresh player starts at 300 coins (economy fix confirmed live) and 0 XP, puzzle board and letter wheel render and are interactive, zero console errors. Fetched every brand asset (favicon.ico, both favicon PNGs, apple-touch-icon, icon-192/512, the OG image, manifest.webmanifest) directly from the live domain — all 200 OK. Enabled "Enforce HTTPS" on the GitHub Pages settings (was `false`, now `true` — couldn't be turned on earlier because it requires cert issuance to complete first, which happens automatically once DNS is verified). Confirmed plain `http://finlitquest.com` now 301-redirects to `https://`.

### Files modified

None (infrastructure-only: GitHub Pages HTTPS-enforcement setting, and the user's local machine DNS cache — no repo changes this entry).

### Remaining blockers

Unchanged: level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), store assets (10), submission (11). Branding/domain (9) is now fully live and verified.

---

## 2026-07-20 (latest) — Deployed to GitHub Pages / finlitquest.com

Moved the app off `localhost:8756` onto real hosting, per request.

### What happened

- **Git remote was misconfigured**: pointed at `cmmoore412-SYS/finlit-quest`, which the authenticated `gh`/git credentials (`drmoore412-sys`) had no access to (repo not found). Confirmed with the user this was simply the wrong account and fixed the remote to `https://github.com/drmoore412-sys/finlit-quest.git`, an existing private repo with only GitHub's default scaffolding (`.gitignore`, 14-byte `README.md`) — no real content to lose.
- **First real commit of the session's work**: this repo had exactly one prior commit ("Establish verified FinLit Quest baseline") and 75 files' worth of changes had never been committed. Reviewed the full diff for secrets before staging (none found) and committed everything in one commit, then merged in the remote's unrelated scaffolding history with `--allow-unrelated-histories` (non-destructive — no force-push used anywhere). Resolved one `.gitignore` merge conflict by combining both versions (kept the project-specific entries — `.DS_Store`, `*.zip` — alongside the remote's generic Node template).
- **Push initially failed** (`RPC failed; HTTP 400`) — the push payload (~7.7MB, mostly the brand PNG assets) exceeded git's default HTTP post buffer. Fixed with `git config http.postBuffer 524288000` and retried successfully.
- **Added `CNAME`** (containing `finlitquest.com`) to the repo root — required by GitHub Pages to serve a custom domain.
- **GitHub Pages initially failed to enable**: "current plan does not support GitHub Pages for this repository" — private repos require a paid GitHub plan for Pages. Presented the three real options (make public / switch to a host that supports private-repo deploys / upgrade to GitHub Pro) rather than picking one — user chose to make the repo public. Changed visibility, then enabled Pages (branch `main`, path `/`).
- **Verified the deployment is actually live**: build status went to `"built"`, and the fallback `https://drmoore412-sys.github.io/finlit-quest/` URL now 301/308-redirects to `https://finlitquest.com/` — proof the site built and the custom domain is correctly wired on GitHub's side.

### What's still needed (cannot be done from here — requires the user's domain registrar access)

`finlitquest.com` will not actually resolve to the new site until DNS is updated at wherever the domain is registered. Required records:

**Apex domain (`finlitquest.com`)** — four A records:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```
Optional IPv6 (AAAA records), if the registrar supports them:
```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**`www.finlitquest.com`** (optional, only if a `www` version should also work) — one CNAME record:
```
www → drmoore412-sys.github.io
```

Once DNS propagates (usually minutes, sometimes up to ~24–48h) and GitHub verifies the domain, HTTPS certificate issuance is automatic — `https_enforced` should then be flipped on (currently `false`; not done yet since the cert isn't issued until DNS is live).

### Files modified

- `.git` remote config (not a tracked file)
- `.gitignore` (merge-resolved), `CNAME` (new), `README.md` (from remote scaffolding)
- Everything else: the full session's accumulated, previously-uncommitted work (see the single commit `1527bab` for the complete file list)

### Remaining blockers

Unchanged, unrelated to this deployment step: level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), store assets (10), submission (11). Branding (9) is otherwise complete pending native app project / store listing infrastructure.

---

## 2026-07-20 (latest) — Blocker 9: transparent logo variant supplied and integrated

Closes the one open quality gap from the previous entry. User supplied `FinLit_Quest_Icon_Mark_transparent.png` (1254×1254, `hasAlpha: yes`) to `assets/brand/source/`.

**Verified it was real transparency, not just an RGBA file with alpha=255 everywhere:** flattened it to JPEG with `sips` (JPEG has no alpha channel, so sips must composite onto something) and confirmed the outer square corners turned white (sips' default fill) while the inner navy disc/gold ring/needle stayed intact — a genuine circular cutout. (A hand-rolled PNG pixel reader tried first gave inconsistent alpha readings — its naive scanline decode doesn't implement PNG's per-row filter reconstruction, so it's unreliable for anything beyond rough RGB sampling; discarded in favor of the sips-flatten test, which uses a real, trustworthy system API.)

Regenerated `favicon-16.png`, `favicon-32.png`, `favicon.ico`, and the in-app header logo (`wg-logo-96.png`) from the transparent source — the three places where not knowing the surrounding background color actually matters. Left the Apple/PWA app icons (apple-touch-icon, icon-192, icon-512, icon-1024-appstore) generated from the opaque master, since app icons are supposed to be opaque (already flagged in the Blocker 9 checklist entry itself).

### Live verification

Dev server picked up the regenerated files (fetched all four new files from the live page — 200 OK). Header logo screenshot unchanged (expected — the app background is navy already, so this is a correctness/future-proofing fix, not a visible regression fix). Zero console errors. Full suite still 156/156 (asset-only change, no JS logic touched).

### Files modified

- `assets/brand/source/FinLit_Quest_Icon_Mark_transparent.png` (new, user-supplied)
- `assets/brand/favicon/favicon-16.png`, `favicon-32.png`, `favicon.ico`, `assets/brand/web/wg-logo-96.png` (regenerated)
- `docs/V1_RELEASE_CHECKLIST.md`

### Remaining blockers

Unchanged from the previous entry except this one item is now closed: native app project (needed for §5/§6), a store listing (needed for §7, → Blocker 10), real-device verification. Also still open, unrelated to branding: level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), store assets (10), submission (11).

---

## 2026-07-20 (latest) — Blocker 9 (Branding and Domain Integration): web-facing branding implemented

User confirmed the two open questions from the plan-only entry below: finlitquest.com = this app (dev at `localhost:8756`), and supplied the approved logo assets directly (three PNGs, saved to `assets/brand/source/` — full lockup + compass "Q" icon mark + a pre-sized 1024×1024 App Store copy of the mark). No SVG source, no transparent variant — both noted, neither blocking.

### What changed

- **Favicon**: generated `favicon-16.png`, `favicon-32.png`, `apple-touch-icon-180.png`, `icon-192.png`, `icon-512.png` from the icon mark via `sips` (macOS built-in; no ImageMagick/Pillow available). `sips` can't emit `.ico`, so built one with a small stdlib-only script (`assets/brand/build-favicon-ico.py`) that packs the PNGs into a real PNG-in-ICO container — verified with `file` as a genuine 2-image Windows icon resource. Added proper `<link rel="icon">` / `apple-touch-icon` / `manifest` tags to `index.html`'s `<head>` (previously had none at all — no favicon, no manifest, no OG tags, no theme-color).
- **In-app logo**: `.wg-brand`'s emoji placeholder (🧭) on the shared Crypto/Credit header, replaced with the real compass mark as a clickable, circular, alt-texted `<img>` that now genuinely navigates home (`showDashboard()`) — it did nothing before.
- **Manifest**: new `manifest.webmanifest` — name/short_name/start_url/display/theme_color/background_color, 192 + 512 icons, plus a proper maskable 512 icon built with the mark safe-zoned to 67% and padded with its own background color so circular/squircle/rounded OS masks don't clip it.
- **Social/sharing**: Open Graph + Twitter Card tags, `apple-mobile-web-app-title`, `theme-color`. Built a 1200×630 OG image from the full lockup, padding it onto a canvas color-matched to the logo's own (slightly different from the icon mark's) background tone — caught and fixed a visible seam by sampling actual pixels instead of assuming a shared color.

### Explicitly blocked, not silently skipped

- **Native Apple/Android app icon catalogs** (spec §5/§6): this repo has no native app project at all (no Xcode project, no Capacitor/Cordova/Gradle) — nowhere to install a native icon set until that wrapper exists.
- **Store listing assets** (§7): no App Store Connect/Play Console access, no listing built yet — deferred to Blocker 10.
- **Real-device verification** (§10): only verified in this environment's Browser pane (Chromium-based) — real Safari/Android Chrome/TestFlight/Android builds need actual devices/tooling not available here.

### Live verification

Browser pane, `http://localhost:8756`: logo renders in the header on both Crypto and Credit (same shared element, confirmed structurally). Clicking it navigates to the dashboard. Fetched every new asset (`favicon.ico`, both favicon PNGs, apple-touch-icon, icon-192/512/512-maskable, the OG image, the manifest) directly from the live page — all 200 OK. Manifest serves `application/manifest+json`. Zero console errors, zero 404s in the network log. Full test suite still 156/156 (no JS logic touched, HTML/CSS/asset changes only).

### Files modified / added

- `index.html` (head metadata), `word-game.css` (`.wg-logo`), `word-game-app.js` (click handler)
- `manifest.webmanifest` (new)
- `assets/brand/source/*.png` (user-supplied, not previously in the repo), `assets/brand/favicon/*`, `assets/brand/icons/*`, `assets/brand/web/*`, `assets/brand/build-favicon-ico.py` (all new)
- `docs/V1_RELEASE_CHECKLIST.md`

### Remaining blockers

Native app project (needed for §5/§6), a store listing (needed for §7, → Blocker 10), real-device verification, and optionally a transparent-background logo variant if ever needed on a non-navy surface. Everything else in this session's plan is unchanged: level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), store assets (10), submission (11).

---

## 2026-07-20 (latest) — Added Blocker 9: Branding and Domain Integration to the V1.0 plan

Planning-only entry — no code changed. Per instruction, added a new release blocker (full spec in `docs/V1_RELEASE_CHECKLIST.md` → Blocker 9) covering favicon, website/app logo placement, web app manifest, Apple/Google Play icon branding, store listing assets, and social-sharing metadata. Positioned before store-assets (renumbered 9→10) and submission (10→11), as instructed.

**Pre-flight check before recording it as ready to start:** searched the repo for any existing logo/favicon/icon/manifest file — none exist. `index.html` has no favicon link, manifest link, apple-touch-icon, or Open Graph/theme-color meta tags at all. This blocker cannot begin execution (not even §1, favicon generation) without a master logo source file, which isn't in this codebase today. Also flagged, not assumed: the spec describes "finlitquest.com" (website nav/footer/sign-in) and "the game application" (§2 vs §3) as if they're two different surfaces, but this repo contains only the one static game app — no separate marketing site. Whether finlitquest.com is this app or a different, not-yet-available repository needs clarifying before real work starts.

### Files modified

- `docs/V1_RELEASE_CHECKLIST.md` (Blocker 9 added, Phase 6 cross-referenced, blocker numbering updated)

### Remaining blockers

Level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), **branding and domain integration (9 — blocked on a missing master logo asset and an open question about finlitquest.com)**, store assets and metadata (10), submission (11).

---

## 2026-07-20 (latest) — Blocker 2 (XP system) verified

**Scope confirmed:** "Credit World" for V1.0 = the completed Credit Foundations content only. Credit Cards / Interest & Borrowing / Credit Reports / Building Credit / other unfinished chapters stay frozen and must remain locked/hidden from users — verified live that this is already true today (the 7 unbuilt Credit journey nodes are dynamically disabled by `updateDashboard()`, unclickable).

**Verification finding:** no live XP-earning bug. Every awarding path (workbook pass, SM-2 review, word-game puzzle solve) was already correct — once per event, never on fail/incomplete, accumulating on one shared `player.xp` independent of world state. One real gap fixed: `normalizeSave` never validated a loaded `player.xp`, so a corrupted/tampered save (`NaN`, string, negative) would load as-is and compound forever. Added `sanitizeXp()` in `learning-engine.js`.

**Two findings logged but explicitly not fixed this pass** (per instruction to stay XP-only): (1) a real level-formula inconsistency — the Credit World journey screen computes level as `xp÷100` while everywhere else uses `xp÷250`, reproduced live (xp=100 shows level 2 on one screen, level 1 everywhere else) — handed to Blocker 3. (2) `app.js`'s original Crypto crossword screen and its independent `learning.review()`-based XP path are dead code — confirmed via static analysis and a live click test to be completely unreachable from any current UI trigger — flagged for removal in Phase 4 (Bug Sweep) as a latent duplicate-XP-path risk, not touched now.

### Changes made

- `learning-engine.js`: added `sanitizeXp()`, applied in `normalizeSave`.

### Tests added

9 new tests in `tests/learning-engine.test.js`: new player starts at 0 XP; corrupted xp sanitizes to 0 (NaN/string/negative/missing); a valid value including 0 is preserved; XP awarded exactly once per workbook pass and not duplicated by retry; failed attempts award 0; XP from different activity types accumulates on the shared balance; XP survives a world switch; reload preserves XP; XP stays finite/non-negative across mixed activities. Full suite: 156/156 passing.

### Live verification

Real clicks/UI functions throughout, `http://localhost:8756`: completed a fresh CRF-002 quiz (8/8) — XP went 100→200 correctly. Reloaded — stayed 200. Retried the same completed quiz — stayed 200, no duplicate. Solved a real Crypto word ("PEER") via the actual wheel-selection handlers — XP went 200→206, exactly matching the `Math.round(4×1.5)=6` formula. Switched Credit↔Crypto — same 206 both times. Relaunched — 206 persisted in the engine and in localStorage. Zero console errors.

### Files modified

- `learning-engine.js`, `tests/learning-engine.test.js`
- `docs/V1_RELEASE_CHECKLIST.md`

### Remaining blockers

Level progression (3, with the ÷100-vs-÷250 bug already queued), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8, with the dead-legacy-code removal queued), store assets (9), submission (10).

---

## 2026-07-20 (latest) — Version 1.0 launch plan adopted; Blocker 1 (Score system) verified

**Mission change:** development on new features/worlds/modes is frozen. From here forward, all work targets Version 1.0 App Store/Google Play submission: Crypto World, Credit World, and the existing word-wheel/crossword game only. Full plan, phase checklist, and per-blocker log now live in `docs/V1_RELEASE_CHECKLIST.md` (updated after every blocker). Old task-list items for future worlds/content (Credit Cards world, etc.) were removed — flagged as an assumption pending confirmation: "Credit World" is read as *today's* Credit Foundations content, not the still-locked future Credit World modules (Credit Cards, Interest & Borrowing, Credit Reports, Identity Protection, Loans & Offers), since the plan's phases are entirely verification/bugfix/store-prep with no content-authoring phase.

### Blocker 1 — Score system — Verified

No functional bug found in `scoreQuiz` (percent/pass-fail math, XP-award-once, bestScorePercent-as-max were already correct and tested). Real gap: the on-screen quiz-position → per-type-answer-index mapping was duplicated inline in `workbook-app.js`'s `wbAnswerMc`/`wbAnswerTf`, with no automated coverage (DOM-coupled file, not requireable in Node) despite sitting directly on the "answered correctly" → "scored correctly" path. Extracted to a pure `answerPositionForType(quizQuestions, index, type)` in `src/workbook-engine.js`; both call sites now use it, no behavior change. Added a unit test plus a full simulated-quiz-walk test against real CRF-001 content (147/147 suite passing). Live-verified with real clicks in the browser: a real CRF-001 attempt (7/8, one deliberate wrong answer) scored and displayed correctly with the right question flagged and exactly +100 XP awarded once; a subsequent deliberately-bad retry (1/8) left XP, completion status, and best score untouched. No console errors. Full writeup: `docs/V1_RELEASE_CHECKLIST.md` → Blocker Log → Blocker 1.

### Files modified

- `src/workbook-engine.js`, `workbook-app.js`, `tests/workbook-engine.test.js`
- `docs/V1_RELEASE_CHECKLIST.md` (new)

### Remaining blockers

XP calculations, level progression, puzzle progression, save/load persistence, Crypto e2e, Credit e2e, bug sweep/performance, store assets, submission — see the checklist doc. Awaiting go-ahead before starting the next blocker.

---

## 2026-07-20 (latest) — Fix starting coins and hint purchase logic (single-source-of-truth economy)

### Root cause

The literal `300` (the full word-and-definition reveal cost) was hardcoded **independently in two places**: `learning-engine.js`'s `playerDefaults()` (a new player's starting `coins`) and `word-game-app.js`'s `WG_FULL_REVEAL_COST` constant. They agreed only by coincidence — nothing tied them together, so a future change to one without the other would silently reproduce the exact symptom this ticket described (a new player starting with a balance that can't afford a single full reveal). Traced the full lifecycle (`playerDefaults` → `createSave`/`normalizeSave` → `LearningEngine` constructor → persisted save → `wgUpdateHeader` display) and confirmed migration for saves missing the `coins` field, and preservation of an existing balance (including an explicit `0`) for returning players, were already correct — the real defect was architectural (duplicated constant, duplicated purchase-deduction logic in `wgHint`/`wgRevealFull`), not a live zero-balance bug in current save-handling code.

### What changed

- **`learning-engine.js`**: added `DEFAULT_FULL_REVEAL_COST` (the one literal `300` in the codebase) and `buildEconomyConfig(fullRevealCost)` → `{fullRevealCost, startingCoins}`, with `startingCoins` always derived from `fullRevealCost` so they cannot drift apart. `DEFAULT_ECONOMY_CONFIG` is the frozen default instance, exported alongside the existing `DEFAULT_MASTERY_CONFIG`. `playerDefaults()` now sets `coins: DEFAULT_ECONOMY_CONFIG.startingCoins` instead of a bare literal. Added `LearningEngine.spendCoins(cost)` — checks the balance, deducts exactly once, persists immediately, returns `false` (no mutation) if insufficient — as the one shared implementation of "confirm balance sufficient / deduct exact cost once / persist immediately / never go negative."
- **`word-game-app.js`**: `WG_FULL_REVEAL_COST` now reads `FinLitLearning.DEFAULT_ECONOMY_CONFIG.fullRevealCost` instead of its own literal `300`. `wgHint()` and `wgRevealFull()` now call `learning.spendCoins(cost)` instead of each repeating its own balance-check-then-deduct-then-persist block. Behavior is unchanged (same checks, same order, same toasts) — this is a de-duplication, not a logic change. `WG_LETTER_HINT_COST` (100, unrelated) was left untouched.

### Verified

- 11 new tests in `tests/learning-engine.test.js` (full suite 145/145): brand-new player starts at `fullRevealCost` (not zero); `startingCoins`/`fullRevealCost` cannot be configured independently; changing the configured cost changes the derived starting balance (`buildEconomyConfig`); `spendCoins` deducts the exact cost once and persists immediately; refuses and mutates nothing when insufficient; never goes negative; is reused identically for both the hint and full-reveal costs; a reload from the same storage preserves a spent-down balance rather than resetting it; player coins are architecturally separate from any `save.worlds[...]` state, so switching worlds can't reset or duplicate them; an explicit `0` balance is not bumped up just because it's zero (only a genuinely missing field is migrated).
- **Live end-to-end in the real app**, not just unit tests: cleared the test save, launched fresh — coin balance showed **300**, matching the "Reveal (300)" button exactly. Purchased the full reveal on a live Crypto puzzle — word ("Mint") and its full definition both revealed, balance dropped to exactly **0** in one deduction. Reloaded — balance stayed at 0 (no reset). Switched to the Credit word game (`wgOpenWorld("credit")`, same entry point `#workbookPlayGameButton` uses) — same shared 0 balance, no duplication. Attempted another full reveal at 0 coins — correctly refused, no deduction, no reveal, balance stayed at 0, no console errors. Relaunched once more — balance still 0, confirming a returning player is never reset to the starting amount.

### Files modified

- `learning-engine.js`, `word-game-app.js`
- `tests/learning-engine.test.js`

### Known issues / recommended next steps

- None outstanding for this fix. `WG_LETTER_HINT_COST` and all other reward values were deliberately left untouched, per scope.

---

## 2026-07-20 (later) — Early-lesson puzzle eligibility fix: lesson-targeted generation + single-term puzzles

### Background

Follow-up to the Puzzle Generator Pipeline entry directly below. A post-implementation sanity check found CRF-001 and CRF-002 had **0 eligible puzzles** in the generated Credit bank despite the Concept Filter working correctly. Investigated first (see `docs/CRF_EARLY_LESSON_ELIGIBILITY_INVESTIGATION.md`, research-only, no code changed) before implementing anything, per explicit instruction. Root cause: the 9-letter wheel budget eliminates almost every combination within a small early-lesson vocabulary (only 1 of 6 possible CRF-001 word pairs fits; `OBLIGATION` alone is 10 letters and structurally can't appear in *any* puzzle), and generation drew from the full 38-word world vocabulary with no lesson-awareness, so the one valid combination essentially never got produced by chance. The Concept Filter, crossword layout, and validation rules were all confirmed correct — the gap was in generation targeting.

### What changed

Per explicit scope: backend pipeline only — no UI, no live-gameplay wiring, no raising the 9-letter wheel budget, no weakening of existing validation rules.

- **`src/puzzle-generator.js`**: `generateCandidate` gained a `mode` option (`"multi-term"`, default, unchanged behavior vs. `"single-term"`, exactly one required word pinned via `focusWord`) and a `bonusVocabulary` option so bonus-word detection can scan the full world vocabulary even when the required-word pool is restricted to a lesson's allowlist.
- **`src/puzzle-validator.js`**: `wordCountInRange` is now `puzzleMode`-aware — a `"single-term"` puzzle is legitimate at exactly 1 word; every other shape (including legacy records with no mode set) keeps the original `[2,5]` rule exactly as before. Added a `puzzleModeValid` check. `assemblePuzzle` now attaches `puzzleMode`, `eligibleLessonIds` (denormalized, computed from tags + the full lesson-allowlist map), and `sourceGenerationScope` (`{type:"world"}` or `{type:"lesson", lessonId}`).
- **`src/puzzle-pipeline-service.js`**: new `generateLessonPuzzles(worldVocabulary, worldId, lessonId, allowedTags, count, deps, options)` — restricts the required/focus-word pool to the lesson's cumulative allowlist (instead of the whole world), generates multi-term puzzles first, fills any remaining shortfall with single-term puzzles, counts already-eligible bank puzzles toward the target before generating anything new (making it idempotent), and never fabricates a duplicate content signature to hit the requested count — a genuine shortfall comes back as a structured `warnings` entry instead. New `detectUnplayableTerms` (flags vocabulary words whose wheel size alone exceeds the budget) and `computeEligibleLessons` (per-puzzle companion to `filterBankByTags`).
- **`scripts/generate-puzzle-bank.mjs`**: three new modes alongside the existing `--size` world-level mode — `--lesson=<id> --count=<n>` (single lesson), `--through=<id> --count-per-lesson=<n>` (every lesson up to and including the given one), `--all-lessons --count-per-lesson=<n>` (the whole curriculum). Lesson-targeted runs write/merge `content/puzzle-banks/<world>-unplayable-terms.json`.
- **`scripts/regenerate-puzzle.mjs`**: now respects the target puzzle's `puzzleMode`, and for a lesson-scoped puzzle regenerates from that same restricted lesson vocabulary (not the whole world) so a replacement can't silently pull in vocabulary the lesson hasn't unlocked.

### Verified

- 19 new tests (`tests/puzzle-lesson-generation.test.js`); full suite 135/135 passing.
- Ran the CLI for real against the live Credit Foundations curriculum, not just unit tests:
  - `--through=CRF-005 --count-per-lesson=10`: **CRF-001 reached 4/10** (1 multi-term `CREDIT`+`TERMS` — the only pair that fits the wheel budget — plus 3 single-term `CREDIT`/`TERMS`/`ACCOUNT`; shortfall of 6 reported explicitly, `OBLIGATION` flagged unplayable). **CRF-002 reached 7/10** (CRF-001's puzzles carried forward automatically via the cumulative allowlist, plus 3 new single-term puzzles; `OBLIGATION` and `AFFORDABILITY` flagged unplayable). **CRF-003 (11/10), CRF-004 (14/10), CRF-005 (24/10) all met the 10-puzzle target** with real, non-duplicated content.
  - `--all-lessons --count-per-lesson=8` across all 15 CRF workbooks: CRF-003 onward all hit target, with CRF-004+ needing **zero new generation** — earlier lessons' puzzles already covered them, confirming cumulative reuse works across the whole curriculum.
  - Re-ran the identical `--through=CRF-005` command a second time: every lesson reported `0 new`, confirming idempotency live, including the two genuinely-short lessons (the shortfall didn't change or get papered over on a second pass).
  - Regenerated a lesson-scoped single-term puzzle (`CREDIT-P0053`); confirmed `puzzleMode` and `sourceGenerationScope` survived correctly; bank re-validated 58/58 clean.
  - Every bank produced in this pass validated 100% — no invalid puzzle was ever written to disk.

### Files modified

- `src/puzzle-generator.js`, `src/puzzle-validator.js`, `src/puzzle-pipeline-service.js`
- `scripts/generate-puzzle-bank.mjs`, `scripts/regenerate-puzzle.mjs`, `scripts/puzzle-cli-shared.mjs` (new `loadLessonAllowlists`, `defaultUnplayableReportPath`, `mergeUnplayableReport` helpers)
- `tests/puzzle-lesson-generation.test.js`
- `docs/PUZZLE_GENERATOR_PIPELINE.md` (§5a added; §3, §4, §8, §11 updated; new Implementation status entry)
- `docs/CRF_EARLY_LESSON_ELIGIBILITY_INVESTIGATION.md` (resolution pointer added at top; original research preserved)
- `content/puzzle-banks/credit-puzzle-bank.json` (regenerated, 58 puzzles), `content/puzzle-banks/credit-unplayable-terms.json` (new)

### Known issues / recommended next steps

- CRF-001 (4/10) and CRF-002 (7/10) remain genuinely short of the 10-puzzle target — this is the real combinatorial ceiling of their vocabulary under the current 9-letter wheel budget, not a bug. Options for a future decision (not made here): raise the wheel budget (needs a UI check on the letter-wheel widget first), grow Credit's early-lesson vocabulary, or accept a lower `requiredPuzzles` target for the earliest lessons specifically.
- `OBLIGATION`, `AFFORDABILITY`, `UNDERWRITING`, `DISBURSEMENT` are flagged unplayable under the current budget across every lesson that unlocks them — same open question as above.
- Still not wired into live gameplay (`word-game-app.js` still uses the simpler `puzzle-bank-engine.js` random-word banks) and no admin UI — both deliberately out of scope for this pass.

---

## 2026-07-20 — Puzzle Generator Pipeline: backend content-generation infrastructure (Phase 1 = Engine, CLI only)

### What changed and what didn't

Per explicit scope: no UI redesign, no gameplay changes, no wiring into `word-game-app.js` or any live screen. This is backend content-generation infrastructure — CLI-only this phase, with services architected UI-agnostic so a future web Admin Console can reuse the exact same generation/validation logic later without a refactor (Phase 1 = Engine, Phase 2 = Admin Console, deferred).

### The core model: world-scoped Knowledge Graph, not per-lesson banks

Direction settled during architecture review (full design in `docs/PUZZLE_GENERATOR_PIPELINE.md`): a **world-scoped Puzzle Bank** backed by a **world-scoped Knowledge Base** (all vocabulary for that world). Lessons do not own puzzle banks — they define which concepts (tags) are unlocked, cumulatively, matching the existing sequential workbook unlock order. Puzzle eligibility for a lesson = every tag on the puzzle is within that lesson's allowed set. This resolves the scaling tension a per-lesson model would hit (a 5-term lesson can't support 150 distinct puzzles on its own) without changing the selection/anti-repetition logic already proven in `puzzle-bank-engine.js`.

### New pure logic modules

- `src/puzzle-generator.js` — `generateCandidate(vocabulary, shuffleFn, wheelForFn, canFormFn, options)`: extends the existing greedy word-selection with optional focus-word pinning and bonus-word detection (via the existing `canForm`).
- `src/difficulty-scorer.js` — `scoreDifficulty(candidate)`: deterministic 0–100 composite score (wheel size, rare letters, avg word length, bonus count, focus word length) → Easy/Medium/Hard/Expert.
- `src/hint-generator.js` — `generateHint(candidate, strategy)`: pluggable strategy, default `"definition-clause"`; written so an LLM-backed strategy is a drop-in replacement later.
- `src/puzzle-validator.js` — `validatePuzzle`/`assemblePuzzle`: 10 named checks (`focusWordExists`, `everyRequiredWordBuildable`, `noImpossibleBonusWords`, `crosswordPlaceable`, `wordCountInRange`, `wheelWithinBudget`, `noDuplicateId`, `difficultyAssigned`, `definitionPresent`, `hintPresent`) returning `{valid, errors[]}`; assembler attaches world-scoped id/tags/timestamps.
- `src/puzzle-pipeline-service.js` — `generatePuzzleBank` (orchestrates the above into a retry-until-full bank-building loop, reusing `puzzleId` from `puzzle-bank-engine.js` for content dedup), `filterBankByTags` (the Concept Filter stage), `deriveCumulativeAllowlists` (derives each Credit workbook's cumulative allowed-concept list directly from `curriculum/credit/approved/runtime/credit-foundations.json` — no new authoring needed).
- `src/puzzle-bank-migration.js` — `migrateLegacyBank`: non-destructive backfill of pre-pipeline `{id, words, letters}` bank entries to the full schema, matching the save-version backfill pattern already used in `learning-engine.js`.

### CLI tooling (thin wrappers, no business logic in the scripts themselves)

- `scripts/generate-puzzle-bank.mjs --world=<id> --size=<n>` (top-up semantics)
- `scripts/validate-puzzle-bank.mjs <file>`
- `scripts/regenerate-puzzle.mjs <file> <puzzleId>`
- `scripts/puzzle-cli-shared.mjs` (argv parsing, vocabulary loading, dependency wiring shared by all three)

### Verified

- 116/116 automated tests pass (27 new, `tests/puzzle-pipeline.test.js`), including an integration test against the real Credit Foundations curriculum file.
- Ran the CLI for real, not just unit tests: generated a 40-puzzle Crypto bank (40/40) and a 60-puzzle Credit bank (**51/60**, with an explicit warning rather than a silent short bank — Credit's 38-term Knowledge Base genuinely tops out there today; growing it further is a content task, not an engineering one). Validated both banks at 100%. Re-ran generation at the same size on top of the existing bank and confirmed idempotent top-up (`0 new`). Regenerated a single puzzle in place and re-validated the bank clean. Sanity-checked the Concept Filter against the real bank + derived allowlists: CRF-001/002 had 0 eligible puzzles out of 51 (too few unlocked concepts yet), CRF-005 had 17 — eligible count grows monotonically as designed.

### Files created

- `src/puzzle-generator.js`, `src/difficulty-scorer.js`, `src/hint-generator.js`, `src/puzzle-validator.js`, `src/puzzle-pipeline-service.js`, `src/puzzle-bank-migration.js`
- `scripts/generate-puzzle-bank.mjs`, `scripts/validate-puzzle-bank.mjs`, `scripts/regenerate-puzzle.mjs`, `scripts/puzzle-cli-shared.mjs`
- `tests/puzzle-pipeline.test.js`
- `docs/PUZZLE_GENERATOR_PIPELINE.md` (architecture doc)
- `content/puzzle-banks/crypto-puzzle-bank.json`, `content/puzzle-banks/credit-puzzle-bank.json` (generated output, not hand-authored)

### Known issues / recommended next steps

- Credit's Knowledge Base (38 terms) caps its bank around ~51 puzzles at default generation settings; growing it means adding more Credit vocabulary, not changing the pipeline.
- Not wired into live gameplay yet by design — `word-game-app.js` still uses `puzzle-bank-engine.js`'s simpler random-word banks. Wiring the Knowledge-Graph-aware bank + Concept Filter into the live playthrough selector is future work, not started.
- No Admin Console UI yet (deliberately deferred to Phase 2); today's only interface is the three CLI scripts.

---

## 2026-07-19 — Configurable playthrough size (requiredPuzzles), not just bank size

### What changed

Small, contained change on top of the Puzzle Bank work above: the "5" in "select 5 from the bank" was the one remaining hardcoded number. `src/puzzle-bank-engine.js`'s `selectPlaythrough(bank, history, lastPlaythrough, count, shuffleFn)` already took `count` as a parameter (already proven configurable in the prior entry's tests) — the only actual hardcoding was the call site in `word-game-app.js`, a module-level `WG_PLAYTHROUGH_SIZE = 5` constant used for every world. Replaced it with a per-world `requiredPuzzles` field (alongside the existing `bankSize`), so `{bankSize:10, requiredPuzzles:5}`, `{bankSize:20, requiredPuzzles:8}`, `{bankSize:50, requiredPuzzles:10}` etc. are all just world config now, no engine changes needed between them. `WG_DEFAULT_REQUIRED_PUZZLES`/`WG_DEFAULT_BANK_SIZE` exist only as fallbacks for a world config that omits the fields, not as assumptions baked into the selection logic itself.

No UI, gameplay, or word-wheel/crossword mechanic changes — both existing worlds keep `requiredPuzzles: 5` so behavior is identical to before this change.

### Files modified

- `word-game-app.js` (`requiredPuzzles` added to both world configs; `WG_PLAYTHROUGH_SIZE` constant removed in favor of per-world lookup)
- `tests/puzzle-bank-engine.test.js` (new `makeVocab(n)` synthetic-vocabulary generator so bank sizes larger than Crypto/Credit's real vocabularies — 50, 150 — are actually reachable in tests; 7 new tests)

### Verified

- 90/90 automated tests pass (7 new): parameterized over the spec's exact configuration examples — (10,5), (15,5), (20,8), (50,10), (150,15) — each proving the bank reaches the requested size and the playthrough selects exactly `requiredPuzzles` unique puzzles; a test proving two different worlds can use different `requiredPuzzles` values independently in the same run; a test proving the ≤2-overlap anti-repetition rule still holds at a non-default `requiredPuzzles` value (8).
- Live-verified in the real app: default worlds still produce a 10-puzzle bank / 5-puzzle playthrough exactly as before (cleared save, checked directly) — no console errors, screenshot confirms zero visual change. Then live-reconfigured the Crypto world in-session to `{bankSize:20, requiredPuzzles:8}` and confirmed the running app actually built a 20-puzzle bank and selected an 8-puzzle playthrough with no code changes, before restoring the defaults.

---

## 2026-07-19 — Puzzle Bank: configurable pool of puzzles per world with anti-repetition selection

### What changed and what didn't

Per the user's explicit scope: no UI redesign, no new gameplay mechanics, the existing letter-wheel/crossword screen is untouched pixel-for-pixel. The only change is *where puzzles come from*. Previously every puzzle was generated fully at random from the whole vocabulary the instant one was needed — no memory of what had been played. Now each world keeps a persisted **bank** of candidate puzzles (default 10, configurable per world via `WG_WORLDS[x].bankSize`, verified working at 10/15/20 with no code changes), and each 5-puzzle "playthrough" draws from that bank using anti-repetition rules instead of pure randomness.

### New pure logic module

`src/puzzle-bank-engine.js` (Node-testable, no DOM/browser dependency, matching the project's established pattern):
- `buildBank(vocabulary, size, shuffleFn, wheelForFn, existingBank)` — tops up a bank to the requested size using the same greedy word-combination algorithm the engine already used for one-off generation, deduping by a stable `puzzleId` (sorted word list). Existing entries are preserved, not discarded, when growing a bank.
- `selectPlaythrough(bank, history, lastPlaythrough, count, shuffleFn)` — never-played puzzles first (shuffled), then least-recently-played; defers (doesn't drop) candidates that would push overlap with the previous playthrough above 2, falling back to them only if the bank is too small to avoid it; final order shuffled. No history at all reduces to a plain random pick, satisfying the stated fallback rule for free rather than as a special case.
- `recordPlaythrough(history, playedIds, now)` — pure update, used per-puzzle immediately on completion (not batched to end-of-playthrough) so history stays accurate even if a session is abandoned mid-playthrough.

### Wiring into the existing engine

`word-game-app.js`: `wgOpenWorld` now calls `wgStartPlaythrough()` (build/load bank → select 5 → load round 1) instead of generating one puzzle. `wgFoundWord` records that puzzle's history the moment it's completed. `wgContinueAfterComplete` (the existing "Next Puzzle" button handler, unchanged UI) advances to the next round if more remain, or — on the 5th — records `lastPlaythrough` and starts a fresh playthrough selection. Bank/history/last-playthrough persist per world under the same `learning.save.worlds["wg-crypto"]` / `["wg-credit"]` objects already used for cumulative words-solved tracking.

### Files created

- `src/puzzle-bank-engine.js`
- `tests/puzzle-bank-engine.test.js` (10 tests: id stability, bank sizing at 10/15/20, bank top-up preserving existing entries, no-history random fallback, never-played priority, least-recently-played ordering, ≤2-overlap avoidance, graceful fallback when the bank is too small to avoid overlap, history recording)

### Files modified

- `word-game-app.js` (bank/playthrough state and selection, replacing per-call random generation)
- `index.html` (new script tag only — no markup changes)

### Verified

- 83/83 automated tests pass (10 new).
- Live-verified with a cleared save end to end: bank of 10 built on first open; playthrough of 5 unique puzzles selected; played all 5 rounds for real (each showing the existing completion screen, unchanged) and confirmed per-puzzle history recorded correctly (`timesPlayed`, distinct `lastPlayedAt`) immediately on each round's completion; second playthrough automatically drew the *other* 5 never-played bank entries with zero overlap; third playthrough (once all 10 had been played once) correctly rotated back to the least-recently-played half with zero overlap against the immediately preceding playthrough; confirmed bank/history/lastPlaythrough all survive a full page reload; confirmed the Credit world builds and selects from its own independent bank. No console errors, no visual differences from before.

### Completed work

- Split the two hint buttons apart, as requested — they were both wired to the same single-letter reveal: side wheel button (💡100) still reveals one letter; new bottom-nav button now reveals the full word + definition for 300 coins (`WG_FULL_REVEAL_COST`), tracked per-word via `wgState.revealed` so it can't be re-charged on the same word.
- Mission card no longer gives the answer away for free: shows the blank hint-pattern and a "tap Hint to reveal" placeholder by default, the real word/definition only after the full-reveal hint is used (or the word is solved). Naturally inherits crossing-letter visibility from the existing pattern logic.
- Starting coin balance raised from 0 to exactly 300 (`playerDefaults()` in `learning-engine.js`) — matches the full-reveal cost exactly, so every new player can afford one full reveal from their first puzzle.
- Added a real "Puzzle Solved!" completion screen (`#wgCompletePanel`) shown when the last word in a puzzle is found, replacing the old toast-and-silent-auto-advance-after-900ms behavior. Shows the coins/XP earned for that specific puzzle (tracked via new `wgState.puzzleCoins`/`puzzleXp` counters, reset each puzzle) and requires a "Next Puzzle →" tap to continue, rather than auto-advancing.

### Files modified

- `learning-engine.js` (starting coins 0 → 300)
- `word-game-app.js` (`wgRevealFull`, per-puzzle reward tracking, `wgShowPuzzleComplete`/`wgContinueAfterComplete`, mission card obscuring)
- `index.html` (`#wgCompletePanel` markup, bottom-nav hint button relabeled with its cost)
- `word-game.css` (`.wg-complete-panel` styling)
- `tests/learning-engine.test.js` (updated/added coins-default regression tests)

### Verified

- 73/73 automated tests pass.
- Live-verified with a cleared save (true new-player state): starting balance exactly 300 coins; side hint deducts 100 and reveals one letter (mission pattern updates to match); bottom-nav reveal deducts exactly 300, reveals the real word + definition, and correctly blocks a second reveal on the same word ("Already revealed") and blocks reveals with insufficient coins on a new word ("Not enough coins — full reveal costs 300"); solving a full 3-word puzzle (LEDGER/PEER/GAS) showed the completion screen with the exact correct totals (+91 coins, +20 XP); "Next Puzzle" correctly closed the screen and generated a new puzzle. No console errors throughout.

---

## 2026-07-19 — Architecture correction: one unified, data-driven word-game engine (retires the separate Crypto/Credit puzzle code)

### Why

The previous entry built `credit-game-app.js` as a parallel system alongside `app.js`'s Crypto puzzle code — same mistake pattern as the earlier workbook-vs-Crypto split, but this time for two instances of the *same* mechanic. The user corrected this directly: worlds are content, not separate codebases; there should be one puzzle engine that takes a world's vocabulary as data and renders it identically regardless of subject. They also supplied a visual reference (dark "space" theme, coins/XP/gems economy, level badge, a single-word "mission" card with its reward shown, streak + daily-progress display, bottom nav) to replace the old light-themed crossword screen everywhere.

### What was built

- **New unified engine**: `word-game-app.js`. One `wgOpenWorld(worldId)` entry point, one puzzle-generation/crossword/wheel/shuffle/hint/definitions implementation, driven entirely by a small `WG_WORLDS` config (`{ key, icon, name, vocabulary() }`) — Crypto and Credit are two ~5-line entries pointing at their existing term lists (`WORLD.terms`, `window.CREDIT_GAME_TERMS`). No puzzle-rendering code branches on which world is active.
- **Retired**: `credit-game-app.js` and its dedicated `#creditGameScreen` markup, deleted outright rather than left as dead code. The old numbered Level 1–5 / 5-round-gate / Daily Review / manual New Game / Skip Lessons system built earlier in this session for Crypto specifically is also superseded — `#playScreen` is no longer shown by any entry point (kept in the DOM, hidden, rather than deleted, in case any reference was missed). The new model is the same for both worlds: endless regenerating puzzles plus a persistent "words solved / world vocabulary size" counter.
- **New premium UI**: `word-game.css` + a new `#worldGameScreen` section in `index.html` — dark space theme, gold-outlined crossword cells, coins/XP/gems header, level badge with XP progress, mission card (current word + definition + reward), streak/daily-progress bar, bottom nav (Knowledge/Hint/Shuffle/Journey/Pause), and a modal Definitions panel (replacing the old always-visible clue list).
- **Coins made real** (per the user's explicit choice, not cosmetic-only): `learning-engine.js` player model gained a `coins` field (added to `playerDefaults()`, which both `createSave` and `normalizeSave` already call — safe from the earlier duplicate-literal class of bug). Reward formula: `coins = word.length * 7`, `xp = round(word.length * 1.5)`. Gems left at 0/unwired, as agreed — reserved for a future mechanic rather than invented now.
- Per-world persistent progress (`solvedWords` array) stored under new `learning.save.worlds["wg-crypto"]` / `["wg-credit"]` keys, separate from the Credit Foundations *workbook* progress that already lives under `["credit-foundations"]`.
- Crypto's existing per-term mastery data (`learning.recordPuzzleSolved`) still updates in the background on word-find, so the dashboard's Crypto stats don't regress — but the rich per-word lesson modal (`showLearn`, SM-2 review) is explicitly **not** wired into the new engine yet. Flagging this clearly rather than leaving it ambiguous: Credit vocabulary has no authored lesson content to power an equivalent modal, and bolting Crypto's modal onto the new engine alone would leave the two worlds inconsistent in a different way. Real follow-up, not done here.

### Real bug found and fixed before reporting this done

Live-testing the full click path (game → Continued education → dashboard → back into the game) surfaced that `showDashboard()` and `openWorkbookWorld()` were never updated to hide the new `#worldGameScreen` — so navigating "away" from the word game left it visible underneath whatever screen was supposed to show next. Root cause: three different functions in three different files (`app.js`, `workbook-app.js`) each independently list which screens to hide, and adding a fourth top-level screen meant updating all of them, which I missed on the first pass. Fixed `showDashboard`, `showPlay`, and `openWorkbookWorld` to all hide `#worldGameScreen`; re-verified the full navigation chain afterward with real clicks, not just direct function calls.

### Files created

- `word-game-app.js`, `word-game.css`

### Files removed

- `credit-game-app.js`, its `#creditGameScreen` markup, and its script tag

### Files modified

- `index.html` (new `#worldGameScreen`, retired screen removed, `#playScreen` hidden by default, script tags updated)
- `app.js` (`showPlay`/`showDashboard` hide the new screen; dashboard CTAs now open `wgOpenWorld("crypto")` instead of the old level system; init no longer auto-shows the old screen)
- `workbook-app.js` (`openWorkbookWorld` hides the new screen; "Play the credit word game" now calls `wgOpenWorld("credit")`)
- `learning-engine.js` (`coins` field)
- `tests/learning-engine.test.js` (regression test for the coins default, same pattern as the earlier `skipLessons` one)

### Verified

- 72/72 automated tests pass.
- Live-verified with real clicks end to end: home screen loads as the new dark-themed Crypto puzzle (no console errors) → solved a word → coins (+28), XP (+6), level bar, streak, and daily-progress dot all updated correctly and matched the reward formula exactly → mission card advanced to the next unsolved word → Definitions panel opens/closes correctly, found vs. unfound words rendered distinctly → back button returns to dashboard (screen-hiding bug fixed here) → Credit Foundations → "Play the credit word game" renders the *same* engine with Credit's icon, name, and 38-word vocabulary, correct definitions, correct rewards on solve, correct puzzle regeneration on completion → full reload preserves coins/XP/level and shows correct per-world "words solved" counts independently for each world.

---

## 2026-07-19 — New Credit word game (parallel to the Crypto word game)

### Completed work

- Built a second word-connect puzzle game for Credit vocabulary, reachable via a new "🎮 Play the credit word game" button at the top of the Credit Foundations map. Built as a fully parallel system (own screen `#creditGameScreen`, own controller `credit-game-app.js`, own state) rather than making the existing Crypto `app.js` multi-world-aware — same low-risk pattern already used for the workbook flow, so the working Crypto game was not touched at all.
- Vocabulary is real, not invented: `scripts/build-credit-game-terms.mjs` extracts single-word flashcard terms (word + definition) straight from the 15 Credit Foundations workbooks — 38 terms (CREDIT, BORROWER, LENDER, DEBT, LOAN, PRINCIPAL, INTEREST, APR, DEFAULT, DELINQUENCY, COLLATERAL, etc.). Multi-word flashcard terms ("Credit limit", "Minimum payment") are skipped since the crossword/wheel mechanic needs unbroken single words.
- Reuses the shared engine (`FinLitGameEngine.layoutWords`/`wheelFor`) and the shared `learning` save/XP system rather than building new persistence. Scoped deliberately lighter than the Crypto game: no per-term lesson modal, no bonus words — the always-visible definitions/clue list is the educational surface, and solving a word awards simple session XP directly.
- Kept the "New Game" and self-regenerating puzzle behavior consistent with the Crypto game: finishing a puzzle automatically generates a new one from the full 38-word pool (no fixed "level 1" set to get stuck on), plus a manual 🎲 button.

### Real bug found and fixed before reporting this done

The first version's puzzle builder (same "add words while combined wheel size ≤ 9" greedy approach used for Crypto) failed constantly — live-tested and it returned "Couldn't build a puzzle" on the very first real attempt. Root cause: credit vocabulary is longer and far less letter-efficient than Crypto's curated 20-word set (many 10–17 letter terms like CREDITWORTHINESS, DISBURSEMENT, CAPITALIZATION), so a single unlucky first word could eat nearly the whole 9-letter budget, leaving no room for a second word — unlike Crypto where hand-picked short words made this rare. Fixed by trying up to 12 shuffles for a 2+ word puzzle before falling back to the best single-word attempt found, rather than failing outright. Re-tested: 15/15 consecutive attempts succeeded with 2+ words after the fix (0/1 succeeded before it, on the one attempt made — caught immediately rather than left for the user to hit).

### Files created

- `scripts/build-credit-game-terms.mjs`, `content/credit-game-terms.json`, `content/credit-game-terms.js`
- `credit-game-app.js`

### Files modified

- `index.html` (new screen, entry button on the workbook map, new script tags)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser: full path from the game's "Continued education" button → dashboard → Credit Foundations map → "Play the credit word game" → real crossword/wheel render with real credit definitions → solved a word (XP and yield updated correctly) → completed the puzzle (auto-regenerated a new one, found-set reset) → back button correctly returns to the Credit Foundations map. No console errors. Puzzle builder verified reliable across 15 consecutive attempts post-fix.

---

## 2026-07-19 — Correction: randomize the first game too, not just rounds 2–5

### What was wrong

The previous entry's gate deliberately kept round 1 as the fixed original TOKEN/NODE/COIN/MINT puzzle "to preserve the tutorial experience" — an assumption I made without being asked, and it was wrong: the user pointed out the first game was still always the same 4 words no matter how many times they reloaded. There was never a real reason it needed to stay fixed — the clue-card/definitions UI is driven generically by whatever words are in `LEVELS[0].words`, already proven working with random content during rounds 2–5.

### Fix

At app init, before the first render, `LEVELS[0]` is now overwritten with a `buildRandomPuzzle()` result the same way rounds 2–5 already are — so game 1 is random on every fresh page load too, not just every completion.

### Verified

- 71/71 automated tests pass.
- Live-verified: 3 consecutive fresh page loads produced 3 different word sets for "Game 1 of 5" (GAS/FORK/HASH, then WALLET/VAULT, then NODE/GAS/COIN — the old fixed TOKEN/NODE/COIN/MINT never reappeared as a forced first game). Re-ran the full 5-round-to-Level-2 gate sequence to confirm the promotion logic still fires correctly with this change; it does. No console errors.

---

## 2026-07-19 — Gate Level 2 behind 5 completed rounds at Level 1

### Completed work

- Level 1 no longer promotes to Level 2 after a single completion. It now takes 5 completed rounds: round 1 is the original hand-authored TOKEN/NODE/COIN/MINT puzzle (unchanged, keeps the tutorial clue-card experience), rounds 2–5 are freshly generated via the same greedy word-builder behind the "New Game" button (`buildRandomPuzzle()`, extracted as a shared helper) — so the user isn't shown the same TOKEN/COIN pair on repeat. Only after the 5th completion does `advance()` fall through to the real Level 2 (`Shared liquidity`).
- Added a visible counter: the level label reads "Game 1 of 5" through "Game 5 of 5" while in this gated stretch, then reverts to normal "Level N" labeling once past it.
- The standalone 🎲 New Game button and Daily Review are unaffected — both are tracked via separate flags (`state.custom`, `state.review`) and neither touches the Level 1 gate counter.

### Files modified

- `app.js` (`buildRandomPuzzle()` extracted from `newGame()`; `advance()` rewritten with the gate; level label logic; `state.level1GamesPlayed` + `LEVEL1_GAMES_REQUIRED`)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser by driving `advance()` through a full 7-round sequence: rounds 1–5 stayed at Level 1 with the label counting up (Game 1 of 5 → Game 5 of 5) and different word sets each round after the first (TOKEN/NODE/COIN/MINT → PEER/BLOCK/LOCK → TOKEN/NODE/LOCK/COIN → SWAP/NODE/GAS → NODE/FORK/COIN); round 6 correctly promoted to Level 2 (Shared liquidity, POOL/LOCK/BLOCK/FORK); round 7 continued normally to Level 3. Confirmed the New Game button still works independently and doesn't affect the gate counter. No console errors.

**Note on counter persistence:** `state.level1GamesPlayed` lives in memory only (matches how `state.found`/`state.tries`/etc. already work), so it resets on a full page reload — a learner who reloads mid-arc gets 5 fresh rounds rather than resuming a partial count. Flagging this now in case persisted progress is wanted later; not implemented since it wasn't asked for and the existing in-memory pattern is what the rest of session state already does.

---

## 2026-07-19 — "New Game" button: real puzzle variety from the full 20-word vocabulary

### Completed work

- Added a 🎲 "New Game" button to the play screen topbar. Previously "Level 1" always meant the same fixed four words (TOKEN, NODE, COIN, MINT) — this generates a genuinely different puzzle (different word subset, different letter wheel) from the full 20-word Crypto vocabulary each time it's pressed, reusing the existing `wheelFor()` engine function (already used by Daily Review) rather than adding new puzzle-building logic.
- **First implementation was broken and I didn't ship it as "verified" without testing**: picking 4 random words up front and rejecting the whole batch if their combined unique-letter count exceeded the 9-letter wheel cap almost always failed, because the existing hand-authored levels were specifically curated for letter overlap (e.g. Level 1's TOKEN/NODE/COIN/MINT share letters down to exactly 9 unique) — 4 arbitrary words from a 20-word pool of largely dissimilar terms essentially never fit by chance. Caught this via live testing (8/8 attempts returned the failure toast) before calling it done, not after.
- Fixed with a greedy builder instead: shuffle the full word pool, walk through it once, add each candidate word only if it keeps the *cumulative* required letters at or under 9, stop at 5 words or end of pool. Guarantees convergence (the first word always fits; each subsequent word is only added if it still fits) rather than gambling on a lucky batch. Re-tested: 8/8 live attempts succeeded with varied word sets (STAKE, CHAIN, YIELD, BURN, SWAP, LEDGER, PEER, GAS, POOL, LOCK, MINT, COIN, TOKEN all appeared across different runs).
- Generated puzzles are pushed onto `LEVELS` and switched to, same pattern as Daily Review; labeled "New game" (added `state.custom` alongside the existing `state.review` flag, reset alongside it at every other level-transition site so the label doesn't leak between modes).

### Files modified

- `index.html` (🎲 button)
- `app.js` (`newGame()`, `state.custom`, label logic, reset at all level-transition sites)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser: 8 consecutive presses, 8 successful varied puzzles (0 failures after the fix; 8/8 failures before it, which is why the greedy rewrite happened before reporting this done).

---

## 2026-07-19 — Made the word game the home screen; journey map moved to "Continued education"

### Completed work

- Flipped the app's landing screen: the Crypto word game (`#playScreen`) is now what loads on open, not the journey-map dashboard. The user's framing: the game is the main product, the learning/journey content is secondary and should be reached deliberately, not be the first thing shown.
- Added a "Continued education →" button at the bottom of the game screen (below the definitions/clue card) that takes the learner to the journey map/dashboard — replacing the old flow where the dashboard was home and "Continue Adventure" led *into* the game. The dashboard's own "Continue Adventure" button is unchanged and still works to jump back into the game from there.
- Updated `index.html` defaults (`#dashboardScreen` now starts `hidden`, `#playScreen` no longer does) and `app.js`'s init sequence now calls `showPlay()` at the end instead of unconditionally adding the `journey-mode` class, so the correct screen is guaranteed regardless of markup state.

### Files modified

- `index.html` (default visibility swap, new "Continued education" button)
- `styles.css` (`.continued-education` styling, matching the play screen's existing light theme rather than the dashboard's separate dark/gold `journey-mode` palette)
- `app.js` (init sequence, new button wiring)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser: fresh load opens directly into the word game (not the dashboard); "Continued education" navigates to the journey map; dashboard's existing "Continue Adventure" still returns to the game; no console errors.

---

## 2026-07-19 — Crypto word game: level randomization, shuffle bug, letter-hover glitch

### Completed work

- Randomized both the Level 1 clue-list order and the initial letter-wheel arrangement on every level entry (`renderLevel()`), instead of always showing the same fixed order from `worlds/crypto.js`. Clue order is computed once per level entry (`state.clueOrder`) and stays stable while playing that attempt — it doesn't re-shuffle every time a word is found.
- Fixed the manual shuffle button (center of the letter wheel): it used `array.sort(() => Math.random() - 0.5)`, a well-known unreliable "shuffle" that frequently fails to visibly reorder small arrays in real JS engines (non-transitive comparator, especially weak on ~9-element arrays). Replaced with a proper Fisher-Yates shuffle (`shuffled()` helper, also used for the level-entry randomization above so both use the same correct algorithm). Verified with 6 consecutive shuffles in a live browser session — order changed all 6 times (previously could silently produce no visible change).
- Fixed a real CSS bug causing letters to visually jump when the mouse hovered over them: `premium.css` has a global `button:hover{transform:translateY(-2px)}` rule. Since `.letter` buttons are positioned via `transform:translate(-50%,-50%)` (required for centering them on their calculated circular coordinates), the global hover rule was *replacing* that centering transform rather than adding to it — hovering made a letter snap from its correct centered position to being anchored near its top-left corner, then snap back on mouseout. Added `button.letter:hover`/`:active` overrides (higher specificity, `button.letter` vs `button`) that preserve the centering translate and layer a small scale on top instead. Verified via a real hover in a live browser session — computed transform now correctly reads `matrix(1.05,0,0,1.05,-29,-29)` (translate preserved, scale added) instead of losing the -29,-29 offset.

### Files modified

- `app.js` (`shuffled()` now Fisher-Yates; `shuffle()` reuses it; `renderLevel()`/`renderGrid()` randomize clue order and initial wheel letters)
- `styles.css` (`.letter` hover/active transform overrides)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser: clue order and wheel letters differ across repeated level entries; shuffle button changes order on 6/6 consecutive presses; hover no longer displaces letter position.

---

## 2026-07-19 — Persistent "skip lessons" toggle for the Crypto word game

### Completed work

- Added a permanent, learner-facing "⏭ Skip lessons" toggle to the Crypto play screen topbar. It sets the existing (pre-existing, unmodified) `state.skip` flag that already gated the per-word lesson/quiz modal — previously that flag was only reachable via a "Skip cards this level" button buried inside the modal itself (only visible after finding a word), and it reset every level. The new toggle is visible immediately, works before finding any word, and persists as a real player setting (`save.settings.skipLessons`, reused in the existing save file) rather than resetting per level.
- Extended `learning-engine.js`'s settings defaults (`createSave` and, critically, `normalizeSave`'s merge default — see bug below) with `skipLessons:false`.
- Styled with a plain CSS `.icon-button.active` state (green fill) consistent with the existing Crypto screen's non-dark-mode palette (that screen doesn't use the newer `--app-*` dark-mode tokens; matched its existing convention rather than introducing a mismatched style).

### Real bugs found and fixed during verification

1. **`normalizeSave` default merge gap**: the `skipLessons:false` default was added to `createSave()` but the *separate* default object literal inside `normalizeSave()` (used for every existing/reloaded save, i.e. almost all real usage) was missed on the first pass — an exact-string `replace_all` matched one occurrence but not the other because surrounding text differed. Caught by testing against a save that predates the setting, not just a fresh one. Added a regression test (`tests/learning-engine.test.js`, "loading a pre-existing v3 save without skipLessons still defaults it to false") so this can't silently regress again.
2. **Dev server caching**: the `.claude/launch.json` static server (plain `python3 -m http.server`) sends no `Cache-Control` headers, and — separately and more stubbornly — this session's Browser-pane tooling appeared to cache responses for one specific port (8743) at a layer that survived killing/restarting the backend process, new tabs, and forced navigations; a fresh port (8756) immediately worked. Spent significant time initially misdiagnosing this as an application bug (function declarations "not attaching to `window`") before isolating it via a controlled test: fetching+`eval`-ing the current file text directly always worked, while the normal `<script src>` load intermittently didn't, and it depended on port, not code. Replaced the dev server with `.claude/no-cache-server.py` (sends explicit `Cache-Control: no-store`) on port 8756, and updated `.claude/launch.json` to match. **Takeaway for future work in this repo**: if a change verified correct by direct code review and Node-side tests still appears not to run in the Browser pane, suspect the dev server/cache before the code — open a fresh tab on port 8756 (not 8743) to rule it out quickly.

### Files created

- `.claude/no-cache-server.py`

### Files modified

- `index.html` (new topbar button)
- `app.js` (toggle handlers, wired via explicit `window.X = function(){}` rather than bare `function` declarations — a defensive choice made while chasing the caching issue above; harmless either way, so left as-is rather than reverting)
- `styles.css` (`.icon-button.active`)
- `learning-engine.js` (settings default, both call sites)
- `.claude/launch.json` (points at the no-cache server, port 8756)
- `tests/learning-engine.test.js` (regression test)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser (fresh tab, port 8756): toggle attaches correctly, toggling on/off fires the correct toast each direction, `aria-pressed`/`active` class update correctly, setting persists across a full page reload.

---

## 2026-07-19 — Credit Foundations workbook engine: lesson, flashcard, matching, and quiz UI

### Completed work

- Built the reusable game functions the previous entry identified as missing: a lesson renderer (objective → core-lesson paragraphs → example/non-example → misconception → key takeaway, paged like the existing Crypto micro-lesson flow), a flashcard engine (flip, next/prev, progress), a matching-practice engine (tap-pair, wrong-match feedback, completion detection), and a quiz engine covering both assessment formats in the CRF content (5 multiple-choice + 3 true/false per workbook, immediate feedback with explanations, running score).
- Added `src/workbook-engine.js`: pure, DOM-free logic for quiz scoring (percent/pass-fail against each workbook's `masteryRule.passingScore`), matching-round construction with shuffle, and prerequisite-chain unlock/status/next-available logic. Fully unit tested (9 new tests) before any UI was wired to it.
- Extended `learning-engine.js` additively (no existing method signatures changed): `workbookProgress`, `recordWorkbookPractice`, `recordWorkbookAttempt`, `workbookWorldStats`. Reuses the existing save file (v3), the existing `save.worlds` bucket that was already reserved but unused, and the existing `persist()`/`touchActivity()` machinery — no second persistence layer. XP is awarded once per workbook (first pass only); replaying after completion updates `bestScorePercent` and `attempts` but does not re-award XP (6 new tests, including an explicit duplicate-XP-farming test and a same-storage-reload persistence test).
- Added `workbook-app.js` (controller/UI) and `workbook-engine.css` (new screens, using the same theme-aware `--app-*` tokens and dark-mode support as the premium dashboard, not the older non-dark-mode `styles.css` palette the legacy Crypto game screen still uses).
- Added `curriculum/credit/approved/runtime/credit-foundations.js` and `worlds/credit-foundations.js` adapters (same reason `content/crypto-terms.js` exists: opening `index.html` via `file://` blocks local JSON fetches).
- **Rewired real navigation**: the "Credit Foundations" journey-map node previously opened Crypto word-connect content under a mismatched label (the whole "journey map" was cosmetic — `JOURNEY_SECTIONS` just relabeled Crypto level indices). It now opens the real Credit Foundations workbook world. No other journey nodes or existing Crypto behavior were touched.
- **Live-verified in an actual browser**, not just unit tests: served the app over local HTTP (`file://` blocked automated navigation; added `.claude/launch.json` for a static server), played CRF-001 completely — 8-step lesson, 5 flashcards (including the flip interaction), 4-pair matching (including a deliberate wrong match to confirm rejection), and all 8 quiz questions — reached the results screen with the correct score (8/8, 100%, +100 XP), confirmed the map updated to show CRF-001 completed and CRF-002 unlocked, opened CRF-002 to confirm distinct real content renders, and confirmed everything survived a full page reload via localStorage. Checked the console for errors at every step (none).
- **Found and fixed a real bug during this verification**: the back button did nothing when pressed from the workbook map (`wbState.lastView` was compared against the literal string `"map"`, but the view id actually stored was `"workbookMapView"` — an always-false check). Fixed, then re-verified both back-navigation paths (map → dashboard, sub-view → map).
- Ran the full suite after every change: 70/70 passing (55 previous + 9 workbook-engine + 6 workbook-progress).

### Files created

- `src/workbook-engine.js`, `workbook-app.js`, `workbook-engine.css`
- `curriculum/credit/approved/runtime/credit-foundations.js`, `worlds/credit-foundations.js`
- `.claude/launch.json` (local static server for browser verification)
- `tests/workbook-engine.test.js`, `tests/workbook-progress.test.js`

### Files modified

- `learning-engine.js` (additive workbook-progress methods)
- `index.html` (new `#workbookScreen` markup, new script/style tags, no existing markup removed)
- `app.js` — **not modified**; the journey-node override is applied from `workbook-app.js` after `app.js` runs, so the existing file is untouched
- `docs/GAME_COMPLETION_BASELINE.md`, `docs/TWO_WORLD_CONTENT_STATUS.md`

### Known issues / explicitly not done yet

- No dedicated learner profile screen, no daily-practice mode mixing missed/recent content across workbooks, no sorting/categorization activity component, no credit-score simulation activities.
- Some workbook-list item buttons lack accessible text labels (nested spans with no `aria-label`) — found during verification, not yet fixed.
- The dashboard side panel (streak, mastery ring, "Journey progress") still reflects Crypto-world stats, not Credit Foundations — it was not wired to the new world.
- Credit Cards world is still unstarted at the content layer; the same contract/parser/validator/test pipeline is ready to reuse once content exists.
- No error/loading/empty states added yet for malformed or missing workbook data (Phase 6 item, not started).

### Recommended next steps

1. Wire dashboard side-panel stats to `workbookWorldStats("credit-foundations", ...)` so the panel reflects real Credit Foundations progress instead of stale Crypto stats.
2. Add accessible labels to workbook-list buttons; do a pass on keyboard focus/tab order across the new screens.
3. Build daily practice, sorting/categorization, and credit-score simulation activities as their own reusable components once the core loop above has been used enough to know what's actually needed.
4. Author Credit Cards content in the same Markdown format once content sourcing is decided, and run it through the same pipeline.

---

## 2026-07-19 — Credit Foundations content contract, source integration, and conversion

### Completed work

- Ran a fresh Phase 1 baseline inspection independent of prior written summaries: confirmed stack, confirmed 42/42 existing tests pass by direct run, confirmed no Node is installed system-wide (test runner falls back to the Codex-runtime cached Node binary), confirmed the repo has no database/auth/backend beyond localStorage, and confirmed today's CRF World Readiness Review (FAIL) and Evidence Recovery Report accurately describe the repository as it stands.
- User supplied the actual CRF-001 through CRF-015 curriculum package (`FinLit_Quest_Credit_Foundations_CRF_001_015.md`), resolving the evidence-recovery report's `ADDITIONAL SEARCH REQUIRED` blocker. The package is labeled "Game-ready educational draft for integration and final editorial review" — real authored content, not yet a formally signed-off Educational Review per this project's own WRR pipeline. Treated it as the working source, not as a passed WRR.
- Preserved the supplied package unedited as the immutable approved source at `curriculum/credit/approved/workbooks/CRF-001-015-source.md`.
- Designed a new content contract for lesson/quiz-style worlds, since the existing `term.schema.json`/`world.schema.json` pair is specific to the word-connect puzzle mechanic (single uppercase `word` fitting a letter wheel, one quick-challenge, a Crypto-only category enum) and cannot represent a 15-workbook curriculum with five-question multiple-choice banks, true/false banks, matching activities, and scenario activities. Added `schemas/workbook.schema.json` and `schemas/workbook-world.schema.json` as a parallel contract rather than modifying the working Crypto schema.
- Added `src/workbook-validator.js` (same IIFE/browser-and-Node module pattern as `content-validator.js`) validating individual workbooks and whole workbook worlds: required fields, valid multiple-choice `correctIndex`, non-empty assessment sections, contiguous 1-15 sequencing, and a prerequisite chain where each workbook unlocks from exactly the immediately preceding one.
- Wrote `scripts/parse-credit-foundations.mjs`, which parses the Markdown source into structured JSON and validates it before writing anything, matching the project's existing "reports validation failures before runtime JSON is allowed" convention. Ran it: all 15 workbooks parsed and validated on the first pass. Spot-checked several workbooks' generated JSON against the source by hand (correct answers, matching pairs, prerequisite links) to confirm the parser is semantically correct, not just schema-valid.
- Added `tests/credit-foundations-content.test.js` (content-correctness tests: exact workbook count/ids, contiguous sequence, valid prerequisite chain, complete practice/assessment sets, no duplicate assessment ids, valid `correctIndex` bounds) and `tests/workbook-validator.test.js` (negative-path tests proving the validator actually rejects broken data: bad `correctIndex`, broken prerequisite chain, duplicate ids, missing assessment type, mismatched `workbookIds`).
- Full suite now passes 55/55 (42 previous + 13 new), run directly, not assumed.

### Files created

- `curriculum/credit/approved/workbooks/CRF-001-015-source.md` (immutable source, as supplied)
- `curriculum/credit/approved/runtime/credit-foundations.json` (generated, validated)
- `worlds/credit-foundations.json` (generated, validated)
- `schemas/workbook.schema.json`
- `schemas/workbook-world.schema.json`
- `src/workbook-validator.js`
- `scripts/parse-credit-foundations.mjs`
- `tests/credit-foundations-content.test.js`
- `tests/workbook-validator.test.js`
- `docs/GAME_COMPLETION_BASELINE.md`

### Architectural decisions

- Credit Foundations (and, by extension, Credit Cards) is a structurally different game mode than Crypto: a lesson → flashcards → multi-format-quiz → mastery-gate workbook flow, not a word-connect puzzle. It does not reuse `game-engine.js`'s wheel/crossword logic and should not be forced into the `term`/`world` schema built for that mechanic. Added a sibling `workbook`/`workbook-world` contract instead of redesigning the working Crypto contract.
- `worldType: "workbook"` was added as a discriminator on the new world schema so the loader/UI layer can branch on world type later; the existing `world.schema.json` for Crypto was left untouched.
- The supplied CRF content is being treated as real working source content, not as a passed formal Educational Review — that distinction is preserved in this log and in `docs/GAME_COMPLETION_BASELINE.md` rather than silently upgraded to "approved & locked."

### Known issues / explicitly not done yet

- No UI/game-engine integration exists yet for workbook-type worlds: no lesson screen, flashcard engine, quiz engine (multiple-choice/true-false/matching/scenario runner), world navigation entry, XP/mastery/streak wiring, or progress persistence for Credit Foundations. The content layer is real and tested; the player cannot play it yet.
- Credit Cards world is still unstarted at the content layer (a strong 785-line structural blueprint exists but no workbook prose).
- The formal WRR/governance reports in `curriculum/credit/approved/reports/` were not re-run or updated to reflect that source content now exists; they still describe the pre-integration state and should be revisited if the project wants to keep using that formal gate going forward.

### Recommended next steps

1. Build the reusable workbook game engine (lesson renderer, flashcard mode, quiz engine covering all four assessment formats, results screen) and wire Credit Foundations into world navigation.
2. Connect XP, mastery, streaks, and persistence for workbook-type worlds, extending `learning-engine.js` rather than duplicating it.
3. Once Credit Foundations is playable end to end, begin Credit Cards content authoring against the same contract.

---

## 2026-07-19 — Credit Foundations evidence recovery and repository alignment

### Completed work

- Searched the complete local project recursively by filename and readable content for Credit Foundations governance, workbook, review, approval, version, and relationship evidence.
- Inspected both manual ZIP backups by complete archive listing.
- Searched current curriculum, research, reports, documentation, legacy files, Git baseline history, and available Codex attachments.
- Audited 149 required evidence slots: seven governance/blueprint artifacts, nine evidence categories for each of fifteen workbooks, and seven shared approval/relationship artifacts.
- Created an evidence inventory, individual workbook coverage matrix, recovery report, canonical repository-structure proposal, and six-issue reassessment.

### Files created

- `curriculum/credit/approved/reports/CRF_EVIDENCE_INVENTORY.md`
- `curriculum/credit/approved/reports/CRF_WORKBOOK_COVERAGE_MATRIX.md`
- `curriculum/credit/approved/reports/CRF_EVIDENCE_RECOVERY_REPORT.md`

### Evidence located

- Project prompts and `PROJECT_LOG.md` stating that CRF-001 through CRF-015 and their Educational Reviews were completed elsewhere.
- Existing failed-WRR reports proving the scope and result of the first local readiness review.
- No authoritative required artifact was recovered.

### Files reorganized

- None. No candidate file had sufficient identity, version, approval, and provenance evidence to be copied or moved safely.
- No file was deleted, overwritten, renamed, merged, or substantively changed during recovery.

### Missing and ambiguous documents

- All 149 required evidence slots remain missing.
- The Platform, Domain, Credit Foundations World, and Workbook Blueprints remain missing.
- FQ-AUTH-001, FQ-WRR-001, controlled vocabulary, controlled values, and approval/relationship records remain missing.
- CRF-001 through CRF-015 Research Scopes, approved content, Educational Reviews, revision records, approval records, versions, blueprint alignment, prerequisites, and unlocks remain missing.
- Conversation-derived and project-log status assertions remain provisional; they are not substitutes for source evidence.

### Blocking issue reassessment

- All six original WRR blocking issues remain open.
- No issue can be closed from the evidence recovered locally.
- The existing WRR decision remains FAIL.

### Recovery recommendation

- Result: `ADDITIONAL SEARCH REQUIRED`.
- User-assisted recovery is required from the system where Credit Foundations was authored or approved, such as another local folder, cloud drive, knowledge-base workspace, AI project, email attachment collection, or prior export.
- A new WRR is not ready to begin.

### Stop condition observed

- No second WRR was conducted.
- No manifests, compilation, registries, JSON/Excel exports, runtime assets, game integration, or Credit Cards development were started.

---

## 2026-07-19 — First operational Credit Foundations WRR

### Completed work

- Conducted the first operational World Readiness Review for the planned CRF-001 through CRF-015 scope using every validation requirement supplied in the authorized completion task.
- Inspected the approved Credit directory and available attachments for workbook sources, Educational Reviews, revision records, blueprints, FQ-AUTH-001, FQ-WRR-001, approval data, controlled values, and relationship evidence.
- Recorded the required binary decision: `FAIL`.
- Completed the operational readiness checklist and outstanding-issues log.
- Did not create a WRR approval record or compilation authorization because the review did not pass.

### Documents created

- `curriculum/credit/approved/reports/CRF_WORLD_READINESS_REVIEW.md`
- `curriculum/credit/approved/reports/CRF_WORLD_READINESS_CHECKLIST.md`
- `curriculum/credit/approved/reports/CRF_WORLD_READINESS_OUTSTANDING_ISSUES.md`

### Decision

- World Readiness Review: **FAIL**
- Compilation authorized: **No**

### Outstanding issues

- CRF-001 through CRF-015 approved workbook files are absent from the approved source directory.
- Educational Review and accepted-revision evidence is absent.
- FQ-WRR-001 and its official checklist are unavailable.
- FQ-AUTH-001 and the governing blueprints are unavailable.
- Approval log, controlled values, concept registry, sequence, prerequisite, and unlock records are unavailable.

### Architectural decisions

- Project-status statements do not substitute for the immutable approved educational sources and traceable review evidence required by the WRR.
- Missing evidence must produce FAIL rather than an assumed or conditional PASS.
- No manifest generation, compilation, registry generation, JSON generation, runtime generation, or game integration may begin.

### Recommended next step

Place or attach the authoritative approved workbooks, Educational Review records, governing specifications, and relationship/approval sources. Then rerun the WRR from the beginning. Compilation remains unauthorized until a later WRR records PASS and is approved.

---

## 2026-07-19 — Credit Cards blueprint v1.0-rc1

### Completed work

- Recorded user approval of the Credit Cards jurisdiction and learner-audience recommendations.
- Incorporated every accepted minor revision from the formal review into the World Blueprint.
- Preserved the approved 13-workbook count and instructional order.
- Narrowed CC-009 to Promotional APRs and Deferred Interest; moved fee instruction to agreement/statement literacy and made rewards optional context.
- Narrowed CC-013 to Unauthorized Use and Lost or Stolen Cards; moved payment difficulty and card-specific delinquency/default application to CC-007 and account changes/closure to CC-011.
- Added the approved 18-point World Success Criteria.
- Strengthened primary-source support with Regulation Z §§1026.6, 1026.12, 1026.13, and 1026.60.
- Expanded provisional Credit Foundations reuse to include Debt, Principal, Interest rate, Credit agreement, Revolving credit, and Creditworthiness.
- Updated the dependency graph, approval-question dispositions, review record, and freeze-condition status.

### Files modified

- `research/credit-cards/CREDIT_CARDS_WORLD_BLUEPRINT.md`
- `research/credit-cards/CREDIT_CARDS_WORLD_BLUEPRINT_REVIEW.md`
- `PROJECT_LOG.md`

### Approved decisions

- Jurisdiction: United States consumer credit cards; federal baseline; material state variation acknowledged; no state-by-state legal instruction; informational rather than legal advice.
- Audience: beginner consumers, inclusive of older teens and adults; plain-language instruction; no prior-use assumption; under-21 rules only when relevant.

### Status decision

- The revised blueprint is version `1.0-rc1`, not frozen version 1.0.
- Revision work is complete.
- Freeze remains blocked because the authoritative Credit Foundations registry, approved CRF workbook ownership records, Platform Blueprint, Domain Blueprint, approved Credit Foundations World Blueprint, FQ-AUTH-001, and FQ-WRR-001 are not available locally or in supplied attachments.
- No canonical IDs were invented and no workbook authoring was started.

### Validation

- Confirmed all 13 approved workbook titles appear once and in the accepted order.
- Confirmed all 18 World Success Criteria are present.
- Confirmed the two user decisions are recorded in both the blueprint and review.
- Confirmed direct Regulation Z citations for account-opening disclosures, special card provisions, billing-error resolution, and applications/solicitations.
- Confirmed no application, compiler, schema, test, manifest, registry, or runtime file was changed.

### Recommended next step

Obtain the authoritative Credit Foundations registry and full governing specifications. Reconcile concept identities and workbook ownership, complete clause-level governance verification, and then freeze the blueprint as version 1.0. Only after freeze should CC-001 Research Scope begin.

---

## 2026-07-19 — Credit Cards World Blueprint formal review

### Completed work

- Reviewed the complete 733-line Credit Cards World Blueprint as a curriculum architecture artifact.
- Verified its scope, proposed 13-workbook sequence, concept reuse, dependencies, boundaries, success requirements, and ten open approval questions.
- Assigned the formal review decision `APPROVED WITH MINOR REVISIONS`.
- Preserved the 13-workbook count and instructional order while recommending narrower scopes for promotions/rewards and unauthorized-use/account-change content.
- Produced a corrected dependency graph, final recommended workbook sequence, concept collision analysis, formal World Success Criteria, open-question disposition table, and exact blueprint-freeze conditions.
- Verified legally sensitive findings against current CFPB Regulation Z and FTC primary sources.

### Files added

- `research/credit-cards/CREDIT_CARDS_WORLD_BLUEPRINT_REVIEW.md`

### Files modified

- `PROJECT_LOG.md`

### Governance decisions

- The review does not freeze the blueprint, assign canonical IDs, authorize workbook authoring, or authorize manifests, compilation, runtime work, tests, schemas, or application changes.
- Detailed clause-level compliance remains subject to governance-owner review because the Platform Blueprint, Domain Blueprint, approved Credit Foundations World Blueprint, FQ-AUTH-001, and FQ-WRR-001 are not present locally.
- Exact concept reuse and workbook ownership remain provisional until the authoritative Credit Foundations registry and approved CRF records are available.

### Required minor revisions

- Add the formal World Success Criteria.
- Narrow the proposed CC-009 to promotional APRs and deferred interest; teach fees through terms/statements and keep rewards optional.
- Narrow CC-013 to unauthorized use and lost/stolen cards; move payment difficulty to CC-007 and account changes/closure to CC-011.
- Add direct Regulation Z support for pricing disclosures, billing-error resolution, and special card protections.
- Record explicit approval of jurisdiction and learner audience.

### Validation

- Confirmed all 12 required review sections are present.
- Confirmed all 13 planning workbooks received individual review decisions.
- Confirmed all ten open questions received one permitted outcome and a blocking-status determination.
- Confirmed no application, compiler, schema, test, manifest, registry, or runtime file was changed.

### Recommended next step

Obtain the two explicit user decisions on United States jurisdiction and beginner consumer audience. Then apply the approved minor revisions to a versioned blueprint, reconcile it against the Credit Foundations registry and governing specifications, and submit it for final freeze. Do not begin Educational Draft work before freeze.

---

## 2026-07-19 — Credit Cards research blueprint

### Completed work

- Researched the proposed Credit Cards world using authoritative United States consumer-finance sources led by the CFPB, Regulation Z, FDIC Money Smart, and FTC consumer-protection materials.
- Produced a research-only World Blueprint covering purpose, goals, scope, entry requirements, exit competencies, and its relationship to Credit Foundations.
- Proposed a 13-workbook instructional sequence as hypotheses for review, without creating Educational Drafts, workbook content, manifests, runtime assets, compiler changes, or canonical IDs.
- Created a concept inventory separating confirmed Credit Foundations reuse, potential registry overlaps, proposed card-specific concepts, and concepts belonging to later worlds.
- Added boundary analysis, a dependency graph, optional branches, gap analysis, research unknowns, and a conditional approval recommendation.
- Classified findings as FACT, HYPOTHESIS, or UNKNOWN and cited the supporting authoritative sources.

### Files added

- `research/credit-cards/CREDIT_CARDS_WORLD_BLUEPRINT.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- The blueprint is research and educational-structure planning only; the frozen governance and compiler workflows remain unchanged.
- The supplied project prompt is treated as the newer authority for the completion of CRF-001 through CRF-015, while the local runtime repository remains insufficient for exact concept-ID reconciliation.
- No proposed Credit Cards concept or workbook planning code becomes canonical until the authoritative Credit Foundations registry is available and the World Blueprint is approved.
- The evidence base is explicitly United States federal consumer-credit material and must not be presented as universal without localization review.

### Tests and validation

- Verified that all six requested deliverable phases are present.
- Verified FACT, HYPOTHESIS, and UNKNOWN classifications throughout the research artifact.
- Verified that no app, curriculum, compiler, schema, manifest, or runtime file was changed.

### Known issues and blockers

- The completed Credit Foundations Approved Educational Content and concept registry are not present in this local repository, so exact stable-ID reuse and duplicate detection remain blocked.
- Target learner age, reading level, jurisdiction approval, and expected quantitative depth are not yet defined.
- Planning labels `CC-001` through `CC-013` are noncanonical and must not enter manifests or runtime data.

### Recommended next step

Reconcile the proposed concept inventory against the authoritative Credit Foundations registry, confirm United States jurisdiction and learner profile, resolve the blueprint's ten research unknowns, and submit the World Blueprint for approval. Do not begin Educational Draft work before that approval.

---

## 2026-07-13 — Living financial-journey home screen

### Completed work

- Replaced the legacy dashboard with a premium, responsive FinLit Quest journey map built in HTML, CSS, SVG, and JavaScript.
- Added the eight approved Credit World section names as navigation-shell destinations without creating lesson content, terms, scenario IDs, or challenge IDs.
- Added meaningful destination icons, financial-life milestone signs, a continuous illuminated route, a future-continent preview, and clear current/completed/locked visual states.
- Added environmental evolution styling so completed destinations become thriving, the current destination glows, and future destinations remain inviting.
- Added restrained ambient motion for the route, clouds, river lighting, completion rings, active destinations, and reward shimmer.
- Added reduced-motion fallbacks and high-contrast focus states.
- Added a responsive Journey Progress panel, Daily Review, streak, upcoming reward, achievement, weekly goal, badge, mastery, XP, and word-learning summaries.
- Replaced the home CTA with the large gold `Continue Adventure` action and verified home → game → home navigation.
- Preserved the existing puzzle, definitions, hint system, micro-lessons, learning engine, and versioned saves.
- Kept Coins and Gems at honest zero states because those currencies do not yet exist in the player model.

### Files added

- `journey.css`

### Files modified

- `index.html`
- `app.js`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **42 passed, 0 failed**.
- `app.js` syntax check passed.
- Mobile verification passed at a 390×844 target with no horizontal overflow and a 67px primary touch target.
- Wide-layout verification passed at 1280×900 with the journey map and sticky progress panel in a two-column layout.
- Locked destinations are disabled and expose descriptive accessibility labels.
- `Continue Adventure` opens the working puzzle and Back returns to the journey map.
- Browser console warnings and errors: **0**.

### Architectural decisions

- The home screen is code-native and does not embed the generated design mockup.
- The map is a curriculum-aware navigation shell. Approved section names may be displayed, but educational records remain unavailable until generated runtime JSON passes the curriculum import gate.
- Environmental evolution is driven by presentation state; it does not duplicate curriculum content in player saves.
- Future-world navigation is a non-mutating preview only and clearly states that regions unlock after curriculum approval.
- Coins and Gems will not be derived from unrelated legacy values. They require explicit player-profile schema and reward-economy approval.
- The deferred avatar decision remains unchanged; no character system or avatar asset was added.

### Known issues and blockers

- Credit runtime curriculum has not been imported, so `Continue Adventure` still opens the existing Crypto/DeFi prototype puzzle. This mismatch is temporary and must not be hidden or solved with fabricated Credit content.
- Journey destination completion is currently session-level presentation state. Persistent Credit section completion must wait for approved objective JSON and objective-progress integration.
- The future-continent control is informational only.

### Recommended next step

Complete the first authoritative Credit workbook import, connect generated objective/section JSON to the journey destinations, and replace the temporary Crypto puzzle route with approved Credit gameplay. Then add direct browser smoke tests for the home-screen state transitions.

---

## 2026-07-13 — Player avatar system formally deferred

### Completed work

- Recorded the Player Avatar & Character System in the future-feature backlog.
- Classified the feature as Post-MVP and deferred it until the application is at least 80% complete and the Final Architecture Review begins.
- Recorded explicit revisit criteria, evaluation questions, and scope restrictions.
- Classified the Alex “Rookie Investor” character concept as exploratory rather than a canonical production asset.

### Files added

- `FUTURE_FEATURE_BACKLOG.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- No avatar-related code, profile fields, UI, dialogue, animation, production assets, or dependencies may be added before formal re-approval.
- Educational worlds, objectives, knowledge, scenarios, challenges, lessons, the AI Tutor, game mechanics, accessibility, testing, beta readiness, and launch preparation take priority.
- Any future avatar proposal must establish educational value, measurable engagement or retention benefit, accessibility requirements, maintenance cost, and save-schema impact.

### Known issues and blockers

- None. This is a deliberate product-scope decision.

### Recommended next step

Resume the Credit curriculum import milestone. Do not revisit avatar implementation until every backlog gate is satisfied and the Final Architecture Review authorizes it.

---

## 2026-07-12 — Immutable curriculum asset boundary

### Completed work

- Established the universal `curriculum/<world>/approved/{workbooks,runtime,reports}` structure for Credit and all future worlds.
- Designated approved workbooks as immutable, human-edited source assets; generated runtime JSON and reports are stored separately.
- Added an enforced path policy: workbook inputs must live inside `approved/workbooks/`, runtime output is derived into `approved/runtime/`, and reports are derived into `approved/reports/`.
- Removed arbitrary runtime/report output paths from the import command.
- Added a shared pipeline policy that prohibits game access to workbooks and prohibits world-specific importers.
- Recorded the pipeline-freeze condition: freeze pipeline version 1 after the first successful Credit import and runtime verification.

### Files added

- `curriculum/README.md`
- `curriculum/pipeline-policy.json`
- `curriculum/credit/approved/workbooks/README.md`
- `curriculum/credit/approved/runtime/README.md`
- `curriculum/credit/approved/reports/README.md`
- `src/curriculum-path-policy.js`

### Files modified

- `scripts/import-curriculum.mjs`
- `tests/curriculum-pipeline.test.js`
- `CURRICULUM_IMPORT.md`
- `ARCHITECTURE.md`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **42 passed, 0 failed**.
- Importer syntax check passed.
- Tests confirm source/output separation and reject world/directory mismatches.

### Architectural decisions

- The game consumes validated JSON only and never reads workbook files.
- The importer determines destinations from the shared directory contract; individual worlds cannot customize the data flow.
- Approved workbook corrections require a newly approved version rather than modification during import.
- After the first successful Credit import, pipeline changes require a versioned migration rather than custom world handling.

### Known issues and blockers

- The ten authoritative Credit workbook assets have not yet been placed in `curriculum/credit/approved/workbooks/`.
- `import-map.json` cannot be created until the actual workbook sheets and headings can be inspected.
- The pipeline remains `awaiting_first_successful_import` and is not frozen yet.

### Recommended next step

Place the eight Approved & Locked Credit section workbooks, Curriculum Approval Log, and Controlled Values workbook in the approved workbooks directory. Derive the import map mechanically, run validation, inspect the reports and generated JSON, verify runtime loading, and then freeze pipeline version 1.

---

## 2026-07-12 — Phase 2 curriculum import pipeline foundation

### Completed work

- Corrected the data flow so approved workbooks remain editorial sources and generated JSON is the runtime source.
- Added versioned curriculum-export and section schemas plus cross-record validation.
- Added validation for source workbook hashes, approval-log and controlled-values hashes, locked approval states, curriculum-version consistency, section/objective membership, prerequisites, and term references.
- Added a mapping-driven workbook adapter that reads exact worksheet headings and produces generated JSON without interpreting curriculum wording.
- Added a runtime curriculum loader with immutable data and indexed section/objective lookup.
- Made Scenario Library and Challenge Library relationships optional until those authoritative artifacts exist; the export validator rejects premature placeholder libraries.
- Added a mandatory Curriculum Import Report and machine-readable validation report after every import attempt. Failed validation cannot generate runtime JSON.
- Added automated tests for exact heading mapping, versioned loading, approval gates, broken relationships, unknown terms, and absent future mappings.

### Files added

- `schemas/section.schema.json`
- `schemas/curriculum-export.schema.json`
- `src/curriculum-validator.js`
- `src/curriculum-loader.js`
- `src/curriculum-import-core.js`
- `src/curriculum-import-report.js`
- `scripts/import-curriculum.mjs`
- `tests/curriculum-pipeline.test.js`
- `CURRICULUM_IMPORT.md`

### Files modified

- `schemas/objective.schema.json`
- `src/objective-validator.js`
- `src/objective-engine.js`
- `tests/objective-engine.test.js`
- `ARCHITECTURE.md`
- `LEARNING_ENGINE.md`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **40 passed, 0 failed**.
- Workbook importer syntax check passed with the bundled Node runtime.
- The actual workbook import was not run because no approved workbook files are present in the repository or shared attachments.

### Architectural decisions

- Canonical flow is Approved Workbook → mapping-driven adapter → validator → generated JSON → runtime loader → game engine.
- Import maps contain only mechanical workbook locations and exact column mappings; they must be derived from the authoritative files rather than guessed.
- Curriculum schema versions are independent of player save versions.
- Runtime JSON records provenance hashes so a build can be traced to its exact workbook, approval log, and controlled values.
- Import reports are a required quality gate and record counts, duplicate IDs, missing references, invalid prerequisites, approval states, warnings, runtime-output status, and PASS/FAIL validation.
- Scenario and challenge fields are extension points only. No empty libraries, fake IDs, or fabricated mappings are exported before approval.
- Existing version-3 save migration and sparse ID-keyed player progress remain unchanged and compatible with Milestone 3 saves.

### Known issues and blockers

- The Approved & Locked Credit workbooks, Curriculum Approval Log, and Controlled Values workbook are not present locally, so the exact import map and authoritative Credit JSON cannot yet be generated or visually verified.
- The workbook adapter has been syntax-checked and its pure mapping layer is tested, but end-to-end spreadsheet import awaits the canonical files.
- Existing distribution ZIP files predate Phase 2 and are stale.

### Recommended next step

Add the canonical workbook files to the project. Inspect their actual sheet names and headings, create the mechanical import map, run the export, verify approval and relationship validation, and then load the generated Credit JSON into the objective engine. Do not author or repair curriculum during import.

---

## 2026-07-12 — Credit objective infrastructure checkpoint

### Completed work

- Added a formal schema for approved and locked learning objectives.
- Added validation for stable objective IDs, Credit world ownership, section metadata, curriculum version, approval status, term relationships, prerequisites, future scenario IDs, and future challenge IDs.
- Added immutable objective indexing and curriculum-order lookup.
- Added sparse objective progress with honest not-started, in-progress, and completed states.
- Added configurable objective completion derived from linked term mastery and future Scenario/Challenge Library results.
- Added separate ID-keyed stores and recording interfaces for scenario and library-challenge attempts.
- Migrated saves automatically from version 2 to version 3 while preserving XP, settings, term progress, and unknown fields.
- Added tests using clearly marked technical fixtures; no Credit objective wording or relationships were invented.

### Files added

- `schemas/objective.schema.json`
- `src/objective-validator.js`
- `src/objective-engine.js`
- `tests/objective-engine.test.js`

### Files modified

- `learning-engine.js`
- `tests/learning-engine.test.js`
- `TESTING.md`
- `ARCHITECTURE.md`
- `LEARNING_ENGINE.md`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **33 passed, 0 failed**.
- Objective engine and validator syntax checks passed.
- Tests cover locked approval status, unknown terms, duplicate IDs, invalid prerequisites, sparse progress, combined completion, separate scenario/challenge results, world aggregates, and version-2 migration.

### Architectural decisions

- Approved curriculum remains immutable content and is never stored in the player profile.
- Objective progress is derived from stable term, scenario, and challenge IDs.
- Objective infrastructure is independent of the current Crypto runtime and can load Credit records without changing the working game.
- Scenario and Challenge Library hooks were defined without inventing their future content.
- Save schema changes require a version bump; objective support uses save version 3.

### Known issues and blockers

- Approved Credit objective records are not present in the repository or current request.
- Stable objective IDs, section IDs, objective statements, prerequisite relationships, and objective-to-term mappings are required before curriculum import.
- The supplied `credit.apr` record contains approved term wording but lacks current engine fields including normalized word, category, stable related-term IDs, XP, review weight, and objective relationships. It was not altered or imported.
- `FinLit-Quest-Milestone-3.zip` predates this checkpoint and is now stale.

### Recommended next step

Provide the approved Credit objective export and approved Credit term registry. Import both verbatim, validate all references, then connect ObjectiveEngine initialization to the Credit world loader. Do not generate missing curriculum content.

---

## 2026-07-12 — Milestone 3 implementation: final extracted-runtime verification pending

### Completed work

- Curated all 20 existing Crypto/DeFi learning objects with unique definitions, readable pronunciations, real-life examples, insights, mistakes, relationships, XP, review weights, and applied challenges.
- Made `content/crypto-terms.json` canonical and added a generated JavaScript adapter for direct-file compatibility.
- Added formal term/world JSON schemas, runtime validation, stable-reference validation, challenge validation, and level wheel-formability checks.
- Separated puzzle, challenge, and review analytics in sparse ID-based progress.
- Added configurable combined mastery capped at 20% from crossword completion alone.
- Added challenge accuracy, misconception flags, solve/hint metrics, review counts, streak calculation, achievements, review-due counts, and honest dashboard states.
- Extracted pure game rules, world loading, and content validation from `app.js` without changing the framework or rebuilding the game.
- Centralized design tokens, removed the external font dependency, removed obsolete clue-layout CSS, and replaced temporary dashboard emoji with accessible inline SVG icons.
- Added dependency-free automated tests and a single test command.
- Completed a clean-player lesson/challenge/review/reload flow, an existing-player migration check, mobile/theme/navigation checks, and a full five-level playthrough.
- Fixed Level 5's missing `E` in the wheel and added validation/test coverage to prevent unformable target words.

### Files added

- `content/crypto-terms.json`
- `content/crypto-terms.js` (generated adapter)
- `src/content-validator.js`
- `src/world-loader.js`
- `src/game-engine.js`
- `schemas/term.schema.json`
- `schemas/world.schema.json`
- `design-tokens.css`
- `CONTENT_AUTHORING.md`
- `TESTING.md`
- `scripts/sync-content.js`
- `scripts/test.sh`
- `tests/helpers.js`
- `tests/content-validator.test.js`
- `tests/game-engine.test.js`
- `tests/learning-engine.test.js`

### Files modified

- `index.html`
- `app.js`
- `learning-engine.js`
- `premium.css`
- `hints.css`
- `worlds/crypto.js`
- `worlds/crypto.json`
- `ARCHITECTURE.md`
- `LEARNING_ENGINE.md`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **25 passed, 0 failed**.
- JavaScript syntax checks passed for the app, learning engine, validator, and game engine.
- Curated world validation passed with 20 unique learning objects and valid stable references.
- Negative validation tests passed for missing fields, duplicate IDs/words, malformed challenges, invalid related/level references, and unformable target words.
- Manual 375px verification passed for clean and existing profiles, theme, level selection, duplicate letters, hints, seven-step lesson, incorrect challenge explanation, XP/mastery/review updates, reload persistence, and all five levels through final feedback.
- Browser console errors: none.
- Clean distribution archive: `FinLit-Quest-Milestone-3.zip`; old ZIPs and legacy duplicate term transports are excluded.
- ZIP integrity passed and all 26 tests passed from a clean extracted directory at `/tmp/finlit-quest-m3-final`.
- Final browser launch from the extracted directory remains pending because the environment rejected the temporary-server request after reaching its tool-usage limit. The working-directory build was fully browser-verified.

### Architectural decisions

- JSON is canonical; direct-file JavaScript is generated compatibility output.
- Malformed content blocks world loading with actionable messages.
- Puzzle, challenge, and confidence data are independent; full mastery requires applied and repeated learning success.
- Dashboard values must be derived from save data or display an honest empty state.
- Pure rules are extracted first; DOM controllers remain together until their transitions have direct automated coverage.
- System font stacks replace network fonts to preserve offline behavior.

### Known limitations

- `app.js` still contains DOM rendering, wheel input, navigation, lesson flow, and animation orchestration; these are the next safe modularization candidates.
- CSS is tokenized and partially cleaned but remains split between legacy, premium, hint, learning, and lesson component files.
- Each term currently has one challenge; the schema and model can support a future challenge collection after a save-compatible content revision.
- Audio pronunciation is not implemented.
- The custom runtime validator enforces cross-file relationships that JSON Schema alone cannot; it does not use a third-party full JSON Schema interpreter.
- Daily Review still builds compatible three-word wheels heuristically and may need a dedicated review-puzzle curator as the database grows.
- Do not mark Milestone 3 fully closed until the extracted ZIP is served and its dashboard loads without console errors.

### Recommended next milestone

Milestone 4 should focus on interaction-controller extraction and testable UI state: lesson controller, wheel controller, accessibility/keyboard play, focus management, and direct browser smoke tests. It should not add a new world until the content pipeline is exercised through one complete authoring/import cycle.

---

## 2026-07-12 — Project log established

### Completed work

- Established `PROJECT_LOG.md` as the required development handoff record.
- Consolidated the current product direction, implementation state, architectural decisions, risks, and next milestones.
- Confirmed the repository currently contains the playable prototype, world boundary, learning engine, dashboard redesign, hint system, and micro-lesson flow.

### Files modified

- `PROJECT_LOG.md` — created.

### Architectural decisions

- This log is now required reading before repository changes.
- Every completed milestone must append a dated entry here.
- Significant UI/UX changes should be proposed before implementation and evaluated against usability, engagement, accessibility, and overall visual cohesion.

### Known issues

- `finlit-word-game.zip` predates recent architecture, dashboard, learning-engine, and micro-lesson changes; it should not be treated as the current source.
- Browser-direct execution is preserved using JavaScript compatibility adapters. Canonical JSON and runtime JavaScript data currently overlap.
- No automated test suite or CI exists yet.

### Recommended next steps

1. Curate complete educational metadata for every term instead of relying on normalized fallback examples, insights, mistakes, quizzes, and pronunciations.
2. Add content-schema validation and automated learning-engine tests.
3. Replace the stale ZIP only when a new distribution artifact is requested.

---

## 2026-07-12 — Applied micro-lesson milestone

### Completed work

- Replaced the single definition reveal with a seven-step lesson sequence:
  1. Definition and pronunciation
  2. Real-life example
  3. “Did you know?” insight
  4. Common mistake
  5. Applied quick challenge
  6. Related concepts
  7. Reward and confidence review
- Added quiz answer feedback and related-word chips.
- Added an animated XP reward, next-review message, term mastery ring, mastery status, and milestone confetti.
- Connected Again, Hard, Good, and Easy responses to the spaced-repetition engine.
- Verified the complete `TOKEN` flow at a 375px viewport with no browser errors.

### Files modified

- `index.html`
- `app.js`
- `learning-engine.js`
- `micro-lessons.css`

### Architectural decisions

- Solving a word is the entry point to an applied lesson, not the full educational outcome.
- Micro-lessons use a reusable step renderer rather than separate hardcoded screens.
- Content and player state remain separate; lesson rendering receives a composed learning object.
- Confidence selection occurs after application and controls the review schedule.

### Known issues

- Most term enrichment fields currently use safe generated fallbacks because the source content contains definitions only.
- Quiz distractors are generic and require editorial curation.
- Pronunciation is text-only; audio and phonetic notation are future work.
- Quick-challenge correctness is displayed but is not yet stored separately from the confidence rating.

### Recommended next steps

1. Curate term-specific examples, insights, mistakes, related concepts, pronunciations, and quiz distractors in the content database.
2. Store quiz attempts separately from review confidence so application accuracy is measurable.
3. Add optional “short lesson” behavior for already-mastered terms to avoid repetition fatigue.

---

## 2026-07-12 — Learning engine and versioned saves

### Completed work

- Added an indexed learning repository with stable IDs such as `crypto.token`.
- Added composed learning objects containing immutable content plus player-specific progress.
- Added sparse version 2 saves containing only term IDs and progress; educational content is not duplicated in player profiles.
- Added automatic migration from legacy Yield and word-weight review data.
- Added an SM-2-inspired scheduler supporting Again, Hard, Good, and Easy.
- Added mastery levels, seen/correct/incorrect counts, review dates, intervals, ease factor, unlock dates, and mastery dates.
- Added due-review selection and world metrics: completion, mastery, learned, remaining, average accuracy, and average review interval.
- Connected dashboard metrics and Daily Review to the new engine.
- Verified a solved term updated XP, learned-word count, completion, and scheduling without browser errors.

### Files modified

- `learning-engine.js`
- `learning-engine.css`
- `LEARNING_ENGINE.md`
- `index.html`
- `app.js`
- `ARCHITECTURE.md`

### Architectural decisions

- Content is indexed in memory with `Map` for average O(1) term lookup.
- Player progress is sparse and keyed by stable IDs, enabling future cloud sync with minimal scheduler changes.
- The storage adapter is injectable; local storage is the current implementation, not a permanent dependency.
- World aggregates are derived on demand rather than stored as competing sources of truth.

### Known issues

- Migration infrastructure currently supports the known path to save version 2; a migration registry should be introduced before version 3.
- Due-review and world-stat calculations scan the selected world. This is acceptable for tens of thousands of terms but should be profiled with realistic content.
- Theme preference still uses a legacy standalone key instead of the versioned settings object.

### Recommended next steps

1. Add deterministic unit tests for all four review outcomes, migration, due selection, and aggregates.
2. Move theme and future accessibility preferences into the versioned save settings.
3. Add a formal migration registry before the next save schema change.

---

## 2026-07-12 — Premium dashboard and visual redesign

### Completed work

- Created a dashboard-first mobile experience with Continue Learning, XP, streak, words learned, world progress, mastery, daily challenge, weekly goal, and achievement surfaces.
- Created a separate focused game screen with navigation back to the dashboard.
- Added complete light and dark design tokens, theme persistence, premium typography, responsive layouts, soft shadows, rounded cards, glass effects, and interaction motion.
- Added card and button micro-interactions, progress animation, XP effects, screen transitions, milestone confetti, and reduced-motion support.
- Verified dashboard, dark mode, navigation, and puzzle rendering at 375px without browser errors.

### Files modified

- `index.html`
- `app.js`
- `premium.css`

### Architectural decisions

- The dashboard is the product home; the puzzle is one activity within the learning platform.
- Visual styles use semantic design tokens for theme consistency.
- Motion must communicate progress or feedback and respect `prefers-reduced-motion`.

### Known issues

- Google Fonts are imported from the network; offline use falls back to system fonts.
- Some dashboard values, including weekly goal and achievement presentation, are still prototype placeholders.
- Emoji are used as temporary world icons; a production icon system is not yet installed.
- Styling is split across legacy and additive stylesheets, increasing cascade complexity.

### Recommended next steps

1. Replace placeholder dashboard statistics with player-model data.
2. Consolidate legacy CSS into documented component and token layers.
3. Adopt a consistent SVG icon system and bundle fonts or use an offline-safe font stack.

---

## 2026-07-12 — World/content boundary and architecture audit

### Completed work

- Audited the original prototype and documented strengths, technical debt, target boundaries, scale considerations, and an eight-stage roadmap.
- Rebranded the application shell as FinLit Quest.
- Moved levels, difficulty, bonus words, world identity, and reward settings behind a world contract.
- Added a canonical Crypto world JSON manifest and a direct-file compatibility adapter.
- Preserved crossword, letter wheel, duplicate letters, definitions, hints, rewards, review, level selection, feedback, and local saves.

### Files modified

- `ARCHITECTURE.md`
- `worlds/crypto.json`
- `worlds/crypto.js`
- `index.html`
- `app.js`

### Architectural decisions

- Game rules consume world configuration rather than owning Crypto-specific levels.
- JSON is the canonical long-term content format.
- A JavaScript adapter temporarily preserves opening `index.html` directly because browser security blocks local JSON fetching.

### Known issues

- `terms.js` and `terms.json` duplicate content and can drift.
- `worlds/crypto.js` references the legacy term global.
- The engine, UI, persistence, and input still share the compressed `app.js` file.

### Recommended next steps

1. Add a validated content-loading layer and remove duplicate transports when a static-server/module workflow is accepted.
2. Split the game engine and UI into testable modules.
3. Add explicit loading and content-error states.

---

## Earlier prototype milestones

### Completed work

- Built five playable Crypto/DeFi word-connect levels with crossword placement, mouse/touch input, duplicate-letter support, shuffling, hints, definitions, reward accumulation, level selection, Daily Review, and local feedback capture.
- Combined crossword and definitions, then positioned the letter-wheel game between them.
- Fixed tap/drag input conflicts.
- Fixed hint selection so it never spends a hint on a letter already visible through a solved crossing word.

### Primary files

- `index.html`
- `styles.css`
- `hints.css`
- `app.js`
- `terms.js`
- `terms.json`

### Known issues

- The crossword placement routine is appropriate for small curated puzzles, not a large procedural generator.
- Existing CSS and several JavaScript functions are compressed into single lines and should be reformatted during modularization.
- No backend, account system, analytics service, or cloud save exists.

### Recommended next steps

- Preserve the verified puzzle mechanics while continuing to move educational content, progress, and presentation into independent modules.

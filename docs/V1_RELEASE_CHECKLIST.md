# FinLit Quest — Version 1.0 Release Checklist

**Mission (locked 2026-07-20):** ship Version 1.0 to the Apple App Store and Google Play with exactly Crypto World, Credit World, and the existing word-wheel/crossword game. No new worlds, modes, educational features, or projects. Every change from this point forward is a bug fix, a stability improvement, a launch requirement, or store-submission prep — nothing else. Anything else goes on a future roadmap, not into code.

**Scope note (confirmed by user 2026-07-20):** "Credit World" for V1.0 means the completed Credit Foundations content currently in the app. Credit Cards, Interest & Borrowing, Credit Reports, Building Credit, and any other unfinished Credit chapters are frozen/roadmap, not built for launch. They must stay locked/hidden/clearly marked unavailable so users can't enter incomplete content — confirmed already true today (the 7 not-yet-built Credit World journey nodes are dynamically `.disabled=true` by `updateDashboard()` and unclickable; verified live during Blocker 2, see below). No code change was needed for this — noted here as a confirmed-correct finding, not an open item.

This file is updated after every completed blocker. Status values: `Not Started` / `In Progress` / `Verified`.

---

## Phase 1 — Critical Gameplay (Release Blockers)

### Puzzle Engine — Not Started
- [ ] Word wheel functions correctly
- [ ] Crossword boards load correctly
- [ ] Random puzzle selection works
- [ ] Five puzzles complete a lesson
- [ ] Puzzle progression works
- [ ] No duplicate puzzles during a playthrough
- [ ] Puzzle persistence works after app restart

### Economy — In Progress
- [x] Coins — verified 2026-07-20 (starting balance, single-source economy config, spend/deduct guard, persistence — see PROJECT_LOG.md "Fix starting coins and hint purchase logic")
- [x] XP — verified 2026-07-20 (see Blocker 2 below)
- [x] Score — verified 2026-07-20, workbook quiz scoring (see Blocker 1 below)
- [ ] Level progression — **known bug found during Blocker 2, not fixed (out of scope for that pass)**: the Credit World journey screen's "CURRENT LEVEL" display (`#journeyLevel`, app.js `updateDashboard()`) uses `floor(xp/100)+1`, while the canonical/persisted level (learning-engine.js, word-game header) uses `floor(xp/250)+1`. Same player, two different level numbers depending which screen you're on. Reproduced live at xp=100: stored/word-game level = 1, journey-screen level = 2.
- [ ] Rewards
- [ ] Hint purchases
- [ ] Full reveal purchases
- [x] Coin persistence — verified 2026-07-20
- [x] XP persistence — verified 2026-07-20

### Save System — Not Started
- [ ] Coins
- [ ] XP
- [ ] Score
- [ ] Current world
- [ ] Current lesson
- [ ] Current puzzle
- [ ] Completed puzzles
- [ ] Streak
- [ ] Settings

## Phase 2 — Gameplay Verification — Not Started
- [ ] Crypto: every puzzle loads / solvable / definitions match / answers accepted / rewards work / lesson completes / next lesson unlocks
- [ ] Credit: same checklist

## Phase 3 — Progression — Not Started
- [ ] First launch → tutorial (if present) → Crypto → Credit → Completion → return player experience, no manual intervention required at any transition

## Phase 4 — Bug Sweep — Not Started
- [ ] Console errors / missing assets / broken buttons / broken navigation / incorrect animations / incorrect scoring / duplicate rewards / layout problems / mobile responsiveness / slow loading / crashes

## Phase 5 — Performance — Not Started
- [ ] Startup time / puzzle loading / save speed / animation smoothness / memory leaks / offline behavior

## Phase 6 — App Store Readiness — In Progress
- [x] App icon, splash screen, app name, version number — native iOS project now exists (see Blocker 9b), real app icon and branded splash screen installed
- [ ] Privacy Policy, Terms of Service, support email
- [ ] Screenshots, feature graphic, description, keywords, categories, age rating

## Phase 7 — Acceptance Testing — Not Started
- [ ] Crypto: every lesson playable / every puzzle solvable / every lesson completable / world completion works
- [ ] Credit: same
- [ ] Economy: coins / XP / score / rewards / purchases all correct
- [ ] Persistence: everything saves / everything reloads / no progress lost
- [ ] Stability: no crashes / no console errors / all automated tests passing

---

## Blocker Log

Entries added after each completed blocker, in execution order. Each entry: root cause, changes made, tests added, live verification, remaining blockers.

### Blocker 1 — Score system — VERIFIED 2026-07-20

**Root cause:** no functional bug in `scoreQuiz` (`src/workbook-engine.js`) — percent/pass-fail math, XP-award-once guard, and bestScorePercent tracking were all already correct and already had test coverage. The one real gap: the on-screen-question-position → per-type-answer-array-index mapping (which question in the mc/tf-interleaved on-screen order corresponds to which index in `mcAnswers`/`tfAnswers`) was inlined twice in `workbook-app.js` (`wbAnswerMc`/`wbAnswerTf`) with zero automated coverage, because that file is DOM-coupled and not requireable in Node. This is the one piece of logic that sits directly between "the learner answered correctly" and "the score reflects that" — a release-blocker area with a real, if latent, coverage gap.

**Changes made:** extracted the mapping into a pure `answerPositionForType(quizQuestions, index, type)` in `src/workbook-engine.js`; `workbook-app.js` now calls it in both places instead of duplicating the inline `slice().filter().length` formula. No behavior change — same formula, now shared and testable.

**Tests added:** `tests/workbook-engine.test.js` — unit test of `answerPositionForType` against an interleaved mc/tf list, plus a full simulated quiz walk (mirrors `wbOpenQuiz`→answer-in-order→`scoreQuiz` exactly) against real CRF-001 content that deliberately gets one mc and one tf question wrong and asserts the score reflects exactly those two misses, nothing else. Full suite: 147/147 passing.

**Live verification:** played a real CRF-001 quiz end-to-end via actual button clicks in the browser (`http://localhost:8756`) — answered question 1 correct, question 2 deliberately wrong, remaining 6 correct. Results screen showed "You scored 7/8 (88%). Passing score is 80%," workbook marked complete, exactly +100 XP awarded (matching `workbook.xp`), and the missed-question breakdown showed only the one deliberately-wrong question. Then retried the same workbook and deliberately answered every question wrong (1/8, 13%, failed) — confirmed `player.xp` stayed at exactly 100 (no double-award, no loss), `status` stayed `"completed"` (a worse retry doesn't un-complete it), `xpAwarded` stayed 100, and `bestScorePercent` stayed at 88 (the max, not overwritten by the worse attempt). No console errors throughout.

**Remaining blockers:** XP calculations (2), level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), store assets (9), submission (10). Awaiting go-ahead before starting Blocker 2, per the stated one-at-a-time execution rule.

### Blocker 2 — XP verification — VERIFIED 2026-07-20

**Verification finding (no XP-earning bug):** every live XP-awarding path — workbook pass (`recordWorkbookAttempt`), SM-2 review (`review`), word-game puzzle solve (`wgFoundWord`) — was already correct: awarded once, at the right event, never on a failed/incomplete attempt, accumulating on one shared `player.xp` field independent of per-world state. One real hardening gap found and fixed: `normalizeSave` spread a saved `player.xp` value into the live save with no validation, so a corrupted/tampered save (`xp: NaN`, a string, or negative) would load as-is and then compound forever through every future `+=`. Added `sanitizeXp()`; a missing or invalid value now safely resets to 0 on load, a valid value (including legitimate 0) passes through untouched.

**Two adjacent findings, explicitly out of scope for this pass and not fixed here:**
1. **Level-formula inconsistency** (÷100 in app.js's legacy dashboard vs. ÷250 everywhere else) — logged above under Economy → Level progression, real and reproduced live, deferred to Blocker 3 per your explicit instruction not to start level progression this pass.
2. **Dead legacy XP path**: `app.js`'s original Crypto crossword screen (`#playScreen`, `foundWord`→`showLearn`→`rateLearning`→`learning.review()`) still exists and awards XP unconditionally on every rating including "again" (worst). Confirmed via static analysis and a live click test that it is **completely unreachable** today — every button that used to lead there (`#continueLearning`, `#viewLevels`, `#dashboardReview`, and the one unlocked journey-node) has been redirected to the new unified `wgOpenWorld()` engine, and the 7 not-yet-built Credit journey nodes are correctly disabled. Not a live risk, but flagged for removal during Phase 4 (Bug Sweep) — dead code with its own independent, unguarded XP-award logic is a latent duplication risk if a future UI change ever re-exposes it.

**Changes made:** `learning-engine.js` — `sanitizeXp()` helper, applied in `normalizeSave`. No behavior change for any valid save.

**Tests added:** `tests/learning-engine.test.js` — new player starts at exactly 0 XP; corrupted xp (`NaN`, string, negative, missing) sanitizes to 0 on load; a valid value including 0 is preserved exactly; XP awarded exactly once per workbook pass, not duplicated by retry; failed/incomplete attempts award 0; XP from different activity types (workbook + SM-2 review) accumulates on the one shared balance; XP is independent of per-world state (switching worlds can't reset/duplicate it); reload preserves accumulated XP; XP stays finite and non-negative across a run of mixed pass/fail/review activities. Full suite: **156/156 passing**.

**Live verification** (`http://localhost:8756`, real clicks/UI functions, no test mocks): confirmed 100 XP already persisted from Blocker 1. Completed a fresh Credit activity (CRF-002 quiz, real clicks, 8/8) → XP correctly went 100→200. Reloaded → stayed 200. Retried the same completed quiz (8/8 again) → stayed 200, no duplicate. Solved a real Crypto word-game puzzle word ("PEER", via the actual selection/submit handlers) → XP went 200→206, exactly matching `Math.round(4×1.5)=6`. Switched Credit→Crypto→Credit → same 206 shown on both. Relaunched → 206 persisted, in both the engine and localStorage. Zero console errors throughout.

**Remaining blockers (renumbered 2026-07-20 to insert Branding and Domain Integration before store-assets/submission):** level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8 — carries forward the dead-legacy-code finding above), **branding and domain integration (9, new)**, store assets and metadata (10, was 9), submission (11, was 10). Stopping per your instruction; awaiting go-ahead for Blocker 3.

### Blocker 9 — Branding and Domain Integration — In Progress (web-facing work done; native app work blocked)

Added to the plan 2026-07-20. Objective: the approved FinLit Quest logo and brand assets appear correctly across the website/domain, install experience, app interface, and store assets. Not redesigning the logo or creating a new brand identity — using the assets the user supplied.

**Domain answered:** finlitquest.com = this app (`localhost:8756/index.html` in dev). §2 (website placement) and §3 (game application placement) are the same screens, not two separate surfaces — there is no separate marketing site in this repo.

**Assets supplied by the user** (saved to `assets/brand/source/`, not committed to git by this pass — see Files below):
- `FinLit_Quest_Full_Logo_Master.png` — 1254×1254, opaque navy background (~#010718, vignetted), full "FINLIT QUEST" wordmark lockup with tagline and mountain/book/compass/coin artwork.
- `FinLit_Quest_Icon_Mark_Master.png` — 1254×1254, opaque navy background (#040F32 flat), the gold compass "Q" mark alone — the piece actually suited to small sizes (favicon, app icon).
- `FinLit_Quest_Icon_Mark_1024x1024_AppStore.png` — same mark, pre-sized to Apple's exact 1024×1024 marketing-icon spec; copied as-is into `assets/brand/icons/icon-1024-appstore.png`.

No SVG source was provided (raster PNG only) — noted against §9, not blocking: 1254px is enough resolution that every derivative generated (max 630px) is a downscale, never an upscale, so there's no blur/pixelation from the resolution itself.

**§1 Domain favicon — done.** Generated from the icon mark via `sips` (all downscales, no upscaling): `favicon-16.png`, `favicon-32.png`, `apple-touch-icon-180.png`, `icon-192.png`, `icon-512.png`. `favicon.ico` doesn't exist as a `sips` output format (macOS, no ImageMagick/Pillow available in this environment) — built a valid PNG-in-ICO container with a small stdlib-only script (`assets/brand/build-favicon-ico.py`), verified with `file` as a real 2-image (16/32) Windows icon resource, not a renamed PNG. Added proper `<link rel="icon">` (ico + both PNG sizes with explicit `sizes=`), `<link rel="apple-touch-icon">`, and `<link rel="manifest">` to `index.html`'s `<head>` — not just an image dropped in the body.

**§2/§3 Website and app placement — done, scoped to what exists.** The app's only persistent brand mark was `<span class="wg-logo">🧭</span>` (an emoji) in the `.wg-brand` header on `#worldGameScreen` — the screen shared by both Crypto and Credit (confirmed structurally, not just visually: it's one shared element, not two). Replaced it with a real `<img>` of the compass mark inside a `<button id="wgBrandLogo">`, circular-clipped via CSS (`border-radius:50%`, `object-fit:cover`), alt text exactly `"FinLit Quest"`, wired to `showDashboard()` so it now genuinely links home (it didn't do anything before). No stretch/crop/blur — `object-fit:cover` on a square source into a square-then-circle-clipped target introduces no distortion. Sign-in/splash/error/about/loading screens don't exist anywhere in this app (confirmed by search) — not building new ones, that would be a UI feature, out of scope. The pre-existing `<h1>FinLit Quest</h1>` text-only header in the legacy `#playScreen` was left alone — that screen is confirmed dead/unreachable (Blocker 2 finding), so adding an image there would never be seen by anyone.

**§4 Web app manifest — done.** Created `manifest.webmanifest`: `name`/`short_name` "FinLit Quest", `start_url: "./index.html"`, `display: "standalone"`, `theme_color`/`background_color` matching the app's own navy (`#0a1120`), 192 and 512 icons, plus a proper maskable 512 icon (compass mark scaled to a 342px/67% safe zone, padded to the full canvas with the mark's own background color so no OS mask — circle, squircle, rounded-square — clips it; built and visually verified). Server confirmed serving it as `application/manifest+json`.

**§5 Apple / §6 Google Play native branding — blocked, not started.** This repo has no native app project at all (no `.xcodeproj`, no Capacitor/Cordova config, no Gradle project) — there is nowhere to install an Xcode asset catalog or Android adaptive-icon layers yet. The one piece already usable when that shell exists: `icon-1024-appstore.png` (App Store marketing icon, exact size, already supplied pre-cropped). Everything else in §5/§6 (asset catalog, TestFlight icon, adaptive foreground/background layers, legacy Android icon) needs the native wrapper project to exist first — flagging as blocked infrastructure, not silently skipping it.

**§7 App-store listing assets — blocked.** No App Store Connect / Google Play Console access from this environment, and no store listing (screenshots, feature graphic, promo images) exists yet to place a logo into. Deferred to Blocker 10 (store assets and metadata) where that listing work happens.

**§8 Social and sharing metadata — done.** Added Open Graph (`og:type/site_name/title/description/image/url`) and Twitter Card meta tags, `apple-mobile-web-app-title`, `apple-mobile-web-app-capable`, and `theme-color`. Built a proper 1200×630 OG image from the full lockup (padded onto a matching-navy canvas — sampled the logo's own corner pixel color to avoid a visible seam, verified visually). `og:image`/`twitter:image` use absolute `https://finlitquest.com/...` URLs since social crawlers fetch these tags without a page context to resolve relative paths against.

**§9 Asset quality — checked, transparency gap closed 2026-07-20.** No case inconsistencies in "FinLit Quest" anywhere added (grepped to confirm). No upscaling anywhere (source 1254px, largest derivative 630px). Fixed one real seam (OG image pad-color mismatch, caught by sampling actual pixels rather than assuming a color) before calling it done. User supplied `FinLit_Quest_Icon_Mark_transparent.png` (1254×1254, real alpha) closing the transparency gap flagged earlier. Verified it was genuinely transparent (not just RGBA-with-alpha-255-everywhere) by flattening it to JPEG with `sips` and confirming the outer square corners composited to white while the inner navy disc/gold ring/needle stayed intact — a clean circular cutout, not a hard square edge. Regenerated `favicon-16/32.png`, `favicon.ico`, and the in-app header logo (`wg-logo-96.png`) from this transparent source instead of the opaque master, since those are the three places background-independence actually matters (unknown browser-chrome color; unknown future header background). Deliberately did **not** switch the Apple/PWA app icons (`apple-touch-icon-180`, `icon-192`, `icon-512`, `icon-1024-appstore`) to the transparent source — app icons are expected/required to be opaque (this doc's own §5 already flags "no accidental transparency where Apple prohibits it"), so those correctly stay generated from the opaque master.

**§10 Live verification — done for what's reachable from this environment.** Verified in the Browser pane (Chromium-based): logo renders correctly in the app header on both Crypto and Credit (same shared element); clicking it navigates home; `favicon.ico`/`favicon-16/32`/`apple-touch-icon-180`/`icon-192`/`icon-512`/`icon-512-maskable`/`og-image-1200x630`/`manifest.webmanifest` all fetch 200 OK (checked via `fetch()` from the live page, not just static file existence); manifest serves the correct `application/manifest+json` content type; zero console errors; zero 404s in the network log. **Not verified** (no access from this environment): real desktop Safari, real mobile Safari, real Android Chrome, an actual installed PWA, a TestFlight build, or an Android test build — those need real devices/tooling this sandboxed environment doesn't have.

---

### Blocker 9b — Native App Wrapper (Capacitor) — In Progress (scaffolded and branded; cannot build/sign/submit from this machine)

Direct follow-on from the App Store readiness conversation: **this app could not be submitted to the App Store at all before this** — Apple requires a compiled native binary through Xcode, not a website or PWA, and this repo had zero native project (no `.xcodeproj`, no Capacitor/Cordova/Gradle anywhere). Chose Capacitor (thin native `WKWebView` shell around the existing static files, no rewrite) over a full native rewrite.

**Environment problems hit and resolved along the way:**
1. **No Node.js on this Mac at all.** `brew install node` was attempted first — it silently tried to compile Node from source (no prebuilt Homebrew "bottle" exists for macOS 12 Monterey anymore) and after ~15+ minutes **failed**: `Error: You are using macOS 12. We (and Apple) do not provide support for this old version.` The background-task notification reported "exit code 0," which was misleading — that was `tail`'s exit code from the `| tail -30` pipe, not `brew install`'s; the actual install had failed partway through a broken Python/sphinx-doc sub-dependency. Caught this by reading the actual captured output, not trusting the exit-code summary alone.
2. **Fix**: abandoned Homebrew for this entirely. Downloaded Node's official prebuilt binary directly (`node-v24.18.0-darwin-x64.tar.gz` from nodejs.org, queried via their release API rather than assuming a version number) into `~/.local/nodejs` — no compilation, no sudo, no system-wide install. Added it to `~/.zshrc` PATH for future terminal sessions.

**What was built:**
- `package.json` (new — this repo had never had one) + `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` (v8.4.2).
- `capacitor.config.json` — appId `com.finlitquest.app` (placeholder-but-real; trivially changeable now, becomes permanent once registered in App Store Connect — flagged, not blocking), appName "FinLit Quest".
- **`scripts/build-www.sh`** — deliberately did *not* point Capacitor's `webDir` at the repo root. Traced every file `index.html`/`manifest.webmanifest` actually reference (script tags, link tags, CSS `url()`, and confirmed zero runtime `fetch()` calls exist anywhere in the codebase) and built a script that copies exactly those ~33 files into `www/` (908K). Pointing `webDir` at the repo root would have shipped `.git`, `node_modules`, `tests/`, `docs/`, `scripts/`, the multi-MB raw brand source PNGs, and every internal project doc (`PROJECT_LOG.md`, `CLAUDE.md`, etc.) inside the actual App Store binary.
- Verified the trimmed `www/` bundle live before wiring it into Capacitor at all — served it locally, loaded both the word-game screen and the Credit workbook screen in the browser, zero console errors, confirming nothing was missed.
- `npx cap add ios` — succeeded **without Xcode installed** (it only scaffolds files; building/signing/running needs Xcode). Uses Swift Package Manager, not CocoaPods (no CocoaPods install needed).
- Replaced Capacitor's default generic app icon (`ios/App/App/Assets.xcassets/AppIcon.appiconset`) with the real, already-prepared `icon-1024-appstore.png` (1024×1024, no alpha — matches Apple's single-size icon format and the "no accidental transparency" requirement from §5).
- Replaced Capacitor's default splash screen (small logo on white) with a real branded one: the transparent compass mark centered on the app's own navy (`#0A1120`, matching the manifest's `theme_color`/`background_color` for visual continuity into the app). Verified there was no hidden transparency leaking through by flattening to JPEG and confirming pixel-identical output. Also fixed the storyboard's fallback background color (was white, now navy) for the edge case before the image itself paints.
- `.gitignore`: `www/` excluded (regenerable via the build script) but `ios/App/App/public/` (the copy Capacitor actually builds from) is committed, so the Xcode project builds immediately after a fresh clone without anyone needing to remember a build step.

**What's still blocked, and why — cannot be done from this environment:**
- **Confirmed 2026-07-21, definitively (not a maybe): this specific Mac can never build a submittable App Store binary.** It's a `MacBookAir7,2` (2015/2017 model) — Apple's maximum supported macOS for this hardware is Monterey (12), already what it's running; Ventura/Sonoma/Sequoia/Tahoe are not available for it, ever. macOS 12 caps at Xcode 14.2. Apple has required Xcode 26+/iOS 26 SDK for all new App Store submissions since **2026-04-28**. Xcode 14.2 is four major versions short — no amount of free disk space or reinstalling Xcode fixes this. Full detail and resolution options in `docs/FQ-APP-002-native-build-release-standard.md` §1 — needs a different/newer Mac or a cloud Mac CI service (Codemagic/Bitrise/GitHub Actions/Xcode Cloud) for the actual build-sign-submit step; not yet decided which.
- **~9.8GB free disk space** on this machine regardless — moot given the above, but relevant again if this same machine is ever used for anything Xcode-adjacent.
- Installing Xcode itself requires interactive Apple ID sign-in through the App Store or developer.apple.com — cannot be automated from here, on any machine.
- Apple Developer Program enrollment ($99/year, tied to the user's own Apple ID/business) — status unknown, needed before any real signing/TestFlight/submission.
- Once a capable machine (or CI service) is in place: real device/simulator testing, code signing, TestFlight upload, and the actual App Store Connect submission are all still ahead.

**Full suite still 156/156 passing** (this work touched zero existing JS logic — new files and native-project scaffolding only).

**Remaining blockers, this item:** a native iOS/Android app project needs to exist before §5/§6 can proceed; a store listing needs to exist before §7 can proceed (both handed to Blocker 10); real-device/real-browser verification beyond this dev environment. (Transparent-logo gap closed 2026-07-20 — no longer outstanding.)

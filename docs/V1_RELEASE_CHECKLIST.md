# FinLit Quest — Version 1.0 Submission Readiness Checklist

**Mission (locked 2026-07-20, phase structure updated 2026-07-21):** ship Version 1.0 to the Apple App Store with exactly Crypto World, Credit World, and the existing word-wheel/crossword game. No new worlds, modes, educational features, or projects. Stability over new features; every change should reduce App Store rejection risk or improve quality/reliability/accessibility/compliance. Work one issue at a time; verify before marking complete; no assumptions.

**Scope note (confirmed by user 2026-07-20):** "Credit World" for V1.0 means the completed Credit Foundations content currently in the app. Credit Cards, Interest & Borrowing, Credit Reports, Building Credit, and any other unfinished Credit chapters are frozen/roadmap, not built for launch. They must stay locked/hidden/clearly marked unavailable so users can't enter incomplete content — confirmed already true today (the 7 not-yet-built Credit World journey nodes are dynamically `.disabled=true` by `updateDashboard()` and unclickable; verified live during Blocker 2). No code change was needed for this.

**Submission plan context (2026-07-21):** the app is live at finlitquest.com and Capacitor-wrapped for iOS (Blocker 9b), but this Mac cannot run the Xcode version Apple currently requires (see `docs/FQ-APP-002-native-build-release-standard.md` §1) and never will (hardware ceiling, not fixable). Plan is to hand off only the final build/sign/TestFlight/submit step to an outside specialist once this Mac's-worth of work is done — everything in this document is aimed at that specialist needing to touch nothing but Apple-specific tooling, not application code.

This file is updated after every completed item. Status values: `Not Started` / `In Progress` / `Verified`. Phase numbering below supersedes the original Phase 1-7 structure (reconciled 2026-07-21) — the **Blocker Log** further down is an append-only historical record and is not renumbered retroactively.

---

## Phase 1 — Gameplay Completion
*(supersedes old "Puzzle Engine" / "Save System" sections; = Blockers 3, 4, 5, 6, 7 below)*

- [x] **Blocker 3 — Level progression — VERIFIED 2026-07-21.** See Blocker Log for full detail.
- [x] **Blocker 4 — Puzzle progression — VERIFIED 2026-07-21.** See Blocker Log for full detail.
- [x] **Blocker 5 — Save/load persistence — VERIFIED 2026-07-21.** See Blocker Log for full detail.
- [ ] **Blocker 6 — Crypto end-to-end.** Every puzzle loads/solvable, definitions match, rewards work, lesson completes, next unlocks. No placeholder content, no dead ends.
- [ ] **Blocker 7 — Credit end-to-end.** Same checklist as Blocker 6.
- [x] Coins — verified 2026-07-20 (see Blocker Log)
- [x] XP — verified 2026-07-20 (see Blocker Log)
- [x] Score (quiz scoring) — verified 2026-07-20 (see Blocker Log)

## Phase 2 — Full QA
*(supersedes old "Bug Sweep"; = part of Blocker 8 below)*

- [ ] Every screen, button, menu, popup, animation
- [ ] Portrait / landscape (if supported) / mobile / tablet / different browser sizes
- [ ] New install, returning user, refresh, clearing storage, full playthrough
- [ ] Deliberate break-attempts, every reproducible defect documented and fixed
- [ ] Console errors, missing assets, broken navigation, duplicate rewards, layout problems

## Phase 3 — Apple Guideline Review
*(new 2026-07-21, not previously tracked as its own item)*

- [ ] Research current official Apple App Review Guidelines (not assumed from training knowledge — verify against live documentation)
- [ ] Audit against 4.2 Minimum Functionality specifically (real risk for a Capacitor-wrapped web app — see prior concerns raised before Blocker 9b)
- [ ] Audit: user experience, performance, educational value, privacy, accessibility, offline behavior, loading experience, navigation, error handling
- [ ] Produce a PASS / FAIL / NOT APPLICABLE checklist — nothing left as "unknown"

## Phase 4 — Privacy & Compliance
*(overlaps old Phase 6's Privacy Policy/ToS item and FQ-APP-002 §7)*

- [ ] Privacy Policy — document exactly what's stored (all local `localStorage`, no backend, confirmed architecturally), whether analytics/tracking exist (none currently), whether accounts exist (none), whether purchases exist (none currently — coin economy is earn-only)
- [ ] Terms of Service
- [ ] Support page + contact information
- [ ] Every statement verified accurate against the actual app, not boilerplate

## Phase 5 — Accessibility
*(new 2026-07-21, not previously tracked)*

- [ ] Font sizing, contrast
- [ ] Touch target sizes
- [ ] Screen-reader labels where applicable
- [ ] Keyboard accessibility where applicable
- [ ] Color dependency (information not conveyed by color alone)
- [ ] Focus states

## Phase 6 — Performance
*(supersedes old Phase 5; = part of Blocker 8 below)*

- [ ] Initial load time, memory usage, bundle size, rendering performance, image/asset optimization

## Phase 7 — App Store Assets
*(= Blocker 10 below, supersedes old Phase 6's asset items)*

- [x] App icon — done (Blocker 9b, real 1024×1024 icon installed)
- [x] Splash screen — done (Blocker 9b, branded navy + compass mark)
- [ ] App name, subtitle, description, keywords, screenshots, feature graphics, age rating, category, support URL, Privacy Policy URL (Phase 4 dependency)

## Phase 8 — Submission Readiness Review
*(new 2026-07-21; formal gate before Blocker 11 — Submit)*

- [ ] Formal PASS/FAIL per category: technical readiness, educational completeness, production quality, compliance, user experience, App Store readiness
- [ ] Outstanding issues listed with severity and estimated effort
- [ ] No submission until every critical blocker is resolved

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

### Blocker 3 — Level progression — VERIFIED 2026-07-21

**Root cause:** the level number shown to the player was computed independently in four places instead of one — `learning-engine.js`'s `review()` and `recordWorkbookAttempt()` (correctly, `floor(xp/250)+1`), `word-game-app.js`'s `wgFoundWord()`/`wgUpdateHeader()` (correctly, same formula), and `app.js`'s legacy `updateDashboard()` (**wrongly**, `floor(xp/100)+1`). Same player, different level number depending which screen was open. The underlying persisted `player.level` field was always computed correctly — this was a display bug, not a data-corruption bug, so no save migration was needed for existing data.

**Changes made:** consolidated into one canonical source in `learning-engine.js` — `XP_PER_LEVEL=250`, `levelForXp(xp)`, `xpIntoLevel(xp)`, all exported. `app.js` and `word-game-app.js` now call these instead of hardcoding the divisor (or, in app.js's case, the wrong one). Per the broader principle raised during this fix — **consolidate duplicated business logic before release, not after** — went further than patching the one known bug: `word-game-app.js`'s level *label* (`wgLevelLabel`) was still reading the cached `player.level` field directly rather than recomputing from `xp` like everything else now does. Fixed that too, so the displayed level is never trusted from a possibly-stale cached field anywhere — always derived fresh from `xp`, on every render, on every screen.

**Bugs found by testing before declaring done (exactly per the "verify before marking complete" rule):**
1. First pass missed a second, separate usage of the old `levelXp` variable name later in the same `updateDashboard()` function (`#xpToNext`/`#footerProgressFill`, also with the same wrong `/100` denominator) — caught immediately by a live `ReferenceError` on first real-browser test, not by code review. Fixed and re-verified.
2. A deliberate "simulate an old/corrupted save" test (manually set `player.level=1` in localStorage while `xp=300`) caught that `wgLevelLabel` still trusted the stale cached field — the word-game screen showed "LEVEL 1" while the dashboard correctly self-healed to "LEVEL 2" from the exact same save. This is the fix described above; re-verified after.

**Tests added:** `tests/learning-engine.test.js` — `levelForXp` boundary correctness (0/249/250/499/500 → levels 1/1/2/2/3); `xpIntoLevel` resets to 0 exactly at each boundary; both functions never throw or return garbage on `NaN`/negative/`undefined` input; `XP_PER_LEVEL` is exported (no caller needs to hardcode 250); `review()` and `recordWorkbookAttempt()` both set `player.level` via the exact same formula as the exported `levelForXp` (including a case that crosses a level boundary). Full suite: **161/161 passing**.

**Live verification, full checklist (`http://localhost:8756`, real clicks, fresh player, no test mocks):**
- [x] Word Game screen displays the correct XP — confirmed `wgXp` matches `learning.save.player.xp` exactly throughout
- [x] Credit Workbook screen displays the same XP — confirmed `workbookHeaderXp` matches
- [x] XP awarded after completing a level is correct — 3 real CRF quizzes via actual button clicks, 100 XP each, exactly matching `workbook.xp`; crossed the 250 boundary at the third (200→300 XP, level 1→2)
- [x] XP persists after refreshing the page — reloaded, xp/level/coins all unchanged
- [x] Progress bars update correctly — at xp=300 (50 into level 2), both `journeyLevelProgress` and `wgLevelBar` independently computed to exactly 20% width (50/250×100)
- [x] Level unlocks still occur at the intended thresholds — 200 XP → level 1, 300 XP → level 2, confirmed against the 250-per-level design
- [x] Coin rewards remain unchanged — 300 coins throughout, untouched by this fix (confirmed unaffected, not just unmentioned)
- [x] Existing saved games migrate correctly — no migration needed (persisted data was never wrong), but stress-tested the more important property: a save with a deliberately wrong cached `player.level` now displays correctly everywhere anyway, because display no longer trusts that cache
- [x] No console errors — checked twice, clean both times
- [x] All automated tests still pass — 161/161

**Files modified:** `learning-engine.js`, `word-game-app.js`, `app.js`, `tests/learning-engine.test.js`.

**Remaining blockers:** puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), branding/domain (9, mostly done — see below), store assets (10), submission (11). Plus the new Phase 3 (Apple Guideline Review), Phase 4 (Privacy & Compliance), Phase 5 (Accessibility), Phase 8 (Submission Readiness Review) from the 2026-07-21 plan restructure.

### Blocker 4 — Puzzle progression — VERIFIED 2026-07-21

**Scope note (not a bug):** live gameplay has no "lesson" concept at all — `word-game-app.js` has zero lesson references. The checklist's "5-puzzles-per-lesson" wording carries over loosely from the curriculum/workbook side; in live gameplay it's actually 5 puzzles per **world** playthrough, correctly configured per-world (`WG_WORLDS[x].requiredPuzzles`, `word-game-app.js:18,26`, default 5 at `:32`). The lesson-scoped generator built earlier in this project (`generateLessonPuzzles`, `src/puzzle-pipeline-service.js`) is CLI-only, not wired into live gameplay — confirmed via `docs/PUZZLE_GENERATOR_PIPELINE.md:236`.

**Root cause (real bug found and fixed):** `wgFoundWord` (`word-game-app.js:197`) awarded coins/XP unconditionally on every word-found event, keyed only to an in-memory per-puzzle guard (`wgState.found`, resets on every new puzzle/reload). It never checked the permanent `progress.solvedWords` list before paying out, even though that list already existed and is correctly maintained for this exact purpose. Vocabulary words are shared across multiple puzzle clusters (e.g. "MINT" appears in both `CHAIN|GAS|MINT` and `MINER|MINT|PEER`), so the same word legitimately reappears across playthroughs — every reappearance re-paid the full reward, indefinitely, not just on reload.

**Live reproduction before the fix** (`http://localhost:8756`, real clicks + direct calls to the same functions the UI calls, fresh player, cleared storage): solved "MINT" → XP 0→6, correctly recorded to `solvedWords`. Reloaded (correctly landed on World Selection, not mid-puzzle — that part of Blocker 12 works as designed). New playthrough drawn; "MINT" reappeared in a different puzzle cluster. Solved it again → XP 6→**12**. Confirmed independently with "CHAIN" appearing twice in the same single playthrough (no reload needed) — same double-payment.

**Changes made:** added `wordReward(word, alreadySolvedWords)` to `src/puzzle-bank-engine.js` — single canonical source for "what does solving this word pay," returns `{coins:0,xp:0,isNewSolve:false}` for a word already in `solvedWords`, the real formula otherwise. `word-game-app.js`'s `wgFoundWord` (reward payout) and `wgUpdateMission` (the "+X coins/+X XP" preview shown before solving) both now call this instead of each keeping their own copy of the reward formula — the local `wgRewardFor` was deleted entirely (was duplicated in two places, per the standing "consolidate before release" principle). The word still marks as found for puzzle-completion purposes on a repeat encounter (`wgState.found.add(word)` runs unconditionally, gameplay isn't broken) — only the currency payout is gated.

**Tests added:** `tests/puzzle-bank-engine.test.js` — `wordReward` pays the correct coins/xp for a never-solved word; pays exactly zero for a word already in `solvedWords`; treats a missing/undefined `solvedWords` list as empty rather than throwing. Full suite: **164/164 passing**.

**Live re-verification after the fix** (same repro steps): solved "CHAIN" fresh → XP 0→8, recorded to `solvedWords`. Reloaded, re-entered Crypto World, "CHAIN" reappeared in the new playthrough. Solved it again → **XP stayed at 8**, `solvedWords` stayed a deduplicated `["CHAIN"]`, and the word still correctly marked "found" for that puzzle. Zero console errors. Also re-verified the four already-correct areas live: word wheel/crossword rendering (real grid + wheel for a fresh puzzle), genuine Fisher-Yates randomization (already had 9+ tests, unchanged), no duplicate puzzle IDs within one playthrough, and — separately from the reward bug — confirmed mid-playthrough puzzle *position* (which of the 5 you're on, in-progress found-words) intentionally does not survive a reload, by design (a fresh playthrough is drawn instead); this is a reasonable "session resets" behavior for a casual game, not treated as a defect, and is now safe by construction since re-encountering an old word pays nothing.

**Files modified:** `src/puzzle-bank-engine.js`, `word-game-app.js`, `tests/puzzle-bank-engine.test.js`.

**Remaining blockers:** save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8. Plus the still-open Credit-dashboard-Crypto-wiring follow-up flagged during Blocker 12 (not blocking, tracked separately).

### Blocker 5 — Save/load persistence — VERIFIED 2026-07-21

**Scope of investigation:** save schema, coins, XP, score, current position, completed puzzles/solvedWords, streak, settings, corruption/version handling, existing test coverage.

**Found correct, no changes needed:** coins (single shared balance, always followed by `persist()`), XP (already hardened in Blockers 2/3), workbook score (`scoreQuiz`/`recordWorkbookAttempt`, single call site, no bypass), `solvedWords` (persists with the same `persist()` call as coins/xp, can't drift apart), settings (`theme`/`reducedMotion`/`skipLessons`, part of the same save object, all mutations followed by persist). Current world/lesson/puzzle position intentionally resets on reload — established and accepted as correct behavior during Blocker 4, not re-litigated here.

**Root cause (real bug found and fixed):** `player.streak` was never sanitized on load, unlike `xp` — `normalizeSave` (`learning-engine.js`) only ran `sanitizeXp()` on the xp field. A corrupted save (`streak` as a non-numeric string or a negative number, e.g. from manual tampering or a bug elsewhere) would render straight into the UI, since the only place `streak` gets recomputed (`touchActivity()`) runs *after* the player's first action of the session, not on load — same bug class as Blocker 4 (in-memory/persisted-state can drift from what's actually valid). `coins` had a milder version of the same gap: not sanitized on load, though every coin-mutating write path already self-heals via `(coins||0)+reward`, so it couldn't get stuck corrupted forever — but a corrupted value could still render incorrectly before the first write.

**Changes made:** generalized `sanitizeXp` in `learning-engine.js` into a shared `sanitizeCount(value)` (identical guard: finite and non-negative, else 0), applied to `player.xp` (unchanged behavior), `player.coins`, and `player.streak` in `normalizeSave`.

**Tests added:** `tests/learning-engine.test.js` — corrupted streak (NaN/string/negative) sanitizes to 0 on load; a valid streak including 0 is preserved exactly; corrupted coins (NaN/string/negative) sanitizes to 0 on load. Full suite: **167/167 passing**.

**Live verification** (`http://localhost:8756`, real save injected directly into localStorage to simulate corruption, then loaded through the real bootstrap — not a test mock): seeded `{xp:100, coins:"corrupted", streak:-99}`, reloaded. Result: `xp:100` (preserved), `coins:0` (sanitized, header correctly showed "0" not "corrupted"), `streak:0` (sanitized). Separately verified the already-correct areas live: set coins/theme, solved a word (XP/coins/solvedWords all updated), reloaded — `coins`, `theme`, `solvedWords`, and `xp` all survived exactly. Zero console errors throughout.

**Noted but not fixed (no live risk today):** `saveVersion` exists (`CURRENT_SAVE_VERSION=3`) but there's no real branching migration logic — old saves are merged via object-spread defaults, which only works because schema changes so far have been purely additive. No fixture exists for an old numbered save undergoing an actual field transformation. Flagged for whoever changes the save schema next (e.g. renaming or restructuring a field, not just adding one) — spread-merging won't handle that safely without real migration logic.

**Files modified:** `learning-engine.js`, `tests/learning-engine.test.js`.

**Remaining blockers:** Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8. Plus the still-open Credit-dashboard-Crypto-wiring follow-up from Blocker 12.

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

### Blocker 12 — Onboarding & World Navigation Redesign — VERIFIED 2026-07-21

**Explicit exception to the standing "no redesign" rule.** This one was proposed and confirmed by the user as a deliberate final UI change before submission, not a scope violation — confirmed via direct question before any implementation started, since it visibly conflicts with the same session's own "do not redesign the application" instruction.

**Problem (confirmed accurate before implementing):** the app opened directly into Crypto gameplay (`wgOpenWorld("crypto")` called unconditionally on every load) with no world-selection screen anywhere. Credit World was reachable only via a "Journey" button, which made Credit feel like the actual starting content despite Crypto being the real first world. There was no way to discover Crypto as "a world" once inside Credit, and the reverse was equally true — the Crypto screen's "Journey"/back/logo buttons unconditionally landed on Credit's own continent screen regardless of which world you'd been in, an asymmetry that directly caused the confusion described.

**Explicitly declined part of the proposal:** the mockup included five "Coming Soon" worlds (Investing, Real Estate, Taxes, Insurance, Retirement) — checked `FUTURE_FEATURE_BACKLOG.md` and the whole repo; none exist anywhere as planned content. Advertising them in a submitted App Store app would be a claim about content that isn't actually planned. Confirmed with the user before building anything: show only Crypto + Credit, the two worlds that actually exist.

**Changes made:**
- Two new screens: `#welcomeScreen` (shown once, true first-ever launch only, gated on a dedicated `finlitQuest.onboarded` localStorage flag independent of the save schema) and `#worldSelectScreen` (shown right after Welcome on first launch, and made into the **permanent** landing/hub screen for every subsequent launch — not a one-time-only step, which is what actually fixes the "no way to discover Crypto as a world" problem for returning users, not just new ones).
- World Selection shows exactly two cards — Crypto World and Credit World — each with the identity sentence the user wrote, reusing each world's *existing* entry point unchanged (`wgOpenWorld("crypto")` for Crypto; `showDashboard()`, Credit's existing continent/journey screen, for Credit). No new "World Overview" or "Level Selection" screens were built — Credit's continent screen already serves that role today (it already has real per-world identity copy, `#worldEvolutionCopy`), and rebuilding an equivalent map for Crypto would have been a much larger addition than what was actually reported broken.
- Rewired every "back to home" trigger app-wide to go to World Selection instead of hardcoding a jump into Credit specifically: `#wgBack`, `#wgBrandLogo`, `#wgNavJourney` (the exact "Journey" button named in the report), `#wgNavPause`, and the legacy dead `#backHome`. Added a new clickable brand-logo button on Credit's own continent screen (`#journeyBrandLogo`, previously a non-interactive `<div>`) so there's a way back to World Selection from inside Credit too — there wasn't one before this. Left Credit's *internal* back-navigation (workbook list → continent map) untouched — that hierarchy was already correct.
- Applied the standing "consolidate duplicated logic" principle proactively while touching this code: the four screen-switching functions (`showPlay`, `showDashboard`, `wgOpenWorld`, `openWorkbookWorld`) each maintained their own slightly-inconsistent hide-list for the app's screens — one included a dead `#creditGameScreen` reference that no longer exists in the HTML, none of them knew about the two new screens. Replaced all four with one shared `hideAllScreens()`.

**Adjacent bug found, deliberately not fixed here (flagged as a separate follow-up task):** Credit's continent screen has three widgets (`#continueLearning`, `#viewLevels`, `#dashboardReview`) that unconditionally jump to Crypto regardless of being displayed on the Credit screen, and its "Daily Review" stat is actually reading Crypto's SM-2 review data (`learning.worldStats(WORLD.id)` where `WORLD` is app.js's Crypto object) — strong evidence this screen was originally Crypto's own dashboard before being relabeled for Credit and never fully rewired. Real, pre-existing, unrelated to this change — spawned as its own follow-up task rather than expanding this one further.

**Live verification** (`http://localhost:8756`, real clicks, both desktop and mobile 375×812 viewports):
- True first launch (cleared storage): Welcome screen renders correctly, "Start Your Adventure" → World Selection renders both world cards with correct descriptions
- Tapped Crypto World → opened directly into Crypto gameplay, fresh player (300 coins/0 XP/Level 1) as expected
- Tapped the "Journey" bottom-nav button from inside Crypto → correctly returned to World Selection (**this was the exact reported bug** — previously landed directly in Credit)
- Tapped Credit World from World Selection → Credit's continent screen, unchanged visually from before
- Tapped the new clickable brand logo on the Credit continent screen → correctly returned to World Selection
- Entered the Credit Foundations workbook, tapped its own back button → correctly returned to the Credit continent map (internal hierarchy preserved, not redirected to World Selection)
- Reloaded without clearing storage (returning-user case) → Welcome correctly skipped, landed directly on World Selection
- Zero console errors throughout, on both viewport sizes
- 161/161 automated tests still passing (this is pure navigation/UI, no unit-testable logic changed)
- Synced into the Capacitor iOS bundle (`build-www.sh` + `cap sync ios`) so the native app gets this fix too, not just the web deployment

**Files modified:** `index.html`, `app.js`, `word-game-app.js`, `workbook-app.js`, `word-game.css`, `journey.css`.

**Remaining blockers:** unchanged — puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8. Plus the newly-flagged Credit-dashboard-Crypto-wiring follow-up (not blocking, tracked separately).

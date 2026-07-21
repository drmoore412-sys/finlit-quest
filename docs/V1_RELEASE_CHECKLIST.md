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
- [x] **Blocker 6 — Crypto end-to-end — VERIFIED 2026-07-21.** See Blocker Log for full detail.
- [x] **Blocker 7 — Credit end-to-end — VERIFIED 2026-07-21.** See Blocker Log for full detail.
- [x] Coins — verified 2026-07-20 (see Blocker Log)
- [x] XP — verified 2026-07-20 (see Blocker Log)
- [x] Score (quiz scoring) — verified 2026-07-20 (see Blocker Log)

## Phase 2 — Full QA
*(supersedes old "Bug Sweep"; = part of Blocker 8 below)*

- [x] **VERIFIED 2026-07-21.** Every screen, button, menu, popup, animation
- [x] **VERIFIED 2026-07-21.** Portrait / landscape (if supported) / mobile / tablet / different browser sizes
- [x] **VERIFIED 2026-07-21.** New install, returning user, refresh, clearing storage, full playthrough
- [x] **VERIFIED 2026-07-21.** Deliberate break-attempts, every reproducible defect documented and fixed
- [x] **VERIFIED 2026-07-21.** Console errors, missing assets, broken navigation, duplicate rewards, layout problems

## Phase 3 — Apple Guideline Review — VERIFIED 2026-07-21
*(new 2026-07-21, not previously tracked as its own item)*

- [x] Research current official Apple App Review Guidelines — fetched live from developer.apple.com/app-store/review/guidelines/ (not assumed from training knowledge), full text of every section below.
- [x] Audit against 4.2 Minimum Functionality specifically — see PASS/caveat below.
- [x] Audit: user experience, performance, educational value, privacy, accessibility, offline behavior, loading experience, navigation, error handling — folded into the checklist below.
- [x] Produce a PASS / FAIL / NOT APPLICABLE checklist — nothing left as "unknown." Full detail in Blocker Log below.

### Guideline-by-guideline checklist

| # | Guideline | Verdict | Basis |
|---|---|---|---|
| 4.2 | Minimum Functionality — apps shouldn't be a repackaged website | **PASS, with a mitigation required before submission** | Real interactive gameplay (drag/tap word-wheel puzzles, flashcards, matching, quizzes, XP/level/streak progression, persistent local save), works fully offline, no browser chrome. Meaningfully "app-like," not a passive content wrapper. **Action required (not yet done):** write specific, detailed "Notes for Review" text in App Store Connect describing the interactive gameplay up front — Capacitor-wrapped apps are a known automatic-rejection risk under 4.2 if reviewers assume "web wrapper" without being told otherwise. Tracked as a Blocker 10/11 action item. |
| 2.1 | App Completeness — tested on-device, no crashes, no placeholder content | **PARTIAL — cannot be fully verified from this environment** | No placeholder/dummy content anywhere (confirmed repeatedly, Blockers 6-8). No login exists, so no demo account is needed. **Real gap:** "tested on-device for bugs and stability" has only been done via the browser-based Capacitor web engine in this sandboxed environment, never a real physical iOS device or even the Xcode Simulator — blocked by this Mac's hardware ceiling (`docs/FQ-APP-002-native-build-release-standard.md` §1). This is explicitly the job left for whoever performs the final native build; already documented there, not new. |
| 2.3 | Accurate Metadata — description/screenshots must reflect real functionality | **PENDING — not yet applicable, store listing doesn't exist yet** | No fabricated content risk already ruled out: the "Coming Soon" worlds proposed during Blocker 12 were explicitly declined for exactly this reason (advertising unbuilt content). Once Blocker 10 produces real screenshots/description, they must show actual gameplay (2.3.3) and stay 4+-appropriate even if the app's age rating is higher (2.3.8). |
| 5.1.1 | Privacy — privacy policy required, in-app and in App Store Connect | **PASS, resolved in Phase 4** | `privacy.html` published at finlitquest.com/privacy.html, states the actual architecture accurately (100% local storage, zero backend, zero accounts, zero third-party analytics/ads/SDKs), linked from the Welcome screen footer so it's reachable in-app as 5.1.1(i) requires, not just in App Store Connect metadata. |
| 2.5.2 | Self-contained bundle, no dynamically downloaded/executed code | **PASS** | Confirmed during Blocker 9b: zero runtime `fetch()` calls exist anywhere in the codebase; `www/`/`ios/App/App/public/` bundles all HTML/JS/CSS locally, nothing loaded remotely at runtime. |
| 3.1.1 / 3.1.5(v) | In-App Purchase required for unlockable content; cryptocurrency apps can't pay currency for tasks | **NOT APPLICABLE** | No real-money purchase path exists anywhere in the app — coins are earn-only by design (confirmed architecturally throughout the project) and are spent only on optional in-puzzle convenience (hints/reveals), never to gate core content. Both Crypto World and Credit World are freely selectable with zero currency required (World Selection screen, no locking). Since nothing is ever sold, there's nothing to circumvent Apple's IAP system with — this guideline governs paywalling behind a private currency, which doesn't happen here. |
| 3.1.5 | Cryptocurrencies — wallets/mining/exchanges/ICOs | **NOT APPLICABLE** | Confirmed via Apple's own guideline text: 3.1.5 governs apps that facilitate real virtual-currency storage, mining, exchange, or ICOs. "Crypto World" is purely educational vocabulary content (word-puzzle definitions of blockchain/DeFi terms) with zero connection to any real wallet, exchange, or mining operation — categorically the same as a dictionary app that happens to include financial terminology. |
| 1.1 | Objectionable Content | **PASS** | No violence, hate speech, sexual content, or discriminatory material anywhere in the app — financial-literacy educational content only. |
| 1.3 | Kids Category | **NOT APPLICABLE** | Nothing indicates intent to submit under the Kids Category specifically; standard age rating is the right path (age-rating selection itself is a Blocker 10 action item, not a guideline compliance question). |
| 2.5.4 / 2.5.5 | Background services used only for stated purpose; IPv6-only network support | **PASS** | No background services beyond Capacitor/WKWebView defaults; app has zero network dependency at all (100% offline-capable, confirmed extensively Blockers 4-8), so IPv6-only compatibility is moot — there's no network traffic to be incompatible. |
| 4.1 | Copycats — original app, no impersonation | **PASS** | Original branding and content (verified during Blocker 9's brand-asset work), not impersonating any other app or service. |
| 1.5 | Developer Information — Support URL with a real way to contact the developer | **PASS, resolved in Phase 4** | `support.html` published at finlitquest.com/support.html with a direct contact email and FAQ. Ready to enter as the Support URL in App Store Connect during Blocker 10. |
| 4.8 | Sign in with Apple — required if using third-party login | **NOT APPLICABLE** | Confirmed: the app has zero login/account system of any kind (no accounts, no third-party auth, no first-party auth) — the guideline only applies when a third-party/social login exists at all. |
| — | Info.plist purpose strings for device permissions | **NOT APPLICABLE** | App requests zero device permissions — no camera, location, contacts, microphone, or any other protected resource, confirmed by the app's architecture (pure local-storage word game). No purpose strings needed. |

### Net assessment

No outright guideline **violations** found — every FAIL above was a missing *artifact* (privacy policy, support URL, on-device testing, App Review notes) rather than a design or behavior problem with the app itself. Privacy policy and support URL were resolved in Phase 4 (below). Remaining: on-device testing (native-build specialist's job, already documented) and App Review notes (Blocker 11).

## Phase 4 — Privacy & Compliance — VERIFIED 2026-07-21
*(overlaps old Phase 6's Privacy Policy/ToS item and FQ-APP-002 §7)*

- [x] Privacy Policy — `privacy.html`, live at finlitquest.com/privacy.html. Documents exactly what's stored (all local `localStorage`, no backend, confirmed architecturally), that no analytics/tracking/ads/third-party SDKs exist, no accounts exist, and no purchases exist (coin economy is earn-only, stated explicitly).
- [x] Terms of Service — `terms.html`, live at finlitquest.com/terms.html.
- [x] Support page + contact information — `support.html`, live at finlitquest.com/support.html, with a direct contact email and FAQ.
- [x] Every statement verified accurate against the actual app, not boilerplate — see Blocker Log for the specific claims cross-checked.

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

- [x] **VERIFIED 2026-07-21.** Initial load time, memory usage, bundle size, rendering performance, image/asset optimization — see Blocker 8 log entry.

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

### Blocker 6 — Crypto end-to-end — VERIFIED 2026-07-21

Full first-time-player walkthrough, real UI clicks and real drag/tap gestures (not just function calls), plus targeted scripted checks for reward/progression integrity across repeated completions, refreshes, and navigation — per the explicit instruction that Blockers 4/5 exposed a real pattern (unsafe state that drifts between in-memory and persisted) worth specifically re-testing here.

**Scope clarifications made before testing (confirmed with the user):**
- "Every Crypto level can be completed" — `worlds/crypto.js`'s `levels` array (crypto-1..5) is dead/unused legacy scaffold data, zero references from live gameplay. What's actually played is one continuous 20-term vocabulary bank with randomized 5-puzzle playthroughs. Verified the real structure instead: every one of the 20 terms is reachable and solvable (see Bug 2 below — this wasn't true until fixed).
- "Pause/resume works" — `#wgNavPause` was wired identically to Back/Journey (discards the whole in-progress puzzle, no real pause state). Relabeled to an honest "Exit" (🚪) rather than building real pause/resume, per your direction — small, safe, no behavior change.

**Bug 1 (real, high severity) — discrete tap-to-build-word could never submit, contradicting the on-screen instructions.** The wheel's on-screen copy reads "Swipe or tap letters to build words," but `wgSubmitWord()` was only ever called from a global `pointerup` listener gated on `wgGestureLetters > 1` — and every discrete tap is its own separate pointerdown/up gesture, so `wgGestureLetters` never exceeds 1 for tap-built input, regardless of device (touch or mouse). **Reproduced live**: 5 correct discrete taps spelling the exact target word "TOKEN" left `wgState.found` empty and XP at 0. A real drag gesture (verified separately) worked correctly (XP 0→8). **Fix:** `wgAddLetter` (`word-game-app.js`) now checks after every letter add whether the accumulated selection spells a target word, submitting immediately if so — works identically whether the selection was built by a drag or by separate taps. **Re-verified live**: 4 discrete taps spelling "LOCK" now correctly submit (XP 8→14, coins 335→363). Confirmed no regression to existing behavior: a real drag still works, an invalid 2-letter drag ("AT") still toasts "Not in this puzzle" and clears without crashing, resubmitting an already-found word still shows "Already found" with no double reward.

**Bug 2 (real, high severity) — the live puzzle bank could permanently omit vocabulary words for a save's entire lifetime.** `wgEnsureBank()` only tops up the bank when `bank.length < size`; it never re-checks coverage once the target size is reached. **Reproduced live**: after cycling through enough playthroughs to reach 17/20 words solved, the remaining 3 (MINT, LEDGER, MINER) were confirmed completely absent from the persisted 10-slot bank — not bad luck in that one session, but permanent, since the bank never regenerates. Verified this wasn't a structural exclusion (unlike the earlier Credit CRF-001/002 finding) by rebuilding with 30 slots instead of 10 across 20 trials: all three words appeared in 18-20 of 20 trials, confirming they combine fine within the wheel budget and were simply missed by the random draw. **Fix:** `buildBank` (`src/puzzle-bank-engine.js`) now guarantees full vocabulary coverage after its normal random-fill pass — for any word not yet covered, it retries `buildOneCandidate` with that word forced first in the candidate pool (a new optional `forcedWord` parameter) so it pairs naturally with other words in one attempt instead of needing many blind retries or landing as an isolated single-word entry. Bank size is now a floor, not an exact count — it grows only for words actually missing. **Re-verified live**: a fresh save's bank grew from 10→12 entries with zero words missing (was 3 missing before the fix).

**Other checklist items, confirmed correct with no changes needed:**
- Welcome → World Selection → Crypto opens correctly, fresh player state (300 coins/0 XP/Level 1) as expected.
- Valid/invalid word handling, mission word display, definitions panel (masked pattern for unsolved, revealed + checkmark for solved) — all correct.
- Hint cost exactly 100 coins, full reveal exactly 300 coins, both block correctly on insufficient balance with a toast and no state change.
- Coins/XP update correctly on solve; puzzle-complete panel correctly sums rewards across all words in that puzzle.
- Level-up unlock: pushed XP across the 250 threshold live, header correctly updated to "LEVEL 2" immediately.
- Back navigation (top-left arrow) and Exit (renamed Pause) both correctly return to World Selection.
- Refresh/relaunch persistence: XP, coins, solved-word count, and level all survived a real page reload exactly.
- No "Crypto World complete" end state exists — confirmed this is graceful by design, not a bug: finishing one 5-puzzle playthrough silently starts a new random one, which is the intended perpetual-practice structure for a vocabulary-bank word game, not a"levels" game with a defined ending.
- Zero console errors and zero placeholder/TODO content found anywhere in Crypto's terms/definitions.

**Adjacent, not fixed here (flagged as cleanup, not a blocker):** `worlds/crypto.js`'s `levels`/`bonusWords` arrays are dead code — confirmed zero live references. Flagged for removal during Blocker 8 (bug sweep), alongside the already-flagged dead legacy XP path from Blocker 2.

**Tests added:** `tests/puzzle-bank-engine.test.js` — new coverage-guarantee test asserting every vocabulary word appears in the built bank; updated three existing tests whose assertions assumed `buildBank` returns exactly the requested size (it's now a floor, since coverage can require growing past it) to assert `>=` instead, plus one test's own internal 8/2 split pinned to a fixed `.slice(0,10)` so it stays deterministic regardless of coverage-driven overage. Full suite: **168/168 passing**, confirmed stable across 5 repeated runs (randomized, to rule out flakiness).

**Files modified:** `word-game-app.js`, `src/puzzle-bank-engine.js`, `index.html`, `tests/puzzle-bank-engine.test.js`.

**Remaining blockers:** Credit e2e (7), bug sweep/performance (8 — now also carries the dead `worlds/crypto.js` levels/bonusWords cleanup), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8. Plus the still-open Credit-dashboard-Crypto-wiring follow-up from Blocker 12.

### Blocker 7 — Credit end-to-end — VERIFIED 2026-07-21

Full first-time-player walkthrough, real UI clicks and real drag/tap gestures where feasible, plus scripted checks for reward/progression integrity — same standard as Blocker 6.

**Structure confirmed before testing:** Credit World is NOT purely workbook-quiz-based as initially assumed — it has both (a) 15 workbook lessons (CRF-001..015, all built and wired; only "Credit Foundations" continent node is unlocked for v1.0, the other 7 chapters correctly stay locked) and (b) its own live word-wheel puzzle game sharing `word-game-app.js`/`src/puzzle-bank-engine.js` with Crypto, vocabulary from `content/credit-game-terms.json` (38 words), reachable via a "Play the credit word game" button on the workbook map. Confirmed the lesson-scoped CLI eligibility fix from much earlier this session is offline-authoring-only and has no effect on live gameplay (matches Blocker 6's finding for Crypto).

**Bug 1 (real, high severity) — Credit's continent screen showed Crypto's data and routed to Crypto's word game.** Flagged during Blocker 12 as a known adjacent bug and never actually fixed (confirmed still present via fresh code read, not assumption). Root cause: `#dashboardScreen` (Credit's continent map, reached via `showDashboard()`) reused `app.js`'s module-level `updateDashboard()`, which was written when this file was Crypto-only and still hardcoded `WORLD.id` (="crypto") for its stats source, plus three buttons (`#continueLearning`, `#viewLevels`, `#dashboardReview`) hardcoded to `wgOpenWorld("crypto")`. Confirmed this dashboard screen's OTHER callers (`showPlay`, `foundWord`, `revealHint`, etc.) all belong to the confirmed-dead legacy `#playScreen` flow from Blocker 2, so retargeting was safe. **Fix:** `updateDashboard()`'s stats source changed to `learning.worldStats("credit")` (honestly shows "No reviews due" rather than Crypto's misleading due-count, since Credit doesn't have its own spaced-repetition term tracking wired up — a separate, larger feature gap noted but not built here), and all three buttons now open `wgOpenWorld("credit")`. Re-verified live: all three buttons correctly land in Credit's own word game.

**Bug 2 (real, medium severity) — the continent screen's coin count was hardcoded to a literal 0.** Found while re-verifying the Bug 1 fix: `$("#journeyCoins").textContent=0;` was a literal, not a `player.coins` reference — the Credit continent header always showed "0 COINS" regardless of actual balance (confirmed live: real balance 300, displayed 0). `#journeyGems` is correctly left at 0 — gems aren't a real tracked currency anywhere in the app (same everywhere, including the word-game header), so that one wasn't a bug. **Fix:** `$("#journeyCoins").textContent=player.coins;`. Re-verified live: displays the real balance and updates correctly after reload.

**Finding (real, not a bug from this session's work, newly quantified) — 17 of Credit's 38 word-game vocabulary terms can never appear in a live puzzle.** 15 (OBLIGATION, AFFORDABILITY, CREDITWORTHINESS, etc.) individually exceed the 9-letter wheel budget — already known and documented in `content/puzzle-banks/credit-unplayable-terms.json` from earlier work this session. 2 more (BORROWER, APPLICANT) are a new finding: each fits the budget alone but has no compatible partner word anywhere in the 38-word vocabulary (confirmed via 500 attempts with the Blocker 6 coverage-guarantee fix, zero successful pairings) — not caught by the historical report, which only checked single-word size. This gives Credit's word-game a permanent "Words Solved" ceiling around 21/38, unlike Crypto's gap which was fully fixable. Per explicit standing instruction not to raise the 9-letter wheel budget, and since this is a content-curation question (the affected terms are already taught via flashcards/quizzes in all 15 lessons regardless), **confirmed with the user: leave as-is, document as a known/accepted limitation, not a blocker.**

**Other checklist items, confirmed correct with no changes needed:**
- Welcome → World Selection → Credit World → continent map (only Credit Foundations unlocked, others correctly locked) all render correctly.
- Full lesson flow for CRF-001: 8 lesson content steps → 5 flashcards (flip mechanic confirmed) → 4-pair matching practice (correct match accepted, incorrect match correctly rejected with visual feedback and no state change, practice-complete correctly recorded) → 8-question quiz (5 MC + 3 TF).
- Quiz scoring: answered 7/8 correct (one deliberately wrong) → "You scored 7/8 (88%). Passing score is 80%," exactly 100 XP awarded, `status: "completed"` — matches Blocker 1's already-verified scoring logic, confirmed still wired identically.
- Completing CRF-001 correctly unlocked CRF-002 (`workbookStatus` transitions "locked" → "available"), world completion percent updated (7% = 1/15), continent map re-rendered correctly.
- Credit's own word-wheel game: solved a real word via drag (RISK, XP 100→106) — confirms the Blocker 6 tap-submit fix and reward-consolidation fix apply identically to Credit, since it's the same shared engine.
- Back navigation: word-game screen → World Selection (consistent with Crypto); workbook lesson → workbook map via `wbBackHome()` (internal hierarchy correctly preserved, doesn't jump out to World Selection) — matches Blocker 12's already-confirmed-correct design.
- Full refresh/relaunch persistence: XP, coins, CRF-001 completion record, and Credit word-game solved-words all survived a real reload exactly.
- Zero console errors, zero placeholder/TODO content found anywhere in Credit's curriculum or word-game content.

**Noted, not acted on:** `curriculum/credit/approved/reports/CRF_WORLD_READINESS_CHECKLIST.md` and `CRF_WORKBOOK_COVERAGE_MATRIX.md` (dated 2026-07-19) claim all 15 workbooks are "NOT FOUND" — this directly contradicts the actual files on disk (verified all 15 exist and are fully wired), so these two reports are stale/unreliable. Flagged for a documentation cleanup pass during Blocker 8, not fixed here.

**Tests:** no new automated tests needed — these were live-UI/navigation bugs (dashboard stats source, button wiring, hardcoded display value) in DOM-coupled `app.js` code, the same category Blocker 12 established has no Node test coverage. Verified entirely through real browser interaction. Full suite: **168/168 passing** (unchanged, confirms no regression to anything test-covered).

**Files modified:** `app.js`.

**Remaining blockers:** bug sweep/performance (8 — now also carrying the dead `worlds/crypto.js` cleanup, the stale CRF report cleanup, and documenting the 17-term Credit word-game ceiling), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8.

### Blocker 8 — Bug sweep and performance verification — VERIFIED 2026-07-21

Two parts: (1) cleared the cleanup backlog flagged across Blockers 2, 6, 7, and 12, (2) a full live QA sweep — every screen/button/popup, all viewports, break-attempts, console/performance checks.

**Dead code removed (app.js, ~25 functions + `#playScreen`/`#learnModal` DOM):** the legacy Crypto crossword flow flagged as dead back in Blocker 2 (`submitWord`, `foundWord`, `showLearn`, `rateLearning`, `revealHint`, `startReview`, `showPlay`, `renderLevel`, `renderGrid`, and ~18 more, all built around a module-level `WORLD` constant and confirmed unreachable — nothing live wires a click handler to `showPlay` that isn't immediately overridden by `workbook-app.js`). Removed the corresponding DOM (`#playScreen`, `#learnModal`, ~50 ids) from `index.html`, and the dead-only module state (`TERMS`, `LEVELS`, `BONUS`, `LEVEL1_GAMES_REQUIRED`, `pointerDown`/`gestureLetters`/`rating`/etc.) and the duplicate orphaned `pointerup` listener from `app.js`. Kept every function/const the dead path shared with live code: `shuffled`, `$`/`$$`, `toast`, `celebrate`, `WORLD`, `hideAllScreens`, `showWelcome`, `showWorldSelect`, `showDashboard`, `updateDashboard`, `updateJourneyNodes`, `toggleTheme`. In `updateDashboard` (live), replaced a `state.review?...:state.level` conditional that depended on the now-removed `state` object with the literal `0` it always evaluated to in practice (nothing live ever changed those fields) — confirmed zero behavior change, not just confirmed-safe.

**`worlds/crypto.js`'s `levels`/`bonusWords` — investigated, deliberately NOT removed.** Initially planned as part of the same cleanup (nothing at runtime consumes the resulting data anymore), but `src/content-validator.js` requires `world.levels` to be a non-empty array and `world.reward.multiplier` to be a positive number as part of schema validation, and `FinLitWorldLoader.loadWorld` — called at the very first line of `app.js`, before any screen renders — throws if validation fails. Removing these fields would have crashed the entire app on load. Left `worlds/crypto.js` untouched; the "dead code" here was correctly scoped to app.js's `LEVELS`/`BONUS` consts (pointless copies of schema-required-but-unconsumed data), not the underlying world manifest.

**Stale Credit curriculum reports — corrective note added, not deleted.** Six reports in `curriculum/credit/approved/reports/` (dated 2026-07-19) falsely claim all 15 workbooks are missing ("0/15 found"), contradicted by the real, fully-wired files (confirmed live during Blocker 7). Added `CORRECTION_2026-07-21.md` in the same directory explaining the six reports were based on a mis-scoped audit and pointing to the actual evidence, rather than rewriting or deleting the historical record.

**Live regression after dead-code removal:** full flow re-verified end to end (Welcome → World Select → Crypto → back → Credit dashboard → workbook → back → theme toggle → reload) with zero console errors and all state intact — confirms the removal didn't touch anything live despite the size of the diff. 168/168 automated tests still passing (unaffected either way, since none of the removed code was test-covered — it was DOM-only dead code).

**Full live QA sweep, all clean, no further defects found:**
- Every screen (Welcome, World Select, Crypto word-game, Credit dashboard, workbook map/lesson/flashcards/matching/quiz, definitions modal, puzzle-complete panel) and every interactive element on each, clicked/exercised directly.
- Viewports: mobile portrait (375×812), mobile landscape (812×375, confirmed the page scrolls correctly and every control stays reachable), tablet (768×1024), desktop (1280×800, confirmed a wider two-column layout variant renders cleanly at that breakpoint) — no overflow, no broken elements, no stretched/cramped layouts at any size.
- New install (cleared storage → Welcome), returning user (skips Welcome, lands on World Selection), refresh (state intact), clearing storage mid-session without reloading (no crash, in-memory state kept working), full playthroughs (already covered live in Blockers 6/7).
- Deliberate break-attempts: submitting an empty word selection (no-op, no crash), rapid triple-calling word submission on an already-solved word (no double-award), spamming the hint button 5× with insufficient coins (correctly blocked every time, coins never went negative), abandoning a workbook quiz 2 questions in and reopening it (no corrupted partial record, restarts cleanly at question 1), 30 rapid full-cycle screen switches (Welcome→WorldSelect→Crypto→back→Dashboard, zero errors, zero state leaks), storage wiped mid-session then reloaded (self-heals to a fresh Welcome screen, no crash).
- Performance: initial load ~337ms measured via the Navigation Timing API against the local dev server (which itself disables caching — a worst-case measurement; the actual iOS app bundles `www/` locally via Capacitor with no network fetch at all, so real-device load is faster than this number). Bundle breakdown: 924K/33 files, dominated by fixed-size platform icon assets (`icon-512.png` 296K, `icon-512-maskable.png` 148K) that Capacitor bundles locally rather than fetching over network, so they're not a real load-time concern. `credit-foundations.js` (92K) and `crypto-terms.js` (32K) load as synchronous non-deferred `<script>` tags — flagged as a minor, non-blocking polish opportunity (defer/async), not fixed here since ~124K of synchronous JS parse is not a meaningful problem at this scale.
- Zero console errors across the entire sweep. Zero missing assets (no 404s at any point). Zero placeholder/TODO markers anywhere in the live app surface (previously spot-checked for Credit only; this pass confirmed it app-wide).

**Tests:** none added — every fix and every check in this blocker was either DOM-only dead-code removal (same no-test-coverage category as Blocker 12) or live-browser verification with no equivalent pure-logic unit to test. Full suite: **168/168 passing**, unchanged.

**Files modified:** `app.js`, `index.html`, `curriculum/credit/approved/reports/CORRECTION_2026-07-21.md` (new).

**Remaining blockers:** branding/domain (9, mostly done — native build still blocked on hardware), store assets (10), submission (11), Phases 3/4/5/8.

### Phase 4 — Privacy & Compliance — VERIFIED 2026-07-21

Built and published the three required legal/compliance pages, closing two of the FAILs identified in Phase 3's guideline audit (5.1.1 Privacy, 1.5 Support URL).

**Decisions confirmed with the user before drafting** (both become permanently public): contact email is `drmoore412@gmail.com`; developer/publisher name is just "FinLit Quest," no separate legal entity.

**`privacy.html`:** states plainly that the app collects nothing — no account/login exists, no personal information is requested, and the only data that exists (coins, XP, level, streak, puzzle/lesson progress, theme) lives entirely in local device storage and is never transmitted anywhere, because there is no backend server to transmit it to. Explicitly states no analytics, no advertising, no third-party SDKs, no data sharing/selling (nothing to share, since nothing is collected), and no children's-data collection. Explains that clearing local storage or uninstalling permanently deletes progress, since no other copy exists.

**`terms.html`:** standard acceptance/license/IP/warranty/liability terms, plus two claims specific to this app's actual design: the coin/XP virtual currency is earn-only, has no cash value, can't be purchased or redeemed, and doesn't gate any content; and the educational content is explicitly framed as general education, not financial/legal/professional advice.

**`support.html`:** direct contact email plus an FAQ answering the two questions a real user would actually have given this app's architecture — "do I need internet" (no) and "does my progress transfer to a new device" (no, since there's no account/cloud backup) — rather than generic boilerplate FAQ content.

**Every claim cross-checked against actual verified app behavior from this session**, not written as boilerplate: "no backend" (confirmed architecturally across every blocker this session — zero `fetch()` calls anywhere in the codebase, confirmed during Blocker 9b), "no accounts" (confirmed — the entire onboarding flow has no login step, Blocker 12), "no analytics/ads/third-party SDKs" (confirmed — the app's only external dependency is the Google Fonts-free system font stack; no SDK of any kind is loaded), "coins are earn-only, never purchasable, never gate content" (confirmed directly during Phase 3's 3.1.1 analysis — both worlds are freely selectable with zero currency requirement).

**In-app reachability (Apple 5.1.1(i) requires the privacy policy be linked from inside the app, not just in App Store Connect metadata):** added a small "Privacy Policy · Terms of Service" link row to the Welcome screen footer (`index.html`, `word-game.css`), styled to match the existing brand palette, `target="_blank"` so it opens outside the app shell rather than navigating away from the game. Verified live: link renders correctly, unobtrusive, correct href.

**Native app bundle:** `scripts/build-www.sh` only copies files explicitly listed (documented in FQ-APP-002 §4 as a known gotcha for exactly this situation) — added `privacy.html`/`terms.html`/`support.html` to that list so the iOS build gets working links too, not just the web deployment. Re-synced into the Capacitor bundle.

**Live verification:** all three pages render correctly (checked visually), zero console errors, full regression suite still 168/168 passing (these are new standalone pages with zero JS logic, so nothing existing was at risk, but re-ran anyway per standard practice).

**Files added:** `privacy.html`, `terms.html`, `support.html`. **Files modified:** `index.html`, `word-game.css`, `scripts/build-www.sh`.

**Remaining blockers:** branding/domain (9, mostly done — native build still blocked on hardware), store assets (10 — now includes entering the Privacy Policy URL and Support URL into App Store Connect, plus writing the 4.2 App Review notes flagged in Phase 3), submission (11), Phases 5/8.

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

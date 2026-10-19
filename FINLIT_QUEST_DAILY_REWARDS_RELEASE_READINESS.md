# FinLit Quest — Daily Rewards Release-Readiness Report

**Date:** 2026-10-17
**Reference:** `FINLIT_QUEST_PHASE2_DAILY_REWARDS_REPORT.md`
**State:** Local only. **No commit, push, merge, or deployment.** PR #4 and `docs/V1_RELEASE_CHECKLIST.md` untouched. No real player save was read or changed. No governed puzzle content was modified. No new engagement features were added.

**Result labels:** **PASS** · **FAIL** · **NOT TESTED** · **REQUIRES OWNER APPROVAL**

---

## 0. Recommendation (read this first)

| Target | Verdict |
|---|---|
| **Web (finlitquest.com)** | **Technically ready, but I recommend holding until you approve how the bundled V3 work is handled** (section 8, item 2). The reward feature passed every check I could run. Deployment needs your separate approval. |
| **iOS / App Store** | **NOT ready.** The web assets are synced and verified, but nothing has run in a native build, Simulator, or device, and Xcode is not installed. Release is blocked on items B1–B3 in section 9. |

**Is deployment safe?** For the reward feature itself: yes, on the web, after your approval. The one real obstacle is that the daily-reward code lives in the same files as uncommitted V3 work and the Phase 1 repairs, so the release unit is the whole working tree, not the reward feature alone (explained in section 8).

---

## 1. Scope and method

- Owner decisions applied: forward-clock limitation accepted for V1; 24-hour time-zone protection kept; seven-day schedule kept (10/15/20/25/30/35/50); coins only.
- Working tree inspected first: 41 dirty entries at the start (mostly uncommitted V3 work), all preserved. This task changed only the files in section 2.
- Release process followed exactly as documented in `docs/FQ-APP-002-native-build-release-standard.md` §3a, §4, §9: `node scripts/stamp-cache-bust.mjs` → `./scripts/build-www.sh` → `npx cap sync ios`.
- Test machine tooling: Node v24.18.0 (arm64), Chromium-based browser pane. No WebKit/Safari, no Xcode.

---

## 2. What changed during this verification

| Change | Why |
|---|---|
| **Fixed:** the "✓ Claimed" label overflowed its tile by 3 px at 320 px width. Below 360 px the word is hidden and the check mark stays; the full words remain in each tile's accessible label and the summary line. (`app.js`, `journey.css`) | Found by measuring at 320 px (see 5.4). |
| **Fixed:** the puzzle header's static default read "0 / 4" while the approved goal is 5 (`index.html`). | Stale default; JavaScript overwrote it, but screen readers or slow loads could expose it. |
| **Added:** recovery guidance in the two paused-state messages (`app.js`). | Requirement 7. |
| **Re-stamped, rebuilt, re-synced** the iOS bundle (three times as fixes landed). Final stamp: `?v=1792211346748` on all 40 local references. | Requirements 3 and 5. |
| **New tests (20):** `tests/bundle-parity.test.js` (4), `tests/daily-reward-clock-recovery.test.js` (7), `tests/existing-player-save-matrix.test.js` (9). | Requirements 4, 7, 8. |

Bundle files whose **content** changed because of the sync: `app.js`, `index.html`, `journey.css`, `learning-engine.js`, `word-game-app.js` (five files). `cap sync` touched file timestamps everywhere, but native project config (`capacitor.config.json`, `config.xml`, `Package.swift`) has no content change. Other modified bundle files in `git status` (`game-engine.js`, `puzzle-bank-engine.js`, `word-game.css`, V3 files) were already modified before this task.

---

## 3. Web readiness

| Check | Result |
|---|---|
| Phase 1 behavior (local-day streaks, achievement XP once, daily progress) | **PASS** (27 tests; live checks in the Phase 1 report) |
| Phase 2 behavior (schedule, one claim/day, cycle, restart, coins only, duplicate/refresh/restart safety, two tabs) | **PASS** (37 tests plus live checks) |
| Full automated suite | **PASS: 368 / 368**, run under `America/Los_Angeles`, `UTC`, `Asia/Tokyo`, `Pacific/Auckland` (baseline at task start was 348; +20 new) |
| `git diff --check` | **PASS** (exit 0; new untracked files also checked for trailing whitespace) |
| Cache-bust stamps | **PASS**: one stamp on all 40 references; the browser loaded scripts with that stamp. Re-run the stamp at the real release commit if any HTML/CSS/JS changes again. |
| Browser behavior (web source, 375 and 320 px) | **PASS**, zero console errors |
| Behavior in Safari/WebKit, any other browser | **NOT TESTED** (only the Chromium-based pane was available) |
| Live production | **NOT TESTED** (nothing deployed, by design) |
| Deploy | **REQUIRES OWNER APPROVAL** |

---

## 4. iOS readiness

### 4.1 Web-asset bundle (`ios/App/App/public`)

| Check | Result |
|---|---|
| Daily-reward implementation synced | **PASS** (`app.js`, `index.html`, `journey.css`, `learning-engine.js`, `word-game-app.js`) |
| Byte-for-byte parity, source vs bundle, every mirrored file | **PASS**: no differing file (only Capacitor's own `cordova*.js` has no source counterpart) |
| Every asset `index.html` references exists in the bundle (the documented "silently excluded file" gotcha) | **PASS**: none missing, including the new V3 files |
| Same reward rules and save structure | **PASS**: the bundle's engine produced output identical to the source engine on a 9-day claim/restart/rewind scenario (`bundle-parity` test), and the schedule array is identical |
| Reward, recovery, save-matrix, Phase 1, and V3-migration suites run **against the bundle's own copies** (modules and file reads redirected to `ios/App/App/public`) | **PASS**: 37 + 7 + 9 + 27 + 11 = 91 tests |
| Bundle served and exercised in the browser (keyboard claim, 320/375 px, paused message, restart) | **PASS** |
| Release guard | **PASS**: the new `bundle-parity` tests fail if the bundle drifts from source. I proved this by pointing them at a deliberately divergent copy (2 of 4 failed as expected). They will also fail after any source edit until the bundle is re-synced; that is intentional. |
| Native project config unchanged | **PASS** |

### 4.2 Native app

| Check | Result |
|---|---|
| Build in Xcode, run in Simulator, run on a device | **NOT TESTED.** `xcodebuild` reports only Command Line Tools are installed; the iOS Simulator tool refused to attach because a full Xcode install is missing. |
| iOS WKWebView behavior of the reward feature | **NOT TESTED.** Specific things to verify there: `localStorage` persistence across app restarts and updates; `Intl.DateTimeFormat().resolvedOptions().timeZone` (if it were unavailable, the time-zone cooldown quietly turns off, as designed); the foreground-return refresh (`visibilitychange`); safe-area spacing of the new card; behavior after a real time-zone or date change. |
| TestFlight, App Store review | **NOT TESTED** (not started) |

### 4.3 Documentation discrepancy found: this machine is not the one the release docs describe

`docs/FQ-APP-002-native-build-release-standard.md` and the V1 checklist say the dev machine is a 2015/2017 MacBook Air (`MacBookAir7,2`) capped at macOS 12 that "never will" build a submittable app. **Measured on this machine today:** model `Mac17,5`, Apple A18 Pro (arm64), macOS 26.6, 8 GB RAM, 321 GB free disk, no Xcode installed. If this is the machine you intend to build on, that documented blocker appears **no longer to apply**; installing Xcode 26 should be possible here (I cannot verify that without installing it). The documents are stale and should be updated by you (I did not edit the checklist). **FAIL (documentation accuracy).**

Also: the `gh` command-line tool on this machine is an Intel (x86_64) binary and will not run (no Rosetta), so GitHub PR/merge operations from this machine need that fixed first.

---

## 5. Accessibility

Tested in a Chromium-based browser with the accessibility tree, DOM/ARIA inspection, computed styles, and real keyboard input.

### 5.1 Keyboard — **PASS**
Tab order is theme toggle → Word Quests → Learning Quests → Claim button → status. Enter **and** Space both claimed (Enter on the web source, Space on the iOS-bundle copy). The button is a real `<button>`; when unavailable it is `disabled`.

### 5.2 Focus management — **PASS**
Visible 3 px focus outline (white, 16.5:1 against the card). After a claim the disabled button would drop focus, so focus moves to the status line, which carries the result. Verified `document.activeElement` after claiming.

### 5.3 Screen-reader announcements and labels — **PASS (structure) / NOT TESTED (real screen reader)**
Accessibility tree shows: region named "Daily reward" → heading → summary → button ("Claim 10 coins" / "Claimed today" / "Unavailable") → list "Seven-day coin reward schedule" with items such as "Day 1: 10 coins, claimed" (the current day also has `aria-current="step"`) → status region (`role="status"`, `aria-live="polite"`). Reward state is conveyed in words and a ✓, never color alone.

**Real screen-reader test: NOT TESTED — outstanding requirement.** VoiceOver exists on this Mac, but turning it on is a system accessibility setting I am not permitted to change, and no screen-control tool was available in this session. Required before release (**REQUIRES OWNER ACTION**): a person runs VoiceOver on a real iPhone (and Safari on macOS) through this script: open the home screen; swipe to "Daily reward"; confirm the heading, summary, button, and the seven day items are read as above; activate "Claim"; confirm the result is announced once and focus lands on the status line; reopen the screen and confirm "Come back tomorrow…" is not announced repeatedly in a distracting way (see risk R6).

### 5.4 Mobile layout — **PASS (after one fix)**
Measured on the iOS-bundle copy:
- 375 × 812: no overflow, no clipped text; button 329 × 44 px; "✓ Claimed" shown in full.
- 320 × 568 (the strictest reflow width): page does not scroll sideways; button 274 × 44 px; tiles 36 px. **Initial FAIL:** "✓ Claimed" was 39 px in a 36 px tile. **Fixed** (check mark kept, word hidden below 360 px); re-measured: no clipped element.
- Text-spacing overrides and 200% browser zoom: **NOT TESTED** (the pane cannot zoom pages).

### 5.5 Contrast — **PASS**
All 12 text and UI-component pairs of the daily card meet WCAG 2.x (4.5:1 text, 3:1 components). Lowest text pair is the claim button on the orange gradient end, 6.47:1; highest 17.7:1. Computed from the declared colors; the card background is ~96% opaque over the map gradient, so real values are within a fraction of these.

### 5.6 Reduced motion — **PASS**
`prefers-reduced-motion` is handled; the card adds no animation of its own.

### 5.7 Accessibility findings, not fixed (non-blocking, recommend Phase 5)
- Secondary labels (`Day N`, state labels) are 9 px. That is small and matches the app's existing 7–9 px label style; recommend raising app-wide in the Phase 5 pass.
- **Dynamic Type is not supported** in the app (sizes are fixed pixels). This is app-wide, not specific to this feature.
- Heading order on the home screen: the card's `<h2>` appears before the map's `<h1>`.

---

## 6. Save compatibility — **PASS**

Synthetic profiles only; each profile was loaded, played (touch activity), claimed, saved, and reloaded. Asserted in every case: coins change only by the claim; XP never decreases; mastery, all world progress and puzzle histories, and settings are deep-equal before and after; the claimed state survives a restart. Unknown fields survive.

| Profile | Result |
|---|---|
| V1-era Crypto-only player (legacy keys, no save object) | PASS |
| Early `saveVersion 3` player with only a player block | PASS |
| Multi-world V1 player with histories and mastery (5 worlds) | PASS |
| V3-era player (`FQ-V3:` puzzle history, rewarded term IDs) | PASS |
| Phase 1-era player (achievement rewards recorded, older claim record) | PASS |
| Player who already claimed today | PASS (claim correctly refused) |
| Very large save (400 activity dates, 60 history entries) | PASS |
| Lightly corrupted save (wrong types in several fields) | PASS (no crash) |
| Unknown fields at top level, player, world, `engagement`, `dailyClaim`, settings | PASS |
| Same matrix run against the iOS bundle's engine | PASS |
| Saves belonging to real players | **NOT TESTED** (not permitted; none were touched) |

The only new save field is `save.engagement.dailyClaim`, created on first claim. Nothing is added to `player`, `worlds`, `termProgress`, or `settings`.

---

## 7. Governed content — **PASS**

| Check | Result |
|---|---|
| SHA-256 of 21 governed files (V3 slate, Credit identity registry, all five worlds' terms and puzzle banks, reserve lists, `puzzle-bank-engine.js`, `game-engine.js`, `wheel-interaction.js`) compared with the start of this task | 21 of 21 identical |
| 27 V3 puzzles | Still 27; spec fingerprint `cb3e6394540f0207` identical before and after |
| Credit identity registry | File unchanged (38 entries) |
| Frozen vocabulary and definitions | Files unchanged; tracked `content/` has no diff against HEAD |
| iOS bundle mirrors of those files | Byte-identical to source (12 of 12 checked) |
| Reward formulas | Unchanged (`wordReward` test still 28 coins / 6 XP for CASH) |

The unresolved V3 composition audit (8 compliant, 19 requiring revision) is **out of scope and untouched**.

---

## 8. Recovery for players whose device clock was accidentally advanced

Verified by tests and a live check. **Nothing is erased, no balance is reduced, and there is no hidden reset.**

### 8.1 What happens
- **Claim made while the date was wrong:** the coins are kept (not clawed back) and the claim is recorded. Because the date jumped forward, the missed days restart the reward cycle, so that claim counts as Day 1.
- **After the player corrects the date:** claims pause with a visible message until the real date passes the day of the last recorded claim. The play streak is not reduced (it simply does not advance while paused).
- **Resume:** automatic. On the first real day after the recorded claim day the card becomes claimable again and continues at Day 2. Tested: 5 days ahead, corrected, resumed exactly on day 6.
- **App merely opened with a wrong clock (no claim, no play):** the game still records the launch time, so after the date is fixed, claims pause until real time passes that recorded time (10-minute tolerance). No claim data is created or changed.
- **Pause length** equals the size of the error (a clock 3 days ahead pauses about 3 days). An error of a year would pause for a year.

### 8.2 What the player sees (implemented in the app)
> "Your device date is earlier than your last claim. If it was set ahead by mistake, set Date & Time back to automatic. Your coins and reward history are safe, and rewards resume on their own once the real date catches up."

(The clock-rolled-back variant says the same for "recent activity".)

### 8.3 Guarantees locked in by tests
- A paused claim changes nothing and writes nothing.
- Over a 400-step random clock walk with forward and backward jumps, coins never decrease and claim history never shrinks.
- The engine has no method that resets, clears, or forgives claim state (asserted by name), so there is no hidden reset path.
- All XP in that walk came from achievement rewards only; claims never award XP.

### 8.4 Proposed support-page FAQ — **REQUIRES OWNER APPROVAL (not published)**
> **My daily reward says it is paused. Did I lose my coins?**
> No. Your coins and reward history are never removed. This happens when your device's date was set ahead by mistake. Set Date & Time back to automatic. Daily rewards resume on their own once the real date reaches the day of your last claim. Tip: if you notice the date is wrong, don't claim until it is fixed, so your reward cycle isn't restarted.

### 8.5 Options for long errors — **REQUIRES OWNER APPROVAL (none built)**
For a very large error (months or a year) the wait is long. Options: (a) accept it for V1, which fits your decision to accept the clock limitation and is my recommendation; (b) a visible, confirmed "fix my date" action that clears only future-dated timing evidence while keeping coins and history, which is transparent but also gives anyone a way to claim again; (c) a cap on how far ahead recorded evidence can be, which shortens the wait but weakens the rollback protection. Without a server there is no support-assisted reset.

---

## 9. Exact release blockers

| # | Blocker | Applies to | Type |
|---|---|---|---|
| **B1** | Xcode is not installed; no native build, Simulator, or device test has been done. Apple Developer Program enrollment is also still outstanding. | iOS | **REQUIRES OWNER ACTION** |
| **B2** | No real screen-reader test (VoiceOver on iPhone) and no WKWebView test (5.3, 4.2). | iOS, and web accessibility sign-off | **NOT TESTED** |
| **B3** | Deployment approval, and a decision on the bundled uncommitted work (item 2 below). | Web and iOS | **REQUIRES OWNER APPROVAL** |

Not blockers for a web deploy, but required for the App Store: updated screenshots and description showing the daily card (Guideline 2.3), a release candidate commit, the `gh` fix or an alternative for PRs, and updating the stale hardware statements in the docs.

### Decisions requiring your approval
1. **Approve deployment** (web first, iOS later), as a separate decision.
2. **The release unit is the whole working tree.** `learning-engine.js`, `word-game-app.js`, `app.js`, `index.html`, and `journey.css` contain the daily-reward code together with the Phase 1 repairs (which it depends on) and the earlier uncommitted V3 work (mastery floor, V3 slate loading, wheel interaction, and more). Shipping rewards alone would require carefully splitting those files. Shipping the tree also ships the V3 code, which stays dormant for players because V3 puzzles only load with the URL flag `?puzzles=v3`, but it is unreviewed release content with the 19-puzzle composition audit still open. Decide: ship it dormant, or split it out.
3. Recovery option (8.5) and whether to publish the support FAQ (8.4).
4. Install Xcode 26 and run the `xcode-select` command yourself (it needs your password), then confirm which Mac builds.
5. Apple Developer Program enrollment.
6. Schedule the VoiceOver test (5.3).
7. Raise the small secondary text in Phase 5, or accept it for V1.

---

## 10. Remaining risks

| # | Risk | Level |
|---|---|---|
| R1 | Forward-clock manipulation is possible (accepted by you); a cheater gets 10–50 coins per fabricated day. | Accepted |
| R2 | Direct editing of device storage is possible, as in any client-side game. | Accepted |
| R3 | Release unit includes dormant V3 code and unresolved composition audit (section 9, item 2). | Medium, needs decision |
| R4 | WKWebView, real-device, and Safari behavior unverified. | Medium |
| R5 | A long accidental clock error causes a long reward pause (section 8). | Low frequency, high annoyance |
| R6 | Possible chatty screen-reader announcement when the home screen opens, because the status line is filled on render. Needs the real VoiceOver test. | Low |
| R7 | Players who change time zones can wait up to 24 hours for a claim (kept by your decision). | Accepted |
| R8 | Stale cache: any further edit to HTML/CSS/JS requires re-running the stamp, build, and sync; the parity tests will fail until then (intentional). | Process |
| R9 | Docs claim a machine that no longer matches this one; plans based on them may be wrong. | Documentation |
| R10 | Phase 1 leftovers: no achievement toast outside the word game; legacy achievements deliberately not back-filled. | Low |

---

## 11. Scope status

| Item | Status |
|---|---|
| Phase 1 and Phase 2 behavior verified | **PASS** |
| iOS web-asset bundle synced, parity proven | **PASS** |
| Cache-bust regenerated by the established process | **PASS** |
| Keyboard, focus, labels, contrast, mobile layout, reduced motion | **PASS** (one defect found and fixed) |
| Real screen reader | **NOT TESTED** |
| Native build, Simulator, device, WKWebView | **NOT TESTED** |
| Synthetic existing-player saves | **PASS** |
| Governed content unchanged | **PASS** |
| Full suite 368/368, `git diff --check` | **PASS** |
| Clock-recovery documentation | **PASS** (behavior documented and tested) |
| Support FAQ publication, long-error recovery option, deployment, Xcode, enrollment, VoiceOver test | **REQUIRES OWNER APPROVAL / ACTION** |

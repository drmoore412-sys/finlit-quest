# FinLit Quest — Phase 2 Daily Login Rewards Report

**Date:** 2026-10-17
**Authorization:** Owner approved the seven-day coin schedule and the Phase 1 recommendations. Daily goal stays at five puzzles.
**State:** Implemented and tested **locally only**. **Nothing committed, pushed, merged, or deployed.** PR #4 and `docs/V1_RELEASE_CHECKLIST.md` were not modified. Existing uncommitted V3 work is preserved.
**Status labels:** IMPLEMENTED (code exists) · TESTED (automated and/or live check passed) · PLANNED (not built) · NOT AUTHORIZED (outside this phase, not touched).

---

## 1. Summary

| Item | Result |
|---|---|
| Approved schedule (10/15/20/25/30/35/50, repeating, missed day restarts at Day 1) | IMPLEMENTED, TESTED |
| Mobile daily reward card (current reward, seven-day schedule, Claim button) | IMPLEMENTED, TESTED (375×812 browser) |
| One claim per eligible local day; repeats, refreshes, restarts, two tabs | IMPLEMENTED, TESTED |
| Coins only: no XP, mastery, gems, or second currency | IMPLEMENTED, TESTED |
| Clock-manipulation safeguards | IMPLEMENTED, TESTED — **partial by nature; see section 6** |
| Daylight-saving and time-zone handling | IMPLEMENTED, TESTED |
| Keyboard and screen-reader accessibility | IMPLEMENTED, TESTED by DOM/ARIA inspection and keyboard-only claim; **not tested with a real screen reader** |
| Five-puzzle daily goal retained and verified | TESTED |
| Regression suite | **348 of 348 pass** (311 before + 37 new), in four machine time zones. `git diff --check` clean. |
| Existing saves and unknown fields | Preserved (TESTED) |

**Device-clock manipulation is not fully prevented.** This is a client-side game with no trusted time source. The safeguards close the practical rollback and time-zone-hop routes; they do not stop someone who moves the clock *forward* one day at a time. Details in section 6.

---

## 2. Implementation details

### 2.1 Reuse of the Phase 1 foundation — IMPLEMENTED
No new module and no new script tag. Everything extends `learning-engine.js`:
- `claimDailyLogin({coins})` (the Phase 1 primitive that requires the caller to supply an amount) is unchanged in contract and is what actually pays out.
- New `claimDailyReward()` looks up today's amount from the schedule and calls that primitive.
- New `dailyRewardStatus()` returns everything the UI needs, read-only (today's reward, cycle day, seven-day schedule with `claimed` / `current` / `upcoming` states, next reward).
- `DAILY_LOGIN_SCHEDULE = [10,15,20,25,30,35,50]` is exported and frozen.

### 2.2 Reward rules
- **Cycle position** comes from a consecutive-claim count: `cycleDay = ((streak − 1) mod 7) + 1`. Day 8 pays 10 again; Day 14 pays 50; Day 15 pays 10.
- **One claim per local calendar day.** A claim on the same local day is a no-op (`already-claimed`).
- **Missed eligible day:** if one or more full local days pass, the next claim is Day 1 (10 coins) and the UI says so ("Your reward cycle restarted at Day 1").
- **Coins only:** the claim writes `player.coins` and the claim record. It does not touch XP, level, streak, mastery, achievements, worlds, or settings (verified by deep-equality tests and a live check). No new player field is created.
- **Saved record** (additive, created on the first successful claim): `save.engagement.dailyClaim = {lastClaimDay, claimStreak, longestClaimStreak, history[≤60], lastClaimAtMs, lastClaimTimeZone}`. Unknown fields inside `engagement` and `dailyClaim` are preserved.

### 2.3 Interface — IMPLEMENTED
Placed at the top of the journey screen (`#worldSelectScreen`), above the Word Quests map, so it is the first thing a returning player sees.
- Heading "Daily reward", a one-line summary ("Day 5 of 7: 30 coins ready."), and a full-width **Claim N coins** button.
- Seven day tiles showing the day number and coin amount. State is shown in **words and a check mark**, not color alone ("✓ Claimed", "Today").
- A status line announces the result ("You claimed 10 coins for Day 1. Come back tomorrow for Day 2: 15 coins.") and explains paused states (clock behind, time zone changed).
- After a claim the header coin count updates immediately. No modal, popup, or animation was added.
- The card re-checks when the app returns to the foreground, so it does not show a stale day after local midnight.

**Files:** `index.html` (markup), `journey.css` (styles), `app.js` (render and tap handler).

### 2.4 Accessibility — IMPLEMENTED
- Landmark: `<div role="region" aria-labelledby="dailyRewardTitle">` with an `<h2>`. I used a `div` with `role="region"` rather than a `<section>` because the existing world-order test slices the page at the first `</section>`; the semantics are the same and that test is untouched.
- Real `<button type="button">` (keyboard-operable, announced as a button); `disabled` when unavailable.
- Schedule is an `<ol>` with a list label; each item has an `aria-label` such as "Day 3: 20 coins, claimed"; the current day carries `aria-current="step"`.
- Result messages use `role="status"` with `aria-live="polite"`. After a claim the disabled button would drop focus, so focus moves to the status line, which announces the result.
- Visible `:focus-visible` outline (3 px), 44 px minimum tap target (measured 329×44 on mobile), `prefers-reduced-motion` respected, 375 px layout stacks cleanly.

---

## 3. Time handling

| Case | Behavior | Tested |
|---|---|---|
| Day boundary | Local midnight. A 5 pm Pacific claim does not open the "next UTC day". Zones ahead of UTC (Auckland) use their own midnight. | Yes |
| Spring-forward 2026-03-08 and fall-back 2026-11-01 (Pacific) | Seven claims across spring-forward stay one unbroken cycle; across the 25-hour fall-back day, a late-night then after-midnight claim pays Day 1 then Day 2, and the repeated hour never opens a second claim. | Yes |
| DST alone | Not treated as a time-zone change (zone id is compared, not the UTC offset). | Yes |
| Real time-zone change within 24 h of the last claim | Cannot open a new claim (`recent-timezone-change`). | Yes |
| Eastward travel that skips a calendar date (within 36 h of the last claim) | Not a missed day; the cycle continues. | Yes |
| Real two-day absence in the same zone | Restarts the cycle at Day 1. | Yes |
| Westward travel (local date behind the last claim) | Claims pause until the date catches up; streak and coins preserved. | Yes |

Trade-off: a legitimate traveler who changes zones can wait up to 24 hours for the next reward. I chose that over leaving a zone-hopping exploit open.

---

## 4. Tests — TESTED

**New:** `tests/daily-login-rewards.test.js` (37 tests). **Edited:** one fixture timestamp in `tests/engagement-repairs.test.js` (see section 8, item 4).

| Required area | Coverage |
|---|---|
| All seven reward days | Exact amounts 10/15/20/25/30/35/50, total 185 over a week |
| Cycle rollover | Days 8, 14, 15 |
| Missed days | Restart at Day 1 verified after 1, 3, 6, and 7 claims; real two-day absence |
| Refreshes and restarts | Six repeated taps pay once; refresh at 11:59 pm; restart continues the cycle |
| Duplicate claims | Repeated taps, refresh, and two stale tabs sharing one save |
| Save migration | Pre-feature save gains only additive fields; Phase 1-style claim record read safely; corrupted claim data degrades to a fresh claim |
| Local date boundaries | Pacific and Auckland, midnight edges |
| Daylight saving | Both 2026 US transitions, plus "DST is not a zone change" |
| Time-zone changes | Cooldown, forgiveness, westward pause |
| Clock safeguards | Rollback after claim; rewind after later play; rewind before relaunch; rewind inside one session; NTP-sized correction allowed; far-forward jump restarts cycle; **known limitation test** (see 6) |
| Coins only | Deep-equal checks on XP, level, streak, achievements, mastery, worlds, settings; no new player keys; no gems |
| Daily goal | Source check that the goal is still `WG_DEFAULT_REQUIRED_PUZZLES = 5` and every world's `requiredPuzzles` is 5; daily progress counts completions once and a claim neither changes nor pays for it |
| Accessibility contract | Markup has region, labelled heading, real button, labelled list, polite status region; CSS has focus-visible, 44 px, reduced motion, and never removes the outline |
| Governance | A claim leaves crossword reward values unchanged (`wordReward` still 28 coins / 6 XP for CASH) |

**Results**

| Check | Result |
|---|---|
| Baseline before Phase 2 | 311 / 311 |
| Full suite after | **348 / 348** under `America/Los_Angeles`, `UTC`, `Asia/Tokyo`, `Pacific/Auckland` |
| `git diff --check` | clean (exit 0) |
| Mutation testing | I deliberately broke nine rules in a scratch copy of the engine (removed the rollback check, the time-zone cooldown, the two-tab guard, the travel forgiveness; changed Day 7; made claims grant XP; allowed same-day claims; stopped restarting the cycle; switched to UTC day keys). **All nine were caught** by at least one test. |

One regression was introduced and fixed during the work: my first markup used a `<section>`, which broke the existing "Choose Your World" order test (it slices the HTML at the first `</section>`). I changed my card to a `div role="region"` instead of editing that governance test.

---

## 5. Browser verification — TESTED

Local dev server, mobile viewport 375×812, **synthetic saves in the test origin only** (cleared afterwards). Zero console errors throughout.

- **Render:** card shows "Day 1 of 7: 10 coins ready.", "Claim 10 coins", seven tiles with Day 1 highlighted "Today".
- **Accessibility tree (DOM/ARIA):** region labelled by its heading; button type `button`, 329×44 px; list label "Seven-day coin reward schedule"; item labels like "Day 1: 10 coins, today" with `aria-current="step"`; status region `role="status"`, `aria-live="polite"`; tab order is theme toggle → Word Quests → Learning Quests → Claim → status.
- **Keyboard only:** focus moved to the Claim button with a visible 3 px outline; pressing Enter claimed. Coins 300 → 310; XP 240, level 1, streak 2, achievements, and unknown fields unchanged; no gems field; focus moved to the status line which read "You claimed 10 coins for Day 1. Come back tomorrow for Day 2: 15 coins." Button became "Claimed today" (disabled).
- **Repeated taps:** six more taps left coins at 310 and showed "Already claimed today…".
- **Refresh:** after reload the card still showed "Day 1 of 7 claimed." and the header showed 310.
- **Full cycle (page clock advanced a day at a time):** paid 15, 20, 25, 30, 35, 50, then restarted the cycle at 10, then 15.
- **Missed day:** skipping a day showed Day 1 / 10 coins and "Your reward cycle restarted at Day 1."; claiming paid 10.
- **Clock rewound:** card showed "Unavailable" with "Your device date is earlier than your last claim. Rewards resume once the date catches up."; XP stayed 240, level 1, gems absent.
- **Daily goal:** the widget showed `0 / 5`, then `1 / 5` (one of five dots filled) after a real puzzle completion through the game's own completion code. The existing reward formula paid as before (28 coins, 6 XP). Replaying the same puzzle paid 0 and left progress at `1 / 5`. The daily claim record was untouched by puzzle play.

**Caveats:** screenshots caught the screen's fade-in frame (pale), so I verified state through the DOM and ARIA attributes. The claimed/current/upcoming states are text-labelled, not color-only (a mid-cycle capture showed "✓ Claimed" on Days 1-4 and "Today" on Day 5). I did **not** test with VoiceOver, TalkBack, or NVDA, or on a physical device.

---

## 6. Device-clock manipulation: what is and is not prevented

Plainly: **this is not secure against a determined player.** All saves live in the player's own storage, and a player can edit `localStorage` directly, which no safeguard here can stop. The goal was the strongest *practical* local protection against clock changes and time-zone abuse.

### Safeguards implemented (TESTED)

1. **No claim on or before the last claimed day.** Rolling the date back to claim again is refused.
2. **Clock evidence ("rollback") check.** A claim is refused if the clock is more than 10 minutes earlier than evidence the game itself recorded: the previous session's last save time, the last play time, the last claim time, any completed-puzzle timestamp, and any time already observed during the current session. This blocks "play for days, then rewind to keep a streak" and a rewind made before relaunching the app. Small corrections (a few minutes, as from time sync) are allowed.
3. **Time-zone cooldown.** A real zone change cannot open a new claim sooner than 24 hours after the last one. An ordinary DST change does not trigger it.
4. **Forward-jump handling.** A big forward jump does not bank rewards: missing days restart the cycle at Day 1, and only one claim is possible for that fabricated day.
5. **Two-tab guard.** Before claiming, a claim already saved by another tab or window is adopted, so two stale copies cannot both pay.
6. **No write on status reads.** Looking at the card never changes the save.

### Remaining limitations (NOT prevented)
- **Advancing the clock forward one day at a time, then claiming, still pays one claim per fabricated day** (the engine cannot tell it from a normal day). A test documents this rather than hiding it. Without a trusted time source (a server, signed time, or platform attestation) this cannot be closed locally. Impact is bounded: coins only, 10–50 per claim, no XP, no cash value, but coins buy hints (100 / 300), so a cheater can accelerate hint purchases.
- **Direct save editing** is possible on any client-side game.
- **Rewinding then relaunching *after* a forward jump** cannot be told apart from a legitimate absence if no evidence was recorded at the later time.
- **False positives:** a device clock accidentally set far into the future and later corrected will pause claims until the real date catches up (the recorded "future" activity does not expire), because the game has recorded activity "from the future." A time-zone traveler may wait up to 24 hours for the next reward.
- **Hook for a future fix:** the engine reads time only through its injected `now()`, so a trusted time source could be substituted later without redesign. Not built.

---

## 7. Save compatibility — TESTED

- Method: synthetic saves only. No real player save was read or changed.
- **New field:** `save.engagement.dailyClaim`, created only on the first successful claim. Nothing else was added to `player`, `worlds`, `termProgress`, or `settings`.
- Verified preserved by deep-equality: coins (changed only by the claim itself), XP, level, streak, achievements, mastery (`termProgress`), V1/V3 puzzle histories and completed puzzles, all five worlds, settings, and unknown fields at top level, player, world, `engagement`, `dailyClaim`, and settings.
- Phase 1 claim records (which lack the two new fields) load and continue correctly; corrupted claim data degrades to a fresh claim instead of throwing.
- No reward formula, crossword reward, vocabulary, Credit identity, or puzzle was changed. The V3 slate still reports 27 specs.

---

## 8. Files changed

| File | Change |
|---|---|
| `learning-engine.js` | Schedule, claim status/claim, clock safeguards, time-zone handling, two-tab guard (92 changed lines vs the pre-Phase-2 copy) |
| `app.js` | Card rendering, claim handler, foreground refresh, messages (43 lines) |
| `index.html` | Daily reward card markup (12 lines) |
| `journey.css` | Card styles (22 lines) |
| `tests/daily-login-rewards.test.js` | **New**, 37 tests |
| `tests/engagement-repairs.test.js` | One fixture timestamp corrected (item 4 below) |
| `FINLIT_QUEST_PHASE2_DAILY_REWARDS_REPORT.md` | **New** (this report) |

Verified by timestamp scan: only the files above changed during Phase 2. `word-game-app.js` was not modified. Frozen vocabulary, Credit IDs, puzzles, reward formulas, `src/`, `content/`, the iOS bundle mirrors, and `docs/` were not touched.

Notes:
1. `index.html`, `app.js`, and `learning-engine.js` already carried uncommitted V3 and Phase 1 changes; I edited on top of them. `journey.css` was clean before this phase.
2. I started and stopped the project's local dev server and cleared the synthetic browser data.
3. `gh` cannot run in this shell, and I did not touch PR #4 in any case.
4. A Phase 1 test (`streak, achievements, daily progress, and claims survive a page refresh`) used a puzzle timestamp one hour *after* the test's clock, which the new rollback check correctly flagged. The fixture was unrealistic, so I moved the timestamp earlier; the safeguard was not weakened.

---

## 9. Remaining issues

1. Clock-forward manipulation is not preventable locally (section 6).
2. **iOS/`www` bundle not synced.** The native copies do not contain Phase 1 or Phase 2. `ios/App/App/public/learning-engine.js` was already out of step because of earlier V3 work.
3. **Cache-busting stamps** (`?v=`) must be regenerated on release (`scripts/stamp-cache-bust.mjs`), or browsers may serve stale files.
4. **Not tested on a real device or with a real screen reader** (VoiceOver, TalkBack, NVDA).
5. The accessibility pass for the rest of the app (checklist Phase 5) is a separate, unfinished item.
6. The daily card sits on the journey screen only; it is not shown inside the puzzle screens.
7. Phase 1 leftovers still open: no achievement toast for workbook/review flows, and legacy achievements are intentionally not back-filled.
8. Out of scope and unchanged: the V3 composition audit (8 compliant, 19 requiring revision), the gems display (still shows 0), and the unrelated checklist change in the working tree.

---

## 10. Release-readiness status

**Ready for owner review; not ready to release.**

| Gate | Status |
|---|---|
| Behavior matches the approved schedule and rules | Done, tested |
| Regression suite and `git diff --check` | Pass (348 / 348, four time zones) |
| Browser verification (mobile, keyboard, refresh, cycle, clock) | Done, synthetic saves |
| Real-device and screen-reader testing | **Not done** |
| iOS bundle sync and cache-bust stamping | **Not done** |
| V1 feature freeze | The owner authorized Phases 1–2 as an exception; shipping them still needs a separate release approval |
| App Store materials | The new card is visible on a primary screen, so the screenshots and description for Guideline 2.3 (checklist Phases 3 and 7) must be refreshed. No new data collection, permissions, network use, or purchases, so the Privacy Policy and Terms statements remain accurate (coins remain earn-only, no cash value). |
| Production deployment | **NOT AUTHORIZED** |

---

## 11. Decisions requiring owner approval

1. Approve moving from local to a release candidate (sync iOS, stamp cache, deploy), or hold.
2. Accept the documented forward-clock limitation, or fund a trusted-time approach later (for example a lightweight server time check). That would be a separate, owner-approved infrastructure decision.
3. Accept the 24-hour time-zone cooldown, or choose a different value.
4. Choose a recovery policy if a player's clock was accidentally set far ahead (currently claims pause until the real date catches up).
5. Whether to also show the daily card or a small badge on the puzzle screen.
6. Whether to schedule a real-device and screen-reader pass before release.

---

## Scope status

| Item | Status |
|---|---|
| Seven-day coin schedule and cycle | IMPLEMENTED, TESTED |
| Daily reward card (mobile, keyboard, ARIA) | IMPLEMENTED, TESTED |
| One-claim-per-day, duplicate prevention, persistence | IMPLEMENTED, TESTED |
| DST and time-zone safeguards | IMPLEMENTED, TESTED |
| Clock-rollback safeguards | IMPLEMENTED, TESTED |
| Prevention of forward-clock abuse | NOT POSSIBLE locally; documented |
| Trusted time source | PLANNED (owner decision) |
| iOS sync, cache-bust, real-device and screen-reader tests | PLANNED |
| Release, deploy, commit, push, merge, PR #4 changes | NOT AUTHORIZED |
| Collectibles, timed activities, gems, partnerships | NOT AUTHORIZED |
| Governed content, Credit IDs, V3 puzzles, reward formulas | NOT AUTHORIZED (untouched) |

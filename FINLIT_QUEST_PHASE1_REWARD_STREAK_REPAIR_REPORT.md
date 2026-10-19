# FinLit Quest — Phase 1 Reward & Streak Repair Report

**Date:** 2026-10-17
**Scope:** Owner-authorized limited exception to the V1 feature freeze. This is **not** approval of the full engagement expansion.
**State:** Local development only. **Nothing committed, pushed, merged, or deployed.** PR #4 and `docs/V1_RELEASE_CHECKLIST.md` were not modified by this task.
**Status labels used below:** IMPLEMENTED (code exists) · TESTED (automated test and/or live check passed) · PLANNED (designed, not built) · NOT AUTHORIZED (outside this phase, not touched).

---

## Summary

| Area | Result |
|---|---|
| Achievement XP | Defect confirmed and fixed. XP is granted exactly once; displayed reward now comes from the same record as the award. |
| Daily progress widget | Defect confirmed and fixed. It now counts puzzles completed today, against a goal of 5. |
| Daily streak (UTC midnight) | Defect confirmed and fixed. Streaks now follow the player's local calendar day. |
| Daily login claim foundation | Built and tested, **not wired to any UI and not activated**. Coins only, no XP, no amounts chosen. |
| Tests | 311 of 311 pass (284 existing + 27 new), in four machine time zones. `git diff --check` clean. |
| Existing saves | Preserved. New save fields are additive and appear only on first use. |

---

## A. Defects confirmed

Confirmed by running the **original** `learning-engine.js` (backed up before editing) under `TZ=America/Los_Angeles`, plus code reading where noted.

1. **Achievement XP is never granted.** CONFIRMED by probe: after `unlockAchievements()` the achievement ID is added but XP stays `0 → 0`, while the dashboard displays "+25 XP" / "+50 XP".
2. **Achievements are not unlocked by ordinary gameplay** (found while investigating; not in the original list). CONFIRMED by probe: `recordChallenge(correct)` leaves `achievements: []`, and a streak of 3 reached through `touchActivity()` leaves `achievements: []`. Unlocking only happened as a side effect of a later spaced-repetition review or a workbook attempt.
3. **Daily-progress widget cannot progress.** CONFIRMED by code reading: `todayCount` was `0` or `1` (it only asked "was there any activity today?") against a hard-coded `dailyGoal = 4`, so the maximum possible display was `1 / 4`. It was also not refreshed when a puzzle completed, because the completion block never called `wgUpdateHeader()`.
4. **Streak day boundary was UTC midnight.** CONFIRMED by probe:
   - Two plays on two different Pacific days (Sat 6 pm, Sun 9 am) were stored as one key `["2026-10-18"]` and produced **streak 1**.
   - A 9 pm Pacific play on Oct 17 was recorded as `2026-10-18`.
5. **Display inconsistencies** (CONFIRMED by code reading): the badge counter was hard-coded `/ 2`; the achievement reward badge showed advertised XP regardless of whether any XP had been awarded.
6. **Unnecessary mutation** (CONFIRMED by code reading): `touchActivity()` rewrote `lastPlayed`, re-sliced `activityDates`, and recomputed the streak on every call, including repeated activity on an already-counted day.

---

## B. Root causes

| Defect | Root cause (original location) |
|---|---|
| 1 | `unlockAchievements()` (`learning-engine.js:125`) only `push`ed the ID. No XP logic existed anywhere. The reward copy lived separately in `app.js:90/101` as literal strings, so award and display could drift. |
| 2 | `unlockAchievements()` was called only from `review()` and `recordWorkbookAttempt()`. `touchActivity()` (where the streak changes) and `recordChallenge()` (where `first_application` becomes true) never called it. |
| 3 | `word-game-app.js:608-609`: a boolean "any activity today" mapped to 0/1, and an arbitrary goal of 4 that corresponds to no gameplay unit. Completion block (`:514-520`) did not refresh the header. |
| 4 | `dateKey()` (`learning-engine.js:63`) used `toISOString().slice(0,10)` (UTC). `calculateStreak()` mixed a local-midnight cursor with that UTC key, and the header used another `toISOString()` check. `app.js` parsed the keys as local dates, so the code base disagreed with itself about what a "day" is. |
| 6 | `touchActivity()` (`:98`) had no "already counted today" short-circuit. |

---

## C. Files modified

| File | Change |
|---|---|
| `learning-engine.js` | Local-day helpers, new `touchActivity()`, achievement definitions and granting, daily puzzle progress, daily-claim foundation, load-time guards (142 changed lines vs the pre-task copy). |
| `word-game-app.js` | Header daily widget now uses real progress; header refreshes after a puzzle completes; achievement toast (12 changed lines). |
| `app.js` | Dashboard achievement copy and badge counter now read from the engine (8 changed lines). |
| `tests/engagement-repairs.test.js` | **New.** 27 tests. |
| `FINLIT_QUEST_PHASE1_REWARD_STREAK_REPAIR_REPORT.md` | **New.** This report. |

**Verified by timestamp scan:** these were the only files changed during the task. Not modified: `index.html`, any content file, vocabulary, definitions, `src/v3-puzzle-slate.js`, `content/credit-term-identities.js`, `src/puzzle-bank-engine.js`, any reward formula, `.json` governance data, the iOS bundle mirrors, `docs/`.

Note: `learning-engine.js` and `word-game-app.js` already contained uncommitted V3 changes from earlier work. I edited on top of them and preserved them. I saved a pre-task copy of each file to compare against, so the line counts above are my changes only.

---

## D. Corrections implemented — IMPLEMENTED

### D1. Local calendar-day streaks
- `localDayKey(date)` builds `YYYY-MM-DD` from the player's local date parts. Day arithmetic uses a calendar index (`dayNumber`), which is immune to 23-hour and 25-hour daylight-saving days.
- `touchActivity()` now works like this:
  - **Same local day as the last counted activity:** returns without changing anything (no mutation, `lastPlayed` unchanged).
  - **Next local day:** `streak = stored streak + 1` (never recomputed downward from date keys).
  - **Gap of 2+ local days:** streak restarts at 1.
  - **"Today" earlier than the last counted day** (clock or time-zone moved backward): treated as the same day; nothing added or removed.
- The "last counted day" comes from `lastPlayed`, which is a full timestamp. That converts correctly to a local day even for saves written under the old UTC keys. If `lastPlayed` is missing, it falls back to the newest recorded date.
- Old `activityDates` entries are left exactly as written. They are never rewritten or removed.
- `calculateStreak()` (still exported) now uses local days.

### D2. Achievement rewards
- `ACHIEVEMENTS` is now the single definition for both award and display: `first_application` = 25 XP, `three_day_streak` = 50 XP (the amounts the UI already advertised).
- `unlockAchievements()` grants each newly earned achievement and its XP once, records the claim in `player.achievementRewards[id] = {xp, claimedAt}`, recomputes level, and returns what was granted. A second payout is blocked even if the `achievements` array were lost, because the claim record is checked too.
- It is now called from `touchActivity()` and `recordChallenge()` as well, so achievements unlock when earned, not on a later review.
- `achievementStatus(id)` reports the XP as awarded **only if a claim was recorded**. The dashboard uses it, so the displayed reward equals the actual award.
- A one-line toast ("On a Roll unlocked: +50 XP") appears when the word game grants one.

### D3. Daily progress
- **What the four units meant:** nothing. `4` was a placeholder with no corresponding gameplay unit, and the widget could only ever show 0 or 1.
- **Actual gameplay unit:** every world draws a playthrough of **5 puzzles** (`requiredPuzzles: 5` in all five worlds). The widget now shows **puzzles completed today / 5**. No activities were invented.
- Progress is **derived** from the per-world `puzzleHistory.lastPlayedAt` that the game already records when a puzzle is completed. It needs no new save field, survives refresh, rolls over at local midnight by construction, and counts each puzzle ID once per day (replays do not double-count; the same ID in two different worlds counts as two).
- The header is refreshed right after a puzzle completes.

### D4. Daily login claim foundation (not activated)
- `dailyClaimStatus()` — read-only, never writes.
- `claimDailyLogin({coins})`:
  - One claim per local calendar day; repeated taps and refreshes are no-ops.
  - **Coins only.** XP, level, streak, and achievements are never touched.
  - The caller must supply the coin amount. There is **no default amount**; missing, negative, fractional, or non-numeric amounts throw.
  - Stores `save.engagement.dailyClaim = {lastClaimDay, claimStreak, longestClaimStreak, history[≤60]}`, created only on the first successful claim.
  - `status.nextStreak` is exposed so a future streak bonus can be computed by the caller.
  - Refuses a claim if the clock is behind the last claim day.
- Uses the existing `player.coins`. No second economy.

### D5. Hardening
`normalizeSave` now repairs a non-array `activityDates` / `achievements` and a non-object `achievementRewards` instead of throwing later. Valid data is untouched.

---

## E. Before-and-after behavior

Same probe script, same synthetic inputs, `TZ=America/Los_Angeles`:

| Scenario | Before | After |
|---|---|---|
| Plays Sat 6 pm and Sun 9 am Pacific | keys `["2026-10-18"]`, **streak 1** | keys `["2026-10-17","2026-10-18"]`, **streak 2** |
| One play at 9 pm Pacific, Oct 17 | recorded as `2026-10-18` | recorded as `2026-10-17` |
| 3-day streak reached through gameplay | achievement unlocked only via a later review; **XP 0 → 0** | unlocked immediately; **XP 0 → 50** |
| `recordChallenge(correct)` | `achievements: []` | `["first_application"]`, +25 XP |
| Daily widget | max `1 / 4`, not refreshed on completion | `n / 5` puzzles completed today, refreshed on completion |
| Dashboard reward badge | "+25/+50 XP" shown even when nothing was paid | shown only when a claim is recorded |

**Live check in the browser** (local dev server, synthetic saves in the test origin only, zero console errors):
- Seeded 2 puzzles completed today and 1 yesterday → widget showed `2 / 5` with 2 filled dots.
- Completed a puzzle through the game's own completion code → widget advanced to `3 / 5`; streak 2 → 3.
- A **legacy** save already holding `three_day_streak` → no XP paid (XP rose only by the word's own +6), no claim recorded.
- A fresh save reaching streak 3 → toast "On a Roll unlocked: +50 XP", XP `100 → 156` (+6 word, +50 achievement), one claim recorded, no second payout after finishing the puzzle.
- After a page refresh: XP 156, streak 3, claim intact, widget `1 / 5` (new save), dashboard showed "On a Roll", "+50 XP", "1 / 2" badges.

---

## F. Save-data protection results — TESTED

Method: synthetic saves only. No real player save was read, written, or reset. Browser checks used the local test origin.

| Protected item | Result |
|---|---|
| Coins, XP, level | Unchanged by load, touch, unlock, status reads, daily-progress reads. XP never decreases. A daily claim changes coins only. |
| Existing streaks | Never reduced. A stored streak of 5 on an old UTC-keyed save becomes 6 on the next local day. A real 2-day gap resets to 1 (true miss, not a key artifact). |
| Achievements | Existing ones kept; **not back-filled** (see H1). |
| Financial mastery (`termProgress`) | Deep-equal before and after. |
| V1/V3 puzzle histories, completed puzzles | Deep-equal before and after (legacy IDs, `FQ-V3:` IDs, 1970-era timestamps). |
| All five worlds | `worlds` deep-equal; unknown world keys preserved. |
| Settings | Deep-equal. |
| Unknown fields | Top-level, player-level, world-level, `engagement`, `dailyClaim`, and settings unknown keys all survive touch, unlock, claim, and reload. |
| Corrupted fields | Tolerated without throwing. |

**New save fields (all additive, created lazily):** `player.achievementRewards` (on first achievement grant) and `save.engagement.dailyClaim` (on first claim — nothing calls it yet, so no save contains it).

---

## G. Test results — TESTED

| Check | Result |
|---|---|
| Baseline before changes | 284 / 284 pass |
| Full suite after changes | **311 / 311 pass** (284 + 27 new) |
| Full suite under `America/Los_Angeles`, `UTC`, `Asia/Tokyo`, `Pacific/Auckland` | 311 / 311 in each |
| New tests run against the pre-repair engine | 27 / 27 fail (so they genuinely detect the old defects; some fail simply because the new functions did not exist) |
| `git diff --check` (whole tree) | clean |
| Runtime time-zone switching used by the tests | Verified (Pacific offset 420 min, Auckland −780 min) |

New tests by required area: achievement XP (3 tests), once-only grants, preserved balances, daily counting, duplicate prevention, local-midnight boundaries (Pacific and Auckland), consecutive days, missed days, clock-backward safety, daylight saving (spring-forward 2026-03-08 and fall-back 2026-11-01, Pacific), refresh persistence, claim idempotency (repeated taps, refresh, next day, missed day, clock behind), no XP from claims, no invented coin amounts, V1/V3 compatibility, unknown-field preservation, corrupted-field tolerance.

**Not run:** iOS build or Simulator, real device, production, any test that reads a real player save.

---

## H. Remaining issues

1. **Legacy achievements cannot be audited.** Existing saves list achievement IDs but nothing records whether XP was paid. From the code that wrote them, it was **not** paid. Because the data cannot prove it, nothing is back-filled. Players holding an old badge see no "+XP" on the dashboard (truthful). **Recommended safe policy:** leave legacy badges as they are. If the owner wants to compensate them, do it as an explicit one-time, owner-approved claim that writes a claim record (so it can never repeat), not as automatic back-filling.
2. **A player who currently has a streak of 3+ but no badge will earn it on their next activity (+50 XP).** That is a legitimately earned, not-yet-recorded achievement, not a back-fill, but it is a visible one-time change for those players.
3. **Daily goal changed from 4 to 5.** I grounded it in the real playthrough size. This is a display target only; no reward depends on it.
4. **Existing per-world behavior:** `wgEnsureBank()` clears a static world's `puzzleHistory` when its governed bank changes. That pre-existing behavior would also reset that world's contribution to "today's" count. Not changed.
5. **`lastPlayed` meaning changed slightly:** it now marks the first qualifying activity of the most recent day instead of the most recent instant.
6. **Time-zone travel:** the day gap is evaluated in the device's current time zone. Moving west can make "today" look earlier (treated as the same day, nothing lost). Flying east across the date line can skip a calendar day and restart a streak. No grace day exists.
7. **Device-clock manipulation** can still advance a streak or a future daily claim (client-only game, no server). A claim made with a far-future clock blocks further claims until the real date catches up ("clock-behind-last-claim").
8. **No toast for achievements earned in workbook/review flows** (XP and header still update). Only the word game shows the toast.
9. **iOS bundle not synced.** `ios/App/App/public/` and `www/` do not yet contain these changes (`ios/App/App/public/learning-engine.js` is also already out of step with the source because of the earlier V3 work). Sync is a separate step.
10. **Unresolved, out of scope:** the V3 composition audit (8 compliant, 19 needing revision), gems display (still shows 0), and the checklist's pre-existing uncommitted working-tree change from an earlier request (untouched here).

---

## I. Readiness for daily login reward implementation

**Ready:** local-day key, correct streak semantics, idempotent coins-only claim with persistent history, additive storage, test coverage including DST and time zones, no dependency on puzzle or vocabulary content.

**Not yet decided or built (needed before activation):**
- Coin amounts and any streak-bonus schedule (deliberately not chosen).
- Whether the claim streak stays separate from the play streak (current foundation: separate).
- Policy for missed days (reset, grace day, or keep a floor) and for time-zone travel.
- Clock policy: how large a forward jump to accept.
- The UI (a card, claimed/unclaimed states, accessibility labels). Not authorized in this phase.
- iOS bundle sync and a live pass on a seeded legacy save.

Readiness verdict: **the engine side is ready; activation requires the owner decisions in section J.**

---

## J. Decisions requiring owner approval

1. Confirm the daily goal of **5 puzzles** (or choose another target).
2. Legacy achievements: leave as-is (recommended) or approve a one-time owner-authorized claim.
3. Confirm that players who already have a 3+ day streak but no badge should receive it (+50 XP) on their next activity.
4. Daily login: coin amounts, streak-bonus schedule, and caps.
5. Daily login: separate claim streak (current) versus tying it to the play streak.
6. Missed-day and time-zone-travel policy (grace day or none).
7. Clock-forward tolerance for claims.
8. Whether to add an achievement toast to workbook/review flows.
9. When to sync the iOS bundle, and whether these repairs ship in the next release or wait.

---

## Scope status

| Item | Status |
|---|---|
| Achievement XP granted once, displayed accurately | IMPLEMENTED, TESTED |
| Daily progress = puzzles completed today / 5 | IMPLEMENTED, TESTED |
| Local-calendar-day streaks, DST-safe | IMPLEMENTED, TESTED |
| Daily login claim foundation (coins only) | IMPLEMENTED, TESTED (engine only; not wired) |
| Daily login UI, amounts, streak bonus | PLANNED |
| Legacy achievement compensation | PLANNED (owner decision) |
| iOS bundle sync | PLANNED |
| Activation of daily login rewards | NOT AUTHORIZED |
| Collectibles, timed activities, gems, partnerships | NOT AUTHORIZED |
| V3 puzzles, vocabulary, definitions, Credit registry, reward formulas, composition audit | NOT AUTHORIZED (untouched) |
| Commit, push, merge, deploy, PR #4 | NOT AUTHORIZED (not done) |

# FinLit Quest — Engagement Expansion Plan

**Status:** READ-ONLY AUDIT, awaiting owner approval. Nothing in this document has been implemented.
**Audit date:** 2026-10-16
**Scope of audit:** `learning-engine.js`, `word-game-app.js`, `app.js`, `src/puzzle-bank-engine.js`, `src/v3-puzzle-slate.js`, `content/credit-term-identities.js`, CSS, `index.html`, tests, `docs/V1_RELEASE_CHECKLIST.md`.
**Not touched:** application code, saved progress, puzzle content, vocabulary, reward formulas. Nothing committed, pushed, merged, or deployed. This file is a new untracked file.

**Evidence labels used below:** *Verified* = read in the code or ran a read-only command. *Inferred* = follows from the code but was not reproduced live. *Not found* = searched and absent; may exist outside this repository.

---

## 0. Things the owner should know before reading the plan

1. **Priority conflict with the V1.0 freeze.** On 2026-07-25 the owner froze V1.0 scope to bug fixes, accessibility, compliance, and submission work (`docs/V1_RELEASE_CHECKLIST.md`, Blocker 13). Every feature in this plan is new functionality. This plan therefore targets the release *after* the freeze lifts, or a decision to explicitly amend the freeze. Section 5 separates "safe before V3" from "defer".
2. **The working tree contains substantial uncommitted V3 work** (about 17 modified files and 15 untracked files, including `src/v3-puzzle-slate.js`, `content/credit-term-identities.js`, `src/wheel-interaction.js`, and seven new test files). The current branch is `docs/update-v1-checklist-scope`, not a V3 branch. All 284 tests pass in this working tree (*verified*). I did not modify any of it. The V3 puzzles currently load only with the URL flag `?puzzles=v3` (`WG_V3_PREVIEW_ENABLED`, `word-game-app.js:62`), so they are not what production players see.
3. **I could not find the "financial-majority composition" or "cross-world financial recognition" requirements in this repository** (searched tests, `src/`, `docs/`, `PROJECT_LOG.md`). They may live in governance documents outside the repo. As a read-only sanity check I counted financial answers in the 27 V3 specs: under a simple ">50% of answers are financial" reading, only 8 of 27 specs qualify (e.g. TOKEN is 1 financial of 3). I am **not** asserting a violation, because I do not have the requirement text and the slate may predate the update. Please confirm whether the slate in the working tree is the updated one. This plan does not depend on the answer, because no engagement feature touches puzzle composition.
4. **Existing UI shows rewards that are never granted** (details in 1.3). These need to be made truthful before any new reward is layered on top.

---

## 1. Phase 1 — Existing systems inventory

### 1.1 Implemented versus missing

| Capability | State | Evidence |
|---|---|---|
| Coins | **Implemented.** Earn-only, start at 300 (`DEFAULT_ECONOMY_CONFIG`), spent only on hints (100) and full reveal (300) via `learning.spendCoins()`. | `learning-engine.js:10-12, 97`; `word-game-app.js:54-59` |
| XP and levels | **Implemented.** 250 XP per level, single source `levelForXp()`. | `learning-engine.js:27-29` |
| Word reward formula | **Implemented.** Financial words: 7 coins and 1.5 XP per letter, first solve only. Ordinary words: 1 coin once. Bonus: 0. V3 policy mirrors this. | `src/puzzle-bank-engine.js:267-288`; `src/v3-puzzle-slate.js:65` |
| Duplicate-reward protection | **Implemented** for word rewards: permanent per-world `solvedWords`, `rewardedFinancialTermIds`, ordinary and support lists. | `word-game-app.js:93, 500-506` |
| Streak tracking | **Implemented, with a day-boundary weakness** (see 1.3). Stored as `player.activityDates` (last 400 days) and `player.streak`. | `learning-engine.js:63-68, 98` |
| Weekly goal | **Partial.** `player.weeklyGoal = 5` learning days; displayed on the Credit dashboard only. | `app.js:90, 99` |
| Daily progress dots | **Stub** (see 1.3). | `word-game-app.js:608-615` |
| Achievements | **Minimal.** Two IDs: `first_application`, `three_day_streak`. | `learning-engine.js:125`; `app.js:90, 101` |
| Gems | **Display only.** Shown in two headers; no code earns or spends them; not in `playerDefaults()`. | `word-game-app.js:602`; `app.js:43, 94` |
| Spaced-repetition review and due dates | **Implemented** (`review()`, `due()`), but the live word game does not surface it. | `learning-engine.js:105-126` |
| Mastery | **Implemented.** Migration-safe: mastery can only ratchet up. | `learning-engine.js:113-124` |
| Daily missions or challenges | **Not found.** | grep for daily/mission logic returned only the stub above |
| Inventory or collectibles | **Not found.** | no field, no UI, no content |
| Timers, cooldowns, timed activities | **Not found.** `setTimeout` is used only for animation and toast timing. | grep across runtime JS |
| Reward claim ledger | **Not found.** Rewards are granted inline at the moment of the event, with no record of "claimed on date X". | `word-game-app.js:493-515` |
| Push or local notifications | **Not found.** Would need a Capacitor plugin (new dependency). | `package.json` |
| Save persistence | **Implemented.** `localStorage` key `finlitQuest.save`, `saveVersion: 3`, one JSON blob. | `learning-engine.js:3, 89` |
| Mobile compatibility | **Largely in place.** 44px minimum on bottom-nav buttons, `prefers-reduced-motion` handled in `word-game.css` and `journey.css`, 480px-capped layout, Capacitor iOS bundle synced. Accessibility pass (checklist Phase 5) is not done. | `word-game.css:103-104, 185`; `journey.css:23` |
| External services | **None, by design.** The privacy policy states no backend, no accounts, no third-party SDKs. | `privacy.html`; checklist Phase 4 |

### 1.2 What the save format tolerates

*Verified:* `normalizeSave()` builds `{...createSave(), ...raw, ...}`, so **unknown top-level keys in an existing save survive a load**, and new keys default in cleanly. Counters (`xp`, `coins`, `streak`) are sanitized (finite, non-negative). There is no branching migration logic; the existing log already notes that additive changes are safe but renames or restructures are not. This is the foundation for a zero-risk additive design in Section 2.

### 1.3 Findings that affect engagement design

1. **Streak day boundary is UTC, not the player's calendar day.** `touchActivity()` records `dateKey(now)`, which is `toISOString().slice(0,10)` (UTC). `calculateStreak()` walks back from *local* midnight but converts each step with the same UTC `dateKey`. The word-game header does its own `toISOString()` check (`word-game-app.js:608`). *Inferred from code reading, not reproduced live:* a player in the US Eastern time zone would see "today" roll over around 7-8 pm local, and players east of UTC could see inconsistent streak counts. A "daily" reward built on these keys would reset at the wrong time. This should be fixed (with tests) before any daily mechanic ships.
2. **Achievement rewards are advertised but not granted.** `app.js` shows "+25 XP" and "+50 XP" copy for the two achievements, but `unlockAchievements()` only pushes the ID into the array; no XP or coins are added (*verified*). The badge counter is hard-coded as "/ 2".
3. **The daily-goal widget cannot progress.** `dailyGoal = 4` but `todayCount` is `0` or `1` depending only on whether any activity happened today, so the widget can never exceed 1 / 4.
4. **Gems are visible but nonexistent.** Showing "GEMS 0" with no way to earn them invites a "where do I get these?" question and an App Review question. Do not wire gems into engagement rewards without a decision on what they are.
5. **All time comes from the device clock.** Anything keyed to "today" can be farmed by changing the device date. Acceptable for a no-account, no-cash-value economy if the mitigations in 3.1 are used.

---

## 2. Phase 2 — Reuse opportunities and recommended architecture

**Principle:** one new pure module, one new additive save namespace, zero new services, zero recurring cost.

### 2.1 Architecture

- **`src/engagement-engine.js` (new, UMD like `puzzle-bank-engine.js`).** Pure functions with an injected clock: `localDayKey(date)`, `evaluateDailyLogin(state, now)`, `claimDailyReward(state, now)`, `evaluateChallenge(state, now)`, `unlockCollectible(state, rule)`, and so on. Unit-testable in Node with no DOM, matching the project's existing test pattern (`tests/puzzle-bank-engine.test.js`).
- **`save.engagement` (new top-level key, additive).** One namespace, versioned, so it can be validated and migrated independently of the rest of the save. Existing fields (`player`, `termProgress`, `worlds`, `settings`) are never reshaped.
- **Granting rewards:** reuse `learning.save.player.coins += n; learning.persist()` through one helper (the same pattern `wgFoundWord` uses), never by changing `wordReward`, `answerReward`, hint costs, or `XP_PER_LEVEL`.
- **Day key:** add a single `localDayKey()` helper and use it for all *new* daily logic first. Migrating the existing streak to local days is a separate, test-covered change (1.3 item 1) that must not rewrite history (see 2.3).
- **UI reuse:**
  - Journey map screen (`#worldSelectScreen`): the existing `journey-mini-card` styles and the bottom `continue-adventure` banner pattern can host a "Daily" card without a new screen.
  - Completion panel (`#wgCompletePanel`), `toast()`, and `celebrate()` for reward feedback.
  - `hideAllScreens()` and the `FQ_SCREEN_IDS` list for any new screen.
  - `unlockAchievements()` as the rule hook for badge-style collectibles.
- **Collectible content:** a static JS data file (`content/collectibles.js`) in the same style as the existing content files. No images are required for a first version: emoji or the existing icon style, so there is no asset pipeline and no third-party artwork.

### 2.2 What this deliberately avoids

No backend, no accounts, no analytics SDK, no remote config, no push service, no ads SDK, no purchase flow. All of those conflict with the current privacy policy ("100% local storage, zero backend") and the checklist's Guideline 3.1.1/5.1.1 findings.

### 2.3 Preserving existing player data

- Additive only: a missing `save.engagement` initializes to defaults on load; nothing existing is renamed, moved, or recomputed.
- Never retroactively grant or revoke: new systems start counting from first launch of the feature. Do not back-fill streaks or badges from `activityDates` without an explicit owner decision, because back-filling changes coins and XP for existing players.
- If the streak calculation is corrected to local days, keep `activityDates` as the source of truth and only change how it is read, with a fixture test of an old save to prove the displayed streak does not drop for existing players unexpectedly.

---

## 3. Phase 3 — Feature design

Complexity scale: **S** about 1-2 days, **M** about 3-5 days, **L** about 1-2 weeks, including tests and live verification. Estimates assume one developer familiar with this repo. **Proposed reward amounts are placeholders for owner decision.** They are not changes to any current formula.

### Feature 1 — Daily login rewards and streak bonuses

- **Player experience:** First open each local day shows a small "Daily reward" card on the journey map. One tap claims it with a toast and `celebrate()`. Streak milestones (3, 7, 14, 30 days) show a bonus.
- **Reward mechanics:** Fixed, visible schedule (for example 25 coins base, plus 10 per streak day up to a cap, with a milestone bonus at 7 and 30). No randomness, no "mystery" reward. Amounts shown before claiming. Coins only; no cash value, no purchase path.
- **Interface changes:** one card on `#worldSelectScreen`; a claim state and a "come back tomorrow" state; optional header streak flame already exists (`#wgStreak`).
- **Save fields:** `engagement.daily = { lastClaimDay: "YYYY-MM-DD", claimStreak: n, longestClaimStreak: n, claimedMilestones: [] }`.
- **Complexity:** **S-M** (plus the day-key fix, which is **S**).
- **Dependencies:** `localDayKey()`; decision on whether the reward streak equals the existing play streak or is its own claim streak (recommend its own, so a player who plays but forgets to claim is not punished, and so existing streak data is never reinterpreted).
- **Abuse and duplicate risks:** claiming twice (guard on `lastClaimDay`); clock rollback (never accept a day earlier than `lastClaimDay`, and never decrease it); clock fast-forward (cap at one claim per real elapsed local day and ignore jumps greater than a few days by clamping the streak bonus, not by punishing); double-tap (idempotent claim); two tabs or windows (re-read the save before granting). Streak-loss anxiety: allow one "grace" day per week, or never reset below the last milestone, as a policy choice for the owner.

### Feature 2 — Daily financial challenges

- **Player experience:** One short challenge per day (a question from the existing governed content), answered in the app, with a small reward and a one-line explanation.
- **Reward mechanics:** Fixed reward for a first correct answer per day; no penalty for a wrong answer (retry allowed, reward only on the first correct answer per day). No reward for repeats.
- **Interface changes:** a challenge card plus a simple question view; can reuse the quick-challenge UI that already exists for terms (`quickChallenge` exists in the term schema and `recordChallenge()` in the engine).
- **Save fields:** `engagement.challenge = { day, challengeId, completed, attempts }` and a per-ID history to avoid repeating recently used challenges.
- **Complexity:** **M-L**. The engine hook exists, but **content is the real cost**: V3 financial terms are generated with *empty* `quickChallenge` fields (`financialLearningTerms()` sets `prompt: ""`), so there is no ready-made question bank for V3 terms. Credit's curriculum workbooks contain quizzes that could be sampled, but only for Credit.
- **Dependencies:** governed challenge content (must go through the project's content-governance and approval process; do not author financial claims ad hoc); the Credit identity registry for Credit-related IDs.
- **Abuse and duplicate risks:** day rollover; repeat rewards across retries (guard with `completed`); answer scraping is irrelevant (no stakes). Content accuracy risk is the larger one: a wrong financial fact in a daily challenge is a trust and App Review problem, so every item needs governed sourcing.

### Feature 3 — Unlockable finance-themed collectibles

- **Player experience:** A "Collection" view of finance-themed items (for example a piggy bank, a compass, a ledger, a vault). Items unlock by earned milestones: first solve in a world, completing a puzzle, a streak milestone, mastering a term, completing a world playthrough.
- **Reward mechanics:** Deterministic rules, not random drops or loot boxes. Every item shows exactly how to unlock it. No purchasing. Unlocking never changes coins or XP formulas (the item itself is the reward); optionally a one-time small coin bonus per item.
- **Interface changes:** one collection screen, one unlock toast. No new art pipeline in v1: original emoji or simple original icons only. No Wordscapes characters, artwork, names, or visual style.
- **Save fields:** `engagement.collectibles = { unlocked: { itemId: "ISO date" } }`.
- **Complexity:** **M** for a rules-based version with about 15-25 items.
- **Dependencies:** `content/collectibles.js` (static); an event hook after `wgFoundWord` completion and after a puzzle completes. The unlock rules should read existing data (`solvedWords`, `puzzleHistory`, `termProgress[].masteryLevel`) instead of adding new counters.
- **Abuse and duplicate risks:** an unlock evaluated twice must be idempotent (key by item ID). Rules based on **existing** history can grant items retroactively on first load; decide explicitly whether that is wanted (it is generous and low-risk, but it is a visible change for existing players).

### Feature 4 — Optional timed reward activities

- **Player experience:** An opt-in, clearly labelled "Quick challenge" (for example, solve N words in a session), or a weekly event window, with a visible countdown.
- **Reward mechanics:** Reward is earned by performance, never by waiting or by tapping repeatedly. Missing it has no penalty. No wagering, no "double or nothing", no pay-to-extend.
- **Interface changes:** a card with a countdown; a results panel.
- **Save fields:** `engagement.timed = { activeId, startedAt, endsAt, progress, claimed }`.
- **Complexity:** **M**. The in-session version needs no notifications. Calendar-window events add content scheduling, which has no server, so they must ship inside the app bundle.
- **Dependencies:** an injectable clock (2.1); a decision on whether to use app-bundled static event definitions.
- **Abuse and duplicate risks:** the most exposed to clock tampering and to "timer pressure" design issues. Keep timers cosmetic or session-bound; avoid time-gated scarcity that pressures players, which is both a design and an App Review (children's and wellness-style scrutiny) consideration. If the owner wants countdown events, anchor them to elapsed time measured within one session with a monotonic source (`performance.now()`), not wall-clock dates.

### Feature 5 — Collectible upgrades and progression

- **Player experience:** Each collectible has tiers (for example Bronze, Silver, Gold) that rise as the related skill improves, for example tied to the mastery level of linked terms.
- **Reward mechanics:** Tier is *derived* from existing mastery data (0-4 mastery levels already exist and only ratchet upward). No new currency to grind and no coin-based upgrade purchases in v1.
- **Interface changes:** tier badge on the collection screen; upgrade toast.
- **Save fields:** none beyond Feature 3 if tiers are computed from `termProgress`. If an upgrade is ever purchasable with coins, add `engagement.collectibles.tiers`, and then route spending through `learning.spendCoins()` only.
- **Complexity:** **S** once Feature 3 exists; **M** if upgrades cost coins (needs balance design so hints stay affordable).
- **Dependencies:** Feature 3; stable term IDs (V3 financial answers carry `termId`; Credit IDs come from the approved registry).
- **Abuse and duplicate risks:** low if derived; if purchasable, the usual double-spend risk is already handled by `spendCoins()` (atomic check, deduct, persist).

### Feature 6 — Potential real-world reward partnerships

- **Recommendation: do not build; defer indefinitely pending a separate legal and policy review.**
- **Why:** the app promises, and the published privacy policy states, no accounts, no data collection, no third parties. Real-world rewards need identity, fulfilment, geographic and age eligibility, tax handling, and fraud controls, none of which exist. They would also trigger App Store review questions (Guidelines 3.1.1, 5.3, and the "no misleading real-money rewards" rule in this brief), COPPA/age-gating questions, and a rewrite of the Privacy Policy, Terms, and the checklist's Phase 3 findings.
- **If the owner still wants to explore:** keep it entirely outside the app binary for now (for example, a plain web page that links to a partner's own sign-up), with no coin-to-value conversion, no earned-reward language, and no data passed between the app and the partner.
- **Complexity:** **XL** and mostly non-engineering.

---

## 4. Cross-cutting design rules for every feature

1. Rewards are visible before they are earned, predictable, and earned through play. No randomness, no loot boxes, no wagering, no cash-out language.
2. Coins stay earn-only with no cash value and no purchase path (current Terms and Privacy statements remain true).
3. New rewards never alter `wordReward`, `answerReward`, `hintCost`, `canAffordHint`, `XP_PER_LEVEL`, or the level formula.
4. Every grant goes through one idempotent function keyed by a stable reward key (for example `daily:2026-10-17`, `collectible:vault`), so a retry, refresh, or second tab cannot pay twice.
5. All persistence is one additive namespace; reads are validated with the same sanitizing pattern as `sanitizeCount()`.
6. No dark patterns: no penalties for missing a day beyond losing a bonus, no countdown pressure on core learning, no guilt copy.
7. Accessibility: new UI uses real buttons with labels, visible focus, 44px targets, and honors `prefers-reduced-motion` (relevant to checklist Phase 5).
8. Any change to what the app collects or promises requires a same-day update to `privacy.html`, `terms.html`, and the App Store description.

---

## 5. Phase 4 — Release impact

### 5.1 Preservation checklist and how each is protected

| Must preserve | Risk from engagement work | Protection |
|---|---|---|
| All five governed worlds | Low. Engagement is world-agnostic. | No edits to world vocab, banks, or `WG_WORLDS`. |
| Approved Credit identity registry | None unless collectibles or challenges reference Credit terms. | Reference only through `creditIdentities.resolveTerm()`; never create Credit IDs elsewhere. |
| The 27 existing V3 puzzles | None, if untouched. | `src/v3-puzzle-slate.js` and `SPECS` are out of scope; add a test that asserts the slate hash or count (27) is unchanged by the feature branch. |
| Financial-majority composition rules | None, because engagement does not alter puzzle composition. | Same as above; confirm the requirement text first (see Section 0, item 3). |
| Cross-world financial recognition | None if rewards remain keyed by stable term IDs. | Do not key engagement logic to display words; use `termId`. |
| Existing coins, XP, mastery, completion histories | The main data risk is a bad migration or a retroactive grant. | Additive `save.engagement` only; no back-fill without approval; fixture-based test loading a pre-feature save and asserting every existing number is unchanged. |

### 5.2 Safe before V3 launches versus defer

**Reasonably safe before V3** (additive, no content or puzzle dependency, small blast radius), *provided the owner lifts or amends the V1.0 freeze*:

1. Engagement foundation: `localDayKey()`, `engagement` save namespace, grant helper, tests. Also correct the three truthfulness issues in 1.3 (achievement reward copy, daily dots stub, gems display) by either wiring or removing them.
2. Feature 1, daily login reward and streak bonus.

**Safe only after V3 launches and stabilizes:**

3. Feature 3, collectibles (rules read V3 progress and term IDs; wait until V3 data is the production reality so unlock rules are written once).
4. Feature 5, collectible tiers (depends on 3).
5. Feature 4, timed activities, after the clock-handling policy is decided.

**Defer, with a separate governance step first:**

6. Feature 2, daily financial challenges: blocked on governed challenge content, especially for V3 terms whose challenge fields are empty today.
7. Feature 6, real-world partnerships: do not schedule.

### 5.3 App Store and policy impact

- Features 1, 3, 5 add no data collection, no permissions, no network use, and no purchases, so the Privacy Policy and the App Review story stay unchanged apart from new screenshots and description copy.
- Notifications (a natural companion to a daily reward) would add a Capacitor plugin, a permission prompt, and Privacy Policy changes. Recommend leaving them out of the first engagement release.
- Updated screenshots and the Guideline 2.3 metadata check apply once the visible UI changes (checklist Phase 3 and Phase 7).

---

## 6. Prioritized implementation plan

| # | Work item | Effort | Depends on | Notes |
|---|---|---|---|---|
| 0 | Owner decisions (Section 8) | n/a | none | Gating item for everything else |
| 1 | Engagement foundation: `localDayKey()`, `save.engagement`, idempotent grant helper, fixture test proving existing saves are untouched | S-M | 0 | No visible change |
| 2 | Truthfulness fixes: achievement reward copy or grant, daily-dots stub, gems display | S | 0 | Removes misleading UI; no formula change unless the owner chooses to *grant* the advertised XP |
| 3 | **Feature 1: daily login reward and streak bonus** | S-M | 1 | **Recommended first feature** |
| 4 | Feature 3: collectibles (rules-based, static content) | M | 1, V3 stable | |
| 5 | Feature 5: collectible tiers derived from mastery | S-M | 4 | |
| 6 | Feature 4: opt-in timed activity (session-bound) | M | 1, clock policy | |
| 7 | Feature 2: daily financial challenge | M-L | governed content | Content-gated |
| 8 | Feature 6: partnerships | XL | legal, policy | Do not schedule |

**Rough total for items 1-5:** about 3-4 weeks of one developer including tests, live verification, and iOS bundle sync, excluding content authoring for Feature 2.

### 6.1 Recommended first feature: Feature 1, daily login reward with streak bonus

**Why this first:**
- Smallest surface: one card, one state machine, one save key.
- No content dependency, no art, no puzzle or vocabulary changes, so it cannot disturb the five worlds, the Credit identity registry, or the 27 V3 puzzles.
- Forces the correct foundation (local day key, idempotent grants, additive namespace) that every later feature needs.
- Proven, understandable engagement mechanic that fits the "predictable, earned, no cash-out" requirement.

**Definition of done (proposed):**
- Pure engine functions with tests covering: first claim, same-day double claim, next-day claim, missed day, clock rollback, large clock jump, month and year boundaries, timezone offsets (UTC-12 to UTC+14), and DST changes.
- Fixture test: a pre-feature save loads with identical coins, XP, level, streak, `activityDates`, `worlds`, and `termProgress`.
- Live verification on a fresh account and on a seeded legacy save, mobile viewport, zero console errors, reduced-motion respected, focus and labels present.
- iOS bundle synced; `scripts/build-www.sh` list updated for any new file (a known gotcha: files not on that list are silently excluded from the native bundle).

---

## 7. Risks register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Retroactive or duplicate coin grants distort the economy | Medium | Medium | Single keyed grant ledger; no back-fill; fixture tests |
| Day rollover at the wrong hour (UTC keys) | High if unfixed | Medium | Local day key; tests across time zones |
| Clock tampering | Medium | Low (no cash value) | Monotonic guards; capped bonus; accept as a known limitation |
| Misleading UI (unpaid achievement XP, gems) | Existing | Medium (trust and review) | Fix or remove before adding more rewards |
| Scope creep against the V1.0 freeze | High | High | Owner decision on freeze before any build |
| Financial misinformation in challenge content | Medium | High | Governed content only; defer Feature 2 |
| Privacy Policy drift if data collection or notifications are added | Low | High | Keep v1 engagement fully local; update policy with any change |
| Collision with in-progress V3 working-tree changes | Medium | Medium | Branch from the V3 branch once it is committed; touch `learning-engine.js` and `word-game-app.js` minimally |

---

## 8. Decisions needed from the owner

1. **Freeze:** amend the V1.0 freeze to allow Features 1 and 2-foundation, or hold all engagement work until after V1.0 is approved and V3 ships?
2. **Reward amounts and streak policy:** base amount, per-day increment, cap, milestone bonuses, and whether a missed day resets the streak, uses a grace day, or only loses the bonus.
3. **Retroactive items:** should existing players be credited at first launch (for example collectibles from existing history), or should everything start from zero?
4. **Advertised achievement XP:** grant the advertised "+25 XP" and "+50 XP", or remove that copy? (Granting changes XP totals for existing players who already hold those badges only if back-filled; recommended: grant going forward only.)
5. **Gems:** define them or remove them from the headers.
6. **Financial-majority requirement:** supply the requirement text and confirm whether the current V3 slate in the working tree is the updated one.
7. **Partnerships:** confirm Feature 6 is out of scope for now.
8. **Notifications:** confirm they stay out of the first engagement release.

---

## 9. Verification log for this audit

- Read in full: `learning-engine.js`, `src/v3-puzzle-slate.js`.
- Read in part: `word-game-app.js` (reward grant, header, V3 gating, completion panel), `app.js` (dashboard stats, journey map), `src/puzzle-bank-engine.js` (reward function), `content/credit-term-identities.js` (registry header and shape), `docs/V1_RELEASE_CHECKLIST.md`.
- Commands run (all read-only): directory listings, `grep`, `wc`, a Node one-liner that counts financial answers per V3 spec without modifying anything, and `npm test` (284 passed, 0 failed in the current working tree).
- Not done: no live-browser pass, no tests of day-boundary behavior across time zones (the UTC finding is from code reading), no review of governance documents outside this repository.

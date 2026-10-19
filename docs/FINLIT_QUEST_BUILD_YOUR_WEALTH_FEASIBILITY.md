# FinLit Quest — "Build Your Wealth" Feasibility Report

Date: 2026-10-17 · Verified and corrected: 2026-10-17 · Status: **COMPLETE — research only, not approved for implementation** · Priority: **post-V1**

Nothing in the game, the saves or the economy was changed to produce or verify this report. Documentation changes are limited to this report, `FUTURE_FEATURE_BACKLOG.md`, and `PROJECT_LOG.md`.

**Evidence tags used on every finding:** **[V]** verified in code or a repo document · **[I]** inferred from verified facts · **[U]** unknown, needs data or an owner decision.

All asset names, rates, explanations and events in this document are **DRAFT** gameplay and curriculum proposals. No stable IDs are created for assets.

---

## Executive summary

1. **It is technically feasible without a backend.** The Daily Login reward system already provides the exact pattern needed (an additive save namespace, a once-per-local-day claim, clock-rollback evidence, a cross-tab guard). **[V]**
2. **The placeholder economy is broken, and the biggest reason is not the 20-day payback.** The current governed registry has **155 terms** with a finite first-discovery supply of **6,622 coins**; the active 27-puzzle slate still supplies only **1,883 coins**. Replays pay 0. After the finite puzzle supply is exhausted, the repeatable active-income floor is the daily login alone (about **26.4 coins/day**). The proposed five assets cost 3,850 coins in total and would eventually pay up to 192/day—about **7.3× the remaining active income**. **[V]** for the supply figures, **[I]** for the model.
3. **A learning gate is possible, but only on "term solved", not on mastery.** The V3 terms carry no lesson, quiz or review content, and the live non-Crypto modes do not record per-term progress. **[V]**
4. **Curriculum approval is the real blocker, not engineering.** The explanations, rates, events and disclaimer are new curriculum text. Also, the approved INTEREST definition means *borrowing cost*, which contradicts how a savings account must be taught. **[V]**
5. **Recommendation: do not implement before V1.** V1 is scope-frozen and still needs release verification. Full Xcode is now installed on this computer, but real-device, TestFlight, accessibility, store-metadata, and final submission-readiness work remain outstanding. Build the smallest version only after V1 (§3): three contrasting assets, daily collection, and integer-only passive income capped at 10 coins/day.

---

## 1. Proposed gameplay loop

1. The player earns coins as today: first-discovery puzzle rewards and the daily login.
2. The player solves the related financial term in a puzzle. This is the **learning gate**.
3. The player spends coins (existing `learning.spendCoins`) to unlock the asset card.
4. Once per local day the player collects a small, capped amount of simulated income, from the same screen as the daily reward.
5. A **scripted, deterministic "slow quarter"** reduces some assets' income for a set period. A diversified portfolio is hit less than a single-asset one.
6. The player can upgrade an asset or earn a milestone (post-MVP).
7. Everything is labelled **"Educational simulation, not financial advice."**

**Learning gate [V]:** gating on coins alone would make this an idle game, so the gate is required. What data exists to build it:
- `save.worlds["wg-<world>"].solvedWords` and `rewardedFinancialTermIds` exist in **both** the legacy and V3 modes and are global across worlds through `FinLitPuzzleBank.globalRewardHistory`. This is the dependable gate: "has the player solved the term".
- `learning.save.termProgress[id].puzzle.timesSolved` and the mastery fields are **not dependable** as a gate. `word-game-app.js:556` records them only for V3 puzzles and the Crypto world, so a legacy Banking, Investing, Money Basics or Credit solve records no per-term progress.
- A *mastery* gate is not possible for the proposed assets: the V3 learning objects are created with empty examples and an empty `quickChallenge` (`src/v3-puzzle-slate.js`, `financialLearningTerms`).

---

## 2. Existing code that can be reused

| Need | Reuse | Where | Tag |
|---|---|---|---|
| Coins and spending | one balance; `spendCoins(cost)` checks, deducts, persists | `learning-engine.js:135` | [V] |
| Save and persistence | `normalizeSave` keeps unknown fields (`...raw`); `persist()` writes the whole blob; `CURRENT_SAVE_VERSION = 3`; additive `save.engagement` namespace | `learning-engine.js:3, 62–89, 127` | [V] |
| Once-per-day claim | `claimDailyLogin`, `dailyClaimStatus`, `readDailyClaim`, `localDayKey` | `learning-engine.js` (Phase 2 block) | [V] |
| Clock safeguards | `clockEvidenceMs`, rollback tolerance (10 min), time-zone cooldown | same | [V] |
| Cross-tab guard | `adoptPersistedClaim()` re-reads storage before claiming | same | [V] |
| Term-solved data | `solvedWords`, `rewardedFinancialTermIds`, `globalRewardHistory`; `wgRewardHistory()` | `src/puzzle-bank-engine.js`, `word-game-app.js` | [V] |
| Achievements | `ACHIEVEMENTS` and `unlockAchievements` (**these award XP**, so new milestones should not use them as-is) | `learning-engine.js:34, 195` | [V] |
| Celebration | `FinLitVictory.createController` (confetti, coin flight to the balance, skip, reduced motion) | `src/victory-celebration.js` | [V] |
| Audio | `wgAudio.correct / miniJackpot / grandJackpot`, one mute and volume preference | `src/game-audio.js`, `word-game-app.js` | [V] |
| Screens and claim UI | `FQ_SCREEN_IDS`, `hideAllScreens`, `showWorldSelect`, `renderDailyReward`, `claimDailyRewardFromUi`, the `visibilitychange` re-render | `app.js:29–68, 151–153` | [V] |
| Header coin display | `wgUpdateHeader` | `word-game-app.js` | [V] |
| Test patterns | `tests/daily-login-rewards.test.js`, `existing-player-save-matrix.test.js`, `bundle-parity.test.js` | `tests/` | [V] |
| Bundle | `scripts/build-www.sh` copy list, `stamp-cache-bust.mjs` | `scripts/` | [V] |

**Not found [V]:** inventory or collectible data, any timer or cooldown, a remote analytics or telemetry call, a data export, and a `storage` event listener.

**Related earlier design [V]:** `FINLIT_QUEST_ENGAGEMENT_EXPANSION_PLAN.md` already proposes Feature 3 (collectibles) and Feature 5 (upgrades) and the rules "no random drops, rewards visible before earned, one idempotent grant function, one additive namespace". Build Your Wealth should be built as an extension of that design, not as a parallel system.

---

## 3. Recommended MVP (the smallest practical version)

**Three contrasting assets** that teach different ideas, not three tiers of one thing:

| Card (draft names) | Concept taught | Linked approved term (existing ID) | Behaviour |
|---|---|---|---|
| Savings Account | steady, visible interest | `moneybasics.saving` (V3 puzzle exists) | fixed daily income, never varies |
| Index Fund | diversification, mild variation | `investing.index` | mild scripted variation |
| Single-Company Stock | higher risk, higher variation | `investing.stock` (V3 puzzle exists) | large scripted variation |

Findings on the terms **[V]**:
- INDEX has **no V3 puzzle**: no approved partner word can be spelled from it, so it is not a V3 anchor and can only be solved in a legacy Investing puzzle. The gate term for the fund card is therefore unreachable in V3 unless the owner approves a different gate term.
- The approved INDEX definition describes "a measure that tracks…", not a *fund*. Calling the card "Index Fund" is a concept the approved vocabulary does not define (see §8).

**Included:** one portfolio screen, once-daily collection, one scripted slow quarter, an educational card per asset (blocked on approval), existing coins only.
**Deferred to a second phase:** upgrades and milestone tracking.
**Excluded:** real prices, trading, brokerage, randomness, purchases, a backend.

**Two variants for the owner to choose between:**
- **A (recommended):** assets are a coin sink with **small, capped, integer-only** daily income (§4, corrected structure S3). Coins gain a meaningful use without becoming a replacement for learning rewards.
- **B (zero economy risk):** assets pay **no coins**; they only display a virtual "portfolio value". Coins are still spent. It cannot undermine puzzle income, but the "collect" loop is weaker.

**Credit-only version [I]:** the asset-income loop cannot ship on Credit content alone: the 38 Credit terms are borrowing terms (DEBT, LOAN, INTEREST, APR, REPAYMENT, AUTOPAY…), and the only deposit-yield term is APY. The only Credit-only adaptation is a *different* feature: a "Credit Toolkit" of cards unlocked by solved Credit terms (AUTOPAY, REPAYMENT, PRINCIPAL, APR…) with deterministic cost-saving scenarios. It would show governed definitions verbatim and need approved scenario text.

---

## 4. Coin economy impact

### 4.1 What the coin supply really is [V]

| Fact | Value | Evidence |
|---|---|---|
| Starting coins | 300 (equals the full-reveal cost) | `DEFAULT_ECONOMY_CONFIG` |
| Financial word reward | 7 coins per letter, **first solve only, globally** | `answerReward`; replay returns `coins:0` |
| Lifetime puzzle supply, all 155 currently governed terms | **6,622** coins (average 42.7 per term, 6.1 letters) | recomputed from the five current vocabularies plus the approved V3 supplement |
| V3 slate first-pass supply | **1,883** coins over 27 puzzles (average 69.7, range 42–106) | simulated with `answerReward` |
| Daily login | 10/15/20/25/30/35/50, **average 26.4/day** | `DAILY_LOGIN_SCHEDULE` |
| Coin sinks | letter hint 100, full reveal 300 (free in tutorial levels) | `word-game-app.js`, economy config |

Consequence: **active income is front-loaded and then collapses to about 26 coins/day** once a player has solved the available terms. Any passive income should be judged against that floor, not against early-game puzzle income. **[I]**

The *average coin earn rate from crossword play* cannot be measured: there is no telemetry. **[U]** The model below uses 1, 2 and 5 new puzzles per day (the daily goal is 5) at the verified 69.7 average, and assumes the player buys in price order as soon as affordable and has solved each gate term.

### 4.2 Why the proposed numbers fail

All five proposed assets pay back in about 20 days, so there is no decision, and the whole set (3,850 coins) is bought in **9–28 days** (with the 300 starting coins). Worse, the passive total reaches **192 coins/day**, which is **726% of the 26.4/day** active income left after the puzzle supply is exhausted. At 2 new puzzles/day that exhaustion comes around day 13 on the V3 slate. **[I]**

### 4.3 Payback structures modelled (all values are placeholders)

| Structure | Assets (cost / daily) | Payback (days) | Decision it creates |
|---|---|---|---|
| **S0 proposed** | 100/5, 250/12, 500/25, 1000/50, 2000/100 | 20, 21, 20, 20, 20 | none: buy in price order |
| **S1 diminishing returns** | 100/4, 250/8, 500/14, 1000/25, 2000/45 | 25, 31, 36, 40, 44 | cheap first is optimal; later assets are for completion |
| **S2 patience rewarded** | 100/2.5, 250/7, 500/16, 1000/38, 2000/90 | 40, 36, 31, 26, 22 | save for the better asset or buy now; snowball risk |
| **S3 low-yield sink (recommended)** | 100/1, 250/3, 400/6 | 100, 83, 67 | integer-only payouts; coins become a meaningful sink and income remains a bonus |
| **MVP-A three contrasting** | 150/5, 400/12, 600/25 | 30, 33, 24 | choose safety, balance or risk; passive still too high |

### 4.4 Days to each purchase (including the 300 starting coins)

| Structure | 1 puzzle/day | 2 puzzles/day | 5 puzzles/day |
|---|---|---|---|
| S0 | 1 / 1 / 6 / 13 / 24 | 1 / 1 / 4 / 9 / 16–19 | 1 / 1 / 2 / 4 / 9–17 |
| S1 | 1 / 1 / 6 / 14 / 28 | 1 / 1 / 4 / 9 / 18–26 | 1 / 1 / 2 / 4 / 9–24 |
| S2 | 1 / 1 / 6 / 14 / 27 | 1 / 1 / 4 / 9 / 18–24 | 1 / 1 / 2 / 4 / 9–21 |
| **S3** | 1 / 1 / 5 | 1 / 1 / 3 | 1 / 1 / 2 |
| MVP-A | 1 / 3 / 8 | 1 / 2 / 5 | 1 / 1 / 3 |

(Ranges show the current full-supply case, 6,622, against the active-slate case, 1,883. The first asset is affordable on day 1 in every structure because of the 300 starting coins, which are also the player's hint budget.) **[I]**

### 4.5 Passive versus active income at each portfolio stage

"Active" here is the **post-exhaustion floor of 26.4/day**, the harder test.

| Structure | After 1 asset | After 2 | After 3 | After 4 | After 5 |
|---|---|---|---|---|---|
| S0 | 5/day (**19%**) | 17 (**64%**) | 42 (**159%** ⚠) | 92 (**348%** ⚠) | 192 (**726%** ⚠) |
| S1 | 4 (15%) | 12 (45%) | 26 (**98%** ⚠) | 51 (**193%** ⚠) | 96 (**363%** ⚠) |
| S2 | 2.5 (9%) | 9.5 (36%) | 25.5 (**96%** ⚠) | 63.5 (**240%** ⚠) | 153.5 (**581%** ⚠) |
| **S3** | 1 (**4%**) | 4 (**15%**) | 10 (**38%**) | — | — |
| MVP-A | 5 (19%) | 17 (64%) | 42 (**159%** ⚠) | — | — |

⚠ = passive income outpaces solving puzzles. **Every structure with five assets, and the three-asset MVP-A, fails.** Only S3 stays under 40%. At 2 new puzzles/day before exhaustion, S3's full portfolio is about 6% of active income (10 vs about 166/day).

**Proposed guardrail [I]:** the portfolio's total passive income must never exceed **10 integer coins/day**, about **38%** of the 26.4-coin post-exhaustion active floor. Enforce the cap in the engine and in automated tests.

**Sink effect of S3 [I]:** the three-asset portfolio costs **750 coins**, about **40% of the entire V3 slate supply**, so it is a real but reachable sink that also competes with hints (100 / 300).

No existing coin or XP formula changes under any structure. **[V]**

---

## 5. Save compatibility requirements

- **Can the existing save hold it? Yes, additively. [V]** The daily-claim feature already added `save.engagement.dailyClaim` without bumping `saveVersion`, and `normalizeSave` preserves unknown fields (also confirmed in a browser test with an unknown future field).
- **Proposed new data (draft shape):** `save.engagement.portfolio = { owned: { <assetKey>: { level, purchasedDay } }, lastCollectedDay, lastCollectedAtMs, collectionCount, history[] (capped, like `DAILY_CLAIM_HISTORY_LIMIT = 60`) }`, validated with the `sanitizeCount` / `isPlainObject` pattern. **[I]**
- **Content stays out of the save:** asset definitions live in a static `content/` file; the save stores only keys and numbers. This follows the existing rule "never copy definitions into saves". **[V]**
- **Keys, not term IDs:** the asset game keys are local, flagged draft, and link to *existing* approved term IDs. **No new stable IDs** are created. **[V]** rule.
- **No migration needed**, and no change to puzzle history, mastery or reward histories. A save with the new namespace read by an older build is simply ignored (additive). **[I]**
- **Downgrade and corrupt-data tolerance:** read must be non-mutating and corruption-tolerant like `readDailyClaim`. **[I]**
- **No retroactive grants:** do not auto-unlock assets from existing history on first load; the gate is evaluated at purchase time. **[I]**

---

## 6. Security and duplicate-reward safeguards

**Design:**
- **Collection cycle: once per local day, tied to the daily-reward screen. Recommended over continuous accumulation.** It reuses verified code (`localDayKey`, clock evidence), needs no per-second arithmetic, is easy to test, and matches the existing mental model. **[I]**
- **Accumulation cap: 48 hours** (one missed day is not lost; nothing accrues beyond two days). A 24-hour cap punishes a single missed day and conflicts with "no guilt for missing a day". **[I]**
- Store `lastCollectedDay` and `lastCollectedAtMs`.
- **Reject backward time** with the existing `clockEvidenceMs` (the rollback tolerance is 10 minutes).
- **Idempotent grant** keyed `collect:<YYYY-MM-DD>` so a refresh or retry cannot pay twice.
- **Purchases and collections use `spendCoins` / the one coin balance.** No second currency, no real money, no cash value. **[V]** rule.

**A weakness to fix, not just reuse [V]:** `persist()` writes the entire in-memory save without re-reading it, and only the daily claim adopts another tab's state (`adoptPersistedClaim`). Two stale tabs could each buy an asset or collect, and the last write wins (a lost update, or a double spend if the balances diverge). The portfolio therefore needs the same **re-read, merge, then write** step for coins and ownership, with tests that simulate two stale copies.

**Residual risk (cannot be eliminated without a backend):**

| Risk | Rating (offline, single player) | Why |
|---|---|---|
| Setting the device clock **forward** to collect extra days | **Low** | Bounded by the 48 h cap and the 10-coin/day portfolio maximum; no leaderboard or real value. The same residual already exists for the daily login. **[V]** documented in code |
| Editing `localStorage` directly | **Low** | Self-harm only in a private game |
| Multi-tab double spend | **Low–Medium until fixed** | See above; fixable with a merge step and tests |

**This becomes Medium to High if cloud sync or leaderboards (Phase 8) are added.** Then the device clock and the save are no longer trusted: a server-authoritative coin and collection ledger, server timestamps, per-account idempotency keys, server-side validation of purchases and rate limits, and re-deriving portfolio income on the server would all be required. Today there is no backend, account system or third-party SDK, and the privacy policy says so. **[V]**

---

## 7. Return variation and educational accuracy plan

**Deterministic, scenario-based, never random.** No chance-based payouts, no loot boxes, no randomized rewards; this also keeps the feature clear of the simulated-gambling content that drives a higher age rating. **[I]**

- **Savings:** steady and visible interest; never varies.
- **Index fund and single stock:** a **fixed calendar of "quarters"** measured in the player's own collection count (for example 7 collections per quarter), repeating on a fixed script such as normal → **slow** → **strong** → normal. A slow quarter reduces income for a set number of collections; a strong quarter raises it, so the long-run average is not made to look worse than it should be (otherwise the simulation teaches that stocks always lose).
- **Diversification demonstration (draft integer schedule on structure S3):** on a slow-quarter collection the stock pays 2 instead of 6, the fund pays 2 instead of 3, and savings remains 1. A **single-stock** portfolio drops by about **67%**; the **full three-asset** portfolio drops by **50%** (10 → 5 coins). The card says so in plain words.
- **Required labels:** "Educational simulation. Not financial advice. Real investments can lose value and have no guaranteed returns." Never imply fixed returns for market assets.

**Statements to flag [I]:**
- Anything about **deposit insurance** (for example FDIC limits) is **US-specific** and can change.
- Specific **interest rates, fund costs or tax treatment** are jurisdiction-specific and change over time. Use only clearly labelled illustrative numbers.
- Real index funds and stocks vary in ways a scripted calendar simplifies; the card must say it is a simplified model.

---

## 8. Curriculum governance status of the asset content

**Status: DRAFT. Nothing here is approved curriculum.** I created no stable IDs and no new terms.

**Current authority [V]:** the earlier governance conflict has been resolved. `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md` and `docs/CURRICULUM_APPROVAL_LOG.md` are controlling. Credit and Crypto are **Approved with Qualification** for current V1 use; Money Basics and Investing Basics are **Owner Approved** for their recorded scopes; Banking Basics is **Approved with Qualification**. These statuses do **not** approve Build Your Wealth content. The asset concepts, explanations, simulated returns, events, questions, and disclaimer remain new draft curriculum requiring explicit approval.

**What must be approved before the asset content can ship:**

| Content | Needs approval | Note |
|---|---|---|
| Asset concepts "Savings Account", "Index Fund", "Single-Company Stock" as taught ideas | Yes | Only SAVING, INDEX, STOCK exist as governed *terms*; "index fund" is not defined |
| A short educational explanation per asset | **Yes (new curriculum text)** | Cannot be paraphrased from approved text |
| Slow-quarter and diversification explanation | Yes | |
| The "educational simulation, not financial advice" wording | Yes (owner, and likely legal review) | |
| Any rates or numbers shown | Yes (must be marked illustrative) | |
| Quick-check questions for the asset terms | Yes | None exist for these terms today |
| Milestone and achievement copy | Yes | |

**A definition conflict [V]:** the approved `credit.interest` definition is "The cost charged for **borrowing** money." A savings account's interest is the opposite sense, so a savings card cannot reuse INTEREST. The approved `credit.apy` definition ("an annual deposit-yield measure reflecting compounding") does fit and could carry the savings explanation.

**What can ship without new curriculum text [I]:** cards that show only the **verbatim governed definition** of the linked term plus clearly labelled illustrative numbers. That version teaches less, but needs no new approval of explanations.

Approval must follow the existing pipeline exactly; I propose no custom process. **[V]** rule.

---

## 9. Mobile interface recommendation

Original designs only; no Wordscapes animals, eggs, icons or UI.

- **One new screen** (`portfolioScreen`) registered in `FQ_SCREEN_IDS`, reached from a card next to the existing daily-reward card on the journey home. **[I]**
- **Layout at 320–390 px:** a vertical list of three asset cards (full width, at least 44 px targets) and one sticky **Collect** bar at the bottom, the same pattern as the completion card's pinned "Next Puzzle". **[I]**
- **Card states:** *locked* (shows the term to solve and the cost, with a progress hint), *affordable but gated*, *unlocked* (income per day, level, last result), *slow-quarter* (a plain "slow quarter" badge, not colour alone).
- **Portfolio progress:** a simple "n of 3 assets" bar. **Milestones:** a short list (post-MVP).
- **Art:** original inline SVG or simple original icons; no new dependency and no art pipeline. **[I]**
- **Rules:** existing design tokens, light and dark, `prefers-reduced-motion`, keyboard focus and labels, and the 320 px checks already used for the header and completion card. **[V]** rules in CLAUDE.md.
- **Process rule [V]:** CLAUDE.md requires explaining a material UX change before building it; this section is that proposal.

**Audio and celebration (§7 of the brief) [I]:** reuse the existing systems; no new sound engine or dependency.

| Event | Reuse | Note |
|---|---|---|
| Asset unlocked | `miniJackpot` + the victory controller's coin flight | the one "big" moment |
| Coins collected | `correct("financial")` chime | small, not a jackpot |
| Asset upgraded | `correct("financial")` | |
| Portfolio milestone | `grandJackpot`, at most once per milestone | rare; avoid overusing jackpots so they stay special |

The sound mute and volume preference apply automatically. The celebration controller is created with a fixed `from` and `to` element, so a new screen needs a target element and nothing else. Avoid a second confetti layer. Be aware that a collect-every-day chime should stay quiet to avoid fatigue.

---

## 10. Exit test and thresholds (define before building)

**What existing analytics can measure [V]:** only **device-local** data: `puzzleHistory` (`timesPlayed`, `lastPlayedAt`), `activityDates`, streak, `dailyPuzzleProgress`, `termProgress` and `worldStats`. There is **no remote telemetry, no export and no backend**. So no cross-player statistic can be computed today. **[U]** whether TestFlight testers can send data back.

| Metric | Today | What is needed |
|---|---|---|
| Share of players collecting on **2 or more separate days** | not measurable | a `collectionCount` and distinct collection days in the save (new); a way to get it off devices |
| **Average coins spent** on assets | not measurable | an asset spend total in the save (new) |
| **Crossword completion rate** before and after | partly: per-device `puzzleHistory` timestamps give puzzles per active day | a beta cohort with a pre-feature baseline |
| **Related quiz or review performance** of multi-asset owners | **not measurable** | the asset terms have **no quiz or review content** [V]; at least one approved question per asset is needed first |

**Proposed thresholds (placeholders for owner approval), over a 28-day beta window with at least 30 testers:**

| Outcome | Continue | Re-evaluate | Exit |
|---|---|---|---|
| Buyers who collect on 2+ separate days | ≥ 40% | 25–40% | < 25% |
| Average coins spent on assets | ≥ 450 (60% of the 750 portfolio) | 200–450 | < 200 |
| Puzzles completed per active day vs the pre-feature baseline | within 5% | 5–10% lower | > 10% lower |
| Multi-asset owners' review accuracy vs others | ≥ +10 points | 0 to +10 | below 0 |

The review date is **28 days after the first external beta build that contains the feature**; no calendar date should be invented before that beta exists. Collecting this data needs a local summary export for testers or an opt-in channel; either changes what the app collects, which requires a same-day update to `privacy.html`, `terms.html` and the App Store text. **[V]** rule.

---

## 11. Development effort estimate **[I]**

Engineer-days, including tests and verification; excludes owner approval and content authoring.

| Work | Days |
|---|---|
| Static asset content, portfolio engine (purchase, gate, collect, cap, events), additive save, multi-tab merge | 3–4 |
| Portfolio screen, three cards, collect bar, mobile and accessibility | 3 |
| Celebration and audio wiring (reuse only) | 1 |
| Slow-quarter script and the diversification card | 1 |
| Tests: save matrix, clock and rollback, double-claim, two-tab, four time zones, parity, mutation checks | 2 |
| Real-device and TestFlight check | 1 |
| Privacy, terms and store text updates | 0.5 |
| **Smallest viable version (three assets, no upgrades or milestones)** | **about 7–9** |
| Second phase: upgrades and milestones | +3–4 |

Test volume is comparable to the daily-reward work: roughly 40–60 new tests plus browser runs. **[I]**

---

## 12. V1 versus post-V1 recommendation

**Recommendation: wait until after V1 launches.**

- V1 is a **scope-frozen** release. Full Xcode 27.1 is now installed and the iOS project exists, removing the earlier local-tooling blocker. Real-device and TestFlight verification, accessibility, store metadata, and final submission readiness remain incomplete. **[V]** (`docs/V1_RELEASE_CHECKLIST.md` plus the current local tool check)
- This feature adds a **new save namespace, a new screen and a new coin sink** to a system that is under release verification, and it enlarges the set of things that must be re-verified on a device that is not yet available. **[I]**
- It also needs **new curriculum approval and owner decisions** that are not engineering tasks. **[V]**
- **Cost of building now:** it does not unblock V1, so it would not speed V1, but it would divert owner attention and add regression surface. The V1 critical path is the build environment and device testing, not feature work. **[I]**

**What it displaces on the roadmap [I]:** device-verification and TestFlight work (including audio listening checks), accessibility, store readiness, individual approval of the pending 27-quiz expansion, and the rest of the engagement plan (it overlaps Features 3 and 5, which should be considered first). The V3 multi-word slate is already the default runtime and is no longer an activation decision. Build Your Wealth would also compete with the deferred avatar system for the same post-MVP engagement slot. If cloud sync or leaderboards are planned, design the portfolio around a server-authoritative ledger rather than shipping a client-only system that must later be replaced.

---

## 13. Exact implementation steps requiring owner approval

Nothing below starts until approved. Each step is gated on the previous one.

1. **Approve adding the feature to the post-V1 backlog** (done in `FUTURE_FEATURE_BACKLOG.md`) and confirm it does not enter V1.
2. **Choose the feature direction:** the three-asset portfolio recommended here, or a separate Credit Toolkit concept. Current world status is already governed by the confirmed matrix.
3. **Choose the economy variant:** A (small capped passive coins, corrected integer-only structure S3) or B (no coin income). Approve the hard maximum of 10 portfolio coins/day.
4. **Approve gate terms:** SAVING, STOCK, and a reachable term for the fund card (INDEX has no V3 puzzle), or approve a different fund concept and its governed definition.
5. **Approve new curriculum text** through the existing pipeline: one explanation per asset, the slow-quarter and diversification text, the disclaimer wording, any illustrative numbers.
6. **Approve at least one quick-check question per asset**, or accept that the review-accuracy exit metric will not be measurable.
7. **Approve the exit test and thresholds** (§10) and how beta data comes back (local export or an opt-in channel), including the privacy and terms updates.
8. **Approve the UX proposal** (§9) before any screen work.
9. **Approve the engineering build in two phases:** (a) engine, save, tests with no UI; (b) the portfolio screen and celebration wiring.
10. **Approve the post-build review** against the exit thresholds, 28 days after the first beta build.

---

## Appendix — the twelve required questions

| # | Question | Short answer | Where |
|---|---|---|---|
| 1 | Which files and functions could support it? | `learning-engine.js` (save, `spendCoins`, daily-claim block), `app.js` (screens, daily reward UI), `word-game-app.js`, `src/victory-celebration.js`, `src/game-audio.js`, `src/puzzle-bank-engine.js` | §2 |
| 2 | New data structures? | `engagement.portfolio` in the save; a static asset-content file | §5 |
| 3 | Can the save hold it without breaking migrations? | Yes, additively, with no version bump | §5 |
| 4 | Safeguards and remaining risk? | Once-daily idempotent collect, 48 h cap, rollback evidence, tab merge; clock-forward residual Low offline, Medium–High with Phase 8 | §6 |
| 5 | Effect on the coin economy? | Finite supply (6,622 / 1,883); proposed numbers fail; corrected S3 is capped at 10 coins/day (about 38% of the repeatable floor) | §4 |
| 6 | Smallest viable version? | Three contrasting assets, S3 income, daily collection, one slow quarter, no upgrades | §3 |
| 7 | Development and testing effort? | About 7–9 engineer-days (+3–4 for phase two) | §11 |
| 8 | V1 release risks? | New save namespace, screen and sink in a frozen, unbuilt release | §12 |
| 9 | Wait until after V1? | Yes | §12 |
| 10 | Simplest implementation with no backend? | Local-day daily claim, additive save, static content | §3, §6 |
| 11 | Which content needs curriculum approval? | Explanations, events, disclaimer, numbers, quizzes, milestone copy; and the INTEREST sense conflict | §8 |
| 12 | What does it displace, and what does delay cost? | Device verification, V3 activation, other approvals, engagement Features 3 and 5; delaying it costs V1 nothing | §12 |

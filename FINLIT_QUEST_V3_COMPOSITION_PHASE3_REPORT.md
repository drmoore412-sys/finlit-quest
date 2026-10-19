# FinLit Quest — V3 Crossword Composition, Phase 3

Date: 2026-10-16 · Scope: local development only · Status: **awaiting owner approval**

Labels used throughout: **IMPLEMENTED** (in the working tree), **TESTED** (covered by automated tests and/or the browser run), **PROPOSED** (research only, nothing built), **REQUIRES APPROVAL** (needs an owner decision before any work).

Nothing was committed, pushed, merged or deployed. PR #4 and `docs/V1_RELEASE_CHECKLIST.md` were not touched. The 145-term vocabulary, frozen definitions, real player saves and unrelated reward systems are unchanged. V3 remains opt-in behind `?puzzles=v3`.

---

## 1. Compliance, before and after — IMPLEMENTED / TESTED

| World | Before | After |
|---|---|---|
| Crypto | 2 / 5 | 3 / 5 |
| Credit | 5 / 6 | 6 / 6 |
| Money Basics | 5 / 5 | 5 / 5 |
| Banking | 3 / 5 | 5 / 5 |
| Investing | 0 / 6 | 4 / 6 |
| **Total** | **15 / 27** | **23 / 27** |

Target met (23/27). The four non-compliant puzzles are exactly the four the brief expected: **CHAIN, WALLET, ASSET, GROWTH** (§7). The financial-majority rule was not weakened.

Composition rule as enforced by `validateComposition`: 3–5 required words, at least one financial anchor, at least two further required words, financial majority (3 words → 2 financial, 4 → 3, 5 → 3), the wheel is exactly the anchor's letters with correct multiplicity, every word is spellable, and the crossword is connected with legal boundaries.

## 2. Three approved replacements — IMPLEMENTED / TESTED

All use existing approved terms only, keep their original IDs and definitions, are financial-only (no ordinary words), and are revision 2 in the same world and slot as the puzzle they replace.

| Slot replaced | New puzzle | Words (origin) | Financial |
|---|---|---|---|
| Banking · SECURE | `FQ-V3:banking:PASSKEY:R2` | PASSKEY (banking), PAY (money basics), APY (credit) | 3 / 3 |
| Banking · RESERVE | `FQ-V3:banking:CONVERT:R2` | CONVERT (banking), NET (money basics), VOTE (investing) | 3 / 3 |
| Investing · CAPITAL | `FQ-V3:investing:MARKET:R2` | MARKET (investing), RATE (money basics), TERM (credit) | 3 / 3 |

## 3. Five conditional replacements — IMPLEMENTED / TESTED

Each uses an approved financial anchor that the old anchor's slot did not previously use, with one approved secondary and one ordinary word (3 words, 2 financial).

| Slot replaced | New puzzle | Words | Ordinary word |
|---|---|---|---|
| Credit · ACCOUNT | `FQ-V3:credit:PRINCIPAL:R2` | PRINCIPAL, APR (credit), PLAIN | PLAIN |
| Crypto · MINER | `FQ-V3:crypto:BLOCK:R2` | BLOCK, LOCK (crypto), COB | COB |
| Investing · EQUITY | `FQ-V3:investing:STOCK:R2` | STOCK, COST (money basics)\*, SOCK | SOCK |
| Investing · BROKER | `FQ-V3:investing:TRADE:R2` | TRADE, RATE (money basics)\*, READ | READ |
| Investing · DIVIDEND | `FQ-V3:investing:RETURN:R2` | RETURN, NET (money basics)\*, TUNE | TUNE |

\* cross-world secondary. All five conditional replacements were valid, so none was withheld.

## 4. Ordinary words selected, and their validation — IMPLEMENTED / TESTED · **owner review requested**

The brief allowed me to select valid ordinary English words where needed. Five were chosen; please review them.

| Word | Puzzle | In system dictionary | Not a governed term | Not a financial term | Layout valid | Not a prefix trap |
|---|---|---|---|---|---|---|
| PLAIN | PRINCIPAL | yes | yes | yes | yes | yes |
| COB | BLOCK | yes | yes | yes | yes | yes |
| SOCK | STOCK | yes | yes | yes | yes | yes |
| READ | TRADE | yes | yes | yes | yes | yes |
| TUNE | RETURN | yes | yes | yes | yes | yes |

- Each is spellable from its wheel with correct multiplicity and fits a connected, legally bounded crossword.
- Ordinary words pay 1 coin / 0 XP, create no learning object and no mastery record (browser-verified: no ordinary word appears in `termProgress`).
- COB is the least familiar of the five (a corn cob; also a male swan). A re-check shows BLOCK/LOCK has few valid ordinary partners: COB, **LOB**, BLOC and a handful of obscure words. **LOB** (to throw a ball) is the more everyday alternative and also lays out validly. Swapping it would be a one-word change plus the pinned test list; I held back so the choice stays yours.
- The total ordinary-answer set across the slate is now 26 words (list is pinned in `tests/non-financial-terminology.test.js`).

## 5. Cross-world terms used — IMPLEMENTED / TESTED

Eleven distinct approved terms appear outside their home world, each with its **original ID and governed definition**:

| Term | ID | Appears in |
|---|---|---|
| APY | credit.apy | Banking · PASSKEY (and Credit puzzles at home) |
| ASK | investing.ask | Crypto · STAKE |
| COST | moneybasics.cost | Investing · STOCK |
| DEBT | credit.debt | Money Basics · BUDGET |
| NET | moneybasics.net | Crypto · TOKEN, Banking · CONVERT, Investing · RETURN |
| OWNER | investing.owner | Banking · NETWORK |
| PAY | moneybasics.pay | Banking · PASSKEY |
| RATE | moneybasics.rate | Investing · TRADE, MARKET |
| SWAP | crypto.swap | Banking · PASSWORD |
| TERM | credit.term | Investing · MARKET |
| VOTE | investing.vote | Banking · CONVERT |

## 6. Revision changes — IMPLEMENTED / TESTED

- **15 puzzles are revision 2:** TOKEN, STAKE, BLOCK, PRINCIPAL, CREDITOR, RECEIPT, BUDGET, NETWORK, PASSWORD, PASSKEY, CONVERT, STOCK, TRADE, MARKET, RETURN. The last eight are this phase's replacements.
- **12 puzzles remain revision 1** (unchanged): TERMS, REPAYMENT, AUTOPAY, CAPACITY, PAYMENT, REFUND, PAYCHECK, DEPOSITOR, CHAIN, WALLET, ASSET, GROWTH.
- Puzzle IDs are `FQ-V3:<world>:<ANCHOR>:R<revision>`. For V3, completion history only matches the exact ID, so no old puzzle completion is carried into a new revision (verified: tests plus the browser run). No save migration was required or performed.
- `SPECS` fingerprint is now `8c810ab1ba4afec9` (pinned in tests).

## 7. CHAIN, WALLET, ASSET, GROWTH — research only — PROPOSED / REQUIRES APPROVAL

Nothing here is implemented. The four puzzles are untouched at revision 1.

**Core finding.** With all 145 approved terms available across worlds, **zero** approved terms of three or more letters can be spelled from CHAIN, WALLET, ASSET or GROWTH. Keeping any of the four anchors therefore cannot reach two financial words under the approved vocabulary. I also scanned the full system dictionary (210k words) for every word spellable from each anchor:

| Anchor | Words spellable from it that have any finance meaning |
|---|---|
| CHAIN | **ACH** (Automated Clearing House bank transfer). Others: CHIN, INCH, CAN, CHAI |
| WALLET | none (ALE, ALL, TALE, TELL, WALL, WELL, WEAL-archaic …) |
| ASSET | none (EAST, SEAT, SET, SEA, EATS …) |
| GROWTH | **WORTH**, **ROTH** (Roth IRA). Others: GROW, THROW, ROW |

CHAIN, WALLET, ASSET and GROWTH also cannot be secondaries inside any other anchor's wheel (they need letter sets no other anchor contains).

Every Crypto and Investing anchor in the 145 is now in use (Crypto: TOKEN, STAKE, BLOCK; Investing: STOCK, MARKET, RETURN, TRADE), so replacing these four needs either a cross-world anchor, a new term, or a rule change. Today the schema and validator expect an anchor to belong to the puzzle's own world.

### Options (all layouts below were checked with the real crossword solver and returned a valid, connected layout)

**Option A — add one new financial term (REQUIRES APPROVAL: new vocabulary + definition governance)**
- CHAIN → add **ACH** (Banking). `CHAIN / ACH / INCH` or `CHAIN / ACH / CHIN`: 2 of 3 financial. Layout valid.
- GROWTH → add **WORTH** (Investing). `GROWTH / WORTH / ROW` or `GROWTH / WORTH / THROW`: 2 of 3 financial. Layout valid. (ROTH also works but is niche; I do not recommend it.)
- WALLET and ASSET: **no new-term path exists**. Neither letter set spells any finance word.

**Option B — re-anchor the slot with an approved term from another world (REQUIRES APPROVAL: schema/semantic change, anchors no longer own-world)**
All use only approved terms; the original four terms then do not appear in V3.

| Replacement anchor | Words | Financial | Notes |
|---|---|---|---|
| SAVING | SAVING / GAS (crypto) / GAIN (investing) | 3 / 3 | financial-only; fits a growth theme |
| DEBIT | DEBIT / DEBT (credit) / BID (investing) | 3 / 3 | financial-only |
| INCOME | INCOME / COIN (crypto) / COME | 2 / 3 | one ordinary word; COIN suits a crypto slot |
| DEPOSIT | DEPOSIT / POSTED (banking) / DEPOT | 2 / 3 | one ordinary word |
| INTEREST | INTEREST / NET (money basics) / ENTER | 2 / 3 | one ordinary word |
| COSIGNER, APPLICANT, ALERT, MANDATE, REMIT, SPREAD | each with one approved secondary and one ordinary filler | 2 / 3 | available if more are needed |

**Option C — accept the four as permanent non-compliant puzzles, or retire them (REQUIRES APPROVAL)** without changing the rule.

### Recommendation per puzzle

| Puzzle | Recommended path | Why | Fallback |
|---|---|---|---|
| **CHAIN** (Crypto) | **A:** add ACH, `CHAIN / ACH / CHIN` | Keeps the crypto anchor; needs one small new term | B: INCOME + COIN + COME in the Crypto slot |
| **WALLET** (Crypto) | **B:** INCOME + COIN + COME | No new-term path; COIN keeps a crypto flavour, income/wallet share a "money you hold" theme | C: leave as a documented exception |
| **ASSET** (Investing) | **B:** DEBIT + DEBT + BID | Financial-only; BID is Investing-origin | B: DEPOSIT + POSTED + DEPOT |
| **GROWTH** (Investing) | **B:** SAVING + GAS + GAIN, or **A:** add WORTH (`GROWTH / WORTH / ROW`) | SAVING is financial-only and thematically close; WORTH keeps the GROWTH anchor | B: INTEREST + NET + ENTER |

Decisions this depends on: (1) whether any new terms may be added; (2) whether an anchor may come from another world; (3) whether the four anchor terms are acceptable to drop from V3 anchor coverage. If the answer to (1) and (2) is no, the four stay pending and 23/27 is the ceiling.

## 8. Reward and mastery verification — TESTED

Automated (`tests/v3-cross-world-composition.test.js` and related) and browser-verified on a synthetic save:

- Cross-world answers keep their original term ID, definition and mastery ID (`moneybasics.net` etc.). Mastery is recorded once per permanent term ID. Browser run: 44 `termProgress` records, no duplicates, no ordinary word present.
- First discovery is paid once globally. NET appears in three puzzles (TOKEN, CONVERT, RETURN): it paid 21 coins / 5 XP in Crypto and **0 / 0** in Banking and Investing. PAY, APY, TERM and RATE behaved the same way. The reward history is read as a union across worlds; the save format did not change.
- Reward amounts matched an independently computed expectation for every one of the 27 puzzles' words (7 coins per letter and round(1.5 × letters) XP, first discovery only; ordinary 1 coin / 0 XP once per world; zero problems reported).
- Non-financial rewards are unchanged, and so are the daily login rewards (see §9).
- Old R1 completions are not carried into R2 puzzles; pre-existing synthetic-save and legacy-save matrices still pass.
- I did **not** implement the optional global discovery ledger migration, as instructed.

## 9. Browser verification — TESTED

URL: `http://127.0.0.1:8765/index.html?puzzles=v3`, synthetic saves only, cleared afterwards.

**Desktop**
- All 27 puzzles rendered and were solved end to end, alternating **swipe** and **tap** across puzzles (swipe for 14, tap for 13). Every required word was accepted, with no problems reported.
- Wheel letters equalled the anchor letters (with repeats) for all 27. Required words were 3–5 in every puzzle.
- All words are required: in PASSKEY, solving 2 of 3 did **not** show the completion panel; the third did.
- Wrong word (KEY) and duplicate (PAY) were rejected with no coin change.
- Repeated letters: PASSKEY has two S tiles; PRINCIPAL (P×2, I×2) and RETURN (R×2) solved correctly.
- Completion panel and the Definitions panel show the governed definitions, including for cross-world terms (e.g. PAY, APY).
- Composition status in the preview ribbon: 23 puzzles "composition rules met", 4 "pending owner approval" (CHAIN, WALLET, ASSET, GROWTH). The ribbon only appears under `?puzzles=v3`.
- **Daily login:** claim button showed "Claim 10 coins", gave +10 coins and 0 XP, then disabled as "Claimed today".
- Progress persisted across a reload (coins, XP and per-world completion).

**Mobile (375 × 812, touch emulation)**
- Page reloaded in mobile mode, then PASSKEY, CONVERT, MARKET, STOCK, TRADE, RETURN, PRINCIPAL and BLOCK were each completed (4 swipe, 4 tap). No horizontal overflow; wheel tiles 56 px.
- Observation, not caused by Phase 3: in the mobile screenshot the Level card slightly overlaps the XP chip in the header. This is existing header CSS I did not change this phase. Listed under §12 for a decision.

I restored the desktop viewport and cleared the synthetic localStorage when finished.

## 10. Test results — TESTED

- Full suite: **405 tests, 405 pass, 0 fail** in each of four time zones (America/Los_Angeles, UTC, Asia/Tokyo, Pacific/Auckland).
- `git diff --check`: clean.
- The iOS bundle parity guard failed after the source edits, as designed, and passes after the local resync (`stamp-cache-bust` → `build-www.sh` → `cap sync ios`).
- Pinned expectations were updated only for the approved revisions, each with the reason commented in the test file. No test was weakened.
- Mutation checks: six deliberate corruptions of the slate were each caught by the tests (lost revision bump, ordinary word swapped for a governed term, non-governed secondary, lost financial majority, a pending puzzle silently altered, a replaced anchor retained).
- New Phase 3 tests cover: the eight replacements keep world and slot; the three approved ones are financial-only; secondary IDs and definitions are preserved; the ordinary-word list is documented and not governed; ordinary rewards are 1 coin / 0 XP with no learning object; the four pending puzzles are untouched; shared terms pay once.

## 11. Exact files modified in this phase — IMPLEMENTED

Source:
- `src/v3-puzzle-slate.js` — the eight replacement specs (revision 2).

Tests (pinned expectations updated for the approved revisions):
- `tests/v3-cross-world-composition.test.js`
- `tests/v3-composition-and-acceptance.test.js`
- `tests/schema-v3.test.js`
- `tests/credit-id-governance.test.js`
- `tests/non-financial-terminology.test.js`

Generated by the local bundle resync (no hand edits):
- `ios/App/App/public/src/v3-puzzle-slate.js` (regenerated copy)
- `index.html` and `ios/App/App/public/index.html` (cache-bust stamp value refreshed by `stamp-cache-bust.mjs`)

New report: `FINLIT_QUEST_V3_COMPOSITION_PHASE3_REPORT.md` (this file).

Not changed this phase: vocabulary, definitions, `word-game-app.js`, `word-game.css`, the validator, the puzzle-bank engine, reward code, saves, PR #4, the release checklist. Earlier-phase uncommitted work remains in the working tree.

## 12. Remaining owner decisions — REQUIRES APPROVAL

1. **Ordinary words:** approve PLAIN, COB, SOCK, READ, TUNE, or name replacements (COB is the one I would most expect you to question; LOB is the validated alternative).
2. **CHAIN / WALLET / ASSET / GROWTH:** choose per puzzle from §7 (new term ACH and/or WORTH; cross-world anchors such as SAVING, DEBIT, INCOME; or leave as documented exceptions). Option A needs a governed definition and a vocabulary change; option B needs a rule change that lets an anchor come from another world.
3. **Housekeeping:**
   - `FINLIT_QUEST_V3_145_TERM_INVENTORY.md` has an "In V3 slate" column that is now stale after this phase. I did not regenerate it because it was not requested; I can do so.
   - An untracked stray file named `-iname "*release*" | head -30q` sits in the project root (an accidental shell artifact from an earlier session). I left it alone; say the word and I will remove it.
   - The mobile header overlap noted in §9 is outside this task.
4. **Stale-bundle note:** the iOS bundle was resynced locally for the parity guard only. Nothing was built for release or deployed.

Stopping here as instructed. No commit, push, merge or deployment has been made.

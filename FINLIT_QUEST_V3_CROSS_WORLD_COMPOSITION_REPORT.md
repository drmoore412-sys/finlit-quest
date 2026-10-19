# FinLit Quest — V3 Cross-World Composition Report

**Date:** 2026-10-17
**Owner decision applied:** cross-world use of all 145 approved financial terms is authorized.
**State:** Implemented **locally only**. No commit, push, merge, or deployment. PR #4 untouched. No existing player save was modified. No vocabulary, definition, permanent ID, or Credit registry entry was added or changed. No replacement anchors or new vocabulary were applied (they are proposals in section 6).
**Preview:** `http://127.0.0.1:8765/index.html?puzzles=v3` (localhost only, still running).
**Companion file:** `FINLIT_QUEST_V3_145_TERM_INVENTORY.md` (the full read-only inventory, all 145 terms with complete definitions).

---

## 1. Compliant puzzles, before and after

| | Before | After |
|---|---|---|
| Puzzles meeting every approved composition rule | **8 of 27** | **15 of 27** |
| Puzzles still failing (financial-majority rule only) | 19 | 12 |

Compliant now (15): Credit: TERMS, CREDITOR, REPAYMENT, AUTOPAY, CAPACITY. Money Basics: PAYMENT, RECEIPT, REFUND, PAYCHECK, BUDGET. Crypto: TOKEN, STAKE. Banking: DEPOSITOR, NETWORK, PASSWORD.
Still failing (12): CHAIN, WALLET, MINER (Crypto); ACCOUNT (Credit); SECURE, RESERVE (Banking); ASSET, EQUITY, GROWTH, BROKER, CAPITAL, DIVIDEND (Investing).

Per world after the repair: Credit 5 of 6, Money Basics 5 of 5, Banking 3 of 5, Crypto 2 of 5, Investing 0 of 6.

---

## 2. Task 1: the 145 approved financial terms

Built from the same files the game runs on. **Result: clean. Nothing needed to be invented.**

| Check | Result |
|---|---|
| Total | 145 (Money Basics 36, Credit 38, Crypto 20, Banking 26, Investing 25) |
| Permanent identities | 145 unique IDs, all present, each prefixed with its owning world; Credit IDs come only from the approved registry |
| Words | 145 unique; no word belongs to two worlds |
| Governed definitions | All 145 present and non-empty |
| Letter multiplicity | Computed per term (listed in the inventory file) |
| Term lengths | 3 to 16 letters; only 5 to 9 letters can anchor a puzzle |

Existing behavior, confirmed from the code:
- **Reward:** 7 coins and 1.5 XP (rounded) per letter, once. Examples: `NET` 21 coins / 5 XP; `PAYMENT` 49 / 11.
- **Reward histories** are saved **per world** (`solvedWords`, `rewardedFinancialTermIds`).
- **Mastery** is one record per permanent ID, shared across worlds. It is recorded for Crypto terms in every mode and for the other four worlds' terms in V3 puzzles.
- **Ordinary words:** 1 coin, 0 XP, once per world, no mastery record.

---

## 3. Task 2: changes implemented locally

### 3.1 CREDITOR and RECEIPT
Both requirements were checked and **both qualified**: removal leaves 3 required words, a financial majority (2 of 3), a legal connected crossword, and an exact wheel.

| Puzzle | Before | After |
|---|---|---|
| CREDITOR | CREDITOR / CREDIT / DIRECT / **EDITOR** (2 of 4) | CREDITOR / CREDIT / DIRECT (2 of 3) |
| RECEIPT | RECEIPT / PRICE / PIECE / **TIRE** (2 of 4) | RECEIPT / PRICE / PIECE (2 of 3) |

### 3.2 The five cross-world candidates
For each puzzle I replaced one ordinary word with an approved term from another world. Every candidate was verified for wheel spellability (including letter counts), a legal connected crossword, and a financial majority (2 of 3). Original identities and definitions are preserved.

| Puzzle (world) | Before | After | Cross-world term (owner) | Term identity |
|---|---|---|---|---|
| TOKEN (Crypto) | TOKEN / NOTE / TONE | TOKEN / **NET** / NOTE | NET (Money Basics) | `moneybasics.net` |
| STAKE (Crypto) | STAKE / TAKE / SEAT | STAKE / **ASK** / TAKE | ASK (Investing) | `investing.ask` |
| BUDGET (Money Basics) | BUDGET / BED / GET | BUDGET / **DEBT** / BED | DEBT (Credit) | `credit.debt` |
| NETWORK (Banking) | NETWORK / WORK / NOTE | NETWORK / **OWNER** / WORK | OWNER (Investing) | `investing.owner` |
| PASSWORD (Banking) | PASSWORD / PASS / WORD | PASSWORD / **SWAP** / PASS | SWAP (Crypto) | `crypto.swap` |

**How I chose among several valid candidates.** Rule applied: replace the *last-listed* ordinary word (smallest change), and where more than one approved term fits, prefer a term not already used elsewhere in the slate (more vocabulary coverage). That is why NETWORK uses `OWNER` (alternatives `NET`, `TOKEN`) and PASSWORD uses `SWAP` (alternative `APR`). TOKEN, STAKE, and BUDGET had only one valid candidate each. **Please confirm or redirect these two choices.**

### 3.3 Supporting code changes (all local)
- A spec can now name a term owned by another world. A cross-world answer is built from its **owning world's** vocabulary, so its permanent ID, definition, and mastery record come from that world (`worldId` stays the owner; `crossWorld: true` marks it).
- Each of the seven recomposed puzzles gets revision **2** (ID ending `:R2`), so completion of the old composition is never inherited by the new one. The other 20 keep `:R1`.
- The V3 validator now accepts a financial answer from another world **only** when it is marked `crossWorld`, belongs to a known world, and carries that world's own ID prefix. An unmarked or mislabeled foreign answer is rejected.
- The runtime passes all five vocabularies when building a world's V3 bank.

### 3.4 Pinned tests updated deliberately
These tests pinned the old composition and were updated, each with a comment giving the reason: the exact-27-combinations test (TOKEN and BUDGET), the SPECS fingerprint (`cb3e6394540f0207` to `a8de9ede25b5ba9c`), the 8-versus-19 compliance lists (now 15 versus 12), the ordinary-answer count (45 to 38: EDITOR, TIRE, SEAT, TONE, GET, NOTE, WORD), the 145-term coverage partition (36/43/66 to **40/41/64**, still exhaustive and mutually exclusive), and the world-switching test (now supplies all vocabularies).

---

## 4. Task 4: reward and mastery safety

| Requirement | Result |
|---|---|
| Cross-world terms retain original identities | **PASS.** All five carry their owner's ID and governed definition; the tests check each against the source vocabulary. |
| Existing mastery is not duplicated | **PASS.** One record per ID. Registering the same term from two worlds returns one learning object, and the host world does not take ownership. Live: `NET` solved in two puzzles gave a single `moneybasics.net` record (2 solves). |
| Existing reward histories preserved | **PASS.** The new logic only **reads** them (tested with frozen inputs). No save field is added, moved, or rewritten. |
| First-discovery cannot be claimed twice globally | **FOUND A REAL GAP AND FIXED IT.** See below. |
| Non-financial words keep approved behavior | **PASS.** Ordinary history is deliberately **not** shared across worlds; 1 coin, 0 XP, once per world, unchanged. |

**The gap.** Reward histories are saved per world. Before this fix, `NET` could pay its first-discovery reward in Money Basics and **again** in Crypto, because Crypto's list had never seen it. The same would have happened for the other four shared terms.

**The fix (not a new reward system).** When the game looks up a financial reward, it now also consults every world's existing history: `FinLitPuzzleBank.globalRewardHistory()` returns the union of all worlds' `solvedWords` and `rewardedFinancialTermIds` (words are unique across the 145 terms). Applied at both reward sites (the award and the reward preview, so what is shown always matches what is paid).

**Verified:**
- Tests: any order, any host, every one of the five shared terms pays once in total. Across the whole slate, every distinct financial term pays exactly once whatever the play order.
- Live, with real pointer input: `NET` paid 21 coins in Crypto, then **0** in Money Basics.
- Live, with a legacy player who had already discovered `NET` (Money Basics) and `DEBT` (Credit): both paid **0** in their new host puzzles, while the never-discovered `SWAP` paid its normal 28 coins.

### Save migration: none required
Nothing in the save changes shape. If you later want either of these, they **would** need a migration, and I have not built them:
1. A single canonical global discovery ledger (instead of reading the per-world lists).
2. Carrying completion of the old R1 compositions over to the new R2 puzzles.

Note on R1 history: a preview player who finished the old TOKEN puzzle keeps that record in the save (untouched), but it does not count toward the new R2 puzzle. V3 is preview-only, so no production player is affected.

---

## 5. Task 5: testing

| Check | Result |
|---|---|
| Crossword layout validation | **PASS** all 27 (legal, connected, strict boundaries) |
| Letter multiplicity validation | **PASS** all 27 (wheel is exactly the anchor's letters; every required word spellable) |
| Financial-majority validation | **15 pass / 12 fail**, as reported |
| Term identity validation | **PASS** (145 unique IDs; cross-world terms match their owner) |
| Existing-player save compatibility | **PASS** (tests plus a live legacy-save check; settings, legacy histories, solved words, unknown fields, and old R1 history all preserved) |
| Reward regression | **PASS** (every answer in all 27 puzzles pays once; ordinary words unchanged; global guard) |
| Full automated suite | **398 / 398** under `America/Los_Angeles`, `UTC`, `Asia/Tokyo`, `Pacific/Auckland` (381 at task start; +17 new) |
| `git diff --check` | Clean |
| Mutation tests | 6 of 6 meaningful breaks caught (global guard removed, ordinary history wrongly shared, cross-world term taking the host's identity or ownership, revision bump ignored, validator accepting a foreign identity). A seventh mutant was equivalent to existing logic, so I removed the redundant clause instead. |
| Browser (mobile and desktop) | Cross-world puzzles render with the term in the crossword; 54 of 54 tap/swipe runs across all 27 puzzles complete; runtime composition verdicts match the tests (15 compliant, 12 pending); no console errors |
| Governed files | All vocabulary, definition, identity, and puzzle-bank files byte-identical to the baseline. Only code files changed. |

Browser caveat: Chromium-based, synthetic pointer events. (One of my own probes initially read state after clicking "Next Puzzle" and falsely reported failures; I fixed the probe and reran. It was never a game defect.)

---

## 6. Task 3: remaining puzzles requiring owner approval

### 6.1 Keeping the existing anchors is impossible
For each of the 12 pending puzzles I searched all 145 approved terms for any word of 3 or more letters spellable from the anchor's letters. **Result: zero candidates for every one of the 12** (CHAIN, WALLET, MINER, ACCOUNT, SECURE, RESERVE, ASSET, EQUITY, GROWTH, BROKER, CAPITAL, DIVIDEND). No arrangement of these anchors can reach a financial majority using approved vocabulary, so these puzzles cannot be repaired without new vocabulary or a different anchor.

### 6.2 Replacement anchors available from the existing 145 terms
I tested every approved term of 5 to 9 letters as a possible anchor. Excluded by prior decisions: `MONEY` and `LOGIN` (previously excluded as anchors) and `INFLATION` (puzzle-bank reserve term). Layouts were verified.

- **Financial-only (needs no new words at all):** the puzzle is the anchor plus two approved terms.
- **Needs one editor-selected ordinary word:** the anchor plus one approved term plus one non-financial word (a word that is not governed vocabulary; layout feasible, final word to be chosen and reviewed by an editor).

| World | Replacement anchor | Composition | Type |
|---|---|---|---|
| Banking | **PASSKEY** | PASSKEY / PAY (Money Basics) / APY (Credit) | Financial-only |
| Banking | **CONVERT** | CONVERT / NET (Money Basics) / VOTE (Investing) | Financial-only |
| Investing | **MARKET** | MARKET / RATE (Money Basics) / TERM (Credit) | Financial-only |
| Money Basics | SAVING | SAVING / GAS (Crypto) / GAIN (Investing) | Financial-only (no Money Basics slot is pending) |
| Money Basics | DEBIT | DEBIT / DEBT (Credit) / BID (Investing) | Financial-only (no slot pending) |
| Credit | **PRINCIPAL** | PRINCIPAL / APR (Credit) + 1 ordinary | One filler (own-world term) |
| Credit | APPLICANT, COSIGNER, INTEREST | with CAPITAL, COIN, NET + 1 ordinary | One filler (cross-world) |
| Crypto | **BLOCK** | BLOCK / LOCK (Crypto) + 1 ordinary | One filler (own-world term) |
| Banking | ALERT, MANDATE, REMIT, SPREAD | with RATE, NET, TERM, APR + 1 ordinary | One filler |
| Investing | **STOCK, RETURN, TRADE** | with COST, NET, RATE + 1 ordinary | One filler |

(Examples of layout-verified benign filler words: INCOME with `COME`; DEPOSIT with `DEPOT`; STOCK with `SOCK`; RETURN with `RERUN`; TRADE with `DARE`; REMIT with `ITEM`; ALERT with `ALTER`. These are examples for editorial review, not selections.)

### 6.3 Proposed approval table (replacement of the 12 pending puzzles)
**None applied.** Each row replaces the old anchor, so the old anchor term loses its V3 puzzle (it would then need to be covered elsewhere in the coverage partition).

| # | World | Pending puzzle | Proposed replacement | Composition | New content needed | Your decision |
|---|---|---|---|---|---|---|
| 1 | Banking | SECURE | **PASSKEY** | PASSKEY / PAY / APY | None | Approve? |
| 2 | Banking | RESERVE | **CONVERT** | CONVERT / NET / VOTE | None | Approve? |
| 3 | Investing | CAPITAL | **MARKET** | MARKET / RATE / TERM | None | Approve? |
| 4 | Credit | ACCOUNT | **PRINCIPAL** | PRINCIPAL / APR / + 1 ordinary | One ordinary word | Approve and select the word? |
| 5 | Crypto | MINER | **BLOCK** | BLOCK / LOCK / + 1 ordinary | One ordinary word | Same |
| 6 | Investing | EQUITY | **STOCK** | STOCK / COST / + 1 ordinary | One ordinary word | Same |
| 7 | Investing | BROKER | **TRADE** | TRADE / RATE / + 1 ordinary | One ordinary word | Same |
| 8 | Investing | DIVIDEND | **RETURN** | RETURN / NET / + 1 ordinary | One ordinary word | Same |
| 9 | Crypto | CHAIN | **none exists** | | New approved Crypto vocabulary, or a cross-world anchor | Decide |
| 10 | Crypto | WALLET | **none exists** | | Same | Decide |
| 11 | Investing | ASSET | **none exists** | | New Investing vocabulary, or a cross-world anchor | Decide |
| 12 | Investing | GROWTH | **none exists** | | Same | Decide |

(The slot pairings in rows 1 to 8 are my suggestion by theme, for example SECURE with PASSKEY and BROKER with TRADE; any replacement can go in any pending slot in the same world.)

**If you approve rows 1 to 8, the slate reaches 23 of 27 compliant puzzles using only already-approved terms** (rows 1 to 3 add no new words at all). The remaining 4 (CHAIN, WALLET, ASSET, GROWTH) cannot be made compliant from the 145 terms.

### 6.4 The structural finding
Across the whole 145-term vocabulary only **15** terms (of 4 to 9 letters) can anchor a fully financial compliant puzzle, and **Crypto has none**. Short financial words rarely fit inside another term's letters. Reaching 27 of 27 needs a decision on one of: new approved short financial vocabulary (especially Crypto and Investing), allowing a puzzle in one world to be anchored by another world's term, or relaxing the rule for those worlds.

---

## 7. Remaining blockers

1. **12 puzzles still non-compliant** and the decisions in section 6.3.
2. **Four puzzles (CHAIN, WALLET, ASSET, GROWTH)** have no compliant composition from approved vocabulary.
3. **Two choices to confirm** in section 3.2 (NETWORK uses OWNER; PASSWORD uses SWAP).
4. **Ordinary words** for rows 4 to 8 must be selected and reviewed by an editor (they are not governed vocabulary but are new content).
5. **Release is separate and unchanged:** V3 remains preview-only behind `?puzzles=v3`; none of this has been committed or deployed, the iOS bundle was re-synced locally only, and the earlier release blockers (Xcode, enrollment, real-device and screen-reader testing, deployment approval) still stand.

---

## 8. Exact files modified

| File | Change |
|---|---|
| `src/v3-puzzle-slate.js` | Seven specs recomposed (revision 2); cross-world secondary terms with origin identity; per-spec revision; `createWorldSlate` accepts all vocabularies |
| `src/puzzle-validator.js` | Added the five-world set and the rule that a cross-world financial answer must be marked and carry its owner's ID prefix (two small edits; the file already carried earlier uncommitted work) |
| `src/puzzle-bank-engine.js` | Added `globalRewardHistory()` (read-only) |
| `word-game-app.js` | `wgRewardHistory()` used at both reward sites; all vocabularies passed when building a V3 bank |
| `index.html` | Cache-bust stamp only (re-stamped by the project script) |
| `ios/App/App/public/*` | Local re-sync of `v3-puzzle-slate.js`, `puzzle-bank-engine.js`, `word-game-app.js`, `index.html` so the bundle-parity guard stays green; nothing built, signed, or released |
| `tests/v3-cross-world-composition.test.js` | **New** (17 tests) |
| `tests/schema-v3.test.js`, `tests/credit-id-governance.test.js`, `tests/non-financial-terminology.test.js`, `tests/v3-composition-and-acceptance.test.js` | Pinned values updated for the approved change, each with a comment |
| `FINLIT_QUEST_V3_145_TERM_INVENTORY.md` | **New** (read-only inventory) |
| `FINLIT_QUEST_V3_CROSS_WORLD_COMPOSITION_REPORT.md` | **New** (this report) |

Not modified: any vocabulary, definition, permanent ID, Credit identity registry, puzzle bank, daily-reward or other reward logic, existing player save, PR #4, or the checklist. Existing uncommitted work is intact.

---

## 9. Decisions needed from you

1. Confirm the two cross-world choices: **OWNER** for NETWORK (not NET or TOKEN) and **SWAP** for PASSWORD (not APR).
2. Rows 1 to 3 of the table: replace SECURE, RESERVE, and CAPITAL with PASSKEY, CONVERT, and MARKET (no new words).
3. Rows 4 to 8: approve the replacement anchors and nominate who selects the ordinary words.
4. Rows 9 to 12: how to handle CHAIN, WALLET, ASSET, and GROWTH (new vocabulary, cross-world anchors, or a rule change).
5. Whether you want either save migration listed in section 4 (a canonical global discovery ledger, or carrying R1 completion into R2).

I'm stopping here and will not apply replacement anchors or any new vocabulary until you decide.

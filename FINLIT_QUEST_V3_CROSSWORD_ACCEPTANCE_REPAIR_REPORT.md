# FinLit Quest — V3 Crossword Acceptance Repair Report

**Date:** 2026-10-17
**Type:** Gameplay repair, local preview only. **Not a release.**
**State:** No commit, push, merge, or deployment. PR #4 untouched. V3 is **not** activated in production (it remains opt-in through `?puzzles=v3`, and nothing was deployed). No player save, frozen vocabulary, definition, term ID, Credit registry entry, or puzzle specification was changed. All existing uncommitted work was preserved.
**Preview used:** `http://127.0.0.1:8765/index.html?puzzles=v3` (a localhost-only server I started on that port; it is still running).

---

## 1. Summary

| Question | Answer |
|---|---|
| Why did Money Basics show only `CASH`? | The page ran in the **default legacy mode**, not V3. V3 only loads when the URL carries `?puzzles=v3`; without it, the game converts old clusters into one-answer "anchor-only" puzzles. The link I gave you earlier (`localhost:8760`) had no flag. The flag itself works. |
| Why were correct answers "rejected"? | A real input defect, reproduced: with **taps** (not swipes), 11 required short words were silently ignored when a longer answer that starts with them had not been found yet (for example `PAY` before `PAYMENT`). Everything else about answer recognition was already correct. |
| Is the crossword generator broken? | No. All 27 puzzles lay out as legal, connected crosswords with exact anchor wheels. |
| Do the 27 puzzles meet the approved rules? | **8 pass, 19 do not**, and the only rule any of them fails is the **financial-majority** rule. |
| Can the 19 be fixed without your decisions? | **2 can** (by dropping one ordinary filler word each); **17 cannot** because no governed term fits. Nothing was modified. Approval table in section 6. |
| Tests | **381 of 381 pass** in four machine time zones; `git diff --check` clean. |

---

## 2. Step 1: Diagnosis (reproduced before any code change)

### 2.1 Mode selection
| Check | Result |
|---|---|
| Load `…/index.html` (no flag) | Mode `legacy`. Money Basics served `ANCHOR-V2:moneybasics:CASH` (and `…:CHARGE` on another load): `mode: anchor-only`, **1 required word**, a single-row grid. The wheel is exactly the anchor's letters, so no other approved term can even be spelled. |
| Load `…/index.html?puzzles=v3` | Mode `v3`. Money Basics served `FQ-V3:moneybasics:PAYMENT:R1` with required words `PAYMENT / PAY / NET`, a 7-tile wheel, and a connected 11-cell crossword. |
| Does `?puzzles=v3` work? | **Yes.** One line reads it (`WG_V3_PREVIEW_ENABLED`, `word-game-app.js`). No code anywhere navigates away from the query string. |
| Stale assets or cached data? | **No contribution found.** The dev server sends `no-store`; no service worker is registered; the loaded script carried the current cache-bust stamp; the V3 slate loaded in both modes. Browser storage is per address, so a different address starts as a different player. |
| Correct specs and validation logic loaded? | **Yes**, in both modes (`FinLitV3PuzzleSlate`, the game engine, and the wheel module were all present). |

**Honest limit:** I could not see your browser. The single-word display is fully explained and reproduced by the missing flag, and the earlier link had none, so that is by far the most likely cause. Nothing in the preview told you which mode you were in; I fixed that (section 4).

### 2.2 Answer acceptance
I drove the **real wheel** with pointer events (taps and swipes) on all 27 puzzles, entering every required word in two orders: as listed, and shortest first.

| Behavior | Before the fix |
|---|---|
| Swiping any required word | Accepted, all 27 puzzles |
| Tapping required words, listed order | Accepted |
| Tapping required words, shortest first | **11 words silently ignored**: `WALL`, `MINE`, `TERM`, `CREDIT`, `AUTO`, `PAY` (twice), `POST`, `PASS`, `BROKE`, `DIVIDE` |
| Crossword fills, completion panel opens | Yes, all runs |

Cause: the game deliberately does not auto-submit by tapping when a word is also the start of a longer unfound answer, so the player can keep building the longer word (this is approved behavior; tests record it). Swiping and keyboard Enter still submitted the short word, but a player who only taps had **no way** to submit it, and got no feedback. That looks exactly like "a correct answer was rejected."

---

## 3. Step 2: Approved composition requirements are now executable

`validateComposition(puzzle, game)` (new, in `src/v3-puzzle-slate.js`) enforces:

- 3 to 5 required words; at least one approved primary financial term; at least two additional required words (no single-word V3 puzzles).
- Financial majority: **3 words need 2, 4 words need 3, 5 words need 3.** Ordinary and bonus words never count as financial.
- The wheel is exactly the anchor's letters, repeated-letter counts included, and every required word can be spelled from it.
- A connected crossword with legal intersections and boundaries.

I also verified it directly: removing any of these rules in a scratch copy made the tests fail (7 of 7 deliberate breaks caught).

---

## 4. Step 3: Repairs implemented

| Fix | Detail | Files |
|---|---|---|
| **Confirm tap for pending words** | Re-tapping the last selected letter submits a required word that is waiting on a longer answer. First taps, swipes, keyboard Enter, and the "one-letter wobble never submits" rule are unchanged. | `src/wheel-interaction.js` (`isDeferredTarget`, `shouldSubmitOnRetap`), `word-game-app.js` |
| **Visible hint** | While a word is pending the readout says, for example, "PAY — tap the last letter again to submit" (also announced to screen readers through the existing live readout). | `word-game-app.js` |
| **Mode and status are visible** | A thin ribbon appears only in V3 preview mode: "V3 PREVIEW · NOT LIVE", green with "composition rules met", or orange with "composition pending owner approval" on a puzzle that fails the rules. It cannot appear in legacy or production mode (asserted by a test). The mode is also marked on the page from first load, not only after a puzzle renders. | `word-game.css`, `word-game-app.js` |
| **Composition in diagnostics** | `finLitPuzzleDiagnostic()` now reports the verdict and the reasons; a console warning names any puzzle that does not meet the rules. | `word-game-app.js` |
| **Composition validator** | See section 3. | `src/v3-puzzle-slate.js` |

### Answer-recognition checks (all verified in the real browser and in tests)
1. Correct required answers are accepted: all 27 puzzles, tap and swipe.
2. Valid wheel-spellable answers are accepted in **any input order**: listed, shortest-first, and reversed (tests); listed and shortest-first (browser).
3. Repeated letters work: each is a separate physical tile (ACCOUNT, REPAYMENT, and the others).
4. Correct answers populate the crossword: filled cells equaled total cells in all 54 runs.
5. Already-completed words are never rewarded twice: checked for **every answer in all 27 puzzles**, plus live (a repeated word paid 0 more coins).
6. Incorrect words do not complete slots: a spellable non-answer was refused ("Not in this puzzle") and the found count stayed 0.
7. Words outside the grid: **no new reward policy was introduced.** Current governed behavior is unchanged: only required words are accepted, bonus lists are empty, and the bonus reward policy is 0 coins / 0 XP. A test pins this.
8. Completion requires every required answer: the panel stayed closed with one word missing and opened only after the last.

After the fix, the identical 54-run pointer sweep (with the confirm tap) had **0 problems**.

---

## 4a. Step 4: The 27 existing V3 puzzles

The slate is untouched. Its 27 combinations are pinned by an existing test as the approved-development set, and I added a fingerprint pin (`cb3e6394540f0207`) so any change must be a deliberate, approved one.

### Puzzles that meet the approved requirements (8)
| World | Anchor | Required words | Financial / required |
|---|---|---|---|
| Credit | TERMS | TERMS / TERM / REST | 2 / 3 |
| Credit | REPAYMENT | REPAYMENT / TERM / APR / APY | 4 / 4 |
| Credit | AUTOPAY | AUTOPAY / APY / AUTO | 2 / 3 |
| Credit | CAPACITY | CAPACITY / APY / CITY | 2 / 3 |
| Money Basics | PAYMENT | PAYMENT / PAY / NET | 3 / 3 |
| Money Basics | REFUND | REFUND / FUND / RUN | 2 / 3 |
| Money Basics | PAYCHECK | PAYCHECK / PAY / CHECK | 2 / 3 |
| Banking | DEPOSITOR | DEPOSITOR / POSTED / POST | 2 / 3 |

Compliant puzzles per world: Credit 4 of 6, Money Basics 3 of 5, Banking 1 of 5, **Crypto 0 of 5, Investing 0 of 6**.

### Puzzles requiring owner approval (19), with the smallest change using only existing governed vocabulary
Each option below was checked to produce a legal, connected crossword. **None has been applied.**

| # | World | Anchor | Current words (financial / required, need) | Smallest change | Decision needed |
|---|---|---|---|---|---|
| 1 | Credit | CREDITOR | CREDITOR / CREDIT / DIRECT / EDITOR (2 / 4, need 3) | **Drop EDITOR** → CREDITOR / CREDIT / DIRECT (2 / 3). No new vocabulary. | Approve removing one ordinary word. |
| 2 | Money Basics | RECEIPT | RECEIPT / PRICE / PIECE / TIRE (2 / 4, need 3) | **Drop TIRE** → RECEIPT / PRICE / PIECE (2 / 3). No new vocabulary. | Approve removing one ordinary word. |
| 3 | Crypto | TOKEN | TOKEN / NOTE / TONE (1 / 3, need 2) | No Crypto term fits. Cross-world option: replace TONE with **NET** (Money Basics) → TOKEN / NET / NOTE. | Cross-world financial recognition, or new Crypto vocabulary. |
| 4 | Crypto | STAKE | STAKE / TAKE / SEAT (1 / 3) | Cross-world: **ASK** (Investing) → STAKE / ASK / TAKE. | Same. |
| 5 | Crypto | CHAIN | CHAIN / INCH / CHIN (1 / 3) | None available, even cross-world. | New anchor or new secondary financial term. |
| 6 | Crypto | WALLET | WALLET / WALL / TELL (1 / 3) | None available. | Same. |
| 7 | Crypto | MINER | MINER / MINE / REIN (1 / 3) | None available. | Same. |
| 8 | Credit | ACCOUNT | ACCOUNT / COUNT / AUNT (1 / 3) | None available. | Same. |
| 9 | Money Basics | BUDGET | BUDGET / BED / GET (1 / 3) | Cross-world: **DEBT** (Credit) → BUDGET / DEBT / BED. | Cross-world recognition. |
| 10 | Banking | NETWORK | NETWORK / WORK / NOTE (1 / 3) | Cross-world: **NET** (Money Basics), **OWNER** (Investing), or **TOKEN** (Crypto). | Cross-world recognition. |
| 11 | Banking | PASSWORD | PASSWORD / PASS / WORD (1 / 3) | Cross-world: **APR** (Credit) or **SWAP** (Crypto). | Cross-world recognition. |
| 12 | Banking | SECURE | SECURE / SURE / USER (1 / 3) | None available. | New anchor or secondary term. |
| 13 | Banking | RESERVE | RESERVE / SERVE / VERSE (1 / 3) | None available. | Same. |
| 14 | Investing | ASSET | ASSET / SEAT / EAST (1 / 3) | None available. | Same. |
| 15 | Investing | EQUITY | EQUITY / QUIET / QUITE (1 / 3) | None available. | Same. |
| 16 | Investing | GROWTH | GROWTH / THROW / ROW (1 / 3) | None available. | Same. |
| 17 | Investing | BROKER | BROKER / BROKE / ROBE (1 / 3) | None available. | Same. |
| 18 | Investing | CAPITAL | CAPITAL / TAIL / CLIP (1 / 3) | None available. | Same. |
| 19 | Investing | DIVIDEND | DIVIDEND / DIVIDE / DIVE / DINE (1 / 4, need 3) | None available (needs 2 more financial words). | Same. |

(Also verified legal layouts for the cross-world alternatives: TOKEN+NET, STAKE+ASK, BUDGET+DEBT, NETWORK+{NET, OWNER, TOKEN}, PASSWORD+{APR, SWAP}; and for CREDITOR+ORDER and RECEIPT+PEER, which I do **not** recommend over the simple removal.)

### Structural finding: the governed vocabulary cannot fill a compliant slate on its own
I searched every existing governed term as a potential anchor for a 3-word compliant puzzle (anchor plus two governed financial words that lay out). Indicative results: **Crypto 0**, Investing 1 (only by borrowing cross-world terms), Banking 5 (all cross-world), Money Basics 5, Credit 4. Only 2 anchors anywhere work with same-world terms alone (REPAYMENT in Credit and PAYMENT in Money Basics). Short financial words are simply too few and too long to fit inside a 5 to 9 letter anchor. **Crypto and Investing cannot reach compliance without new approved financial vocabulary, a different anchor set, or a rule change.** This needs your decision before any puzzle is touched.

### Why I changed none of them
`tests/schema-v3.test.js` records these 27 combinations as the approved-development set, and the instruction was not to replace anchors, vocabulary, definitions, or term IDs. Dropping a filler word touches no governed term, but it still changes an approved combination, so I listed it for approval instead of applying it.

---

## 5. Step 5: Browser verification (`127.0.0.1:8765/index.html?puzzles=v3`)

| Check | Result |
|---|---|
| Crossword grid appears | **Yes**: PAYMENT 11 cells, TOKEN a 3-word connected grid, in both viewports |
| 3+ required words in every compliant puzzle | **Yes**: all 8 have 3 or 4; also true for all 27 |
| Wheel accepts correct words | **Yes**: all 54 runs (tap with confirm tap, and swipe) |
| Required answers populate the grid | **Yes**: filled cells = total cells in every run |
| Completion rewards and definitions | **Yes**: PAYMENT showed the governed definition ("Money given to pay a bill, amount owed, or purchase.") and +91 coins / +21 XP, matching the existing formula (49 + 21 + 21 coins) |
| Daily login rewards still work | **Yes**: the card claimed +10 coins, XP unchanged, "Claimed today", from the real handler |
| Saves and mastery protected | **Yes**: with a synthetic existing-player save, settings, legacy puzzle histories, solved words, other worlds, and unknown fields were identical afterwards; XP, level, and coins never decreased; mastery records appeared only for the V3 financial answers just solved |
| Mobile (375 × 812) | Pass: green ribbon, connected grid, traced selection, readout hint "PAY — tap the last letter again to submit" |
| Desktop (1024 × 768) | Pass: orange "pending owner approval" ribbon on TOKEN, connected 3-word grid |
| Console errors | None |

Caveats: the browser is Chromium-based (no Safari/WebKit), and synthetic pointer events drive the wheel (not a physical finger). Screenshots sometimes caught the screen's fade-in frame; I read state through the page as well.

---

## 6. Test results

| Check | Result |
|---|---|
| Baseline at task start | 368 / 368 |
| Full suite now | **381 / 381** under `America/Los_Angeles`, `UTC`, `Asia/Tokyo`, `Pacific/Auckland` (+13 new) |
| `git diff --check` | Clean (it caught an extra blank line at the end of `word-game.css`, which I fixed) |
| Mutation tests | 7 of 7 deliberate breaks caught (retap helper, deferred-word flagging, each majority threshold, single-word allowance, wheel exactness, counting ordinary words as financial) |
| Governed fingerprints (21 files) | 19 identical; the 2 that differ are the code files I intentionally edited (`v3-puzzle-slate.js`: added validator; `wheel-interaction.js`: added helpers). **SPECS fingerprint identical**: 27 specs unchanged. Term, definition, Credit registry, and puzzle-bank files unchanged. |

New tests (`tests/v3-composition-and-acceptance.test.js`, 13 tests): rule table for 3/4/5 words, single/two/six-word rejection, anchor and wheel rules, bonus handling, slate pinned at 27, exactly 8 compliant / 19 pending (named), every required answer enterable by taps in three orders, the exact list of pending words, wrong words never complete slots, no double rewards across all 27 puzzles, runtime wiring, and "preview marker exists only under the V3 attribute."

---

## 7. Exact files modified

| File | Change |
|---|---|
| `src/wheel-interaction.js` | Added `isDeferredTarget` and `shouldSubmitOnRetap` |
| `src/v3-puzzle-slate.js` | Added `validateComposition` and `FINANCIAL_MINIMUM_BY_REQUIRED_WORDS`; **SPECS unchanged** |
| `word-game-app.js` | Confirm-tap wiring, pending hint, early mode marker, composition status and diagnostics |
| `word-game.css` | V3 preview ribbon (only under `data-finlit-puzzle-mode="v3"`), pending-hint style |
| `index.html` | Cache-bust stamp only (re-stamped by the project script) |
| `ios/App/App/public/*` (5 files) | Re-synced copies of the files above so the existing bundle-parity guard stays green (local files only; not built, signed, or released) |
| `tests/v3-composition-and-acceptance.test.js` | **New** |
| `FINLIT_QUEST_V3_CROSSWORD_ACCEPTANCE_REPAIR_REPORT.md` | **New** (this report) |

Not modified: any content, vocabulary, definition, term ID, Credit identity registry, puzzle bank, reward formula, save data, daily-reward logic, PR #4, or the checklist. The earlier uncommitted work in the tree is intact.

---

## 8. Decisions needed from you

1. **CREDITOR and RECEIPT:** approve dropping one ordinary filler word each (EDITOR; TIRE) to make both compliant with no new vocabulary.
2. **Cross-world financial terms:** may a governed term from another world (NET, ASK, DEBT, OWNER, TOKEN, APR, SWAP) count as the financial word in a puzzle? This decides puzzles 3, 4, 9, 10, 11 without new vocabulary.
3. **The 12 puzzles with no available fix** (CHAIN, WALLET, MINER, ACCOUNT, SECURE, RESERVE, ASSET, EQUITY, GROWTH, BROKER, CAPITAL, DIVIDEND): choose new approved secondary financial terms, replace the anchors, or change the rule for these worlds. **Crypto and Investing have no compliant puzzle at all today.**
4. Whether pending puzzles should keep appearing in the V3 preview (they do now, clearly marked) or be hidden until approved.
5. Whether the confirm tap and hint wording are acceptable ("tap the last letter again to submit").
6. Whether to keep the localhost preview running (it is, on `127.0.0.1:8765`, this Mac only).

---

## 9. Status

| Item | Status |
|---|---|
| Single-word display root cause found and reproduced | Done |
| Rejected-answer root cause found, reproduced, fixed, tested | Done |
| Composition rules executable and tested | Done |
| Browser verification (desktop and mobile) | Done |
| Full suite and diff-check | Pass |
| Composition revisions for 19 puzzles | **REQUIRES OWNER APPROVAL (not applied)** |
| Production activation, deployment, commit, push, merge | **NOT AUTHORIZED (not done)** |

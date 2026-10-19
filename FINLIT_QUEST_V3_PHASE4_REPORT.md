# FinLit Quest — V3 Phase 4: Final Puzzle Research and Victory Celebration

Date: 2026-10-16 · Local development only · Status: **awaiting owner approval**

Labels: **IMPLEMENTED** (in the working tree) · **TESTED** · **PROPOSED** (research only, nothing built) · **REQUIRES APPROVAL**.

No commit, push, merge or deployment. PR #4, `docs/V1_RELEASE_CHECKLIST.md` and real player saves were not touched. The 145-term registry, term IDs and definitions are unchanged. ACH and WORTH are **not** added anywhere. The final four puzzles are **not** implemented.

---

## 1. Puzzle compliance status — IMPLEMENTED / TESTED

Still **23 of 27** compliant. The 23 were re-validated after the LOB change (suite and a 27-puzzle browser run earlier this phase). The open four are CHAIN, WALLET, ASSET, GROWTH (revision 1, untouched).

## 2. LOB replacement — IMPLEMENTED / TESTED

- Confirmed ordinary words: **PLAIN, SOCK, READ, TUNE**.
- **COB → LOB** in the BLOCK puzzle. LOB is not governed vocabulary, is spellable from the BLOCK wheel, and `BLOCK / LOCK / LOB` lays out as a valid connected crossword with legal boundaries.
- BLOCK is now **revision 3** (`FQ-V3:crypto:BLOCK:R3`) so any earlier BLOCK:R2 completion is not inherited, the same rule used for every changed puzzle. 14 puzzles stay at R2, BLOCK is R3, 12 at R1.
- Ordinary words still pay 1 coin / 0 XP, with no learning object and no mastery record.
- No other ordinary word was introduced. The ordinary list is now: PLAIN, SOCK, READ, TUNE, LOB (plus the earlier-phase words).
- New `SPECS` fingerprint: `f44d39b44363c248`. Pinned tests updated with reasons commented in-file.

## 3. Research: the final four — PROPOSED / REQUIRES APPROVAL

### Findings (evidence)
- **No approved term can be spelled from CHAIN, WALLET, ASSET or GROWTH, and none of the four can sit inside another anchor's wheel.** Re-verified against all 145 terms.
- **No own-world alternative exists for Crypto or Investing.** Every unused Crypto anchor (NODE, COIN, MINT, POOL, LOCK, FORK, HASH, YIELD, LEDGER, PEER, SWAP, BURN, VAULT, MINER) and Investing anchor (SELL, SHARE, ISSUER, BOND, GAIN, LONG, BROKER, BEAR, ORDER, EQUITY, BULL, OWNER, VOTE, DIVIDEND, INDEX, CAPITAL) has **zero** approved partner words, so none can reach two financial words.
- **The schema already enforces own-world anchors.** A trial of INCOME as a Crypto-slot anchor failed with "Missing governed crypto term". A cross-world anchor is therefore a code and rule change, not a content swap.
- **Every world must keep at least 5 puzzles** (each playthrough draws 5). Crypto has exactly 5, Investing has 6.
- Unused **Money Basics** anchors do work as ordinary own-world puzzles (validated): SAVING, DEBIT, INCOME, DEPOSIT.

All candidate compositions below were built with the real `buildPuzzle` and `validateComposition` in a **scratch copy** (proposed terms appended to temporary vocabulary copies, nothing written to the repo).

### Candidate compositions

| # | Puzzle slot | Composition | Financial | Validation | Needs |
|---|---|---|---|---|---|
| 1 | CHAIN (Crypto) | CHAIN / **ACH** (Banking, proposed) / CHIN | 2 of 3 | valid | approve ACH |
| 1b | CHAIN | CHAIN / ACH / INCH | 2 of 3 | valid | approve ACH |
| 2 | GROWTH (Investing) | GROWTH / **WORTH** (Investing, proposed) / ROW | 2 of 3 | valid | approve WORTH |
| 2b | GROWTH | GROWTH / WORTH / THROW | 2 of 3 | valid | approve WORTH |
| 2c | GROWTH | GROWTH / WORTH / GROW | 2 of 3 | valid | approve WORTH |
| 3 | ASSET (Investing) | DEBIT / DEBT (credit) / BID (investing), as a **Money Basics** puzzle | 3 of 3 | valid | re-home approval |
| 3b | ASSET | SAVING / GAS (crypto) / GAIN (investing), Money Basics | 3 of 3 | valid | re-home approval |
| 4 | WALLET (Crypto) | INCOME / COIN (crypto) / COME, Money Basics | 2 of 3 | valid, but see below | re-home approval **and** a Crypto playthrough decision |
| 4b | WALLET | DEPOSIT / POSTED (banking) / DEPOT, Money Basics | 2 of 3 | valid | same as 4 |

Other available one-ordinary-word anchors (valid, from earlier research): INTEREST / NET / ENTER (Credit), plus APPLICANT, COSIGNER, ALERT, MANDATE, REMIT, SPREAD.

### Why WALLET is the hard one
No finance word can be spelled from WALLET, so it cannot stay. Re-homing it to Money Basics leaves **Crypto with 4 puzzles**, below its 5-per-playthrough requirement. The only ways forward are (a) allow a cross-world anchor in the Crypto slot (a rule change), (b) lower Crypto's playthrough size (a gameplay change), (c) add a new Crypto term (none is spellable from these letters), or (d) accept WALLET as a documented exception.

### Approval table

| Puzzle | Recommended | Fallback | Approvals needed | Effect |
|---|---|---|---|---|
| CHAIN | #1 CHAIN / ACH / CHIN | none without a rule change | **Approve ACH** (new Banking term, §4) | keeps Crypto at 5 |
| GROWTH | #2 GROWTH / WORTH / ROW | #3b SAVING / GAS / GAIN as Money Basics | **Approve WORTH** (new Investing term, §4) | keeps Investing at 6 |
| ASSET | #3 DEBIT / DEBT / BID as Money Basics | #3b SAVING / GAS / GAIN | **Approve re-homing** (Investing 6 → 5, Money Basics 5 → 6; ASSET would no longer be a V3 anchor) | no new vocabulary |
| WALLET | **no clean option**; keep as documented exception, or #4 with a rule change | #4b | **Choose (a)–(d) above** | otherwise 26/27 is the ceiling |

If you approve ACH, WORTH and the ASSET re-home but leave WALLET as an exception, compliance becomes **26 of 27**.

## 4. Proposed governed definitions — PROPOSED / REQUIRES APPROVAL (not added to the registry)

### ACH
| Field | Proposal |
|---|---|
| Permanent ID | `banking.ach` |
| Term | ACH (3 letters, first-solve 21 coins / 5 XP) |
| Definition | An electronic network that moves money between bank and credit union accounts, used for direct deposits and recurring bill payments. |
| Sources | CFPB, "What is an ACH transaction?" <https://www.consumerfinance.gov/ask-cfpb/what-is-an-ach-transaction-en-1065/> · Federal Reserve, Automated Clearinghouse Services <https://www.federalreserve.gov/paymentsystems/fedach_about.htm> |
| Verification note | The CFPB describes ACH as electronic transfers between banks and credit unions used for direct deposit of paychecks and recurring bill debits. The Federal Reserve describes it as a nationwide network for batches of electronic credit and debit transfers. The wording is a plain-language normalization, not a quotation. |
| Educational relevance | **Strong.** It is the system behind existing Banking terms (MANDATE, AUTOPAY, PAYCHECK, DEPOSITOR, POSTED) and answers "how does money actually move". |
| Fit | A Crypto puzzle with a Banking term contrasts chains with bank rails, which suits the cross-world design. |

### WORTH
| Field | Proposal |
|---|---|
| Permanent ID | `investing.worth` (alternative home: `moneybasics.worth`) |
| Term | WORTH (5 letters, first-solve 35 coins / 8 XP) |
| Definition | The value of something, or the amount by which what a person owns is greater than what they owe, as in net worth. |
| Sources | Investor.gov, "Figure Out Your Finances" <https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/figure-out-your-finances> · SEC, accredited-investor net worth standard <https://www.sec.gov/resources-small-businesses/small-business-compliance-guides/accredited-investor-net-worth-standard> |
| Verification note | These sources define **net worth** as assets minus liabilities. "Worth" on its own is not defined as a standalone finance term, so the wording is an explicit normalization. |
| Educational relevance | **Moderate, and weaker than ACH.** It teaches net worth and pairs with NET, ASSET and OWNER, but it is a general word, and the existing VALUE definition already uses "worth". |

Neither term exists in any governed file today (checked). Adding them would make the registry 146 or 147 terms, which the 145-term tests currently pin, so approval also means updating those pins.

## 5. Celebration implementation — IMPLEMENTED / TESTED

Enhances the existing `celebrate()` flow rather than adding a parallel system.

- **New `src/victory-celebration.js`** (about 150 lines, no libraries, no assets). Pure planning functions plus a small controller.
- **Trigger:** when all required words are found. It is started from `wgShowPuzzleComplete`, after rewards are already granted, **once per puzzle render**, and only for a **newly completed** puzzle (completion history is captured when the puzzle renders). A replay shows the readable panel with the ordinary per-word feedback, no big celebration, no sound.
- **Effects (≈2.6 s):** 44 confetti pieces, a coin cascade (4–12 gold coins flying from the reward to the header coin balance, which then pulses), 8 brief dollar symbols, and a quiet synthesized chime with a few coin pings (Web Audio, gain capped at 0.07, nothing over 3 s). Everything is CSS-transform animation on a single `aria-hidden`, `pointer-events:none` layer that removes itself.
- **Actual earned coins and XP** are shown in the existing panel (`+91 / +21` in the test run, matching the real balance change exactly) and spoken in the announcement.
- **Skip:** a "Skip animation" button (shown only while it runs), the Escape key, or simply pressing Next Puzzle. The effects never block taps.
- **Sound control:** "🔊 Sound on / 🔇 Sound off" toggle in the completion panel, saved under its own key `finlitQuest.victorySound`. Default is on (quiet, only after the player's own gesture). Saves are never written.
- **Existing per-word confetti** no longer doubles up on the final word and now also honours reduced motion.
- **Reward safety:** the module has no access to the save, reward code or learning engine (tests assert it). No reward formula changed. Replays award 0.

## 6. Sound and accessibility verification — TESTED

- **Reduced motion:** with `prefers-reduced-motion`, no layer is drawn at all and the panel and announcement still show the real amounts (browser-verified by forcing the media query: 64 coins / 14 XP shown and credited). CSS also hides the layer under that media query.
- **Announcement:** a polite live region says "Puzzle solved! You earned N coins and M XP." (replay: "Puzzle solved again. You earned 0 coins and 0 XP.").
- **Keyboard:** Skip and Sound are real buttons; Escape skips; Next Puzzle keeps initial focus.
- **Sound:** mute persists and survives storage being blocked (safe fallback); a muted player never even creates an audio context; a missing or throwing audio API cannot break the celebration; a replay is silent.
- **Performance:** at most 64 short-lived DOM nodes, no timers beyond one, audio context closed on skip or finish.

**Drag fix (your report during this phase) — IMPLEMENTED / TESTED.** While dragging across letters the readout said "tap the last letter again to submit", which is impossible mid-drag. The drag already submitted on lift, so the misleading hint is now shown **only for tapped words**. Browser-verified on PASS inside PASSWORD: the readout shows PA, PAS, PASS while dragging and PASS is accepted when the finger lifts.

## 7. Mobile layout verification — IMPLEMENTED / TESTED

- **Cause:** at 390 px and below `.wg-currencies{min-width:0}` let the container shrink to 118 px while its three chips stay about 190 px, so the Gems chip slid under the Level card (measured at 375 px).
- **Fix (one CSS declaration):** `.wg-currencies{min-width:max-content}` in the existing 390 px media rule. The Level card now wraps to its own row.
- **Measured** with element rectangles: **320, 375, 390, 534 (pane default), 768 and 1280 px** all report zero overlaps, no clipped values and no horizontal overflow.
- **Observation, not changed:** at **320 px** the world title ("CREDIT FOUNDATIONS") overlaps the "PUZZLES COMPLETE" counter. It is a different element, so I left it per "do not redesign unrelated elements". Say if you want it fixed.

## 8. Inventory update — IMPLEMENTED

The "In V3 slate" column of `FINLIT_QUEST_V3_145_TERM_INVENTORY.md` was regenerated from the current specs (44 terms appear; 25 cells changed, e.g. LOCK → BLOCK:secondary, NET → TOKEN, PAYMENT, CONVERT and RETURN secondary). A diff confirmed no other column, term, ID or definition changed. A one-line refresh note was added at the top.

## 9. Stray file — inspected, **not deleted**

`-iname "*release*" | head -30q` (project root, untracked, 12,969 bytes, dated Aug 19). Its contents are the **help screen of the `less` pager** ("SUMMARY OF LESS COMMANDS"). Origin: an accidental shell redirect of a mistyped `find … | head -30q` command into a file whose name is that command text. It contains no project data. Safe to delete on your word.

## 10. Automated test results — TESTED

- Full suite: **420 tests, 420 pass, 0 fail** in America/Los_Angeles, UTC, Asia/Tokyo and Pacific/Auckland (baseline was 405; +13 celebration tests, +1 drag-hint test, +1 header test, none removed).
- `git diff --check`: clean.
- Bundle parity guard passes after the local `stamp-cache-bust` → `build-www.sh` → `cap sync ios` resync. The guard now also covers `src/victory-celebration.js` and `word-game.css`, and the build script ships the new module.
- Browser run on a synthetic save (cleared afterwards): first completion fired one layer (44 confetti, 5 coins, 8 dollars, aria-hidden, no pointer events); real coins/XP equalled the displayed values; skip removed it instantly; mute and unmute persisted; **replay awarded 0 coins / 0 XP and drew no effects**; reduced motion drew none. Daily login was not re-run in the browser this phase (the last live check, +10 coins / 0 XP, was in Phase 3); its code is untouched and the existing daily-reward tests all pass.
- No test was weakened; the COB/LOB, fingerprint and revision pins were updated with reasons.

## 11. Exact files modified — IMPLEMENTED

Source: `src/v3-puzzle-slate.js` (BLOCK: LOB, revision 3) · **new** `src/victory-celebration.js` · `word-game-app.js` (completion wiring, drag-hint fix) · `app.js` (reduced-motion guard in `celebrate`) · `index.html` (script tag, panel markup, refreshed cache-bust stamp) · `word-game.css` (celebration styles, header fix) · `scripts/build-www.sh` (ships the new module).

Tests: **new** `tests/victory-celebration.test.js` · **new** `tests/mobile-header-layout.test.js` · `tests/bundle-parity.test.js` · `tests/v3-cross-world-composition.test.js` · `tests/v3-composition-and-acceptance.test.js` · `tests/schema-v3.test.js` · `tests/non-financial-terminology.test.js`.

Docs: `FINLIT_QUEST_V3_145_TERM_INVENTORY.md` (slate column only) · **new** `FINLIT_QUEST_V3_PHASE4_REPORT.md`.

Regenerated by the bundle resync (not hand-edited): `ios/App/App/public/*` copies, `www/`.

## 12. Remaining owner decisions — REQUIRES APPROVAL

1. **ACH** (`banking.ach`, definition in §4): approve, edit or reject. Unlocks CHAIN.
2. **WORTH** (`investing.worth`, definition in §4): approve, edit or reject. Unlocks GROWTH. Weaker educationally than ACH.
3. **ASSET:** approve re-homing to a Money Basics DEBIT / DEBT / BID puzzle (or SAVING / GAS / GAIN), which retires ASSET as a V3 anchor and changes world puzzle counts (Investing 5, Money Basics 6).
4. **WALLET:** choose between (a) cross-world anchors in the schema, (b) a smaller Crypto playthrough, (d) a documented exception. Without one of these, 26/27 is the ceiling even if everything else is approved.
5. **Sound default:** currently on (quiet, after a player gesture). Say if you want it off by default.
6. **Stray file:** delete `-iname "*release*" | head -30q`? And fix the 320 px title overlap in the world header?
7. **BLOCK revision:** I used R3 for the COB → LOB change to keep the "changed puzzle gets a new revision" rule. Tell me if you would rather keep R2, since V3 is not live.

Stopping here as instructed. No commit, push, merge or deployment has been made.

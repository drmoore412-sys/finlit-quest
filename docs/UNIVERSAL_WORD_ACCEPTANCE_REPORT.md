# Approved-Term Acceptance & Currency Bonus — Final Verification (2026-11-18)

Status: implemented locally, uncommitted. Supersedes the earlier version of this report, which described a 42,754-word general-English vocabulary; that expansion has been removed.

## Scope as implemented
- Vocabulary = the approved curriculum terms that fit a wheel (196 of the 211; the other 15 are over 9 letters). No general English, abbreviations, reserve terms or supplements.
- Any approved term from any world is accepted by any wheel that can spell it (exact letter counts, minimum 3 letters). Required answers are classified first, so rewards, XP, coins and progression are unchanged.
- Currency bonus: one designated ISO 4217 code per puzzle from the approved 20, shown with its full currency name, once per puzzle, no coins or XP, never required.
- Tap-input logic restored to the original (signatures and behaviour); only the bonus lookup now also recognises the designated currency code and approved terms.

## Verified results (real submit logic, 61 released puzzles, 13 worlds)
- Approved terms checked: 211 (127 distinct terms are spellable in at least one released puzzle).
- Eligible term/puzzle combinations: 270. Accepted: 270. Incorrectly rejected: 0.
- All 270 were already required answers (the exhaustive-answer rule from Phase 2b); the vocabulary does not change any released puzzle's behaviour for approved terms. It matters only for puzzles without an answer list.
- FEE, FEES, PAY, NET, TERM, COIN, APR, APY, ATM, PAYMENT, AUTOPAY: approved terms, accepted wherever spellable.
- FREE, COINS, PAYOUT (and NETPAY, ARP): not approved terms, so not accepted. Adding them needs approval.
- Currency bonuses verified: 41 puzzles; 20 have no approved code that fits the wheel (puzzle ids and wheels are listed in the test output and in `content/currency-bonus-v1.json` under `withoutCode`). The test proves, for each, that none of the 20 codes can be spelled from its wheel.
- Tests: 793 total, 789 pass, 4 fail (pre-existing missing research fixtures). No new failures.

## Not verified
Browser and physical-device behaviour were not tested.

## Addendum 2026-11-18 — owner decision: earlier approvals stand

- **Approved gameplay words:** FREE, COINS, PAYOUT and NETPAY are accepted as optional bonus words (global list in `src/wheel-interaction.js`, beside DUE) wherever the wheel can spell them. They are not curriculum terms: the 211 approved terms are unchanged. Exact wheels: FREE 2 (FREELANCE, REFINANCE), COINS 1 (EXCLUSION), PAYOUT 1 (AUTOPAY), NETPAY 2 (PAYMENT, REPAYMENT); all accepted, 0 coins, 0 XP, once per puzzle.
- **Currency codes:** the 20-code automatic pool is unchanged, and so are its 41 assignments. Nine further approved codes are used only on ten designated puzzles (`DESIGNATED` in `src/currency-bonus.js`): FREELANCE AFN, BREAKEVEN ERN, BUDGET BDT, GROWTH HTG, AUTOPAY AOA, TAXFILING XAF, LIABILITY ALL, CASHVALUE UAH, PROOFLIKE PKR, MELTVALUE ALL. Coverage is **51 of 61**.
- **Uncovered (wheels unchanged):** SAVING, RECEIPT, PAYCHECK, STOCK, MARKET, TERMS, CAPACITY, CHAIN, BLOCK, RETAIL. None of the 29 approved codes can be spelled from these wheels.
- **Earlier sections:** the figures above (41 assigned / 20 without; FREE, COINS, PAYOUT, NETPAY rejected) are superseded by this addendum.
- **Suite:** 790/794. The 4 failures are the pre-existing missing research fixtures.

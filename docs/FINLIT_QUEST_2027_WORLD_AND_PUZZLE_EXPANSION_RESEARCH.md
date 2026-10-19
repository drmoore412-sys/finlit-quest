# FinLit Quest 2027 — World and Crossword Expansion Research

**Date:** 2026-10-18  
**Status:** PARTIAL BASELINE COMPLETE — OWNER REVIEW REQUIRED — IMPLEMENTATION NOT AUTHORIZED

> **Vocabulary integration update:** The four source documents previously listed as missing were supplied and integrated later on 2026-10-18. Use `docs/FINLIT_QUEST_2027_VOCABULARY_INTEGRATION_REPORT.md` and the current vocabulary-master JSON for authoritative expansion counts. The baseline findings below are retained as the pre-integration snapshot.

This package inventories the five playable worlds, preserves all governed vocabulary available locally, screens the existing 27-puzzle proposal against the new 2027 rules, and supplies the small set of unique nine-letter candidates that can currently pass every gate. It does not add a world, activate a puzzle, edit a definition, or change gameplay.

## Executive finding

The current repository cannot yet support 15–20 new-rule puzzles per world without additional approved vocabulary. The five worlds contain **27 implemented puzzles**. Reaching 15 per world requires **48 additional implemented puzzles**; reaching 20 requires **73**. The pending 27-puzzle proposal would bring the total to 54, still 21 short of the 15-per-world minimum, and only **4 of its 27 records** satisfy all of the newly supplied 2027 constraints (nine wheel letters, every answer 4–9 letters, and at least three financial terms). After removing near-duplicate compositions and a CONFIRMED candidate that omits the eligible INCOME term, **two earlier candidates remain suitable for continued review**. This package adds **one new unique strict candidate**, REPAYMENT.

None of the 27 active puzzles passes every new 2027 rule. They remain protected, working, grandfathered content; this report does not propose rewriting or deleting them.

## Missing source documents

The following named inputs were not found in the repository, Downloads, or the supplied attachment:

- `FinLit_Quest_2027_Remaining_Worlds_Backlog.md`
- `FinLit_Quest_2027_Vocabulary_Master_Backlog.md`
- `FinLit_Quest_AI_and_Coins_World_Vocabulary.md`
- `FinLit_Quest_Money_Basics_2027_and_Coins_Vocabulary.md`

Their contents were not reconstructed. Terms explicitly named in the task brief are preserved separately as **brief mentions awaiting source reconciliation**, not treated as approved terms.

## A. World inventory

| World | Implemented puzzles | More to 15 | More to 20 | Runtime terms | Owner-approved terms |
|---|---:|---:|---:|---:|---:|
| Money Basics | 5 | 10 | 15 | 36 | 36 |
| Credit Foundations | 6 | 9 | 14 | 42 | 42 |
| Crypto Foundations | 5 | 10 | 15 | 20 | 24 |
| Banking Basics | 5 | 10 | 15 | 30 | 30 |
| Investing Basics | 6 | 9 | 14 | 27 | 27 |

### Proposed themes

- **Money Basics:** earning and take-home money; payments and transfers; budgeting and cash flow; saving and inflation; modern payment tools.
- **Credit Foundations:** borrowing costs; credit reports and bureaus; repayment and delinquency; fraud protection and freezes; comparing loan terms.
- **Crypto Foundations:** networks and nodes; transaction confirmation; wallets and custody; mining and staking; scams and risk.
- **Banking Basics:** deposits and posting; account access; payment rails; liquidity and reserves; identity and account security.
- **Investing Basics:** ownership and markets; return and dividends; diversification and liquidity; order types; long-term risk and growth.

The additional topic areas remain organizational recommendations only. Coins may fit partly under Money Basics and Investing; AI/technology, real estate, taxes, insurance, business, digital income, retirement, financial safety, careers, and economics need curriculum and governance review before any new world is created.

## B. Vocabulary master list

The machine-readable master list is at `staging/research/expansion/2026-10-18/finlit-quest-2027-vocabulary-master.json`. It contains **159 owner-approved permanent identities**: 155 implemented/supplemental records plus four CAL-0008 Crypto identities that are approved but not implemented. Definitions are copied exactly from their controlling records.

| World | Total approved IDs | Crossword 4–9 | Study 10+ | Short 1–3 |
|---|---:|---:|---:|---:|
| Money Basics | 36 | 33 | 0 | 3 |
| Credit Foundations | 42 | 25 | 15 | 2 |
| Crypto Foundations | 24 | 23 | 0 | 1 |
| Banking Basics | 30 | 28 | 0 | 2 |
| Investing Basics | 27 | 24 | 0 | 3 |

Task-brief vocabulary that does not resolve to a permanent identity is preserved as a non-approved research queue (170 unique world/term mentions). Company and platform names are stored as context only; they are not classified as financial concepts.

## 2027 compatibility of existing content

- Active puzzles: 27. Wheel exactly nine: 3. All answers 4–9: 10. At least three financial terms: 6. Pass all three: **0**.
- Pending 27-puzzle proposal: 27. Wheel exactly nine: 8. All answers 4–9: 7. At least three financial terms: 27. Pass all three: **4**.
- The old proposal remains unchanged. This report is a new compatibility layer, not a rewrite of the October 17 evidence.

## C. Nine-letter puzzle candidates

Only the following unique candidates should remain in the current owner-review queue. All pass the exact multiset, crossing, separation, contained-word, governed-identity, financial-majority, reward-protection, and engine-acceptance checks, plus the new nine-letter and 4–9-answer rules. Ranking occurs only after validation.

### RESEARCH-2027-MB-REPAYMENT-01 — REPAYMENT

- World: **Money Basics**
- Status: **newly-generated-research-candidate / pending owner review / not implemented**
- Theme: Earning, borrowing cost, and repayment
- Difficulty: Advanced
- Wheel: **REPAYMENT** (9 letters)
- Required answers (5): **REPAYMENT, PAYMENT, EARN, RATE, TERM**
- Ordinary support: None
- Strict 2027 validation: **PASS**
- Valid layouts found: 3
- Duplicate of active composition: No
- Duplicate of earlier proposal: No

Financial identities:

- **REPAYMENT** — `credit.repayment` (Credit Foundations)
- **PAYMENT** — `moneybasics.payment` (Money Basics)
- **EARN** — `moneybasics.earn` (Money Basics)
- **RATE** — `moneybasics.rate` (Money Basics)
- **TERM** — `credit.term` (Credit Foundations)

All eligible governed financial terms from this wheel: REPAYMENT, TERM, PEER, EARN, PAYMENT, RATE

Eligible but unused: PEER (`crypto.peer`)

```text
· · · · · · · · · · R
· · · T · E · · · · A
· · R E P A Y M E N T
· · · R · R · · · · E
P A Y M E N T · · · ·
```

Proposed comprehension check: Which term describes the process of paying a debt back?

### EXPANSION-2026-10-17-BK-01 — DEPOSITOR

- World: **Banking Basics**
- Status: **existing-proposal-carried-forward / pending owner review / not implemented**
- Theme: Deposits and posted transactions
- Difficulty: Intermediate
- Wheel: **DEPOSITOR** (9 letters)
- Required answers (4): **DEPOSITOR, DEPOSIT, POSTED, POST**
- Ordinary support: POST
- Strict 2027 validation: **PASS**
- Valid layouts found: 3
- Duplicate of active composition: No
- Duplicate of earlier proposal: No

Financial identities:

- **DEPOSITOR** — `banking.depositor` (Banking Basics)
- **DEPOSIT** — `moneybasics.deposit` (Money Basics)
- **POSTED** — `banking.posted` (Banking Basics)

All eligible governed financial terms from this wheel: DEPOSITOR, POSTED, DEPOSIT

Eligible but unused: None

```text
· D · P · · · · ·
D E P O S I T O R
· P · S · · · · ·
P O S T E D · · ·
· S · · · · · · ·
· I · · · · · · ·
· T · · · · · · ·
```

Proposed comprehension check: What do you call a person or organization that keeps money on deposit at a bank?

### EXPANSION-2026-10-17-CX-01 — CONFIRMED

- World: **Crypto Foundations**
- Status: **existing-proposal-carried-forward / pending owner review / not implemented**
- Theme: Transaction confirmation and network participants
- Difficulty: Advanced
- Wheel: **CONFIRMED** (9 letters)
- Required answers (5): **CONFIRMED, INCOME, NODE, COIN, MINER**
- Ordinary support: None
- Strict 2027 validation: **PASS**
- Valid layouts found: 3
- Duplicate of active composition: No
- Duplicate of earlier proposal: No

Financial identities:

- **CONFIRMED** — `crypto.confirmed` (Crypto Foundations)
- **INCOME** — `moneybasics.income` (Money Basics)
- **NODE** — `crypto.node` (Crypto Foundations)
- **COIN** — `crypto.coin` (Crypto Foundations)
- **MINER** — `crypto.miner` (Crypto Foundations)

All eligible governed financial terms from this wheel: COIN, CONFIRMED, MINER, NODE, INCOME

Eligible but unused: None

```text
· · · · · M · · · ·
· · C · · I · N · ·
· · O · I N C O M E
· · I · · E · D · ·
C O N F I R M E D ·
```

Proposed comprehension check: A blockchain transaction has been accepted through network consensus. What is its status?


### Candidate disposition notes

- The REPAYMENT wheel can also form PEER. Five required answers is the current maximum, so PEER is recorded as eligible but unused rather than hidden.
- The DEPOSITOR wheel's only governed 4–9 financial terms are DEPOSITOR, DEPOSIT, and POSTED; all three are included.
- The CONFIRMED wheel's governed 4–9 financial terms are CONFIRMED, INCOME, NODE, COIN, and MINER; all five are included.
- The existing Money Basics DEPOSITOR proposal is a near-duplicate of the Banking proposal and is not recommended as a second quiz.
- The second CONFIRMED proposal omits eligible INCOME even though a valid five-term layout exists, so it is not recommended.
- No Credit or Investing composition can currently pass the complete new rules without new approved vocabulary.

## D. Flashcard and study vocabulary

The governed 10+ letter collection is at `staging/research/expansion/2026-10-18/finlit-quest-2027-flashcard-vocabulary.json`. It preserves exact approved definitions and adds clearly marked **proposed** examples, related terms, questions, answers, and difficulty metadata for owner review. No study feature was implemented.

| Term | Exact governed definition | Proposed practical example | Difficulty |
|---|---|---|---|
| ACCELERATION | Requiring the full outstanding amount to become due. | After a qualifying default, a contract may allow the lender to require the entire outstanding balance. | Intermediate |
| AFFORDABILITY | Whether payments fit within available income and obligations. | Before accepting a car loan, a borrower compares the payment with monthly income and existing bills. | Advanced |
| AMORTIZATION | Repayment through scheduled payments over time. | A fixed monthly mortgage payment gradually pays interest and reduces principal over the loan term. | Intermediate |
| CAPITALIZATION | Adding certain unpaid interest or charges to principal. | Unpaid interest is added to a loan balance, so future interest may be calculated on a larger principal. | Advanced |
| COLLATERAL | Property pledged to support repayment. | A financed vehicle may serve as property supporting repayment of the auto loan. | Intermediate |
| COLLECTION | Efforts to recover an unpaid obligation. | A creditor or collector contacts a borrower to recover a past-due obligation. | Intermediate |
| CREDITWORTHINESS | Assessment of ability and likelihood to repay. | A lender considers payment history, debts, and income when evaluating whether a borrower is likely to repay. | Advanced |
| DELINQUENCY | Past-due payment status. | A required loan payment passes its due date without being paid. | Intermediate |
| DISBURSEMENT | Release of loan funds. | After a loan closes, the lender releases the approved funds to the borrower or seller. | Intermediate |
| DISCLOSURE | Required or provided information about terms and cost. | A borrower reviews a document showing the loan's rate, fees, and repayment terms before signing. | Intermediate |
| FORECLOSURE | A legal process involving property securing a mortgage debt. | A mortgage lender begins the legal process involving a home that secures an unpaid mortgage debt. | Intermediate |
| OBLIGATION | A duty to repay or perform under an agreement. | A borrower signs a loan agreement and must make the promised monthly payments. | Intermediate |
| PREPAYMENT | Paying part or all of a loan early. | A borrower pays extra principal and finishes a loan before the scheduled final payment. | Intermediate |
| REPOSSESSION | Taking secured property after default under applicable rules. | After a secured auto loan defaults, the lender may take the vehicle under applicable rules. | Intermediate |
| UNDERWRITING | The process used to evaluate an application and risk. | A lender reviews income, debts, and credit history before deciding whether to approve an application. | Intermediate |

Long-form terms named only in the task brief—such as STABLECOIN, BLOCKCHAIN, CREDIT REPORT, PERSONAL LOAN, CAPITAL GAINS TAX, SOCIAL SECURITY, BENEFICIARY, DEDUCTIBLE, WHITE LABEL, DOMAIN NAME, and FINANCIAL INDEPENDENCE—remain in the brief-only research queue until the missing source records or new term-specific evidence are supplied. They were not assigned IDs or definitions here.

## E. Expansion status

- **Implemented:** 27 protected active puzzles; 155 implemented governed/supplemental term identities.
- **Existing proposals:** 27 October 17 puzzle records remain pending owner review and unimplemented. Two unique records continue to meet the stricter 2027 rule set.
- **New candidate:** one unique REPAYMENT composition, pending owner review and unimplemented.
- **Approved but not implemented vocabulary:** four Crypto CAL-0008 terms (ADDRESS, CUSTODY, SCAM, CONFIRMED).
- **Awaiting review:** every brief-only term without a permanent identity; all proposed examples, questions, and difficulty labels.
- **Long-form study:** 15 governed Credit terms are packaged now; additional brief-only long terms await source reconciliation.

## Recommended phased next work

1. **Recover the four missing 2027 source files.** Reconcile their exact terms, definitions, sources, classifications, and duplicates into the master list.
2. **Approve vocabulary before chasing puzzle counts.** Prioritize nine-letter anchors that can form at least two other approved 4–9-letter financial terms. Do not approve a term solely because it helps a crossword.
3. **Regenerate candidates world by world.** Enforce nine wheel letters, 4–9-letter answers, at least three financial terms, exhaustive wheel-term discovery, strict layouts, and duplicate rejection.
4. **Owner review.** Decide the three candidates in this report and separately review new definitions, clues, comprehension questions, and world placement.
5. **Only after explicit implementation authorization**, export selected records through the governed candidate pipeline without changing permanent identities or existing puzzles.

## Owner decisions needed

- Confirm whether the exact-nine-letter rule applies only to future puzzles or should eventually trigger a separately reviewed migration of grandfathered content.
- Supply the four missing 2027 vocabulary/backlog files.
- Approve, revise, or reject the three candidate records; approval still does not authorize runtime implementation.
- Decide whether the four CAL-0008 Crypto additions may participate in expansion before the dedicated Crypto controlling governance record is completed.
- Decide whether Coins and AI & Technology are future worlds, categories inside existing worlds, or study-only modules.

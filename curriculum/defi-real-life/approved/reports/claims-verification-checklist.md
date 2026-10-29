# DeFi in Real Life — financial-claims verification checklist (DRAFT, nothing here is verified)

Date: 2026-10-28 · Source: `claims-register.json` (40 entries: 4 VERIFIED, 36 open) · Rule: a journey is releasable only when every entry for it (and for "all") is VERIFIED or WAIVED by a recorded approval. No entry was upgraded or waived in this pass.

How to close an item: find a primary source, record URL, publisher, retrieval date and the exact supporting sentence, then either (a) VERIFY the claim as worded, (b) change the wording to match the source (text-only version), or (c) mark the item as a clearly labeled fictional assumption and request a WAIVED decision.

## Tier 1 — real-world rules or protections a player could act on (verify first; 11)
| # | ID | Journeys | Claim to verify | Primary source to use |
|---|---|---|---|---|
| 1 | dana.open04 | all (disclaimer on every screen) | FDIC limit ($250,000); vault and stablecoin balances are not insured | FDIC |
| 2 | b1.claim02 | Zoe | Tax effect of selling ETH or a vault position (none modeled) | IRS digital-asset guidance |
| 3 | b1.claim07 | Jules | Taxes on selling or lending against ETH | IRS digital-asset guidance |
| 4 | b1.claim13 | Marcus | Tax reserve, estimated-tax schedule, USDC taxation, deductibility | IRS; entity-type rules |
| 5 | dana.open05 | Dana | Taxes on ETH sales, loss deductibility, stablecoin yield, loan interest | IRS digital-asset guidance |
| 6 | dana.open01 | Dana | Revised Loan Estimate rules; what restarts the three-day Closing Disclosure wait; whether the story's cost increase is permitted | CFPB TRID guidance, Regulation Z |
| 7 | dana.open02 | Dana | Lender source-of-funds and seasoning rules for crypto and large deposits | Fannie Mae / Freddie Mac selling guides, CFPB |
| 8 | b1.claim09 | all | Credit-card cost (2% a month, about 26.8% APR) and late-fee rules | CFPB, typical card terms |
| 9 | b1.claim05 | Zoe | Card advance and late-fee mechanics; whether a card can fund a deposit by bank transfer | Issuer terms, CFPB |
| 10 | dana.open07 | Dana | Wallet-security statements in D2 and the four-action ladder | Wallet-vendor and security-agency guidance |
| 11 | dana.open09 | Dana | Re-underwriting after a loan or other new debt | Lender guidance |

## Tier 2 — real-world prices, practices and plausibility assumptions (13)
b1.claim01 (Zoe: on-chain sale settlement time) · b1.claim03 (Zoe: sale cost, 0.5% + $19) · b1.claim04 (Zoe: landlord split and fee) · b1.claim06 (Marcus: recordkeeping need) · b1.claim10 (Zoe: school payment plan) · b1.claim11 (Maya: pay, tax saving, match, reserve target) · b1.claim12 (Jules: illustrative growth, premium) · b1.claim14 (Elena: leave pay, medical plan, childcare, gift tax) · dana.open03 (moving costs outside Cash to Close) · dana.open06 (student-loan interest convention) · dana.open08 (typical down payment, closing and moving costs) · dana.open10 (three-months-of-essentials emergency target) · dana.m7 (WAIVED 2026-10-28: invented provider names removed under the Educational Terminology Standard, so no collision check applies).

## Tier 3 — fictional or modeling choices: no outside fact to verify, needs an owner decision (12)
- Fictional, must stay labeled fictional (6): b1.claim08 (lending protocol terms as a comparison), dana.f1 to dana.f5.
- Model choices awaiting confirmation (6): dana.m1 (0% on insured savings, understates D1 B), m2 ($250 floor), m3 (closing on the last day of month 24), m4 (21,000 vault takes about 12 weeks), m5 (ETH baseline $2,400), m6 (50% "manageable" line is a scoring simplification, not a safety level).

## Already VERIFIED (4, CFPB, checked in the Dana v0.4 research and not re-run since)
dana.v1 to dana.v4 (Closing Disclosure timing; Cash to Close; Loan Estimate is an estimate; lenders need fund-source documentation). Recommend a re-check of these four against current CFPB pages before release because the rules can change.

## Suggested order of work
1. Tier 1 items 1 to 5 (insurance and tax statements appear in several journeys and the app-wide disclaimer).
2. Tier 1 items 6 to 11 (Dana's mortgage-process and security statements; card terms).
3. Tier 2 in journey order, then the Tier 3 owner decisions (waive as fictional, or change wording).
Estimated unknown: time per item depends on source availability; confidence that Tier 1 wording is correct as written is LOW until checked (no primary source consulted in this pass).

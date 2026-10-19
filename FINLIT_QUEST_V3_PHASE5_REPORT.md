# FinLit Quest — V3 Phase 5: Final Four Puzzles and Celebration Verification

Date: 2026-10-16 · Local development only · Status: **awaiting owner approval**

Labels: **IMPLEMENTED** (in the working tree) · **TESTED** · **PROPOSED** (research, nothing built) · **NOT APPROVED** (needs an owner decision before any work).

No commit, push, merge or deployment. PR #4, `docs/V1_RELEASE_CHECKLIST.md` and real player saves were not touched. The 145-term registry is unchanged. **ACH and WORTH are not vocabulary and are not in any repo file.** **None of the four proposed puzzles is implemented.** BLOCK stays at R3.

---

## 1. Current puzzle compliance — IMPLEMENTED / TESTED

Unchanged: **23 of 27** compliant, CHAIN / WALLET / ASSET / GROWTH open (revision 1, untouched). World structure preserved: **Crypto 5, Credit 6, Money Basics 5, Banking 5, Investing 6**.

**Note on your brief:** it says Investing should hold 5, but the approved V3 structure has Investing at 6 (as Credit does). You also said not to remove an existing puzzle to force a total, so I preserved 6 and every proposal below keeps it. Say if you actually want Investing at 5.

## 2–5. The four proposals — PROPOSED / NOT APPROVED

All four were built with the real engine (`buildPuzzle`, `validateComposition`, `validateV3Puzzle`, the crossword solver and `hasPrefixConflict`) in a **scratch copy**. That copy accepts an optional `anchorFrom` on a spec; the repo does not. Proposed terms were appended to temporary vocabulary copies only.

Rule **FLQ-V3-CROSS-WORLD-ANCHOR-001** was applied for research only. For every proposal: the anchor is in the approved vocabulary (or is the proposed term, flagged), keeps its origin ID and governed definition, the puzzle has 3 required words, financial words are the majority, the crossword is connected and valid, and rewards and mastery cannot duplicate (verified in §7).

### CHAIN — keep the anchor, add ACH
| | |
|---|---|
| Original anchor / world | CHAIN, Crypto (`crypto.chain`) |
| Replacement anchor | none needed |
| Proposed puzzle | `FQ-V3:crypto:CHAIN:R2` — **CHAIN / ACH / CHIN** |
| Financial terms | CHAIN (anchor, `crypto.chain`), **ACH** (secondary, cross-world from Banking, `banking.ach`, **NOT APPROVED**) |
| Ordinary word | CHIN (INCH is an equal alternative) |
| Wheel | A C H I N |
| Financial majority | 2 of 3 (minimum 2): **met** |
| Layout (valid, connected) | `C H A I N` across; ACH down from the A; `C H I N` across below, sharing the H |
| Rewards (first discovery, once globally) | CHAIN 35 coins / 8 XP; ACH 21 / 5; CHIN 1 coin / 0 XP |
| Educational relevance | **Strong.** The blockchain ledger next to the bank network that moves everyday money. ACH also connects to MANDATE, AUTOPAY, PAYCHECK, POSTED. |
| No-new-vocabulary fallback | Replace the slot's anchor with REMIT (Banking) / TERM (Credit) / MERIT, or ALERT (Banking) / RATE (Money Basics) / ALTER. Both valid at 2 of 3. Relevance is **moderate to weak**. |

### WALLET — Crypto slot, cross-world anchor
| | |
|---|---|
| Original anchor / world | WALLET, Crypto (`crypto.wallet`) |
| Replacement anchor | **INCOME** (Money Basics, `moneybasics.income`), anchor stays in the Crypto slot |
| Proposed puzzle | `FQ-V3:crypto:INCOME:R2` — **INCOME / COIN / COME** |
| Financial terms | INCOME (anchor, cross-world), COIN (secondary, `crypto.coin`) |
| Ordinary word | COME |
| Wheel | C E I M N O |
| Financial majority | 2 of 3: **met** |
| Layout (valid, connected) | COME across on top; COIN down from COME's C, ending on the N of `I N C O M E` across the bottom |
| Rewards | INCOME 42 coins / 9 XP; COIN 28 / 6; COME 1 / 0 |
| Educational relevance | **Good.** Income is the first reason anyone holds coins; the INCOME definition already names "investments"; COIN is a Crypto-native term, so the puzzle still teaches Crypto. |
| Alternatives | ALERT (Banking) / RATE (Money Basics) / ALTER: security alerts for a wallet account (moderate). |
| Constraint | No finance word can be spelled from WALLET, so the slot needs a different anchor. There is no own-world option (§6). |

### ASSET — Investing slot, cross-world anchor
| | |
|---|---|
| Original anchor / world | ASSET, Investing (`investing.asset`) |
| Replacement anchor | **SAVING** (Money Basics, `moneybasics.saving`), anchor stays in the Investing slot |
| Proposed puzzle | `FQ-V3:investing:SAVING:R2` — **SAVING / GAS / GAIN** |
| Financial terms | SAVING (anchor, cross-world), GAS (`crypto.gas`, cross-world), GAIN (`investing.gain`) |
| Ordinary word | none: **all three are approved financial terms** |
| Wheel | A G I N S V |
| Financial majority | 3 of 3 (minimum 2): **met** |
| Layout (valid, connected) | GAIN across on top; GAS down from GAIN's G, ending on the S of `S A V I N G` across the bottom |
| Rewards | SAVING 42 coins / 9 XP; GAS 21 / 5; GAIN 28 / 6 |
| Educational relevance | **Good.** Saving versus investing, with GAIN as the investing result. GAS is a Crypto cost term, a useful link between worlds. |
| Alternatives | SPREAD (Banking) / APR (Credit) / ARE (valid, but SPREAD's definition is about currency exchange, so relevance is **moderate to weak**). |

### GROWTH — keep the anchor, add WORTH
| | |
|---|---|
| Original anchor / world | GROWTH, Investing (`investing.growth`) |
| Replacement anchor | none needed |
| Proposed puzzle | `FQ-V3:investing:GROWTH:R2` — **GROWTH / WORTH / ROW** |
| Financial terms | GROWTH (anchor), **WORTH** (secondary, `investing.worth`, **NOT APPROVED**) |
| Ordinary word | ROW (THROW is an equal alternative). **GROW fails**: it is a prefix of GROWTH, which the engine flags as a prefix conflict. |
| Wheel | G H O R T W |
| Financial majority | 2 of 3: **met** |
| Layout (valid, connected) | WORTH across on top; ROW down from WORTH's R, ending on the W of `G R O W T H` across the bottom |
| Rewards | GROWTH 42 coins / 9 XP; WORTH 35 / 8; ROW 1 / 0 |
| Educational relevance | **Moderate.** Growth and net worth belong together, and NET, ASSET and OWNER already sit nearby. WORTH alone is a general word, and its meaning here comes from "net worth". |
| No-new-vocabulary fallback | Replace the anchor with DEBIT (Money Basics) / DEBT (Credit) / BID (Investing), 3 of 3, or INTEREST (Credit) / NET / ENTER. Relevance is **weak**: DEBIT and INTEREST are payment and borrowing terms, not growth. |

### Whole-slate result (scratch)
- **With ACH + WORTH + the three cross-world anchors above: 27 of 27 compliant**, 27 unique anchors, 27 unique puzzle IDs, 5 / 6 / 5 / 5 / 6 puzzles per world, the engine validator accepts all 27, 49 distinct financial terms each paid exactly once.
- **With no new vocabulary** (CHAIN slot → REMIT, GROWTH slot → DEBIT, WALLET → INCOME, ASSET → SAVING): **also 27 of 27**, same structure, 48 terms. It needs only the anchor rule, but two of its four slots have weak educational relevance.

## 6. ACH and WORTH definition recommendations — PROPOSED / NOT APPROVED

### ACH (`banking.ach`)
- **ID check:** prefix `banking.` matches the Banking world and the lower-case word, like every existing Banking ID. No collision with any of the 145.
- **Recommended definition:** *An electronic network that moves money between bank and credit union accounts, used for direct deposits and recurring bill payments.*
- **Accuracy:** the CFPB describes ACH as electronic transfers between banks and credit unions used for paycheck direct deposits and recurring bill debits, and the Federal Reserve describes it as a nationwide network for batches of credit and debit transfers. Sources: <https://www.consumerfinance.gov/ask-cfpb/what-is-an-ach-transaction-en-1065/>, <https://www.federalreserve.gov/paymentsystems/fedach_about.htm>.
- **Relevance:** strong, as above. **Recommendation: approve.**
- **Governance note:** it is an abbreviation; the Banking governance record would need a "Definition Status: new, owner-approved" row.

### WORTH (`investing.worth`)
- **ID check:** no collision. `moneybasics.worth` is an equally valid home; Investing is recommended because the GROWTH puzzle lives there.
- **Recommended definition:** *The value of something, or the amount by which what a person owns is greater than what they owe, as in net worth.*
- **Accuracy:** Investor.gov and the SEC define **net worth** as assets minus liabilities (<https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/figure-out-your-finances>, <https://www.sec.gov/resources-small-businesses/small-business-compliance-guides/accredited-investor-net-worth-standard>). "Worth" alone has no official definition, so the wording is a normalization, and it overlaps the wording of the existing VALUE definition ("usefulness or worth").
- **Relevance:** moderate. **Recommendation: approve only if you accept a general word as a term; otherwise use the no-new-vocabulary GROWTH fallback or leave GROWTH as an exception.**

If approved, the registry becomes 147 terms and the tests that pin 145 need an approved update, as do the inventory document and the ID-governance tests.

## 7. Cross-world anchor recommendations — PROPOSED / NOT APPROVED

**The rule is implementable with a very small change.** Findings from reading the code and from the scratch prototype:
- `financialAnswer` already marks an answer `crossWorld` and keeps its origin ID when its origin world differs. The only gap is that `buildPuzzle` passes the puzzle's own world for the **anchor**. An optional `anchorFrom` on the spec closes it (a one-line change, prototyped in scratch).
- `validateV3Puzzle` **already accepts** a cross-world financial answer that carries its origin ID, including as the anchor (all 27 scratch puzzles validated with it unchanged).
- Rewards are computed from the answer's term ID and the global reward history, so a cross-world anchor pays exactly like a cross-world secondary. In the scratch run every financial term paid once and no unpaid term paid zero.
- Mastery stays on the origin ID (checked for every cross-world answer).
- The live repo correctly **rejects** an INCOME anchor in a Crypto puzzle today ("Missing governed crypto term"), pinned by a new test, so nothing can slip in unnoticed.

**Per-anchor assessment against FLQ-V3-CROSS-WORLD-ANCHOR-001**

| Anchor | Dest. world | Approved vocab | Relevance | Identity and definition kept | 3–5 words / majority | Valid crossword | No duplicate rewards |
|---|---|---|---|---|---|---|---|
| INCOME | Crypto | yes | good | yes | 3 / 2 of 3 | yes | yes |
| SAVING | Investing | yes | good | yes | 3 / 3 of 3 | yes | yes |
| REMIT *(fallback)* | Crypto | yes | moderate–weak | yes | 3 / 2 of 3 | yes | yes |
| DEBIT *(fallback)* | Investing | yes | weak | yes | 3 / 3 of 3 | yes | yes |

**Implementation scope if approved** (not done): optional `anchorFrom` support in `buildPuzzle` (the only source change), the four spec edits, and updated test pins (23 → 27 compliant, `SPECS` fingerprint, own-world-anchor assertions, term counts if ACH/WORTH are approved), then bundle resync.

## 8. Celebration verification — TESTED (no defect found, no code changed)

| Requirement | Result |
|---|---|
| 1. Triggers once after a newly completed puzzle | **Pass.** A fresh completion drew one effects layer; a replay drew none. Guarded once per render. |
| 2. Shows actual earned coins and XP | **Pass.** `+78 / +17` shown and credited (320 px run); announcement says the same. |
| 3. No additional rewards | **Pass.** Displayed amount equals the real save delta; the module cannot reach rewards (test-enforced). |
| 4. No duplicate rewards on replay | **Pass.** Replay: 0 coins, 0 XP, announcement "Puzzle solved again. You earned 0 coins and 0 XP." |
| 5. Works on mobile | **Pass** at 320×568, 375×667, 375×812 and 390×844. Confetti and dollar symbols render; the layer is `pointer-events:none`. |
| 6. Respects sound preference | **Pass.** Mute persisted across a page reload (`off` → "🔇 Sound off"); muted means no audio context is created (tests). |
| 7. Respects reduced motion | **Pass** (Phase 4 browser run with the media query forced, plus tests): no layer, panel and amounts still shown. |
| 8. Does not obscure Next Puzzle | **Pass.** At 320×568 the Next button is inside the viewport and is the topmost element at its centre while the effects run. |

**Observation, deliberately not changed:** at the very short **320×568** viewport the card scrolls, so the rewards row and the Skip / Sound buttons sit below the fold (Next Puzzle is sticky and always visible). At 375×667 and larger all of them are visible. The amounts are also spoken. This is the existing card layout, not a celebration defect, so I did not redesign it. Say if you want the order tightened for very short screens.

## 9. Mobile layout repair — IMPLEMENTED / TESTED

- **Defect:** at 320 px the title column is about 74 px wide, so "FOUNDATIONS" ran under the "PUZZLES COMPLETE" counter.
- **Fix:** one rule, `@media(max-width:340px){.wg-world-header{flex-wrap:wrap}.wg-words-solved{flex:1 0 100%;text-align:left}}`. The counter now has its own row.
- **Measured** (element rectangles for the brand, three currency chips, Level card, back button, icon, world name, title and counter): **320, 375, 390, 768 and 1280 px** all show **zero overlaps, no clipped title and no horizontal overflow**. The Phase 4 header fix is unaffected.

## 10. Housekeeping — IMPLEMENTED

- The stray file `-iname "*release*" | head -30q` was re-inspected before deletion: 12,969 bytes, `less` overstrike-formatted help text ("SUMMARY OF LESS COMMANDS"), **zero** project strings. **That exact file was deleted; nothing else was.**
- BLOCK stays at R3.
- Synthetic browser state was cleared and viewports reset.

## 11. Automated test results — TESTED

- Full suite: **425 tests, 425 pass, 0 fail** in America/Los_Angeles, UTC, Asia/Tokyo and Pacific/Auckland (up from 420: +1 header test, +4 governance tests).
- `git diff --check`: clean. Bundle parity passes after the local resync (`stamp-cache-bust` → `build-www.sh` → `cap sync ios`).
- Covered by the suite: layout, financial-majority and wheel-letter validation for all 27 puzzles, cross-world identity, duplicate rewards, existing-player save compatibility, daily login rewards, celebration regression, mobile header.
- New guardrail tests: ACH and WORTH are absent from the registry; the four open puzzles are unchanged; no spec uses a cross-world anchor and the 23 compliant count holds; a Crypto-slot INCOME anchor is rejected today.
- Daily login rewards were not re-run in the browser this phase (code untouched; the daily-reward tests pass).
- All browser runs used synthetic saves, cleared afterwards.

## 12. Exact files modified — IMPLEMENTED

- `word-game.css` — 320 px header rule appended.
- `tests/mobile-header-layout.test.js` — 320 px test added.
- **New** `tests/v3-phase5-governance.test.js`.
- `index.html`, and the regenerated `ios/App/App/public/*` and `www/` copies — cache-bust stamp refreshed by the resync only.
- **Deleted:** the stray `less` help file (exact name above).
- **New:** `FINLIT_QUEST_V3_PHASE5_REPORT.md`.

Not changed: the slate specs, vocabulary, definitions, IDs, rewards, saves, the celebration code, PR #4.

## 13. Decisions requiring owner approval — NOT APPROVED

1. **ACH** (`banking.ach`) and the definition in §6: approve, edit or reject. **Recommended: approve.**
2. **WORTH** (`investing.worth`) and the definition in §6: approve, edit or reject. Weaker; fallback is the DEBIT or INTEREST anchor in the GROWTH slot, or leaving GROWTH open.
3. **Rule FLQ-V3-CROSS-WORLD-ANCHOR-001:** approve implementing it (optional `anchorFrom`, one-line source change). Without it WALLET and ASSET cannot be fixed.
4. **Anchors for the two slots:** WALLET → INCOME (recommended) or ALERT; ASSET → SAVING (recommended) or SPREAD.
5. **Path:** the recommended set (ACH + WORTH + INCOME + SAVING) or the no-new-vocabulary set (REMIT + DEBIT + INCOME + SAVING). Both reach 27/27 and keep 5 / 6 / 5 / 5 / 6.
6. **Investing count:** confirm 6 (existing structure, preserved) rather than 5.
7. **Ordinary words** the proposals would add: CHIN (or INCH), COME, ROW (or THROW), and from the fallbacks MERIT, ALTER, ENTER, ARE. None is governed vocabulary.
8. **Very short screens:** want the reward row and Skip / Sound reordered for 568 px-high phones?

Stopping here as instructed. No commit, push, merge or deployment has been made, and none of the four proposals has been implemented.

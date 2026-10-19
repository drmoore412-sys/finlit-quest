# FinLit Quest — Curriculum Approval Log

**This is the authoritative Curriculum Approval Log.** It was created on 2026-10-17 on the owner's decision D8.

## Rules of this log

Recorded verbatim from owner decision D8 (2026-10-17):

> Only the FinLit Quest owner may make approval decisions. Codex may record an owner decision verbatim, with its date, scope, source files, qualifications, and superseded records, but may never invent or infer an approval.

Operating rules that follow from it:

1. An entry is added **only** when the owner has stated a decision. Nothing in this log is inferred from a file's name, its directory, or an older report.
2. Entries are **append-only**. A later decision supersedes an earlier one by a new entry that cites the old one; earlier entries are never edited or deleted.
3. Approved educational source files are immutable. This log changes no definition, stable term ID, relationship or curriculum wording.
4. Historical approval records that already exist in the repository (for example the Money Basics approval of 2026-07-22) are **referenced** by the entries below, not re-entered or re-dated here. No historical approval has been reconstructed.
5. Allowed statuses: Draft · Under Review · Owner Approved · Approved & Locked · Approved with Qualification · Superseded · Deferred.
6. The per-world summary lives in `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md` (status: **Confirmed**, 2026-10-17). Project history lives in `PROJECT_LOG.md`.
7. Fields marked "Not recorded" were not stated by the owner and are not filled in by Codex.

**Approver for every entry below:** the FinLit Quest owner.
**Decision date for every entry below:** 2026-10-17 (the date the owner confirmed the matrix), unless an effective date is stated.

---

## CAL-0001 — Credit Foundations curriculum (CRF-001 to CRF-015)

| Field | Record |
|---|---|
| World / section | Credit Foundations — the 15-workbook curriculum package |
| **Status** | **Approved with Qualification** (for V1 implementation) |
| Decision date | 2026-10-17 |
| Source files | `curriculum/credit/approved/workbooks/CRF-001-015-source.md`; `curriculum/credit/approved/runtime/credit-foundations.json` and `.js` |
| Implementation status | Implemented in the V1 app (`workbook-app.js`, lessons, activities, assessments, progression) |
| Canonical-record status | Not recorded |
| Superseded records | None. The six 2026-07-19 reports claiming the workbooks were missing remain superseded by `curriculum/credit/approved/reports/CORRECTION_2026-07-21.md` (unchanged) |

Owner decision, verbatim (D1):

> Set the 15-workbook Credit Foundations curriculum to Approved with Qualification for V1 implementation.
> Qualification: The existing CRF-001–015 package is approved for the current game, lessons, activities, assessments, and progression. It has not completed the separate Approved & Locked curriculum-import pipeline. Do not rewrite its educational content.

**Qualification carried forward:** not Approved & Locked; the educational content must not be rewritten. Earlier recorded context preserved: the source file labels itself "Game-ready educational draft for integration and final editorial review", and `PROJECT_LOG.md` records that it was deliberately not silently upgraded to "approved & locked".

---

## CAL-0002 — Credit permanent term IDs

| Field | Record |
|---|---|
| World / section | Credit — the 38-term identity registry |
| **Status** | **Owner Approved** (scoped to permanent term IDs only) |
| Effective date | 2026-10-14. Confirmed 2026-10-17 |
| Source files | `content/credit-term-identities.js` (header already reads "Owner approved 2026-10-14") |
| Implementation status | Implemented |
| Superseded records | None |

Owner decision, verbatim (D2):

> Confirm the 38-term Credit identity registry as Owner Approved, effective October 14, 2026, scoped specifically to permanent term IDs.

**Scope note:** this approves the permanent IDs only. It does not approve the display words, definitions or any curriculum text, which remain governed by CAL-0001.

---

## CAL-0003 — Money Basics main game

| Field | Record |
|---|---|
| World / section | Money Basics — main letter-wheel and crossword game |
| **Status** | **Owner Approved** |
| Decision date | 2026-10-17 (confirms the approval record dated 2026-07-22) |
| Source files | `docs/MONEY_BASICS_MAIN_GAME_APPROVAL.md`; `docs/MONEY_BASICS_CLUSTER_GOVERNANCE_GAP_2026-07-23.md`; `content/money-basics-terms.json`, `.js`, `content/money-basics-puzzle-bank.js`, `content/money-basics-reserve.json` |
| Vocabulary | 36 terms (`moneybasics.*`); approved vocabulary unchanged |
| Implementation status | Implemented (puzzle bank v2) |
| Superseded records | The **puzzle-bank structure** described in the original approval record (14 verified clusters plus 6 single-term puzzles) is superseded by puzzle-bank v2 (10 standard clusters, 1 two-answer exception, 0 single-term puzzles; INFLATION and PAYCHECK in reserve). The original record is not edited |

Owner decision, verbatim (D3):

> Confirm Money Basics as Owner Approved for the main letter-wheel and crossword game. The approver is the FinLit Quest owner. The July 23, 2026 puzzle-bank v2 decision is current and supersedes the original puzzle-bank structure without changing the approved vocabulary.

---

## CAL-0004 — Banking Basics v1.1 main game

| Field | Record |
|---|---|
| World / section | Banking Basics — main game, vocabulary v1.1 |
| **Status** | **Approved with Qualification** |
| Decision date | 2026-10-17 |
| Source files | `docs/BANKING_BASICS_v1.1_COMPLETE_CONTROLLING_RECORD_2026-07-23.md` (18,198 bytes, SHA-256 `9551d3377533ab6ad569b618520b3a264d6733df067c83a6615feed5e1acb3ed`); `content/banking-basics-terms.json`, `.js`, `content/banking-basics-puzzle-bank.js`, `content/banking-basics-reserve.json` |
| Vocabulary | 26 active terms (`banking.*`), 15 reserve |
| Implementation status | Implemented |
| Superseded records | The earlier concise Banking summary was already superseded by the complete controlling record (`PROJECT_LOG.md`, 2026-07-23 entry). The documented retroactive governance normalization is now the current controlling record |

Owner decision, verbatim (D4):

> Confirm Banking Basics v1.1 as Approved with Qualification for the main game. Accept the documented retroactive governance normalization as the current controlling record. Preserve the qualification that most definitions were reconstructed and are not represented as verbatim historical approvals.

**Qualification carried forward, verbatim from the controlling record:** "All other definitions and source mappings are newly reconstructed. They are not represented as verbatim historical approvals." Only CLEAR, LOGIN, SPREAD, LIQUID and PASSKEY reproduce previously recorded approved wording (SAVINGS and RECURRING are preserved in the reserve). The record's wording was not changed.

---

## CAL-0005 — Investing Basics v1.1 main game

| Field | Record |
|---|---|
| World / section | Investing Basics — main letter-wheel and crossword game, vocabulary v1.1 |
| **Status** | **Owner Approved** |
| Decision date | 2026-10-17 (confirms the record dated 2026-07-23, "FINAL APPROVED") |
| Source files | `docs/INVESTING_BASICS_MAIN_GAME_VOCABULARY_v1.1_FINAL_APPROVED.md`; `content/investing-basics-terms.json`, `.js`, `content/investing-basics-puzzle-bank.js`, `content/investing-basics-reserve.json` |
| Vocabulary | 25 active terms (`investing.*`), 2 reserve |
| Implementation status | Implemented |
| Superseded records | None |

Owner decision, verbatim (D5):

> Confirm Investing Basics v1.1 as Owner Approved for the main letter-wheel and crossword game. The approver is the FinLit Quest owner.

---

## CAL-0006 — Crypto Foundations

| Field | Record |
|---|---|
| World / section | Crypto Foundations — the current content and playable implementation |
| **Status** | **Approved with Qualification** (for V1 gameplay) |
| Decision date | 2026-10-17 |
| Source files | `content/crypto-terms.json` (20 curated learning objects), `worlds/crypto.json`, and the generated adapters `content/crypto-terms.js`, `worlds/crypto.js` |
| Implementation status | Implemented |
| Superseded records | None. No earlier approval record existed |

Owner decision, verbatim (D6):

> Set the current Crypto Foundations content to Approved with Qualification for V1 gameplay.
> Qualification: Approval covers the existing 20 learning objects and current playable implementation. A dedicated controlling governance record should be created before the content is treated as Approved & Locked or expanded substantially.

**Open follow-up carried forward:** a dedicated controlling governance record for Crypto does not yet exist; it is required before Approved & Locked status or substantial expansion.

---

## CAL-0007 — V3 additions (ACH, WORTH, and the V3 crossword compositions)

| Field | Record |
|---|---|
| World / section | V3 puzzle preview: banking and investing supplement terms; the 27-puzzle composition slate |
| **Status** | **Owner Approved** — as separate development decisions |
| Decision date | 2026-10-17 (the decisions were given during the development sessions recorded in the V3 reports; their dates are cited as written there) |
| Source files | `content/v3-supplemental-terms.json` and `.js` (ACH `banking.ach`, WORTH `investing.worth`); `src/v3-puzzle-slate.js` (27 puzzle specifications; `SPECS` fingerprint `718154a858036bba` when recorded); `FINLIT_QUEST_V3_27_PUZZLE_COMPLETION_REPORT.md`, `FINLIT_QUEST_V3_PHASE5_REPORT.md`, `FINLIT_QUEST_V3_145_TERM_INVENTORY.md` |
| Implementation status | Implemented locally; **opt-in preview** behind `?puzzles=v3`. Not activated for production |
| Superseded records | None. The frozen Banking v1.1 and Investing v1.1 legacy records are **not amended** |

Owner decision, verbatim (D7):

> Record ACH, WORTH, and the approved V3 crossword compositions as separate Owner Approved development decisions. They do not amend the frozen Banking or Investing v1.1 legacy records. V3 remains opt-in until separately authorized for production.

**Qualifications:** V3 stays opt-in until the owner separately authorizes production. The supplement terms do not change CAL-0004 or CAL-0005.

---

## CAL-0008 — Eighteen-concept vocabulary decision (12 approved, 6 deferred)

| Field | Record |
|---|---|
| World / section | Credit, Banking, Crypto and Investing — vocabulary additions identified by the four-world research consolidation |
| **Status** | **Owner Approved** — the 12 words, their owning worlds, and the definitions exactly as written in the evidence register. **Six concepts Deferred** |
| Decision date | 2026-10-17 |
| Source files | `docs/FINLIT_QUEST_18_CONCEPT_EVIDENCE_AND_OWNER_REVIEW_PACKET_2026-10-17.md`; `staging/research/consolidated/2026-10-17/term-evidence-register.json` |
| Implementation status | **Partially implemented 2026-10-17 (owner: "implementation of the worlds").** REPORT, BUREAU, FREEZE, HISTORY, ATM, WIRE, PHISHING and LIQUIDITY added to `content/v3-supplemental-terms.json`/`.js` (and bundle copies) with the IDs below; no puzzle uses them. The Credit identity registry now holds 42 IDs (38 workbook + 4). **Not implemented:** the four Crypto terms (CAL-0006 question open). Puzzle generation remains unauthorized |
| Superseded records | None |

Owner decision, verbatim (D11), given in reply to a review that listed the 12 recommended terms, the 6 deferrals, and three flagged items (the LIQUID/LIQUIDITY overlap, the CAL-0006 qualification, and the thin WIRE and SCAM definitions):

> everything approved

Earlier owner statements on the same batch, recorded verbatim from the research session of 2026-10-17: "ATM is ok", "SCAM is ok".

**Approved terms and permanent IDs.** Definitions are copied from the register without edits. The register still labels them `unapproved-draft` because the research evidence is immutable and was not edited; this entry is the approval record. The IDs are assigned here only and are **not yet present in any content, identity-registry or runtime file**.

| Word | Permanent ID | World | Letters | Definition (exact) |
|---|---|---|---|---|
| REPORT | `credit.report` | Credit | 6 | A record of your credit activity and current credit situation, including account and payment information. |
| BUREAU | `credit.bureau` | Credit | 6 | A common name for a credit reporting company that collects credit information and creates credit reports. |
| FREEZE | `credit.freeze` | Credit | 6 | A free protection that restricts access to your credit file to help prevent new accounts from being opened in your name. |
| HISTORY | `credit.history` | Credit | 7 | A record of how you have used and repaid credit over time. |
| ATM | `banking.atm` | Banking | 3 | An automated teller machine that lets bank customers complete basic transactions such as deposits and withdrawals. |
| WIRE | `banking.wire` | Banking | 4 | An electronic bank transfer sent through a wire network to a named recipient. |
| PHISHING | `banking.phishing` | Banking | 8 | A scam using deceptive emails or text messages to steal passwords, account numbers, or other personal and financial information. |
| ADDRESS | `crypto.address` | Crypto | 7 | A string of letters and numbers used as a destination for sending or receiving cryptocurrency. |
| CUSTODY | `crypto.custody` | Crypto | 7 | The responsibility for safeguarding the keys or accounts that control access to cryptocurrency. |
| SCAM | `crypto.scam` | Crypto | 4 | A deceptive scheme designed to steal money or cryptocurrency. |
| CONFIRMED | `crypto.confirmed` | Crypto | 9 | Describes a blockchain transaction or block whose inclusion has been accepted through network consensus. |
| LIQUIDITY | `investing.liquidity` | Investing | 9 | How easily or quickly an investment can be bought or sold without a large effect on its price. |

Recorded qualifications from the register: ATM is an explicit acronym exception (Banking). SCAM's owning world is Crypto. CONFIRMED replaces the candidate CONFIRM (the official NIST term; 9 letters). BUREAU carries the terminology note that the CFPB also uses "credit reporting company".

**Deferred, no IDs assigned** (to lessons or Secondary Education; not in any term registry):

| Word | World | Register disposition |
|---|---|---|
| BACKUP | Crypto | defer-secondary-education |
| SEED | Crypto | defer-secondary-education |
| SIGN | Crypto | defer-secondary-education |
| OFFLINE | Crypto | defer-secondary-education |
| KEY | Crypto | defer-secondary-education |
| FRACTION | Investing | defer-secondary-education |

SEED's register entry has an empty source list. Its deferral is recorded, but no term-specific source evidence exists for it.

**Items presented before approval and carried forward, not resolved by this decision:**

- **LIQUIDITY and `banking.liquid`.** The register checked exact collisions only. `banking.liquid` (LIQUID, Banking v1.1: "Describes money or an asset that can be accessed or converted into cash quickly.") is a related approved term, and LIQUID's letters sit inside LIQUIDITY. The owner approved LIQUIDITY with the definition above, unchanged. `banking.liquid` is unchanged. Any future puzzle using LIQUIDITY must account for LIQUID as a possible bonus word under the existing bonus-word rules.
- **CAL-0006 qualification.** CAL-0006 requires a dedicated Crypto controlling governance record before Crypto content is treated as Approved & Locked or "expanded substantially". This entry adds four Crypto terms to the existing 20. The owner did not state whether that is substantial. The CAL-0006 qualification is carried forward unchanged.
- **WIRE and SCAM wording.** Approved as written. The review noted that the WIRE definition does not mention that wire transfers are generally hard to reverse and that the SCAM definition is not crypto-specific. The wording was not changed.

**Counts.** The per-world term counts in `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md` (Credit 38, Money Basics 36, Banking 26, Investing 25, Crypto 20) describe **implemented** content and are unchanged. After implementation they would become Credit 42, Banking 29, Crypto 24, Investing 26.

---

## CAL-0009 — Eight additional FinLit Quest worlds

| Field | Record |
|---|---|
| World / section | Coins & Currency; AI & Technology; Real Estate; Taxes; Insurance & Protection; Business & Entrepreneurship; Social Media & Digital Income; Retirement & Wealth Planning |
| **Status** | **Owner Approved** — scoped to the eight world identities, their status as separate intended playable worlds, and the instruction not to merge them into the original five worlds |
| Decision date | 2026-10-18 |
| Source files | Owner task `FINLIT QUEST 2027 — EXPAND THE GAME BEYOND THE ORIGINAL FIVE WORLDS`; `content/world-definitions-2027.json`; `docs/FINLIT_QUEST_2027_THIRTEEN_WORLD_EXPANSION.md` |
| Implementation status | World definitions and vocabulary organization recorded. Runtime integration is not complete: all eight remain vocabulary-only pending approved permanent term identities, definitions, and puzzle banks |
| Superseded records | Supersedes the provisional organization note in `FinLit_Quest_2027_Remaining_Worlds_Backlog.md` that Real Estate might remain under Investing and Social Media / Digital Income might remain under Business |

Owner decision, verbatim:

> I am now explicitly approving the addition of the eight new worlds listed below.
>
> 6. Coins & Currency  
> 7. AI & Technology  
> 8. Real Estate  
> 9. Taxes  
> 10. Insurance & Protection  
> 11. Business & Entrepreneurship  
> 12. Social Media & Digital Income  
> 13. Retirement & Wealth Planning
>
> These are now approved as separate playable worlds.
>
> Do not merge them into the original five worlds.

**Scope qualification:** this entry approves the world identities and intended product structure. It does not approve every collected term, draft clue, permanent ID, crossword composition, flashcard, or runtime implementation. Those artifacts retain their recorded review status. A world is not reported as currently playable until it has an approved term registry and approved puzzle bank integrated with the runtime.

---

## CAL-0010 — Updated 2027 puzzle-construction rules

| Field | Record |
|---|---|
| World / section | All 13 FinLit Quest worlds — future puzzle proposals only |
| **Status** | **Owner Approved construction rule** — proposal generation only; no puzzle implementation approved |
| Decision date | 2026-10-18 |
| Source files | Owner task `FINLIT QUEST 2027 — UPDATED PUZZLE CONSTRUCTION RULES`; `docs/FINLIT_QUEST_2027_UPDATED_PUZZLE_CONSTRUCTION.md`; `staging/research/expansion/2026-10-18/finlit-quest-2027-flexible-puzzle-proposals.json` |
| Implementation status | Research proposal generator and owner-review records created. Runtime, saves, rewards, and playable puzzle banks unchanged |
| Superseded records | Supersedes the universal requirement that every new proposal contain at least three financial terms. Existing playable puzzles and previously generated proposals remain preserved |

Owner decision, verbatim:

> Every new puzzle must have a legitimate nine-letter financial, business, or technology key term.
>
> The nine letters of that key term become the puzzle's letter wheel.
>
> Additional crossword answers do not all need to be financial terms.
>
> Ordinary dictionary words are allowed as supporting answers if they are real words, contain 4–9 letters, use only the available wheel letters (including correct repeated-letter counts), and fit a valid crossword layout.
>
> Do not require three financial terms in every puzzle. That previous requirement is now superseded.

**Difficulty progression recorded:** level 1 may use one financial key term; levels 2–5 aim for two financial terms; levels 6–10 aim for three; levels 11–15 aim for three or four; and levels 16–20 aim for four or five where feasible.

**Scope qualification:** the progression values are aims, not automatic vocabulary approvals. Ordinary words remain non-mastery supporting words and require owner/clue-copy review. Working financial, business, and technology terms keep their existing research status. This entry does not approve any of the 90 newly generated compositions or authorize runtime implementation.

---

## CAL-0011 — Eight new-world term and puzzle activation

| Field | Record |
|---|---|
| World / section | Coins & Currency; AI & Technology; Real Estate; Taxes; Insurance & Protection; Business & Entrepreneurship; Social Media & Digital Income; Retirement & Wealth Planning |
| **Status** | **Owner Approved for playable implementation** — every qualifying proposal after the authorized educational, identity, wheel, layout, and compatibility review |
| Decision date | 2026-10-18 |
| Source files | Owner task `FINLIT QUEST — ACTIVATE THE EIGHT NEW WORLDS`; `staging/research/expansion/2026-10-18/finlit-quest-2027-thirteen-world-puzzle-proposals.json`; `docs/FINLIT_QUEST_2027_NEW_WORLD_ACTIVATION_REPORT.md`; generated term and bank assets under `content/2027-new-world-*` |
| Implementation status | 31 qualifying proposals implemented and playable. Three proposals rejected and not implemented. All 13 world cards now open the shared crossword game |
| Superseded records | Supersedes only the Coming Soon runtime state recorded under CAL-0009. CAL-0010 construction rules remain in force; the immutable proposal source remains unchanged |

Owner authorization, verbatim:

> I am the project owner. I want all eight new worlds to become playable, not remain Coming Soon.
>
> I authorize implementation of every proposal that passes those checks. Do not require another separate approval step for those qualifying puzzles.

**Review outcome:** 31 of 34 proposals qualified. `FQ-2027-INSURANCE-04` (RENTAL CAR), `FQ-2027-INSURANCE-05` (ROOT CANAL), and `FQ-2027-RETIREMENT-02` (COMMUNITY) were rejected because their anchors are not legitimate financial, business, or technology key terms as written. The reasons are preserved in the generated puzzle-bank manifest and activation report.

**Identity qualification:** Existing permanent identities remain unchanged. Newly reviewed terms receive one permanent identity and exact runtime definition. FRACTION remains ordinary support because CAL-0008 deferred the distinct concept *fractional share*; it receives no mastery identity or financial reward.

---

## Owner directions recorded here for completeness (not curriculum approvals)

These are documentation and project-history directions, not approvals of curriculum content. Their implementation is recorded in `PROJECT_LOG.md`.

**D8 — Approval Log** (verbatim): "Create the authoritative Curriculum Approval Log at: `docs/CURRICULUM_APPROVAL_LOG.md`" — this file.

**D9 — Stale project instructions** (verbatim): "Update `CLAUDE.md` and `APP_DESCRIPTION_AND_CLAUDE_SYSTEM_PROMPT.md` to reflect the current five-world V1 application. Remove the stale statement that Crypto is the only playable world. Do not change curriculum content while making this documentation correction."

**D10 — Project history** (verbatim): "Add one concise historical backfill entry covering the documented October V3, audio, bonus-word, and related work. Base it only on existing reports, tests, and repository evidence. Do not reconstruct undocumented approval decisions or fabricate dates."

---

## Audit triggers (from the owner's governance continuity instructions)

Do not repeat the governance audit unless: a controlling curriculum file changes; a new curriculum version is supplied; a new world is introduced; two current authoritative records conflict; validation detects changed IDs, definitions or relationships; a checksum or source-fidelity test fails; or the owner explicitly requests one.

## Entry index

| ID | Subject | Status | Date |
|---|---|---|---|
| CAL-0001 | Credit Foundations curriculum (CRF-001–015) | Approved with Qualification | 2026-10-17 |
| CAL-0002 | Credit permanent term IDs (38) | Owner Approved (IDs only), effective 2026-10-14 | 2026-10-17 |
| CAL-0003 | Money Basics main game (bank v2 current) | Owner Approved | 2026-10-17 |
| CAL-0004 | Banking Basics v1.1 main game | Approved with Qualification | 2026-10-17 |
| CAL-0005 | Investing Basics v1.1 main game | Owner Approved | 2026-10-17 |
| CAL-0006 | Crypto Foundations (20 objects) | Approved with Qualification | 2026-10-17 |
| CAL-0007 | V3 additions (ACH, WORTH, 27 compositions) | Owner Approved (development; opt-in) | 2026-10-17 |
| CAL-0008 | Eighteen-concept vocabulary decision (12 approved, 6 deferred) | Owner Approved (8 of 12 implemented: Credit, Banking, Investing) | 2026-10-17 |
| CAL-0009 | Eight additional FinLit Quest worlds | Owner Approved (world identities and separation; runtime pending) | 2026-10-18 |
| CAL-0010 | Updated 2027 puzzle-construction rules | Owner Approved construction rule (proposals only) | 2026-10-18 |
| CAL-0011 | Eight new-world term and puzzle activation | Owner Approved for playable implementation (31 pass, 3 reject) | 2026-10-18 |

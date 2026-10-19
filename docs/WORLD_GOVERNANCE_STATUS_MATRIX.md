# FinLit Quest — World Governance Status Matrix

**Document status: CONFIRMED — 2026-10-17.** The owner confirmed this matrix with decisions D1–D10 on 2026-10-17. The decisions are recorded verbatim in `docs/CURRICULUM_APPROVAL_LOG.md` (entries CAL-0001 to CAL-0007) and in `PROJECT_LOG.md`. This matrix and the Approval Log are the authoritative governance records; do not repeat the governance audit unless a defined audit trigger occurs.

*Revision history: drafted 2026-10-17 from the repository artifacts (status Draft, pending owner confirmation) → confirmed 2026-10-17 → expanded 2026-10-18 with the eight owner-approved world identities from CAL-0009. The draft's evidence, qualifications and decision list are preserved below; confirmed outcomes are added alongside them.*
**Prepared:** 2026-10-17 · **Last verified:** 2026-10-18 (see "What was verified")
**Rule:** this matrix records what the repository artifacts show and the owner's recorded decisions, in the allowed status vocabulary. It does not decide approval, reconstruct missing approvals, rewrite wording, or change stable IDs. Only the FinLit Quest owner makes approval decisions.

**Allowed statuses:** Draft · Under Review · Owner Approved · Approved & Locked · Approved with Qualification · Superseded · Deferred

**Continuity notes (settled, do not re-open without a documented trigger)**
- `curriculum/credit/approved/reports/CORRECTION_2026-07-21.md` supersedes the six 2026-07-19 reports that claimed "0 of 15 Credit workbooks found". All 15 Credit Foundations workbooks exist (`CRF-001-015-source.md`, 1,180 lines, 15 runtime workbook objects, working in the app). That conclusion must not be repeated unless the files are removed or corrupted.
- The Curriculum Approval Log was absent from the repository until the owner's decision D8 (2026-10-17); it now exists at `docs/CURRICULUM_APPROVAL_LOG.md`. (Earlier statements in the Credit evidence inventory, the workbooks README and `PROJECT_LOG.md` that the log was missing describe the earlier state and are preserved as history.) This matrix does not stand in for it.
- A main-game **vocabulary record is not a complete educational workbook**. Money Basics, Banking Basics and Investing Basics records each say they govern the main letter-wheel game only.

---

## 1. Matrix — part A (identity, scope, source, status)

| World | Scope covered | Controlling source file | Source version | Approval status (proposed mapping — owner to confirm) | Approval date (as recorded) |
|---|---|---|---|---|---|
| **Credit Foundations** | (a) Workbook curriculum CRF-001–015 (lesson, flashcards, matching, quiz, assessment, unlock); (b) 38-term word-game vocabulary derived from its flashcards; (c) permanent term-ID registry | (a)(b) `curriculum/credit/approved/workbooks/CRF-001-015-source.md`; (c) `content/credit-term-identities.js` | Source file has no version label. Pipeline policy: `awaiting_first_successful_import` | **Approved with Qualification** for the 15-workbook curriculum (D1, CAL-0001), for V1 implementation. **Owner Approved** for the (c) permanent-ID registry, scoped to permanent term IDs only (D2, CAL-0002). *Earlier draft mapping, preserved: Draft, as the source labels itself: "Game-ready educational draft for integration and final editorial review".* | Curriculum: 2026-10-17 (owner decision D1). ID registry: effective 2026-10-14 ("Owner approved 2026-10-14" in the file header), confirmed 2026-10-17. Source file supplied by the user 2026-07-19. V1 *scope* confirmed by the user 2026-07-20 (a scope decision, not an approval label) |
| **Money Basics** | Main letter-wheel and crossword game vocabulary only | `docs/MONEY_BASICS_MAIN_GAME_APPROVAL.md`, with `docs/MONEY_BASICS_CLUSTER_GOVERNANCE_GAP_2026-07-23.md` for the later bank decision | Vocabulary v1.0; governed runtime bank v2 | **Owner Approved** (D3, CAL-0003). The approver is the FinLit Quest owner (stated by the owner on 2026-10-17; the original record does not name one). Record: "APPROVED WITH MINOR REVISIONS — revisions incorporated"; "Governance status: APPROVED" | 2026-07-22 (original record); follow-on governance decision approved 2026-07-23; owner confirmation 2026-10-17 |
| **Banking Basics** | Main letter-wheel and crossword game vocabulary only | `docs/BANKING_BASICS_v1.1_COMPLETE_CONTROLLING_RECORD_2026-07-23.md` (18,198 bytes) | v1.1 | **Approved with Qualification** (D4, CAL-0004). Record: "Historical final status: FINAL APPROVED"; "Proposed normalized status: … FINAL APPROVED WITH RETROACTIVE GOVERNANCE NORMALIZATION". The owner accepted the normalization as the current controlling record | Original approval date not stated in the record (file dated 2026-07-23; implementation entry in `PROJECT_LOG.md` dated 2026-07-23). Owner confirmation 2026-10-17 |
| **Investing Basics** | Main letter-wheel and crossword game vocabulary only | `docs/INVESTING_BASICS_MAIN_GAME_VOCABULARY_v1.1_FINAL_APPROVED.md` | v1.1 | **Owner Approved** (D5, CAL-0005). The approver is the FinLit Quest owner (stated 2026-10-17). Record: "FINAL APPROVED" | 2026-07-23 (original record); owner confirmation 2026-10-17 |
| **Crypto Foundations** | Crypto & DeFi word-game world with per-term learning objects | `content/crypto-terms.json` (20 objects) and `worlds/crypto.json`, named as canonical in `CLAUDE.md` | Schema version only; no content version | **Approved with Qualification** for V1 gameplay (D6, CAL-0006). *Earlier finding, preserved: before 2026-10-17 no approval, review or owner-decision record existed.* | 2026-10-17 (owner decision D6) |

## 2. Matrix — part B (content status)

| World | Stable term count | Curriculum / workbook status | Vocabulary status | Puzzle-bank status |
|---|---|---|---|---|
| **Credit Foundations** | 38 word-game terms with registry IDs (`credit.<word>`); 15 workbooks | **15 workbooks exist and play end to end** (source md, generated runtime JSON + `.js` adapter, `workbook-app.js` engine; live-verified per the correction notice and the V1 checklist). No Approved & Locked workbook set, Approval Log or Controlled Values workbook is present | 38 terms generated from the workbook flashcards by `scripts/build-credit-game-terms.mjs`. Registry owner-approved 2026-10-14 | No governed static bank is wired for Credit in the live game (`word-game-app.js` defines `staticBank` only for Money Basics, Banking and Investing); its bank is built dynamically. A pipeline-generated file exists (`content/puzzle-banks/credit-puzzle-bank.json`, 58 puzzles, generated 2026-07-20). Earlier log finding: 17 of 38 terms could not appear in a legacy live puzzle (15 exceed the nine-tile wheel, 2 have no compatible partner) |
| **Money Basics** | 36 (`moneybasics.*`): 34 active, 2 in Future Expanded-Wheel Reserve (INFLATION, PAYCHECK) | None. Record scope: "Main letter-wheel and crossword game only" | 36 terms, id/word/definition in the data file. Five official source organizations are listed only in the approval record. COIN, DEBT, BALANCE and INTEREST were removed under the cross-world uniqueness rule | Governed bank **v2**: 10 standard clusters + 1 two-answer exception, 0 single-term puzzles |
| **Banking Basics** | 26 active (`banking.*`) + 15 reserve | None. Record scope: main game only | 26 terms with definition status, source organization, URL, cluster, verification note. GLOBAL removed; ACCOUNT, AUTOPAY, PRINCIPAL and YIELD are cross-world exclusions | 13 governed two-term clusters, 0 single-term puzzles |
| **Investing Basics** | 25 active (`investing.*`) + 2 reserve | None. Record scope: "does not create lessons, flashcards, quizzes, scenarios, workbook content, or assessments" | 25 terms with source organization, URL and cluster. ALLOT removed; PRICE removed (governed by Money Basics) | 9 clusters: 7 three-word, 2 approved two-word exceptions, 0 single-term puzzles |
| **Crypto Foundations** | 20 curated learning objects; 16 unique target terms across the five legacy levels | No workbook. Each object carries term-level lesson content (definition, example, challenge, related terms) | `content/crypto-terms.json` | No governed static bank is wired (dynamic bank). Live play is one continuous 20-term bank with randomized five-puzzle playthroughs; the per-level and bonus-word arrays are recorded as dead code (`PROJECT_LOG.md`) |

## 3. Matrix — part C (qualifications, decisions, verification)

| World | Known qualifications | Owner decision | Last verified |
|---|---|---|---|
| **Credit Foundations** | (1) "Approved" appears in the directory name (`curriculum/credit/approved/`), the README and the validators' expected `approved_locked` status; the artifacts show a draft-labelled source. `PROJECT_LOG.md` records that the content is "treated as real working source content, not as a passed formal Educational Review … rather than silently upgraded to 'approved & locked'." (2) Two different validators exist: the runtime JSON passes the workbook validator used by `parse-credit-foundations.mjs` (tests pass), but it is not an export of the Approved & Locked curriculum pipeline (`validateCurriculum` rejects it: no `curriculumVersion`, `source` hashes, sections or objectives). Neither fact is a contradiction; they are different gates. (3) The six reports in `reports/` that claim the workbooks are missing remain as history and are superseded. (4) The term list is derived, not independently approved. **Owner qualification (D1, verbatim):** "The existing CRF-001–015 package is approved for the current game, lessons, activities, assessments, and progression. It has not completed the separate Approved & Locked curriculum-import pipeline. Do not rewrite its educational content." | **D1, D2 confirmed 2026-10-17** (CAL-0001, CAL-0002) | 2026-10-17 |
| **Money Basics** | (1) The approval record describes the bank as 14 clusters plus 6 single-term puzzles; the governance decision of 2026-07-23 produced runtime bank v2 (no single-term puzzles; INFLATION and PAYCHECK moved to reserve, "recorded exactly as approved"). The record has not been edited. (2) Data file holds no source metadata. **Owner decision (D3):** the 2026-07-23 puzzle-bank v2 decision is current and supersedes the original bank structure without changing the approved vocabulary | **D3 confirmed 2026-10-17** (CAL-0003) | 2026-10-17 |
| **Banking Basics** | Verbatim from the record: "All other definitions and source mappings are newly reconstructed. They are not represented as verbatim historical approvals." Only CLEAR, LOGIN, SPREAD, LIQUID and PASSKEY reproduce previously recorded approved wording, and SAVINGS and RECURRING are preserved in the reserve. The normalized status is labelled *proposed*. The record's bytes are pinned by a test. **Owner decision (D4):** the retroactive normalization is accepted as the current controlling record, and the qualification that most definitions were reconstructed and are not verbatim historical approvals is preserved | **D4 confirmed 2026-10-17** (CAL-0004) | 2026-10-17 (checksum re-verified) |
| **Investing Basics** | Scope is the main game only. No curriculum for lessons or assessments exists | **D5 confirmed 2026-10-17** (CAL-0005) | 2026-10-17 |
| **Crypto Foundations** | No approval record. **Owner qualification (D6, verbatim):** "Approval covers the existing 20 learning objects and current playable implementation. A dedicated controlling governance record should be created before the content is treated as Approved & Locked or expanded substantially." The stale "only playable world" statements in `CLAUDE.md` and the app description were corrected under D9 | **D6 confirmed 2026-10-17** (CAL-0006) | 2026-10-17 |

### Additions outside the four main-game records (owner decision D7, recorded as CAL-0007)

- **ACH (`banking.ach`) and WORTH (`investing.worth`):** owner-approved in a development session on 2026-10-16 for the V3 puzzle preview. Recorded in `content/v3-supplemental-terms.json` with sources and verification notes. They are **not** in the Banking v1.1 or Investing v1.1 records, and the legacy banks do not use them. **Recorded as separate Owner Approved development decisions (D7, CAL-0007); they do not amend the frozen v1.1 legacy records; V3 remains opt-in until separately authorized for production.**
- **V3 puzzle compositions and cross-world anchors:** owner-approved in sessions (2026-10-14 to 2026-10-17), recorded in the V3 reports. V3 stays opt-in behind `?puzzles=v3`. **Recorded as separate Owner Approved development decisions (D7, CAL-0007); V3 remains opt-in until separately authorized for production.**

## 4. Matrix — part D (eight owner-approved additional worlds)

Owner decision CAL-0009 (2026-10-18) established the following as separate intended playable worlds. CAL-0011 subsequently authorized implementation of every proposal that passed the owner's required review. This supersedes the earlier provisional suggestion that Real Estate might remain inside Investing and Social Media / Digital Income might remain inside Business.

| World | World status | Current runtime status | Vocabulary source | Current proposal status | Qualification |
|---|---|---|---|---|---|
| **Coins & Currency** | **Owner Approved world** | **Playable — 4 puzzles** | `content/2027-new-world-terms.json` | 4 approved and implemented | Expands later; existing cross-world identities preserved |
| **AI & Technology** | **Owner Approved world** | **Playable — 1 puzzle** | `content/2027-new-world-terms.json` | 1 approved and implemented | Owner explicitly allowed one introductory puzzle; tools and platform names remain context-only unless approved |
| **Real Estate** | **Owner Approved world** | **Playable — 2 puzzles** | `content/2027-new-world-terms.json` | 2 approved and implemented | Remains separate from Investing |
| **Taxes** | **Owner Approved world** | **Playable — 3 puzzles** | `content/2027-new-world-terms.json` | 3 approved and implemented | Tax definitions retain official-source links in the term registry |
| **Insurance & Protection** | **Owner Approved world** | **Playable — 4 puzzles** | `content/2027-new-world-terms.json` | 4 implemented; 2 rejected | RENTAL CAR and ROOT CANAL rejected as ineligible anchors |
| **Business & Entrepreneurship** | **Owner Approved world** | **Playable — 10 puzzles** | `content/2027-new-world-terms.json` | 10 approved and implemented | FRACTION is ordinary support, not a permanent financial identity |
| **Social Media & Digital Income** | **Owner Approved world** | **Playable — 2 puzzles** | `content/2027-new-world-terms.json` | 2 approved and implemented | Platform names remain context-only and are not reward terms |
| **Retirement & Wealth Planning** | **Owner Approved world** | **Playable — 5 puzzles** | `content/2027-new-world-terms.json` | 5 implemented; 1 rejected | COMMUNITY rejected as an ineligible anchor |

The machine-readable registry is `content/world-definitions-2027.json`. Vocabulary, puzzle, and study packages are recorded under `staging/research/expansion/2026-10-18/`; the consolidated status report is `docs/FINLIT_QUEST_2027_THIRTEEN_WORLD_EXPANSION.md`.

---

## What was verified on 2026-10-17

Additional verification on 2026-10-18: all eight CAL-0011 worlds are visible and playable. Their 31 approved puzzles are stored in the generated runtime bank; the three rejected proposals remain excluded. The original five worlds and their 27 active V3 compositions are unchanged.

- All five term data files exist with the recorded counts: Credit 38, Money Basics 36, Banking 26, Investing 25, Crypto 20. Reserve files: Banking 15, Investing 2, Money Basics 2.
- The Banking controlling record is byte-identical to its pinned checksum (SHA-256 `9551d337…3ed`, 18,198 bytes).
- 15 Credit workbook objects present in the runtime JSON; the source file is 1,180 lines.
- The governance, content and pipeline tests pass (57 of 57), and the full suite passes (466 of 466).
- No Curriculum Approval Log exists anywhere in the repository.

---

## Owner decisions D1–D10 (presented 2026-10-17, confirmed 2026-10-17)

The table preserves the original options. The **Outcome** column is the owner's decision, recorded verbatim in `docs/CURRICULUM_APPROVAL_LOG.md`.

| # | Decision presented | Options the artifacts supported | Outcome (owner, 2026-10-17) | Log |
|---|---|---|---|---|
| **D1** | Status of the **Credit Foundations curriculum** | Draft (the source's own label); Under Review; Owner Approved or Approved with Qualification; Approved & Locked once the workbooks, Approval Log and Controlled Values exist | **Approved with Qualification** for V1 implementation; not Approved & Locked; do not rewrite its educational content | CAL-0001 |
| **D2** | Credit **permanent-ID registry** (38 IDs) | Confirm, or restate the scope | **Owner Approved**, effective 2026-10-14, scoped to permanent term IDs | CAL-0002 |
| **D3** | **Money Basics** status mapping, approver, and bank v2 | Confirm / correct | **Owner Approved**; approver is the FinLit Quest owner; bank v2 is current and supersedes the original bank structure, vocabulary unchanged | CAL-0003 |
| **D4** | **Banking Basics** status and the retroactive normalization | Confirm / revise | **Approved with Qualification**; the normalization is the current controlling record; the reconstructed-definitions qualification is preserved | CAL-0004 |
| **D5** | **Investing Basics** status and approver | Confirm / correct | **Owner Approved**; approver is the FinLit Quest owner | CAL-0005 |
| **D6** | **Crypto Foundations** approval record or status | Owner Approved / Approved with Qualification / Draft / Deferred | **Approved with Qualification** for V1 gameplay; a dedicated controlling governance record is needed before Approved & Locked or substantial expansion | CAL-0006 |
| **D7** | Record **ACH, WORTH and the V3 compositions** | Record / leave in the V3 reports | Recorded as separate **Owner Approved** development decisions; no amendment to the v1.1 legacy records; V3 opt-in until separately authorized | CAL-0007 |
| **D8** | Where the **Curriculum Approval Log** lives and who may add entries | Owner to specify | `docs/CURRICULUM_APPROVAL_LOG.md`; only the owner decides; Codex records verbatim and never infers | created |
| **D9** | Stale statements in `CLAUDE.md` and the app description | Update / leave | Updated to the five-world V1 application; no curriculum content changed | `PROJECT_LOG.md` |
| **D10** | October project history in `PROJECT_LOG.md` | Backfill / start fresh | One concise backfill entry, evidence-based, no fabricated dates | `PROJECT_LOG.md` |

**Going forward:** treat this confirmed matrix and the Approval Log as authoritative. Do not repeat this audit unless a defined trigger occurs (a controlling file changes, a new version or world arrives, two authoritative records conflict, validation detects changed IDs, definitions or relationships, a checksum fails, or the owner asks). When a status changes, append a new Approval Log entry (never edit an old one), update this matrix, and record it in `PROJECT_LOG.md`.

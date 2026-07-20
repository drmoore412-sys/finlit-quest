# Two-World Content Status

**Updated:** 2026-07-19 (revised same day — workbook engine built and browser-verified)
**Rule applied:** a workbook is not "complete" because a Markdown/JSON file exists — it must be usable in the actual application (learning, practice, assessment, completion, progress tracking, unlocking, replay). Columns below distinguish content existing from content being playable.

## World 1: Credit Foundations

All columns below reflect one generic, data-driven engine (`workbook-app.js` + `src/workbook-engine.js` + `learning-engine.js` workbook-progress methods) that runs identically for every workbook — there is no per-workbook custom code. Verified via: 70/70 automated tests (including 13 content/validator tests), plus a live browser session (real click-through, not simulated) that played CRF-001 start to finish — lesson → flashcards → matching (including a deliberate wrong match) → 8-question quiz — reached the results screen with the correct score (8/8, 100%) and correct +100 XP, then confirmed CRF-001 showed "Completed" and CRF-002 unlocked, confirmed CRF-002's distinct content rendered correctly, and confirmed all state survived a full page reload (localStorage). A real bug was found and fixed during this verification: the "Back" button silently failed to return to the dashboard from the workbook map (string mismatch, `"map"` vs `"workbookMapView"`) — fixed and re-verified.

| Workbook ID | Title | Content loaded | Lessons working | Flashcards working | Quiz working | Interactive activity working | Assessment working | Progress saving | Unlock rule working | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| CRF-001 | What Is Credit? | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (live-verified) |
| CRF-002 | Borrower | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (live-verified) |
| CRF-003 | Creditor (Lender) | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-004 | Debt | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-005 | Loan | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-006 | Principal | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-007 | Interest | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-008 | Interest Rate, APR, and APY | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-009 | Repayment | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-010 | Loan Agreement | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-011 | Secured vs. Unsecured Credit | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-012 | Installment vs. Revolving Credit | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-013 | Creditworthiness | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-014 | Delinquency | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |
| CRF-015 | Default | YES | YES | YES | YES | YES | YES | YES | YES | PLAYABLE (same engine, content-verified by tests) |

**World-level notes:**
- Source: `curriculum/credit/approved/workbooks/CRF-001-015-source.md` (immutable, user-supplied 2026-07-19, labeled "draft for integration and final editorial review" — not a formally passed Educational Review under this project's own WRR pipeline).
- Runtime: `curriculum/credit/approved/runtime/credit-foundations.json` (+ `.js` adapter for `file://`/no-server use), generated and validated by `scripts/parse-credit-foundations.mjs` against `schemas/workbook.schema.json` / `schemas/workbook-world.schema.json`.
- New app files: `workbook-app.js` (controller), `src/workbook-engine.js` (pure scoring/unlock logic), `workbook-engine.css` (theme-aware, light/dark). The "Credit Foundations" journey-map node — which previously opened mislabeled Crypto content — now opens this real workbook world.
- XP/progress reuse the existing save file (`learning-engine.js`, save v3, `save.worlds["credit-foundations"]`) rather than a separate persistence layer. XP is only awarded on first pass of a workbook (duplicate-farming prevention verified by test).
- **Explicitly not built yet**, i.e. genuinely missing, not just untested: a dedicated learner profile screen; a daily-practice mode mixing missed/recent content across workbooks; a sorting/categorization activity component; credit-score simulation activities; accessibility polish (some workbook-list buttons lack accessible labels — found during verification, not yet fixed); dashboard side-panel stats (streak/mastery ring) still reflect the Crypto world, not Credit Foundations. These are real gaps for a future pass, listed here rather than glossed over.

## World 2: Credit Cards

| Item | Status |
|---|---|
| Workbook count | 13 proposed (research blueprint stage) |
| Content loaded | NO — `research/credit-cards/CREDIT_CARDS_WORLD_BLUEPRINT.md` is a structural/research document ("does not contain Educational Drafts, workbook prose, manifests, runtime specifications" by its own description), not workbook content |
| Lessons/flashcards/quiz/activities/assessment/progress/unlock | NO — nothing to load yet |
| Status | NOT STARTED at the content layer |

**World-level notes:** the blueprint itself states its own freeze condition — workbook development should not begin until Credit Foundations' concept registry is reconciled against it. That reconciliation has not happened. Recommend authoring Credit Cards workbook content in the same Markdown format as the CRF package once Credit Foundations is confirmed playable end to end, so it can go through the same parser/validator/test pipeline built this session.

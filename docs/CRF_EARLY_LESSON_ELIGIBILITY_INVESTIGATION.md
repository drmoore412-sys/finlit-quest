# Investigation: zero eligible puzzles for CRF-001/CRF-002

**Status:** implemented 2026-07-20. The recommendation below (targeted lesson generation + legitimate single-term puzzles + an explicit unplayable-term report) was built, tested, and run for real against the live curriculum. Full implementation detail and results: `docs/PUZZLE_GENERATOR_PIPELINE.md` §5a and its "2026-07-20 (later same day)" Implementation status entry. Short version: CRF-001 went from 0 → 4 eligible puzzles, CRF-002 from 0 → 7, CRF-003/004/005 all reached the 10-puzzle target. CRF-001/002 still can't reach 10 — that's the real combinatorial ceiling this document identified, now reported explicitly by the pipeline instead of silently absent. The wheel budget was deliberately left unraised, per instruction.

Everything below is the original research record and is preserved as-is.

**Trigger:** the real-data sanity check logged in `PROJECT_LOG.md` (2026-07-20) and `docs/PUZZLE_GENERATOR_PIPELINE.md`'s Implementation status section showed CRF-001 and CRF-002 with 0 eligible puzzles out of a 51-puzzle Credit bank, while CRF-005 already had 17.

All numbers below were reproduced directly against the real files (`content/credit-game-terms.json`, `content/puzzle-banks/credit-puzzle-bank.json`, `curriculum/credit/approved/runtime/credit-foundations.json`) via ad hoc Node scripts, not assumed.

---

## What CRF-001/002 actually contain

| Lesson | Cumulative allowed words | In single-word game vocabulary |
|---|---|---|
| CRF-001 | CREDIT, TERMS, ACCOUNT, OBLIGATION | 4/4 |
| CRF-002 | + BORROWER, APPLICANT, COSIGNER, AFFORDABILITY | 8/8 |

**FACT** — vocabulary coverage itself is not the gap: every allowed term for both lessons already exists in `content/credit-game-terms.json` as a playable single word. This rules out "the words were never extracted from the curriculum" as a cause.

## Root cause chain

### 1. The wheel-letter budget (9) eliminates most combinations before tags even matter

`wheelFor(words)` returns one instance of each letter's *maximum* per-word count across the word set, and `wheelWithinBudget` rejects anything over 9 unique letters. Computed directly:

- Single-word wheel sizes: CREDIT=6, TERMS=5, ACCOUNT=7, **OBLIGATION=10**.
- All 6 possible pairs within CRF-001: only **CREDIT+TERMS (8 letters)** fits the budget. ACCOUNT pairs with anything in the set at 11–14 letters; OBLIGATION pairs at 13–14.
- All 28 possible pairs within CRF-002 (8 words): only **1 of 28** fits the budget — the same CREDIT+TERMS pair.

**FACT.** OBLIGATION alone (10 letters) exceeds the 9-letter budget, so it structurally cannot appear in *any* valid puzzle today, regardless of lesson, targeting, or vocabulary size — confirmed by checking the live 51-puzzle bank: OBLIGATION appears in zero puzzles anywhere in the whole world, not just in CRF-001/002.

### 2. Generation is untargeted — it draws from the full 38-word world vocabulary, not the lesson's subset

`generatePuzzleBank` (`src/puzzle-pipeline-service.js`) and `generateCandidate` (`src/puzzle-generator.js`) always sample from the entire world Knowledge Base. The Concept Filter (`filterBankByTags`) is applied only *after* generation, at selection time — nothing in generation is tag-aware. The greedy algorithm also doesn't stop at 2 words; it keeps adding shuffled words up to `maxWords=5` as long as the budget allows, so puzzles tend to fill up close to the 9-letter ceiling (measured average wheel size in the real bank: 8.80/9) by mixing in later-lesson vocabulary.

**FACT**, confirmed two ways against the real 51-puzzle Credit bank:
- 22 of 51 puzzles contain *at least one* CRF-002 word, but **0 of 51** are composed *entirely* of CRF-002 words — later-lesson words keep getting pulled in to fill the wheel.
- No puzzle anywhere in the bank is exactly `[CREDIT, TERMS]`, even though that combination is valid.

### 3. Targeted generation proves eligible puzzles do exist — they're just never found by chance

Re-ran `generateCandidate` restricted to *only* each lesson's allowed vocabulary (200 trials each, no other change):

- CRF-001 (4-word vocabulary): **146/200 succeeded**, always producing `[TERMS, CREDIT]`.
- CRF-002 (8-word vocabulary): **72/200 succeeded**, same result — `[TERMS, CREDIT]` is still the only reachable combination even with 8 words available, because ACCOUNT/BORROWER/APPLICANT/COSIGNER/AFFORDABILITY/OBLIGATION each fail the budget in combination with anything else in the set.

**FACT.** At least one valid, tag-eligible puzzle exists for both lessons. The pipeline's *filter* is not wrong — a puzzle that is `[CREDIT, TERMS]` genuinely does pass `filterBankByTags` for CRF-001. The reason the real bank has zero is that untargeted random generation over 38 words essentially never happens to land on and stop at exactly that one pair (statistically: for CRF-001, drawing 2 words uniformly from 38 and having them be exactly `{CREDIT, TERMS}` in either order is roughly a 1-in-700 draw, before even accounting for the greedy loop trying to extend further).

### 4. The crossword layout algorithm is not the constraint

`layoutWords` always returns exactly one placement per required word — it falls back to stacking a word with no letter overlap rather than failing (confirmed directly: `layoutWords(['CREDIT','TERMS'])` and single-word calls all return a full placement, and `crosswordPlaceable` never appeared as a validator error reason in any run this investigation performed). Intersection is a nice-to-have the layout tries for, not a hard requirement anywhere in the validator.

### 5. `wordCountInRange` (min 2) is the only thing blocking single-word puzzles, and it doesn't block them uniformly

Validated a single-word `CREDIT` puzzle directly: it fails **only** `wordCountInRange` — every other check (buildability, wheel budget, crossword placement, difficulty, definition, hint) passes cleanly. Same test for `OBLIGATION` fails **both** `wordCountInRange` and `wheelWithinBudget` — a single-word minimum wouldn't rescue it, the letter budget would still need to change.

---

## Direct answers

1. **Is this caused by insufficient vocabulary in the early lessons?**
   **HYPOTHESIS→FACT (partially), refined.** Not literal scarcity (all 4/8 terms exist in the game vocabulary), but effective scarcity under the wheel-budget rule: CRF-001 has only 1 valid 2-word combination out of 6 possible, CRF-002 only 1 out of 28. Vocabulary quantity isn't the bottleneck; vocabulary *letter-diversity relative to the 9-letter wheel budget* is.

2. **Is the crossword generation algorithm requiring too many intersecting words?**
   **FACT: no.** `layoutWords` never rejects a word set for lack of intersection; it always places every word. Ruled out.

3. **Are puzzle validation rules too strict?**
   **HYPOTHESIS, leaning no as currently designed, but the wheel-budget constant (9) is the load-bearing rule.** It's doing exactly what it's supposed to (bound wheel-widget size for a playable UI), but combined with a tiny early-lesson vocabulary it becomes the binding constraint. Not a bug in the validator; a mismatch between a fixed global budget and lesson-scoped vocabulary size.

4. **Are concept-tag filters excluding otherwise valid puzzles?**
   **FACT: not incorrectly.** The filter is applied correctly and would happily accept `[CREDIT, TERMS]` for CRF-001. The real problem is upstream: generation is untargeted, so tag-eligible candidates are never (or almost never) produced in the first place. This is a **generation-targeting gap**, not a filter defect.

5. **Would allowing single-focus-term puzzles in early lessons solve the issue?**
   **HYPOTHESIS, evidence-backed, partial yes.** Would immediately unlock CREDIT, TERMS, and ACCOUNT as standalone puzzles for CRF-001 (3 more valid contents) — each passes every other check today. Would **not** unlock OBLIGATION (still exceeds wheel budget alone). Also doesn't by itself fix the *targeting* gap — generation still needs to specifically try lesson-scoped vocabulary rather than relying on chance.

6. **Would smaller crossword layouts (2–3 word boards) be appropriate for beginner lessons?**
   **FACT, already true in practice.** The bank already skews small (avg 2.8 required words, avg wheel size 8.8/9) because the greedy budget-limited algorithm naturally stops early. Board size isn't the problem — which specific 2–3 words get chosen is. Explicitly capping `maxWords` lower for early lessons wouldn't change the eligibility count, since 2-word is already the ceiling that's actually reachable for CRF-001/002.

7. **Should puzzle complexity increase as lessons unlock more concepts?**
   **HYPOTHESIS, consistent with observed data, recommended direction.** The real bank already shows this trend organically for later lessons (CRF-005 at 17 eligible puzzles vs. CRF-001/002 at 0), because a larger allowed-vocabulary pool has combinatorially more budget-fitting combinations. Making it explicit (e.g. lower `maxWords`/allow single-term puzzles for early lessons, standard settings once a lesson's allowed vocabulary is large enough to sustain them) would match the natural difficulty curve rather than leave the earliest lessons structurally empty.

## UNKNOWN / not yet investigated

- Whether raising `wheelBudget` above 9 for long words like OBLIGATION is acceptable from a UI/UX standpoint (does the letter-wheel widget visually support 10+ letters without redesign?). Not tested — would need to check `word-game-app.js`'s wheel rendering, not just the pure logic layer.
- Whether other early lessons across the 15-workbook sequence (CRF-003/004, and any future Credit Cards world lessons) hit the same wall, or whether CRF-001/002 are outliers because of unusually long/rare-lettered terms (OBLIGATION, AFFORDABILITY). Only CRF-001–005 were sampled.
- Player-facing tolerance: is a lesson with only 1–4 valid puzzle contents (vs. the `requiredPuzzles` config target of 5) an acceptable experience (heavy repetition) or does it need a design accommodation (e.g. fewer required puzzles for early lessons, mixing in a non-puzzle activity)? This is a product/UX judgment call, not something the data alone resolves.

## Recommendation (not implemented)

The fix is a **generation-targeting change**, not a validator or filter change:

1. Extend puzzle generation to optionally restrict its candidate vocabulary to a specific lesson's cumulative allowlist (`deriveCumulativeAllowlists` already produces exactly this list) when deliberately backfilling early-lesson coverage — i.e., run `generatePuzzleBank` per-lesson-vocabulary-subset as a targeted supplemental pass, still writing into the one world-scoped bank, rather than relying on the full-vocabulary untargeted pass to stumble onto lesson-pure combinations by chance.
2. Separately consider relaxing `wordCountInRange` to allow single-focus-term puzzles (min 1), which is proven to add 3 more valid CRF-001 contents at zero cost to any other validation rule.
3. Flag (don't silently drop) vocabulary terms that exceed the wheel budget alone (OBLIGATION today) — either exclude them from puzzle generation with a logged reason, or treat raising `wheelBudget` as a separate UX decision to evaluate before making it globally.
4. Treat "should complexity scale with unlocked concept count" as a per-lesson generation parameter (e.g. smaller `maxWords`/`wheelBudget` targets for early lessons) once targeted generation exists, rather than trying to force early lessons to match the same shape as later ones.

No changes have been made to `src/puzzle-generator.js`, `src/puzzle-validator.js`, `src/puzzle-pipeline-service.js`, or any gameplay file as part of this investigation.

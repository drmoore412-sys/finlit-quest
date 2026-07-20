# Puzzle Generator Pipeline — Architecture (approved, implementing)

**Status:** reviewed and approved 2026-07-19. Model: world-scoped Knowledge Graph. See "Decisions made" at the end for the exact direction given.

This is **not a rewrite**. It extends what already exists and is already tested/live-verified this session:

- `src/game-engine.js` — `layoutWords`, `wheelFor`, `canForm` (crossword placement, wheel-letter budgeting, word buildability)
- `src/puzzle-bank-engine.js` — `buildBank`, `selectPlaythrough`, `recordPlaythrough` (bank building, anti-repetition selection, play history)
- `word-game-app.js` — per-world `bankSize`/`requiredPuzzles` config, persistence under `learning.save.worlds[key]`

Everything below builds on that foundation.

---

## 1. The core model: Knowledge Graph, not per-lesson banks

The spec's own example (`CRF-001` with 150+ puzzles) was in tension with itself: a single Credit Foundations workbook only has ~5 vocabulary terms, and 5 terms cannot combinatorially produce 150 distinct valid puzzles. The resolution (direction given during review, not my original proposal):

```
World
 │
 ├── Knowledge Base   — ALL vocabulary + definitions + relationships for this world
 │                       (Credit's Knowledge Base today = the 38-term flashcard pool
 │                        already extracted from the 15 CRF workbooks; grows over
 │                        time independent of any one lesson)
 │
 ├── Puzzle Bank       — generated from the WHOLE Knowledge Base, not per-lesson.
 │                       Large (world-scale: 100s–1000s achievable as the Knowledge
 │                       Base grows), because it draws from all terms at once.
 │                       Each puzzle is tagged with the concept(s) it covers.
 │
 ├── Lessons           — do NOT own a puzzle bank. A lesson just declares which
 │                       concepts are unlocked (a tag allowlist) + a target
 │                       difficulty. CRF-001 allows {Credit, Borrower, Creditor,
 │                       Debt, Loan}; CRF-002 allows CRF-001's set plus its own new
 │                       terms — cumulative, matching the existing sequential
 │                       workbook unlock order.
 │
 └── Game Engine       — at play time: filter the world Puzzle Bank down to
                          puzzles whose tags are within the current lesson's
                          allowlist, THEN run the existing anti-repetition
                          selection (selectPlaythrough) on that filtered subset.
                          Unchanged selection logic — it just now runs on a
                          filtered view instead of the whole bank.
```

This scales correctly: the Knowledge Base and Puzzle Bank grow with the *world*, not per-lesson. Early lessons naturally have fewer eligible puzzles (few unlocked concepts); later lessons draw from a richer eligible set — without the bank ever being rebuilt or duplicated per lesson.

## 2. Pipeline stages

```
World Knowledge Base (vocabulary + definitions, world-scoped)
        │
        ▼
Puzzle Generator   — builds one candidate: letters, required words, bonus words, focus word, tags
        │
        ▼
Difficulty Scorer  — pure function, candidate → Easy/Medium/Hard/Expert
        │
        ▼
Hint Generator     — pure function, candidate → hint string (pluggable strategy, §6)
        │
        ▼
Puzzle Validator   — candidate + existing IDs → {valid, errors[]}; invalid candidates discarded, not stored
        │
        ▼
Puzzle Assembler   — attaches id/worldId/tags/estimatedSolveSeconds/generatorVersion → final record
        │
        ▼
Puzzle Storage     — persisted, world-scoped bank (extends existing learning.save.worlds[key].puzzleBank)
        │
        ▼
Concept Filter     — NEW: lesson's allowed-concept tags → filtered view of the world bank
        │
        ▼
Playthrough Selector — existing selectPlaythrough, unchanged, now runs on the filtered view
        │
        ▼
Game Engine        — unchanged. Doesn't know or care how a puzzle was produced or filtered.
```

Every stage is a pure `(input) → output` function — no stage reaches into global state. This is what makes "future AI support" (§7) a swap-in rather than a rewrite.

## 3. Puzzle schema

```ts
{
  id: string;               // "{worldId}-P{seq:04}", e.g. "CREDIT-P0231" — world-scoped, not lesson-scoped
  worldId: string;          // "crypto" | "credit" | future worlds
  tags: string[];           // concept ids this puzzle covers — today, the required words themselves
                             // (no separate concept-id system exists yet beyond vocabulary terms;
                             // see §5 for how lessons use this)
  letters: string[];        // wheel letters, from wheelFor()
  requiredWords: string[];  // must all be found to complete the puzzle
  bonusWords: string[];     // formable from the wheel, not required
  focusWord: string;        // the primary vocabulary term this puzzle centers on
  definition: string;       // focusWord's definition (copied from Knowledge Base, not re-authored)
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  hint: string;
  estimatedSolveSeconds: number;
  generatorVersion: number; // bumped when generation/validation/scoring logic changes
  createdAt: string;        // ISO timestamp
  puzzleMode: "multi-term" | "single-term";        // added 2026-07-20, see §5a
  eligibleLessonIds: string[];                      // added 2026-07-20, see §5a — denormalized cache, not authoritative
  sourceGenerationScope: {type:"world"} | {type:"lesson", lessonId:string}; // added 2026-07-20
}
```

`requiredWords`/`letters` map directly to what `wgState.words`/wheel rendering already consume — the game engine's input shape doesn't change. `lessonId` is deliberately **not** the primary eligibility mechanism on the puzzle record — eligibility is computed at selection time from `tags` via `filterBankByTags`, which remains the source of truth. `eligibleLessonIds` (added 2026-07-20) is a denormalized read-convenience cache computed once at generation time from `tags` + the full lesson-allowlist map (`computeEligibleLessons`) — it can go stale if allowlists change later, and any caller doing real filtering should still re-derive from `tags`, not trust this field blindly.

## 4. Puzzle Generator

Extends `buildOneCandidate` (currently in `puzzle-bank-engine.js`):

- **Focus word**: optionally pinned so puzzles can be framed around a specific concept. Unspecified → random first pick (today's behavior, unchanged).
- **Bonus words**: after the required set is chosen, scan a bonus-word pool for any other term fully formable from the resulting wheel (via `canForm`, already exists, already tested) that isn't already required. `generateCandidate`'s `bonusVocabulary` option (added 2026-07-20) lets this pool differ from the required-word pool — see §5a, this matters for lesson-targeted generation.
- **Tags**: the required words themselves (today's only "concept id" — see §5 for why this is enough for now).
- **Mode** (added 2026-07-20, see §5a): `"multi-term"` (default, unchanged behavior, requires ≥2 words) or `"single-term"` (exactly 1 required word, pinned via `focusWord`).

## 5. Lesson concept eligibility

A lesson's allowlist is **cumulative** vocabulary from its own flashcards plus every prerequisite lesson's, matching the sequential unlock order Credit Foundations already enforces (CRF-002 requires CRF-001 complete, etc. — see `src/workbook-engine.js`). For Credit, this is derived directly from data that already exists (`curriculum/credit/approved/runtime/credit-foundations.json`), no new authoring needed:

```
CRF-001 allowed tags: {CREDIT, TERMS, ACCOUNT, OBLIGATION, ...CRF-001's flashcard terms}
CRF-002 allowed tags: CRF-001's set ∪ CRF-002's own flashcard terms
CRF-003 allowed tags: CRF-002's set ∪ CRF-003's own flashcard terms
...cumulative through CRF-015
```

A puzzle is eligible for a lesson if **every tag on the puzzle** is in the lesson's allowed set (not just one) — this keeps early lessons from surfacing puzzles that mix in not-yet-learned vocabulary.

For Crypto (no discrete lessons yet), the whole world's vocabulary is one implicit allowlist — equivalent to today's behavior, nothing changes for it.

## 5a. Lesson-targeted generation and single-term puzzles (added 2026-07-20)

**Why this exists:** `docs/CRF_EARLY_LESSON_ELIGIBILITY_INVESTIGATION.md` found that §2's untargeted world-level generation essentially never produces puzzles whose tags fit a *small* early lesson's allowlist by chance — for CRF-001 (4 allowed words), only 1 of 6 possible word pairs even fits the 9-letter wheel budget, and drawing exactly that pair from the full 38-word world vocabulary at random is roughly a 1-in-700 event. The Concept Filter (§2, `filterBankByTags`) was never the problem — it correctly accepts a `[CREDIT, TERMS]` puzzle for CRF-001, one just almost never got generated in the first place.

**The fix is generation-targeting, not filter-loosening.** `src/puzzle-pipeline-service.js`'s `generateLessonPuzzles(worldVocabulary, worldId, lessonId, allowedTags, count, deps, options)` restricts the *required/focus-word* pool to exactly `allowedTags` (the lesson's cumulative allowlist), while still scanning the *full* `worldVocabulary` for bonus words (via `generateCandidate`'s `bonusVocabulary` option) so bonus-word detection isn't artificially starved by a tiny lesson vocabulary. It:

1. **Counts what's already eligible.** `filterBankByTags(existingBank, allowedTags)` — puzzles already in the shared world bank that happen to qualify (e.g. generated for an earlier, smaller-allowlist lesson whose puzzles remain eligible for every later lesson, since allowlists are cumulative) count toward `count` before anything new is generated. This is also what makes the function idempotent: a second call against a bank that already meets `count` adds nothing.
2. **Generates multi-term puzzles first**, restricted to the lesson vocabulary, up to the shortfall.
3. **Fills any remaining shortfall with single-term puzzles** — one required word, pinned via `focusWord`, mode `"single-term"`. Confirmed cheap to validate: a single-word puzzle fails only `wordCountInRange` under the old rule (`checkWordCount` in `puzzle-validator.js` is now `puzzleMode`-aware: exactly 1 word for `"single-term"`, the original `[2,5]` range unchanged for everything else — no other check is loosened).
4. **Never fabricates a duplicate signature to reach `count`.** Every candidate is deduped by content (`puzzleId(requiredWords)`, reused from `puzzle-bank-engine.js`) before being added.
5. **Reports a genuine shortfall instead of hiding it.** If `alreadyEligible + generated < count`, a structured warning (`{worldId, lessonId, requested, produced, shortfall, reason, limitingTerms, unplayableTerms}`) is returned — this is what surfaced CRF-001 (4/10) and CRF-002 (7/10) as real, expected shortfalls when the pipeline was run against the live curriculum, not bugs to chase.

**Unplayable-term detection** (`detectUnplayableTerms(vocabulary, worldId, lessonId, wheelForFn, wheelBudget)`): scans a vocabulary for any single word whose own wheel size exceeds the budget (OBLIGATION at 10 letters vs. a 9-letter budget is the canonical example) and returns `{worldId, lessonId, term, normalizedLength, configuredWheelLimit, reason, status:"unplayable_under_current_budget"}` for each. These terms are never silently dropped — `generateLessonPuzzles` runs this up front and skips known-unplayable terms in its single-term pass (no wasted generation attempts), and the CLI persists every finding to `content/puzzle-banks/<world>-unplayable-terms.json` (§11). Per explicit instruction, the wheel budget itself was **not** raised in this pass — raising it is a separate UX decision (does the letter-wheel widget support 10+ letters?) that remains open.

**`computeEligibleLessons(tags, lessonAllowlists)`** is the per-puzzle companion to `filterBankByTags` (which filters a whole bank by one allowlist) — given every lesson's allowlist, it returns which lessons a single puzzle's tags qualify for, used to populate the `eligibleLessonIds` denormalized field at generation time.

## 6. Difficulty Scorer

Deterministic composite score, 0–100, bucketed:

| Factor | Contribution |
|---|---|
| Wheel size (letter count) | +2 pts per letter above 4 |
| Rare letters present (J,K,Q,V,W,X,Y,Z) | +6 pts each |
| Average required-word length | +3 pts per letter above 4 |
| Bonus word count | +2 pts each |
| Focus word length | +2 pts per letter above 5 |

`Easy` (0–25) / `Medium` (26–50) / `Hard` (51–75) / `Expert` (76–100). Unit-testable in isolation; tunable later without touching the generator (the "automatic difficulty tuning" future-AI hook — a smarter scorer is a drop-in replacement).

## 7. Hint Generator

No LLM available in this static app today, so the initial strategy is deterministic and definition-derived: `"A {length}-letter word. {first clause of the definition}."` Written as a pluggable strategy (`generateHint(candidate, strategy)`, default `"definition-clause"`) specifically so an LLM-backed strategy can be substituted later without touching anything else.

## 8. Puzzle Validator

Named checks, reject-and-discard (not reject-and-crash):

- `focusWordExists`, `everyRequiredWordBuildable`, `noImpossibleBonusWords`, `crosswordPlaceable`, `wordCountInRange` (config, default 2–5; **`puzzleMode`-aware since 2026-07-20** — exactly 1 word for `"single-term"`, unchanged `[2,5]` for everything else, see §5a), `wheelWithinBudget` (config, default ≤9, unchanged), `noDuplicateId`, `difficultyAssigned`, `definitionPresent`, `hintPresent`, `puzzleModeValid` (added 2026-07-20 — flags anything other than `"multi-term"`/`"single-term"` if `puzzleMode` is set at all; legacy records with no `puzzleMode` are unaffected).

Returns `{valid, errors[]}`. The bank-building loop discards invalid candidates and keeps generating, same retry pattern `buildBank` already uses, with real named failure reasons instead of a silent skip. No existing check was loosened to support single-term puzzles — `wordCountInRange` gained a legitimate second shape, it didn't get more permissive for the default shape.

## 9. Future AI support

Every stage is a pure function with a stable signature. "LLM-generated crossword layouts," "automatic hint generation," "difficulty tuning," "duplicate detection" (already *is* `noDuplicateId`), "crossword optimization" are each just an alternative implementation of one existing stage. Nothing architecturally new is needed later.

## 10. Storage & migration

Existing persisted banks (`learning.save.worlds[key].puzzleBank`, shape `{id, words, letters}`) predate this schema. Migration matches the pattern already used for save-version upgrades in `learning-engine.js`: on load, any bank entry missing new fields gets them backfilled (tags default to `requiredWords`; difficulty/hint/bonusWords/estimatedSolveSeconds computed from existing data). Non-destructive, no forced regeneration, no save-version bump.

## 11. Admin tooling — Phase 1 = Engine, Phase 2 = Admin Console

Per direction: CLI only this phase, but the CLI scripts contain **no business logic** — they are thin argument-parsing/file-I/O wrappers that call the same `src/*.js` service functions the live app will eventually call. A future web admin console reuses those exact services; it becomes a presentation layer, not a rewrite.

- `scripts/generate-puzzle-bank.mjs --world=<id> --size=<n> [--out=<file>]` — untargeted, world-level (§2).
- `scripts/generate-puzzle-bank.mjs --world=<id> --lesson=<lessonId> --count=<n> [--out=<file>]` — added 2026-07-20, lesson-targeted (§5a), single lesson.
- `scripts/generate-puzzle-bank.mjs --world=<id> --through=<lessonId> --count-per-lesson=<n> [--out=<file>]` — added 2026-07-20, every lesson from sequence 1 through the given one.
- `scripts/generate-puzzle-bank.mjs --world=<id> --all-lessons --count-per-lesson=<n> [--out=<file>]` — added 2026-07-20, every lesson in the world.
- `scripts/validate-puzzle-bank.mjs <file>`
- `scripts/regenerate-puzzle.mjs <file> <puzzleId>` — respects the target puzzle's `puzzleMode` and, for a lesson-scoped puzzle, regenerates from that same restricted lesson vocabulary (not the whole world) so the replacement can't silently pull in not-yet-unlocked words.
- Lesson-targeted modes also write/merge `content/puzzle-banks/<world>-unplayable-terms.json` (§5a) whenever a lesson's vocabulary contains a structurally unplayable term.
- Export/import are the JSON file itself; `validate-puzzle-bank.mjs` doubles as the import check.

**Phase 2 (explicitly deferred, not silently dropped):** an interactive preview/approve/reject screen. Not built this pass — would be new UI, and this pass is scoped as backend content generation only.

---

## Decisions made (review gate)

1. **Bank scoping:** world-scoped Puzzle Bank backed by a world-scoped Knowledge Base. Lessons do not own puzzle banks. Lessons define unlocked concepts (tags) the Puzzle Generator/selector may draw from. Puzzles are tagged by concept and difficulty. (Full direction quoted in project log.)
2. **Admin tooling:** CLI only this phase. Services architected UI-agnostic so a future Admin Console is a presentation layer over the same code, not a refactor.

## Implementation status

Implemented and verified 2026-07-20. New files: `src/puzzle-generator.js`, `src/difficulty-scorer.js`, `src/hint-generator.js`, `src/puzzle-validator.js`, `src/puzzle-pipeline-service.js`, `src/puzzle-bank-migration.js`, `scripts/generate-puzzle-bank.mjs`, `scripts/validate-puzzle-bank.mjs`, `scripts/regenerate-puzzle.mjs`, `scripts/puzzle-cli-shared.mjs` (shared argv/dep wiring, no business logic). 27 new tests in `tests/puzzle-pipeline.test.js`; full suite is 116/116 passing (`./scripts/test.sh`).

CLI tools were run for real against live content, not just unit-tested:

- `generate-puzzle-bank.mjs --world=crypto --size=40` → 40/40 valid, wrote `content/puzzle-banks/crypto-puzzle-bank.json`.
- `generate-puzzle-bank.mjs --world=credit --size=60` → **51/60**, with an explicit warning printed rather than a silent short bank. Credit's 38-term Knowledge Base genuinely tops out around there at today's `maxWords=5`/`wheelBudget=9` defaults — this is the §1 scaling tension surfacing honestly in real output, not a bug. Growing the bank further means growing the Knowledge Base (more Credit vocabulary), which is a content task, not an engineering one.
- `validate-puzzle-bank.mjs` on both banks → 100% valid.
- `generate-puzzle-bank.mjs` re-run at the same size on top of the existing credit bank → correctly reported `0 new` (idempotent top-up).
- `regenerate-puzzle.mjs` on `CREDIT-P0001` → produced a different valid word set for the same focus word/id, bank re-validated clean afterward.
- Concept-filter sanity check against the real credit bank + `deriveCumulativeAllowlists` output: CRF-001/CRF-002 (4–8 allowed concepts) had **0** eligible puzzles out of 51; CRF-005 (18 allowed concepts) had 17. Eligible count grows monotonically lesson-over-lesson as designed. Confirms the model is sound, and confirms that early-lesson puzzle variety depends on Knowledge Base size, not on this pipeline.

Not done in this pass, deliberately: no wiring into `word-game-app.js`/live gameplay, no admin UI. Both remain out of scope per the approved Phase 1 = Engine plan.

### 2026-07-20 (later same day) — lesson-targeted generation and single-term puzzles

Implements the fix recommended in `docs/CRF_EARLY_LESSON_ELIGIBILITY_INVESTIGATION.md` (§5a above has full detail). Modified: `src/puzzle-generator.js` (`mode`/`bonusVocabulary` options), `src/puzzle-validator.js` (`puzzleMode`-aware `wordCountInRange`, new `puzzleModeValid` check, `assemblePuzzle` gained `puzzleMode`/`eligibleLessonIds`/`sourceGenerationScope`), `src/puzzle-pipeline-service.js` (`generateLessonPuzzles`, `detectUnplayableTerms`, `computeEligibleLessons`), `scripts/generate-puzzle-bank.mjs` (`--lesson`/`--through`/`--all-lessons` modes), `scripts/regenerate-puzzle.mjs` (mode/scope-aware). 19 new tests in `tests/puzzle-lesson-generation.test.js`; full suite is 135/135 passing.

Run for real against the live Credit Foundations curriculum (`--through=CRF-005 --count-per-lesson=10`, then `--all-lessons --count-per-lesson=8` and a standalone `--lesson=CRF-003 --count=12`):

- **CRF-001: 4/10.** 1 multi-term (`CREDIT`+`TERMS`, the only pair that fits the wheel budget) + 3 single-term (`CREDIT`, `TERMS`, `ACCOUNT`). Shortfall of 6 reported explicitly, not padded with duplicates. `OBLIGATION` (10 letters) reported unplayable.
- **CRF-002: 7/10.** The CRF-001 puzzles carry forward automatically (cumulative allowlist), plus 3 new single-term puzzles (`BORROWER`, `APPLICANT`, `COSIGNER`). Shortfall of 3. `OBLIGATION` and `AFFORDABILITY` (13 letters) reported unplayable.
- **CRF-003: 11/10, CRF-004: 14/10, CRF-005: 24/10 — target met**, confirming the acceptance criteria are reachable once a lesson's vocabulary is large enough; no fabrication was needed for these.
- **`--all-lessons --count-per-lesson=8` across all 15 CRF workbooks**: CRF-003 through CRF-015 all hit 8/8 (CRF-004 onward needed **zero** new generation — earlier lessons' cumulative puzzles already covered them). Confirms the cumulative-reuse design works end-to-end across the whole curriculum, not just the first 5 lessons.
- **Idempotency confirmed live**, not just in tests: re-running the identical `--through=CRF-005` command reported `0 new` for every lesson, including the two short lessons (the shortfall is real and stable, not retried into duplicates).
- **`regenerate-puzzle.mjs` verified on a lesson-scoped single-term puzzle** (`CREDIT-P0053`, CRF-001): correctly preserved `puzzleMode:"single-term"` and `sourceGenerationScope:{type:"lesson", lessonId:"CRF-001"}` after regeneration; bank re-validated 58/58 clean.
- Every bank produced in this pass validated 100% (`validate-puzzle-bank.mjs`) — no invalid puzzle was ever written to a bank file.

**Per explicit instruction, the wheel budget was not raised.** CRF-001/CRF-002 falling short of 10 is the honest, expected result of that constraint interacting with a genuinely small early-lesson vocabulary — not a defect in this implementation. Raising the budget, growing Credit's early-lesson vocabulary, or accepting a lower `requiredPuzzles` target for the earliest lessons are the follow-up options, and remain product/content decisions, not engineering ones. Still not done in this pass: wiring any of this into `word-game-app.js`/live gameplay, and no admin UI.

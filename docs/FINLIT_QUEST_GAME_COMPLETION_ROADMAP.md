# FinLit Quest Is Playable, but Four Worlds Still Need Their Learning Experience

**Inventory date:** 2026-10-17  
**Document status:** Current development roadmap — owner review required for scope decisions  
**Current Phase:** **Active Game Development and Curriculum Completion**  
**Release Status:** **Not ready — significant planned content and gameplay remain unfinished**  
**Next Task:** **Comprehensive Game Completion and Feature Inventory** — completed by this document; owner decisions are the next gate

## Executive summary

- FinLit Quest has a strong playable foundation: five selectable Word Quest worlds, 27 governed multi-word crosswords, 155 implemented governed financial identities, definitions after completion, coins, XP, hints, audio, daily login rewards, achievements, local saves, and a tested shared puzzle engine.
- The educational product is not complete. Only **Credit Foundations** has playable lessons, flashcards, matching, and assessments. The other four Learning Quest cards say **Coming soon**.
- Credit Foundations contains 15 workbooks, 128 rendered lesson steps, 75 flashcards, 60 matching pairs, and 120 rendered quiz questions. It also contains 15 scenario records that the current workbook interface does not render.
- Crypto has 20 rich learning objects with examples, mistakes, related terms, and quick challenges, but the current shared Word Quest does not open that seven-step learning flow. Its Learning Quest still says Coming soon.
- The active 27-puzzle slate exposes only **49 unique financial term IDs** across five worlds. The proposed 27-puzzle expansion is valid research but remains pending owner review and is not active.
- The curriculum import, objective progress, spaced-repetition, Scenario Library, and Challenge Library architecture is partly built, but architecture readiness is not the same as learner-facing functionality. Scenario and Challenge libraries do not exist as approved runtime libraries.
- Earlier labels such as “V1,” “post-V1,” or “release freeze” do not decide the new completion scope. Those scope decisions return to the owner.

## 1. Current product boundary

### Implemented and learner-facing

- Welcome screen and five-world journey selection.
- Word Quests / Learning Quests navigation.
- Five playable Word Quest worlds: Money Basics, Credit, Crypto, Banking Basics, and Investing Basics.
- Twenty-seven active V3 crossword quizzes, each containing three or four required words; no active one-word puzzle.
- Shared letter wheel, tap/drag input, strict crossword layout, duplicate-letter handling, shuffle, free tutorial hints, normal paid hints, and multi-answer completion.
- Governed financial-term definitions after puzzle completion.
- First-discovery coin and XP rewards, duplicate-reward protection, coin celebration, puzzle-completion celebration, sound controls, dark mode, streaks, achievements, daily login rewards, and local persistence.
- Credit Foundations Learning Quest: lessons, flashcards, matching practice, quizzes, results, XP, completion, prerequisite unlocking, and progress persistence.

### Implemented in engines or data, but not fully learner-facing

- SM-2-inspired Again / Hard / Good / Easy scheduling exists in `learning-engine.js`, but the current shared puzzle flow does not present the confidence-review interface.
- Challenge metrics and mastery weighting exist in the learning engine, but current V3 learning objects are generated without real challenge content and the shared word game does not call a challenge UI.
- Crypto's 20 canonical learning objects contain pronunciation, real-life examples, useful facts, common mistakes, related terms, and quick challenges, but that term-learning experience is not connected to the current shared Word Quest or Learning Quest navigation.
- Credit's 15 workbooks each contain one scenario record, but `workbook-app.js` renders only multiple-choice and true/false questions after matching practice.
- Objective validation and progress engines exist, but no approved production objective package is loaded into the live game.
- Save fields exist for future objective, scenario, and library-challenge progress, but no approved Scenario Library or Challenge Library is implemented.
- The Credit dashboard displays reviews due, but its Daily Review button currently opens the ordinary Credit word game rather than a due-term review activity.

### Proposed, researched, or deferred — not implemented

- The 27 additional challenging quizzes and their proposed comprehension questions.
- Full Learning Quests for Money Basics, Crypto, Banking Basics, and Investing Basics.
- Remaining Credit chapters beyond Credit Foundations.
- Credit Cards' proposed 13-workbook world.
- Scenario Library and Challenge Library content.
- Sorting/categorization activities, credit-score simulations, and mixed missed/recent daily practice.
- Dedicated learner profile.
- Daily financial challenges, collectibles, timed activities, and collectible upgrades.
- Build Your Wealth investment collection mini-game.
- AI Tutor.
- Player avatar / character system.
- Cloud saves, accounts, backend analytics, multiplayer, payment systems, and real-world rewards.

## 2. What the active 27 quizzes teach

The default runtime contains 27 governed puzzles:

| World | Active quizzes | Required-word occurrences | Unique financial IDs encountered | IDs owned by that world | Cross-world IDs |
|---|---:|---:|---:|---:|---:|
| Money Basics | 5 | 15 | 10 | 9 | 1 |
| Credit Foundations | 6 | 19 | 10 | 10 | 0 |
| Crypto Foundations | 5 | 15 | 10 | 6 | 4 |
| Banking Basics | 5 | 15 | 12 | 6 | 6 |
| Investing Basics | 6 | 18 | 13 | 7 | 6 |
| **Total** | **27** | **82** | **49 unique across the slate** | — | — |

The table counts stable financial identities, not ordinary supporting words. Cross-world reuse correctly preserves the original permanent ID, definition, rewards, and mastery identity.

This is meaningful puzzle coverage, but it is not complete curriculum coverage. The repository currently holds 155 implemented governed identities, while the active slate exposes 49 unique IDs. A term can exist in the registry without appearing in an active puzzle, and appearing in a puzzle does not mean it has a complete lesson, application activity, or mastery path.

## 3. World-by-world inventory

### Money Basics

**Built**

- 36 governed vocabulary records.
- Five active V3 crossword quizzes.
- Ten unique financial identities encountered in its current quizzes; nine belong to Money Basics and one is a governed cross-world term.
- Definitions, first-discovery rewards, completion review, hints, progress, audio, and saves through the shared engine.

**Missing**

- No workbook curriculum or Learning Quest.
- No pronunciation, examples, useful insights, common mistakes, related-term map, or approved applied challenges in the main vocabulary file.
- No flashcards, matching practice, assessment sequence, scenarios, objective progression, confidence review, or scheduled-review UI.

**Governance dependency**

- Current approval covers the main letter-wheel/crossword vocabulary and puzzle structure only. Any lesson, activity, question, scenario, or objective content requires a separately approved curriculum source.

### Credit Foundations and the larger Credit journey

**Built**

- 38 original word-game terms plus four implemented CAL-0008 Credit additions in the identity registry.
- Six active V3 crossword quizzes with ten unique Credit identities.
- Fifteen playable Credit Foundations workbooks, CRF-001 through CRF-015.
- 128 rendered lesson steps.
- 75 flashcards.
- 60 matching pairs.
- 75 multiple-choice and 45 true/false questions: **120 rendered quiz questions**.
- Workbook completion, first-pass XP, results feedback, prerequisites, unlocking, and persisted progress.

**Partially built**

- Fifteen scenario records exist—one per workbook—but the UI never presents or scores them.
- Credit's learning dashboard contains an eight-destination journey, but only Credit Foundations is active. Credit Cards, Interest & Borrowing, Credit Reports, Building Credit, Debt Management, Identity Protection, and Loans & Comparing Offers remain locked destinations without runtime workbook content.
- Mastery/review infrastructure exists, but Credit workbook quiz completion is not the same as the full term-level challenge and confidence-review loop.

**Missing**

- Learner-facing scenarios.
- Dedicated due-term Daily Review.
- Objective-progress UI backed by a successful Approved & Locked pipeline import.
- The other seven Credit destinations as complete, playable Learning Quests.
- Sorting/categorization and credit-score simulation components named in earlier plans.

**Planned evidence**

- Credit Cards has a research-backed 13-workbook blueprint. It explicitly contains structure only—not workbook prose, runtime specifications, or playable content—and remains gated by reconciliation and owner approval.

**Governance dependency**

- CRF-001–015 is Approved with Qualification for the current implementation and must not be rewritten.
- It has not completed the separate Approved & Locked curriculum-import pipeline.
- Any remaining Credit chapter needs its own authoritative approved content and mappings before implementation.

### Crypto Foundations

**Built**

- 20 canonical rich learning objects.
- Five active V3 crossword quizzes.
- Ten unique financial identities encountered in its current quizzes; six belong to Crypto and four are governed cross-world terms.
- Each canonical Crypto object includes pronunciation, example, useful insight, common mistake, related IDs, quick challenge, XP, and review weight.

**Missing or disconnected**

- The shared Word Quest explicitly does not open Crypto's seven-step micro-lesson, quick challenge, related-term, or confidence-review experience.
- Crypto's Learning Quest card says Coming soon.
- Daily Review and term mastery are not exposed as a complete learner journey.
- Four owner-approved Crypto additions—ADDRESS, CUSTODY, SCAM, and CONFIRMED—have permanent approval-log IDs but are not implemented in the content/runtime registry.

**Governance dependency**

- Current Crypto is Approved with Qualification for existing gameplay.
- CAL-0006 requires a dedicated controlling governance record before treating Crypto as Approved & Locked or expanding it substantially. The owner must decide whether implementing the four approved additions and a full Learning Quest triggers that gate.

### Banking Basics

**Built**

- 26 active main-record terms and 15 reserve terms.
- Governed supplemental IDs used by V3/research, including ACH and later approved additions.
- Five active V3 crossword quizzes.
- Twelve unique financial identities encountered in its current quizzes; six belong to Banking and six are governed cross-world terms.
- Shared puzzle, definition, reward, hint, audio, progress, and save behavior.

**Missing**

- No Learning Quest or workbook curriculum.
- No flashcards, matching, quizzes, scenarios, objectives, term-level examples/mistakes/related concepts, confidence review, or scheduled-review interface.

**Governance dependency**

- Current record is Approved with Qualification for the main game. Most definitions were reconstructed during retroactive governance normalization. New educational content requires an approved source and must preserve that qualification.

### Investing Basics

**Built**

- 25 active main-record terms and two reserve terms.
- Governed supplemental identities including WORTH and LIQUIDITY.
- Six active V3 crossword quizzes.
- Thirteen unique financial identities encountered in its current quizzes; seven belong to Investing and six are governed cross-world terms.
- Shared puzzle, definition, reward, hint, audio, progress, and save behavior.

**Missing**

- No Learning Quest or workbook curriculum.
- No flashcards, matching, quizzes, scenarios, objectives, term-level examples/mistakes/related concepts, confidence review, or scheduled-review interface.

**Governance dependency**

- Current approval governs the main game only and explicitly does not create lessons, flashcards, quizzes, scenarios, workbook content, or assessments. Those require separate owner-approved curriculum.

## 4. Cross-world systems inventory

| System | Current status | Completion gap |
|---|---|---|
| Five-world Word Quests | **Implemented** | Preserve the current 27; expansion remains pending. |
| Crossword/letter-wheel engine | **Implemented and tested** | Continue accessibility and device testing during later hardening. |
| Completion definitions | **Implemented** | Extend into the full learning journey without replacing exact definitions. |
| Coins, XP, hints, celebrations | **Implemented** | Balance only through separately authorized work. |
| Daily login rewards | **Implemented** | Earlier planning reports that say the UI is not activated are stale. |
| Flashcards | **Implemented for Credit Foundations only** | Generalize the content contract and create approved cards for four other worlds. |
| Matching activity | **Implemented for Credit Foundations only** | Generalize only after curriculum exists. |
| MC / true-false quizzes | **Implemented for Credit Foundations only** | Four worlds lack approved assessments. |
| Scenario activities | **Data exists for Credit; UI missing** | Build one reusable scenario player after scenario scoring and approval rules are confirmed. |
| Seven-step term micro-lessons | **Crypto data exists; current UI disconnected** | Restore/rebuild as a reusable five-world component using approved content only. |
| Again / Hard / Good / Easy review | **Engine implemented; learner UI missing** | Connect the review outcome to real term lessons and due-term practice. |
| Daily Review | **Statistics/engine support only; dedicated activity missing** | Current dashboard button routes to ordinary Credit puzzles. |
| Objective progress | **Architecture/test fixtures only** | No production approved objective export is loaded into the live game. |
| Scenario Library | **Extension point only** | No authoritative scenario IDs, library, or mappings exist. |
| Challenge Library | **Extension point only** | No authoritative challenge IDs, library, or mappings exist. |
| Sorting/categorization | **Planned, not built** | Requires interaction design and approved content. |
| Credit-score simulation | **Planned, not built** | Requires approved model, scenarios, explanations, and scoring. |
| Learner profile | **Planned, not built** | Decide whether the existing dashboards are sufficient. |
| AI Tutor | **Named priority only** | No approved functional specification, safety policy, content boundary, or implementation exists. |
| Build Your Wealth | **Feasibility research complete; not implemented** | Owner must decide whether it belongs before or after the first release; prior “post-V1” labels are not controlling. |
| Avatar/character system | **Deferred concept** | Owner must decide whether it is part of game completion; no production asset or code exists. |

## 5. Documentation and architecture conflicts to resolve

Several older documents mix historical behavior, target architecture, and current runtime behavior:

- `CLAUDE.md` and `APP_DESCRIPTION_AND_CLAUDE_SYSTEM_PROMPT.md` describe the seven-step micro-lesson and Daily Review as current learner-facing features, while `word-game-app.js` explicitly says the micro-lesson/review flow is not wired into the shared engine.
- The same documents still describe V3 as opt-in, but the current code makes V3 the default and exposes legacy puzzles only with `?puzzles=legacy`.
- `docs/GAME_COMPLETION_BASELINE.md` contains a mix of superseded early findings and later updates.
- `docs/V1_RELEASE_CHECKLIST.md`, the release-readiness audit, the engagement plan, Build Your Wealth report, and backlog use “V1,” “post-V1,” or release-freeze labels that no longer determine product priority after the owner's correction.
- Governance records remain authoritative for curriculum status. This roadmap changes phase and product priority, not curriculum approval.

The safe rule is now:

> Treat source code and current tests as implementation truth; treat the Curriculum Approval Log and World Governance Matrix as curriculum authority; treat this roadmap as the current phase and prioritization authority. Older release-scope labels are historical until the owner reconfirms them.

## 6. Development roadmap

### Phase 1 — Owner defines “game complete”

**Goal:** establish what must exist before the first release can be considered again.

Owner decisions:

1. Must all five worlds have full Learning Quests at launch, or may some remain Word Quest-only?
2. Is Credit's completion target Credit Foundations only, all eight displayed Credit destinations, or another subset?
3. Which activity set is mandatory per completed world: lesson, flashcards, matching, scenario, quiz, confidence review, and Daily Review?
4. Are sorting, simulations, learner profile, AI Tutor, Build Your Wealth, collectibles, timed activities, or avatars required before release—or candidates for later?
5. What minimum vocabulary/puzzle coverage makes one world complete?
6. Should the proposed 27 new quizzes be part of the first complete game if individually approved?

**Exit gate:** a written owner-approved completion definition. No feature should be labeled pre-release or post-release until this gate is decided.

### Phase 2 — Finish curriculum authority before content implementation

**Goal:** obtain immutable, approved educational sources for every activity the owner places in scope.

Work:

- Decide the common Learning Quest content contract using Credit Foundations and Crypto's rich learning objects as evidence, without rewriting either.
- Supply and approve lesson/workbook content for Money Basics, Banking Basics, Investing Basics, and the chosen Crypto Learning Quest structure.
- Supply and approve the remaining Credit chapters selected in Phase 1.
- Reconcile and formally freeze Credit Cards' blueprint before workbook authoring if Credit Cards is in scope.
- Decide whether the four approved but unimplemented Crypto terms cross CAL-0006's substantial-expansion threshold.
- Complete one real Approved Workbook → Validator → JSON Export → Loader cycle, then freeze/version the shared import pipeline as already planned.
- Do not create Scenario Library or Challenge Library placeholders; wait for approved IDs and mappings.

**Exit gate:** every in-scope world/activity has a named controlling source, approval status, stable IDs, and generated runtime format.

### Phase 3 — Complete the reusable learning loop

**Goal:** make one consistent educational journey reusable across worlds.

Recommended order:

1. Add a reusable scenario activity renderer and scorer; connect Credit's 15 existing scenario records.
2. Reconnect or rebuild the term micro-lesson flow around permanent IDs: definition → example → insight → common mistake → approved challenge → related terms → reward/confidence review.
3. Connect Again / Hard / Good / Easy to the existing review engine.
4. Build a real due-term Daily Review route instead of routing the button to ordinary Credit puzzles.
5. Extract flashcards, matching, quiz, results, and scenario components so they can consume other approved worlds without copying Credit-specific controller code.
6. Connect approved objective progress only after a real validated objective package exists.

**Exit gate:** one non-Credit pilot world can complete the same approved learning loop using shared components, with no copied curriculum in saves.

### Phase 4 — Complete each world

Use Credit Foundations as the working reference, not as permission to copy its educational wording.

For each owner-selected world, complete this sequence:

1. approved curriculum source;
2. generated runtime content;
3. lesson presentation;
4. flashcards;
5. at least one applied interactive practice type;
6. assessment and instructional feedback;
7. scenario/challenge integration if required by Phase 1;
8. confidence review and spaced repetition;
9. objective and world-progress reporting;
10. fresh-save, returning-save, accessibility, and mobile verification.

Suggested technical pilot order, subject to owner approval:

1. **Credit Foundations gap closure** — render its existing scenarios and connect review.
2. **Crypto Foundations** — reuse its existing rich learning objects to prove the term-level micro-lesson path.
3. **Money Basics** — likely first full new curriculum authoring effort and natural onboarding world.
4. **Banking Basics** — complete after its qualification and lesson authority are explicitly handled.
5. **Investing Basics** — complete before deciding whether Build Your Wealth belongs in the initial game.
6. **Remaining Credit destinations** selected in Phase 1.

**Exit gate:** every world the owner defines as launch scope has complete, approved, playable learning and progress—not merely vocabulary and puzzles.

### Phase 5 — Resolve the puzzle expansion

**Goal:** protect the 27 existing quizzes while deciding the 27 proposed additions.

Work:

- Review each proposed composition and comprehension question.
- Record approve / revise / reject decisions individually.
- Confirm the two documented three-word exceptions and ten cross-world anchors.
- Resolve the Crypto controlling-record gate before substantial Crypto activation.
- After owner approval, separately authorize export and implementation.
- Preserve existing puzzle IDs, progress mappings, rewards, stable term identities, and save migrations.

**Exit gate:** the owner-approved active slate is explicit, validated, non-duplicative, and covered by migration tests. Until then, the active total remains 27.

### Phase 6 — Decide and build additional educational mini-games

Potential components already planned:

- sorting/categorization;
- credit-score simulation;
- mixed missed/recent daily practice;
- daily financial challenge;
- collectible progression;
- timed activities;
- Build Your Wealth;
- AI Tutor;
- avatar/character system.

For each candidate, require:

1. educational purpose;
2. approved content source;
3. permanent-ID relationships;
4. reward/economy impact;
5. save migration impact;
6. accessibility behavior;
7. measurable completion criteria;
8. explicit owner decision on whether it is required before release.

**Exit gate:** only owner-selected features are implemented. A prior “post-V1” label neither excludes nor authorizes a feature.

### Phase 7 — Game-completion review

**Goal:** decide whether content and gameplay are actually complete enough to begin release preparation.

Review:

- every in-scope world and activity;
- curriculum and stable-ID integrity;
- puzzle and lesson coverage;
- mastery and review behavior;
- economy and save migrations;
- accessibility and device behavior;
- unresolved placeholders, locked destinations, and Coming soon labels;
- whether the product description matches the actual app.

Only after the owner accepts this review should a separate release-preparation phase begin. Apple signing, TestFlight, store metadata, and submission work remain paused.

## 7. Dependencies and hard gates

| Dependency | Blocks |
|---|---|
| Owner's definition of game completion | Every priority and release-scope decision |
| Approved lesson/activity content for four incomplete Learning Quests | Flashcards, quizzes, scenarios, challenges, objectives, and review for those worlds |
| Credit chapter scope decision | Whether seven locked Credit destinations must be built |
| CAL-0006 Crypto decision | Substantial Crypto expansion and the four approved-but-unimplemented terms |
| Successful shared curriculum import | Scalable objective/runtime loading for future worlds |
| Approved Scenario/Challenge IDs and mappings | Production Scenario Library and Challenge Library integration |
| Individual 27-quiz decisions | Expansion export and runtime activation |
| Economy approval | Build Your Wealth, collectible payouts, timed rewards, and any new coin sinks/sources |
| Functional/safety specification | AI Tutor implementation |

## 8. Owner decision register

The owner needs to decide:

1. The exact worlds and Credit chapters required for the first complete version.
2. The mandatory educational activities per world.
3. Whether Crypto's existing rich term objects should become its Learning Quest and whether CAL-0006 needs a new controlling record first.
4. Whether Credit's 15 existing scenario records should be added to the live workbook sequence.
5. Which non-Credit world receives the first full curriculum package.
6. Individual approve/revise/reject outcomes for the 27 proposed quizzes.
7. Whether Build Your Wealth, collectibles, daily challenges, simulations, AI Tutor, and avatars are required for initial game completion or deferred by a new explicit decision.
8. Whether all five Learning Quest cards must be complete before any release preparation resumes.
9. Whether iPad, accounts/cloud saves, and cross-device progress are part of product completion or later architecture.
10. The completion review gate that authorizes a future return to release work.

## 9. Protected baseline

Until the owner authorizes implementation:

- preserve all 27 active quizzes;
- preserve every approved definition and permanent ID;
- preserve current coins, XP, hint costs, rewards, mastery records, and saves;
- keep the 27 proposed quizzes research-only;
- do not activate reserve terms or fabricate educational content;
- do not begin Apple signing, TestFlight, App Store submission, or other release work;
- do not modify PR #4, commit, push, merge, or deploy.

## 10. Evidence reviewed

This inventory is grounded in the current source and repository records, including:

- `app.js`, `word-game-app.js`, `workbook-app.js`, `learning-engine.js`;
- `src/v3-puzzle-slate.js`, `src/objective-engine.js`, and curriculum pipeline modules;
- the five current vocabulary sources and Credit workbook runtime;
- `docs/CURRICULUM_APPROVAL_LOG.md` and `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md`;
- the Credit Cards blueprint and review;
- the 27-quiz expansion proposal;
- the engagement-expansion and Build Your Wealth feasibility reports;
- the future-feature backlog and historical completion/status documents;
- the current 486-test passing baseline and the same-day five-world visual smoke test recorded in the release-readiness audit.

Historical documents were used as evidence of plans, not automatically treated as current implementation truth.

# FinLit Quest project log

This file is the single source of truth for development continuity. Read it before changing the project. Update it after every completed milestone with the date, work completed, files modified, architectural decisions, known issues, and recommended next steps.

## Product direction

FinLit Quest is an applied financial-learning platform, not primarily a word game. Word-connect puzzles are an engagement mechanic that unlock short lessons, application challenges, rewards, mastery progression, and scheduled review.

The intended experience is premium, modern, friendly, intelligent, and game-like without appearing childish. When a material UX improvement is identified, propose the layout, navigation, visual, or interaction change before implementing it. Prefer a cohesive experience over preserving legacy presentation.

---

## 2026-07-13 — Living financial-journey home screen

### Completed work

- Replaced the legacy dashboard with a premium, responsive FinLit Quest journey map built in HTML, CSS, SVG, and JavaScript.
- Added the eight approved Credit World section names as navigation-shell destinations without creating lesson content, terms, scenario IDs, or challenge IDs.
- Added meaningful destination icons, financial-life milestone signs, a continuous illuminated route, a future-continent preview, and clear current/completed/locked visual states.
- Added environmental evolution styling so completed destinations become thriving, the current destination glows, and future destinations remain inviting.
- Added restrained ambient motion for the route, clouds, river lighting, completion rings, active destinations, and reward shimmer.
- Added reduced-motion fallbacks and high-contrast focus states.
- Added a responsive Journey Progress panel, Daily Review, streak, upcoming reward, achievement, weekly goal, badge, mastery, XP, and word-learning summaries.
- Replaced the home CTA with the large gold `Continue Adventure` action and verified home → game → home navigation.
- Preserved the existing puzzle, definitions, hint system, micro-lessons, learning engine, and versioned saves.
- Kept Coins and Gems at honest zero states because those currencies do not yet exist in the player model.

### Files added

- `journey.css`

### Files modified

- `index.html`
- `app.js`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **42 passed, 0 failed**.
- `app.js` syntax check passed.
- Mobile verification passed at a 390×844 target with no horizontal overflow and a 67px primary touch target.
- Wide-layout verification passed at 1280×900 with the journey map and sticky progress panel in a two-column layout.
- Locked destinations are disabled and expose descriptive accessibility labels.
- `Continue Adventure` opens the working puzzle and Back returns to the journey map.
- Browser console warnings and errors: **0**.

### Architectural decisions

- The home screen is code-native and does not embed the generated design mockup.
- The map is a curriculum-aware navigation shell. Approved section names may be displayed, but educational records remain unavailable until generated runtime JSON passes the curriculum import gate.
- Environmental evolution is driven by presentation state; it does not duplicate curriculum content in player saves.
- Future-world navigation is a non-mutating preview only and clearly states that regions unlock after curriculum approval.
- Coins and Gems will not be derived from unrelated legacy values. They require explicit player-profile schema and reward-economy approval.
- The deferred avatar decision remains unchanged; no character system or avatar asset was added.

### Known issues and blockers

- Credit runtime curriculum has not been imported, so `Continue Adventure` still opens the existing Crypto/DeFi prototype puzzle. This mismatch is temporary and must not be hidden or solved with fabricated Credit content.
- Journey destination completion is currently session-level presentation state. Persistent Credit section completion must wait for approved objective JSON and objective-progress integration.
- The future-continent control is informational only.

### Recommended next step

Complete the first authoritative Credit workbook import, connect generated objective/section JSON to the journey destinations, and replace the temporary Crypto puzzle route with approved Credit gameplay. Then add direct browser smoke tests for the home-screen state transitions.

---

## 2026-07-13 — Player avatar system formally deferred

### Completed work

- Recorded the Player Avatar & Character System in the future-feature backlog.
- Classified the feature as Post-MVP and deferred it until the application is at least 80% complete and the Final Architecture Review begins.
- Recorded explicit revisit criteria, evaluation questions, and scope restrictions.
- Classified the Alex “Rookie Investor” character concept as exploratory rather than a canonical production asset.

### Files added

- `FUTURE_FEATURE_BACKLOG.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- No avatar-related code, profile fields, UI, dialogue, animation, production assets, or dependencies may be added before formal re-approval.
- Educational worlds, objectives, knowledge, scenarios, challenges, lessons, the AI Tutor, game mechanics, accessibility, testing, beta readiness, and launch preparation take priority.
- Any future avatar proposal must establish educational value, measurable engagement or retention benefit, accessibility requirements, maintenance cost, and save-schema impact.

### Known issues and blockers

- None. This is a deliberate product-scope decision.

### Recommended next step

Resume the Credit curriculum import milestone. Do not revisit avatar implementation until every backlog gate is satisfied and the Final Architecture Review authorizes it.

---

## 2026-07-12 — Immutable curriculum asset boundary

### Completed work

- Established the universal `curriculum/<world>/approved/{workbooks,runtime,reports}` structure for Credit and all future worlds.
- Designated approved workbooks as immutable, human-edited source assets; generated runtime JSON and reports are stored separately.
- Added an enforced path policy: workbook inputs must live inside `approved/workbooks/`, runtime output is derived into `approved/runtime/`, and reports are derived into `approved/reports/`.
- Removed arbitrary runtime/report output paths from the import command.
- Added a shared pipeline policy that prohibits game access to workbooks and prohibits world-specific importers.
- Recorded the pipeline-freeze condition: freeze pipeline version 1 after the first successful Credit import and runtime verification.

### Files added

- `curriculum/README.md`
- `curriculum/pipeline-policy.json`
- `curriculum/credit/approved/workbooks/README.md`
- `curriculum/credit/approved/runtime/README.md`
- `curriculum/credit/approved/reports/README.md`
- `src/curriculum-path-policy.js`

### Files modified

- `scripts/import-curriculum.mjs`
- `tests/curriculum-pipeline.test.js`
- `CURRICULUM_IMPORT.md`
- `ARCHITECTURE.md`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **42 passed, 0 failed**.
- Importer syntax check passed.
- Tests confirm source/output separation and reject world/directory mismatches.

### Architectural decisions

- The game consumes validated JSON only and never reads workbook files.
- The importer determines destinations from the shared directory contract; individual worlds cannot customize the data flow.
- Approved workbook corrections require a newly approved version rather than modification during import.
- After the first successful Credit import, pipeline changes require a versioned migration rather than custom world handling.

### Known issues and blockers

- The ten authoritative Credit workbook assets have not yet been placed in `curriculum/credit/approved/workbooks/`.
- `import-map.json` cannot be created until the actual workbook sheets and headings can be inspected.
- The pipeline remains `awaiting_first_successful_import` and is not frozen yet.

### Recommended next step

Place the eight Approved & Locked Credit section workbooks, Curriculum Approval Log, and Controlled Values workbook in the approved workbooks directory. Derive the import map mechanically, run validation, inspect the reports and generated JSON, verify runtime loading, and then freeze pipeline version 1.

---

## 2026-07-12 — Phase 2 curriculum import pipeline foundation

### Completed work

- Corrected the data flow so approved workbooks remain editorial sources and generated JSON is the runtime source.
- Added versioned curriculum-export and section schemas plus cross-record validation.
- Added validation for source workbook hashes, approval-log and controlled-values hashes, locked approval states, curriculum-version consistency, section/objective membership, prerequisites, and term references.
- Added a mapping-driven workbook adapter that reads exact worksheet headings and produces generated JSON without interpreting curriculum wording.
- Added a runtime curriculum loader with immutable data and indexed section/objective lookup.
- Made Scenario Library and Challenge Library relationships optional until those authoritative artifacts exist; the export validator rejects premature placeholder libraries.
- Added a mandatory Curriculum Import Report and machine-readable validation report after every import attempt. Failed validation cannot generate runtime JSON.
- Added automated tests for exact heading mapping, versioned loading, approval gates, broken relationships, unknown terms, and absent future mappings.

### Files added

- `schemas/section.schema.json`
- `schemas/curriculum-export.schema.json`
- `src/curriculum-validator.js`
- `src/curriculum-loader.js`
- `src/curriculum-import-core.js`
- `src/curriculum-import-report.js`
- `scripts/import-curriculum.mjs`
- `tests/curriculum-pipeline.test.js`
- `CURRICULUM_IMPORT.md`

### Files modified

- `schemas/objective.schema.json`
- `src/objective-validator.js`
- `src/objective-engine.js`
- `tests/objective-engine.test.js`
- `ARCHITECTURE.md`
- `LEARNING_ENGINE.md`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **40 passed, 0 failed**.
- Workbook importer syntax check passed with the bundled Node runtime.
- The actual workbook import was not run because no approved workbook files are present in the repository or shared attachments.

### Architectural decisions

- Canonical flow is Approved Workbook → mapping-driven adapter → validator → generated JSON → runtime loader → game engine.
- Import maps contain only mechanical workbook locations and exact column mappings; they must be derived from the authoritative files rather than guessed.
- Curriculum schema versions are independent of player save versions.
- Runtime JSON records provenance hashes so a build can be traced to its exact workbook, approval log, and controlled values.
- Import reports are a required quality gate and record counts, duplicate IDs, missing references, invalid prerequisites, approval states, warnings, runtime-output status, and PASS/FAIL validation.
- Scenario and challenge fields are extension points only. No empty libraries, fake IDs, or fabricated mappings are exported before approval.
- Existing version-3 save migration and sparse ID-keyed player progress remain unchanged and compatible with Milestone 3 saves.

### Known issues and blockers

- The Approved & Locked Credit workbooks, Curriculum Approval Log, and Controlled Values workbook are not present locally, so the exact import map and authoritative Credit JSON cannot yet be generated or visually verified.
- The workbook adapter has been syntax-checked and its pure mapping layer is tested, but end-to-end spreadsheet import awaits the canonical files.
- Existing distribution ZIP files predate Phase 2 and are stale.

### Recommended next step

Add the canonical workbook files to the project. Inspect their actual sheet names and headings, create the mechanical import map, run the export, verify approval and relationship validation, and then load the generated Credit JSON into the objective engine. Do not author or repair curriculum during import.

---

## 2026-07-12 — Credit objective infrastructure checkpoint

### Completed work

- Added a formal schema for approved and locked learning objectives.
- Added validation for stable objective IDs, Credit world ownership, section metadata, curriculum version, approval status, term relationships, prerequisites, future scenario IDs, and future challenge IDs.
- Added immutable objective indexing and curriculum-order lookup.
- Added sparse objective progress with honest not-started, in-progress, and completed states.
- Added configurable objective completion derived from linked term mastery and future Scenario/Challenge Library results.
- Added separate ID-keyed stores and recording interfaces for scenario and library-challenge attempts.
- Migrated saves automatically from version 2 to version 3 while preserving XP, settings, term progress, and unknown fields.
- Added tests using clearly marked technical fixtures; no Credit objective wording or relationships were invented.

### Files added

- `schemas/objective.schema.json`
- `src/objective-validator.js`
- `src/objective-engine.js`
- `tests/objective-engine.test.js`

### Files modified

- `learning-engine.js`
- `tests/learning-engine.test.js`
- `TESTING.md`
- `ARCHITECTURE.md`
- `LEARNING_ENGINE.md`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **33 passed, 0 failed**.
- Objective engine and validator syntax checks passed.
- Tests cover locked approval status, unknown terms, duplicate IDs, invalid prerequisites, sparse progress, combined completion, separate scenario/challenge results, world aggregates, and version-2 migration.

### Architectural decisions

- Approved curriculum remains immutable content and is never stored in the player profile.
- Objective progress is derived from stable term, scenario, and challenge IDs.
- Objective infrastructure is independent of the current Crypto runtime and can load Credit records without changing the working game.
- Scenario and Challenge Library hooks were defined without inventing their future content.
- Save schema changes require a version bump; objective support uses save version 3.

### Known issues and blockers

- Approved Credit objective records are not present in the repository or current request.
- Stable objective IDs, section IDs, objective statements, prerequisite relationships, and objective-to-term mappings are required before curriculum import.
- The supplied `credit.apr` record contains approved term wording but lacks current engine fields including normalized word, category, stable related-term IDs, XP, review weight, and objective relationships. It was not altered or imported.
- `FinLit-Quest-Milestone-3.zip` predates this checkpoint and is now stale.

### Recommended next step

Provide the approved Credit objective export and approved Credit term registry. Import both verbatim, validate all references, then connect ObjectiveEngine initialization to the Credit world loader. Do not generate missing curriculum content.

---

## 2026-07-12 — Milestone 3 implementation: final extracted-runtime verification pending

### Completed work

- Curated all 20 existing Crypto/DeFi learning objects with unique definitions, readable pronunciations, real-life examples, insights, mistakes, relationships, XP, review weights, and applied challenges.
- Made `content/crypto-terms.json` canonical and added a generated JavaScript adapter for direct-file compatibility.
- Added formal term/world JSON schemas, runtime validation, stable-reference validation, challenge validation, and level wheel-formability checks.
- Separated puzzle, challenge, and review analytics in sparse ID-based progress.
- Added configurable combined mastery capped at 20% from crossword completion alone.
- Added challenge accuracy, misconception flags, solve/hint metrics, review counts, streak calculation, achievements, review-due counts, and honest dashboard states.
- Extracted pure game rules, world loading, and content validation from `app.js` without changing the framework or rebuilding the game.
- Centralized design tokens, removed the external font dependency, removed obsolete clue-layout CSS, and replaced temporary dashboard emoji with accessible inline SVG icons.
- Added dependency-free automated tests and a single test command.
- Completed a clean-player lesson/challenge/review/reload flow, an existing-player migration check, mobile/theme/navigation checks, and a full five-level playthrough.
- Fixed Level 5's missing `E` in the wheel and added validation/test coverage to prevent unformable target words.

### Files added

- `content/crypto-terms.json`
- `content/crypto-terms.js` (generated adapter)
- `src/content-validator.js`
- `src/world-loader.js`
- `src/game-engine.js`
- `schemas/term.schema.json`
- `schemas/world.schema.json`
- `design-tokens.css`
- `CONTENT_AUTHORING.md`
- `TESTING.md`
- `scripts/sync-content.js`
- `scripts/test.sh`
- `tests/helpers.js`
- `tests/content-validator.test.js`
- `tests/game-engine.test.js`
- `tests/learning-engine.test.js`

### Files modified

- `index.html`
- `app.js`
- `learning-engine.js`
- `premium.css`
- `hints.css`
- `worlds/crypto.js`
- `worlds/crypto.json`
- `ARCHITECTURE.md`
- `LEARNING_ENGINE.md`
- `PROJECT_LOG.md`

### Tests and validation

- `./scripts/test.sh`: **25 passed, 0 failed**.
- JavaScript syntax checks passed for the app, learning engine, validator, and game engine.
- Curated world validation passed with 20 unique learning objects and valid stable references.
- Negative validation tests passed for missing fields, duplicate IDs/words, malformed challenges, invalid related/level references, and unformable target words.
- Manual 375px verification passed for clean and existing profiles, theme, level selection, duplicate letters, hints, seven-step lesson, incorrect challenge explanation, XP/mastery/review updates, reload persistence, and all five levels through final feedback.
- Browser console errors: none.
- Clean distribution archive: `FinLit-Quest-Milestone-3.zip`; old ZIPs and legacy duplicate term transports are excluded.
- ZIP integrity passed and all 26 tests passed from a clean extracted directory at `/tmp/finlit-quest-m3-final`.
- Final browser launch from the extracted directory remains pending because the environment rejected the temporary-server request after reaching its tool-usage limit. The working-directory build was fully browser-verified.

### Architectural decisions

- JSON is canonical; direct-file JavaScript is generated compatibility output.
- Malformed content blocks world loading with actionable messages.
- Puzzle, challenge, and confidence data are independent; full mastery requires applied and repeated learning success.
- Dashboard values must be derived from save data or display an honest empty state.
- Pure rules are extracted first; DOM controllers remain together until their transitions have direct automated coverage.
- System font stacks replace network fonts to preserve offline behavior.

### Known limitations

- `app.js` still contains DOM rendering, wheel input, navigation, lesson flow, and animation orchestration; these are the next safe modularization candidates.
- CSS is tokenized and partially cleaned but remains split between legacy, premium, hint, learning, and lesson component files.
- Each term currently has one challenge; the schema and model can support a future challenge collection after a save-compatible content revision.
- Audio pronunciation is not implemented.
- The custom runtime validator enforces cross-file relationships that JSON Schema alone cannot; it does not use a third-party full JSON Schema interpreter.
- Daily Review still builds compatible three-word wheels heuristically and may need a dedicated review-puzzle curator as the database grows.
- Do not mark Milestone 3 fully closed until the extracted ZIP is served and its dashboard loads without console errors.

### Recommended next milestone

Milestone 4 should focus on interaction-controller extraction and testable UI state: lesson controller, wheel controller, accessibility/keyboard play, focus management, and direct browser smoke tests. It should not add a new world until the content pipeline is exercised through one complete authoring/import cycle.

---

## 2026-07-12 — Project log established

### Completed work

- Established `PROJECT_LOG.md` as the required development handoff record.
- Consolidated the current product direction, implementation state, architectural decisions, risks, and next milestones.
- Confirmed the repository currently contains the playable prototype, world boundary, learning engine, dashboard redesign, hint system, and micro-lesson flow.

### Files modified

- `PROJECT_LOG.md` — created.

### Architectural decisions

- This log is now required reading before repository changes.
- Every completed milestone must append a dated entry here.
- Significant UI/UX changes should be proposed before implementation and evaluated against usability, engagement, accessibility, and overall visual cohesion.

### Known issues

- `finlit-word-game.zip` predates recent architecture, dashboard, learning-engine, and micro-lesson changes; it should not be treated as the current source.
- Browser-direct execution is preserved using JavaScript compatibility adapters. Canonical JSON and runtime JavaScript data currently overlap.
- No automated test suite or CI exists yet.

### Recommended next steps

1. Curate complete educational metadata for every term instead of relying on normalized fallback examples, insights, mistakes, quizzes, and pronunciations.
2. Add content-schema validation and automated learning-engine tests.
3. Replace the stale ZIP only when a new distribution artifact is requested.

---

## 2026-07-12 — Applied micro-lesson milestone

### Completed work

- Replaced the single definition reveal with a seven-step lesson sequence:
  1. Definition and pronunciation
  2. Real-life example
  3. “Did you know?” insight
  4. Common mistake
  5. Applied quick challenge
  6. Related concepts
  7. Reward and confidence review
- Added quiz answer feedback and related-word chips.
- Added an animated XP reward, next-review message, term mastery ring, mastery status, and milestone confetti.
- Connected Again, Hard, Good, and Easy responses to the spaced-repetition engine.
- Verified the complete `TOKEN` flow at a 375px viewport with no browser errors.

### Files modified

- `index.html`
- `app.js`
- `learning-engine.js`
- `micro-lessons.css`

### Architectural decisions

- Solving a word is the entry point to an applied lesson, not the full educational outcome.
- Micro-lessons use a reusable step renderer rather than separate hardcoded screens.
- Content and player state remain separate; lesson rendering receives a composed learning object.
- Confidence selection occurs after application and controls the review schedule.

### Known issues

- Most term enrichment fields currently use safe generated fallbacks because the source content contains definitions only.
- Quiz distractors are generic and require editorial curation.
- Pronunciation is text-only; audio and phonetic notation are future work.
- Quick-challenge correctness is displayed but is not yet stored separately from the confidence rating.

### Recommended next steps

1. Curate term-specific examples, insights, mistakes, related concepts, pronunciations, and quiz distractors in the content database.
2. Store quiz attempts separately from review confidence so application accuracy is measurable.
3. Add optional “short lesson” behavior for already-mastered terms to avoid repetition fatigue.

---

## 2026-07-12 — Learning engine and versioned saves

### Completed work

- Added an indexed learning repository with stable IDs such as `crypto.token`.
- Added composed learning objects containing immutable content plus player-specific progress.
- Added sparse version 2 saves containing only term IDs and progress; educational content is not duplicated in player profiles.
- Added automatic migration from legacy Yield and word-weight review data.
- Added an SM-2-inspired scheduler supporting Again, Hard, Good, and Easy.
- Added mastery levels, seen/correct/incorrect counts, review dates, intervals, ease factor, unlock dates, and mastery dates.
- Added due-review selection and world metrics: completion, mastery, learned, remaining, average accuracy, and average review interval.
- Connected dashboard metrics and Daily Review to the new engine.
- Verified a solved term updated XP, learned-word count, completion, and scheduling without browser errors.

### Files modified

- `learning-engine.js`
- `learning-engine.css`
- `LEARNING_ENGINE.md`
- `index.html`
- `app.js`
- `ARCHITECTURE.md`

### Architectural decisions

- Content is indexed in memory with `Map` for average O(1) term lookup.
- Player progress is sparse and keyed by stable IDs, enabling future cloud sync with minimal scheduler changes.
- The storage adapter is injectable; local storage is the current implementation, not a permanent dependency.
- World aggregates are derived on demand rather than stored as competing sources of truth.

### Known issues

- Migration infrastructure currently supports the known path to save version 2; a migration registry should be introduced before version 3.
- Due-review and world-stat calculations scan the selected world. This is acceptable for tens of thousands of terms but should be profiled with realistic content.
- Theme preference still uses a legacy standalone key instead of the versioned settings object.

### Recommended next steps

1. Add deterministic unit tests for all four review outcomes, migration, due selection, and aggregates.
2. Move theme and future accessibility preferences into the versioned save settings.
3. Add a formal migration registry before the next save schema change.

---

## 2026-07-12 — Premium dashboard and visual redesign

### Completed work

- Created a dashboard-first mobile experience with Continue Learning, XP, streak, words learned, world progress, mastery, daily challenge, weekly goal, and achievement surfaces.
- Created a separate focused game screen with navigation back to the dashboard.
- Added complete light and dark design tokens, theme persistence, premium typography, responsive layouts, soft shadows, rounded cards, glass effects, and interaction motion.
- Added card and button micro-interactions, progress animation, XP effects, screen transitions, milestone confetti, and reduced-motion support.
- Verified dashboard, dark mode, navigation, and puzzle rendering at 375px without browser errors.

### Files modified

- `index.html`
- `app.js`
- `premium.css`

### Architectural decisions

- The dashboard is the product home; the puzzle is one activity within the learning platform.
- Visual styles use semantic design tokens for theme consistency.
- Motion must communicate progress or feedback and respect `prefers-reduced-motion`.

### Known issues

- Google Fonts are imported from the network; offline use falls back to system fonts.
- Some dashboard values, including weekly goal and achievement presentation, are still prototype placeholders.
- Emoji are used as temporary world icons; a production icon system is not yet installed.
- Styling is split across legacy and additive stylesheets, increasing cascade complexity.

### Recommended next steps

1. Replace placeholder dashboard statistics with player-model data.
2. Consolidate legacy CSS into documented component and token layers.
3. Adopt a consistent SVG icon system and bundle fonts or use an offline-safe font stack.

---

## 2026-07-12 — World/content boundary and architecture audit

### Completed work

- Audited the original prototype and documented strengths, technical debt, target boundaries, scale considerations, and an eight-stage roadmap.
- Rebranded the application shell as FinLit Quest.
- Moved levels, difficulty, bonus words, world identity, and reward settings behind a world contract.
- Added a canonical Crypto world JSON manifest and a direct-file compatibility adapter.
- Preserved crossword, letter wheel, duplicate letters, definitions, hints, rewards, review, level selection, feedback, and local saves.

### Files modified

- `ARCHITECTURE.md`
- `worlds/crypto.json`
- `worlds/crypto.js`
- `index.html`
- `app.js`

### Architectural decisions

- Game rules consume world configuration rather than owning Crypto-specific levels.
- JSON is the canonical long-term content format.
- A JavaScript adapter temporarily preserves opening `index.html` directly because browser security blocks local JSON fetching.

### Known issues

- `terms.js` and `terms.json` duplicate content and can drift.
- `worlds/crypto.js` references the legacy term global.
- The engine, UI, persistence, and input still share the compressed `app.js` file.

### Recommended next steps

1. Add a validated content-loading layer and remove duplicate transports when a static-server/module workflow is accepted.
2. Split the game engine and UI into testable modules.
3. Add explicit loading and content-error states.

---

## Earlier prototype milestones

### Completed work

- Built five playable Crypto/DeFi word-connect levels with crossword placement, mouse/touch input, duplicate-letter support, shuffling, hints, definitions, reward accumulation, level selection, Daily Review, and local feedback capture.
- Combined crossword and definitions, then positioned the letter-wheel game between them.
- Fixed tap/drag input conflicts.
- Fixed hint selection so it never spends a hint on a letter already visible through a solved crossing word.

### Primary files

- `index.html`
- `styles.css`
- `hints.css`
- `app.js`
- `terms.js`
- `terms.json`

### Known issues

- The crossword placement routine is appropriate for small curated puzzles, not a large procedural generator.
- Existing CSS and several JavaScript functions are compressed into single lines and should be reformatted during modularization.
- No backend, account system, analytics service, or cloud save exists.

### Recommended next steps

- Preserve the verified puzzle mechanics while continuing to move educational content, progress, and presentation into independent modules.

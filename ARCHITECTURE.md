# FinLit Quest architecture review

## Current strengths

- Dependency-free, fast static delivery with a compact playable loop.
- Correct duplicate-letter handling and touch/mouse input.
- Useful validation features already exist: rewards, hints, definitions, review weighting, feedback, and local saves.

## Risks and technical debt

- `app.js` combines content, state, persistence, review, layout, input, scoring, and rendering.
- The engine is coupled to DeFi through globals, copy, storage keys, levels, and reward behavior.
- `terms.js` and `terms.json` duplicate content and can drift.
- Review stores only weights, not confidence levels, intervals, or due dates.
- No versioned save schema, migrations, content validation, automated tests, or loading/error state exists.
- CSS and many functions are compressed, making safe maintenance harder.
- Accessibility lacks full keyboard construction, focus management, preferences, and reduced motion.

## Scale assessment

Ten thousand indexed terms are reasonable in memory, but worlds should load on demand and only active puzzle UI should render. Player and review records should reference stable IDs rather than copy content. Crossword layout remains suitable for small hand-authored levels, not large runtime generation.

## Target boundaries

Content repository; game engine; UI components; player profile; review scheduler; save system; learning/scenario engine; optional telemetry adapter.

## Prioritized roadmap

1. **World boundary:** move terms, levels, bonus words, copy, and reward settings into a world package.
2. **Save and review models:** stable IDs, versioned migrations, easy/medium/hard outcomes, intervals, and due dates.
3. **Learning pipeline:** pronunciation, example, mistake, quiz, related concepts, XP, and review weight.
4. **Engine/UI modules:** extract pure rules, input, layout, and renderers; add unit tests and error states.
5. **Player progression:** XP levels, mastery, streaks, achievements, collections, and unlocks.
6. **Scenario engine:** data-driven decisions, feedback, mastery effects, and unlock cadence.
7. **Accessibility:** keyboard play, focus handling, themes, large text, reduced motion, colorblind palettes, and audio hooks.
8. **Scale/delivery:** lazy worlds, schema validation, offline caching, performance budgets, consented analytics, and cloud-save interfaces.

## Milestone 1 implementation note

`worlds/crypto.json` is the canonical structured manifest. `worlds/crypto.js` is a temporary direct-file compatibility adapter because browsers block `fetch()` for local JSON when `index.html` is opened without a server. Milestone 4 should introduce a static-server/module build path, validate the JSON, and remove this adapter and the duplicated `terms.js` transport.

## Milestone 2 implementation note

The versioned ID-based save and SM-2-inspired scheduler are implemented in `learning-engine.js`. Details and the save contract are documented in `LEARNING_ENGINE.md`. The old word-keyed review weights are now migration input only; new learning progress never duplicates content.

## Milestone 3 module boundaries

- `content/crypto-terms.json` — canonical immutable educational objects.
- `content/crypto-terms.js` — generated direct-file adapter; never authored manually.
- `worlds/crypto.json` — canonical level and world manifest.
- `worlds/crypto.js` — direct-file manifest adapter.
- `src/content-validator.js` — schema rules, stable-reference checks, level integrity, and actionable validation failures.
- `src/world-loader.js` — validates and indexes one world before the app can use it.
- `src/game-engine.js` — pure word classification, letter inventory, crossword layout, wheel generation, and crossing-safe hint rules.
- `learning-engine.js` — save migration, sparse progress, puzzle/challenge/review analytics, spaced repetition, mastery, streaks, achievements, and world aggregates.
- `app.js` — current browser composition root and DOM controller. It consumes the narrow modules above but still contains wheel input, lesson presentation, navigation, and animation orchestration.
- `design-tokens.css` — light/dark tokens for color, type, spacing, radii, shadows, motion, and layers.
- `tests/` — dependency-free Node tests for content, rules, saves, scheduling, and analytics.

## Milestone 3 data flow

1. The generated content adapter and world adapter expose static data for direct-file compatibility.
2. `world-loader` validates all content and references before returning the active world.
3. `game-engine` evaluates puzzle actions without reading the DOM or player save.
4. `app.js` translates user input into game actions and learning events.
5. `learning-engine` updates only ID-keyed mutable progress and returns composed learning objects to lesson UI.
6. Dashboard values are derived from the versioned save and world aggregates; no educational content is copied into the profile.

There are no circular module dependencies. The remaining extraction target is the DOM-heavy portion of `app.js`, which should be separated into lesson, wheel, and UI controllers only when tests can protect each transition.

## Credit objective integration boundary

- `curriculum/<world>/approved/` is the universal content boundary: immutable workbook sources, generated runtime JSON, and generated reports remain physically separated.
- `curriculum/pipeline-policy.json` prohibits workbook reads by the game and world-specific importers. The pipeline will be frozen after the first successful Credit import.
- `scripts/import-curriculum.mjs` is the workbook boundary. It uses a mechanically derived map of workbook, sheet, header, and exact column names.
- `schemas/curriculum-export.schema.json` and `schemas/section.schema.json` define the generated runtime package contract.
- `src/curriculum-validator.js` enforces provenance, approval gates, version consistency, section membership, objective relationships, and known term IDs.
- `src/curriculum-loader.js` creates immutable, indexed runtime data only after validation succeeds.
- `schemas/objective.schema.json` defines the approved-objective contract without containing curriculum wording.
- `src/objective-validator.js` enforces `approved_locked` status, stable IDs, world ownership, term relationships, prerequisite references, and metadata. Future library IDs are validated only when authoritative mappings exist.
- `src/objective-engine.js` indexes approved objectives and derives ID-keyed objective progress from term mastery plus linked Scenario Library and Challenge Library results.
- Save version 3 adds `objectiveProgress`, `scenarioProgress`, and `libraryChallengeProgress`. These collections contain only IDs and player results; approved curriculum remains immutable content.
- Credit objective data is intentionally not present yet. It must be generated from the approved workbooks once those files are placed in the project.

Objective data flow:

1. The approved workbook remains the editorial source.
2. A mapping derived from its actual headings extracts records without changing their wording.
3. Validation rejects drafts, unknown terms, duplicate IDs, invalid relationships, version mismatches, and untraceable source data.
4. Generated JSON becomes the runtime source of truth and is validated again when loaded.
5. The objective repository indexes immutable records by stable ID and curriculum order.
6. The objective engine derives progress from available approved components.
7. Only sparse player progress is persisted; curriculum text is never copied into the save.

Scenario and challenge libraries are not part of the current export contract. Their objective relationships remain optional extension fields until authoritative library IDs and mappings are approved.

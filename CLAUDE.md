# FinLit Quest project instructions

You are the senior product engineer, learning-experience designer, and technical steward for FinLit Quest. Improve the existing product without losing verified behavior, corrupting curriculum, overstating implemented features, or weakening the learning model.

## Current project phase — owner correction 2026-10-17

- **Current Phase:** Active Game Development and Curriculum Completion.
- **Release Status:** Not ready — significant planned content and gameplay remain unfinished.
- **Current priority:** follow `docs/FINLIT_QUEST_GAME_COMPLETION_ROADMAP.md`, complete the owner-selected worlds and educational systems, and preserve the active 27-quiz baseline.
- **Release work is paused:** do not begin Apple signing, TestFlight, App Store submission, or other release activity without a later explicit owner decision.
- Earlier labels such as “V1,” “post-V1,” or “release freeze” are historical scope labels, not current priority decisions. Features must be classified through owner review rather than assumed pre-release or post-release from those labels.

## Start every task with repository truth

Before changing the project, read the relevant parts of:

- `PROJECT_LOG.md` — development-continuity source of truth.
- `docs/CURRICULUM_APPROVAL_LOG.md` and `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md` — the authoritative approval record and per-world governance status.
- `APP_DESCRIPTION_AND_CLAUDE_SYSTEM_PROMPT.md` — complete current product description and detailed operating prompt.
- `ARCHITECTURE.md` — boundaries, data flow, and technical direction.
- `LEARNING_ENGINE.md` — saves, mastery, metrics, and review scheduling.
- `CONTENT_AUTHORING.md` — term and challenge authoring rules.
- `CURRICULUM_IMPORT.md` — approved-curriculum governance.
- `TESTING.md` — verification workflow.

Inspect the relevant source and current working changes before editing. Preserve unrelated user work. Distinguish clearly among behavior that is implemented, capability that is only architecture-ready, a new proposal, and future roadmap work.

## Product identity

FinLit Quest is a mobile-first, game-based financial education platform. Word-connect and crossword puzzles are the engagement mechanism, not the complete educational outcome. A puzzle unlocks a micro-lesson; the learner applies the concept, rates confidence, earns progression, builds mastery, and receives scheduled review.

The experience should feel premium, modern, friendly, intelligent, and game-like without appearing childish. The dashboard is the product home, and the puzzle is one activity within a larger applied financial-literacy system.

## Current product truth

The active development build has **five playable Word Quest worlds**: Money Basics, Credit, Crypto, Banking Basics, and Investing Basics. This is not a finished or release-frozen product scope. The authoritative governance status of each world is in `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md` and `docs/CURRICULUM_APPROVAL_LOG.md`; treat those records as persistent project memory and do not repeat the governance audit unless a defined audit trigger occurs. Money Basics, Banking Basics, and Investing Basics records govern the main letter-wheel and crossword game only; they are not educational workbooks. Credit Foundations includes the 15 CRF-001 to CRF-015 workbooks (lessons, activities, assessments, and progression in `workbook-app.js`); it is Approved with Qualification for the current implementation and has not completed the separate Approved & Locked curriculum-import pipeline. The governed V3 multi-word slate is the default runtime; `?puzzles=legacy` is a migration/debug route only.

**Crypto & DeFi Foundations** has 20 curated learning objects. The five levels use 16 unique target terms: TOKEN, NODE, COIN, MINT, POOL, LOCK, BLOCK, FORK, HASH, GAS, CHAIN, YIELD, LEDGER, PEER, STAKE, and SWAP. GAS appears in two levels. VAULT, WALLET, MINER, and BURN are current bonus words.

The architecture still anticipates College Funding, Insurance, Taxes, Real Estate, and Business worlds, and other unfinished Credit chapters (for example Credit Cards); do not describe those as playable. The curriculum-import and objective-progress infrastructure exists for the Approved & Locked pipeline, which no world has completed yet. Never invent approved curriculum wording, mappings, objectives, scenarios, or challenges.

The current shared learner-facing flow includes world selection, tap/drag letter wheel, crossword, crossing-aware hints, governed definitions, coins and XP, completion review, streaks, achievements, daily login rewards, local persistence, themes, audio, and celebrations. Credit Foundations separately provides lessons, flashcards, matching, quizzes, results, progression, and unlocking. The seven-step term micro-lesson, applied challenge, related-concept, Again/Hard/Good/Easy review, and due-term Daily Review capabilities exist in content or engine layers but are **not wired into the current shared Word Quest flow**. The other four Learning Quest cards currently show Coming soon.

## Learning model

Keep immutable educational content separate from player progress. Use permanent stable IDs such as `crypto.token`. Never copy definitions, examples, challenges, or curriculum statements into saves.

Puzzle, challenge, and confidence-review metrics are independent. Crossword completion is not proof of mastery. Default mastery weighting is:

- Puzzle completion: 20%.
- Applied challenge performance: 45%.
- Confidence review performance: 35%.

Full puzzle credit expects two solves, full challenge confidence expects three attempts, and full review confidence expects three reviews. The mastery states are New, Learning, Familiar, Proficient, and Mastered. Puzzle completion alone must never exceed 20% mastery.

Review scheduling is SM-2-inspired. Again schedules about 10 minutes, Hard at least one day, Good one day initially and then grows, and Easy four days initially and grows faster. Ease is bounded from 1.3 to 3.0, and review intervals are capped at 3,650 days.

The current save version is 3. Saves contain sparse ID-keyed player progress. Legacy data and version 2 saves migrate automatically. Local storage is the current adapter; there is no backend, account system, or cloud sync. Dashboard statistics must derive from real saved progress or show an honest empty state.

## Architecture and sources of truth

- `content/crypto-terms.json` — canonical curated Crypto learning objects.
- `worlds/crypto.json` — canonical Crypto world, levels, bonus words, and rewards.
- Generated `.js` content/world adapters — required direct-file compatibility; never hand-edit them.
- `src/content-validator.js` and `src/world-loader.js` — content validation and world loading.
- `src/game-engine.js` — pure word, wheel, crossword, and hint rules.
- `learning-engine.js` — migrations, analytics, mastery, scheduling, streaks, achievements, and aggregates.
- `app.js` — browser composition root and current DOM controller.
- `src/objective-engine.js` — approved objective progress derived from linked components.
- `scripts/import-curriculum.mjs` — strict workbook-to-runtime curriculum boundary.

The browser application is static HTML, CSS, and JavaScript with no runtime package dependency. JSON is canonical. Direct-file JavaScript adapters exist because browsers block local JSON fetches when `index.html` is opened directly. After canonical content changes, run `scripts/sync-content.js`, then the full test script.

## Curriculum and content governance

Approved workbooks are immutable editorial sources under `curriculum/<world>/approved/workbooks/`. Generated runtime JSON and reports belong under `approved/runtime/` and `approved/reports/`. The game must never read workbooks. Failed validation must not replace usable runtime content.

Do not paraphrase, reinterpret, or invent approved objective statements. Do not create world-specific importers. Do not add Scenario Library or Challenge Library mappings without authoritative IDs and approved mappings.

Stable term IDs are permanent lowercase `<world>.<concept>` identifiers. Do not rename or reuse released IDs. Every term requires a beginner-friendly definition, readable pronunciation, real-life example, useful insight, realistic common mistake or risk, related stable IDs, positive XP and review weight, and an applied challenge with one defensible best answer and instructional feedback.

Every target word must be formable from its wheel, including repeated letters. Avoid trivia, tricks, double negatives, unexplained jargon, and choices that depend on unstated assumptions.

## FINLIT QUEST EDUCATIONAL TERMINOLOGY STANDARD

FinLit Quest must teach accurate, recognizable real-world financial terminology. Never invent financial provider, platform, protocol, or product names as substitutes for real financial concepts without explicit project-owner authorization.

Use authentic terminology in every world's questions, answer choices, feedback, explanations, consequences, and educational takeaways.

Define unfamiliar terms at their first meaningful appearance. Clearly distinguish factual financial mechanisms from simulated rates, balances, conditions, and outcomes.

Do not imply endorsement of a specific company or product.

This rule applies to all existing and future FinLit Quest curriculum.

Enforcement (a review aid, not proof): `node scripts/check-terminology.js --strict` scans player-facing content across all worlds against `curriculum/terminology-standard.json` (known prohibited names plus heuristics for suspected invented names; reviewed and owner-authorized names are recorded in that file with a reason). It reports the file, location, and term. It runs as gate G10 in the DeFi exporter, inside `scripts/import-curriculum.mjs` for every world, and in `tests/terminology-standard.test.js`. A keyword list cannot detect every invented name, so the educational review of new wording is still required.

## Engineering and UX rules

Preserve existing behavior unless the task explicitly changes it. Keep pure rules out of DOM code, immutable curriculum out of saves, and stable IDs at every system boundary. Prefer small testable modules and injected dependencies. Never create competing sources of truth for progress or mastery.

For a material UX change, first explain the proposed layout or interaction and why it improves usability, engagement, accessibility, and visual cohesion, unless immediate implementation was explicitly requested.

Use the existing design tokens and keep light/dark behavior consistent. Motion must communicate progress or feedback and honor reduced-motion preferences. New UI must be responsive and keyboard accessible, with visible focus, sensible focus movement, useful labels, and screen-reader-friendly status feedback.

Do not add a framework, backend, cloud service, analytics vendor, authentication, payments, or a large dependency without explicit authorization. Do not claim those systems exist.

## Verification and definition of done

Run `./scripts/test.sh` after relevant changes. The verified baseline is 42 passing tests. Add or update tests when changing rules, contracts, migrations, curriculum validation, mastery, or scheduling. Validate canonical content and regenerate compatibility adapters after content changes.

For UI work, verify the affected journey at narrow mobile and wider viewports. Check light/dark themes, clean and existing saves, keyboard and focus behavior, persistence after reload, reduced motion where applicable, and browser console errors.

Do not call work complete with failing tests or generated-file drift. After a completed milestone, append a dated `PROJECT_LOG.md` entry describing work completed, files changed, architectural decisions, verification, known issues, and recommended next steps.

## Current priorities and limitations

`app.js`, `word-game-app.js`, and `workbook-app.js` still own substantial DOM and flow orchestration. CSS is split across several files. Audio pronunciation is absent. Four worlds lack complete Learning Quests. Crypto has rich challenge content that is disconnected from the current shared UI; V3-generated learning objects have empty challenge fields. Credit scenario records are stored but not rendered. A dedicated due-term Daily Review, approved Scenario/Challenge libraries, sorting/categorization, simulations, learner profile, and AI Tutor are not implemented. Crossword layout is intended for small curated sets. Full keyboard construction, focus management, reusable learning controllers, and direct browser smoke tests remain priorities.

Follow `docs/FINLIT_QUEST_GAME_COMPLETION_ROADMAP.md`. First obtain the owner's completion-scope decisions, then finish approved curriculum authority and the reusable learning loop before broad feature expansion. Exercise the approved curriculum pipeline through a complete real authoring/import cycle before treating it as production-ready.

## Working style

Begin by stating the requested outcome and relevant constraints. Make reasonable in-scope assumptions, but identify any assumption that would materially change product direction or curriculum authority. Prefer repository evidence over guesswork. Give concise progress updates during longer work. End with the result, verification performed, files changed, and genuine remaining limitations.

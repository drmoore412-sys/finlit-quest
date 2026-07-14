# FinLit Quest — Current App Description and Claude System Prompt

## 1. What the app is now

FinLit Quest is a mobile-first, game-based financial education application. It uses word-connect and crossword puzzles as the engagement mechanic, but the product is no longer designed as only a word game. The puzzle introduces a financial concept; the learning system then teaches the concept, checks whether the learner can apply it, records confidence, calculates mastery, awards progress, and schedules future review.

The current playable subject is **Crypto & DeFi Foundations**. The product architecture is designed to support many financial-literacy “worlds” later, including Banking, Credit, College Funding, Investing, Insurance, Taxes, Real Estate, and Business. Those future subjects must not be presented as playable yet. Credit has an approved-curriculum import architecture and objective engine, but its authoritative workbook content has not yet been added to the runtime game.

The experience is intended to feel premium, modern, friendly, intelligent, and game-like without looking childish. The dashboard is the product home; the crossword and letter wheel are one activity inside the broader learning platform.

## 2. Current learner journey

1. The learner opens a personalized dashboard as “Explorer.”
2. The dashboard shows XP, learning streak, words learned, world completion, mastery, reviews due, weekly learning goal, and the latest achievement.
3. The learner continues the Crypto Foundations quest or chooses one of five levels.
4. In a level, the learner forms words by dragging through or tapping letters on a circular letter wheel.
5. Correct target words are placed into a crossword. In the first level, definitions and partial letter patterns also appear as clues.
6. The learner can shuffle letters or reveal a letter. Hints never waste a reveal on a letter already exposed by a solved crossing word.
7. A correct word earns the world reward, called session yield and displayed as YLD.
8. Every target term opens a seven-step micro-lesson unless lessons are skipped for that level.
9. The learner answers an applied question and receives an explanation whether the answer was correct or incorrect.
10. The learner rates recall as Again, Hard, Good, or Easy. That rating awards the term’s XP, updates mastery, and schedules the next review.
11. Progress persists locally across reloads.
12. Daily Review selects due or weak learned terms and builds a short review puzzle when a compatible letter wheel can be made.
13. After the final route, the learner can save a 1–5 rating and optional comment locally.

## 3. Current functions and features

### Dashboard and navigation

- Dashboard-first home experience.
- Continue Learning entry point.
- Navigation between the dashboard, play screen, level picker, and Daily Review.
- Five curated Crypto levels with beginner, intermediate, and advanced labels.
- Light and dark themes saved in the versioned player settings.
- Responsive mobile layout, with reduced-motion support in the visual system.

### Word puzzle system

- Circular letter wheel supporting both tap and pointer-drag input.
- Visual trace line showing the current letter path.
- Correct handling of duplicate letters as separate wheel resources.
- Word classification as target, already found, bonus, invalid, or empty.
- Crossword placement that preserves all target words for small curated levels.
- Shared crossword letters appear automatically when a crossing word is solved.
- Letter shuffle.
- Crossing-aware letter hints.
- First-level definition clues and visible answer patterns.
- Progress counter and progress bar for each level.
- Toast feedback for duplicate, bonus, invalid, and hint actions.
- Bonus words that award extra YLD but do not currently open lessons.

### Seven-step micro-lessons

Each solved target word can open:

1. Definition and readable pronunciation.
2. A real-life example.
3. A useful “Did you know?” distinction or insight.
4. A common mistake, misuse, or risk.
5. An applied quick challenge.
6. Related financial concepts.
7. Reward summary and confidence review.

The quick challenge supports multiple educational formats, including scenario choices, true/false, comparisons, best-example identification, and common-mistake identification. Each challenge has one defensible best answer and an instructional explanation.

### Learning and mastery engine

- Immutable educational content is separate from mutable player progress.
- Every concept has a permanent stable ID such as `crypto.token`.
- Puzzle performance, applied-challenge performance, and confidence reviews are tracked separately.
- Puzzle metrics include times seen, times solved, valid and invalid attempts, hints, revealed letters, solve time, and last solve date.
- Challenge metrics include attempts, correct and incorrect answers, accuracy, consecutive correct answers, last result/date, and misconception flags.
- Review metrics include Again/Hard/Good/Easy counts, ease factor, interval, last review, and next review date.
- The default mastery formula is 20% puzzle completion, 45% applied challenge performance, and 35% confidence-review performance.
- Crossword completion alone can provide at most 20% mastery and cannot mark a concept mastered.
- Mastery states are New, Learning, Familiar, Proficient, and Mastered.
- Full puzzle credit expects two solves; full challenge confidence expects three attempts; full review confidence expects three reviews.
- The review scheduler is SM-2-inspired:
  - Again: about 10 minutes.
  - Hard: at least one day.
  - Good: one day initially, then three days, then interval growth.
  - Easy: four days initially, then faster growth.
- Review ease is bounded from 1.3 to 3.0, and intervals are capped at 3,650 days.

### Player progression

- XP is awarded when the learner completes the confidence-review step.
- Player level is calculated as `floor(XP / 250) + 1`.
- Daily learning activity and consecutive-day streaks are tracked.
- The default weekly goal is five learning days.
- Current achievements are:
  - Applied Thinker: answer the first applied challenge correctly.
  - On a Roll: learn on three consecutive days.
- Dashboard world statistics are derived from actual saved progress: completion, mastery, learned/remaining terms, challenge accuracy, average review interval, and reviews due.
- Session YLD is a separate prototype reward balance stored locally.

### Persistence and data safety

- The current app is offline-friendly and dependency-free in the browser.
- Player data is stored in local storage; there is no account, backend, analytics service, or cloud save.
- The active player-save format is version 3.
- Saves contain IDs and player results, not copied definitions or curriculum text.
- Legacy Yield/review data and version 2 saves migrate automatically.
- The storage adapter is injected, so IndexedDB or cloud sync can be added later without rewriting the learning rules.
- Malformed saves recover safely.

### Curriculum and content architecture

- Canonical educational content is JSON.
- Direct-file JavaScript adapters are generated only to support opening `index.html` without a server.
- Content validation checks required learning fields, stable IDs, unique normalized words, challenge structure, related-term references, level references, and whether each target word can be formed from its wheel.
- A universal approved-curriculum pipeline is implemented for future worlds.
- Approved workbooks remain immutable editorial sources; the game consumes only generated and validated runtime JSON.
- Curriculum imports produce traceable reports and do not replace usable runtime content when validation fails.
- Approved learning objectives can be indexed and their progress derived from term mastery plus future Scenario Library and Challenge Library results.
- Scenario and Challenge libraries are extension points, not current learner-facing features.

## 4. Current subject matter

### Live world: Crypto & DeFi Foundations

The content repository contains 20 curated learning objects. Sixteen are used as target terms across the five current levels, and four are currently bonus words.

#### Digital assets

- TOKEN — a blockchain-based unit representing value, access, ownership, or voting rights.
- COIN — an asset native to its own blockchain.

#### Network infrastructure and records

- NODE — a computer that stores, checks, or shares blockchain data.
- BLOCK — a batch of verified transactions added to a blockchain.
- HASH — a fixed-length digital fingerprint for data.
- CHAIN — the linked history of transaction blocks.
- LEDGER — the synchronized record of balances and transactions.
- PEER — a participant communicating directly with others on the network.

#### Token mechanics

- MINT — creating new coins or tokens under system rules.
- LOCK — making tokens unavailable for a period or condition.
- BURN — permanently removing tokens from circulation.

#### DeFi concepts

- POOL — a shared supply of assets used by a protocol.
- YIELD — a return earned by putting digital assets to work.
- SWAP — exchanging one token for another.
- VAULT — a smart-contract strategy that manages deposited assets.

#### Governance, transactions, and security

- FORK — a change in blockchain rules that may create a different network version.
- GAS — a fee paid to process a blockchain transaction or action.
- STAKE — locking tokens to support network or protocol security, often for rewards.
- MINER — a participant using computational work to validate transactions on certain blockchains.
- WALLET — hardware or software that manages the keys controlling blockchain assets.

### Current five levels

1. **First deposit** — TOKEN, NODE, COIN, MINT.
2. **Shared liquidity** — POOL, LOCK, BLOCK, FORK.
3. **Network signals** — HASH, GAS, CHAIN.
4. **Read the records** — YIELD, LEDGER, PEER.
5. **Put assets to work** — STAKE, SWAP, GAS.

Bonus words are VAULT, WALLET, MINER, and BURN. GAS intentionally appears in two levels. There are 16 unique target terms across the route and 20 total curated Crypto learning objects.

### Planned but not live subjects

The shared curriculum policy names Credit, Banking, College Funding, Investing, Insurance, Taxes, Real Estate, Business, and Crypto as future-compatible worlds. Only Crypto is playable. Credit currently has infrastructure for importing approved sections/objectives, but no approved workbook-derived runtime curriculum is present. Never invent or silently add authoritative curriculum wording.

## 5. Technical system summary

- Delivery: static HTML, CSS, and browser JavaScript with no runtime package dependency.
- Composition root and DOM controller: `app.js`.
- Pure game rules: `src/game-engine.js`.
- Save, scheduling, analytics, streaks, achievements, and mastery: `learning-engine.js`.
- Canonical Crypto content: `content/crypto-terms.json`.
- Canonical Crypto world/levels: `worlds/crypto.json`.
- Content validation/loading: `src/content-validator.js` and `src/world-loader.js`.
- Curriculum import/validation/loading: `scripts/import-curriculum.mjs`, `src/curriculum-validator.js`, and `src/curriculum-loader.js`.
- Objective validation/progress: `src/objective-validator.js` and `src/objective-engine.js`.
- Save schema: version 3.
- Automated verification: 42 tests currently pass.

Important current limitations:

- `app.js` still combines DOM rendering, navigation, wheel input, lesson flow, and animation orchestration.
- CSS remains divided among several stylesheets and needs careful consolidation.
- There is no backend, authentication, account profile, cloud save, multiplayer, payment system, or live analytics.
- Audio pronunciation is not implemented.
- Each term currently has one applied challenge.
- Daily Review creates three-word review wheels heuristically and may be unable to create a compatible wheel in some cases.
- Crossword layout is for small curated sets, not large runtime procedural generation.
- Keyboard construction, focus management, and direct browser smoke-test coverage are still milestone priorities.
- The current UI is effectively single-world even though content and engine boundaries support future worlds.

---

# Complete system prompt for Claude

Copy everything inside the following block into Claude’s project instructions or system prompt.

```text
You are the senior product engineer, learning-experience designer, and technical steward for FinLit Quest. Work as a careful long-term collaborator on the existing repository. Your job is to improve the product without losing verified behavior, corrupting curriculum, overstating implemented features, or weakening the learning model.

PRODUCT IDENTITY

FinLit Quest is a mobile-first, game-based financial education platform. Word-connect and crossword puzzles are the engagement mechanism, not the complete product. A puzzle unlocks a short lesson; the learner then applies the concept, rates confidence, earns progression, builds mastery, and receives scheduled review.

The desired experience is premium, modern, friendly, intelligent, and game-like without appearing childish. The dashboard is the home of the product. The puzzle is one learning activity inside a larger applied financial-literacy system.

CURRENT PRODUCT TRUTH

The only playable world is Crypto & DeFi Foundations. It contains 20 curated learning objects. Five playable levels use 16 unique target terms: TOKEN, NODE, COIN, MINT, POOL, LOCK, BLOCK, FORK, HASH, GAS, CHAIN, YIELD, LEDGER, PEER, STAKE, and SWAP. GAS appears in two levels. VAULT, WALLET, MINER, and BURN are current bonus words.

The current Crypto subject categories are digital assets, network infrastructure, token mechanics, DeFi, network governance, transactions, network security, and wallet/security fundamentals.

The shared architecture anticipates Banking, Credit, College Funding, Investing, Insurance, Taxes, Real Estate, and Business worlds. Do not describe those worlds as playable. Credit has curriculum-import and objective-progress infrastructure but does not yet have authoritative workbook-derived runtime content. Never invent approved curriculum language, mappings, objectives, scenarios, or challenges.

CURRENT USER EXPERIENCE

The learner starts on a dashboard that shows XP, streak, words learned, Crypto world completion, mastery, reviews due, weekly learning goal, and latest achievement. The learner can continue the quest, view five levels, switch light/dark theme, or enter Daily Review.

In play, the learner taps or drags through a circular letter wheel. The app evaluates target, duplicate, bonus, invalid, and empty entries. Correct target words appear in a crossword and award session YLD. The learner can shuffle letters and reveal crossing-aware hints. The first level includes definition clues and answer patterns.

Each target word opens a seven-step micro-lesson unless lessons are skipped for the level:
1. definition and readable pronunciation;
2. real-life example;
3. useful insight;
4. common mistake or risk;
5. applied quick challenge with instructional feedback;
6. related concepts;
7. reward and Again/Hard/Good/Easy confidence review.

After confidence review, the term’s XP is awarded, mastery is recalculated, and the next review is scheduled. Daily Review favors due and weaker learned concepts and builds a short compatible review puzzle.

LEARNING MODEL

Educational content is immutable and separate from player progress. All records use stable permanent IDs such as crypto.token. Never store copied definitions, examples, or curriculum statements in player saves.

Puzzle, challenge, and confidence-review metrics are independent. Crossword completion is not proof of conceptual mastery. The default mastery weighting is:
- puzzle completion: 20%;
- applied challenge performance: 45%;
- confidence review performance: 35%.

Full puzzle credit requires two solves. Full challenge-confidence credit requires three attempts. Full review-confidence credit requires three reviews. Mastery states are New, Learning, Familiar, Proficient, and Mastered. Solving a crossword alone can provide no more than 20% mastery.

Review scheduling is SM-2-inspired. Again schedules roughly 10 minutes and reduces ease. Hard schedules at least one day and slightly reduces ease. Good schedules one day initially, then three days, then grows by ease and content review weight. Easy schedules four days initially, increases ease, and grows faster. Ease is bounded from 1.3 through 3.0. Intervals are capped at 3,650 days.

Puzzle metrics include seen, solved, hints, letters revealed, valid/invalid attempts, total solve time, and last solve. Challenge metrics include seen, correct, incorrect, last result/date, consecutive correct answers, and misconception flags. Review metrics include outcome counts, ease, current interval, last review, and next review.

PLAYER MODEL

The current player-save version is 3. Saves contain player state and sparse progress keyed by stable IDs. Legacy Yield/review data and version 2 saves migrate automatically. Malformed saves recover safely. Local storage is the current adapter; no backend, account, or cloud sync exists.

XP is awarded at completed confidence review. Player level is floor(XP / 250) + 1. Activity dates, daily streak, a five-day weekly goal, and achievements are tracked. Current achievements are first correct applied challenge and a three-day learning streak. Dashboard statistics must always be derived from real saved progress or show an honest empty state.

ARCHITECTURE AND SOURCE OF TRUTH

Read PROJECT_LOG.md before making changes. Treat it as the development-continuity source. Also consult ARCHITECTURE.md, LEARNING_ENGINE.md, CONTENT_AUTHORING.md, CURRICULUM_IMPORT.md, and TESTING.md when the task touches those areas.

Canonical files and responsibilities:
- content/crypto-terms.json: immutable curated Crypto learning objects;
- worlds/crypto.json: canonical Crypto world, levels, bonus words, and reward configuration;
- generated .js content/world adapters: direct-file compatibility only; never hand-author them;
- src/content-validator.js: content and cross-reference validation;
- src/world-loader.js: validated world loading and indexes;
- src/game-engine.js: pure word, wheel, crossword, and hint rules;
- learning-engine.js: save migration, analytics, mastery, scheduling, streaks, achievements, and aggregates;
- app.js: browser composition root and current DOM controller;
- src/objective-engine.js: approved objective progress derived from linked components;
- scripts/import-curriculum.mjs: strict workbook-to-runtime curriculum boundary.

The browser runtime is static HTML/CSS/JavaScript and intentionally dependency-free. JSON is canonical. JavaScript adapters exist only because a browser blocks local JSON fetches when index.html is opened directly. After canonical JSON changes, regenerate adapters with scripts/sync-content.js and run the full test script.

CURRICULUM GOVERNANCE

Approved workbooks are immutable human-edited sources. They live only in curriculum/<world>/approved/workbooks/. Generated runtime JSON and reports live in their own approved/runtime/ and approved/reports/ folders. The game must never read workbooks. Import mapping must use exact workbook, sheet, header-row, and column names. Failed validation must not replace a usable runtime package.

Do not paraphrase, reinterpret, normalize, or invent approved objective statements. Do not create world-specific importers. Do not add Scenario Library or Challenge Library mappings until authoritative IDs and approved mappings exist. Scenario and challenge objective fields are currently optional extension points, not proof that those libraries are live.

CONTENT RULES

Stable IDs are permanent lowercase identifiers in the form <world>.<concept>. Do not rename or reuse a released ID. normalizedWord must be lowercase and unique within its world.

Every learning term requires a beginner-friendly definition, readable pronunciation, real-life example, useful non-repetitive insight, realistic common mistake or risk, related stable IDs, positive XP value, positive review weight, and at least one applied challenge. Challenges must have one defensible best answer and explain why it is correct. Avoid trivia, trick questions, double negatives, unexplained jargon, and missing assumptions.

Every target word must be formable from its level’s wheel with the correct repeated-letter inventory. Curated levels should grow gradually in concept difficulty, word count, board complexity, and application demands. Do not treat puzzle completion as mastery.

ENGINEERING RULES

Preserve existing behavior unless the task explicitly changes it. Keep pure rules out of DOM code. Keep immutable curriculum out of saves. Keep stable IDs at every cross-system boundary. Prefer small testable modules and injected dependencies. Do not create competing sources of truth for dashboard or mastery values.

Before editing, inspect the relevant code and current working changes. Preserve unrelated user work. For a material UX change, explain the proposed layout or interaction and why it improves usability, engagement, accessibility, and visual cohesion before implementing it, unless the user explicitly asks for immediate implementation.

Use the current design tokens and keep light/dark behavior consistent. Motion must communicate progress or feedback and honor reduced-motion preferences. New UI must be responsive and keyboard accessible, with visible focus, sensible focus movement, appropriate labels, and screen-reader-friendly status updates.

Do not add a framework, backend, cloud service, analytics vendor, authentication, payment system, or large dependency unless the user explicitly authorizes the architectural expansion. Do not claim these systems exist.

TESTING AND DEFINITION OF DONE

Run ./scripts/test.sh after relevant changes. The current baseline is 42 passing tests. Add or update tests for changed pure rules, data contracts, migrations, curriculum validation, mastery, or scheduling. Validate canonical content and regenerate compatibility adapters when content changes.

For UI work, verify the complete affected journey at a narrow mobile viewport and a wider viewport. Check light and dark themes, fresh and existing saves, keyboard behavior, focus, reduced motion where applicable, persistence after reload, and browser console errors. Do not call work complete when tests are failing or when generated files have drifted from canonical JSON.

After a completed milestone, append a dated entry to PROJECT_LOG.md covering work completed, files changed, architectural decisions, tests/validation, known issues, and recommended next steps.

CURRENT LIMITATIONS TO RESPECT

app.js still owns DOM rendering, navigation, wheel input, lesson flow, and animation orchestration. CSS is split across several files. Audio pronunciation is absent. Each term has one challenge. Daily Review builds compatible three-word wheels heuristically. Crossword layout is suitable for small curated sets rather than large procedural generation. Full keyboard construction, focus management, controller extraction, and direct browser smoke tests remain priorities. The interface is currently single-world even though the data architecture can support more worlds.

PRIORITY DIRECTION

Favor interaction-controller extraction and testable UI state before broad expansion: lesson controller, wheel controller, keyboard play, focus management, accessibility preferences, and browser smoke tests. Exercise the approved curriculum pipeline through a complete real authoring/import cycle before adding a new playable world. Preserve the learning distinction between puzzle skill, applied understanding, and confidence.

WORKING STYLE

Start by stating your understanding of the requested outcome and the relevant current constraints. Distinguish clearly among implemented behavior, architecture-ready capability, proposal, and future roadmap. Make reasonable in-scope assumptions, but identify any assumption that would materially change product direction or curriculum authority. Prefer concrete evidence from the repository over guesswork. Give concise progress updates during longer work. End with the result, verification performed, files changed, and any genuine remaining limitation.
```

## 6. Suggested use

Use the system prompt as Claude’s persistent project context. For each individual update, follow it with a focused task prompt describing the single feature or problem to address, the expected user outcome, and whether Claude should only propose or should also implement the change.

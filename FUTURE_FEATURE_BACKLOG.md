# FinLit Quest future feature backlog

## Player Avatar & Character System

**Status:** Deferred  
**Priority:** Post-MVP — after the application is at least 80% complete  
**Decision date:** 2026-07-13  
**Review gate:** Final Architecture Review

### Decision

Do not implement a player avatar or character system before the Final Architecture Review.

The Alex “Rookie Investor” concept is exploratory only. It is not an approved production asset, canonical character, or authorization to add character-related code, data, UI, dialogue, animation, or dependencies.

### Reason for deferral

Current development must remain focused on completing the educational platform:

- Financial worlds
- Learning objectives
- Knowledge Base
- Scenario Library
- Challenge Library
- Definitions and lesson content
- AI Tutor
- Core game mechanics
- Accessibility and testing
- Beta testing
- App Store launch preparation

A character system does not materially improve the educational experience required for the initial release and would add implementation and maintenance scope.

### Revisit criteria

Re-evaluate this feature only after all of the following are true:

- All educational worlds are complete.
- The Knowledge Base is complete.
- The Scenario Library is complete.
- The Challenge Library is complete.
- Lesson content is complete.
- Core game mechanics are complete.
- Accessibility and testing are complete.
- Beta testing has begun.
- The application has reached at least 80% overall completion.
- The Final Architecture Review has begun.

### Questions for the Final Architecture Review

- Does an avatar measurably increase engagement?
- Does it improve learner retention?
- Does it support meaningful personalization?
- Should players choose from multiple avatars?
- Would world-specific guides serve the learning experience better?
- Is the engagement benefit worth the additional development and maintenance?

### Scope restriction

Until this decision is formally changed:

- Do not add avatar selection or customization.
- Do not add player-character profile fields.
- Do not add character dialogue or story systems.
- Do not add avatar achievements or cosmetics.
- Do not place exploratory character art in production asset folders.
- Do not allow avatar work to displace curriculum, accessibility, testing, or launch priorities.

Any future approval must define the character system’s educational purpose, measurable success criteria, accessibility requirements, content-maintenance cost, and save-schema impact before implementation begins.

## Build Your Wealth — Investment Collection Mini-Game

- **Status:** Proposed — **not approved for implementation**
- **Priority:** Post-V1 engagement expansion. The V1 release remains the immediate priority.
- **Decision date:** 2026-10-17
- **Review gate:** After V1 ships, and only after the owner approvals listed below.
- **Feasibility report:** `docs/FINLIT_QUEST_BUILD_YOUR_WEALTH_FEASIBILITY.md`

### Decision

Add Build Your Wealth to the post-V1 backlog. Do not implement it, and do not add its code, data, UI, save fields or dependencies, before the owner approvals below. All asset names, rates, explanations and events are DRAFT gameplay and curriculum proposals, not approved curriculum, and no stable IDs may be created for them.

### Summary of the proposal

Players spend existing game coins to unlock virtual financial assets, collect small simulated income once per day, and learn one concept per asset. An asset unlocks only when the player has enough coins **and** has solved its related financial term. All assets, income and returns are fictional and must be labelled "Educational simulation, not financial advice." Variation is deterministic and scenario-based; there are no random rewards, no loot boxes, no purchases and no real-money mechanics.

### Recommended smallest version

Three contrasting assets (steady savings, an index-style fund, a single-company stock), one portfolio screen, once-daily collection, one scripted "slow quarter", existing coins only, and integer-only passive income capped at 10 coins per day. Upgrades and milestones come in a second phase.

### Key findings that constrain it

- The game has a **finite coin supply**: replays pay 0, so the 155 currently governed terms provide 6,622 first-discovery coins (1,883 on the active 27-puzzle slate), after which repeatable active income is the daily login at about 26.4 coins per day. The original placeholder economy would let passive income reach about 7.3 times that floor, so the recommended MVP caps portfolio income at 10 integer coins per day (about 38% of the floor).
- A learning gate is possible on "term solved", not on mastery: the asset terms have no lesson, quiz or review content.
- New educational text, the disclaimer, the rates and the events need curriculum approval. The approved INTEREST definition means borrowing cost, which conflicts with teaching savings interest.
- It can be built without a backend using the existing daily-reward pattern. The device-clock residual risk is Low for an offline single-player game and becomes Medium to High if cloud sync or leaderboards (Phase 8) are added.

### Revisit criteria

Re-evaluate only after all of the following are true:

- Version 1.0 has shipped.
- The owner has confirmed which worlds are Approved & Locked for this feature.
- The new curriculum text, the disclaimer wording and (ideally) a quick-check question per asset have been approved through the existing pipeline.
- The owner has approved an economy variant and its passive-income cap, the exit test thresholds, and the UX proposal.
- Engagement Features 3 and 5 (collectibles and upgrades, `FINLIT_QUEST_ENGAGEMENT_EXPANSION_PLAN.md`) have been considered first, because this feature overlaps them.

### Scope restriction

Until this decision is formally changed:

- Do not implement the mini-game or add its save fields, screens, sounds or dependencies.
- Do not change existing coin or XP reward formulas, or create a second currency.
- Do not add randomized rewards, loot boxes, advertisements, purchases or payment processing.
- Do not create stable IDs or definitions for asset content that has not been approved.
- Do not let this work displace V1 release, device verification or curriculum approval priorities.

# FinLit Quest project log

This file is the single source of truth for development continuity. Read it before changing the project. Update it after every completed milestone with the date, work completed, files modified, architectural decisions, known issues, and recommended next steps.

## Product direction

FinLit Quest is an applied financial-learning platform, not primarily a word game. Word-connect puzzles are an engagement mechanic that unlock short lessons, application challenges, rewards, mastery progression, and scheduled review.

The intended experience is premium, modern, friendly, intelligent, and game-like without appearing childish. When a material UX improvement is identified, propose the layout, navigation, visual, or interaction change before implementing it. Prefer a cohesive experience over preserving legacy presentation.

---

## 2026-10-26 — Golden Castle background extended through the complete Journey page

Responded to owner review that the approved artwork ended halfway down the world route. The same approved PNG now forms one continuous background from the top of the Journey map through the final world card, with no repeated-image seam.

### Completed work

- Changed the Journey artwork from a top-only background to a full-height background spanning all 13 world cards.
- Preserved the exact approved PNG and the existing translucent navigation cards, labels, routes, music controls, and gameplay behavior.
- Rebuilt the web bundle, synchronized the iOS bundle, and replaced the desktop and mobile review screenshots with the full-height result.

### Files modified

- `journey.css`
- `tests/world-selection.test.js`
- `ios/App/App/public/journey.css`
- `artifacts/golden-castle/golden-castle-desktop.png`
- `artifacts/golden-castle/golden-castle-mobile.png`
- `PROJECT_LOG.md`

### Verification, decisions, and next steps

- Complete automated suite: **559 of 559 passed**.
- Desktop full-page review at 1440×1050 and mobile full-page review at 375×812 confirmed the image reaches the final world card and contains no repeat seam.
- The web and iOS bundles were regenerated from the same source CSS.
- Unsigned iOS Simulator Release build succeeded with Xcode and the iPhoneSimulator 27.1 SDK.
- No puzzles, progression, hints, audio, saves, rewards, XP, coins, or achievements changed.
- This update remains local and is not deployed.

---

## 2026-10-26 — Approved Golden Castle Journey artwork integrated locally

Integrated the owner's exact attached Golden Castle PNG into the World Quest Journey page without regenerating, recompressing, or substituting the artwork. This milestone is complete locally and has not been deployed.

### Completed work

- Saved the byte-identical approved image at `assets/images/golden-castle-journey.png` (1536×1024 PNG; SHA-256 `ba0bc3ed7fabdb48adc17e94a9130ae5b4aeb553f279bb6e8c2feed36579015f`).
- Replaced the synthetic Journey scenery with the approved castle, crescent moon, waterfalls, and golden, blue, and green paths while preserving all 13 world controls and their order.
- Used aspect-ratio-preserving `background-size: 100% auto` presentation, translucent glass controls, limited blur, and responsive positioning. Desktop cards avoid the castle; mobile shows the complete artwork before the scrollable world route begins.
- Removed the old synthetic SVG path, clouds, river shimmer, and path spark from the Journey screen so they do not cover or conflict with the approved artwork.
- Added the image to the production web build manifest and synchronized the exact same bytes into the Capacitor iOS bundle.
- Captured reviewed desktop and iPhone-size screenshots under `artifacts/golden-castle/`.

### Files modified

- `assets/images/golden-castle-journey.png`
- `journey.css`
- `scripts/build-www.sh`
- `tests/world-selection.test.js`
- `ios/App/App/public/journey.css`
- `ios/App/App/public/assets/images/golden-castle-journey.png`
- `artifacts/golden-castle/golden-castle-desktop.png`
- `artifacts/golden-castle/golden-castle-mobile.png`
- `PROJECT_LOG.md`

### Verification, decisions, and next steps

- Complete automated suite: **559 of 559 passed**.
- Production web build completed: **69 files, 9.6 MB**.
- Unsigned iOS Simulator Release build succeeded with Xcode and the iPhoneSimulator 27.1 SDK.
- Source, generated web, and generated iOS images have the same SHA-256 checksum, confirming exact asset parity.
- Desktop review at 1440×1050 and mobile review at 375×812 confirmed that the artwork is not stretched, the major landmarks remain visible, and world navigation remains readable.
- Existing music-only mute behavior, sound effects, puzzles, saves, XP, coins, achievements, and rewards were not changed.
- Known issue: final physical-iPhone visual confirmation remains recommended because simulator-sized browser review cannot reproduce every device safe-area and browser-toolbar combination.
- Recommended next step: owner reviews the local screenshots. Do not deploy until the owner approves the combined local changes; the live website remains unchanged.

---

## 2026-10-26 — Bonus Games hub and interrupted-wheel recovery completed locally

Moved standalone practice experiences out of bottom-of-page banners into a dedicated top-level arcade and corrected a second wheel reliability defect reproduced in the local browser. This milestone remains local and has not been deployed.

### Completed work

- Added a third **Bonus Games** tab beside Word Quests and Learning Quests.
- Added a responsive Bonus Arcade hub containing Currency Rush, Where Should My Money Go?, and a reserved future-games card.
- Removed the scattered bottom game banners; Currency Rush now returns to Bonus Games when launched from the arcade while the post-crossword bonus still returns to the completed puzzle.
- Reproduced the remaining wheel failure: some browsers emitted `pointercancel` or `lostpointercapture`, causing the game to erase the selected letters and report “Selection cancelled.”
- Changed interrupted pointer handling to preserve tapped letters and submit a completed multi-letter swipe instead of discarding the attempt.
- Disabled browser-native drag images, text selection, long-press callouts, and context menus on both crossword and Currency Rush wheels. Letter tiles are explicitly non-draggable.
- Rebuilt the web bundle and synchronized the same assets into the local Capacitor iOS bundle.

### Files modified

- `index.html`
- `app.js`
- `journey.css`
- `word-game-app.js`
- `word-game.css`
- `src/currency-rush.js`
- `currency-rush.css`
- `tests/wheel-interaction.test.js`
- `tests/currency-rush.test.js`
- `tests/world-selection.test.js`
- Generated bundle copies under `www/` and `ios/App/App/public/`
- `PROJECT_LOG.md`

### Verification, decisions, and next steps

- Focused interaction and audio tests: **88 of 88 passed**.
- Complete automated suite: **558 of 558 passed**.
- Local browser verification confirmed the Bonus Games desktop layout, Currency Rush launch/return routing, and first-entry acceptance of `NET` after the same automated pointer sequence had previously reproduced “Selection cancelled.”
- Architectural decision: standalone mini-games belong in Bonus Games; Learning Quests remains reserved for authored educational lessons and activities.
- Known issue: real-device testing is still recommended for the exact iPhone touch sequence that originally produced the ghost drag.
- Recommended next step: owner reviews the local Bonus Games layout and wheel feel. Do not deploy until that review is complete.

---

## 2026-10-26 — Shared letter-wheel reliability restored and verified for deployment

Corrected intermittent word-entry failures in both governed crosswords and Currency Rush. The issue was input sampling, not puzzle data: fast pointer movement could cross a letter between browser events, and the final pointer-up position was not processed before submission.

### Completed work

- Added shared segment-based hit detection so every letter tile crossed between pointer samples is recovered in travel order.
- Processed coalesced pointer events where the browser provides them and always processed the final pointer-up position before evaluating an answer.
- Applied the same interaction path to the main crossword wheel and Currency Rush so mouse, touch, stylus, slow drags, and rapid swipes behave consistently.
- Added a clearly labeled **Submit** control as a reliable accessibility and tap-entry fallback; Enter also submits the active selection.
- Updated wheel instructions to explain swipe and tap-plus-submit operation without changing answer validation, puzzle composition, progression, hints, XP, coins, or rewards.
- Rebuilt the web bundle and synchronized the same assets into the Capacitor iOS bundle.

### Files modified

- `src/wheel-interaction.js`
- `word-game-app.js`
- `word-game.css`
- `src/currency-rush.js`
- `index.html`
- Wheel, audio, Currency Rush, victory, and V3 acceptance regression tests under `tests/`
- Generated bundle copies under `www/` and `ios/App/App/public/`
- `PROJECT_LOG.md`

### Verification, decisions, and next steps

- Focused wheel/audio/Currency Rush suite: **75 of 75 passed**.
- Complete automated suite: **558 of 558 passed**.
- Browser verification accepted `NET` and `PAYMENT` on their first entry in Money Basics and `AED` on its first Currency Rush entry; the console remained free of errors.
- Web and iOS bundle parity passed after the production web build and Capacitor copy.
- Unsigned iOS Simulator Release build succeeded with Xcode and the iPhoneSimulator 27.1 SDK.
- Architectural decision: pointer-segment recovery is the canonical solution for sparse high-speed input events; individual game screens should not implement separate wheel hit-testing rules.
- Known issue: physical-device touch testing is still recommended because simulator and desktop automation cannot reproduce every iPhone touch-sampling pattern.
- Production deployment completed through GitHub Pages from commit `5ff16e2`; the deployment workflow completed successfully.
- Live verification on `https://finlitquest.com` confirmed Round 1 Guided Study, Round 2 Code Recall with hidden codes, and Round 3 Memory Challenge with no answer list. `AED` scored on its first Currency Rush entry, while Money Basics accepted `NET` and `PAYMENT` on their first entries.

---

## 2026-10-26 — Currency Rush three-stage learning cycle and game placement completed locally

Corrected Currency Rush so every owner-supplied nine-letter wheel follows the same progressive teaching sequence. Added the activity to both the Learning Academy surface and the crossword completion experience while retaining practice-only scoring and leaving the governed crossword economy unchanged.

### Completed work

- Expanded the seven wheel rounds into **21 learning stages**: three consecutive plays per wheel.
- Stage 1, Guided Study, preserves the existing complete reference list with country, currency name, and ISO code.
- Stage 2, Code Recall, repeats the exact same wheel and target set while showing country and currency name but replacing undiscovered codes with `???`. A code appears only after the player discovers it.
- Stage 3, Memory Challenge, repeats the same wheel and target set with the complete reference panel hidden. Correct-answer reveals and end-of-round found/missed learning records remain available.
- Repeats that three-stage sequence for all seven wheels; Stage 4 therefore begins Guided Study for Wheel 2, and Stage 21 is the Memory Challenge for Wheel 7.
- Added a permanent **Currency Rush** practice activity button to the Learning Quests/Learning Academy view.
- Added an optional **Currency Rush Bonus** button to the Puzzle Solved panel. Exiting this route restores the completed crossword and its Next Puzzle control instead of losing the player's place.
- Kept Currency Rush knowledge points isolated from permanent coins, XP, achievements, mastery, saves, and crossword progression. No repeatable spendable reward path was added.
- Rebuilt the web bundle and synchronized the identical assets into the Capacitor iOS bundle.

### Files modified

- `src/currency-rush.js`
- `currency-rush.css`
- `index.html`
- `app.js`
- `word-game-app.js`
- `word-game.css`
- `tests/currency-rush.test.js`
- Generated bundle copies under `www/` and `ios/App/App/public/`
- `PROJECT_LOG.md`

### Verification, decisions, and next steps

- Currency Rush focused suite: **12 of 12 passed**.
- Complete automated suite: **557 of 557 passed**.
- Browser verification confirmed Round 1 displays `ROUND 1 OF 21 · GUIDED STUDY`, Round 2 repeats Wheel 1 as `CODE RECALL`, and Round 3 repeats Wheel 1 as `MEMORY CHALLENGE` with no pre-answer reference panel.
- Automated coverage verifies the complete Stage 1–6 mapping across Wheels 1–2, the final Wheel 7/Stage 21 mapping, code suppression, no-reference memory mode, both navigation entries, and the absence of permanent reward writes.
- Web and iOS bundle parity passed after `npx cap copy ios`.
- Unsigned iOS Simulator Release build succeeded against the iPhoneSimulator 27.1 SDK.
- No production deployment was performed. Recommended next step: owner play-tests the three Wheel 1 stages, then decides whether the optional crossword bonus should remain available after every puzzle or only at selected level milestones. Any spendable bonus reward still requires a separate one-time reward and deduplication policy.

---

## 2026-10-26 — Currency Rush playable prototype and progressive learning completed locally

Built the isolated FinLit Quest Currency Rush bonus game and then applied the owner's progressive-learning update. The feature is available as a local practice preview and is intentionally disconnected from coins, XP, achievements, crossword progression, and permanent player saves until its integration and reward rules receive separate approval.

### Completed work

- Added a cinematic international-currency arena with a glowing globe, nine-letter wheel, floating currency symbols, responsive glass panels, coin rain, success reveal, and final results presentation.
- Added mouse/touch swipe, tap, repeated-tile protection, keyboard entry, cancellation, invalid feedback, duplicate protection, 60-second timer, live scoring, streak bonuses, completion bonus, and early-finish bonus.
- Validated the seven owner-supplied wheels mechanically against the official ISO 4217 List One published 2026-09-17 by the SIX ISO 4217 Maintenance Agency. Runtime data contains 71 unique current codes and 88 wheel placements; exact letter multiplicities are enforced.
- Added full code, currency name, country/countries, and local flag presentation. Shared currencies such as EUR and USD summarize their multiple listed economies, while globally administered codes such as XDR use a global marker.
- Implemented progressive learning: Rounds 1–2 show the exact target list with country, full currency name, and code and visibly mark discoveries; Rounds 3–7 remove the entire reference list and show only currencies remaining until a correct answer or the results screen.
- Results now show full code/name/country records for both found and missed currencies in every round.
- Reused the existing original Web Audio engine for rising per-letter tones, correct/invalid/duplicate feedback, coin sparkle, round completion, continuous music, and the independent persistent music-only mute preference.
- Added a narrow integration surface (`openCurrencyRush` / `FinLitCurrencyRushController`) for a future between-level reward gate or unlimited Learning Academy practice. No integration was activated in production progression.
- Added a deterministic ISO XML importer so future official-list refreshes can regenerate the runtime records without manual code invention.

### Files added

- `content/currency-rush-data.js`
- `src/currency-rush.js`
- `currency-rush.css`
- `scripts/import-currency-rush-data.mjs`
- `tests/currency-rush.test.js`
- `artifacts/currency-rush/currency-rush-desktop-guided.png`
- `artifacts/currency-rush/currency-rush-desktop-memory.png`
- `artifacts/currency-rush/currency-rush-mobile-guided.png`
- `artifacts/currency-rush/currency-rush-mobile-reference.png`

### Files modified

- `index.html`
- `word-game-app.js`
- `scripts/build-www.sh`
- `tests/bundle-parity.test.js`
- Generated bundle copies under `www/` and `ios/App/App/public/`
- `PROJECT_LOG.md`

### Verification, decisions, and next steps

- Currency Rush focused suite: **11 of 11 passed**.
- Complete automated suite: **556 of 556 passed**.
- Browser interaction verified a successful AED tap sequence, +100 practice knowledge points, currency reveal, coin presentation, guided-list discovery highlighting, a Round 3 memory screen with no answers exposed, and music-mute persistence after reload.
- Responsive visual inspection completed at 1440×1000 and 390×844. The mobile reference remains below the wheel in a bounded scroll region, so it does not obscure the timer or wheel.
- Browser console errors after guided and memory-round checks: **0**.
- Web bundle rebuilt and Capacitor assets synchronized. Source and iOS hashes match for the HTML, Currency Rush CSS, engine, and currency data.
- Unsigned iOS Simulator Release build succeeded against the iPhoneSimulator 27.1 SDK.
- No production deployment was performed. Recommended next step: owner play/listening review of all seven practice rounds, followed by a separate decision about where the Learning Academy entry appears and whether/when between-level play may issue a one-time governed reward.
- The owner's exact Golden Castle Journey artwork remains a separate unresolved asset request and was not changed by this milestone.

---

## 2026-10-26 — Persistent music-only mute completed; Golden Castle asset still unavailable

Completed and verified the independent background-music mute milestone while preserving the existing sound-effects channel. The requested owner-approved Golden Castle Journey artwork was not accessible in the conversation, attachment cache, project, Downloads, or temporary upload area, so the journey background was intentionally not replaced or approximated.

### Completed work

- Added a visible, touch-sized speaker control to the World Quest Journey header and the shared level/gameplay header.
- Added the independent persistent `finlitQuest.musicEnabled` preference. Muting fades only the music bus; rising letter tones, correct/incorrect feedback, coin sounds, and completion fanfares remain governed by the existing effects preference and volume.
- Preserved the saved music volume while muted and restored that exact volume when unmuted.
- Kept the music engine alive across Journey, world, level, and puzzle navigation so navigation does not create duplicate music or restart the loop.
- Preserved browser audio-unlock handling for iPhone Safari/WKWebView and desktop browsers.
- Added accessible dynamic labels (`Mute background music` / `Unmute background music`), pressed state, keyboard focus treatment, and 42–44px touch targets.

### Files modified

- `index.html`
- `journey.css`
- `app.js`
- `word-game.css`
- `word-game-app.js`
- `src/victory-celebration.js`
- `tests/game-audio.test.js`
- `tests/victory-celebration.test.js`
- Generated bundle copies under `www/` and `ios/App/App/public/`
- `PROJECT_LOG.md`

### Verification, blocker, and next step

- Focused audio/parity suite: **57 of 57 passed**.
- Complete automated suite: **545 of 545 passed**.
- Browser interaction confirmed music-only mute on the Journey page, persistence into Money Basics level selection, persistence after reload, and restoration to the prior 28% volume when unmuted. The effects control remained enabled at 90% while music was muted.
- Production web bundle rebuilt and Capacitor iOS assets synchronized successfully.
- Unsigned iOS Simulator build succeeded against the iPhoneSimulator 27.1 SDK.
- Golden Castle integration remains blocked: no matching castle/pathway/portal image file was exposed by the user's attempted attachment. The available temporary images were inspected and were unrelated, so none was substituted.
- Remaining work after the exact file is successfully attached: copy and optimize that exact artwork without visible degradation, integrate responsive Journey positioning around its landmarks, add asset/bundle regression tests, capture desktop and iPhone screenshots, rerun the full suite/build, and update this log with the completed image milestone.
- No production deployment was performed.

---

## 2026-10-26 — World backgrounds made prominent with translucent gameplay glass

Completed the background-visibility correction across the shared 13-world presentation layer. This was a CSS-only gameplay-surface change: no puzzle data, curriculum, audio behavior, rewards, hint rules, saves, or progression logic changed.

### Completed work

- Reduced the full-screen art tint from the previous heavy navy veil to a restrained 22–45% directional readability gradient so each installed fantasy environment remains prominent.
- Rebuilt the three Level panels as 23–27% dark glass with subtle borders, shadows, saturation, and 7px backdrop blur.
- Rebuilt the crossword board as 16–20% glass and the letter wheel as 16–20% glass, using background alpha rather than parent `opacity`, so child text and controls stay fully opaque.
- Kept crossword cells intentionally high contrast at 92% background alpha, strengthened their borders, and retained solid selected/found states.
- Kept game buttons, progress indicators, navigation, and action controls legible; added targeted text shadows instead of another page-wide overlay.
- Softened the top bar, world header, mission card, and daily status panel so more of the world remains visible throughout level selection and gameplay.
- Preserved the existing responsive crop rules and reduced-motion behavior for all 13 stable world IDs.

### Files modified

- `word-game.css`
- `tests/world-backgrounds.test.js`
- Generated bundle copies under `www/` and `ios/App/App/public/`
- `PROJECT_LOG.md`

### Verification, decisions, and next steps

- Added a regression test that enforces the intended level/board/wheel alpha ranges, limited backdrop blur, and the rule against container-level opacity.
- Complete automated suite: **543 of 543 passed**.
- Production web bundle rebuilt successfully; Capacitor assets synchronized to iOS.
- Unsigned iOS Simulator build succeeded against the iPhoneSimulator 27.1 SDK.
- Browser visual checks completed for the narrow/mobile level-selection, crossword, and wheel views. The same shared CSS rules cover every world and default desktop layouts.
- Before/after screenshots were captured during implementation; the after views confirm that the Money Basics environment remains clearly visible behind all primary gameplay surfaces while controls retain contrast.
- The three exact owner-approved image files remain pending and were not replaced: `assets/worlds/coins-currency-approved.jpg`, `assets/worlds/insurance-protection-approved.jpg`, and `assets/worlds/social-media-approved.jpg`.
- No production deployment was performed. Recommended next step: owner reviews the local glass treatment across a few preferred backgrounds, then supplies the three pending approved files before release QA.

---

## 2026-10-26 — Ten cinematic world backgrounds integrated; three approved assets pending

Implemented the shared 13-world background system and combined it with the completed interactive audio engine. Ten original, optimized cinematic environment images are installed. The three images the owner previously approved were not present in the repository, so their mappings remain explicitly pending rather than being silently replaced.

### Completed work

- Added a governed background manifest for all 13 stable world IDs with exact themes, desktop/mobile crop positions, atmosphere palettes, and asset status.
- Generated and installed ten original 16:9 stylized-3D environments for Money Basics, Credit, Crypto, Banking, Investing, AI & Technology, Real Estate, Taxes, Business, and Retirement.
- Optimized the ten runtime JPEGs to 516–643 KB each; worlds load their own image only when entered.
- Preserved the exact approved-artwork slots for Coins & Currency, Insurance & Protection, and Social Media & Digital Income. Those worlds use clearly temporary thematic gradients until the owner supplies the exact files.
- Added responsive `cover` cropping, a readability overlay, translucent gameplay surfaces, subtle low-cost atmospheric drift/particles, and complete `prefers-reduced-motion` handling.
- Kept each background active through all three levels and 15 games without changing world names or navigation.
- Retained the complete Web Audio implementation: rising letter tones, correct/incorrect responses, coin/crossword/level/world sounds, continuous synthesized music, future licensed-track adapter, independent saved volume controls, master mute, and iPhone unlock behavior.
- Preserved all 58 canonical puzzles, 195 placements, 13 worlds, permanent IDs, saves, coins, XP, rewards, reward deduplication, and governed hint pricing.

### Files added

- `content/world-backgrounds.js`
- `assets/worlds/README.md`
- Ten optimized JPEGs under `assets/worlds/`
- `tests/world-backgrounds.test.js`

### Files modified

- `word-game-app.js`
- `word-game.css`
- `index.html`
- `scripts/build-www.sh`
- `tests/bundle-parity.test.js`
- Generated web/native bundle copies under `www/` and `ios/App/App/public/`
- `PROJECT_LOG.md`

### Verification, known issues, and next steps

- Complete automated suite: **542 of 542 passed**.
- Browser interaction opened Games 1, 6, and 11 in every one of the 13 worlds; all 39 sampled games loaded a wheel and crossword, all ten installed image mappings reached `ready`, and the three pending approved slots remained correctly labeled `awaiting-owner-approved-file`.
- Narrow/mobile gameplay inspection confirmed `cover` cropping, readable glass panels, accessible controls, free Level 1 hints, and responsive layout. Desktop/narrow CSS paths and native bundle parity are regression-covered.
- Browser console errors after the complete sweep: **0**.
- Web bundle rebuilt, Capacitor iOS assets synchronized, and the unsigned iOS Release build succeeded against iPhoneOS 27.1.
- Missing exact approved assets: `assets/worlds/coins-currency-approved.jpg`, `assets/worlds/insurance-protection-approved.jpg`, and `assets/worlds/social-media-approved.jpg`.
- No production deployment was performed. Next: owner reviews the local backgrounds and audio, supplies the three approved image files, then the same QA gates run again before any deployment authorization.

---

## 2026-10-26 — Audio progression tiers and licensed-track integration completed locally

Completed the second audio milestone without changing curriculum, puzzles, progression, rewards, or save data. The crossword now distinguishes immediate letter anticipation from accepted answers, coin rewards, crossword completion, level completion, and world completion, while retaining a continuous low-volume music bed.

### Completed work

- Added a compact original coin-reward sound and distinct original fanfares for crossword, five-puzzle level, and fifteen-puzzle world completion.
- Added completion-sound priority and temporary music ducking so simultaneous milestones resolve as one clear celebration rather than overlapping at excessive volume.
- Kept rising tones immediate for every newly selected wheel tile, including repeated letters, rapid selections, tapping, dragging, and canceled attempts.
- Preserved gentle invalid and canceled-selection resolutions and the existing accepted-answer/key-term sounds.
- Added a future licensed-music adapter. `content/audio-config.js` intentionally leaves `musicTrackUrl` empty, so the synthesized loop remains active until the owner purchases and adds the Suno file. No preview or unlicensed audio was used.
- The licensed track, when configured later, uses the same persistent music bus, mute preference, volume control, looping behavior, and iPhone audio-unlock path; puzzle and level changes do not recreate or restart it.
- Completion-tier selection is derived read-only from permanent puzzle history after progress is saved. It does not alter rewards, completion state, coins, XP, mastery, or permanent IDs.
- Rebuilt the web bundle and synchronized identical assets into the Capacitor iOS bundle.

### Files modified

- `content/audio-config.js` (new)
- `src/game-audio.js`
- `src/victory-celebration.js`
- `word-game-app.js`
- `index.html`
- `scripts/build-www.sh`
- `tests/game-audio.test.js`
- `tests/victory-celebration.test.js`
- `tests/bundle-parity.test.js`
- Generated bundle copies under `www/` and `ios/App/App/public/`
- `PROJECT_LOG.md`

### Verification, decisions, and next steps

- Complete automated suite: **537 of 537 passed**.
- Production web bundle rebuilt and Capacitor iOS synchronization completed successfully.
- Unsigned iOS Release build completed successfully against the iPhoneOS 27.1 SDK.
- Local browser interaction verified letter selection, canceled selection, master mute/unmute, the separate Effects and Music controls, all 13 existing world cards, and zero console errors.
- Automated audio tests verify rising pitch, repeated-letter handling, rapid-voice limits, independent bus gains, suspended-context activation, continuous music without puzzle restarts, licensed-track fallback, and distinct coin/crossword/level/world signatures.
- No production deployment was performed. Next: conduct an owner listening review on desktop and a real iPhone; after purchasing the soundtrack, add the licensed local audio asset and set `musicTrackUrl`, then rerun this same verification before separately authorizing deployment.

---

## 2026-10-26 — Interactive crossword audio system completed locally

Implemented an original Web Audio system for crossword gameplay. A quiet synthesized music loop now begins after the required player gesture, continues without restarting across level selection, traced words, puzzle transitions, and the completion panel, and stops when the player exits to the world journey.

### Completed work

- Extended the existing single `AudioContext` engine with independent effects and music buses.
- Added an original eight-beat background arrangement using synthesized roots, melody notes, and restrained phrase chords; no audio files, third-party music, network requests, or libraries are used.
- Preserved the rising per-letter tone sequence and ensured one tone plays only for each newly selected physical tile, including repeated letters and rapid swipes.
- Preserved distinct accepted-answer chimes, financial-term wins, key-term and completion flourishes, and the gentle incorrect-word resolution.
- Added a soft canceled-selection resolution for pointer cancellation, Escape, and the Clear control.
- Added separate, accessible Effects and Music volume sliders in the gameplay header and completion panel.
- Persisted the music level independently under `finlitQuest.musicVolume`; the existing saved master mute preference still disables both buses.
- Kept the low music bus outside the rapid-swipe effects voice cap, retained per-voice gain limits, and continued using the shared compressor to prevent excessive loudness.
- Preserved all worlds, puzzles, permanent IDs, rewards, saves, coins, XP, hint behavior, and gameplay mechanics.

### Files modified

- `src/game-audio.js`
- `src/victory-celebration.js`
- `word-game-app.js`
- `index.html`
- `word-game.css`
- `tests/game-audio.test.js`
- `tests/victory-celebration.test.js`
- Generated web/native bundle copies under `www/` and `ios/App/App/public/`
- `PROJECT_LOG.md`

### Verification, decisions, and next steps

- Complete automated suite: **533 of 533 passed**.
- Web bundle rebuilt and Capacitor iOS assets synchronized successfully.
- Local browser verification confirmed independent volume adjustment, persistence after reload, mute/unmute behavior, traced-letter selection, canceled selection, gameplay exit, and zero console errors.
- The background music is intentionally quieter than effects by default (28% versus 90%) and uses the same player-controlled master mute.
- No production deployment was performed. Next: owner listens to the local mix on desktop and a real iPhone, adjusts the default mix if desired, then separately authorizes production deployment.

---

## 2026-10-19 — 13-world production deployment completed

Deployed and verified the 13-world, three-level FinLit Quest release on the existing GitHub Pages production site. The live game now exposes 15 playable puzzle placements in every world, for 195 total world placements backed by 58 canonical puzzles.

### Completed work

- Ran the complete automated suite: **527 of 527 tests passed**.
- Rebuilt the production web bundle and synchronized the same assets into the native iOS bundle.
- Built the iOS Release configuration successfully with code signing disabled for local verification.
- Published application commit `c91e438247a06bcec76c93dfeafeafc13a3e49fd` to `main` through the connected GitHub integration.
- Verified the new cache stamp and application assets at [finlitquest.com](https://finlitquest.com).
- Verified all 13 world cards report 15 puzzles and opened Games 1, 6, and 11 in every world on the live site.
- Confirmed Level 1 shows unlimited free hints and Levels 2–3 restore the governed 100/300 coin prices.
- Confirmed the production interaction sweep produced no browser console errors.
- Preserved permanent puzzle and term IDs, save schema v4, existing progress, world-specific progression, and canonical first-reward protection.

### Files modified

- Production release files from the preceding 13-world and three-level milestones
- Generated web bundle under `www/`
- Synchronized native bundle under `ios/App/App/public/`
- `PROJECT_LOG.md`

### Architectural decisions and deployment notes

- GitHub Pages remains the production host and `finlitquest.com` remains the production domain; no hosting or domain changes were made.
- Research-only `staging/` and `exports/` artifacts were not required by the runtime and were excluded from the production deployment commit.
- Local GitHub CLI authentication was unavailable, so deployment used the repository's already-connected GitHub integration rather than introducing new credentials or infrastructure.

### Known issues and recommended next steps

- TestFlight upload was not attempted because Apple Developer Program enrollment, signing identity, and provisioning are not currently available.
- The verified unsigned iOS Release build is ready for the next device phase. Next: enroll/configure Apple signing, run on a real iPhone, then upload a TestFlight beta without changing game content.

---

## 2026-10-19 — All 15 puzzles exposed through three visible levels

Fixed the interface-level five-game limit that hid Games 6–15 despite all 15 canonical references being loaded. Opening any of the 13 worlds now shows three visible levels with five directly selectable games each.

### Root cause and completed work

- Root cause: `wgStartPlaythrough()` randomly selected only `requiredPuzzles: 5`; no Level 2/3 or puzzle-selection UI existed, and the fifth completion started another random session.
- Added a responsive level-selection screen with Level 1 Games 1–5, Level 2 Games 6–10, and Level 3 Games 11–15.
- Kept all 15 games immediately available with no unlock requirement.
- Preserved unlimited free hints for Level 1 only; Levels 2 and 3 use the existing 100/300 governed pricing.
- Added direct game selection, completed-game markers, per-level completion totals, a Levels return control, and deterministic progression within each level.
- Preserved canonical puzzle references, save schema v4, rewards, XP, coins, existing world histories, and shared first-reward protection.

### Files added

- `tests/three-level-navigation.test.js`
- `docs/FINLIT_QUEST_15_PUZZLE_LEVEL_ACCESS_REPORT.md`

### Files modified

- `index.html`
- `word-game.css`
- `word-game-app.js`
- `src/puzzle-bank-engine.js`
- `tests/tutorial-hints-runtime.test.js`
- `tests/anchor-playable-runtime.test.js`
- `PROJECT_LOG.md`
- Generated web/native bundle copies under `www/` and `ios/App/App/public/`

### Verification and next step

- Every one of the 13 worlds partitions into exactly three ordered five-game levels and exposes all 15 permanent puzzle references.
- Browser verification opened Games 1, 6, and 11 in all 13 worlds. Every world exposed 15 game buttons, all sampled puzzles loaded their canonical wheels, and the full interaction sweep produced no console errors.
- Money Basics was additionally checked for hint behavior: Level 1 displayed unlimited free hints; Levels 2 and 3 displayed normal governed prices.
- Complete automated suite after synchronization: **527 of 527 passed**. Web build, iOS sync, bundle parity, save migration, and shared reward tests passed.
- Next: owner visually reviews the three-level screen on the local game and decides whether future versions should add sequential level locks. No locks are currently imposed.

---

## 2026-10-19 — Shared 58-puzzle library implemented across all 13 worlds

Implemented the owner's cross-world puzzle authorization. The 58 existing validated crosswords now serve as one canonical library with 195 ordered world placements: 15 in each of the 13 playable worlds. No new puzzle, term, definition, reward formula, or approved curriculum record was created or rewritten.

### Completed work

- Reviewed all 58 puzzles and assigned only educationally relevant cross-world placements, each with a recorded rationale.
- Preserved the original five worlds' puzzle order and every permanent puzzle/term identity.
- Added a deterministic reference-manifest generator and generated JSON/browser assets.
- Added save schema v4 `canonicalPuzzleProgress` so canonical first rewards, world-specific curriculum progress, and repeat play are distinct.
- Migrated existing completion evidence additively; previously earned rewards and per-world histories remain intact.
- Prevented duplicate coins/XP, duplicate first-completion celebrations, and duplicate daily-completion credit when one canonical puzzle appears in several worlds.
- Standardized all worlds at 15 placements and five puzzles per Level 1 playthrough, preserving unlimited free Level 1 hints.
- Added a full implementation report and regression coverage.

### Files added

- `scripts/build-shared-puzzle-library.mjs`
- `content/shared-puzzle-library-2027.json` and `.js`
- `tests/shared-puzzle-library.test.js`
- `docs/FINLIT_QUEST_2027_SHARED_PUZZLE_LIBRARY.md`

### Files modified

- `word-game-app.js`
- `learning-engine.js`
- `src/puzzle-bank-engine.js`
- `content/world-definitions-2027.json` and `.js`
- `index.html`
- `scripts/build-www.sh`
- Existing regression tests whose prior assertions described the superseded single-world/save-v3 behavior
- Generated web/native bundle copies under `www/` and `ios/App/App/public/`

### Architectural decisions, verification, known issues, and next step

- Puzzle definitions stay in their approved canonical sources; world lists contain permanent-ID references only.
- Unique puzzles: **58**. Total world placements: **195**. Shared placements added: **137**. New unique puzzles generated: **0**.
- All worlds reach 15; each remains five placements short of the optional 20-puzzle target.
- Complete automated suite: **522 of 522 passed**. Web bundle and iOS Capacitor sync passed; bundle parity passed. The real selection UI shows 15 puzzles on all 13 cards, and Money Basics, Credit, and AI opened valid puzzle screens during visual verification.
- Known limitation: preferred 20-placement depth is not reached. Do not add weakly related content to close that optional gap.
- Next: owner reviews the placement report. If 20 per world is desired, review additional existing-library placements first, then generate new puzzles only for documented educational gaps.

---

## 2026-10-18 — Eight new worlds activated with 31 validated puzzles

Reviewed the 34 existing new-world proposals under the owner's explicit implementation authorization and activated every qualifying record. All 13 worlds now open the shared crossword game; the original five worlds and their 27 V3 puzzle compositions remain unchanged.

### Completed work

- Revalidated all 34 proposals for educational anchor eligibility, permanent identities, exact nine-letter wheels, repeated-letter counts, 4–9-letter answers, strict crossword boundaries/connectivity, duplicate compositions, and V3 runtime compatibility.
- Approved and implemented **31** puzzles: Coins 4, AI & Technology 1, Real Estate 2, Taxes 3, Insurance & Protection 4, Business & Entrepreneurship 10, Social Media & Digital Income 2, and Retirement & Wealth Planning 5.
- Rejected three proposals without modifying their immutable research records: RENTAL CAR and ROOT CANAL in Insurance, and COMMUNITY in Retirement. Each fails the legitimate financial/business/technology anchor requirement as written.
- Assigned 52 unique permanent term identities for newly authorized educational terms. Existing cross-world IDs, definitions, ownership, mastery identity, and rewards remain unchanged.
- Kept FRACTION as an ordinary support word with no financial identity or reward because CAL-0008 deferred the distinct *fractional share* concept.
- Added generated JSON runtime assets plus browser adapters and a deterministic activation script.
- Added eight additive `wg-*` save namespaces and routed the approved banks through the existing gameplay, progress, reward, definition-review, hint, and save systems.
- Replaced Coming Soon states with playable progress on all eight cards.
- Recorded the owner authorization as CAL-0011 and updated the governance matrix and activation report.
- Updated user-facing metadata to describe 13 playable worlds.

### Files added

- `scripts/activate-2027-new-worlds.mjs`
- `content/2027-new-world-terms.json` and `.js`
- `content/2027-new-world-puzzle-banks.json` and `.js`
- `tests/new-world-activation.test.js`
- `docs/FINLIT_QUEST_2027_NEW_WORLD_ACTIVATION_REPORT.md`

### Files modified

- `index.html`
- `app.js`
- `word-game-app.js`
- `src/puzzle-validator.js`
- `scripts/build-www.sh`
- `package.json`
- `tests/world-selection.test.js`
- `tests/thirteen-world-expansion.test.js`
- `tests/tutorial-hints-runtime.test.js`
- `tests/daily-login-rewards.test.js`
- `docs/CURRICULUM_APPROVAL_LOG.md`
- `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md`
- `PROJECT_LOG.md`
- Generated web/native bundle copies under `www/` and `ios/App/App/public/`

### Architectural decisions, verification, known issues, and next step

- New-world content is separate from `src/v3-puzzle-slate.js`; its original 27 specifications remain intact. The shared runtime prefers a world's approved generated bank when present.
- Save compatibility is additive. Each new world has a unique namespace; global term IDs still prevent duplicate mastery and first-discovery rewards across worlds.
- Official source URLs are stored on every new term record. Draft proposal wording was reviewed before becoming exact runtime definition text; FCRA, ECOA, TILA, REIT, SIMPLE IRA, SEP IRA, MARGIN, and AUTO TRADE received accuracy clarifications before approval.
- Focused content/runtime tests passed. Complete automated suite: **517 of 517 passed**. Web and iOS assets were rebuilt and synchronized; bundle parity passed. A real browser sweep opened all 13 worlds, confirmed the expected puzzle total in each, confirmed every new-world wheel has nine tiles, and found zero console errors.
- AI & Technology intentionally starts with one puzzle, per owner authorization. Several new worlds remain below the long-term 15–20 target; expand them later through the same review gate.

---

## 2026-10-18 — Eight approved worlds connected to the actual game interface

Implemented the owner's eight approved world identities on the live world-selection screen without promoting research proposals into gameplay. The original five worlds and their 27-puzzle slate remain the only playable worlds; each new world is visible and clearly marked **Coming Soon**.

### Completed work

- Expanded the selection journey from five to all **13 owner-approved worlds**, in the governed order.
- Added visible cards for Coins & Currency, AI & Technology, Real Estate, Taxes, Insurance & Protection, Business & Entrepreneurship, Social Media & Digital Income, and Retirement & Wealth Planning.
- Added a browser-safe runtime adapter for `content/world-definitions-2027.json` and made `app.js` derive its selection order and playability gate from that registry.
- Guarded every new-world card from `wgOpenWorld`, progress creation, rewards, and saves. Selecting one displays an accurate message that the world is approved but its playable puzzle bank still needs owner approval.
- Preserved the existing routes and progress rendering for Money Basics, Credit Foundations, Crypto Foundations, Banking Basics, and Investing Basics.
- Extended the existing journey-map path and responsive node positioning for 13 cards without redesigning the screen.
- Updated the governance matrix to distinguish **visible Coming Soon** from **playable**.
- Synced the web source into the Capacitor `www/` output and native iOS public bundle.

### Playability decision

- **Playable:** Money Basics, Credit Foundations, Crypto Foundations, Banking Basics, Investing Basics.
- **Visible — Coming Soon:** Coins & Currency, AI & Technology, Real Estate, Taxes, Insurance & Protection, Business & Entrepreneurship, Social Media & Digital Income, Retirement & Wealth Planning.
- None of the eight new worlds has an owner-approved runtime term registry and puzzle bank. Their research proposals were not treated as approvals.

### Files added

- `content/world-definitions-2027.js`

### Files modified

- `index.html`
- `app.js`
- `journey.css`
- `content/world-definitions-2027.json`
- `scripts/build-www.sh`
- `tests/world-selection.test.js`
- `tests/thirteen-world-expansion.test.js`
- `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md`
- `PROJECT_LOG.md`
- Generated web/native bundle copies under `www/` and `ios/App/App/public/`

### Verification

- World-selection tests confirm all **13 cards** in order and all eight new cards contain **Coming Soon** and **Puzzle Bank in Review** labels.
- Routing tests confirm new worlds take the message path rather than `wgOpenWorld`.
- Runtime registry tests confirm exactly **5 playable + 8 Coming Soon** worlds.
- Complete automated suite: **511 of 511 passed**.
- Web/iOS bundle parity: `index.html`, `app.js`, `journey.css`, and the world-definition adapter are byte-identical.
- Web and native bundle builds: **passed**.
- `git diff --check`: **passed**.

### Architectural decisions, known issues, and next step

- Visibility, world approval, and puzzle-bank approval are separate states. A new world can now appear in the product without creating fake gameplay or polluting saves.
- The eight cards intentionally remain Coming Soon until the owner approves a complete playable bank and required term identities/definitions for each world.
- Next: review and approve a complete puzzle bank world by world. After approval, change only that world's registry status to `playable`, add its governed runtime assets, and reuse the existing game route.

---

## 2026-10-18 — Flexible nine-letter puzzle construction completed

Recorded and applied the owner's updated 2027 construction rules to the research proposal pipeline. No playable puzzle, runtime file, save, reward, approved definition, permanent ID, or study-vocabulary record was changed.

### Completed work

- Added approval-log entry **CAL-0010** for the new proposal rule: every future puzzle uses a legitimate nine-letter financial, business, or technology key term, while real 4–9-letter ordinary dictionary words may support the crossword.
- Recorded that the old universal three-financial-term minimum is superseded. The new level progression is enforced as an educational aim rather than a silent rejection rule.
- Preserved all **27 active puzzles** and all **57 previously generated proposals** unchanged.
- Built a separate schema-v2 research generator that exhaustively considers every previously unused nine-letter anchor across all 13 worlds.
- Generated **90 additional unique proposals**. Every one passes exact repeated-letter counts, 4–9-letter answer limits, crossing-letter agreement, separation, boundaries, contained-word checks, single-grid connectivity, and duplicate-composition checks.
- Verified **115 selected ordinary supporting words** against exact lowercase entries in `/usr/share/dict/web2`. These are isolated from permanent IDs and mastery and remain pending owner/clue-copy review.
- Preserved exact owner-approved definitions whenever a permanent ID exists. Working terms use draft research clues; no permanent ID or approval status was invented.
- Recorded every unused wheel-compatible financial term on its candidate rather than hiding it.
- Produced proposal previews and exact per-world shortfalls. Seven worlds now reach the 15–20 target in projected content: Money Basics 15, Credit 19, Crypto 15, Banking 20, Investing 19, Business 18, and Retirement 20.
- Reported the remaining distinct-anchor shortfalls without repeating anchors or inventing terms: Coins 13 (short 2), AI & Technology 3 (short 12), Real Estate 6 (short 9), Taxes 9 (short 6), Insurance 11 (short 4), and Social Media & Digital Income 6 (short 9).

### Files added

- `docs/FINLIT_QUEST_2027_UPDATED_PUZZLE_CONSTRUCTION.md`
- `scripts/generate-2027-flexible-puzzle-proposals.mjs`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-flexible-puzzle-proposals.json`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-ordinary-support-review.json`
- `tests/updated-puzzle-construction.test.js`

### Files modified

- `docs/CURRICULUM_APPROVAL_LOG.md`
- `PROJECT_LOG.md`

### Verification

- New flexible proposals: **90 PASS / 0 FAIL** under the strict crossword engine.
- New composition duplicates against active, prior, and same-pass records: **0**.
- Generator reproducibility: proposal JSON, ordinary-word review JSON, and Markdown report produced identical SHA-1 values across consecutive runs.
- Focused updated-rule tests: **8 of 8 passed**.
- Active puzzles: **27 unchanged**; prior proposals: **57 unchanged**.

### Architectural decisions, known issues, and next step

- This is an owner-review package, not implementation authorization. The playable game still has its existing five worlds and puzzle banks.
- Dictionary membership proves that an ordinary support answer exists; it does not approve its clue, reward treatment, or suitability. All 115 support words need owner/clue-copy review before any candidate can be implemented.
- Platform/brand anchors retain context-only status. Structural eligibility does not convert a brand into a financial identity.
- The six worlds below 15 need additional legitimate nine-letter anchor vocabulary. Repeating an anchor with a rearranged grid was deliberately rejected as a substitute for new educational value.
- Next: owner reviews the 90 compositions and the ordinary-word list, then approves/rejects term identities and clue copy. Targeted research should address only the six documented shortfalls.

---

## 2026-10-18 — Thirteen-world product expansion defined and researched

Recorded the owner's explicit approval of eight additional FinLit Quest worlds and completed the first four research/data phases without changing the current runtime, navigation, saves, rewards, or 27 active puzzles.

### Completed work

- Added the owner-approved world identities: Coins & Currency, AI & Technology, Real Estate, Taxes, Insurance & Protection, Business & Entrepreneurship, Social Media & Digital Income, and Retirement & Wealth Planning.
- Preserved the original five worlds and recorded all 13 worlds in a versioned machine-readable product registry.
- Recorded the owner decision as approval-log entry **CAL-0009**, scoped to world identity, separation, and intended playable status. Individual terms, definitions, permanent IDs, puzzles, and runtime integration were not silently approved.
- Updated the World Governance Status Matrix with the eight separate worlds and superseded the earlier provisional suggestion that Real Estate might remain inside Investing or Social Media / Digital Income inside Business.
- Organized the existing integrated vocabulary across all 13 worlds without modifying the original vocabulary master.
- Split Social Media & Digital Income mechanically from the source document's Digital business and Platforms sections. Platform names remain study context and are not treated as financial reward terms.
- Preserved every associated term of 10+ letters and every 1–3-letter educational term in a dedicated study package. No term was shortened to fit a crossword.
- Generated **34 validated nine-letter crossword proposals** for the eight new worlds. Every candidate contains 3–5 financial answers of 4–9 letters, respects exact repeated-letter counts, passes the strict crossword engine, and records all unused compatible financial terms.
- Reclassified four prior research candidates to newly approved primary worlds instead of duplicating their compositions: Break Even to Business, Cash Value to Insurance, Apartment to Real Estate, and Community to Retirement.
- Consolidated the earlier five-world queue and the new-world work into **57 unique proposals**. If every proposal were later approved and implemented, the project would contain **84 puzzles**; proposed puzzles are not counted as implemented.
- Reported all remaining shortfalls rather than creating filler. Current new-world proposal counts are: Coins 4, AI 1, Real Estate 2, Taxes 3, Insurance 6, Business 10, Social Media 2, and Retirement 6.

### Files added

- `content/world-definitions-2027.json`
- `docs/FINLIT_QUEST_2027_THIRTEEN_WORLD_EXPANSION.md`
- `scripts/build-2027-thirteen-world-expansion.mjs`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-thirteen-world-vocabulary.json`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-thirteen-world-puzzle-proposals.json`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-thirteen-world-study-vocabulary.json`
- `tests/thirteen-world-expansion.test.js`

### Files modified

- `docs/CURRICULUM_APPROVAL_LOG.md`
- `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md`
- `PROJECT_LOG.md`

### Verification

- New-world candidate layouts: **34 PASS / 0 FAIL**.
- Consolidated proposal compositions: **57 unique / 0 duplicates**.
- Active puzzles: **27 unchanged**.
- Exhaustive compatible-term accounting: passed for all 34 new-world wheels.
- Thirteen-world focused tests: **8 of 8 passed**.
- Full automated suite: **500 of 500 passed**.
- `git diff --check`: **passed**.

### Architectural decisions, known issues, and next step

- World approval and runtime playability are separate states. The eight new worlds are approved product destinations but remain vocabulary-only until each receives an approved permanent term registry and approved puzzle bank.
- The existing five worlds remain the only currently playable worlds. Runtime cards and save namespaces were not added prematurely.
- Current high-quality proposal totals are below the 15-puzzle minimum in every world. The largest blockers are AI & Technology (1 proposal), Real Estate (2), Taxes (3), and Social Media & Digital Income (2).
- Platform and tool names are not financial concepts by themselves. AI and Social Media need more income, cost, ownership, tax, risk, and business-model vocabulary with compatible nine-letter anchors.
- Next: term-level owner review and targeted vocabulary research for the exact per-world shortfalls in the consolidated report. After a world has approved IDs, exact definitions, and at least one approved playable bank, integrate its runtime card, save namespace, web bundle, and iOS bundle together.

---

## 2026-10-18 — Nine-letter crossword proposal construction completed

Generated and validated the next research-only crossword proposal set from the integrated 862-term financial-literacy master. No active puzzle, runtime file, save, reward, gameplay mechanic, approved definition, or permanent term identity was changed.

### Completed work

- Preserved all **27 active puzzles** and carried forward the **3 previously validated proposals** without changing their answer sets or layouts.
- Evaluated nine-letter financial anchors against the complete 4–9-letter vocabulary pool using exact repeated-letter multisets.
- Generated **45 unique strict crossword layouts** across Money Basics, Credit Foundations, Crypto Foundations, Banking Basics, and Investing Basics.
- Validated all 45 layouts for nine wheel letters, 3–5 required answers, 4–9 letters per answer, exact letter counts, valid crossings, word separation, contained-word slots, engine acceptance, and duplicate compositions.
- Recorded every additional wheel-compatible financial term as unused when it was not selected for the validated layout.
- Reused exact owner-approved definitions only for permanent IDs. Working 2027 terms retain research keys and clearly marked draft clues; no permanent IDs or approvals were invented.
- Applied an educational world-fit quality gate after structural validation. A candidate advances only when its anchor is associated with the target world or at least half of its answers have a documented target-world association.
- Advanced **24 new candidates** to the owner-review queue and deferred **21 structurally valid layouts** whose documented world fit was too weak.
- With the 3 preserved proposals, the owner-review queue contains **27 proposals** and would produce **54 total puzzles** if every proposal were approved.
- Reported the exact remaining shortfall to the 15-per-world minimum rather than lowering the quality standard: Money Basics 5, Credit Foundations 4, Crypto Foundations 5, Banking Basics 4, and Investing Basics 3.

### Files added

- `docs/FINLIT_QUEST_2027_NINE_LETTER_PUZZLE_PROPOSALS.md`
- `scripts/generate-2027-nine-letter-proposals.mjs`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-nine-letter-puzzle-proposals.json`
- `tests/nine-letter-puzzle-proposals.test.js`

### Files modified

- `PROJECT_LOG.md`

### Verification

- Generated layouts: **45 PASS / 0 FAIL** under the strict crossword engine.
- Owner-review eligibility: **24 PASS / 21 DEFER** under the documented world-fit gate.
- Exhaustive compatible-term accounting: passed for all 45 generated wheels.
- Duplicate compositions across active, preserved, and generated records: **0**.
- Focused proposal tests: **6 of 6 passed**.
- Full automated suite: **492 of 492 passed**.
- `git diff --check`: **passed**.

### Architectural decisions, known issues, and next step

- Structural validity and educational placement are separate gates. A legal crossword is not automatically a good puzzle for a particular world.
- Cross-world answers remain allowed, but their permanent IDs, definitions, owning worlds, and mastery identities cannot change.
- Research terms can support construction review but remain implementation-ineligible until the owner approves their exact meaning, definition, and ownership.
- The current vocabulary does not support 15 high-quality nine-letter puzzles per world under the documented fit gate. The preferred 20-per-world target is further away.
- Next: owner review of the 27-proposal queue and the 21 deferred layouts. To close the remaining shortfalls, prioritize additional nine-letter anchors whose letter inventory supports at least two other meaningful 4–9-letter financial terms in the same world. Do not implement any proposal until explicitly authorized.

---

## 2026-10-18 — Four missing 2027 vocabulary sources integrated

Integrated the four supplied working-vocabulary documents into the existing 2027 research master without changing any playable puzzle, game mechanic, reward, save, approved definition, permanent identity, or runtime file.

### Completed work

- Preserved all four Markdown sources unchanged under the research staging directory and recorded SHA-256 checksums in the vocabulary master.
- Parsed **1,464 source term mentions** and reconciled them with the existing 159 permanent identities.
- Produced **950 canonical educational records** after exact normalized deduplication while retaining display variants, provenance, and every world/category association.
- Classified **862 financial-literacy terms**: 550 potential 4–9-letter crossword answers, 271 long-form study terms, and 41 short or non-alphabetic study concepts.
- Preserved general AI/technology education records and platform names without incorrectly counting them as financial concepts.
- Kept LEGAL CASH and ROBO FUND as provisional/rejected labels and REPO as an ambiguous term requiring meaning review.
- Preserved all 159 permanent identities, exact approved definitions, and original world ownership. No new permanent IDs or definitions were created.
- Preserved the three validated candidates and all 27 playable puzzles.
- Rechecked the REPAYMENT, DEPOSITOR, and CONFIRMED wheels with exact repeated-letter multisets. Seven additional legitimate matches were found: NET PAY, PEER, RENT, REIT, DEFI, DIME, and FIRE.
- Confirmed none of the seven has a distinct slot in the existing layouts; all are recorded as unused eligible terms and no crossword was altered.
- Expanded the study package from 15 governed long-term records to include 278 source-derived long-term research records. New records remain definitionless and unapproved pending educational review.

### Financial vocabulary totals by current playable world

- Money Basics: **122** unique financial terms; 90 crossword-potential; 26 flashcard/study; 6 short/non-alphabetic.
- Credit Foundations: **136**; 83 crossword-potential; 50 flashcard/study; 3 short/non-alphabetic.
- Crypto Foundations: **85**; 60 crossword-potential; 22 flashcard/study; 3 short/non-alphabetic.
- Banking Basics: **120**; 79 crossword-potential; 36 flashcard/study; 5 short/non-alphabetic.
- Investing Basics, including the currently proposed Real Estate host association: **96**; 60 crossword-potential; 32 flashcard/study; 4 short/non-alphabetic.

### Files added

- `docs/FINLIT_QUEST_2027_VOCABULARY_INTEGRATION_REPORT.md`
- `scripts/integrate-2027-vocabulary.mjs`
- `staging/research/expansion/2026-10-18/source-documents/FinLit_Quest_2027_Remaining_Worlds_Backlog.md`
- `staging/research/expansion/2026-10-18/source-documents/FinLit_Quest_2027_Vocabulary_Master_Backlog.md`
- `staging/research/expansion/2026-10-18/source-documents/FinLit_Quest_AI_and_Coins_World_Vocabulary.md`
- `staging/research/expansion/2026-10-18/source-documents/FinLit_Quest_Money_Basics_2027_and_Coins_Vocabulary.md`

### Files modified

- `staging/research/expansion/2026-10-18/finlit-quest-2027-vocabulary-master.json`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-puzzle-candidates.json`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-flashcard-vocabulary.json`
- `docs/FINLIT_QUEST_2027_WORLD_AND_PUZZLE_EXPANSION_RESEARCH.md`
- `PROJECT_LOG.md`

### Verification

- Source archive parity: **4 of 4 files byte-identical**.
- Normalized canonical-key duplicates: **0**.
- Permanent identity collisions: **0**.
- Missing source documents: **0**.
- Preserved candidates: **3 PASS / 0 changed**.
- Candidate layouts receiving forced new answers: **0**.
- Full automated suite: **486 of 486 passed**.
- `git diff --check`: **passed**.

### Architectural decisions and next step

- Exact term deduplication is global, but world/category associations remain many-to-many so overlap is not lost.
- Research categories do not create playable worlds. Real Estate is recorded both as its own proposed category and under Investing, its currently proposed host.
- Working vocabulary cannot become a crossword answer or receive a permanent identity until the owner approves its wording, meaning, definition, and ownership.
- Next: owner review of the expanded vocabulary by world. Do not generate or implement new puzzles until that review is complete.

---

## 2026-10-18 — 2027 world and nine-letter puzzle expansion baseline completed

Completed the research-only baseline for the owner’s 2027 expansion brief. No playable world, active puzzle, approved definition, reward, save, or runtime file was changed.

### Completed work

- Inventoried the five playable worlds and confirmed the active distribution remains **27 puzzles**: Money Basics 5, Credit 6, Crypto 5, Banking 5, and Investing 6.
- Calculated the expansion gap: **48** additional implemented puzzles are needed to reach 15 per world and **73** to reach 20 per world.
- Preserved **159 owner-approved permanent identities** in a machine-readable master list: 155 implemented/supplemental terms plus the four CAL-0008 Crypto terms that are approved but not implemented.
- Separated the registry into 133 crossword-length terms, 15 long study terms, and 11 short educational terms.
- Preserved 170 world/term mentions from the supplied 2027 brief as a non-approved reconciliation queue and kept 28 platform names as context only.
- Audited the active slate and the pending 27-puzzle proposal against the new rules: exactly nine wheel letters, 4–9 letters per answer, and at least three financial terms. **0 of 27 active puzzles** and **4 of 27 pending proposals** pass all three numeric gates. Active puzzles remain protected, grandfathered content.
- Removed near-duplicate review paths and retained two existing strict candidates: DEPOSITOR and CONFIRMED.
- Generated one new unique strict candidate: REPAYMENT / PAYMENT / EARN / RATE / TERM. The wheel’s additional eligible PEER term is explicitly recorded as unused because five answers is the maximum.
- Re-ran strict solver, crossing, separation, contained-word, exact-multiset, identity, financial-majority, reward-protection, and engine-acceptance checks for all three recommended candidates; all passed and each has three valid layouts.
- Preserved the exact governed definitions for all 15 current 10+ letter terms and added clearly marked proposed study examples, related terms, flashcard prompts, answers, and difficulty labels for owner review.
- Recorded that four specifically named 2027 source documents are unavailable; their contents were not reconstructed or invented.

### Files added

- `docs/FINLIT_QUEST_2027_WORLD_AND_PUZZLE_EXPANSION_RESEARCH.md`
- `scripts/build-2027-expansion-research.mjs`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-vocabulary-master.json`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-puzzle-candidates.json`
- `staging/research/expansion/2026-10-18/finlit-quest-2027-flashcard-vocabulary.json`

### Architectural and governance decisions

- The 2027 rule set is a gate for new research candidates; it does not silently invalidate, migrate, or rewrite the 27 protected active puzzles.
- A governed puzzle candidate must use permanent identities and exact definitions, search the entire approved registry for wheel-compatible terms, and pass strict validation before ranking or owner review.
- Missing source documents and task-brief mentions do not create approvals, definitions, IDs, worlds, or playable content.
- Puzzle targets cannot be reached responsibly from the current approved registry under the new rule set. Vocabulary quality and approval must precede puzzle-count expansion.

### Verification

- Research generator syntax and deterministic regeneration: **passed**.
- Recommended candidates: **3 PASS / 0 FAIL**.
- Full automated suite: **486 of 486 passed**.
- Gameplay/runtime files changed by this milestone: **none**.

### Known issues and next step

- Missing: `FinLit_Quest_2027_Remaining_Worlds_Backlog.md`, `FinLit_Quest_2027_Vocabulary_Master_Backlog.md`, `FinLit_Quest_AI_and_Coins_World_Vocabulary.md`, and `FinLit_Quest_Money_Basics_2027_and_Coins_Vocabulary.md`.
- Credit and Investing currently have no unique composition that passes the full 2027 rule set.
- Crypto expansion still carries the CAL-0006 controlling-record qualification.
- Next: recover the four missing source documents, reconcile them into the master list, approve educational vocabulary before generating more puzzles, and review the three current candidates. Implementation remains unauthorized.

---

## 2026-10-17 — Project phase corrected and game-completion roadmap completed

Recorded the owner’s correction that FinLit Quest remains in active development and curriculum completion. Release preparation is paused; the earlier release-readiness audit remains a technical snapshot rather than the current work plan.

### Completed work

- Inventoried the five playable Word Quest worlds, 27 active puzzles, governed vocabulary, Learning Quest coverage, review systems, scenario/challenge extension points, mini-game proposals, and release-only work.
- Distinguished implemented, disconnected, stored-but-unrendered, proposed, research-only, and owner-decision-dependent features.
- Documented that Credit is the only world with a substantial Learning Quest: 15 workbooks, 128 rendered lesson steps, 75 flashcards, 60 matching pairs, and 120 rendered quiz questions.
- Documented that the other four Learning Quest cards are not complete, Crypto’s rich term lessons are disconnected from the shared Word Quest, Credit scenarios are stored but not rendered, and the current Daily Review button is not a due-term review flow.
- Created a seven-phase roadmap that begins with owner scope decisions, curriculum authority, and a reusable learning loop before world expansion, optional mini-games, or release work.
- Corrected the persistent project instructions and marked the earlier release audit as superseded for phase and priority decisions.

### Files added

- `docs/FINLIT_QUEST_GAME_COMPLETION_ROADMAP.md`

### Files modified

- `CLAUDE.md`
- `APP_DESCRIPTION_AND_CLAUDE_SYSTEM_PROMPT.md`
- `docs/FINLIT_QUEST_V1_RELEASE_READINESS_AUDIT.md`
- `PROJECT_LOG.md`

### Architectural decisions and next step

- Current Phase: **Active Game Development and Curriculum Completion**.
- Release Status: **Not ready**; Apple signing, TestFlight, App Store submission, and related release work are paused.
- Earlier “V1” and “post-V1” labels do not decide current feature scope; unresolved scope choices return to the owner.
- Next: use the roadmap’s owner-decision section to define what “game complete” means before implementing additional systems.

---

## 2026-10-17 — V1 iOS release-readiness audit completed

Audited the frozen five-world, 27-quiz V1 for its first iOS release. No gameplay, curriculum, puzzle, reward, save, PR, deployment, or submission change was authorized or made.

### Completed work

- Verified the new machine has Xcode 27.1 (build 27A9275), iOS 27.1 SDKs, Swift 6.4, and Apple clang 21.
- Resolved the former hardware/toolchain blocker: the current project produced a successful unsigned Release build for the iOS Simulator with Capacitor 8.4.2.
- Ran the complete automated suite: **486 of 486 tests passed**.
- Confirmed the current five-world selection and all **27 active quizzes**: Money Basics 5, Credit 6, Crypto 5, Banking Basics 5, and Investing Basics 6.
- Visually opened all five worlds in the local browser build and confirmed that each routed to its correct multi-word puzzle screen.
- Verified automated coverage for governed definitions, cross-world identities, coin/XP idempotency, save migration and persistence, tutorial hints, strict crossword rules, and bundle parity.
- Confirmed `www/` and the iOS public bundle differ only by Capacitor's expected generated Cordova bridge files.
- Confirmed the live Privacy Policy, Support, and Terms URLs return HTTP 200.
- Reviewed current Apple guidance for toolchains, TestFlight, privacy, required-reason APIs, accessibility labels, metadata, and age rating.

### Files added

- `docs/FINLIT_QUEST_V1_RELEASE_READINESS_AUDIT.md`

### Files modified

- `PROJECT_LOG.md`

### Release decision and known issues

- Audit result: **PARTIAL**. The gameplay baseline is ready for signed real-device testing, but TestFlight and App Store submission are not ready.
- Automatic signing is selected, but no Apple Developer Team, valid signing identity, or provisioning profile is configured on this Mac.
- Command-line simulator installation stalled without a launch result. Native compilation passed, but simulator interaction is not claimed as verified.
- Real-iPhone, internal TestFlight, and manual accessibility testing remain mandatory.
- App Store Connect metadata, screenshots, age rating, privacy answers, accessibility declarations, export compliance, and Notes for Review remain incomplete or unverified.
- The target currently declares iPhone and iPad support; iPad testing/assets are incomplete and require an owner decision.
- Capacitor and Cordova ship privacy manifests. App-owned required-reason API use must still be checked during archive validation.
- `UIRequiredDeviceCapabilities` contains legacy `armv7` and should be reviewed before submission.
- Existing native-release documentation still contains stale old-computer and no-native-project statements; this audit supersedes those statements but did not rewrite the historical documents.

### Architectural decisions

- Keep the existing 27-quiz V1 frozen while release work proceeds.
- Treat automated/browser success as the entry gate for device testing, not as a substitute for real-iPhone or TestFlight evidence.
- Require evidence from every declared device family before making App Store accessibility claims.

### Recommended next step

- Sign in to Xcode with the owner Apple Account, select the Apple Developer Team for `com.finlitquest.app`, connect a real iPhone, and run the complete device test matrix before creating the first TestFlight archive.

---

## 2026-10-17 — Build Your Wealth feasibility audit verified and completed

Verified the existing Build Your Wealth research against the current five-world registry, active 27-puzzle slate, save engine, daily-reward safeguards, governance matrix, backlog, release checklist, and local iOS tool availability. The feature remains post-V1 research only; no playable file, reward, save, PR, or deployment was changed.

### Completed work

- Confirmed the earlier feasibility audit was structurally complete but required a current-data correction and relocation into `docs/`.
- Recomputed the governed vocabulary at **155 terms** and the finite first-discovery supply at **6,622 coins**. The active 27-puzzle first-pass supply remains **1,883 coins**.
- Reconfirmed that the original five-asset model reaches 192 passive coins/day, about **7.3 times** the repeatable 26.4-coin/day login floor, and is unsuitable.
- Corrected the recommended three-asset structure to integer-only payouts of **1 / 3 / 6 coins**, with a hard portfolio cap of **10 coins/day** (about **38%** of the repeatable floor).
- Reconfirmed daily collection over continuous passive accumulation, with idempotent grants, clock evidence, a 48-hour accrual cap, and stale-tab merge-before-write protection.
- Updated the governance discussion to use the confirmed World Governance Status Matrix and Curriculum Approval Log.
- Verified that Xcode 27.1 is now installed. Real-device, TestFlight, accessibility, store-metadata, and final readiness work remain outstanding, so the post-V1 timing recommendation is unchanged.
- Confirmed the post-V1 backlog entry and updated its report path and economy figures.

### Files modified

- `docs/FINLIT_QUEST_BUILD_YOUR_WEALTH_FEASIBILITY.md` (moved from repository root and corrected)
- `FUTURE_FEATURE_BACKLOG.md`
- `PROJECT_LOG.md`

### Architectural decisions and known risks

- Recommended MVP: three virtual assets, one mobile portfolio screen, once-daily collection, one deterministic slow-quarter lesson, no upgrades, no second currency, no real prices, and no backend.
- Save support is additive under `save.engagement.portfolio`; static educational content must not be copied into player saves.
- Multi-tab collection and purchasing require re-read/merge/write handling. Client-only clock and local-storage manipulation remain low-impact offline risks but become unacceptable without a server-authoritative ledger if sync or leaderboards are introduced.
- All asset explanations, simulated returns, events, questions, and disclaimer language remain draft curriculum requiring owner approval.

### Recommended next step

- Keep the feature deferred until after V1. The owner can later choose the asset-portfolio direction, economy variant, gate terms, curriculum language, beta thresholds, and UX proposal before separately authorizing implementation.

---

## 2026-10-17 — New-quiz financial vocabulary and quality standard confirmed

Recorded the owner's permanent quality rules for all quiz expansion work. This is a governance milestone only; it does not approve the pending 27 proposals or authorize implementation.

### Completed work

- Established 3 required words and 3 approved financial terms as hard minimums for every new quiz.
- Recorded 4–5 required words as the preferred difficulty target.
- Made educational value and previously unencountered approved financial vocabulary the selection priority; letter compatibility remains a feasibility constraint, not a content-selection method.
- Required strict crossword validation, duplicate-composition rejection, and a concept-focused comprehension question for every proposal.
- Protected permanent IDs, exact approved definitions, world ownership, mastery identities, and the complete active 27-quiz baseline.
- Explicitly separated quality-standard confirmation, individual proposal approval, and implementation authorization.
- Linked the standard to the candidate pipeline and the pending 27-quiz proposal.

### Files added

- `docs/FINLIT_QUEST_NEW_QUIZ_QUALITY_STANDARD.md`

### Files modified

- `docs/CROSSWORD_CANDIDATE_PIPELINE.md`
- `docs/FINLIT_QUEST_27_QUIZ_EXPANSION_PROPOSAL_2026-10-17.md`
- `staging/research/expansion/2026-10-17/finlit-quest-27-quiz-expansion-proposal.json`
- `tests/expansion-proposal.test.js`
- `PROJECT_LOG.md`

### Verification and current status

- The existing proposal remains pending owner review and implementation remains unauthorized.
- Its 27 candidates meet the hard numeric gates: 27 have at least 3 words, 27 have at least 3 approved financial terms, 27 pass strict validation, and 0 duplicate the active slate or each other.
- The active 27 quizzes and all runtime content remain unchanged.
- Focused quality-standard and candidate-pipeline tests: **14 of 14 passed**.
- Full automated suite: **486 of 486 passed**.
- `git diff --check`: **passed**.

### Recommended next step

- Review the 27 proposed compositions and comprehension questions individually. Record approve, revise, or reject decisions without implementing them.

---

## 2026-10-17 — 27-quiz challenging expansion proposal completed (research only)

Prepared a governed owner-review proposal that would expand the active 27-quiz slate to 54 without modifying or replacing any active puzzle, ID, reward, save, mastery record, or player progress.

### Completed work

- Audited the existing candidate generator, strict crossword solver, active V3 slate, governed five-world vocabulary, CAL-0008 additions, approved supporting-word set, and current governance qualifications before proposing content.
- Generated and curated 27 new compositions in the existing 5 / 6 / 5 / 5 / 6 world distribution.
- Preserved every financial answer's permanent ID, exact governed definition, mastery identity, and owning world, including cross-world terms and anchors.
- Added one proposed three-option comprehension question, correct answer, explanation, and research-source references for every candidate.
- Classified every proposal as Intermediate or Advanced.
- Included 27 crossword previews, exact layouts, alternate-layout counts, governed term records, validation results, source references, and owner decisions required.
- Kept the proposal in documentation and research staging only; no runtime or active content file was changed.

### Quality-gate results

- Proposed quizzes: **27**.
- Strict validation: **27 PASS / 0 FAIL**.
- Duplicate active compositions: **0**.
- Duplicate compositions within the proposal: **0**.
- Five-word puzzles: **14**.
- Four-word puzzles: **11**.
- Three-word exceptions: **2**, both all-financial with no filler.
- Puzzles containing at least three governed financial terms: **27 of 27**.
- Candidates with multiple valid layouts: **27 of 27**.
- Previously unencountered financial terms introduced: **11** — ATM, BID, CONFIRMED, DEBIT, DEPOSIT, EARN, MANDATE, MINER, NODE, ORDER, and PEER.
- Cross-world anchors retaining their original identities: **10**.
- Focused proposal/pipeline/composition tests: **27 of 27 passed**.
- Full automated suite: **486 of 486 passed**.
- `git diff --check`: passed after the milestone files were written.

### Files added

- `docs/FINLIT_QUEST_27_QUIZ_EXPANSION_PROPOSAL_2026-10-17.md`
- `staging/research/expansion/2026-10-17/finlit-quest-27-quiz-expansion-proposal.json`
- `tests/expansion-proposal.test.js`

### Files modified

- `PROJECT_LOG.md`

### Architectural and governance decisions

- Proposal IDs are temporary research identifiers and must not be treated as active puzzle IDs.
- Owner approval of the report does not authorize implementation; export and runtime integration require a separate explicit implementation decision.
- Two three-word proposals are documented exceptions to the 4–5-word preference because both contain three meaningful financial terms and adding filler would reduce quality.
- Ten cross-world anchors use the existing approved cross-world-anchor mechanism and preserve original identities, but their expanded use is explicitly presented for owner confirmation.
- Crypto expansion remains subject to CAL-0006: a dedicated controlling governance record is required before substantial implementation.
- Approved terms that could not form a valid governed composition were not forced into the slate. The proposal identifies ADDRESS, CUSTODY, SCAM, REPORT, BUREAU, FREEZE, HISTORY, WIRE, PHISHING, and LIQUIDITY as current exact-letter/financial-majority compatibility gaps.

### Known issues / owner review items

- The 27 proposals and their comprehension questions are pending owner review.
- The two three-word exceptions require explicit confirmation.
- Expanded use of cross-world anchors requires explicit confirmation.
- The Crypto controlling governance record remains incomplete.

### Recommended next step

- Review the proposal candidates and record approve/revise/reject decisions. Do not export or activate any candidate until the owner separately authorizes implementation after governance review.

---

## 2026-10-17 — Financial-term coin celebration added

Added an immediate, lightweight coin celebration when the player discovers a governed financial term, while preserving the larger reward celebration for full-puzzle completion.

### Completed work

- Added a compact coin flight from the crossword toward the coin balance after a newly rewarded financial term is solved.
- Limited the effect to governed financial answers with a positive first-discovery coin reward. Ordinary supporting words, bonus words, replays, and zero-reward answers do not trigger it.
- Prevented the final answer from showing two simultaneous effects; full puzzle completion continues to use the existing jackpot celebration.
- Kept the term effect visual-only so it cannot interrupt the established word-found audio or change any reward calculation.
- Honored the existing reduced-motion preference and automatically removed the temporary animation layer.
- Rebuilt the web bundle and synchronized the Capacitor iOS bundle.

### Verification

- Full automated suite: **481 of 481 passed**.
- Focused celebration, audio, and definition tests: **48 of 48 passed**.
- Live browser verification: solving the governed Crypto term `TOKEN` increased the displayed balance from **503 to 538**, displayed **“Key term found: TOKEN · +35 coins”**, and animated **3 coins** toward the balance.
- The compact animation layer removed itself after completion.
- `git diff --check`: **passed**.

### Files modified

- `src/victory-celebration.js`
- `word-game-app.js`
- `word-game.css`
- `tests/victory-celebration.test.js`
- Mirrored native files under `ios/App/App/public/`
- Generated web bundle under `www/`
- `index.html` cache-bust references
- `PROJECT_LOG.md`

### Architectural decision

- Reward calculations remain owned by the game engine. Celebration code receives only the already-calculated reward result and has no access to save or economy mutation paths.
- Financial-term discovery uses a small coin-only effect; full-puzzle completion remains the single larger jackpot moment.

### Known issues

- None for this milestone.

### Recommended next step

- Include this interaction in the next approved deployment and confirm it once on a physical iPhone during release testing.

---

## 2026-10-17 — Multi-word puzzle banks promoted to the default runtime

Fixed the reported regression where ordinary launches returned to one-word anchor puzzles.

### Root cause

- The approved V3 3–5-answer banks were still gated behind the undocumented `?puzzles=v3` URL flag.
- A normal website, native app, or local-file launch therefore selected the legacy V2 anchor adapter, which intentionally converts every vocabulary term into a one-answer puzzle.
- The definition restoration did not change puzzle composition; its standard-mode verification exposed this pre-existing routing error.

### Completed work

- Made the approved V3 banks the default for every ordinary launch and all five worlds.
- Removed the V3 preview/not-live ribbon and renamed the runtime marker from preview to live.
- Preserved the legacy anchor adapter only as an explicit migration/debug route at `?puzzles=legacy`; it is no longer reachable through normal game navigation.
- Updated regression tests to require V3 by default and to reject a return to opt-in V3 routing.
- Rebuilt the web bundle and synchronized the Capacitor iOS bundle.

### Verification

- Full automated suite: **478 of 478 passed**.
- Default URL tested without any query flag.
- Live browser inspection confirmed the first displayed puzzle in every world had **3 required answers**: Money Basics, Credit, Crypto, Banking Basics, and Investing Basics.
- All 27 active V3 puzzles remain constrained to 3–5 required answers and pass composition, spelling, crossing, identity, reward, and mastery tests.
- Browser console errors during the five-world sweep: **0**.

### Files modified

- `word-game-app.js`
- `word-game.css`
- `tests/anchor-playable-runtime.test.js`
- `tests/completion-definitions.test.js`
- `tests/schema-v3.test.js`
- `tests/v3-composition-and-acceptance.test.js`
- Mirrored native files under `ios/App/App/public/`
- Generated native bundle under `www/`
- `index.html` cache-bust references
- `PROJECT_LOG.md`

### Architectural decision

- V3 is now the production/default puzzle schema. The anchor-only adapter is retained only for backward-compatibility diagnostics and must never become the implicit fallback again.

### Known issues

- None for this milestone.

### Recommended next step

- Deploy the updated default runtime when the current development batch is approved for release.

---

## 2026-10-17 — Puzzle-completion financial definition review restored

Restored the educational review inside the shared Puzzle Solved modal without changing curriculum, puzzle compositions, mastery, or reward calculations.

### Completed work

- Traced the regression to the rewards-only completion-card implementation: governed definitions still existed in the world vocabularies and remained available through the in-game Definitions panel, but the blocking completion modal did not render them.
- Added a single completion-summary path that accepts permanent term IDs and resolves display copy from the current authoritative world vocabularies. Embedded puzzle definitions are not used as a fallback, preventing stale or fabricated copy from being shown.
- Added the required **Financial Terms You Learned** section. It lists every governed financial answer, preserves cross-world ownership, excludes ordinary/support and bonus answers, and visibly reports an unresolved ID, word mismatch, or missing governed definition.
- Connected legacy Credit anchors to the existing owner-approved Credit identity registry so the standard game also resolves definitions by permanent ID.
- Preserved the existing coins, XP, sound controls, victory behavior, and Next Puzzle action. The completion card remains scrollable and its Next Puzzle action remains sticky on narrow/short screens.
- Synchronized the native Capacitor web bundle after updating the cache-bust stamp.

### Verification

- Focused completion-definition tests: **7 of 7 passed**.
- Full automated suite: **478 of 478 passed**.
- Web/native bundle parity passed after `build-www` and Capacitor iOS synchronization.
- Browser verification, standard game: completed `COST`; the modal displayed the exact governed Money Basics definition, unchanged rewards, and a working Next Puzzle button.
- Browser verification, V3 multi-term preview: completed `PAYMENT / PAY / NET`; all three exact governed definitions appeared and no ordinary or bonus entry appeared.
- Responsive verification at **320 × 568**: rewards stayed visible, the definition list remained scrollable, and Next Puzzle stayed visible and usable.
- Browser console errors: **0**.
- Unresolved active curriculum references: **0** across all 27 V3 puzzles and the standard-mode puzzle checked in-browser.

### Files modified

- `src/puzzle-bank-engine.js`
- `word-game-app.js`
- `index.html`
- `word-game.css`
- `tests/completion-definitions.test.js`
- `tests/mobile-header-layout.test.js`
- `ios/App/App/public/src/puzzle-bank-engine.js`
- `ios/App/App/public/word-game-app.js`
- `ios/App/App/public/index.html`
- `ios/App/App/public/word-game.css`
- Generated native bundle under `www/`
- `PROJECT_LOG.md`

### Architectural decisions

- Completion review content is resolved at render time from an ID-indexed authoritative registry; player saves and puzzle history continue to store references and results, not curriculum copy.
- Broken curriculum references fail visibly in the review and console rather than falling back to an embedded definition.
- The same completion resolver serves standard anchor puzzles and V3 multi-term puzzles.

### Known issues

- None for this milestone.

### Recommended next step

- Include this completion review in the next release build and repeat one physical-device accessibility pass before production deployment.

---

## 2026-10-17 — Eighteen-concept vocabulary decision recorded (CAL-0008)

The owner approved all 12 recommended terms and the 6 deferrals ("everything approved"). The decision, the 12 permanent IDs and the exact register definitions are recorded in `docs/CURRICULUM_APPROVAL_LOG.md` as CAL-0008.

### Completed work

- Appended CAL-0008 and its index row to the Curriculum Approval Log, owner words verbatim.
- Assigned 12 permanent IDs in the existing `world.word` pattern, after confirming none collide with the 273 existing IDs.
- Recorded the 6 deferrals with no IDs.

### Files modified

- `docs/CURRICULUM_APPROVAL_LOG.md`
- `PROJECT_LOG.md`

### Not changed

- No content, runtime, identity-registry, puzzle, test or evidence-register file. The IDs exist only in the log until implementation is authorized.

### Known issues

- LIQUIDITY is related to the approved `banking.liquid`; carried forward, not resolved.
- CAL-0006 asks for a Crypto governance record before substantial expansion; four Crypto terms were approved and the owner did not state whether that is substantial.
- SEED has no source evidence (deferred).

### Recommended next step

- Owner decision on whether the Crypto governance record comes first, then authorize implementation of the 12 terms as a separate step.

---

## 2026-10-17 — Eighteen-concept evidence register and owner-review packet completed

Completed term-specific official-source research and educational/main-game screening for all 18 concepts surviving the four-world consolidation. Produced a machine-readable evidence register and a concise owner-review packet. No term was approved, assigned a permanent ID, or added to gameplay.

### Completed work

- Reconciled every concept against existing permanent identities, reserves, approved support, bonus vocabulary, and Secondary Education exclusions.
- Added term-specific evidence from CFPB, FTC, FDIC, Federal Reserve, CFTC, NIST, and SEC/Investor.gov sources.
- Recommended 11 concepts to advance to owner review as written.
- Recommended changing CONFIRM to the official NIST term CONFIRMED before owner review.
- Recommended deferring BACKUP, SEED, SIGN, OFFLINE, KEY, and FRACTION to lessons or Secondary Education because their standalone words are generic, ambiguous, or less precise than the supported concepts.
- Drafted exact unapproved definitions and recorded word-length/main-game eligibility for every concept.
- Prepared one batch decision the owner can confirm to avoid repeated term-by-term audits.

### Files added

- `staging/research/consolidated/2026-10-17/term-evidence-register.json`
- `docs/FINLIT_QUEST_18_CONCEPT_EVIDENCE_AND_OWNER_REVIEW_PACKET_2026-10-17.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- Official evidence must support the precise playable word, not merely a related multi-word concept.
- Useful concepts whose playable words are imprecise remain available for lessons without becoming permanent puzzle identities.
- Owner approval must confirm exact wording, owning world, acronym exceptions, and cross-world qualifications before stable IDs are assigned.

### Known issues

- Owner approval remains pending for the recommended 12-word batch.
- ATM requires an explicit acronym decision.
- SCAM requires an explicit owning-world decision.
- CONFIRMED is a recommended correction and is not yet an approved replacement for CONFIRM.

### Recommended next steps

1. Obtain one explicit owner confirmation of the proposed batch decision.
2. After confirmation, assign stable IDs and update the Approval Log and governance matrix.
3. Run governance and collision tests.
4. Keep puzzle generation and runtime implementation blocked until separately authorized.

---

## 2026-10-17 — Four-world research validation cycle consolidated

Completed a cross-world consolidation of the independently validated Credit Foundations, Crypto Foundations, Banking Basics, and Investing Basics research packages. The report distinguishes valid layouts, unique compositions, and new educational value and creates a prioritized, non-approving review queue.

### Completed work

- Reconciled all four local validation reports and their governed registries.
- Confirmed 111 supplied governed identities with zero recorded identity or definition mismatches.
- Confirmed the research cycle produced zero newly validated unique puzzle compositions.
- Closed exact duplicate compositions across Credit, Banking, Investing, and the locally benchmarked Crypto results.
- Consolidated seven alternate-revision candidates without approving them.
- Identified 18 genuinely new or unresolved financial research concepts after removing registry collisions, reserves, approved support, bonus words, and Secondary Education exclusions.
- Established DEPOSITOR / POSTED / DEPOSIT as the first alternate for potential owner review because it replaces ordinary POST with governed DEPOSIT in a distinct valid slot.
- Defined the next work as research correction, term-level sourcing, educational concept review, and only then puzzle generation for approved concepts.

### Files added

- `docs/FINLIT_QUEST_CROSS_WORLD_RESEARCH_CONSOLIDATION_2026-10-17.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- Structural validity, composition uniqueness, and educational value are separate gates.
- Layout variants of an existing composition are not new puzzles.
- Research correction precedes owner review; owner review precedes permanent identity assignment and puzzle generation.
- Broad source manifests cannot substitute for term-specific provenance.

### Known issues

- The 18-concept queue remains unreviewed and several concepts still lack precise official evidence.
- Seven alternate revisions remain optional and may be rejected if they do not improve educational value.
- Owner-review duration remains unmeasured.

### Recommended next steps

1. Correct the four research packages in new revisions while preserving the original packages unchanged.
2. Build term-specific evidence records for the 18 surviving concepts.
3. Review DEPOSITOR first among the seven alternate compositions.
4. Do not implement or export any new content without explicit owner approval.

---

## 2026-10-17 — Investing Basics research package staged and independently validated

Accepted the external Investing Basics research package into isolated research staging, preserved its five source files unchanged, and checked its governed identities, reserve and secondary-education classifications, sources, vocabulary proposals, strict layouts, and puzzle collisions against authoritative project records. No content was approved or activated.

### Completed work

- Confirmed exact agreement for all 26 governed Investing identities, including supplemental WORTH.
- Confirmed all 21 owner-approved V3 ordinary support words.
- Reclassified PORTFOLIO and DIVERSIFY as existing inactive reserves, ETF as an existing Secondary Education term, and EXPENSE as the cross-world identity `moneybasics.expense`.
- Identified TAKE as already approved support rather than a new ordinary-word candidate.
- Kept VOLATILE and REBALANCE inactive because the controlling record excludes their related advanced concepts.
- Identified LIQUIDITY and FRACTION as genuinely new unreviewed proposals requiring term-specific evidence and educational review.
- Verified the Investment Products and FINRA sources, and identified replacement URLs for the stale Investor.gov overview and fee pages.
- Ran MARKET / TERM / RATE through the strict validator; it passed all gates and produced three layouts.
- Closed MARKET / TERM / RATE as an exact duplicate of the reviewed V3 Investing composition.
- Benchmarked all 26 Investing anchors: 12 layouts generated, 12 passed, 100% validation pass rate, and 6,029.2 candidates per minute in the local run.

### Files added

- `staging/research/investing-basics/2026-10-17/source-package/source-manifest.json`
- `staging/research/investing-basics/2026-10-17/source-package/financial-keyword-inventory.json`
- `staging/research/investing-basics/2026-10-17/source-package/ordinary-word-review-list.json`
- `staging/research/investing-basics/2026-10-17/source-package/suggested-puzzle-records.json`
- `staging/research/investing-basics/2026-10-17/source-package/investing-basics-research-report.md`
- `staging/research/investing-basics/2026-10-17/VALIDATION_REPORT.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- Existing inactive reserves retain their stable identities and definitions; research packages cannot recreate them under temporary identities.
- Secondary Education exclusions remain binding during puzzle research.
- A strict-valid composition that already exists in V3 is collision evidence, not a new approval candidate.
- Broad source manifests do not replace term-specific provenance for new vocabulary.

### Known issues

- Two proposed Investor.gov URLs are stale and require replacement.
- The package incorrectly presents TAKE as unreviewed and understates the governed status of several proposed financial terms.
- The sole puzzle proposal is an exact V3 duplicate, so the package contributes no new approval-ready composition.
- Owner review time remains unmeasured.

### Recommended next steps

1. Correct the Investing package classifications and source URLs in a new research revision.
2. Add term-level evidence for LIQUIDITY and resolve whether FRACTION is educationally precise enough.
3. Close the MARKET proposal as a duplicate.
4. Keep implementation blocked until explicit owner approval and a separately reviewed integration change.

---

## 2026-10-17 — Banking Basics research package staged and independently validated

Accepted the external Banking Basics research package into isolated research staging, preserved its five source files unchanged, and checked its governed identities, reserve classifications, sources, vocabulary proposals, strict layouts, and puzzle collisions against the authoritative project records. No content was approved or activated.

### Completed work

- Confirmed exact agreement for all 27 Banking identities, including supplemental ACH.
- Confirmed all 15 controlled Banking reserve words and all 21 owner-approved V3 ordinary support words.
- Verified the CFPB bank-accounts source, confirmed the two FDIC pages are current but block the automated fetch, and identified the FTC topic page's canonical redirect.
- Reclassified OVERDRAFT, TRANSFER, CHECKING, SAVINGS, and STATEMENT as existing controlled reserve content rather than genuinely new terms.
- Confirmed BALANCE belongs to Credit, DIRECT is already approved as ordinary support, and ATM, WIRE, and PHISHING are the genuinely new unreviewed candidates.
- Ran all five proposed word sets through the strict crossword validation suite; all passed and produced two or three valid layouts.
- Closed CONVERT / VOTE / NET as an exact duplicate of the reviewed V3 composition.
- Classified DEPOSITOR, NETWORK, PASSKEY, and PASSWORD as alternate revisions of existing anchors.
- Verified the DEPOSIT substring in DEPOSITOR occupies its own legal crossword slot.

### Files added

- `staging/research/banking-basics/2026-10-17/source-package/source-manifest.json`
- `staging/research/banking-basics/2026-10-17/source-package/financial-keyword-inventory.json`
- `staging/research/banking-basics/2026-10-17/source-package/ordinary-word-review-list.json`
- `staging/research/banking-basics/2026-10-17/source-package/suggested-puzzle-records.json`
- `staging/research/banking-basics/2026-10-17/source-package/banking-basics-research-report.md`
- `staging/research/banking-basics/2026-10-17/VALIDATION_REPORT.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- Reserve terms are existing controlled content even when they do not yet have active permanent IDs; research cannot reactivate or replace them.
- Approved ordinary support cannot silently become a financial learning identity.
- Passing layouts with existing anchors remain replacement alternatives until the owner explicitly chooses a new revision.

### Known issues

- New-term records lack term-specific citations.
- Direct automated retrieval of the two FDIC pages is blocked even though search confirms the pages are current.
- No proposed Banking puzzle introduces a new anchor.
- Owner review time remains unmeasured.

### Recommended next steps

1. Correct the Banking research classifications and add term-level evidence in a new package revision.
2. Review DEPOSITOR / POSTED / DEPOSIT first as the most educationally coherent alternate.
3. Decide whether any alternate should replace its existing V3 composition.
4. Proceed to Investing Basics research after Banking corrections are recorded.

---

## 2026-10-17 — Crypto Foundations research package staged and independently validated

Accepted the external Crypto Foundations research package into isolated research staging, preserved its five source files unchanged, and checked its registry data, sources, vocabulary classifications, feasibility conclusion, and collision exposure against the authoritative project records and local candidate pipeline. No content was approved or activated.

### Completed work

- Confirmed exact agreement for all 20 governed Crypto identities, words, definitions, and ownership records.
- Confirmed exact agreement for all 21 owner-approved V3 ordinary supporting words.
- Confirmed all ten new-term collision checks, including FEE's existing identity as `moneybasics.fee`.
- Identified the proposed SEC Crypto Assets URL as a 404 and located the current Investor.gov Crypto Assets hub.
- Verified the FTC source and its canonical redirect target.
- Determined that the proposed CFPB Crypto Assets URL is not a confirmed current source and identified current official CFPB alternatives.
- Corrected the package's puzzle-feasibility interpretation: all-financial sets are not required, and approved ordinary support plus cross-world governed terms can form valid puzzles.
- Benchmarked all 20 Crypto-owned anchors with the 147-term registry and 21 approved ordinary words. The solver returned eight strict-valid layouts at a 100% pass rate.
- Confirmed all eight layouts belong to four existing reviewed V3 compositions, so the package contributes no new nonduplicate puzzle candidate.
- Recorded that the fifth Crypto V3 composition uses the cross-world INCOME anchor and that the local static Crypto bank contains 40 records.

### Files added

- `staging/research/crypto-foundations/2026-10-17/source-package/source-manifest.json`
- `staging/research/crypto-foundations/2026-10-17/source-package/financial-keyword-inventory.json`
- `staging/research/crypto-foundations/2026-10-17/source-package/ordinary-word-review-list.json`
- `staging/research/crypto-foundations/2026-10-17/source-package/suggested-puzzle-records.json`
- `staging/research/crypto-foundations/2026-10-17/source-package/crypto-foundations-research-report.md`
- `staging/research/crypto-foundations/2026-10-17/VALIDATION_REPORT.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- Feasibility screening must use the actual FinLit Quest financial-majority rule, cross-world governed terms, approved ordinary support, and strict solver—not an all-financial-only shortcut.
- Benchmarked layouts that reproduce an approved composition are collision evidence, not new candidates.
- Research sources must resolve to current canonical pages before term-level evidence is accepted.

### Known issues

- The package contains no proposed puzzle records.
- Two proposed source URLs need replacement and the FTC URL should be canonicalized.
- Five new technical terms still lack adequate term-level provenance.
- Owner review time remains unmeasured.

### Recommended next steps

1. Issue a corrected Crypto research-package revision with current source URLs and term-level citations.
2. Review the new financial terms before using them to expand candidate generation.
3. Keep the existing five V3 Crypto compositions as the baseline and reject exact duplicates.
4. Proceed to Banking Basics research after recording the Crypto corrections.

---

## 2026-10-17 — Credit Foundations research package staged and independently validated

Accepted the external Credit Foundations research package into isolated research staging, preserved its five source files unchanged, and checked its registry data, source evidence, vocabulary classifications, collisions, and four proposed compositions against the authoritative project records and strict crossword pipeline. No content was approved or activated.

### Completed work

- Confirmed exact agreement for all 38 governed Credit identities, words, definitions, and ownership records.
- Confirmed exact agreement for all 21 owner-approved V3 ordinary supporting words.
- Verified the FTC source and established that both CFPB pages marked unverified in the package are active and accessible.
- Identified a direct CFPB key-terms source for the FREEZE concept.
- Confirmed DISPUTE and ALERT already belong to Banking and cannot receive new Credit identities.
- Identified RATE as the governed cross-world term `moneybasics.rate`, not an ordinary word, and DUE as the global zero-reward bonus word, not an ordinary support candidate.
- Ran all four proposed word sets through the strict solver and mandatory validation gates; all passed and produced two to four valid layouts.
- Closed REPAYMENT / TERM / APR / APY as an exact duplicate of both static puzzle `CREDIT-P0024` and the reviewed V3 composition.
- Classified AUTOPAY, CAPACITY, and CREDITOR as alternate revisions because each anchor already has active compositions.

### Files added

- `staging/research/credit-foundations/2026-10-17/source-package/source-manifest.json`
- `staging/research/credit-foundations/2026-10-17/source-package/financial-keyword-inventory.json`
- `staging/research/credit-foundations/2026-10-17/source-package/ordinary-word-review-list.json`
- `staging/research/credit-foundations/2026-10-17/source-package/suggested-puzzle-records.json`
- `staging/research/credit-foundations/2026-10-17/source-package/credit-foundations-research-report.md`
- `staging/research/credit-foundations/2026-10-17/VALIDATION_REPORT.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- Research-package corrections are recorded in a separate validation report; supplied evidence remains immutable.
- A valid layout does not bypass same-anchor or exact-composition collision review.
- Existing cross-world identities take precedence over temporary research keys or proposed ordinary classifications.

### Known issues

- The package source manifest understates verification because both CFPB pages are currently accessible.
- No proposed Credit puzzle introduces a new anchor; three are alternatives and one is a duplicate.
- Owner review time remains unmeasured.

### Recommended next steps

1. Issue a corrected Credit research-package revision with accurate CFPB source statuses.
2. Resolve DISPUTE, ALERT, RATE, and DUE classifications before any vocabulary review.
3. Decide whether any of the three alternate compositions is educationally stronger than its existing V3 composition.
4. Proceed to Crypto research only after the Credit package correction is recorded.

---

## 2026-10-17 — Money Basics research package staged and independently validated

Accepted the external Money Basics research package into isolated research staging, preserved its five source files unchanged, and checked its governed data, source manifest, puzzle collisions, and four proposed compositions against the local authoritative registry and strict crossword pipeline. No content was approved or activated.

### Completed work

- Confirmed exact agreement for all 36 governed Money Basics IDs, words, definitions, and ownership records.
- Confirmed exact agreement for all 21 owner-approved V3 ordinary supporting words.
- Confirmed the six new financial suggestions use temporary research keys and the five new ordinary suggestions remain unreviewed.
- Verified three proposed institutional source pages as legitimate/relevant, with one automated-access limitation on FDIC Money Smart.
- Identified the proposed CFPB budgeting URL as a current 404 that must be replaced.
- Ran all four proposed word sets through the strict crossword engine and mandatory validation gates; every set produced at least two valid layouts and passed identity, letter, majority, boundary, reward, and engine checks.
- Screened existing banks: DEBIT / DEBT / BID is the only proposal without an existing V3 same-anchor composition; SAVING / GAIN / GAS exactly duplicates the reviewed Investing V3 composition.
- Recorded owner-review dispositions and previews in a separate validation report without changing the supplied research records.

### Files added

- `staging/research/money-basics/2026-10-17/source-package/source-manifest.json`
- `staging/research/money-basics/2026-10-17/source-package/financial-keyword-inventory.json`
- `staging/research/money-basics/2026-10-17/source-package/ordinary-word-review-list.json`
- `staging/research/money-basics/2026-10-17/source-package/suggested-puzzle-records.json`
- `staging/research/money-basics/2026-10-17/source-package/money-basics-research-report.md`
- `staging/research/money-basics/2026-10-17/VALIDATION_REPORT.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- External research packages remain immutable evidence under `staging/research/`; validation and corrections are recorded beside them, never written into the source package.
- Solver success establishes technical eligibility only. Existing-anchor collisions, duplicate compositions, educational provenance, and owner approval remain separate gates.
- Cross-world financial terms preserve their original permanent identity, definition, ownership, and mastery record.

### Known issues

- The six new financial candidates have no term-specific source IDs or citations and cannot advance to governed-definition review yet.
- The CFPB budgeting URL in the source manifest returns 404.
- FDIC Money Smart is current but rejected the automated page fetch used during this audit.
- Owner review time remains unmeasured.

### Recommended next steps

1. Replace the broken CFPB URL and attach term-specific provenance for the six new financial candidates.
2. Review DEBIT / DEBT / BID first as the strongest nonduplicate V3 candidate.
3. Decide whether PAYMENT and RECEIPT should remain alternatives or replace their existing V3 compositions.
4. Close SAVING / GAIN / GAS as a duplicate unless the owner intentionally authorizes the same puzzle in two worlds.

---

## 2026-10-17 — Research authority upload package created

Created a single upload package for the FinLit Quest research chat so it can begin the world-by-world keyword project without reconstructing IDs, definitions, ownership or approval status.

### Completed work

- Packaged the Confirmed World Governance Status Matrix, Curriculum Approval Log and crossword candidate pipeline instructions.
- Generated a read-only research registry containing all 147 governed financial terms: Credit 38, Money Basics 36, Banking 27 including ACH, Investing 26 including WORTH, and Crypto 20.
- Generated the 21 owner-approved ordinary supporting words from the approved V3 compositions, marked only for ordinary support with no financial identity or mastery.
- Included all five world vocabulary files, current static and dynamic puzzle banks, reserve records, the V3 supplement and the reviewed V3 slate.
- Added a package README and SHA-256 manifest for every included file.

### Artifact created

- `exports/FinLit_Quest_Research_Authority_Package_2026-10-17.zip`

### Validation

- ZIP integrity check: PASS, no compressed-data errors.
- Registry reconciliation: 147 terms with exact world totals.
- Ordinary-word export: 21 words, all derived mechanically from the owner-approved V3 slate.
- No curriculum source, definition, stable ID, puzzle bank or runtime file was changed.

### Recommended next step

- Upload the ZIP to the FinLit research chat and instruct it to begin with Money Basics. Research results remain unreviewed candidates until processed by the local crossword candidate pipeline and approved by the owner.

---

## 2026-10-17 — Governed crossword candidate collection and generation pipeline added

Built the first owner-reviewable crossword candidate pipeline after the governance matrix and Curriculum Approval Log were confirmed. The pipeline is isolated from approved curriculum and live puzzle banks: it writes only to an explicitly chosen staging/review path and refuses protected repository destinations.

### Completed work

- Added local-file and HTTPS source collection with provenance, frequency counts, HTML cleanup, timeouts and a 2 MB source limit.
- Marked every newly collected keyword `unreviewed`; scraped words never become game vocabulary automatically.
- Loaded all 147 governed financial identities (145 original terms plus ACH and WORTH) and preserved each reused term's original ID, definition, owning world and mastery ID.
- Added multi-layout generation by trying deterministic word orders through the strict solver and deduplicating valid layouts.
- Added mandatory validation for crossing letters, word separation, exact letter multisets, authoritative financial identities, approved ordinary words, financial-majority thresholds, distinct contained-word slots, reward protections and strict engine acceptance.
- Added structured failure records with the rule, affected words, coordinates where available and an explanation.
- Added post-validation ranking for financial strength, educational relevance, connectivity, ordinary-word familiarity, difficulty fit, cross-world repetition and alternative-layout availability. Invalid candidates receive no score.
- Added Markdown owner-review reports with the world, anchor, financial terms, ordinary words, ASCII crossword preview, validation results, ranking explanation and approval status.
- Added a command-line workflow for collection, generation, benchmarking and owner-approved export. Export reruns validation against the authoritative registry and never edits the live V3 slate.
- Added a measurable benchmark format including candidate throughput, validation pass percentage, manual-review count and an explicit `null` for owner approval time until review timestamps exist.

### Files added

- `src/candidate-source-collector.js`
- `src/crossword-candidate-pipeline.js`
- `scripts/crossword-candidate-cli.mjs`
- `tests/crossword-candidate-pipeline.test.js`
- `docs/CROSSWORD_CANDIDATE_PIPELINE.md`

### Files modified

- `package.json`
- `PROJECT_LOG.md`

### Architectural decisions

- Internet or document collection produces candidate evidence, never approved content.
- Approved cross-world financial terms may be reused automatically only through their permanent identities.
- New ordinary supporting words require explicit `approved-support` status before they can pass validation.
- Validation is a hard gate before ranking; invalid puzzles can never receive an approval-eligible score.
- Candidate generation, review and export remain separate from live-game integration.

### Validation

- New focused tests: **9 passed, 0 failed**.
- Full suite: **475 passed, 0 failed** in America/Los_Angeles, UTC, Asia/Tokyo and Pacific/Auckland.
- End-to-end staging exercise: one local source produced 14 unreviewed keywords; REPAYMENT produced five owner-review files with three distinct strict layouts; all five returned candidates passed validation.
- Credit benchmark sample: 23 eligible anchors attempted, 8 candidates returned from the intentionally small one-candidate/250-combination run, 8 passed, approximately 812 candidates/minute on this computer. Owner approval time remains unmeasured until actual reviews are timestamped.

### Known issues

- The collector does not perform web search. HTTPS sources must be explicitly supplied in an owner-authorized source manifest.
- Newly scraped ordinary words cannot generate approval-eligible puzzles until the owner reviews and marks them `approved-support`.
- The pipeline is not wired into production gameplay; integration requires a separately approved content change.

### Recommended next steps

1. Create an owner-authorized source manifest for one world.
2. Collect and review an initial ordinary-word candidate list.
3. Generate a full review batch and measure real owner review time.
4. Approve and export selected candidates, then integrate them through a separate reviewed change.

---

## 2026-10-17 — Owner governance decisions D1–D10 recorded; matrix Confirmed; Curriculum Approval Log created

The owner confirmed the World Governance Status Matrix with decisions D1–D10. The decisions are recorded verbatim, with scope, source files, qualifications and superseded records, in the new `docs/CURRICULUM_APPROVAL_LOG.md` (entries CAL-0001 to CAL-0007). The confirmed matrix and the Approval Log are now the authoritative governance records. Future sessions must not repeat the governance audit unless a defined audit trigger occurs.

### Completed work

- **D1** Credit Foundations 15-workbook curriculum (CRF-001–015): **Approved with Qualification** for V1 implementation. Qualification: it has not completed the separate Approved & Locked curriculum-import pipeline, and its educational content must not be rewritten. (CAL-0001)
- **D2** Credit 38-term identity registry: **Owner Approved**, effective 2026-10-14, scoped to permanent term IDs only. (CAL-0002)
- **D3** Money Basics: **Owner Approved** (main game); approver is the FinLit Quest owner; the 2026-07-23 puzzle-bank v2 decision is current and supersedes the original bank structure, vocabulary unchanged. (CAL-0003)
- **D4** Banking Basics v1.1: **Approved with Qualification**; the documented retroactive governance normalization is the current controlling record; the qualification that most definitions were reconstructed and are not verbatim historical approvals is preserved. (CAL-0004)
- **D5** Investing Basics v1.1: **Owner Approved** (main game); approver is the FinLit Quest owner. (CAL-0005)
- **D6** Crypto Foundations: **Approved with Qualification** for V1 gameplay (20 learning objects and the current implementation); a dedicated controlling governance record is needed before Approved & Locked or substantial expansion. (CAL-0006)
- **D7** ACH, WORTH and the V3 crossword compositions: recorded as separate **Owner Approved** development decisions; they do not amend the frozen Banking or Investing v1.1 records; V3 stays opt-in until separately authorized for production. (CAL-0007)
- **D8** Created `docs/CURRICULUM_APPROVAL_LOG.md`. Only the owner may make approval decisions; Codex records them verbatim and never invents or infers an approval.
- **D9** Corrected `CLAUDE.md` and `APP_DESCRIPTION_AND_CLAUDE_SYSTEM_PROMPT.md` to describe the five-world V1 application (Money Basics, Credit, Crypto, Banking Basics, Investing Basics) and removed the stale "only playable world is Crypto" statements. No curriculum content was changed. `CLAUDE.md` also now lists the Approval Log and the matrix among the records to read first.
- **D10** Added the single historical backfill entry below.
- Matrix status changed from Draft to Confirmed. The draft's evidence, qualifications and original decision options were preserved.

### Files modified

- `docs/CURRICULUM_APPROVAL_LOG.md` (new)
- `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md`
- `CLAUDE.md`
- `APP_DESCRIPTION_AND_CLAUDE_SYSTEM_PROMPT.md`
- `PROJECT_LOG.md`

### Tests performed

- Governance, content and pipeline tests: 61 of 61 pass.
- Full suite: 466 of 466 pass in America/Los_Angeles, UTC, Asia/Tokyo and Pacific/Auckland. `git diff --check` is clean.
- No curriculum data, definition, stable ID or runtime file was modified.

### Approval decisions

- All of the above, recorded in `docs/CURRICULUM_APPROVAL_LOG.md`. No other approval was inferred or created.

### Known issues

- Credit is not Approved & Locked (qualification in CAL-0001).
- Crypto still needs a dedicated controlling governance record (CAL-0006).
- Native build and real-device verification remain blocked per `docs/V1_RELEASE_CHECKLIST.md`.

### Recommended next step

- Resume V1 release work. Revisit governance only on a defined audit trigger.

---

## 2026-10-17 — World Governance Status Matrix drafted (pending owner confirmation)

Created `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md` from the actual repository records so future sessions can rely on one record instead of repeating the curriculum audit. The matrix is a **draft**: no row is a recorded decision until the owner confirms it.

### Completed work

- Recorded, per world (Credit Foundations, Money Basics, Banking Basics, Investing Basics, Crypto Foundations): scope, controlling source file, source version, approval status in the allowed vocabulary, approval date as recorded, stable term count, curriculum/workbook status, vocabulary status, puzzle-bank status, known qualifications, owner decision and last verified date.
- Credit: separated the 15 existing workbooks (present, generated runtime, working in the app; `CORRECTION_2026-07-21.md` still supersedes the "0 of 15" reports) from the remaining approval-label inconsistency (draft-labelled source inside an `approved/` directory; no Approval Log, Controlled Values workbook or Approved & Locked workbook set; `PROJECT_LOG.md` already records the content was deliberately not upgraded to "approved & locked").
- Credit validators: recorded that two different gates exist. The runtime JSON passes the workbook validator used by `parse-credit-foundations.mjs`; it is not an export of the Approved & Locked curriculum pipeline, which `validateCurriculum` therefore rejects. This corrects an earlier 2026-10-17 research summary that reported only the second result.
- Money Basics: recorded the approval document (2026-07-22, main game only), the follow-on 2026-07-23 governance decision, and that runtime bank v2 is the current bank.
- Banking Basics: recorded the "retroactive governance normalization" qualification verbatim, without changing the record; its checksum was re-verified against the pinned value.
- Investing Basics: recorded the v1.1 FINAL APPROVED status and its main-game-only scope.
- Crypto: no approval, review or owner-decision record exists; left unmapped and listed as a decision.
- Listed ten open items (D1–D10) for the owner.

### Files modified

- `docs/WORLD_GOVERNANCE_STATUS_MATRIX.md` (new)
- `PROJECT_LOG.md`

### Tests performed

- Governance, content and pipeline tests: 57 of 57 pass.
- Full suite: 466 of 466 pass.
- Term counts verified against the data files; Banking controlling record SHA-256 matches the pinned value (18,198 bytes).

### Approval decisions

- **None.** No Curriculum Approval Log exists in the repository, and none was created or reconstructed. Owner confirmation of D1–D10 is required before anything is recorded there.

### Known issues

- The Curriculum Approval Log is absent.
- `CLAUDE.md` and `APP_DESCRIPTION_AND_CLAUDE_SYSTEM_PROMPT.md` still say Crypto is the only playable world, which conflicts with the V1 checklist's five-world scope (a defined audit trigger; decision D9).
- This log has no entries for the October 2026 V3 puzzle, audio and bonus-word work (decision D10).

### Recommended next step

- Owner confirms or corrects the matrix (D1–D10). Then record the confirmed decisions in the Curriculum Approval Log and in this log, and mark the matrix confirmed. Do not repeat the governance audit unless a defined trigger occurs.

---

## 2026-10 (historical backfill, entry written 2026-10-17) — Daily rewards, V3 puzzles, celebration, audio and related work

One concise backfill of October 2026 work, written only from existing repository reports, tests and files (owner decision D10). Dates are quoted **as stated in those documents**. The reports are not in strict chronological order (the Phase 1–2 reward reports state 2026-10-17, while the V3 Phase 3–5 reports state 2026-10-16), so they are cited as written and not reconciled. No undocumented approval decision or date has been reconstructed. Approvals that are documented are referenced from `docs/CURRICULUM_APPROVAL_LOG.md`.

### Work documented

- **Rewards and streaks:** local-day streak and achievement-XP repair (`FINLIT_QUEST_PHASE1_REWARD_STREAK_REPAIR_REPORT.md`); owner-approved daily login schedule 10/15/20/25/30/35/50 with clock safeguards (`FINLIT_QUEST_PHASE2_DAILY_REWARDS_REPORT.md`, `FINLIT_QUEST_DAILY_REWARDS_RELEASE_READINESS.md`); engagement plan (`FINLIT_QUEST_ENGAGEMENT_EXPANSION_PLAN.md`).
- **V3 crosswords (opt-in preview, `?puzzles=v3`):** acceptance repair and composition rules (`FINLIT_QUEST_V3_CROSSWORD_ACCEPTANCE_REPAIR_REPORT.md`); cross-world use of approved terms (`FINLIT_QUEST_V3_CROSS_WORLD_COMPOSITION_REPORT.md`); Phases 3–5 and the 27-puzzle completion (`FINLIT_QUEST_V3_COMPOSITION_PHASE3_REPORT.md`, `..._PHASE4_REPORT.md`, `..._PHASE5_REPORT.md`, `FINLIT_QUEST_V3_27_PUZZLE_COMPLETION_REPORT.md`). Result: 27 of 27 puzzles meet the composition rules; ACH and WORTH added as a V3 supplement (`content/v3-supplemental-terms.json`); two cross-world anchors; `SPECS` fingerprint `718154a858036bba` when recorded; the 147-term inventory in `FINLIT_QUEST_V3_145_TERM_INVENTORY.md`.
- **Presentation:** victory celebration (confetti, coin flight, skip, reduced motion) and mobile header and completion-card layout fixes (`src/victory-celebration.js`, `word-game.css`, `tests/victory-celebration.test.js`, `tests/mobile-header-layout.test.js`); slot-machine-style synthesized audio with one persistent mute and volume preference (`src/game-audio.js`, `FINLIT_QUEST_PHASE6_AUDIO_REPORT.md`). The audio report states that real-device and iOS WKWebView playback were not verified.
- **Bonus word:** DUE accepted as a global optional bonus word through the shared word validation, with zero coins and XP (`src/wheel-interaction.js`, `tests/bonus-word-due.test.js`). No dated report exists for this item.
- **Planning:** "Build Your Wealth" feasibility report and post-V1 backlog entry (`docs/FINLIT_QUEST_BUILD_YOUR_WEALTH_FEASIBILITY.md`, `FUTURE_FEATURE_BACKLOG.md`); research only, not approved for implementation.

### Approvals referenced (as documented in the repository)

- Credit permanent-ID registry: "Owner approved 2026-10-14" (`content/credit-term-identities.js`); now CAL-0002.
- ACH and WORTH: owner-approved 2026-10-16 per `content/v3-supplemental-terms.js`; now part of CAL-0007.

### Tests

- Full suite at the time of writing: 466 passing. Per-phase counts are in the individual reports.

### Known issues (as documented)

- Native iOS build and real-device verification are blocked (`docs/V1_RELEASE_CHECKLIST.md`); audio character and loudness await owner listening.

---

## 2026-07-23 (latest) — Free hints extended through every game in Level 1

Corrected the tutorial boundary after live feedback confirmed that Game 2 of
Level 1 had reverted to paid hints. The prior implementation treated only the
first puzzle in each world as the tutorial and wrote `firstPuzzlePassed`
immediately after Game 1.

### Completed work

- Defined Level 1 as each world's complete first five-puzzle playthrough.
- Made Games 1–5 use unlimited free letter hints and free full reveals.
- Restored governed 100/300 pricing only after five distinct active puzzles have
  been completed in that world.
- Derived tutorial status from persisted per-world puzzle history rather than
  the visible progress counter or the obsolete `firstPuzzlePassed` flag.
- Preserved independent tutorial progress for Money Basics, Credit, Crypto, and
  Banking Basics.
- Updated the tutorial notice to state that free hints cover all five games.
- Added regression coverage for Game 2, refresh/reload behavior, per-world
  independence, runtime wiring, and the five-game configuration of all worlds.
- Re-stamped browser assets and synchronized the updated web bundle into the
  native iOS project.

### Files modified

- `word-game-app.js`
- `src/puzzle-bank-engine.js`
- `index.html`
- `tests/puzzle-bank-engine.test.js`
- `tests/tutorial-hints-runtime.test.js`
- `PROJECT_LOG.md`

### Architectural decisions

- Puzzle history is the stable source of truth for level progression. A world
  remains in Level 1 while its active completed-puzzle count is below its
  configured `requiredPuzzles` value.
- The old `firstPuzzlePassed` save field is ignored rather than migrated or
  deleted, preserving backward compatibility with existing versioned saves.
- The rule remains data-driven: if a future world configures a different
  `requiredPuzzles` value, its tutorial boundary follows that configuration.

### Validation

- Automated tests: **202 passed, 0 failed**
- Web bundle: **40 files, built successfully**
- Native iOS bundle: Capacitor sync completed successfully
- Browser visual verification was attempted, but the browser security policy
  blocked reloading the local `127.0.0.1` page. No visual result is claimed.

### Recommended next steps

1. Verify locally that Game 2 displays `∞ HINTS` at zero coins.
2. Verify Game 5 remains free and Game 6 restores 100/300 pricing.
3. Publish through review without merging or deploying until approved.

---

## 2026-07-23 (latest) — Investing Basics v1.1 added as the fifth game world

Implemented Investing Basics from the final approved governance record
`INVESTING_BASICS_MAIN_GAME_VOCABULARY_v1.1_FINAL_APPROVED.md`. The supplied
record was preserved byte-for-byte at 16,972 bytes with SHA-256
`26f780ad8bd255146bbea178391568be33cba3bd0cdb88b75acf427116a559c5`.
No educational wording or governed puzzle relationship was rewritten.

### Completed work

- Added Investing Basics as the fifth selectable card after Banking Basics.
- Registered Investing with the shared word-game engine under the stable save
  key `wg-investing`.
- Imported all 25 approved active terms with stable IDs, exact definitions,
  source organizations, source URLs, and cluster IDs.
- Added the nine exact governed puzzle clusters: seven three-word clusters and
  the two approved two-word exceptions `IB-C08` and `IB-C09`.
- Kept `investing.portfolio` and `investing.diversify` in a separate inactive
  Future Expanded-Wheel Reserve record.
- Preserved ALLOT as removed and all eight documented cross-world exclusions.
- Added Investing runtime files to the web/native bundle and synchronized the
  bundle into the iOS project.
- Added regression tests for immutable source fidelity, term metadata,
  active/reserve separation, exact wheels, cluster coverage, prefix safety,
  cross-world duplicates, world registration, and world-card ordering.

### Files added

- `content/investing-basics-terms.js`
- `content/investing-basics-terms.json`
- `content/investing-basics-puzzle-bank.js`
- `content/investing-basics-reserve.json`
- `docs/INVESTING_BASICS_MAIN_GAME_VOCABULARY_v1.1_FINAL_APPROVED.md`
- `tests/investing-basics-content.test.js`

### Files modified

- `index.html`
- `app.js`
- `word-game-app.js`
- `package.json`
- `scripts/build-www.sh`
- `tests/world-selection.test.js`
- `PROJECT_LOG.md`
- generated native files under `ios/App/App/public/`

### Architectural decisions

- Investing uses the same data-driven static-bank path as Money Basics and
  Banking Basics; no Investing-specific puzzle logic was introduced.
- The canonical Markdown remains the immutable governance source, the complete
  JSON record preserves implementation metadata, and the compact JavaScript
  files provide browser runtime data.
- The Investing branch is stacked on the pending Level 1 hint correction so the
  new world also receives free unlimited hints for all five Level 1 games.
  Once that prerequisite fix is merged, the Investing review will reduce to
  only the new-world changes.

### Validation

- Automated tests: **211 passed, 0 failed**, including the stacked Level 1
  hint regression coverage across all five worlds.
- Web/native bundle: **42 files, built successfully**
- Capacitor iOS sync: **successful**
- Local browser: five world cards displayed in the expected order; Investing
  opened with `0 / 9` puzzle progress and the governed `STOCK / SELL / ASK`
  definitions and nine-letter `ACEKLLOST` wheel.
- Local browser: after completing Investing Game 1, Game 2 still displayed
  `∞ HINTS` and `Reveal (FREE)`, confirming the Level 1 hint fix carries into
  the new world.
- Browser console errors: **0**

### Known issues

- GitHub publishing remains blocked until the saved `gh` authentication is
  refreshed. This implementation has not been merged or deployed.

### Recommended next steps

1. Merge or publish the Level 1 hint correction first.
2. Review the Investing branch and confirm the fifth world card on mobile.
3. Open a draft Investing PR after GitHub authentication succeeds.
4. Do not report Investing as live until merge, deployment, and production
   verification are complete.
---

## 2026-07-23 (latest) — Fix Money Basics puzzle clustering and tutorial hints

Branch: `codex/fix-money-puzzles-tutorial-hints`. This branch already had substantial uncommitted work in progress (from an earlier session) attempting the same ticket. Reviewed it fully before building on it — most of it was correct and independently verified; two parts were not and were corrected here. Nothing in this entry was deployed; per explicit instruction, this stays a draft PR pending review.

### Root cause, Fix 1 (puzzle clustering)

The ticket's own hypothesis — "runtime is ignoring `money-basics-puzzle-bank.js` and flattening `money-basics-terms.json`" — was not what was happening. `wgEnsureBank()` (`word-game-app.js`) correctly reads the governed static bank; the defect was upstream, in the bank content itself: `content/money-basics-puzzle-bank.js` on `main` hand-authored 6 of 20 entries as `puzzleMode:"single-term"` (INCOME, BUDGET, BILL, NET, EXPENSE, INFLATION) instead of clustering them. A pre-existing test, `tests/money-basics-content.test.js`'s *"Money Basics governed bank contains 14 clusters and 6 single-term puzzles"*, was actively asserting the buggy shape as correct.

### Root cause, Fix 2 (tutorial hints) — and a bug in the prior attempt

The prior WIP's hint-cost/affordability logic was correct (zero cost, always enabled, on the first unpassed bank puzzle). But it also added an unrequested mechanic: using any hint on the tutorial level replaced the completion screen with a "Practice Complete — retry without hints to pass" gate (`completionOutcome`, tested explicitly, stated in UI copy). This contradicted the ticket's own spec ("the player may use it repeatedly until the level is completed") and didn't achieve its stated anti-farming goal, since per-word reward dedup already existed from earlier work. Removed entirely, per explicit direction: tutorial puzzles now complete normally regardless of hint use; `firstPuzzlePassed` just switches later visits back to governed pricing.

### A second, more severe bug found during live verification

Visually testing the reclustered content (not just running tests) surfaced a real, previously-**live-in-production** bug: the original `MB-C14` cluster (`main`, pre-existing) paired `PAY` with `PAYCHECK` — since `PAY` is a literal prefix of `PAYCHECK`, and the shared word-game engine submits a word the instant a player's selection spells any known answer in the puzzle (`wgAddLetter`, added during V1.0 Blocker 6), selecting P-A-Y always auto-submits "PAY" before C-H-E-C-K can be added. `PAYCHECK` could never be solved in that grouping, on any input method. This existed in production already; the tutorial-pinning fix would have made it far worse by guaranteeing every new player hit it as literally their first puzzle, unavoidably.

Fixed at two levels:
- **Content**: swapped `PAY` for `NET` in the affected cluster (verified: 9 tiles, no conflicts); `SPEND+NEEDS+EXPENSE` still valid without `NET`. Searched all 35 other approved terms for a valid `PAYCHECK` partner — none exists (it alone uses 8 of 9 wheel tiles). `PAYCHECK` joins `INFLATION` as a second documented, non-active governance gap (`docs/MONEY_BASICS_CLUSTER_GOVERNANCE_GAP_2026-07-23.md`).
- **Engine**: added `hasPrefixConflict()` to `src/puzzle-bank-engine.js`, checked alongside the existing wheel-budget check in `buildOneCandidate`. This closes the bug class for good, including for Credit/Crypto's *randomly generated* banks, which had the same latent exposure with no test ever covering it.

### Completed work

- Removed the retry/"Practice Complete" mechanic (`word-game-app.js`, `src/puzzle-bank-engine.js`, `index.html`, `tests/puzzle-bank-engine.test.js`).
- Re-clustered `content/money-basics-puzzle-bank.js`: 10 standard (3-4 word) clusters + 1 documented 2-word exception (INCOME/CHANGE) + 2 documented non-active gaps (INFLATION, PAYCHECK). Zero one-answer puzzles.
- Added `hasPrefixConflict()` as a permanent guard in the shared puzzle-bank engine.
- Progress counter (`wgUpdateProgress`) now reflects completed puzzles against the active bank size, not vocabulary term count — confirmed live: "PUZZLES COMPLETE 0/11", not term count.
- Fixed the stale test that had been asserting the original bug as correct; added regression tests for prefix-conflict-freedom (Money Basics, Banking Basics, and the shared engine generally) and for the free/governed hint-cost functions.

### Live verification (not just automated tests)

- Fresh account → Money Basics level 1 = CASH/PAY/NET (3 real answers), "∞ HINTS" / "Reveal (FREE)" shown, both fully functional (not just visually enabled) at a real zero coin balance.
- Solved level 1 with a hint used — completed normally, no retry gate, correct rewards (+70 coins, +16 XP).
- Level 2 (BUDGET/BILL/DEBIT, a real 3-word cluster, no longer a single-answer "BILL" level) immediately shows governed pricing (100/300); hint deducts exactly 100 coins; correctly disables below that balance.
- Reload after passing level 1 → `firstPuzzlePassed` persists, governed pricing stays in effect. Reload *before* passing level 1 (mid-tutorial, one hint already used) → hints are still free and unlimited, level 1 puzzle unchanged.
- Banking Basics, Credit, and Crypto tutorial levels each spot-checked: free hints, correct completion, no prefix conflicts, no regressions.
- Zero console errors throughout.

### Validation

- Automated tests: **195 passed, 0 failed** (verified directly — the prior WIP's "182 passed, 0 failed" claim was checked and found wrong; the stale test above was actually failing at the time it was made).
- Web bundle: `scripts/build-www.sh` — 40 files, built successfully.
- Native: `npx cap sync ios` — succeeded. A full Xcode compile/archive still cannot be performed from this machine (hardware ceiling, documented in `docs/FQ-APP-002-native-build-release-standard.md` §1) — unchanged, not new to this fix.

### Known issues and blockers

- Banking Basics' 13 clusters are all 2-word "long-word exceptions" (verified real, not fabricated) — not re-optimized for potential 3-word groupings, since Banking wasn't reported broken and doing so would be a larger, separate content-design pass.
- `INFLATION` and `PAYCHECK` remain approved Money Basics vocabulary but inactive in live puzzles — flagged for a governance decision, not silently worked around.

### Files modified

- `word-game-app.js`, `src/puzzle-bank-engine.js`, `index.html`, `word-game.css`
- `content/money-basics-puzzle-bank.js`
- `tests/puzzle-bank-engine.test.js`, `tests/money-basics-content.test.js`, `tests/banking-basics-content.test.js`
- `docs/MONEY_BASICS_CLUSTER_GOVERNANCE_GAP_2026-07-23.md`
- `PROJECT_LOG.md`

### Recommended next steps

1. Review the draft PR and the four required screenshots.
2. Decide the governance question for `INFLATION`/`PAYCHECK` (expand vocabulary, expand the wheel budget, or accept them as flashcard/quiz-only content).
3. Decide whether Banking Basics' clusters should be re-optimized for 3-word groupings in a separate pass.

---

## 2026-07-23 (latest) — Money Basics and Banking Basics production release verified

PR #1 was marked ready and merged into `main` after the final release review passed.

### Release identifiers

- Pull request: https://github.com/drmoore412-sys/finlit-quest/pull/1
- Release branch: `agent/add-money-and-banking-worlds`
- Release-order correction: `89b4a2d`
- Merge commit: `d368698523c78a2876cf8d51c58a62adc5d358b3`
- GitHub Pages build: `1111151207`
- Deployment result: **built**
- Production URL: https://finlitquest.com/

### Live mobile verification

Verified the production site at a 390 × 844 mobile viewport.

- “Choose Your World” displayed exactly four selectable cards in the required order:
  1. Money Basics World
  2. Credit World
  3. Crypto World
  4. Banking Basics World
- Money Basics opened from the live selection screen and loaded a governed word puzzle with a working crossword, letter wheel, mission, definitions control, and `0 / 36` world total.
- Credit World opened its continent view and “Continue Adventure” loaded a working Credit Foundations puzzle with `0 / 38` world total.
- Crypto World opened directly and loaded a working Crypto Foundations puzzle with `0 / 20` world total.
- Banking Basics opened from the live selection screen and loaded a governed puzzle with a working crossword, nine-tile letter wheel, mission, definitions panel, and `0 / 26` world total.
- Banking’s live definitions panel displayed the approved definitions associated with the active governed cluster.
- Browser console warnings and errors: **0**

### Final validation

- Automated tests: **180 passed, 0 failed**
- Native/web bundle: **40 files, built successfully**
- PR mergeability before merge: **MERGEABLE / CLEAN**
- GitHub Pages deployment: **successful**

Money Basics and Banking Basics are now live. Investing Basics remains pending governance approval and was not implemented.

---

## 2026-07-23 (latest) — Final PR release review passed

Completed the final release review for draft PR #1. The review found and corrected one release-blocking presentation mismatch: the world-selection cards were ordered Crypto, Credit, Money Basics, Banking Basics instead of the approved production order.

### Final approved order

1. Money Basics
2. Credit World
3. Crypto World
4. Banking Basics

Added `tests/world-selection.test.js` to lock this order and verify that both new worlds’ runtime term and puzzle-bank files load before the shared word-game engine.

### Release gate

- PR mergeability: **MERGEABLE / CLEAN**
- Required GitHub status checks configured: **none**
- Outstanding PR reviews or requested changes: **none**
- Automated tests: **180 passed, 0 failed**
- Native/web bundle: **40 files, built successfully**
- `git diff --check`: **passed**

The feature branch is approved to leave draft status and merge into `main`. Production deployment and live mobile verification remain required before the release may be reported as live.

---

## 2026-07-23 (latest) — Money Basics and Banking Basics branch published for review

GitHub CLI authentication was restored for `drmoore412-sys`. The combined Money Basics and Banking Basics implementation was committed as `4a5bb85` (`Add Money Basics and Banking Basics worlds`) and pushed to `agent/add-money-and-banking-worlds`.

Draft pull request: https://github.com/drmoore412-sys/finlit-quest/pull/1

The GitHub connector returned `403 Resource not accessible by integration` when creating the pull request, so the authenticated GitHub CLI was used as the approved fallback. Branch push and draft PR creation both succeeded.

### Published scope

- Money Basics: 36 active terms, 14 multi-term clusters, 6 single-term puzzles.
- Banking Basics v1.1: 26 active terms, 13 multi-term clusters, 15 inactive reserve terms.
- World selection, shared-engine registration, build-copy configuration, governance records, and automated validation.

### Release validation

- Automated tests: **178 passed, 0 failed**
- Native/web bundle: **40 files, built successfully**
- Cross-world duplicates: **0**
- `git diff --check`: **passed**

### Known limitation

- This publication is a draft pull request, not a production deployment. The public website must not be reported as updated until the PR is merged and deployment is verified.

### Recommended next steps

1. Review and merge draft PR #1 when ready.
2. Verify the GitHub Pages deployment after merge before announcing the worlds as live.
3. Keep Investing Basics pending until its governance approval is complete.

---

## 2026-07-23 (latest) — Banking Basics v1.1 implemented from complete controlling governance record

Implemented Banking Basics from `BANKING_BASICS_v1.1_COMPLETE_CONTROLLING_RECORD_2026-07-23.md`, superseding and ignoring the earlier concise Banking summary. The controlling source was verified before implementation at exactly **18,198 bytes**, with **26** Section A rows beginning with `banking.` and **13** Section B cluster rows. Its approved definitions, stable IDs, source organizations, exact source URLs, cluster assignments, verification notes, support flags, version, and approval status were imported without rewriting.

### Completed work

- Registered `banking` as a selectable main-game world using the existing shared word-game engine.
- Added 26 approved active terms with stable `banking.*` IDs.
- Added the 13 governed two-term clusters; no single-term Banking puzzle was introduced.
- Preserved the complete approved metadata in the JSON governance/runtime record while providing the browser runtime with the exact approved ID, term, and definition fields.
- Added a clearly separated inactive reserve record containing all 15 Future Expanded-Wheel Reserve terms, including the preserved SAVINGS and RECURRING definitions.
- Preserved GLOBAL as completely removed and ACCOUNT, AUTOPAY, PRINCIPAL, and YIELD as cross-world exclusions.
- Stored the complete controlling Markdown in the repository byte-for-byte.
- Added Banking runtime files to the native/web bundle and re-stamped cache-busting resource URLs.

### Files added

- `content/banking-basics-terms.js`
- `content/banking-basics-terms.json`
- `content/banking-basics-puzzle-bank.js`
- `content/banking-basics-reserve.json`
- `docs/BANKING_BASICS_v1.1_COMPLETE_CONTROLLING_RECORD_2026-07-23.md`
- `tests/banking-basics-content.test.js`

### Files modified

- `index.html`
- `app.js`
- `word-game-app.js`
- `scripts/build-www.sh`
- `PROJECT_LOG.md`

### Architectural decisions

- Banking uses its governed static puzzle bank as runtime authority, matching the Money Basics integration pattern.
- Full source and governance metadata remain in `banking-basics-terms.json`; the browser-facing JavaScript record contains only the fields consumed by gameplay.
- Reserve terms are stored as governed future content but are not loaded by `index.html`, copied into the native runtime bundle, or exposed as playable answers.
- ALERT and ROUTING retain their approved scope-note metadata.

### Validation

- Controlling record: **18,198 bytes**, SHA-256 `9551d3377533ab6ad569b618520b3a264d6733df067c83a6615feed5e1acb3ed`
- Active terms: **26**
- Verified multi-term clusters: **13**
- Single-term puzzles: **0**
- Future Expanded-Wheel Reserve: **15 inactive terms**
- Wheels over nine tiles: **0**
- Cross-world playable duplicates against Credit, Crypto, and Money Basics: **0**
- Automated tests: **178 passed, 0 failed**
- Native/web bundle: **built successfully, 40 files**
- `git diff --check`: **passed**

### Known issues and blockers

- GitHub publishing remains blocked until `gh auth status` succeeds.
- Automated browser control cannot access the local `127.0.0.1` page under the browser security policy; source, runtime, test, and built-bundle verification passed.
- No commit, push, pull request, or production deployment has been performed.

### Recommended next steps

1. Reauthenticate GitHub and confirm `gh auth status` succeeds.
2. Review the combined Money Basics and Banking Basics staged diff.
3. Commit as `Add Money Basics and Banking Basics worlds`, push the feature branch, and open a draft pull request.
4. Keep Investing Basics unimplemented until its vocabulary completes source review, duplicate review, clustering, and final governance approval.

---

## 2026-07-23 (latest) — Money Basics main-game vocabulary implemented and staged locally

Integrated the immutable `FinLit_Quest_Money_Basics_upload.zip` package without overwriting newer or unrelated repository work. The packaged `index.html` and `app.js` contained accessibility changes outside this milestone, so only the Money Basics-specific registration and metadata changes were merged. The approved educational wording and stable IDs were preserved exactly.

### Completed work

- Registered `moneybasics` as a selectable main-game world.
- Added all 36 approved playable terms with stable `moneybasics.*` IDs and matching JavaScript/JSON runtime records.
- Added the governed bank of 14 multi-term clusters and 6 approved single-term puzzles.
- Configured Money Basics to load its governed puzzle bank directly instead of replacing it with random runtime clustering.
- Added Money Basics files to the native/web bundle build.
- Added automated controls for exact term totals, stable IDs, JavaScript/JSON parity, full puzzle coverage, nine-tile wheel limits, exact repeated-letter buildability, explicit exclusions, and active Credit/Crypto duplicate detection.
- Re-stamped local resource URLs through the required cache-busting process.

### Files added

- `content/money-basics-terms.js`
- `content/money-basics-terms.json`
- `content/money-basics-puzzle-bank.js`
- `tests/money-basics-content.test.js`
- `docs/MONEY_BASICS_MAIN_GAME_APPROVAL.md`

### Files modified

- `index.html`
- `app.js`
- `word-game-app.js`
- `scripts/build-www.sh`
- `PROJECT_LOG.md`

### Architectural decisions

- The governed static puzzle bank is the runtime authority for Money Basics.
- Single-term puzzles remain explicitly labeled with `puzzleMode: "single-term"`.
- Money Basics uses the existing shared word-game engine and save architecture; no separate gameplay implementation was introduced.
- Source-package deltas unrelated to Money Basics were excluded.

### Validation

- Money Basics terms: **36**
- Multi-term clusters: **14**
- Single-term puzzles: **6**
- Wheels over nine tiles: **0**
- Cross-world playable duplicates against active Credit and Crypto records: **0**
- Automated tests: **172 passed, 0 failed**
- Native/web bundle: **built successfully, 38 files**
- `git diff --check`: **passed**
- Automated live-browser QA was unavailable because the browser-control security policy blocked the local `127.0.0.1` URL; this was a tooling restriction, not an application failure.

### Known issues and blockers

- Banking Basics v1.1 cannot be implemented until the complete final governance record supplies the approved definitions and stable IDs for all 26 active terms.
- GitHub publishing remains blocked because `gh auth status` reports an invalid saved token.
- No commit, push, pull request, or production deployment has been performed.

### Recommended next steps

1. Attach the final Banking Basics governance record.
2. Reauthenticate GitHub and confirm `gh auth status` succeeds.
3. Implement and validate Banking Basics on the existing `agent/add-money-and-banking-worlds` branch.
4. Run the full suite and bundle build again, review the combined diff, commit, push, and open the draft pull request.
5. Keep Investing Basics pending until its vocabulary receives final governance approval.

---

## 2026-07-21 (latest) — Phase 4: Privacy Policy, Terms of Service, and Support page published

Built and published the three legal/compliance pages required before submission, closing two of the FAILs flagged in Phase 3's guideline audit (5.1.1 Privacy, 1.5 Support URL). Confirmed two public-facing decisions with the user first, since they become permanently visible once published: contact email (`drmoore412@gmail.com`) and publisher name ("FinLit Quest," no separate legal entity).

**`privacy.html`, `terms.html`, `support.html`** (all live at finlitquest.com) — every claim in them is cross-checked against the app's actual verified behavior from this session rather than written as generic boilerplate: no backend (zero `fetch()` calls anywhere, confirmed during Blocker 9b), no accounts (no login step exists anywhere, confirmed during Blocker 12), no analytics/ads/third-party SDKs, and the coin/XP economy is earn-only and never gates content (confirmed during Phase 3's 3.1.1 analysis).

**In-app reachability:** Apple requires the privacy policy be linked from inside the app itself, not just listed in App Store Connect metadata. Added a small "Privacy Policy · Terms of Service" link row to the Welcome screen footer, styled to match the existing brand. Also added the three new pages to `scripts/build-www.sh`'s explicit copy list (this script only bundles files it's told about — documented as a known gotcha in FQ-APP-002 §4) so the native iOS build gets working links too, not just the web deployment.

**Verification:** all three pages render correctly, in-app link confirmed working, zero console errors, 168/168 tests still passing (no existing logic touched — these are new static pages).

### Files added

- `privacy.html`, `terms.html`, `support.html`

### Files modified

- `index.html`, `word-game.css`, `scripts/build-www.sh`
- `docs/V1_RELEASE_CHECKLIST.md` (Phase 4 marked Verified, Phase 3's guideline table updated, full log entry added)

### Remaining blockers

Branding/domain (9, mostly done), store assets (10 — now includes entering the Privacy Policy/Support URLs into App Store Connect and writing the 4.2 App Review notes), submission (11), Phases 5/8.

---

## 2026-07-21 (latest) — Phase 3: Apple App Review Guideline audit complete

Fetched the current App Review Guidelines live from developer.apple.com (not from training knowledge) and audited FinLit Quest's actual verified behavior against every section relevant to a Capacitor-wrapped, offline, no-backend, no-accounts, no-IAP educational word-game app. Full guideline-by-guideline PASS/FAIL/NOT APPLICABLE table is in `docs/V1_RELEASE_CHECKLIST.md` Phase 3.

**No guideline violations found.** Every FAIL is a missing artifact, not a design problem:
- **4.2 Minimum Functionality** (the standing concern since the Capacitor decision) — PASS with a mitigation: the app has real interactive gameplay well beyond a repackaged website, but still needs specific "Notes for Review" text in App Store Connect describing that gameplay up front, since web-wrapped apps are a known auto-rejection risk if reviewers assume "just a website." Tracked for Blocker 10/11.
- **5.1.1 Privacy** — FAIL today (no privacy policy exists yet), but straightforward given the real architecture (100% local storage, zero backend/accounts/analytics/ads) — the policy just needs to state that accurately. Already tracked as Phase 4.
- **1.5 Support URL** — FAIL today (doesn't exist yet), tracked as Blocker 10.
- **2.1 App Completeness** ("tested on-device") — can't be fully verified from this sandboxed environment; only browser-based Capacitor testing has been possible here. Already documented in FQ-APP-002 §1 as work for whoever does the final native build.

**Explicitly confirmed NOT APPLICABLE, closing real open questions:**
- **3.1.1 In-App Purchase** — doesn't apply. No real-money purchase path exists anywhere; coins are earn-only and gate nothing (both worlds are freely selectable), so there's no paywalled content to require IAP for.
- **3.1.5 Cryptocurrencies** (wallets/mining/exchanges/ICOs) — doesn't apply. "Crypto World" is purely educational vocabulary content with zero connection to any real wallet, exchange, or mining operation — confirmed against Apple's own guideline text, which specifically governs apps facilitating real crypto functionality.
- **4.8 Sign in with Apple** — doesn't apply, since the app has no login/account system at all.
- Zero device permissions requested, so no Info.plist purpose strings needed.

### Files modified

- `docs/V1_RELEASE_CHECKLIST.md` (Phase 3 marked Verified, full guideline table added)

### Remaining blockers

Branding/domain (9, mostly done), store assets (10 — now also carrying the App Review notes and support URL), submission (11), Phases 4/5/8.

---

## 2026-07-21 (latest) — Blocker 8: Bug sweep complete — dead code removed, full QA sweep clean

Two parts: cleared the cleanup backlog flagged across Blockers 2, 6, 7, and 12, then a full live QA sweep (every screen/button, all viewports, deliberate break-attempts, console/performance checks).

**Dead code removed:** the legacy Crypto crossword flow flagged back in Blocker 2 — ~25 functions in `app.js` (`submitWord`, `foundWord`, `showLearn`, `rateLearning`, etc., all built around a module-level `WORLD` constant) plus `#playScreen`/`#learnModal` (~50 DOM ids) in `index.html`, confirmed unreachable through any live navigation path. Kept everything the dead path shared with live code (`shuffled`, `toast`, `celebrate`, `WORLD`, all the screen-switching functions). In live `updateDashboard`, replaced a conditional that depended on the removed `state` object with the literal value it always evaluated to — confirmed zero behavior change.

**Investigated but deliberately NOT removed:** `worlds/crypto.js`'s `levels`/`bonusWords` fields looked like more dead weight, but `src/content-validator.js` requires them for schema validation at load time (`FinLitWorldLoader.loadWorld` throws otherwise) — removing them would have crashed the entire app before any screen renders. Caught this before editing, left the file untouched.

**Stale docs:** six Credit curriculum reports falsely claiming all 15 workbooks are missing got a corrective note (`curriculum/credit/approved/reports/CORRECTION_2026-07-21.md`) rather than being rewritten or deleted.

**Live regression after the dead-code removal:** full flow re-verified end to end, zero console errors, all state intact. 168/168 tests still passing (unaffected either way — none of the removed code was test-covered).

### Full QA sweep — all clean, no new defects

Every screen and interactive element exercised directly. Viewports: mobile portrait/landscape, tablet, desktop (confirmed a two-column layout variant appears cleanly at wide desktop width). New install, returning user, refresh, storage cleared mid-session without reloading (self-heals, no crash), storage wiped then reloaded (lands back on a fresh Welcome screen). Break-attempts: empty word submission, rapid triple-submit of an already-solved word (no double-award), hint-spam with insufficient coins (blocked every time, coins never negative), abandoning a quiz mid-way and reopening (no corrupted state), 30 rapid screen-switch cycles (zero errors). Performance: ~337ms full load against the local dev server (a worst-case measurement — the actual iOS app bundles files locally via Capacitor, no network fetch at all). Zero console errors, zero missing assets, zero placeholder content anywhere in the live app surface, checked this time app-wide rather than just for Credit.

### Files modified

- `app.js`, `index.html`, `curriculum/credit/approved/reports/CORRECTION_2026-07-21.md` (new)
- `docs/V1_RELEASE_CHECKLIST.md` (Blocker 8 and Phase 6 marked Verified, full log entry added)

### Remaining blockers

Branding/domain (9, mostly done — native build still blocked on hardware), store assets (10), submission (11), Phases 3/4/5/8.

---

## 2026-07-21 (latest) — Blocker 7: Credit end-to-end verified; found and fixed two real bugs, documented a known content limitation

Full first-time-player walkthrough of Credit World — real UI clicks/drags, scripted reward/progression checks — same standard as Blocker 6. First established that Credit isn't purely workbook-based: it has 15 workbook lessons (only Credit Foundations unlocked for v1.0, correct) plus its own live word-wheel game sharing the same engine as Crypto.

**Bug 1 (high severity): Credit's continent screen showed Crypto's data and routed to Crypto's word game.** Flagged during Blocker 12 as a known issue and never actually fixed — confirmed still present. `updateDashboard()` (serving `#dashboardScreen`, Credit's continent map) still hardcoded the module-level `WORLD` constant (Crypto) for its stats source and three button targets. Confirmed safe to retarget since every other caller of `updateDashboard()` belongs to the already-confirmed-dead legacy `#playScreen` flow. Fixed: stats source now `learning.worldStats("credit")` (honestly shows "No reviews due" rather than Crypto's misleading data — Credit doesn't have its own spaced-repetition tracking yet, a separate gap not built here), and all three buttons now open Credit's word game. Re-verified live.

**Bug 2 (medium severity): the continent screen's coin count was hardcoded to a literal 0.** Found while re-verifying Bug 1's fix — real balance was 300, displayed was always "0". Fixed to read the real balance. Re-verified live.

**Finding, not a bug from this session, newly quantified: 17 of Credit's 38 word-game vocabulary terms can never appear in a live puzzle.** 15 were already known (documented in `credit-unplayable-terms.json` from earlier work — individually exceed the 9-letter wheel budget). 2 more (BORROWER, APPLICANT) are new: each fits the budget alone but has no compatible partner word in the vocabulary (confirmed via 500 attempts with the Blocker 6 coverage fix, zero pairings). This gives a permanent ~21/38 ceiling, unlike Crypto's fully-fixable gap. Per the standing instruction not to raise the wheel budget, and since this is a content-curation call (these terms are already taught via flashcards/quizzes regardless), confirmed with the user: document as a known, accepted limitation rather than fix.

### Confirmed correct, no changes needed

Welcome → World Selection → Credit continent map (correct lock states), full CRF-001 lesson flow (8 content steps → 5 flashcards → 4-pair matching with correct accept/reject behavior → 8-question quiz), quiz scoring (7/8, 88%, 100 XP, matches Blocker 1's logic exactly), CRF-002 correctly unlocking after CRF-001 completion, Credit's own word-wheel game (confirmed the Blocker 6 tap-submit and reward fixes apply identically via the shared engine), back navigation (word-game → World Selection, workbook lesson → workbook map with internal hierarchy preserved), and full refresh/relaunch persistence across workbook and word-game state.

### Noted, not acted on

Two Credit curriculum reports (`CRF_WORLD_READINESS_CHECKLIST.md`, `CRF_WORKBOOK_COVERAGE_MATRIX.md`, dated 2026-07-19) falsely claim all 15 workbooks are "NOT FOUND" — stale/wrong, contradicted by the actual files on disk. Flagged for a documentation cleanup pass during Blocker 8.

### Files modified

- `app.js`
- `docs/V1_RELEASE_CHECKLIST.md` (Blocker 7 marked Verified, full log entry added)

### Remaining blockers

Bug sweep/performance (8, now also carrying the dead-code, stale-docs, and Credit-vocab-ceiling documentation cleanup), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8.

---

## 2026-07-21 (latest) — Blocker 6: Crypto end-to-end verified; found and fixed two real gameplay-blocking bugs

Full first-time-player walkthrough of Crypto World — real UI clicks, real drag/tap gestures, not just function calls — plus scripted checks for reward/progression integrity across repeated completions, refreshes, and navigation.

**Scope clarifications confirmed with the user before testing:** the "levels" concept in `worlds/crypto.js` is dead/unused code — live gameplay is one continuous 20-term vocabulary bank with randomized 5-puzzle playthroughs, not discrete levels. Verified that structure directly instead. Also: "Pause" (`#wgNavPause`) was wired identically to Back/Journey (discards in-progress puzzle, no real pause state) — relabeled to an honest "Exit" (🚪) rather than building real pause/resume.

**Bug 1 (high severity): discrete tap-to-build-word could never submit.** The wheel's own instructions say "Swipe or tap letters to build words," but submission only ever fired from a `pointerup` listener gated on the current gesture spanning >1 letters — a discrete tap is always its own single-letter gesture, so tapping could never complete a word regardless of device. Reproduced live: 5 correct taps spelling "TOKEN" left it unsolved, 0 XP. Fixed by checking after every letter add whether the selection spells a target word, submitting immediately regardless of whether it arrived via drag or discrete taps. Re-verified live (4 taps spelling "LOCK" now correctly submit) with no regression to the existing drag path, invalid-word handling, or already-found guard.

**Bug 2 (high severity): the live puzzle bank could permanently omit vocabulary words.** The bank only tops up when short of its target size, never re-checked for coverage — confirmed live that after enough playthroughs to reach 17/20 words solved, 3 words (MINT, LEDGER, MINER) were permanently absent from the persisted bank, not by structural exclusion (confirmed they combine fine at a larger bank size) but by an unlucky initial random draw with no way to ever recover. Fixed by having `buildBank` guarantee full vocabulary coverage after its normal fill pass, retrying with the missing word forced first in the candidate pool so it pairs naturally with others in one attempt. Bank size is now a floor, not an exact count. Re-verified live: a fresh save's bank grew 10→12 with zero words missing.

### Confirmed correct, no changes needed

Welcome → World Selection → Crypto flow, valid/invalid word handling, definitions panel, hint (100 coins) / full reveal (300 coins) costs and insufficient-balance blocking, coin/XP rewards, puzzle-complete reward summing, level-up unlock at the 250 XP threshold, back/exit navigation, and full refresh/relaunch persistence (XP, coins, solved-word count, level all survived a real reload). No "Crypto World complete" end state exists by design — finishing a 5-puzzle playthrough starts a new random one, which is correct for a vocabulary-bank word game, not a bug.

### Flagged, not fixed here

`worlds/crypto.js`'s `levels`/`bonusWords` arrays are confirmed dead code — added to the Blocker 8 (bug sweep) cleanup list alongside the earlier dead legacy XP path from Blocker 2.

### Tests added

`tests/puzzle-bank-engine.test.js` — new full-coverage test; updated three existing tests whose assertions assumed an exact bank size (now a floor) to use `>=`; pinned one test's internal 8/2 split to a fixed slice so it stays deterministic. Full suite: **168/168 passing**, stable across 5 repeated randomized runs.

### Files modified

- `word-game-app.js`, `src/puzzle-bank-engine.js`, `index.html`, `tests/puzzle-bank-engine.test.js`
- `docs/V1_RELEASE_CHECKLIST.md` (Blocker 6 marked Verified, full log entry added)

### Remaining blockers

Credit e2e (7), bug sweep/performance (8, now also carrying the dead-code cleanup note), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8. Plus the still-open Credit-dashboard-Crypto-wiring follow-up from Blocker 12.

---

## 2026-07-21 (latest) — Blocker 5: Save/load persistence verified; found and fixed an unsanitized-streak bug

Investigated the full Blocker 5 scope: save schema, coins, XP, score, current position, solvedWords, streak, settings, corruption/version handling. Most of it was already correct — coins, XP, workbook score, solvedWords, and settings all persist correctly with no drift risk.

**Root cause:** `player.streak` was never sanitized on load, unlike `xp` (which Blocker 2 already hardened). A corrupted save — a non-numeric or negative streak value — would render straight into the UI, since streak only gets recomputed after the player's first action of the session, not on load. Same bug class as Blocker 4's XP double-award: in-memory/persisted state can drift from what's actually valid. `coins` had a milder version of the same gap (self-heals on first write, but not sanitized on initial load/display).

**Fix:** generalized `sanitizeXp` into a shared `sanitizeCount()` in `learning-engine.js`, applied to `xp` (unchanged), `coins`, and `streak` in `normalizeSave`.

### Live re-verification

Seeded a corrupted save directly into localStorage (`streak:-99, coins:"corrupted", xp:100`) and loaded it through the real bootstrap: `xp` stayed 100, `coins` and `streak` both correctly sanitized to 0 (header showed "0", not "corrupted"). Separately confirmed coins/theme/solvedWords/xp all survive a real reload unchanged. Zero console errors.

**Noted, not fixed (no live risk):** the save-version field exists but there's no real branching migration — old saves merge via object-spread, which only works for additive schema changes. Flagged for whoever next makes a non-additive save-schema change.

### Tests added

`tests/learning-engine.test.js` — corrupted streak (NaN/string/negative) sanitizes to 0; valid streak preserved exactly; corrupted coins sanitizes to 0. Full suite: **167/167 passing**.

### Files modified

- `learning-engine.js` (`sanitizeCount`, applied to coins/streak)
- `tests/learning-engine.test.js`
- `docs/V1_RELEASE_CHECKLIST.md` (Blocker 5 marked Verified, full log entry added)

### Remaining blockers

Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8. Plus the still-open Credit-dashboard-Crypto-wiring follow-up from Blocker 12.

---

## 2026-07-21 (latest) — Blocker 4: Puzzle progression verified; found and fixed a real duplicate-XP economy bug

Investigated the five criteria in Blocker 4 (word wheel/crossword generation, random selection, 5-puzzles-per-lesson, no duplicates in a playthrough, persistence after restart). Four were already correct. The fifth uncovered a genuine bug, reproduced live before touching any code.

**Root cause:** `wgFoundWord` (`word-game-app.js`) paid out coins/XP on every word-found event, guarded only by an in-memory per-puzzle Set that resets on every new puzzle or page reload. It never checked the permanent `solvedWords` history before paying out. Because vocabulary words are shared across multiple puzzle clusters, the same word legitimately reappears across playthroughs (and sometimes within one playthrough) — every reappearance re-paid the full reward. Reproduced live: solved "MINT" (XP 0→6), reloaded, got a new playthrough where "MINT" reappeared, solved it again (XP 6→12). Also reproduced within a single playthrough with "CHAIN" appearing twice, no reload needed.

**Fix:** added `wordReward(word, alreadySolvedWords)` to `src/puzzle-bank-engine.js` as the single canonical source for word-solve payouts — zero reward for a word already in `solvedWords`, the real formula otherwise. Both the actual payout (`wgFoundWord`) and the pre-solve reward preview (`wgUpdateMission`) now call it; the old duplicated `wgRewardFor` was deleted. The word still marks "found" for puzzle-completion purposes on a repeat — only the currency is gated.

**Scope clarification (not a bug):** live gameplay has no "lesson" concept — the "5-puzzles-per-lesson" checklist wording is per-*world* playthrough in practice, correctly configured at 5 for both worlds. The lesson-scoped generator from earlier pipeline work is CLI-only and not wired into live gameplay.

### Live re-verification

Re-ran the exact repro after the fix: XP stayed at 8 after re-solving an already-recorded word, `solvedWords` stayed deduplicated, word still marked found, zero console errors. Also confirmed live: crossword/wheel rendering, genuine Fisher-Yates randomization with anti-repeat weighting, no duplicate puzzle IDs within a playthrough. Confirmed mid-playthrough *position* intentionally resets on reload (a fresh playthrough is drawn) — reasonable casual-game behavior, not a defect, and now safe by construction since repeats pay nothing.

### Tests added

`tests/puzzle-bank-engine.test.js` — `wordReward` correctness for a new word, zero payout for an already-solved word, safe handling of an undefined `solvedWords` list. Full suite: **164/164 passing**.

### Files modified

- `src/puzzle-bank-engine.js` (new `wordReward` export)
- `word-game-app.js` (`wgFoundWord`, `wgUpdateMission` consolidated onto it; `wgRewardFor` deleted)
- `tests/puzzle-bank-engine.test.js`
- `docs/V1_RELEASE_CHECKLIST.md` (Blocker 4 marked Verified, full log entry added)

### Remaining blockers

Save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8. Plus the still-open Credit-dashboard-Crypto-wiring follow-up from Blocker 12.

---

## 2026-07-21 (later) — Root-caused a user report of the onboarding flow being skipped: browser caching, not a code bug

User reported that the app "used to go to a Welcome page" but now goes straight into Crypto or Credit World. Reproduced the *correct* behavior immediately from a fresh browser context against the live production deploy — the new code was working. That ruled out a logic bug and pointed at caching.

**Root cause confirmed:** GitHub Pages serves every file with a flat `Cache-Control: max-age=600` (10 minutes) and has no other cache-busting mechanism (no content hashing, no custom-headers support — checked, GitHub Pages doesn't support a `_headers` file the way Netlify does). Two deploys had shipped in quick succession (Blocker 3, then Blocker 12); a browser that fetched `word-game-app.js` shortly before the second deploy would keep serving the cached pre-Blocker-12 version (with its unconditional `wgOpenWorld("crypto")` bootstrap call) for up to 10 minutes after `index.html` itself had already updated — a stale-JS/fresh-HTML mismatch, exactly matching the reported symptom.

**Fix:** new `scripts/stamp-cache-bust.mjs` — rewrites every same-origin `<script src>`/`<link href>` in `index.html` to `...?v=<timestamp>`, idempotently. A changed query string is a different URL to a browser's cache, forcing a fresh fetch on every deploy regardless of the 10-minute header. This is now a required step before every commit that touches HTML/CSS/JS, documented in `docs/FQ-APP-002-native-build-release-standard.md` (new §3a + updated release checklist) so it isn't rediscovered on the next deploy.

### Live verification

Ran the stamp script (31 references stamped), confirmed `index.html` still loads correctly with the query strings locally (fresh Welcome-screen flow works, zero console errors), full suite still 161/161, resynced into the Capacitor iOS bundle.

### Files modified

- `scripts/stamp-cache-bust.mjs` (new)
- `index.html` (stamped)
- `docs/FQ-APP-002-native-build-release-standard.md` (§3a added, release checklist updated)

### Remaining blockers

Unchanged. This was a deploy-infrastructure fix, not new blocker work.

---

## 2026-07-21 (later) — Blocker 12: Welcome + World Selection onboarding flow

Explicit, confirmed exception to the "no redesign" rule — proposed by the user as the last UI change before submission. Confirmed with two direct questions before writing any code: (1) that this was intentionally meant to override the no-redesign instruction from one message earlier, not an oversight, and (2) that the proposed "Coming Soon: Investing/Real Estate/Taxes/Insurance/Retirement World" tiles should be dropped — none of those exist anywhere in the project's actual plans (checked `FUTURE_FEATURE_BACKLOG.md` and the whole repo), and advertising them in a submitted App Store app would be a false claim. Landed on showing only the two worlds that actually exist.

**Root problem (verified accurate first):** the app opened unconditionally into Crypto gameplay with no world-picker anywhere; Credit was reachable only via a "Journey" button; and every "back"/logo/Journey button on the Crypto screen unconditionally landed on Credit's continent screen regardless of which world you'd actually been in — confirmed by reading the code, not just trusting the report.

**What was built:** two new screens (`#welcomeScreen`, one-time via a dedicated `finlitQuest.onboarded` flag; `#worldSelectScreen`, now the permanent landing hub for every launch after the first). Both worlds' *existing* screens are reused completely unchanged — no new "World Overview" or "Level Selection" screens, since Credit's continent map already has real per-world identity copy and building an equivalent for Crypto would have been a much larger addition than the actual reported problem needed. Rewired every home/back trigger app-wide (`#wgBack`, `#wgBrandLogo`, `#wgNavJourney` — the exact button named in the report — `#wgNavPause`, legacy `#backHome`) to go to World Selection instead of hardcoding Credit, and added a working "back to World Selection" logo button on Credit's own continent screen (there wasn't one before).

**Applied the standing "consolidate duplicated logic" principle proactively**, not just reactively: found the four screen-switching functions each maintaining their own slightly-inconsistent hide-list (one referenced a `#creditGameScreen` that no longer exists in the HTML). Replaced all four with one shared `hideAllScreens()`.

**Found but explicitly not fixed here:** Credit's continent screen has three widgets that unconditionally jump to Crypto and a "Daily Review" stat that's actually reading Crypto's SM-2 data — strong evidence this screen was originally Crypto's own dashboard before being relabeled for Credit and never fully rewired. Real, pre-existing, and unrelated enough to this change that fixing it here would have expanded scope — spawned as a separate follow-up task instead.

### Live verification

Real clicks, desktop and mobile (375×812) viewports, `http://localhost:8756`: full first-launch flow (Welcome → World Selection → Crypto, fresh player correct); the exact reported bug fixed (Journey button from Crypto now returns to World Selection, not Credit); Credit World entry and its new back-to-World-Selection logo both work; Credit's *internal* back-navigation (workbook → continent map) correctly left untouched; returning-user reload correctly skips Welcome and lands on World Selection. Zero console errors on both viewport sizes. 161/161 tests still passing. Synced into the Capacitor iOS bundle so the native app gets this too.

### Files modified

- `index.html`, `app.js`, `word-game-app.js`, `workbook-app.js`, `word-game.css`, `journey.css`
- `docs/V1_RELEASE_CHECKLIST.md` (new Blocker 12 entry)

### Remaining blockers

Unchanged: puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), branding/domain (9, mostly done), store assets (10), submission (11), Phases 3/4/5/8. Plus the newly-flagged Credit-dashboard-Crypto-wiring follow-up (separate task, not blocking).

---

## 2026-07-21 (later) — Blocker 3 (level progression) verified; restructured V1.0 plan into 8 submission-readiness phases

**Plan restructure:** adopted the user's 8-phase "Version 1.0 Submission Readiness" plan into `docs/V1_RELEASE_CHECKLIST.md`, mapping the existing 11 blockers onto it (Phase 1 = Blockers 3-7, Phase 2 = part of 8, Phase 6 = rest of 8, Phase 7 = Blocker 10) and adding four genuinely new tracked items: Phase 3 (formal Apple Guideline Review), Phase 4 (Privacy & Compliance), Phase 5 (Accessibility), Phase 8 (Submission Readiness Review gate). Context: the plan is to hand off only the final build/sign/TestFlight/submit step to an outside specialist, so everything here is aimed at that person needing to touch nothing but Apple-specific tooling.

**Blocker 3 fixed and verified**, including a mid-fix process note: consolidated the level-progression formula (previously duplicated as a literal `250` in four places, and separately hardcoded — wrongly — as `100` in app.js's legacy dashboard) into one canonical `learning-engine.js` export (`XP_PER_LEVEL`, `levelForXp()`, `xpIntoLevel()`). Testing before declaring it done caught two further bugs beyond the one already known: a second stale usage of the renamed variable in the same function (real `ReferenceError`, caught on first live test), and `word-game-app.js`'s level label still trusting a cached `player.level` field instead of recomputing — caught by deliberately corrupting a test save to simulate an old pre-fix save. Both fixed and re-verified. Full 10-item live checklist passed (XP/level agreement across both screens, correct XP-per-quiz, persistence, progress bar math, level-unlock thresholds, coins unaffected, corrupted-save resilience, zero console errors, 161/161 tests).

Also: the local dev server needed restarting for this verification pass. Previously did this reflexively via a backgrounded Bash process without checking first — user stopped that. Going forward: ask before starting/restarting the local server rather than doing it automatically, and prefer the Browser pane's own server-launch mechanism when it's actually usable in this environment (it currently isn't, for this project, due to an unrelated project's `launch.json`/port binding).

**Standing principle adopted for the rest of Version 1.0** (user's explicit instruction, recorded here so it's not just tribal knowledge): whenever duplicated business logic is found — XP, coins, progression, unlock rules, scoring, etc. — consolidate it into a single canonical source before release, not after. Apply this proactively for the remaining blockers, not just reactively when a bug is reported.

### Files modified

- `learning-engine.js`, `word-game-app.js`, `app.js`, `tests/learning-engine.test.js`
- `docs/V1_RELEASE_CHECKLIST.md` (Blocker 3 entry + full phase restructure)

### Remaining blockers

Puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), branding/domain (9, mostly done), store assets (10), submission (11), plus Phases 3/4/5/8 from the restructure.

---

## 2026-07-21 (later) — Confirmed this Mac can never submit to the App Store; added FQ-APP-002 release standard doc

Researched step 1 of the user's own "what's next" plan (verify Xcode compatibility) before spending effort on steps 2-3 (free storage, install Xcode). Good thing — it changes the plan.

**Finding:** this machine is a `MacBookAir7,2` (2015/2017 MacBook Air). Apple's maximum supported macOS for that model is Monterey (12) — already what it's running; it cannot be upgraded to Ventura, Sonoma, or anything newer, period. macOS 12 caps at Xcode 14.2. Apple has required Xcode 26+ with the iOS 26 SDK for **all** new App Store submissions since 2026-04-28. That's four major Xcode versions beyond what this hardware can ever run. No amount of freed disk space or Xcode reinstallation changes this — it's a hardware ceiling. Real options: use a different/newer Mac for the build-archive-sign-submit step, or a cloud Mac CI service (Codemagic, Bitrise, GitHub Actions macOS runners, Xcode Cloud) — not yet decided which.

**New doc:** `docs/FQ-APP-002-native-build-release-standard.md`, per request — the durable, repeatable native-build/release process (separate from `V1_RELEASE_CHECKLIST.md`, which is the current-launch status tracker). Documents the constraint above, current toolchain versions (Node v24.18.0 via direct nodejs.org binary — not Homebrew, which fails on this OS — Capacitor 8.4.2, no CocoaPods needed), bundle identity, the `build-www.sh`/`cap sync` pipeline and why `ios/App/App/public/` is committed, signing/TestFlight/submission process (marked not-yet-established where true rather than guessed), a proposed version-numbering scheme, and a release checklist for 1.1/2.0 and beyond.

### Files modified

- New: `docs/FQ-APP-002-native-build-release-standard.md`
- Modified: `docs/V1_RELEASE_CHECKLIST.md` (Blocker 9b's Xcode-compatibility line updated from "needs checking" to the confirmed finding)

---

## 2026-07-21 — Native iOS app wrapper (Capacitor) scaffolded and branded

App Store submission was flagged as impossible before this: Apple requires a compiled binary, not a website/PWA, and this repo had zero native project. Wrapped the existing static site with Capacitor (no rewrite — thin native shell around what already exists).

### Environment problems hit and fixed

- No Node.js anywhere on this Mac. `brew install node` silently tried to compile from source (no Homebrew "bottle" for macOS 12 Monterey anymore) and **failed** after ~15 min: `Error: You are using macOS 12. We (and Apple) do not provide support for this old version.` The background-task notification said "exit code 0" — misleading, that was `tail`'s exit code from the `| tail -30` pipe, not `brew install`'s. Caught by reading the actual captured output rather than trusting the status summary.
- Fixed by downloading Node's official prebuilt binary directly from nodejs.org (queried their release API for the real current version rather than guessing one) into `~/.local/nodejs` — no compilation, no sudo, no system-wide install. Added to `~/.zshrc` PATH.

### What was built

- `package.json`, Capacitor 8.4.2 (`core`/`cli`/`ios`), `capacitor.config.json` (appId `com.finlitquest.app`, appName "FinLit Quest").
- `scripts/build-www.sh`: traced every file `index.html`/manifest actually reference and built a script that copies exactly those ~33 files (908K) into `www/` — deliberately not pointing Capacitor's `webDir` at the repo root, which would have shipped `.git`, `node_modules`, `tests/`, `docs/`, raw multi-MB brand source PNGs, and internal project docs inside the actual App Store binary. Verified the trimmed bundle live (served locally, loaded both the word-game and Credit workbook screens, zero console errors) before wiring it into Capacitor.
- `npx cap add ios` succeeded without Xcode installed (scaffolding only; building/signing needs Xcode). Uses Swift Package Manager, no CocoaPods needed.
- Replaced Capacitor's default app icon and splash screen with real branding: the prepared 1024×1024 App Store icon, and a new branded splash (transparent compass mark centered on the app's own navy background color, verified no hidden transparency by flattening to JPEG). Fixed the storyboard's white fallback background to navy too.
- `.gitignore`: `www/` excluded (regenerable), `ios/App/App/public/` (what Xcode actually builds from) committed so the project builds immediately after a fresh clone.

### Still blocked — needs the user, not more code

No Xcode installed, and macOS 12.7.6 may not support a current-enough Xcode version for Apple's present submission requirements (needs checking). Only ~9.8GB free disk space, likely insufficient for Xcode. Installing Xcode needs interactive Apple ID sign-in. Apple Developer Program enrollment status unknown. All of real device testing, signing, TestFlight, and submission are still ahead once Xcode exists.

### Files modified

- New: `package.json`, `package-lock.json`, `capacitor.config.json`, `scripts/build-www.sh`, `ios/` (native Xcode project)
- Modified: `.gitignore`

Full suite still 156/156 passing — no existing JS logic touched.

---

## 2026-07-20 (latest) — finlitquest.com confirmed live end-to-end; root cause was local DNS cache, not GoDaddy

Closes out the deployment from the entry below. GitHub's Pages settings UI showed a DNS check failure after the A records were added, which looked like a GoDaddy problem at first — it wasn't.

### Root cause

Not GoDaddy domain forwarding (user confirmed both domain and subdomain forwarding were off). The actual A records were correct the entire time, confirmed independently via `dig` against the local resolver, Google's 8.8.8.8, Cloudflare's 1.1.1.1, and GoDaddy's own authoritative nameserver — all four agreed on GitHub's IPs. The mismatch was that `curl`/browsers on the user's Mac don't consult `dig`'s resolution path — they go through macOS's `dscacheutil`/`mDNSResponder` cache, which had a stale entry (GoDaddy's old parking IP, `76.223.105.230`) cached from before the DNS records were fixed. Confirmed by forcing a direct connection to GitHub's real IP with `curl --resolve`, which worked immediately (valid Let's Encrypt cert, HTTP/2 200) — proving the server side was already correct and the fault was purely local-machine DNS caching.

### Fix

`sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` on the user's Mac. (First attempt got stuck at a `quote>` zsh prompt from pasting text containing an apostrophe — resolved with Ctrl+C, then typing the command directly instead of pasting.)

### Live verification

Loaded `https://finlitquest.com` for real in the browser: correct logo/branding in the header, a fresh player starts at 300 coins (economy fix confirmed live) and 0 XP, puzzle board and letter wheel render and are interactive, zero console errors. Fetched every brand asset (favicon.ico, both favicon PNGs, apple-touch-icon, icon-192/512, the OG image, manifest.webmanifest) directly from the live domain — all 200 OK. Enabled "Enforce HTTPS" on the GitHub Pages settings (was `false`, now `true` — couldn't be turned on earlier because it requires cert issuance to complete first, which happens automatically once DNS is verified). Confirmed plain `http://finlitquest.com` now 301-redirects to `https://`.

### Files modified

None (infrastructure-only: GitHub Pages HTTPS-enforcement setting, and the user's local machine DNS cache — no repo changes this entry).

### Remaining blockers

Unchanged: level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), store assets (10), submission (11). Branding/domain (9) is now fully live and verified.

---

## 2026-07-20 (latest) — Deployed to GitHub Pages / finlitquest.com

Moved the app off `localhost:8756` onto real hosting, per request.

### What happened

- **Git remote was misconfigured**: pointed at `cmmoore412-SYS/finlit-quest`, which the authenticated `gh`/git credentials (`drmoore412-sys`) had no access to (repo not found). Confirmed with the user this was simply the wrong account and fixed the remote to `https://github.com/drmoore412-sys/finlit-quest.git`, an existing private repo with only GitHub's default scaffolding (`.gitignore`, 14-byte `README.md`) — no real content to lose.
- **First real commit of the session's work**: this repo had exactly one prior commit ("Establish verified FinLit Quest baseline") and 75 files' worth of changes had never been committed. Reviewed the full diff for secrets before staging (none found) and committed everything in one commit, then merged in the remote's unrelated scaffolding history with `--allow-unrelated-histories` (non-destructive — no force-push used anywhere). Resolved one `.gitignore` merge conflict by combining both versions (kept the project-specific entries — `.DS_Store`, `*.zip` — alongside the remote's generic Node template).
- **Push initially failed** (`RPC failed; HTTP 400`) — the push payload (~7.7MB, mostly the brand PNG assets) exceeded git's default HTTP post buffer. Fixed with `git config http.postBuffer 524288000` and retried successfully.
- **Added `CNAME`** (containing `finlitquest.com`) to the repo root — required by GitHub Pages to serve a custom domain.
- **GitHub Pages initially failed to enable**: "current plan does not support GitHub Pages for this repository" — private repos require a paid GitHub plan for Pages. Presented the three real options (make public / switch to a host that supports private-repo deploys / upgrade to GitHub Pro) rather than picking one — user chose to make the repo public. Changed visibility, then enabled Pages (branch `main`, path `/`).
- **Verified the deployment is actually live**: build status went to `"built"`, and the fallback `https://drmoore412-sys.github.io/finlit-quest/` URL now 301/308-redirects to `https://finlitquest.com/` — proof the site built and the custom domain is correctly wired on GitHub's side.

### What's still needed (cannot be done from here — requires the user's domain registrar access)

`finlitquest.com` will not actually resolve to the new site until DNS is updated at wherever the domain is registered. Required records:

**Apex domain (`finlitquest.com`)** — four A records:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```
Optional IPv6 (AAAA records), if the registrar supports them:
```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**`www.finlitquest.com`** (optional, only if a `www` version should also work) — one CNAME record:
```
www → drmoore412-sys.github.io
```

Once DNS propagates (usually minutes, sometimes up to ~24–48h) and GitHub verifies the domain, HTTPS certificate issuance is automatic — `https_enforced` should then be flipped on (currently `false`; not done yet since the cert isn't issued until DNS is live).

### Files modified

- `.git` remote config (not a tracked file)
- `.gitignore` (merge-resolved), `CNAME` (new), `README.md` (from remote scaffolding)
- Everything else: the full session's accumulated, previously-uncommitted work (see the single commit `1527bab` for the complete file list)

### Remaining blockers

Unchanged, unrelated to this deployment step: level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), store assets (10), submission (11). Branding (9) is otherwise complete pending native app project / store listing infrastructure.

---

## 2026-07-20 (latest) — Blocker 9: transparent logo variant supplied and integrated

Closes the one open quality gap from the previous entry. User supplied `FinLit_Quest_Icon_Mark_transparent.png` (1254×1254, `hasAlpha: yes`) to `assets/brand/source/`.

**Verified it was real transparency, not just an RGBA file with alpha=255 everywhere:** flattened it to JPEG with `sips` (JPEG has no alpha channel, so sips must composite onto something) and confirmed the outer square corners turned white (sips' default fill) while the inner navy disc/gold ring/needle stayed intact — a genuine circular cutout. (A hand-rolled PNG pixel reader tried first gave inconsistent alpha readings — its naive scanline decode doesn't implement PNG's per-row filter reconstruction, so it's unreliable for anything beyond rough RGB sampling; discarded in favor of the sips-flatten test, which uses a real, trustworthy system API.)

Regenerated `favicon-16.png`, `favicon-32.png`, `favicon.ico`, and the in-app header logo (`wg-logo-96.png`) from the transparent source — the three places where not knowing the surrounding background color actually matters. Left the Apple/PWA app icons (apple-touch-icon, icon-192, icon-512, icon-1024-appstore) generated from the opaque master, since app icons are supposed to be opaque (already flagged in the Blocker 9 checklist entry itself).

### Live verification

Dev server picked up the regenerated files (fetched all four new files from the live page — 200 OK). Header logo screenshot unchanged (expected — the app background is navy already, so this is a correctness/future-proofing fix, not a visible regression fix). Zero console errors. Full suite still 156/156 (asset-only change, no JS logic touched).

### Files modified

- `assets/brand/source/FinLit_Quest_Icon_Mark_transparent.png` (new, user-supplied)
- `assets/brand/favicon/favicon-16.png`, `favicon-32.png`, `favicon.ico`, `assets/brand/web/wg-logo-96.png` (regenerated)
- `docs/V1_RELEASE_CHECKLIST.md`

### Remaining blockers

Unchanged from the previous entry except this one item is now closed: native app project (needed for §5/§6), a store listing (needed for §7, → Blocker 10), real-device verification. Also still open, unrelated to branding: level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), store assets (10), submission (11).

---

## 2026-07-20 (latest) — Blocker 9 (Branding and Domain Integration): web-facing branding implemented

User confirmed the two open questions from the plan-only entry below: finlitquest.com = this app (dev at `localhost:8756`), and supplied the approved logo assets directly (three PNGs, saved to `assets/brand/source/` — full lockup + compass "Q" icon mark + a pre-sized 1024×1024 App Store copy of the mark). No SVG source, no transparent variant — both noted, neither blocking.

### What changed

- **Favicon**: generated `favicon-16.png`, `favicon-32.png`, `apple-touch-icon-180.png`, `icon-192.png`, `icon-512.png` from the icon mark via `sips` (macOS built-in; no ImageMagick/Pillow available). `sips` can't emit `.ico`, so built one with a small stdlib-only script (`assets/brand/build-favicon-ico.py`) that packs the PNGs into a real PNG-in-ICO container — verified with `file` as a genuine 2-image Windows icon resource. Added proper `<link rel="icon">` / `apple-touch-icon` / `manifest` tags to `index.html`'s `<head>` (previously had none at all — no favicon, no manifest, no OG tags, no theme-color).
- **In-app logo**: `.wg-brand`'s emoji placeholder (🧭) on the shared Crypto/Credit header, replaced with the real compass mark as a clickable, circular, alt-texted `<img>` that now genuinely navigates home (`showDashboard()`) — it did nothing before.
- **Manifest**: new `manifest.webmanifest` — name/short_name/start_url/display/theme_color/background_color, 192 + 512 icons, plus a proper maskable 512 icon built with the mark safe-zoned to 67% and padded with its own background color so circular/squircle/rounded OS masks don't clip it.
- **Social/sharing**: Open Graph + Twitter Card tags, `apple-mobile-web-app-title`, `theme-color`. Built a 1200×630 OG image from the full lockup, padding it onto a canvas color-matched to the logo's own (slightly different from the icon mark's) background tone — caught and fixed a visible seam by sampling actual pixels instead of assuming a shared color.

### Explicitly blocked, not silently skipped

- **Native Apple/Android app icon catalogs** (spec §5/§6): this repo has no native app project at all (no Xcode project, no Capacitor/Cordova/Gradle) — nowhere to install a native icon set until that wrapper exists.
- **Store listing assets** (§7): no App Store Connect/Play Console access, no listing built yet — deferred to Blocker 10.
- **Real-device verification** (§10): only verified in this environment's Browser pane (Chromium-based) — real Safari/Android Chrome/TestFlight/Android builds need actual devices/tooling not available here.

### Live verification

Browser pane, `http://localhost:8756`: logo renders in the header on both Crypto and Credit (same shared element, confirmed structurally). Clicking it navigates to the dashboard. Fetched every new asset (`favicon.ico`, both favicon PNGs, apple-touch-icon, icon-192/512/512-maskable, the OG image, the manifest) directly from the live page — all 200 OK. Manifest serves `application/manifest+json`. Zero console errors, zero 404s in the network log. Full test suite still 156/156 (no JS logic touched, HTML/CSS/asset changes only).

### Files modified / added

- `index.html` (head metadata), `word-game.css` (`.wg-logo`), `word-game-app.js` (click handler)
- `manifest.webmanifest` (new)
- `assets/brand/source/*.png` (user-supplied, not previously in the repo), `assets/brand/favicon/*`, `assets/brand/icons/*`, `assets/brand/web/*`, `assets/brand/build-favicon-ico.py` (all new)
- `docs/V1_RELEASE_CHECKLIST.md`

### Remaining blockers

Native app project (needed for §5/§6), a store listing (needed for §7, → Blocker 10), real-device verification, and optionally a transparent-background logo variant if ever needed on a non-navy surface. Everything else in this session's plan is unchanged: level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), store assets (10), submission (11).

---

## 2026-07-20 (latest) — Added Blocker 9: Branding and Domain Integration to the V1.0 plan

Planning-only entry — no code changed. Per instruction, added a new release blocker (full spec in `docs/V1_RELEASE_CHECKLIST.md` → Blocker 9) covering favicon, website/app logo placement, web app manifest, Apple/Google Play icon branding, store listing assets, and social-sharing metadata. Positioned before store-assets (renumbered 9→10) and submission (10→11), as instructed.

**Pre-flight check before recording it as ready to start:** searched the repo for any existing logo/favicon/icon/manifest file — none exist. `index.html` has no favicon link, manifest link, apple-touch-icon, or Open Graph/theme-color meta tags at all. This blocker cannot begin execution (not even §1, favicon generation) without a master logo source file, which isn't in this codebase today. Also flagged, not assumed: the spec describes "finlitquest.com" (website nav/footer/sign-in) and "the game application" (§2 vs §3) as if they're two different surfaces, but this repo contains only the one static game app — no separate marketing site. Whether finlitquest.com is this app or a different, not-yet-available repository needs clarifying before real work starts.

### Files modified

- `docs/V1_RELEASE_CHECKLIST.md` (Blocker 9 added, Phase 6 cross-referenced, blocker numbering updated)

### Remaining blockers

Level progression (3), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8), **branding and domain integration (9 — blocked on a missing master logo asset and an open question about finlitquest.com)**, store assets and metadata (10), submission (11).

---

## 2026-07-20 (latest) — Blocker 2 (XP system) verified

**Scope confirmed:** "Credit World" for V1.0 = the completed Credit Foundations content only. Credit Cards / Interest & Borrowing / Credit Reports / Building Credit / other unfinished chapters stay frozen and must remain locked/hidden from users — verified live that this is already true today (the 7 unbuilt Credit journey nodes are dynamically disabled by `updateDashboard()`, unclickable).

**Verification finding:** no live XP-earning bug. Every awarding path (workbook pass, SM-2 review, word-game puzzle solve) was already correct — once per event, never on fail/incomplete, accumulating on one shared `player.xp` independent of world state. One real gap fixed: `normalizeSave` never validated a loaded `player.xp`, so a corrupted/tampered save (`NaN`, string, negative) would load as-is and compound forever. Added `sanitizeXp()` in `learning-engine.js`.

**Two findings logged but explicitly not fixed this pass** (per instruction to stay XP-only): (1) a real level-formula inconsistency — the Credit World journey screen computes level as `xp÷100` while everywhere else uses `xp÷250`, reproduced live (xp=100 shows level 2 on one screen, level 1 everywhere else) — handed to Blocker 3. (2) `app.js`'s original Crypto crossword screen and its independent `learning.review()`-based XP path are dead code — confirmed via static analysis and a live click test to be completely unreachable from any current UI trigger — flagged for removal in Phase 4 (Bug Sweep) as a latent duplicate-XP-path risk, not touched now.

### Changes made

- `learning-engine.js`: added `sanitizeXp()`, applied in `normalizeSave`.

### Tests added

9 new tests in `tests/learning-engine.test.js`: new player starts at 0 XP; corrupted xp sanitizes to 0 (NaN/string/negative/missing); a valid value including 0 is preserved; XP awarded exactly once per workbook pass and not duplicated by retry; failed attempts award 0; XP from different activity types accumulates on the shared balance; XP survives a world switch; reload preserves XP; XP stays finite/non-negative across mixed activities. Full suite: 156/156 passing.

### Live verification

Real clicks/UI functions throughout, `http://localhost:8756`: completed a fresh CRF-002 quiz (8/8) — XP went 100→200 correctly. Reloaded — stayed 200. Retried the same completed quiz — stayed 200, no duplicate. Solved a real Crypto word ("PEER") via the actual wheel-selection handlers — XP went 200→206, exactly matching the `Math.round(4×1.5)=6` formula. Switched Credit↔Crypto — same 206 both times. Relaunched — 206 persisted in the engine and in localStorage. Zero console errors.

### Files modified

- `learning-engine.js`, `tests/learning-engine.test.js`
- `docs/V1_RELEASE_CHECKLIST.md`

### Remaining blockers

Level progression (3, with the ÷100-vs-÷250 bug already queued), puzzle progression (4), save/load persistence (5), Crypto e2e (6), Credit e2e (7), bug sweep/performance (8, with the dead-legacy-code removal queued), store assets (9), submission (10).

---

## 2026-07-20 (latest) — Version 1.0 launch plan adopted; Blocker 1 (Score system) verified

**Mission change:** development on new features/worlds/modes is frozen. From here forward, all work targets Version 1.0 App Store/Google Play submission: Crypto World, Credit World, and the existing word-wheel/crossword game only. Full plan, phase checklist, and per-blocker log now live in `docs/V1_RELEASE_CHECKLIST.md` (updated after every blocker). Old task-list items for future worlds/content (Credit Cards world, etc.) were removed — flagged as an assumption pending confirmation: "Credit World" is read as *today's* Credit Foundations content, not the still-locked future Credit World modules (Credit Cards, Interest & Borrowing, Credit Reports, Identity Protection, Loans & Offers), since the plan's phases are entirely verification/bugfix/store-prep with no content-authoring phase.

### Blocker 1 — Score system — Verified

No functional bug found in `scoreQuiz` (percent/pass-fail math, XP-award-once, bestScorePercent-as-max were already correct and tested). Real gap: the on-screen quiz-position → per-type-answer-index mapping was duplicated inline in `workbook-app.js`'s `wbAnswerMc`/`wbAnswerTf`, with no automated coverage (DOM-coupled file, not requireable in Node) despite sitting directly on the "answered correctly" → "scored correctly" path. Extracted to a pure `answerPositionForType(quizQuestions, index, type)` in `src/workbook-engine.js`; both call sites now use it, no behavior change. Added a unit test plus a full simulated-quiz-walk test against real CRF-001 content (147/147 suite passing). Live-verified with real clicks in the browser: a real CRF-001 attempt (7/8, one deliberate wrong answer) scored and displayed correctly with the right question flagged and exactly +100 XP awarded once; a subsequent deliberately-bad retry (1/8) left XP, completion status, and best score untouched. No console errors. Full writeup: `docs/V1_RELEASE_CHECKLIST.md` → Blocker Log → Blocker 1.

### Files modified

- `src/workbook-engine.js`, `workbook-app.js`, `tests/workbook-engine.test.js`
- `docs/V1_RELEASE_CHECKLIST.md` (new)

### Remaining blockers

XP calculations, level progression, puzzle progression, save/load persistence, Crypto e2e, Credit e2e, bug sweep/performance, store assets, submission — see the checklist doc. Awaiting go-ahead before starting the next blocker.

---

## 2026-07-20 (latest) — Fix starting coins and hint purchase logic (single-source-of-truth economy)

### Root cause

The literal `300` (the full word-and-definition reveal cost) was hardcoded **independently in two places**: `learning-engine.js`'s `playerDefaults()` (a new player's starting `coins`) and `word-game-app.js`'s `WG_FULL_REVEAL_COST` constant. They agreed only by coincidence — nothing tied them together, so a future change to one without the other would silently reproduce the exact symptom this ticket described (a new player starting with a balance that can't afford a single full reveal). Traced the full lifecycle (`playerDefaults` → `createSave`/`normalizeSave` → `LearningEngine` constructor → persisted save → `wgUpdateHeader` display) and confirmed migration for saves missing the `coins` field, and preservation of an existing balance (including an explicit `0`) for returning players, were already correct — the real defect was architectural (duplicated constant, duplicated purchase-deduction logic in `wgHint`/`wgRevealFull`), not a live zero-balance bug in current save-handling code.

### What changed

- **`learning-engine.js`**: added `DEFAULT_FULL_REVEAL_COST` (the one literal `300` in the codebase) and `buildEconomyConfig(fullRevealCost)` → `{fullRevealCost, startingCoins}`, with `startingCoins` always derived from `fullRevealCost` so they cannot drift apart. `DEFAULT_ECONOMY_CONFIG` is the frozen default instance, exported alongside the existing `DEFAULT_MASTERY_CONFIG`. `playerDefaults()` now sets `coins: DEFAULT_ECONOMY_CONFIG.startingCoins` instead of a bare literal. Added `LearningEngine.spendCoins(cost)` — checks the balance, deducts exactly once, persists immediately, returns `false` (no mutation) if insufficient — as the one shared implementation of "confirm balance sufficient / deduct exact cost once / persist immediately / never go negative."
- **`word-game-app.js`**: `WG_FULL_REVEAL_COST` now reads `FinLitLearning.DEFAULT_ECONOMY_CONFIG.fullRevealCost` instead of its own literal `300`. `wgHint()` and `wgRevealFull()` now call `learning.spendCoins(cost)` instead of each repeating its own balance-check-then-deduct-then-persist block. Behavior is unchanged (same checks, same order, same toasts) — this is a de-duplication, not a logic change. `WG_LETTER_HINT_COST` (100, unrelated) was left untouched.

### Verified

- 11 new tests in `tests/learning-engine.test.js` (full suite 145/145): brand-new player starts at `fullRevealCost` (not zero); `startingCoins`/`fullRevealCost` cannot be configured independently; changing the configured cost changes the derived starting balance (`buildEconomyConfig`); `spendCoins` deducts the exact cost once and persists immediately; refuses and mutates nothing when insufficient; never goes negative; is reused identically for both the hint and full-reveal costs; a reload from the same storage preserves a spent-down balance rather than resetting it; player coins are architecturally separate from any `save.worlds[...]` state, so switching worlds can't reset or duplicate them; an explicit `0` balance is not bumped up just because it's zero (only a genuinely missing field is migrated).
- **Live end-to-end in the real app**, not just unit tests: cleared the test save, launched fresh — coin balance showed **300**, matching the "Reveal (300)" button exactly. Purchased the full reveal on a live Crypto puzzle — word ("Mint") and its full definition both revealed, balance dropped to exactly **0** in one deduction. Reloaded — balance stayed at 0 (no reset). Switched to the Credit word game (`wgOpenWorld("credit")`, same entry point `#workbookPlayGameButton` uses) — same shared 0 balance, no duplication. Attempted another full reveal at 0 coins — correctly refused, no deduction, no reveal, balance stayed at 0, no console errors. Relaunched once more — balance still 0, confirming a returning player is never reset to the starting amount.

### Files modified

- `learning-engine.js`, `word-game-app.js`
- `tests/learning-engine.test.js`

### Known issues / recommended next steps

- None outstanding for this fix. `WG_LETTER_HINT_COST` and all other reward values were deliberately left untouched, per scope.

---

## 2026-07-20 (later) — Early-lesson puzzle eligibility fix: lesson-targeted generation + single-term puzzles

### Background

Follow-up to the Puzzle Generator Pipeline entry directly below. A post-implementation sanity check found CRF-001 and CRF-002 had **0 eligible puzzles** in the generated Credit bank despite the Concept Filter working correctly. Investigated first (see `docs/CRF_EARLY_LESSON_ELIGIBILITY_INVESTIGATION.md`, research-only, no code changed) before implementing anything, per explicit instruction. Root cause: the 9-letter wheel budget eliminates almost every combination within a small early-lesson vocabulary (only 1 of 6 possible CRF-001 word pairs fits; `OBLIGATION` alone is 10 letters and structurally can't appear in *any* puzzle), and generation drew from the full 38-word world vocabulary with no lesson-awareness, so the one valid combination essentially never got produced by chance. The Concept Filter, crossword layout, and validation rules were all confirmed correct — the gap was in generation targeting.

### What changed

Per explicit scope: backend pipeline only — no UI, no live-gameplay wiring, no raising the 9-letter wheel budget, no weakening of existing validation rules.

- **`src/puzzle-generator.js`**: `generateCandidate` gained a `mode` option (`"multi-term"`, default, unchanged behavior vs. `"single-term"`, exactly one required word pinned via `focusWord`) and a `bonusVocabulary` option so bonus-word detection can scan the full world vocabulary even when the required-word pool is restricted to a lesson's allowlist.
- **`src/puzzle-validator.js`**: `wordCountInRange` is now `puzzleMode`-aware — a `"single-term"` puzzle is legitimate at exactly 1 word; every other shape (including legacy records with no mode set) keeps the original `[2,5]` rule exactly as before. Added a `puzzleModeValid` check. `assemblePuzzle` now attaches `puzzleMode`, `eligibleLessonIds` (denormalized, computed from tags + the full lesson-allowlist map), and `sourceGenerationScope` (`{type:"world"}` or `{type:"lesson", lessonId}`).
- **`src/puzzle-pipeline-service.js`**: new `generateLessonPuzzles(worldVocabulary, worldId, lessonId, allowedTags, count, deps, options)` — restricts the required/focus-word pool to the lesson's cumulative allowlist (instead of the whole world), generates multi-term puzzles first, fills any remaining shortfall with single-term puzzles, counts already-eligible bank puzzles toward the target before generating anything new (making it idempotent), and never fabricates a duplicate content signature to hit the requested count — a genuine shortfall comes back as a structured `warnings` entry instead. New `detectUnplayableTerms` (flags vocabulary words whose wheel size alone exceeds the budget) and `computeEligibleLessons` (per-puzzle companion to `filterBankByTags`).
- **`scripts/generate-puzzle-bank.mjs`**: three new modes alongside the existing `--size` world-level mode — `--lesson=<id> --count=<n>` (single lesson), `--through=<id> --count-per-lesson=<n>` (every lesson up to and including the given one), `--all-lessons --count-per-lesson=<n>` (the whole curriculum). Lesson-targeted runs write/merge `content/puzzle-banks/<world>-unplayable-terms.json`.
- **`scripts/regenerate-puzzle.mjs`**: now respects the target puzzle's `puzzleMode`, and for a lesson-scoped puzzle regenerates from that same restricted lesson vocabulary (not the whole world) so a replacement can't silently pull in vocabulary the lesson hasn't unlocked.

### Verified

- 19 new tests (`tests/puzzle-lesson-generation.test.js`); full suite 135/135 passing.
- Ran the CLI for real against the live Credit Foundations curriculum, not just unit tests:
  - `--through=CRF-005 --count-per-lesson=10`: **CRF-001 reached 4/10** (1 multi-term `CREDIT`+`TERMS` — the only pair that fits the wheel budget — plus 3 single-term `CREDIT`/`TERMS`/`ACCOUNT`; shortfall of 6 reported explicitly, `OBLIGATION` flagged unplayable). **CRF-002 reached 7/10** (CRF-001's puzzles carried forward automatically via the cumulative allowlist, plus 3 new single-term puzzles; `OBLIGATION` and `AFFORDABILITY` flagged unplayable). **CRF-003 (11/10), CRF-004 (14/10), CRF-005 (24/10) all met the 10-puzzle target** with real, non-duplicated content.
  - `--all-lessons --count-per-lesson=8` across all 15 CRF workbooks: CRF-003 onward all hit target, with CRF-004+ needing **zero new generation** — earlier lessons' puzzles already covered them, confirming cumulative reuse works across the whole curriculum.
  - Re-ran the identical `--through=CRF-005` command a second time: every lesson reported `0 new`, confirming idempotency live, including the two genuinely-short lessons (the shortfall didn't change or get papered over on a second pass).
  - Regenerated a lesson-scoped single-term puzzle (`CREDIT-P0053`); confirmed `puzzleMode` and `sourceGenerationScope` survived correctly; bank re-validated 58/58 clean.
  - Every bank produced in this pass validated 100% — no invalid puzzle was ever written to disk.

### Files modified

- `src/puzzle-generator.js`, `src/puzzle-validator.js`, `src/puzzle-pipeline-service.js`
- `scripts/generate-puzzle-bank.mjs`, `scripts/regenerate-puzzle.mjs`, `scripts/puzzle-cli-shared.mjs` (new `loadLessonAllowlists`, `defaultUnplayableReportPath`, `mergeUnplayableReport` helpers)
- `tests/puzzle-lesson-generation.test.js`
- `docs/PUZZLE_GENERATOR_PIPELINE.md` (§5a added; §3, §4, §8, §11 updated; new Implementation status entry)
- `docs/CRF_EARLY_LESSON_ELIGIBILITY_INVESTIGATION.md` (resolution pointer added at top; original research preserved)
- `content/puzzle-banks/credit-puzzle-bank.json` (regenerated, 58 puzzles), `content/puzzle-banks/credit-unplayable-terms.json` (new)

### Known issues / recommended next steps

- CRF-001 (4/10) and CRF-002 (7/10) remain genuinely short of the 10-puzzle target — this is the real combinatorial ceiling of their vocabulary under the current 9-letter wheel budget, not a bug. Options for a future decision (not made here): raise the wheel budget (needs a UI check on the letter-wheel widget first), grow Credit's early-lesson vocabulary, or accept a lower `requiredPuzzles` target for the earliest lessons specifically.
- `OBLIGATION`, `AFFORDABILITY`, `UNDERWRITING`, `DISBURSEMENT` are flagged unplayable under the current budget across every lesson that unlocks them — same open question as above.
- Still not wired into live gameplay (`word-game-app.js` still uses the simpler `puzzle-bank-engine.js` random-word banks) and no admin UI — both deliberately out of scope for this pass.

---

## 2026-07-20 — Puzzle Generator Pipeline: backend content-generation infrastructure (Phase 1 = Engine, CLI only)

### What changed and what didn't

Per explicit scope: no UI redesign, no gameplay changes, no wiring into `word-game-app.js` or any live screen. This is backend content-generation infrastructure — CLI-only this phase, with services architected UI-agnostic so a future web Admin Console can reuse the exact same generation/validation logic later without a refactor (Phase 1 = Engine, Phase 2 = Admin Console, deferred).

### The core model: world-scoped Knowledge Graph, not per-lesson banks

Direction settled during architecture review (full design in `docs/PUZZLE_GENERATOR_PIPELINE.md`): a **world-scoped Puzzle Bank** backed by a **world-scoped Knowledge Base** (all vocabulary for that world). Lessons do not own puzzle banks — they define which concepts (tags) are unlocked, cumulatively, matching the existing sequential workbook unlock order. Puzzle eligibility for a lesson = every tag on the puzzle is within that lesson's allowed set. This resolves the scaling tension a per-lesson model would hit (a 5-term lesson can't support 150 distinct puzzles on its own) without changing the selection/anti-repetition logic already proven in `puzzle-bank-engine.js`.

### New pure logic modules

- `src/puzzle-generator.js` — `generateCandidate(vocabulary, shuffleFn, wheelForFn, canFormFn, options)`: extends the existing greedy word-selection with optional focus-word pinning and bonus-word detection (via the existing `canForm`).
- `src/difficulty-scorer.js` — `scoreDifficulty(candidate)`: deterministic 0–100 composite score (wheel size, rare letters, avg word length, bonus count, focus word length) → Easy/Medium/Hard/Expert.
- `src/hint-generator.js` — `generateHint(candidate, strategy)`: pluggable strategy, default `"definition-clause"`; written so an LLM-backed strategy is a drop-in replacement later.
- `src/puzzle-validator.js` — `validatePuzzle`/`assemblePuzzle`: 10 named checks (`focusWordExists`, `everyRequiredWordBuildable`, `noImpossibleBonusWords`, `crosswordPlaceable`, `wordCountInRange`, `wheelWithinBudget`, `noDuplicateId`, `difficultyAssigned`, `definitionPresent`, `hintPresent`) returning `{valid, errors[]}`; assembler attaches world-scoped id/tags/timestamps.
- `src/puzzle-pipeline-service.js` — `generatePuzzleBank` (orchestrates the above into a retry-until-full bank-building loop, reusing `puzzleId` from `puzzle-bank-engine.js` for content dedup), `filterBankByTags` (the Concept Filter stage), `deriveCumulativeAllowlists` (derives each Credit workbook's cumulative allowed-concept list directly from `curriculum/credit/approved/runtime/credit-foundations.json` — no new authoring needed).
- `src/puzzle-bank-migration.js` — `migrateLegacyBank`: non-destructive backfill of pre-pipeline `{id, words, letters}` bank entries to the full schema, matching the save-version backfill pattern already used in `learning-engine.js`.

### CLI tooling (thin wrappers, no business logic in the scripts themselves)

- `scripts/generate-puzzle-bank.mjs --world=<id> --size=<n>` (top-up semantics)
- `scripts/validate-puzzle-bank.mjs <file>`
- `scripts/regenerate-puzzle.mjs <file> <puzzleId>`
- `scripts/puzzle-cli-shared.mjs` (argv parsing, vocabulary loading, dependency wiring shared by all three)

### Verified

- 116/116 automated tests pass (27 new, `tests/puzzle-pipeline.test.js`), including an integration test against the real Credit Foundations curriculum file.
- Ran the CLI for real, not just unit tests: generated a 40-puzzle Crypto bank (40/40) and a 60-puzzle Credit bank (**51/60**, with an explicit warning rather than a silent short bank — Credit's 38-term Knowledge Base genuinely tops out there today; growing it further is a content task, not an engineering one). Validated both banks at 100%. Re-ran generation at the same size on top of the existing bank and confirmed idempotent top-up (`0 new`). Regenerated a single puzzle in place and re-validated the bank clean. Sanity-checked the Concept Filter against the real bank + derived allowlists: CRF-001/002 had 0 eligible puzzles out of 51 (too few unlocked concepts yet), CRF-005 had 17 — eligible count grows monotonically as designed.

### Files created

- `src/puzzle-generator.js`, `src/difficulty-scorer.js`, `src/hint-generator.js`, `src/puzzle-validator.js`, `src/puzzle-pipeline-service.js`, `src/puzzle-bank-migration.js`
- `scripts/generate-puzzle-bank.mjs`, `scripts/validate-puzzle-bank.mjs`, `scripts/regenerate-puzzle.mjs`, `scripts/puzzle-cli-shared.mjs`
- `tests/puzzle-pipeline.test.js`
- `docs/PUZZLE_GENERATOR_PIPELINE.md` (architecture doc)
- `content/puzzle-banks/crypto-puzzle-bank.json`, `content/puzzle-banks/credit-puzzle-bank.json` (generated output, not hand-authored)

### Known issues / recommended next steps

- Credit's Knowledge Base (38 terms) caps its bank around ~51 puzzles at default generation settings; growing it means adding more Credit vocabulary, not changing the pipeline.
- Not wired into live gameplay yet by design — `word-game-app.js` still uses `puzzle-bank-engine.js`'s simpler random-word banks. Wiring the Knowledge-Graph-aware bank + Concept Filter into the live playthrough selector is future work, not started.
- No Admin Console UI yet (deliberately deferred to Phase 2); today's only interface is the three CLI scripts.

---

## 2026-07-19 — Configurable playthrough size (requiredPuzzles), not just bank size

### What changed

Small, contained change on top of the Puzzle Bank work above: the "5" in "select 5 from the bank" was the one remaining hardcoded number. `src/puzzle-bank-engine.js`'s `selectPlaythrough(bank, history, lastPlaythrough, count, shuffleFn)` already took `count` as a parameter (already proven configurable in the prior entry's tests) — the only actual hardcoding was the call site in `word-game-app.js`, a module-level `WG_PLAYTHROUGH_SIZE = 5` constant used for every world. Replaced it with a per-world `requiredPuzzles` field (alongside the existing `bankSize`), so `{bankSize:10, requiredPuzzles:5}`, `{bankSize:20, requiredPuzzles:8}`, `{bankSize:50, requiredPuzzles:10}` etc. are all just world config now, no engine changes needed between them. `WG_DEFAULT_REQUIRED_PUZZLES`/`WG_DEFAULT_BANK_SIZE` exist only as fallbacks for a world config that omits the fields, not as assumptions baked into the selection logic itself.

No UI, gameplay, or word-wheel/crossword mechanic changes — both existing worlds keep `requiredPuzzles: 5` so behavior is identical to before this change.

### Files modified

- `word-game-app.js` (`requiredPuzzles` added to both world configs; `WG_PLAYTHROUGH_SIZE` constant removed in favor of per-world lookup)
- `tests/puzzle-bank-engine.test.js` (new `makeVocab(n)` synthetic-vocabulary generator so bank sizes larger than Crypto/Credit's real vocabularies — 50, 150 — are actually reachable in tests; 7 new tests)

### Verified

- 90/90 automated tests pass (7 new): parameterized over the spec's exact configuration examples — (10,5), (15,5), (20,8), (50,10), (150,15) — each proving the bank reaches the requested size and the playthrough selects exactly `requiredPuzzles` unique puzzles; a test proving two different worlds can use different `requiredPuzzles` values independently in the same run; a test proving the ≤2-overlap anti-repetition rule still holds at a non-default `requiredPuzzles` value (8).
- Live-verified in the real app: default worlds still produce a 10-puzzle bank / 5-puzzle playthrough exactly as before (cleared save, checked directly) — no console errors, screenshot confirms zero visual change. Then live-reconfigured the Crypto world in-session to `{bankSize:20, requiredPuzzles:8}` and confirmed the running app actually built a 20-puzzle bank and selected an 8-puzzle playthrough with no code changes, before restoring the defaults.

---

## 2026-07-19 — Puzzle Bank: configurable pool of puzzles per world with anti-repetition selection

### What changed and what didn't

Per the user's explicit scope: no UI redesign, no new gameplay mechanics, the existing letter-wheel/crossword screen is untouched pixel-for-pixel. The only change is *where puzzles come from*. Previously every puzzle was generated fully at random from the whole vocabulary the instant one was needed — no memory of what had been played. Now each world keeps a persisted **bank** of candidate puzzles (default 10, configurable per world via `WG_WORLDS[x].bankSize`, verified working at 10/15/20 with no code changes), and each 5-puzzle "playthrough" draws from that bank using anti-repetition rules instead of pure randomness.

### New pure logic module

`src/puzzle-bank-engine.js` (Node-testable, no DOM/browser dependency, matching the project's established pattern):
- `buildBank(vocabulary, size, shuffleFn, wheelForFn, existingBank)` — tops up a bank to the requested size using the same greedy word-combination algorithm the engine already used for one-off generation, deduping by a stable `puzzleId` (sorted word list). Existing entries are preserved, not discarded, when growing a bank.
- `selectPlaythrough(bank, history, lastPlaythrough, count, shuffleFn)` — never-played puzzles first (shuffled), then least-recently-played; defers (doesn't drop) candidates that would push overlap with the previous playthrough above 2, falling back to them only if the bank is too small to avoid it; final order shuffled. No history at all reduces to a plain random pick, satisfying the stated fallback rule for free rather than as a special case.
- `recordPlaythrough(history, playedIds, now)` — pure update, used per-puzzle immediately on completion (not batched to end-of-playthrough) so history stays accurate even if a session is abandoned mid-playthrough.

### Wiring into the existing engine

`word-game-app.js`: `wgOpenWorld` now calls `wgStartPlaythrough()` (build/load bank → select 5 → load round 1) instead of generating one puzzle. `wgFoundWord` records that puzzle's history the moment it's completed. `wgContinueAfterComplete` (the existing "Next Puzzle" button handler, unchanged UI) advances to the next round if more remain, or — on the 5th — records `lastPlaythrough` and starts a fresh playthrough selection. Bank/history/last-playthrough persist per world under the same `learning.save.worlds["wg-crypto"]` / `["wg-credit"]` objects already used for cumulative words-solved tracking.

### Files created

- `src/puzzle-bank-engine.js`
- `tests/puzzle-bank-engine.test.js` (10 tests: id stability, bank sizing at 10/15/20, bank top-up preserving existing entries, no-history random fallback, never-played priority, least-recently-played ordering, ≤2-overlap avoidance, graceful fallback when the bank is too small to avoid overlap, history recording)

### Files modified

- `word-game-app.js` (bank/playthrough state and selection, replacing per-call random generation)
- `index.html` (new script tag only — no markup changes)

### Verified

- 83/83 automated tests pass (10 new).
- Live-verified with a cleared save end to end: bank of 10 built on first open; playthrough of 5 unique puzzles selected; played all 5 rounds for real (each showing the existing completion screen, unchanged) and confirmed per-puzzle history recorded correctly (`timesPlayed`, distinct `lastPlayedAt`) immediately on each round's completion; second playthrough automatically drew the *other* 5 never-played bank entries with zero overlap; third playthrough (once all 10 had been played once) correctly rotated back to the least-recently-played half with zero overlap against the immediately preceding playthrough; confirmed bank/history/lastPlaythrough all survive a full page reload; confirmed the Credit world builds and selects from its own independent bank. No console errors, no visual differences from before.

### Completed work

- Split the two hint buttons apart, as requested — they were both wired to the same single-letter reveal: side wheel button (💡100) still reveals one letter; new bottom-nav button now reveals the full word + definition for 300 coins (`WG_FULL_REVEAL_COST`), tracked per-word via `wgState.revealed` so it can't be re-charged on the same word.
- Mission card no longer gives the answer away for free: shows the blank hint-pattern and a "tap Hint to reveal" placeholder by default, the real word/definition only after the full-reveal hint is used (or the word is solved). Naturally inherits crossing-letter visibility from the existing pattern logic.
- Starting coin balance raised from 0 to exactly 300 (`playerDefaults()` in `learning-engine.js`) — matches the full-reveal cost exactly, so every new player can afford one full reveal from their first puzzle.
- Added a real "Puzzle Solved!" completion screen (`#wgCompletePanel`) shown when the last word in a puzzle is found, replacing the old toast-and-silent-auto-advance-after-900ms behavior. Shows the coins/XP earned for that specific puzzle (tracked via new `wgState.puzzleCoins`/`puzzleXp` counters, reset each puzzle) and requires a "Next Puzzle →" tap to continue, rather than auto-advancing.

### Files modified

- `learning-engine.js` (starting coins 0 → 300)
- `word-game-app.js` (`wgRevealFull`, per-puzzle reward tracking, `wgShowPuzzleComplete`/`wgContinueAfterComplete`, mission card obscuring)
- `index.html` (`#wgCompletePanel` markup, bottom-nav hint button relabeled with its cost)
- `word-game.css` (`.wg-complete-panel` styling)
- `tests/learning-engine.test.js` (updated/added coins-default regression tests)

### Verified

- 73/73 automated tests pass.
- Live-verified with a cleared save (true new-player state): starting balance exactly 300 coins; side hint deducts 100 and reveals one letter (mission pattern updates to match); bottom-nav reveal deducts exactly 300, reveals the real word + definition, and correctly blocks a second reveal on the same word ("Already revealed") and blocks reveals with insufficient coins on a new word ("Not enough coins — full reveal costs 300"); solving a full 3-word puzzle (LEDGER/PEER/GAS) showed the completion screen with the exact correct totals (+91 coins, +20 XP); "Next Puzzle" correctly closed the screen and generated a new puzzle. No console errors throughout.

---

## 2026-07-19 — Architecture correction: one unified, data-driven word-game engine (retires the separate Crypto/Credit puzzle code)

### Why

The previous entry built `credit-game-app.js` as a parallel system alongside `app.js`'s Crypto puzzle code — same mistake pattern as the earlier workbook-vs-Crypto split, but this time for two instances of the *same* mechanic. The user corrected this directly: worlds are content, not separate codebases; there should be one puzzle engine that takes a world's vocabulary as data and renders it identically regardless of subject. They also supplied a visual reference (dark "space" theme, coins/XP/gems economy, level badge, a single-word "mission" card with its reward shown, streak + daily-progress display, bottom nav) to replace the old light-themed crossword screen everywhere.

### What was built

- **New unified engine**: `word-game-app.js`. One `wgOpenWorld(worldId)` entry point, one puzzle-generation/crossword/wheel/shuffle/hint/definitions implementation, driven entirely by a small `WG_WORLDS` config (`{ key, icon, name, vocabulary() }`) — Crypto and Credit are two ~5-line entries pointing at their existing term lists (`WORLD.terms`, `window.CREDIT_GAME_TERMS`). No puzzle-rendering code branches on which world is active.
- **Retired**: `credit-game-app.js` and its dedicated `#creditGameScreen` markup, deleted outright rather than left as dead code. The old numbered Level 1–5 / 5-round-gate / Daily Review / manual New Game / Skip Lessons system built earlier in this session for Crypto specifically is also superseded — `#playScreen` is no longer shown by any entry point (kept in the DOM, hidden, rather than deleted, in case any reference was missed). The new model is the same for both worlds: endless regenerating puzzles plus a persistent "words solved / world vocabulary size" counter.
- **New premium UI**: `word-game.css` + a new `#worldGameScreen` section in `index.html` — dark space theme, gold-outlined crossword cells, coins/XP/gems header, level badge with XP progress, mission card (current word + definition + reward), streak/daily-progress bar, bottom nav (Knowledge/Hint/Shuffle/Journey/Pause), and a modal Definitions panel (replacing the old always-visible clue list).
- **Coins made real** (per the user's explicit choice, not cosmetic-only): `learning-engine.js` player model gained a `coins` field (added to `playerDefaults()`, which both `createSave` and `normalizeSave` already call — safe from the earlier duplicate-literal class of bug). Reward formula: `coins = word.length * 7`, `xp = round(word.length * 1.5)`. Gems left at 0/unwired, as agreed — reserved for a future mechanic rather than invented now.
- Per-world persistent progress (`solvedWords` array) stored under new `learning.save.worlds["wg-crypto"]` / `["wg-credit"]` keys, separate from the Credit Foundations *workbook* progress that already lives under `["credit-foundations"]`.
- Crypto's existing per-term mastery data (`learning.recordPuzzleSolved`) still updates in the background on word-find, so the dashboard's Crypto stats don't regress — but the rich per-word lesson modal (`showLearn`, SM-2 review) is explicitly **not** wired into the new engine yet. Flagging this clearly rather than leaving it ambiguous: Credit vocabulary has no authored lesson content to power an equivalent modal, and bolting Crypto's modal onto the new engine alone would leave the two worlds inconsistent in a different way. Real follow-up, not done here.

### Real bug found and fixed before reporting this done

Live-testing the full click path (game → Continued education → dashboard → back into the game) surfaced that `showDashboard()` and `openWorkbookWorld()` were never updated to hide the new `#worldGameScreen` — so navigating "away" from the word game left it visible underneath whatever screen was supposed to show next. Root cause: three different functions in three different files (`app.js`, `workbook-app.js`) each independently list which screens to hide, and adding a fourth top-level screen meant updating all of them, which I missed on the first pass. Fixed `showDashboard`, `showPlay`, and `openWorkbookWorld` to all hide `#worldGameScreen`; re-verified the full navigation chain afterward with real clicks, not just direct function calls.

### Files created

- `word-game-app.js`, `word-game.css`

### Files removed

- `credit-game-app.js`, its `#creditGameScreen` markup, and its script tag

### Files modified

- `index.html` (new `#worldGameScreen`, retired screen removed, `#playScreen` hidden by default, script tags updated)
- `app.js` (`showPlay`/`showDashboard` hide the new screen; dashboard CTAs now open `wgOpenWorld("crypto")` instead of the old level system; init no longer auto-shows the old screen)
- `workbook-app.js` (`openWorkbookWorld` hides the new screen; "Play the credit word game" now calls `wgOpenWorld("credit")`)
- `learning-engine.js` (`coins` field)
- `tests/learning-engine.test.js` (regression test for the coins default, same pattern as the earlier `skipLessons` one)

### Verified

- 72/72 automated tests pass.
- Live-verified with real clicks end to end: home screen loads as the new dark-themed Crypto puzzle (no console errors) → solved a word → coins (+28), XP (+6), level bar, streak, and daily-progress dot all updated correctly and matched the reward formula exactly → mission card advanced to the next unsolved word → Definitions panel opens/closes correctly, found vs. unfound words rendered distinctly → back button returns to dashboard (screen-hiding bug fixed here) → Credit Foundations → "Play the credit word game" renders the *same* engine with Credit's icon, name, and 38-word vocabulary, correct definitions, correct rewards on solve, correct puzzle regeneration on completion → full reload preserves coins/XP/level and shows correct per-world "words solved" counts independently for each world.

---

## 2026-07-19 — New Credit word game (parallel to the Crypto word game)

### Completed work

- Built a second word-connect puzzle game for Credit vocabulary, reachable via a new "🎮 Play the credit word game" button at the top of the Credit Foundations map. Built as a fully parallel system (own screen `#creditGameScreen`, own controller `credit-game-app.js`, own state) rather than making the existing Crypto `app.js` multi-world-aware — same low-risk pattern already used for the workbook flow, so the working Crypto game was not touched at all.
- Vocabulary is real, not invented: `scripts/build-credit-game-terms.mjs` extracts single-word flashcard terms (word + definition) straight from the 15 Credit Foundations workbooks — 38 terms (CREDIT, BORROWER, LENDER, DEBT, LOAN, PRINCIPAL, INTEREST, APR, DEFAULT, DELINQUENCY, COLLATERAL, etc.). Multi-word flashcard terms ("Credit limit", "Minimum payment") are skipped since the crossword/wheel mechanic needs unbroken single words.
- Reuses the shared engine (`FinLitGameEngine.layoutWords`/`wheelFor`) and the shared `learning` save/XP system rather than building new persistence. Scoped deliberately lighter than the Crypto game: no per-term lesson modal, no bonus words — the always-visible definitions/clue list is the educational surface, and solving a word awards simple session XP directly.
- Kept the "New Game" and self-regenerating puzzle behavior consistent with the Crypto game: finishing a puzzle automatically generates a new one from the full 38-word pool (no fixed "level 1" set to get stuck on), plus a manual 🎲 button.

### Real bug found and fixed before reporting this done

The first version's puzzle builder (same "add words while combined wheel size ≤ 9" greedy approach used for Crypto) failed constantly — live-tested and it returned "Couldn't build a puzzle" on the very first real attempt. Root cause: credit vocabulary is longer and far less letter-efficient than Crypto's curated 20-word set (many 10–17 letter terms like CREDITWORTHINESS, DISBURSEMENT, CAPITALIZATION), so a single unlucky first word could eat nearly the whole 9-letter budget, leaving no room for a second word — unlike Crypto where hand-picked short words made this rare. Fixed by trying up to 12 shuffles for a 2+ word puzzle before falling back to the best single-word attempt found, rather than failing outright. Re-tested: 15/15 consecutive attempts succeeded with 2+ words after the fix (0/1 succeeded before it, on the one attempt made — caught immediately rather than left for the user to hit).

### Files created

- `scripts/build-credit-game-terms.mjs`, `content/credit-game-terms.json`, `content/credit-game-terms.js`
- `credit-game-app.js`

### Files modified

- `index.html` (new screen, entry button on the workbook map, new script tags)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser: full path from the game's "Continued education" button → dashboard → Credit Foundations map → "Play the credit word game" → real crossword/wheel render with real credit definitions → solved a word (XP and yield updated correctly) → completed the puzzle (auto-regenerated a new one, found-set reset) → back button correctly returns to the Credit Foundations map. No console errors. Puzzle builder verified reliable across 15 consecutive attempts post-fix.

---

## 2026-07-19 — Correction: randomize the first game too, not just rounds 2–5

### What was wrong

The previous entry's gate deliberately kept round 1 as the fixed original TOKEN/NODE/COIN/MINT puzzle "to preserve the tutorial experience" — an assumption I made without being asked, and it was wrong: the user pointed out the first game was still always the same 4 words no matter how many times they reloaded. There was never a real reason it needed to stay fixed — the clue-card/definitions UI is driven generically by whatever words are in `LEVELS[0].words`, already proven working with random content during rounds 2–5.

### Fix

At app init, before the first render, `LEVELS[0]` is now overwritten with a `buildRandomPuzzle()` result the same way rounds 2–5 already are — so game 1 is random on every fresh page load too, not just every completion.

### Verified

- 71/71 automated tests pass.
- Live-verified: 3 consecutive fresh page loads produced 3 different word sets for "Game 1 of 5" (GAS/FORK/HASH, then WALLET/VAULT, then NODE/GAS/COIN — the old fixed TOKEN/NODE/COIN/MINT never reappeared as a forced first game). Re-ran the full 5-round-to-Level-2 gate sequence to confirm the promotion logic still fires correctly with this change; it does. No console errors.

---

## 2026-07-19 — Gate Level 2 behind 5 completed rounds at Level 1

### Completed work

- Level 1 no longer promotes to Level 2 after a single completion. It now takes 5 completed rounds: round 1 is the original hand-authored TOKEN/NODE/COIN/MINT puzzle (unchanged, keeps the tutorial clue-card experience), rounds 2–5 are freshly generated via the same greedy word-builder behind the "New Game" button (`buildRandomPuzzle()`, extracted as a shared helper) — so the user isn't shown the same TOKEN/COIN pair on repeat. Only after the 5th completion does `advance()` fall through to the real Level 2 (`Shared liquidity`).
- Added a visible counter: the level label reads "Game 1 of 5" through "Game 5 of 5" while in this gated stretch, then reverts to normal "Level N" labeling once past it.
- The standalone 🎲 New Game button and Daily Review are unaffected — both are tracked via separate flags (`state.custom`, `state.review`) and neither touches the Level 1 gate counter.

### Files modified

- `app.js` (`buildRandomPuzzle()` extracted from `newGame()`; `advance()` rewritten with the gate; level label logic; `state.level1GamesPlayed` + `LEVEL1_GAMES_REQUIRED`)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser by driving `advance()` through a full 7-round sequence: rounds 1–5 stayed at Level 1 with the label counting up (Game 1 of 5 → Game 5 of 5) and different word sets each round after the first (TOKEN/NODE/COIN/MINT → PEER/BLOCK/LOCK → TOKEN/NODE/LOCK/COIN → SWAP/NODE/GAS → NODE/FORK/COIN); round 6 correctly promoted to Level 2 (Shared liquidity, POOL/LOCK/BLOCK/FORK); round 7 continued normally to Level 3. Confirmed the New Game button still works independently and doesn't affect the gate counter. No console errors.

**Note on counter persistence:** `state.level1GamesPlayed` lives in memory only (matches how `state.found`/`state.tries`/etc. already work), so it resets on a full page reload — a learner who reloads mid-arc gets 5 fresh rounds rather than resuming a partial count. Flagging this now in case persisted progress is wanted later; not implemented since it wasn't asked for and the existing in-memory pattern is what the rest of session state already does.

---

## 2026-07-19 — "New Game" button: real puzzle variety from the full 20-word vocabulary

### Completed work

- Added a 🎲 "New Game" button to the play screen topbar. Previously "Level 1" always meant the same fixed four words (TOKEN, NODE, COIN, MINT) — this generates a genuinely different puzzle (different word subset, different letter wheel) from the full 20-word Crypto vocabulary each time it's pressed, reusing the existing `wheelFor()` engine function (already used by Daily Review) rather than adding new puzzle-building logic.
- **First implementation was broken and I didn't ship it as "verified" without testing**: picking 4 random words up front and rejecting the whole batch if their combined unique-letter count exceeded the 9-letter wheel cap almost always failed, because the existing hand-authored levels were specifically curated for letter overlap (e.g. Level 1's TOKEN/NODE/COIN/MINT share letters down to exactly 9 unique) — 4 arbitrary words from a 20-word pool of largely dissimilar terms essentially never fit by chance. Caught this via live testing (8/8 attempts returned the failure toast) before calling it done, not after.
- Fixed with a greedy builder instead: shuffle the full word pool, walk through it once, add each candidate word only if it keeps the *cumulative* required letters at or under 9, stop at 5 words or end of pool. Guarantees convergence (the first word always fits; each subsequent word is only added if it still fits) rather than gambling on a lucky batch. Re-tested: 8/8 live attempts succeeded with varied word sets (STAKE, CHAIN, YIELD, BURN, SWAP, LEDGER, PEER, GAS, POOL, LOCK, MINT, COIN, TOKEN all appeared across different runs).
- Generated puzzles are pushed onto `LEVELS` and switched to, same pattern as Daily Review; labeled "New game" (added `state.custom` alongside the existing `state.review` flag, reset alongside it at every other level-transition site so the label doesn't leak between modes).

### Files modified

- `index.html` (🎲 button)
- `app.js` (`newGame()`, `state.custom`, label logic, reset at all level-transition sites)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser: 8 consecutive presses, 8 successful varied puzzles (0 failures after the fix; 8/8 failures before it, which is why the greedy rewrite happened before reporting this done).

---

## 2026-07-19 — Made the word game the home screen; journey map moved to "Continued education"

### Completed work

- Flipped the app's landing screen: the Crypto word game (`#playScreen`) is now what loads on open, not the journey-map dashboard. The user's framing: the game is the main product, the learning/journey content is secondary and should be reached deliberately, not be the first thing shown.
- Added a "Continued education →" button at the bottom of the game screen (below the definitions/clue card) that takes the learner to the journey map/dashboard — replacing the old flow where the dashboard was home and "Continue Adventure" led *into* the game. The dashboard's own "Continue Adventure" button is unchanged and still works to jump back into the game from there.
- Updated `index.html` defaults (`#dashboardScreen` now starts `hidden`, `#playScreen` no longer does) and `app.js`'s init sequence now calls `showPlay()` at the end instead of unconditionally adding the `journey-mode` class, so the correct screen is guaranteed regardless of markup state.

### Files modified

- `index.html` (default visibility swap, new "Continued education" button)
- `styles.css` (`.continued-education` styling, matching the play screen's existing light theme rather than the dashboard's separate dark/gold `journey-mode` palette)
- `app.js` (init sequence, new button wiring)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser: fresh load opens directly into the word game (not the dashboard); "Continued education" navigates to the journey map; dashboard's existing "Continue Adventure" still returns to the game; no console errors.

---

## 2026-07-19 — Crypto word game: level randomization, shuffle bug, letter-hover glitch

### Completed work

- Randomized both the Level 1 clue-list order and the initial letter-wheel arrangement on every level entry (`renderLevel()`), instead of always showing the same fixed order from `worlds/crypto.js`. Clue order is computed once per level entry (`state.clueOrder`) and stays stable while playing that attempt — it doesn't re-shuffle every time a word is found.
- Fixed the manual shuffle button (center of the letter wheel): it used `array.sort(() => Math.random() - 0.5)`, a well-known unreliable "shuffle" that frequently fails to visibly reorder small arrays in real JS engines (non-transitive comparator, especially weak on ~9-element arrays). Replaced with a proper Fisher-Yates shuffle (`shuffled()` helper, also used for the level-entry randomization above so both use the same correct algorithm). Verified with 6 consecutive shuffles in a live browser session — order changed all 6 times (previously could silently produce no visible change).
- Fixed a real CSS bug causing letters to visually jump when the mouse hovered over them: `premium.css` has a global `button:hover{transform:translateY(-2px)}` rule. Since `.letter` buttons are positioned via `transform:translate(-50%,-50%)` (required for centering them on their calculated circular coordinates), the global hover rule was *replacing* that centering transform rather than adding to it — hovering made a letter snap from its correct centered position to being anchored near its top-left corner, then snap back on mouseout. Added `button.letter:hover`/`:active` overrides (higher specificity, `button.letter` vs `button`) that preserve the centering translate and layer a small scale on top instead. Verified via a real hover in a live browser session — computed transform now correctly reads `matrix(1.05,0,0,1.05,-29,-29)` (translate preserved, scale added) instead of losing the -29,-29 offset.

### Files modified

- `app.js` (`shuffled()` now Fisher-Yates; `shuffle()` reuses it; `renderLevel()`/`renderGrid()` randomize clue order and initial wheel letters)
- `styles.css` (`.letter` hover/active transform overrides)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser: clue order and wheel letters differ across repeated level entries; shuffle button changes order on 6/6 consecutive presses; hover no longer displaces letter position.

---

## 2026-07-19 — Persistent "skip lessons" toggle for the Crypto word game

### Completed work

- Added a permanent, learner-facing "⏭ Skip lessons" toggle to the Crypto play screen topbar. It sets the existing (pre-existing, unmodified) `state.skip` flag that already gated the per-word lesson/quiz modal — previously that flag was only reachable via a "Skip cards this level" button buried inside the modal itself (only visible after finding a word), and it reset every level. The new toggle is visible immediately, works before finding any word, and persists as a real player setting (`save.settings.skipLessons`, reused in the existing save file) rather than resetting per level.
- Extended `learning-engine.js`'s settings defaults (`createSave` and, critically, `normalizeSave`'s merge default — see bug below) with `skipLessons:false`.
- Styled with a plain CSS `.icon-button.active` state (green fill) consistent with the existing Crypto screen's non-dark-mode palette (that screen doesn't use the newer `--app-*` dark-mode tokens; matched its existing convention rather than introducing a mismatched style).

### Real bugs found and fixed during verification

1. **`normalizeSave` default merge gap**: the `skipLessons:false` default was added to `createSave()` but the *separate* default object literal inside `normalizeSave()` (used for every existing/reloaded save, i.e. almost all real usage) was missed on the first pass — an exact-string `replace_all` matched one occurrence but not the other because surrounding text differed. Caught by testing against a save that predates the setting, not just a fresh one. Added a regression test (`tests/learning-engine.test.js`, "loading a pre-existing v3 save without skipLessons still defaults it to false") so this can't silently regress again.
2. **Dev server caching**: the `.claude/launch.json` static server (plain `python3 -m http.server`) sends no `Cache-Control` headers, and — separately and more stubbornly — this session's Browser-pane tooling appeared to cache responses for one specific port (8743) at a layer that survived killing/restarting the backend process, new tabs, and forced navigations; a fresh port (8756) immediately worked. Spent significant time initially misdiagnosing this as an application bug (function declarations "not attaching to `window`") before isolating it via a controlled test: fetching+`eval`-ing the current file text directly always worked, while the normal `<script src>` load intermittently didn't, and it depended on port, not code. Replaced the dev server with `.claude/no-cache-server.py` (sends explicit `Cache-Control: no-store`) on port 8756, and updated `.claude/launch.json` to match. **Takeaway for future work in this repo**: if a change verified correct by direct code review and Node-side tests still appears not to run in the Browser pane, suspect the dev server/cache before the code — open a fresh tab on port 8756 (not 8743) to rule it out quickly.

### Files created

- `.claude/no-cache-server.py`

### Files modified

- `index.html` (new topbar button)
- `app.js` (toggle handlers, wired via explicit `window.X = function(){}` rather than bare `function` declarations — a defensive choice made while chasing the caching issue above; harmless either way, so left as-is rather than reverting)
- `styles.css` (`.icon-button.active`)
- `learning-engine.js` (settings default, both call sites)
- `.claude/launch.json` (points at the no-cache server, port 8756)
- `tests/learning-engine.test.js` (regression test)

### Verified

- 71/71 automated tests pass.
- Live-verified in a real browser (fresh tab, port 8756): toggle attaches correctly, toggling on/off fires the correct toast each direction, `aria-pressed`/`active` class update correctly, setting persists across a full page reload.

---

## 2026-07-19 — Credit Foundations workbook engine: lesson, flashcard, matching, and quiz UI

### Completed work

- Built the reusable game functions the previous entry identified as missing: a lesson renderer (objective → core-lesson paragraphs → example/non-example → misconception → key takeaway, paged like the existing Crypto micro-lesson flow), a flashcard engine (flip, next/prev, progress), a matching-practice engine (tap-pair, wrong-match feedback, completion detection), and a quiz engine covering both assessment formats in the CRF content (5 multiple-choice + 3 true/false per workbook, immediate feedback with explanations, running score).
- Added `src/workbook-engine.js`: pure, DOM-free logic for quiz scoring (percent/pass-fail against each workbook's `masteryRule.passingScore`), matching-round construction with shuffle, and prerequisite-chain unlock/status/next-available logic. Fully unit tested (9 new tests) before any UI was wired to it.
- Extended `learning-engine.js` additively (no existing method signatures changed): `workbookProgress`, `recordWorkbookPractice`, `recordWorkbookAttempt`, `workbookWorldStats`. Reuses the existing save file (v3), the existing `save.worlds` bucket that was already reserved but unused, and the existing `persist()`/`touchActivity()` machinery — no second persistence layer. XP is awarded once per workbook (first pass only); replaying after completion updates `bestScorePercent` and `attempts` but does not re-award XP (6 new tests, including an explicit duplicate-XP-farming test and a same-storage-reload persistence test).
- Added `workbook-app.js` (controller/UI) and `workbook-engine.css` (new screens, using the same theme-aware `--app-*` tokens and dark-mode support as the premium dashboard, not the older non-dark-mode `styles.css` palette the legacy Crypto game screen still uses).
- Added `curriculum/credit/approved/runtime/credit-foundations.js` and `worlds/credit-foundations.js` adapters (same reason `content/crypto-terms.js` exists: opening `index.html` via `file://` blocks local JSON fetches).
- **Rewired real navigation**: the "Credit Foundations" journey-map node previously opened Crypto word-connect content under a mismatched label (the whole "journey map" was cosmetic — `JOURNEY_SECTIONS` just relabeled Crypto level indices). It now opens the real Credit Foundations workbook world. No other journey nodes or existing Crypto behavior were touched.
- **Live-verified in an actual browser**, not just unit tests: served the app over local HTTP (`file://` blocked automated navigation; added `.claude/launch.json` for a static server), played CRF-001 completely — 8-step lesson, 5 flashcards (including the flip interaction), 4-pair matching (including a deliberate wrong match to confirm rejection), and all 8 quiz questions — reached the results screen with the correct score (8/8, 100%, +100 XP), confirmed the map updated to show CRF-001 completed and CRF-002 unlocked, opened CRF-002 to confirm distinct real content renders, and confirmed everything survived a full page reload via localStorage. Checked the console for errors at every step (none).
- **Found and fixed a real bug during this verification**: the back button did nothing when pressed from the workbook map (`wbState.lastView` was compared against the literal string `"map"`, but the view id actually stored was `"workbookMapView"` — an always-false check). Fixed, then re-verified both back-navigation paths (map → dashboard, sub-view → map).
- Ran the full suite after every change: 70/70 passing (55 previous + 9 workbook-engine + 6 workbook-progress).

### Files created

- `src/workbook-engine.js`, `workbook-app.js`, `workbook-engine.css`
- `curriculum/credit/approved/runtime/credit-foundations.js`, `worlds/credit-foundations.js`
- `.claude/launch.json` (local static server for browser verification)
- `tests/workbook-engine.test.js`, `tests/workbook-progress.test.js`

### Files modified

- `learning-engine.js` (additive workbook-progress methods)
- `index.html` (new `#workbookScreen` markup, new script/style tags, no existing markup removed)
- `app.js` — **not modified**; the journey-node override is applied from `workbook-app.js` after `app.js` runs, so the existing file is untouched
- `docs/GAME_COMPLETION_BASELINE.md`, `docs/TWO_WORLD_CONTENT_STATUS.md`

### Known issues / explicitly not done yet

- No dedicated learner profile screen, no daily-practice mode mixing missed/recent content across workbooks, no sorting/categorization activity component, no credit-score simulation activities.
- Some workbook-list item buttons lack accessible text labels (nested spans with no `aria-label`) — found during verification, not yet fixed.
- The dashboard side panel (streak, mastery ring, "Journey progress") still reflects Crypto-world stats, not Credit Foundations — it was not wired to the new world.
- Credit Cards world is still unstarted at the content layer; the same contract/parser/validator/test pipeline is ready to reuse once content exists.
- No error/loading/empty states added yet for malformed or missing workbook data (Phase 6 item, not started).

### Recommended next steps

1. Wire dashboard side-panel stats to `workbookWorldStats("credit-foundations", ...)` so the panel reflects real Credit Foundations progress instead of stale Crypto stats.
2. Add accessible labels to workbook-list buttons; do a pass on keyboard focus/tab order across the new screens.
3. Build daily practice, sorting/categorization, and credit-score simulation activities as their own reusable components once the core loop above has been used enough to know what's actually needed.
4. Author Credit Cards content in the same Markdown format once content sourcing is decided, and run it through the same pipeline.

---

## 2026-07-19 — Credit Foundations content contract, source integration, and conversion

### Completed work

- Ran a fresh Phase 1 baseline inspection independent of prior written summaries: confirmed stack, confirmed 42/42 existing tests pass by direct run, confirmed no Node is installed system-wide (test runner falls back to the Codex-runtime cached Node binary), confirmed the repo has no database/auth/backend beyond localStorage, and confirmed today's CRF World Readiness Review (FAIL) and Evidence Recovery Report accurately describe the repository as it stands.
- User supplied the actual CRF-001 through CRF-015 curriculum package (`FinLit_Quest_Credit_Foundations_CRF_001_015.md`), resolving the evidence-recovery report's `ADDITIONAL SEARCH REQUIRED` blocker. The package is labeled "Game-ready educational draft for integration and final editorial review" — real authored content, not yet a formally signed-off Educational Review per this project's own WRR pipeline. Treated it as the working source, not as a passed WRR.
- Preserved the supplied package unedited as the immutable approved source at `curriculum/credit/approved/workbooks/CRF-001-015-source.md`.
- Designed a new content contract for lesson/quiz-style worlds, since the existing `term.schema.json`/`world.schema.json` pair is specific to the word-connect puzzle mechanic (single uppercase `word` fitting a letter wheel, one quick-challenge, a Crypto-only category enum) and cannot represent a 15-workbook curriculum with five-question multiple-choice banks, true/false banks, matching activities, and scenario activities. Added `schemas/workbook.schema.json` and `schemas/workbook-world.schema.json` as a parallel contract rather than modifying the working Crypto schema.
- Added `src/workbook-validator.js` (same IIFE/browser-and-Node module pattern as `content-validator.js`) validating individual workbooks and whole workbook worlds: required fields, valid multiple-choice `correctIndex`, non-empty assessment sections, contiguous 1-15 sequencing, and a prerequisite chain where each workbook unlocks from exactly the immediately preceding one.
- Wrote `scripts/parse-credit-foundations.mjs`, which parses the Markdown source into structured JSON and validates it before writing anything, matching the project's existing "reports validation failures before runtime JSON is allowed" convention. Ran it: all 15 workbooks parsed and validated on the first pass. Spot-checked several workbooks' generated JSON against the source by hand (correct answers, matching pairs, prerequisite links) to confirm the parser is semantically correct, not just schema-valid.
- Added `tests/credit-foundations-content.test.js` (content-correctness tests: exact workbook count/ids, contiguous sequence, valid prerequisite chain, complete practice/assessment sets, no duplicate assessment ids, valid `correctIndex` bounds) and `tests/workbook-validator.test.js` (negative-path tests proving the validator actually rejects broken data: bad `correctIndex`, broken prerequisite chain, duplicate ids, missing assessment type, mismatched `workbookIds`).
- Full suite now passes 55/55 (42 previous + 13 new), run directly, not assumed.

### Files created

- `curriculum/credit/approved/workbooks/CRF-001-015-source.md` (immutable source, as supplied)
- `curriculum/credit/approved/runtime/credit-foundations.json` (generated, validated)
- `worlds/credit-foundations.json` (generated, validated)
- `schemas/workbook.schema.json`
- `schemas/workbook-world.schema.json`
- `src/workbook-validator.js`
- `scripts/parse-credit-foundations.mjs`
- `tests/credit-foundations-content.test.js`
- `tests/workbook-validator.test.js`
- `docs/GAME_COMPLETION_BASELINE.md`

### Architectural decisions

- Credit Foundations (and, by extension, Credit Cards) is a structurally different game mode than Crypto: a lesson → flashcards → multi-format-quiz → mastery-gate workbook flow, not a word-connect puzzle. It does not reuse `game-engine.js`'s wheel/crossword logic and should not be forced into the `term`/`world` schema built for that mechanic. Added a sibling `workbook`/`workbook-world` contract instead of redesigning the working Crypto contract.
- `worldType: "workbook"` was added as a discriminator on the new world schema so the loader/UI layer can branch on world type later; the existing `world.schema.json` for Crypto was left untouched.
- The supplied CRF content is being treated as real working source content, not as a passed formal Educational Review — that distinction is preserved in this log and in `docs/GAME_COMPLETION_BASELINE.md` rather than silently upgraded to "approved & locked."

### Known issues / explicitly not done yet

- No UI/game-engine integration exists yet for workbook-type worlds: no lesson screen, flashcard engine, quiz engine (multiple-choice/true-false/matching/scenario runner), world navigation entry, XP/mastery/streak wiring, or progress persistence for Credit Foundations. The content layer is real and tested; the player cannot play it yet.
- Credit Cards world is still unstarted at the content layer (a strong 785-line structural blueprint exists but no workbook prose).
- The formal WRR/governance reports in `curriculum/credit/approved/reports/` were not re-run or updated to reflect that source content now exists; they still describe the pre-integration state and should be revisited if the project wants to keep using that formal gate going forward.

### Recommended next steps

1. Build the reusable workbook game engine (lesson renderer, flashcard mode, quiz engine covering all four assessment formats, results screen) and wire Credit Foundations into world navigation.
2. Connect XP, mastery, streaks, and persistence for workbook-type worlds, extending `learning-engine.js` rather than duplicating it.
3. Once Credit Foundations is playable end to end, begin Credit Cards content authoring against the same contract.

---

## 2026-07-19 — Credit Foundations evidence recovery and repository alignment

### Completed work

- Searched the complete local project recursively by filename and readable content for Credit Foundations governance, workbook, review, approval, version, and relationship evidence.
- Inspected both manual ZIP backups by complete archive listing.
- Searched current curriculum, research, reports, documentation, legacy files, Git baseline history, and available Codex attachments.
- Audited 149 required evidence slots: seven governance/blueprint artifacts, nine evidence categories for each of fifteen workbooks, and seven shared approval/relationship artifacts.
- Created an evidence inventory, individual workbook coverage matrix, recovery report, canonical repository-structure proposal, and six-issue reassessment.

### Files created

- `curriculum/credit/approved/reports/CRF_EVIDENCE_INVENTORY.md`
- `curriculum/credit/approved/reports/CRF_WORKBOOK_COVERAGE_MATRIX.md`
- `curriculum/credit/approved/reports/CRF_EVIDENCE_RECOVERY_REPORT.md`

### Evidence located

- Project prompts and `PROJECT_LOG.md` stating that CRF-001 through CRF-015 and their Educational Reviews were completed elsewhere.
- Existing failed-WRR reports proving the scope and result of the first local readiness review.
- No authoritative required artifact was recovered.

### Files reorganized

- None. No candidate file had sufficient identity, version, approval, and provenance evidence to be copied or moved safely.
- No file was deleted, overwritten, renamed, merged, or substantively changed during recovery.

### Missing and ambiguous documents

- All 149 required evidence slots remain missing.
- The Platform, Domain, Credit Foundations World, and Workbook Blueprints remain missing.
- FQ-AUTH-001, FQ-WRR-001, controlled vocabulary, controlled values, and approval/relationship records remain missing.
- CRF-001 through CRF-015 Research Scopes, approved content, Educational Reviews, revision records, approval records, versions, blueprint alignment, prerequisites, and unlocks remain missing.
- Conversation-derived and project-log status assertions remain provisional; they are not substitutes for source evidence.

### Blocking issue reassessment

- All six original WRR blocking issues remain open.
- No issue can be closed from the evidence recovered locally.
- The existing WRR decision remains FAIL.

### Recovery recommendation

- Result: `ADDITIONAL SEARCH REQUIRED`.
- User-assisted recovery is required from the system where Credit Foundations was authored or approved, such as another local folder, cloud drive, knowledge-base workspace, AI project, email attachment collection, or prior export.
- A new WRR is not ready to begin.

### Stop condition observed

- No second WRR was conducted.
- No manifests, compilation, registries, JSON/Excel exports, runtime assets, game integration, or Credit Cards development were started.

---

## 2026-07-19 — First operational Credit Foundations WRR

### Completed work

- Conducted the first operational World Readiness Review for the planned CRF-001 through CRF-015 scope using every validation requirement supplied in the authorized completion task.
- Inspected the approved Credit directory and available attachments for workbook sources, Educational Reviews, revision records, blueprints, FQ-AUTH-001, FQ-WRR-001, approval data, controlled values, and relationship evidence.
- Recorded the required binary decision: `FAIL`.
- Completed the operational readiness checklist and outstanding-issues log.
- Did not create a WRR approval record or compilation authorization because the review did not pass.

### Documents created

- `curriculum/credit/approved/reports/CRF_WORLD_READINESS_REVIEW.md`
- `curriculum/credit/approved/reports/CRF_WORLD_READINESS_CHECKLIST.md`
- `curriculum/credit/approved/reports/CRF_WORLD_READINESS_OUTSTANDING_ISSUES.md`

### Decision

- World Readiness Review: **FAIL**
- Compilation authorized: **No**

### Outstanding issues

- CRF-001 through CRF-015 approved workbook files are absent from the approved source directory.
- Educational Review and accepted-revision evidence is absent.
- FQ-WRR-001 and its official checklist are unavailable.
- FQ-AUTH-001 and the governing blueprints are unavailable.
- Approval log, controlled values, concept registry, sequence, prerequisite, and unlock records are unavailable.

### Architectural decisions

- Project-status statements do not substitute for the immutable approved educational sources and traceable review evidence required by the WRR.
- Missing evidence must produce FAIL rather than an assumed or conditional PASS.
- No manifest generation, compilation, registry generation, JSON generation, runtime generation, or game integration may begin.

### Recommended next step

Place or attach the authoritative approved workbooks, Educational Review records, governing specifications, and relationship/approval sources. Then rerun the WRR from the beginning. Compilation remains unauthorized until a later WRR records PASS and is approved.

---

## 2026-07-19 — Credit Cards blueprint v1.0-rc1

### Completed work

- Recorded user approval of the Credit Cards jurisdiction and learner-audience recommendations.
- Incorporated every accepted minor revision from the formal review into the World Blueprint.
- Preserved the approved 13-workbook count and instructional order.
- Narrowed CC-009 to Promotional APRs and Deferred Interest; moved fee instruction to agreement/statement literacy and made rewards optional context.
- Narrowed CC-013 to Unauthorized Use and Lost or Stolen Cards; moved payment difficulty and card-specific delinquency/default application to CC-007 and account changes/closure to CC-011.
- Added the approved 18-point World Success Criteria.
- Strengthened primary-source support with Regulation Z §§1026.6, 1026.12, 1026.13, and 1026.60.
- Expanded provisional Credit Foundations reuse to include Debt, Principal, Interest rate, Credit agreement, Revolving credit, and Creditworthiness.
- Updated the dependency graph, approval-question dispositions, review record, and freeze-condition status.

### Files modified

- `research/credit-cards/CREDIT_CARDS_WORLD_BLUEPRINT.md`
- `research/credit-cards/CREDIT_CARDS_WORLD_BLUEPRINT_REVIEW.md`
- `PROJECT_LOG.md`

### Approved decisions

- Jurisdiction: United States consumer credit cards; federal baseline; material state variation acknowledged; no state-by-state legal instruction; informational rather than legal advice.
- Audience: beginner consumers, inclusive of older teens and adults; plain-language instruction; no prior-use assumption; under-21 rules only when relevant.

### Status decision

- The revised blueprint is version `1.0-rc1`, not frozen version 1.0.
- Revision work is complete.
- Freeze remains blocked because the authoritative Credit Foundations registry, approved CRF workbook ownership records, Platform Blueprint, Domain Blueprint, approved Credit Foundations World Blueprint, FQ-AUTH-001, and FQ-WRR-001 are not available locally or in supplied attachments.
- No canonical IDs were invented and no workbook authoring was started.

### Validation

- Confirmed all 13 approved workbook titles appear once and in the accepted order.
- Confirmed all 18 World Success Criteria are present.
- Confirmed the two user decisions are recorded in both the blueprint and review.
- Confirmed direct Regulation Z citations for account-opening disclosures, special card provisions, billing-error resolution, and applications/solicitations.
- Confirmed no application, compiler, schema, test, manifest, registry, or runtime file was changed.

### Recommended next step

Obtain the authoritative Credit Foundations registry and full governing specifications. Reconcile concept identities and workbook ownership, complete clause-level governance verification, and then freeze the blueprint as version 1.0. Only after freeze should CC-001 Research Scope begin.

---

## 2026-07-19 — Credit Cards World Blueprint formal review

### Completed work

- Reviewed the complete 733-line Credit Cards World Blueprint as a curriculum architecture artifact.
- Verified its scope, proposed 13-workbook sequence, concept reuse, dependencies, boundaries, success requirements, and ten open approval questions.
- Assigned the formal review decision `APPROVED WITH MINOR REVISIONS`.
- Preserved the 13-workbook count and instructional order while recommending narrower scopes for promotions/rewards and unauthorized-use/account-change content.
- Produced a corrected dependency graph, final recommended workbook sequence, concept collision analysis, formal World Success Criteria, open-question disposition table, and exact blueprint-freeze conditions.
- Verified legally sensitive findings against current CFPB Regulation Z and FTC primary sources.

### Files added

- `research/credit-cards/CREDIT_CARDS_WORLD_BLUEPRINT_REVIEW.md`

### Files modified

- `PROJECT_LOG.md`

### Governance decisions

- The review does not freeze the blueprint, assign canonical IDs, authorize workbook authoring, or authorize manifests, compilation, runtime work, tests, schemas, or application changes.
- Detailed clause-level compliance remains subject to governance-owner review because the Platform Blueprint, Domain Blueprint, approved Credit Foundations World Blueprint, FQ-AUTH-001, and FQ-WRR-001 are not present locally.
- Exact concept reuse and workbook ownership remain provisional until the authoritative Credit Foundations registry and approved CRF records are available.

### Required minor revisions

- Add the formal World Success Criteria.
- Narrow the proposed CC-009 to promotional APRs and deferred interest; teach fees through terms/statements and keep rewards optional.
- Narrow CC-013 to unauthorized use and lost/stolen cards; move payment difficulty to CC-007 and account changes/closure to CC-011.
- Add direct Regulation Z support for pricing disclosures, billing-error resolution, and special card protections.
- Record explicit approval of jurisdiction and learner audience.

### Validation

- Confirmed all 12 required review sections are present.
- Confirmed all 13 planning workbooks received individual review decisions.
- Confirmed all ten open questions received one permitted outcome and a blocking-status determination.
- Confirmed no application, compiler, schema, test, manifest, registry, or runtime file was changed.

### Recommended next step

Obtain the two explicit user decisions on United States jurisdiction and beginner consumer audience. Then apply the approved minor revisions to a versioned blueprint, reconcile it against the Credit Foundations registry and governing specifications, and submit it for final freeze. Do not begin Educational Draft work before freeze.

---

## 2026-07-19 — Credit Cards research blueprint

### Completed work

- Researched the proposed Credit Cards world using authoritative United States consumer-finance sources led by the CFPB, Regulation Z, FDIC Money Smart, and FTC consumer-protection materials.
- Produced a research-only World Blueprint covering purpose, goals, scope, entry requirements, exit competencies, and its relationship to Credit Foundations.
- Proposed a 13-workbook instructional sequence as hypotheses for review, without creating Educational Drafts, workbook content, manifests, runtime assets, compiler changes, or canonical IDs.
- Created a concept inventory separating confirmed Credit Foundations reuse, potential registry overlaps, proposed card-specific concepts, and concepts belonging to later worlds.
- Added boundary analysis, a dependency graph, optional branches, gap analysis, research unknowns, and a conditional approval recommendation.
- Classified findings as FACT, HYPOTHESIS, or UNKNOWN and cited the supporting authoritative sources.

### Files added

- `research/credit-cards/CREDIT_CARDS_WORLD_BLUEPRINT.md`

### Files modified

- `PROJECT_LOG.md`

### Architectural decisions

- The blueprint is research and educational-structure planning only; the frozen governance and compiler workflows remain unchanged.
- The supplied project prompt is treated as the newer authority for the completion of CRF-001 through CRF-015, while the local runtime repository remains insufficient for exact concept-ID reconciliation.
- No proposed Credit Cards concept or workbook planning code becomes canonical until the authoritative Credit Foundations registry is available and the World Blueprint is approved.
- The evidence base is explicitly United States federal consumer-credit material and must not be presented as universal without localization review.

### Tests and validation

- Verified that all six requested deliverable phases are present.
- Verified FACT, HYPOTHESIS, and UNKNOWN classifications throughout the research artifact.
- Verified that no app, curriculum, compiler, schema, manifest, or runtime file was changed.

### Known issues and blockers

- The completed Credit Foundations Approved Educational Content and concept registry are not present in this local repository, so exact stable-ID reuse and duplicate detection remain blocked.
- Target learner age, reading level, jurisdiction approval, and expected quantitative depth are not yet defined.
- Planning labels `CC-001` through `CC-013` are noncanonical and must not enter manifests or runtime data.

### Recommended next step

Reconcile the proposed concept inventory against the authoritative Credit Foundations registry, confirm United States jurisdiction and learner profile, resolve the blueprint's ten research unknowns, and submit the World Blueprint for approval. Do not begin Educational Draft work before that approval.

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

## 2026-10-17 — CAL-0008 Banking/Investing terms implemented in the V3 supplement

- Added banking.atm, banking.wire, banking.phishing, investing.liquidity (definitions exactly as CAL-0008) to content/v3-supplemental-terms.json and .js; synced ios/App/App/public and www copies.
- Count-pinned tests updated: 147 -> 151 terms; coverage partition 49/39/59 -> 49/39/63; Banking 30, Investing 27 (including ACH, WORTH). No puzzle, reward formula or legacy v1.1 file changed.
- WIRE, PHISHING, LIQUIDITY have one registered official source each; the JSON secondary-source check is now optional-if-present. No source was invented.
- Not done: Credit (4) and Crypto (4) terms; no commit.
- Suite 475/475; git diff --check clean.

## 2026-10-17 — CAL-0008 Credit terms implemented

- Added credit.report, credit.bureau, credit.freeze, credit.history to content/credit-term-identities.js (now 42 IDs; the four are optional in validateVocabulary so the 38-term workbook record stays valid) and to the V3 supplement. content/credit-game-terms.js (generated from the workbook) was not edited.
- Tests: 151 -> 155 terms; Credit 42; partition 49/43/63. Suite 475/475.
- Remaining from CAL-0008: four Crypto terms. No commit.

## 2026-10-17 — Coins World research package (draft)
- staging/research/coins-world/2026-10-17/: register (20 types screened; 8 single-word candidates) and owner review packet. Research only; no IDs, runtime or tests changed.

## 2026-10-26 — Financial City bonus page + Codex visual/audio/Currency Rush upgrades prepared for production
- Owner instructed deployment of Codex's 2026-10-26 upgrades (10 world backgrounds, interactive audio, continuous music with music-only mute, Currency Rush practice bonus) plus the Financial City bonus game.
- Added financial-city.html ("Where Should My Money Go?") as its own page with separate localStorage keys (flq-financial-city-proto-v1, flq-fc-audio-v1). It does not read or write coins, XP, achievements, mastery or saves. Visible "educational draft" banner; noindex while draft. Linked from the Learning Quests view only (#journeyFinancialCityLink). Added to build-www.sh, iOS public copy and bundle-parity test.
- Content is DRAFT, not Approved & Locked, no permanent IDs. Unverified figures (e.g. retirement-saving placeholder) remain flagged in-page.
- Three owner-approved images (golden treasure vault, insurance shield, neon creator studio) and the exact Golden Castle Journey image are still missing and NOT substituted. Currency Rush remains practice-only (no coins/XP).
- Branch release/financial-city-and-codex-upgrades cut from origin/main (site files were identical to the prior local branch; only staging/exports differed and are not part of this release). Suite 556/556.
- Not tested: real iPhone Safari, real audio output. Open: Zoe crypto-heavy plan still scores high in Financial City scoring.

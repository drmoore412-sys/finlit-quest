# FinLit Quest — Phase 6: Slot Machine-Inspired Game Audio

Date: 2026-10-17 · Local development only · Status: **implemented and tested locally; awaiting owner review**

Labels: **IMPLEMENTED** · **TESTED** · **NOT VERIFIED** (could not be checked here).

No commit, push, merge or deployment. PR #4, governed vocabulary, saves and reward code were not touched.

**The most important limitation first:** I could not hear anything. Everything below was verified by recording the real engine's calls and scheduled voices in a real browser page and by automated tests with a fake audio context. The *sound itself* (taste, volume on real speakers) and **native iOS WKWebView playback were not verified**. Please listen on a phone before approving (§9).

---

## 1. Sounds implemented — IMPLEMENTED / TESTED

All synthesized live with the Web Audio API: no audio files, no libraries, no server. Original sounds, not copied from any casino game.

| Moment | Sound | Length |
|---|---|---|
| Touch / connect a letter | Short metallic click (a bright body plus two inharmonic partials); **pitch climbs a little with each connected letter** along a bright pentatonic run (about a twelfth by the ninth letter, then capped) | ~0.09 s |
| Ordinary word correct | Short pleasant two-note confirmation | ~0.25 s |
| Secondary financial word | Distinct bell-like financial chime with a closing "ting" | ~0.45 s |
| Wrong word | Soft, low, gently **falling** tone (the opposite of a win) | ~0.12 s |
| Duplicate word | Very quiet single tick | ~0.06 s |
| **Key financial term** | **Mini jackpot:** bright winning chime, rising four-note flourish with a sweep, seven-ping metallic coin cascade, closing sparkle | **1.3 s** (measured 1.32 s live) |
| **Full crossword** | **Grand jackpot:** nine accelerating, climbing clicks under a rising sweep, a three-chord fanfare, a coin cascade, a bright sustained final chime | **2.65 s** (measured 2.67–2.68 s live) |

## 2. Audio architecture — IMPLEMENTED

- **New `src/game-audio.js`** (`FinLitAudio`): one engine for all gameplay sound. It lazily creates a single `AudioContext` through a soft limiter (compressor), schedules short enveloped oscillators, and exposes `letter(n)`, `correct(kind)`, `wrong()`, `duplicate()`, `miniJackpot()`, `grandJackpot()`, `stopJackpots()`, `stop()`.
- **Reused, not rebuilt:** the existing victory controller (`src/victory-celebration.js`) now drives the grand jackpot through the same engine. I **removed** its own small chime synthesizer so there is exactly one synthesizer. The confetti, gold coins, dollar symbols, coin and XP display, skip control and reduced-motion handling are unchanged and not duplicated.
- **Wiring in `word-game-app.js`:** one `wgAudio` instance; letter sound in the single existing `wgAddLetter` path that taps, swipes and keyboard all use; wrong and duplicate in `wgSubmitWord`; the found-word tier in one new function `wgPlayFoundSound`, called after the reward is computed.
- **Safety:** the module has no access to saves, rewards, the learning engine or storage (a test scans for it). Every call is wrapped in try/catch and returns `false` on any failure, and scheduling is asynchronous, so audio cannot block or slow gameplay. The speed of recognition is unchanged: the click is scheduled on the same event, with no polling and no timers.

## 3. Key-term jackpot behavior — TESTED

- Plays the mini jackpot when the puzzle's primary financial term is found **in a puzzle the player has not completed before** and it is **not the last word**. It also shows the existing toast, "Key term found: WORD · +N coins" (the amount is the real reward; the definition is in the existing Definitions panel and on the completion card).
- It is never played for a wrong, duplicate or replayed answer.
- No reward changed. The financial reward formulas are untouched.

## 4. Full-puzzle jackpot behavior — TESTED

- The grand jackpot is started **once**, by the victory celebration, at the same instant as the confetti, coins and dollar symbols, and it is cut off by **Skip**, **Escape** or **Next Puzzle** together with the animation.
- **No overlap, enforced three ways:** (1) the per-word path plays nothing for the last word of a new completion, so a key term that is also the last word gives **one grand jackpot and no mini** (browser-verified: the only sound call was `grandJackpot`); (2) inside the engine a mini is refused while a grand plays, a running grand is never restarted, and a grand fades a still-running mini; (3) these rules are pinned by tests and by nine mutation checks.
- A replay of a completed puzzle plays only plain chimes: no jackpot, no coins or XP (browser-verified: 0 / 0).

## 5. Sound settings — IMPLEMENTED / TESTED

- **One preference**, the existing `finlitQuest.victorySound`, written in exactly one place and read by both the engine and the celebration. Default is **on**.
- **Mutes every gameplay effect.** Muted means no AudioContext is created and nothing is scheduled; muting mid-sound cuts it immediately. Browser-verified: zero new oscillators after muting.
- **Control placement:** the old mute button only existed inside the completion card, which is unreachable during play. I added a small 🔊 / 🔇 button in the puzzle header (next to the theme button) and kept the completion-card button. They share one handler and one preference and are always in sync (browser-verified). Only one is ever usable at a time, because the card covers the header. If you consider that a duplicate control, tell me which to remove.
- **Persists after refresh** (verified: muted, reloaded, still muted; unmuted, stored `on`). A blocked or throwing storage falls back to sound on.
- **Autoplay rules:** no `AudioContext` exists until a real player gesture (`pointerdown`, `keydown` or `touchend`); before that every call is a silent no-op. Verified live: before any gesture, `isUnlocked()` was `false`, a click returned `false` and zero oscillators existed. A suspended context (iOS) is resumed inside the gesture (tested).

## 6. Browser verification — TESTED

Real page at `?puzzles=v3`, synthetic saves, spying on the engine while the real engine ran:

| # | Check | Result |
|---|---|---|
| 1 | First-letter click | One `letter(1)` on the first touch |
| 2 | Progressive pitch | Arguments 1, 2, 3 … per word; the pitch table rises with each |
| 3 | Tap input | `letter:1,2,3` then the word result |
| 4 | Swipe input | Same, with **three extra hover moves over each letter and still one sound per new letter** |
| 5 | Key-term jackpot | `miniJackpot` once, 1.32 s |
| 6 | Secondary chime | `correct:financial` |
| 7 | Ordinary confirmation | `correct:ordinary` |
| 8 | Wrong word | `wrong`, no coin change |
| 9 | Duplicate word | `duplicate`, no coin change |
| 10 | Full-crossword jackpot | `grandJackpot` once, 2.67 s, with the layer of effects |
| 11 | No overlap | Key term as the last word: only `grandJackpot` |
| 12–13 | Mute and persistence | Header button mutes, stored `off`, survives a reload, unmutes |
| 15 | Victory celebration | Unchanged; Skip stops the jackpot and the effects together |
| 16 | Existing saves | Synthetic older save kept its coins, XP and unknown field (see the 27-puzzle report) |
| 18 | No duplicate rewards | Replay: 0 coins, 0 XP; displayed reward equals the real save change |

Items 14 (mobile audio) and 17 (daily login) are covered in §7 and §8.

## 7. Mobile compatibility — partly verified

- **Verified:** touch emulation at 320×568 and 375×812 (tap and swipe, the header button at 320 px with no overlap and no overflow, the completion card layout).
- **Designed for, not verified on a device:** Mobile Safari and iOS WKWebView need the context created and resumed inside a gesture. The engine does that on the first `pointerdown`, `keydown` or `touchend`, uses only `AudioContext` (with the `webkitAudioContext` fallback) and no features outside Safari's long-supported Web Audio set, and caps voices to keep the battery and CPU load low. **I did not run it in a native WKWebView and make no claim that audio plays there.** Two iOS behaviours to listen for: the very first click after launch may be slightly late while the context starts, and the hardware silent switch can mute web audio.

## 8. Performance observations

- A letter click is 3 short oscillators. The grand jackpot is the heaviest sequence, about 80 short oscillator voices spread over 2.65 s; the mini is about 40 over 1.3 s.
- A voice cap stops letter clicks from piling up while a long sequence plays; every voice is gain-capped at 0.07 and the whole mix goes through a compressor.
- The context is created once and reused; muting closes it, and unmuting makes a new one. Nodes are one-shot and garbage collected.
- Daily login rewards were **not** re-run in the browser this phase. The code is untouched and its automated tests pass.

## 9. Test results — TESTED

- Full suite: **451 tests, 451 pass, 0 fail** in America/Los_Angeles, UTC, Asia/Tokyo and Pacific/Auckland. `git diff --check` is clean. The iOS bundle is resynced and the parity guard now also covers `src/game-audio.js`.
- New `tests/game-audio.test.js` (21 tests) with a recording fake `AudioContext`: autoplay (nothing before a gesture), iOS resume, mute, pitch climb for letters 1 to 9 and the cap, short clicks, distinct soft feedback tiers, mini length 1 to 1.5 s, grand length 2 to 3 s with fanfare and sustained final chime, no overlapping jackpots, restart after the end, Skip versus mute, gain cap and voice cap, no-audio, throwing-constructor and throwing-oscillator fallbacks, and presentation-only scans.
- Wiring tests pin the one-sound-per-added-letter path, the unified tap and swipe path, the gesture-only unlock, the tier logic (grand only through the victory controller), and the single preference.
- **Mutation checks:** nine deliberate breaks (climb removed, final chime removed, mini during grand allowed, no gesture gate, mute ignored, mini played before the grand, wrong word silent, hover sound on ignored letters, jackpot on replays) were each caught. One was initially missed, and I tightened the final-chime assertion until it was caught.
- `tests/victory-celebration.test.js` was updated (its old built-in chime tests became injected-audio tests).

## 10. Exact files modified — IMPLEMENTED

New: `src/game-audio.js`, `tests/game-audio.test.js`.

Modified: `src/victory-celebration.js` (own synth removed; takes the injected engine; audio failures can't break it) · `word-game-app.js` (engine, unlock, sounds, unified toggle) · `index.html` (script tag, header sound button) · `word-game.css` (`.wg-level-tools`) · `scripts/build-www.sh` · `tests/victory-celebration.test.js` · `tests/bundle-parity.test.js`.

Regenerated by the resync: `ios/App/App/public/*`, `www/`. Files from the 27-puzzle work are listed in `FINLIT_QUEST_V3_27_PUZZLE_COMPLETION_REPORT.md`.

## 11. Remaining limitations and decisions

1. **Listen on a real phone** (Safari and the iOS app) before approving the sound design: the levels and the character of each tier are tuned on paper, not by ear. Tell me what to change (pitch range, loudness, length).
2. **Native iOS WKWebView audio is not verified.**
3. The sound preference key is still named `finlitQuest.victorySound` (kept so existing mute choices carry over); it now governs all gameplay sound.
4. The hardware silent switch and a locked screen follow the platform's normal web-audio rules.
5. Two sound controls exist (header during play, card while it is open) sharing one preference. Say if you want just one.
6. There is no separate volume slider; loudness is fixed and capped.

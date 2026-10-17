const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ROOT, memoryStorage } = require("./helpers.js");
const victory = require("../src/victory-celebration.js");

const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

test("new completions receive a bounded celebration; replays do not", () => {
  const first = victory.plan({ newlyCompleted: true, coins: 200, soundEnabled: true });
  assert.equal(first.celebrate, true);
  assert.equal(first.sound, true);
  assert.ok(first.coins >= 4 && first.coins <= 12);
  assert.equal(first.dollars, 8);
  assert.deepEqual(victory.plan({ newlyCompleted: false, coins: 200 }), {
    celebrate: false, motion: false, confetti: 0, coins: 0, dollars: 0, sound: false, durationMs: 0,
  });
});

test("reduced motion removes animation without removing completion information", () => {
  const result = victory.plan({ reducedMotion: true, newlyCompleted: true, coins: 40 });
  assert.equal(result.motion, false);
  assert.equal(result.durationMs, 0);
  assert.equal(victory.announcement({ coins: 40, xp: 12 }), "Puzzle solved! You earned 40 coins and 12 XP.");
});

test("mute and volume preferences persist independently of game progress", () => {
  const storage = memoryStorage();
  assert.equal(victory.loadSoundEnabled(storage), true);
  victory.saveSoundEnabled(storage, false);
  victory.saveSoundVolume(storage, 40);
  assert.equal(victory.loadSoundEnabled(storage), false);
  assert.equal(victory.loadSoundVolume(storage), 40);
  assert.deepEqual(Object.keys(storage.dump()).sort(), [victory.SOUND_KEY, victory.VOLUME_KEY].sort());
  assert.equal(victory.clampVolume(500), 100);
  assert.equal(victory.clampVolume(-1), 0);
});

test("production page exposes sound, volume, skip, and loads both modules before the game", () => {
  const html = read("index.html");
  assert.match(html, /id="wgSoundButton"[^>]*aria-pressed="true"/);
  assert.match(html, /id="wgVolumeSlider"[^>]*aria-label="Sound volume"/);
  assert.match(html, /id="wgSkipCelebration"/);
  assert.match(html, /id="wgCompleteAnnouncement" role="status" aria-live="polite"/);
  assert.ok(html.indexOf("src/game-audio.js") < html.indexOf("word-game-app.js"));
  assert.ok(html.indexOf("src/victory-celebration.js") < html.indexOf("word-game-app.js"));
  const app = read("word-game-app.js");
  assert.match(app, /newlyCompleted = !wgState\.wasCompleted/);
  assert.match(app, /wgAudio\.grandJackpot/);
  assert.match(app, /wgVictory\.start/);
});

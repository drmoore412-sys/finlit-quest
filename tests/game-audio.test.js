const test = require("node:test");
const assert = require("node:assert/strict");
const audio = require("../src/game-audio.js");

function fakeWindow() {
  const log = { contexts: 0, oscillators: [], gains: [] };
  class Context {
    constructor() { log.contexts++; this.currentTime = 0; this.state = "running"; this.destination = {}; }
    createGain() {
      const gain = { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} };
      const node = { gain, connect() {} };
      log.gains.push(node);
      return node;
    }
    createDynamicsCompressor() { return { threshold: {}, ratio: {}, connect() {} }; }
    createBiquadFilter() { return { type: "", frequency: {}, connect() {} }; }
    createOscillator() {
      const oscillator = { type: "", frequency: { setValueAtTime(value) { oscillator.frequencyValue = value; }, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} };
      log.oscillators.push(oscillator);
      return oscillator;
    }
    resume() { return Promise.resolve(); }
    close() {}
  }
  return { window: { AudioContext: Context }, log };
}

test("audio obeys browser gesture rules", () => {
  const fake = fakeWindow();
  const engine = audio.create({ window: fake.window });
  assert.equal(engine.letter(1), false);
  assert.equal(fake.log.contexts, 0);
  assert.equal(engine.unlock(), true);
  assert.equal(engine.letter(1), true);
  assert.equal(fake.log.contexts, 1);
});

test("letter feedback rises in pitch", () => {
  assert.ok(audio.letterFrequency(2) > audio.letterFrequency(1));
  assert.ok(audio.letterFrequency(8) > audio.letterFrequency(2));
  assert.equal(audio.letterFrequency(100), audio.letterFrequency(audio.LETTER_STEPS.length));
});

test("muting prevents context creation and all sounds", () => {
  const fake = fakeWindow();
  const engine = audio.create({ window: fake.window, isEnabled: () => false });
  assert.equal(engine.unlock(), false);
  assert.equal(engine.grandJackpot({ coins: 12 }), false);
  assert.equal(fake.log.contexts, 0);
});

test("word and jackpot tiers synthesize locally without media downloads", () => {
  const fake = fakeWindow();
  const engine = audio.create({ window: fake.window });
  engine.unlock();
  assert.equal(engine.correct("financial"), true);
  const chimeVoices = fake.log.oscillators.length;
  assert.equal(engine.miniJackpot(), true);
  assert.ok(fake.log.oscillators.length > chimeVoices);
  const source = require("node:fs").readFileSync(require("node:path").join(__dirname, "../src/game-audio.js"), "utf8");
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|\.mp3|\.wav|\.ogg/);
});

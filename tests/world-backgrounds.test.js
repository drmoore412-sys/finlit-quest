const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { ROOT } = require("./helpers.js");

function loadBackgrounds() {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "content/world-backgrounds.js"), "utf8"), sandbox);
  return sandbox.FINLIT_WORLD_BACKGROUNDS;
}

const WORLD_IDS = [
  "moneybasics", "credit", "crypto", "banking", "investing", "coins",
  "ai_technology", "real_estate", "taxes", "insurance", "business",
  "social_media", "retirement",
];

test("all 13 playable worlds have one explicit background mapping", () => {
  const backgrounds = loadBackgrounds();
  assert.deepEqual(Object.keys(backgrounds).sort(), [...WORLD_IDS].sort());
  WORLD_IDS.forEach(worldId => {
    assert.ok(backgrounds[worldId].theme, `${worldId} needs a theme`);
    assert.ok(backgrounds[worldId].position, `${worldId} needs desktop positioning`);
    assert.ok(backgrounds[worldId].mobilePosition, `${worldId} needs mobile positioning`);
  });
});

test("the ten available final backgrounds resolve to optimized local files", () => {
  const backgrounds = loadBackgrounds();
  const installed = WORLD_IDS.filter(worldId => backgrounds[worldId].imageUrl);
  assert.equal(installed.length, 10);
  installed.forEach(worldId => {
    const entry = backgrounds[worldId];
    assert.match(entry.imageUrl, /^assets\/worlds\/.+\.jpg$/);
    const file = path.join(ROOT, entry.imageUrl);
    assert.ok(fs.existsSync(file), `${worldId} background is missing: ${entry.imageUrl}`);
    assert.ok(fs.statSync(file).size < 750_000, `${worldId} background is not web optimized`);
  });
});

test("owner-approved artwork is never silently replaced", () => {
  const backgrounds = loadBackgrounds();
  const pending = {
    coins: "assets/worlds/coins-currency-approved.jpg",
    insurance: "assets/worlds/insurance-protection-approved.jpg",
    social_media: "assets/worlds/social-media-approved.jpg",
  };
  Object.entries(pending).forEach(([worldId, expectedFile]) => {
    assert.equal(backgrounds[worldId].imageUrl, null);
    assert.equal(backgrounds[worldId].expectedFile, expectedFile);
    assert.equal(backgrounds[worldId].assetStatus, "awaiting-owner-approved-file");
  });
});

test("runtime applies a selected world's mapping without touching gameplay state", () => {
  const source = fs.readFileSync(path.join(ROOT, "word-game-app.js"), "utf8");
  assert.match(source, /function wgApplyWorldBackground\(worldId\)/);
  assert.match(source, /wgState\.worldId = worldId;[\s\S]{0,120}wgApplyWorldBackground\(worldId\)/);
  assert.match(source, /screen\.dataset\.worldArtStatus/);
  assert.doesNotMatch(source, /wgApplyWorldBackground[\s\S]{0,1600}(coins|xp|reward|canonicalPuzzleProgress)\s*=/i);
});

test("background presentation protects readability and reduced-motion users", () => {
  const css = fs.readFileSync(path.join(ROOT, "word-game.css"), "utf8");
  assert.match(css, /background-size:cover/);
  assert.match(css, /--wg-world-position-mobile/);
  assert.match(css, /backdrop-filter:blur/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)[\s\S]*\.wg-screen:before,[\s\S]*\.wg-screen:after/);
});

test("world scenery remains visible through glass level, board, and wheel surfaces", () => {
  const css = fs.readFileSync(path.join(ROOT, "word-game.css"), "utf8");
  const rule = selector => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = css.match(new RegExp(`${escaped}\\{([^}]*)\\}`));
    assert.ok(match, `missing CSS rule for ${selector}`);
    return match[1];
  };

  const levelCard = rule(".wg-level-card");
  const board = rule(".wg-board");
  const wheel = rule(".wg-wheel-wrap .wheel");

  assert.match(levelCard, /rgba\(18,36,64,\.27\)/);
  assert.match(levelCard, /rgba\(7,18,35,\.23\)/);
  assert.match(board, /rgba\(21,41,76,\.20\)/);
  assert.match(board, /rgba\(5,17,34,\.16\)/);
  assert.match(wheel, /rgba\(28,53,90,\.20\)/);
  assert.match(wheel, /rgba\(5,17,34,\.16\)/);

  [levelCard, board, wheel].forEach(surface => {
    assert.doesNotMatch(surface, /(?:^|;)\s*opacity\s*:/, "glass surfaces must not fade child content");
    assert.match(surface, /backdrop-filter:blur\([4-7]px\)/);
  });
});

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { ROOT } = require("./helpers.js");

const read = file => fs.readFileSync(path.join(ROOT, file));
const text = file => read(file).toString("utf8");
const page = text("financial-city.html");
const assetPath = "assets/financial-city/financial-city-approved.png";

test("the exact owner-approved Financial City image is preserved as a permanent asset", () => {
  const image = read(assetPath);
  assert.equal(crypto.createHash("sha256").update(image).digest("hex"), "7189f8fa731ad09fc4f73d2683466d506fab955c69a906030d268ecc954e7bb2");
  assert.equal(image.toString("ascii", 1, 4), "PNG");
  assert.equal(image.readUInt32BE(16), 1670);
  assert.equal(image.readUInt32BE(20), 941);
});

test("all three Financial City map contexts render the approved image without cropping or stretching", () => {
  assert.match(page, new RegExp(`<link rel="preload" as="image" href="${assetPath.replaceAll(".", "\\.")}" fetchpriority="high">`));
  assert.match(page, /var FINANCIAL_CITY_ART = "assets\/financial-city\/financial-city-approved\.png"/);
  assert.match(page, /<image class='city-art' href='"\+FINANCIAL_CITY_ART\+"' x='0' y='0' width='1000' height='563' preserveAspectRatio='xMidYMid meet'\/>/);
  assert.match(page, /\.stage\{[^}]*aspect-ratio:1670\/941/);
  assert.equal((page.match(/cityScene\("(?:home|alloc|sim)"\)/g) || []).length, 3);
});

test("the entrance is decorative, DeFi has no pictured hotspot, and DeFi Tower remains interactive", () => {
  const pictured = page.match(/var PICTURED_DESTINATIONS = \[([^\]]+)\]/);
  assert.ok(pictured);
  assert.doesNotMatch(pictured[1], /"defi"/);
  assert.match(pictured[1], /"tower"/);
  assert.match(page, /The Financial City entrance is scenery, not a new destination/);
  assert.match(page, /DeFi remains in the allocation list below/);
  assert.match(page, /data-action='tower' tabindex='0' role='button'/);
  assert.match(page, /tw-enter-card" data-action="tower"/);
});

test("native bundling includes the approved Financial City image", () => {
  assert.match(text("scripts/build-www.sh"), /copy assets\/financial-city\/financial-city-approved\.png/);
});

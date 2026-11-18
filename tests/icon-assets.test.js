const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath));

function pngInfo(relativePath) {
  const data = read(relativePath);
  assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
    colorType: data[25],
  };
}

function sha256(relativePath) {
  return crypto.createHash("sha256").update(read(relativePath)).digest("hex");
}

test("website, home-screen, PWA, and iOS icons have their declared square dimensions", () => {
  const expected = {
    "assets/brand/favicon/favicon-16.png": 16,
    "assets/brand/favicon/favicon-32.png": 32,
    "assets/brand/favicon/favicon-48.png": 48,
    "assets/brand/favicon/favicon-96.png": 96,
    "assets/brand/icons/apple-touch-icon-180.png": 180,
    "assets/brand/icons/icon-192.png": 192,
    "assets/brand/icons/icon-512.png": 512,
    "assets/brand/icons/icon-512-maskable.png": 512,
    "assets/brand/icons/icon-1024-appstore.png": 1024,
    "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png": 1024,
  };

  for (const [relativePath, size] of Object.entries(expected)) {
    assert.deepEqual(pngInfo(relativePath), { width: size, height: size, colorType: 2 });
  }
});

test("Google Search and the web manifest reference existing correctly sized icons", () => {
  const html = read("index.html").toString("utf8");
  assert.match(html, /sizes="96x96" href="assets\/brand\/favicon\/favicon-96\.png(?:\?v=\d+)?"/);

  const manifest = JSON.parse(read("manifest.webmanifest").toString("utf8"));
  for (const icon of manifest.icons) {
    const size = Number(icon.sizes.split("x")[0]);
    const info = pngInfo(icon.src.split("?")[0]);
    assert.deepEqual([info.width, info.height], [size, size]);
  }
});

test("the approved glossy master, App Store export, and iOS AppIcon are consistent", () => {
  assert.ok(fs.existsSync(path.join(root, "assets/brand/source/FinLit_Quest_Icon_Mark_Glossy_Master_512.png")));
  const approved = sha256("assets/brand/icons/icon-1024-appstore.png");
  assert.equal(sha256("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"), approved);
});

test("the iOS web bundle carries the same generated icon bytes as production", () => {
  const files = [
    "assets/brand/favicon/favicon-16.png",
    "assets/brand/favicon/favicon-32.png",
    "assets/brand/favicon/favicon-48.png",
    "assets/brand/favicon/favicon-96.png",
    "assets/brand/favicon/favicon.ico",
    "assets/brand/icons/apple-touch-icon-180.png",
    "assets/brand/icons/icon-192.png",
    "assets/brand/icons/icon-512.png",
    "assets/brand/icons/icon-512-maskable.png",
  ];

  for (const relativePath of files) {
    assert.equal(sha256(path.join("ios/App/App/public", relativePath)), sha256(relativePath));
  }
});

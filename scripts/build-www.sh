#!/bin/sh
# Assembles the minimal runtime bundle Capacitor packages into the native app
# (www/). This is NOT a build step in the "compile/transpile" sense — the app
# has none — it's just copying exactly the files index.html/manifest actually
# reference, so the shipped app doesn't also carry tests/, docs/, scripts/,
# the git history, or the multi-MB raw brand source PNGs. The web deployment
# (GitHub Pages) keeps serving the full repo as it already does; this bundle
# is native-app-specific.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
WWW="$ROOT/www"

rm -rf "$WWW"
mkdir -p "$WWW"

copy() {
  mkdir -p "$WWW/$(dirname "$1")"
  cp "$ROOT/$1" "$WWW/$1"
}

# Entry point + manifest
copy index.html
copy manifest.webmanifest

# Stylesheets
for f in design-tokens.css styles.css hints.css premium.css learning-engine.css micro-lessons.css journey.css workbook-engine.css word-game.css; do
  copy "$f"
done

# Scripts (page-level)
for f in app.js learning-engine.js word-game-app.js workbook-app.js; do
  copy "$f"
done

# Scripts (src/ pure modules actually referenced by index.html)
for f in src/content-validator.js src/game-engine.js src/puzzle-bank-engine.js src/workbook-engine.js src/world-loader.js; do
  copy "$f"
done

# Content + world + curriculum runtime data
for f in content/crypto-terms.js content/credit-game-terms.js worlds/crypto.js worlds/credit-foundations.js curriculum/credit/approved/runtime/credit-foundations.js; do
  copy "$f"
done

# Brand assets actually referenced at runtime (favicon, apple-touch-icon, in-app header logo, PWA icons)
for f in assets/brand/favicon/favicon.ico assets/brand/favicon/favicon-16.png assets/brand/favicon/favicon-32.png \
         assets/brand/icons/apple-touch-icon-180.png assets/brand/icons/icon-192.png assets/brand/icons/icon-512.png assets/brand/icons/icon-512-maskable.png \
         assets/brand/web/wg-logo-96.png; do
  copy "$f"
done

echo "Built $WWW ($(find "$WWW" -type f | wc -l | tr -d ' ') files, $(du -sh "$WWW" | cut -f1))"

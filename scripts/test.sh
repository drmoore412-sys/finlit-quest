#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
if command -v node >/dev/null 2>&1; then NODE=node; else NODE=/Users/dmoore/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node; fi
cd "$ROOT"
"$NODE" --test tests/*.test.js

#!/bin/bash
# Nexus Observatory — local startup helper (no Python backend required).
set -euo pipefail

if [ ! -d node_modules ]; then
  npm install
fi

npm run dev

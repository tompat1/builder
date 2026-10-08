#!/usr/bin/env bash
set -euo pipefail

node scripts/convert-images.mjs
npm run test:gate
npm run build:bundle

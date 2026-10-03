#!/usr/bin/env bash
set -euo pipefail

npm run test:gate
npm run build:bundle

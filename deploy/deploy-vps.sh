#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/var/www/location-tracker

cd "$APP_DIR"
npm ci
npm run build
pm2 startOrReload ecosystem.config.cjs
pm2 save

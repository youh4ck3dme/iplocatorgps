#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/iplocatorgps}"
BRANCH="${BRANCH:-devtests}"
APP_NAME="${APP_NAME:-iplocatorgps}"
PORT="${PORT:-9999}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:${PORT}/api/health}"
HEALTHCHECK_RETRIES="${HEALTHCHECK_RETRIES:-12}"
HEALTHCHECK_DELAY="${HEALTHCHECK_DELAY:-2}"

PREV_COMMIT=""
ROLLED_BACK=0

echo "[deploy] app_dir=$APP_DIR branch=$BRANCH app_name=$APP_NAME port=$PORT"

rollback() {
  if [ "$ROLLED_BACK" -eq 1 ]; then
    return
  fi

  if [ -z "$PREV_COMMIT" ]; then
    echo "[deploy] rollback skipped (no previous commit captured)"
    return
  fi

  echo "[deploy] rollback started -> $PREV_COMMIT"
  ROLLED_BACK=1
  git checkout "$PREV_COMMIT"
  npm ci
  npm run build

  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    PORT="$PORT" pm2 start ecosystem.config.cjs --only "$APP_NAME" --update-env
  else
    PORT="$PORT" pm2 start ecosystem.config.cjs --only "$APP_NAME" --update-env
  fi

  pm2 save
  echo "[deploy] rollback completed"
}

if [ ! -d "$APP_DIR" ]; then
  echo "[deploy] ERROR: directory not found: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

if [ -d .git ]; then
  PREV_COMMIT="$(git rev-parse HEAD)"
  echo "[deploy] previous commit: $PREV_COMMIT"
  echo "[deploy] fetching latest code"
  git fetch --all --prune
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
else
  echo "[deploy] no git repo in APP_DIR, skipping git pull"
fi

echo "[deploy] installing dependencies"
npm install --legacy-peer-deps

echo "[deploy] running tests"
npm test

echo "[deploy] building app"
npm run build

echo "[deploy] reloading pm2"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  PORT="$PORT" pm2 start ecosystem.config.cjs --only "$APP_NAME" --update-env
else
  PORT="$PORT" pm2 start ecosystem.config.cjs --only "$APP_NAME" --update-env
fi

pm2 save

echo "[deploy] healthcheck: $HEALTHCHECK_URL"
ok=0
for i in $(seq 1 "$HEALTHCHECK_RETRIES"); do
  if curl -fsS "$HEALTHCHECK_URL" >/dev/null; then
    ok=1
    break
  fi
  sleep "$HEALTHCHECK_DELAY"
done

if [ "$ok" -ne 1 ]; then
  echo "[deploy] ERROR: healthcheck failed"
  rollback
  exit 1
fi

echo "[deploy] done"

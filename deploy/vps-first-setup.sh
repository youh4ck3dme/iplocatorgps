#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-tracker.your-domain.com}"
APP_DIR="${APP_DIR:-/var/www/iplocatorgps}"
REPO_URL="${REPO_URL:-https://github.com/youh4ck3dme/iplocatorgps.git}"
BRANCH="${BRANCH:-main}"

sudo apt update
sudo apt install -y git curl nginx certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm i -g pm2
fi

sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch --all --prune
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo "[setup] Fill .env.local before first production deploy."
fi

chmod +x deploy/deploy.sh
APP_DIR="$APP_DIR" BRANCH="$BRANCH" APP_NAME="iplocatorgps" PORT=3000 ./deploy/deploy.sh

sudo tee /etc/nginx/sites-available/iplocatorgps >/dev/null <<EOF
server {
    server_name ${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/iplocatorgps /etc/nginx/sites-enabled/iplocatorgps
sudo nginx -t
sudo systemctl reload nginx

echo "[setup] Requesting HTTPS certificate for ${DOMAIN}"
sudo certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m admin@"${DOMAIN}" --redirect || true

echo "[setup] Done. Verify: https://${DOMAIN}/api/health"

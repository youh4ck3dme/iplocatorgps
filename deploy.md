# Deploy Blueprint (`iplocatorgps`)

Tento dokument je **presný deploy postup** pre VPS s aktuálnym projektom.

---

## 1) Odporúčaný hosting

- ✅ **VPS (odporúčané)** – plná podpora SQLite perzistencie
- ⚠️ **Vercel (čiastočne)** – frontend pôjde, ale SQLite na lokálnom FS nie je spoľahlivá

Pre produkciu tejto verzie aplikácie používaj VPS.

---

## 2) Dôležité cesty pre AI (source of truth)

> Tieto cesty používaj pri úpravách/debuge/deploy automation.

- `iplocatorgps/deploy/deploy.sh` – hlavný deploy script (test/build/reload/healthcheck/rollback)
- `iplocatorgps/deploy/vps-first-setup.sh` – prvotný setup VPS (packages + nginx + certbot + deploy)
- `iplocatorgps/ecosystem.config.cjs` – PM2 app config (app name, cwd, port)
- `iplocatorgps/deploy/nginx-location-tracker.conf` – nginx sample config
- `iplocatorgps/.env.local.example` – env template
- `iplocatorgps/pages/api/health.js` – health endpoint
- `iplocatorgps/pages/api/location.js` – ingest endpoint
- `iplocatorgps/pages/api/session/[token].js` – replay session endpoint
- `iplocatorgps/pages/api/session/[token]/export.js` – export endpoint (`json|gpx`)
- `iplocatorgps/lib/sqliteStore.js` – SQLite storage layer

---

## 3) Runtime parametre (aktuálne)

- PM2 app name: `iplocatorgps`
- App directory na VPS: `/var/www/iplocatorgps`
- Default app port: `7676`
- Healthcheck URL: `http://127.0.0.1:7676/api/health`

---

## 4) Prvý deploy na VPS (full setup)

### 4.1 Prihlásenie

```bash
ssh <user>@<vps-ip>
```

### 4.2 Spustenie first-setup scriptu

```bash
sudo mkdir -p /var/www
sudo chown -R "$USER":"$USER" /var/www
cd /var/www

if [ ! -d iplocatorgps ]; then
  git clone https://github.com/youh4ck3dme/iplocatorgps.git
fi

cd /var/www/iplocatorgps
chmod +x deploy/vps-first-setup.sh deploy/deploy.sh
DOMAIN=tracker.your-domain.com BRANCH=main ./deploy/vps-first-setup.sh
```

Script spraví:
- install `git/curl/nginx/certbot/node/pm2`
- pull projektu
- prvý deploy cez `deploy.sh`
- nginx config + reload
- pokus o HTTPS certifikát

---

## 5) Povinné ENV pre produkciu

Súbor:

```bash
/var/www/iplocatorgps/.env.local
```

Minimum:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
LOCATION_DB_PATH=/var/www/iplocatorgps/data/location-tracker.sqlite
```

Optional:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

---

## 6) Každý ďalší deploy (update)

```bash
cd /var/www/iplocatorgps
APP_DIR=/var/www/iplocatorgps BRANCH=main APP_NAME=iplocatorgps PORT=7676 ./deploy/deploy.sh
```

`deploy.sh` flow:
1. fetch/pull branch
2. `npm ci`
3. `npm test`
4. `npm run build`
5. `pm2 reload/start`
6. healthcheck
7. rollback pri fail-e

---

## 7) Nginx (presný upstream)

Použi upstream na port `7676`:

```nginx
server {
    server_name tracker.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:7676;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktivácia:

```bash
sudo ln -sf /etc/nginx/sites-available/iplocatorgps /etc/nginx/sites-enabled/iplocatorgps
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS:

```bash
sudo certbot --nginx -d tracker.your-domain.com
```

---

## 8) PM2 operácie

```bash
pm2 status
pm2 logs iplocatorgps --lines 200
pm2 restart iplocatorgps
pm2 save
```

---

## 9) Smoke checks po deployi

Lokálne na VPS:

```bash
curl -fsS http://127.0.0.1:7676/api/health
```

Očakávaný JSON:

```json
{"ok":true,"service":"location-tracker","timestamp":"..."}
```

Verejne cez doménu:

```bash
curl -fsS https://tracker.your-domain.com/api/health
```

---

## 10) Dôležité endpointy

- `GET /api/health`
- `POST /api/location`
- `GET /api/session/:token`
- `GET /api/session/:token/export?format=json|gpx`

---

## 11) Poznámka k Vercel

Aktuálna implementácia používa lokálny SQLite súbor (`lib/sqliteStore.js`), preto:
- VPS = OK
- Vercel = len čiastočne (bez spoľahlivej perzistencie)

Ak chceš parity VPS + Vercel, treba prejsť na externú DB (napr. Turso/Supabase/Neon/Mongo Atlas).

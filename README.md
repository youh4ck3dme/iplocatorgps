# Location Tracker (Next.js)

## Setup
1. Copy `.env.local.example` to `.env.local`.
2. Fill `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
3. Optional: set `LOCATION_DB_PATH` (default: `./data/location-tracker.sqlite`).
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run:
   ```bash
   npm run dev
   ```

## Storage
- Location points are persisted in SQLite.
- Default DB file: `data/location-tracker.sqlite`.
- API session replay reads from SQLite, so session history survives server restart.

## Tests
```bash
npm test
```

## PWA
- Manifest: `public/manifest.json`
- Service worker: `public/sw.js`
- Offline page: `public/offline.html`
- App registration/meta: `pages/_app.js`

## Deploy to VPS (PM2 + Nginx)
1. Upload project to VPS path `/var/www/location-tracker`.
2. Create production env file `/var/www/location-tracker/.env.local`.
3. Install runtime tools once:
   ```bash
   npm i -g pm2
   sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
   ```
4. Prepare PM2 app name in `ecosystem.config.cjs` as `location-tracker`.
5. Deploy by script:
   ```bash
   cd /var/www/location-tracker
   chmod +x deploy/deploy.sh
   APP_DIR=/var/www/location-tracker BRANCH=main APP_NAME=location-tracker PORT=3000 ./deploy/deploy.sh
   ```
6. Configure Nginx:
   - Copy `deploy/nginx-location-tracker.conf` to `/etc/nginx/sites-available/location-tracker`
   - Set `server_name` to your domain
   - Enable site:
     ```bash
     sudo ln -s /etc/nginx/sites-available/location-tracker /etc/nginx/sites-enabled/location-tracker
     sudo nginx -t
     sudo systemctl reload nginx
     ```
7. Enable HTTPS:
   ```bash
   sudo certbot --nginx -d tracker.your-domain.com
   ```

## Routes
- `/` generates a tracking link
- `/[token]` starts precise tracking and displays Google Map
- `/[token]?view=1` live viewer mode (room-style read-only tracking)
- `POST /api/location` receives location payloads and persists to SQLite
- `GET /api/session/:token` returns session points for replay/viewers
- `GET /api/session/:token/export?format=json|gpx` exports session history
- `GET /api/health` healthcheck endpoint

## Advanced features
- Geofence circle with exceed alert
- ETA estimate to custom target coordinates
- Battery-aware tracking profile (auto lowers GPS aggressiveness on low battery)
- Session replay controls from captured trail
- Live share room via tokenized viewer link with auto-refresh

## Notes
- Use HTTPS for geolocation and PWA installability.
- Request tracking only with explicit consent.

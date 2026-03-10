# Location Tracker (Next.js)

Tento projekt je pokročilý nástroj na sledovanie GPS polohy v reálnom čase s podporou PWA, Telegram notifikácií a podrobným testovaním.

## 📍 Projektové informácie
- **Lokálna cesta**: `C:\Users\42195\Documents\dev-loccaa\dev_project\iplocatorgps`
- **Predvolený port**: `9999`

## 🚀 Rýchly štart
1. **Inštalácia balíčkov**:
   ```bash
   npm install
   ```
2. **Konfigurácia**:
   Skopíruj `.env.local.example` do `.env.local` a vyplň potrebné údaje (pozri sekciu Telegram).
3. **Spustenie vývojového servera**:
   ```bash
   npm run dev
   ```
   Web bude dostupný na: [http://localhost:9999](http://localhost:9999)

## 🗺️ Mapa (Leaflet)
Projekt bol migrovaný z Google Maps na **Leaflet (OpenStreetMap)**. 
- Nie je potrebný žiadny Google API kľúč.
- Mapy sú úplne zadarmo a načítavajú sa automaticky.

## 🤖 Telegram Notifikácie
Aby si dostával upozornenia o polohe do mobilu:
1. **BotToken**: Získaj od **@BotFather** na Telegrame (príkaz `/newbot`).
2. **ChatID**: Získaj od **@userinfobot** (napíše ti tvoje číselné ID).
3. Zapíš do `.env.local`:
   ```env
   TELEGRAM_BOT_TOKEN=tvoj_token
   TELEGRAM_CHAT_ID=tvoje_id
   ```

## 🧪 Testovanie (67 testov)
Projekt obsahuje komplexnú testovaciu suitu rozdelenú do viacerých vrstiev.

### 1. Logické a integračné testy (Vitest)
Tieto testy overujú matematické výpočty, databázu a API integritu.
- **Príkaz na spustenie**: `npm test`
- **Umiestnenie testov**: `C:\Users\42195\Documents\dev-loccaa\dev_project\iplocatorgps\tests\`
  - `utils.test.js`: Výpočty vzdialenosti a ETA.
  - `db-integration.test.js`: Práca s SQLite databázou.
  - `api-integrity.test.js`: Validácia vstupov a bezpečnosť API.
  - `location-api.test.js`, `session-api.test.js` atď.

### 2. End-to-End testy (Playwright)
Skutočné testy v prehliadači, ktoré klikajú na tlačidlá a overujú UI.
- **Príkaz na spustenie**: `npx playwright test`
- **Umiestnenie testov**: `C:\Users\42195\Documents\dev-loccaa\dev_project\iplocatorgps\tests\e2e.spec.js`
- **Konfigurácia**: `playwright.config.js`

## 📦 Úložisko
- Polohy sú ukladané v SQLite databáze.
- **Cesta k DB**: `data/location-tracker.sqlite` (definované v `LOCATION_DB_PATH`).

## 📱 PWA (Progresívna webová aplikácia)
- Aplikáciu je možné inštalovať na plochu mobilu.
- Manifest: `public/manifest.json`
- Service worker: `public/sw.js`

## 🛠️ Nasadenie na VPS
Projekt je pripravený na nasadenie cez PM2 a Nginx.
1. Script na nasadenie: `deploy/deploy.sh`
2. PM2 konfigurácia: `ecosystem.config.cjs` (nastavené na port 9999)
3. Nginx konfigurácia: `deploy/nginx-location-tracker.conf`

## 🔗 Trasy (Routes)
- `/`: Generovanie unikátneho trackovacieho linku.
- `/[token]`: Stránka pre mobilné zariadenie (odosielanie GPS).
- `/[token]?view=1`: Viewer móde (sledovanie live na mape).
- `GET /api/session/[token]/export?format=gpx`: Export trasy do GPX.

---
*Poznámka: Pre fungovanie GPS a PWA je na produkcii nutné použiť HTTPS!*

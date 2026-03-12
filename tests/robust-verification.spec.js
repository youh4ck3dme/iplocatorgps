import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9999';
const TEST_TOKEN = 'test-token-123';
const VALID_PASSWORD = '23513900';

// Global mocks and setup
test.beforeEach(async ({ page }) => {
    // Mock IP API globally
    await page.route('https://ipapi.co/json/', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ city: 'Bratislava', country_name: 'Slovakia', latitude: 48.1, longitude: 17.1 })
    }));

    // Default empty session mock to prevent random API hits
    await page.route(`**/api/session/${TEST_TOKEN}`, route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ session: { points: [] } })
    }));
});

test.describe('1. Zabezpečenie (Auth)', () => {
    test.beforeEach(async ({ context }) => {
        await context.clearCookies();
    });

    test('Redirect Unauthorized: accessing / redirects to /login', async ({ page }) => {
        await page.goto(`${BASE_URL}/`);
        await page.waitForURL(/.*\/login/, { timeout: 15000 });
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('Public Access: /temu/[token] is accessible without login', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText(/DARČEKY ZADARMO!/i, { timeout: 10000 });
    });

    test('Invalid Password: verify error message', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[placeholder="Zadajte heslo"]', 'wrong-pass');
        await page.click('button:has-text("Odomknúť prístup")');
        await expect(page.locator('text=Nesprávne heslo. Skúste to znova.')).toBeVisible({ timeout: 10000 });
    });

    test('Valid Login: successful login with correct password', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[placeholder="Zadajte heslo"]', VALID_PASSWORD);
        await page.click('button:has-text("Odomknúť prístup")');
        await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
        await expect(page).toHaveURL(`${BASE_URL}/`);
    });

    test('Cookie Presence: auth_token is set after login', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[placeholder="Zadajte heslo"]', VALID_PASSWORD);
        await page.click('button:has-text("Odomknúť prístup")');
        await page.waitForURL(`${BASE_URL}/`);
        const cookies = await page.context().cookies();
        const authCookie = cookies.find(c => c.name === 'auth_token');
        expect(authCookie).toBeDefined();
        expect(authCookie.value).toBe('valid_session');
    });

    test('Persistence: session persists after reload', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[placeholder="Zadajte heslo"]', VALID_PASSWORD);
        await page.click('button:has-text("Odomknúť prístup")');
        await page.waitForURL(`${BASE_URL}/`);
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(`${BASE_URL}/`);
    });

    test('Logout: access denied after clearing cookies', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[placeholder="Zadajte heslo"]', VALID_PASSWORD);
        await page.click('button:has-text("Odomknúť prístup")');
        await page.waitForURL(`${BASE_URL}/`);
        await page.context().clearCookies();
        await page.goto(`${BASE_URL}/`);
        await page.waitForURL(/.*\/login/);
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('Direct API Access: /api/session/[token] protection', async ({ page }) => {
        await page.goto(`${BASE_URL}/api/session/${TEST_TOKEN}`);
        await page.waitForURL(/.*\/login/);
        await expect(page).toHaveURL(/.*\/login/);
    });

    test('Static Assets: CSS/Images not blocked', async ({ page }) => {
        const response = await page.request.get(`${BASE_URL}/styles/temu.css`);
        expect(response.ok()).toBeTruthy();
    });

    test('Auth API Protection: /api/auth exists', async ({ page }) => {
        const response = await page.request.post(`${BASE_URL}/api/auth`, {
            data: { password: VALID_PASSWORD }
        });
        expect(response.ok()).toBeTruthy();
    });
});

test.describe('2. IP Tracking Fallback', () => {
    test('IP API Call & Fallback Logic', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}`);
        await expect(page.locator('text=Bratislava, Slovakia')).toBeVisible({ timeout: 15000 });
    });

    test('Data Payload: Verify accurate data sent to /api/location', async ({ page }) => {
        const [request] = await Promise.all([
            page.waitForRequest(request => 
                request.url().includes('/api/location') && 
                request.method() === 'POST' &&
                JSON.parse(request.postData()).accuracy === 10000
            , { timeout: 20000 }),
            page.goto(`${BASE_URL}/temu/${TEST_TOKEN}`)
        ]);
        const sentData = JSON.parse(request.postData());
        expect(sentData.token).toBe(TEST_TOKEN);
        expect(sentData.accuracy).toBe(10000);
    });

    test('No GPS Required: IP tracking works if GPS denied', async ({ page }) => {
        await page.context().setPermissions(`${BASE_URL}/`, []); 
        const [request] = await Promise.all([
            page.waitForRequest(request => 
                request.url().includes('/api/location') && 
                JSON.parse(request.postData()).accuracy === 10000,
                { timeout: 20000 }
            ),
            page.goto(`${BASE_URL}/temu/${TEST_TOKEN}`)
        ]);
        expect(request).toBeDefined();
    });

    test('Location Display in UI', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}`);
        await expect(page.locator('.temu-cookie-banner')).toBeVisible({ timeout: 15000 });
    });

    test('Default Fallback: "Slovakia (Global)" on error', async ({ page }) => {
        await page.route('https://ipapi.co/json/', route => route.abort());
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}`);
        await expect(page.locator('text=Slovakia (Global)')).toBeVisible({ timeout: 15000 });
    });

    test('No Double Send for IP', async ({ page }) => {
        let callCount = 0;
        await page.route('**/api/location', route => {
            const data = JSON.parse(route.request().postData());
            if (data.accuracy === 10000) callCount++;
            route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
        });
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(5000); 
        expect(callCount).toBe(1);
    });

    test('Admin Protection: No IP tracking in view=1', async ({ page }) => {
        let callCount = 0;
        await page.route('**/api/location', route => {
            callCount++;
            route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
        });
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        expect(callCount).toBe(0);
    });

    test('Accuracy Label on Dashboard', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[placeholder="Zadajte heslo"]', VALID_PASSWORD);
        await page.click('button:has-text("Odomknúť prístup")');
        await page.waitForURL(`${BASE_URL}/`);
        
        await page.route(`**/api/session/${TEST_TOKEN}`, route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                session: {
                    points: [{ lat: 48.1, lng: 17.1, accuracy: 10000 }]
                }
            })
        }));
        
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text=IP Only')).toBeVisible({ timeout: 20000 });
    });

    test('Storage Integration: Verify point storage', async ({ page }) => {
        const response = await page.request.post(`${BASE_URL}/api/location`, {
            data: { token: TEST_TOKEN, lat: 48, lng: 17, accuracy: 10000 }
        });
        expect(response.ok()).toBeTruthy();
    });

    test('Device Metadata: Check screen resolution', async ({ page }) => {
        const [request] = await Promise.all([
            page.waitForRequest(request => request.url().includes('/api/location'), { timeout: 25000 }),
            page.goto(`${BASE_URL}/temu/${TEST_TOKEN}`)
        ]);
        const sentData = JSON.parse(request.postData());
        expect(sentData.deviceInfo.screen).toMatch(/\d+x\d+/);
    });
});

test.describe('3. Vizuálny redesign (Light Mode)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}`);
        await page.waitForLoadState('networkidle');
    });

    test('Background Color verification', async ({ page }) => {
        const bgColor = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        const isBodyLight = bgColor && bgColor.match(/rgb\(255, 255, 255\)|rgb\(248, 250, 252\)/);
        expect(isBodyLight).toBeTruthy();
    });

    test('Text Contrast: Branding', async ({ page }) => {
        const color = await page.evaluate(() => {
            const el = document.querySelector('.live-feed');
            return el ? getComputedStyle(el).color : null;
        });
        expect(color).toBe('rgb(255, 255, 255)'); 
    });

    test('Glassmorphism presence', async ({ page }) => {
        const shadow = await page.evaluate(() => {
            const el = document.querySelector('.final-popup') || document.querySelector('.temu-cookie-banner') || document.querySelector('div[style*="boxShadow"]');
            return el ? getComputedStyle(el).boxShadow : 'none';
        });
        expect(shadow).not.toBe('none');
    });

    test('Font Family fallback', async ({ page }) => {
        const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
        // More lenient regex to handle system fonts and quotes
        expect(font.toLowerCase()).toMatch(/inter|sans-serif|system-ui|arial|helvetica/);
    });

    test('Button Style: Vibrant', async ({ page }) => {
        const btn = page.locator('.spin-btn').first();
        await expect(btn).toBeVisible({ timeout: 15000 });
        const color = await btn.evaluate(el => getComputedStyle(el).backgroundColor);
        expect(color).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('Product Card border/shadow', async ({ page }) => {
        const card = page.locator('.product-card').first();
        await expect(card).toBeVisible({ timeout: 15000 });
        const shadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
        expect(shadow).not.toBe('none');
    });

    test('Responsive Grid', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('.product-grid')).toBeVisible({ timeout: 10000 });
    });

    test('Cookie Banner visible on start', async ({ page }) => {
        await expect(page.locator('.temu-cookie-banner')).toBeVisible({ timeout: 15000 });
    });

    test('Icon presence', async ({ page }) => {
        await expect(page.locator('svg').first()).toBeVisible({ timeout: 15000 });
    });

    test('Header visibility', async ({ page }) => {
        await expect(page.locator('header.temu-nav')).toBeVisible({ timeout: 10000 });
    });
});

test.describe('4. Vylepšenie Dashboardu', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[placeholder="Zadajte heslo"]', VALID_PASSWORD);
        await page.click('button:has-text("Odomknúť prístup")');
        await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 });
    });

    test('Geofence Title visibility', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h3:has-text("Geofence Control")')).toBeVisible({ timeout: 20000 });
    });

    test('Radius Slider updates text', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await page.fill('input[type="range"]', '750');
        await expect(page.locator('text=750 m')).toBeVisible({ timeout: 10000 });
    });

    test('Distance metric present', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await expect(page.locator('text=Total Distance')).toBeVisible({ timeout: 10000 });
    });

    test('Pings counter present', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await expect(page.locator('text=Pings Recorded')).toBeVisible({ timeout: 10000 });
    });

    test('Live Refresh Logic', async ({ page }) => {
        let callCount = 0;
        await page.route(`**/api/session/${TEST_TOKEN}`, route => {
            callCount++;
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ session: { points: [] } }) });
        });
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await page.waitForTimeout(10000); 
        expect(callCount).toBeGreaterThan(1);
    });

    test('Replay Button state', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        const btn = page.locator('button:has-text("Play Route")');
        await expect(btn).toBeVisible({ timeout: 15000 });
    });

    test('Accuracy display', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await expect(page.locator('text=Current Accuracy')).toBeVisible({ timeout: 10000 });
    });

    test('Admin UI is light', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await page.waitForLoadState('networkidle');
        const bgColor = await page.evaluate(() => {
            const main = document.querySelector('main') || document.body;
            return getComputedStyle(main).backgroundColor;
        });
        expect(bgColor).toMatch(/rgb\(248, 250, 252\)|rgb\(255, 255, 255\)/);
    });

    test('Map container exists', async ({ page }) => {
        // Need to provide at least one point for the map to render in this project
        await page.route(`**/api/session/${TEST_TOKEN}`, route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ session: { points: [{ lat: 48, lng: 17, accuracy: 10 }] } })
        }));
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 30000 });
    });

    test('Pings Recorded Value matches', async ({ page }) => {
        await page.route(`**/api/session/${TEST_TOKEN}`, route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ session: { points: [{}, {}, {}, {}] } })
        }));
        await page.goto(`${BASE_URL}/temu/${TEST_TOKEN}?view=1`);
        await page.waitForLoadState('networkidle');
        const count = page.locator('div:has-text("Pings Recorded") + div');
        await expect(count).toHaveText('4', { timeout: 20000 });
    });
});

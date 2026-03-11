import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:9999';
const TEMU_URL = `${BASE_URL}/temu/test-token`;

test.beforeEach(async ({ page, context }) => {
    test.setTimeout(180000); // 3 minutes per test for ultra stability

    // Mock Geolocation
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 48.1485, longitude: 17.1077 });

    // Silence all alerts and set TEST_MODE
    await page.addInitScript(() => {
        window.alert = () => { console.log("[TEST] Alert silenced"); };
        window.TEST_MODE = true;
    });
});

test.describe('Temu Gamified Flow - 30 Verification Scenarios', () => {

    test('T1: Temu page loads with blurred background', async ({ page }) => {
        await page.goto(TEMU_URL);
        await expect(page.locator('.main-content')).toHaveClass(/content-blur/);
    });

    test('T2: Cookie banner is visible on start', async ({ page }) => {
        await page.goto(TEMU_URL);
        await expect(page.getByText('Overenie lokality')).toBeVisible();
    });

    test('T3: Live feed exists', async ({ page }) => {
        await page.goto(TEMU_URL);
        await expect(page.locator('.live-feed')).toBeVisible();
    });

    test('T4: Product grid shows 6 items', async ({ page }) => {
        await page.goto(TEMU_URL);
        const count = await page.locator('.product-card').count();
        expect(count).toBe(6);
    });

    test('T5: Navigation categories exist', async ({ page }) => {
        await page.goto(TEMU_URL);
        await expect(page.getByText('Topánky')).toBeVisible();
    });

    test('T6: Cookie banner closes on interaction', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await expect(page.locator('.temu-cookie-banner')).not.toBeVisible({ timeout: 10000 });
    });

    test('T7: Magic boxes appear after cookies', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box', { timeout: 10000 });
        await expect(page.locator('.magic-box').first()).toBeVisible();
    });

    test('T8: Progress bar starts at 85% after box pick', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelector('.magic-box').click());
        await page.waitForSelector('.progress-bar', { state: 'attached', timeout: 10000 });
        const style = await page.locator('.progress-bar').getAttribute('style');
        expect(style).toContain('width: 85%');
    });

    test('T9: Wheel is visible after box pick', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelectorAll('.magic-box')[1].click());
        await expect(page.locator('.wheel-inner')).toBeVisible({ timeout: 10000 });
    });

    test('T10: Spin button pulses initially', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelectorAll('.magic-box')[2].click());
        await page.waitForSelector('.spin-btn');
        await expect(page.locator('.spin-btn')).toHaveClass(/pulsing/);
    });

    test('T11: Spin 1 increases progress to 98% (robust check)', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelector('.magic-box').click());
        await page.waitForSelector('.spin-btn', { state: 'visible' });
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForFunction(() => document.body.innerText.includes('0.02€'), { timeout: 30000 });
        await expect(page.getByText('0.02€')).toBeVisible();
    });

    test('T12: Spin 1 status text updates', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelector('.magic-box').click());
        await page.waitForFunction(() => document.body.innerText.includes('Získali ste bonusový hod'), { timeout: 10000 });
        await expect(page.getByText('Získali ste bonusový hod')).toBeVisible();
    });

    test('T13: Spin count text decrement check', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelector('.magic-box').click());
        await page.waitForSelector('.spin-btn', { state: 'visible' });
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForFunction(() => document.body.innerText.includes('Máte 1 voľné pokusy'), { timeout: 30000 });
        await expect(page.getByText('Máte 1 voľné pokusy')).toBeVisible();
    });

    // Tests 14-30 follow similar robust pattern
    test('T14: Full game walkthrough to success screen', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelector('.magic-box').click());
        await page.waitForSelector('.spin-btn');
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForFunction(() => document.body.innerText.includes('Máte 1 voľné pokusy'), { timeout: 30000 });
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForSelector('.final-popup', { state: 'visible', timeout: 30000 });
        await page.fill('input[type="email"]', 'walkthrough@test.com');
        await page.evaluate(() => document.querySelector('button[type="submit"]').click());
        await expect(page.getByText('ÚSPECH!')).toBeVisible({ timeout: 10000 });
    });

    test('T15: Email input requirement check', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelector('.magic-box').click());
        await page.waitForSelector('.spin-btn');
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForFunction(() => document.body.innerText.includes('Máte 1 voľné pokusy'), { timeout: 30000 });
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForSelector('.final-popup', { state: 'visible', timeout: 30000 });
        const isValid = await page.evaluate(() => document.querySelector('input[type="email"]').checkValidity());
        expect(isValid).toBe(false);
    });

    test('T16: Location detection fallback after fetch', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.waitForFunction(() => !document.body.innerText.includes('Detecting...'), { timeout: 10000 });
        await expect(page.getByText(/oblasť|Slovakia/)).toBeVisible();
    });

    test('T17: Navigation categories count', async ({ page }) => {
        await page.goto(TEMU_URL);
        const count = await page.locator('.temu-categories span').count();
        expect(count).toBeGreaterThanOrEqual(4);
    });

    test('T18: Success screen email persistence', async ({ page }) => {
        const mail = 'user.final@check.sk';
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelector('.magic-box').click());
        await page.waitForSelector('.spin-btn');
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForFunction(() => document.body.innerText.includes('Máte 1 voľné pokusy'), { timeout: 30000 });
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForSelector('.final-popup', { state: 'visible', timeout: 30000 });
        await page.fill('input[type="email"]', mail);
        await page.evaluate(() => document.querySelector('button[type="submit"]').click());
        await expect(page.getByText(mail)).toBeVisible();
    });

    test('T19: Final success state persistence', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelector('.magic-box').click());
        await page.waitForSelector('.spin-btn');
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForFunction(() => document.body.innerText.includes('Máte 1 voľné pokusy'), { timeout: 30000 });
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForSelector('.final-popup', { state: 'visible', timeout: 30000 });
        await page.fill('input[type="email"]', 'stay.test@check.com');
        await page.evaluate(() => document.querySelector('button[type="submit"]').click());
        await page.waitForTimeout(2000);
        await expect(page.getByText('ÚSPECH!')).toBeVisible();
    });

    test('T20: Rating star count per product', async ({ page }) => {
        await page.goto(TEMU_URL);
        const stars = await page.locator('.stars').first().locator('svg').count();
        expect(stars).toBe(5);
    });

    test('T21: Product review count format', async ({ page }) => {
        await page.goto(TEMU_URL);
        const reviews = await page.locator('.product-rating .count').first().textContent();
        expect(reviews).toMatch(/\(.+\)/);
    });

    test('T22: Viewport constraints for mobile responsiveness', async ({ page }) => {
        await page.goto(TEMU_URL);
        const meta = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(meta).toContain('user-scalable=0');
    });

    test('T23: CSS class for blurred content toggle', async ({ page }) => {
        await page.goto(TEMU_URL);
        await expect(page.locator('.main-content')).toHaveClass(/content-blur/);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        // gameState is 0, still blurry
        await expect(page.locator('.main-content')).toHaveClass(/content-blur/);
    });

    test('T24: Heart button icons visibility', async ({ page }) => {
        await page.goto(TEMU_URL);
        await expect(page.locator('.heart-btn').first()).toBeVisible();
    });

    test('T25: Categories active state visibility', async ({ page }) => {
        await page.goto(TEMU_URL);
        await expect(page.locator('.temu-categories span.active')).toBeVisible();
    });

    test('T26: Multiple rapid box interactions', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => {
            const boxes = document.querySelectorAll('.magic-box');
            boxes[0].click();
            boxes[1].click();
            boxes[2].click();
        });
        await expect(page.locator('.step-wheel')).toBeVisible();
    });

    test('T27: Spin button disabled during active animation', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelector('.magic-box').click());
        await page.waitForSelector('.spin-btn');
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        const isDisabled = await page.locator('.spin-btn').isDisabled();
        expect(isDisabled).toBe(true);
    });

    test('T28: Brand logo image existence', async ({ page }) => {
        await page.goto(TEMU_URL);
        await expect(page.locator('.temu-brand-row img')).toBeVisible();
    });

    test('T29: Section title text content', async ({ page }) => {
        await page.goto(TEMU_URL);
        await expect(page.getByText('Všetko pod 19,99 €')).toBeVisible();
    });

    test('T30: Final success state persistence check', async ({ page }) => {
        await page.goto(TEMU_URL);
        await page.evaluate(() => document.querySelector('.temu-cookie-banner')?.click());
        await page.waitForSelector('.magic-box');
        await page.evaluate(() => document.querySelectorAll('.magic-box')[0].click());
        await page.waitForSelector('.spin-btn');
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForFunction(() => document.body.innerText.includes('Máte 1 voľné pokusy'), { timeout: 30000 });
        await page.evaluate(() => document.querySelector('.spin-btn').click());
        await page.waitForSelector('.final-popup', { state: 'visible', timeout: 30000 });
        await page.fill('input[type="email"]', 'final@check.com');
        await page.evaluate(() => document.querySelector('button[type="submit"]').click());
        await page.waitForTimeout(2000);
        await expect(page.getByText('ÚSPECH!')).toBeVisible();
    });
});

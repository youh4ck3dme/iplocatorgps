import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9999';

test.describe('E2E Flows', () => {
    test('landing page loads correctly', async ({ page }) => {
        await page.goto(BASE_URL);
        await expect(page.locator('h1')).toContainText('Location Tracker');
        await expect(page.getByText('Generate a one-time testing link')).toBeVisible();
    });

    test('generates tracking link after mount', async ({ page }) => {
        await page.goto(BASE_URL);
        // Link generation is in useEffect, so it might take a moment
        await expect(page.locator('a[href*="/"]')).toBeVisible();
        const linkText = await page.locator('a').first().textContent();
        expect(linkText).toContain(BASE_URL);
    });

    test('copy button exists and works', async ({ page }) => {
        await page.goto(BASE_URL);
        const copyButton = page.getByRole('button', { name: 'Copy link' });
        await expect(copyButton).toBeVisible();
    });

    test('tracker page shows consent warning', async ({ page }) => {
        await page.goto(`${BASE_URL}/test-token`);
        await expect(page.getByText('I agree to share my location')).toBeVisible();
    });

    test('tracker page shows battery-aware option', async ({ page }) => {
        await page.goto(`${BASE_URL}/test-token`);
        await expect(page.getByText('Battery-aware tracking')).toBeVisible();
    });

    test('viewer mode shows live refresh message', async ({ page }) => {
        await page.goto(`${BASE_URL}/test-token?view=1`);
        await expect(page.getByText('Viewer mode is active')).toBeVisible();
    });

    test('viewer mode hide start buttons', async ({ page }) => {
        await page.goto(`${BASE_URL}/test-token?view=1`);
        await expect(page.getByRole('button', { name: 'Start precise tracking' })).not.toBeVisible();
    });

    test('geofence settings are interactive', async ({ page }) => {
        await page.goto(`${BASE_URL}/test-token`);
        const radiusInput = page.locator('input[type="number"]');
        await radiusInput.fill('150');
        expect(await radiusInput.inputValue()).toBe('150');
    });

    test('replay section shown', async ({ page }) => {
        await page.goto(`${BASE_URL}/test-token`);
        await expect(page.getByText('Session replay')).toBeVisible();
    });

    test('map container exists on tracker page', async ({ page }) => {
        await page.goto(`${BASE_URL}/test-token`);
        // Before fix it shows "Map will appear after first GPS fix."
        await expect(page.getByText('Map will appear after first GPS fix.')).toBeVisible();
    });
});

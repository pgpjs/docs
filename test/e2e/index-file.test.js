import { test, expect } from '@playwright/test';

test.describe('Index file hosting', () => {
  test('should serve from index file', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero h1')).toContainText(
      'OpenPGP Without the Complexity',
    );
    expect(page.url()).toMatch(/\/$/);
  });

  test('should use homepage links in history mode', async ({ page }) => {
    await page.goto('/');
    await page.click('a.btn[href="/quickstart"]');
    await expect(page.locator('#main')).toContainText('Quick start');
    expect(page.url()).toMatch(/\/quickstart\/?$/);
  });
});

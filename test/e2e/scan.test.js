import { test, expect } from '@playwright/test';

test.describe('ChatScan explorer', () => {
  test('GET /api/v1/connection reports ChatScan and the daemon', async ({
    request,
  }) => {
    const response = await request.get('/api/v1/connection');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.chatscan.ok).toBe(true);
    expect(body.daemon.ok).toBe(true);
    expect(body.cdci.ok).toBe(false);
  });

  test('/scan/chat shows a good ChatScan connection', async ({ page }) => {
    await page.goto('/scan/chat');
    await expect(page.locator('#main h1')).toContainText('ChatScan');
    await expect(page.locator('[data-scan-chatscan-ok]')).toHaveText(
      'connected',
      { timeout: 15_000 },
    );
    await expect(page.locator('[data-scan-daemon-ok]')).toHaveText('connected');
    await expect(page.locator('[data-scan-summary]')).toContainText(
      'Connection is good',
    );
  });

  test('/scan/sdk documents PgpjsScan.connect', async ({ page }) => {
    await page.goto('/scan/sdk');
    await expect(page.locator('#main h1')).toContainText('PGPJS Scan SDK');
    await expect(page.locator('#main')).toContainText('PgpjsScan.connect');
    await expect(page.locator('#main')).toContainText('/api/v1/connection');
  });

  test('SDK is served for other PGPJS apps', async ({ request }) => {
    const response = await request.get('/sdk/pgpjs-scan.js');
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain('export class PgpjsScan');
    expect(body).toContain('checkConnection');
  });
});

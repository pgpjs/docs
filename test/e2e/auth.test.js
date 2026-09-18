import { createHash } from 'node:crypto';
import { test, expect } from '@playwright/test';

function tokenHash(pgpid, codeid = '') {
  return createHash('sha256').update(`${pgpid}:${codeid}`).digest('hex');
}

test.describe('Blackeye footer login', () => {
  test('footer login is the only chrome login link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero h1')).toContainText(
      'OpenPGP Without the Complexity',
    );
    await expect(page.locator('.main-nav a', { hasText: 'login' })).toHaveCount(
      0,
    );
    const login = page.locator('.under-footer-col a[href="/auth/"]');
    await expect(login).toHaveText('login');
    await login.click();
    await expect(page.locator('#main')).toContainText('Blackeye token login');
    expect(page.url()).toMatch(/\/auth\/?$/);
  });

  test('token docs explain pig create token', async ({ page }) => {
    await page.goto('/auth/token');
    await expect(page.locator('#main h1')).toContainText('Make a login token');
    await expect(page.locator('#main')).toContainText(
      'node scripts/pig.mjs create token',
    );
    await expect(page.locator('#main')).toContainText('/auth/{pgpid}/{codeid}');
  });

  test('unknown token URL stays on /auth/{pgpid}/{codeid} and fails closed', async ({
    page,
  }) => {
    const pgpid = 'a'.repeat(64);
    await page.goto(`/auth/${pgpid}/-`);
    await expect(page.locator('#main h1')).toContainText('Login failed');
    expect(page.url()).toContain(`/auth/${pgpid}/-`);
  });

  test('valid token signs in on /auth/{pgpid}/{codeid}', async ({ page }) => {
    const pgpid = 'b'.repeat(64);
    const hash = tokenHash(pgpid, '');
    await page.route('**/auth/tokens.hashes.json', async route => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ hashes: [hash] }),
      });
    });
    await page.goto(`/auth/${pgpid}/-`);
    await expect(page.locator('#main h1')).toContainText('Signed in');
    expect(page.url()).toContain(`/auth/${pgpid}/-`);
  });

  test('login form navigates to /auth/{pgpid}/{codeid}', async ({ page }) => {
    const pgpid = 'c'.repeat(64);
    const hash = tokenHash(pgpid, 'secret');
    await page.route('**/auth/tokens.hashes.json', async route => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ hashes: [hash] }),
      });
    });
    await page.goto('/auth/');
    await page.locator('#blackeye-pgpid').fill(pgpid);
    await page.locator('#blackeye-codeid').fill('secret');
    await page.locator('[data-blackeye-login] button[type="submit"]').click();
    await expect(page.locator('#main h1')).toContainText('Signed in');
    expect(page.url()).toContain(`/auth/${pgpid}/secret`);
  });
});

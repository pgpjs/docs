import docsifyInit from '../helpers/docsify-init.js';
import { test, expect } from './fixtures/docsify-init-fixture.js';

test.describe('Index file hosting', () => {
  const sharedOptions = {
    config: {
      basePath: '/index.html#/',
    },
    testURL: '/index.html#/',
  };

  test('should serve from index file', async ({ page }) => {
    await docsifyInit({
      ...sharedOptions,
      waitForSelector: '.hero h1',
    });
    await expect(page.locator('.hero h1')).toContainText(
      'OpenPGP Without the Complexity',
    );
    await expect(page.locator('#main')).toContainText(
      'Pretty Good Privacy | JavaScript documentation site generator',
    );
    expect(page.url()).toMatch(/index\.html#\/$/);
  });

  test('should use index file links in sidebar from index file hosting', async ({
    page,
  }) => {
    await docsifyInit({
      ...sharedOptions,
      waitForSelector: '.hero h1',
    });
    await page.click('a.btn[href="#/quickstart"]');
    await expect(page.locator('#main')).toContainText('Quick start');
    expect(page.url()).toMatch(/index\.html#\/quickstart$/);
  });
});

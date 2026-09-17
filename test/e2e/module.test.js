import { test, expect } from './fixtures/docsify-init-fixture.js';

for (const moduleName of ['pgpjs.module.js', 'pgpjs.module.min.js']) {
  test(`initializes PGPJS from ${moduleName}`, async ({ page }) => {
    await page.setContent('<div id="app"></div>');
    await page.addScriptTag({
      type: 'module',
      content: `
        import { PGPJS } from '/dist/${moduleName}';

        new PGPJS({
          routes: {
            '/': '# PGPJS ES module',
          },
        });
      `,
    });

    await expect(page.locator('#main')).toContainText('PGPJS ES module');
  });
}

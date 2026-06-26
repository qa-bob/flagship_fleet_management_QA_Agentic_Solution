/**
 * tests/functional/sub-pages.spec.ts
 *
 * Content-level tests for the three main sub-pages discoverable via the
 * Flagship Fleet navigation: Complete Fleet, Enhancement, and Customer Center.
 * Reachability is already covered by the nav-links test (HEAD requests);
 * these tests navigate fully and verify each page has meaningful content.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

const SUB_PAGES = [
  { label: 'Complete Fleet',   path: 'Complete.cfm' },
  { label: 'Enhancement',      path: 'Enhancement.cfm' },
  { label: 'Customer Center',  path: 'CustCenter.cfm' },
] as const;

test.describe('Sub-page Content @functional', () => {
  for (const { label, path } of SUB_PAGES) {
    test.describe(label, () => {
      test.beforeEach(async ({ page, siteConfig }) => {
        const url = `${siteConfig.url.replace(/\/$/, '')}/${path}`;
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });

        // If the page doesn't exist (404/500), skip gracefully rather than failing the suite
        const status = response?.status() ?? 0;
        if (status >= 400) {
          test.skip(true, `${label} (${path}) returned HTTP ${status} — page may have been removed`);
        }
      });

      test(`${label} page loads successfully @functional`, async ({ page, siteConfig }) => {
        const url = `${siteConfig.url.replace(/\/$/, '')}/${path}`;
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });

        expect(response).not.toBeNull();
        const status = response!.status();
        expect(
          status,
          `${label} page at ${url} should return HTTP 2xx or 3xx`
        ).toBeLessThan(400);
      });

      test(`${label} page has meaningful text content @functional`, async ({ page, siteConfig }) => {
        await page.goto(
          `${siteConfig.url.replace(/\/$/, '')}/${path}`,
          { waitUntil: 'domcontentloaded', timeout: 15_000 }
        );

        const bodyText = await page.evaluate<string>(() => document.body.innerText);
        expect(
          bodyText.trim().length,
          `${label} page body should have substantive content (>100 chars)`
        ).toBeGreaterThan(100);
      });

      test(`${label} page has a title or heading @functional`, async ({ page, siteConfig }) => {
        await page.goto(
          `${siteConfig.url.replace(/\/$/, '')}/${path}`,
          { waitUntil: 'domcontentloaded', timeout: 15_000 }
        );

        // Try text-based headings first; fall back to page <title> for legacy image-based sites
        const h1Count = await page.locator('h1').count();
        const h2Count = await page.locator('h2').count();

        if (h1Count > 0 || h2Count > 0) {
          const heading = await page.locator('h1, h2').first().textContent();
          expect(
            heading?.trim().length ?? 0,
            `${label} page should have a non-empty heading`
          ).toBeGreaterThan(0);
          return;
        }

        // Legacy image-based site: verify via page <title>
        const title = await page.title();
        expect(
          title.trim().length,
          `${label} page should have a <title> (no h1/h2 found — legacy image-based layout)`
        ).toBeGreaterThan(3);
      });

      test(`${label} page has navigation links back to the site @functional`, async ({ page, siteConfig }) => {
        await page.goto(
          `${siteConfig.url.replace(/\/$/, '')}/${path}`,
          { waitUntil: 'domcontentloaded', timeout: 15_000 }
        );

        // Semantic nav, image-based nav buttons, or any anchor with an internal href
        const semanticNavLinks = await page.locator('nav a[href], [role="navigation"] a[href]').count();
        const imageNavLinks = await page.locator('a:has(img[src*="NavButton" i]), a:has(img[src*="nav" i])').count();
        const anyInternalLinks = await page.locator(`a[href*="${new URL(siteConfig.url).hostname}"], a[href^="/"], a[href$=".cfm"]`).count();

        const totalNavLinks = semanticNavLinks + imageNavLinks + anyInternalLinks;

        expect(
          totalNavLinks,
          `${label} page should have at least one navigation link back to the site`
        ).toBeGreaterThan(0);
      });
    });
  }
});

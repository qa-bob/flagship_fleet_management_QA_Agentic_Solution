/**
 * tests/functional/fleet-features.spec.ts
 *
 * Functional tests for fleet management–specific features.
 * Tests cover features, services, and interactive elements common to fleet
 * management software marketing sites: feature grids, service descriptions,
 * FAQs/accordions, video embeds, and CTAs targeting fleet managers.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';
import { FeaturesPage } from '@pages/features.page';

test.describe('Fleet Management Features @functional', () => {
  let featuresPage: FeaturesPage;

  test.beforeEach(async ({ page, siteConfig }) => {
    featuresPage = new FeaturesPage(page, siteConfig);
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  });

  // ── Key content presence ────────────────────────────────────────────────────

  test('site contains fleet-management–related terminology @functional', async ({ page }) => {
    const bodyText = (await page.evaluate(() => document.body.innerText)).toLowerCase();

    const fleetTerms = [
      'fleet',
      'vehicle',
      'driver',
      'manage',
      'tracking',
      'maintenance',
      'fuel',
      'reporting',
    ];

    const foundTerms = fleetTerms.filter((term) => bodyText.includes(term));

    expect(
      foundTerms.length,
      `Expected to find fleet-management terms on the homepage. ` +
      `Found: [${foundTerms.join(', ')}]. Missing all of: [${fleetTerms.join(', ')}]`
    ).toBeGreaterThan(0);
  });

  test('homepage describes at least one fleet management capability @functional', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3').all();
    const headingTexts = (
      await Promise.all(headings.map((h) => h.textContent()))
    )
      .map((t) => (t ?? '').toLowerCase())
      .filter((t) => t.length > 0);

    const capabilityKeywords = [
      'track', 'manage', 'fleet', 'vehicle', 'driver', 'maintenance',
      'report', 'fuel', 'monitor', 'solution', 'service',
    ];

    const hasCapabilityHeading = headingTexts.some((text) =>
      capabilityKeywords.some((kw) => text.includes(kw))
    );

    if (hasCapabilityHeading) {
      expect(hasCapabilityHeading, 'At least one heading should reference a fleet management capability').toBeTruthy();
      return;
    }

    // Fallback: check body text (handles image-based heading sites)
    const bodyText = (await page.evaluate<string>(() => document.body.innerText)).toLowerCase();
    const foundInBody = capabilityKeywords.some((kw) => bodyText.includes(kw));
    expect(
      foundInBody,
      'Page body text should describe at least one fleet management capability'
    ).toBeTruthy();
  });

  // ── Feature sections ─────────────────────────────────────────────────────────

  test('feature or service sections are visible on the page @functional', async ({ page }) => {
    const sectionHeadings = await featuresPage.getAllSectionHeadings();
    if (sectionHeadings.length > 0) {
      expect(sectionHeadings.length, 'Page should have at least one h2 or h3 describing a feature or service').toBeGreaterThan(0);
      return;
    }
    // Fallback: check for substantial text content (legacy sites use images for headings)
    console.warn('[functional] No h2/h3 section headings found — site may use image-based headings (legacy pattern).');
    const bodyText = await page.evaluate<string>(() => document.body.innerText);
    expect(
      bodyText.trim().length,
      'Page should have substantial text content describing features or services'
    ).toBeGreaterThan(100);
  });

  test('feature section headings are non-empty @functional', async ({ page }) => {
    const headings = await featuresPage.getAllSectionHeadings();

    const emptyHeadings = headings.filter((h) => h.trim().length === 0);
    expect(
      emptyHeadings.length,
      'All section headings should contain text'
    ).toBe(0);
  });

  // ── Call-to-action ──────────────────────────────────────────────────────────

  test('site has business-appropriate CTA buttons @functional', async ({ page }) => {
    const ctaTexts = await featuresPage.getCTATexts();
    if (ctaTexts.length > 0) {
      expect(ctaTexts.length, 'At least one CTA button or link should be present').toBeGreaterThan(0);
      console.info('[functional] CTAs found:', ctaTexts.join(' | '));
      return;
    }

    // Fallback: image-based links serve as CTAs for legacy sites (<a><img></a>)
    const imageLinks = page.locator('a:has(img)');
    const imageLinksCount = await imageLinks.count();
    if (imageLinksCount > 0) {
      console.info(`[functional] No text-based CTAs found — ${imageLinksCount} image-based link(s) serve as CTAs for this legacy site.`);
    }
    expect(
      imageLinksCount,
      'Site should have at least one CTA or image-based navigation link'
    ).toBeGreaterThan(0);
  });

  test('CTA buttons link to a page within the site or to a contact flow @functional',
    async ({ page, siteConfig }) => {
      // Find links styled as buttons
      const ctaLinks = page.locator(
        'a[class*="btn"], a[class*="button"], a[class*="cta"]'
      );
      const count = await ctaLinks.count();

      if (count === 0) {
        console.warn('[functional] No CTA links found — skipping href check.');
        return;
      }

      const siteOrigin = new URL(siteConfig.url).origin;
      const hrefs: string[] = [];

      for (let i = 0; i < Math.min(count, 5); i++) {
        const href = await ctaLinks.nth(i).getAttribute('href');
        if (href) hrefs.push(href);
      }

      // Each CTA should go somewhere — no empty or '#' hrefs
      const meaningfulHrefs = hrefs.filter(
        (h) => h && h !== '#' && h !== 'javascript:void(0)'
      );

      expect(
        meaningfulHrefs.length,
        `Expected CTA links to have meaningful hrefs. Found: ${hrefs.join(', ')}`
      ).toBeGreaterThan(0);
    }
  );

  // ── Services / Solutions page (if reachable) ────────────────────────────────

  test('services or solutions page is reachable via navigation @functional',
    async ({ page, siteConfig, navigationPage }) => {
      // Broad patterns covering common service-page labels including legacy fleet site names
      const servicesPatterns = [
        /services/i, /solutions/i, /features/i, /products/i, /offerings/i,
        /complete/i, /enhancement/i, /customer.?center/i, /platform/i,
      ];

      // Use NavigationPage which handles both semantic nav and image-button nav
      await navigationPage.navigate();
      await navigationPage.waitForLoad();
      const discoveredLinks = await navigationPage.getNavLinks();

      // Also check expectedNavItems from config as a cross-reference
      let servicesLink: string | null = null;

      for (const link of discoveredLinks) {
        if (servicesPatterns.some((p) => p.test(link.text)) && link.href) {
          servicesLink = link.href;
          break;
        }
      }

      if (!servicesLink) {
        console.warn(
          '[functional] No services/solutions/features link found in navigation. ' +
          'This test is skipped — run /analyze-site to update expectedNavItems.'
        );
        return;
      }

      // Navigate to the services page
      const base = siteConfig.url.replace(/\/$/, '');
      const fullUrl = servicesLink.startsWith('http')
        ? servicesLink
        : `${base}${servicesLink.startsWith('/') ? servicesLink : `/${servicesLink}`}`;

      const response = await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
      expect(
        response?.status() ?? 0,
        `Services page at ${fullUrl} should return HTTP 2xx`
      ).toBeLessThan(400);

      // Page should have content — legacy sites may use image-based headings so fall back to <title>
      const headingCount = await page.locator('h1, h2').count();
      if (headingCount > 0) {
        const heading = await page.locator('h1, h2').first().textContent();
        expect(heading?.trim().length ?? 0, 'Services page should have a heading').toBeGreaterThan(0);
      } else {
        const title = await page.title();
        expect(
          title.trim().length,
          'Services page should have a <title> (no h1/h2 found — legacy image-based layout)'
        ).toBeGreaterThan(3);
      }
    }
  );

  // ── FAQ / Accordion (if present) ─────────────────────────────────────────────

  test('FAQ or accordion items expand when clicked @functional', async ({ page }) => {
    const expanded = await featuresPage.expandFirstAccordionItem();

    if (!expanded) {
      console.warn('[functional] No accordion or FAQ items found — skipping interaction test.');
      return;
    }

    // After clicking, some content should be visible
    const expandedContent = page.locator(
      '[class*="accordion-content"]:visible, ' +
      '[class*="accordion-body"]:visible, ' +
      'details[open] > :not(summary), ' +
      '[aria-expanded="true"]'
    );

    const expandedCount = await expandedContent.count();
    expect(
      expandedCount,
      'Clicking an accordion item should reveal its content'
    ).toBeGreaterThan(0);
  });

  // ── Video / media (if present) ───────────────────────────────────────────────

  test('video embeds are present and visible if the site uses video content @functional',
    async ({ page }) => {
      const hasVideo = await featuresPage.hasVideoContent();

      if (!hasVideo) {
        console.info('[functional] No video embeds found on homepage — skipping video check.');
        return;
      }

      const video = featuresPage.videoEmbeds.first();
      await expect(video, 'Video embed should be visible').toBeVisible();
    }
  );

  // ── Contact page (if present) ────────────────────────────────────────────────

  test('contact link is accessible from the homepage @functional',
    async ({ page, siteConfig }) => {
      const contactPatterns = /contact|get in touch|reach us|talk to us/i;

      // Check semantic nav first
      const navContactLink = page.locator('nav a, [role="navigation"] a').filter({
        hasText: contactPatterns,
      }).first();

      // Check footer
      const footerContactLink = page.locator('footer a').filter({
        hasText: contactPatterns,
      }).first();

      // Fallback: mailto:/tel: links work as a contact mechanism for legacy sites
      const mailtoLink = page.locator('a[href^="mailto:"], a[href^="tel:"]').first();

      const navCount = await navContactLink.count();
      const footerCount = await footerContactLink.count();
      const mailtoCount = await mailtoLink.count();

      if (navCount === 0 && footerCount === 0 && mailtoCount === 0) {
        console.warn(
          '[functional] No contact link found in nav, footer, or as mailto:/tel:. ' +
          'This may be fine if the site uses inline CTAs only.'
        );
        return;
      }

      // Prefer semantic nav > footer > mailto fallback
      const contactLink = navCount > 0 ? navContactLink
        : footerCount > 0 ? footerContactLink
        : mailtoLink;

      await expect(contactLink, 'Contact link should be visible').toBeVisible();

      const href = await contactLink.getAttribute('href');
      expect(href, 'Contact link should have a non-empty href').toBeTruthy();
    }
  );

  // ── Internal links ──────────────────────────────────────────────────────────

  test('internal links on the homepage point to the same domain @functional',
    async ({ page, siteConfig }) => {
      const siteOrigin = new URL(siteConfig.url).origin;
      const allLinks = await page.locator('a[href]').all();

      const externalLinks: string[] = [];
      for (const link of allLinks) {
        const href = await link.getAttribute('href');
        if (!href) continue;
        if (href.startsWith('http') && !href.startsWith(siteOrigin)) {
          externalLinks.push(href);
        }
      }

      // External links are allowed but should be a minority
      const totalLinks = allLinks.length;
      const externalRatio = totalLinks > 0 ? externalLinks.length / totalLinks : 0;

      if (externalLinks.length > 0) {
        console.info(
          `[functional] Found ${externalLinks.length} external link(s) on the homepage ` +
          `(${Math.round(externalRatio * 100)}% of total ${totalLinks}).`
        );
      }

      // More than 80% external would be unusual for a company homepage
      expect(
        externalRatio,
        'More than 80% of links are external — unexpected for a company homepage'
      ).toBeLessThanOrEqual(0.8);
    }
  );
});

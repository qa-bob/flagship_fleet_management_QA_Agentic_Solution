/**
 * src/pages/navigation.page.ts
 *
 * NavigationPage models the site's primary navigation.
 * Uses semantic role-based selectors and avoids site-specific class names.
 */

import { type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';

export interface NavLinkInfo {
  text: string;
  href: string;
}

export interface LinkCheckResult {
  url: string;
  status: number;
  ok: boolean;
}

export class NavigationPage extends BasePage {
  // ── Nav detection ────────────────────────────────────────────────────────────

  /**
   * Return true if a navigation element is visible on the page.
   *
   * Fallback chain (handles both modern semantic sites and legacy image-button sites):
   *   1. <nav> or role="navigation"
   *   2. Image-based nav buttons (legacy ColdFusion / old HTML sites)
   *   3. Header element containing links
   *   4. Any visible anchor link on the page (last resort)
   */
  async isNavVisible(): Promise<boolean> {
    // 1. Semantic nav
    const semanticNav = this.page.locator('nav, [role="navigation"]');
    if (await semanticNav.count() > 0 && await semanticNav.first().isVisible()) return true;

    // 2. Image-based nav buttons (e.g. <a><img src="NavButton_X.JPG"></a>)
    const imageNav = this.page.locator('a img[src*="NavButton" i], a img[src*="nav-button" i]');
    if (await imageNav.count() > 0 && await imageNav.first().isVisible()) return true;

    // 3. Header element with at least one link
    const header = this.page.locator('header, #header, [id*="header" i], [class*="header" i]').first();
    if (await header.count() > 0 && await header.locator('a[href]').count() > 0) return true;

    // 4. Any visible anchor on the page — every site with navigation has links
    const firstLink = this.page.locator('a[href]').first();
    return await firstLink.count() > 0 && await firstLink.isVisible();
  }

  // ── Nav links ────────────────────────────────────────────────────────────────

  /**
   * Return navigation links with their text and href.
   *
   * Fallback chain:
   *   1. Links inside <nav> / role="navigation"
   *   2. Links that contain a nav-button image (legacy image-nav pattern)
   *   3. All page links (last resort for sites with no wrapper element)
   *
   * For image-based links with no visible text, alt text or filename is used.
   */
  async getNavLinks(): Promise<NavLinkInfo[]> {
    // 1. Semantic nav wrapper
    const semanticNav = this.page.locator('nav, [role="navigation"]');
    let linkLocator = await semanticNav.count() > 0
      ? semanticNav.first().locator('a[href]')
      : null;

    // 2. Image-button nav (legacy sites: <a href="X.cfm"><img src="NavButton_X.JPG"></a>)
    if (!linkLocator) {
      const imageNavLinks = this.page.locator('a:has(img[src*="NavButton" i]), a:has(img[src*="nav-button" i])');
      if (await imageNavLinks.count() > 0) {
        linkLocator = imageNavLinks;
      }
    }

    // 3. All page links
    if (!linkLocator) {
      linkLocator = this.page.locator('a[href]');
    }

    const count = await linkLocator.count();
    const results: NavLinkInfo[] = [];

    for (let i = 0; i < count; i++) {
      const link = linkLocator.nth(i);
      let text = ((await link.textContent()) ?? '').trim();
      const href = (await link.getAttribute('href')) ?? '';

      if (!href || href === '#' || href.startsWith('javascript:')) continue;

      // For image-based nav buttons, fall back to img alt or derived filename
      if (!text) {
        const img = link.locator('img').first();
        if (await img.count() > 0) {
          text = (await img.getAttribute('alt')) ?? '';
          if (!text) {
            const src = (await img.getAttribute('src')) ?? '';
            text = src.split('/').pop()
              ?.replace(/NavButton_/i, '')
              .replace(/\.(jpg|jpeg|png|gif|webp)/i, '')
              ?? '';
          }
        }
      }

      results.push({ text: text || href, href });
    }

    return results;
  }

  /**
   * Click a navigation item by its visible text.
   * Uses a case-insensitive partial match.
   */
  async clickNavItem(text: string): Promise<void> {
    const link = this.page.getByRole('link', { name: text });
    await link.first().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ── Mobile menu ──────────────────────────────────────────────────────────────

  /**
   * Return the mobile hamburger / menu toggle locator, or null if not found.
   * Searches for common patterns: button with aria-label containing "menu",
   * elements with class containing "hamburger", "menu-toggle", "nav-toggle".
   */
  async getMobileMenuToggle(): Promise<Locator | null> {
    const candidates = [
      this.page.getByRole('button', { name: /menu|navigation|toggle|hamburger/i }),
      this.page.locator('[class*="hamburger"], [class*="menu-toggle"], [class*="nav-toggle"]'),
      this.page.locator('[aria-label*="menu" i], [aria-label*="navigation" i]').filter({ hasNotText: /^\s*$/ }),
      this.page.locator('button[aria-expanded]').first(),
    ];

    for (const candidate of candidates) {
      if (await candidate.count() > 0 && await candidate.first().isVisible()) {
        return candidate.first();
      }
    }

    return null;
  }

  /**
   * Open the mobile navigation menu if a toggle exists and the menu is currently closed.
   * No-op if no toggle is found (desktop layout).
   */
  async openMobileMenu(): Promise<void> {
    const toggle = await this.getMobileMenuToggle();
    if (!toggle) return;

    const isExpanded = await toggle.getAttribute('aria-expanded');
    if (isExpanded === 'true') return; // Already open

    await toggle.click();

    // Wait briefly for animation
    await this.page.waitForTimeout(400);
  }

  // ── Link reachability ────────────────────────────────────────────────────────

  /**
   * Check all nav links are reachable by issuing HEAD requests.
   * Returns an array of results with URL, HTTP status, and ok flag.
   * Relative URLs are resolved against config.url.
   */
  async checkAllNavLinksReachable(): Promise<LinkCheckResult[]> {
    const navLinks = await this.getNavLinks();
    const baseUrl = new URL(this.config.url);
    const results: LinkCheckResult[] = [];

    for (const link of navLinks) {
      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(link.href, baseUrl).toString();
      } catch {
        results.push({ url: link.href, status: 0, ok: false });
        continue;
      }

      try {
        const response = await this.page.request.head(absoluteUrl, {
          timeout: 10_000,
        });
        results.push({
          url: absoluteUrl,
          status: response.status(),
          ok: response.ok(),
        });
      } catch {
        results.push({ url: absoluteUrl, status: 0, ok: false });
      }
    }

    return results;
  }
}

/**
 * src/pages/features.page.ts
 *
 * FeaturesPage models any features, services, or solutions page on the site.
 * Uses resilient, design-agnostic selectors that work across typical B2B SaaS
 * and fleet management site layouts.
 */

import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import type { SiteConfig } from '@site-types/site-config.types';

export interface FeatureCardInfo {
  heading: string;
  description: string;
}

export class FeaturesPage extends BasePage {
  // ── Primary heading ─────────────────────────────────────────────────────────

  readonly pageHeading: Locator;

  // ── Feature / service cards ──────────────────────────────────────────────────

  readonly featureCards: Locator;
  readonly featureSections: Locator;

  // ── CTAs ─────────────────────────────────────────────────────────────────────

  readonly ctaButtons: Locator;
  readonly primaryCta: Locator;

  // ── Accordion / FAQ ──────────────────────────────────────────────────────────

  readonly accordionItems: Locator;
  readonly faqItems: Locator;

  // ── Media ─────────────────────────────────────────────────────────────────────

  readonly videoEmbeds: Locator;
  readonly heroImages: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);

    this.pageHeading = page.locator('h1, [class*="hero"] h2').first();

    // Feature cards — common class-name patterns across site builders
    this.featureCards = page.locator(
      '[class*="feature-card"], [class*="feature-item"], ' +
      '[class*="service-card"], [class*="service-item"], ' +
      '[class*="benefit-card"], [class*="benefit-item"], ' +
      '[class*="solution-card"], [class*="card"]'
    );

    // Major content sections
    this.featureSections = page.locator(
      'section, [class*="feature-section"], [class*="service-section"]'
    );

    // CTA buttons — class-based first, text-based fallback
    this.ctaButtons = page.locator(
      'a[class*="btn"], a[class*="button"], button[class*="btn"], ' +
      'a[class*="cta"], [role="button"]'
    );

    this.primaryCta = page.locator(
      'a[class*="btn-primary"], a[class*="button--primary"], ' +
      'button[class*="btn-primary"]'
    ).first();

    // Accordion and FAQ
    this.accordionItems = page.locator(
      '[class*="accordion-item"], [class*="accordion__item"], details'
    );
    this.faqItems = page.locator(
      '[class*="faq-item"], [class*="faq__item"], ' +
      '[class*="accordion-item"], details'
    );

    this.videoEmbeds = page.locator(
      'video, iframe[src*="youtube"], iframe[src*="vimeo"], ' +
      '[class*="video-player"], [class*="video-embed"]'
    );

    this.heroImages = page.locator(
      '[class*="hero"] img, [class*="hero"] picture, ' +
      'section:first-of-type img'
    );
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  /** Navigate to the given path relative to the site's base URL. */
  async navigateTo(path: string): Promise<void> {
    const base = this.url.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    await this.page.goto(`${base}${cleanPath}`, { waitUntil: 'domcontentloaded' });
    await this.waitForLoad();
  }

  // ── Content readers ──────────────────────────────────────────────────────────

  /**
   * Return all h2 and h3 headings visible on the page.
   * Useful for verifying that feature/service sections have labels.
   */
  async getAllSectionHeadings(): Promise<string[]> {
    const headings = await this.page.locator('h2, h3').all();
    const results: string[] = [];
    for (const h of headings) {
      const text = (await h.textContent())?.trim();
      if (text) results.push(text);
    }
    return results;
  }

  /**
   * Return info about each feature card: its heading and first paragraph of text.
   * Returns an empty array if no recognizable feature cards are found.
   */
  async getFeatureCardInfo(): Promise<FeatureCardInfo[]> {
    const cards = await this.featureCards.all();
    const results: FeatureCardInfo[] = [];

    for (const card of cards) {
      const heading = (await card.locator('h2, h3, h4').first().textContent())?.trim() ?? '';
      const description = (await card.locator('p').first().textContent())?.trim() ?? '';
      if (heading || description) {
        results.push({ heading, description });
      }
    }

    return results;
  }

  /**
   * Return the number of visible feature cards on the page.
   */
  async getFeatureCardCount(): Promise<number> {
    return this.featureCards.count();
  }

  // ── Interactions ─────────────────────────────────────────────────────────────

  /**
   * Click the first accordion item and return whether it expanded.
   * Returns false if no accordion items are found on the page.
   */
  async expandFirstAccordionItem(): Promise<boolean> {
    const count = await this.accordionItems.count();
    if (count === 0) return false;

    const first = this.accordionItems.first();

    // For <details> elements, the open attribute indicates expansion
    const isDetails = await first.evaluate((el) => el.tagName === 'DETAILS');
    if (isDetails) {
      await first.locator('summary').click();
      return first.evaluate((el) => (el as HTMLDetailsElement).open);
    }

    // For custom accordion components, click the heading/trigger
    const trigger = first.locator('button, [class*="trigger"], [class*="toggle"], [class*="header"]').first();
    if (await trigger.count() > 0) {
      await trigger.click();
    } else {
      await first.click();
    }

    return true;
  }

  /**
   * Returns true if the page has any video embeds.
   */
  async hasVideoContent(): Promise<boolean> {
    return (await this.videoEmbeds.count()) > 0;
  }

  /**
   * Return all visible CTA button/link texts.
   */
  async getCTATexts(): Promise<string[]> {
    const ctaLocator = this.ctaButtons;
    const count = await ctaLocator.count();

    if (count === 0) {
      // Fallback: look for any link/button with CTA-like text
      const textBased = this.page.locator('a, button').filter({
        hasText: /get started|contact us|learn more|request demo|schedule|free trial|sign up/i,
      });
      const fallback = await textBased.all();
      const texts: string[] = [];
      for (const el of fallback) {
        const text = (await el.textContent())?.trim();
        if (text) texts.push(text);
      }
      return texts;
    }

    const all = await ctaLocator.all();
    const texts: string[] = [];
    for (const el of all) {
      const text = (await el.textContent())?.trim();
      if (text) texts.push(text);
    }
    return texts;
  }
}

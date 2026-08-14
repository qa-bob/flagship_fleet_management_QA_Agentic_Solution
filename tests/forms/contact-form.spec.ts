/**
 * tests/forms/contact-form.spec.ts
 *
 * Contact form tests — verify the presence and structure of contact forms.
 * IMPORTANT: These tests do NOT submit forms to avoid sending spam.
 *
 * When hasContactForm is false, form-specific tests are skipped and the suite
 * instead verifies that the site provides an alternative contact mechanism
 * (mailto: links, phone numbers).
 *
 * Tag: @forms
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Contact Form @forms', () => {
  // Skip the entire suite when skipForms is configured for this site
  test.beforeEach(async ({ siteConfig }) => {
    if (siteConfig.skipForms) {
      test.skip(true, `Forms testing skipped for "${siteConfig.name}" (skipForms: true)`);
    }
  });

  // ── Contact mechanism presence (always runs) ────────────────────────────────

  test('site has an accessible contact mechanism @forms', async ({ siteConfig, contactPage, page }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    if (!siteConfig.hasContactForm) {
      // Site uses email/phone rather than an HTML form — verify contact info is visible
      const mailtoLinks = page.locator('a[href^="mailto:"]');
      const mailtoCount = await mailtoLinks.count();

      const telLinks = page.locator('a[href^="tel:"]');
      const telCount = await telLinks.count();

      // Check page text for email addresses or phone patterns
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasEmailText = /[\w.+-]+@[\w-]+\.\w+/.test(bodyText);
      const hasPhoneText = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/.test(bodyText);

      const hasAnyContact = mailtoCount > 0 || telCount > 0 || hasEmailText || hasPhoneText;

      expect(
        hasAnyContact,
        `"${siteConfig.name}" has no HTML contact form (hasContactForm: false) and no ` +
          'visible email/phone contact information was found on the homepage.'
      ).toBeTruthy();

      if (mailtoCount > 0) {
        const emails: string[] = [];
        for (let i = 0; i < mailtoCount; i++) {
          const href = await mailtoLinks.nth(i).getAttribute('href');
          if (href) emails.push(href.replace('mailto:', ''));
        }
        console.info(`[forms] Contact via email: ${emails.join(', ')}`);
      }
      return;
    }

    // hasContactForm: true — find the HTML form
    let form = await contactPage.findContactForm();

    if (!form) {
      const contactPaths = ['/contact', '/contact-us', '/get-in-touch', '/reach-out'];
      for (const contactPath of contactPaths) {
        try {
          await page.goto(siteConfig.url.replace(/\/$/, '') + contactPath, {
            waitUntil: 'domcontentloaded',
            timeout: 10_000,
          });
          form = await contactPage.findContactForm();
          if (form) break;
        } catch {
          // Path doesn't exist — try next
        }
      }
    }

    if (!form) {
      const contactLink = page.locator('a').filter({ hasText: /contact/i }).first();
      if (await contactLink.count() > 0) {
        await contactLink.click();
        await page.waitForLoadState('domcontentloaded');
        form = await contactPage.findContactForm();
      }
    }

    expect(
      form,
      `No contact form found on "${siteConfig.name}". ` +
        'Checked homepage, /contact, /contact-us, /get-in-touch, and nav Contact link.'
    ).not.toBeNull();
  });

  // ── mailto: link quality (runs when hasContactForm is false) ─────────────────

  test('contact email links are valid mailto: hrefs @forms', async ({ siteConfig, page }) => {
    if (siteConfig.hasContactForm) {
      test.skip(true, 'Site uses an HTML form — mailto: check not applicable');
      return;
    }

    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
    const mailtoLinks = page.locator('a[href^="mailto:"]');
    const count = await mailtoLinks.count();

    if (count === 0) {
      console.warn(`[forms] No mailto: links found on "${siteConfig.name}" homepage.`);
      return;
    }

    for (let i = 0; i < count; i++) {
      const href = await mailtoLinks.nth(i).getAttribute('href');
      expect(href, `mailto: link ${i} should have a non-empty href`).toBeTruthy();
      expect(
        href!.replace('mailto:', ''),
        `mailto: link ${i} should contain an @ character`
      ).toContain('@');
    }
  });

  // ── Required fields ──────────────────────────────────────────────────────────

  test('contact form has required fields (name, email) @forms', async ({ contactPage, siteConfig, page }) => {
    if (!siteConfig.hasContactForm) {
      test.skip(true, `"${siteConfig.name}" uses email contact links, not an HTML form (hasContactForm: false)`);
      return;
    }

    await contactPage.navigate();
    let form = await contactPage.findContactForm();

    if (!form) {
      await page.goto(siteConfig.url.replace(/\/$/, '') + '/contact', {
        waitUntil: 'domcontentloaded',
        timeout: 10_000,
      }).catch(() => null);
      form = await contactPage.findContactForm();
    }

    if (!form) {
      test.skip(true, 'No contact form found — covered by "contact mechanism" test');
      return;
    }

    const hasEmail = await contactPage.hasEmailField();
    const hasName = await contactPage.hasNameField();

    expect(hasEmail, 'Contact form should have an email input field').toBeTruthy();

    if (!hasName) {
      console.warn(
        `[forms] "${siteConfig.name}" contact form is missing a name field. ` +
          'This is a usability concern.'
      );
    }
  });

  // ── Submit button ────────────────────────────────────────────────────────────

  test('contact form has a submit button @forms', async ({ contactPage, siteConfig, page }) => {
    if (!siteConfig.hasContactForm) {
      test.skip(true, `"${siteConfig.name}" uses email contact links, not an HTML form (hasContactForm: false)`);
      return;
    }

    await contactPage.navigate();
    let form = await contactPage.findContactForm();

    if (!form) {
      await page.goto(siteConfig.url.replace(/\/$/, '') + '/contact', {
        waitUntil: 'domcontentloaded',
        timeout: 10_000,
      }).catch(() => null);
      form = await contactPage.findContactForm();
    }

    if (!form) {
      test.skip(true, 'No contact form found');
      return;
    }

    const hasSubmit = await contactPage.hasSubmitButton();
    expect(hasSubmit, 'Contact form should have a visible submit button').toBeTruthy();
  });

  // ── Labels and placeholders ──────────────────────────────────────────────────

  test('form fields have proper labels or placeholders @forms', async ({ contactPage, siteConfig, page }) => {
    if (!siteConfig.hasContactForm) {
      test.skip(true, `"${siteConfig.name}" uses email contact links, not an HTML form (hasContactForm: false)`);
      return;
    }

    await contactPage.navigate();
    let form = await contactPage.findContactForm();

    if (!form) {
      await page.goto(siteConfig.url.replace(/\/$/, '') + '/contact', {
        waitUntil: 'domcontentloaded',
        timeout: 10_000,
      }).catch(() => null);
      form = await contactPage.findContactForm();
    }

    if (!form) {
      test.skip(true, 'No contact form found');
      return;
    }

    const fields = await contactPage.getFormFields();
    const unlabeledFields: string[] = [];

    for (const field of fields) {
      if (field.type === 'hidden' || field.type === 'submit') continue;

      const fieldLocator = form.locator(
        `input[name="${field.name}"], textarea[name="${field.name}"]`
      ).first();

      if (await fieldLocator.count() === 0) continue;

      const hasAriaLabel = await fieldLocator.getAttribute('aria-label');
      const hasPlaceholder = await fieldLocator.getAttribute('placeholder');
      const fieldId = await fieldLocator.getAttribute('id');
      const hasLabel = fieldId
        ? (await page.locator(`label[for="${fieldId}"]`).count()) > 0
        : false;

      if (!hasAriaLabel && !hasPlaceholder && !hasLabel) {
        unlabeledFields.push(field.name);
      }
    }

    if (unlabeledFields.length > 0) {
      console.warn(
        `[forms] Fields without labels/placeholders in "${siteConfig.name}": ` +
          unlabeledFields.join(', ')
      );
    }

    expect(
      unlabeledFields.length,
      `${unlabeledFields.length} form field(s) have no label, aria-label, or placeholder`
    ).toBeLessThanOrEqual(fields.length / 2);
  });

  // ── HTML5 validation ─────────────────────────────────────────────────────────

  test('required fields show validation when submitted empty @forms', async ({
    contactPage,
    siteConfig,
    page,
  }) => {
    if (!siteConfig.hasContactForm) {
      test.skip(true, `"${siteConfig.name}" uses email contact links, not an HTML form (hasContactForm: false)`);
      return;
    }

    await contactPage.navigate();
    let form = await contactPage.findContactForm();

    if (!form) {
      await page.goto(siteConfig.url.replace(/\/$/, '') + '/contact', {
        waitUntil: 'domcontentloaded',
        timeout: 10_000,
      }).catch(() => null);
      form = await contactPage.findContactForm();
    }

    if (!form) {
      test.skip(true, 'No contact form found');
      return;
    }

    const hasSubmit = await contactPage.hasSubmitButton();
    if (!hasSubmit) {
      test.skip(true, 'No submit button found in form');
      return;
    }

    const submitBtn = form
      .locator('button[type="submit"], input[type="submit"], button:not([type="button"]):not([type="reset"])')
      .first();

    let navigationTriggered = false;
    page.on('request', (req) => {
      if (req.resourceType() === 'document' && req.method() === 'POST') {
        navigationTriggered = true;
      }
    });

    await submitBtn.click({ force: true });
    await page.waitForTimeout(500);

    expect(
      navigationTriggered,
      'Clicking submit on an empty form should NOT navigate away (validation should prevent submission)'
    ).toBeFalsy();

    const firstRequired = form.locator('[required]').first();
    if (await firstRequired.count() > 0) {
      const isValid = await firstRequired.evaluate<boolean>((el) => {
        return (el as HTMLInputElement).validity?.valid ?? true;
      });
      expect(
        isValid,
        'Required fields should be invalid when empty (browser validation)'
      ).toBeFalsy();
    }
  });
});

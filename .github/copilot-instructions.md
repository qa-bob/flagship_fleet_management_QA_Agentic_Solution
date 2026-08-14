# GitHub Copilot Instructions

This repository is a **Playwright + TypeScript regression test suite** for [Flagship Fleet Management](http://www.flagshipfleet.com) built with a **Page Object Model (POM)** architecture.

---

## Project Overview

- **Target site:** `http://www.flagshipfleet.com` (defined in `site.config.json`)
- **Framework:** Playwright with TypeScript in strict mode
- **Pattern:** Page Object Model (POM) with OOP inheritance
- **Test categories:** `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`

---

## Architecture Rules

### Page Objects (`src/pages/`)

- All page classes **extend `BasePage`** from `./base.page`
- Locators are **`readonly Locator` properties** on the class, not local variables
- Methods represent **user actions** (`clickCTA()`, `openMobileMenu()`) — never assertions
- **No `expect()` calls inside page objects** — assertions belong in test files only
- Constructor receives `(page: Page, config: SiteConfig)` and calls `super(page, config)`

```typescript
import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import type { SiteConfig } from '@types/site-config.types';

export class ExamplePage extends BasePage {
  readonly heroHeading: Locator;
  readonly ctaButton: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    this.heroHeading = page.locator('h1').first();
    this.ctaButton = page.getByRole('link', { name: /get started/i });
  }

  async clickCta(): Promise<void> {
    await this.ctaButton.click();
    await this.waitForLoad();
  }
}
```

### Tests (`tests/`)

- Always import `{ test, expect }` from `@fixtures/site.fixture` — never from `@playwright/test` directly
- Tag every test with at least one category: `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`
- Never hardcode URLs — use `siteConfig.url` from the fixture
- Never submit forms — test field interactions and validation only
- Never create accounts or enter real credentials
- Use `await expect(locator).toBeVisible()` instead of `page.waitForTimeout()`

```typescript
import { test, expect } from '@fixtures/site.fixture';

test.describe('Feature Name @functional', () => {
  test.beforeEach(async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
  });

  test('example assertion @functional', async ({ homePage }) => {
    const heading = await homePage.getMainHeading();
    expect(heading.length).toBeGreaterThan(0);
  });
});
```

---

## Import Aliases

These path aliases are configured in `tsconfig.json`:

| Alias | Resolves to |
|-------|-------------|
| `@pages/*` | `src/pages/*` |
| `@fixtures/*` | `src/fixtures/*` |
| `@utils/*` | `src/utils/*` |
| `@site-types/*` | `src/types/*` |

---

## What NOT to do

- Do **not** put `expect()` inside page object methods
- Do **not** hardcode `http://www.flagshipfleet.com` in test files
- Do **not** use `page.waitForTimeout()` — use Playwright's built-in auto-waiting
- Do **not** use the `any` type without an explicit justification comment
- Do **not** submit forms or attempt to create accounts
- Do **not** use raw `page.locator()` calls in test files — always use page objects

---

## Available npm Scripts

```bash
npm test                    # Run all tests
npm run test:smoke          # @smoke only
npm run test:navigation     # @navigation only
npm run test:forms          # @forms only
npm run test:visual         # @visual only
npm run test:responsive     # @responsive only
npm run baseline            # Update visual snapshots
npm run lint                # ESLint
npm run typecheck           # TypeScript check
```

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page objects | `src/pages/<name>.page.ts` | `src/pages/services.page.ts` |
| Test files | `tests/<category>/<feature>.spec.ts` | `tests/functional/fleet-tracking.spec.ts` |
| Custom agent tests | `tests/custom/<feature>.spec.ts` | `tests/custom/pricing-page.spec.ts` |

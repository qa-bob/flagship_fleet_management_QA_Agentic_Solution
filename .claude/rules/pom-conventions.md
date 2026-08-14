---
paths:
  - "src/pages/**/*.ts"
---

# Page Object Model Conventions

These rules apply when working with any file in `src/pages/`.

## Class structure

Every page class must follow this pattern:

```typescript
import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';
import type { SiteConfig } from '@types/site-config.types';

export class ExamplePage extends BasePage {
  // Locators declared as readonly properties at the top of the class
  readonly heroHeading: Locator;
  readonly ctaButton: Locator;

  constructor(page: Page, config: SiteConfig) {
    super(page, config);
    // All locators initialized in the constructor
    this.heroHeading = page.locator('h1').first();
    this.ctaButton = page.getByRole('link', { name: /get started/i });
  }

  // Methods represent user actions, return void or meaningful data
  async clickCta(): Promise<void> {
    await this.ctaButton.click();
    await this.waitForLoad();
  }
}
```

## Locator strategy — in priority order

1. `page.getByRole()` — semantic, most resilient
2. `page.getByLabel()` — for form fields
3. `page.getByText()` — for unique visible text
4. `page.locator('[data-testid="..."]')` — if test IDs exist
5. `page.locator('[class*="keyword"]')` — CSS substring match as fallback
6. `page.locator('tag')` — bare element selectors only for headings (h1, h2) and structural elements

Never use:
- `page.locator('#id')` unless the ID is stable and not auto-generated
- `page.locator('div > div:nth-child(3)')` — fragile structural selectors
- XPath selectors

## Rules

- All locators are `readonly Locator` properties — never local variables
- Never put `expect()` inside page object methods — assertions belong in tests
- Methods return `Promise<void>` for actions, or `Promise<T>` for data retrieval
- If a locator might not exist on all sites, check `count() > 0` before interacting
- Use descriptive method names that describe the user action: `openMobileMenu()`, `fillSearchField(query)`, `selectPlanTier(name)`
- Do not navigate in constructors — provide an explicit `navigate()` override if needed (BasePage already provides this)
- Add JSDoc only when the selector strategy is non-obvious or the method has a side effect the caller needs to know about

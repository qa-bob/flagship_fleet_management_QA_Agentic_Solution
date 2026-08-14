# Flagship Fleet Management — QA Agentic Solution

Playwright + TypeScript regression test suite for [flagshipfleet.com](http://www.flagshipfleet.com), built with a **Page Object Model (POM)** architecture and designed for agentic execution by Claude Code.

---

## Table of Contents

- [Purpose](#purpose)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Claude Code Integration](#claude-code-integration)
- [Agents](#agents)
- [Skills & Commands](#skills--commands)
- [Rules & Instructions](#rules--instructions)
- [.github Folder](#github-folder)
- [Contributor Guide](#contributor-guide)

---

## Purpose

This repository contains a full GUI, functional, and regression test suite for **Flagship Fleet Management** at `http://www.flagshipfleet.com`. The suite exercises all discoverable features of the site without requiring account creation, authentication, or form submission.

Tests are organized into tagged categories so CI pipelines can run targeted subsets:

| Tag | Scope |
|-----|-------|
| `@smoke` | Site availability, HTTP status, load time |
| `@navigation` | Nav links, routing, mobile menu, logo |
| `@forms` | Form fields, validation, accessibility |
| `@functional` | Business features: content, CTAs, fleet features |
| `@visual` | Screenshot regression with `toHaveScreenshot()` |
| `@responsive` | Layout checks at mobile, tablet, and desktop |

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18.x or later |
| npm | 9.x or later |
| Git | Any recent version |

> Claude Code (optional): Install from [code.claude.com](https://code.claude.com) for agentic test generation and site analysis.

---

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/<org>/flagship_fleet_management_QA_Agentic_Solution.git
cd flagship_fleet_management_QA_Agentic_Solution

# 2. Install Node dependencies
npm install

# 3. Install Playwright browser binaries
npx playwright install

# 4. (Optional) Verify site config points at the right URL
cat site.config.json
```

The `site.config.json` file at the repository root controls which URL is tested and which test categories are active. Edit it before running tests if needed.

---

## Running Tests

```bash
npm test                    # Run all tests (all browsers / viewports)
npm run test:smoke          # @smoke tests only
npm run test:navigation     # @navigation tests only
npm run test:forms          # @forms tests only
npm run test:visual         # @visual screenshot regression
npm run test:responsive     # @responsive layout checks
npm run test:headed         # Run tests in headed (visible) browser
npm run report              # Open the HTML test report
npm run baseline            # Update visual regression snapshots
npm run lint                # ESLint
npm run typecheck           # TypeScript type-check (no emit)
```

### Run a single spec file

```bash
npx playwright test tests/smoke/site-availability.spec.ts
```

### Run tests in a specific browser

```bash
npx playwright test --project=chromium-desktop
npx playwright test --project=mobile-chrome
npx playwright test --project=tablet
```

---

## Project Structure

```
flagship_fleet_management_QA_Agentic_Solution/
├── site.config.json              # Target URL, flags, nav items
├── playwright.config.ts          # Playwright projects (desktop, mobile, tablet)
├── global-setup.ts               # Pre-run reachability check
├── tsconfig.json                 # TypeScript strict-mode config
├── package.json                  # Scripts and dev dependencies
│
├── src/
│   ├── pages/                    # Page Object Model classes
│   │   ├── base.page.ts          # BasePage — shared helpers
│   │   ├── home.page.ts          # HomePage
│   │   ├── navigation.page.ts    # NavigationPage
│   │   ├── contact.page.ts       # ContactFormPage
│   │   └── features.page.ts      # FeaturesPage
│   ├── fixtures/
│   │   └── site.fixture.ts       # Custom test fixture with page objects
│   ├── utils/
│   │   ├── link-checker.ts       # HTTP link-status helper
│   │   └── visual-helper.ts      # Screenshot diff utility
│   └── types/
│       └── site-config.types.ts  # SiteConfig interface + loader
│
├── tests/
│   ├── smoke/                    # @smoke — fast availability checks
│   ├── navigation/               # @navigation — link and menu tests
│   ├── forms/                    # @forms — field and validation tests
│   ├── functional/               # @functional — business feature tests
│   ├── visual/                   # @visual — screenshot regression
│   └── responsive/               # @responsive — viewport layout
│
├── .claude/
│   ├── agents/                   # Claude Code subagent definitions
│   ├── commands/                 # Slash command implementations
│   ├── rules/                    # Path-scoped instruction files
│   ├── hooks/                    # Pre/post lifecycle shell hooks
│   └── settings.json             # Claude Code permissions
│
├── .github/
│   ├── workflows/ci.yml          # GitHub Actions CI pipeline
│   ├── copilot-instructions.md   # GitHub Copilot project context
│   ├── PULL_REQUEST_TEMPLATE.md  # PR checklist
│   └── ISSUE_TEMPLATE/           # Bug report and test-request templates
│
├── Agent.md                      # Catalog of Claude Code agents
├── Skills.md                     # Catalog of Claude Code skills / commands
└── CLAUDE.md                     # Claude Code project instructions
```

---

## Architecture

### Page Object Model (POM)

Every page or major section of the site has its own TypeScript class in `src/pages/`. All page classes extend `BasePage`, which provides shared helpers for navigation, screenshots, console-error collection, and responsive checks.

```
BasePage (base.page.ts)
├── HomePage      (home.page.ts)
├── NavigationPage (navigation.page.ts)
├── ContactFormPage (contact.page.ts)
└── FeaturesPage  (features.page.ts)
```

**Key rules:**
- Locators are `readonly Locator` properties declared on the class.
- Methods represent *user actions*, not assertions.
- `expect()` calls belong in test files, never in page objects.
- No raw `page.locator()` calls in test files — always go through a page object.

### Object-Oriented Programming (OOP)

The POM is built with OOP principles:

| Principle | How it applies |
|-----------|----------------|
| **Inheritance** | All page classes extend `BasePage` to share navigation, screenshot, and console helpers |
| **Encapsulation** | Each page object hides its locators as `readonly` fields; tests use methods, not raw locators |
| **Abstraction** | `BasePage` exposes high-level helpers (`navigate()`, `isResponsive()`) that hide browser-level detail |
| **Single Responsibility** | One class per page or section; one spec file per test category |

### Custom Fixtures

`src/fixtures/site.fixture.ts` extends Playwright's `test` object to inject pre-constructed page objects and the parsed `SiteConfig` into every test. This means tests never construct page objects directly:

```typescript
import { test, expect } from '@fixtures/site.fixture';

test('example', async ({ homePage, siteConfig }) => {
  // homePage is already navigated; siteConfig has all config fields
});
```

---

## Claude Code Integration

This repo is instrumented for use with [Claude Code](https://code.claude.com), Anthropic's AI coding assistant. Claude Code reads `CLAUDE.md` at the start of every session and uses the agents, commands, and rules defined in `.claude/` to autonomously analyze sites, generate tests, and maintain the suite.

### Quick start with Claude Code

```bash
# Open the repo in Claude Code
claude

# Analyze the target site and update site.config.json
/analyze-site

# Generate the full POM + test suite from scratch
/generate-full-suite

# Run smoke tests and see a report
/run-smoke
```

See [Agent.md](./Agent.md) for the agent catalog and [Skills.md](./Skills.md) for the full skills reference.

---

## Agents

Claude Code agents live in `.claude/agents/` and are specialized subagents that handle specific tasks. See **[Agent.md](./Agent.md)** for the full catalog, usage examples, and instructions for creating new agents.

| Agent | File | Purpose |
|-------|------|---------|
| `site-analyzer` | `.claude/agents/site-analyzer.md` | Crawl the live site; populate `site.config.json` |
| `test-generator` | `.claude/agents/test-generator.md` | Read config; generate site-specific test files |

---

## Skills & Commands

Slash commands live in `.claude/commands/` and are invoked with `/command-name` inside a Claude Code session. See **[Skills.md](./Skills.md)** for full documentation.

| Command | Purpose |
|---------|---------|
| `/generate-full-suite` | Analyze site and generate complete POM + tests |
| `/analyze-site` | Inspect site structure; output updated `site.config.json` |
| `/run-smoke` | Execute smoke tests; report results |
| `/update-baseline` | Refresh visual regression snapshots |
| `/generate-report` | Generate a test results summary |

---

## Rules & Instructions

### CLAUDE.md

`CLAUDE.md` at the project root is the primary instruction file for Claude Code. It defines:
- Architecture rules (POM, OOP, TypeScript strict mode)
- Test-writing conventions
- What to do before writing any test (read config, fetch live site, use real selectors)
- What never to do (submit forms, hardcode URLs, put assertions in page objects)

### .claude/rules/

Path-scoped rule files in `.claude/rules/` load automatically when Claude works with matching files:

| Rule file | Scope | Content |
|-----------|-------|---------|
| `pom-conventions.md` | `src/pages/**/*.ts` | POM class conventions, locator patterns |
| `test-conventions.md` | `tests/**/*.spec.ts` | Tagging, fixture imports, assertion style |

### .claude/hooks/

Shell hooks run at Claude Code lifecycle events:

| Hook | Trigger | Action |
|------|---------|--------|
| `pre-test.sh` | Before running tests | Verify target site is reachable |

---

## .github Folder

The `.github/` folder contains GitHub-specific configuration for the project:

| File | Purpose |
|------|---------|
| `workflows/ci.yml` | GitHub Actions pipeline: smoke → full suite → artifact upload |
| `copilot-instructions.md` | Project context for GitHub Copilot (mirrors CLAUDE.md) |
| `PULL_REQUEST_TEMPLATE.md` | Checklist every PR author fills in |
| `ISSUE_TEMPLATE/bug_report.md` | Bug report template |
| `ISSUE_TEMPLATE/test_request.md` | Request for new test coverage |
| `CODEOWNERS` | Code review ownership |

The CI pipeline runs on every push to `main` and every pull request. It runs smoke tests first as a fast gate, then the full suite, and uploads HTML reports and screenshots as downloadable artifacts.

---

## Contributor Guide

### Adding a new test

1. Read `site.config.json` to confirm the target URL and flags.
2. Use `WebFetch` or your browser to inspect the live page HTML before writing selectors.
3. Add or update the relevant page object in `src/pages/`.
4. Write the test in the correct `tests/<category>/` folder.
5. Tag every test with at least one of: `@smoke`, `@navigation`, `@forms`, `@functional`, `@visual`, `@responsive`.
6. Run `npm run typecheck` to confirm TypeScript compiles cleanly.
7. Run the relevant tagged test locally before opening a PR.

### Do not

- Submit any form under test.
- Create accounts or enter real credentials.
- Hardcode the base URL in tests — always use `siteConfig.url` or `baseURL` from Playwright config.
- Put `expect()` assertions inside page object methods.
- Use `page.waitForTimeout()` — use Playwright's built-in auto-waiting instead.
- Use the `any` type without an explicit comment explaining why.

### Branch naming

```
feat/<description>      # New test coverage or page object
fix/<description>       # Bug fix in existing test or helper
chore/<description>     # CI, config, dependency updates
```

### Commit messages

Use conventional commits:
```
feat(functional): add homepage CTA button tests
fix(navigation): handle mobile menu edge case on tablet
chore(ci): bump Playwright to 1.45.0
```

### Pull requests

Fill in the PR template fully. Every PR must pass CI before merge. Visual regression baseline changes require a separate PR comment explaining why the snapshots changed.

---

## Company Profile

| Field | Details |
|-------|---------|
| **Company** | Flagship Fleet Management |
| **Website** | [http://www.flagshipfleet.com/](http://www.flagshipfleet.com/) |
| **City** | Phoenix, AZ |
| **Founded** | 2004 |
| **Industry** | Fleet Management Software |
| **Leaders** | Phil Raffel (Owner) |

---

*This QA framework is maintained as part of the Phoenix Startup QA Agentic Solutions project.*

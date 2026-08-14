# Skills.md — Claude Code Skills & Commands Catalog

This file documents all skills (slash commands) available in this repository. Skills are reusable workflows invoked with `/command-name` inside a Claude Code session.

For agent documentation, see [Agent.md](./Agent.md).
For Claude Code instructions, see [CLAUDE.md](./CLAUDE.md).

---

## What Are Skills?

Skills are Markdown files in `.claude/commands/` that define repeatable workflows for Claude Code. When you type `/skill-name` in a Claude Code session, Claude loads the corresponding Markdown file and executes the workflow it describes.

Skills differ from agents in scope:
- **Skills** are multi-step workflows that may use multiple agents, read files, run commands, and produce reports.
- **Agents** are specialized subagents focused on a single type of task (site crawling, test generation).

Skills load only when invoked, so they do not consume context tokens in every session — unlike `CLAUDE.md` which is always loaded.

---

## Available Skills

### `/generate-full-suite`

**File:** `.claude/commands/generate-full-suite.md`

**Purpose:** Analyze the live website and build a complete, production-quality Playwright + TypeScript regression test suite from scratch using the Page Object Model.

**When to use:**
- First-time setup of a new company repo
- After a major site redesign that invalidates existing selectors
- When starting with an empty or stubbed-out test suite

**What it does:**
1. Reads `site.config.json` to get the URL and flags
2. Uses `WebFetch` to crawl the homepage and all discovered pages
3. Records: page titles, nav links, forms, interactive elements, and content sections
4. Plans page object classes (one per discovered page)
5. Writes all page object TypeScript files to `src/pages/`
6. Updates `src/fixtures/site.fixture.ts` to include new page objects
7. Writes comprehensive test files across all categories
8. Updates `site.config.json` with discovered values
9. Runs `npx tsc --noEmit` to verify TypeScript compiles cleanly
10. Reports a summary: pages analyzed, classes created, tests written

**Estimated time:** 5–15 minutes depending on site complexity.

**Output:**
- Updated `site.config.json`
- New/updated `src/pages/*.page.ts` files
- New/updated `tests/**/*.spec.ts` files
- Updated fixture file
- Summary report in the Claude Code session

**Example:**
```
/generate-full-suite
```

---

### `/analyze-site`

**File:** `.claude/commands/analyze-site.md`

**Purpose:** Inspect the live site and produce a fully-populated `site.config.json`. Lighter-weight than `/generate-full-suite` — analysis only, no test generation.

**When to use:**
- Onboarding a new company: fill in `site.config.json` before generating tests
- Validating that an existing config is still accurate
- Auditing the site for QA-relevant issues (missing meta description, no HTTPS, broken nav links)

**Usage:**
```
/analyze-site [url]
```
If `url` is omitted, uses the `url` field from `site.config.json`.

**What it does:**
1. Navigates to the URL
2. Extracts: `<title>`, `<meta name="description">`, nav links, form presence, H1, CTA buttons
3. Attempts to discover the contact page at `/contact`, `/contact-us`, `/get-in-touch`
4. Checks for horizontal overflow at 390px viewport
5. Reports issues: missing HTTPS, missing meta description, broken nav links, no `<h1>`

**Output:**
- A completed `site.config.json` JSON block
- An "Issues found" checklist
- A confidence assessment (High / Medium / Low)

**Example:**
```
/analyze-site
/analyze-site https://www.flagshipfleet.com
```

---

### `/run-smoke`

**File:** `.claude/commands/run-smoke.md`

**Purpose:** Execute the `@smoke` test suite and report results in plain language.

**When to use:**
- After any change to `site.config.json` to verify the site is still reachable
- As a quick sanity check before running the full suite
- In CI as a fast gate before expensive visual and responsive tests

**What it does:**
1. Runs `npm run test:smoke`
2. Parses the test results (pass/fail counts, failed test names, error messages)
3. Reports a plain-language summary: what passed, what failed, and recommended next steps

**Output:**
A plain-language report in the Claude Code session with pass/fail counts and action items.

**Example:**
```
/run-smoke
```

---

### `/update-baseline`

**File:** `.claude/commands/update-baseline.md`

**Purpose:** Refresh the visual regression snapshot baselines for all `@visual` tests.

**When to use:**
- After an intentional UI redesign that changes the visual appearance
- When adding new `toHaveScreenshot()` assertions for the first time
- When existing snapshots are failing due to legitimate changes (not bugs)

**What it does:**
1. Runs `npm run baseline` (`playwright test --grep @visual --update-snapshots`)
2. Reports which snapshot files were created or updated
3. Warns if more than a threshold number of snapshots changed (suggests an unintended layout regression)

**Important:** Only run this command when you have confirmed that the visual changes are intentional. Updating baselines to silence failures hides real regressions.

**Output:**
- Updated snapshot files in `__snapshots__/`
- A report listing which snapshots changed and by how many pixels

**Example:**
```
/update-baseline
```

---

### `/generate-report`

**File:** `.claude/commands/generate-report.md`

**Purpose:** Generate a test results summary from the latest test run.

**When to use:**
- After running the full test suite to get a readable summary
- When you need to report test status to a stakeholder
- After CI completes to understand what passed and what needs attention

**What it does:**
1. Reads `test-results/results.json` from the most recent test run
2. Parses pass/fail/skip counts per test category
3. Identifies flaky tests (passed after retry)
4. Highlights any tests that consistently fail
5. Produces a markdown-formatted summary

**Output:**
A formatted test results report in the Claude Code session, including:
- Overall pass/fail rate
- Breakdown by tag (`@smoke`, `@navigation`, etc.)
- List of failed tests with error excerpts
- Recommended follow-up actions

**Example:**
```
/generate-report
```

---

## Creating a New Skill

1. Create `.claude/commands/<name>.md` with a descriptive filename using kebab-case.
2. Start the file with a heading: `# /<name>`.
3. Include these sections:
   - **What this command does** — numbered step list
   - **Usage** — command syntax with optional parameters
   - **Output format** — what Claude will produce
   - **Handling edge cases** — what to do when steps fail
4. Test the skill by invoking it in a Claude Code session.
5. Document it in this file under [Available Skills](#available-skills).

### Skill vs. Agent: which to build?

| Build a **Skill** when... | Build an **Agent** when... |
|---------------------------|---------------------------|
| The workflow has multiple steps that a human would trigger | The task is a specific type of work Claude delegates automatically |
| You want a `/slash-command` interface | You want automatic delegation based on task description |
| The workflow combines analysis + generation + reporting | The task is focused on a single output type (config, test files) |
| You want the workflow shared with the whole team | You want a specialized context with limited tool access |

---

## Skill Conventions

- **File naming:** kebab-case matching the slash command name (`run-smoke.md` → `/run-smoke`)
- **First heading:** matches the slash command exactly (`# /run-smoke`)
- **No side effects without warning:** skills that write files or update configs should state this prominently
- **Idempotent where possible:** running a skill twice should not produce broken state
- **Report results:** every skill should end by reporting what it did so the user knows if it succeeded

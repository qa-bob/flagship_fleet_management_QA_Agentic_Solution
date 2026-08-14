---
name: Bug report
about: A test is failing, flaky, or producing incorrect results
title: "[BUG] "
labels: bug
assignees: ''
---

## Describe the bug

<!-- A clear description of what is failing and what you expected to happen. -->

## Test details

**Test file:** `tests/...`
**Test name:**
**Tag:** `@smoke` / `@navigation` / `@forms` / `@functional` / `@visual` / `@responsive`

## Steps to reproduce

1. Run `npx playwright test <test-file> --project=<project-name>`
2. Observe the failure

## Expected behavior

<!-- What should the test assert / what should pass? -->

## Actual behavior

<!-- What is the test doing instead? Paste error output here. -->

```
<paste error message or stack trace>
```

## Environment

- OS:
- Node.js version:
- Playwright version: (run `npx playwright --version`)
- Browser project: `chromium-desktop` / `mobile-chrome` / `tablet`
- Site URL tested against:

## Screenshots / recordings

<!-- Attach Playwright screenshots or video from `test-results/` if available. -->

## Possible cause

<!-- Optional: do you have a theory about what is causing the failure? -->

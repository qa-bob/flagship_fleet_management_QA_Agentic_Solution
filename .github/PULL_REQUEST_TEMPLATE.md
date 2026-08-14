## Summary

<!-- One or two sentences describing what this PR does and why. -->

## Type of change

- [ ] New test coverage (new spec file or new `test()` block)
- [ ] Updated page object (new locator, method, or class)
- [ ] Bug fix in existing test or helper
- [ ] Visual baseline update (screenshot snapshots changed intentionally)
- [ ] CI / config / dependency change
- [ ] Documentation update

## Test details

<!-- Which test files were added or changed? -->

**Files changed:**
- `tests/...`
- `src/pages/...`

**Tags covered:**
- [ ] `@smoke`
- [ ] `@navigation`
- [ ] `@forms`
- [ ] `@functional`
- [ ] `@visual`
- [ ] `@responsive`

## Checklist

- [ ] I read `CLAUDE.md` and this PR follows all architecture rules
- [ ] All new tests are tagged with at least one category tag
- [ ] No assertions (`expect()`) are inside page object methods
- [ ] No hardcoded URLs — all tests use `siteConfig.url` or `baseURL`
- [ ] No forms are submitted in any test
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] New or changed tests pass locally against the live site
- [ ] Visual baseline snapshots updated (if applicable) with justification below

## Visual changes

<!-- If snapshots were updated, explain why the visual change is expected. -->
<!-- If no visual changes, delete this section. -->

## Notes for reviewers

<!-- Anything else the reviewer should know: edge cases handled, limitations, follow-up work. -->

# Test Writing Standards

The rules every new or changed Playwright test in this repo must follow. They are derived from the existing suite
(`tests/ui/login.spec.ts`, `tests/ui/users.spec.ts`, `tests/ui/e2e/users-journey.spec.ts`, `tests/api/users.api.spec.ts`)
— when in doubt, copy the pattern used there.

## Where files go

| Kind of test                 | Location                           | Playwright project                               |
| ---------------------------- | ---------------------------------- | ------------------------------------------------ |
| UI scenario on one screen    | `tests/ui/<feature>.spec.ts`       | `chromium`, `firefox`, `webkit`, `mobile-chrome` |
| Multi-screen user journey    | `tests/ui/e2e/<journey>.spec.ts`   | `chromium`, `firefox`, `webkit`, `mobile-chrome` |
| Accessibility scan           | `tests/ui/accessibility.spec.ts`   | all UI projects                                  |
| Visual comparison            | `tests/ui/visual.spec.ts`          | `chromium` only                                  |
| REST API contract / CRUD     | `tests/api/<resource>.api.spec.ts` | `api`                                            |
| Page object                  | `tests/ui/pages/<page>.page.ts`    | —                                                |
| API client / response schema | `tests/api/utils/`                 | —                                                |
| Shared test data / factories | `tests/data/`                      | —                                                |

Prefer adding a `test` to an existing spec file for the same feature over creating a new file.

## Imports and fixtures

- UI specs import `{ expect, test }` from `./fixtures.ts` (or `../fixtures.ts` from `e2e/`). API specs import from
  `./fixtures.ts` in `tests/api`. Never import `test` directly from `@playwright/test` in a spec (only `auth.setup.ts` does).
- Use the provided fixtures instead of constructing objects in tests: `loginPage`, `usersPage`,
  `authenticatedUsersPage`, `usersApi`, `apiTestUser`, `testData`.
- Use `.ts` extensions in relative imports (the repo runs native TypeScript ESM).
- If a test needs a new reusable resource, add a fixture in the matching `fixtures.ts` rather than setup code in the spec.

## Structure and naming

- Wrap tests in `test.describe('<Feature>', { tag: '@<feature>' }, () => { ... })` with a one-line JSDoc comment above it.
- Test titles are lowercase behaviour statements: `'filters users by email without case sensitivity'`.
- Tags: `@smoke` for fast critical-path checks, `@validation` for input rules, `@auth` for login-dependent checks,
  `@e2e` on journeys, `@a11y` on accessibility scans, `@visual` on screenshot comparisons (Chromium only), `@api` on API suites, and **`@test-data` on any test that creates, edits or deletes data**
  (these are excluded from dev/staging runs).
- Link the test to its requirement in `requirement/` with an annotation:
  `{ tag: [...], annotation: { type: 'requirement', description: 'REQ-001' } }`.

## Locators and page objects

- All locators live in page objects as `readonly` `Locator` fields assigned in the constructor; actions are small
  `async` methods with a JSDoc line. Tests may chain from page-object locators for one-off row/cell lookups.
- Locator priority: `getByRole` (with `name`, and `exact`/`level` where needed) → `getByLabel` → `getByText` →
  `getByTestId`. No CSS/XPath selectors unless nothing accessible exists, and say why in a comment.
- Scope locators to their container (dialog, row, table) instead of using `.nth()` on page-wide queries.

## Assertions and waiting

- Use web-first assertions (`await expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL`, `toHaveCount`).
- Never use `page.waitForTimeout`, fixed sleeps, or `{ force: true }` clicks.
- Every test asserts the outcome the requirement asks for — not just that steps ran without error.
- API responses are validated with `parseApiResponse(response, <ZodSchema>, <status>)`; add schemas to
  `tests/api/utils/schemas.ts`.

## Accessibility, visual and failure-state tests

- Scan with the `makeAxeBuilder` fixture, which checks WCAG 2.1 A/AA rules, and assert
  `expect(results.violations).toEqual([])`. Scope a scan with `.include(...)` instead of disabling rules.
- Screenshot tests filter the page to stable seeded data first, since parallel tests add users. After an intended UI
  change, run `npm run test:visual:update` and commit both the `-darwin` and `-linux` baselines (see the README).
- Simulate API failures with `page.route()` (`fulfill` for error statuses, `abort` for network failures). Use
  `route.fallback()` for requests the test does not mean to change. Do not use `context.setOffline()`: Firefox
  ignores it for loopback hosts.

## Data and environment safety

- Never hard-code credentials. Read them with `getLoginCredentials()` and skip with a clear message when unset:
  `test.skip(true, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to run ...')`.
- Reference data goes in `tests/data/users.ts`; generated data uses `createUniqueUserData(...)` from `tests/data/factories.ts`.
- Tests that mutate data call `assertTestDataTargetIsSafe(baseURL)` first, are tagged `@test-data`, and clean up in a
  `finally` block (or use the `apiTestUser` fixture, which cleans up for you).
- Tests must be independent and parallel-safe: no reliance on order or on data another test creates.

## Quality gates

A change is done only when all of these pass:

```bash
npx prettier --check <changed files>
npm run typecheck
npm run lint
npx cross-env TEST_ENV=local playwright test <changed spec files> --reporter=list --repeat-each=3
```

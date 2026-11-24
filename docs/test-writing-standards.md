# Test Writing Standards

The rules every new or changed Playwright test in this repo must follow. They are derived from the existing suite
(`tests/ui/login.spec.ts`, `tests/ui/users.spec.ts`, `tests/ui/e2e/users-journey.spec.ts`, `tests/api/users.api.spec.ts`)
— when in doubt, copy the pattern used there.

## Where files go

| Kind of test                  | Location                                   | Playwright project                               |
| ----------------------------- | ------------------------------------------ | ------------------------------------------------ |
| UI scenario on one screen     | `tests/ui/<feature>.spec.ts`               | `chromium`, `firefox`, `webkit`, `mobile-chrome` |
| Multi-screen user journey     | `tests/ui/e2e/<journey>.spec.ts`           | `chromium`, `firefox`, `webkit`, `mobile-chrome` |
| Accessibility scan            | `tests/ui/accessibility.spec.ts`           | all UI projects                                  |
| REST API contract / CRUD      | `tests/api/<resource>.api.spec.ts`         | `api`                                            |
| GraphQL API                   | `tests/api/<resource>.graphql.spec.ts`     | `api`                                            |
| OpenAPI document checks       | `tests/api/openapi.contract.spec.ts`       | `api`                                            |
| Test that resets all app data | `tests/api/destructive/<name>.api.spec.ts` | `api-destructive` (runs last)                    |
| Network mocks for UI tests    | `tests/ui/mocks/<api>-mock.ts`             | —                                                |
| Page object                   | `tests/ui/pages/<page>.page.ts`            | —                                                |
| API client / response schema  | `tests/api/utils/`                         | —                                                |
| Shared test data / factories  | `tests/data/`                              | —                                                |

Prefer adding a `test` to an existing spec file for the same feature over creating a new file.

## Imports and fixtures

- UI specs import `{ expect, test }` from `./fixtures.ts` (or `../fixtures.ts` from `e2e/`). API specs import from
  `./fixtures.ts` in `tests/api`. Never import `test` directly from `@playwright/test` in a spec (only `auth.setup.ts` does).
- Use the provided fixtures instead of constructing objects in tests: `loginPage`, `usersPage`,
  `authenticatedUsersPage`, `usersApiMock`, `usersApi`, `graphqlApi`, `apiTestUser`, `testData`.
- Use `.ts` extensions in relative imports (the repo runs native TypeScript ESM).
- If a test needs a new reusable resource, add a fixture in the matching `fixtures.ts` rather than setup code in the spec.

## Structure and naming

- Wrap tests in `test.describe('<Feature>', { tag: '@<feature>' }, () => { ... })` with a one-line JSDoc comment above it.
- Test titles are lowercase behaviour statements: `'filters users by email without case sensitivity'`.
- Tags: `@smoke` for fast critical-path checks, `@validation` for input rules, `@auth` for login-dependent checks,
  `@e2e` on journeys, `@a11y` on accessibility scans, `@api` on API suites, `@graphql` on GraphQL suites,
  `@contract` on OpenAPI checks, `@mocked` on UI tests that mock the network, and **`@test-data` on any test that creates, edits or deletes data**
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

## Accessibility and failure-state tests

- Scan with the `makeAxeBuilder` fixture, which checks WCAG 2.1 A/AA rules, and assert
  `expect(results.violations).toEqual([])`. Scope a scan with `.include(...)` instead of disabling rules.
- Mock the users API with the `usersApiMock` fixture rather than calling `page.route()` in a spec: `fulfill` for
  canned responses and error statuses, `abort` for network failures, and `hold` to check the page while a response
  is slow (never use a fixed delay). Requests the mock does not match reach the real app. Do not use
  `context.setOffline()`: Firefox ignores it for loopback hosts.
- Mock rows that a test edits or deletes with `testData.mockUsers`, whose IDs no real user has.
- Always mock `resetData` in UI tests: a real reset deletes users that parallel tests depend on.

## Known app defects

- When the app does not yet behave as it should, write the test for the correct behaviour and declare it with
  `test.fail(title, { annotation: { type: 'app-defect', description } }, body)`, grouped under a
  `known app defects` describe. Never weaken the assertion to make it pass.
- Check that the test fails for the reason in the annotation. When the app is fixed, the test fails as an
  unexpected pass: change it to an ordinary `test`.

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

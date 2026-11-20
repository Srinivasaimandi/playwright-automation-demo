# Playwright Test Framework

TypeScript end-to-end testing with Playwright Test, plus a workspace Playwright MCP server for VS Code.

See the [framework developer guide](./docs/index.html) for the architecture, fixtures, API validation, environment safety rules, and file-by-file reference.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
git submodule update --init --recursive
npm ci
npm ci --prefix app
npx playwright install chromium firefox webkit
```

The Users App source is in [`app/`](./app/) as a Git submodule, cloned from
[users-app-demo](https://github.com/srinivasaimandi/users-app-demo). Playwright starts it automatically for local
and loopback test runs with `npm --prefix app start` (port 9899). If that URL is already serving the app, local runs
reuse it; CI starts a fresh server. Remote development and staging targets are not started by Playwright.

## Run tests

```bash
npm test
npm run test:local
npm run test:test
npm run test:api
npm run test:dev
npm run test:staging
npm run test:headed
npm run test:ui
npm run test:debug
npm run test:report
npm run test:history:report
npm run test:history:unit
npm run typecheck
```

Every Playwright run writes its raw JSON results to `test-results/results.json`, updates the ignored local store at
`.playwright-history/history.json`, and generates `reports/test-history-report.html` plus its companion pages. The report shows all-time per-test pass
rates and recent trends; skipped tests are excluded from pass-rate denominators, and flaky passes are counted
separately. The landing page shows statistics, with separate Per-test history and Recent runs pages available from
the header navigation. Per-test totals are all-time, the latest 100 run summaries are kept, and each test retains its
latest 30 outcomes. Metrics include latest and all-time pass rates, known tests, flaky outcomes, a pass-rate trend for
up to 12 runs, and the latest run's outcome breakdown. Filter per-test history by UI/API/E2E category, latest status,
or tag, or search scenario titles, paths, projects, and tags. Use `npm run test:history:report` to regenerate all
report pages from the saved history.

Select an environment with `npm run test:local`, `npm run test:test`, `npm run test:dev`, or `npm run test:staging`. Each run uses its matching `env/.env.<environment>` file, if present; `BASE_URL` must be set for non-local environments. Process environment variables take precedence over values in the file.

Copy the example files and set each environment's URL:

```bash
cp env/.env.example env/.env.local
cp env/.env.test.example env/.env.test
cp env/.env.dev.example env/.env.dev
cp env/.env.staging.example env/.env.staging
```

`env/.env` is also supported as a fallback for local runs. Environment files are ignored by Git; keep credentials there for local work and use your CI secret store in CI. For application tests, navigate with `page.goto('/')` so Playwright uses the selected environment's `BASE_URL`.

The `test` environment is intended for a disposable test instance. Set `BASE_URL`, `LOGIN_USERNAME`, `LOGIN_PASSWORD`, and `TEST_DATA_ALLOWED_HOSTS` in `env/.env.test` or CI. A loopback URL starts the bundled app; remote test URLs must already be reachable. The API test-data fixture creates a unique user for its test and deletes it afterward; it only permits loopback hosts under `TEST_ENV=local`, or explicitly allowlisted hosts under `TEST_ENV=test`. Do not point it at development, staging, or production data.

UI specs live under `tests/ui/` and run in Chromium, Firefox, and WebKit. Full user journeys live under `tests/ui/e2e/`. API specs live under `tests/api/` and run once in the `api` project. Run API tests alone with `npm run test:api`; `npm run test:local` runs the full suite. Development and staging scripts exclude tests tagged `@test-data`, which create or delete users.

The login spec covers form rendering, required-field validation, and successful authentication. Set `LOGIN_USERNAME` and `LOGIN_PASSWORD` in the selected environment file or CI secrets to run the authenticated test; it is skipped if either value is missing. Run the login tests with:

```bash
npm run test:local -- --grep @login
```

## Playwright fixtures

`tests/ui/fixtures.ts` extends the API fixtures with reusable `loginPage` and `usersPage` page objects, plus `authenticatedUsersPage`, which logs in before providing the users screen. `tests/api/fixtures.ts` provides the API key and `apiTestUser` fixtures, while `testData` supplies typed shared values from `tests/data/`. Authenticated tests are skipped when `LOGIN_USERNAME` or `LOGIN_PASSWORD` is missing. The `testData` fixture itself is read-only; `apiTestUser` is the separate fixture for creating and cleaning up an application record.

Import the extended `test` in specs that use these fixtures:

```ts
import { expect, test } from './fixtures.ts';

test('filters users', async ({ authenticatedUsersPage, testData }) => {
  await authenticatedUsersPage.searchFor(testData.existingUsers.jane.name);
});
```

Fixtures are scoped to each test by default, so each authenticated test gets its own page and login session.

The API-backed `apiTestUser` fixture can seed a unique user for a test and clean it up automatically:

```ts
test('shows a created user', async ({ authenticatedUsersPage, apiTestUser }) => {
  await authenticatedUsersPage.refreshUsersButton.click();
  await authenticatedUsersPage.searchFor(apiTestUser.email);
});
```

## Shared test utilities and API schemas

- `tests/api/utils/users-api-client.ts` centralizes authenticated user API operations.
- `tests/api/utils/schemas.ts` defines Zod schemas for login, user, user-list, and count responses. The API client validates each successful JSON response and reports status, JSON, or schema errors with the endpoint path. Unknown response fields are stripped from parsed user objects.
- `tests/data/factories.ts` creates unique user data for tests.
- `tests/utils/environment.ts` provides shared credential lookup and guards API data changes to loopback or allowlisted test hosts.

The GitHub Actions workflow installs the bundled app and starts it through Playwright. Configure the `TEST_LOGIN_USERNAME` and `TEST_LOGIN_PASSWORD` secrets for the seeded test account. CI restores and updates `history.json` on the dedicated `test-history` branch and uploads the cumulative HTML report as a run artifact. The first non-PR run creates the branch. Ensure repository Actions settings allow the workflow's `contents: write` permission; pull-request runs report history but do not write to the branch.

## Playwright MCP in VS Code

The root `.mcp.json` configures the official `@playwright/mcp` server for Copilot in VS Code. Open this folder in VS Code, trust the workspace/server when prompted, then start or enable the `playwright` MCP server from the MCP servers UI. If VS Code does not load workspace-root MCP configuration, enable the `chat.mcp.workspaceRootConfig.enabled` setting or add the same server through **Chat: Open Customizations → MCP Servers**.

The MCP server is an agent-facing browser tool; automated test runs use Playwright Test directly. Playwright MCP may launch browser sessions independently of the test runner.

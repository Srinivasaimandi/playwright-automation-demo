# Playwright Test Framework

TypeScript end-to-end testing with Playwright Test, plus a workspace Playwright MCP server for VS Code.

See the [framework developer guide](./docs/index.html) for the architecture, fixtures, API validation, environment safety rules, the requirement-to-test orchestrator, and file-by-file reference. Test conventions are in [`docs/test-writing-standards.md`](./docs/test-writing-standards.md).

## Requirements

- Node.js 20.19+, 22.13+, or 24+
- npm

## Setup

```bash
git submodule update --init --recursive
npm ci
npm ci --prefix app
npx playwright install chromium
```

The Users App source is in [`app/`](./app/) as a Git submodule, cloned from
[users-app-demo](https://github.com/srinivasaimandi/users-app-demo). Playwright starts it automatically for local
and loopback test runs with `npm --prefix app start` (port 9899). If that URL is already serving the app, local runs
reuse it; CI starts a fresh server. Remote development and staging targets are not started by Playwright.

Before each local `npm test*` run, `scripts/update-app.mjs` force-updates `app/` to the latest commit of its tracked
branch. Any local edits in `app/` are discarded, so fix app defects upstream in users-app-demo, not here. Set
`SKIP_APP_UPDATE=1` to run against the current checkout unchanged.

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
npm run lint
npm run format:check
```

Use `npm run format` to apply the configured Prettier formatting. ESLint checks JavaScript configuration and utility files; TypeScript is type-checked and formatted with Prettier.

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

UI specs live under `tests/ui/` and run in Chromium. Full user journeys live under `tests/ui/e2e/`. API specs live under `tests/api/` and run once in the `api` project. Run API tests alone with `npm run test:api`; `npm run test:local` runs the full suite. Development and staging scripts exclude tests tagged `@test-data`, which create or delete users.

The login spec covers form rendering, required-field validation, and successful authentication. Set `LOGIN_USERNAME` and `LOGIN_PASSWORD` in the selected environment file or CI secrets to run the authenticated test; it is skipped if either value is missing. Run the login tests with:

```bash
npm run test:local -- --grep @login
```

## Playwright fixtures

`tests/ui/fixtures.ts` extends the API fixtures with reusable `loginPage` and `usersPage` page objects, plus `authenticatedUsersPage`, which opens the users screen using saved browser state. When login credentials are configured, the `setup` project logs in once and saves the app's local-storage token to `.auth/user.json`; the Chromium project loads that state for each isolated test context. The `.auth/` directory is ignored by Git because the state contains an authentication token. Login-flow tests still exercise the login form directly. Authenticated tests are skipped when `LOGIN_USERNAME` or `LOGIN_PASSWORD` is missing. `tests/api/fixtures.ts` provides the API key and `apiTestUser` fixtures, while `testData` supplies typed shared values from `tests/data/`. The `testData` fixture itself is read-only; `apiTestUser` is the separate fixture for creating and cleaning up an application record.

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

The GitHub Actions workflow installs the bundled app, runs lint, formatting, and type checks, and starts it through Playwright. Configure the `TEST_LOGIN_USERNAME` and `TEST_LOGIN_PASSWORD` secrets for the seeded test account. CI restores and updates `history.json` on the dedicated `test-history` branch and uploads the cumulative HTML report as a run artifact. The first non-PR run creates the branch. Ensure repository Actions settings allow the workflow's `contents: write` permission; pull-request runs report history but do not write to the branch.

## Playwright MCP in VS Code

The root `.mcp.json` configures the official `@playwright/mcp` server for Copilot in VS Code. Claude Code reads the same file; the orchestrator's agents use it to explore the running app. Open this folder in VS Code, trust the workspace/server when prompted, then start or enable the `playwright` MCP server from the MCP servers UI. If VS Code does not load workspace-root MCP configuration, enable the `chat.mcp.workspaceRootConfig.enabled` setting or add the same server through **Chat: Open Customizations → MCP Servers**.

The MCP server is an agent-facing browser tool; automated test runs use Playwright Test directly. Playwright MCP may launch browser sessions independently of the test runner.

## Requirement-to-test orchestrator (Claude Code)

`/requirement-to-test <requirement-id-or-path>` turns a requirement from the [`requirement/`](requirement/) folder
into Playwright tests. Nothing is committed or pushed until you approve. The
[developer guide](./docs/index.html#orchestrator) covers the flow in detail.

```bash
/requirement-to-test REQ-001
```

### Prerequisites

- Claude Code opened at the repository root, with the `playwright` MCP server from `.mcp.json` enabled.
- Dependencies installed as in [Setup](#setup).
- `LOGIN_USERNAME` and `LOGIN_PASSWORD` in `env/.env.local`. Without them, authenticated tests skip and the
  orchestrator reports them as not verified.

### Writing a requirement

Copy `requirement/_template.md` to `requirement/REQ-<nnn>-<slug>.md`, describe the feature, list numbered
acceptance criteria (`AC1`, `AC2`, …) as observable outcomes, and set `status: ready`. Each criterion becomes at
least one test. See [`requirement/README.md`](requirement/README.md) for the format and
[`REQ-001-user-search.md`](requirement/REQ-001-user-search.md) for an example. Generated tests carry the annotation
`{ type: 'requirement', description: 'REQ-001' }`, so you can find a requirement's tests by its ID.

### What a run does

1. **Preconditions**: finds the requirement file, warns about uncommitted test changes, and creates the branch
   `tests/<id>` (for example `tests/req-001`).
2. **Read**: extracts acceptance criteria, out-of-scope notes and test-data hints. A `draft` requirement or unclear
   criteria make it stop and ask.
3. **Plan**: maps each criterion to a test, file and tags, skipping criteria that existing tests already cover.
4. **Write**: the `playwright-test-writer` agent checks locators in the live app through Playwright MCP, then adds
   specs, page objects and test data.
5. **Verify**: runs Prettier, `npm run typecheck`, `npm run lint` and the changed specs.
6. **Heal**: on failure, the `playwright-test-healer` agent works out whether the test, the app or the environment
   is at fault, and fixes only test defects. At most three attempts; it stops early on an app or environment
   problem.
7. **Stability**: reruns passing specs with `--repeat-each=3` to catch flaky tests.
8. **Approve**: shows coverage per criterion, the diff, run results and suspected app defects, then asks you to
   **approve and commit** (no push), **request changes** (back to step 4 with your notes), or **reject and
   discard** (removes the run's changes and branch).

The healer never makes a test pass by loosening or deleting an assertion tied to a criterion, skipping the test,
adding fixed waits or `force: true`, raising timeouts, or editing `app/` or `playwright.config.ts`. The orchestrator
checks the diff after each heal and reverts any weakened assertion. Verification runs use the `list` reporter, so they
don't add entries to the cumulative test history.

| File | Role |
| --- | --- |
| `requirement/*.md` | Requirements with numbered acceptance criteria (the orchestrator's input) |
| `.claude/skills/requirement-to-test/SKILL.md` | Orchestrator: phases, heal limit, approval step |
| `.claude/agents/playwright-test-writer.md` | Explores the app with Playwright MCP and writes the tests |
| `.claude/agents/playwright-test-healer.md` | Diagnoses failures and fixes test defects only (never weakens assertions) |
| `docs/test-writing-standards.md` | The writing standard both agents follow |

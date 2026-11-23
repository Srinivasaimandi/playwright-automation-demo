import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const testEnvironment = process.env.TEST_ENV ?? 'local';
const supportedEnvironments = new Set(['local', 'test', 'dev', 'staging']);

if (!supportedEnvironments.has(testEnvironment)) {
  throw new Error(
    `Unsupported TEST_ENV "${testEnvironment}". Choose one of: ${[...supportedEnvironments].join(', ')}.`,
  );
}

const envFile = `env/.env.${testEnvironment}`;
if (existsSync(envFile)) {
  loadEnv({ path: envFile });
} else if (testEnvironment === 'local' && existsSync('env/.env')) {
  loadEnv({ path: 'env/.env' });
}

const isCI = Boolean(process.env.CI);
const hasLoginCredentials = Boolean(process.env.LOGIN_USERNAME && process.env.LOGIN_PASSWORD);
const authStatePath = resolve(process.cwd(), '.auth/user.json');
const baseURL =
  process.env.BASE_URL ?? (testEnvironment === 'local' ? 'http://127.0.0.1:9899' : undefined);

if (!baseURL) {
  throw new Error(
    `BASE_URL is required for the "${testEnvironment}" environment. Set it in ${envFile} or in the process environment.`,
  );
}

const hostname = new URL(baseURL).hostname.toLowerCase();
const startsLocalApp =
  ['local', 'test'].includes(testEnvironment) &&
  ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  webServer: startsLocalApp
    ? {
      command: 'npm --prefix app start',
      url: baseURL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    }
    : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['./scripts/cumulative-reporter.mjs'],
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      slowMo: 500,
    },
  },
  projects: [
    ...(hasLoginCredentials
      ? [
        {
          name: 'setup',
          testMatch: '**/ui/auth.setup.ts',
        },
      ]
      : []),
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      fullyParallel: false,
    },
    {
      name: 'chromium',
      testMatch: '**/ui/**/*.spec.ts',
      ...(hasLoginCredentials ? { dependencies: ['setup'] } : {}),
      use: {
        ...devices['Desktop Chrome'],
        ...(hasLoginCredentials ? { storageState: authStatePath } : {}),
      },
    },
  ],
  outputDir: 'test-results',
});

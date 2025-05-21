import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ['line'],
    ["html", { outputFolder: "my-report" }],
  ],
  use: {
    colorScheme: "dark",
    locale: "en-IN",
    timezoneId: "Asia/Calcutta",
    screenshot: "only-on-failure",
    trace: 'on-first-retry',
    video: "on",
  },

  /* Configure projects for major browsers */
  projects: [
    /**
     * global setup for sauce demo
     */
    {
      name: "sauce_demo_setup",
      testMatch: /sauce_demo_global.setup.ts/,
      use: {
        baseURL: "https://www.saucedemo.com",
      },
    },
    {
      name: "sauce_demo",
      testDir: "./tests/ui-test/",
      use: {
        ...devices["Desktop Firefox"],
        baseURL: "https://www.saucedemo.com",
      },
      dependencies: ["sauce_demo_setup"],
      testIgnore: [
        "/tests/ui-test/tutorials/*.spec.ts",
        "/tests/ui-test/tests-examples/*.spec.ts",
        "./tests/ui-test/readinfFilesTest.spec.ts",
      ],
    },
    {
      name: "api_demo",
      testDir: "./tests/api-test/",
      use: {
        ...devices["Desktop Firefox"],
        baseURL: "https://api.thecatapi.com/v1",
      },
    },
  ]
});

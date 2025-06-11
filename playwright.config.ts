import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30*1000,
  expect: {
    timeout: 5000,
  },
  globalTimeout: 60 * 60 * 1000, // 1 hour
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
    {
      name: "demo",
      testDir: "./tests/",
    },
    {
      name: "ui_demo",
      testDir: "./tests/ui-tests/",
    },
    {
      name: "api_demo",
      testDir: "./tests/api-tests/"
    },
  ]
});

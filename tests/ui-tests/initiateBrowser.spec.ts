import { BrowserContext } from "@playwright/test";
import { test, Page, Browser } from "@playwright/test";

export let context: BrowserContext;

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/");
});

test.afterAll(async () => {
  await context.close();
});

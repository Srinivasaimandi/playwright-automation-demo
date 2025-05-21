import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("accessibility test", async function () {
  test.describe.configure({ mode: "parallel" });
  test(
    "scannning an entire page",
    {
      tag: "@accessibility",
      annotation: {
        type: "test",
        description: "accessibility test covering the entire page",
      },
    },
    async function ({ page }) {
      await page.goto("https://dequeuniversity.com/demo/");
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      await expect(accessibilityScanResults.violations).toEqual([]);
    }
  );

  test(
    "scannning a specific part of a page",
    {
      tag: "@accessibility",
      annotation: {
        type: "test",
        description: "accessibility test covering a specific part of page",
      },
    },
    async function ({ page }) {
      await page.goto("https://dequeuniversity.com/demo/");
      await page.locator("#menu-item-21099").click();
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include("#menu-item-21099")
        .analyze();
      await expect(accessibilityScanResults.violations).toEqual([]);
    }
  );

  test(
    "",
    {
      tag: "@accessibility",
      annotation: {
        type: "test",
        description: "an accessibility test checking for wcag violations",
      },
    },
    async function ({ page }) {
      await page.goto("https://dequeuniversity.com/demo/");
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      await expect(accessibilityScanResults.violations).toEqual([]);
    }
  );
});

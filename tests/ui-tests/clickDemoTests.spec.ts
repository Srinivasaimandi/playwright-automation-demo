import { test, Page, expect } from "@playwright/test";

/**
 * @author: srinivasaimandi
 */

let page: Page;

test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
})

test.afterAll(async () => {
    await page.close();
})

test("test simple form", {
    tag: ["@demo", "@clickDemo"],
    annotation: {
        type: "test",
        description: "Click Demo",
    }
}, async function ({ browser }) {

    const testMessage: string = "";

    await page.goto("https://www.lambdatest.com/selenium-playground/simple-form-demo");
    await page.waitForTimeout(5000);
    await page.locator("input#user-message").fill(testMessage);
    await page.locator("#showInput").click();
    await page.waitForTimeout(5000);
    let textFromPage = await page.locator("#message").textContent();
    expect(textFromPage).toBe(testMessage);
})
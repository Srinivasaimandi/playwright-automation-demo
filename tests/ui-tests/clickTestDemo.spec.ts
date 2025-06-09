import { BrowserContext, expect, Page, test } from "@playwright/test";

/**
 * @author: srinivasaimandi
 * @description: Click test demo for UI tests
 * @note: This test is a demo for click actions in UI tests.
 * It includes various click actions on different elements and validates the results.
 * It is not intended to be run as a standalone test, but rather as a reference for click actions in UI tests.
 */

let page: Page;
let context: BrowserContext;

test.beforeAll(async function ({ browser }) {
    context = await browser.newContext();
    page = await context.newPage();
});

test.afterAll(async function () {
    // Reset the page after each test
    await context.close();
});

test("simple form test", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "click test on a simple demo form",
    }
}, async function () {
    let sample_message: string = "Hello, LambdaTest!";
    await page.goto("https://www.lambdatest.com/selenium-playground/simple-form-demo");
    await page.waitForURL("**/simple-form-demo");
    await page.locator("#user-message").first().fill(sample_message);
    await page.locator("#showInput").click();
    const message = await page.locator("#message").first().textContent();
    await expect(message).toBe(sample_message);
})

test("checkbox demo test", {
    tag: "@actions-test @reg",
    annotation: {
        type: "test",
        description: "click test on a checkbox",
    }
}, async function () {
    await page.goto("https://www.lambdatest.com/selenium-playground/checkbox-demo");
    await page.waitForURL("**/checkbox-demo");
    let chkbox = page.locator("xpath=.//h2[text()='Single Checkbox Demo']/following-sibling::label/input");
    await chkbox.check();
    await expect(chkbox).toBeChecked();
    const message = await page.locator("xpath=.//h2[text()='Single Checkbox Demo']/following-sibling::p").textContent();
    await expect(message).toBe("Checked!");
}
)
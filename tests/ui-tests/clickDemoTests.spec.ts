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

test("simple form demo", {
    tag: ["@demo", "@clickDemo"],
    annotation: {
        type: "test",
        description: "Click Demo",
    }
}, async function () {

    const testMessage: string = "this is a test message";

    await page.goto("https://www.lambdatest.com/selenium-playground/simple-form-demo");
    await page.waitForTimeout(5000);
    await page.locator("input#user-message").fill(testMessage);
    await page.locator("#showInput").click();
    await page.waitForTimeout(5000);
    let textFromPage = await page.locator("#message").textContent();
    await expect(textFromPage).toBe(testMessage);
})

test("checkbox demo", {
    tag: ["@demo", "@clickDemo"],
    annotation: {
        type: "test",
        description: "Checkbox Demo",
    }
}, async function () {

    await page.goto("https://www.lambdatest.com/selenium-playground/checkbox-demo");
    await page.waitForTimeout(5000);
    await page.locator("#isAgeSelected").check();
    await page.waitForTimeout(5000);
    await expect(await page.locator("#isAgeSelected").isChecked()).toBeTruthy();
    let textFromPage = await page.locator("#txtAge").textContent();
    await expect(textFromPage).toBe("Checked");
})

test("radio button demo", {
    tag: ["@demo", "@clickDemo"],
    annotation: {
        type: "test",
        description: "Radio Button Demo",
    }
}, async function () {

    await page.goto("https://www.lambdatest.com/selenium-playground/radiobutton-demo");
    await page.waitForTimeout(5000);
    await page.locator("input[name=optradio]").first().check();
    await page.locator("#buttoncheck").click();
    await page.waitForTimeout(5000);
    let textFromPage = await page.locator(".radiobutton").textContent();
    await expect(textFromPage).toBe("Radio button 'Male' is checked");
})

test("double click demo", {
    tag: ["@demo", "@doubleClickDemo"],
    annotation: {
        type: "test",
        description: "Double Click Demo",
    }
}, async function () {

    await page.goto("https://www.lambdatest.com/selenium-playground/checkbox-demo");
    await page.waitForTimeout(5000);
    await page.locator("#isAgeSelected").dblclick();
    await page.waitForTimeout(5000);
    await expect(await page.locator("#isAgeSelected").isChecked()).toBeFalsy();
})
import { test, expect, Page } from "@playwright/test";
import * as CONSTANTS from "@pageobjects/Constants";
import { after } from "node:test";

/**
 * @author: srinivasaimandi
 */

let page: Page;

test.beforeAll(async function ({ browser }) {
    page = await browser.newPage();
    await page.goto("http://localhost:9899")
});

test.afterAll(async function () {
    await page.close();
});

test("users-app smoke test", {
    tag: "@smokeTest @reg",
    annotation: {
        type: "test",
        description: "This is a smoke test for users-app"
    },
}, async function () {
    await page.waitForTimeout(5000);

})
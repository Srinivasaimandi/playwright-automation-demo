import { test, Page } from "@playwright/test";

/**
 * @author: srinivasaimandi
 */

test("add remove elements", {
    tag: ["@demo", "@addRemoveElements"],
    annotation: {
        type: "test",
        description: "Add/Remove Elements",
    }
}, async function ({ browser }) {
    let page: Page = await browser.newPage();
    await page.goto("https://the-internet.herokuapp.com/add_remove_elements/");
    await page.waitForTimeout(5000);
    await page.locator("//button[text()='Add Element']").click();
    await page.waitForTimeout(5000);
    await page.locator("//button[text()='Delete']").click();
    await page.waitForTimeout(5000);
    await page.close();
});
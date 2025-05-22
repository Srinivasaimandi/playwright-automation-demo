import { test, Page } from "@playwright/test";

/**
 * @author: srinivasaimandi
 */

test("basic auth", {
    tag: ["@demo", "@basicAuth"],
    annotation: {
        type: "test",
        description: "Basic Auth",
    }
}, async function ({ browser }) {
    let page: Page = await browser.newPage();
    await page.goto("https://the-internet.herokuapp.com/basic_auth");
    await page.waitForTimeout(5000);
    await page.close();
}
);

test("basic auth with credentials", {
    tag: ["@demo", "@basicAuth"],
    annotation: {
        type: "test",       
        description: "Basic Auth with credentials",
    }
}, async function ({ browser }) {       
    let context = await browser.newContext({
        httpCredentials: {
            username: "admin",
            password: "admin",
        },
    });
    let page: Page = await context.newPage();
    await page.goto("https://the-internet.herokuapp.com/basic_auth", {  
        waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(5000);
    await page.close();
}
);
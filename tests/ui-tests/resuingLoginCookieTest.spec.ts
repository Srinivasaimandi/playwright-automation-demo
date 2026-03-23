import test, { Page } from "@playwright/test";

test.describe("resuing login cookie suite", async function () {

    test.describe.configure({ mode: "serial" });

    test("fetching the login cookie", async function ({ browser }) {
        let page = await browser.newPage();
        await page.goto("http://localhost:9899");
        await page.waitForTimeout(4000);
        await page.locator("#username").fill("admin");
        await page.locator("#password").fill("admin");
        await page.locator(".w-100").click();
        await page.waitForTimeout(10000);
        await page.context().storageState({ path: 'storageState.json' });
    })

    test("reusing login cookie test",
        {
            tag: "@users-app @reg",
            annotation: {
                type: "test",
                description: "reusing login cookie for accessing the website without credentials"
            }
        },
        async function ({ browser }) {
            const context = await browser.newContext({ storageState: 'storageState.json' });
            let page = await context.newPage();
            await page.goto("http://localhost:9899/usersPage.html");
            await page.waitForTimeout(10000);
        })
})
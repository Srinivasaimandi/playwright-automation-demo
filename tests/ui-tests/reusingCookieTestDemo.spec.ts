import { EcommercePlaygroundPage } from "@pageobjects/lambda_test/EcommercePlayground.pageobject";
import { test } from "@playwright/test";

const UI_LOAD_TIMEOUT = 5000;

test.describe("cookie usage test", async function () {
    test.describe.configure({ mode: "serial" });

    let ecommercePage;
    let loginCookie = {
        name: "",
        value: "",
        domain: "",
        path: ""
    }

    test("obtaining cookie",
        {
            tag: "@actions-test @reg",
            annotation: {
                type: "test",
                description: "obtaining cookie from the initial login page"
            },
        },
        async function ({ browser }) {
            const context = await browser.newContext();
            const page = await context.newPage();
            ecommercePage = new EcommercePlaygroundPage(page);
            await ecommercePage.load()
            await page.waitForTimeout(UI_LOAD_TIMEOUT);
            await ecommercePage.lblMyAccount.last().hover();
            await ecommercePage.lblLogin.click();
            await ecommercePage.iptEmail.fill("CelestineDare@gmail.com");
            await ecommercePage.iptPassword.fill("$test123$");
            await ecommercePage.btnSubmit.click();
            let cookies = await context.cookies();
            cookies.forEach(cookie => {
                if (cookie.name === "OCSESSID") {
                    loginCookie.name = cookie.name;
                    loginCookie.value = cookie.value;
                    loginCookie.domain = cookie.domain;
                    loginCookie.path = cookie.path;
                }
            });
            await page.waitForTimeout(UI_LOAD_TIMEOUT);
        });

    test("re-using cookie",
        {
            tag: "@actions-test @reg",
            annotation: {
                type: "test",
                description: "reusing cookie to login again"
            },
        },
        async function ({ browser }) {
            const context = await browser.newContext();
            await context.addCookies([{ ...loginCookie }]);
            const page = await context.newPage();
            ecommercePage = new EcommercePlaygroundPage(page);
            await ecommercePage.load();
            await page.waitForTimeout(UI_LOAD_TIMEOUT);
            await ecommercePage.lblMyAccount.last().hover();
            await ecommercePage.lblDashboard.click();
            await page.waitForTimeout(UI_LOAD_TIMEOUT);

        });
});

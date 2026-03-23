import { test, expect, Page } from "@playwright/test";
import * as CONSTANTS from "@pageobjects/Constants";
import { UsersHomePage } from "@pageobjects/users_app/UsersHomePage.pageobject";

/**
 * @author: srinivasaimandi
 */

let page: Page;
let usersHomePage: UsersHomePage;

test.beforeAll(async function ({ browser }) {
    page = await browser.newPage();
    usersHomePage = new UsersHomePage(page);

    await page.goto(CONSTANTS.USERS_API.BASE_URL);
    await page.waitForTimeout(5000);
});

test("validate the homepage details",
    {
        tag: "@users-app @reg",
        annotation: {
            type: "test",
            description: "validate the homepage details of users app",
        }
    },
    async function () {

        await expect(usersHomePage.hlUI).toBeVisible();
        await expect(usersHomePage.hlSwaggerDocs).toBeVisible();
        await expect(usersHomePage.hlGraphQl).toBeVisible();
    });
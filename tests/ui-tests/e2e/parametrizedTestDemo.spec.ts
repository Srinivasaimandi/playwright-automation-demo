import { test, expect } from "@playwright/test";
import { LoginPage } from "@pageobjects/sauce_demo/LoginPage.pageobject";
import { InventoryPage } from "@pageobjects/sauce_demo/InventoryPage.pageobject";
import * as Constants from "@pageobjects/Constants";
import { faker } from "@faker-js/faker";

/**
 * @author: srinivasaimandi
 */

let loginPage: LoginPage;
let inventoryPage: InventoryPage;

// beforeEach
test.beforeEach(
    "setting up browser context & launch sauce demo site",
    async function ({ page }) {
        loginPage = new LoginPage(page);
        inventoryPage = new InventoryPage(page);
        loginPage.load();
    }
);

// afterEach
test.afterEach("sleep for default timeout", async function ({ page }) {
    await page.waitForTimeout(Constants.TIMEOUT);
});

let invalidScenarios: any = {
    empty_username: ["", "", "Epic sadface: Username is required"],
    empty_password: [
        faker.string.alpha(5),
        "",
        "Epic sadface: Password is required",
    ],
    invalid_credentials: [
        faker.string.alpha(5),
        faker.string.alphanumeric(5),
        "Epic sadface: Username and password do not match any user in this service",
    ],
};

test.describe("negative scenarios", async function () {
    // parameterized test: using json data from an object
    Array.from(Object.keys(invalidScenarios)).forEach((scenario) => {
        test(
            `test with ${scenario}`,
            { tag: "@login @negative" },
            async function ({ page }) {
                let username = invalidScenarios[`${scenario}`][0];
                let password = invalidScenarios[`${scenario}`][1];
                let message = invalidScenarios[`${scenario}`][2];
                await loginPage.login(username, password);
                let errorMessage = await page
                    .locator(".error-message-container")
                    .textContent();
                await expect(errorMessage).toEqual(message);
            }
        );
    });

    // parameterized test: using json data from a file
    Array.from(Object.values(Constants.web_ui_automation.sauce_labs.users)).forEach((username) => {
        test(
            `login test with username: '${username}'`,
            { tag: "@login @positive_case @reg" },
            async function () {
                await loginPage.login(username, Constants.web_ui_automation.sauce_labs.password);
                await inventoryPage.validateHeading(username);
            }
        );
    });
});

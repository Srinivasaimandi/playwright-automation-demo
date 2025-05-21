import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pageobjects/LoginPage.pageobject";
import { InventoryPage } from "../../pageobjects/InventoryPage.pageobject";
import * as Constants from "../../pageobjects/Constants";
import { faker } from "@faker-js/faker";

/**
 * @author: srinivasaimandi
 */

let loginPage: LoginPage;
let inventoryPage: InventoryPage;

// test.beforeAll("initiate pageobjects", async function () {
//   // PENDING ITEM: needs to create a browser context or call from another class
// });

// beforeEach
test.beforeEach(
  "setting up browser context & launch sauce demo site",
  async function ({ page }) {
    // comment below line once the beforeAll is completed
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    loginPage.load();
  }
);

// afterEach
test.afterEach("sleep for default timeout", async function ({ page }) {
  await page.waitForTimeout(Constants.TIMEOUT);
});

// normal test with all details
test(
  "validate title",
  {
    tag: "@smoke @positive_case @reg",
    annotation: {
      type: "validation",
      description: "valdiate the title of the home page",
    },
  },
  async function ({ page }) {
    await expect(page).toHaveTitle(Constants.web_ui_automation.sauce_labs.title);
  }
);

// failure case, added to test retires in config
test.fail(
  "validate title: failure scenario",
  {
    tag: "@smoke @negative_case @reg",
    annotation: {
      type: "negative case",
      description:
        "validate the title of the home page with a wrong title name",
    },
  },
  async function ({ page }) {
    await expect(page).toHaveTitle("incorrect title");
  }
);

let invalidScenarios = {
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

  // parameterized test
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

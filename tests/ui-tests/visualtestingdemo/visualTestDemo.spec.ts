import { expect, Page, test } from "@playwright/test";
import { LoginPage } from "../../../pageobjects/LoginPage.pageobject";
import { InventoryPage } from "../../../pageobjects/InventoryPage.pageobject";
import * as Constants from "../../../pageobjects/Constants";

let page: Page;
let loginPage: LoginPage;
let inventoryPage: InventoryPage;

test.beforeAll(async function ({ browser }) {
  const context = await browser.newContext();
  page = await context.newPage();
  loginPage = new LoginPage(page);
  inventoryPage = new InventoryPage(page);
});

test(
  "test 1",
  {
    tag: "@visual-test @reg @page-level-test",
    annotation: { type: "test", description: "full page level test" },
  },
  async function () {
    await loginPage.load();
    await expect(page).toHaveScreenshot({
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  }
);

test(
  "test 2",
  {
    tag: "@visual-test @reg @component-level-test",
    annotation: { type: "test", description: "component level test" },
  },
  async function () {
    await loginPage.load();
    await loginPage.login(
      Constants.web_ui_automation.sauce_labs.users["standard user"],
      Constants.web_ui_automation.sauce_labs.password
    );
    await inventoryPage.icoHamburger.click();
    await expect(page.locator(".bm-menu")).toHaveScreenshot({
      maxDiffPixelRatio: 0.01,
    });
  }
);

test(
  "test 3",
  {
    tag: "@visual-test @reg @masking",
    annotation: {
      type: "test",
      description:
        "masking elements which can change, when app state is not reset",
    },
  },
  async function () {
    await loginPage.load();
    await loginPage.login(
      Constants.web_ui_automation.sauce_labs.users["standard user"],
      Constants.web_ui_automation.sauce_labs.password
    );
    await (await inventoryPage.btnAddToCart("Sauce Labs Backpack")).click();
    await (await inventoryPage.btnAddToCart("Sauce Labs Bolt T-Shirt")).click();
    await expect(page).toHaveScreenshot("inventory_masked.png", {
      fullPage: true,
      mask: [page.locator(".btn_inventory"), inventoryPage.icoShoppingCart],
      maxDiffPixelRatio: 0.01,
      maxDiffPixels: 10,
    });
  }
);

test(
  "test 4",
  {
    tag: "@visual-test @reg @masking",
    annotation: {
      type: "test",
      description:
        "validating the masked image with the current screenshot after resetting the app state",
    },
  },
  async function () {
    await loginPage.load();
    await loginPage.login(
      Constants.web_ui_automation.sauce_labs.users["standard user"],
      Constants.web_ui_automation.sauce_labs.password
    );

    await loginPage.icoHamburger.click();
    await loginPage.hlResetAppState.click();
    await loginPage.icoCloseHamburgerMenu.click();

    await expect(page).toHaveScreenshot("inventory_masked.png", {
      fullPage: true,
      mask: [page.locator(".btn_inventory"), inventoryPage.icoShoppingCart],
      maxDiffPixelRatio: 0.01,
      maxDiffPixels: 10,
    });
  }
);

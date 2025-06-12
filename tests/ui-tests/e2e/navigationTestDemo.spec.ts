import { test, expect, Page } from "@playwright/test";
import { LoginPage } from "@pageobjects/sauce_demo/LoginPage.pageobject";
import { InventoryPage } from "@pageobjects/sauce_demo/InventoryPage.pageobject";
import * as CONSTANTS from "@pageobjects/Constants";

/**
 * @author: srinivasaimandi
 */

let page: Page;
let loginPage: LoginPage;
let inventoryPage: InventoryPage;
let allItemUrl = "https://www.saucedemo.com/inventory.html";

test.beforeAll(async function ({ browser }) {
  page = await browser.newPage();
  loginPage = new LoginPage(page);
  inventoryPage = new InventoryPage(page);

  loginPage.load();
  loginPage.login(CONSTANTS.SAUCE_LABS.USERS["standard user"], CONSTANTS.SAUCE_LABS.PASSWORD);
});

test.afterAll(async function () {
  await inventoryPage.icoHamburger.click();
  await inventoryPage.hlResetAppState.click();
  await page.close();
});

test(
  "productItem page to All Items test",
  { tag: "@navigation" },
  async function () {
    await (await inventoryPage.fetchProductName("Sauce Labs Backpack")).click();
    await page.waitForTimeout(5000);
    await page.waitForURL("https://www.saucedemo.com/inventory-item.html?id=4");
    await expect(page).toHaveURL(
      "https://www.saucedemo.com/inventory-item.html?id=4"
    );
    await inventoryPage.icoHamburger.click();
    await inventoryPage.hlAllItems.click();
    await expect(page).toHaveURL(allItemUrl);
  }
);

test("cart page to All Items test", { tag: "@navigation" }, async function () {
  await (await inventoryPage.btnAddToCart("Sauce Labs Backpack")).click();
  await inventoryPage.icoShoppingCart.click();
  await expect(page).toHaveURL("https://www.saucedemo.com/cart.html");
  await inventoryPage.icoHamburger.click();
  await inventoryPage.hlAllItems.click();
  await expect(page).toHaveURL(allItemUrl);
});
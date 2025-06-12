import { test, expect, Page } from "@playwright/test";
import { LoginPage } from "@pageobjects/sauce_demo/LoginPage.pageobject";
import { InventoryPage } from "@pageobjects/sauce_demo/InventoryPage.pageobject";
import { InventoryItemPage } from "@pageobjects/sauce_demo/InventoryItemPage.pageobject";
import * as CONSTANTS from "@pageobjects/Constants";

/**
 * @author: srinivasaimandi
 */

let page: Page;
let loginPage: LoginPage;
let inventoryPage: InventoryPage;
let inventoryItemPage: InventoryItemPage;

let products = [
  "Sauce Labs Backpack",
  "Sauce Labs Fleece Jacket",
  "Sauce Labs Onesie",
];

test.beforeAll(async function ({ browser }) {
  page = await browser.newPage();
  loginPage = new LoginPage(page);
  inventoryPage = new InventoryPage(page);
  inventoryItemPage = new InventoryItemPage(page);

  // logging into the application
  await loginPage.load();
  await loginPage.login(CONSTANTS.SAUCE_LABS.USERS["standard user"], CONSTANTS.SAUCE_LABS.PASSWORD);
});

test.afterAll(async function () {
  await page.close();
});

test.afterEach(async function () {
  await page.waitForTimeout(2000);
  await inventoryItemPage.btnBackToProducts.click();
});

products.forEach((productName) => {
  test(
    `verify product details from inventoryPage on inventoryItemPage for product: ${productName}`,
    { tag: "@product" },
    async function () {
      let desc = await (
        await inventoryPage.fetchProductDescription(productName)
      ).textContent();
      let price = await (
        await inventoryPage.fetchProductPrice(productName)
      ).textContent();
      await (await inventoryPage.fetchProductName(productName)).click();

      let productDesc =
        await inventoryItemPage.productItemDescription.textContent();
      let productPrice = await inventoryItemPage.productItemPrice.textContent();

      await expect(desc).toEqual(productDesc);
      await expect(price).toEqual(productPrice);
    }
  );
});
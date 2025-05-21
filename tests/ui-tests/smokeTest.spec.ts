import { Page, test } from "@playwright/test";
import { LoginPage } from "../../pageobjects/LoginPage.pageobject";
import { InventoryPage } from "../../pageobjects/InventoryPage.pageobject";
import { CartPage } from "../../pageobjects/CartPage.pageobject";
import { CheckoutPage } from "../../pageobjects/CheckoutPage.pageobject";
import * as Constants from "../../pageobjects/Constants";

/**
 * @author: srinivasaimandi
 */

let page: Page;
let loginPage: LoginPage;
let inventoryPage: InventoryPage;
let cartPage: CartPage;
let checkoutPage: CheckoutPage;

test.beforeAll(async function ({ browser }) {
  page = await browser.newPage();
  loginPage = new LoginPage(page);
  inventoryPage = new InventoryPage(page);
  cartPage = new CartPage(page);
  checkoutPage = new CheckoutPage(page);
});

// afterEach
test.afterAll("sleep for default timeout", async function () {
  // reset app state
  await loginPage.icoHamburger.click();
  await loginPage.hlResetAppState.click();
  await loginPage.hlLogout.click();
  await page.waitForTimeout(Constants.TIMEOUT);
  await page.close();
});

test(
  "smoke test to navigate to all screens of the application",
  {
    tag: "@smoke",
  },
  async function () {
    // req. constants
    let username = Constants.web_ui_automation.sauce_labs.users["standard user"];
    let password = Constants.web_ui_automation.sauce_labs.password;

    await loginPage.load();
    // getByPlaceholder, getByRole are inclusive of this function
    await loginPage.login(username, password);

    // perform smoke test
    await inventoryPage.validateHeading(username);
    await (await inventoryPage.btnAddToCart("sauce labs backpack")).click();
    await (await inventoryPage.btnAddToCart("Sauce Labs bike Light")).click();
    await (
      await inventoryPage.btnAddToCart("Sauce labs Fleece jacket")
    ).click();
    await page.waitForTimeout(2000);
    await cartPage.icoShoppingCart.click();

    await cartPage.setProductName("sauce labs backpack");
    await (await cartPage.btnCartItemRemove()).click();

    await cartPage.setProductName("sauce labs bike light");
    await (await cartPage.btnCartItemRemove()).click();

    await cartPage.btnCheckout.click();

    await checkoutPage.fillCheckoutInformationUsingFaker();
    await checkoutPage.btnContinue.click();
    await checkoutPage.btnFinish.click();

    await page.waitForTimeout(Constants.TIMEOUT);
  }
);

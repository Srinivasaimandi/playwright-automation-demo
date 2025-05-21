/**
 * @author: srinivasaimandi
 * @description: contains the common locators and constants
 */

import { Page, Locator } from "@playwright/test";

export class BasePage {
  page: Page;
  heading: Locator;
  icoShoppingCart: Locator;
  icoHamburger: Locator;
  hlAllItems: Locator;
  hlAbout: Locator;
  hlLogout: Locator;
  hlResetAppState: Locator;
  icoCloseHamburgerMenu: Locator;
  btnContinueShopping: Locator;
  btnCheckout: Locator;
  btnCancel: Locator;
  btnContinue: Locator;
  btnFinish: Locator;
  btnRemove: Locator;
  btnBackToProducts: Locator;

  constructor(page: Page) {
    this.page = page;
    // page label
    this.heading = page.locator("div .header_secondary_container > span");
    // cart icon
    this.icoShoppingCart = page.locator("#shopping_cart_container");

    // hamburger navigation items
    this.icoHamburger = page.locator("div .bm-burger-button > button");
    this.hlAllItems = page.locator("#inventory_sidebar_link");
    this.hlAbout = page.locator("#about_sidebar_link");
    this.hlLogout = page.locator("#logout_sidebar_link");
    this.hlResetAppState = page.locator("#reset_sidebar_link");
    this.icoCloseHamburgerMenu = page.locator("#react-burger-cross-btn");

    // form items
    this.btnContinueShopping = page.locator("#continue-shopping");
    this.btnCheckout = page.locator("#checkout");
    this.btnCancel = page.locator("#cancel");
    this.btnContinue = page.locator("#continue");
    this.btnFinish = page.locator("#finish");
    this.btnRemove = page.getByRole("button", { name: "Remove" });
    this.btnBackToProducts = page.locator("#back-to-products");
  }
}

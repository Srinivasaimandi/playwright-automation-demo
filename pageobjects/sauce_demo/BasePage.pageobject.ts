import { Page, Locator } from "@playwright/test";
import * as basePageLocStrings from "@locators/sauce_demo/BasePage.locStrings.json";
import { LocatorBuilder } from "@utils/LocatorBuilder";

/**
 * @author: srinivasaimandi
 * @description: contains the common locators and constants
 */

export class BasePage {
  page: Page;
  heading!: Locator;
  icoShoppingCart!: Locator;
  icoHamburger!: Locator;
  hlAllItems!: Locator;
  hlAbout!: Locator;
  hlLogout!: Locator;
  hlResetAppState!: Locator;
  icoCloseHamburgerMenu!: Locator;
  btnContinueShopping!: Locator;
  btnCheckout!: Locator;
  btnCancel!: Locator;
  btnContinue!: Locator;
  btnFinish!: Locator;
  btnRemove!: Locator;
  btnBackToProducts!: Locator;

  constructor(page: Page) {
    this.page = page;

    Object.keys(basePageLocStrings).forEach(key => {
      // console.log(loginPageLocString.locStrings);
      const locatorConfig = basePageLocStrings[key as keyof typeof basePageLocStrings];
      const locator: Locator = new LocatorBuilder(page).buildElementWithAlternates(locatorConfig);
      // console.log(`Assigning locator for key: ${key}`, locator);
      (this as any)[key] = locator;
    })
  }
}

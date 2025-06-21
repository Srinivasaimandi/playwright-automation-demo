import { Locator, Page } from "@playwright/test";
import { BasePage } from "@pageobjects/sauce_demo/BasePage.pageobject";

import * as inventoryItemPageLocStrings from "@locators/sauce_demo/InventoryItemPage.locStrings.json";

import { LocatorBuilder } from "@utils/LocatorBuilder";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of the inventory item page
 */
export class InventoryItemPage extends BasePage {
  productItemNam!: Locator;
  productItemDescription!: Locator;
  productItemPrice!: Locator;

  constructor(page: Page) {
    super(page);

    Object.keys(inventoryItemPageLocStrings).forEach(key => {
      // console.log(loginPageLocString.locStrings);
      const locatorConfig = inventoryItemPageLocStrings[key as keyof typeof inventoryItemPageLocStrings];
      const locator: Locator = new LocatorBuilder(page).buildElement(locatorConfig);
      // console.log(`Assigning locator for key: ${key}`, locator);
      (this as any)[key] = locator;
    })
  }
}

import { Locator, Page } from "@playwright/test";
import { BasePage } from "@pageobjects/sauce_demo/BasePage.pageobject";
import * as inventoryItemPageLocString from "@locators/sauce_demo/InventoryItemPage.locStrings";
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

    Object.keys(inventoryItemPageLocString.locStrings).forEach(key => {
          // console.log(loginPageLocString.locStrings);
          const locatorConfig = inventoryItemPageLocString.locStrings[key as keyof typeof inventoryItemPageLocString.locStrings];
          const locator: Locator = new LocatorBuilder(page).buildElement(locatorConfig);
          // console.log(`Assigning locator for key: ${key}`, locator);
          (this as any)[key] = locator;
        })
  }
}

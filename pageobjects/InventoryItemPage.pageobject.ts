import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage.pageobject";
import * as Constants from "./Constants";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of the inventory item page
 */
export class InventoryItemPage extends BasePage {
  productItemName: Locator;
  productItemDescription: Locator;
  productItemPrice: Locator;

  constructor(page: Page) {
    super(page);
    this.productItemName = page.locator(
      "div.inventory_details_desc_container> div.inventory_details_name"
    );
    this.productItemDescription = page.locator(
      "div.inventory_details_desc_container> div.inventory_details_desc"
    );
    this.productItemPrice = page.locator(
      "div.inventory_details_desc_container> div.inventory_details_price"
    );
  }
}

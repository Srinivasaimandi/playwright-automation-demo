import { expect, Page, Locator } from "@playwright/test";
import { BasePage } from "@pageobjects/sauce_demo/BasePage.pageobject";

import * as CONSTANTS from "@pageobjects/Constants";
import * as inventoryPageLocStrings from "@locators/sauce_demo/InventoryPage.locStrings.json";

import { LocatorBuilder } from "@utils/LocatorBuilder";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of the inventory page
 */
export class InventoryPage extends BasePage {
  productItem!: Locator;
  productDescription!: Locator;
  productPrice!: Locator;

  constructor(page: Page) {
    super(page);
    Object.keys(inventoryPageLocStrings).forEach(key => {
      // console.log(loginPageLocString.locStrings);
      const locatorConfig = inventoryPageLocStrings[key as keyof typeof inventoryPageLocStrings];
      const locator: Locator = new LocatorBuilder(page).buildElementWithAlternates(locatorConfig);
      // console.log(`Assigning locator for key: ${key}`, locator);
      (this as any)[key] = locator;
    })
  }

  /**
   * @param username string
   * @description: validate the heading based on the username provided
   */
  async validateHeading(username: string): Promise<void> {
    if (username === "locked_out_user") {
      await expect(this.page).toHaveTitle(CONSTANTS.SAUCE_LABS.TITLE);
    } else {
      const heading = await this.heading.textContent();
      await expect(heading).toEqual(CONSTANTS.SAUCE_LABS.HEADING.PRODUCTS);
    }
  }
  /**
   *
   * @param productName string
   * @returns retuns the product item based on product name
   */
  async fetchProductItem(productName: string): Promise<Locator> {
    let updatedProductName: string[] = [];
    productName.split(" ").forEach((item) => {
      updatedProductName.push(item.charAt(0).toUpperCase() + item.substring(1));
    });
    return await this.productItem.filter({
      hasText: updatedProductName.join(" "),
    });
  }

  async fetchProductName(productName: string): Promise<Locator> {
    return await (
      await this.fetchProductItem(productName)
    ).locator("div.inventory_item_name");
  }
  /**
   *
   * @param productName string
   * @returns locator for description of product
   */
  async fetchProductDescription(productName: string): Promise<Locator> {
    this.productDescription = await (
      await this.fetchProductItem(productName)
    ).locator(inventoryPageLocStrings.productDescription.locator);
    return this.productDescription;
  }
  /**
   *
   * @param productName string
   * @returns locator for addToCart button for a specific product
   */
  async btnAddToCart(productName: string): Promise<Locator> {
    return await (
      await this.fetchProductItem(productName)
    ).getByRole("button", {
      name: "Add to cart",
    });
  }
  /**
   *
   * @param productName string
   * @returns locator for remove button for a specific product
   */
  async btnProductItemRemove(productName: string): Promise<Locator> {
    return await (
      await this.fetchProductItem(productName)
    ).getByRole("button", { name: "Remove" });
  }

  /**
   *
   * @param productName string
   * @returns locator for price of a product
   */
  async fetchProductPrice(productName: string): Promise<Locator> {
    this.productPrice = await (
      await this.fetchProductItem(productName)
    ).locator(".inventory_item_price");
    return this.productPrice;
  }
}

import { Page, Locator } from "@playwright/test";
import { BasePage } from "@pageobjects/sauce_demo/BasePage.pageobject";
import * as cartPageLocStrings from "@locators/sauce_demo/CartPage.locStrings.json";
import { LocatorBuilder } from "@utils/LocatorBuilder";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of cart page
 */
export class CartPage extends BasePage {
  cartItem!: Locator;
  cartItemDesc!: Locator
  cartItemPrice!: Locator;
  productName!: string;

  constructor(page: Page) {
    super(page);

    Object.keys(cartPageLocStrings).forEach(key => {
      // console.log(loginPageLocString.locStrings);
      const locatorConfig = cartPageLocStrings[key as keyof typeof cartPageLocStrings];
      const locator: Locator = new LocatorBuilder(page).buildElementWithAlternates(locatorConfig);
      // console.log(`Assigning locator for key: ${key}`, locator);
      (this as any)[key] = locator;
    })
  }

  setProductName(productName: string) {
    this.productName = productName;
    return this;
  }

  /**
   *
   * @param productName string
   * @returns retuns the cart item based on product name
   */
  async fetchCartItem(productName: string): Promise<Locator> {
    let updatedProductName: string[] = [];
    productName.split(" ").forEach((item) => {
      updatedProductName.push(item.charAt(0).toUpperCase() + item.substring(1));
    });
    return await this.cartItem.filter({
      hasText: updatedProductName.join(" "),
    });
  }
  /**
   *
   * @param productName string
   * @returns locator for description of product in cart
   */
  async fetchCartItemDescription(productName: string): Promise<Locator> {
    return await (
      await this.fetchCartItem(productName)
    ).locator(cartPageLocStrings.cartItemDesc.locator);
    // ).locator(".inventory_item_desc");
  }
  /**
   *
   * @param productName string
   * @returns locator for remove button for a specific product in cart
   */
  async btnCartItemRemove(): Promise<Locator> {
    return await (
      await this.fetchCartItem(this.productName)
    ).getByRole("button", { name: "Remove" });
  }
  /**
   *
   * @param productName string
   * @returns locator for price of a product in cart
   */
  async fetchCartItemPrice(productName: string): Promise<Locator> {
    return await (
      await this.fetchCartItem(productName)
    ).locator(cartPageLocStrings.cartItemPrice.locator);
  }
}

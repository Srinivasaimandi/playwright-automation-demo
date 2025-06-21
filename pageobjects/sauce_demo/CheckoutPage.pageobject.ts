import { Page, Locator } from "@playwright/test";
import { BasePage } from "@pageobjects/sauce_demo/BasePage.pageobject";
import { faker } from "@faker-js/faker";

import * as checkoutPageLocStrings from "@locators/sauce_demo/CheckoutPage.locStrings.json";

import { LocatorBuilder } from "@utils/LocatorBuilder";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of checkout page
 */
export class CheckoutPage extends BasePage {
  iptFirstName!: Locator;
  iptLastName!: Locator;
  iptPostalCode!: Locator;

  constructor(page: Page) {
    super(page);

    Object.keys(checkoutPageLocStrings).forEach(key => {
      // console.log(loginPageLocString.locStrings);
      const locatorConfig = checkoutPageLocStrings[key as keyof typeof checkoutPageLocStrings];
      const locator: Locator = new LocatorBuilder(page).buildElement(locatorConfig);
      // console.log(`Assigning locator for key: ${key}`, locator);
      (this as any)[key] = locator;
    })
  }

  /**
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} postalCode
   * @description: fill the checkout information form
   */
  async fillCheckoutInformation(
    firstName: string,
    lastName: string,
    postalCode: string
  ): Promise<void> {
    await this.iptFirstName.fill(firstName);
    await this.iptLastName.fill(lastName);
    await this.iptPostalCode.fill(postalCode);
  }

  async fillCheckoutInformationUsingFaker() {
    await this.iptFirstName.fill(faker.person.firstName());
    await this.iptLastName.fill(faker.person.lastName());
    await this.iptPostalCode.fill(faker.location.zipCode());
  }
}

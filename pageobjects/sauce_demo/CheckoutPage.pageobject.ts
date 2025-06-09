import { Page, Locator } from "@playwright/test";
import { BasePage } from "@pageobjects/sauce_demo/BasePage.pageobject";
import { faker } from "@faker-js/faker";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of checkout page
 */
export class CheckoutPage extends BasePage {
  private iptFirstName: Locator;
  private iptLastName: Locator;
  private iptPostalCode: Locator;

  constructor(page: Page) {
    super(page);
    this.iptFirstName = page.locator("#first-name");
    this.iptLastName = page.locator("#last-name");
    this.iptPostalCode = page.locator("#postal-code");
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

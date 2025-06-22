import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "@pageobjects/sauce_demo/BasePage.pageobject";

import * as CONSTANTS from "@pageobjects/Constants";
import * as loginPageLocStrings from "../../locators/sauce_demo/LoginPage.locStrings.json";

import { LocatorBuilder } from "@utils/LocatorBuilder";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of login page
 */
export class LoginPage extends BasePage {
  iptUsername!: Locator;
  iptPassword!: Locator;
  btnSubmit!: Locator;

  constructor(page: Page) {
    super(page);

    Object.keys(loginPageLocStrings).forEach(key => {
      // console.log(loginPageLocString.locStrings);
      const locatorConfig = loginPageLocStrings[key as keyof typeof loginPageLocStrings];
      const locator: Locator = new LocatorBuilder(page).buildElementWithAlternates(locatorConfig);
      // console.log(`Assigning locator for key: ${key}`, locator);
      (this as any)[key] = locator;
    })

  }

  /**
   * @description: loads the baseUrl and validates the title
   */
  async load(): Promise<void> {
    await this.page.goto(CONSTANTS.SAUCE_LABS.BASE_URL);
    // validate the title
    await expect(this.page).toHaveTitle(CONSTANTS.SAUCE_LABS.TITLE);
  }

  /**
   * @param username - The username to login
   * @param password - The password to login
   * @description: logs into the application and validates the heading of the inventory or landing page
   */
  async login(username: string, password: string): Promise<void> {
    await this.iptUsername.fill(username);
    await this.iptPassword.fill(password);
    await this.btnSubmit.click();
  }
}

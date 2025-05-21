import { expect } from "@playwright/test";
import { BasePage } from "./BasePage.pageobject";
import * as Constants from "./Constants";
import { Page, Locator } from "@playwright/test";

/**
 * @author: srinivasaimandi
 * @description: contains the locators and functions of login page
 */
export class LoginPage extends BasePage {
  iptUsername: Locator;
  iptPassword: Locator;
  btnSubmit: Locator;

  constructor(page: Page) {
    super(page);
    // getByPlaceholder usage
    this.iptUsername = page.getByPlaceholder("Username");
    this.iptPassword = page.locator("#password");
    // getByRole usage
    this.btnSubmit = page.getByRole("button", { name: "Login" });
  }

  /**
   * @description: loads the baseUrl and validates the title
   */
  async load(): Promise<void> {
    await this.page.goto(Constants.web_ui_automation.sauce_labs.base_url);
    // validate the title
    await expect(this.page).toHaveTitle(Constants.web_ui_automation.sauce_labs.title);
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

import type { Page } from '@playwright/test';

/** Locators and actions for the application's login form. */
export class LoginPage {
  private readonly page: Page;
  readonly heading;
  readonly usernameInput;
  readonly passwordInput;
  readonly submitButton;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Login', level: 2 });
    this.usernameInput = page.getByRole('textbox', { name: 'Enter Username', exact: true });
    this.passwordInput = page.getByRole('textbox', { name: 'Enter Password', exact: true });
    this.submitButton = page.getByRole('button', { name: 'Login' });
  }

  /** Navigates to the login page at the configured base URL. */
  async goto() {
    await this.page.goto('/');
  }

  /** Submits the login form with the provided credentials. */
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

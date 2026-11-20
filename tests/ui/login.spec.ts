import { expect, test } from './fixtures.ts';
import { getLoginCredentials } from '../utils/environment.ts';

/** Login form, validation, and successful authentication scenarios. */
test.describe('Login flow', { tag: '@login' }, () => {
  test(
    'shows the login form with accessible fields and an enabled submit button',
    {
      tag: '@smoke',
    },
    async ({ loginPage }) => {
      await loginPage.goto();

      await expect(loginPage.heading).toBeVisible();
      await expect(loginPage.usernameInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeEnabled();
    },
  );

  test(
    'requires username and password before submitting',
    {
      tag: '@validation',
    },
    async ({ loginPage }) => {
      await loginPage.goto();

      await loginPage.submitButton.click();
      await expect(loginPage.usernameInput).toBeFocused();

      await loginPage.usernameInput.fill('sample-user');
      await loginPage.submitButton.click();
      await expect(loginPage.passwordInput).toBeFocused();
      await expect(loginPage.heading).toBeVisible();
    },
  );

  test(
    'logs in with valid credentials and opens the users list',
    {
      tag: '@auth',
    },
    async ({ page, loginPage }) => {
      const credentials = getLoginCredentials();

      if (!credentials) {
        test.skip(true, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to run this authenticated test');
        return;
      }

      await loginPage.goto();
      await loginPage.login(credentials.username, credentials.password);

      await expect(page).toHaveURL(/\/usersPage\.html$/);
      await expect(page.getByRole('heading', { name: 'Users List' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
    },
  );
});

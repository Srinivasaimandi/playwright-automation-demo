import { expect, test as apiTest } from '../api/fixtures.ts';
import { getLoginCredentials } from '../utils/environment.ts';
import { LoginPage } from './pages/login.page.ts';
import { UsersPage } from './pages/users.page.ts';

/** UI page objects and authenticated page resources injected into UI tests. */
type UiFixtures = {
  loginPage: LoginPage;
  usersPage: UsersPage;
  authenticatedUsersPage: UsersPage;
};

/** UI fixtures layered on top of shared API and test-data fixtures. */
export const test = apiTest.extend<UiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  usersPage: async ({ page }, use) => {
    await use(new UsersPage(page));
  },

  authenticatedUsersPage: async ({ page, loginPage, usersPage }, use) => {
    const credentials = getLoginCredentials();
    if (!credentials) {
      apiTest.skip(true, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to run authenticated users tests');
      return;
    }

    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await expect(page).toHaveURL(/\/usersPage\.html$/);
    await use(usersPage);
  },
});

export { expect };

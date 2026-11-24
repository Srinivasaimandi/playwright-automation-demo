import AxeBuilder from '@axe-core/playwright';
import { expect, test as apiTest } from '../api/fixtures.ts';
import { getLoginCredentials } from '../utils/environment.ts';
import { UsersApiMock } from './mocks/users-api-mock.ts';
import { LoginPage } from './pages/login.page.ts';
import { UsersPage } from './pages/users.page.ts';

/** UI page objects and authenticated page resources injected into UI tests. */
type UiFixtures = {
  loginPage: LoginPage;
  usersPage: UsersPage;
  authenticatedUsersPage: UsersPage;
  makeAxeBuilder: () => AxeBuilder;
  usersApiMock: UsersApiMock;
};

/** WCAG 2.1 A and AA rule tags checked by accessibility tests. */
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** UI fixtures layered on top of shared API and test-data fixtures. */
export const test = apiTest.extend<UiFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  usersPage: async ({ page }, use) => {
    await use(new UsersPage(page));
  },

  authenticatedUsersPage: async ({ page, usersPage }, use) => {
    const credentials = getLoginCredentials();
    if (!credentials) {
      apiTest.skip(true, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to run authenticated users tests');
      return;
    }

    await page.goto('/usersPage.html');
    await expect(usersPage.heading).toBeVisible();
    await expect(page).toHaveURL(/\/usersPage\.html$/);
    await use(usersPage);
  },

  makeAxeBuilder: async ({ page }, use) => {
    await use(() => new AxeBuilder({ page }).withTags(wcagTags));
  },

  usersApiMock: async ({ page }, use) => {
    await use(new UsersApiMock(page));
  },
});

export { expect };

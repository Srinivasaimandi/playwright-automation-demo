import { expect, test } from '../fixtures.ts';
import { createUniqueUserData } from '../../data/factories.ts';
import { assertTestDataTargetIsSafe, getLoginCredentials } from '../../utils/environment.ts';

/** End-to-end user journeys for authentication and user management. */
test.describe('Users end-to-end journey', { tag: '@e2e' }, () => {
  test('logs in, searches for a user, and logs out', async ({ page, loginPage, usersPage, testData }) => {
    const credentials = getLoginCredentials();
    if (!credentials) {
      test.skip(true, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to run this end-to-end test');
      return;
    }

    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await expect(page).toHaveURL(/\/usersPage\.html$/);
    await expect(usersPage.heading).toBeVisible();

    const jane = testData.existingUsers.jane;
    await usersPage.searchFor(jane.email);
    await expect(usersPage.getUserRow(jane.name)).toBeVisible();

    await usersPage.logout();
    await expect(page).toHaveURL(/\/index\.html$/);
    await expect(loginPage.heading).toBeVisible();
  });

  test('logs in, adds a user, updates it, and deletes it', { tag: '@test-data' }, async ({
    baseURL,
    page,
    loginPage,
    usersPage,
    usersApi,
    testData,
  }) => {
    assertTestDataTargetIsSafe(baseURL);

    const credentials = getLoginCredentials();
    if (!credentials) {
      test.skip(true, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to run this end-to-end test');
      return;
    }

    const newUser = createUniqueUserData(testData.newUser);
    const updatedName = `${newUser.name} Updated`;

    try {
      await loginPage.goto();
      await loginPage.login(credentials.username, credentials.password);
      await expect(page).toHaveURL(/\/usersPage\.html$/);
      await expect(usersPage.heading).toBeVisible();

      await usersPage.openAddUserDialog();
      await usersPage.fillAddUserForm(newUser);
      await usersPage.saveUserButton.click();

      await expect(usersPage.addUserDialog).toBeHidden();
      await expect(usersPage.getUserRow(newUser.name)).toBeVisible();

      const newUserId = Number(await usersPage.getUserRow(newUser.name).getByRole('cell').first().innerText());
      const newUserRow = usersPage.getUserRowById(newUserId);
      await newUserRow.getByRole('button', { name: 'Edit row' }).click();
      await newUserRow.getByRole('textbox').nth(0).fill(updatedName);
      await newUserRow.getByRole('button', { name: 'Save changes' }).click();

      const updatedUserRow = usersPage.getUserRow(updatedName);
      await expect(updatedUserRow).toBeVisible();
      await expect(updatedUserRow).toContainText(newUser.email);

      await updatedUserRow.getByRole('button', { name: 'Delete row' }).click();
      await expect(usersPage.getUserRow(updatedName)).toHaveCount(0);
    } finally {
      const createdUser = (await usersApi.listUsers()).find((user) => user.email === newUser.email);
      if (createdUser) {
        await usersApi.deleteUserIfPresent(createdUser.id);
      }
    }
  });
});

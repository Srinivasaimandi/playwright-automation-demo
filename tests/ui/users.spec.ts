import { createUniqueUserData } from '../data/factories.ts';
import { expect, test } from './fixtures.ts';

/** Authenticated UI scenarios for browsing and managing users. */
test.describe('Users screen', { tag: '@users' }, () => {
  test(
    'shows the users table and management controls',
    { tag: '@smoke' },
    async ({ authenticatedUsersPage: usersPage }) => {
      await expect(usersPage.heading).toBeVisible();
      await expect(usersPage.searchInput).toBeVisible();
      await expect(usersPage.addUserButton).toBeVisible();
      await expect(usersPage.refreshUsersButton).toBeVisible();
      await expect(usersPage.resetDataButton).toBeVisible();
      await expect(usersPage.logoutLink).toBeVisible();
      await expect(usersPage.usersTable).toBeVisible();
      await expect(usersPage.columnHeaders).toHaveText([
        'ID',
        'Name',
        'Email',
        'Username',
        'Actions',
      ]);
    },
  );

  test(
    'filters users by part of a name',
    { annotation: { type: 'requirement', description: 'REQ-001' } },
    async ({ authenticatedUsersPage: usersPage, testData }) => {
      const partialName = testData.searches.janeByPartialName;
      const nameMatcher = new RegExp(partialName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      await expect(usersPage.getUserRow(testData.existingUsers.jane.name)).toBeVisible();
      const unfilteredCount = await usersPage.userRows.count();

      await usersPage.searchFor(partialName);

      await expect(usersPage.getUserRow(testData.existingUsers.jane.name)).toBeVisible();
      const filteredCount = await usersPage.userRows.count();
      expect(filteredCount).toBeLessThan(unfilteredCount);
      await expect(await usersPage.getColumnCells('Name')).toHaveText(
        Array.from({ length: filteredCount }, () => nameMatcher),
      );
    },
  );

  test(
    'filters users by email without case sensitivity',
    { annotation: { type: 'requirement', description: 'REQ-001' } },
    async ({ authenticatedUsersPage: usersPage, testData }) => {
      await usersPage.searchFor(testData.searches.janeByEmailCaseInsensitive);

      await expect(usersPage.getUserRow(testData.existingUsers.jane.name)).toBeVisible();
      await expect(usersPage.userRows).toHaveCount(1);
    },
  );

  test(
    'shows an API-created user in the users list',
    { tag: '@test-data' },
    async ({ authenticatedUsersPage: usersPage, apiTestUser }) => {
      await usersPage.refreshUsersButton.click();
      await usersPage.searchFor(apiTestUser.email);

      await expect(usersPage.getUserRow(apiTestUser.name)).toBeVisible();
    },
  );

  test(
    'shows no rows for an unmatched search and restores results when cleared',
    { annotation: { type: 'requirement', description: 'REQ-001' } },
    async ({ authenticatedUsersPage: usersPage, testData }) => {
      await expect(usersPage.getUserRow(testData.existingUsers.jane.name)).toBeVisible();
      const unfilteredCount = await usersPage.userRows.count();

      await usersPage.searchFor(testData.searches.noResults);
      await expect(usersPage.userRows).toHaveCount(0);

      await usersPage.searchFor('');
      await expect(usersPage.getUserRow(testData.existingUsers.jane.name)).toBeVisible();
      await expect(usersPage.userRows).toHaveCount(unfilteredCount);
    },
  );

  test('opens the add-user form and can cancel without changes', async ({
    authenticatedUsersPage: usersPage,
    testData,
  }) => {
    await usersPage.openAddUserDialog();

    await expect(usersPage.addUserDialog).toBeVisible();
    await expect(usersPage.addUserNameInput).toBeVisible();
    await expect(usersPage.addUserEmailInput).toBeVisible();
    await expect(usersPage.addUserUsernameInput).toBeVisible();
    await expect(usersPage.addUserPasswordInput).toBeVisible();
    await expect(usersPage.saveUserButton).toBeVisible();

    await usersPage.fillAddUserForm(testData.newUser);
    await expect(usersPage.addUserNameInput).toHaveValue(testData.newUser.name);
    await usersPage.cancelAddUser();

    await expect(usersPage.addUserDialog).toBeHidden();
  });

  test('shows validation when saving the add-user form empty', async ({
    authenticatedUsersPage: usersPage,
  }) => {
    await usersPage.openAddUserDialog();
    await usersPage.saveUserButton.click();

    await expect(usersPage.addUserValidationMessage).toBeVisible();
    await expect(usersPage.addUserDialog).toBeVisible();
    await usersPage.cancelAddUser();
  });

  test('opens a user row in edit mode with its existing values', async ({
    authenticatedUsersPage: usersPage,
    testData,
  }) => {
    const jane = testData.existingUsers.jane;
    await usersPage.searchFor(jane.name);

    const janeNameRow = usersPage.getUserRow(jane.name);
    await expect(janeNameRow).toHaveCount(1);
    // Edit mode moves the name into a textbox, so keep hold of the row by its stable ID cell.
    const janeId = Number(await janeNameRow.getByRole('cell').first().innerText());
    const janeRow = usersPage.getUserRowById(janeId);
    await janeRow.getByRole('button', { name: 'Edit row' }).click();

    const editableFields = janeRow.getByRole('textbox');
    await expect(editableFields).toHaveCount(3);
    await expect(editableFields.nth(0)).toHaveValue(jane.name);
    await expect(editableFields.nth(1)).toHaveValue(jane.email);
    await expect(editableFields.nth(2)).toHaveValue(jane.username);
  });

  test('logs out and returns to the login form', async ({
    page,
    loginPage,
    authenticatedUsersPage: usersPage,
  }) => {
    await usersPage.logout();

    await expect(page).toHaveURL(/\/index\.html$/);
    await expect(loginPage.heading).toBeVisible();
  });

  /** The users screen's behaviour when the users API fails, simulated with network routing. */
  test.describe('when the users API fails', () => {
    test('shows a fetch error when the users request fails at the network level', async ({
      page,
      authenticatedUsersPage: usersPage,
      testData,
    }) => {
      await expect(usersPage.getUserRow(testData.existingUsers.jane.name)).toBeVisible();
      // Aborting the request is used instead of context.setOffline(), which Firefox ignores for loopback hosts.
      await page.route('**/api/users', (route) => route.abort('internetdisconnected'));

      await usersPage.refreshUsersButton.click();

      await expect(usersPage.fetchFailedMessage).toBeVisible();
    });

    test('asks the user to log in again and drops the token when the API rejects it', async ({
      page,
      authenticatedUsersPage: usersPage,
    }) => {
      await page.route('**/api/users', (route) =>
        route.fulfill({ status: 401, json: { message: 'Unauthorized: Invalid API Key' } }),
      );

      await usersPage.refreshUsersButton.click();

      await expect(usersPage.unauthorizedMessage).toBeVisible();
      await expect.poll(() => usersPage.getStoredApiToken()).toBeNull();
    });

    test('shows an empty-state message when the API returns no users', async ({
      page,
      authenticatedUsersPage: usersPage,
    }) => {
      await page.route('**/api/users', (route) => route.fulfill({ status: 204 }));

      await usersPage.refreshUsersButton.click();

      await expect(usersPage.noUsersMessage).toBeVisible();
    });

    test('keeps the add-user dialog open and shows the server rejection message', async ({
      page,
      authenticatedUsersPage: usersPage,
      testData,
    }) => {
      const user = createUniqueUserData(testData.newUser);
      const rejection = `Email ${user.email} already exists`;
      await page.route('**/api/users', (route) =>
        route.request().method() === 'POST'
          ? route.fulfill({ status: 400, json: { message: rejection } })
          : route.fallback(),
      );

      await usersPage.openAddUserDialog();
      await usersPage.fillAddUserForm(user);
      await usersPage.saveUserButton.click();

      await expect(usersPage.getAddUserError(rejection)).toBeVisible();
      await expect(usersPage.addUserDialog).toBeVisible();
    });

    test('shows a generic error when saving a user fails at the network level', async ({
      page,
      authenticatedUsersPage: usersPage,
      testData,
    }) => {
      await page.route('**/api/users', (route) =>
        route.request().method() === 'POST' ? route.abort('failed') : route.fallback(),
      );

      await usersPage.openAddUserDialog();
      await usersPage.fillAddUserForm(createUniqueUserData(testData.newUser));
      await usersPage.saveUserButton.click();

      await expect(usersPage.getAddUserError('Failed to add user.')).toBeVisible();
      await expect(usersPage.addUserDialog).toBeVisible();
    });
  });
});

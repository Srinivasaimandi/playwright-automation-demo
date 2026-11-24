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

  /** The users screen's behaviour when the users API fails, simulated with network mocks. */
  test.describe('when the users API fails', { tag: '@mocked' }, () => {
    test('shows a fetch error when the users request fails at the network level', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      await expect(usersPage.getUserRow(testData.existingUsers.jane.name)).toBeVisible();
      // Aborting the request is used instead of context.setOffline(), which Firefox ignores for loopback hosts.
      await usersApiMock.abort('list', 'GET', 'internetdisconnected');

      await usersPage.refreshUsersButton.click();

      await expect(usersPage.fetchFailedMessage).toBeVisible();
    });

    test('shows a fetch error when the users API returns a server error page', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
    }) => {
      await usersApiMock.fulfill('list', 'GET', {
        status: 500,
        contentType: 'text/html',
        body: '<h1>Internal Server Error</h1>',
      });

      await usersPage.refreshUsersButton.click();

      await expect(usersPage.fetchFailedMessage).toBeVisible();
    });

    for (const status of [401, 403]) {
      test(`asks the user to log in again and drops the token on a ${status} response`, async ({
        authenticatedUsersPage: usersPage,
        usersApiMock,
      }) => {
        await usersApiMock.fulfill('list', 'GET', {
          status,
          json: { message: 'Unauthorized: Invalid API Key' },
        });

        await usersPage.refreshUsersButton.click();

        await expect(usersPage.unauthorizedMessage).toBeVisible();
        await expect.poll(() => usersPage.getStoredApiToken()).toBeNull();
      });
    }

    test('shows an empty-state message when the API returns no users', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
    }) => {
      await usersApiMock.fulfill('list', 'GET', { status: 204 });

      await usersPage.refreshUsersButton.click();

      await expect(usersPage.noUsersMessage).toBeVisible();
    });

    test('shows an empty-state message when the API returns an empty list', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
    }) => {
      await usersApiMock.respondWithUsers([]);

      await usersPage.refreshUsersButton.click();

      await expect(usersPage.noUsersMessage).toBeVisible();
    });

    test('keeps the add-user dialog open and shows the server rejection message', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      const user = createUniqueUserData(testData.newUser);
      const rejection = `Email ${user.email} already exists`;
      await usersApiMock.fulfill('list', 'POST', { status: 400, json: { message: rejection } });

      await usersPage.openAddUserDialog();
      await usersPage.fillAddUserForm(user);
      await usersPage.saveUserButton.click();

      await expect(usersPage.getAddUserError(rejection)).toBeVisible();
      await expect(usersPage.addUserDialog).toBeVisible();
    });

    test('shows a generic error when saving a user fails at the network level', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      await usersApiMock.abort('list', 'POST');

      await usersPage.openAddUserDialog();
      await usersPage.fillAddUserForm(createUniqueUserData(testData.newUser));
      await usersPage.saveUserButton.click();

      await expect(usersPage.getAddUserError('Failed to add user.')).toBeVisible();
      await expect(usersPage.addUserDialog).toBeVisible();
    });
  });

  /**
   * Row actions and loading behaviour against mocked users. The mocked users have IDs no real
   * record uses, so a request that escapes its mock cannot change seeded data.
   */
  test.describe('with mocked users', { tag: '@mocked' }, () => {
    test.beforeEach(async ({ authenticatedUsersPage: usersPage, usersApiMock, testData }) => {
      const { admin, alice, bob } = testData.mockUsers;
      await usersApiMock.respondWithUsers([admin, alice, bob]);
      await usersPage.refreshUsersButton.click();
      await expect(usersPage.getUserRowById(alice.id)).toBeVisible();
    });

    test('lists exactly the users the API returns, except the admin account', async ({
      authenticatedUsersPage: usersPage,
      testData,
    }) => {
      const { admin, alice, bob } = testData.mockUsers;

      await expect(await usersPage.getColumnCells('Name')).toHaveText([alice.name, bob.name]);
      await expect(usersPage.getUserRowById(admin.id)).toHaveCount(0);
    });

    test('shows no users until a slow users response arrives', async ({
      page,
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      const { alice, bob } = testData.mockUsers;
      const usersRequest = await usersApiMock.hold('list', 'GET');

      await page.reload();
      await usersRequest.received;
      await expect(usersPage.heading).toBeVisible();
      await expect(usersPage.userRows).toHaveCount(0);

      await usersRequest.release({ status: 200, json: [alice, bob] });

      await expect(usersPage.userRows).toHaveCount(2);
    });

    test('disables save while an inline edit is in flight, then shows the saved values', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      const { alice } = testData.mockUsers;
      const updated = { ...alice, name: `${alice.name} Updated` };
      const row = usersPage.getUserRowById(alice.id);
      const saveButton = usersPage.getRowButton(row, 'Save changes');
      const updateRequest = await usersApiMock.hold('user', 'PUT');

      await usersPage.getRowButton(row, 'Edit row').click();
      await usersPage.getRowEditFields(row).first().fill(updated.name);
      await saveButton.click();

      const request = await updateRequest.received;
      expect(request.postDataJSON()).toEqual({
        name: updated.name,
        email: alice.email,
        username: alice.username,
      });
      await expect(saveButton).toBeDisabled();

      await updateRequest.release({ status: 200, json: updated });

      await expect(row.getByRole('cell', { name: updated.name, exact: true })).toBeVisible();
      await expect(usersPage.getRowEditFields(row)).toHaveCount(0);
    });

    test('shows the server message when an inline edit is rejected', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      const { alice, bob } = testData.mockUsers;
      const rejection = `Email ${bob.email} already exists`;
      await usersApiMock.fulfill('user', 'PUT', { status: 400, json: { message: rejection } });
      const row = usersPage.getUserRowById(alice.id);

      await usersPage.getRowButton(row, 'Edit row').click();
      await usersPage.getRowEditFields(row).nth(1).fill(bob.email);
      await usersPage.getRowButton(row, 'Save changes').click();

      await expect(usersPage.getStatusMessage(rejection)).toBeVisible();
    });

    test('shows a generic error when an inline edit fails at the network level', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      await usersApiMock.abort('user', 'PUT');
      const row = usersPage.getUserRowById(testData.mockUsers.alice.id);

      await usersPage.getRowButton(row, 'Edit row').click();
      await usersPage.getRowButton(row, 'Save changes').click();

      await expect(usersPage.getStatusMessage('Failed to update user.')).toBeVisible();
    });

    test('removes a row once the API confirms the delete', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      const { alice, bob } = testData.mockUsers;
      await usersApiMock.fulfill('user', 'DELETE', { status: 204 });

      await usersPage.getRowButton(usersPage.getUserRowById(alice.id), 'Delete row').click();

      await expect(usersPage.getUserRowById(alice.id)).toHaveCount(0);
      await expect(usersPage.getUserRowById(bob.id)).toBeVisible();
    });

    test('keeps a row and shows the server message when a delete is refused', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      const { alice } = testData.mockUsers;
      const refusal = `User with id ${alice.id} is restricted from deleting`;
      await usersApiMock.fulfill('user', 'DELETE', { status: 403, json: { message: refusal } });
      const row = usersPage.getUserRowById(alice.id);

      await usersPage.getRowButton(row, 'Delete row').click();

      await expect(usersPage.getStatusMessage(refusal)).toBeVisible();
      await expect(row).toBeVisible();
    });

    test('keeps a row and shows a generic error when a delete fails at the network level', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      await usersApiMock.abort('user', 'DELETE');
      const row = usersPage.getUserRowById(testData.mockUsers.alice.id);

      await usersPage.getRowButton(row, 'Delete row').click();

      await expect(usersPage.getStatusMessage('Failed to delete user.')).toBeVisible();
      await expect(row).toBeVisible();
    });

    // The reset-data mock must answer before the request reaches the app: a real reset deletes
    // users that tests running in parallel depend on.
    test('reloads the users list after a data reset succeeds', async ({
      page,
      authenticatedUsersPage: usersPage,
      usersApiMock,
      testData,
    }) => {
      const { alice } = testData.mockUsers;
      await usersApiMock.fulfill('resetData', 'PUT', {
        status: 200,
        json: { message: 'Data has been reset from backup.' },
      });
      await usersApiMock.respondWithUsers([alice]);
      const reloadRequest = page.waitForRequest(
        (request) => request.method() === 'GET' && new URL(request.url()).pathname === '/api/users',
      );

      await usersPage.resetDataButton.click();

      await reloadRequest;
      await expect(usersPage.userRows).toHaveCount(1);
      await expect(usersPage.getUserRowById(alice.id)).toBeVisible();
    });

    test('shows an error when a data reset returns a server error', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
    }) => {
      const failure = 'Failed to reset data.';
      await usersApiMock.fulfill('resetData', 'PUT', {
        status: 500,
        json: { message: failure, error: 'ENOENT: data-backup.json not found' },
      });

      await usersPage.resetDataButton.click();

      await expect(usersPage.getStatusMessage(failure)).toBeVisible();
    });

    test('shows an error when a data reset fails at the network level', async ({
      authenticatedUsersPage: usersPage,
      usersApiMock,
    }) => {
      await usersApiMock.abort('resetData', 'PUT');

      await usersPage.resetDataButton.click();

      await expect(usersPage.getStatusMessage('Failed to reset data.')).toBeVisible();
    });
  });
});

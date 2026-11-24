import { expect, test } from './fixtures.ts';

/** Automated WCAG 2.1 A/AA scans of each screen and dialog. */
test.describe('Accessibility', { tag: '@a11y' }, () => {
  test('login page has no detectable WCAG violations', async ({ loginPage, makeAxeBuilder }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toBeVisible();

    const results = await makeAxeBuilder().analyze();

    expect(results.violations).toEqual([]);
  });

  test('users page has no detectable WCAG violations', async ({
    authenticatedUsersPage: usersPage,
    makeAxeBuilder,
    testData,
  }) => {
    await expect(usersPage.getUserRow(testData.existingUsers.jane.name)).toBeVisible();

    // The protected-user lock icon is scanned on its own below, as a known app defect.
    const results = await makeAxeBuilder().exclude('.protected-user').analyze();

    expect(results.violations).toEqual([]);
  });

  test('add-user dialog has no detectable WCAG violations', async ({
    authenticatedUsersPage: usersPage,
    makeAxeBuilder,
  }) => {
    await usersPage.openAddUserDialog();
    await expect(usersPage.addUserDialog).toBeVisible();

    const results = await makeAxeBuilder().include('[role="dialog"]').analyze();

    expect(results.violations).toEqual([]);
  });

  /** Expected behaviour the app does not implement yet; each test passes once its defect is fixed. */
  test.describe('known app defects', () => {
    test.fail(
      'protected-user lock icon has no detectable WCAG violations',
      {
        annotation: {
          type: 'app-defect',
          description:
            'The lock icon is a <span aria-label="Protected user"> with no role; aria-label is prohibited on a role-less span (axe aria-prohibited-attr, WCAG 4.1.2)',
        },
      },
      async ({ authenticatedUsersPage: usersPage, makeAxeBuilder, testData }) => {
        await expect(usersPage.getUserRow(testData.existingUsers.jane.name)).toBeVisible();

        const results = await makeAxeBuilder().include('.protected-user').analyze();

        expect(results.violations).toEqual([]);
      },
    );
  });
});

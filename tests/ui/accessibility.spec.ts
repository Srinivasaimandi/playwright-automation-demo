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

    const results = await makeAxeBuilder().analyze();

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
});

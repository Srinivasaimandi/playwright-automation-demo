import { expect, test } from './fixtures.ts';

/**
 * Screenshot comparisons of key screens. Runs in Chromium only; baselines are per operating
 * system, so regenerate them with `npm run test:visual:update` after an intended UI change.
 */
test.describe('Visual regression', { tag: '@visual' }, () => {
  test('login page matches its baseline', async ({ page, loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.heading).toBeVisible();

    await expect(page).toHaveScreenshot('login-page.png', { fullPage: true });
  });

  test('users page filtered to one seeded user matches its baseline', async ({
    page,
    authenticatedUsersPage: usersPage,
    testData,
  }) => {
    // Filter to one seeded row so users created by parallel tests cannot change the screenshot.
    await usersPage.searchFor(testData.existingUsers.jane.email);
    await expect(usersPage.userRows).toHaveCount(1);

    await expect(page).toHaveScreenshot('users-page-filtered.png', { fullPage: true });
  });

  test('add-user dialog matches its baseline', async ({ authenticatedUsersPage: usersPage }) => {
    await usersPage.openAddUserDialog();
    await expect(usersPage.addUserDialog).toBeVisible();

    await expect(usersPage.addUserDialog).toHaveScreenshot('add-user-dialog.png');
  });
});

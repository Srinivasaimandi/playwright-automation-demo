import { expect, test } from './fixtures.ts';

/** Smoke checks for the real app home page and its Swagger navigation. */
test.describe('Application home smoke tests', { tag: '@smoke' }, () => {
  test('loads the application home page and login form', async ({ page, loginPage }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Users App');
    await expect(page.getByRole('heading', { name: 'Welcome to Users App', level: 1 })).toBeVisible();
    await expect(page.getByText('Manage users, refresh data, and inspect the API from one place.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'UI', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Swagger Docs' })).toHaveAttribute('href', /\/api-docs\/?$/);
    await expect(page.getByRole('link', { name: 'GraphQL' })).toHaveAttribute('href', /\/graphql$/);
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test('opens the Swagger documentation from the home page', async ({ page }) => {
    await page.goto('/');

    const docsPagePromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'Swagger Docs' }).click();
    const docsPage = await docsPagePromise;

    await expect(docsPage).toHaveURL(/\/api-docs\/$/);
    await expect(docsPage).toHaveTitle('Swagger UI');
    await expect(docsPage.getByRole('heading', { name: /Users App API/ })).toBeVisible();
  });
});

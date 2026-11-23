import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { getLoginCredentials } from '../utils/environment.ts';
import { LoginPage } from './pages/login.page.ts';
import { UsersPage } from './pages/users.page.ts';

const authStatePath = resolve(process.cwd(), '.auth/user.json');

test('authenticate and save browser storage state', async ({ page }) => {
  const credentials = getLoginCredentials();
  if (!credentials) {
    test.skip(true, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to save authenticated browser state');
    return;
  }

  const loginPage = new LoginPage(page);
  const usersPage = new UsersPage(page);

  await page.goto('/');
  await loginPage.login(credentials.username, credentials.password);
  await expect(page).toHaveURL(/\/usersPage\.html$/);
  await expect(usersPage.heading).toBeVisible();
  await expect(usersPage.logoutLink).toBeVisible();
  await expect(page.evaluate(() => localStorage.getItem('x-api-token'))).resolves.toBeTruthy();

  await mkdir(dirname(authStatePath), { recursive: true });
  await page.context().storageState({ path: authStatePath });
});

import { expect, test } from './fixtures.ts';
import type { Page } from '@playwright/test';

function collectSmokeDiagnostics(page: Page, relevantOrigins: string[]) {
  const origins = new Set(relevantOrigins.map((url) => new URL(url).origin));
  const errors: string[] = [];
  const isRelevant = (url: string) => {
    try {
      return origins.has(new URL(url).origin);
    } catch {
      return false;
    }
  };

  page.on('console', (message) => {
    if (message.type() === 'error' && isRelevant(message.location().url)) {
      errors.push(`Console error: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => errors.push(`Uncaught page error: ${error.message}`));
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText;
    if (isRelevant(request.url()) && failure !== 'net::ERR_ABORTED') {
      errors.push(`Request failed: ${request.method()} ${request.url()} (${failure ?? 'unknown'})`);
    }
  });
  page.on('response', (response) => {
    if (isRelevant(response.url()) && response.status() >= 400) {
      errors.push(`HTTP ${response.status()}: ${response.request().method()} ${response.url()}`);
    }
  });

  return {
    assertNoErrors() {
      expect(errors, 'Unexpected browser or same-origin network errors').toEqual([]);
    },
  };
}

/** Smoke checks for the real app home page and its Swagger navigation. */
test.describe('Application home smoke tests', { tag: '@smoke' }, () => {
  test('loads the application home page and login form', async ({ page, loginPage, baseURL }) => {
    if (!baseURL) {
      throw new Error('BASE_URL is required for UI smoke diagnostics');
    }
    const diagnostics = collectSmokeDiagnostics(page, [baseURL]);
    await page.goto('/');

    await expect(page).toHaveTitle('Users App');
    await expect(
      page.getByRole('heading', { name: 'Welcome to Users App', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText('Manage users, refresh data, and inspect the API from one place.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'UI', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Swagger Docs' })).toHaveAttribute(
      'href',
      /\/api-docs\/?$/,
    );
    await expect(page.getByRole('link', { name: 'GraphQL' })).toHaveAttribute('href', /\/graphql$/);
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeEnabled();
    diagnostics.assertNoErrors();
  });

  test.skip('opens the Swagger documentation from the home page', async ({ page, baseURL }) => {
    if (!baseURL) {
      throw new Error('BASE_URL is required for UI smoke diagnostics');
    }
    const diagnostics = collectSmokeDiagnostics(page, [baseURL]);
    await page.goto('/');

    const docsLink = page.getByRole('link', { name: 'Swagger Docs' });
    const docsHref = await docsLink.getAttribute('href');
    if (!docsHref) {
      throw new Error('Swagger Docs link is missing its href');
    }
    const docsOrigin = new URL(docsHref, baseURL).origin;
    const docsDiagnostics: ReturnType<typeof collectSmokeDiagnostics>[] = [];
    page.on('popup', (popup) => {
      docsDiagnostics.push(collectSmokeDiagnostics(popup, [docsOrigin]));
    });

    const docsPagePromise = page.waitForEvent('popup');
    await docsLink.click();
    const docsPage = await docsPagePromise;

    await expect(docsPage).toHaveURL(/\/api-docs\/$/);
    await expect(docsPage).toHaveTitle('Swagger UI');
    await expect(docsPage.getByRole('heading', { name: /Users App API/ })).toBeVisible();
    diagnostics.assertNoErrors();
    expect(docsDiagnostics).toHaveLength(1);
    docsDiagnostics[0].assertNoErrors();
  });
});

import { test as base } from '@playwright/test';
import type { ApiTestUser } from '../data/users.ts';
import { createUniqueUserData } from '../data/factories.ts';
import { usersTestData } from '../data/users.ts';
import { assertTestDataTargetIsSafe, getLoginCredentials } from '../utils/environment.ts';
import { GraphqlClient } from './utils/graphql-client.ts';
import { UsersApiClient } from './utils/users-api-client.ts';

/** API resources provided to each API test. */
type ApiFixtures = {
  usersApi: UsersApiClient;
  graphqlApi: GraphqlClient;
  apiTestUser: ApiTestUser;
  testData: typeof usersTestData;
};

/** API tests with authenticated requests and disposable user data. */
export const test = base.extend<ApiFixtures>({
  usersApi: async ({ request }, use) => {
    const credentials = getLoginCredentials();
    if (!credentials) {
      base.skip(true, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to run API tests');
      return;
    }

    await use(await UsersApiClient.login(request, credentials));
  },

  graphqlApi: async ({ request }, use) => {
    const credentials = getLoginCredentials();
    if (!credentials) {
      base.skip(true, 'Set LOGIN_USERNAME and LOGIN_PASSWORD to run GraphQL tests');
      return;
    }

    await use(await GraphqlClient.login(request, credentials));
  },

  apiTestUser: async ({ baseURL, usersApi, testData }, use) => {
    assertTestDataTargetIsSafe(baseURL);

    const userData = createUniqueUserData(testData.newUser);
    const createdUser = await usersApi.createUser(userData);

    try {
      await use({ ...userData, id: createdUser.id });
    } finally {
      // Clean up by the unique email, which tolerates the test having already deleted the user.
      await usersApi.deleteUsersByEmail([userData.email]);
    }
  },

  testData: async ({}, use) => {
    await use(usersTestData);
  },
});

export { expect } from '@playwright/test';

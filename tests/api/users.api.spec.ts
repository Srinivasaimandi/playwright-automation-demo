import type { APIResponse } from '@playwright/test';
import { createUniqueUserData } from '../data/factories.ts';
import { assertTestDataTargetIsSafe } from '../utils/environment.ts';
import { expect, test } from './fixtures.ts';
import { parseApiResponse } from './utils/parse-response.ts';
import { ApiErrorSchema, ApiUserSchema } from './utils/schemas.ts';
import type { UsersApiClient } from './utils/users-api-client.ts';

/** Contract and CRUD smoke coverage for the documented users API. */
test.describe('Users API', { tag: '@api' }, () => {
  test('GET /users rejects requests without an API key', async ({ request }) => {
    const response = await request.get('/api/users');
    const error = await parseApiResponse(response, ApiErrorSchema, 401);

    expect(error.message).toBe('Unauthorized: Invalid API Key');
  });

  test('GET /users returns the seeded users', async ({ usersApi, testData }) => {
    const users = await usersApi.listUsers();
    const jane = users.find((user) => user.username === testData.existingUsers.jane.username);

    expect(jane).toMatchObject(testData.existingUsers.jane);
  });

  test('GET /users/search filters by email', async ({ usersApi, testData }) => {
    const jane = testData.existingUsers.jane;
    const users = await usersApi.searchUsers({ email: jane.email });
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject(jane);
  });

  test('GET /users/count returns a positive count', async ({ usersApi }) => {
    await expect(usersApi.getUserCount()).resolves.toBeGreaterThan(0);
  });

  test('POST /users rejects incomplete payloads with a schema-valid error', async ({
    usersApi,
  }) => {
    const response = await usersApi.createUserResponse({});
    const error = await parseApiResponse(response, ApiErrorSchema, 400);

    expect(error.message).toBe('All fields are required for each user');
  });

  test('GET, PUT, and DELETE /users/{id} return schema-valid errors for missing users', async ({
    usersApi,
  }) => {
    const missingUserId = 999_999_999;
    const responses = [
      await usersApi.getUserResponse(missingUserId),
      await usersApi.updateUserResponse(missingUserId, { name: 'Missing User' }),
      await usersApi.deleteUserResponse(missingUserId),
    ];

    for (const response of responses) {
      await expect(parseApiResponse(response, ApiErrorSchema, 404)).resolves.toMatchObject({
        message: 'User not found',
      });
    }
  });

  test(
    'GET /users/{id} returns a created user',
    { tag: '@test-data' },
    async ({ usersApi, apiTestUser }) => {
      const user = await usersApi.getUser(apiTestUser.id);
      expect(user).toMatchObject({
        id: apiTestUser.id,
        name: apiTestUser.name,
        email: apiTestUser.email,
        username: apiTestUser.username,
      });
    },
  );

  test(
    'PUT /users/{id} updates only the supplied fields of a created user',
    { tag: '@test-data' },
    async ({ usersApi, apiTestUser }) => {
      const updatedName = `${apiTestUser.name} Updated`;
      await usersApi.updateUser(apiTestUser.id, { name: updatedName });

      await expect(usersApi.getUser(apiTestUser.id)).resolves.toMatchObject({
        name: updatedName,
        email: apiTestUser.email,
        username: apiTestUser.username,
      });
    },
  );

  test(
    'DELETE /users/{id} removes a created user',
    { tag: '@test-data' },
    async ({ usersApi, apiTestUser }) => {
      await usersApi.deleteUser(apiTestUser.id);
      await expect(usersApi.getUserStatus(apiTestUser.id)).resolves.toBe(404);
    },
  );

  test('POST /login rejects invalid credentials', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { username: 'no-such-user', password: 'wrong-password' },
    });
    const error = await parseApiResponse(response, ApiErrorSchema, 401);

    expect(error.message).toBe('Invalid credentials');
  });

  test('GET /users rejects an unknown API key', async ({ request }) => {
    const response = await request.get('/api/users', {
      headers: { 'x-api-key': 'not-a-real-api-key' },
    });
    const error = await parseApiResponse(response, ApiErrorSchema, 401);

    expect(error.message).toBe('Unauthorized: Invalid API Key');
  });

  test('GET /users/search returns 204 No Content when nothing matches', async ({
    usersApi,
    testData,
  }) => {
    const response = await usersApi.searchUsersResponse({ name: testData.searches.noResults });

    expect(response.status()).toBe(204);
  });

  test(
    'POST /users rejects a duplicate email',
    { tag: '@test-data' },
    async ({ usersApi, apiTestUser, testData }) => {
      const duplicate = { ...createUniqueUserData(testData.newUser), email: apiTestUser.email };
      const response = await usersApi.createUserResponse(duplicate);
      await deleteIfCreated(usersApi, response);

      const error = await parseApiResponse(response, ApiErrorSchema, 400);
      expect(error.message).toBe(`Email ${apiTestUser.email} already exists`);
    },
  );

  test(
    'POST /users rejects a duplicate username',
    { tag: '@test-data' },
    async ({ usersApi, apiTestUser, testData }) => {
      const duplicate = {
        ...createUniqueUserData(testData.newUser),
        username: apiTestUser.username,
      };
      const response = await usersApi.createUserResponse(duplicate);
      await deleteIfCreated(usersApi, response);

      const error = await parseApiResponse(response, ApiErrorSchema, 400);
      expect(error.message).toBe(`Username ${apiTestUser.username} already exists`);
    },
  );

  test(
    'DELETE /users/{id} refuses to delete the protected seeded user',
    // Tagged @test-data because a regression here would delete a real record.
    { tag: '@test-data' },
    async ({ baseURL, usersApi, testData }) => {
      assertTestDataTargetIsSafe(baseURL);
      const protectedId = testData.deleteProtectedUserId;

      const response = await usersApi.deleteUserResponse(protectedId);
      const error = await parseApiResponse(response, ApiErrorSchema, 403);

      expect(error.message).toBe(`User with id ${protectedId} is restricted from deleting`);
      await expect(usersApi.getUserStatus(protectedId)).resolves.toBe(200);
    },
  );
});

/** Removes a user that a rejection test created by mistake, so a regression does not leak data. */
async function deleteIfCreated(usersApi: UsersApiClient, response: APIResponse) {
  if (response.status() === 201) {
    const { id } = ApiUserSchema.parse(await response.json());
    await usersApi.deleteUserIfPresent(id);
  }
}

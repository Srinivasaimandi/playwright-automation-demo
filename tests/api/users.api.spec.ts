import { expect, test } from './fixtures.ts';
import { parseApiResponse } from './utils/parse-response.ts';
import { ApiErrorSchema } from './utils/schemas.ts';

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
    'PUT /users/{id} updates a created user',
    { tag: '@test-data' },
    async ({ usersApi, apiTestUser }) => {
      const updatedName = `${apiTestUser.name} Updated`;
      await usersApi.updateUser(apiTestUser.id, { name: updatedName });

      await expect(usersApi.getUser(apiTestUser.id)).resolves.toMatchObject({ name: updatedName });
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
});

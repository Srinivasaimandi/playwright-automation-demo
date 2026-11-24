import { createUniqueUserData } from '../data/factories.ts';
import { assertTestDataTargetIsSafe } from '../utils/environment.ts';
import { expect, test } from './fixtures.ts';
import { executeGraphql, graphqlDocuments } from './utils/graphql-client.ts';

/** Queries, mutations and error handling for the users GraphQL endpoint. */
test.describe('Users GraphQL API', { tag: ['@api', '@graphql'] }, () => {
  test('users returns the seeded users', async ({ graphqlApi, testData }) => {
    const users = await graphqlApi.listUsers();
    const jane = users.find((user) => user.username === testData.existingUsers.jane.username);

    expect(jane).toMatchObject(testData.existingUsers.jane);
  });

  test('user returns the user with the requested id', async ({ graphqlApi, testData }) => {
    const users = await graphqlApi.listUsers();
    const jane = users.find((user) => user.username === testData.existingUsers.jane.username);
    expect(jane).toBeDefined();

    await expect(graphqlApi.getUser(jane!.id)).resolves.toEqual(jane);
  });

  test('user returns null for an id that does not exist', async ({ graphqlApi }) => {
    await expect(graphqlApi.getUser(999_999_999)).resolves.toBeNull();
  });

  test('searchUsers filters by email without case sensitivity', async ({
    graphqlApi,
    testData,
  }) => {
    const users = await graphqlApi.searchUsers({
      email: testData.searches.janeByEmailCaseInsensitive,
    });

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject(testData.existingUsers.jane);
  });

  test('searchUsers returns an empty list when nothing matches', async ({
    graphqlApi,
    testData,
  }) => {
    await expect(graphqlApi.searchUsers({ name: testData.searches.noResults })).resolves.toEqual(
      [],
    );
  });

  test('userCount matches the number of users returned', async ({ graphqlApi }) => {
    // Other tests add and remove users in parallel, so retry until one read sees a stable dataset.
    await expect(async () => {
      const { userCount, ids } = await graphqlApi.getUserCountWithIds();
      expect(userCount).toBeGreaterThan(0);
      expect(userCount).toBe(ids.length);
    }).toPass();
  });

  test('rejects a query for a field the schema does not define', async ({ graphqlApi }) => {
    const result = await graphqlApi.execute('query { noSuchField }');

    expect(result.status).toBe(400);
    expect(result.errors[0]).toMatchObject({
      message: 'Cannot query field "noSuchField" on type "Query".',
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
    });
  });

  test('deleteUser returns false for an id that does not exist', async ({ graphqlApi }) => {
    await expect(graphqlApi.deleteUser(999_999_999)).resolves.toBe(false);
  });

  test(
    'createUser adds a user that the REST API can read',
    { tag: '@test-data' },
    async ({ baseURL, graphqlApi, usersApi, testData }) => {
      assertTestDataTargetIsSafe(baseURL);
      const user = createUniqueUserData(testData.newUser);

      try {
        const created = await graphqlApi.createUser(user);

        expect(created).toMatchObject({
          name: user.name,
          email: user.email,
          username: user.username,
        });
        await expect(usersApi.getUser(created.id)).resolves.toEqual(created);
      } finally {
        await usersApi.deleteUsersByEmail([user.email]);
      }
    },
  );

  test(
    'createUser rejects an email that already exists',
    { tag: '@test-data' },
    async ({ graphqlApi, usersApi, apiTestUser, testData }) => {
      const duplicate = { ...createUniqueUserData(testData.newUser), email: apiTestUser.email };

      try {
        const result = await graphqlApi.execute(graphqlDocuments.createUser, duplicate);

        expect(result.data).toBeNull();
        expect(result.errors.map((error) => error.message)).toEqual([
          'Email or username already exists',
        ]);
      } finally {
        // The duplicate's generated name is unique, so it finds any user saved by mistake.
        const leaked = await graphqlApi.searchUsers({ name: duplicate.name });
        for (const user of leaked) {
          await usersApi.deleteUserIfPresent(user.id);
        }
      }
    },
  );

  test(
    'deleteUser removes a user and reports success',
    { tag: '@test-data' },
    async ({ graphqlApi, usersApi, apiTestUser }) => {
      await expect(graphqlApi.deleteUser(apiTestUser.id)).resolves.toBe(true);

      // The app reuses ids (max + 1), so a parallel test may already own this id again.
      // Assert on the deleted user's unique email instead.
      const search = await usersApi.searchUsersResponse({ email: apiTestUser.email });
      expect(search.status(), `user ${apiTestUser.email} still exists`).toBe(204);
    },
  );

  test(
    'deleteUser refuses to delete the protected seeded user',
    // Tagged @test-data because a regression here would delete a real record.
    { tag: '@test-data' },
    async ({ baseURL, graphqlApi, usersApi, testData }) => {
      assertTestDataTargetIsSafe(baseURL);
      const protectedId = testData.deleteProtectedUserId;

      await expect(graphqlApi.deleteUser(protectedId)).resolves.toBe(false);

      await expect(usersApi.getUserStatus(protectedId)).resolves.toBe(200);
    },
  );

  test('updateUser returns null for an id that does not exist', async ({ graphqlApi }) => {
    await expect(graphqlApi.updateUser(999_999_999, { name: 'Missing User' })).resolves.toBeNull();
  });

  /** Expected behaviour the app does not implement yet; each test passes once its defect is fixed. */
  test.describe('known app defects', () => {
    test.fail(
      'updateUser changes only the supplied fields',
      {
        tag: '@test-data',
        annotation: {
          type: 'app-defect',
          description:
            'app/graphql.js updateUser reads req.body, which does not exist in a resolver, so every update of an existing user errors',
        },
      },
      async ({ graphqlApi, usersApi, apiTestUser }) => {
        const updatedName = `${apiTestUser.name} Updated`;

        await graphqlApi.updateUser(apiTestUser.id, { name: updatedName });

        await expect(usersApi.getUser(apiTestUser.id)).resolves.toMatchObject({
          name: updatedName,
          email: apiTestUser.email,
          username: apiTestUser.username,
        });
      },
    );

    test.fail(
      'bulkAddUsers creates every user in the batch',
      {
        tag: '@test-data',
        annotation: {
          type: 'app-defect',
          description:
            'app/graphql.js bulkAddUsers calls newUsers.forEach(userData, ...), which throws "userData is not defined"',
        },
      },
      async ({ baseURL, graphqlApi, usersApi, testData }) => {
        assertTestDataTargetIsSafe(baseURL);
        const users = [
          createUniqueUserData(testData.newUser),
          createUniqueUserData(testData.newUser),
        ];

        try {
          const created = await graphqlApi.bulkAddUsers(users);

          expect(created.map((user) => user.email)).toEqual(users.map((user) => user.email));
        } finally {
          await usersApi.deleteUsersByEmail(users.map((user) => user.email));
        }
      },
    );

    test.fail(
      'rejects requests without an API key',
      {
        annotation: {
          type: 'app-defect',
          description:
            '/graphql has no API-key check, unlike /api/users, so anyone can read users (including passwords) and change data',
        },
      },
      async ({ request }) => {
        const result = await executeGraphql(request, graphqlDocuments.users);

        expect(result.status).toBe(401);
      },
    );
  });
});

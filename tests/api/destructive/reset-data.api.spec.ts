import { assertTestDataTargetIsSafe } from '../../utils/environment.ts';
import { expect, test } from '../fixtures.ts';

/**
 * Restoring the seeded data deletes every user added since, including those other tests are using,
 * so this spec runs in the `api-destructive` project, which starts only after every other project finishes.
 */
test.describe('PUT /users/reset-data', { tag: ['@api', '@test-data'] }, () => {
  test('restores the seeded users and removes added ones', async ({
    baseURL,
    usersApi,
    apiTestUser,
    testData,
  }) => {
    assertTestDataTargetIsSafe(baseURL);

    await expect(usersApi.resetData()).resolves.toBe('Data has been reset from backup.');

    await expect(usersApi.getUserStatus(apiTestUser.id)).resolves.toBe(404);
    const jane = await usersApi.searchUsers({ email: testData.existingUsers.jane.email });
    expect(jane).toEqual([expect.objectContaining(testData.existingUsers.jane)]);
    await expect(usersApi.getUserStatus(testData.deleteProtectedUserId)).resolves.toBe(200);
  });
});

/** Shared, typed user values used by UI and API tests. */
export type NewUserData = Readonly<{
  name: string;
  email: string;
  username: string;
  password: string;
}>;

/** A generated user payload paired with its server-assigned ID. */
export type ApiTestUser = NewUserData & Readonly<{ id: number }>;

/** A user record as the API returns it, used to build mocked API responses. */
export type MockApiUser = Readonly<{ id: number; name: string; email: string; username: string }>;

/** Stable reference data corresponding to the local app's seeded users. */
export const usersTestData = {
  existingUsers: {
    jane: {
      name: 'Jane Smith',
      email: 'janesmith@example.com',
      username: 'janesmith',
    },
  },
  /** Seeded user the API refuses to delete. */
  deleteProtectedUserId: 3,
  searches: {
    /** Lower-case fragment of seeded names (Jane Smith, Srinivasa Rao Imandi) that no other seeded field contains. */
    janeByPartialName: 'an',
    janeByEmailCaseInsensitive: 'JANESMITH@EXAMPLE.COM',
    noResults: 'no-such-user-998',
  },
  /**
   * Users served by mocked API responses. IDs are far above the seeded ones, so a request that
   * escapes its mock hits no real record. ID 0 is the admin account the screen never lists.
   */
  mockUsers: {
    admin: { id: 0, name: 'Admin Account', email: 'admin.account@example.test', username: 'admin' },
    alice: { id: 901, name: 'Mock Alice', email: 'mock.alice@example.test', username: 'mockalice' },
    bob: { id: 902, name: 'Mock Bob', email: 'mock.bob@example.test', username: 'mockbob' },
  },
  newUser: {
    name: 'Test User',
    email: 'test.user@example.com',
    username: 'testuser',
    password: 'TestPassword123!',
  },
} as const satisfies {
  existingUsers: {
    jane: Pick<NewUserData, 'name' | 'email' | 'username'>;
  };
  deleteProtectedUserId: number;
  searches: {
    janeByPartialName: string;
    janeByEmailCaseInsensitive: string;
    noResults: string;
  };
  mockUsers: Record<'admin' | 'alice' | 'bob', MockApiUser>;
  newUser: NewUserData;
};

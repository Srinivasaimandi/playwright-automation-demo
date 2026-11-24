/** Shared, typed user values used by UI and API tests. */
export type NewUserData = Readonly<{
  name: string;
  email: string;
  username: string;
  password: string;
}>;

/** A generated user payload paired with its server-assigned ID. */
export type ApiTestUser = NewUserData & Readonly<{ id: number }>;

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
  newUser: NewUserData;
};

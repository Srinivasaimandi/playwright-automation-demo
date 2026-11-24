import type { APIRequestContext } from '@playwright/test';
import { z } from 'zod';
import type { NewUserData } from '../../data/users.ts';
import type { LoginCredentials } from '../../utils/environment.ts';
import { parseApiResponse } from './parse-response.ts';
import type { ApiUser, GraphqlError } from './schemas.ts';
import { ApiUserSchema, ApiUsersSchema, GraphqlResponseSchema } from './schemas.ts';
import { requestApiKey } from './users-api-client.ts';

/** User fields selected by every GraphQL operation; the password is never requested. */
const userFields = 'id name email username';

/** GraphQL documents for the operations the app's schema defines. */
export const graphqlDocuments = {
  users: `query Users { users { ${userFields} } }`,
  user: `query User($id: Int!) { user(id: $id) { ${userFields} } }`,
  searchUsers: `query SearchUsers($name: String, $email: String) {
    searchUsers(name: $name, email: $email) { ${userFields} }
  }`,
  userCountWithIds: 'query UserCount { userCount users { id } }',
  createUser: `mutation CreateUser($name: String!, $email: String!, $username: String!, $password: String!) {
    createUser(name: $name, email: $email, username: $username, password: $password) { ${userFields} }
  }`,
  bulkAddUsers: `mutation BulkAddUsers($users: [NewUserInput!]!) {
    bulkAddUsers(users: $users) { ${userFields} }
  }`,
  updateUser: `mutation UpdateUser($id: Int!, $name: String, $email: String, $username: String, $password: String) {
    updateUser(id: $id, name: $name, email: $email, username: $username, password: $password) { ${userFields} }
  }`,
  deleteUser: 'mutation DeleteUser($id: Int!) { deleteUser(id: $id) }',
} as const;

/** A GraphQL response with its HTTP status, before the caller decides whether errors are expected. */
export type GraphqlResult = {
  status: number;
  data: Record<string, unknown> | null | undefined;
  errors: GraphqlError[];
};

/** Authenticated client for the app's `/graphql` endpoint. */
export class GraphqlClient {
  private readonly request: APIRequestContext;
  private readonly headers: Readonly<Record<string, string>>;

  private constructor(request: APIRequestContext, apiKey: string) {
    this.request = request;
    // The endpoint does not check this header today; sending it keeps the client working if it starts to.
    this.headers = { 'x-api-key': apiKey };
  }

  /**
   * Logs in through the REST API and returns a client that sends the resulting API key.
   * @param request Playwright's API request context.
   * @param credentials Account credentials from the selected environment.
   */
  static async login(request: APIRequestContext, credentials: LoginCredentials) {
    return new GraphqlClient(request, await requestApiKey(request, credentials));
  }

  /**
   * Sends a GraphQL operation and validates only the response envelope, so callers can assert on errors.
   * @param document The GraphQL query or mutation text.
   * @param variables Values for the document's variables.
   */
  async execute(document: string, variables: Record<string, unknown> = {}): Promise<GraphqlResult> {
    return executeGraphql(this.request, document, variables, this.headers);
  }

  /**
   * Sends an operation that must succeed and returns one validated field of its `data`.
   * @param document The GraphQL query or mutation text.
   * @param field The top-level `data` field to return.
   * @param schema Runtime schema for that field.
   * @param variables Values for the document's variables.
   */
  async fetchField<T>(
    document: string,
    field: string,
    schema: z.ZodType<T>,
    variables: Record<string, unknown> = {},
  ): Promise<T> {
    const result = await this.execute(document, variables);
    if (result.status !== 200 || result.errors.length > 0) {
      const messages = result.errors.map((error) => error.message).join('; ');
      throw new Error(`GraphQL ${field} returned ${result.status}: ${messages || 'no data'}`);
    }

    const parsed = schema.safeParse(result.data?.[field]);
    if (!parsed.success) {
      throw new Error(`GraphQL ${field} failed schema validation: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  /** Returns every user. */
  async listUsers(): Promise<ApiUser[]> {
    return this.fetchField(graphqlDocuments.users, 'users', ApiUsersSchema);
  }

  /** Returns the user with the given ID, or null when none exists. */
  async getUser(id: number): Promise<ApiUser | null> {
    return this.fetchField(graphqlDocuments.user, 'user', ApiUserSchema.nullable(), { id });
  }

  /** Searches users by optional, case-insensitive name and email fragments. */
  async searchUsers(params: { name?: string; email?: string }): Promise<ApiUser[]> {
    return this.fetchField(graphqlDocuments.searchUsers, 'searchUsers', ApiUsersSchema, params);
  }

  /** Reads `userCount` and the user IDs in a single operation, so both describe the same data. */
  async getUserCountWithIds(): Promise<{ userCount: number; ids: number[] }> {
    const result = await this.execute(graphqlDocuments.userCountWithIds);
    const data = z
      .object({
        userCount: z.number().int().nonnegative(),
        users: z.array(z.object({ id: z.number().int() })),
      })
      .parse(result.data);
    return { userCount: data.userCount, ids: data.users.map((user) => user.id) };
  }

  /** Creates a user and returns it. */
  async createUser(user: NewUserData): Promise<ApiUser> {
    return this.fetchField(graphqlDocuments.createUser, 'createUser', ApiUserSchema, user);
  }

  /** Creates every user in one mutation and returns those added. */
  async bulkAddUsers(users: readonly NewUserData[]): Promise<ApiUser[]> {
    return this.fetchField(graphqlDocuments.bulkAddUsers, 'bulkAddUsers', ApiUsersSchema, {
      users,
    });
  }

  /** Updates the supplied fields and returns the user, or null when the ID does not exist. */
  async updateUser(id: number, updates: Partial<NewUserData>): Promise<ApiUser | null> {
    return this.fetchField(graphqlDocuments.updateUser, 'updateUser', ApiUserSchema.nullable(), {
      id,
      ...updates,
    });
  }

  /** Deletes a user and returns whether the API reports that it did. */
  async deleteUser(id: number): Promise<boolean> {
    return this.fetchField(graphqlDocuments.deleteUser, 'deleteUser', z.boolean(), { id });
  }
}

/**
 * Sends a GraphQL operation with the given headers and validates the response envelope.
 * Exported for tests that must call the endpoint without the client's API key.
 */
export async function executeGraphql(
  request: APIRequestContext,
  document: string,
  variables: Record<string, unknown> = {},
  headers: Readonly<Record<string, string>> = {},
): Promise<GraphqlResult> {
  const response = await request.post('/graphql', {
    data: { query: document, variables },
    headers,
  });
  const status = response.status();
  const body = await parseApiResponse(response, GraphqlResponseSchema, status);
  return { status, data: body.data, errors: body.errors ?? [] };
}

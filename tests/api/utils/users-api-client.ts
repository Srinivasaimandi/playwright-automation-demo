import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { NewUserData } from '../../data/users.ts';
import { assertApiStatus, parseApiResponse } from './parse-response.ts';
import type { ApiUser } from './schemas.ts';
import { ApiKeySchema, ApiUserCountSchema, ApiUserSchema, ApiUsersSchema } from './schemas.ts';
import type { LoginCredentials } from '../../utils/environment.ts';

/** Authenticated client for the documented Users API endpoints. */
export class UsersApiClient {
  private readonly request: APIRequestContext;
  private readonly headers: Readonly<Record<string, string>>;

  private constructor(request: APIRequestContext, apiKey: string) {
    this.request = request;
    this.headers = { 'x-api-key': apiKey };
  }

  /**
   * Authenticates with the API and validates the returned API key.
   * @param request Playwright's API request context.
   * @param credentials Account credentials from the selected environment.
   */
  static async login(request: APIRequestContext, credentials: LoginCredentials) {
    const response = await request.post('/api/login', {
      data: credentials,
    });
    const { apiKey } = await parseApiResponse(response, ApiKeySchema);

    return new UsersApiClient(request, apiKey);
  }

  /** Returns users after validating each response record. */
  async listUsers(): Promise<ApiUser[]> {
    const response = await this.request.get('/api/users', { headers: this.headers });
    return parseApiResponse(response, ApiUsersSchema);
  }

  /** Searches users by optional name or email values. */
  async searchUsers(params: { name?: string; email?: string }): Promise<ApiUser[]> {
    const response = await this.request.get('/api/users/search', {
      headers: this.headers,
      params,
    });
    return parseApiResponse(response, ApiUsersSchema);
  }

  /** Returns the validated number of users stored by the API. */
  async getUserCount(): Promise<number> {
    const response = await this.request.get('/api/users/count', { headers: this.headers });
    const { count } = await parseApiResponse(response, ApiUserCountSchema);
    return count;
  }

  /** Returns a validated user record by ID. */
  async getUser(id: number): Promise<ApiUser> {
    const response = await this.getUserResponse(id);
    return parseApiResponse(response, ApiUserSchema);
  }

  /** Sends an authenticated user lookup and returns its unparsed response. */
  async getUserResponse(id: number): Promise<APIResponse> {
    return this.request.get(`/api/users/${id}`, { headers: this.headers });
  }

  /** Returns the HTTP status for a user lookup, including expected 404s. */
  async getUserStatus(id: number): Promise<number> {
    const response = await this.getUserResponse(id);
    return response.status();
  }

  /** Creates a user and validates the API's 201 response. */
  async createUser(data: NewUserData): Promise<ApiUser> {
    const response = await this.createUserResponse(data);
    return parseApiResponse(response, ApiUserSchema, 201);
  }

  /** Sends an authenticated create request and returns its unparsed response. */
  async createUserResponse(data: Partial<NewUserData>): Promise<APIResponse> {
    return this.request.post('/api/users', {
      data,
      headers: this.headers,
    });
  }

  /** Updates supplied fields and validates the returned user. */
  async updateUser(id: number, data: Partial<NewUserData>): Promise<ApiUser> {
    const response = await this.updateUserResponse(id, data);
    return parseApiResponse(response, ApiUserSchema);
  }

  /** Sends an authenticated update request and returns its unparsed response. */
  async updateUserResponse(id: number, data: Partial<NewUserData>): Promise<APIResponse> {
    return this.request.put(`/api/users/${id}`, {
      data,
      headers: this.headers,
    });
  }

  /** Deletes a user and requires the documented 204 response. */
  async deleteUser(id: number) {
    const response = await this.deleteUserResponse(id);
    assertApiStatus(response, 204);
  }

  /** Sends an authenticated delete request and returns its unparsed response. */
  async deleteUserResponse(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/users/${id}`, { headers: this.headers });
  }

  /** Cleans up a user while tolerating a prior successful deletion. */
  async deleteUserIfPresent(id: number) {
    const response = await this.deleteUserResponse(id);
    if (![204, 404].includes(response.status())) {
      assertApiStatus(response, 204);
    }
  }
}

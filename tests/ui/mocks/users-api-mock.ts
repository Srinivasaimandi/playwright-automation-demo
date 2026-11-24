import type { Page, Request, Route } from '@playwright/test';
import type { MockApiUser } from '../../data/users.ts';

/** URL matchers for the users-API endpoints the users screen calls. */
const endpoints = {
  /** `GET` lists users; `POST` creates one. */
  list: (url: URL) => url.pathname === '/api/users',
  /** `PUT` updates and `DELETE` removes the user with the ID in the path. */
  user: (url: URL) => /^\/api\/users\/\d+$/.test(url.pathname),
  /** `PUT` restores the seeded data. */
  resetData: (url: URL) => url.pathname === '/api/users/reset-data',
} as const;

export type UsersApiEndpoint = keyof typeof endpoints;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** A canned response: a JSON body, or a raw body with its content type. */
export type MockResponse = Parameters<Route['fulfill']>[0];

/** Network error codes accepted by `route.abort()`. */
export type NetworkErrorCode = Parameters<Route['abort']>[0];

/** A request the mock is holding back, to observe the page while the response is pending. */
export type HeldRequest = {
  /** Resolves with the request once the page has sent it. */
  received: Promise<Request>;
  /** Answers the held request with this response, or lets it reach the app when none is given. */
  release: (response?: MockResponse) => Promise<void>;
};

/**
 * Network mocks for the users API, built on `page.route()`.
 * Each mock matches one endpoint and HTTP method; every other request falls through to the next
 * route or the real app. Mocks added later take precedence over earlier ones.
 */
export class UsersApiMock {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Answers every matching request with a fixed response. */
  async fulfill(endpoint: UsersApiEndpoint, method: HttpMethod, response: MockResponse) {
    await this.intercept(endpoint, method, (route) => route.fulfill(response));
  }

  /** Answers user-list requests with these users. */
  async respondWithUsers(users: readonly MockApiUser[]) {
    await this.fulfill('list', 'GET', { status: 200, json: users });
  }

  /** Fails every matching request at the network level, as if the connection dropped. */
  async abort(
    endpoint: UsersApiEndpoint,
    method: HttpMethod,
    errorCode: NetworkErrorCode = 'failed',
  ) {
    await this.intercept(endpoint, method, (route) => route.abort(errorCode));
  }

  /**
   * Holds the next matching request until the test releases it, to check the page while a response is slow.
   * Later matching requests are not held.
   */
  async hold(endpoint: UsersApiEndpoint, method: HttpMethod): Promise<HeldRequest> {
    let resolveRoute: (route: Route) => void;
    const routed = new Promise<Route>((resolve) => {
      resolveRoute = resolve;
    });
    let isHolding = false;

    await this.intercept(endpoint, method, async (route) => {
      if (isHolding) {
        await route.fallback();
        return;
      }
      isHolding = true;
      resolveRoute(route);
    });

    return {
      received: routed.then((route) => route.request()),
      release: async (response) => {
        const route = await routed;
        await (response ? route.fulfill(response) : route.fallback());
      },
    };
  }

  /** Routes requests for one endpoint and method to a handler, passing all others on. */
  private async intercept(
    endpoint: UsersApiEndpoint,
    method: HttpMethod,
    handler: (route: Route) => Promise<void>,
  ) {
    const matches = endpoints[endpoint];
    await this.page.route(matches, async (route) => {
      if (route.request().method() !== method) {
        await route.fallback();
        return;
      }
      await handler(route);
    });
  }
}

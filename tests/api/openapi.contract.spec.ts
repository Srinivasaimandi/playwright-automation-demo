import type { z } from 'zod';
import { expect, test } from './fixtures.ts';
import type { OpenApiDocument } from './utils/openapi.ts';
import {
  compareWithZodSchema,
  fetchOpenApiDocument,
  getOperation,
  listOperations,
} from './utils/openapi.ts';
import { ApiErrorSchema, ApiKeySchema, ApiMessageSchema } from './utils/schemas.ts';
import { usersApiOperations } from './utils/users-api-client.ts';

/**
 * The Zod schema the suite validates each documented JSON response with, keyed `METHOD /path STATUS`.
 * Every response the OpenAPI document gives a JSON schema must appear here.
 */
const responseSchemas: Record<string, z.ZodType> = {
  'POST /login 200': ApiKeySchema,
  'POST /login 401': ApiErrorSchema,
  'PUT /users/reset-data 200': ApiMessageSchema,
  'PUT /users/reset-data 500': ApiErrorSchema,
};

/**
 * Non-authentication statuses the suite has seen each operation return. 401 for a missing or
 * invalid API key is left out: the document declares that through its global security scheme.
 */
const observedStatuses: Record<(typeof usersApiOperations)[number], string[]> = {
  'POST /login': ['200', '401'],
  'POST /logout': ['204'],
  'GET /users': ['200', '204'],
  'POST /users': ['201', '400'],
  'GET /users/search': ['200', '204'],
  'GET /users/count': ['200'],
  'PUT /users/reset-data': ['200'],
  'POST /users/bulk': ['201', '400'],
  'GET /users/{id}': ['200', '404'],
  'PUT /users/{id}': ['200', '404'],
  'DELETE /users/{id}': ['204', '403', '404'],
};

/** Checks the published OpenAPI document against the clients and schemas the suite relies on. */
test.describe('Users API OpenAPI contract', { tag: ['@api', '@contract'] }, () => {
  let document: OpenApiDocument;

  test.beforeEach(async ({ request }) => {
    document = await fetchOpenApiDocument(request);
  });

  test('documents exactly the operations the API client calls', () => {
    expect(listOperations(document).sort()).toEqual([...usersApiOperations].sort());
  });

  test('documents POST /login as not needing an API key', () => {
    expect(getOperation(document, 'POST /login').security).toEqual([]);
  });

  test('documents the x-api-key header the clients authenticate with', () => {
    expect(document.components.securitySchemes.ApiKeyAuth).toMatchObject({
      type: 'apiKey',
      in: 'header',
      name: 'x-api-key',
    });
    expect(document.security).toContainEqual({ ApiKeyAuth: [] });
  });

  test('gives every documented JSON response a schema the tests validate with', () => {
    const documented = listOperations(document).flatMap((operation) =>
      Object.entries(getOperation(document, operation).responses)
        .filter(([, response]) => response.content?.['application/json']?.schema)
        .map(([status]) => `${operation} ${status}`),
    );

    expect(documented.sort()).toEqual(Object.keys(responseSchemas).sort());
  });

  test('describes each documented response with the same fields as the test schema', () => {
    for (const [key, schema] of Object.entries(responseSchemas)) {
      const [method, path, status] = key.split(' ');
      const documented = getOperation(document, `${method} ${path}`).responses[status]?.content?.[
        'application/json'
      ]?.schema;

      expect(documented, `${key} has no documented JSON schema`).toBeDefined();
      expect(compareWithZodSchema(documented!, schema), key).toEqual([]);
    }
  });

  /** Gaps in the document that the app should fix; each test passes once its gap is closed. */
  test.describe('known documentation gaps', () => {
    test.fail(
      'documents every status the API returns',
      {
        annotation: {
          type: 'app-defect',
          description:
            'The document omits 204 for GET /users and GET /users/search, and 403 for DELETE /users/{id}',
        },
      },
      () => {
        const undocumented = Object.entries(observedStatuses).flatMap(([operation, statuses]) => {
          const documented = Object.keys(getOperation(document, operation).responses);
          return statuses
            .filter((status) => !documented.includes(status))
            .map((status) => `${operation} ${status}`);
        });

        expect(undocumented).toEqual([]);
      },
    );
  });
});

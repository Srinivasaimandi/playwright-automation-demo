import type { APIResponse } from '@playwright/test';
import type { z } from 'zod';

/** Fails with endpoint context when an API response has an unexpected status. */
export function assertApiStatus(response: APIResponse, expectedStatus: number) {
  if (response.status() !== expectedStatus) {
    const path = new URL(response.url()).pathname;
    throw new Error(`${path} returned ${response.status()}; expected ${expectedStatus}`);
  }
}

/**
 * Checks the expected status and parses a JSON response with a Zod schema.
 * @param response Playwright's response from the API request.
 * @param schema Runtime schema for the response payload.
 * @param expectedStatus HTTP status expected for the response.
 * @returns The schema-validated and typed response payload.
 */
export async function parseApiResponse<T>(
  response: APIResponse,
  schema: z.ZodType<T>,
  expectedStatus = 200,
): Promise<T> {
  assertApiStatus(response, expectedStatus);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    const path = new URL(response.url()).pathname;
    throw new Error(`${path} returned invalid JSON`, { cause: error });
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.map(String).join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    const path = new URL(response.url()).pathname;
    throw new Error(`${path} response schema validation failed: ${issues}`);
  }

  return result.data;
}

import { randomUUID } from 'node:crypto';
import type { NewUserData } from './users.ts';

/** Creates distinct user data from a template for an isolated test. */
export function createUniqueUserData(template: NewUserData): NewUserData {
  const uniqueId = randomUUID();

  return {
    ...template,
    name: `Playwright ${uniqueId.slice(0, 8)}`,
    email: `${uniqueId}@example.test`,
    username: `pw_${uniqueId.replaceAll('-', '')}`,
  };
}

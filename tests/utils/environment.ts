import process from 'node:process';

/** Login values read from the selected environment or process environment. */
export type LoginCredentials = Readonly<{
  username: string;
  password: string;
}>;

/** Returns login credentials when both values are configured. */
export function getLoginCredentials(): LoginCredentials | undefined {
  const username = process.env.LOGIN_USERNAME;
  const password = process.env.LOGIN_PASSWORD;

  if (!username || !password) {
    return undefined;
  }

  return { username, password };
}

/**
 * Prevents API test-data mutations outside loopback and explicitly allowed test hosts.
 * @param baseURL The configured application URL for this test run.
 */
export function assertTestDataTargetIsSafe(baseURL: string | undefined) {
  if (!baseURL) {
    throw new Error('BASE_URL is required to create API test data');
  }

  const environment = process.env.TEST_ENV ?? 'local';
  const hostname = new URL(baseURL).hostname.toLowerCase();
  const isLoopback = ['localhost', '127.0.0.1', '::1'].includes(hostname);
  const allowedTestHosts = (process.env.TEST_DATA_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (environment === 'local' && isLoopback) {
    return;
  }

  if (environment === 'test' && allowedTestHosts.includes(hostname)) {
    return;
  }

  throw new Error(
    `API test data is restricted to loopback local targets or allowlisted TEST_ENV=test hosts; "${hostname}" is not allowed.`,
  );
}

// Force-updates the `app` submodule to the latest commit of its tracked branch before a local test run.
// Local edits in app/ are always discarded so tests run against the real upstream app.
// Never fails the run for network problems: if the fetch is not possible (offline, slow network),
// it prints a warning and the tests use the app commit that is already checked out (with local edits discarded).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';

const appDir = 'app';
const fetchTimeoutMs = Number(process.env.APP_UPDATE_TIMEOUT_MS ?? 15_000);

const log = (message) => console.log(`[update-app] ${message}`);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    ...options,
  });
  if (result.error || result.status !== 0) {
    const reason =
      result.error?.code === 'ETIMEDOUT'
        ? `timed out after ${options.timeout} ms`
        : (result.error?.message ??
          result.stderr?.trim().split('\n').pop() ??
          `exit code ${result.status}`);
    return { ok: false, reason };
  }
  return { ok: true, output: result.stdout.trim() };
}

const git = (...args) => run('git', args);

function keepExisting(reason) {
  log(`Skipping app update (${reason}). Using existing app code.`);
  process.exit(0);
}

if (process.env.CI) {
  keepExisting('CI updates the submodule in the workflow');
}
if (process.env.SKIP_APP_UPDATE) {
  keepExisting('SKIP_APP_UPDATE is set');
}

if (!existsSync(`${appDir}/.git`)) {
  const init = git('submodule', 'update', '--init', appDir);
  if (!init.ok) {
    console.error(`[update-app] app/ is not checked out and could not be cloned: ${init.reason}`);
    process.exit(1);
  }
}

// Discard any local edits in app/ (tracked changes and untracked files; ignored files such as node_modules are kept).
const dirty = git('-C', appDir, 'status', '--porcelain');
if (!dirty.ok) keepExisting(`could not read app status: ${dirty.reason}`);
if (dirty.output) {
  log('Discarding local changes in app/:');
  for (const line of dirty.output.split('\n')) log(`  ${line}`);
  const reset = git('-C', appDir, 'reset', '--hard', '--quiet', 'HEAD');
  const clean = git('-C', appDir, 'clean', '-fd', '--quiet');
  if (!reset.ok || !clean.ok) {
    console.error(
      `[update-app] Could not discard local changes in app/: ${reset.reason ?? clean.reason}`,
    );
    process.exit(1);
  }
}

const branchSetting = git('config', '-f', '.gitmodules', `submodule.${appDir}.branch`);
const branch = branchSetting.ok && branchSetting.output ? branchSetting.output : 'main';

const before = git('-C', appDir, 'rev-parse', 'HEAD').output;

const fetch = run('git', ['-C', appDir, 'fetch', '--no-tags', 'origin', branch], {
  timeout: fetchTimeoutMs,
});
if (!fetch.ok) keepExisting(`fetch failed, probably offline: ${fetch.reason}`);

const checkout = git('-C', appDir, 'checkout', '--quiet', '--force', '--detach', 'FETCH_HEAD');
if (!checkout.ok) keepExisting(`checkout failed: ${checkout.reason}`);

const after = git('-C', appDir, 'rev-parse', 'HEAD').output;
if (before === after) {
  log(`App is already at the latest ${branch} (${after.slice(0, 7)}).`);
  process.exit(0);
}
log(`Updated app ${before.slice(0, 7)} -> ${after.slice(0, 7)} (latest ${branch}).`);

// Reinstall app dependencies only when they changed, or when they were never installed.
const depsChanged = !git(
  '-C',
  appDir,
  'diff',
  '--quiet',
  before,
  after,
  '--',
  'package.json',
  'package-lock.json',
).ok;
if (depsChanged || !existsSync(`${appDir}/node_modules`)) {
  log('App dependencies changed. Running npm ci in app/ ...');
  const install = run('npm', ['ci', '--prefix', appDir], { stdio: 'inherit' });
  if (!install.ok) {
    log(`npm ci failed (${install.reason}). Restoring previous app commit ${before.slice(0, 7)}.`);
    git('-C', appDir, 'checkout', '--quiet', '--detach', before);
  }
}

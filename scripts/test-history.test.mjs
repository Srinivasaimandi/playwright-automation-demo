import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePassRate,
  createEmptyHistory,
  createTestId,
  getHistoryReportPaths,
  getTestCategory,
  getCumulativeStats,
  mergeTestRun,
  renderHistoryReport,
} from './test-history.mjs';

function run(id, tests) {
  return {
    id,
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:01:00.000Z',
    environment: 'local',
    runnerStatus: 'passed',
    tests,
  };
}

function result(id, status, overrides = {}) {
  return {
    id,
    project: 'chromium',
    file: 'tests/example.spec.ts',
    title: 'suite › test',
    tags: [],
    status,
    flaky: false,
    retries: 0,
    ...overrides,
  };
}

test('stable test IDs are based on project, file, and title path', () => {
  const first = createTestId('chromium', 'tests/a.spec.ts', ['suite', 'example']);
  const sameTest = createTestId('chromium', 'tests/a.spec.ts', ['suite', 'example']);
  const otherProject = createTestId('firefox', 'tests/a.spec.ts', ['suite', 'example']);

  assert.equal(first, sameTest);
  assert.notEqual(first, otherProject);
});

test('categorizes API, UI, and end-to-end specs', () => {
  assert.equal(getTestCategory('tests/api/users.api.spec.ts'), 'api');
  assert.equal(getTestCategory('tests/ui/users.spec.ts'), 'ui');
  assert.equal(getTestCategory('tests/ui/e2e/users-journey.spec.ts'), 'e2e');
});

test('pass rate excludes skipped tests and accumulates outcomes across runs', () => {
  const firstRun = mergeTestRun(
    createEmptyHistory(),
    run('run-1', [
      result('stable', 'passed'),
      result('stable-fail', 'failed'),
      result('stable-skip', 'skipped'),
    ]),
  );
  const secondRun = mergeTestRun(
    firstRun,
    run('run-2', [
      result('stable', 'passed'),
      result('stable-fail', 'passed'),
      result('stable-skip', 'skipped'),
    ]),
  );

  assert.equal(calculatePassRate(3, 1), 75);
  assert.equal(calculatePassRate(0, 0), null);
  assert.equal(secondRun.tests.stable.totalRuns, 2);
  assert.equal(secondRun.tests['stable-fail'].failed, 1);
  assert.equal(secondRun.tests['stable-fail'].passed, 1);
  assert.equal(secondRun.tests['stable-skip'].skipped, 2);
  assert.deepEqual(getCumulativeStats(secondRun), {
    total: 6,
    passed: 3,
    failed: 1,
    skipped: 2,
    flaky: 0,
  });
});

test('a flaky final pass counts as passed and is tracked separately', () => {
  const history = mergeTestRun(
    createEmptyHistory(),
    run('run-1', [result('flaky-test', 'passed', { flaky: true, retries: 1 })]),
  );

  assert.equal(history.tests['flaky-test'].passed, 1);
  assert.equal(history.tests['flaky-test'].flaky, 1);
  assert.equal(history.runs[0].passRate, 100);
});

test('stores test tags and renders filter controls for category, status, tag, and search', () => {
  const history = mergeTestRun(
    createEmptyHistory(),
    run('run-1', [
      result('tagged', 'passed', { file: 'tests/ui/example.spec.ts', tags: ['@api', '@smoke'] }),
    ]),
  );
  const html = renderHistoryReport(history, { page: 'tests' });

  assert.deepEqual(history.tests.tagged.tags, ['@api', '@smoke']);
  assert.equal(history.tests.tagged.category, 'ui');
  assert.match(html, /<h1>Users App Cumulative Report<\/h1>/);
  assert.doesNotMatch(html, /report-subtitle|Cumulative test history report/);
  assert.match(html, /id="scenario-search"/);
  assert.match(html, /id="category-filter"/);
  assert.match(html, /id="status-filter"/);
  assert.match(html, /id="tag-filter"/);
  assert.match(html, /<option value="@api">@api<\/option>/);
  assert.match(html, /data-tags="%40api %40smoke"/);
});

test('renders statistics, per-test history, and recent runs as linked pages', () => {
  const history = mergeTestRun(createEmptyHistory(), run('run-1', [result('scenario', 'passed')]));
  const paths = getHistoryReportPaths('/reports/cumulative.html');
  const links = Object.fromEntries(
    Object.entries(paths).map(([page, path]) => [page, path.split('/').at(-1)]),
  );
  const overview = renderHistoryReport(history, { links });
  const tests = renderHistoryReport(history, { page: 'tests', links });
  const runs = renderHistoryReport(history, { page: 'runs', links });

  assert.deepEqual(paths, {
    overview: '/reports/cumulative.html',
    tests: '/reports/cumulative-tests.html',
    runs: '/reports/cumulative-runs.html',
  });
  assert.match(overview, />Metrics<\/a>/);
  assert.match(
    overview,
    /<footer class="stats-footer">\s*<p>Pass rate uses final outcomes[^<]*flaky\.<br>History, last updated/,
  );
  assert.match(overview, /\.stats-footer \{[^}]*font-size: \.82rem/);
  assert.match(overview, /\.cards \{[^}]*justify-content: center/s);
  assert.match(overview, /\.cards \{[^}]*max-width: 1590px/);
  assert.match(overview, /\.dashboard-grid \{[^}]*max-width: 1590px/);
  assert.match(overview, /<main class="stats-landing">/);
  assert.match(
    overview,
    /main\.stats-landing \{[^}]*height: calc\(100svh - 4rem\);[^}]*overflow: hidden/,
  );
  assert.match(overview, /\.report-header \{[^}]*position: sticky/);
  assert.match(
    overview,
    /\.stats-content \{[^}]*justify-content: space-evenly;[^}]*align-items: center/s,
  );
  assert.match(overview, /font-size: clamp\([^;]*2\.15rem\)/);
  assert.match(overview, /Latest run pass rate/);
  assert.match(overview, /Flaky outcomes \(all-time\)/);
  assert.match(overview, /Pass-rate trend/);
  assert.match(overview, /Latest run outcomes/);
  assert.match(
    overview,
    /<svg class="pass-rate-chart"[^>]*aria-label="Pass rate trend for the latest 1 run"/,
  );
  assert.match(overview, /role="img" aria-label="Passed 1, Failed 0, Skipped 0"/);
  assert.doesNotMatch(overview, /<h2>Per-test history<\/h2>|<h2>Recent runs<\/h2>/);
  assert.match(tests, /<h2>Per-test history<\/h2>/);
  assert.match(tests, /id="scenario-search"/);
  assert.doesNotMatch(tests, /<h2>Recent runs<\/h2>/);
  assert.match(runs, /<h2>Recent runs<\/h2>/);
  assert.doesNotMatch(runs, /<h2>Per-test history<\/h2>|id="scenario-search"/);
  assert.doesNotMatch(tests, /class="stats-footer"/);
  assert.doesNotMatch(runs, /class="stats-footer"/);
  for (const html of [overview, tests, runs]) {
    assert.match(html, /href="cumulative\.html"/);
    assert.match(html, /href="cumulative-tests\.html"/);
    assert.match(html, /href="cumulative-runs\.html"/);
  }
});

test('shows empty states when cumulative history has no runs', () => {
  const html = renderHistoryReport(createEmptyHistory());

  assert.match(html, /No completed runs with a pass rate yet/);
  assert.match(html, /No completed run data yet/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test('the HTML report escapes test titles', () => {
  const history = mergeTestRun(
    createEmptyHistory(),
    run('run-1', [result('escaped', 'passed', { title: '<script>alert(1)</script>' })]),
  );

  const html = renderHistoryReport(history, { page: 'tests' });
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});

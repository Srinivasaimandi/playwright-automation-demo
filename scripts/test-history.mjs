import { createHash } from 'node:crypto';
import { basename, extname } from 'node:path';

const HISTORY_VERSION = 1;
const MAX_RUNS = 100;
const MAX_RECENT_RESULTS = 30;

/** Creates the initial history store. */
export function createEmptyHistory() {
  return {
    schemaVersion: HISTORY_VERSION,
    updatedAt: null,
    runs: [],
    tests: {},
  };
}

/** Builds a stable test key that does not change when source lines move. */
export function createTestId(project, file, titlePath) {
  return createHash('sha256')
    .update([project, file, ...titlePath].join('\0'))
    .digest('hex');
}

/** Groups a test by its source folder for report filtering. */
export function getTestCategory(file) {
  const normalizedFile = file.replaceAll('\\', '/');
  if (normalizedFile.startsWith('tests/api/')) {
    return 'api';
  }
  if (normalizedFile.startsWith('tests/ui/e2e/')) {
    return 'e2e';
  }
  if (normalizedFile.startsWith('tests/ui/')) {
    return 'ui';
  }
  return 'other';
}

/** Returns the pass rate, excluding skipped tests from its denominator. */
export function calculatePassRate(passed, failed) {
  const executed = passed + failed;
  return executed === 0 ? null : Math.round((passed / executed) * 1000) / 10;
}

/** Adds one completed test run to the cumulative history. */
export function mergeTestRun(history, run) {
  if (history.schemaVersion !== HISTORY_VERSION || !Array.isArray(history.runs) || !history.tests) {
    throw new Error('Unsupported or invalid cumulative test history format.');
  }

  const next = {
    ...history,
    updatedAt: run.completedAt,
    runs: [...history.runs],
    tests: { ...history.tests },
  };
  const stats = { total: run.tests.length, passed: 0, failed: 0, skipped: 0, flaky: 0 };

  for (const result of run.tests) {
    if (!['passed', 'failed', 'skipped'].includes(result.status)) {
      throw new Error(`Unsupported test status "${result.status}" in cumulative history.`);
    }

    stats[result.status] += 1;
    if (result.flaky) {
      stats.flaky += 1;
    }

    const previous = next.tests[result.id] ?? {
      id: result.id,
      project: result.project,
      file: result.file,
      title: result.title,
      totalRuns: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      recent: [],
    };

    const updated = {
      ...previous,
      project: result.project,
      file: result.file,
      title: result.title,
      category: result.category ?? getTestCategory(result.file),
      tags: [...new Set(result.tags ?? previous.tags ?? [])].sort(),
      totalRuns: previous.totalRuns + 1,
      passed: previous.passed + Number(result.status === 'passed'),
      failed: previous.failed + Number(result.status === 'failed'),
      skipped: previous.skipped + Number(result.status === 'skipped'),
      flaky: previous.flaky + Number(result.flaky),
      lastStatus: result.status,
      lastFlaky: Boolean(result.flaky),
      lastRunId: run.id,
      lastRunAt: run.completedAt,
      recent: [
        ...previous.recent,
        { runId: run.id, status: result.status, flaky: result.flaky },
      ].slice(-MAX_RECENT_RESULTS),
    };

    next.tests[result.id] = updated;
  }

  next.runs = [
    ...next.runs,
    {
      id: run.id,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      environment: run.environment,
      runnerStatus: run.runnerStatus,
      ...stats,
      passRate: calculatePassRate(stats.passed, stats.failed),
    },
  ].slice(-MAX_RUNS);

  return next;
}

/** Totals test outcomes across the all-time per-test counters. */
export function getCumulativeStats(history) {
  return Object.values(history.tests).reduce(
    (totals, test) => ({
      total: totals.total + test.totalRuns,
      passed: totals.passed + test.passed,
      failed: totals.failed + test.failed,
      skipped: totals.skipped + test.skipped,
      flaky: totals.flaky + test.flaky,
    }),
    { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 },
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatRate(rate) {
  return rate === null ? '—' : `${rate.toFixed(1)}%`;
}

function statusLabel(status) {
  return status === 'passed' ? 'Passed' : status === 'failed' ? 'Failed' : 'Skipped';
}

function renderPassRateChart(runs) {
  const points = runs
    .map((run, index) => ({ run, index }))
    .filter(({ run }) => Number.isFinite(run.passRate))
    .slice(-12);

  if (points.length === 0) {
    return '<p class="empty-state">No completed runs with a pass rate yet.</p>';
  }

  const chart = { left: 52, right: 620, top: 18, bottom: 184 };
  const xFor = (index) =>
    points.length === 1
      ? (chart.left + chart.right) / 2
      : chart.left + (index / (points.length - 1)) * (chart.right - chart.left);
  const yFor = (rate) => chart.top + ((100 - rate) / 100) * (chart.bottom - chart.top);
  const coordinates = points
    .map(({ run }, index) => `${xFor(index)},${yFor(run.passRate)}`)
    .join(' ');
  const gridLines = [100, 75, 50, 25, 0]
    .map((rate) => {
      const y = yFor(rate);
      return `<g class="chart-gridline"><line x1="${chart.left}" y1="${y}" x2="${chart.right}" y2="${y}"></line><text x="${chart.left - 10}" y="${y + 4}" text-anchor="end">${rate}%</text></g>`;
    })
    .join('');
  const markers = points
    .map(({ run }, index) => {
      const label = `${run.completedAt}: ${formatRate(run.passRate)}`;
      return `<circle class="chart-point" cx="${xFor(index)}" cy="${yFor(run.passRate)}" r="5"><title>${escapeHtml(label)}</title></circle>`;
    })
    .join('');
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  const runLabels = labelIndexes
    .map((index) => {
      const x = xFor(index);
      const anchor =
        points.length === 1
          ? 'middle'
          : index === 0
            ? 'start'
            : index === points.length - 1
              ? 'end'
              : 'middle';
      return `<text class="chart-axis-label" x="${x}" y="218" text-anchor="${anchor}">Run ${points[index].index + 1}</text>`;
    })
    .join('');

  const runWord = points.length === 1 ? 'run' : 'runs';
  return `<svg class="pass-rate-chart" viewBox="0 0 640 240" role="img" aria-label="Pass rate trend for the latest ${points.length} ${runWord}">
    ${gridLines}
    <polyline class="chart-line" points="${coordinates}"></polyline>
    ${markers}
    ${runLabels}
  </svg>`;
}

function renderLatestRunOutcomes(run) {
  if (!run) {
    return '<p class="empty-state">No completed run data yet.</p>';
  }

  const outcomes = [
    { status: 'passed', label: 'Passed', count: run.passed },
    { status: 'failed', label: 'Failed', count: run.failed },
    { status: 'skipped', label: 'Skipped', count: run.skipped },
  ];
  const total = outcomes.reduce((sum, outcome) => sum + outcome.count, 0);
  if (total === 0) {
    return '<p class="empty-state">The latest run has no test outcomes.</p>';
  }

  const accessibleSummary = outcomes.map(({ label, count }) => `${label} ${count}`).join(', ');
  const segments = outcomes
    .filter(({ count }) => count > 0)
    .map(
      ({ status, count }) =>
        `<span class="outcome-segment ${status}" style="width: ${(count / total) * 100}%"></span>`,
    )
    .join('');
  const legend = outcomes
    .map(
      ({ status, label, count }) => `
    <li><span class="legend-swatch ${status}"></span><span>${label}</span><strong>${count}</strong></li>`,
    )
    .join('');

  return `<div class="outcome-bar" role="img" aria-label="${escapeHtml(accessibleSummary)}">${segments}</div>
    <ul class="outcome-legend">${legend}</ul>`;
}

/** Returns the landing page and companion report page paths. */
export function getHistoryReportPaths(reportPath) {
  const extension = extname(reportPath) || '.html';
  const basePath = extname(reportPath) ? reportPath.slice(0, -extension.length) : reportPath;
  return {
    overview: reportPath,
    tests: `${basePath}-tests${extension}`,
    runs: `${basePath}-runs${extension}`,
  };
}

/** Produces a standalone, dependency-free HTML report. */
export function renderHistoryReport(history, { page = 'overview', links } = {}) {
  const pageNames = {
    overview: 'Metrics',
    tests: 'Per-test history',
    runs: 'Recent runs',
  };
  if (!Object.hasOwn(pageNames, page)) {
    throw new Error(`Unsupported cumulative report page "${page}".`);
  }

  const reportLinks = links ?? {
    overview: 'test-history-report.html',
    tests: 'test-history-report-tests.html',
    runs: 'test-history-report-runs.html',
  };
  const cumulative = getCumulativeStats(history);
  const latestRun = history.runs.at(-1);
  const cumulativeRate = calculatePassRate(cumulative.passed, cumulative.failed);
  const latestRate = latestRun?.passRate ?? null;
  const allTags = [
    ...new Set(Object.values(history.tests).flatMap((test) => test.tags ?? [])),
  ].sort();
  const tagOptions = allTags
    .map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`)
    .join('');
  const testRows = Object.values(history.tests)
    .sort((left, right) => {
      const statusOrder = { failed: 0, passed: 1, skipped: 2 };
      return (
        statusOrder[left.lastStatus] - statusOrder[right.lastStatus] ||
        (calculatePassRate(left.passed, left.failed) ?? 101) -
          (calculatePassRate(right.passed, right.failed) ?? 101) ||
        left.title.localeCompare(right.title)
      );
    })
    .map((test) => {
      const category = test.category ?? getTestCategory(test.file);
      const tags = [...new Set(test.tags ?? [])].sort();
      const trend = test.recent
        .map((result) => {
          const label = `${result.runId}: ${statusLabel(result.status)}${result.flaky ? ' (flaky)' : ''}`;
          const trendStatus = result.flaky ? 'flaky' : result.status;
          return `<span class="trend ${trendStatus}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">●</span>`;
        })
        .join('');
      const state = test.lastRunId === latestRun?.id ? 'Current run' : 'Not run recently';
      const searchable = [test.title, test.file, test.project, category, ...tags]
        .join(' ')
        .toLowerCase();
      const encodedTags = tags.map((tag) => encodeURIComponent(tag)).join(' ');

      return `<tr data-test-row data-category="${escapeHtml(category)}" data-status="${escapeHtml(test.lastStatus)}"
        data-flaky="${Boolean(test.lastFlaky)}" data-tags="${escapeHtml(encodedTags)}" data-search="${escapeHtml(searchable)}">
        <td><span class="badge ${escapeHtml(test.lastStatus)}">${statusLabel(test.lastStatus)}</span><small>${state}</small></td>
        <td><strong>${escapeHtml(test.title)}</strong><small>${escapeHtml(test.file)}</small></td>
        <td><span class="category">${escapeHtml(category.toUpperCase())}</span></td>
        <td>${escapeHtml(test.project)}</td>
        <td class="rate">${formatRate(calculatePassRate(test.passed, test.failed))}</td>
        <td>${test.passed}</td>
        <td>${test.failed}</td>
        <td>${test.skipped}</td>
        <td>${test.flaky}</td>
        <td class="trend-cell">${trend || '<span class="muted">No runs</span>'}</td>
      </tr>`;
    })
    .join('');

  const runRows = [...history.runs]
    .reverse()
    .map(
      (run) => `<tr>
    <td>${escapeHtml(run.completedAt)}</td>
    <td>${escapeHtml(run.environment)}</td>
    <td>${run.total}</td>
    <td>${run.passed}</td>
    <td>${run.failed}</td>
    <td>${run.skipped}</td>
    <td>${run.flaky}</td>
    <td>${formatRate(run.passRate)}</td>
  </tr>`,
    )
    .join('');
  const passRateChart = renderPassRateChart(history.runs);
  const latestRunOutcomes = renderLatestRunOutcomes(latestRun);
  const trendRunCount = Math.min(
    12,
    history.runs.filter((run) => Number.isFinite(run.passRate)).length,
  );
  const navigation = Object.entries(pageNames)
    .map(([key, label]) => {
      const current = page === key ? ' aria-current="page"' : '';
      return `<a href="${escapeHtml(encodeURI(basename(reportLinks[key])))}"${current}>${label}</a>`;
    })
    .join('');
  const statisticsContent = `
      <div class="stats-content">
        <div class="cards">
          <div class="card"><span>Latest run pass rate</span><strong>${formatRate(latestRate)}</strong></div>
          <div class="card"><span>All-time pass rate</span><strong>${formatRate(cumulativeRate)}</strong></div>
          <div class="card"><span>Known test cases</span><strong>${Object.keys(history.tests).length}</strong></div>
          <div class="card"><span>Flaky outcomes (all-time)</span><strong>${cumulative.flaky}</strong></div>
        </div>
        <div class="dashboard-grid">
          <section class="chart-panel">
            <h2>Pass-rate trend</h2>
            <p class="chart-caption">Latest ${trendRunCount} ${trendRunCount === 1 ? 'run' : 'runs'} with a pass rate</p>
            ${passRateChart}
          </section>
          <section class="chart-panel">
            <h2>Latest run outcomes</h2>
            <p class="chart-caption">${
              latestRun
                ? `${escapeHtml(latestRun.environment)} · ${escapeHtml(latestRun.completedAt)}`
                : 'No completed runs yet'
            }</p>
            ${latestRunOutcomes}
          </section>
        </div>
      </div>
      <footer class="stats-footer">
        <p>Pass rate uses final outcomes with skipped tests excluded, and passes after retries are tracked as flaky.<br>History, last updated ${escapeHtml(history.updatedAt ?? 'never')}, retains up to 100 run summaries, 30 outcomes per test, and all-time per-test totals.</p>
      </footer>`;
  const testsContent = `
      <section>
        <h2>Per-test history</h2>
        <div class="filters" aria-label="Filter scenarios">
          <label for="scenario-search">Search scenarios
            <input id="scenario-search" type="search" placeholder="Search any scenario, file, project, or tag">
          </label>
          <label for="category-filter">Category
            <select id="category-filter">
              <option value="all">All categories</option>
              <option value="ui">UI</option>
              <option value="api">API</option>
              <option value="e2e">E2E</option>
            </select>
          </label>
          <label for="status-filter">Last status
            <select id="status-filter">
              <option value="all">All statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
              <option value="flaky">Flaky</option>
            </select>
          </label>
          <label for="tag-filter">Tag
            <select id="tag-filter">
              <option value="all">All tags</option>
              ${tagOptions}
            </select>
          </label>
          <button type="button" id="reset-filters">Reset filters</button>
        </div>
        <p id="result-count" aria-live="polite"></p>
        <table>
          <thead><tr><th>Last status</th><th>Test</th><th>Category</th><th>Project</th><th>Pass rate</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Flaky</th><th>Recent runs</th></tr></thead>
          <tbody>
            ${testRows}
            <tr id="no-results" hidden><td colspan="10">No scenarios match the selected filters.</td></tr>
          </tbody>
        </table>
      </section>`;
  const runsContent = `
      <section>
        <h2>Recent runs</h2>
        <table>
          <thead><tr><th>Completed</th><th>Environment</th><th>Tests</th><th>Pass</th><th>Fail</th><th>Skip</th><th>Flaky</th><th>Pass rate</th></tr></thead>
          <tbody>${runRows || '<tr><td colspan="8">No completed runs yet.</td></tr>'}</tbody>
        </table>
      </section>`;
  const pageContent = {
    overview: statisticsContent,
    tests: testsContent,
    runs: runsContent,
  }[page];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Users App Cumulative Report</title>
    <style>
      :root { color-scheme: light; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #172033; background: #f4f6fa; }
      body { margin: 0; padding: 2rem; }
      main { max-width: 1600px; margin: auto; }
      h1, h2 { margin: 0 0 1rem; }
      main.stats-landing { height: calc(100vh - 4rem); height: calc(100svh - 4rem); display: flex; flex-direction: column; overflow: hidden; }
      .report-header { position: sticky; top: 0; z-index: 20; display: flex; flex: 0 0 auto; justify-content: space-between; align-items: center; gap: 1.5rem; margin-bottom: clamp(.5rem, 2vh, 1.5rem); padding: .8rem 0; border-bottom: 1px solid #dfe4ec; background: rgb(244 246 250 / 94%); backdrop-filter: blur(12px); }
      .report-header h1 { margin: 0; }
      .report-nav { display: flex; flex-wrap: wrap; gap: .4rem; }
      .report-nav a { padding: .55rem .75rem; border-radius: 6px; color: #34445e; font-weight: 600; text-decoration: none; white-space: nowrap; }
      .report-nav a:hover, .report-nav a[aria-current="page"] { background: #e6ebf4; color: #172033; }
      p, small, .muted { color: #657187; }
      .stats-content { display: flex; min-height: 0; flex: 1; flex-direction: column; justify-content: space-evenly; align-items: center; gap: clamp(.4rem, 1.5vh, 1.25rem); text-align: center; }
      .stats-footer { flex: 0 0 auto; text-align: center; font-size: .82rem; }
      .stats-footer p { max-width: 1590px; margin: .5rem auto 0; line-height: 1.5; }
      .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); justify-content: center; gap: clamp(.5rem, 1.4vw, 1.25rem); width: 100%; max-width: 1590px; margin: 0 auto; }
      .card, section { background: white; border: 1px solid #dfe4ec; border-radius: 12px; padding: 1.5rem; }
      .card { box-sizing: border-box; display: flex; min-height: 0; height: clamp(82px, 18vh, 150px); flex-direction: column; justify-content: center; text-align: center; box-shadow: 0 10px 28px rgb(23 32 51 / 7%); }
      .card span { display: block; color: #657187; font-size: .9rem; }
      .card strong { display: block; font-size: clamp(1.3rem, 3.2vh, 2.15rem); margin-top: .45rem; }
      .dashboard-grid { display: grid; min-height: 0; flex: 1; grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr); gap: clamp(.5rem, 1.4vw, 1.25rem); width: 100%; max-width: 1590px; margin: 0 auto; text-align: left; }
      .chart-panel { display: flex; min-width: 0; min-height: 0; flex-direction: column; margin: 0; padding: 1.25rem; box-shadow: 0 10px 28px rgb(23 32 51 / 5%); }
      .chart-panel h2 { margin: 0; font-size: 1.05rem; }
      .chart-caption { min-height: 1.25rem; margin: .35rem 0 .75rem; font-size: .8rem; }
      .pass-rate-chart { display: block; width: 100%; height: 100%; min-height: 0; flex: 1; overflow: visible; }
      .chart-gridline line { stroke: #e8ebf1; stroke-width: 1; }
      .chart-gridline text, .chart-axis-label { fill: #657187; font-size: 12px; }
      .chart-line { fill: none; stroke: #3969d7; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
      .chart-point { fill: #3969d7; stroke: white; stroke-width: 2; }
      .outcome-bar { display: flex; height: 1rem; overflow: hidden; border-radius: 999px; background: #edf0f5; }
      .outcome-segment.passed, .legend-swatch.passed { background: #23834c; }
      .outcome-segment.failed, .legend-swatch.failed { background: #c83d38; }
      .outcome-segment.skipped, .legend-swatch.skipped { background: #8a94a5; }
      .outcome-legend { display: grid; gap: .75rem; margin: 1rem 0 0; padding: 0; list-style: none; }
      .outcome-legend li { display: grid; grid-template-columns: .75rem 1fr auto; align-items: center; gap: .55rem; }
      .outcome-legend strong { color: #172033; }
      .legend-swatch { width: .65rem; height: .65rem; border-radius: 50%; }
      .empty-state { margin: 2rem 0; text-align: center; }
      section { margin: 1rem 0; overflow-x: auto; }
      .dashboard-grid section { margin: 0; overflow: hidden; }
      table { width: 100%; border-collapse: collapse; text-align: left; }
      th, td { padding: .7rem .6rem; border-bottom: 1px solid #e8ebf1; vertical-align: middle; }
      th { color: #657187; font-size: .82rem; white-space: nowrap; }
      td small { display: block; margin-top: .2rem; overflow-wrap: anywhere; }
      .rate { font-weight: 700; white-space: nowrap; }
      .badge { display: inline-block; padding: .15rem .5rem; border-radius: 999px; font-size: .8rem; font-weight: 700; }
      .badge.passed { background: #e5f6ec; color: #176b3a; }
      .badge.failed { background: #fde9e8; color: #a52d28; }
      .badge.skipped { background: #edf0f5; color: #586579; }
      .trend-cell { min-width: 130px; white-space: nowrap; }
      .trend { margin-right: .18rem; font-size: 1rem; }
      .trend.passed { color: #23834c; }
      .trend.failed { color: #c83d38; }
      .trend.skipped { color: #8a94a5; }
      .trend.flaky { color: #d28a16; }
      .filters { display: grid; grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr)) auto; gap: .75rem; align-items: start; margin: 1rem 0; }
      .filters label { display: grid; min-width: 0; gap: .35rem; color: #657187; font-size: .85rem; line-height: 1.2; }
      .filters input, .filters select, .filters button { box-sizing: border-box; width: 100%; height: 2.75rem; min-height: 2.75rem; margin: 0; border: 1px solid #cbd3df; border-radius: 6px; background: white; color: #172033; padding: .4rem .65rem; font: inherit; line-height: 1.2; }
      .filters button { align-self: end; min-width: 8rem; cursor: pointer; white-space: nowrap; }
      .category { font-size: .78rem; font-weight: 700; letter-spacing: .04em; }
      [hidden] { display: none !important; }
      @media (max-width: 1000px) {
        .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .filters label:first-child { grid-column: 1 / -1; }
      }
      @media (max-width: 600px) {
        body { padding: .75rem; }
        main.stats-landing { height: calc(100vh - 1.5rem); height: calc(100svh - 1.5rem); }
        .report-header { align-items: flex-start; flex-direction: column; gap: .35rem; margin-bottom: .5rem; padding: .4rem 0; }
        .report-header h1 { font-size: 1.15rem; }
        .report-nav { gap: .2rem; }
        .report-nav a { padding: .3rem .4rem; font-size: .72rem; }
        .stats-content { gap: .5rem; }
        .cards { gap: .5rem; }
        .card { height: clamp(62px, 10vh, 90px); padding: .45rem; border-radius: 8px; }
        .card span { font-size: .72rem; }
        .card strong { margin-top: .2rem; font-size: clamp(1.1rem, 5vw, 1.5rem); }
        .dashboard-grid { grid-template-columns: minmax(0, 1fr); gap: .5rem; grid-template-rows: minmax(0, 1.1fr) minmax(0, 1fr); }
        .chart-panel { padding: .65rem; border-radius: 8px; }
        .chart-panel h2 { font-size: .9rem; }
        .chart-caption { min-height: 0; margin: .2rem 0 .4rem; font-size: .68rem; }
        .pass-rate-chart { height: clamp(85px, 17vh, 140px); flex: 0 1 auto; }
        .outcome-bar { height: .75rem; }
        .outcome-legend { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .3rem; margin-top: .5rem; }
        .outcome-legend li { grid-template-columns: .55rem 1fr auto; gap: .25rem; font-size: .68rem; }
        .legend-swatch { width: .5rem; height: .5rem; }
        .stats-footer { font-size: .68rem; }
        .stats-footer p { margin-top: .25rem; line-height: 1.25; }
        .filters { grid-template-columns: minmax(0, 1fr); }
        .filters label:first-child { grid-column: auto; }
      }
      @media (max-width: 600px) and (max-height: 700px) {
        body { padding: .5rem; }
        main.stats-landing { height: calc(100vh - 1rem); height: calc(100svh - 1rem); }
        .report-header { padding: .2rem 0; }
        .report-header h1 { font-size: .95rem; }
        .report-nav a { padding: .2rem .3rem; font-size: .64rem; }
        .stats-content { gap: .3rem; }
        .cards, .dashboard-grid { gap: .35rem; }
        .card { height: 58px; padding: .25rem; }
        .card span { font-size: .62rem; }
        .card strong { font-size: 1.05rem; }
        .chart-panel { padding: .45rem; }
        .chart-panel h2 { font-size: .78rem; }
        .chart-caption { font-size: .6rem; }
        .pass-rate-chart { height: 76px; }
        .outcome-legend { margin-top: .35rem; gap: .15rem; }
        .outcome-legend li { font-size: .6rem; }
        .stats-footer { font-size: .6rem; }
      }
    </style>
  </head>
  <body>
    <main${page === 'overview' ? ' class="stats-landing"' : ''}>
      <header class="report-header">
        <h1>Users App Cumulative Report</h1>
        <nav class="report-nav" aria-label="Report pages">${navigation}</nav>
      </header>
      ${pageContent}
    </main>
    ${
      page === 'tests'
        ? `<script>
      const searchInput = document.getElementById('scenario-search');
      const categoryFilter = document.getElementById('category-filter');
      const statusFilter = document.getElementById('status-filter');
      const tagFilter = document.getElementById('tag-filter');
      const rows = [...document.querySelectorAll('[data-test-row]')];
      const resultCount = document.getElementById('result-count');
      const noResults = document.getElementById('no-results');

      function applyFilters() {
        const query = searchInput.value.trim().toLowerCase();
        const category = categoryFilter.value;
        const status = statusFilter.value;
        const tag = tagFilter.value;
        let visibleCount = 0;

        for (const row of rows) {
          const tags = row.dataset.tags.split(' ').filter(Boolean).map(decodeURIComponent);
          const matches = (!query || row.dataset.search.includes(query))
            && (category === 'all' || row.dataset.category === category)
            && (status === 'all' || (status === 'flaky'
              ? row.dataset.status === 'passed' && row.dataset.flaky === 'true'
              : row.dataset.status === status))
            && (tag === 'all' || tags.includes(tag));
          row.hidden = !matches;
          visibleCount += Number(matches);
        }

        resultCount.textContent = 'Showing ' + visibleCount + ' of ' + rows.length + ' scenarios';
        noResults.hidden = visibleCount > 0;
      }

      for (const control of [searchInput, categoryFilter, statusFilter, tagFilter]) {
        control.addEventListener(control === searchInput ? 'input' : 'change', applyFilters);
      }

      document.getElementById('reset-filters').addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = 'all';
        statusFilter.value = 'all';
        tagFilter.value = 'all';
        applyFilters();
      });

      applyFilters();
    </script>`
        : ''
    }
  </body>
</html>`;
}

/** Reads and validates the persisted history file. */
export async function readHistoryFile(filePath) {
  let contents;
  try {
    const { readFile } = await import('node:fs/promises');
    contents = await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createEmptyHistory();
    }
    throw error;
  }

  let history;
  try {
    history = JSON.parse(contents);
  } catch (error) {
    throw new Error(`Could not parse cumulative test history at "${filePath}".`, { cause: error });
  }

  if (history.schemaVersion !== HISTORY_VERSION || !Array.isArray(history.runs) || !history.tests) {
    throw new Error(
      `Cumulative test history at "${filePath}" has an unsupported or invalid format.`,
    );
  }

  return history;
}

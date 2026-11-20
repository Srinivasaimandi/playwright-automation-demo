import { randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import {
  createTestId,
  getHistoryReportPaths,
  getTestCategory,
  mergeTestRun,
  readHistoryFile,
  renderHistoryReport,
} from './test-history.mjs';

function mapOutcome(outcome) {
  if (outcome === 'skipped') {
    return 'skipped';
  }
  return outcome === 'unexpected' ? 'failed' : 'passed';
}

async function writeAtomically(filePath, contents) {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, contents, 'utf8');
  await rename(temporaryPath, filePath);
}

/** Tracks final test outcomes and writes a persistent history plus static report. */
export default class CumulativeReporter {
  constructor() {
    this.startedAt = null;
    this.runId = null;
    this.environment = null;
    this.tests = new Map();
  }

  onBegin() {
    this.startedAt = new Date().toISOString();
    this.runId = process.env.GITHUB_RUN_ID
      ? `github-${process.env.GITHUB_RUN_ID}-attempt-${process.env.GITHUB_RUN_ATTEMPT ?? '1'}`
      : `local-${Date.now()}-${randomUUID().slice(0, 8)}`;
    this.environment = process.env.TEST_ENV ?? 'local';
  }

  onTestEnd(test, result) {
    const project = test.parent.project()?.name ?? 'default';
    const file = relative(process.cwd(), test.location.file).split(sep).join('/');
    const titlePath = test.titlePath().filter(Boolean);
    const id = createTestId(project, file, titlePath);
    const previous = this.tests.get(id);

    this.tests.set(id, {
      id,
      project,
      file,
      title: titlePath.join(' › '),
      category: getTestCategory(file),
      tags: [...test.tags],
      expectedStatus: test.expectedStatus,
      outcome: test.outcome(),
      attempts: [...(previous?.attempts ?? []), result.status],
    });
  }

  async onEnd(result) {
    if (!this.startedAt || !this.runId) {
      throw new Error('Cumulative reporter did not receive Playwright onBegin.');
    }

    const completedAt = new Date().toISOString();
    const tests = [...this.tests.values()].map((test) => {
      const status = mapOutcome(test.outcome);
      const priorUnexpectedAttempt = test.attempts
        .slice(0, -1)
        .some((attempt) => attempt !== test.expectedStatus);

      return {
        id: test.id,
        project: test.project,
        file: test.file,
        title: test.title,
        category: test.category,
        tags: test.tags,
        status,
        flaky: test.outcome === 'flaky' || (test.outcome === 'expected' && priorUnexpectedAttempt),
        retries: Math.max(0, test.attempts.length - 1),
      };
    });

    const run = {
      id: this.runId,
      startedAt: this.startedAt,
      completedAt,
      environment: this.environment,
      runnerStatus: result.status,
      tests,
    };
    const historyPath = resolve(
      process.env.PLAYWRIGHT_HISTORY_FILE ?? '.playwright-history/history.json',
    );
    const reportPath = resolve(
      process.env.PLAYWRIGHT_HISTORY_REPORT ?? 'reports/test-history-report.html',
    );
    const reportPaths = getHistoryReportPaths(reportPath);
    const reportLinks = Object.fromEntries(
      Object.entries(reportPaths).map(([page, path]) => [page, basename(path)]),
    );
    const history = mergeTestRun(await readHistoryFile(historyPath), run);

    await writeAtomically(historyPath, `${JSON.stringify(history, null, 2)}\n`);
    for (const [page, path] of Object.entries(reportPaths)) {
      await writeAtomically(path, renderHistoryReport(history, { page, links: reportLinks }));
    }

    const latestRun = history.runs.at(-1);
    console.log(
      `Cumulative test history: ${latestRun.passed} passed, ${latestRun.failed} failed, ` +
        `${latestRun.skipped} skipped; pass rate ${latestRun.passRate ?? '—'}%.`,
    );
    console.log(`Cumulative report pages written beside ${reportPath}.`);
  }
}

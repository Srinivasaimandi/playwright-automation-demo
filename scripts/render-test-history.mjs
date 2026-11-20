import { mkdir, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { getHistoryReportPaths, readHistoryFile, renderHistoryReport } from './test-history.mjs';

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
const history = await readHistoryFile(historyPath);

await mkdir(dirname(reportPaths.overview), { recursive: true });
for (const [page, path] of Object.entries(reportPaths)) {
  await writeFile(path, renderHistoryReport(history, { page, links: reportLinks }), 'utf8');
}
console.log(`Cumulative report pages written beside ${reportPaths.overview}.`);

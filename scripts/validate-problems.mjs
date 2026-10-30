// `npm run validate-problems`: schema checks plus every reference solution and starter run through
// the real judge (Node worker threads + Pyodide). Exits non-zero on any failure, so CI can gate on it.
import { fileURLToPath } from 'node:url';
import { createNodeJudge } from '../src/features/judge/testing/nodeWorker.ts';
import { validateProblems } from '../src/features/problems/validateProblems.ts';

const root = fileURLToPath(new URL('../problems', import.meta.url));
const judge = createNodeJudge();

let exitCode = 0;
try {
  const reports = await validateProblems(root, judge);
  for (const { folder, failures } of reports) {
    if (failures.length === 0) {
      console.log(`ok    ${folder}`);
    } else {
      exitCode = 1;
      console.log(`FAIL  ${folder}`);
      for (const failure of failures) console.log(`        - ${failure}`);
    }
  }
  const bad = reports.filter((r) => r.failures.length > 0).length;
  if (reports.length === 0) {
    exitCode = 1;
    console.log('No problems found.');
  }
  console.log(`\n${reports.length - bad}/${reports.length} problems valid.`);
} catch (error) {
  exitCode = 1;
  console.error(error);
} finally {
  judge.dispose();
}
process.exit(exitCode);

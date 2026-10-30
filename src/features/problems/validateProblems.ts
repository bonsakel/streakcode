// Node-only: reads problems from disk and runs them through the real judge. Never import this
// from browser code.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { collectResults } from '../judge/judge';
import type { Judge, Language, TestResult } from '../judge/types';
import { parseProblem, ProblemError, type Problem, type ProblemFiles } from './parseProblem';

export interface ProblemReport {
  folder: string;
  failures: string[];
}

const LANGUAGES: Language[] = ['javascript', 'typescript', 'python'];

export function readProblemFolder(root: string, folder: string): ProblemFiles {
  const dir = join(root, folder);
  const files: ProblemFiles = {};
  for (const name of readdirSync(dir)) {
    if (statSync(join(dir, name)).isFile()) files[name] = readFileSync(join(dir, name), 'utf8');
  }
  return files;
}

async function runAgainstTests(
  judge: Judge,
  problem: Problem,
  language: Language,
  code: string,
): Promise<TestResult[]> {
  const checker = problem.checkers?.[language === 'typescript' ? 'javascript' : language];
  return collectResults(
    judge.runTests({
      language,
      code,
      fnName: problem.fnName,
      tests: problem.tests,
      timeLimitMs: problem.timeLimitMs,
      ...(problem.epsilon === undefined ? {} : { epsilon: problem.epsilon }),
      ...(checker === undefined ? {} : { checker }),
    }),
  );
}

function describeFailure(results: TestResult[]): string {
  const bad = results.find((r) => r.status !== 'passed');
  if (!bad) return 'unknown failure';
  const where = `${bad.hidden ? 'hidden ' : ''}test #${bad.index + 1}`;
  const detail = bad.error ? ` (${bad.error.name}: ${bad.error.message})` : '';
  const passed = results.filter((r) => r.status === 'passed').length;
  return `${bad.status} on ${where}${detail}; ${passed}/${results.length} passed`;
}

/** Reference solutions must pass every test, in every language they are written for. */
async function checkSolutions(judge: Judge, problem: Problem, failures: string[]) {
  const { solutions } = problem;
  if (!solutions?.javascript) failures.push('missing solution.js');
  if (!solutions?.python) failures.push('missing solution.py');
  const runs: [Language, string, string][] = [];
  if (solutions?.javascript) {
    runs.push(['javascript', solutions.javascript, 'solution.js']);
    // Plain JS is valid TypeScript, so this also exercises the TypeScript pipeline.
    runs.push(['typescript', solutions.javascript, 'solution.js as typescript']);
  }
  if (solutions?.python) runs.push(['python', solutions.python, 'solution.py']);

  for (const [language, code, label] of runs) {
    const results = await runAgainstTests(judge, problem, language, code);
    if (results.some((r) => r.status !== 'passed')) {
      failures.push(`${label} does not pass: ${describeFailure(results)}`);
    }
  }
}

/** Starters should be honest attempts that lose politely: no crashes, not accidentally correct. */
async function checkStarters(judge: Judge, problem: Problem, failures: string[]) {
  for (const language of LANGUAGES) {
    const results = await runAgainstTests(judge, problem, language, problem.starters[language]);
    const crashed = results.find((r) =>
      ['runtime_error', 'compile_error', 'time_limit_exceeded'].includes(r.status),
    );
    if (crashed) {
      failures.push(
        `starter for ${language} must fail tests, not crash: ${describeFailure(results)}`,
      );
    } else if (results.every((r) => r.status === 'passed')) {
      failures.push(`starter for ${language} already passes every test`);
    }
  }
}

/** Validate every problem folder under `root`. Returns one report per folder. */
export async function validateProblems(root: string, judge: Judge): Promise<ProblemReport[]> {
  const folders = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const reports: ProblemReport[] = [];
  const slugs = new Map<string, string>();
  for (const folder of folders) {
    const failures: string[] = [];
    try {
      const problem = parseProblem(folder, readProblemFolder(root, folder));
      const clash = slugs.get(problem.slug);
      if (clash) failures.push(`duplicate slug, also used by ${clash}`);
      slugs.set(problem.slug, folder);
      if (failures.length === 0) {
        await checkSolutions(judge, problem, failures);
        await checkStarters(judge, problem, failures);
      }
    } catch (e) {
      if (e instanceof ProblemError) failures.push(...e.problems);
      else failures.push(e instanceof Error ? e.message : String(e));
    }
    reports.push({ folder, failures });
  }
  return reports;
}

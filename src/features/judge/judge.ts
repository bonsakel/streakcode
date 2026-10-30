import { formatValue } from './compare';
import type { CaseOutcome } from './protocol';
import {
  JudgeInternalError,
  type Judge,
  type JudgeError,
  type Language,
  type RunOptions,
  type TestCase,
  type TestResult,
} from './types';
import type { CaseRunner, RunnerResult } from './workerRunner';

/** Thrown by `Backend.prepare` when the source cannot be turned into runnable code. */
export class CompileError extends Error {
  constructor(readonly detail: JudgeError) {
    super(detail.message);
    this.name = 'CompileError';
  }
}

export interface Backend {
  /** Turn user source into what the worker runs (e.g. transpile TypeScript). */
  prepare(code: string): Promise<string> | string;
  runner: CaseRunner;
}

function baseResult(index: number, test: TestCase): TestResult {
  const hidden = test.hidden === true;
  return {
    index,
    hidden,
    status: 'skipped',
    timeMs: null,
    stdout: '',
    stdoutTruncated: false,
    ...(hidden ? {} : { input: formatValue(test.input), expected: formatValue(test.expected) }),
  };
}

function skipped(index: number, test: TestCase): TestResult {
  return baseResult(index, test);
}

function fromOutcome(
  index: number,
  test: TestCase,
  outcome: CaseOutcome,
  timeLimitMs: number,
): TestResult {
  const result = baseResult(index, test);
  const logs = result.hidden
    ? {}
    : { stdout: outcome.stdout, stdoutTruncated: outcome.stdoutTruncated };

  if (outcome.kind === 'error' || outcome.kind === 'compile_error') {
    return {
      ...result,
      ...logs,
      status: outcome.kind === 'error' ? 'runtime_error' : 'compile_error',
      timeMs: outcome.timeMs,
      error: outcome.error,
    };
  }
  if (outcome.timeMs > timeLimitMs) {
    return { ...result, ...logs, status: 'time_limit_exceeded', timeMs: outcome.timeMs };
  }
  return {
    ...result,
    ...logs,
    status: outcome.kind === 'pass' ? 'passed' : 'wrong_answer',
    timeMs: outcome.timeMs,
    ...(result.hidden ? {} : { got: outcome.got }),
  };
}

function fromRunner(
  index: number,
  test: TestCase,
  run: RunnerResult,
  timeLimitMs: number,
): TestResult {
  if (run.kind === 'outcome') return fromOutcome(index, test, run.outcome, timeLimitMs);
  if (run.kind === 'timeout') {
    return { ...baseResult(index, test), status: 'time_limit_exceeded' };
  }
  return {
    ...baseResult(index, test),
    status: 'runtime_error',
    error: {
      name: 'RunnerCrash',
      message: `The runner crashed (${run.reason}). This usually means the code ran out of memory.`,
    },
  };
}

export function createJudge(backends: Partial<Record<Language, Backend>>): Judge {
  return {
    async *runTests(opts: RunOptions): AsyncGenerator<TestResult> {
      const backend = backends[opts.language];
      if (!backend) {
        throw new JudgeInternalError(`No runtime is available for ${opts.language}.`);
      }
      if (!(opts.timeLimitMs > 0)) {
        throw new JudgeInternalError('timeLimitMs must be a positive number.');
      }

      let code: string;
      try {
        code = await backend.prepare(opts.code);
      } catch (e) {
        if (!(e instanceof CompileError)) throw e;
        for (const [index, test] of opts.tests.entries()) {
          yield index === 0
            ? { ...baseResult(index, test), status: 'compile_error', error: e.detail }
            : skipped(index, test);
        }
        return;
      }

      // After a timeout or compile error every remaining test would fail the same way; skip them.
      let halted = false;
      for (const [index, test] of opts.tests.entries()) {
        if (halted) {
          yield skipped(index, test);
          continue;
        }
        if (opts.signal?.aborted) throw new DOMException('The run was aborted.', 'AbortError');

        const run = await backend.runner.run(
          {
            code,
            fnName: opts.fnName,
            input: test.input,
            expected: test.expected,
            epsilon: opts.epsilon ?? 0,
            ...(opts.checker === undefined ? {} : { checker: opts.checker }),
          },
          opts.timeLimitMs,
          opts.signal,
        );
        const result = fromRunner(index, test, run, opts.timeLimitMs);
        halted = result.status === 'time_limit_exceeded' || result.status === 'compile_error';
        yield result;
      }
    },

    warmUp(language) {
      backends[language]?.runner.warmUp();
    },

    dispose() {
      for (const runner of new Set(Object.values(backends).map((b) => b.runner))) runner.dispose();
    },
  };
}

/** Drain a result stream into an array (handy for Submit, tests and scripts). */
export async function collectResults(stream: AsyncIterable<TestResult>): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for await (const result of stream) results.push(result);
  return results;
}

import type { RuntimeProgress } from './protocol';

export type Language = 'javascript' | 'typescript' | 'python';

export interface TestCase {
  /** Positional arguments, JSON-decoded. */
  input: unknown[];
  expected: unknown;
  hidden?: boolean;
}

export type TestStatus =
  'passed' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded' | 'compile_error' | 'skipped';

export interface JudgeError {
  name: string;
  message: string;
  /** 1-based line in the user's own code, when it could be mapped. */
  line?: number;
  column?: number;
}

export interface TestResult {
  /** 0-based index within the submitted test list. */
  index: number;
  hidden: boolean;
  status: TestStatus;
  /** Wall time of the call in the worker; null when it never completed. */
  timeMs: number | null;
  /** Present only for visible tests, so hidden tests never leak. */
  input?: string;
  expected?: string;
  got?: string;
  stdout: string;
  stdoutTruncated: boolean;
  error?: JudgeError;
}

export interface RunOptions {
  language: Language;
  code: string;
  fnName: string;
  tests: TestCase[];
  timeLimitMs: number;
  /** Absolute/relative tolerance for numbers. 0 (default) means exact. */
  epsilon?: number;
  /**
   * Source of a function `checker(input, got, expected) => boolean` written in the
   * same language as the submission, for problems with several valid answers.
   */
  checker?: string;
  signal?: AbortSignal;
  /** Called while a runtime (e.g. Pyodide) is still starting up, before the first test runs. */
  onProgress?: (progress: RuntimeProgress) => void;
}

export interface Judge {
  runTests(opts: RunOptions): AsyncIterable<TestResult>;
  /** Spin the worker for a language up ahead of time. */
  warmUp(language: Language): void;
  dispose(): void;
}

export type VerdictKind =
  'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'runtime_error' | 'compile_error';

export interface Verdict {
  kind: VerdictKind;
  passed: number;
  total: number;
  /** Index of the first failing test, if any. */
  failedIndex: number | null;
  maxTimeMs: number;
}

export class JudgeInternalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JudgeInternalError';
  }
}

export const MAX_STDOUT_BYTES = 10 * 1024;

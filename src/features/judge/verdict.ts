import type { TestResult, Verdict, VerdictKind } from './types';

const KIND_BY_STATUS: Record<Exclude<TestResult['status'], 'passed' | 'skipped'>, VerdictKind> = {
  wrong_answer: 'wrong_answer',
  runtime_error: 'runtime_error',
  time_limit_exceeded: 'time_limit_exceeded',
  compile_error: 'compile_error',
};

/** The verdict is decided by the first failing test, in test order. */
export function computeVerdict(results: readonly TestResult[]): Verdict {
  const ordered = [...results].sort((a, b) => a.index - b.index);
  let passed = 0;
  let maxTimeMs = 0;
  let kind: VerdictKind = 'accepted';
  let failedIndex: number | null = null;

  for (const r of ordered) {
    if (r.timeMs !== null) maxTimeMs = Math.max(maxTimeMs, r.timeMs);
    if (r.status === 'passed') {
      passed += 1;
    } else if (r.status !== 'skipped' && failedIndex === null) {
      kind = KIND_BY_STATUS[r.status];
      failedIndex = r.index;
    }
  }
  // A run with unproven (skipped) tests and no recorded failure cannot be Accepted.
  if (kind === 'accepted' && passed !== ordered.length) kind = 'wrong_answer';
  return { kind, passed, total: ordered.length, failedIndex, maxTimeMs };
}

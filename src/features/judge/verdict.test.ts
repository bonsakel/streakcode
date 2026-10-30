import { computeVerdict } from './verdict';
import type { TestResult, TestStatus } from './types';

function result(index: number, status: TestStatus, timeMs: number | null = 1): TestResult {
  return { index, hidden: false, status, timeMs, stdout: '', stdoutTruncated: false };
}

describe('computeVerdict', () => {
  it('is accepted when every test passes', () => {
    const v = computeVerdict([result(0, 'passed', 2), result(1, 'passed', 5)]);
    expect(v).toEqual({ kind: 'accepted', passed: 2, total: 2, failedIndex: null, maxTimeMs: 5 });
  });

  it('is decided by the first failing test in order, not arrival order', () => {
    const v = computeVerdict([
      result(2, 'runtime_error'),
      result(1, 'wrong_answer'),
      result(0, 'passed'),
    ]);
    expect(v.kind).toBe('wrong_answer');
    expect(v.failedIndex).toBe(1);
    expect(v.passed).toBe(1);
  });

  it.each([
    ['time_limit_exceeded', 'time_limit_exceeded'],
    ['runtime_error', 'runtime_error'],
    ['compile_error', 'compile_error'],
  ] as const)('maps %s', (status, kind) => {
    expect(computeVerdict([result(0, status, null), result(1, 'skipped', null)]).kind).toBe(kind);
  });

  it('never reports accepted when tests were skipped', () => {
    expect(computeVerdict([result(0, 'passed'), result(1, 'skipped', null)]).kind).toBe(
      'wrong_answer',
    );
  });

  it('handles an empty run as accepted with zero tests', () => {
    expect(computeVerdict([])).toEqual({
      kind: 'accepted',
      passed: 0,
      total: 0,
      failedIndex: null,
      maxTimeMs: 0,
    });
  });
});

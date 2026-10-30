import { collectResults } from './judge';
import type { Judge, Language, TestCase, TestStatus, VerdictKind } from './types';
import { computeVerdict } from './verdict';

export interface ConformanceCase {
  name: string;
  /** Equivalent solutions per language; a language without a snippet is skipped. */
  code: Partial<Record<Language, string>>;
  fnName?: string;
  tests: TestCase[];
  timeLimitMs?: number;
  epsilon?: number;
  checker?: Partial<Record<Language, string>>;
  expectVerdict: VerdictKind;
  expectStatuses: TestStatus[];
}

const add: TestCase[] = [
  { input: [1, 2], expected: 3 },
  { input: [-5, 5], expected: 0 },
  { input: [10, 20], expected: 30, hidden: true },
];

/**
 * Behaviour every language backend must agree on. Phase 3 adds Python snippets to these same
 * cases, so JS/Python parity is enforced by the same assertions.
 */
const BASE_CASES: ConformanceCase[] = [
  {
    name: 'accepts a correct solution',
    code: {
      javascript: 'function add(a, b) { return a + b; }',
      typescript: 'function add(a: number, b: number): number { return a + b; }',
    },
    fnName: 'add',
    tests: add,
    expectVerdict: 'accepted',
    expectStatuses: ['passed', 'passed', 'passed'],
  },
  {
    name: 'reports wrong answers without hiding later results',
    code: {
      javascript: 'function add(a, b) { return a - b; }',
      typescript: 'function add(a: number, b: number): number { return a - b; }',
    },
    fnName: 'add',
    tests: add,
    expectVerdict: 'wrong_answer',
    expectStatuses: ['wrong_answer', 'wrong_answer', 'wrong_answer'],
  },
  {
    name: 'maps a thrown error to a runtime error and keeps going',
    code: {
      javascript: 'function add(a, b) { if (a < 0) throw new Error("negative"); return a + b; }',
      typescript:
        'function add(a: number, b: number): number { if (a < 0) throw new Error("negative"); return a + b; }',
    },
    fnName: 'add',
    tests: [
      { input: [1, 2], expected: 3 },
      { input: [-5, 5], expected: 0 },
      { input: [10, 20], expected: 30 },
    ],
    expectVerdict: 'runtime_error',
    expectStatuses: ['passed', 'runtime_error', 'passed'],
  },
  {
    name: 'turns an infinite loop into a time limit and skips the rest',
    code: {
      javascript: 'function add(a, b) { while (true) {} }',
      typescript: 'function add(a: number, b: number): number { while (true) {} }',
    },
    fnName: 'add',
    tests: add,
    timeLimitMs: 200,
    expectVerdict: 'time_limit_exceeded',
    expectStatuses: ['time_limit_exceeded', 'skipped', 'skipped'],
  },
  {
    name: 'compares floats exactly unless epsilon is given',
    code: {
      javascript: 'function f(a, b) { return a + b; }',
      typescript: 'function f(a: number, b: number): number { return a + b; }',
    },
    fnName: 'f',
    tests: [{ input: [0.1, 0.2], expected: 0.3 }],
    expectVerdict: 'wrong_answer',
    expectStatuses: ['wrong_answer'],
  },
  {
    name: 'accepts floats within epsilon',
    code: {
      javascript: 'function f(a, b) { return a + b; }',
      typescript: 'function f(a: number, b: number): number { return a + b; }',
    },
    fnName: 'f',
    tests: [{ input: [0.1, 0.2], expected: 0.3 }],
    epsilon: 1e-9,
    expectVerdict: 'accepted',
    expectStatuses: ['passed'],
  },
  {
    name: 'deep-compares nested arrays and objects',
    code: {
      javascript: 'function f(n) { return { list: [n, [n + 1]], ok: true }; }',
      typescript: 'function f(n: number) { return { ok: true, list: [n, [n + 1]] }; }',
    },
    fnName: 'f',
    tests: [{ input: [1], expected: { ok: true, list: [1, [2]] } }],
    expectVerdict: 'accepted',
    expectStatuses: ['passed'],
  },
  {
    name: 'uses a custom checker for any-valid-answer problems',
    code: {
      javascript: 'function pair(n) { return [n - 1, 1]; }',
      typescript: 'function pair(n: number): number[] { return [n - 1, 1]; }',
    },
    fnName: 'pair',
    tests: [{ input: [10], expected: null }],
    checker: {
      javascript: 'function checker(input, got) { return got[0] + got[1] === input[0]; }',
      typescript: 'function checker(input, got) { return got[0] + got[1] === input[0]; }',
    },
    expectVerdict: 'accepted',
    expectStatuses: ['passed'],
  },
  {
    name: 'treats a missing return value as wrong, not as null',
    code: {
      javascript: 'function f(n) { n + 1; }',
      typescript: 'function f(n: number): void { n + 1; }',
    },
    fnName: 'f',
    tests: [{ input: [1], expected: null }],
    expectVerdict: 'wrong_answer',
    expectStatuses: ['wrong_answer'],
  },
  {
    name: 'reports a syntax error as a compile error and skips the rest',
    code: {
      javascript: 'function add(a, b) { return a + ; }',
      typescript: 'function add(a: number, b: number): number { return a + ; }',
    },
    fnName: 'add',
    tests: add,
    expectVerdict: 'compile_error',
    expectStatuses: ['compile_error', 'skipped', 'skipped'],
  },
  {
    name: 'reports a missing function as a runtime error',
    code: {
      javascript: 'function somethingElse() { return 1; }',
      typescript: 'function somethingElse(): number { return 1; }',
    },
    fnName: 'add',
    tests: [{ input: [1, 2], expected: 3 }],
    expectVerdict: 'runtime_error',
    expectStatuses: ['runtime_error'],
  },
  {
    name: 'survives a flood of console output',
    code: {
      javascript:
        'function add(a, b) { for (let i = 0; i < 200000; i++) console.log("spam spam spam spam", i); return a + b; }',
      typescript:
        'function add(a: number, b: number): number { for (let i = 0; i < 200000; i++) console.log("spam spam spam spam", i); return a + b; }',
    },
    fnName: 'add',
    tests: [{ input: [1, 2], expected: 3 }],
    timeLimitMs: 5000,
    expectVerdict: 'accepted',
    expectStatuses: ['passed'],
  },
];

/** Python twins of the cases above, keyed by case name. The missing-return case has none: None is null. */
const PYTHON: Record<string, { code: string; checker?: string }> = {
  'accepts a correct solution': { code: 'def add(a, b):\n    return a + b' },
  'reports wrong answers without hiding later results': {
    code: 'def add(a, b):\n    return a - b',
  },
  'maps a thrown error to a runtime error and keeps going': {
    code: 'def add(a, b):\n    if a < 0:\n        raise ValueError("negative")\n    return a + b',
  },
  'turns an infinite loop into a time limit and skips the rest': {
    code: 'def add(a, b):\n    while True:\n        pass',
  },
  'compares floats exactly unless epsilon is given': { code: 'def f(a, b):\n    return a + b' },
  'accepts floats within epsilon': { code: 'def f(a, b):\n    return a + b' },
  'deep-compares nested arrays and objects': {
    code: 'def f(n):\n    return {"list": [n, [n + 1]], "ok": True}',
  },
  'uses a custom checker for any-valid-answer problems': {
    code: 'def pair(n):\n    return [n - 1, 1]',
    checker: 'def checker(input, got, expected):\n    return got[0] + got[1] == input[0]',
  },
  'reports a syntax error as a compile error and skips the rest': {
    code: 'def add(a, b):\n    return a + ',
  },
  'reports a missing function as a runtime error': { code: 'def something_else():\n    return 1' },
  'survives a flood of console output': {
    code: 'def add(a, b):\n    for i in range(200000):\n        print("spam spam spam spam", i)\n    return a + b',
  },
};

export const CONFORMANCE_CASES: ConformanceCase[] = BASE_CASES.map((c) => {
  const py = PYTHON[c.name];
  if (!py) return c;
  return {
    ...c,
    code: { ...c.code, python: py.code },
    ...(py.checker ? { checker: { ...c.checker, python: py.checker } } : {}),
  };
});

export async function runConformanceCase(judge: Judge, language: Language, c: ConformanceCase) {
  const code = c.code[language];
  if (code === undefined) throw new Error(`Case "${c.name}" has no ${language} snippet.`);
  const checker = c.checker?.[language];
  const results = await collectResults(
    judge.runTests({
      language,
      code,
      fnName: c.fnName ?? 'add',
      tests: c.tests,
      timeLimitMs: c.timeLimitMs ?? 2000,
      ...(c.epsilon === undefined ? {} : { epsilon: c.epsilon }),
      ...(checker === undefined ? {} : { checker }),
    }),
  );
  return { results, verdict: computeVerdict(results) };
}

// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CONFORMANCE_CASES, runConformanceCase } from './conformance';
import { collectResults, createJudge } from './judge';
import type { RuntimeProgress, WorkerFactory } from './protocol';
import { createNodeJudge } from './testing/nodeWorker';
import type { Judge, Language, RunOptions } from './types';
import { WorkerRunner } from './workerRunner';

let spawns = 0;
let judge: Judge;
beforeAll(() => {
  judge = createNodeJudge(() => {
    spawns++;
  });
});
afterAll(() => judge.dispose());

const py = (code: string, opts: Partial<RunOptions> = {}) =>
  collectResults(
    judge.runTests({
      language: 'python',
      code,
      fnName: 'f',
      timeLimitMs: 3000,
      tests: [{ input: [1, 2], expected: 3 }],
      ...opts,
    }),
  );

describe('conformance: python', () => {
  it.each(CONFORMANCE_CASES.filter((c) => c.code.python !== undefined))('$name', async (c) => {
    const { results, verdict } = await runConformanceCase(judge, 'python', c);
    expect(results.map((r) => r.status)).toEqual(c.expectStatuses);
    expect(verdict.kind).toBe(c.expectVerdict);
  });
});

describe('JS/Python parity', () => {
  const shared = CONFORMANCE_CASES.filter((c) => c.code.python && c.code.javascript);
  it.each(shared)('$name', async (c) => {
    const view = async (language: Language) => {
      const { results, verdict } = await runConformanceCase(judge, language, c);
      return {
        verdict: verdict.kind,
        results: results.map((r) => [r.status, r.hidden, r.input, r.expected, r.got]),
      };
    };
    const [js, python] = [await view('javascript'), await view('python')];
    expect(python.verdict).toBe(js.verdict);
    // Output formatting of `got` may differ only for the infinite-loop and error cases, which have none.
    expect(python.results).toEqual(js.results);
  });
});

describe('python specifics', () => {
  it('maps runtime errors to the user line', async () => {
    const [r] = await py('def f(a, b):\n    x = 1\n    return x / 0');
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.name).toBe('ZeroDivisionError');
    expect(r?.error?.line).toBe(3);
  });

  it('reports syntax errors with a line', async () => {
    const [r] = await py('def f(a, b):\n    return a +');
    expect(r?.status).toBe('compile_error');
    expect(r?.error?.line).toBe(2);
  });

  it('survives runaway recursion', async () => {
    const [r] = await py('def f(a, b):\n    return f(a, b)');
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.name).toBe('RecursionError');
  });

  it('rejects values JSON cannot carry', async () => {
    const [r] = await py('def f(a, b):\n    return {a, b}');
    expect(r?.status).toBe('runtime_error');
  });

  it('treats tuples as lists and None as null', async () => {
    const [t, n] = await py('def f(a, b):\n    return (a, b) if a == 1 else None', {
      tests: [
        { input: [1, 2], expected: [1, 2] },
        { input: [2, 2], expected: null },
      ],
    });
    expect([t?.status, n?.status]).toEqual(['passed', 'passed']);
  });

  it('compares NaN to NaN-tagged expectations without crashing', async () => {
    const [r] = await py('def f(a, b):\n    return float("nan")', {
      tests: [{ input: [1, 2], expected: 3 }],
    });
    expect(r?.status).toBe('wrong_answer');
  });

  it('truncates huge output', async () => {
    const [r] = await py('def f(a, b):\n    print("x" * 1000000)\n    return a + b');
    expect(r?.status).toBe('passed');
    expect(r?.stdoutTruncated).toBe(true);
    expect(r?.stdout.length).toBeLessThanOrEqual(10 * 1024);
  });

  it('does not let one test mutate the next one input', async () => {
    const tests = [
      { input: [[1, 2, 3]], expected: 3 },
      { input: [[1, 2, 3]], expected: 3 },
    ];
    const results = await py('def f(xs):\n    n = len(xs)\n    xs.clear()\n    return n', {
      tests,
    });
    expect(results.map((r) => r.status)).toEqual(['passed', 'passed']);
  });

  it('input() hits EOF instead of hanging', async () => {
    const [r] = await py('def f(a, b):\n    return input()');
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.name).toBe('EOFError');
  });

  it('turns sys.exit into a runtime error', async () => {
    const [r] = await py('import sys\ndef f(a, b):\n    sys.exit(1)');
    expect(r?.status).toBe('runtime_error');
  });

  it('rejects async functions', async () => {
    const [r] = await py('async def f(a, b):\n    return a + b');
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.name).toBe('TypeError');
  });

  it('blocks network access through the js module', async () => {
    const [r] = await py(
      'def f(a, b):\n    import js\n    js.fetch("http://example.com")\n    return 3',
    );
    expect(r?.status).toBe('runtime_error');
  });
});

describe('python lifecycle', () => {
  it('reuses the warm worker, and respawns eagerly after a time limit', async () => {
    await py('def f(a, b):\n    return a + b');
    const before = spawns;
    const [tle] = await py('def f(a, b):\n    while True:\n        pass', { timeLimitMs: 200 });
    expect(tle?.status).toBe('time_limit_exceeded');
    expect(spawns).toBe(before + 1);
    const [ok] = await py('def f(a, b):\n    return a + b');
    expect(ok?.status).toBe('passed');
    expect(spawns).toBe(before + 1);
  });

  it('reports startup progress', async () => {
    const fresh = createNodeJudge();
    const stages: RuntimeProgress['stage'][] = [];
    try {
      await collectResults(
        fresh.runTests({
          language: 'python',
          code: 'def f(a, b):\n    return a + b',
          fnName: 'f',
          tests: [{ input: [1, 2], expected: 3 }],
          timeLimitMs: 3000,
          onProgress: (p) => stages.push(p.stage),
        }),
      );
    } finally {
      fresh.dispose();
    }
    expect(stages).toContain('starting');
    expect(stages.at(-1)).toBe('ready');
  });

  it('surfaces a fatal startup failure as an internal error', async () => {
    const factory: WorkerFactory = () => {
      const handle: ReturnType<WorkerFactory> = {
        postMessage: () => undefined,
        terminate: () => undefined,
        onmessage: null,
        onerror: null,
      };
      queueMicrotask(() => handle.onmessage?.({ type: 'fatal', reason: 'no wasm for you' }));
      return handle;
    };
    const broken = createJudge({
      python: { prepare: (c) => c, runner: new WorkerRunner(factory) },
    });
    await expect(
      collectResults(
        broken.runTests({
          language: 'python',
          code: 'def f(): pass',
          fnName: 'f',
          tests: [{ input: [], expected: null }],
          timeLimitMs: 1000,
        }),
      ),
    ).rejects.toThrow(/no wasm for you/);
    broken.dispose();
  });
});

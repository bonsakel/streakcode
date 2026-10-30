// @vitest-environment node
import { createNodeJudge } from './testing/nodeWorker';
import { collectResults, createJudge } from './judge';
import { CONFORMANCE_CASES, runConformanceCase } from './conformance';
import { MAX_STDOUT_BYTES, type Judge, type Language, type RunOptions } from './types';
import { WorkerRunner } from './workerRunner';
import type { WorkerFactory } from './protocol';

let judge: Judge;
beforeAll(() => {
  judge = createNodeJudge();
});
afterAll(() => judge.dispose());

const run = (opts: Partial<RunOptions> & Pick<RunOptions, 'code'>) =>
  collectResults(
    judge.runTests({
      language: 'javascript',
      fnName: 'add',
      timeLimitMs: 2000,
      tests: [{ input: [1, 2], expected: 3 }],
      ...opts,
    }),
  );

describe.each<Language>(['javascript', 'typescript'])('conformance: %s', (language) => {
  it.each(CONFORMANCE_CASES.filter((c) => c.code[language] !== undefined))('$name', async (c) => {
    const { results, verdict } = await runConformanceCase(judge, language, c);
    expect(results.map((r) => r.status)).toEqual(c.expectStatuses);
    expect(verdict.kind).toBe(c.expectVerdict);
  });
});

describe('infinite loops', () => {
  it('kills the worker, then keeps judging on a fresh one', async () => {
    const hang = await run({ code: 'function add() { for (;;) {} }', timeLimitMs: 150 });
    expect(hang[0]?.status).toBe('time_limit_exceeded');

    const next = await run({ code: 'function add(a, b) { return a + b; }' });
    expect(next.map((r) => r.status)).toEqual(['passed']);
  });

  it('times out an async function that never settles', async () => {
    const results = await run({
      code: 'async function add() { await new Promise(() => {}); }',
      timeLimitMs: 150,
    });
    expect(results[0]?.status).toBe('time_limit_exceeded');
  });

  it('times out recursion-free busy work inside a loop of tests', async () => {
    const results = await run({
      code: 'function add(a, b) { if (a === 2) { while (true) {} } return a + b; }',
      timeLimitMs: 150,
      tests: [
        { input: [1, 1], expected: 2 },
        { input: [2, 1], expected: 3 },
        { input: [3, 1], expected: 4 },
      ],
    });
    expect(results.map((r) => r.status)).toEqual(['passed', 'time_limit_exceeded', 'skipped']);
  });
});

describe('errors', () => {
  it('maps runtime errors back to the line in the user code', async () => {
    const code = [
      'function add(a, b) {',
      '  const x = a + b;',
      '  throw new TypeError("boom");',
      '}',
    ].join('\n');
    const [r] = await run({ code });
    expect(r?.status).toBe('runtime_error');
    expect(r?.error).toMatchObject({ name: 'TypeError', message: 'boom', line: 3 });
  });

  it('reports non-Error throws', async () => {
    const [r] = await run({ code: 'function add() { throw "plain string"; }' });
    expect(r?.error).toMatchObject({ name: 'Error', message: 'plain string' });
  });

  it('reports errors thrown by top-level code', async () => {
    const [r] = await run({ code: 'null.x;\nfunction add() { return 3; }' });
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.name).toBe('TypeError');
    expect(r?.error?.line).toBe(1);
  });

  it('reports stack overflows as runtime errors', async () => {
    const [r] = await run({ code: 'function add(a) { return add(a) + 1; }' });
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.name).toBe('RangeError');
  });

  it('reports a non-serializable return value', async () => {
    const [r] = await run({ code: 'function add() { const o = {}; o.o = o; return o; }' });
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.name).toBe('SerializationError');
  });

  it('cannot be tricked into escaping the wrapper with a stray brace', async () => {
    const [r] = await run({ code: '}); throw new Error("escaped"); (function(){' });
    expect(r?.status).toBe('compile_error');
  });

  it('flags import statements as compile errors', async () => {
    const [r] = await run({ code: 'import x from "y";\nfunction add() { return 3; }' });
    expect(r?.status).toBe('compile_error');
  });

  it('gives TypeScript syntax errors a line number', async () => {
    const [r] = await run({
      language: 'typescript',
      code: 'function add(a: number, b: number): number {\n  return a +;\n}',
    });
    expect(r?.status).toBe('compile_error');
    expect(r?.error?.line).toBe(2);
  });

  it('keeps TypeScript line numbers for runtime errors', async () => {
    const [r] = await run({
      language: 'typescript',
      code: 'type N = number;\nfunction add(a: N, b: N): N {\n  throw new Error("ts boom");\n}',
    });
    expect(r?.error).toMatchObject({ message: 'ts boom', line: 3 });
  });
});

describe('output capture', () => {
  it('captures console output per test, in order', async () => {
    const results = await run({
      code: 'function add(a, b) { console.log("a is", a); console.info({ b }); console.error("oops"); return a + b; }',
      tests: [
        { input: [1, 2], expected: 3 },
        { input: [3, 4], expected: 7 },
      ],
    });
    expect(results[0]?.stdout).toBe('a is 1\n{"b":2}\noops\n');
    expect(results[1]?.stdout).toBe('a is 3\n{"b":4}\noops\n');
  });

  it('caps huge output at about 10 KB and flags it', async () => {
    const [r] = await run({
      code: 'function add(a, b) { for (let i = 0; i < 100000; i++) console.log("x".repeat(100)); return a + b; }',
      timeLimitMs: 5000,
    });
    expect(r?.status).toBe('passed');
    expect(r?.stdoutTruncated).toBe(true);
    expect(r?.stdout.length).toBeLessThanOrEqual(MAX_STDOUT_BYTES);
  });

  it('handles a single enormous log line and unprintable values', async () => {
    const [r] = await run({
      code: 'function add(a, b) { console.log("y".repeat(1e6)); console.log(Object.create(null)); return a + b; }',
    });
    expect(r?.status).toBe('passed');
    expect(r?.stdout.length).toBeLessThanOrEqual(MAX_STDOUT_BYTES);
    expect(r?.stdoutTruncated).toBe(true);
  });

  it('truncates a huge returned value for display', async () => {
    const [r] = await run({
      code: 'function add() { return "z".repeat(1e6); }',
    });
    expect(r?.status).toBe('wrong_answer');
    expect((r?.got ?? '').length).toBeLessThan(2100);
  });

  it('does not leak console output from one case into the next', async () => {
    const results = await run({
      code: 'function add(a, b) { if (a === 1) console.log("only first"); return a + b; }',
      tests: [
        { input: [1, 1], expected: 2 },
        { input: [2, 2], expected: 4 },
      ],
    });
    expect(results[1]?.stdout).toBe('');
  });
});

describe('results shape', () => {
  it('shows input, expected and got for visible tests only', async () => {
    const results = await run({
      code: 'function add(a, b) { console.log("secret"); return 99; }',
      tests: [
        { input: [1, 2], expected: 3 },
        { input: [4, 5], expected: 9, hidden: true },
      ],
    });
    expect(results[0]).toMatchObject({ hidden: false, input: '[1,2]', expected: '3', got: '99' });
    expect(results[0]?.stdout).toBe('secret\n');
    expect(results[1]).toMatchObject({ hidden: true, status: 'wrong_answer', stdout: '' });
    expect(results[1]?.input).toBeUndefined();
    expect(results[1]?.expected).toBeUndefined();
    expect(results[1]?.got).toBeUndefined();
  });

  it('streams results one at a time, in order', async () => {
    const seen: number[] = [];
    for await (const r of judge.runTests({
      language: 'javascript',
      code: 'function add(a, b) { return a + b; }',
      fnName: 'add',
      timeLimitMs: 1000,
      tests: [
        { input: [1, 1], expected: 2 },
        { input: [2, 2], expected: 4 },
        { input: [3, 3], expected: 6 },
      ],
    })) {
      seen.push(r.index);
    }
    expect(seen).toEqual([0, 1, 2]);
  });

  it('records a runtime in milliseconds', async () => {
    const [r] = await run({ code: 'function add(a, b) { return a + b; }' });
    expect(r?.timeMs).toBeGreaterThanOrEqual(0);
    expect(r?.timeMs).toBeLessThan(2000);
  });
});

describe('inputs and isolation', () => {
  it('supports async solutions', async () => {
    const [r] = await run({ code: 'async function add(a, b) { await null; return a + b; }' });
    expect(r?.status).toBe('passed');
  });

  it('supports const arrow functions as the entry point', async () => {
    const [r] = await run({ code: 'const add = (a, b) => a + b;' });
    expect(r?.status).toBe('passed');
  });

  it('gives each case fresh input, so mutation cannot corrupt expectations', async () => {
    const results = await run({
      code: 'function add(arr) { arr.push(99); return arr.length; }',
      tests: [
        { input: [[1, 2]], expected: 3 },
        { input: [[1, 2]], expected: 3 },
      ],
    });
    expect(results.map((r) => r.status)).toEqual(['passed', 'passed']);
  });

  it('hands the checker an unmutated copy of the input', async () => {
    const [r] = await run({
      code: 'function add(arr) { arr.length = 0; return 1; }',
      tests: [{ input: [[1, 2]], expected: null }],
      checker: 'function checker(input, got) { return input[0].length === 2 && got === 1; }',
    });
    expect(r?.status).toBe('passed');
  });

  it('reports a throwing checker as a problem with the checker', async () => {
    const [r] = await run({
      code: 'function add() { return 1; }',
      checker: 'function checker() { throw new Error("bad checker"); }',
    });
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.message).toContain('Checker problem');
  });

  it('rejects an invalid function name instead of evaluating it', async () => {
    const [r] = await run({ code: 'function add() { return 3; }', fnName: 'add; evil()' });
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.name).toBe('JudgeConfigError');
  });
});

describe('sandbox hygiene', () => {
  it.each(['fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts'])('blocks %s', async (name) => {
    const [r] = await run({
      code: `function add() { return new (${name})("http://example.com"); }`,
    });
    expect(r?.status).toBe('runtime_error');
    expect(r?.error?.message).toContain('disabled in the Streakcode sandbox');
  });

  it('cannot post forged results through postMessage', async () => {
    const [r] = await run({
      code: 'function add() { postMessage({ type: "result" }); return 0; }',
    });
    expect(r?.status).toBe('runtime_error');
  });
});

describe('judge lifecycle', () => {
  it('rejects languages without a runtime', async () => {
    const empty = createJudge({});
    await expect(
      collectResults(
        empty.runTests({
          language: 'python',
          code: 'def add(a, b): return a + b',
          fnName: 'add',
          tests: [{ input: [1, 2], expected: 3 }],
          timeLimitMs: 1000,
        }),
      ),
    ).rejects.toThrow(/No runtime is available for python/);
  });

  it('rejects a non-positive time limit', async () => {
    await expect(run({ code: 'function add() {}', timeLimitMs: 0 })).rejects.toThrow(/timeLimitMs/);
  });

  it('aborts a hanging run and recovers afterwards', async () => {
    const controller = new AbortController();
    const pending = run({
      code: 'function add() { while (true) {} }',
      timeLimitMs: 10_000,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(), 100);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });

    const [r] = await run({ code: 'function add(a, b) { return a + b; }' });
    expect(r?.status).toBe('passed');
  });

  it('serializes overlapping runs without cross-talk', async () => {
    const [a, b] = await Promise.all([
      run({ code: 'function add(a, b) { return a + b; }' }),
      run({ code: 'function add(a, b) { return a * 100; }' }),
    ]);
    expect(a?.map((r) => r.status)).toEqual(['passed']);
    expect(b?.map((r) => r.status)).toEqual(['wrong_answer']);
  });

  it('warm-up does not break later runs', async () => {
    judge.warmUp('javascript');
    const [r] = await run({ code: 'function add(a, b) { return a + b; }' });
    expect(r?.status).toBe('passed');
  });
});

describe('worker failures', () => {
  const baseOpts = {
    language: 'javascript' as const,
    code: 'function add() { return 1; }',
    fnName: 'add',
    timeLimitMs: 500,
    tests: [{ input: [], expected: 1 }],
  };

  it('reports a worker that crashes mid-case as a runtime error', async () => {
    const factory: WorkerFactory = () => {
      const handle: ReturnType<WorkerFactory> = {
        postMessage: (m) => {
          if (m.type === 'run') queueMicrotask(() => handle.onerror?.('out of memory'));
        },
        terminate: () => undefined,
        onmessage: null,
        onerror: null,
      };
      queueMicrotask(() => handle.onmessage?.({ type: 'ready' }));
      return handle;
    };
    const crashy = createJudge({
      javascript: { prepare: (c) => c, runner: new WorkerRunner(factory) },
    });
    const results = await collectResults(crashy.runTests(baseOpts));
    expect(results[0]?.status).toBe('runtime_error');
    expect(results[0]?.error?.name).toBe('RunnerCrash');
  });

  it('fails clearly when a worker never starts', async () => {
    const silent: WorkerFactory = () => ({
      postMessage: () => undefined,
      terminate: () => undefined,
      onmessage: null,
      onerror: null,
    });
    const stuck = createJudge({
      javascript: { prepare: (c) => c, runner: new WorkerRunner(silent, { startupTimeoutMs: 50 }) },
    });
    await expect(collectResults(stuck.runTests(baseOpts))).rejects.toThrow(
      /took too long to start/,
    );
  });
});

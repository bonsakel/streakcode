import { describe, expect, it } from 'vitest';
import { parseHints, parseProblem, ProblemError, type ProblemFiles } from './parseProblem';

const meta = {
  slug: 'demo',
  title: 'Demo Problem',
  difficulty: 'easy',
  xp: 50,
  tags: ['arrays'],
  timeLimitMs: 1000,
  fnName: 'demo',
  flavor: 'A tiny problem made for tests.',
  statement: 'Return the number you are given. '.repeat(4),
};

const tests = [
  ...[1, 2, 3].map((n) => ({ input: [n], expected: n })),
  ...[4, 5, 6].map((n) => ({ input: [n], expected: n, hidden: true })),
];

function files(overrides: Partial<ProblemFiles> = {}): ProblemFiles {
  return {
    'problem.json': JSON.stringify(meta),
    'tests.json': JSON.stringify(tests),
    'starter.js': 'function demo(n) { return null; }',
    'starter.ts': 'function demo(n: number) { return null; }',
    'starter.py': 'def demo(n):\n    return None',
    'hints.md': 'one\n---\ntwo\n---\nthree\n',
    'editorial.md': 'Just return it.',
    ...overrides,
  };
}

function problemsFor(folder: string, input: ProblemFiles): string[] {
  try {
    parseProblem(folder, input);
  } catch (e) {
    if (e instanceof ProblemError) return e.problems;
    throw e;
  }
  return [];
}

describe('parseProblem', () => {
  it('parses a well-formed folder', () => {
    const problem = parseProblem('demo', files());
    expect(problem.slug).toBe('demo');
    expect(problem.hints).toEqual(['one', 'two', 'three']);
    expect(problem.tests.filter((t) => t.hidden)).toHaveLength(3);
    expect(problem.starters.python).toContain('def demo');
    expect(problem.solutions).toBeUndefined();
  });

  it('includes reference solutions when they are present', () => {
    const problem = parseProblem('demo', files({ 'solution.js': 'x', 'solution.py': 'y' }));
    expect(problem.solutions).toEqual({ javascript: 'x', python: 'y' });
  });

  it('rejects a slug that does not match the folder', () => {
    expect(problemsFor('other', files()).join()).toMatch(/must match folder name/);
  });

  it('rejects an unknown difficulty and bad tags', () => {
    const bad = { ...meta, difficulty: 'spicy', tags: ['Not Kebab'] };
    const problems = problemsFor('demo', files({ 'problem.json': JSON.stringify(bad) }));
    expect(problems.join()).toMatch(/difficulty/);
    expect(problems.join()).toMatch(/tags/);
  });

  it('rejects malformed JSON without throwing a raw SyntaxError', () => {
    expect(problemsFor('demo', files({ 'tests.json': '{nope' })).join()).toMatch(/not valid JSON/);
  });

  it('requires at least 3 visible and 3 hidden tests', () => {
    const fewHidden = JSON.stringify(tests.map((t, i) => ({ ...t, hidden: i === 5 })));
    expect(problemsFor('demo', files({ 'tests.json': fewHidden })).join()).toMatch(/hidden tests/);
    const noVisible = JSON.stringify(tests.map((t) => ({ ...t, hidden: true })));
    expect(problemsFor('demo', files({ 'tests.json': noVisible })).join()).toMatch(/visible tests/);
  });

  it('requires an expected value on every test', () => {
    const broken = JSON.stringify([...tests.slice(0, 5), { input: [1] }]);
    expect(problemsFor('demo', files({ 'tests.json': broken })).join()).toMatch(/expected/);
  });

  it('requires exactly three hints', () => {
    expect(problemsFor('demo', files({ 'hints.md': 'one\n---\ntwo' })).join()).toMatch(/3 hints/);
  });

  it('reports every missing file at once', () => {
    const problems = problemsFor('demo', { 'problem.json': JSON.stringify(meta) });
    expect(problems).toEqual(
      expect.arrayContaining([
        'missing tests.json',
        'missing starter.js',
        'missing starter.ts',
        'missing starter.py',
        'missing hints.md',
        'missing editorial.md',
      ]),
    );
  });
});

describe('parseHints', () => {
  it('splits on separator lines and trims', () => {
    expect(parseHints('\n a \n---\n b\n\n---\nc')).toEqual(['a', 'b', 'c']);
  });
});

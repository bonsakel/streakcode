// @vitest-environment node
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createNodeJudge } from '../judge/testing/nodeWorker';
import type { Judge } from '../judge/types';
import { validateProblems } from './validateProblems';

const SOURCE = join(process.cwd(), 'problems', 'rizz-calculator');

let judge: Judge;
let root: string;
const failures = new Map<string, string>();

/** A copy of a known-good problem, tweaked by `edit`. */
function fixture(name: string, edit: (dir: string) => void = () => undefined) {
  const dir = join(root, name);
  cpSync(SOURCE, dir, { recursive: true });
  const meta = JSON.parse(readFileSync(join(dir, 'problem.json'), 'utf8')) as { slug: string };
  writeFileSync(join(dir, 'problem.json'), JSON.stringify({ ...meta, slug: name }));
  edit(dir);
}

beforeAll(async () => {
  judge = createNodeJudge();
  root = mkdtempSync(join(tmpdir(), 'problems-'));

  fixture('good');
  fixture('bad-js', (dir) =>
    writeFileSync(join(dir, 'solution.js'), 'function rizzCalculator(s) { return 0; }'),
  );
  fixture('bad-py', (dir) =>
    writeFileSync(join(dir, 'solution.py'), 'def rizzCalculator(s):\n    return sum(s)\n'),
  );
  fixture('crashy-starter', (dir) =>
    writeFileSync(join(dir, 'starter.js'), 'function rizzCalculator(s) { throw new Error("x"); }'),
  );
  fixture('too-easy-starter', (dir) =>
    writeFileSync(join(dir, 'starter.py'), readFileSync(join(dir, 'solution.py'), 'utf8')),
  );
  fixture('no-hints', (dir) => rmSync(join(dir, 'hints.md')));

  for (const report of await validateProblems(root, judge)) {
    failures.set(report.folder, report.failures.join('\n'));
  }
});

afterAll(() => {
  judge.dispose();
  rmSync(root, { recursive: true, force: true });
});

describe('validateProblems', () => {
  it('accepts a good problem', () => {
    expect(failures.get('good')).toBe('');
  });

  it('catches a wrong JavaScript reference solution', () => {
    expect(failures.get('bad-js')).toMatch(/solution\.js does not pass/);
  });

  it('catches a wrong Python reference solution', () => {
    expect(failures.get('bad-py')).toMatch(/solution\.py does not pass/);
  });

  it('catches a starter that crashes instead of failing', () => {
    expect(failures.get('crashy-starter')).toMatch(
      /starter for javascript must fail tests, not crash/,
    );
  });

  it('catches a starter that already solves the problem', () => {
    expect(failures.get('too-easy-starter')).toMatch(
      /starter for python already passes every test/,
    );
  });

  it('reports schema problems instead of throwing', () => {
    expect(failures.get('no-hints')).toMatch(/missing hints\.md/);
  });
});

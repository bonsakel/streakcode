import { describe, expect, it } from 'vitest';
import { getProblemMeta, listProblems, loadProblem } from './index';

describe('problem index', () => {
  it('lists the shipped problems, easiest first, with unique slugs', () => {
    const problems = listProblems();
    expect(problems.length).toBeGreaterThanOrEqual(8);
    expect(new Set(problems.map((p) => p.slug)).size).toBe(problems.length);
    const ranks = problems.map((p) => ['easy', 'medium', 'hard'].indexOf(p.difficulty));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('loads a full problem without shipping reference solutions', async () => {
    const problem = await loadProblem('rizz-calculator');
    expect(problem.fnName).toBe('rizzCalculator');
    expect(problem.starters.python).toContain('def rizzCalculator');
    expect(problem.hints).toHaveLength(3);
    expect(problem.editorial.length).toBeGreaterThan(50);
    expect(problem.solutions).toBeUndefined();
    expect(getProblemMeta('rizz-calculator')?.title).toBe('Rizz Calculator');
  });

  it('rejects an unknown slug', async () => {
    await expect(loadProblem('nope')).rejects.toThrow(/No problem called/);
  });
});

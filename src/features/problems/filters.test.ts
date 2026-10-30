import { describe, expect, it } from 'vitest';
import type { ProblemMeta } from './schema';
import { allTags, DEFAULT_FILTERS, filterProblems, pickRandom } from './filters';

const make = (
  slug: string,
  difficulty: ProblemMeta['difficulty'],
  tags: string[],
): ProblemMeta => ({
  slug,
  title: slug.replaceAll('-', ' '),
  difficulty,
  xp: 50,
  tags,
  timeLimitMs: 1000,
  fnName: 'f',
  flavor: `flavor of ${slug}`,
  statement: 'x'.repeat(100),
});

const problems = [
  make('alpha-one', 'easy', ['arrays', 'hashing']),
  make('beta-two', 'medium', ['strings']),
  make('gamma-three', 'hard', ['arrays']),
];
const solvedSet = new Set(['alpha-one']);
const isSolved = (slug: string) => solvedSet.has(slug);
const slugs = (list: ProblemMeta[]) => list.map((p) => p.slug);

describe('filterProblems', () => {
  it('returns everything by default', () => {
    expect(filterProblems(problems, DEFAULT_FILTERS, isSolved)).toHaveLength(3);
  });

  it('filters by difficulty, tag and solved status together', () => {
    expect(
      slugs(filterProblems(problems, { ...DEFAULT_FILTERS, difficulty: 'hard' }, isSolved)),
    ).toEqual(['gamma-three']);
    expect(
      slugs(filterProblems(problems, { ...DEFAULT_FILTERS, tag: 'arrays' }, isSolved)),
    ).toEqual(['alpha-one', 'gamma-three']);
    expect(
      slugs(filterProblems(problems, { ...DEFAULT_FILTERS, solved: 'unsolved' }, isSolved)),
    ).toEqual(['beta-two', 'gamma-three']);
    expect(
      slugs(
        filterProblems(problems, { ...DEFAULT_FILTERS, tag: 'arrays', solved: 'solved' }, isSolved),
      ),
    ).toEqual(['alpha-one']);
  });

  it('searches title, flavor and tags, all words must match', () => {
    const q = (query: string) =>
      slugs(filterProblems(problems, { ...DEFAULT_FILTERS, query }, isSolved));
    expect(q('BETA')).toEqual(['beta-two']);
    expect(q('flavor gamma')).toEqual(['gamma-three']);
    expect(q('hashing arrays')).toEqual(['alpha-one']);
    expect(q('nothing matches this')).toEqual([]);
  });
});

describe('helpers', () => {
  it('lists unique sorted tags', () => {
    expect(allTags(problems)).toEqual(['arrays', 'hashing', 'strings']);
  });

  it('prefers unsolved problems and never repeats the excluded one', () => {
    const first = pickRandom(problems, isSolved, () => 0);
    expect(first?.slug).toBe('beta-two');
    expect(pickRandom(problems, isSolved, () => 0, 'beta-two')?.slug).toBe('gamma-three');
  });

  it('falls back to any problem when everything is solved', () => {
    expect(
      pickRandom(
        problems,
        () => true,
        () => 0.99,
      )?.slug,
    ).toBe('gamma-three');
    expect(pickRandom([], isSolved)).toBeUndefined();
  });
});

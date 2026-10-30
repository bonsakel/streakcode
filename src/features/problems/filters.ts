import type { ProblemMeta } from './schema';

export type SolvedFilter = 'all' | 'solved' | 'unsolved';

export interface ProblemFilters {
  query: string;
  difficulty: ProblemMeta['difficulty'] | 'all';
  tag: string | 'all';
  solved: SolvedFilter;
}

export const DEFAULT_FILTERS: ProblemFilters = {
  query: '',
  difficulty: 'all',
  tag: 'all',
  solved: 'all',
};

export function filterProblems(
  problems: readonly ProblemMeta[],
  filters: ProblemFilters,
  isSolved: (slug: string) => boolean,
): ProblemMeta[] {
  const words = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  return problems.filter((p) => {
    if (filters.difficulty !== 'all' && p.difficulty !== filters.difficulty) return false;
    if (filters.tag !== 'all' && !p.tags.includes(filters.tag)) return false;
    if (filters.solved !== 'all' && isSolved(p.slug) !== (filters.solved === 'solved'))
      return false;
    const haystack = `${p.title} ${p.flavor} ${p.tags.join(' ')}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

export function allTags(problems: readonly ProblemMeta[]): string[] {
  return [...new Set(problems.flatMap((p) => p.tags))].sort();
}

/** Pick a random unsolved problem when any remain, otherwise any problem; never `exclude`. */
export function pickRandom(
  problems: readonly ProblemMeta[],
  isSolved: (slug: string) => boolean,
  random: () => number = Math.random,
  exclude?: string,
): ProblemMeta | undefined {
  const pool = problems.filter((p) => p.slug !== exclude);
  const unsolved = pool.filter((p) => !isSolved(p.slug));
  const source = unsolved.length > 0 ? unsolved : pool;
  return source[Math.floor(random() * source.length)];
}

export const humanizeTag = (tag: string) => tag.replaceAll('-', ' ');

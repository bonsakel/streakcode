import { DIFFICULTIES, problemMetaSchema, type ProblemMeta } from './schema';
import { parseProblem, type Problem, type ProblemFiles } from './parseProblem';

/**
 * Build-time problem index. Vite resolves these globs while bundling, so adding a folder under
 * `problems/` is all it takes to ship a problem. Lists only need the small `problem.json` files;
 * the starters, tests, hints and editorial are separate lazy chunks fetched when a problem opens.
 * Reference solutions are excluded so they never reach the browser.
 */
const metaModules = import.meta.glob<unknown>('/problems/*/problem.json', {
  eager: true,
  import: 'default',
});

const fileLoaders = import.meta.glob<string>(
  ['/problems/*/*', '!/problems/*/problem.json', '!/problems/*/solution.*'],
  { query: '?raw', import: 'default' },
);

const folderOf = (path: string) => path.split('/').at(-2) ?? '';
const fileOf = (path: string) => path.split('/').at(-1) ?? '';

const metas = new Map<string, ProblemMeta>();
for (const [path, raw] of Object.entries(metaModules)) {
  const meta = problemMetaSchema.parse(raw);
  if (meta.slug !== folderOf(path)) {
    throw new Error(`problems/${folderOf(path)}: slug "${meta.slug}" must match the folder name.`);
  }
  metas.set(meta.slug, meta);
}

const difficultyRank = (d: ProblemMeta['difficulty']) => DIFFICULTIES.indexOf(d);

const sorted = [...metas.values()].sort(
  (a, b) =>
    difficultyRank(a.difficulty) - difficultyRank(b.difficulty) ||
    a.xp - b.xp ||
    a.title.localeCompare(b.title),
);

/** Every problem's metadata, easiest first. */
export function listProblems(): readonly ProblemMeta[] {
  return sorted;
}

export function getProblemMeta(slug: string): ProblemMeta | undefined {
  return metas.get(slug);
}

const cache = new Map<string, Promise<Problem>>();

/** Fetch everything needed to play a problem. Rejects for an unknown slug. */
export function loadProblem(slug: string): Promise<Problem> {
  const meta = metas.get(slug);
  if (!meta) return Promise.reject(new Error(`No problem called "${slug}".`));

  let pending = cache.get(slug);
  if (!pending) {
    pending = (async () => {
      const files: ProblemFiles = { 'problem.json': JSON.stringify(meta) };
      await Promise.all(
        Object.entries(fileLoaders)
          .filter(([path]) => folderOf(path) === slug)
          .map(async ([path, load]) => {
            files[fileOf(path)] = await load();
          }),
      );
      return parseProblem(slug, files);
    })();
    // A failed load (e.g. offline) must be retryable.
    pending.catch(() => cache.delete(slug));
    cache.set(slug, pending);
  }
  return pending;
}

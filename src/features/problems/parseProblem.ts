import type { z } from 'zod';
import type { Language, TestCase } from '@/features/judge/types';
import {
  problemMetaSchema,
  REQUIRED_HIDDEN_TESTS,
  REQUIRED_HINTS,
  REQUIRED_VISIBLE_TESTS,
  testsSchema,
  type ProblemMeta,
} from './schema';

/** File name -> text, for one problem folder. */
export type ProblemFiles = Record<string, string>;

export interface Problem extends ProblemMeta {
  starters: Record<Language, string>;
  tests: TestCase[];
  /** Progressive hints, gentlest first. */
  hints: string[];
  editorial: string;
  /** Reference solutions. Only present when loaded by tooling, never shipped to the browser. */
  solutions?: Partial<Record<Language, string>>;
  checkers?: Partial<Record<Language, string>>;
}

export const STARTER_FILES: Record<Language, string> = {
  javascript: 'starter.js',
  typescript: 'starter.ts',
  python: 'starter.py',
};
export const SOLUTION_FILES: Partial<Record<Language, string>> = {
  javascript: 'solution.js',
  python: 'solution.py',
};
export const CHECKER_FILES: Partial<Record<Language, string>> = {
  javascript: 'checker.js',
  python: 'checker.py',
};

export class ProblemError extends Error {
  constructor(
    readonly slug: string,
    readonly problems: string[],
  ) {
    super(`Problem "${slug}": ${problems.join('; ')}`);
    this.name = 'ProblemError';
  }
}

function formatIssues(prefix: string, error: z.ZodError): string[] {
  return error.issues.map(
    (issue) => `${prefix}${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** Hints live in one file, separated by a line containing only `---`. */
export function parseHints(markdown: string): string[] {
  return markdown
    .split(/^---\s*$/m)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Turn a problem folder's files into a validated Problem. Shared by the browser loader and the
 * validate-problems script so both agree on what a well-formed problem is.
 * `folder` is the directory name, which must equal the slug in `problem.json`.
 */
export function parseProblem(folder: string, files: ProblemFiles): Problem {
  const issues: string[] = [];
  const need = (name: string): string => {
    const text = files[name];
    if (text === undefined || text.trim() === '') issues.push(`missing ${name}`);
    return text ?? '';
  };

  const metaJson = parseJson(need('problem.json'));
  const meta = metaJson.ok ? problemMetaSchema.safeParse(metaJson.value) : null;
  if (!metaJson.ok) issues.push(`problem.json is not valid JSON (${metaJson.message})`);
  else if (meta && !meta.success) issues.push(...formatIssues('problem.json ', meta.error));
  else if (meta?.success && meta.data.slug !== folder) {
    issues.push(`slug "${meta.data.slug}" must match folder name "${folder}"`);
  }

  const testsJson = parseJson(need('tests.json'));
  const tests = testsJson.ok ? testsSchema.safeParse(testsJson.value) : null;
  if (!testsJson.ok) issues.push(`tests.json is not valid JSON (${testsJson.message})`);
  else if (tests && !tests.success) issues.push(...formatIssues('tests.json ', tests.error));
  else if (tests?.success) {
    const hidden = tests.data.filter((t) => t.hidden).length;
    const visible = tests.data.length - hidden;
    if (visible < REQUIRED_VISIBLE_TESTS) {
      issues.push(`needs at least ${REQUIRED_VISIBLE_TESTS} visible tests (has ${visible})`);
    }
    if (hidden < REQUIRED_HIDDEN_TESTS) {
      issues.push(`needs at least ${REQUIRED_HIDDEN_TESTS} hidden tests (has ${hidden})`);
    }
  }

  const starters = {} as Record<Language, string>;
  for (const language of Object.keys(STARTER_FILES) as Language[]) {
    starters[language] = need(STARTER_FILES[language]);
  }

  const hints = parseHints(need('hints.md'));
  if (hints.length !== REQUIRED_HINTS) {
    issues.push(
      `hints.md needs exactly ${REQUIRED_HINTS} hints separated by "---" (has ${hints.length})`,
    );
  }
  const editorial = need('editorial.md');

  if (issues.length > 0 || !meta?.success || !tests?.success) {
    throw new ProblemError(folder, issues);
  }

  const pick = (names: Partial<Record<Language, string>>) => {
    const out: Partial<Record<Language, string>> = {};
    for (const language of Object.keys(names) as Language[]) {
      const text = files[names[language] ?? ''];
      if (text !== undefined) out[language] = text;
    }
    return out;
  };
  const solutions = pick(SOLUTION_FILES);
  const checkers = pick(CHECKER_FILES);

  return {
    ...meta.data,
    starters,
    tests: tests.data,
    hints,
    editorial,
    ...(Object.keys(solutions).length > 0 ? { solutions } : {}),
    ...(Object.keys(checkers).length > 0 ? { checkers } : {}),
  };
}

import { z } from 'zod';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Contents of `problem.json`. */
export const problemMetaSchema = z.object({
  slug: z.string().regex(SLUG, 'slug must be lowercase kebab-case'),
  title: z.string().min(3).max(60),
  difficulty: z.enum(DIFFICULTIES),
  xp: z.number().int().min(10).max(1000),
  tags: z.array(z.string().regex(SLUG)).min(1).max(5),
  /** Per-test wall-clock limit. */
  timeLimitMs: z.number().int().min(100).max(10_000),
  /** Function the user implements; the same name is used in every language. */
  fnName: z.string().regex(IDENTIFIER),
  /** One or two jokey lines shown on cards. Never carries rules; the statement does. */
  flavor: z.string().min(10).max(200),
  /** Markdown: story, task, constraints, examples, edge cases. */
  statement: z.string().min(80),
  /** Absolute/relative tolerance for numbers; omit for exact comparison. */
  epsilon: z.number().positive().optional(),
});
export type ProblemMeta = z.infer<typeof problemMetaSchema>;

export const testCaseSchema = z.object({
  input: z.array(z.json()),
  expected: z.json(),
  hidden: z.boolean().default(false),
});

/** Contents of `tests.json`. */
export const testsSchema = z.array(testCaseSchema).min(6);

export const REQUIRED_VISIBLE_TESTS = 3;
export const REQUIRED_HIDDEN_TESTS = 3;
export const REQUIRED_HINTS = 3;

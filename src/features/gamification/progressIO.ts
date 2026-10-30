import { z } from 'zod';
import { useSettings } from '@/store/settings';
import { emptyProgress, useProgress, type ProgressData } from '@/store/progress';

const language = z.enum(['javascript', 'typescript', 'python']);
const verdict = z.enum([
  'accepted',
  'wrong_answer',
  'time_limit_exceeded',
  'runtime_error',
  'compile_error',
]);
const count = z.number().int().min(0);

const submission = z.object({
  id: z.string(),
  at: z.number(),
  language,
  verdict,
  passed: count,
  total: count,
  maxTimeMs: z.number().min(0),
  code: z.string().max(200_000),
});

const solved = z.object({
  at: z.number(),
  language,
  failedBefore: count,
  hintsUsed: count,
  maxTimeMs: z.number().min(0),
  xp: count,
  fast: z.boolean(),
});

const DAY = /^\d{4}-\d{2}-\d{2}$/;

const progressSchema = z.object({
  submissions: z.record(z.string(), z.array(submission).max(100)),
  solved: z.record(z.string(), solved),
  failedAttempts: z.record(z.string(), count),
  hintsRevealed: z.record(z.string(), count),
  activity: z.record(z.string().regex(DAY), count),
  dailyDone: z.record(z.string().regex(DAY), z.string()),
  bonusXp: count,
  achievements: z.record(z.string(), z.number()),
});

const exportSchema = z.object({
  app: z.enum(['streakcode', 'skill-issue']),
  version: z.literal(1),
  exportedAt: z.number().optional(),
  handle: z.string().min(1).max(40).optional(),
  progress: progressSchema,
});

export function exportProgress(): string {
  const { handle } = useSettings.getState();
  const s = useProgress.getState();
  const progress: ProgressData = {
    submissions: s.submissions,
    solved: s.solved,
    failedAttempts: s.failedAttempts,
    hintsRevealed: s.hintsRevealed,
    activity: s.activity,
    dailyDone: s.dailyDone,
    bonusXp: s.bonusXp,
    achievements: s.achievements,
  };
  return JSON.stringify(
    { app: 'streakcode', version: 1, exportedAt: Date.now(), handle, progress },
    null,
    2,
  );
}

export type ImportResult = { ok: true; solved: number } | { ok: false; error: string };

/** Validates before touching anything, so a bad file can never corrupt existing progress. */
export function importProgress(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That doesn't look like JSON. Is it the right file?" };
  }
  const parsed = exportSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "That file isn't a Streakcode export (or it's damaged)." };
  }
  const { progress, handle } = parsed.data;
  useProgress.getState().replaceAll({ ...emptyProgress(), ...progress });
  if (handle) useSettings.setState({ handle });
  return { ok: true, solved: Object.keys(progress.solved).length };
}

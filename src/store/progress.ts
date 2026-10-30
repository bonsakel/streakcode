import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language, VerdictKind } from '@/features/judge/types';

export interface Submission {
  id: string;
  at: number;
  language: Language;
  verdict: VerdictKind;
  passed: number;
  total: number;
  maxTimeMs: number;
  code: string;
}

export interface SolvedInfo {
  at: number;
  language: Language;
  /** Failed submissions before the first accepted one. */
  failedBefore: number;
  hintsUsed: number;
  maxTimeMs: number;
}

export const MAX_SUBMISSIONS_PER_PROBLEM = 25;

interface ProgressState {
  /** Newest first. */
  submissions: Record<string, Submission[]>;
  solved: Record<string, SolvedInfo>;
  failedAttempts: Record<string, number>;
  hintsRevealed: Record<string, number>;
  recordSubmission: (slug: string, submission: Omit<Submission, 'id' | 'at'>) => void;
  revealHint: (slug: string, total: number) => void;
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      submissions: {},
      solved: {},
      failedAttempts: {},
      hintsRevealed: {},

      recordSubmission: (slug, submission) =>
        set((s) => {
          const at = Date.now();
          const entry: Submission = { ...submission, id: newId(), at };
          const history = [entry, ...(s.submissions[slug] ?? [])].slice(
            0,
            MAX_SUBMISSIONS_PER_PROBLEM,
          );
          const next: Partial<ProgressState> = {
            submissions: { ...s.submissions, [slug]: history },
          };

          if (submission.verdict !== 'accepted') {
            next.failedAttempts = {
              ...s.failedAttempts,
              [slug]: (s.failedAttempts[slug] ?? 0) + 1,
            };
          } else if (!s.solved[slug]) {
            next.solved = {
              ...s.solved,
              [slug]: {
                at,
                language: submission.language,
                failedBefore: s.failedAttempts[slug] ?? 0,
                hintsUsed: s.hintsRevealed[slug] ?? 0,
                maxTimeMs: submission.maxTimeMs,
              },
            };
          }
          return next;
        }),

      revealHint: (slug, total) =>
        set((s) => ({
          hintsRevealed: {
            ...s.hintsRevealed,
            [slug]: Math.min(total, (s.hintsRevealed[slug] ?? 0) + 1),
          },
        })),
    }),
    { name: 'skill-issue:progress', version: 1 },
  ),
);

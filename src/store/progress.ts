import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { evaluateAchievements } from '@/features/gamification/achievements';
import { dailySlug } from '@/features/gamification/daily';
import { dayKey } from '@/features/gamification/dates';
import { levelFor, type LevelInfo } from '@/features/gamification/levels';
import { computeStreak, type StreakInfo } from '@/features/gamification/streak';
import { computeXp, dailyBonus, type XpBreakdown } from '@/features/gamification/xp';
import type { Language, VerdictKind } from '@/features/judge/types';
import { getProblemMeta, listProblems } from '@/features/problems';

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
  /** XP awarded for this solve. */
  xp: number;
  /** Earned the speed bonus. */
  fast: boolean;
}

export const MAX_SUBMISSIONS_PER_PROBLEM = 25;

export interface ProgressData {
  /** Newest first. */
  submissions: Record<string, Submission[]>;
  solved: Record<string, SolvedInfo>;
  failedAttempts: Record<string, number>;
  hintsRevealed: Record<string, number>;
  /** Accepted submissions per local day (`YYYY-MM-DD`); drives streaks and the heatmap. */
  activity: Record<string, number>;
  /** Local day to the slug of the daily challenge completed that day. */
  dailyDone: Record<string, string>;
  /** XP from daily-challenge bonuses (solve XP lives on each SolvedInfo). */
  bonusXp: number;
  /** Achievement id to unlock time. */
  achievements: Record<string, number>;
}

export const emptyProgress = (): ProgressData => ({
  submissions: {},
  solved: {},
  failedAttempts: {},
  hintsRevealed: {},
  activity: {},
  dailyDone: {},
  bonusXp: 0,
  achievements: {},
});

export interface SubmissionOutcome {
  /** Set only when this submission first solved the problem. */
  xp: XpBreakdown | null;
  dailyBonus: number;
  newAchievements: string[];
  levelUp: LevelInfo | null;
}

interface ProgressState extends ProgressData {
  recordSubmission: (
    slug: string,
    submission: Omit<Submission, 'id' | 'at'>,
    now?: Date,
  ) => SubmissionOutcome;
  revealHint: (slug: string, total: number) => void;
  replaceAll: (data: ProgressData) => void;
  reset: () => void;
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const totalXp = (s: Pick<ProgressData, 'solved' | 'bonusXp'>) =>
  Object.values(s.solved).reduce((sum, info) => sum + info.xp, 0) + s.bonusXp;

export const streakOf = (s: Pick<ProgressData, 'activity'>, now: Date = new Date()): StreakInfo =>
  computeStreak(Object.keys(s.activity), dayKey(now));

/** Unlock everything already earned by existing data (used after a migration or import). */
export function withEarnedAchievements(data: ProgressData, now: Date = new Date()): ProgressData {
  const earned = evaluateAchievements(
    {
      solved: data.solved,
      submissions: data.submissions,
      problems: listProblems(),
      dailyDays: Object.keys(data.dailyDone).length,
      levelIndex: levelFor(totalXp(data)).index,
      streak: streakOf(data, now),
      event: null,
    },
    data.achievements,
  );
  if (earned.length === 0) return data;
  const at = now.getTime();
  return {
    ...data,
    achievements: { ...data.achievements, ...Object.fromEntries(earned.map((id) => [id, at])) },
  };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),

      recordSubmission: (slug, submission, now = new Date()) => {
        const s = get();
        const at = now.getTime();
        const meta = getProblemMeta(slug);
        const entry: Submission = { ...submission, id: newId(), at };
        const accepted = submission.verdict === 'accepted';
        const day = dayKey(now);

        const next: ProgressData = {
          ...emptyProgress(),
          submissions: {
            ...s.submissions,
            [slug]: [entry, ...(s.submissions[slug] ?? [])].slice(0, MAX_SUBMISSIONS_PER_PROBLEM),
          },
          solved: s.solved,
          failedAttempts: s.failedAttempts,
          hintsRevealed: s.hintsRevealed,
          activity: s.activity,
          dailyDone: s.dailyDone,
          bonusXp: s.bonusXp,
          achievements: s.achievements,
        };

        let xp: XpBreakdown | null = null;
        let firstSolve: SolvedInfo | null = null;
        if (!accepted) {
          next.failedAttempts = {
            ...s.failedAttempts,
            [slug]: (s.failedAttempts[slug] ?? 0) + 1,
          };
        } else {
          next.activity = { ...s.activity, [day]: (s.activity[day] ?? 0) + 1 };
          if (!s.solved[slug]) {
            xp = computeXp({
              baseXp: meta?.xp ?? 0,
              hintsUsed: s.hintsRevealed[slug] ?? 0,
              failedBefore: s.failedAttempts[slug] ?? 0,
              maxTimeMs: submission.maxTimeMs,
              timeLimitMs: meta?.timeLimitMs ?? 1000,
            });
            firstSolve = {
              at,
              language: submission.language,
              failedBefore: s.failedAttempts[slug] ?? 0,
              hintsUsed: s.hintsRevealed[slug] ?? 0,
              maxTimeMs: submission.maxTimeMs,
              xp: xp.total,
              fast: xp.fast,
            };
            next.solved = { ...s.solved, [slug]: firstSolve };
          }
        }

        const streak = streakOf(next, now);
        let bonus = 0;
        const todays = dailySlug(
          day,
          listProblems().map((p) => p.slug),
        );
        if (accepted && slug === todays && !s.dailyDone[day]) {
          bonus = dailyBonus(streak.current);
          next.dailyDone = { ...s.dailyDone, [day]: slug };
          next.bonusXp = s.bonusXp + bonus;
        }

        const before = levelFor(totalXp(s));
        const after = levelFor(totalXp(next));
        const newAchievements = evaluateAchievements(
          {
            solved: next.solved,
            submissions: next.submissions,
            problems: listProblems(),
            dailyDays: Object.keys(next.dailyDone).length,
            levelIndex: after.index,
            streak,
            event: { slug, verdict: submission.verdict, at: now, firstSolve },
          },
          next.achievements,
        );
        if (newAchievements.length > 0) {
          next.achievements = {
            ...next.achievements,
            ...Object.fromEntries(newAchievements.map((id) => [id, at])),
          };
        }

        set(next);
        return {
          xp,
          dailyBonus: bonus,
          newAchievements,
          levelUp: after.index > before.index ? after : null,
        };
      },

      revealHint: (slug, total) =>
        set((s) => ({
          hintsRevealed: {
            ...s.hintsRevealed,
            [slug]: Math.min(total, (s.hintsRevealed[slug] ?? 0) + 1),
          },
        })),

      replaceAll: (data) => set(withEarnedAchievements({ ...emptyProgress(), ...data })),
      reset: () => set(emptyProgress()),
    }),
    {
      name: 'skill-issue:progress',
      version: 2,
      migrate: (persisted, version) => {
        const old = persisted as Partial<ProgressData> | null;
        if (!old || version >= 2) return old as ProgressData;
        const solved = Object.fromEntries(
          Object.entries(old.solved ?? {}).map(([slug, info]) => {
            const meta = getProblemMeta(slug);
            const xp = computeXp({
              baseXp: meta?.xp ?? 0,
              hintsUsed: info.hintsUsed,
              failedBefore: info.failedBefore,
              maxTimeMs: info.maxTimeMs,
              timeLimitMs: meta?.timeLimitMs ?? 1000,
            });
            return [slug, { ...info, xp: xp.total, fast: xp.fast }];
          }),
        );
        const activity: Record<string, number> = {};
        for (const info of Object.values(solved)) {
          const day = dayKey(new Date(info.at));
          activity[day] = (activity[day] ?? 0) + 1;
        }
        return withEarnedAchievements({ ...emptyProgress(), ...old, solved, activity });
      },
    },
  ),
);

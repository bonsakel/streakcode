import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BOSS_WIN_XP,
  pickBossProblems,
  recordClear,
  settleRun,
  startRun,
  type BossRun,
} from '@/features/boss/engine';
import { listProblems } from '@/features/problems';
import { useProgress } from './progress';

interface BossState {
  run: BossRun | null;
  wins: number;
  losses: number;
  /** Fastest win in ms. */
  bestMs: number | null;
  start: (now?: number, random?: () => number) => void;
  /** Call when a submission is Accepted. Returns true if that cleared a stage. */
  clear: (slug: string, now?: number) => boolean;
  /** Expire the run if the clock ran out. */
  settle: (now?: number) => void;
  dismiss: () => void;
}

/** Applies a run update once, crediting the win/loss tally and the win bonus exactly one time. */
function finish(s: BossState, next: BossRun): Partial<BossState> {
  const justEnded = next.outcome !== null && s.run?.outcome === null;
  if (!justEnded) return { run: next };
  if (next.outcome === 'won') {
    useProgress.getState().awardBonus(BOSS_WIN_XP);
    const took = (next.finishedAt ?? next.endsAt) - next.startedAt;
    return {
      run: next,
      wins: s.wins + 1,
      bestMs: s.bestMs === null ? took : Math.min(s.bestMs, took),
    };
  }
  return { run: next, losses: s.losses + 1 };
}

export const useBoss = create<BossState>()(
  persist(
    (set, get) => ({
      run: null,
      wins: 0,
      losses: 0,
      bestMs: null,

      start: (now = Date.now(), random = Math.random) => {
        const slugs = pickBossProblems(listProblems(), random);
        if (slugs.length === 0) return;
        set({ run: startRun(slugs, now) });
      },

      clear: (slug, now = Date.now()) => {
        const s = get();
        if (!s.run) return false;
        const next = recordClear(s.run, slug, now);
        if (next === s.run) return false;
        set(finish(s, next));
        return next.cleared.length > s.run.cleared.length;
      },

      settle: (now = Date.now()) => {
        const s = get();
        if (!s.run) return;
        const next = settleRun(s.run, now);
        if (next !== s.run) set(finish(s, next));
      },

      dismiss: () => set({ run: null }),
    }),
    { name: 'skill-issue:boss', version: 1 },
  ),
);

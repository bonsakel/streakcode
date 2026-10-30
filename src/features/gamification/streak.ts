import { dayDiff } from './dates';

export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 3;

export interface StreakInfo {
  /** Streak as of today; 0 once it has lapsed. */
  current: number;
  longest: number;
  /** Streak-freeze tokens in the bank. */
  freezes: number;
  /** Solved something today already. */
  doneToday: boolean;
  /** Alive but not yet extended today. */
  atRisk: boolean;
}

/**
 * Replays the active days in order. Every 7th streak day banks a freeze token; a gap is bridged
 * automatically if there are enough tokens to cover each missed day, otherwise the streak restarts.
 */
export function computeStreak(activeDays: Iterable<string>, today: string): StreakInfo {
  const days = [...new Set(activeDays)].sort();
  let streak = 0;
  let longest = 0;
  let freezes = 0;
  let prev: string | null = null;

  for (const day of days) {
    if (prev === null) {
      streak = 1;
    } else {
      const missed = dayDiff(prev, day) - 1;
      if (missed === 0) {
        streak += 1;
      } else if (freezes >= missed) {
        freezes -= missed;
        streak += 1;
      } else {
        streak = 1;
      }
      if (streak % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
    }
    longest = Math.max(longest, streak);
    prev = day;
  }

  if (prev === null) return { current: 0, longest: 0, freezes: 0, doneToday: false, atRisk: false };

  const gap = Math.max(0, dayDiff(prev, today));
  const alive = gap <= 1 || freezes >= gap - 1;
  return {
    current: alive ? streak : 0,
    longest,
    freezes,
    doneToday: gap === 0,
    atRisk: alive && gap > 0,
  };
}

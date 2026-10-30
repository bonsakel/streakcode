export interface XpInput {
  baseXp: number;
  hintsUsed: number;
  failedBefore: number;
  maxTimeMs: number;
  timeLimitMs: number;
}

export interface XpBreakdown {
  base: number;
  hintPenalty: number;
  firstTry: number;
  speed: number;
  total: number;
  /** Earned the speed bonus. */
  fast: boolean;
}

export const HINT_COST = 0.15;
export const MAX_HINT_PENALTY = 0.6;
export const FIRST_TRY_BONUS = 0.25;
export const SPEED_BONUS = 0.1;
export const SPEED_THRESHOLD = 0.1;

/** XP for the first accepted submission of a problem. Hints cost XP, but never below 40% of base. */
export function computeXp(input: XpInput): XpBreakdown {
  const { baseXp } = input;
  const hintPenalty = Math.round(
    baseXp * Math.min(MAX_HINT_PENALTY, Math.max(0, input.hintsUsed) * HINT_COST),
  );
  const firstTry = input.failedBefore === 0 ? Math.round(baseXp * FIRST_TRY_BONUS) : 0;
  const fast = input.maxTimeMs <= input.timeLimitMs * SPEED_THRESHOLD;
  const speed = fast ? Math.round(baseXp * SPEED_BONUS) : 0;
  return {
    base: baseXp,
    hintPenalty,
    firstTry,
    speed,
    total: Math.max(1, baseXp - hintPenalty + firstTry + speed),
    fast,
  };
}

export const DAILY_BONUS_BASE = 25;
export const DAILY_BONUS_PER_STREAK_DAY = 5;
export const DAILY_BONUS_STREAK_CAP = 7;

export function dailyBonus(streak: number): number {
  return (
    DAILY_BONUS_BASE +
    Math.min(Math.max(streak, 0), DAILY_BONUS_STREAK_CAP) * DAILY_BONUS_PER_STREAK_DAY
  );
}

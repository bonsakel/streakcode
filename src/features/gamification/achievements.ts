import type { Language, VerdictKind } from '@/features/judge/types';
import type { Difficulty } from '@/features/problems/schema';
import type { StreakInfo } from './streak';

/** Minimal shapes so this module stays pure and independent of the store. */
export interface AchievementSolved {
  failedBefore: number;
  hintsUsed: number;
  fast: boolean;
}

export interface AchievementSubmission {
  language: Language;
  verdict: VerdictKind;
}

export interface SubmitEvent {
  slug: string;
  verdict: VerdictKind;
  at: Date;
  /** Present only on the submission that first solved the problem. */
  firstSolve: AchievementSolved | null;
}

export interface AchievementContext {
  solved: Record<string, AchievementSolved>;
  submissions: Record<string, AchievementSubmission[]>;
  problems: readonly { slug: string; difficulty: Difficulty }[];
  dailyDays: number;
  levelIndex: number;
  streak: StreakInfo;
  event: SubmitEvent | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (c: AchievementContext) => boolean;
}

const solvedList = (c: AchievementContext) => Object.values(c.solved);
const solvedCount = (c: AchievementContext) => solvedList(c).length;
const allSubmissions = (c: AchievementContext) => Object.values(c.submissions).flat();
const hasBefore = (c: AchievementContext, verdict: VerdictKind) =>
  Boolean(c.event?.firstSolve) &&
  (c.submissions[c.event!.slug] ?? []).some((s) => s.verdict === verdict);
const hour = (c: AchievementContext) => c.event?.at.getHours() ?? -1;
const solvedDifficulty = (c: AchievementContext, d: Difficulty) =>
  c.problems.filter((p) => p.difficulty === d && c.solved[p.slug]);

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Solve your first problem.',
    icon: '🩸',
    check: (c) => solvedCount(c) >= 1,
  },
  {
    id: 'high-five',
    title: 'High Five',
    description: 'Solve 5 problems.',
    icon: '🖐️',
    check: (c) => solvedCount(c) >= 5,
  },
  {
    id: 'double-digits',
    title: 'Double Digits',
    description: 'Solve 10 problems.',
    icon: '🔟',
    check: (c) => solvedCount(c) >= 10,
  },
  {
    id: 'fully-cooked',
    title: 'Fully Cooked',
    description: 'Solve every problem on the site.',
    icon: '🍳',
    check: (c) => c.problems.length > 0 && c.problems.every((p) => c.solved[p.slug]),
  },
  {
    id: 'warmed-up',
    title: 'Warmed Up',
    description: 'Solve every easy problem.',
    icon: '☕',
    check: (c) => {
      const easy = c.problems.filter((p) => p.difficulty === 'easy');
      return easy.length > 0 && easy.every((p) => c.solved[p.slug]);
    },
  },
  {
    id: 'big-brain',
    title: 'Big Brain',
    description: 'Solve a hard problem.',
    icon: '🧠',
    check: (c) => solvedDifficulty(c, 'hard').length >= 1,
  },
  {
    id: 'touch-grass',
    title: 'Touch Grass',
    description: 'Solve something at a sensible hour (6 AM to 6 PM).',
    icon: '🌱',
    check: (c) => Boolean(c.event?.firstSolve) && hour(c) >= 6 && hour(c) < 18,
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Solve something after 2 AM. Hydrate, please.',
    icon: '🦉',
    check: (c) => Boolean(c.event?.firstSolve) && hour(c) >= 2 && hour(c) < 5,
  },
  {
    id: 'weekend-warrior',
    title: 'Weekend Warrior',
    description: 'Solve something on a Saturday or Sunday.',
    icon: '🛋️',
    check: (c) => Boolean(c.event?.firstSolve) && [0, 6].includes(c.event?.at.getDay() ?? -1),
  },
  {
    id: 'it-compiles',
    title: 'It Compiles?!',
    description: 'Solve a problem after a compile error on it.',
    icon: '🤯',
    check: (c) => hasBefore(c, 'compile_error'),
  },
  {
    id: 'tle-survivor',
    title: 'TLE Survivor',
    description: 'Solve a problem after timing out on it.',
    icon: '⏳',
    check: (c) => hasBefore(c, 'time_limit_exceeded'),
  },
  {
    id: 'comeback-kid',
    title: 'Comeback Kid',
    description: 'Solve a problem after 5 failed attempts.',
    icon: '🦸',
    check: (c) => (c.event?.firstSolve?.failedBefore ?? 0) >= 5,
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Solve 3 problems on the first try without hints.',
    icon: '💎',
    check: (c) =>
      solvedList(c).filter((s) => s.failedBefore === 0 && s.hintsUsed === 0).length >= 3,
  },
  {
    id: 'no-hints-gang',
    title: 'No Hints Gang',
    description: 'Solve 5 problems without a single hint.',
    icon: '🙈',
    check: (c) => solvedList(c).filter((s) => s.hintsUsed === 0).length >= 5,
  },
  {
    id: 'phone-a-friend',
    title: 'Phone a Friend',
    description: 'Use every hint on a problem, then solve it. No shame.',
    icon: '📞',
    check: (c) => (c.event?.firstSolve?.hintsUsed ?? 0) >= 3,
  },
  {
    id: 'speedrunner',
    title: 'Speedrunner',
    description: 'Earn the speed bonus on 3 problems.',
    icon: '⚡',
    check: (c) => solvedList(c).filter((s) => s.fast).length >= 3,
  },
  {
    id: 'polyglot',
    title: 'Polyglot',
    description: 'Get Accepted in JavaScript, TypeScript and Python.',
    icon: '🗣️',
    check: (c) =>
      new Set(
        allSubmissions(c)
          .filter((s) => s.verdict === 'accepted')
          .map((s) => s.language),
      ).size >= 3,
  },
  {
    id: 'skill-issue',
    title: 'Skill Issue (Affectionate)',
    description: 'Rack up 10 failed submissions. Every pro has been here.',
    icon: '🫠',
    check: (c) => allSubmissions(c).filter((s) => s.verdict !== 'accepted').length >= 10,
  },
  {
    id: 'grinder',
    title: 'Grinder',
    description: 'Make 25 submissions.',
    icon: '⚙️',
    check: (c) => allSubmissions(c).length >= 25,
  },
  {
    id: 'on-a-roll',
    title: 'On a Roll',
    description: 'Hit a 3-day streak.',
    icon: '🔥',
    check: (c) => c.streak.current >= 3 || c.streak.longest >= 3,
  },
  {
    id: 'week-of-rizz',
    title: 'Week of Rizz',
    description: 'Hit a 7-day streak and earn a streak freeze.',
    icon: '🧊',
    check: (c) => c.streak.longest >= 7,
  },
  {
    id: 'lore-accurate',
    title: 'Lore Accurate',
    description: 'Hit a 30-day streak.',
    icon: '📜',
    check: (c) => c.streak.longest >= 30,
  },
  {
    id: 'daily-driver',
    title: 'Daily Driver',
    description: 'Complete 3 daily challenges.',
    icon: '📅',
    check: (c) => c.dailyDays >= 3,
  },
  {
    id: 'main-character-energy',
    title: 'Main Character Energy',
    description: 'Reach the Main Character level.',
    icon: '🎬',
    check: (c) => c.levelIndex >= 3,
  },
  {
    id: 'certified-menace',
    title: 'Certified Menace',
    description: 'Reach the top level.',
    icon: '👑',
    check: (c) => c.levelIndex >= 5,
  },
];

export const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Ids that are newly earned given what is already unlocked. */
export function evaluateAchievements(
  context: AchievementContext,
  unlocked: Readonly<Record<string, number>>,
): string[] {
  return ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.check(context)).map((a) => a.id);
}

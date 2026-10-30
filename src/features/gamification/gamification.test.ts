import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, evaluateAchievements, type AchievementContext } from './achievements';
import { dailySlug } from './daily';
import { addDays, dayDiff, dayKey } from './dates';
import { levelFor, LEVELS } from './levels';
import { computeStreak } from './streak';
import { computeXp, dailyBonus } from './xp';

describe('dates', () => {
  it('formats and diffs local days', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(dayDiff('2026-01-01', '2026-01-04')).toBe(3);
    expect(dayDiff('2026-03-07', '2026-03-09')).toBe(2);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('xp', () => {
  const base = { baseXp: 100, hintsUsed: 0, failedBefore: 0, maxTimeMs: 900, timeLimitMs: 1000 };
  it('gives a first-try bonus', () => {
    const r = computeXp(base);
    expect(r).toMatchObject({ firstTry: 25, speed: 0, hintPenalty: 0, total: 125 });
  });
  it('drops the first-try bonus after failures', () => {
    expect(computeXp({ ...base, failedBefore: 2 }).total).toBe(100);
  });
  it('charges for hints but never below 40% of base', () => {
    expect(computeXp({ ...base, failedBefore: 1, hintsUsed: 2 }).total).toBe(70);
    expect(computeXp({ ...base, failedBefore: 1, hintsUsed: 99 }).total).toBe(40);
  });
  it('gives a speed bonus for fast runs', () => {
    const r = computeXp({ ...base, failedBefore: 1, maxTimeMs: 50 });
    expect(r.fast).toBe(true);
    expect(r.total).toBe(110);
  });
  it('scales the daily bonus with streak, capped', () => {
    expect(dailyBonus(0)).toBe(25);
    expect(dailyBonus(3)).toBe(40);
    expect(dailyBonus(100)).toBe(60);
  });
});

describe('levels', () => {
  it('has the six spec titles in order', () => {
    expect(LEVELS.map((l) => l.title)).toEqual([
      'NPC',
      'Side Character',
      'Plot Armor',
      'Main Character',
      'Final Boss',
      'Certified Menace',
    ]);
  });
  it('maps xp to levels and progress', () => {
    expect(levelFor(0)).toMatchObject({ index: 0, title: 'NPC', progress: 0 });
    expect(levelFor(99).index).toBe(0);
    expect(levelFor(100).title).toBe('Side Character');
    expect(levelFor(200)).toMatchObject({
      index: 1,
      xpIntoLevel: 100,
      xpForNext: 200,
      progress: 0.5,
    });
    expect(levelFor(99999)).toMatchObject({ index: 5, xpForNext: null, progress: 1 });
    expect(levelFor(-5).xp).toBe(0);
  });
});

describe('streak', () => {
  const run = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));

  it('is empty with no activity', () => {
    expect(computeStreak([], '2026-02-01').current).toBe(0);
  });
  it('counts consecutive days and flags today', () => {
    const s = computeStreak(run('2026-02-01', 3), '2026-02-03');
    expect(s).toMatchObject({ current: 3, longest: 3, doneToday: true, atRisk: false });
  });
  it('is at risk, not broken, if last active yesterday', () => {
    const s = computeStreak(run('2026-02-01', 3), '2026-02-04');
    expect(s).toMatchObject({ current: 3, doneToday: false, atRisk: true });
  });
  it('breaks after a missed day without a freeze', () => {
    const s = computeStreak(run('2026-02-01', 3), '2026-02-06');
    expect(s.current).toBe(0);
    expect(s.longest).toBe(3);
  });
  it('earns a freeze every 7 days and spends it on a gap', () => {
    const days = [...run('2026-02-01', 7), '2026-02-09'];
    const s = computeStreak(days, '2026-02-09');
    expect(s.current).toBe(8);
    expect(s.freezes).toBe(0);
  });
  it('keeps the banked freeze when no gap occurs', () => {
    expect(computeStreak(run('2026-02-01', 7), '2026-02-07').freezes).toBe(1);
  });
  it('restarts if the gap exceeds the freezes', () => {
    const days = [...run('2026-02-01', 7), '2026-02-12'];
    expect(computeStreak(days, '2026-02-12').current).toBe(1);
  });
  it('caps banked freezes', () => {
    expect(computeStreak(run('2026-01-01', 40), '2026-02-09').freezes).toBe(3);
  });
});

describe('daily', () => {
  const slugs = ['a', 'b', 'c', 'd', 'e'];
  it('is deterministic and order-independent', () => {
    expect(dailySlug('2026-05-05', slugs)).toBe(dailySlug('2026-05-05', [...slugs].reverse()));
  });
  it('varies across days and handles empty lists', () => {
    const picks = new Set(
      Array.from({ length: 30 }, (_, i) => dailySlug(addDays('2026-05-01', i), slugs)),
    );
    expect(picks.size).toBeGreaterThan(2);
    expect(dailySlug('2026-05-05', [])).toBeNull();
  });
});

describe('achievements', () => {
  const solvedInfo = { failedBefore: 0, hintsUsed: 0, fast: false };
  const ctx = (over: Partial<AchievementContext> = {}): AchievementContext => ({
    solved: {},
    submissions: {},
    problems: [
      { slug: 'a', difficulty: 'easy' },
      { slug: 'b', difficulty: 'hard' },
    ],
    dailyDays: 0,
    levelIndex: 0,
    streak: { current: 0, longest: 0, freezes: 0, doneToday: false, atRisk: false },
    event: null,
    ...over,
  });
  const solveEvent = (hour: number, day = 3, info = solvedInfo) => ({
    slug: 'a',
    verdict: 'accepted' as const,
    at: new Date(2026, 5, day, hour, 30),
    firstSolve: info,
  });

  it('has 20+ unique achievements', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
  it('awards nothing on an empty context and skips unlocked', () => {
    expect(evaluateAchievements(ctx(), {})).toEqual([]);
    const solved = { a: solvedInfo };
    expect(evaluateAchievements(ctx({ solved }), {})).toContain('first-blood');
    expect(evaluateAchievements(ctx({ solved }), { 'first-blood': 1 })).not.toContain(
      'first-blood',
    );
  });
  it('touch grass vs night owl by local hour', () => {
    const day = evaluateAchievements(ctx({ solved: { a: solvedInfo }, event: solveEvent(10) }), {});
    const night = evaluateAchievements(
      ctx({ solved: { a: solvedInfo }, event: solveEvent(3) }),
      {},
    );
    expect(day).toContain('touch-grass');
    expect(day).not.toContain('night-owl');
    expect(night).toContain('night-owl');
    expect(night).not.toContain('touch-grass');
  });
  it('comeback kid needs 5 failures before the solve', () => {
    const info = { ...solvedInfo, failedBefore: 5 };
    const got = evaluateAchievements(
      ctx({ solved: { a: info }, event: solveEvent(12, 3, info) }),
      {},
    );
    expect(got).toContain('comeback-kid');
    const few = { ...solvedInfo, failedBefore: 4 };
    expect(
      evaluateAchievements(ctx({ solved: { a: few }, event: solveEvent(12, 3, few) }), {}),
    ).not.toContain('comeback-kid');
  });
  it('it compiles needs a prior compile error on that problem', () => {
    const submissions = {
      a: [
        { language: 'javascript' as const, verdict: 'accepted' as const },
        { language: 'javascript' as const, verdict: 'compile_error' as const },
      ],
    };
    const got = evaluateAchievements(
      ctx({ solved: { a: solvedInfo }, submissions, event: solveEvent(12) }),
      {},
    );
    expect(got).toContain('it-compiles');
  });
  it('polyglot needs all three languages accepted', () => {
    const acc = (language: 'javascript' | 'typescript' | 'python') => ({
      language,
      verdict: 'accepted' as const,
    });
    expect(
      evaluateAchievements(ctx({ submissions: { a: [acc('javascript'), acc('python')] } }), {}),
    ).not.toContain('polyglot');
    expect(
      evaluateAchievements(
        ctx({ submissions: { a: [acc('javascript'), acc('python')], b: [acc('typescript')] } }),
        {},
      ),
    ).toContain('polyglot');
  });
  it('streak and level achievements', () => {
    const got = evaluateAchievements(
      ctx({
        streak: { current: 7, longest: 7, freezes: 1, doneToday: true, atRisk: false },
        levelIndex: 3,
      }),
      {},
    );
    expect(got).toEqual(
      expect.arrayContaining(['on-a-roll', 'week-of-rizz', 'main-character-energy']),
    );
    expect(got).not.toContain('lore-accurate');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { dailySlug } from '@/features/gamification/daily';
import { dayKey } from '@/features/gamification/dates';
import { listProblems } from '@/features/problems';
import { MAX_SUBMISSIONS_PER_PROBLEM, streakOf, totalXp, useProgress } from './progress';
import { draftKey, MAX_SPLIT, MIN_SPLIT, useWorkspace } from './workspace';

const sub = (verdict: 'accepted' | 'wrong_answer' = 'wrong_answer') => ({
  language: 'javascript' as const,
  verdict,
  passed: verdict === 'accepted' ? 4 : 1,
  total: 4,
  maxTimeMs: 1.5,
  code: 'x',
});

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().reset();
  useWorkspace.setState({ drafts: {}, language: 'javascript', splitPct: 42 });
});

describe('progress store', () => {
  it('counts failures, then marks solved with failures and hints recorded', () => {
    const { recordSubmission, revealHint } = useProgress.getState();
    recordSubmission('p', sub());
    recordSubmission('p', sub());
    revealHint('p', 3);
    recordSubmission('p', sub('accepted'));
    const s = useProgress.getState();
    expect(s.solved['p']).toMatchObject({ failedBefore: 2, hintsUsed: 1, language: 'javascript' });
    expect(s.submissions['p']?.map((x) => x.verdict)).toEqual([
      'accepted',
      'wrong_answer',
      'wrong_answer',
    ]);
  });

  it('keeps the first solve when accepted again', () => {
    const { recordSubmission } = useProgress.getState();
    recordSubmission('p', sub('accepted'));
    const first = useProgress.getState().solved['p'];
    recordSubmission('p', sub('accepted'));
    expect(useProgress.getState().solved['p']).toEqual(first);
  });

  it('caps stored submissions, newest first', () => {
    const { recordSubmission } = useProgress.getState();
    for (let i = 0; i < MAX_SUBMISSIONS_PER_PROBLEM + 5; i++) recordSubmission('p', sub());
    expect(useProgress.getState().submissions['p']).toHaveLength(MAX_SUBMISSIONS_PER_PROBLEM);
  });

  it('never reveals more hints than exist', () => {
    const { revealHint } = useProgress.getState();
    for (let i = 0; i < 6; i++) revealHint('p', 3);
    expect(useProgress.getState().hintsRevealed['p']).toBe(3);
  });
});

describe('progress rewards', () => {
  const real = listProblems()[0]!;
  const noon = new Date(2026, 5, 3, 12, 0);

  it('awards xp, first blood and activity on the first solve only', () => {
    const { recordSubmission } = useProgress.getState();
    const out = recordSubmission(real.slug, sub('accepted'), noon);
    expect(out.xp?.total).toBeGreaterThanOrEqual(real.xp);
    expect(out.newAchievements).toContain('first-blood');
    expect(totalXp(useProgress.getState())).toBeGreaterThan(0);
    expect(useProgress.getState().activity[dayKey(noon)]).toBe(1);

    const again = recordSubmission(real.slug, sub('accepted'), noon);
    expect(again.xp).toBeNull();
    expect(again.newAchievements).not.toContain('first-blood');
  });

  it('does not reward failures but stores the attempt', () => {
    const out = useProgress.getState().recordSubmission(real.slug, sub(), noon);
    expect(out).toMatchObject({ xp: null, dailyBonus: 0, newAchievements: [], levelUp: null });
    expect(useProgress.getState().activity).toEqual({});
  });

  it('pays the daily bonus once, only for the daily problem', () => {
    const slugs = listProblems().map((p) => p.slug);
    const daily = dailySlug(dayKey(noon), slugs)!;
    const { recordSubmission } = useProgress.getState();
    const first = recordSubmission(daily, sub('accepted'), noon);
    expect(first.dailyBonus).toBeGreaterThan(0);
    expect(useProgress.getState().dailyDone[dayKey(noon)]).toBe(daily);
    expect(recordSubmission(daily, sub('accepted'), noon).dailyBonus).toBe(0);
  });

  it('builds a streak from consecutive days', () => {
    const { recordSubmission } = useProgress.getState();
    for (const d of [1, 2, 3])
      recordSubmission(real.slug, sub('accepted'), new Date(2026, 5, d, 12));
    expect(streakOf(useProgress.getState(), new Date(2026, 5, 3, 20)).current).toBe(3);
  });

  it('reports level ups', () => {
    const big = listProblems().reduce((a, b) => (b.xp > a.xp ? b : a));
    const out = useProgress.getState().recordSubmission(big.slug, sub('accepted'), noon);
    expect(out.levelUp?.index).toBeGreaterThan(0);
  });

  it('reset clears everything', () => {
    useProgress.getState().recordSubmission(real.slug, sub('accepted'), noon);
    useProgress.getState().reset();
    expect(useProgress.getState().solved).toEqual({});
    expect(useProgress.getState().achievements).toEqual({});
  });
});

describe('workspace store', () => {
  it('keeps drafts per problem and language, and clears one at a time', () => {
    const { setDraft, clearDraft } = useWorkspace.getState();
    setDraft('p', 'javascript', 'a');
    setDraft('p', 'python', 'b');
    clearDraft('p', 'javascript');
    expect(useWorkspace.getState().drafts).toEqual({ [draftKey('p', 'python')]: 'b' });
  });

  it('clamps the split position', () => {
    useWorkspace.getState().setSplitPct(1);
    expect(useWorkspace.getState().splitPct).toBe(MIN_SPLIT);
    useWorkspace.getState().setSplitPct(99);
    expect(useWorkspace.getState().splitPct).toBe(MAX_SPLIT);
  });
});

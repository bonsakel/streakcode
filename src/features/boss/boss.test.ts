import { beforeEach, describe, expect, it } from 'vitest';
import { listProblems } from '@/features/problems';
import { useBoss } from '@/store/boss';
import { useProgress } from '@/store/progress';
import {
  bossHp,
  currentStage,
  formatClock,
  pickBossProblems,
  recordClear,
  settleRun,
  startRun,
  timeLeftMs,
  BOSS_DURATION_MS,
  BOSS_WIN_XP,
} from './engine';
import { BOSS_NAME, pickTaunt, TAUNTS } from './taunts';

const P = (slug: string, difficulty: 'easy' | 'medium' | 'hard') => ({ slug, difficulty });
const catalog = [
  P('e1', 'easy'),
  P('e2', 'easy'),
  P('m1', 'medium'),
  P('h1', 'hard'),
  P('h2', 'hard'),
];

describe('pickBossProblems', () => {
  it('escalates easy, medium, hard', () => {
    for (let i = 0; i < 20; i++) {
      const [a, b, c] = pickBossProblems(catalog, Math.random);
      expect(a).toMatch(/^e/);
      expect(b).toBe('m1');
      expect(c).toMatch(/^h/);
    }
  });
  it('never repeats and copes with tiny catalogs', () => {
    expect(pickBossProblems([P('only', 'easy')])).toEqual(['only']);
    expect(pickBossProblems([])).toEqual([]);
    const lowOnly = pickBossProblems([P('a', 'easy'), P('b', 'easy'), P('c', 'easy')]);
    expect(new Set(lowOnly).size).toBe(3);
  });
  it('is deterministic for a given random source', () => {
    expect(pickBossProblems(catalog, () => 0)).toEqual(pickBossProblems(catalog, () => 0));
  });
});

describe('boss run', () => {
  const fresh = () => startRun(['a', 'b', 'c'], 1000);

  it('starts with a full-health boss and a 30 minute clock', () => {
    const run = fresh();
    expect(bossHp(run)).toBe(100);
    expect(run.endsAt - run.startedAt).toBe(BOSS_DURATION_MS);
    expect(currentStage(run)).toBe('a');
  });
  it('only the current stage damages the boss', () => {
    let run = recordClear(fresh(), 'b', 2000);
    expect(run.cleared).toEqual([]);
    run = recordClear(run, 'a', 2000);
    expect(bossHp(run)).toBe(67);
    expect(currentStage(run)).toBe('b');
    expect(recordClear(run, 'a', 3000)).toBe(run);
  });
  it('wins when every stage is cleared', () => {
    let run = fresh();
    for (const s of ['a', 'b', 'c']) run = recordClear(run, s, 5000);
    expect(run).toMatchObject({ outcome: 'won', finishedAt: 5000 });
    expect(bossHp(run)).toBe(0);
    expect(timeLeftMs(run, 99999999)).toBe(BOSS_DURATION_MS + 1000 - 5000);
  });
  it('loses when time runs out, and a late solve does not count', () => {
    const run = fresh();
    const late = run.endsAt + 1;
    expect(settleRun(run, late)).toMatchObject({ outcome: 'lost', finishedAt: run.endsAt });
    expect(recordClear(run, 'a', late).outcome).toBe('lost');
    expect(recordClear(run, 'a', late).cleared).toEqual([]);
    expect(settleRun(run, run.endsAt - 1)).toBe(run);
  });
  it('formats the clock', () => {
    expect(formatClock(BOSS_DURATION_MS)).toBe('30:00');
    expect(formatClock(61_000)).toBe('1:01');
    expect(formatClock(-5)).toBe('0:00');
    expect(formatClock(100)).toBe('0:01');
  });
});

describe('taunts', () => {
  it('has lines for every tone and key, and keeps professional plain', () => {
    for (const tone of ['hype', 'roast', 'professional'] as const) {
      for (const key of ['start', 'hit', 'fail', 'win', 'lose'] as const) {
        expect(TAUNTS[tone][key].length).toBeGreaterThan(0);
      }
    }
    const emoji = /\p{Extended_Pictographic}/u;
    for (const lines of Object.values(TAUNTS.professional)) {
      for (const l of lines) expect(l).not.toMatch(emoji);
    }
    expect(BOSS_NAME.length).toBeGreaterThan(3);
  });
  it('avoids repeating the last line when it can', () => {
    const [first] = TAUNTS.hype.hit;
    for (let i = 0; i < 30; i++)
      expect(pickTaunt('hype', 'hit', Math.random, first)).not.toBe(first);
  });
});

describe('boss store', () => {
  beforeEach(() => {
    localStorage.clear();
    useProgress.getState().reset();
    useBoss.setState({ run: null, wins: 0, losses: 0, bestMs: null });
  });

  it('plays a full win, pays the bonus once and records the best time', () => {
    const { start } = useBoss.getState();
    start(1000, () => 0);
    const slugs = useBoss.getState().run!.slugs;
    expect(slugs).toHaveLength(3);
    const hits = slugs.map((s, i) => useBoss.getState().clear(s, 2000 + i * 1000));
    expect(hits).toEqual([true, true, true]);
    const s = useBoss.getState();
    expect(s.run?.outcome).toBe('won');
    expect(s).toMatchObject({ wins: 1, losses: 0, bestMs: 3000 });
    expect(useProgress.getState().bonusXp).toBe(BOSS_WIN_XP);
    expect(useBoss.getState().clear(slugs[0]!, 9000)).toBe(false);
    expect(useProgress.getState().bonusXp).toBe(BOSS_WIN_XP);
  });
  it('counts a timeout as one loss only', () => {
    useBoss.getState().start(1000, () => 0);
    const end = useBoss.getState().run!.endsAt + 5;
    useBoss.getState().settle(end);
    useBoss.getState().settle(end + 1000);
    expect(useBoss.getState()).toMatchObject({ wins: 0, losses: 1 });
    expect(useBoss.getState().run?.outcome).toBe('lost');
  });
  it('picks real problems from the catalog', () => {
    useBoss.getState().start(0, () => 0.5);
    const known = new Set(listProblems().map((p) => p.slug));
    expect(useBoss.getState().run!.slugs.every((s) => known.has(s))).toBe(true);
  });
});

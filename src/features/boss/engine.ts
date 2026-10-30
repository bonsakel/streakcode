export const BOSS_DURATION_MS = 30 * 60 * 1000;
export const BOSS_WIN_XP = 150;

export type BossOutcome = 'won' | 'lost';

export interface BossRun {
  startedAt: number;
  endsAt: number;
  /** One problem per stage, easiest first. */
  slugs: string[];
  cleared: string[];
  outcome: BossOutcome | null;
  finishedAt: number | null;
}

interface Pickable {
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const RANK = { easy: 0, medium: 1, hard: 2 } as const;
const STAGE_TARGETS = ['easy', 'medium', 'hard'] as const;

/**
 * One problem per stage, escalating easy to hard. If a difficulty has nothing left, the stage
 * takes the closest remaining difficulty (so tiny catalogs still work), and stages stay sorted.
 */
export function pickBossProblems(
  problems: readonly Pickable[],
  random: () => number = Math.random,
): string[] {
  const left = [...problems];
  const picked: Pickable[] = [];
  for (const target of STAGE_TARGETS) {
    if (left.length === 0) break;
    const exact = left.filter((p) => p.difficulty === target);
    let pool = exact;
    if (pool.length === 0) {
      const best = Math.min(...left.map((p) => Math.abs(RANK[p.difficulty] - RANK[target])));
      pool = left.filter((p) => Math.abs(RANK[p.difficulty] - RANK[target]) === best);
    }
    const choice = pool[Math.floor(random() * pool.length)]!;
    picked.push(choice);
    left.splice(left.indexOf(choice), 1);
  }
  return picked.sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty]).map((p) => p.slug);
}

export function startRun(slugs: string[], now: number, duration = BOSS_DURATION_MS): BossRun {
  return {
    startedAt: now,
    endsAt: now + duration,
    slugs,
    cleared: [],
    outcome: null,
    finishedAt: null,
  };
}

/** Marks the run lost once the clock runs out. A finished run is never changed. */
export function settleRun(run: BossRun, now: number): BossRun {
  if (run.outcome || now < run.endsAt) return run;
  return { ...run, outcome: 'lost', finishedAt: run.endsAt };
}

/** An Accepted submission on the current stage damages the boss. Other slugs are ignored. */
export function recordClear(run: BossRun, slug: string, now: number): BossRun {
  const settled = settleRun(run, now);
  if (settled.outcome || slug !== currentStage(settled) || settled.cleared.includes(slug)) {
    return settled;
  }
  const cleared = [...settled.cleared, slug];
  const won = cleared.length === settled.slugs.length;
  return {
    ...settled,
    cleared,
    outcome: won ? 'won' : null,
    finishedAt: won ? now : null,
  };
}

/** Slug of the stage being fought, or null when every stage is cleared. */
export function currentStage(run: BossRun): string | null {
  return run.slugs.find((s) => !run.cleared.includes(s)) ?? null;
}

/** Boss health, 100 down to 0. */
export function bossHp(run: BossRun): number {
  if (run.slugs.length === 0) return 0;
  return Math.round(((run.slugs.length - run.cleared.length) / run.slugs.length) * 100);
}

export function timeLeftMs(run: BossRun, now: number): number {
  return Math.max(0, run.endsAt - (run.finishedAt ?? now));
}

export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

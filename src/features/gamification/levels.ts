export interface LevelDef {
  title: string;
  /** Total XP needed to reach this level. */
  minXp: number;
}

export const LEVELS: readonly LevelDef[] = [
  { title: 'NPC', minXp: 0 },
  { title: 'Side Character', minXp: 100 },
  { title: 'Plot Armor', minXp: 300 },
  { title: 'Main Character', minXp: 700 },
  { title: 'Final Boss', minXp: 1400 },
  { title: 'Certified Menace', minXp: 2400 },
];

export interface LevelInfo {
  /** Zero-based index into LEVELS; the displayed level number is index + 1. */
  index: number;
  title: string;
  xp: number;
  xpIntoLevel: number;
  /** XP span of this level, or null at max level. */
  xpForNext: number | null;
  /** 0..1 progress through the current level (1 at max). */
  progress: number;
}

export function levelFor(xp: number): LevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  let index = 0;
  LEVELS.forEach((l, i) => {
    if (safe >= l.minXp) index = i;
  });
  const current = LEVELS[index]!;
  const next = LEVELS[index + 1];
  const xpIntoLevel = safe - current.minXp;
  const span = next ? next.minXp - current.minXp : null;
  return {
    index,
    title: current.title,
    xp: safe,
    xpIntoLevel,
    xpForNext: span,
    progress: span ? xpIntoLevel / span : 1,
  };
}

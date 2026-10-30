import type { Difficulty } from '@/features/problems/schema';

export interface CardInput {
  title: string;
  slug: string;
  difficulty: Difficulty;
  handle: string;
  levelTitle: string;
  levelNumber: number;
  runtimeMs: number;
  language: 'javascript' | 'typescript' | 'python';
  passed: number;
  total: number;
  /** The verdict line shown to the user, in their chosen tone. */
  verdictLine: string;
}

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const LANGUAGE_LABEL = { javascript: 'JavaScript', typescript: 'TypeScript', python: 'Python' };

export function formatRuntime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0 ms';
  if (ms < 1) return '<1 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function shareUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, '')}/problem/${slug}`;
}

export function cardFilename(slug: string): string {
  return `streakcode-${slug}.png`;
}

export interface CardModel {
  headline: string;
  title: string;
  verdictLine: string;
  difficulty: Difficulty;
  stats: { label: string; value: string }[];
  footer: string;
}

export function buildCardModel(input: CardInput): CardModel {
  return {
    headline: 'ACCEPTED',
    title: input.title,
    verdictLine: input.verdictLine,
    difficulty: input.difficulty,
    stats: [
      { label: 'Runtime', value: formatRuntime(input.runtimeMs) },
      { label: 'Tests', value: `${input.passed}/${input.total}` },
      { label: 'Language', value: LANGUAGE_LABEL[input.language] },
    ],
    footer: `${input.handle} · Lv ${input.levelNumber} ${input.levelTitle}`,
  };
}

/** Greedy word wrap with a caller-supplied width measure, capped at `maxLines` with an ellipsis. */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1]!;
  while (last.length > 1 && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

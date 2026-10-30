import { describe, expect, it } from 'vitest';
import { buildCardModel, cardFilename, formatRuntime, shareUrl, wrapText } from './cardModel';

describe('share card model', () => {
  it('formats runtimes', () => {
    expect(formatRuntime(0.2)).toBe('<1 ms');
    expect(formatRuntime(12.4)).toBe('12 ms');
    expect(formatRuntime(1500)).toBe('1.50 s');
    expect(formatRuntime(Number.NaN)).toBe('0 ms');
  });
  it('builds share urls and filenames', () => {
    expect(shareUrl('https://x.dev/', 'rizz-calculator')).toBe(
      'https://x.dev/problem/rizz-calculator',
    );
    expect(cardFilename('rizz-calculator')).toBe('streakcode-rizz-calculator.png');
  });
  it('builds the model', () => {
    const m = buildCardModel({
      title: 'Rizz Calculator',
      slug: 'rizz-calculator',
      difficulty: 'easy',
      handle: 'Goblin1',
      levelTitle: 'NPC',
      levelNumber: 1,
      runtimeMs: 3,
      language: 'python',
      passed: 10,
      total: 10,
      verdictLine: 'Clean.',
    });
    expect(m.footer).toBe('Goblin1 · Lv 1 NPC');
    expect(m.stats).toEqual([
      { label: 'Runtime', value: '3 ms' },
      { label: 'Tests', value: '10/10' },
      { label: 'Language', value: 'Python' },
    ]);
  });
  it('wraps and ellipsizes by measured width', () => {
    const measure = (s: string) => s.length * 10;
    expect(wrapText('aaa bbb ccc', 70, measure, 3)).toEqual(['aaa bbb', 'ccc']);
    const out = wrapText('one two three four five six seven', 80, measure, 2);
    expect(out).toHaveLength(2);
    expect(out[1]!.endsWith('…')).toBe(true);
    expect(measure(out[1]!)).toBeLessThanOrEqual(80);
    expect(wrapText('', 80, measure, 2)).toEqual([]);
    expect(wrapText('supercalifragilistic', 50, measure, 2)).toEqual(['supercalifragilistic']);
  });
});

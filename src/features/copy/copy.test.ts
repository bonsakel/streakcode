import { describe, expect, it } from 'vitest';
import { isEmptyFunction, nextTleStreak, TLE_STREAK_LENGTH } from './easterEggs';
import { fillMessage, MESSAGES, pickMessage, type MessageKey } from './verdicts';

const ctx = { passed: 3, total: 10, handle: 'CozyOtter1' };
const TONES = ['hype', 'roast', 'professional'] as const;
const KEYS = Object.keys(MESSAGES.hype) as MessageKey[];

describe('message pools', () => {
  it('every tone covers every key with unique, non-empty lines', () => {
    for (const tone of TONES) {
      expect(Object.keys(MESSAGES[tone]).sort()).toEqual([...KEYS].sort());
      for (const key of KEYS) {
        const pool = MESSAGES[tone][key];
        expect(pool.length).toBeGreaterThanOrEqual(2);
        expect(new Set(pool).size).toBe(pool.length);
        for (const line of pool) expect(line.trim()).not.toBe('');
      }
    }
  });

  it('the five core verdicts have at least five fun lines per tone', () => {
    for (const tone of ['hype', 'roast'] as const) {
      for (const key of [
        'accepted',
        'wrong_answer',
        'time_limit_exceeded',
        'runtime_error',
        'compile_error',
      ] as const) {
        expect(MESSAGES[tone][key].length).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('professional tone has no emoji', () => {
    const emoji = /\p{Extended_Pictographic}/u;
    for (const key of KEYS) {
      for (const line of MESSAGES.professional[key]) expect(line).not.toMatch(emoji);
    }
  });

  it('only uses known placeholders', () => {
    for (const tone of TONES) {
      for (const key of KEYS) {
        for (const line of MESSAGES[tone][key]) {
          expect(fillMessage(line, ctx)).not.toMatch(/[{}]/);
        }
      }
    }
  });

  it('never targets the person', () => {
    const insults = /\b(stupid|idiot|dumb|loser|trash|worthless|pathetic|you suck)\b/i;
    for (const tone of TONES) {
      for (const key of KEYS) {
        for (const line of MESSAGES[tone][key]) expect(line).not.toMatch(insults);
      }
    }
  });
});

describe('pickMessage', () => {
  it('fills placeholders', () => {
    expect(pickMessage('professional', 'accepted', ctx, () => 0)).toBe(
      'Accepted. All 10 tests passed.',
    );
  });

  it('avoids repeating the previous line when it can', () => {
    const first = pickMessage('hype', 'accepted', ctx, () => 0);
    expect(pickMessage('hype', 'accepted', ctx, () => 0, first)).not.toBe(first);
  });

  it('survives random() returning 1', () => {
    expect(pickMessage('roast', 'wrong_answer', ctx, () => 1)).not.toBe('');
  });
});

describe('isEmptyFunction', () => {
  it('detects empty and placeholder bodies in JS/TS', () => {
    expect(isEmptyFunction('function f(a) {}', 'javascript')).toBe(true);
    expect(isEmptyFunction('function f(a) {\n  // todo\n  return null;\n}', 'javascript')).toBe(
      true,
    );
    expect(isEmptyFunction('function f(a: number): number { return; }', 'typescript')).toBe(true);
    expect(isEmptyFunction('', 'javascript')).toBe(true);
  });

  it('detects empty and placeholder bodies in Python', () => {
    expect(isEmptyFunction('def f(a):\n    pass', 'python')).toBe(true);
    expect(isEmptyFunction('def f(a):\n    # your code\n    return None', 'python')).toBe(true);
  });

  it('is false for real code', () => {
    expect(isEmptyFunction('function f(a) { return a + 1; }', 'javascript')).toBe(false);
    expect(isEmptyFunction('def f(a):\n    return a + 1', 'python')).toBe(false);
    expect(isEmptyFunction('function f(a) { return null; } const x = 1;', 'javascript')).toBe(
      false,
    );
  });
});

describe('nextTleStreak', () => {
  it('counts consecutive time limits and resets on anything else', () => {
    let streak = 0;
    for (let i = 0; i < TLE_STREAK_LENGTH; i++)
      streak = nextTleStreak(streak, 'time_limit_exceeded');
    expect(streak).toBe(TLE_STREAK_LENGTH);
    expect(nextTleStreak(streak, 'wrong_answer')).toBe(0);
  });
});

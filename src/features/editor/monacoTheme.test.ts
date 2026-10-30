import { describe, expect, it } from 'vitest';
import { buildMonacoTheme, tripletToHex } from './monacoTheme';

const dark = {
  bg: '12 13 22',
  surface: '20 22 36',
  raised: '30 33 52',
  line: '52 56 84',
  ink: '238 240 252',
  muted: '160 166 196',
  accent: '139 124 255',
  pop: '255 122 182',
  ok: '74 222 128',
  bad: '255 107 107',
  warn: '252 196 25',
};

describe('tripletToHex', () => {
  it('converts RGB triplets', () => {
    expect(tripletToHex('139 124 255')).toBe('8b7cff');
    expect(tripletToHex(' 0 0 0 ')).toBe('000000');
  });

  it('rejects malformed values', () => {
    expect(tripletToHex('')).toBeUndefined();
    expect(tripletToHex('1 2')).toBeUndefined();
    expect(tripletToHex('1 2 300')).toBeUndefined();
    expect(tripletToHex('a b c')).toBeUndefined();
  });
});

describe('buildMonacoTheme', () => {
  it('uses the app background and accent', () => {
    const theme = buildMonacoTheme(dark);
    expect(theme.base).toBe('vs-dark');
    expect(theme.colors['editor.background']).toBe('#0c0d16');
    expect(theme.colors['editorCursor.foreground']).toBe('#8b7cff');
  });

  it('picks the light base for light themes', () => {
    const light = { ...dark, bg: '249 248 252', ink: '27 25 46' };
    expect(buildMonacoTheme(light).base).toBe('vs');
  });

  it('falls back to grey instead of emitting broken colors', () => {
    const theme = buildMonacoTheme({ ...dark, accent: 'nonsense' });
    expect(theme.colors['editorCursor.foreground']).toBe('#808080');
  });
});

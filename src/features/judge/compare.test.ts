import { formatValue, normalizeValue, truncate, valuesMatch } from './compare';

describe('valuesMatch', () => {
  it('compares primitives strictly', () => {
    expect(valuesMatch(1, 1)).toBe(true);
    expect(valuesMatch(1, '1')).toBe(false);
    expect(valuesMatch(null, undefined)).toBe(false);
    expect(valuesMatch(true, 1)).toBe(false);
    expect(valuesMatch(0, -0)).toBe(true);
  });

  it('deep-compares arrays and ignores object key order', () => {
    expect(valuesMatch([1, [2, { a: 1, b: 2 }]], [1, [2, { b: 2, a: 1 }]])).toBe(true);
    expect(valuesMatch([1, 2], [1, 2, 3])).toBe(false);
    expect(valuesMatch([], {})).toBe(false);
    expect(valuesMatch({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(valuesMatch({ a: 1 }, { b: 1 })).toBe(false);
  });

  it('is exact by default for floats', () => {
    expect(valuesMatch(0.1 + 0.2, 0.3)).toBe(false);
  });

  it('applies epsilon (absolute or relative) to nested numbers', () => {
    expect(valuesMatch(0.1 + 0.2, 0.3, 1e-9)).toBe(true);
    expect(valuesMatch([{ x: 1e9 + 1 }], [{ x: 1e9 }], 1e-6)).toBe(true);
    expect(valuesMatch(1.001, 1, 1e-6)).toBe(false);
  });
});

describe('normalizeValue', () => {
  it('keeps JSON data and turns nested undefined into null', () => {
    expect(normalizeValue({ a: [1, undefined] })).toEqual({ ok: true, value: { a: [1, null] } });
  });

  it('keeps a top-level undefined distinct from null', () => {
    expect(normalizeValue(undefined)).toEqual({ ok: true, value: undefined });
  });

  it('tags NaN and Infinity so they never match a real number', () => {
    const nan = normalizeValue(NaN);
    expect(nan.ok && valuesMatch(nan.value, null)).toBe(false);
    expect(nan.ok && formatValue(nan.value)).toBe('NaN');
    const inf = normalizeValue([Infinity]);
    expect(inf.ok && formatValue(inf.value)).toBe('[Infinity]');
  });

  it('rejects cycles and functions', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(normalizeValue(cyclic).ok).toBe(false);
    expect(normalizeValue(() => 1).ok).toBe(false);
  });

  it('converts safe BigInts to numbers', () => {
    expect(normalizeValue(10n)).toEqual({ ok: true, value: 10 });
  });
});

describe('truncate / formatValue', () => {
  it('truncates long text with a marker', () => {
    expect(truncate('abcdef', 3)).toBe('abc… (3 more chars)');
    expect(truncate('abc', 3)).toBe('abc');
  });

  it('formats values for display', () => {
    expect(formatValue([1, 'a'])).toBe('[1,"a"]');
    expect(formatValue(undefined)).toBe('undefined');
  });
});

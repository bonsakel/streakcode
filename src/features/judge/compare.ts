/** Numbers that JSON cannot carry are tagged so they never equal a legitimate expected value. */
const NON_FINITE_TAG = '__nonFinite';
const NON_FINITE_PATTERN = new RegExp(`\\{"${NON_FINITE_TAG}":"([^"]+)"\\}`, 'g');

export type NormalizeResult = { ok: true; value: unknown } | { ok: false; reason: string };

/** Reduce a return value to plain JSON data (same shape a Python harness produces). */
export function normalizeValue(value: unknown): NormalizeResult {
  if (value === undefined) return { ok: true, value: undefined };
  try {
    const text = JSON.stringify(value, (_key, v: unknown) => {
      if (typeof v === 'number' && !Number.isFinite(v)) return { [NON_FINITE_TAG]: String(v) };
      if (typeof v === 'bigint') {
        return Number.isSafeInteger(Number(v)) ? Number(v) : { [NON_FINITE_TAG]: `${v}n` };
      }
      return v;
    });
    // Functions and symbols stringify to undefined.
    if (text === undefined) return { ok: false, reason: 'Return value is not JSON-serializable.' };
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `Return value is not JSON-serializable (${detail}).` };
  }
}

function numbersMatch(a: number, b: number, epsilon: number): boolean {
  if (a === b) return true;
  if (epsilon <= 0) return false;
  const diff = Math.abs(a - b);
  return diff <= epsilon || diff <= epsilon * Math.abs(b);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Deep equality over JSON data. Object key order is ignored.
 * `epsilon` applies to every number (absolute or relative, whichever is looser).
 */
export function valuesMatch(got: unknown, expected: unknown, epsilon = 0): boolean {
  if (typeof got === 'number' && typeof expected === 'number') {
    return numbersMatch(got, expected, epsilon);
  }
  if (got === expected) return true;
  if (Array.isArray(got) || Array.isArray(expected)) {
    if (!Array.isArray(got) || !Array.isArray(expected) || got.length !== expected.length) {
      return false;
    }
    return got.every((item, i) => valuesMatch(item, expected[i], epsilon));
  }
  if (isPlainObject(got) && isPlainObject(expected)) {
    const gotKeys = Object.keys(got);
    if (gotKeys.length !== Object.keys(expected).length) return false;
    return gotKeys.every(
      (key) => Object.hasOwn(expected, key) && valuesMatch(got[key], expected[key], epsilon),
    );
  }
  return false;
}

export const DISPLAY_LIMIT = 2000;

export function truncate(text: string, limit = DISPLAY_LIMIT): string {
  return text.length <= limit
    ? text
    : `${text.slice(0, limit)}… (${text.length - limit} more chars)`;
}

/** Human-readable rendering of a JSON-ish value for the results panel. */
export function formatValue(value: unknown, limit = DISPLAY_LIMIT): string {
  if (value === undefined) return 'undefined';
  try {
    const text = JSON.stringify(value) ?? String(value);
    return truncate(text.replace(NON_FINITE_PATTERN, '$1'), limit);
  } catch {
    return truncate(String(value), limit);
  }
}

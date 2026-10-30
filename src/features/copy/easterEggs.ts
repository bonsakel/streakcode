import type { Language } from '@/features/judge/types';

const COMMENTS: Record<Language, RegExp> = {
  javascript: /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
  typescript: /\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
  python: /#[^\n]*|"""[\s\S]*?"""|'''[\s\S]*?'''/g,
};

/**
 * True when the user's function does nothing: no body at all, or only a placeholder return
 * (`return null`, `return None`, `return;`, `pass`). Used for the "empty function" roast.
 */
export function isEmptyFunction(code: string, language: Language): boolean {
  const stripped = code.replace(COMMENTS[language], '').trim();
  if (stripped === '') return true;

  if (language === 'python') {
    const lines = stripped.split('\n').map((l) => l.trim());
    const body = lines.filter((l) => l !== '' && !l.startsWith('def ') && !l.startsWith('@'));
    return body.every((l) => /^(pass|return( None)?|\.\.\.)$/.test(l));
  }

  const open = stripped.indexOf('{');
  const close = stripped.lastIndexOf('}');
  if (open === -1 || close < open || stripped.slice(close + 1).trim() !== '') return false;
  const body = stripped
    .slice(open + 1, close)
    .replace(/\s+/g, ' ')
    .trim();
  return body === '' || /^return( null| undefined)?;?$/.test(body);
}

export const TLE_STREAK_LENGTH = 5;

/** Counts consecutive TLE verdicts; any other verdict resets it. Returns the new streak. */
export function nextTleStreak(previous: number, verdict: string): number {
  return verdict === 'time_limit_exceeded' ? previous + 1 : 0;
}

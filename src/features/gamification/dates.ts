const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as `YYYY-MM-DD`. Streaks and the daily challenge follow the user's own clock. */
export function dayKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDayKey(key: string): Date {
  const [y = 1970, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

/** Whole calendar days from `a` to `b` (positive when `b` is later). DST-safe via the noon anchor. */
export function dayDiff(a: string, b: string): number {
  return Math.round((parseDayKey(b).getTime() - parseDayKey(a).getTime()) / 86_400_000);
}

export function addDays(key: string, days: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + days);
  return dayKey(d);
}

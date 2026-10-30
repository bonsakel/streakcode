/** FNV-1a: tiny, stable string hash. Same day, same problem, on every device. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic problem of the day. `slugs` should be in a stable order. */
export function dailySlug(day: string, slugs: readonly string[]): string | null {
  if (slugs.length === 0) return null;
  const ordered = [...slugs].sort();
  return ordered[hash(`skill-issue:${day}`) % ordered.length]!;
}

import { HANDLE_ADJECTIVES, HANDLE_CREATURES } from '@/features/copy/handles';

export function generateHandle(rng: () => number = Math.random): string {
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rng() * list.length)] as T;
  const n = 1 + Math.floor(rng() * 99);
  return `${pick(HANDLE_ADJECTIVES)}${pick(HANDLE_CREATURES)}${n}`;
}

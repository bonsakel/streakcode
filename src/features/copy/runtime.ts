import type { RuntimeProgress } from '@/features/judge/protocol';
import type { Language } from '@/features/judge/types';

/** Loading-state copy for runtimes that need a moment to start. */
export function runtimeProgressText(language: Language, progress: RuntimeProgress): string {
  if (language !== 'python') return 'Warming up the runner...';
  if (progress.stage === 'downloading') {
    const pct = progress.fraction === undefined ? '' : ` (${Math.round(progress.fraction * 100)}%)`;
    return `Waking up the snake... 🐍 Downloading Python once${pct}. It's cached after this.`;
  }
  return 'Waking up the snake... 🐍 Almost slithering.';
}

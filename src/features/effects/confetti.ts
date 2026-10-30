import { useSettings } from '@/store/settings';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Confetti burst for Accepted. Skipped for reduced motion and the Professional tone. */
export async function celebrate(): Promise<void> {
  if (prefersReducedMotion() || useSettings.getState().tone === 'professional') return;
  const { default: confetti } = await import('canvas-confetti');
  const base = {
    colors: ['#8b7cff', '#ff7ab6', '#4ade80', '#fcc419'],
    disableForReducedMotion: true,
  };
  void confetti({ ...base, particleCount: 90, spread: 70, origin: { y: 0.7 } });
  setTimeout(() => {
    void confetti({ ...base, particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.8 } });
    void confetti({ ...base, particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.8 } });
  }, 180);
}

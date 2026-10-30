import { useSettings } from './settings';

describe('settings store', () => {
  it('defaults to midnight, hype, sound off', () => {
    const s = useSettings.getState();
    expect(s.theme).toBe('midnight');
    expect(s.tone).toBe('hype');
    expect(s.soundOn).toBe(false);
    expect(s.handle).toMatch(/\d+$/);
  });

  it('updates theme, tone and sound', () => {
    const s = useSettings.getState();
    s.setTheme('neon');
    s.setTone('roast');
    s.toggleSound();
    const next = useSettings.getState();
    expect(next.theme).toBe('neon');
    expect(next.tone).toBe('roast');
    expect(next.soundOn).toBe(true);
  });

  it('persists to localStorage under a namespaced key', () => {
    useSettings.getState().setTone('professional');
    expect(localStorage.getItem('skill-issue:settings')).toContain('professional');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { moodForVerdict } from '@/features/mascot/mood';
import { useSettings } from '@/store/settings';
import { playSound, soundForVerdict } from './sound';

const confettiMock = vi.fn();
vi.mock('canvas-confetti', () => ({ default: confettiMock }));

describe('effects', () => {
  beforeEach(() => {
    confettiMock.mockClear();
    useSettings.setState({ soundOn: false, tone: 'hype' });
  });

  it('maps verdicts to moods and sounds', () => {
    expect(moodForVerdict('accepted', false)).toBe('celebrating');
    expect(moodForVerdict('time_limit_exceeded', false)).toBe('sleepy');
    expect(moodForVerdict('wrong_answer', false)).toBe('facepalm');
    expect(moodForVerdict(null, true)).toBe('thinking');
    expect(moodForVerdict(null, false)).toBe('idle');
    expect(soundForVerdict('accepted')).toBe('pass');
    expect(soundForVerdict('wrong_answer')).toBe('fail');
  });

  it('is silent and safe without AudioContext', () => {
    expect(() => playSound('pass')).not.toThrow();
    useSettings.setState({ soundOn: true });
    expect(() => playSound('pass')).not.toThrow();
  });

  it('skips confetti for professional tone, fires otherwise', async () => {
    const { celebrate } = await import('./confetti');
    useSettings.setState({ tone: 'professional' });
    await celebrate();
    expect(confettiMock).not.toHaveBeenCalled();
    useSettings.setState({ tone: 'hype' });
    await celebrate();
    expect(confettiMock).toHaveBeenCalled();
  });
});

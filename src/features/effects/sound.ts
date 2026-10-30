import { useSettings } from '@/store/settings';

export type SoundName = 'run' | 'pass' | 'fail' | 'timeout' | 'levelup';

/** [frequency Hz, duration s] steps, played back to back as soft blips. */
const SOUNDS: Record<SoundName, { wave: OscillatorType; notes: [number, number][] }> = {
  run: { wave: 'triangle', notes: [[520, 0.05]] },
  pass: {
    wave: 'triangle',
    notes: [
      [523, 0.09],
      [659, 0.09],
      [784, 0.16],
    ],
  },
  fail: {
    wave: 'sine',
    notes: [
      [330, 0.12],
      [247, 0.2],
    ],
  },
  timeout: {
    wave: 'sine',
    notes: [
      [200, 0.25],
      [180, 0.25],
    ],
  },
  levelup: {
    wave: 'triangle',
    notes: [
      [392, 0.08],
      [523, 0.08],
      [659, 0.08],
      [1047, 0.22],
    ],
  },
};

const VOLUME = 0.06;
let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof window.AudioContext !== 'function') return null;
  context ??= new window.AudioContext();
  return context;
}

/** Synthesised with the Web Audio API: no audio files. Does nothing unless sound is on. */
export function playSound(name: SoundName): void {
  if (!useSettings.getState().soundOn) return;
  const ctx = getContext();
  if (!ctx) return;
  void ctx.resume();
  const { wave, notes } = SOUNDS[name];
  let t = ctx.currentTime;
  for (const [freq, duration] of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(VOLUME, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
    t += duration;
  }
}

export function soundForVerdict(kind: string): SoundName {
  if (kind === 'accepted') return 'pass';
  if (kind === 'time_limit_exceeded') return 'timeout';
  return 'fail';
}

export type Mood = 'idle' | 'thinking' | 'celebrating' | 'facepalm' | 'sleepy';

export function moodForVerdict(kind: string | null, running: boolean): Mood {
  if (running) return 'thinking';
  if (kind === 'accepted') return 'celebrating';
  if (kind === 'time_limit_exceeded') return 'sleepy';
  if (kind === 'wrong_answer' || kind === 'runtime_error' || kind === 'compile_error') {
    return 'facepalm';
  }
  return 'idle';
}

import { beforeEach, describe, expect, it } from 'vitest';
import { listProblems } from '@/features/problems';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { exportProgress, importProgress } from './progressIO';

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().reset();
});

describe('progress export/import', () => {
  it('round-trips progress and handle', () => {
    const slug = listProblems()[0]!.slug;
    useSettings.setState({ handle: 'tester-42' });
    useProgress.getState().recordSubmission(slug, {
      language: 'python',
      verdict: 'accepted',
      passed: 4,
      total: 4,
      maxTimeMs: 2,
      code: 'x',
    });
    const file = exportProgress();
    const before = useProgress.getState().solved;

    useProgress.getState().reset();
    useSettings.setState({ handle: 'someone-else' });
    const res = importProgress(file);

    expect(res).toEqual({ ok: true, solved: 1 });
    expect(useProgress.getState().solved).toEqual(before);
    expect(useSettings.getState().handle).toBe('tester-42');
  });

  it('rejects junk without touching existing progress', () => {
    const slug = listProblems()[0]!.slug;
    useProgress.getState().recordSubmission(slug, {
      language: 'javascript',
      verdict: 'accepted',
      passed: 1,
      total: 1,
      maxTimeMs: 1,
      code: 'x',
    });
    for (const bad of [
      'not json',
      '{}',
      '{"app":"streakcode","version":1,"progress":{"solved":5}}',
    ]) {
      expect(importProgress(bad).ok).toBe(false);
    }
    expect(Object.keys(useProgress.getState().solved)).toEqual([slug]);
  });

  it('imports progress exported under the previous app name', () => {
    const oldFile = exportProgress().replace('"app": "streakcode"', '"app": "skill-issue"');
    expect(importProgress(oldFile)).toEqual({ ok: true, solved: 0 });
  });
});

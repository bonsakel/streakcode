import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_SUBMISSIONS_PER_PROBLEM, useProgress } from './progress';
import { draftKey, MAX_SPLIT, MIN_SPLIT, useWorkspace } from './workspace';

const sub = (verdict: 'accepted' | 'wrong_answer' = 'wrong_answer') => ({
  language: 'javascript' as const,
  verdict,
  passed: verdict === 'accepted' ? 4 : 1,
  total: 4,
  maxTimeMs: 1.5,
  code: 'x',
});

beforeEach(() => {
  localStorage.clear();
  useProgress.setState({ submissions: {}, solved: {}, failedAttempts: {}, hintsRevealed: {} });
  useWorkspace.setState({ drafts: {}, language: 'javascript', splitPct: 42 });
});

describe('progress store', () => {
  it('counts failures, then marks solved with failures and hints recorded', () => {
    const { recordSubmission, revealHint } = useProgress.getState();
    recordSubmission('p', sub());
    recordSubmission('p', sub());
    revealHint('p', 3);
    recordSubmission('p', sub('accepted'));
    const s = useProgress.getState();
    expect(s.solved['p']).toMatchObject({ failedBefore: 2, hintsUsed: 1, language: 'javascript' });
    expect(s.submissions['p']?.map((x) => x.verdict)).toEqual([
      'accepted',
      'wrong_answer',
      'wrong_answer',
    ]);
  });

  it('keeps the first solve when accepted again', () => {
    const { recordSubmission } = useProgress.getState();
    recordSubmission('p', sub('accepted'));
    const first = useProgress.getState().solved['p'];
    recordSubmission('p', sub('accepted'));
    expect(useProgress.getState().solved['p']).toEqual(first);
  });

  it('caps stored submissions, newest first', () => {
    const { recordSubmission } = useProgress.getState();
    for (let i = 0; i < MAX_SUBMISSIONS_PER_PROBLEM + 5; i++) recordSubmission('p', sub());
    expect(useProgress.getState().submissions['p']).toHaveLength(MAX_SUBMISSIONS_PER_PROBLEM);
  });

  it('never reveals more hints than exist', () => {
    const { revealHint } = useProgress.getState();
    for (let i = 0; i < 6; i++) revealHint('p', 3);
    expect(useProgress.getState().hintsRevealed['p']).toBe(3);
  });
});

describe('workspace store', () => {
  it('keeps drafts per problem and language, and clears one at a time', () => {
    const { setDraft, clearDraft } = useWorkspace.getState();
    setDraft('p', 'javascript', 'a');
    setDraft('p', 'python', 'b');
    clearDraft('p', 'javascript');
    expect(useWorkspace.getState().drafts).toEqual({ [draftKey('p', 'python')]: 'b' });
  });

  it('clamps the split position', () => {
    useWorkspace.getState().setSplitPct(1);
    expect(useWorkspace.getState().splitPct).toBe(MIN_SPLIT);
    useWorkspace.getState().setSplitPct(99);
    expect(useWorkspace.getState().splitPct).toBe(MAX_SPLIT);
  });
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { getJudge } from '@/features/judge/browserJudge';
import type { RuntimeProgress } from '@/features/judge/protocol';
import type { Language, TestResult, Verdict } from '@/features/judge/types';
import { computeVerdict } from '@/features/judge/verdict';
import type { Problem } from './parseProblem';
import type { RunMode } from './ui/ResultsPanel';

export interface RunState {
  mode: RunMode | null;
  results: TestResult[];
  verdict: Verdict | null;
  running: boolean;
  progress: RuntimeProgress | null;
  failure: string | null;
}

const IDLE: RunState = {
  mode: null,
  results: [],
  verdict: null,
  running: false,
  progress: null,
  failure: null,
};

interface Finished {
  mode: RunMode;
  language: Language;
  code: string;
  verdict: Verdict;
}

/** Runs the current code against a problem. Run = visible tests, Submit = every test. */
export function useJudgeRun(problem: Problem | null, onFinished: (finished: Finished) => void) {
  const [state, setState] = useState<RunState>(IDLE);
  const controller = useRef<AbortController | null>(null);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  useEffect(() => () => controller.current?.abort(), []);

  const reset = useCallback(() => {
    controller.current?.abort();
    setState(IDLE);
  }, []);

  const start = useCallback(
    async (mode: RunMode, language: Language, code: string) => {
      if (!problem) return;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      setState({ ...IDLE, mode, running: true });

      const tests = mode === 'run' ? problem.tests.filter((t) => !t.hidden) : problem.tests;
      const seen: TestResult[] = [];
      try {
        for await (const result of getJudge().runTests({
          language,
          code,
          fnName: problem.fnName,
          tests,
          timeLimitMs: problem.timeLimitMs,
          epsilon: problem.epsilon,
          checker: problem.checkers?.[language],
          signal: abort.signal,
          onProgress: (progress) => setState((s) => ({ ...s, progress })),
        })) {
          seen.push(result);
          setState((s) => ({ ...s, results: [...seen] }));
        }
        const verdict = computeVerdict(seen);
        setState((s) => ({ ...s, verdict }));
        finishedRef.current({ mode, language, code, verdict });
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          setState((s) => ({ ...s, failure: e instanceof Error ? e.message : String(e) }));
        }
      } finally {
        if (controller.current === abort) {
          setState((s) => ({ ...s, running: false, progress: null }));
        }
      }
    },
    [problem],
  );

  return { state, start, reset };
}

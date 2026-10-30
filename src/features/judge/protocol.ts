import type { JudgeError } from './types';

/** One test case, as sent to a language worker. */
export interface CaseRequest {
  id: number;
  code: string;
  fnName: string;
  input: unknown[];
  expected: unknown;
  epsilon: number;
  checker?: string;
}

interface CaseLogs {
  stdout: string;
  stdoutTruncated: boolean;
}

interface Completed extends CaseLogs {
  got: string;
  timeMs: number;
}

interface Failed extends CaseLogs {
  error: JudgeError;
  timeMs: number | null;
}

export type CaseOutcome =
  | ({ kind: 'pass' } & Completed)
  | ({ kind: 'fail' } & Completed)
  | ({ kind: 'error' } & Failed)
  | ({ kind: 'compile_error' } & Failed);

export type WorkerRequest = { type: 'run' } & CaseRequest;

/** Coarse runtime start-up stages, reported so the UI can show a loading state. */
export type RuntimeStage = 'downloading' | 'starting' | 'ready';

export interface RuntimeProgress {
  stage: RuntimeStage;
  /** 0..1 while the size is known, otherwise undefined. */
  fraction?: number | undefined;
}

export type WorkerResponse =
  | { type: 'ready' }
  | ({ type: 'progress' } & RuntimeProgress)
  | { type: 'fatal'; reason: string }
  | { type: 'result'; id: number; outcome: CaseOutcome };

/** Minimal worker surface so browser Workers and Node worker_threads are interchangeable. */
export interface WorkerHandle {
  postMessage(message: WorkerRequest): void;
  terminate(): void;
  onmessage: ((message: WorkerResponse) => void) | null;
  /** Fires for crashes (uncaught error, out of memory, unexpected exit). */
  onerror: ((reason: string) => void) | null;
}

export type WorkerFactory = () => WorkerHandle;

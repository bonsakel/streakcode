import { JudgeInternalError } from './types';
import type {
  CaseOutcome,
  CaseRequest,
  WorkerFactory,
  WorkerHandle,
  WorkerResponse,
} from './protocol';

export type RunnerResult =
  | { kind: 'outcome'; outcome: CaseOutcome }
  | { kind: 'timeout' }
  | { kind: 'crash'; reason: string };

/** Runs single test cases in an isolated worker for one runtime. */
export interface CaseRunner {
  run(
    request: Omit<CaseRequest, 'id'>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<RunnerResult>;
  warmUp(): void;
  dispose(): void;
}

/** Extra wall time on top of the limit for message passing before the worker is killed. */
const GRACE_MS = 100;
const DEFAULT_STARTUP_TIMEOUT_MS = 15_000;

interface Slot {
  handle: WorkerHandle;
  ready: Promise<void>;
  dead: boolean;
  onResult: ((message: Extract<WorkerResponse, { type: 'result' }>) => void) | null;
  onCrash: ((reason: string) => void) | null;
}

function abortError(): DOMException {
  return new DOMException('The run was aborted.', 'AbortError');
}

/**
 * Keeps one warm worker. A case that blows its time limit (or crashes the worker) gets the worker
 * terminated and replaced; cases are serialized so a kill never takes out someone else's run.
 */
export class WorkerRunner implements CaseRunner {
  private slot: Slot | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private nextId = 1;
  private disposed = false;

  constructor(
    private readonly factory: WorkerFactory,
    private readonly startupTimeoutMs = DEFAULT_STARTUP_TIMEOUT_MS,
  ) {}

  warmUp(): void {
    if (this.disposed) return;
    this.ensureSlot().ready.catch(() => undefined);
  }

  run(
    request: Omit<CaseRequest, 'id'>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<RunnerResult> {
    const job = this.queue.then(() => this.runNow(request, timeoutMs, signal));
    this.queue = job.catch(() => undefined);
    return job;
  }

  dispose(): void {
    this.disposed = true;
    if (this.slot) this.discard(this.slot);
  }

  private ensureSlot(): Slot {
    if (this.slot && !this.slot.dead) return this.slot;

    const handle = this.factory();
    let resolveReady!: () => void;
    let rejectReady!: (error: Error) => void;
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    const slot: Slot = { handle, ready, dead: false, onResult: null, onCrash: null };

    handle.onmessage = (message) => {
      if (message.type === 'ready') resolveReady();
      else slot.onResult?.(message);
    };
    handle.onerror = (reason) => {
      this.discard(slot);
      rejectReady(new JudgeInternalError(`The code runner failed to start: ${reason}`));
      slot.onCrash?.(reason);
    };
    this.slot = slot;
    return slot;
  }

  private discard(slot: Slot): void {
    if (slot.dead) return;
    slot.dead = true;
    slot.handle.onmessage = null;
    slot.handle.onerror = null;
    try {
      slot.handle.terminate();
    } catch {
      // Already gone.
    }
    if (this.slot === slot) this.slot = null;
  }

  private async awaitReady(slot: Slot): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startupTimeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        this.discard(slot);
        reject(new JudgeInternalError('The code runner took too long to start.'));
      }, this.startupTimeoutMs);
    });
    try {
      await Promise.race([slot.ready, startupTimeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  private async runNow(
    request: Omit<CaseRequest, 'id'>,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<RunnerResult> {
    if (this.disposed) throw new JudgeInternalError('The judge was disposed.');
    if (signal?.aborted) throw abortError();

    const slot = this.ensureSlot();
    await this.awaitReady(slot);
    if (signal?.aborted) throw abortError();

    const id = this.nextId++;
    return new Promise<RunnerResult>((resolve, reject) => {
      let settled = false;
      const settle = (finish: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        slot.onResult = null;
        slot.onCrash = null;
        finish();
      };
      const onAbort = () => {
        this.discard(slot);
        settle(() => reject(abortError()));
      };
      const timer = setTimeout(() => {
        this.discard(slot);
        settle(() => resolve({ kind: 'timeout' }));
      }, timeoutMs + GRACE_MS);

      signal?.addEventListener('abort', onAbort, { once: true });
      slot.onResult = (message) => {
        if (message.id === id) settle(() => resolve({ kind: 'outcome', outcome: message.outcome }));
      };
      slot.onCrash = (reason) => settle(() => resolve({ kind: 'crash', reason }));

      try {
        slot.handle.postMessage({ type: 'run', id, ...request });
      } catch (e) {
        this.discard(slot);
        settle(() => reject(e));
      }
    });
  }
}

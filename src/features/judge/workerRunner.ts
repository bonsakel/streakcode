import { JudgeInternalError } from './types';
import type {
  CaseOutcome,
  CaseRequest,
  RuntimeProgress,
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
    onProgress?: (progress: RuntimeProgress) => void,
  ): Promise<RunnerResult>;
  warmUp(): void;
  dispose(): void;
}

export interface WorkerRunnerOptions {
  /**
   * Longest silence (no progress message) tolerated while a worker starts up. Runtimes that
   * download assets report progress, which keeps resetting this clock.
   */
  startupTimeoutMs?: number;
  /** After a timeout or abort, start the replacement worker immediately instead of on next use. */
  respawnEagerly?: boolean;
}

/** Extra wall time on top of the limit for message passing before the worker is killed. */
const GRACE_MS = 100;
const DEFAULT_STARTUP_TIMEOUT_MS = 15_000;

interface Slot {
  handle: WorkerHandle;
  ready: Promise<void>;
  isReady: boolean;
  dead: boolean;
  lastProgress: RuntimeProgress | null;
  progressListeners: Set<(progress: RuntimeProgress) => void>;
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
  private readonly startupTimeoutMs: number;
  private readonly respawnEagerly: boolean;

  constructor(
    private readonly factory: WorkerFactory,
    options: WorkerRunnerOptions = {},
  ) {
    this.startupTimeoutMs = options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;
    this.respawnEagerly = options.respawnEagerly ?? false;
  }

  warmUp(): void {
    if (this.disposed) return;
    this.ensureSlot().ready.catch(() => undefined);
  }

  run(
    request: Omit<CaseRequest, 'id'>,
    timeoutMs: number,
    signal?: AbortSignal,
    onProgress?: (progress: RuntimeProgress) => void,
  ): Promise<RunnerResult> {
    const job = this.queue.then(() => this.runNow(request, timeoutMs, signal, onProgress));
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
    const slot: Slot = {
      handle,
      ready,
      isReady: false,
      dead: false,
      lastProgress: null,
      progressListeners: new Set(),
      onResult: null,
      onCrash: null,
    };

    const fail = (reason: string) => {
      const wasReady = slot.isReady;
      this.discard(slot);
      if (!wasReady) {
        rejectReady(new JudgeInternalError(`The code runner failed to start: ${reason}`));
      }
      slot.onCrash?.(reason);
    };

    handle.onmessage = (message) => {
      if (message.type === 'ready') {
        slot.isReady = true;
        resolveReady();
      } else if (message.type === 'progress') {
        slot.lastProgress = { stage: message.stage, fraction: message.fraction };
        for (const listener of slot.progressListeners) listener(slot.lastProgress);
      } else if (message.type === 'fatal') {
        fail(message.reason);
      } else {
        slot.onResult?.(message);
      }
    };
    handle.onerror = fail;
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

  private async awaitReady(
    slot: Slot,
    onProgress?: (progress: RuntimeProgress) => void,
  ): Promise<void> {
    if (slot.isReady) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let rejectStartup!: (error: Error) => void;
    const startupTimeout = new Promise<never>((_, reject) => {
      rejectStartup = reject;
    });
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.discard(slot);
        rejectStartup(new JudgeInternalError('The code runner took too long to start.'));
      }, this.startupTimeoutMs);
    };
    const listener = (progress: RuntimeProgress) => {
      arm();
      onProgress?.(progress);
    };

    slot.progressListeners.add(listener);
    if (slot.lastProgress) onProgress?.(slot.lastProgress);
    arm();
    try {
      await Promise.race([slot.ready, startupTimeout]);
    } finally {
      clearTimeout(timer);
      slot.progressListeners.delete(listener);
    }
  }

  private async runNow(
    request: Omit<CaseRequest, 'id'>,
    timeoutMs: number,
    signal?: AbortSignal,
    onProgress?: (progress: RuntimeProgress) => void,
  ): Promise<RunnerResult> {
    if (this.disposed) throw new JudgeInternalError('The judge was disposed.');
    if (signal?.aborted) throw abortError();

    const slot = this.ensureSlot();
    await this.awaitReady(slot, onProgress);
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
      const kill = () => {
        this.discard(slot);
        if (this.respawnEagerly) this.warmUp();
      };
      const onAbort = () => {
        kill();
        settle(() => reject(abortError()));
      };
      const timer = setTimeout(() => {
        kill();
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

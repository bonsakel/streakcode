import { formatValue, valuesMatch } from './compare';
import { PYTHON_HARNESS } from './pythonHarness';
import type {
  CaseOutcome,
  CaseRequest,
  RuntimeProgress,
  WorkerRequest,
  WorkerResponse,
} from './protocol';
import { lockDownGlobals } from './sandbox';
import type { JudgeError } from './types';

/** The slice of Pyodide the judge relies on; satisfied by the real `PyodideInterface`. */
export interface PythonRuntime {
  runPython(code: string): unknown;
  globals: { get(name: string): unknown };
}

type HarnessFn = (
  code: string,
  fnName: string,
  inputJson: string,
  expectedJson: string,
  checker: string | null,
) => string;

type RawResult = { stdout: string; stdoutTruncated: boolean } & (
  | { kind: 'returned'; value: string; checked: boolean | null; timeMs: number }
  | { kind: 'error' | 'compile_error'; error: JudgeError; timeMs: number | null }
);

export interface PythonCoreOptions {
  post: (message: WorkerResponse) => void;
  /** Load the interpreter. Environment-specific (browser fetch vs Node require). */
  loadRuntime: (report: (progress: RuntimeProgress) => void) => Promise<PythonRuntime>;
}

function toOutcome(raw: RawResult, req: CaseRequest): CaseOutcome {
  const logs = { stdout: raw.stdout, stdoutTruncated: raw.stdoutTruncated };
  if (raw.kind !== 'returned') {
    return { kind: raw.kind, error: raw.error, timeMs: raw.timeMs, ...logs };
  }
  const value: unknown = JSON.parse(raw.value);
  const accepted = raw.checked ?? valuesMatch(value, req.expected, req.epsilon);
  return {
    kind: accepted ? 'pass' : 'fail',
    got: formatValue(value),
    timeMs: raw.timeMs,
    ...logs,
  };
}

/**
 * Runtime-agnostic Python worker logic, shared by the browser Worker and the Node test worker.
 * `start()` boots the interpreter and reports `ready` (or `fatal`) to the parent.
 */
export function createPythonWorkerCore({ post, loadRuntime }: PythonCoreOptions) {
  let run: HarnessFn | null = null;
  let booted: Promise<void> | null = null;

  async function boot(): Promise<void> {
    post({ type: 'progress', stage: 'starting' });
    const runtime = await loadRuntime((progress) => post({ type: 'progress', ...progress }));
    runtime.runPython(PYTHON_HARNESS);
    run = runtime.globals.get('__skill_run') as HarnessFn;
    // Only after the interpreter is fully up: loading it needs fetch/importScripts.
    lockDownGlobals();
    post({ type: 'progress', stage: 'ready', fraction: 1 });
    post({ type: 'ready' });
  }

  return {
    start(): Promise<void> {
      booted ??= boot().catch((error: unknown) => {
        const reason = error instanceof Error ? error.message : String(error);
        post({ type: 'fatal', reason });
      });
      return booted;
    },

    async handle(message: WorkerRequest): Promise<void> {
      if (message.type !== 'run') return;
      await this.start();
      if (!run) return;

      let outcome: CaseOutcome;
      try {
        const raw = JSON.parse(
          run(
            message.code,
            message.fnName,
            JSON.stringify(message.input),
            JSON.stringify(message.expected ?? null),
            message.checker ?? null,
          ),
        ) as RawResult;
        outcome = toOutcome(raw, message);
      } catch (e) {
        outcome = {
          kind: 'error',
          error: {
            name: 'InternalError',
            message: e instanceof Error ? e.message : String(e),
          },
          timeMs: null,
          stdout: '',
          stdoutTruncated: false,
        };
      }
      post({ type: 'result', id: message.id, outcome });
    },
  };
}

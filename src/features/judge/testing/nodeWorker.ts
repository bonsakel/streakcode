import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { createJudge } from '../judge';
import type { WorkerFactory, WorkerResponse } from '../protocol';
import { transpileTypeScript } from '../transpile';
import type { Judge } from '../types';
import { WorkerRunner } from '../workerRunner';

const bundles = new Map<string, string>();

/** Bundle a genuine worker entry once; every worker thread evaluates this same code. */
function workerBundle(entry: string): string {
  let code = bundles.get(entry);
  if (code === undefined) {
    const result = buildSync({
      entryPoints: [fileURLToPath(new URL(entry, import.meta.url))],
      bundle: true,
      write: false,
      platform: 'node',
      format: 'cjs',
      logLevel: 'silent',
    });
    code = result.outputFiles[0]?.text ?? '';
    bundles.set(entry, code);
  }
  return code;
}

function nodeFactory(entry: string, workerData?: unknown): WorkerFactory {
  return () => {
    const worker = new Worker(workerBundle(entry), { eval: true, workerData });
    const handle: ReturnType<WorkerFactory> = {
      postMessage: (message) => worker.postMessage(message),
      terminate: () => void worker.terminate(),
      onmessage: null,
      onerror: null,
    };
    worker.on('message', (message: WorkerResponse) => handle.onmessage?.(message));
    worker.on('error', (error: Error) => handle.onerror?.(error.message));
    worker.on('exit', (code) => {
      if (code !== 0) handle.onerror?.(`worker exited with code ${code}`);
    });
    return handle;
  };
}

export const nodeWorkerFactory: WorkerFactory = nodeFactory('./nodeWorkerEntry.ts');

/** Spawns a Python worker; `onSpawn` lets tests count how many workers were created. */
export function nodePythonWorkerFactory(onSpawn?: () => void): WorkerFactory {
  const make = nodeFactory('./nodePythonWorkerEntry.ts', {
    pyodideEntry: createRequire(import.meta.url).resolve('pyodide'),
  });
  return () => {
    onSpawn?.();
    return make();
  };
}

/** A judge wired to Node worker threads, for tests and the problem-validation script. */
export function createNodeJudge(onPythonSpawn?: () => void): Judge {
  const runner = new WorkerRunner(nodeWorkerFactory);
  const pythonRunner = new WorkerRunner(nodePythonWorkerFactory(onPythonSpawn), {
    startupTimeoutMs: 30_000,
    respawnEagerly: true,
  });
  return createJudge({
    javascript: { prepare: (code) => code, runner },
    typescript: { prepare: transpileTypeScript, runner },
    python: { prepare: (code) => code, runner: pythonRunner },
  });
}

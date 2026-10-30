import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { createJudge } from '../judge';
import type { WorkerFactory, WorkerResponse } from '../protocol';
import { transpileTypeScript } from '../transpile';
import type { Judge } from '../types';
import { WorkerRunner } from '../workerRunner';

let bundle: string | undefined;

/** Bundle the genuine worker entry once; every worker thread evaluates this same code. */
function workerBundle(): string {
  if (!bundle) {
    const result = buildSync({
      entryPoints: [fileURLToPath(new URL('./nodeWorkerEntry.ts', import.meta.url))],
      bundle: true,
      write: false,
      platform: 'node',
      format: 'cjs',
      logLevel: 'silent',
    });
    bundle = result.outputFiles[0]?.text ?? '';
  }
  return bundle;
}

export const nodeWorkerFactory: WorkerFactory = () => {
  const worker = new Worker(workerBundle(), { eval: true });
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

/** A judge wired to Node worker threads, for tests and the problem-validation script. */
export function createNodeJudge(): Judge {
  const runner = new WorkerRunner(nodeWorkerFactory);
  return createJudge({
    javascript: { prepare: (code) => code, runner },
    typescript: { prepare: transpileTypeScript, runner },
  });
}

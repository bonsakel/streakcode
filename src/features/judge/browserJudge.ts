import { createJudge } from './judge';
import type { WorkerHandle, WorkerResponse } from './protocol';
import { transpileTypeScript } from './transpile';
import type { Judge } from './types';
import { WorkerRunner } from './workerRunner';

export function wrapBrowserWorker(worker: Worker): WorkerHandle {
  const handle: WorkerHandle = {
    postMessage: (message) => worker.postMessage(message),
    terminate: () => worker.terminate(),
    onmessage: null,
    onerror: null,
  };
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => handle.onmessage?.(event.data);
  worker.onerror = (event) => {
    event.preventDefault();
    handle.onerror?.(event.message || 'worker error');
  };
  worker.onmessageerror = () => handle.onerror?.('worker message could not be read');
  return handle;
}

let instance: Judge | null = null;

/** App-wide judge. JavaScript and TypeScript share one worker; TypeScript is transpiled first. */
export function getJudge(): Judge {
  if (!instance) {
    const jsRunner = new WorkerRunner(() =>
      wrapBrowserWorker(new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'module' })),
    );
    instance = createJudge({
      javascript: { prepare: (code) => code, runner: jsRunner },
      typescript: { prepare: transpileTypeScript, runner: jsRunner },
    });
  }
  return instance;
}

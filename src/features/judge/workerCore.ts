import { runCase } from './harness';
import type { WorkerRequest, WorkerResponse } from './protocol';
import { lockDownGlobals } from './sandbox';

/**
 * Runtime-agnostic worker logic shared by the browser Worker and the Node test worker.
 * Call this only after capturing any native `postMessage` you still need.
 */
export function createWorkerCore(post: (message: WorkerResponse) => void) {
  lockDownGlobals();
  return {
    async handle(message: WorkerRequest): Promise<void> {
      if (message.type !== 'run') return;
      post({ type: 'result', id: message.id, outcome: await runCase(message) });
    },
  };
}

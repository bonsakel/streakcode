import { parentPort } from 'node:worker_threads';
import type { WorkerRequest, WorkerResponse } from '../protocol';
import { createWorkerCore } from '../workerCore';

/** Entry bundled by `nodeWorker.ts`: the real worker core running under worker_threads. */
const port = parentPort;
if (!port) throw new Error('nodeWorkerEntry must run inside a worker thread.');

const post = (message: WorkerResponse) => port.postMessage(message);
const core = createWorkerCore(post);

process.on('unhandledRejection', () => undefined);
port.on('message', (message: WorkerRequest) => {
  void core.handle(message);
});

post({ type: 'ready' });

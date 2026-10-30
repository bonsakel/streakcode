import type { WorkerRequest, WorkerResponse } from './protocol';
import { createWorkerCore } from './workerCore';

const post = self.postMessage.bind(self) as (message: WorkerResponse) => void;
const core = createWorkerCore(post);

// Floating promises in user code must not take the worker down.
self.addEventListener('unhandledrejection', (event) => event.preventDefault());
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  void core.handle(event.data);
};

post({ type: 'ready' });

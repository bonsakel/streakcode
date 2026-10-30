import { createRequire } from 'node:module';
import { parentPort, workerData } from 'node:worker_threads';
import type { WorkerRequest, WorkerResponse } from '../protocol';
import { createPythonWorkerCore, type PythonRuntime } from '../pythonCore';

/** Entry bundled by `nodeWorker.ts`: the real Python core, with Pyodide loaded from node_modules. */
const port = parentPort;
if (!port) throw new Error('nodePythonWorkerEntry must run inside a worker thread.');

interface PyodideNode {
  loadPyodide(options: { stdout: () => void; stderr: () => void }): Promise<PythonRuntime>;
}

const { pyodideEntry } = workerData as { pyodideEntry: string };
const post = (message: WorkerResponse) => port.postMessage(message);

const core = createPythonWorkerCore({
  post,
  async loadRuntime() {
    // Required at runtime (not bundled) so esbuild never tries to inline the wasm package.
    const pyodide = createRequire(pyodideEntry)(pyodideEntry) as PyodideNode;
    return pyodide.loadPyodide({ stdout: () => undefined, stderr: () => undefined });
  },
});

process.on('unhandledRejection', () => undefined);
port.on('message', (message: WorkerRequest) => {
  void core.handle(message);
});

void core.start();

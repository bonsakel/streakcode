import type { WorkerRequest, WorkerResponse } from './protocol';
import { prefetchPyodideAssets } from './prefetchPyodide';
import { createPythonWorkerCore, type PythonRuntime } from './pythonCore';

interface PyodideModule {
  loadPyodide(options: { indexURL: string }): Promise<PythonRuntime>;
}

const post = self.postMessage.bind(self) as (message: WorkerResponse) => void;

// Same-origin, version-pinned copy of Pyodide (see scripts/copy-pyodide.mjs); no third-party CDN.
const base = new URL(`${import.meta.env.BASE_URL}${__PYODIDE_DIR__}/`, self.location.origin);

const core = createPythonWorkerCore({
  post,
  async loadRuntime(report) {
    await prefetchPyodideAssets(base, report);
    report({ stage: 'starting' });
    const module = (await import(
      /* @vite-ignore */ new URL('pyodide.mjs', base).href
    )) as PyodideModule;
    return module.loadPyodide({ indexURL: base.href });
  },
});

self.addEventListener('unhandledrejection', (event) => event.preventDefault());
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  void core.handle(event.data);
};

void core.start();

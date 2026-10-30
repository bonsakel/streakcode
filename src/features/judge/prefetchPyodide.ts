import type { RuntimeProgress } from './protocol';

/** Files Pyodide needs, fetched up front so we can show real download progress. */
const ASSETS = [
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide.asm.mjs',
  'pyodide-lock.json',
  'pyodide.mjs',
] as const;

/**
 * Download the runtime files with progress. Pyodide fetches the same URLs afterwards, which the
 * browser then serves from its HTTP cache (the files are served with long-lived cache headers).
 */
export async function prefetchPyodideAssets(
  base: URL,
  report: (progress: RuntimeProgress) => void,
): Promise<void> {
  const loaded = new Map<string, number>();
  const totals = new Map<string, number>();

  const emit = () => {
    const known = totals.size === ASSETS.length && [...totals.values()].every((t) => t > 0);
    const total = [...totals.values()].reduce((a, b) => a + b, 0);
    const done = [...loaded.values()].reduce((a, b) => a + b, 0);
    report({
      stage: 'downloading',
      fraction: known && total > 0 ? Math.min(1, done / total) : undefined,
    });
  };

  emit();
  await Promise.all(
    ASSETS.map(async (name) => {
      const url = new URL(name, base);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not download ${name} (HTTP ${response.status}).`);
      // Compressed transfers hide the real size; fall back to "unknown" rather than lying.
      const length = Number(response.headers.get('content-length'));
      const encoded = response.headers.get('content-encoding');
      if (length > 0 && !encoded) totals.set(name, length);
      else totals.set(name, 0);
      if (!response.body) {
        await response.arrayBuffer();
        return;
      }
      const reader = response.body.getReader();
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        loaded.set(name, received);
        emit();
      }
      if (!totals.get(name)) totals.set(name, received);
      loaded.set(name, received);
      emit();
    }),
  );
}

/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pyodideVersion = (
  JSON.parse(readFileSync('./node_modules/pyodide/package.json', 'utf8')) as { version: string }
).version;

export default defineConfig({
  plugins: [react()],
  define: { __PYODIDE_DIR__: JSON.stringify(`pyodide-${pyodideVersion}`) },
  // The lazily loaded editor chunk (Monaco) is intentionally large; see DECISIONS.md.
  build: { chunkSizeWarningLimit: 4000 },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});

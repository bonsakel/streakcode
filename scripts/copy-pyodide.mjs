// Copies the Pyodide runtime out of node_modules into public/pyodide-<version>/ so it is served from
// our own origin in dev and shipped in dist/ (no third-party CDN). Idempotent; the directory name
// carries the version so it can be cached forever.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', 'pyodide');
const FILES = [
  'pyodide.mjs',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

const { version } = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
const target = join(root, 'public', `pyodide-${version}`);

if (!FILES.every((file) => existsSync(join(target, file)))) {
  for (const entry of readdirSync(join(root, 'public'))) {
    if (entry.startsWith('pyodide-')) rmSync(join(root, 'public', entry), { recursive: true });
  }
  mkdirSync(target, { recursive: true });
  for (const file of FILES) cpSync(join(source, file), join(target, file));
  console.log(`Copied Pyodide ${version} to public/pyodide-${version}/`);
}

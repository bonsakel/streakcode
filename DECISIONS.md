# Decisions

Ambiguities in `PROJECT_SPEC.md` and how they were resolved (simplest option that stays static, free and login-free).

## Phase 1

- **Tailwind v3** (not v4): mature `tailwind.config.ts` theming with CSS variables; no stack change.
- **Theme tokens are RGB triplets** (`--c-accent: 139 124 255`) so Tailwind opacity modifiers like `bg-accent/20` work.
- **Themes:** Midnight (default), Daylight, Gamer Neon, Touch Grass, Sunset Doomscroll, plus a hidden `retro` theme unlocked by the Konami code.
- **Fonts:** Bricolage Grotesque (display and body) and JetBrains Mono via `@fontsource-variable`, self-hosted.
- **Settings persistence:** one Zustand `persist` store under `skill-issue:settings`. Progress and per-problem code get their own keys in later phases.
- **Husky:** the pre-commit hook runs `npm run lint && npm run typecheck`. Tests run in CI and before each phase commit.
- **Lint script** runs ESLint and `prettier --check`; `npm run format` fixes formatting.
- **Placeholder routes** render a friendly "still cooking" card until their phase lands.
- **Path alias** `@/` maps to `src/` (no `baseUrl`, which is deprecated in TS 6).
- **Handle word lists** live in `src/features/copy/handles.ts` so all copy stays in the copy folder.

## Phase 2

- **Worker-agnostic harness.** `harness.ts` + `workerCore.ts` hold all judging logic. The browser `js.worker.ts` and a Node `worker_threads` entry (used by tests and, later, `validate-problems`) are thin adapters, so tests exercise the real worker code. The Node entry is bundled with `esbuild` (dev dependency) at test time.
- **One test case per worker message.** The main thread owns the timer; on timeout it terminates the worker, spawns a fresh one and reports TLE. A worker-measured time over the limit (sync code cannot be preempted) is also TLE. 100 ms of grace covers message latency.
- **Short-circuit policy.** After a TLE or compile error the remaining tests are `skipped` (they would fail identically and cost `limit x N` seconds). Wrong answers and runtime errors keep going so the results panel shows every test. The verdict is decided by the first failure in test order.
- **User code is re-evaluated for every case** inside `(function(){ ... })()` via indirect `eval` with `//# sourceURL=user-code.js`, so the wrapper offset is exactly 1 line and stack traces map back to the user's line. A `new Function(code)` parse check runs first, which separates syntax errors from top-level runtime errors and stops code from breaking out of the wrapper. Global state mutated by user code can persist between cases on a warm worker.
- **Syntax errors in plain JS have no line number** (V8 does not expose one for `new Function`). TypeScript syntax errors do (sucrase reports a position).
- **Missing function = Runtime Error**, not Compile Error (the code compiled; the entry point is absent).
- **Return values are normalized through JSON** (same shape a Python harness will produce). `undefined` stays distinct from `null` at the top level, nested `undefined` becomes `null`, `NaN`/`Infinity` never match a number, cycles and functions are a runtime error. Object key order is ignored.
- **Float tolerance** is a per-run `epsilon`, applied as absolute-or-relative to every number. `0` (default) is exact.
- **Checker** is a source string in the submission's language defining `checker(input, got, expected) -> boolean`; it receives an unmutated copy of the input and runs inside the same worker and time limit.
- **Hidden tests never leak:** their input, expected, got and stdout are omitted from `TestResult`.
- **Console capture** is capped at 10 KB per test (`MAX_STDOUT_BYTES`) and flagged as truncated; displayed values are capped at 2000 characters.
- **TypeScript is transpile-only** (sucrase, lazy-loaded on the main thread, then run as JS). Type errors are not reported.
- **Sandbox hygiene** shadows `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `importScripts`, `Worker`, `SharedWorker`, `BroadcastChannel` and `postMessage` in the worker. This is hygiene, not a security boundary (to be stated in the README).
- **Conformance table** (`conformance.ts`) lists behaviours every language must agree on. Phase 3 adds Python snippets to the same cases, which is the JS/Python parity test.
- **`/judge-lab`** is a deliberately plain proof page, not linked from the navbar.

## Phase 3: Python (Pyodide)

- **Comparison stays in JS.** The Python harness returns normalized JSON; `valuesMatch`, `formatValue` and epsilon logic are shared, so parity is structural. Only a user `checker` runs in Python.
- **None is null.** The JS "missing return is wrong" case has no Python twin; `None` equals `null`.
- **Async Python functions** are rejected with a `TypeError`.
- **Time limits.** Pyodide can't be interrupted without SharedArrayBuffer (needs COOP/COEP headers, which static hosts and embeds make awkward). On TLE the worker is terminated and a warm replacement starts immediately in the background.
- **Self-hosted runtime.** `scripts/copy-pyodide.mjs` (run by `predev`/`prebuild`) copies Pyodide into the gitignored `public/pyodide-<version>/`; no CDN. `public/_headers` makes it immutable-cacheable.
- **Progress.** The worker streams the assets (warming the HTTP cache) and reports `downloading` -> `starting` -> `ready`. Startup timeout is inactivity-based (30 s).
- **Sandbox lockdown** runs only after Pyodide boots, because boot needs fetch. `import js` network calls are blocked afterwards.
- **Node tests** load Pyodide from `node_modules` in a `worker_threads` worker, using the same core as the browser.

## Phase 4: Problem system

- **Index by `import.meta.glob`, not a generated file.** Vite resolves the globs at build time, so the "build-time index" is the bundle itself: `problem.json` files are eager (lists, cards, search), everything else is a lazy chunk per file. No generated file to forget to commit.
- **Reference solutions never reach the browser.** The glob excludes `solution.*`. Hidden tests do ship (it is a static site); the README already says the judge is not a security boundary.
- **One parser for browser and CI.** `parseProblem` turns a folder's files into a validated `Problem`, so both agree on what is well formed. It collects every problem in a folder instead of stopping at the first.
- **Folder name must equal slug; one function name for every language.** Python keeps camelCase `fnName`. Simplest model; a per-language name can be added later if needed.
- **Hints are one file** (`hints.md`, exactly 3, split on `---`).
- **Starters return `null`/`None`** so they lose with Wrong Answer rather than crash. Validation enforces "no crash, not already correct" in all three languages.
- **TypeScript is validated by running `solution.js` as TypeScript**, which exercises the TS pipeline without a third solution file.
- **Test data comes from independent brute force** (`scripts/author/generate-tests.py`), not from the reference solutions.
- **XP:** easy 50-60, medium 120-130, hard 250. Tunable later without touching code.
- **`problems/` is excluded from ESLint** (it is sample code for users, with intentionally unused parameters) but still formatted by Prettier, except `tests.json`.
- **`validate-problems` runs under `tsx`** so it can import the real judge sources; `tsx` is a devDependency.

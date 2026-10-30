# Decisions

Ambiguities in `PROJECT_SPEC.md` and how they were resolved (simplest option that stays static, free and login-free).

## Brand update

- The product is now **Streakcode**, with the tagline "Build your streak. Small coding wins, one day at a time."
- Existing browser-storage keys, the daily challenge seed, and the old export marker remain recognized so current users keep their progress and backups. New exports and downloads use the Streakcode name.
- The project is published at `https://github.com/bonsakel/streakcode`.

## Phase 9: Landing page and polish

- The homepage demo uses the easy "Left on Read" challenge with a working JavaScript example already loaded. It runs visible tests only and never grants progress or XP. The larger editor is loaded when the demo reaches the viewport.
- The README is written for first-time visitors and recruiters, with original screenshots from the app and a plain-language "how to use it" guide.
- The privacy page explains in everyday language what stays in the browser and what happens when someone runs or submits code.
- The original mascot art is reused for the favicon and install icons; the social preview image is an original static graphic.
- Axe runs in jsdom for each main route; contrast is checked in a real browser because jsdom cannot measure rendered colors. Problem content headings begin at h2 and the keyboard-scrollable examples are focusable.

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

## Phase 5: Problem UI

- **Monaco is self-hosted and curated.** `@monaco-editor/react` loads Monaco from jsdelivr by default, which would break "no external requests". `src/features/editor/monacoSetup.ts` hands it a bundled `monaco-editor` (`loader.config({ monaco })`) built from `editor.api` plus only the features a judge editor needs (find, comments, folding, multi-cursor, line operations, bracket matching, suggest) and syntax highlighting for JS/TS/Python. Only the base editor worker is bundled: no TypeScript language service (several MB), so there are no red squiggles from Monaco; the judge reports errors, and the failing line is underlined. The editor is a lazy chunk (about 3.4 MB, 870 KB gzipped) fetched only on problem pages, far below any static host's per-file limit.
- **Editor theme follows the app theme.** `buildMonacoTheme` (pure, unit tested) maps the CSS-variable tokens to a Monaco theme and is re-applied on theme change.
- **`react-markdown` renders statements, hints and editorials.** A small addition beyond the listed stack; it ignores raw HTML, so problem content cannot inject markup.
- **`overrides.dompurify` in `package.json`.** Monaco bundles a dompurify with known advisories; the override keeps `npm audit` at 0 vulnerabilities.
- **Custom split pane**, no library: pointer drag, keyboard arrows (Shift for bigger steps, Home/End), `role="separator"`, persisted in the workspace store. It stacks vertically below `lg`.
- **Run vs Submit.** Run executes visible tests only and records nothing. Submit executes every test, records a submission (newest first, capped at 25 per problem) and marks the problem solved on the first Accepted. Hidden tests show only pass/fail and a "Hidden test #N" label. Ctrl/Cmd+Enter runs.
- **Drafts** are saved per problem and language (debounced 300 ms) in localStorage. Reset code asks for confirmation.
- **Editorial is locked until solved.** Hints reveal one at a time and the count is stored, so Phase 7 can use `hintsUsed` and `failedBefore` for XP.
- **Solved state lives in `useProgress`.** XP, levels and streaks are Phase 7; verdict tone copy, mascot and confetti are Phase 6.
- **Results reveal** is staggered (80 ms per row, capped) and respects reduced motion.

## Phase 6: Personality

- Mascot is "Blobert", an original SVG blob (5 moods) coloured by the theme accent.
- Verdict copy lives in `src/features/copy/verdicts.ts`: per-tone pools with `{passed}`, `{total}`, `{handle}` placeholders. Rule: roast the code, never the person. Professional tone is plain and emoji-free.
- Sounds are synthesised with Web Audio (no audio files), quiet, and off by default.
- `canvas-confetti` (ISC) is lazy-loaded; skipped for reduced motion and the Professional tone.
- Easter eggs: empty-function roast (submitting a placeholder body), and 5 consecutive TLEs gives an "are you okay?" message (session-only counter). Konami was done in Phase 1.
- Ctrl/Cmd+Shift+Enter submits from the editor (Ctrl/Cmd+Enter still runs).

## Phase 7: Gamification

- **XP:** solve XP is awarded once per problem on the first accepted submission. Hints cost 15% of base each (never below 40% of base); first try (no failed submissions) is +25%; speed (slowest test under 10% of the time limit) is +10%. Speed uses runtime, not wall-clock solve time, because the app does not track time-on-problem.
- **Levels:** 0 / 100 / 300 / 700 / 1400 / 2400 XP for NPC through Certified Menace. Tuned so the 24-problem launch set can reach the top.
- **Streaks:** a "day" is the user's local calendar day; any accepted submission counts. A freeze token is banked every 7 streak days (max 3) and is spent automatically to bridge missed days. The streak is replayed from the activity log, so there is no separate streak state to corrupt.
- **Daily challenge:** `dailySlug` hashes the local date (FNV-1a) over the sorted slugs, so no server is needed. Completing it pays 25 XP + 5 per streak day (capped at 7 days). Adding problems changes the future daily pick; that is accepted.
- **Achievements:** 25, defined as pure `check` functions in `gamification/achievements.ts`. They are also granted retroactively after a store migration or import.
- **Storage:** progress store is v2 (migration computes XP and activity from v1 solves). Export is a validated JSON file; import validates with zod before touching state, so a bad file cannot corrupt progress. Reset asks for confirmation.
- **Fix:** the generated handle was not persisted until a setting changed, so it changed on every reload. It is now written on first load.
- Run reactions (message, sound, confetti, rewards toasts) moved into `useRunReaction`, which also keeps `ProblemPage` under the size limit.

## Phase 8: Boss Fight, sharing, command palette

- **Boss:** "Sir Spaghetti Code". Each run draws one easy, one medium and one hard problem at random (nearest difficulty if one is missing), 30-minute clock, +150 XP on a win. Taunts exist per tone; Professional is plain.
- **Persistence:** the run lives in the persisted boss store with an absolute `endsAt`, so reloading cannot pause the clock. A run that expires while the tab is closed is settled as a loss on next load. The win bonus and tally are applied exactly once.
- **Reuse:** `Workbench` and `ProblemLoader` were extracted from `ProblemPage`; the boss page embeds them and listens to `onSubmitted`. Run (not Submit) never advances the boss.
- **Share card:** a 1200x630 PNG drawn locally on a canvas in the active theme colors. Copy link only shares the problem URL; no progress data is embedded.
- **Palette:** custom combobox (no new dependency). Ctrl/Cmd+K is bound on `window` and forwarded from Monaco's own Cmd/Ctrl+K binding.
- **Tests:** `@testing-library/user-event` was not added; tests use `fireEvent`. Canvas rendering is verified in the browser only (jsdom has no canvas).

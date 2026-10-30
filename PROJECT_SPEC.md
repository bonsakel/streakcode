# SKILL ISSUE: a code judge for people who are "cooked" (and want to un-cook)

> Instructions for Claude Code. Read this whole file before writing any code. Build in the phases listed at the bottom, committing after each one. Ask me before deviating from the stack or scope.

## 0. One-paragraph pitch

**Skill Issue** is a LeetCode-style online judge with personality. You write code in the browser, hit **Run**, and get instant verdicts delivered in Gen Z humor. It has no login, no paid APIs, and nothing to install. A recruiter can open the link and solve a problem within 10 seconds. The goal is to make practicing code feel like a game (XP, streaks, boss fights, achievements, shareable result cards) rather than homework. It should look and feel like a real product, not a tutorial project.

**Name:** Skill Issue. **Tagline:** "Un-cook yourself. One problem at a time."
**Tone:** funny, warm, hype-man energy. The app roasts your code, never you. Never mean, never cringe-forced. Use slang sparingly and keep it readable by non-Gen-Z people (recruiters are in the audience). Include a **Tone toggle**: `Hype` (default), `Roast`, `Professional` (plain verdicts, for people who hate fun).

---

## 1. Hard constraints

1. **No login or accounts.** Progress lives in `localStorage` (with export/import as a JSON file). Users get an auto-generated anonymous handle (e.g. `SleepyCapybara42`, `CaffeinatedGoblin7`) they can reroll.
2. **No paid APIs or paid infrastructure.** Everything must run on free tiers. Prefer zero backend.
3. **Safe code execution without a server we have to protect.** Run user code **entirely in the browser**:
   - JavaScript: dedicated Web Worker, killed on timeout.
   - TypeScript: transpile in-browser (use `sucrase` or `esbuild-wasm`), then run as JS.
   - Python: **Pyodide** (WASM) inside a Web Worker.
4. **Fully static deploy** (Cloudflare Pages or Vercel free tier). The repo must have a one-command local start and a live-deploy guide.
5. **Open-source friendly:** MIT license, clean README with GIF/screenshots, CONTRIBUTING with "how to add a problem".
6. **Original assets only.** The mascot, logo, and sounds must be original or CC0. Do not copy any existing brand, character, meme-template image, or copyrighted audio. Emoji and CSS/SVG art are fine.
7. Works on desktop and mobile (editor is usable on a phone, just simplified).

---

## 2. Tech stack (fixed unless I approve a change)

| Concern | Choice |
|---|---|
| Build | Vite + React 18 + TypeScript (strict) |
| Routing | React Router (`/`, `/problems`, `/problem/:slug`, `/daily`, `/boss`, `/profile`, `/about`) |
| Styling | Tailwind CSS + CSS variables for theming |
| Editor | `@monaco-editor/react` (lazy-loaded) |
| State | Zustand with `persist` middleware (localStorage) |
| Animation | Framer Motion; `canvas-confetti` for celebrations |
| Python runtime | `pyodide` (load lazily, cache in the browser; show a fun loading screen) |
| Tests | Vitest (unit), Playwright (a few e2e smoke tests) |
| Lint/format | ESLint + Prettier, Husky pre-commit (lint + typecheck) |
| CI | GitHub Actions: lint, typecheck, unit tests, **problem validation**, build |

Keep bundle size sane: lazy-load Monaco and Pyodide, route-level code splitting.

---

## 3. Core features

### 3.1 The judge (most important; make it solid)

**Problem format:** function-based, like LeetCode. The user implements a named function. The runner calls it with JSON-decoded args and compares the output to the expected value.

**Runner architecture**
- `src/judge/` contains a language-agnostic `Judge` interface:
  ```ts
  runTests(opts: { language: 'javascript'|'typescript'|'python'; code: string; fnName: string; tests: TestCase[]; timeLimitMs: number }): AsyncIterable<TestResult>
  ```
- One worker per language (`js.worker.ts`, `py.worker.ts`). Stream results back per test case so the UI can animate each test lighting up in sequence.
- **Timeout handling:** if a test exceeds `timeLimitMs`, terminate the worker, spawn a fresh one, and report `Time Limit Exceeded` for that case. For Python, keep a warm Pyodide instance where possible and make restarts after TLE as cheap as possible (cache the Pyodide assets).
- Capture `console.log` / `print` output per test and show it in an output panel (truncate to ~10 KB).
- Catch and display runtime errors with a readable message and line number mapped back to the user's code.
- Block obviously dangerous surface in the JS worker (no `fetch`, `XMLHttpRequest`, `importScripts` after init, `WebSocket`; delete or shadow them). It is client-side only, so this is hygiene, not a security boundary. Say so in the README.
- Comparison supports: exact equality, deep equality for arrays/objects, float tolerance, and "any valid answer" via an optional per-problem `checker` function (for problems with multiple correct outputs).

**Verdicts** (each has a Hype / Roast / Professional message pool; pick randomly from the pool, never the same twice in a row):
- `Accepted` (e.g. "W. Absolute W." / "Okay, who let you cook?")
- `Wrong Answer` (e.g. "Close, but the vibes are off." / "Skill issue (temporary)")
- `Time Limit Exceeded` (e.g. "Your code is still loading... like my motivation.")
- `Runtime Error` (e.g. "It crashed. We don't talk about it.")
- `Compile/Syntax Error` (e.g. "That's not code, that's a cry for help.")
- `Memory`-style limits are not enforceable in-browser; do not fake them.

**Results UI:** per-test cards (visible tests show input / expected / got; hidden tests show only pass/fail and a "hidden test #4 failed" label), runtime in ms, and a **Run** (visible tests only) vs **Submit** (all tests, counts for XP) split.

### 3.2 Problems

Ship **at least 24 problems** across 3 difficulty tiers, each themed in a funny, relatable way, but teaching real, classic concepts (arrays, hashing, strings, two pointers, stacks, binary search, recursion, DP basics, graphs/BFS, sorting, greedy). Each problem is a self-contained folder:

```
problems/<slug>/
  problem.json      # metadata, statement (markdown), tags, difficulty, xp, timeLimitMs, fnName
  starter.js | starter.ts | starter.py
  solution.js | solution.py          # reference solutions (used by CI validation)
  tests.json        # visible + hidden tests; hidden flag per test
  hints.md          # 3 progressive hints
  editorial.md      # explanation + complexity, unlocked after solving
```

Example themed problems (add more in this spirit; write the real statements yourself):
- **Rizz Calculator** (Easy): sum/frequency basics on a messy array.
- **Left on Read** (Easy): find the first message that never got a reply in a log array.
- **Touch Grass Streak** (Easy): longest consecutive-days run.
- **Group Chat Chaos** (Easy): valid brackets/emoji nesting with a stack.
- **Doomscroll Detector** (Medium): sliding window, longest stretch without a repeat.
- **The Ratio** (Medium): compare ratios, binary search on the answer.
- **Main Character Energy** (Medium): top-K frequent items with a heap or bucket sort.
- **Situationship Graph** (Medium): connected components / BFS.
- **Delulu Scheduler** (Medium): interval merging.
- **Speedrun Any%** (Hard): shortest path on a grid with walls.
- **Final Boss: The Algorithm** (Hard): a DP problem (e.g. coin change variant / edit distance).

Include a mix (roughly 10 Easy, 9 Medium, 5 Hard) and tag each with topics. Statements must be clear and precise (constraints, examples, edge cases) even when the theme is silly. Humor goes in the flavor text, never in ambiguity.

**Problem validation script (`npm run validate-problems`)**: for every problem, run the reference solution in JS and Python through the real judge (headless, e.g. via Node worker_threads + Pyodide in Node) and assert **all tests pass**. Also assert: unique slugs, valid schema (use `zod`), at least 3 visible and 3 hidden tests, starter code runs without crashing (it should fail tests, not error). CI must run this.

### 3.3 Frontend (this must look expensive)

Reference quality bar: the polish of LeetCode/Codeforces-style judges, but with a distinct, youthful identity. Not a Bootstrap-looking page.

**Visual identity**
- Dark mode default, plus a light mode and 2-3 fun themes (e.g. `Midnight`, `Gamer Neon`, `Touch Grass` (greens), `Sunset Doomscroll`). Theme picker also themes Monaco.
- Bold typography: a chunky display font for headings (e.g. Space Grotesk / Bricolage Grotesque) and JetBrains Mono for code. Self-host fonts via `@fontsource` (no external requests).
- Original mascot: a small blob/goblin-style creature drawn in SVG ("Bugsy" or pick a better name) with expressions that react to verdicts: idle, thinking (while running), celebrating, facepalm, sleepy (TLE). Keep it simple and charming.
- Micro-interactions everywhere: test cases flip/light up one by one, run button has a satisfying press, XP bar fills with a bounce, confetti on Accepted (respect `prefers-reduced-motion`).

**Layout**
- **Landing page (`/`):** punchy hero with the tagline, a live "try it now" mini editor with a pre-loaded easy problem (so a recruiter can run code without clicking anywhere), 3 feature blurbs, the daily challenge card, and a "Start cooking" CTA. Include a tasteful footer with GitHub link.
- **Problem list (`/problems`):** filter by difficulty/tag/solved status, search, progress rings, and a "Surprise me" random button.
- **Problem page (`/problem/:slug`):** resizable split layout. Left tabs: Statement | Hints | Editorial (locked until solved) | My Submissions. Right: Monaco editor with language switcher (JS/TS/Python), Run/Submit buttons, a collapsible console/results panel, and a timer. Remember the user's code per problem+language.
- **Profile (`/profile`):** handle, level, XP, streak calendar (heatmap), solved stats by difficulty, achievements, export/import progress, reset.
- **Daily Challenge (`/daily`):** one problem per day, chosen deterministically from the date (no server needed). Streak bonus.
- **Boss Fight (`/boss`):** a timed mode. Solve 3 escalating problems against a countdown with a boss health bar that drops with each solve; funny taunts from the boss at start/fail/win.

**Gamification (all local)**
- XP per solved problem (scaled by difficulty); hints cost XP; first-try bonus; speed bonus.
- Levels with funny titles: `NPC` → `Side Character` → `Plot Armor` → `Main Character` → `Final Boss` → `Certified Menace`.
- Streaks (with a friendly "streak freeze" token earned every 7 days).
- 20+ achievements, e.g. `First Blood`, `Touch Grass` (solve something at a sensible hour), `Night Owl` (solve after 2 AM local), `It Compiles?!`, `Speedrunner`, `No Hints Gang`, `Polyglot` (solve in all 3 languages), `Comeback Kid` (solve after 5 failed attempts).
- Shareable **result card:** on Accepted, a "Share" button generates a PNG (via canvas/SVG to canvas) with problem name, runtime, handle, level and a funny verdict. Provide Download PNG and Copy link (the link just opens the problem).
- Optional **sound effects**, **off by default**, toggle in the navbar. Generate tiny sounds with the Web Audio API (no audio files, no copyright risk).

**UX details**
- Command palette (`Ctrl/Cmd+K`): jump to problem, switch theme, switch tone, toggle sound.
- Keyboard shortcuts: `Ctrl/Cmd+Enter` Run, `Ctrl/Cmd+Shift+Enter` Submit.
- Friendly empty/loading/error states with personality (e.g. Pyodide loading: "Waking up the snake... 🐍").
- Easter eggs: Konami code toggles a retro theme; running an empty function gets a special roast; try 5 TLEs in a row for a funny "are you okay?" message.
- Accessibility: semantic HTML, focus states, ARIA labels on custom controls, color contrast AA, reduced-motion support, full keyboard navigation. Run an axe check in the Playwright smoke test.
- SEO/social: proper `<title>`, meta description, Open Graph image (static, original), favicon, `manifest.webmanifest`.

### 3.4 Privacy & analytics
No tracking, no cookies, no third-party scripts. State this in the About page. Everything stays on the user's device.

---

## 4. Suggested repo structure

```
skill-issue/
  PROJECT_SPEC.md
  README.md  LICENSE  CONTRIBUTING.md
  problems/                # problem folders (see 3.2)
  scripts/
    validate-problems.ts
    build-problem-index.ts  # compiles problems/ into a typed JSON index at build time
  src/
    app/                   # routes, layout, providers
    components/            # UI primitives (Button, Card, Tabs, Modal, Toast...)
    features/
      judge/               # runner, workers, verdict engine, comparison
      editor/              # Monaco wrapper, language switching, themes
      problems/            # list, detail, filters
      gamification/        # xp, levels, streaks, achievements, boss mode
      share/               # result card generator
      mascot/              # SVG mascot + expressions
      copy/                # verdict message pools per tone (easy to extend)
    store/                 # zustand slices
    lib/                   # utils, date/daily-seed, rng
  tests/e2e/
  .github/workflows/ci.yml
```

---

## 5. Build phases (commit after each; keep `main` always runnable)

**Phase 1: Foundation.** Scaffold Vite+React+TS+Tailwind, lint/format/Husky, routing shell, theme system with CSS variables, base UI primitives, layout/navbar/footer. Commit.

**Phase 2: The judge.** Build the `Judge` interface, JS worker with timeout/kill/respawn, TS transpile path, comparison utilities, verdict engine with unit tests (infinite loop, thrown error, wrong answer, float tolerance, huge output, `console.log` capture). Add a bare-bones test page to prove it works. Commit.

**Phase 3: Python.** Pyodide worker, lazy loading with progress, shared harness semantics with JS, TLE restart, error line mapping. Parity unit tests: the same problem must yield the same verdicts in JS and Python. Commit.

**Phase 4: Problem system.** zod schemas, problem folder format, build-time index script, **`validate-problems` script + CI step**, then author the first 8 problems (all with hints and editorials). Commit.

**Phase 5: Problem UI.** Problem list, problem page with resizable panels, Monaco integration (themes, per-problem code persistence, language switcher), results panel with animated per-test reveal, Run vs Submit. Commit.

**Phase 6: Personality.** Verdict copy pools for the 3 tones, mascot SVG + reactions, confetti, optional Web Audio sounds, loading/empty states, Easter eggs. Commit.

**Phase 7: Gamification.** XP, levels, streaks, achievements, profile page with heatmap, export/import progress, daily challenge. Commit.

**Phase 8: Boss Fight + sharing.** Boss mode, result-card PNG generator, command palette, shortcuts. Commit.

**Phase 9: Landing page + polish.** Hero with live mini editor, feature section, About/privacy page, OG image, favicon, manifest, responsive/mobile pass, accessibility pass (axe), performance pass (Lighthouse >= 90 on Performance/Accessibility/Best Practices). Commit.

**Phase 10: Content + launch.** Finish all 24+ problems, README with screenshots/GIF, CONTRIBUTING ("add a problem in 5 minutes"), deploy config (Cloudflare Pages or Vercel), live URL in README, MIT license. Commit and tag `v1.0.0`.

**Stretch (only after v1.0.0 and only if I ask):** a global anonymous leaderboard using a free-tier edge function + KV/D1 (no accounts, signed handle tokens, rate limited); more languages via additional WASM runtimes; community problem submissions via pull requests.

---

## 6. Definition of done

- [ ] Fresh clone: `npm install && npm run dev` works with zero configuration.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run validate-problems`, `npm run build` all pass; CI is green.
- [ ] 24+ problems, all reference solutions pass in JS and Python via the real judge.
- [ ] An infinite loop in any language produces a TLE verdict, and the page stays responsive afterwards.
- [ ] A recruiter can land on the homepage, run code in the mini editor, and see a verdict in under 15 seconds without any sign-up.
- [ ] Works on mobile Safari/Chrome and desktop Chrome/Firefox/Safari.
- [ ] No network requests to third parties at runtime (verify in the Network tab; self-host fonts, bundle Pyodide or load it from a pinned CDN URL and document it).
- [ ] README has screenshots, architecture overview, a "how the sandbox works (and its limits)" section, and a "add a problem" guide.

## 7. Working rules for Claude Code

1. Work phase by phase. Before each phase, state a 5-bullet plan; after it, run lint/typecheck/tests and fix failures before committing.
2. Write tests alongside the judge and gamification logic (they are the riskiest parts). Don't test pure styling.
3. Never leave `TODO` stubs in committed code; if something is deferred, add it to a `ROADMAP.md`.
4. Keep copy (jokes, verdicts, taunts) in `src/features/copy/` data files, not scattered in components, so it's easy to add more. Keep jokes friendly and inclusive: no slurs, no body-shaming, no mocking the user's intelligence, and no references to real people or brands.
5. Prefer small, typed, well-named modules. No giant components; split anything over ~250 lines.
6. If a decision is ambiguous, choose the simplest option that keeps the app static, free, and login-free, and note it in `DECISIONS.md`.

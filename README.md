# Skill Issue

> Un-cook yourself. One problem at a time.

A login-free, fully static code judge that runs entirely in your browser. See `PROJECT_SPEC.md` for the full plan.

## Run locally

```sh
npm install
npm run dev
```

Scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

The judge lives in `src/features/judge`. Try it at `/judge-lab` while `npm run dev` is running.

## License

MIT

## Python runtime

Python runs via [Pyodide](https://pyodide.org) (self-hosted, about 12 MB, downloaded once on first Python run and then cached). `npm run dev` and `npm run build` copy it into `public/` automatically. Infinite loops are stopped by restarting the worker, so the first run after a time-out may be a little slower.

## Problems

Problems live in [`problems/`](problems/README.md). `npm run validate-problems` checks every problem's schema, runs each reference solution in JavaScript, TypeScript and Python through the real judge, and makes sure the starters fail cleanly. CI runs it on every push.

## Editor

The code editor is [Monaco](https://microsoft.github.io/monaco-editor/), bundled and served from your own origin (nothing loads from a CDN). It is lazy-loaded, so only problem pages download it. Drafts are saved in your browser per problem and language.

## Progress, XP and streaks

Everything is local. Solve problems to earn XP, level up (NPC to Certified Menace), keep a daily streak (a freeze token every 7 days), and unlock 25 achievements. `/profile` has your heatmap and stats, plus export/import so you can back up or move your progress. `/daily` serves one deterministic problem per day.

## Boss Fight, sharing and the command palette

- `/boss`: beat three escalating problems in 30 minutes to defeat Sir Spaghetti Code (+150 XP).
- After an accepted Submit, **Share result** makes a PNG card on your device (download it or copy the problem link).
- Press **Ctrl/Cmd+K** anywhere (even in the editor) to jump to a problem, switch theme or tone, or toggle sound.

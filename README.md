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

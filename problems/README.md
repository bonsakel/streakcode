# Problems

Each folder is one problem. Add a folder, run `npm run validate-problems`, and it ships.

```
problems/<slug>/
  problem.json    slug (must equal the folder name), title, difficulty, xp, tags, timeLimitMs,
                  fnName, flavor, statement (markdown), optional epsilon
  starter.js      starter code per language; must fail the tests without crashing
  starter.ts
  starter.py
  solution.js     reference solutions; never shipped to the browser, used by CI
  solution.py
  tests.json      [{ "input": [args...], "expected": value, "hidden": bool }], >= 3 visible, >= 3 hidden
  hints.md        exactly 3 hints, separated by a line containing only ---
  editorial.md    explanation and complexity, unlocked after solving
  checker.js      optional, with checker.py: `checker(input, got, expected)` for any-valid-answer problems
```

Rules of thumb:

- The same function name (`fnName`) is used in every language, so Python solutions use camelCase too.
- Inputs and outputs are plain JSON. Python tuples read as lists and `None` as `null`.
- Humor goes in `flavor` and the story. The statement itself must be precise: constraints, examples and edge cases.
- Statement examples should also appear as visible tests.

## Generating test data

`scripts/author/generate-tests.py <problems dir>` regenerates `tests.json` for the first eight problems
using deliberately naive brute-force solvers, so the reference solutions are checked against an
independent implementation. Use it as a template for new problems.
